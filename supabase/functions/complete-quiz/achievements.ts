import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export async function evaluateAchievements(
    supabase: SupabaseClient,
    userId: string,
    context: {
        lessonId: string;
        subModuleId: string;
        moduleId: string;
        lessonType: string;
        score: number;
        passed: boolean;
        subModuleCompleted: boolean;
        moduleCompleted: boolean;
    }
) {
    const earnedAchievements: any[] = [];
    const xpEntries: { amount: number; reason: 'ACHIEVEMENT' }[] = [];

    try {
        // 1. Everything we need to read is independent, so fetch it in one round
        const [achRes, userAchRes, historyRes, quizRes] = await Promise.all([
            supabase.from('achievements').select('*'),
            supabase.from('user_achievements').select('*').eq('user_id', userId),
            supabase
                .from('user_quizzes')
                .select('score, completed_at, quiz_id')
                .eq('user_id', userId)
                .eq('completed', true)
                .order('completed_at', { ascending: false })
                .limit(20),
            supabase.from('quizzes').select('id').eq('lesson_id', context.lessonId).maybeSingle(),
        ]);

        if (achRes.error) throw achRes.error;
        if (userAchRes.error) throw userAchRes.error;

        const allAchievements = achRes.data || [];
        const userAchievements = userAchRes.data || [];
        const history = historyRes.data || [];
        const quizData = quizRes.data;

        const existingAchIds = new Set(userAchievements.map(ua => ua.achievement_id));
        const missingAchievements = allAchievements.filter(a => !existingAchIds.has(a.id));
        const initialRecords = missingAchievements.map(a => ({
            user_id: userId,
            achievement_id: a.id,
            progress: 0,
            completed: false,
            viewed: false
        }));

        // 2. Initialize missing rows and count retries (needs the quiz id) in parallel
        const [initRes, retriesRes] = await Promise.all([
            initialRecords.length > 0
                ? supabase.from('user_achievements').insert(initialRecords)
                : Promise.resolve({ error: null }),
            quizData
                ? supabase
                    .from('user_quizzes')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('quiz_id', quizData.id)
                    .not('completed_at', 'is', null)
                : Promise.resolve({ count: 0 }),
        ]);

        if (initRes.error) {
            console.error('Error initializing achievements:', initRes.error);
        } else {
            userAchievements.push(...initialRecords);
        }

        const stateMap = new Map(userAchievements.map(ua => [ua.achievement_id, ua]));
        const achByIdentification = new Map(allAchievements.map(a => [a.identification, a]));

        // 3. Rules only decide what to change; writes are queued and flushed in parallel
        const pending: { ach: any; updates: any }[] = [];

        const updateAchievement = (identification: string, updates: any) => {
            const ach = achByIdentification.get(identification);
            if (!ach) return;

            const currentState = stateMap.get(ach.id);
            if (!currentState || currentState.completed) return;

            const hasChanges = Object.keys(updates).some(key => updates[key] !== currentState[key]);
            if (!hasChanges) return;

            if (updates.completed) updates.completed_at = new Date().toISOString();
            pending.push({ ach, updates });
            Object.assign(currentState, updates);
        };

        // 3.1 Module Completion
        if (context.moduleCompleted && context.moduleId) {
            const moduleAch = allAchievements.find(a => a.module_id === context.moduleId);
            if (moduleAch) updateAchievement(moduleAch.identification, { completed: true });
        }

        // 3.2 Perfection Achievements (COMBO_INSANO, SERIE_PERFEITA)
        if (context.lessonType !== 'CHALLENGE') {
            const perfectionThresholds: Record<string, number> = {
                'SERIE_PERFEITA': 5,
                'COMBO_INSANO': 10
            };

            for (const [ident, threshold] of Object.entries(perfectionThresholds)) {
                const ach = achByIdentification.get(ident);
                if (!ach) continue;
                const state = stateMap.get(ach.id);
                if (!state || state.completed) continue;

                if (context.score === 10) {
                    const newProgress = (state.progress || 0) + 1;
                    updateAchievement(ident, {
                        progress: newProgress,
                        completed: newProgress >= threshold
                    });
                } else {
                    updateAchievement(ident, { progress: 0 });
                }
            }
        }

        // 3.3 Streak Achievements (IMPARAVEL, MARATONISTA_DO_CODIGO)
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        const streakThresholds: Record<string, number> = {
            'MARATONISTA_DO_CODIGO': 5,
            'IMPARAVEL': 10
        };

        for (const [ident, threshold] of Object.entries(streakThresholds)) {
            const ach = achByIdentification.get(ident);
            if (!ach) continue;
            const state = stateMap.get(ach.id);
            if (!state || state.completed) continue;

            // Only process once per day
            if (state.last_value === todayStr) continue;

            if (state.last_value === yesterdayStr) {
                const newProgress = (state.progress || 0) + 1;
                updateAchievement(ident, {
                    progress: newProgress,
                    completed: newProgress >= threshold,
                    last_value: todayStr
                });
            } else {
                // Streak broken or just starting
                updateAchievement(ident, { progress: 1, last_value: todayStr });
            }
        }

        // 3.4 Improvement (PERFECCIONISTA_DO_CODIGO): lesson redone, so more than one finished attempt (passed or not)
        if (retriesRes.count && retriesRes.count > 1) {
            updateAchievement('PERFECCIONISTA_DO_CODIGO', { completed: true });
        }

        // 3.5 Other Milestones (One-time)
        if (history.length === 1) updateAchievement('PRIMEIRO_PASSO_NO_CODIGO', { completed: true });
        if (context.lessonType === 'CHALLENGE') updateAchievement('MEU_PRIMEIRO_DESAFIO', { completed: true });
        if (context.lessonType === 'REVISION') updateAchievement('MINHA_PRIMEIRA_REVISAO', { completed: true });

        // Daily Volume (MODO_FOGUETE)
        const quizzesToday = history.filter(q => q.completed_at.startsWith(todayStr));
        if (quizzesToday.length >= 10) updateAchievement('MODO_FOGUETE', { completed: true });

        // 4. Flush all writes at once
        const results = await Promise.all(
            pending.map(({ ach, updates }) =>
                supabase
                    .from('user_achievements')
                    .update(updates)
                    .match({ user_id: userId, achievement_id: ach.id })
            )
        );

        pending.forEach(({ ach, updates }, i) => {
            const { error } = results[i];
            if (error) {
                console.error(`Error updating achievement ${ach.identification}:`, error);
                return;
            }
            if (updates.completed) {
                if (ach.xp_amount > 0) xpEntries.push({ amount: ach.xp_amount, reason: 'ACHIEVEMENT' });
                earnedAchievements.push(ach);
            }
        });

        return { xpEntries, earnedAchievements };
    } catch (error) {
        console.error('Error evaluating achievements:', error);
        return { xpEntries: [], earnedAchievements: [] };
    }
}

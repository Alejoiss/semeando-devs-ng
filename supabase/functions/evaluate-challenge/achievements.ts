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
    let totalXpAwarded = 0;
    const earnedAchievements: any[] = [];

    try {
        // 1. Fetch all achievements
        const { data: allAchievements, error: achError } = await supabase
            .from('achievements')
            .select('*');

        if (achError) throw achError;

        // 2. Fetch user's achievements state
        const { data: userAchievements, error: userAchError } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', userId);

        if (userAchError) throw userAchError;

        // 3. Initialize missing achievements
        const existingAchIds = new Set((userAchievements || []).map(ua => ua.achievement_id));
        const missingAchievements = allAchievements.filter(a => !existingAchIds.has(a.id));

        if (missingAchievements.length > 0) {
            const initialRecords = missingAchievements.map(a => ({
                user_id: userId,
                achievement_id: a.id,
                progress: 0,
                completed: false,
                viewed: false
            }));

            const { error: initError } = await supabase
                .from('user_achievements')
                .insert(initialRecords);

            if (initError) {
                console.error('Error initializing achievements:', initError);
            } else {
                // Add to local state for processing
                userAchievements?.push(...initialRecords);
            }
        }

        const stateMap = new Map((userAchievements || []).map(ua => [ua.achievement_id, ua]));

        // 4. Helper to update/grant achievement
        const updateAchievement = async (identification: string, updates: any) => {
            const ach = allAchievements.find(a => a.identification === identification);
            if (!ach) return;

            const currentState = stateMap.get(ach.id);
            if (!currentState || currentState.completed) return;

            // Only update if there are changes
            const hasChanges = Object.keys(updates).some(key => updates[key] !== currentState[key]);
            if (!hasChanges) return;

            const { error: updateError } = await supabase
                .from('user_achievements')
                .update(updates)
                .match({ user_id: userId, achievement_id: ach.id });

            if (updateError) {
                console.error(`Error updating achievement ${identification}:`, updateError);
                return;
            }

            // If newly completed, award XP
            if (updates.completed) {
                if (ach.xp_amount > 0) {
                    await awardAchievementXp(supabase, userId, ach.xp_amount);
                    totalXpAwarded += ach.xp_amount;
                }
                earnedAchievements.push(ach);
            }
            
            // Update local state
            Object.assign(currentState, updates);
        };

        // --- 5. Evaluate Rules ---
        
        // 5.1 Module Completion
        if (context.moduleCompleted && context.moduleId) {
            const moduleAch = allAchievements.find(a => a.module_id === context.moduleId);
            if (moduleAch) await updateAchievement(moduleAch.identification, { completed: true });
        }

        // Fetch recent quiz history for some checks
        const { data: recentQuizzes } = await supabase
            .from('user_quizzes')
            .select('score, completed_at, quiz_id')
            .eq('user_id', userId)
            .eq('completed', true)
            .order('completed_at', { ascending: false })
            .limit(20);

        const history = recentQuizzes || [];

        // 5.2 Perfection Achievements (COMBO_INSANO, SERIE_PERFEITA)
        if (context.lessonType !== 'CHALLENGE') {
            const perfectionThresholds: Record<string, number> = {
                'SERIE_PERFEITA': 5,
                'COMBO_INSANO': 10
            };

            for (const [ident, threshold] of Object.entries(perfectionThresholds)) {
                const ach = allAchievements.find(a => a.identification === ident);
                if (!ach) continue;
                const state = stateMap.get(ach.id);
                if (!state || state.completed) continue;

                if (context.score === 10) {
                    const newProgress = (state.progress || 0) + 1;
                    await updateAchievement(ident, { 
                        progress: newProgress, 
                        completed: newProgress >= threshold 
                    });
                } else {
                    await updateAchievement(ident, { progress: 0 });
                }
            }
        }

        // 5.3 Streak Achievements (IMPARAVEL, MARATONISTA_DO_CODIGO)
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
        
        const streakThresholds: Record<string, number> = {
            'MARATONISTA_DO_CODIGO': 5,
            'IMPARAVEL': 10
        };

        for (const [ident, threshold] of Object.entries(streakThresholds)) {
            const ach = allAchievements.find(a => a.identification === ident);
            if (!ach) continue;
            const state = stateMap.get(ach.id);
            if (!state || state.completed) continue;

            // Only process once per day
            if (state.last_value === todayStr) continue;

            if (state.last_value === yesterdayStr) {
                const newProgress = (state.progress || 0) + 1;
                await updateAchievement(ident, { 
                    progress: newProgress, 
                    completed: newProgress >= threshold,
                    last_value: todayStr
                });
            } else {
                // Streak broken or just starting
                await updateAchievement(ident, { 
                    progress: 1, 
                    last_value: todayStr 
                });
            }
        }

        // 5.4 Improvement (PERFECCIONISTA_DO_CODIGO)
        // Requirement: Refazer uma lição para melhorar a nota. 
        // Logic: Verificar se o usuário já refez uma lição. Neste caso, haverá mais de um registro na tabela user_quizzes com o mesmo id de conteúdo.
        const { data: quizData } = await supabase.from('quizzes').select('id').eq('lesson_id', context.lessonId).single();
        if (quizData) {
            const { count } = await supabase
                .from('user_quizzes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('quiz_id', quizData.id)
                .eq('completed', true);
            
            if (count && count > 1) {
                await updateAchievement('PERFECCIONISTA_DO_CODIGO', { completed: true });
            }
        }

        // 5.5 Other Milestones (One-time)
        if (history.length === 1) await updateAchievement('PRIMEIRO_PASSO_NO_CODIGO', { completed: true });
        if (context.lessonType === 'CHALLENGE') await updateAchievement('MEU_PRIMEIRO_DESAFIO', { completed: true });
        if (context.lessonType === 'REVISION') await updateAchievement('MINHA_PRIMEIRA_REVISAO', { completed: true });
        
        // Daily Volume (MODO_FOGUETE)
        const quizzesToday = history.filter(q => q.completed_at.startsWith(todayStr));
        if (quizzesToday.length >= 10) await updateAchievement('MODO_FOGUETE', { completed: true });

        return { totalXpAwarded, earnedAchievements };
    } catch (error) {
        console.error('Error evaluating achievements:', error);
        return { totalXpAwarded: 0, earnedAchievements: [] };
    }
}

async function awardAchievementXp(supabase: SupabaseClient, userId: string, amount: number) {
    const now = new Date();
    
    // 1. xp_log
    await supabase.from('xp_log').insert({
        user_id: userId,
        amount: amount,
        reason: 'ACHIEVEMENT'
    });

    // 2. total_xp
    const { data: existingXp } = await supabase
        .from('xp')
        .select('id, total_xp')
        .eq('user_id', userId)
        .single();

    if (existingXp) {
        await supabase.from('xp').update({ 
            total_xp: existingXp.total_xp + amount,
            updated_at: now.toISOString()
        }).eq('id', existingXp.id);
    } else {
        await supabase.from('xp').insert({ user_id: userId, total_xp: amount });
    }

    // 3. xp_week
    const week = getWeekNumber(now);
    const year = now.getFullYear();

    const { data: existingWeekXp } = await supabase
        .from('xp_week')
        .select('id, xp_amount')
        .eq('user_id', userId)
        .eq('week', week)
        .eq('year', year)
        .single();

    if (existingWeekXp) {
        await supabase.from('xp_week').update({ 
            xp_amount: existingWeekXp.xp_amount + amount,
            updated_at: now.toISOString()
        }).eq('id', existingWeekXp.id);
    } else {
        await supabase.from('xp_week').insert({ user_id: userId, week, year, xp_amount: amount });
    }

    // 4. xp_month
    const month = now.getMonth() + 1;

    const { data: existingMonthXp } = await supabase
        .from('xp_month')
        .select('id, xp_amount')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year)
        .single();

    if (existingMonthXp) {
        await supabase.from('xp_month').update({ 
            xp_amount: existingMonthXp.xp_amount + amount,
            updated_at: now.toISOString()
        }).eq('id', existingMonthXp.id);
    } else {
        await supabase.from('xp_month').insert({ user_id: userId, month, year, xp_amount: amount });
    }
}

function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

function getUniqueDates(quizzes: any[]) {
    const dates = quizzes.map(q => q.completed_at.split('T')[0]);
    return [...new Set(dates)].sort();
}

function isConsecutive(dates: string[]) {
    for (let i = 0; i < dates.length - 1; i++) {
        const d1 = new Date(dates[i]);
        const d2 = new Date(dates[i + 1]);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays !== 1) return false;
    }
    return true;
}

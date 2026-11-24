import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { Course } from '../../models/course/course';
import { Track, TrackPayload, TrackSummary, TrackWithCourses } from '../../models/track/track';
import { SupabaseService } from './supabase';

const TRACK_SELECT = `
    id, slug, title, description, icon, order, published,
    track_courses ( position, course:modules ( id, title, description, slug, avatar, icon, in_revision ) )
`;

@Injectable({
    providedIn: 'root',
})
export class TrackService {
    private readonly supabase: SupabaseClient = inject(SupabaseService).client;

    async getPublishedTracks(): Promise<TrackWithCourses[]> {
        const { data, error } = await this.supabase
            .from('tracks')
            .select(TRACK_SELECT)
            .eq('published', true)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map(toTrackWithCourses);
    }

    async getTrackBySlug(slug: string): Promise<TrackWithCourses | null> {
        const { data, error } = await this.supabase
            .from('tracks')
            .select(TRACK_SELECT)
            .eq('slug', slug)
            .eq('published', true)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        return data ? toTrackWithCourses(data) : null;
    }

    async getTracksForCourse(courseId: string): Promise<TrackSummary[]> {
        const { data, error } = await this.supabase
            .from('track_courses')
            .select('track:tracks!inner ( id, slug, title, order, published )')
            .eq('module_id', courseId)
            .eq('tracks.published', true);

        if (error) {
            throw new Error(error.message);
        }

        return ((data ?? []) as unknown as { track: TrackSummary & { order: number } }[])
            .map(row => row.track)
            .sort((a, b) => a.order - b.order)
            .map(({ id, slug, title }) => ({ id, slug, title }));
    }

    async getAllTracks(): Promise<TrackWithCourses[]> {
        const { data, error } = await this.supabase
            .from('tracks')
            .select(TRACK_SELECT)
            .order('order', { ascending: true });

        if (error) {
            throw new Error(error.message);
        }

        return (data ?? []).map(toTrackWithCourses);
    }

    async createTrack(payload: TrackPayload, order: number): Promise<string> {
        const { data, error } = await this.supabase.from('tracks').insert({ ...payload, order }).select('id').single();

        if (error) {
            throw new Error(error.message);
        }

        return data.id as string;
    }

    async updateTrack(id: string, payload: Partial<TrackPayload>): Promise<void> {
        const { error } = await this.supabase.from('tracks').update(payload).eq('id', id);

        if (error) {
            throw new Error(error.message);
        }
    }

    async deleteTrack(id: string): Promise<void> {
        const { error } = await this.supabase.from('tracks').delete().eq('id', id);

        if (error) {
            throw new Error(error.message);
        }
    }

    async setTrackCourses(trackId: string, courseIds: string[]): Promise<void> {
        const { error: deleteError } = await this.supabase.from('track_courses').delete().eq('track_id', trackId);

        if (deleteError) {
            throw new Error(deleteError.message);
        }

        if (courseIds.length === 0) {
            return;
        }

        const { error } = await this.supabase
            .from('track_courses')
            .insert(courseIds.map((moduleId, index) => ({ track_id: trackId, module_id: moduleId, position: index + 1 })));

        if (error) {
            throw new Error(error.message);
        }
    }
}

interface TrackRow extends Track {
    track_courses: { position: number; course: (Omit<Course, 'inRevision'> & { in_revision: boolean }) | null }[] | null;
}

function toTrackWithCourses(row: unknown): TrackWithCourses {
    const { track_courses, ...track } = row as TrackRow;
    const courses = [...(track_courses ?? [])]
        .sort((a, b) => a.position - b.position)
        .flatMap(({ course }): Course[] => (course ? [{ ...course, inRevision: course.in_revision }] : []));

    return { ...track, courses };
}

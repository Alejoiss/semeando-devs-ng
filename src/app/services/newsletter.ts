import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase';
import { UserNewsletter } from '../../models/user-newsletter/user-newsletter';
import { Newsletter } from '../../models/newsletter/newsletter';

export type UnviewedNewsletterResult = UserNewsletter & { newsletter: Newsletter };

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private readonly supabase = inject(SupabaseService);

  async fetchUnviewedNewsletter(): Promise<UnviewedNewsletterResult | null> {
    const { data, error } = await this.supabase.client
      .from('user_newsletter')
      .select('*, newsletter(*)')
      .eq('viewed', false)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching unviewed newsletter', error);
      return null;
    }

    return data as UnviewedNewsletterResult | null;
  }

  async markAsViewed(newsletter_id: string): Promise<boolean> {
    const { error } = await this.supabase.client
      .from('user_newsletter')
      .update({ viewed: true })
      .eq('newsletter_id', newsletter_id);

    if (error) {
      console.error('Error marking newsletter as viewed', error);
      return false;
    }

    return true;
  }
}

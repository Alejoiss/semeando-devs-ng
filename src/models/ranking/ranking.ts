export interface RankingEntry {
    position: number;
    userId: string;
    name: string | null;
    avatar: string | null;
    xp: number;
    is_pro: boolean;
}

export interface CurrentUserRanking {
    position: number | null;
    xp: number;
}

export interface RankingResult {
    ranking: RankingEntry[];
    currentUser: CurrentUserRanking;
}

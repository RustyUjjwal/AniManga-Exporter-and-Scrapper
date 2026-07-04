export interface RawAnimeItem {
  status: number; // 1: Watching, 2: Completed, 3: On Hold, 4: Dropped, 6: Plan to Watch
  score: number; // 0-10
  num_watched_episodes: number;
  anime_title: string;
  anime_title_eng: string;
  anime_num_episodes: number;
  anime_airing_status: number; // 1: Airing, 2: Finished, 3: Not Yet Aired
  anime_id: number;
  anilist_id?: number;
  anime_image_path: string;
  anime_media_type_string: string; // "TV", "Movie", "OVA", "Special", etc.
  is_rewatching: number;
  start_date_string: string | null;
  finish_date_string: string | null;
  days_string?: string;
}

export interface RawMangaItem {
  status: number; // 1: Reading, 2: Completed, 3: On Hold, 4: Dropped, 6: Plan to Read
  score: number; // 0-10
  num_read_volumes: number;
  num_read_chapters: number;
  manga_title: string;
  manga_title_eng: string;
  manga_num_volumes: number;
  manga_num_chapters: number;
  manga_publishing_status: number; // 1: Publishing, 2: Finished, etc.
  manga_id: number;
  anilist_id?: number;
  manga_image_path: string;
  manga_media_type_string: string; // "Manga", "Novel", "One-shot", etc.
  start_date_string: string | null;
  finish_date_string: string | null;
}

export interface UserProfile {
  username: string;
  url: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  joined: string | null;
  last_online: string;
  statistics?: {
    anime?: {
      days_watched: number;
      mean_score: number;
      watching: number;
      completed: number;
      on_hold: number;
      dropped: number;
      plan_to_watch: number;
      total_entries: number;
      episodes_watched: number;
    };
    manga?: {
      days_read: number;
      mean_score: number;
      reading: number;
      completed: number;
      on_hold: number;
      dropped: number;
      plan_to_read: number;
      total_entries: number;
      chapters_read: number;
      volumes_read: number;
    };
  } | null;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

export type ListType = "anime" | "manga";

export interface ListStats {
  total: number;
  meanScore: number;
  completedCount: number;
  inProgressCount: number; // Watching/Reading
  onHoldCount: number;
  droppedCount: number;
  plannedCount: number; // Plan to Watch/Read
  totalUnits: number; // Episodes / Chapters
  mediaTypeCounts: Record<string, number>;
  unitsByFormat: Record<string, number>;
  scoreCounts: Record<number, number>;
}

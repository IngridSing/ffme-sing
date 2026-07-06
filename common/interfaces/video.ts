export type VideoPlatform = 'youtube' | 'vimeo' | 'other';

export interface Video {
    _id: string;
    title: string;
    description: string;
    videoUrl: string;       // URL originale (ex: https://youtube.com/watch?v=xxx)
    embedUrl: string;       // URL pour iframe (ex: https://youtube.com/embed/xxx)
    thumbnailUrl: string;   // URL de la miniature auto-extraite
    platform: VideoPlatform;
    date: string;           // ISO date string
    isActive: boolean;      // Pour masquer sans supprimer
}

export interface CreateVideoDto {
    title: string;
    description: string;
    videoUrl: string;
    date: string;
}

export interface UpdateVideoDto {
    title?: string;
    description?: string;
    videoUrl?: string;
    date?: string;
    isActive?: boolean;
}

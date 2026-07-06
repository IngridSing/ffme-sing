export interface GalleryEventSummary {
    eventName: string;
    count: number;
}

export interface GalleryMeta {
    total: number;
    events: GalleryEventSummary[];
}

export interface News {
    _id: string;
    date: string; // ISO date string
    title: string;
    description: string;
    image: string;
    externalLink?: string; // Lien vers un article externe (optionnel)
}

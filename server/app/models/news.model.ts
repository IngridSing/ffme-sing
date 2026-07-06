import { News } from '@common/interfaces/news';
import { Schema, model } from 'mongoose';

const NewsSchema = new Schema<News>({
    image: { type: String, required: true },
    date: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    externalLink: { type: String, required: false },
});

NewsSchema.index({ date: -1 });
NewsSchema.index({ title: 'text', description: 'text' });

export const NewsModel = model<News>('News', NewsSchema);

import { Video } from '@common/interfaces/video';
import { Schema, model } from 'mongoose';

const VideoSchema = new Schema<Video>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    embedUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    platform: { type: String, enum: ['youtube', 'vimeo', 'other'], required: true },
    date: { type: String, required: true },
    isActive: { type: Boolean, default: true },
});

VideoSchema.index({ date: -1 });
VideoSchema.index({ isActive: 1 });
VideoSchema.index({ title: 'text', description: 'text' });

export const VideoModel = model<Video>('Video', VideoSchema);

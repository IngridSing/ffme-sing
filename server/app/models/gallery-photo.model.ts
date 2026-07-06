import { GalleryPhoto } from '@common/interfaces/gallery-photo';
import { Schema, model } from 'mongoose';

const GalleryPhotoSchema = new Schema<GalleryPhoto>({
    image: { type: String, required: true },
    date: { type: String, required: true },
    eventName: { type: String, required: true },
    description: { type: String, required: true },
});

GalleryPhotoSchema.index({ eventName: 1 });
GalleryPhotoSchema.index({ date: -1 });

export const GalleryPhotoModel = model<GalleryPhoto>('GalleryPhoto', GalleryPhotoSchema);

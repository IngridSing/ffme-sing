import { GalleryPhotoModel } from '@app/models/gallery-photo.model';
import { ImageCacheService } from '@app/services/cache/image-cache.service';
import { GalleryEventSummary, GalleryMeta } from '@common/interfaces/gallery-meta';
import { GalleryPhoto } from '@common/interfaces/gallery-photo';
import { PaginatedResponse } from '@common/interfaces/paginated-response';
import sharp from 'sharp';
import { Readable } from 'stream';
import { Service } from 'typedi';
import { v4 as uuidv4 } from 'uuid';

interface GalleryFilters {
    eventName?: string;
    search?: string;
}

@Service()
export class GalleryDatabaseFtpService {
    constructor(private readonly imageCache: ImageCacheService) {}

    async getAll(): Promise<GalleryPhoto[]> {
        return GalleryPhotoModel.find().lean();
    }

    async getMeta(): Promise<GalleryMeta> {
        const [total, events] = await Promise.all([
            GalleryPhotoModel.countDocuments(),
            GalleryPhotoModel.aggregate<GalleryEventSummary>([
                { $group: { _id: '$eventName', count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
                { $project: { _id: 0, eventName: '$_id', count: 1 } },
            ]),
        ]);

        return { total, events };
    }

    async getPaginated(page = 1, limit = 6, filters: GalleryFilters = {}): Promise<PaginatedResponse<GalleryPhoto>> {
        const query = this.buildFilter(filters);
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            GalleryPhotoModel.find(query).sort({ date: -1 }).skip(skip).limit(limit).lean(),
            GalleryPhotoModel.countDocuments(query),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }

    private buildFilter(filters: GalleryFilters): Record<string, unknown> {
        const query: Record<string, unknown> = {};

        if (filters.eventName) {
            query.eventName = filters.eventName;
        }

        const search = filters.search?.trim();
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [{ eventName: regex }, { description: regex }];
        }

        return query;
    }

    async getById(id: string): Promise<GalleryPhoto | null> {
        return GalleryPhotoModel.findById(id).lean();
    }

    async getByEvent(eventName: string): Promise<GalleryPhoto[]> {
        return GalleryPhotoModel.find({ eventName }).lean();
    }

    async streamImage(filename: string): Promise<{ stream: Readable; mime: string }> {
        const fullPath = filename.startsWith('galleryImages/') ? filename : `galleryImages/${filename}`;
        return this.imageCache.getImage(fullPath);
    }

    async uploadPhoto(file: Express.Multer.File, eventName: string, description: string): Promise<GalleryPhoto> {
        const uniqueFilename = `galleryImages/${eventName}/${uuidv4()}.webp`;

        const compressedBuffer = await sharp(file.buffer)
            .resize({ width: 1280 })
            .webp({ quality: 70 })
            .toBuffer();

        await this.imageCache.saveImage(uniqueFilename, compressedBuffer);

        return GalleryPhotoModel.create({
            image: uniqueFilename,
            eventName,
            description,
            date: new Date().toISOString(),
        });
    }

    async uploadPhotos(files: Express.Multer.File[], eventName: string, description: string): Promise<GalleryPhoto[]> {
        const photosToInsert: { image: string; eventName: string; description: string; date: string }[] = [];

        for (const file of files) {
            const uniqueFilename = `galleryImages/${eventName}/${uuidv4()}.webp`;

            const compressedBuffer = await sharp(file.buffer)
                .resize({ width: 1280 })
                .webp({ quality: 70 })
                .toBuffer();

            await this.imageCache.saveImage(uniqueFilename, compressedBuffer);

            photosToInsert.push({
                image: uniqueFilename,
                eventName,
                description,
                date: new Date().toISOString(),
            });
        }

        return GalleryPhotoModel.insertMany(photosToInsert);
    }

    async updatePhoto(id: string, eventName: string, description: string): Promise<GalleryPhoto | null> {
        return GalleryPhotoModel.findByIdAndUpdate(id, { eventName, description }, { new: true }).lean();
    }

    async deletePhoto(id: string): Promise<boolean> {
        const photo = await GalleryPhotoModel.findById(id);
        if (!photo) return false;

        try {
            await this.imageCache.removeImage(photo.image);
            await GalleryPhotoModel.deleteOne({ _id: id });
            return true;
        } catch (err) {
            console.error('Erreur suppression image locale :', err);
            return false;
        }
    }

    async deleteEvent(eventName: string): Promise<{ success: boolean; deletedCount: number }> {
        const photos = await GalleryPhotoModel.find({ eventName });
        if (photos.length === 0) {
            return { success: true, deletedCount: 0 };
        }

        let deletedCount = 0;

        try {
            for (const photo of photos) {
                try {
                    await this.imageCache.removeImage(photo.image);
                    deletedCount++;
                } catch (err) {
                    console.error(`Erreur suppression fichier ${photo.image}:`, err);
                }
            }

            await GalleryPhotoModel.deleteMany({ eventName });
            return { success: true, deletedCount };
        } catch (err) {
            console.error('Erreur suppression evenement:', err);
            return { success: false, deletedCount };
        }
    }
}

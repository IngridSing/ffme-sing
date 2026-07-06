import { NewsModel } from '@app/models/news.model';
import { ImageCacheService } from '@app/services/cache/image-cache.service';
import { News } from '@common/interfaces/news';
import { PaginatedResponse } from '@common/interfaces/paginated-response';
import sharp from 'sharp';
import { Readable } from 'stream';
import { Service } from 'typedi';
import { v4 as uuidv4 } from 'uuid';

@Service()
export class NewsDatabaseFtpService {
    constructor(private readonly imageCache: ImageCacheService) {}

    async getAll(): Promise<News[]> {
        return NewsModel.find().sort({ date: -1 }).lean();
    }

    async getPaginated(page = 1, limit = 6): Promise<PaginatedResponse<News>> {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            NewsModel.find().sort({ date: -1 }).skip(skip).limit(limit).lean(),
            NewsModel.countDocuments(),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }

    async getById(id: string): Promise<News | null> {
        return NewsModel.findById(id).lean();
    }

    async streamImage(filename: string): Promise<{ stream: Readable; mime: string }> {
        const fullPath = filename.startsWith('newsImages/') ? filename : `newsImages/${filename}`;
        return this.imageCache.getImage(fullPath);
    }

    async uploadNews(file: Express.Multer.File, title: string, description: string, date: string, externalLink?: string): Promise<News> {
        const uniqueFilename = `newsImages/${uuidv4()}.webp`;

        const compressed = await sharp(file.buffer).resize({ width: 1280 }).webp({ quality: 70 }).toBuffer();
        await this.imageCache.saveImage(uniqueFilename, compressed);

        return NewsModel.create({
            image: uniqueFilename,
            title,
            description,
            date,
            ...(externalLink && { externalLink }),
        });
    }

    async updateNews(id: string, title: string, description: string, date: string, externalLink?: string): Promise<News | null> {
        return NewsModel.findByIdAndUpdate(id, { title, description, date, externalLink: externalLink || null }, { new: true }).lean();
    }

    async deleteNews(id: string): Promise<boolean> {
        const news = await NewsModel.findById(id);
        if (!news) return false;

        try {
            await this.imageCache.removeImage(news.image);
            await NewsModel.deleteOne({ _id: id });
            return true;
        } catch {
            return false;
        }
    }
}

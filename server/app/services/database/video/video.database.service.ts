import { VideoModel } from '@app/models/video.model';
import { CreateVideoDto, UpdateVideoDto, Video, VideoPlatform } from '@common/interfaces/video';
import { Service } from 'typedi';

interface VideoInfo {
    embedUrl: string;
    thumbnailUrl: string;
    platform: VideoPlatform;
}

@Service()
export class VideoDatabaseService {
    async getAll(includeInactive = false): Promise<Video[]> {
        const filter = includeInactive ? {} : { isActive: true };
        return VideoModel.find(filter).sort({ date: -1 }).lean();
    }

    async getById(id: string): Promise<Video | null> {
        return VideoModel.findById(id).lean();
    }

    async create(data: CreateVideoDto): Promise<Video> {
        const videoInfo = this.extractVideoInfo(data.videoUrl);

        return await VideoModel.create({
            title: data.title,
            description: data.description,
            videoUrl: data.videoUrl,
            embedUrl: videoInfo.embedUrl,
            thumbnailUrl: videoInfo.thumbnailUrl,
            platform: videoInfo.platform,
            date: data.date,
            isActive: true,
        });
    }

    async update(id: string, data: UpdateVideoDto): Promise<Video | null> {
        const updateData: Partial<Video> = {};

        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.date !== undefined) updateData.date = data.date;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        if (data.videoUrl !== undefined) {
            const videoInfo = this.extractVideoInfo(data.videoUrl);
            updateData.videoUrl = data.videoUrl;
            updateData.embedUrl = videoInfo.embedUrl;
            updateData.thumbnailUrl = videoInfo.thumbnailUrl;
            updateData.platform = videoInfo.platform;
        }

        return VideoModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    }

    async delete(id: string): Promise<boolean> {
        const result = await VideoModel.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }

    async toggleActive(id: string): Promise<Video | null> {
        const video = await VideoModel.findById(id);
        if (!video) return null;

        video.isActive = !video.isActive;
        await video.save();
        return video.toObject();
    }

    extractVideoInfo(url: string): VideoInfo {
        // YouTube - multiple formats
        const youtubePatterns = [
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]+)/,
        ];

        for (const pattern of youtubePatterns) {
            const match = url.match(pattern);
            if (match) {
                const videoId = match[1];
                return {
                    embedUrl: `https://www.youtube.com/embed/${videoId}`,
                    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                    platform: 'youtube',
                };
            }
        }

        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            const videoId = vimeoMatch[1];
            return {
                embedUrl: `https://player.vimeo.com/video/${videoId}`,
                thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
                platform: 'vimeo',
            };
        }

        // Other platforms - use URL as-is
        return {
            embedUrl: url,
            thumbnailUrl: '',
            platform: 'other',
        };
    }
}

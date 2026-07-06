import { Injectable } from '@angular/core';

interface CachedImage {
    url: string;
    loaded: boolean;
    timestamp: number;
}

@Injectable({
    providedIn: 'root',
})
export class ImageCacheService {
    private cache = new Map<string, CachedImage>();
    private readonly MAX_CACHE_SIZE = 200;
    private readonly CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

    /**
     * Get or create a cached URL for an image
     */
    getCachedUrl(originalUrl: string): string {
        this.cleanupExpiredEntries();

        if (this.cache.has(originalUrl)) {
            const cached = this.cache.get(originalUrl)!;
            cached.timestamp = Date.now(); // Refresh timestamp on access
            return cached.url;
        }

        // Add new entry
        this.cache.set(originalUrl, {
            url: originalUrl,
            loaded: false,
            timestamp: Date.now(),
        });

        // Evict oldest entries if cache is full
        if (this.cache.size > this.MAX_CACHE_SIZE) {
            this.evictOldest();
        }

        return originalUrl;
    }

    /**
     * Mark an image as loaded (for tracking purposes)
     */
    markAsLoaded(url: string): void {
        const cached = this.cache.get(url);
        if (cached) {
            cached.loaded = true;
        }
    }

    /**
     * Check if an image is already loaded
     */
    isLoaded(url: string): boolean {
        return this.cache.get(url)?.loaded ?? false;
    }

    /**
     * Check if URL is in cache
     */
    hasUrl(url: string): boolean {
        return this.cache.has(url);
    }

    /**
     * Preload multiple images
     */
    preloadImages(urls: string[]): void {
        urls.forEach((url) => {
            if (!this.cache.has(url)) {
                const img = new Image();
                img.onload = () => this.markAsLoaded(url);
                img.src = this.getCachedUrl(url);
            }
        });
    }

    /**
     * Clear all cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getStats(): { total: number; loaded: number } {
        let loaded = 0;
        this.cache.forEach((entry) => {
            if (entry.loaded) loaded++;
        });
        return { total: this.cache.size, loaded };
    }

    private cleanupExpiredEntries(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.cache.forEach((entry, key) => {
            if (now - entry.timestamp > this.CACHE_DURATION_MS) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach((key) => this.cache.delete(key));
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        this.cache.forEach((entry, key) => {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        });

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
}

import {
    v2 as cloudinary,
    UploadApiResponse,
    UploadApiErrorResponse
} from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export interface CloudinaryUploadResult {
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    width: number;
    height: number;
}

export async function uploadImageFromBuffer(
    buffer: Buffer,
    options?: {
        folder?: string;
        publicId?: string;
        transformation?: object;
    }
): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options?.folder || 'recipes',
                public_id: options?.publicId,
                resource_type: 'image',
                transformation: options?.transformation || [
                    { width: 1200, height: 800, crop: 'limit' },
                    { quality: 'auto:good' },
                    { fetch_format: 'auto' }
                ],
            },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error) {
                    reject(new Error(`Cloudinary upload failed: ${error.message}`));
                    return;
                }
                if (!result) {
                    reject(new Error('Cloudinary upload failed: No result returned'));
                    return;
                }
                resolve({
                    publicId: result.public_id,
                    url: result.url,
                    secureUrl: result.secure_url,
                    format: result.format,
                    width: result.width,
                    height: result.height,
                });
            }
        );

        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
}

export async function uploadImageFromUrl(
    imageUrl: string,
    options?: {
        folder?: string;
        publicId?: string;
        transformation?: object;
    }
): Promise<CloudinaryUploadResult> {
    try {
        const result = await cloudinary.uploader.upload(imageUrl, {
            folder: options?.folder || 'recipes',
            public_id: options?.publicId,
            resource_type: 'image',
            transformation: options?.transformation || [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ],
        });

        return {
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            format: result.format,
            width: result.width,
            height: result.height,
        };
    } catch (error: any) {
        throw new Error(`Cloudinary upload from URL failed: ${error.message}`);
    }
}

export async function deleteImage(publicId: string): Promise<boolean> {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error: any) {
        throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
}

export async function deleteImages(publicIds: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];

    for (const publicId of publicIds) {
        try {
            const success = await deleteImage(publicId);
            if (success) {
                deleted.push(publicId);
            } else {
                failed.push(publicId);
            }
        } catch {
            failed.push(publicId);
        }
    }

    return { deleted, failed };
}

export function getOptimizedUrl(
    publicId: string,
    options?: {
        width?: number;
        height?: number;
        crop?: string;
        quality?: string;
        format?: string;
    }
): string {
    return cloudinary.url(publicId, {
        width: options?.width,
        height: options?.height,
        crop: options?.crop || 'fill',
        quality: options?.quality || 'auto:good',
        fetch_format: options?.format || 'auto',
        secure: true,
    });
}

export function getThumbnailUrl(publicId: string, size: number = 150): string {
    return cloudinary.url(publicId, {
        width: size,
        height: size,
        crop: 'thumb',
        gravity: 'auto',
        quality: 'auto:good',
        fetch_format: 'auto',
        secure: true,
    });
}

export default cloudinary;

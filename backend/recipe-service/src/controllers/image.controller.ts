import { FastifyRequest, FastifyReply } from "fastify";
import {
    getRecipeImages,
    uploadLocalImage,
    uploadImageFromExternalUrl,
    removeImage,
    updateImage,
    setAsPrimaryImage,
    reorderImages,
    removeMultipleImages,
    uploadMultipleImagesFromUrls,
    uploadMultipleLocalImages
} from '../services/image.service';
import {
    sendSuccess,
    sendCreated,
    sendDeleted,
    BadRequestError
} from '@transcendence/common';
import { z } from 'zod';

export const uploadUrlSchema = z.object({
    imageUrl: z.string().url("Invalid image URL"),
    altText: z.string().max(255).optional(),
    isPrimary: z.boolean().optional()
});

export const uploadMultipleUrlsSchema = z.object({
    images: z.array(z.object({
        imageUrl: z.string().url(),
        altText: z.string().max(255).optional()
    })).min(1).max(10)
});

export const deleteMultipleSchema = z.object({
    imageIds: z.array(z.string().min(1)).min(1, "At least one image ID required")
});

export const updateImageSchema = z.object({
    altText: z.string().max(255).optional(),
    isPrimary: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional()
});

export const reorderImagesSchema = z.object({
    imageIds: z.array(z.string().min(1)).min(1)
});

export async function getRecipeImagesHandler(request: FastifyRequest, reply: FastifyReply) {
    const { recipeId } = request.params as { recipeId: string };
    const images = await getRecipeImages(recipeId);
    sendSuccess(reply, images, images.length ? 'Images found' : 'No images for this recipe');
}

export async function uploadLocalImageHandler(request: FastifyRequest, reply: FastifyReply) {
    const { recipeId } = request.params as { recipeId: string };
    const userId = request.user!.id;
    let fileBuffer: Buffer | null = null;
    let fileMimetype: string = '';
    let altText: string | undefined;
    let isPrimary: boolean = false;

    const parts = request.parts();
    for await (const part of parts) {
        if (part.type === 'file') {
            fileMimetype = part.mimetype;
            fileBuffer = await part.toBuffer();
        } else {
            if (part.fieldname === 'altText') {
                altText = part.value as string;
            } else if (part.fieldname === 'isPrimary') {
                isPrimary = part.value === 'true';
            }
        }
    }
    if (!fileBuffer) {
        throw new BadRequestError('No file uploaded');
    }
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    if (!allowedMimeTypes.includes(fileMimetype)) {
        throw new BadRequestError(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileBuffer.length > maxSize) {
        throw new BadRequestError('File size exceeds 10MB limit');
    }
    const image = await uploadLocalImage(recipeId, userId, fileBuffer, {
        altText,
        isPrimary
    });
    sendCreated(reply, image, 'Image uploaded successfully');
}

export async function uploadExternalImageHandler(request: FastifyRequest, reply: FastifyReply) {
    const { recipeId } = request.params as { recipeId: string };
    const userId = request.user!.id;
    const body = request.body as z.infer<typeof uploadUrlSchema>;

    const image = await uploadImageFromExternalUrl(recipeId, userId, body.imageUrl, {
        altText: body.altText,
        isPrimary: body.isPrimary
    });

    sendCreated(reply, image, 'Image uploaded from URL successfully');
}

export async function updateImageHandler(request: FastifyRequest, reply: FastifyReply) {
    const { imageId } = request.params as { recipeId: string; imageId: string };
    const userId = request.user!.id;
    const body = request.body as z.infer<typeof updateImageSchema>;

    const image = await updateImage(imageId, userId, body);
    sendSuccess(reply, image, 'Image updated successfully');
}

export async function deleteMultipleImagesHandler(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.id;
    const body = request.body as z.infer<typeof deleteMultipleSchema>;

    const result = await removeMultipleImages(body.imageIds, userId);
    sendSuccess(reply, result, `${result.deleted.length} image(s) deleted successfully`);
}

export async function setPrimaryImageHandler(request: FastifyRequest, reply: FastifyReply) {
    const { imageId } = request.params as { recipeId: string; imageId: string };
    const userId = request.user!.id;

    const image = await setAsPrimaryImage(imageId, userId);
    sendSuccess(reply, image, 'Image set as primary successfully');
}

export async function deleteImageHandler(request: FastifyRequest, reply: FastifyReply) {
    const { imageId } = request.params as { recipeId: string; imageId: string };
    const userId = request.user!.id;

    const image = await removeImage(imageId, userId);
    sendDeleted(reply, image, 'Image deleted successfully');
}

export async function uploadMultipleUrlsHandler(request: FastifyRequest, reply: FastifyReply) {
    const { recipeId } = request.params as { recipeId: string };
    const userId = request.user!.id;
    const body = request.body as z.infer<typeof uploadMultipleUrlsSchema>;

    const result = await uploadMultipleImagesFromUrls(recipeId, userId, body.images);
    sendCreated(reply, result, `${result.uploaded.length} image(s) uploaded successfully`);
}

export async function uploadMultipleLocalImagesHandler(request: FastifyRequest, reply: FastifyReply) {
    const { recipeId } = request.params as { recipeId: string };
    const userId = request.user!.id;

    const files: { buffer: Buffer; altText?: string; mimetype: string }[] = [];

    const parts = request.parts();
    for await (const part of parts) {
        if (part.type === 'file') {
            const buffer = await part.toBuffer();
            // Checking file size (max 10MB)
            if (buffer.length > 10 * 1024 * 1024) {
                throw new BadRequestError(`File ${part.filename} exceeds 10MB limit`);
            }
            files.push({
                buffer,
                mimetype: part.mimetype,
                altText: undefined
            });
        }
    }

    if (files.length === 0) {
        throw new BadRequestError('No files uploaded');
    }
    if (files.length > 10) {
        throw new BadRequestError('Maximum 10 images per request');
    }
    const result = await uploadMultipleLocalImages(recipeId, userId, files);
    sendCreated(reply, result, `${result.uploaded.length} image(s) uploaded successfully`);
}

export async function reorderImagesHandler(request: FastifyRequest, reply: FastifyReply) {
    const { recipeId } = request.params as { recipeId: string };
    const userId = request.user!.id;
    const body = request.body as z.infer<typeof reorderImagesSchema>;
    const images = await reorderImages(recipeId, userId, body.imageIds);
    sendSuccess(reply, images, 'Images reordered successfully');
}

import db from '../utils/db';
import { 
    uploadImageFromBuffer, 
    uploadImageFromUrl, 
    deleteImage,
    CloudinaryUploadResult 
} from './cloudinary.service';
import { NotFoundError, BadRequestError } from '@transcendence/common';
import pino from 'pino';

const logger = pino({ name: 'recipe-service:image' });

export interface RecipeImageData {
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
    sortOrder: number;
    recipeId: string;
}

export async function getRecipeImages(recipeId: string): Promise<RecipeImageData[]> {
    const recipe = await db.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true }
    });

    if (!recipe) {
        throw new NotFoundError('Recipe not found');
    }

    return db.recipeImage.findMany({
        where: { recipeId },
        orderBy: { sortOrder: 'asc' }
    });
}

export async function getImageById(imageId: string): Promise<RecipeImageData | null> {
    return db.recipeImage.findUnique({
        where: { id: imageId }
    });
}

export async function uploadLocalImage(
    recipeId: string,
    authorId: string,
    buffer: Buffer,
    options?: {
        altText?: string;
        isPrimary?: boolean;
    }
): Promise<RecipeImageData> {
    const recipe = await db.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true, authorId: true }
    });

    if (!recipe) {
        throw new NotFoundError('Recipe not found');
    }

    if (recipe.authorId !== authorId) {
        throw new BadRequestError('You are not authorized to add images to this recipe');
    }

    const cloudinaryResult = await uploadImageFromBuffer(buffer, {
        folder: `recipes/${recipeId}`,
    });

    if (options?.isPrimary) {
        await db.recipeImage.updateMany({
            where: { recipeId, isPrimary: true },
            data: { isPrimary: false }
        });
    }

    const lastImage = await db.recipeImage.findFirst({
        where: { recipeId },
        orderBy: { sortOrder: 'desc' }
    });
    const nextSortOrder = (lastImage?.sortOrder ?? -1) + 1;

    const imageCount = await db.recipeImage.count({ where: { recipeId } });
    const shouldBePrimary = options?.isPrimary || imageCount === 0;

    const image = await db.recipeImage.create({
        data: {
            url: cloudinaryResult.secureUrl,
            altText: options?.altText || null,
            isPrimary: shouldBePrimary,
            sortOrder: nextSortOrder,
            recipeId
        }
    });

    return image;
}

export async function uploadImageFromExternalUrl(
    recipeId: string,
    authorId: string,
    imageUrl: string,
    options?: {
        altText?: string;
        isPrimary?: boolean;
    }
): Promise<RecipeImageData> {
    const recipe = await db.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true, authorId: true }
    });

    if (!recipe) {
        throw new NotFoundError('Recipe not found');
    }

    if (recipe.authorId !== authorId) {
        throw new BadRequestError('You are not authorized to add images to this recipe');
    }

    try {
        new URL(imageUrl);
    } catch {
        throw new BadRequestError('Invalid image URL');
    }

    const cloudinaryResult = await uploadImageFromUrl(imageUrl, {
        folder: `recipes/${recipeId}`,
    });
    if (options?.isPrimary) {
        await db.recipeImage.updateMany({
            where: { recipeId, isPrimary: true },
            data: { isPrimary: false }
        });
    }

    const lastImage = await db.recipeImage.findFirst({
        where: { recipeId },
        orderBy: { sortOrder: 'desc' }
    });
    const nextSortOrder = (lastImage?.sortOrder ?? -1) + 1;

    const imageCount = await db.recipeImage.count({ where: { recipeId } });
    const shouldBePrimary = options?.isPrimary || imageCount === 0;

    const image = await db.recipeImage.create({
        data: {
            url: cloudinaryResult.secureUrl,
            altText: options?.altText || null,
            isPrimary: shouldBePrimary,
            sortOrder: nextSortOrder,
            recipeId
        }
    });

    return image;
}

export async function removeImage(
    imageId: string,
    authorId: string
): Promise<RecipeImageData> {
    const image = await db.recipeImage.findUnique({
        where: { id: imageId },
        include: {
            recipe: {
                select: { authorId: true }
            }
        }
    });
    if (!image) {
        throw new NotFoundError('Image not found');
    }
    if (image.recipe.authorId !== authorId) {
        throw new BadRequestError('You are not authorized to delete this image');
    }
    const publicId = extractPublicIdFromUrl(image.url);
    if (publicId) {
        try {
            await deleteImage(publicId);
        } catch (error) {
            logger.error({ err: error, publicId }, 'Failed to delete image from Cloudinary');
        }
    }
    const deletedImage = await db.recipeImage.delete({
        where: { id: imageId }
    });
    if (image.isPrimary) {
        const firstImage = await db.recipeImage.findFirst({
            where: { recipeId: image.recipeId },
            orderBy: { sortOrder: 'asc' }
        });

        if (firstImage) {
            await db.recipeImage.update({
                where: { id: firstImage.id },
                data: { isPrimary: true }
            });
        }
    }

    return deletedImage;
}

export async function updateImage(
    imageId: string,
    authorId: string,
    data: {
        altText?: string;
        isPrimary?: boolean;
        sortOrder?: number;
    }
): Promise<RecipeImageData> {
    const image = await db.recipeImage.findUnique({
        where: { id: imageId },
        include: {
            recipe: {
                select: { authorId: true, id: true }
            }
        }
    });

    if (!image) {
        throw new NotFoundError('Image not found');
    }

    if (image.recipe.authorId !== authorId) {
        throw new BadRequestError('You are not authorized to update this image');
    }

    if (data.isPrimary) {
        await db.recipeImage.updateMany({
            where: { recipeId: image.recipeId, isPrimary: true, id: { not: imageId } },
            data: { isPrimary: false }
        });
    }

    return db.recipeImage.update({
        where: { id: imageId },
        data: {
            altText: data.altText,
            isPrimary: data.isPrimary,
            sortOrder: data.sortOrder
        }
    });
}

export async function setAsPrimaryImage(
    imageId: string,
    authorId: string
): Promise<RecipeImageData> {
    return updateImage(imageId, authorId, { isPrimary: true });
}

export async function reorderImages(
    recipeId: string,
    authorId: string,
    imageIds: string[]
): Promise<RecipeImageData[]> {
    const recipe = await db.recipe.findUnique({
        where: { id: recipeId },
        select: { id: true, authorId: true }
    });

    if (!recipe) {
        throw new NotFoundError('Recipe not found');
    }

    if (recipe.authorId !== authorId) {
        throw new BadRequestError('You are not authorized to reorder images of this recipe');
    }

    const updatePromises = imageIds.map((imageId, index) =>
        db.recipeImage.update({
            where: { id: imageId },
            data: { sortOrder: index }
        })
    );

    await Promise.all(updatePromises);

    return getRecipeImages(recipeId);
}

function extractPublicIdFromUrl(url: string): string | null {
    try {
        // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

export async function removeMultipleImages(
    imageIds: string[],
    authorId: string
): Promise<{ deleted: RecipeImageData[]; failed: { id: string; error: string }[] }> {
    const deleted: RecipeImageData[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const imageId of imageIds) {
        try {
            const deletedImage = await removeImage(imageId, authorId);
            deleted.push(deletedImage);
        } catch (error: any) {
            failed.push({ id: imageId, error: error.message || 'Unknown error' });
        }
    }

    return { deleted, failed };
}

export async function uploadMultipleImagesFromUrls(
    recipeId: string,
    authorId: string,
    images: { imageUrl: string; altText?: string }[]
): Promise<{ uploaded: RecipeImageData[]; failed: { url: string; error: string }[] }> {
    const uploaded: RecipeImageData[] = [];
    const failed: { url: string; error: string }[] = [];

    let isFirst = true;
    const existingImageCount = await db.recipeImage.count({ where: { recipeId } });

    for (const img of images) {
        try {
            const image = await uploadImageFromExternalUrl(recipeId, authorId, img.imageUrl, {
                altText: img.altText,
                isPrimary: isFirst && existingImageCount === 0
            });
            uploaded.push(image);
            isFirst = false;
        } catch (error: any) {
            failed.push({ url: img.imageUrl, error: error.message || 'Unknown error' });
        }
    }

    return { uploaded, failed };
}

export async function uploadMultipleLocalImages(
    recipeId: string,
    authorId: string,
    files: { buffer: Buffer; altText?: string; mimetype: string }[]
): Promise<{ uploaded: RecipeImageData[]; failed: { index: number; error: string }[] }> {
    const uploaded: RecipeImageData[] = [];
    const failed: { index: number; error: string }[] = [];

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    let isFirst = true;
    const existingImageCount = await db.recipeImage.count({ where: { recipeId } });

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!allowedMimeTypes.includes(file.mimetype)) {
            failed.push({ index: i, error: `Invalid file type: ${file.mimetype}` });
            continue;
        }
        try {
            const image = await uploadLocalImage(recipeId, authorId, file.buffer, {
                altText: file.altText,
                isPrimary: isFirst && existingImageCount === 0
            });
            uploaded.push(image);
            isFirst = false;
        } catch (error: any) {
            failed.push({ index: i, error: error.message || 'Unknown error' });
        }
    }
    return { uploaded, failed };
}

import { FastifyInstance } from 'fastify';
import {
    getRecipeImagesHandler,
    uploadLocalImageHandler,
    uploadExternalImageHandler,
    updateImageHandler,
    deleteMultipleImagesHandler,
    setPrimaryImageHandler,
    deleteImageHandler,
    uploadMultipleUrlsHandler,
    uploadMultipleLocalImagesHandler,
    reorderImagesHandler,
    uploadUrlSchema,
    uploadMultipleUrlsSchema,
    deleteMultipleSchema,
    updateImageSchema,
    reorderImagesSchema
} from '../controllers/image.controller';
import {
    authMiddleware,
    bodyValidator
} from '@transcendence/common';

export async function imageRoutes(app: FastifyInstance) {

    app.get('/recipes/:recipeId/images', getRecipeImagesHandler);

    app.post('/recipes/:recipeId/images/upload',
        { preHandler: authMiddleware },
        uploadLocalImageHandler
    );

    app.post('/recipes/:recipeId/images/url',
        { preHandler: [authMiddleware, bodyValidator(uploadUrlSchema)] },
        uploadExternalImageHandler
    );

    app.put('/recipes/:recipeId/images/:imageId',
        { preHandler: [authMiddleware, bodyValidator(updateImageSchema)] },
        updateImageHandler
    );

    app.delete('/recipes/:recipeId/images/bulk',
        { preHandler: [authMiddleware, bodyValidator(deleteMultipleSchema)] },
        deleteMultipleImagesHandler
    );

    app.post('/recipes/:recipeId/images/:imageId/primary',
        { preHandler: authMiddleware },
        setPrimaryImageHandler
    );

    app.delete('/recipes/:recipeId/images/:imageId',
        { preHandler: authMiddleware },
        deleteImageHandler
    );

    app.post('/recipes/:recipeId/images/urls',
        { preHandler: [authMiddleware, bodyValidator(uploadMultipleUrlsSchema)] },
        uploadMultipleUrlsHandler
    );

    app.post('/recipes/:recipeId/images/uploads',
        { preHandler: authMiddleware },
        uploadMultipleLocalImagesHandler
    );

    app.put('/recipes/:recipeId/images/reorder',
        { preHandler: [authMiddleware, bodyValidator(reorderImagesSchema)] },
        reorderImagesHandler
    );
}

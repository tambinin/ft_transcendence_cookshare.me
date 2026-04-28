import db from "../utils/db";

export async function createCollection(data: {
    name: string;
    description?: string;
    userId: string;
    isPublic?: boolean;
}) {
    return db.collection.create({
        data,
        include: {
            recipes: true
        }
    });
}

export async function getUserCollections(userId: string) {
    return db.collection.findMany({
        where: { userId },
        include: {
            recipes: {
                include: {
                    recipe: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            images: {
                                where: { isPrimary: true },
                                take: 1,
                                select: { url: true, altText: true }
                            }
                        }
                    }
                }
            },
            _count: {
                select: { recipes: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getCollectionById(id: string) {
    return db.collection.findUnique({
        where: { id },
        include: {
            recipes: {
                include: {
                    recipe: {
                        include: {
                            images: {
                                where: { isPrimary: true },
                                take: 1,
                                select: { url: true, altText: true }
                            }
                        }
                    }
                },
                orderBy: { addedAt: 'desc' }
            },
            _count: {
                select: { recipes: true }
            }
        }
    });
}

export async function updateCollection(id: string, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
}) {
    return db.collection.update({
        where: { id },
        data
    });
}

export async function deleteCollection(id: string) {
    return db.collection.delete({
        where: { id }
    });
}

export async function addRecipeToCollection(collectionId: string, recipeId: string) {
    return db.collectionRecipe.create({
        data: {
            collectionId,
            recipeId
        }
    });
}

export async function removeRecipeFromCollection(collectionId: string, recipeId: string) {
    return db.collectionRecipe.delete({
        where: {
            collectionId_recipeId: {
                collectionId,
                recipeId
            }
        }
    });
}

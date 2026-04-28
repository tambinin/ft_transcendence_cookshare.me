import { FastifyInstance } from "fastify";
import { fetchWithTimeout } from "@transcendence/common";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

export async function hydrateRecipes(app: FastifyInstance, data: any) {
    if (!data)
        return data;
    const isArray = Array.isArray(data);
    const recipesToHydrate: any[] = [];
    const commentsToHydrate: any[] = [];

    const addIfRecipe = (item: any) => {
        if (item && item.authorId) {
            recipesToHydrate.push(item);
        }
    };

    const addIfComment = (item: any) => {
        if (item && item.userId && !item.authorId && item.content !== undefined) {
            commentsToHydrate.push(item);
            if (item.replies && Array.isArray(item.replies)) {
                item.replies.forEach((reply: any) => addIfComment(reply));
            }
        }
    };

    const items = isArray ? data : [data];
    items.forEach((item: any) => {
        addIfRecipe(item);
        addIfComment(item);
        if (item.recipes && Array.isArray(item.recipes)) {
            item.recipes.forEach((subItem: any) => {
                addIfRecipe(subItem);
                if (subItem.recipe) {
                    addIfRecipe(subItem.recipe);
                }
            });
        }
        if (item.comments && Array.isArray(item.comments)) {
            item.comments.forEach((comment: any) => addIfComment(comment));
        }
    });

    const allUserIds = new Set<string>();
    recipesToHydrate.forEach((r: any) => { if (r.authorId) allUserIds.add(r.authorId); });
    commentsToHydrate.forEach((c: any) => { if (c.userId) allUserIds.add(c.userId); });

    if (allUserIds.size === 0)
        return data;

    const authorIds = Array.from(allUserIds);

    const response = await fetchWithTimeout(`${USER_SERVICE_URL}/api/v1/internal/users/batch?ids=${authorIds.join(",")}`, {
        method: "GET",
        headers: {
            "x-internal-api-key": INTERNAL_API_KEY!,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        return data;
    }

    const json = await response.json();
    const users = json.data || [];
    const usersMap = users.reduce((acc: any, user: any) => {
        acc[user.id] = user;
        return acc;
    }, {});

    recipesToHydrate.forEach((recipe: any) => {
        if (recipe.authorId && usersMap[recipe.authorId]) {
            recipe.author = usersMap[recipe.authorId];
        } else {
            recipe.author = {
                id: recipe.authorId,
                username: "Unknown User",
                avatarUrl: null
            };
        }
    });

    commentsToHydrate.forEach((comment: any) => {
        if (comment.userId && usersMap[comment.userId]) {
            comment.author = usersMap[comment.userId];
        } else {
            comment.author = {
                id: comment.userId,
                username: "Unknown User",
                avatarUrl: null
            };
        }
    });

    return data;
}
import db from "../utils/db";
import { slugify, NotFoundError, ForbiddenError } from "@transcendence/common";

export async function createCategory(data: {
    name: string,
    iconName?: string,
    color?: string,
    sortOrder?: number
}) {
    const slug = slugify(data.name);
    const category = await db.category.create({
        data: { ...data, slug }
    });
    return category;
}

export async function getAllCategories() {
    const categories = await db.category.findMany({
        orderBy: {
            sortOrder: 'asc'
        }
    });
    return categories;
}

export async function getCategoryById(id: string) {
    const category = await db.category.findUnique({ where: { id } });
    return category;
}

export async function getCategoryBySlug(slug: string) {
    const category = await db.category.findUnique({ where: { slug } });
    return category;
}

export async function updateCategory(id: string, data: {
    name?: string,
    iconName?: string,
    color?: string,
    sortOrder?: number
}) {
    if (data.name) {
        (data as any).slug = slugify(data.name);
    }
    const category = await db.category.update({
        where: { id },
        data
    });
    return category;
}

export async function deleteCategory(id: string) {
    const category = await db.category.delete({ where: { id } });
    return category;
}

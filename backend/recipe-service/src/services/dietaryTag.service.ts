import db from "../utils/db";
import { slugify } from "@transcendence/common";

export async function createDietaryTag(data: {
    name: string,
    iconName?: string
}) {
    const slug = slugify(data.name);
    const tag = await db.dietaryTag.create({
        data: { ...data, slug }
    });
    return tag;
}

export async function getAllDietaryTags() {
    const tags = await db.dietaryTag.findMany({
        orderBy: {
            name: 'asc'
        }
    });
    return tags;
}

export async function getDietaryTagById(id: string) {
    const tag = await db.dietaryTag.findUnique({ where: { id } });
    return tag;
}

export async function updateDietaryTag(id: string, data: {
    name?: string,
    iconName?: string
}) {
    const updateData: any = { ...data };
    if (data.name) {
        updateData.slug = slugify(data.name);
    }
    const tag = await db.dietaryTag.update({
        where: { id },
        data: updateData
    });
    return tag;
}

export async function deleteDietaryTag(id: string) {
    const tag = await db.dietaryTag.delete({ where: { id } });
    return tag;
}

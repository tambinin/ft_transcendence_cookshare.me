
import db from '../src/utils/dbPlugin';

async function main() {
    const badges = [
        {
            slug: 'first-recipe',
            name: 'First Recipe',
            description: 'Awarded for posting your first recipe!',
            iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1/badges/first-recipe.png',
            condition: 'Create 1 recipe',
            type: 'RECIPE_COUNT',
            threshold: 1
        },
        {
            slug: 'master-chef',
            name: 'Master Chef',
            description: 'Awarded for posting 10 recipes.',
            iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1/badges/master-chef.png',
            condition: 'Create 10 recipes',
            type: 'RECIPE_COUNT',
            threshold: 10
        },
        {
            slug: 'social-butterfly',
            name: 'Social Butterfly',
            description: 'Awarded for having 5 followers.',
            iconUrl: 'https://res.cloudinary.com/demo/image/upload/v1/badges/social.png',
            condition: 'Get 5 followers',
            type: 'FOLLOWER_COUNT',
            threshold: 5
        }
    ];

    for (const badge of badges) {
        await db.badge.upsert({
            where: { slug: badge.slug },
            update: badge,
            create: badge,
        });
        console.log(`Upserted badge: ${badge.name}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });

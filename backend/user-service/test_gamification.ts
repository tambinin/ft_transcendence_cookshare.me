
import { processGamificationEvent, GamificationEvent } from './src/services/gamification.service';
import db from './src/utils/dbPlugin';

async function testGamification() {
    // 1. Create a dummy user
    const user = await db.user.create({
        data: {
            username: `gamer_${Date.now()}`,
            email: `gamer_${Date.now()}@test.com`,
            password: 'password123'
        }
    });

    console.log(`Created user: ${user.username} (Level: ${user.level}, XP: ${user.xp})`);

    // 2. Trigger RECIPE_CREATED event (Should give 50 XP)
    console.log("Triggering RECIPE_CREATED event...");
    const result1 = await processGamificationEvent(user.id, GamificationEvent.RECIPE_CREATED, { recipeCount: 1 });
    console.log("Result 1:", JSON.stringify(result1, null, 2));

    // 3. Trigger REVIEW_GIVEN event (Should give 10 XP)
    console.log("Triggering REVIEW_GIVEN event...");
    const result2 = await processGamificationEvent(user.id, GamificationEvent.REVIEW_GIVEN);
    console.log("Result 2:", JSON.stringify(result2, null, 2));

    // 4. Verify Final State
    const finalUser = await db.user.findUnique({
        where: { id: user.id },
        include: { badges: { include: { badge: true } } }
    });

    console.log("Final User State:");
    console.log(`XP: ${finalUser?.xp} (Expected: 60)`);
    console.log(`Level: ${finalUser?.level}`);
    console.log("Badges:", finalUser?.badges.map(b => b.badge.name).join(", "));

    // Clean up
    await db.user.delete({ where: { id: user.id } });
}

testGamification()
    .catch(console.error)
    .finally(() => db.$disconnect());

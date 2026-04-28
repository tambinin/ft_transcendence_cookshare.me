
import db from "../utils/dbPlugin";
import { NotFoundError } from "@transcendence/common";
import pino from "pino";

const logger = pino({ name: 'user-service:gamification' });

export enum GamificationEvent {
    RECIPE_CREATED = 'RECIPE_CREATED',
    REVIEW_GIVEN = 'REVIEW_GIVEN',
    FIRST_LOGIN = 'FIRST_LOGIN',
    FOLLOWER_GAINED = 'FOLLOWER_GAINED'
}

// Map events to Badge Criteria Types
const EVENT_TO_CRITERIA: Record<GamificationEvent, string | undefined> = {
    [GamificationEvent.RECIPE_CREATED]: 'RECIPE_COUNT',
    [GamificationEvent.REVIEW_GIVEN]: 'REVIEW_COUNT',
    [GamificationEvent.FIRST_LOGIN]: undefined, // No dynamic badge for login yet
    [GamificationEvent.FOLLOWER_GAINED]: 'FOLLOWER_COUNT'
};

export async function awardXp(userId: string, amount: number) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    const newXp = user.xp + amount;
    const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

    const updatedUser = await db.user.update({
        where: { id: userId },
        data: { xp: newXp, level: newLevel }
    });

    return {
        xp: newXp,
        level: newLevel,
        leveledUp: newLevel > user.level
    };
}

export async function awardBadge(userId: string, badgeSlug: string) {
    const badge = await db.badge.findUnique({ where: { slug: badgeSlug } });
    if (!badge) {
        logger.warn({ badgeSlug }, 'Badge not found');
        return null;
    }

    // Check if user already has it
    const existing = await db.userBadge.findUnique({
        where: {
            userId_badgeId: {
                userId,
                badgeId: badge.id
            }
        }
    });

    if (existing) return existing;

    const userBadge = await db.userBadge.create({
        data: {
            userId,
            badgeId: badge.id
        }
    });

    return userBadge;
}

export async function processGamificationEvent(userId: string, event: GamificationEvent, data: any = {}) {
    // 1. Award generic XP based on event
    let xpAmount = 0;
    switch (event) {
        case GamificationEvent.RECIPE_CREATED: xpAmount = 50; break;
        case GamificationEvent.REVIEW_GIVEN: xpAmount = 10; break;
        case GamificationEvent.FIRST_LOGIN: xpAmount = 5; break;
        case GamificationEvent.FOLLOWER_GAINED: xpAmount = 20; break;
    }

    const xpResult = await awardXp(userId, xpAmount);

    // 2. Dynamic Badge Awarding
    const criteriaType = EVENT_TO_CRITERIA[event];
    let currentValue = 0;

    // Determine current value based on event data
    // The caller (other services) should provide the TOTAL count in `data`.
    // E.g. data.recipeCount, data.followerCount
    if (criteriaType === 'RECIPE_COUNT') currentValue = data.recipeCount || 0;
    else if (criteriaType === 'FOLLOWER_COUNT') currentValue = data.followerCount || 0;
    else if (criteriaType === 'REVIEW_COUNT') currentValue = data.reviewCount || 0;

    let badgeAwards: string[] = [];

    if (criteriaType && currentValue > 0) {
        // Find all badges that match the criteria and threshold is met
        const eligibleBadges = await db.badge.findMany({
            where: {
                type: criteriaType,
                threshold: { lte: currentValue }
            }
        });

        for (const badge of eligibleBadges) {
            const awarded = await awardBadge(userId, badge.slug);
            if (awarded) {
                badgeAwards.push(badge.slug);
            }
        }
    }

    return { xpResult, badgeAwards };
}

export async function getUserGamificationProfile(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        include: {
            badges: {
                include: {
                    badge: true
                }
            }
        }
    });

    if (!user) return null;

    return {
        id: user.id,
        username: user.username,
        xp: user.xp,
        level: user.level,
        badges: user.badges
    };
}

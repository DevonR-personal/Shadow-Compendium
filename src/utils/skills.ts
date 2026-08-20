import type {
    Shadow,
    Skill,
} from "../types"

export function getSkillModifier(
    skill: Skill,
    shadow: Shadow
): number | null {
    const stats = shadow.shadow_stats?.[0] ?? null

    if (!stats || !skill.uses_stat) {
        return null
    }

    return stats[skill.uses_stat]
}
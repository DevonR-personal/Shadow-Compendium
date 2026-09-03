import type { Combatant, Shadow } from "../types"
import { rollDice } from "./dice"

export type TurnHighlights = {
    skillId: number | null
    playerCombatantId: number | null
}

export function getTurnHighlights(
    combatants: Combatant[],
    shadows: Shadow[],
    turnNumber: number,
    roll = () => rollDice(1, 100),
    randomIndex = (length: number) => rollDice(1, length) - 1
): TurnHighlights {
    const currentCombatant = combatants.find(
        (combatant) => combatant.is_current_turn
    )

    if (
        currentCombatant?.combatant_type !== "shadow" ||
        currentCombatant.shadow_id === null
    ) {
        return {
            skillId: null,
            playerCombatantId: null,
        }
    }

    const shadow = shadows.find(
        (item) => item.id === currentCombatant.shadow_id
    )

    if ((currentCombatant.hp ?? 0) <= 0) {
        return {
            skillId: null,
            playerCombatantId: null,
        }
    }

    const players = combatants.filter(
        (combatant) => combatant.combatant_type === "player"
    )

    if (!shadow || players.length === 0) {
        return {
            skillId: null,
            playerCombatantId: null,
        }
    }

    const activeChance =
        turnNumber === 1
            ? 80
            : turnNumber === 2
                ? 20
                : 5
    const selectedType = roll() <= activeChance
        ? "active"
        : "skill"
    const skills = shadow.shadow_skills
        .flatMap((entry) => entry.skills)
        .filter(
            (skill) => skill.type === selectedType
        )
    const fallbackSkills = shadow.shadow_skills
        .flatMap((entry) => entry.skills)
        .filter(
            (skill) => skill.type === "skill" || skill.type === "active"
        )
    const availableSkills = skills.length > 0 ? skills : fallbackSkills
    const selectedSkill = availableSkills.length > 0
        ? availableSkills[randomIndex(availableSkills.length)]
        : undefined
    const selectedPlayer = players[randomIndex(players.length)]

    return {
        skillId: selectedSkill?.id ?? null,
        playerCombatantId: selectedPlayer.id,
    }
}

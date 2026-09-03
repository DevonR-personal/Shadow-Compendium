import type { Combatant, Shadow } from "../types"
import { rollDice } from "./dice"

export type CombatLoot = {
    yen: number
    items: string[]
}

export function calculateCombatLoot(
    combatants: Combatant[],
    shadows: Shadow[],
    roll = () => rollDice(2, 6)
): CombatLoot {
    let yen = 0
    const items: string[] = []

    for (const combatant of combatants) {
        if (
            combatant.combatant_type !== "shadow" ||
            (combatant.hp ?? 0) > 0
        ) {
            continue
        }

        const shadow = shadows.find(
            (item) => item.id === combatant.shadow_id
        )

        if (!shadow) {
            continue
        }

        const baseYen = Math.floor(shadow.max_hp / 2)
        const luckRoll = roll()

        if (luckRoll <= 6) {
            yen += baseYen
            continue
        }

        yen += baseYen * 5

        if (luckRoll >= 10 && shadow.loot_item) {
            items.push(shadow.loot_item)
        }
    }

    return { yen, items }
}

export function sortCombatantsForInitiative(
    combatants: Combatant[]
) {
    return combatants.toSorted((a, b) => {
        const initiativeDifference =
            (b.initiative ?? 0) - (a.initiative ?? 0)

        if (initiativeDifference !== 0) {
            return initiativeDifference
        }

        if (
            a.combatant_type === "player" &&
            b.combatant_type === "shadow"
        ) {
            return -1
        }

        if (
            a.combatant_type === "shadow" &&
            b.combatant_type === "player"
        ) {
            return 1
        }

        return 0
    })
}

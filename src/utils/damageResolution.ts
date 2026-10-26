import type { AffinityElement, AffinityValue } from "../types"

export type DamageType = AffinityElement | "heal" | null

export type DamageOutcome =
    | { readonly kind: "damage"; readonly amount: number }
    | { readonly kind: "heal"; readonly amount: number }
    | { readonly kind: "immune"; readonly amount: 0 }
    | { readonly kind: "reflect"; readonly amount: number }

export function applyDamageOutcomeToHitPoints(
    currentHp: number,
    maximumHp: number,
    outcome: DamageOutcome,
) {
    const safeMaximum = Number.isFinite(maximumHp) ? Math.max(0, maximumHp) : 0
    const safeCurrent = Number.isFinite(currentHp)
        ? Math.max(0, Math.min(safeMaximum, currentHp))
        : 0

    if (outcome.kind === "damage") {
        return Math.max(0, safeCurrent - Math.max(0, outcome.amount))
    }
    if (outcome.kind === "heal") {
        return Math.min(safeMaximum, safeCurrent + Math.max(0, outcome.amount))
    }
    return safeCurrent
}

export function resolveDamage(
    amount: number,
    damageType: DamageType,
    affinity: AffinityValue | null,
    armor: number,
): DamageOutcome {
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0

    if (damageType === "heal") {
        return { kind: "heal", amount: safeAmount }
    }

    if (affinity === "null") {
        return { kind: "immune", amount: 0 }
    }

    if (affinity === "drain") {
        return { kind: "heal", amount: safeAmount }
    }

    if (affinity === "reflect") {
        return { kind: "reflect", amount: safeAmount }
    }

    const affinityModifier = affinity === "weak"
        ? 2
        : affinity === "resist"
            ? -2
            : 0

    return {
        kind: "damage",
        amount: safeAmount === 0
            ? 0
            : Math.max(1, safeAmount + affinityModifier - Math.max(0, armor)),
    }
}
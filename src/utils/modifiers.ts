export type ModifierKey = "damage_mod" | "armor_mod" | "accuracy_mod"

const LIMITS: Record<ModifierKey, number> = {
    damage_mod: 12,
    armor_mod: 12,
    accuracy_mod: 2,
}

export function clampModifier(value: number, type: ModifierKey) {
    const limit = LIMITS[type]
    return Math.min(limit, Math.max(-limit, Math.round(value / 2) * 2))
}

export function applyModifierDelta(
    currentValue: number,
    delta: number,
    type: ModifierKey
) {
    return clampModifier((currentValue ?? 0) + delta, type)
}

export function formatModifier(value: number | null | undefined) {
    const normalized = typeof value === "number" ? value : 0

    if (normalized === 0) {
        return "-"
    }

    return `${normalized > 0 ? "+" : ""}${normalized}`
}

export function getTurnDotCount(turns: number | null | undefined) {
    const safeTurns = Math.max(0, Math.min(3, Math.round(turns ?? 0)))

    return [
        safeTurns >= 1,
        safeTurns >= 2,
        safeTurns >= 3,
    ]
}

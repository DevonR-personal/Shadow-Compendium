import { AFFINITY_LABELS } from "../constants/affinities"
import type { AffinityValue } from "../types"
import type { DamageOutcome, DamageType } from "./damageResolution"

export type CombatLogEntry = {
    readonly id: string
    readonly kind: "damage" | "loot"
    readonly text: string
}

export const COMBAT_LOG_LIMIT = 3

export function appendCombatLogEntry(
    entries: readonly CombatLogEntry[],
    entry: CombatLogEntry,
) {
    return [entry, ...entries].slice(0, COMBAT_LOG_LIMIT)
}

type DamageLogDetails = {
    readonly source: string | null
    readonly target: string
    readonly outcome: DamageOutcome
    readonly damageType: DamageType
    readonly affinity: AffinityValue | null
}

export function formatDamageLog({
    source,
    target,
    outcome,
    damageType,
    affinity,
}: DamageLogDetails) {
    const typeLabel = damageType && damageType !== "heal"
        ? AFFINITY_LABELS[damageType]
        : "non-elemental"
    const fromSource = source ? ` from ${source}` : ""

    if (outcome.kind === "heal") {
        if (damageType !== "heal") {
            return `${target} absorbed ${outcome.amount} ${typeLabel} damage${fromSource}`
        }
        return source
            ? `${source} healed ${target} for ${outcome.amount}`
            : `${target} was healed for ${outcome.amount}`
    }

    if (outcome.kind === "immune") {
        return `${target} nulled ${typeLabel} damage${fromSource}`
    }

    if (outcome.kind === "reflect") {
        return `${target} reflected ${outcome.amount} ${typeLabel} damage${fromSource}`
    }

    if (!source) {
        return `${target} was dealt ${outcome.amount} ${typeLabel} damage`
    }

    let note = ""
    if (affinity === "weak") note = " (weak)"
    if (affinity === "resist") note = " (resist)"

    return `${source} dealt ${outcome.amount} ${typeLabel} damage to ${target}${note}`
}

export function formatLootLog(loot: {
    readonly yen: number
    readonly items: readonly string[]
}) {
    const parts = [`${loot.yen}¥`, ...loot.items]
    return `Loot: ${parts.join(", ")}`
}

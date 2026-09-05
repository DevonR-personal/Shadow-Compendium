import { supabase } from "../supabase"
import type { Shadow, Combatant } from "../types"
import { rollDice } from "../utils/dice"


export async function getCombatants() {
    const { data, error } = await supabase
        .from("combatants")
        .select(`
            *,
            condition:conditions (
                id,
                name,
                description
            )
        `)
        .order("position")

    return {
        data: (data ?? []) as Combatant[],
        error,
    }
}

export async function damageAllShadowCombatants(
    amount: number,
    shadows: Shadow[]
) {
    const result = await getCombatants()

    if (result.error) {
        return result.error
    }

    const shadowMap = new Map(shadows.map((shadow) => [shadow.id, shadow]))

    for (const combatant of result.data) {
        if (
            combatant.combatant_type !== "shadow" ||
            combatant.shadow_id === null
        ) {
            continue
        }

        const armor = shadowMap.get(combatant.shadow_id)?.armor ?? 0
        const damage = Math.max(1, amount - armor)
        const currentHP = combatant.hp ?? 0
        const nextHP = Math.max(
            0,
            Math.min(combatant.max_hp ?? currentHP, currentHP - damage)
        )
        const error = await updateCombatant(combatant.id, { hp: nextHP })

        if (error) {
            return error
        }
    }

    return null
}

export async function addCombatant(
    shadow: Shadow
) {
    const combatState = await getCombatActive()
    if (combatState.error) {
        return combatState.error
    }

    const initiative = getShadowInitiative(shadow, combatState.active)

    const { data: combatants, error: getError } = await getCombatantPositions()

    if (getError) {
        return getError
    }

    const position = combatState.active
        ? calculateCombatantInsertionPosition(combatants, initiative)
        : 0

    if (combatState.active) {
        const shiftError = await shiftCombatantPositions(combatants, position)

        if (shiftError) {
            return shiftError
        }
    }

    return insertShadowCombatant(shadow, initiative, position)
}

type CombatantPosition = Pick<
    Combatant,
    "id" | "initiative" | "position" | "combatant_type"
>

function getShadowInitiative(shadow: Shadow, combatActive: boolean) {
    if (!combatActive) {
        return 0
    }

    const agility = shadow.shadow_stats?.[0]?.agility ?? 0
    return rollDice(2, 6) + agility
}

async function getCombatantPositions() {
    return supabase
        .from("combatants")
        .select("id, initiative, position, combatant_type")
        .order("position", { ascending: true })
}

function calculateCombatantInsertionPosition(
    combatants: CombatantPosition[],
    initiative: number
) {
    let position = combatants.length

    for (const combatant of combatants) {
        const existingInitiative = combatant.initiative ?? 0

        if (initiative > existingInitiative) {
            return combatant.position ?? 0
        }

        if (
            initiative === existingInitiative &&
            combatant.combatant_type === "player"
        ) {
            position = (combatant.position ?? 0) + 1
        }
    }

    return position
}

async function shiftCombatantPositions(
    combatants: CombatantPosition[],
    position: number
) {
    for (const combatant of combatants) {
        if ((combatant.position ?? 0) < position) {
            continue
        }

        const { error } = await supabase
            .from("combatants")
            .update({ position: (combatant.position ?? 0) + 1 })
            .eq("id", combatant.id)

        if (error) {
            return error
        }
    }

    return null
}

async function insertShadowCombatant(
    shadow: Shadow,
    initiative: number,
    position: number
) {
    const { error } = await supabase
        .from("combatants")
        .insert({
            shadow_id: shadow.id,
            display_name: shadow.name,
            combatant_type: "shadow",
            initiative,
            hp: shadow.max_hp,
            max_hp: shadow.max_hp,
            damage_mod: 0,
            armor_mod: 0,
            accuracy_mod: 0,
            damage_mod_turns: 0,
            armor_mod_turns: 0,
            accuracy_mod_turns: 0,
            position,
        })

    return error
}

export async function addPlayerCombatant(
    playerId: number,
    name: string
) {
    const { data: existing, error: findError } =
        await supabase
            .from("combatants")
            .select("id")
            .eq("player_id", playerId)
            .maybeSingle()

    if (findError) {
        return findError
    }

    if (existing) {
        const { error } = await supabase
            .from("combatants")
            .update({
                display_name: name,
                combatant_type: "player",
                initiative: 0,
            })
            .eq("id", existing.id)

        return error
    }

    const { error } = await supabase
        .from("combatants")
        .insert({
            player_id: playerId,
            display_name: name,
            combatant_type: "player",
            initiative: 0,
        })

    return error
}

export async function updateCombatant(
    combatantId: number,
    updates: Partial<
        Pick<
            Combatant,
            | "hp"
            | "initiative"
            | "position"
            | "damage_mod"
            | "armor_mod"
            | "accuracy_mod"
            | "damage_mod_turns"
            | "armor_mod_turns"
            | "accuracy_mod_turns"
        >
    >
) {
    const { error } = await supabase
        .from("combatants")
        .update(updates)
        .eq("id", combatantId)

    return error
}

export async function updatePlayerCombatantInitiative(
    playerId: number,
    initiative: number
) {
    const { error } = await supabase
        .from("combatants")
        .update({ initiative })
        .eq("player_id", playerId)

    return error
}


export async function removeCombatant(
    combatantId: number
) {
    const { error } = await supabase
        .from("combatants")
        .delete()
        .eq("id", combatantId)

    return error
}


export async function updateCurrentTurn(
    combatantId: number
) {
    const { error: clearError } = await supabase
        .from("combatants")
        .update({
            is_current_turn: false,
        })
        .neq("id", 0)

    if (clearError) {
        return clearError
    }

    const { error } = await supabase
        .from("combatants")
        .update({
            is_current_turn: true,
        })
        .eq("id", combatantId)

    return error
}

export async function nextTurn() {
    const { data, error } = await supabase
        .from("combatants")
        .select("*")
        .order("position")

    if (error || !data) {
        return {
            error,
            wrapped: false,
        }
    }

    const currentIndex = data.findIndex(
        (combatant) => combatant.is_current_turn
    )

    if (currentIndex === -1) {
        return {
            error: null,
            wrapped: false,
        }
    }

    let nextIndex = -1

    for (let offset = 1; offset <= data.length; offset++) {
        const candidateIndex =
            (currentIndex + offset) % data.length
        const candidate = data[candidateIndex]

        if (
            candidate.combatant_type === "shadow" &&
            (candidate.hp ?? 0) <= 0
        ) {
            continue
        }

        nextIndex = candidateIndex
        break
    }

    if (nextIndex === -1) {
        return {
            error: null,
            wrapped: false,
        }
    }

    const { error: clearError } =
        await supabase
            .from("combatants")
            .update({
                is_current_turn: false,
            })
            .eq(
                "id",
                data[currentIndex].id
            )

    if (clearError) {
        return {
            error: clearError,
            wrapped: false,
        }
    }

    const { error: setError } =
        await supabase
            .from("combatants")
            .update({
                is_current_turn: true,
            })
            .eq(
                "id",
                data[nextIndex].id
            )

    return {
        error: setError,
        wrapped: nextIndex <= currentIndex,
    }
}


export async function resetCombat() {
    const { error } = await supabase
        .from("combatants")
        .delete()
        .neq("id", 0)

    return error
}

export async function updateCombatantDowned(
    combatantId: number,
    downed: boolean
) {
    const { error } = await supabase
        .from("combatants")
        .update({ downed })
        .eq("id", combatantId)

    return error
}

export async function updateCombatantCondition(
    combatantId: number,
    conditionId: number | null
) {
    const { error } = await supabase
        .from("combatants")
        .update({
            condition_id: conditionId,
        })
        .eq("id", combatantId)

    return error
}

export async function getCombatActive() {
    const { data, error } = await supabase
        .from("combat_state")
        .select("is_active, turn_number")
        .eq("id", 1)
        .maybeSingle()

    return {
        active: data?.is_active ?? false,
        turnNumber: data?.turn_number ?? 0,
        error,
    }
}

export async function setCombatTurnNumber(turnNumber: number) {
    const { error } = await supabase
        .from("combat_state")
        .update({ turn_number: turnNumber })
        .eq("id", 1)

    return error
}

export async function incrementCombatTurnNumber() {
    const state = await getCombatActive()

    if (state.error) {
        return {
            turnNumber: state.turnNumber,
            error: state.error,
        }
    }

    const turnNumber = state.turnNumber + 1
    const error = await setCombatTurnNumber(turnNumber)

    return {
        turnNumber,
        error,
    }
}

export async function setCombatActive(active: boolean) {
    const { error } = await supabase
        .from("combat_state")
        .update({
            is_active: active,
        })
        .eq("id", 1)

    return error
}

export async function endCombat() {
    const stateError = await setCombatActive(false)

    if (stateError) {
        return stateError
    }

    const { error } = await supabase
        .from("combatants")
        .update({
            is_current_turn: false,
            damage_mod: 0,
            armor_mod: 0,
            accuracy_mod: 0,
            damage_mod_turns: 0,
            armor_mod_turns: 0,
            accuracy_mod_turns: 0,
        })
        .neq("id", 0)

    return error
}

export async function getCombatLoot() {
    const { data, error } = await supabase
        .from("combat_state")
        .select("loot_yen, loot_items")
        .eq("id", 1)
        .maybeSingle()

    return {
        yen: data?.loot_yen ?? 0,
        items: data?.loot_items ?? [],
        error,
    }
}

export async function setCombatLoot(
    yen: number,
    items: string[]
) {
    const { error } = await supabase
        .from("combat_state")
        .update({
            loot_yen: yen,
            loot_items: items,
        })
        .eq("id", 1)

    return error
}

export async function clearCombatLoot() {
    const { error } = await supabase
        .from("combat_state")
        .update({
            loot_yen: 0,
            loot_items: [],
        })
        .eq("id", 1)

    return error
}
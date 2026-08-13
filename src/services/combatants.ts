import { supabase } from "../supabase"
import type { Shadow, Combatant } from "../types"


export async function getCombatants() {
    const { data, error } = await supabase
        .from("combatants")
        .select(`
            id,
            shadow_id,
            display_name,
            initiative,
            position,
            combatant_type,
            is_current_turn,
            hp,
            max_hp,
            player_id
        `)
        .order("position")

    return {
        data: (data ?? []) as Combatant[],
        error,
    }
}

export async function addCombatant(
  shadow: Shadow
) {
  const { error } = await supabase
    .from("combatants")
    .insert({
      shadow_id: shadow.id,
      display_name: shadow.name,
      combatant_type: "shadow",
      initiative: 0,
      hp: shadow.max_hp,
      max_hp: shadow.max_hp,
      position: 0
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
            "hp" | "initiative" | "position"
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
        return error
    }

    const currentIndex = data.findIndex(
        (combatant) => combatant.is_current_turn
    )

    if (currentIndex === -1) {
        return null
    }

    const nextIndex =
        (currentIndex + 1) % data.length

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
        return clearError
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

    return setError
}


export async function resetCombat() {
    const { error } = await supabase
        .from("combatants")
        .delete()
        .neq("id", 0)

    return error
}
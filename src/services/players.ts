import { supabase } from "../supabase"
import type { Player } from "../types"

export async function getPlayers() {
  const { data, error } = await supabase
    .from("players")
    .select("id, name, in_initiative, is_player, weapon1_id, weapon2_id, current_hp, maximum_hp")
    .order("name")

  return {
    data: (data ?? []) as Player[],
    error,
  }
}

export async function updatePlayerInitiative(
  playerId: number,
  inInitiative: boolean
) {
  const { data, error } = await supabase
    .from("players")
    .update({
      in_initiative: inInitiative,
    })
    .eq("id", playerId)
    .select("id, name, in_initiative, is_player, weapon1_id, weapon2_id, current_hp, maximum_hp")
    .single()

  return {
    data: data as Player | null,
    error,
  }
}

export async function updatePlayerHealth(
  playerId: number,
  currentHp: number
) {
  const { error } = await supabase
    .from("players")
    .update({ current_hp: currentHp })
    .eq("id", playerId)

  return error
}

export async function getInitiativePlayers() {
    const { data, error } = await supabase
        .from("players")
        .select("id, name, in_initiative")
        .eq("in_initiative", true)
        .order("name")

    return {
        data: (data ?? []) as Player[],
        error,
    }
}
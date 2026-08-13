import { supabase } from "../supabase"
import type { Player } from "../types"

export async function getPlayers() {
  const { data, error } = await supabase
    .from("players")
    .select("id, name, in_initiative")
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
    .select("id, name, in_initiative")
    .single()

  return {
    data: data as Player | null,
    error,
  }
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
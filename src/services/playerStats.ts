import { supabase } from "../supabase"
import type { PlayerStats } from "../types"

export async function getPlayerStats(playerId: number) {
    const { data, error } = await supabase
        .from("player_stats")
        .select("id, player_id, athleticism, proficiency, guts, knowledge, charm, strength, agility, endurance, magic, luck, max_luck")
        .eq("player_id", playerId)
        .maybeSingle()

    return {
        data: data as PlayerStats | null,
        error,
    }
}

export async function updatePlayerLuck(playerId: number, luck: number) {
    const { error } = await supabase
        .from("player_stats")
        .update({ luck })
        .eq("player_id", playerId)

    return error
}

import { supabase } from "../supabase"
import type { Weapon } from "../types"

export async function getWeapons(ids: number[]) {
    if (ids.length === 0) {
        return { data: [], error: null }
    }

    const { data, error } = await supabase
        .from("weapons")
        .select("id, name, element, description, uses_stat")
        .in("id", ids)

    return {
        data: (data ?? []) as Weapon[],
        error,
    }
}

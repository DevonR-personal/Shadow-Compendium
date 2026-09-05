import { supabase } from "../supabase"
import type { Skill } from "../types"

export async function getSkills() {
    const { data, error } = await supabase
        .from("skills")
        .select("id, name, type, affinity, description, cooldown, uses_stat, is_unique")
        .order("name")

    return {
        data: (data ?? []) as Skill[],
        error,
    }
}

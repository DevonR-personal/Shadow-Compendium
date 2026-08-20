import { supabase } from "../supabase"
import type { Shadow, UpdatedShadow } from "../types"

export async function getShadows() {
  const { data, error } = await supabase
    .from("shadows")
    .select(`
    id,
    name,
    level,
    arcana,
    max_hp,
    armor,
    loot_item,

    shadow_stats(
        id,
        shadow_id,
        strength,
        agility,
        endurance,
        magic
    ),

    shadow_affinities(
        id,
        shadow_id,
        element,
        value,
        discovered
    ),

    shadow_skills(
        skills(
            id,
            name,
            type,
            affinity,
            description,
            cooldown,
            uses_stat,
            is_unique
        )
    )
`)
    .order("name")

  return {
    data: (data ?? []) as Shadow[],
    error,
  }
}

export async function updateShadow(
  shadowId: number,
  name: string,
  level: number | null,
  armor: number | null,
  arcana: string | null,
  loot_item: string | null
) {
  const { data, error } = await supabase
    .from("shadows")
    .update({
      name,
      level,
      armor,
      arcana,
      loot_item,
    })
    .eq("id", shadowId)
    .select(`
      id,
      name,
      level,
      armor,
      arcana,
      loot_item
    `)
    .single()

  if (error) {
    throw error
  }

  return data as UpdatedShadow
}
import { supabase } from "../supabase"
import type { Affinity, AffinityValue } from "../types"

export async function getAffinities(
  shadowId: number
) {
  const { data, error } = await supabase
    .from("shadow_affinities")
    .select(
      "id, shadow_id, element, value, discovered"
    )
    .eq("shadow_id", shadowId)

  if (error) {
    throw error
  }

  return (data ?? []) as Affinity[]
}


export async function updateAffinityDiscovery(
  affinityId: number,
  discovered: boolean
) {
  const { error } = await supabase
    .from("shadow_affinities")
    .update({ discovered })
    .eq("id", affinityId)

  if (error) {
    throw error
  }
}


export async function updateAffinityValue(
  affinityId: number,
  value: AffinityValue
) {
  const { error } = await supabase
    .from("shadow_affinities")
    .update({ value })
    .eq("id", affinityId)

  if (error) {
    throw error
  }
}
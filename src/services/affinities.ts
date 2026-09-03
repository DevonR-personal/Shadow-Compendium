import { supabase } from "../supabase"
import type { Affinity, AffinityElement, AffinityValue } from "../types"

export async function getAffinities(
  shadowId: number
) {
  const { data, error } = await supabase
    .from("shadow_affinities")
    .select(
      "id, shadow_id, element, value, discovered"
    )
    .eq("shadow_id", shadowId)

  return {
    data: (data ?? []) as Affinity[],
    error,
  }
}


export async function updateAffinityDiscovery(
  affinityId: number,
  discovered: boolean
) {
  const { error } = await supabase
    .from("shadow_affinities")
    .update({ discovered })
    .eq("id", affinityId)

  return error
}

export async function revealAffinityForShadow(
    shadowId: number,
    element: AffinityElement
) {
    const { error } = await supabase
        .from("shadow_affinities")
        .update({ discovered: true })
        .eq("shadow_id", shadowId)
        .eq("element", element)

    return error
}

export async function updateAffinityValue(
  affinityId: number,
  value: AffinityValue
) {
  const { error } = await supabase
    .from("shadow_affinities")
    .update({ value })
    .eq("id", affinityId)

  return error
}
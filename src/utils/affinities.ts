import type {
    Affinity,
    AffinityElement,
    Shadow,
    SkillAffinity,
} from "../types"


export const AFFINITY_ORDER = [
  "melee",
  "ranged",
  "fire",
  "ice",
  "wind",
  "electric",
  "psychic",
  "nuclear",
  "bless",
  "curse",
] as const

export const AFFINITY_GRID_ORDER = [
  [
    "melee",
    "fire",
    "ice",
    "wind",
    "electric",
  ],
  [
    "ranged",
    "nuclear",
    "psychic",
    "bless",
    "curse",
  ],
] as const

export function getAffinity(
    affinities: Affinity[],
    element: AffinityElement
) {
    return affinities.find(
        (affinity) =>
            affinity.element === element
    )
}

export function getOffensiveAffinities(
    shadow: Shadow
): SkillAffinity[] {
    const affinities = shadow.shadow_skills
        .flatMap((link) => link.skills)
        .map((skill) => skill.affinity)
        .filter(
            (affinity): affinity is SkillAffinity =>
                affinity !== null
        )

    return [...new Set(affinities)]
}

export function sortAffinities<T extends string>(
  affinities: T[]
) {
  return affinities.toSorted(
    (a, b) =>
      AFFINITY_ORDER.indexOf(a as typeof AFFINITY_ORDER[number]) -
      AFFINITY_ORDER.indexOf(b as typeof AFFINITY_ORDER[number])
  )
}

export function getWeaknesses(
    shadow: Shadow
): SkillAffinity[] {
    return shadow.shadow_affinities
        .filter(
            (affinity) =>
                affinity.value === "weak"
        )
        .map(
            (affinity) =>
                affinity.element
        )
}
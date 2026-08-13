import type {
    AffinityElement,
    AffinityValue,
} from "../types"


export const AFFINITY_ORDER: AffinityElement[] = [
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


export const AFFINITY_GRID_ORDER: AffinityElement[][] = [
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
]


export const AFFINITY_LABELS: Record<
    AffinityElement,
    string
> = {
    melee: "Melee",
    ranged: "Ranged",
    fire: "Fire",
    ice: "Ice",
    wind: "Wind",
    electric: "Electric",
    psychic: "Psychic",
    nuclear: "Nuclear",
    bless: "Bless",
    curse: "Curse",
}


export const AFFINITY_VALUES: AffinityValue[] = [
    "weak",
    "neutral",
    "resist",
    "null",
    "reflect",
    "drain",
]
export type Shadow = {
  id: number
  name: string
  level: number | null
  max_hp: number
  armor: number | null
  arcana: string | null
  loot_item: string | null
  shadow_stats: ShadowStats[]
  shadow_affinities: Affinity[]
  shadow_skills: {
    skills: Skill[]
  }[]
}

export type ShadowStats = {
    id: number
    shadow_id: number
    strength: number
    agility: number
    endurance: number
    magic: number
}

export type Affinity = {
  id: number
  shadow_id: number
  element: AffinityElement
  value: AffinityValue
  discovered: boolean
}

export type AffinityElement =
  | "melee"
  | "ranged"
  | "fire"
  | "ice"
  | "wind"
  | "electric"
  | "psychic"
  | "nuclear"
  | "bless"
  | "curse"

export type SkillAffinity =
  | AffinityElement
  | "almighty"

export type AffinityValue =
  | "weak"
  | "neutral"
  | "resist"
  | "null"
  | "reflect"
  | "drain"

export type Combatant = {
  id: number
  shadow_id: number | null
  player_id: number | null
  display_name: string
  initiative: number | null
  combatant_type: "shadow" | "player"
  hp: number | null
  max_hp: number | null
  position: number
  is_current_turn: boolean
  downed: boolean
  condition_id: number | null
  condition: {
    id: number
    name: string
    description: string
  } | null
}

export type Player = {
  id: number
  name: string
  in_initiative: boolean
}

export type Skill = {
  id: number
  name: string
  type: "skill" | "active" | "passive"
  affinity: SkillAffinity | null
  description: string | null
  cooldown: string | null
  uses_stat: "strength" | "agility" | "endurance" | "magic" | null
  is_unique: boolean
}

export type UpdatedShadow = {
  id: number
  name: string
  level: number | null
  armor: number | null
  arcana: string | null
  loot_item: string | null
}
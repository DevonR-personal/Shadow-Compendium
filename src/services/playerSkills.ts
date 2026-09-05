import { supabase } from "../supabase"
import type { PlayerSkill, Skill } from "../types"

type PlayerSkillLink = Omit<PlayerSkill, "skill">

export async function getPlayerSkills(playerId: number) {
    const { data, error } = await supabase
        .from("player_skills")
        .select("id, player_id, skill_id, sort_order")
        .eq("player_id", playerId)
        .order("sort_order", { ascending: true })

    if (error) {
        return { data: [], error }
    }

    const links = (data ?? []) as PlayerSkillLink[]
    if (links.length === 0) {
        return { data: [], error: null }
    }

    const { data: skills, error: skillsError } = await supabase
        .from("skills")
        .select("id, name, type, affinity, description, cooldown, uses_stat, is_unique")
        .in("id", links.map((entry) => entry.skill_id))

    if (skillsError) {
        return { data: [], error: skillsError }
    }

    const skillMap = new Map((skills ?? []).map((skill) => [skill.id, skill as Skill]))
    const playerSkills = links.flatMap((entry) => {
        const skill = skillMap.get(entry.skill_id)
        return skill ? [{ ...entry, skill }] : []
    })

    return {
        data: playerSkills as PlayerSkill[],
        error,
    }
}

export async function addPlayerSkill(playerId: number, skillId: number) {
    const latest = await supabase
        .from("player_skills")
        .select("sort_order")
        .eq("player_id", playerId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (latest.error) {
        return latest.error
    }

    const nextSortOrder = (latest.data?.sort_order ?? -1) + 1
    const { error } = await supabase
        .from("player_skills")
        .insert({
            player_id: playerId,
            skill_id: skillId,
            sort_order: nextSortOrder,
        })

    return error
}

export async function removePlayerSkill(id: number) {
    const { error } = await supabase
        .from("player_skills")
        .delete()
        .eq("id", id)

    return error
}

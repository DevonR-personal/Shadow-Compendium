import { Fragment, useEffect, useState } from "react"
import type { Player, PlayerSkill, PlayerStats, Weapon } from "../types"
import { getPlayerSkills } from "../services/playerSkills"
import { getPlayerStats } from "../services/playerStats"
import { getWeapons } from "../services/weapons"
import { AFFINITY_LABELS } from "../constants/affinities"
import type { AffinityElement, SkillAffinity } from "../types"

const PLAYER_STATS = [
    ["athleticism", "ATH"],
    ["proficiency", "PRO"],
    ["guts", "GUT"],
    ["knowledge", "KNO"],
    ["charm", "CHA"],
    ["strength", "STR"],
    ["agility", "AGI"],
    ["endurance", "END"],
    ["magic", "MAG"],
] as const satisfies readonly (readonly [keyof PlayerStats, string])[]

function formatModifier(value: number | null | undefined) {
    if (value === null || value === undefined) {
        return "—"
    }

    return value >= 0 ? `+${value}` : `${value}`
}

function getSkillModifier(
    usesStat: string | null,
    stats: PlayerStats | null
) {
    if (!usesStat || !stats) {
        return "—"
    }

    const statKey = usesStat.toLowerCase().replace(/[_ -]/g, "")
    const aliases: Record<string, keyof PlayerStats> = {
        athleticism: "athleticism",
        athletics: "athleticism",
        proficiency: "proficiency",
        guts: "guts",
        knowledge: "knowledge",
        charm: "charm",
        strength: "strength",
        agility: "agility",
        endurance: "endurance",
        magic: "magic",
        luck: "luck",
    }
    const key = aliases[statKey]
    const value = key ? stats[key] : null

    return typeof value === "number" ? formatModifier(value) : "—"
}

function getElementDisplay(element: string | null) {
    if (!element) {
        return null
    }

    const normalizedElement = element.trim().toLowerCase()
    const affinity = (Object.keys(AFFINITY_LABELS) as AffinityElement[])
        .find((candidate) =>
            candidate === normalizedElement ||
            AFFINITY_LABELS[candidate].toLowerCase() === normalizedElement
        )

    if (affinity) {
        return {
            label: AFFINITY_LABELS[affinity],
            image: `/icons/Icon_${AFFINITY_LABELS[affinity]}.png`,
        }
    }

    return {
        label: element,
        image: null,
    }
}

function getSkillElementDisplay(affinity: SkillAffinity | null) {
    return getElementDisplay(affinity)
}

type PlayerDetailsPanelProps = {
    readonly player: Player
}

export default function PlayerDetailsPanel({
    player,
}: PlayerDetailsPanelProps) {
    const [stats, setStats] = useState<PlayerStats | null>(null)
    const [skills, setSkills] = useState<PlayerSkill[]>([])
    const [weapons, setWeapons] = useState<Weapon[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isCurrent = true

        async function loadDetails() {
            setLoading(true)
            setError(null)
            setStats(null)
            setSkills([])
            setWeapons([])

            const weaponIds = [player.weapon1_id, player.weapon2_id]
                .filter((id): id is number => id !== null)
            const [statsResult, skillsResult, weaponsResult] = await Promise.all([
                getPlayerStats(player.id),
                getPlayerSkills(player.id),
                getWeapons(weaponIds),
            ])

            if (!isCurrent) {
                return
            }

            const loadError =
                statsResult.error?.message ??
                skillsResult.error?.message ??
                weaponsResult.error?.message ??
                null

            setError(loadError)
            setStats(statsResult.data)
            setSkills(skillsResult.data)
            setWeapons(weaponIds.flatMap((id) =>
                weaponsResult.data.filter((weapon) => weapon.id === id)
            ))
            setLoading(false)
        }

        void loadDetails()

        return () => {
            isCurrent = false
        }
    }, [player.id, player.weapon1_id, player.weapon2_id])

    return (
        <aside className="shadow-details-panel">
            <header className="shadow-details-header">
                <h2>{player.name}</h2>
                <span className="shadow-details-level">Non-player</span>
            </header>

            {error && <p className="error">{error}</p>}
            {loading ? (
                <p>Loading details...</p>
            ) : (
                <>
                    <section className="shadow-details-section">
                        <h3>Weapons</h3>
                        {weapons.length > 0 ? (
                            <table className="shadow-skill-table player-details-table">
                                <tbody>
                                    {weapons.map((weapon) => (
                                        <Fragment key={weapon.id}>
                                            <tr>
                                                <th scope="row">{weapon.name}</th>
                                                <td>
                                                    <ElementIcon element={getElementDisplay(weapon.element)} />
                                                </td>
                                                <td>
                                                    {getSkillModifier(weapon.uses_stat, stats)}
                                                </td>
                                            </tr>
                                            <tr className="shadow-skill-description">
                                                <td colSpan={3}>
                                                    {weapon.description ?? "No description."}
                                                </td>
                                            </tr>
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No weapons.</p>
                        )}
                    </section>

                    <section className="shadow-details-section">
                        <h3>Skills</h3>
                        {skills.length > 0 ? (
                            <table className="shadow-skill-table player-details-table">
                                <tbody>
                                    {skills.map((entry) => (
                                        <Fragment key={entry.id}>
                                            <tr>
                                                <th scope="row">{entry.skill.name}</th>
                                                <td>
                                                    <ElementIcon
                                                        element={getSkillElementDisplay(
                                                            entry.skill.affinity
                                                        )}
                                                    />
                                                </td>
                                                <td>
                                                    {getSkillModifier(
                                                        entry.skill.uses_stat,
                                                        stats
                                                    )}
                                                </td>
                                            </tr>
                                            <tr className="shadow-skill-description">
                                                <td colSpan={3}>
                                                    {entry.skill.description ?? "No description."}
                                                </td>
                                            </tr>
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No skills.</p>
                        )}
                    </section>

                    <section className="shadow-details-section">
                        <h3>Stats</h3>
                        <div className="shadow-stats player-details-stats">
                            {PLAYER_STATS.map(([key, label]) => (
                                <div className="shadow-stat" key={key}>
                                    <span className="shadow-stat-label">{label}</span>
                                    <span className="shadow-stat-value">
                                        {formatModifier(stats?.[key])}
                                    </span>
                                </div>
                            ))}
                            <div className="shadow-stat">
                                <span className="shadow-stat-label">LUCK</span>
                                <span className="shadow-stat-value">
                                    {stats
                                        ? `${stats.luck}/${stats.max_luck}`
                                        : "—"}
                                </span>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </aside>
    )
}

function ElementIcon({
    element,
}: {
    readonly element: ReturnType<typeof getElementDisplay>
}) {
    if (!element) {
        return <>—</>
    }

    return element.image ? (
        <img
            className="player-reference-affinity"
            src={element.image}
            alt={element.label}
            title={element.label}
        />
    ) : (
        <span>{element.label}</span>
    )
}

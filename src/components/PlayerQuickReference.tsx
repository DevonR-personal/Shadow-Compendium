import { useEffect, useState } from "react"
import type { Player, PlayerSkill, PlayerStats, Skill, Weapon } from "../types"
import { getPlayers } from "../services/players"
import { getPlayerStats, updatePlayerLuck } from "../services/playerStats"
import { getPlayerSkills } from "../services/playerSkills"
import { getWeapons } from "../services/weapons"
import { AFFINITY_LABELS } from "../constants/affinities"

type PlayerQuickReferenceProps = Readonly<{
    readonly onError?: (message: string) => void
}>

type StatKey = keyof Pick<
    PlayerStats,
    "athleticism" | "proficiency" | "guts" | "knowledge" | "charm"
        | "strength" | "agility" | "endurance" | "magic"
>

const STAT_LABELS: Record<StatKey, string> = {
    athleticism: "Athleticism",
    proficiency: "Proficiency",
    guts: "Guts",
    knowledge: "Knowledge",
    charm: "Charm",
    strength: "Strength",
    agility: "Agility",
    endurance: "Endurance",
    magic: "Magic",
}

const SHADOW_DERIVED_STATS = new Set([
    "strength",
    "agility",
    "endurance",
    "magic",
    "luck",
])

function isShadowDerivedStat(statName: string | null) {
    if (!statName) {
        return false
    }

    return SHADOW_DERIVED_STATS.has(
        statName.toLowerCase().replace(/[_ -]/g, "")
    )
}

function formatModifier(value: number | null | undefined) {
    if (value === null || value === undefined) {
        return "—"
    }

    return value >= 0 ? `+${value}` : `${value}`
}

function skillModifier(skill: Skill, stats: PlayerStats | null) {
    if (!stats || !skill.uses_stat) {
        return null
    }

    return getStatValue(skill.uses_stat, stats)
}

function getStatValue(statName: string | null, stats: PlayerStats | null) {
    if (!stats || !statName) {
        return null
    }

    const normalized = statName.toLowerCase().replace(/[_ -]/g, "")
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
    const key = aliases[normalized]
    const value = key ? stats[key] : null

    return typeof value === "number" ? value : null
}

function affinityImage(element: string | null) {
    if (!element) {
        return null
    }

    const label = element.charAt(0).toUpperCase() + element.slice(1)
    return `/icons/Icon_${label}.png`
}

function weaponModifier(weapon: Weapon, stats: PlayerStats | null) {
    if (!stats || !weapon.uses_stat) {
        return null
    }

    return getStatValue(weapon.uses_stat, stats)
}

function WeaponRows({
    weapons,
    stats,
}: {
    readonly weapons: Weapon[]
    readonly stats: PlayerStats | null
}) {
    return (
        <>
            {weapons.map((weapon) => (
                <tbody key={weapon.id}>
                    <tr>
                        <th scope="row">{weapon.name}</th>
                            <td className={isShadowDerivedStat(weapon.uses_stat)
                                ? "shadow-derived-modifier"
                                : ""}>
                                {formatModifier(weaponModifier(weapon, stats))}
                            </td>
                        <td>
                            {affinityImage(weapon.element) ? (
                                <img
                                    className="player-reference-affinity"
                                    src={affinityImage(weapon.element) ?? undefined}
                                    alt={weapon.element ?? ""}
                                />
                            ) : "—"}
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={3}>{weapon.description ?? "No description."}</td>
                    </tr>
                </tbody>
            ))}
        </>
    )
}

function PlayerSkillCards({
    playerSkills,
    stats,
}: {
    readonly playerSkills: PlayerSkill[]
    readonly stats: PlayerStats | null
}) {
    return (
        <>
            {playerSkills.slice(0, 8).map((entry) => {
                const affinity = entry.skill.affinity
                    ? entry.skill.affinity === "almighty"
                        ? "Almighty"
                        : AFFINITY_LABELS[entry.skill.affinity]
                    : null
                const modifier = skillModifier(entry.skill, stats)

                return (
                    <div className="player-skill-card" key={entry.id}>
                        <div className="player-skill-card-summary">
                            <strong>{entry.skill.name}</strong>
                            <span>
                                {affinityImage(entry.skill.affinity) ? (
                                    <img
                                        className="player-reference-affinity"
                                        src={affinityImage(entry.skill.affinity) ?? undefined}
                                        alt={affinity ?? ""}
                                    />
                                ) : "—"}
                            </span>
                            <span className={isShadowDerivedStat(entry.skill.uses_stat)
                                ? "shadow-derived-modifier"
                                : ""}>
                                {formatModifier(modifier)}
                            </span>
                        </div>
                        <div className="player-skill-card-description">
                            {entry.skill.description ?? "No description."}
                        </div>
                    </div>
                )
            })}
        </>
    )
}

export default function PlayerQuickReference({
    onError,
}: PlayerQuickReferenceProps) {
    const [players, setPlayers] = useState<Player[]>([])
    const [selectedPlayerId, setSelectedPlayerId] = useState<number | "">("")
    const [stats, setStats] = useState<PlayerStats | null>(null)
    const [playerSkills, setPlayerSkills] = useState<PlayerSkill[]>([])
    const [weapons, setWeapons] = useState<Weapon[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        async function loadPlayers() {
            const result = await getPlayers()
            if (result.error) {
                setLoadError(result.error.message)
                onError?.(result.error.message)
                setLoading(false)
                return
            }

            const activePlayers = result.data.filter((player) => player.in_initiative)
            setPlayers(activePlayers)
            setSelectedPlayerId((current) =>
                current !== "" && activePlayers.some((player) => player.id === current)
                    ? current
                    : activePlayers[0]?.id ?? ""
            )
            setLoading(false)
        }

        void loadPlayers()
    }, [onError])

    useEffect(() => {
        if (selectedPlayerId === "") {
            setStats(null)
            setPlayerSkills([])
            setWeapons([])
            return
        }

        const playerId = selectedPlayerId

        async function loadPlayerReference() {
            const [statsResult, skillsResult] = await Promise.all([
                getPlayerStats(playerId),
                getPlayerSkills(playerId),
            ])
            const player = players.find((entry) => entry.id === playerId)
            const weaponIds = [player?.weapon1_id, player?.weapon2_id]
                .filter((id): id is number => id !== null && id !== undefined)
            const weaponsResult = await getWeapons(weaponIds)

            if (statsResult.error) {
                setLoadError(statsResult.error.message)
                onError?.(statsResult.error.message)
            }
            if (skillsResult.error) {
                setLoadError(skillsResult.error.message)
                onError?.(skillsResult.error.message)
            }
            if (weaponsResult.error) {
                setLoadError(weaponsResult.error.message)
                onError?.(weaponsResult.error.message)
            }

            setStats(statsResult.data)
            setPlayerSkills(skillsResult.data)
            setWeapons(weaponIds.flatMap((id) =>
                weaponsResult.data.filter((weapon) => weapon.id === id)
            ))
        }

        void loadPlayerReference()
    }, [onError, players, selectedPlayerId])

    const selectedPlayer = players.find((player) => player.id === selectedPlayerId)
    const currentLuck = stats?.luck ?? 0
    const maximumLuck = stats?.max_luck ?? 0

    async function changeLuck(delta: number) {
        if (!stats || selectedPlayerId === "" || stats.max_luck <= 0) {
            return
        }

        const nextLuck = Math.max(0, Math.min(stats.max_luck, stats.luck + delta))
        if (nextLuck === stats.luck) {
            return
        }

        const error = await updatePlayerLuck(selectedPlayerId, nextLuck)
        if (error) {
            setLoadError(error.message)
            return
        }

        setStats({ ...stats, luck: nextLuck })
    }

    if (loading || players.length === 0) {
        return null
    }

    return (
        <section className="player-quick-reference">
            <div className="player-quick-reference-header">
                <h2>{selectedPlayer?.name}</h2>
                <select
                    value={selectedPlayerId}
                    onChange={(event) => setSelectedPlayerId(Number(event.target.value))}
                    aria-label="Choose active player"
                >
                    {players.map((player) => (
                        <option key={player.id} value={player.id}>
                            {player.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="player-stat-strip">
                {Object.entries(STAT_LABELS).map(([key, label]) => (
                    <div key={key}>
                        <span>{label}</span>
                        <strong className={isShadowDerivedStat(key)
                            ? "shadow-derived-modifier"
                            : ""}>
                            {formatModifier(stats?.[key as StatKey])}
                        </strong>
                    </div>
                ))}
                <div>
                    <span>Luck</span>
                    <div className="player-luck-control">
                        {maximumLuck > 0 && (
                            <button
                                type="button"
                                onClick={() => void changeLuck(-1)}
                                disabled={currentLuck <= 0}
                                aria-label="Decrease luck"
                            >
                                −
                            </button>
                        )}
                        <strong className="shadow-derived-modifier">
                            {stats ? `${stats.luck}/${stats.max_luck}` : "—"}
                        </strong>
                        {maximumLuck > 0 && (
                            <button
                                type="button"
                                onClick={() => void changeLuck(1)}
                                disabled={currentLuck >= maximumLuck}
                                aria-label="Increase luck"
                            >
                                +
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loadError && <p className="player-reference-error">{loadError}</p>}

            <div className="player-quick-reference-tables">
                <table className="player-weapon-table">
                    <WeaponRows weapons={weapons} stats={stats} />
                </table>

                <div className="player-skill-reference-grid">
                    <PlayerSkillCards playerSkills={playerSkills} stats={stats} />
                </div>
            </div>
        </section>
    )
}

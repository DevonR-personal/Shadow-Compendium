import { useEffect, useState } from "react"
import {
    getCombatants,
    removeCombatant,
    updateCombatant,
    updateCombatantDowned,
    updateCombatantCondition
} from "../services/combatants"
import type { Combatant, Shadow } from "../types"
import { supabase } from "../supabase"
import AffinityGrid from "../components/AffinityGrid"
import { AFFINITY_ORDER } from "../utils/affinities"
import HealthBar from "../components/HealthBar"
import { getConditions } from "../services/conditions"

type EncounterPageProps = Readonly<{
    shadows: Shadow[]
    playerView: boolean
    onRefreshShadows: () => Promise<void>
    onSelectShadow: (shadow: Shadow) => void
}>

export default function EncounterPage({
    shadows,
    playerView,
    onRefreshShadows,
    onSelectShadow,
}: Readonly<EncounterPageProps>) {
    const [combatants, setCombatants] = useState<Combatant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [conditions, setConditions] = useState<
        Awaited<ReturnType<typeof getConditions>>["data"]
    >([])

    const shadowMap = new Map(
        shadows.map((shadow) => [
            shadow.id,
            shadow,
        ])
    )

    async function loadData() {
        const result = await getCombatants()

        if (result.error) {
            console.error(result.error)
            setError(result.error.message)
        } else {
            setCombatants(result.data)
            setError(null)
        }

        setLoading(false)
    }

    useEffect(() => {
        void loadData()

        void getConditions().then((result) => {
            if (result.error) {
                console.error(result.error)
                return
            }

            setConditions(result.data)
        })

        const combatantsChannel = supabase
            .channel("combatants")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "combatants",
                },
                () => {
                    void loadData()
                }
            )
            .subscribe()

        const affinitiesChannel = supabase
            .channel("shadow-affinities")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "shadow_affinities",
                },
                () => {
                    void onRefreshShadows()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(combatantsChannel)
            supabase.removeChannel(affinitiesChannel)
        }
    }, [])

    useEffect(() => {
        const currentCombatant =
            combatants.find(
                (combatant) =>
                    combatant.is_current_turn
            )

        if (
            currentCombatant?.combatant_type !== "shadow" ||
            currentCombatant.shadow_id === null
        ) {
            return
        }

        const shadow =
            shadowMap.get(
                currentCombatant.shadow_id
            )

        if (shadow) {
            onSelectShadow?.(shadow)
        }
    }, [combatants, shadows, onSelectShadow])

    async function handleRemoveCombatant(
        id: number
    ) {
        const error = await removeCombatant(id)

        if (error) {
            console.error(error)
            setError(error.message)
        }
    }

    if (loading) {
        return <p>Loading encounter...</p>
    }

    if (error) {
        return (
            <pre>
                {JSON.stringify(error, null, 2)}
            </pre>
        )
    }

    async function handleDamage(
        combatant: Combatant
    ) {
        const amount = window.prompt(
            `Damage ${combatant.display_name} for how much?`
        )

        if (!amount) {
            return
        }

        const damage = Number(amount)

        if (Number.isNaN(damage)) {
            return
        }

        const currentHP =
            combatant.hp ?? 0

        const newHP = Math.min(
            combatant.max_hp ?? currentHP,
            Math.max(
                0,
                currentHP - damage
            )
        )

        const error =
            await updateCombatant(
                combatant.id,
                { hp: newHP }
            )

        if (error) {
            console.error(error)
            setError(error.message)
        }
    }

    async function handleToggleDowned(
        combatant: Combatant
    ) {
        try {
            await updateCombatantDowned(
                combatant.id,
                !combatant.downed
            )
        } catch (error) {
            console.error(error)

            if (error instanceof Error) {
                setError(error.message)
            }
        }
    }

    async function handleConditionChange(
        combatant: Combatant,
        value: string
    ) {
        const conditionId =
            value === ""
                ? null
                : Number(value)

        try {
            await updateCombatantCondition(
                combatant.id,
                conditionId
            )
        } catch (error) {
            console.error(error)

            if (error instanceof Error) {
                setError(error.message)
            }
        }
    }

    return (
        <main className="app">
            {combatants.length === 0 ? (
                <p>No combatants.</p>
            ) : (
                <div className="combatant-list">

                    <div
                        className={
                            playerView
                                ? "combatant-header player-combatant-header"
                                : "combatant-header gm-combatant-header"
                        }
                    >
                        <span>INIT</span>
                        <span>NAME</span>
                        <span>STATUS</span>
                        {AFFINITY_ORDER.map((affinity) => (
                            <span
                                key={affinity}
                                className={`affinity-header ${affinity}`}
                            />
                        ))}
                        <span></span>
                    </div>

                    {combatants.map((combatant) => {
                        const shadow = combatant.shadow_id
                            ? shadowMap.get(combatant.shadow_id)
                            : undefined

                        return (
                            <div
                                className={[
                                    "combatant-row",
                                    playerView
                                        ? "player-combatant-row"
                                        : "gm-combatant-row",
                                    combatant.is_current_turn
                                        ? "current-turn"
                                        : "",
                                ].join(" ")}
                                key={combatant.id}
                            >
                                <span className="combatant-init">
                                    {combatant.initiative ?? 0}
                                </span>

                                {combatant.combatant_type === "shadow" &&
                                    shadow ? (
                                    <button
                                        type="button"
                                        className="combatant-name-button"
                                        onClick={() => onSelectShadow(shadow)}
                                    >
                                        {combatant.display_name}
                                    </button>
                                ) : (
                                    <span>
                                        {combatant.display_name}
                                    </span>
                                )}

                                <span className="combatant-status">
                                    {!playerView ? (
                                        <div className="status-controls">

                                            <select
                                                className="condition-select"
                                                value={
                                                    combatant.condition_id ?? ""
                                                }
                                                onChange={(event) =>
                                                    handleConditionChange(
                                                        combatant,
                                                        event.target.value
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    —
                                                </option>

                                                {conditions.map((condition) => (
                                                    <option
                                                        key={condition.id}
                                                        value={condition.id}
                                                    >
                                                        {condition.name}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                className={
                                                    combatant.downed
                                                        ? "downed-toggle active"
                                                        : "downed-toggle"
                                                }
                                                onClick={() =>
                                                    handleToggleDowned(combatant)
                                                }
                                            >
                                                {combatant.downed
                                                    ? "Downed!"
                                                    : "Down"}
                                            </button>

                                        </div>
                                    ) : (
                                        <div className="status-display">

                                            {combatant.downed && (
                                                <span className="downed-label">
                                                    DOWNED!
                                                </span>
                                            )}

                                            {combatant.condition && (
                                                <span className="condition-label">
                                                    {combatant.condition.name}
                                                </span>
                                            )}

                                        </div>
                                    )}
                                </span>

                                {combatant.combatant_type === "shadow" &&
                                    shadow ? (
                                    playerView ? (
                                        <AffinityGrid
                                            affinities={
                                                shadow.shadow_affinities
                                            }
                                            revealHiddenValues={false}
                                        />
                                    ) : (
                                        <div className="gm-affinity-spacer" />
                                    )
                                ) : (
                                    <div className="player-affinity-spacer" />
                                )}

                                {playerView ? (
                                    <HealthBar
                                        hp={combatant.hp}
                                        maxHp={combatant.max_hp}
                                    />
                                ) : (
                                    <button
                                        className="combatant-hp"
                                        type="button"
                                        onClick={() =>
                                            handleDamage(combatant)
                                        }
                                    >
                                        {combatant.hp ?? "-"}
                                        /
                                        {combatant.max_hp ?? "-"}
                                    </button>
                                )}

                                {!playerView && (
                                    <button
                                        className="remove-button"
                                        type="button"
                                        onClick={() =>
                                            handleRemoveCombatant(combatant.id)
                                        }
                                    >
                                        x
                                    </button>
                                )}
                            </div>
                        )
                    })}

                </div>
            )}
        </main>
    )
}
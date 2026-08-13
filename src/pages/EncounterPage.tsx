import { useEffect, useState } from "react"
import {
    getCombatants,
    removeCombatant,
    updateCombatant,
    nextTurn,
} from "../services/combatants"
import type { Combatant, Shadow } from "../types"
import { supabase } from "../supabase"
import AffinityGrid from "../components/AffinityGrid"
import { AFFINITY_ORDER } from "../utils/affinities"
import HealthBar from "../components/HealthBar"

type EncounterPageProps = Readonly<{
    shadows: Shadow[]
    playerView: boolean
    onRefreshShadows: () => Promise<void>
}>

export default function EncounterPage({
    shadows,
    playerView,
    onRefreshShadows,
}: Readonly<EncounterPageProps>) {
    const [combatants, setCombatants] = useState<Combatant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    async function handleNextTurn() {
        const error = await nextTurn()

        if (error) {
            console.error(error)
            setError(error.message)
        }
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

    return (
        <main className="app">
            <h1>Current Encounter</h1>

            {!playerView && (
                <button
                    type="button"
                    onClick={handleNextTurn}
                >
                    Next Turn
                </button>
            )}

            {combatants.length === 0 ? (
                <p>No combatants.</p>
            ) : (
                <div className="combatant-list">

                    <div className="combatant-header">
                        <span>INIT</span>
                        <span>NAME</span>
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
                                className={
                                    combatant.is_current_turn
                                        ? "combatant-row current-turn"
                                        : "combatant-row"
                                }
                                key={combatant.id}
                            >
                                <span className="combatant-init">
                                    {combatant.initiative ?? 0}
                                </span>

                                <span>
                                    {combatant.display_name}
                                </span>

                                {combatant.combatant_type === "shadow" &&
                                    shadow ? (
                                    <AffinityGrid
                                        affinities={
                                            shadow.shadow_affinities
                                        }
                                        revealHiddenValues={!playerView}
                                    />
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
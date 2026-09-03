import { useEffect, useState } from "react"
import {
    getCombatants,
    getCombatLoot,
    removeCombatant,
    updateCombatant,
    updateCombatantDowned,
    updateCombatantCondition
} from "../services/combatants"
import type { Combatant, Shadow } from "../types"
import { supabase } from "../supabase"
import { AFFINITY_ORDER } from "../utils/affinities"
import { getConditions } from "../services/conditions"
import CombatLootBar from "../components/CombatLootBar"
import CombatantRow from "../components/CombatantRow"

type EncounterPageProps = Readonly<{
    shadows: Shadow[]
    playerView: boolean
    onRefreshShadows: () => Promise<void>
    onSelectShadow: (shadow: Shadow) => void
    lootYen: number
    lootItems: string[]
    onCombatLootChange: (loot: {
        yen: number
        items: string[]
    }) => void
}>

export default function EncounterPage({
    shadows,
    playerView,
    onRefreshShadows,
    onSelectShadow,
    lootYen,
    lootItems,
    onCombatLootChange,
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

    useEffect(() => {
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

        async function loadCombatLoot() {
            const result = await getCombatLoot()

            if (result.error) {
                console.error(result.error)
                return
            }

            onCombatLootChange({
                yen: result.yen,
                items: result.items,
            })
        }

        void loadData()
        void loadCombatLoot()

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

        const combatStateChannel = supabase
            .channel("encounter-combat-state")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "combat_state",
                },
                () => {
                    void loadCombatLoot()
                }
            )
            .subscribe()

        const lootRefreshInterval = window.setInterval(() => {
            void loadCombatLoot()
        }, 2000)

        return () => {
            supabase.removeChannel(combatantsChannel)
            supabase.removeChannel(affinitiesChannel)
            supabase.removeChannel(combatStateChannel)
            window.clearInterval(lootRefreshInterval)
        }
    }, [onCombatLootChange, onRefreshShadows])

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

        const shadow = shadows.find(
            (item) => item.id === currentCombatant.shadow_id
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

        const shadow =
            combatant.combatant_type === "shadow" &&
                combatant.shadow_id !== null
                ? shadowMap.get(combatant.shadow_id)
                : undefined

        const armor =
            shadow?.armor ?? 0

        const actualDamage =
            combatant.combatant_type === "shadow"
                ? Math.max(1, damage - armor)
                : damage

        const currentHP =
            combatant.hp ?? 0

        const newHP = Math.min(
            combatant.max_hp ?? currentHP,
            Math.max(
                0,
                currentHP - actualDamage
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

                    {combatants.map((combatant) => (
                        <CombatantRow
                            key={combatant.id}
                            combatant={combatant}
                            shadow={combatant.shadow_id
                                ? shadowMap.get(combatant.shadow_id)
                                : undefined}
                            playerView={playerView}
                            conditions={conditions}
                            onSelectShadow={onSelectShadow}
                            onDamage={handleDamage}
                            onToggleDowned={handleToggleDowned}
                            onConditionChange={handleConditionChange}
                            onRemove={handleRemoveCombatant}
                        />
                    ))}

                </div>
            )}
            <CombatLootBar
                yen={lootYen}
                items={lootItems}
            />
        </main>
    )
}
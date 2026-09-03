import { useEffect, useState } from "react"
import {
    getCombatants,
    getCombatLoot,
    getCombatActive,
    removeCombatant,
    updateCombatant,
    updateCombatantDowned,
    updateCombatantCondition
} from "../services/combatants"
import type { Combatant, Shadow } from "../types"
import { supabase } from "../supabase"
import { AFFINITY_ORDER } from "../constants/affinities"
import { getConditions } from "../services/conditions"
import CombatLootBar from "../components/CombatLootBar"
import CombatantRow from "../components/CombatantRow"
import type { TurnHighlights } from "../utils/turnHighlights"
import {
    applyModifierDelta,
    type ModifierKey,
} from "../utils/modifiers"

type EncounterPageProps = Readonly<{
    shadows: Shadow[]
    playerView: boolean
    onRefreshShadows: () => Promise<void>
    onSelectShadow: (shadow: Shadow, combatant?: Combatant) => void
    lootYen: number
    lootItems: string[]
    onCombatLootChange: (loot: {
        yen: number
        items: string[]
    }) => void
    highlightedPlayerCombatantId: TurnHighlights["playerCombatantId"]
}>

export default function EncounterPage({
    shadows,
    playerView,
    onRefreshShadows,
    onSelectShadow,
    lootYen,
    lootItems,
    onCombatLootChange,
    highlightedPlayerCombatantId,
}: Readonly<EncounterPageProps>) {
    const [combatants, setCombatants] = useState<Combatant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [turnNumber, setTurnNumber] = useState(0)
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

        async function loadCombatState() {
            const result = await getCombatActive()

            if (result.error) {
                console.error(result.error)
                return
            }

            setTurnNumber(result.turnNumber)
        }

        void loadData()
        void loadCombatLoot()
        void loadCombatState()

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
                    void loadCombatState()
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
            onSelectShadow?.(shadow, currentCombatant)
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

        if (!Number.isFinite(damage) || damage === 0) {
            return
        }

        const isHealing = damage < 0
        const magnitude = Math.abs(damage)

        const shadow =
            combatant.combatant_type === "shadow" &&
                combatant.shadow_id !== null
                ? shadowMap.get(combatant.shadow_id)
                : undefined

        const armor =
            shadow?.armor ?? 0

        const actualDamage =
            combatant.combatant_type === "shadow" && !isHealing
                ? Math.max(1, magnitude - armor)
                : magnitude

        const currentHP =
            combatant.hp ?? 0

        const nextHP = isHealing
            ? Math.min(
                combatant.max_hp ?? currentHP,
                Math.max(
                    0,
                    currentHP + actualDamage
                )
            )
            : Math.min(
                combatant.max_hp ?? currentHP,
                Math.max(
                    0,
                    currentHP - actualDamage
                )
            )

        const error =
            await updateCombatant(
                combatant.id,
                { hp: nextHP }
            )

        if (error) {
            console.error(error)
            setError(error.message)
        }
    }

    async function handleToggleDowned(
        combatant: Combatant
    ) {
        const error = await updateCombatantDowned(
            combatant.id,
            !combatant.downed
        )

        if (error) {
            console.error(error)
            setError(error.message)
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

        const error = await updateCombatantCondition(
            combatant.id,
            conditionId
        )

        if (error) {
            console.error(error)
            setError(error.message)
        }
    }

    async function handleModifierChange(
        combatant: Combatant,
        key: ModifierKey,
        value: number
    ) {
        const nextValue = applyModifierDelta(value, 0, key)
        const turnKey = `${key}_turns` as const
        const nextTurns = nextValue === 0 ? 0 : 3

        const updates: Parameters<typeof updateCombatant>[1] = {
            [key]: nextValue,
            [turnKey]: nextTurns,
        }

        const error = await updateCombatant(
            combatant.id,
            updates
        )

        if (error) {
            console.error(error)
            setError(error.message)
        }
    }

    return (
        <main className={playerView ? "app player-app" : "app"}>
            {playerView && (
                <div className="player-turn-number">
                    Turn Number: {turnNumber}
                </div>
            )}
            {combatants.length === 0 ? (
                <p>No combatants.</p>
            ) : (
                <div
                    className={playerView
                        ? "combatant-list player-combatant-list"
                        : "combatant-list gm-combatant-list"}
                >

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
                        <span>Dam</span>
                        <span>Arm</span>
                        <span>Acc</span>
                        <span />
                        {playerView && AFFINITY_ORDER.map((affinity) => (
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
                            onModifierChange={handleModifierChange}
                            onRemove={handleRemoveCombatant}
                            highlighted={
                                combatant.id === highlightedPlayerCombatantId
                            }
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
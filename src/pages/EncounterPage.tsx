import { useCallback, useEffect, useRef, useState } from "react"
import {
    getCombatants,
    getCombatLoot,
    getCombatActive,
    removeCombatant,
    updateCombatant,
    updateCombatantDowned,
    updateCombatantCondition
} from "../services/combatants"
import type { AffinityElement, Combatant, Shadow } from "../types"
import { supabase } from "../supabase"
import { AFFINITY_LABELS, AFFINITY_ORDER } from "../constants/affinities"
import { getConditions } from "../services/conditions"
import CombatLootBar from "../components/CombatLootBar"
import CombatantRow from "../components/CombatantRow"
import PlayerQuickReference from "../components/PlayerQuickReference"
import WeaknessCutin from "../components/WeaknessCutin"
import DamageDialog from "../components/DamageDialog"
import type { TurnHighlights } from "../utils/turnHighlights"
import { updateAffinityDiscovery } from "../services/affinities"
import { getAffinity } from "../utils/affinities"
import { formatDamageLog } from "../utils/combatLog"
import {
    applyDamageOutcomeToHitPoints,
    resolveDamage,
    type DamageType,
} from "../utils/damageResolution"
import {
    applyModifierDelta,
    type ModifierKey,
} from "../utils/modifiers"

type EncounterPageProps = Readonly<{
    shadows: Shadow[]
    playerView: boolean
    onRefreshShadows: () => Promise<void>
    onSelectShadow: (shadow: Shadow, combatant?: Combatant) => void
    onSyncSelectedShadow?: (shadow: Shadow, combatant: Combatant) => void
    onDamageLogged?: (text: string) => void
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
    onSyncSelectedShadow,
    onDamageLogged,
    lootYen,
    lootItems,
    onCombatLootChange,
    highlightedPlayerCombatantId,
}: Readonly<EncounterPageProps>) {
    const [combatants, setCombatants] = useState<Combatant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [turnNumber, setTurnNumber] = useState(0)
    const [cutinPlayToken, setCutinPlayToken] = useState(0)
    const [cutinPlaying, setCutinPlaying] = useState(false)
    const [cutinCharacter, setCutinCharacter] = useState<"Wiz" | "Nik">("Wiz")
    const [damageTarget, setDamageTarget] = useState<Combatant | null>(null)
    const [combatNotice, setCombatNotice] = useState<{ id: string; message: string } | null>(null)
    const cutinChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const cutinBroadcastRef = useRef<BroadcastChannel | null>(null)
    const lastCutinEventRef = useRef<string | null>(null)
    const noticeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const noticeBroadcastRef = useRef<BroadcastChannel | null>(null)
    const seenNoticeIdsRef = useRef(new Set<string>())
    const finishCutin = useCallback(() => {
        setCutinPlaying(false)
    }, [])
    const playCutinEvent = useCallback((eventId: string, character: "Wiz" | "Nik") => {
        if (lastCutinEventRef.current === eventId) return
        lastCutinEventRef.current = eventId
        setCutinCharacter(character)
        setCutinPlayToken((token) => token + 1)
        setCutinPlaying(true)
    }, [])
    const receiveCombatNotice = useCallback((id: string, message: string) => {
        if (seenNoticeIdsRef.current.has(id)) return
        seenNoticeIdsRef.current.add(id)
        setCombatNotice({ id, message })
    }, [])
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
            void supabase.removeChannel(combatantsChannel)
            void supabase.removeChannel(affinitiesChannel)
            void supabase.removeChannel(combatStateChannel)
            window.clearInterval(lootRefreshInterval)
        }
    }, [onCombatLootChange, onRefreshShadows])

    useEffect(() => {
        const localBroadcast = new BroadcastChannel("shadow-tracker-weakness-cutin")
        localBroadcast.onmessage = (event: MessageEvent<{ eventId?: string; character?: "Wiz" | "Nik" }>) => {
            if (event.data.eventId) {
                playCutinEvent(event.data.eventId, event.data.character ?? "Wiz")
            }
        }
        cutinBroadcastRef.current = localBroadcast

        const cutinChannel = supabase
            .channel("encounter-weakness-cutin", {
                config: { broadcast: { self: false } },
            })
            .on("broadcast", { event: "play" }, (message) => {
                const eventId = message.payload?.eventId
                const character = message.payload?.character === "Nik" ? "Nik" : "Wiz"
                if (typeof eventId === "string") playCutinEvent(eventId, character)
            })
            .subscribe()

        cutinChannelRef.current = cutinChannel

        return () => {
            cutinChannelRef.current = null
            cutinBroadcastRef.current = null
            localBroadcast.close()
            void supabase.removeChannel(cutinChannel)
        }
    }, [playCutinEvent])

    useEffect(() => {
        const localNoticeBroadcast = new BroadcastChannel("shadow-tracker-combat-notices")
        localNoticeBroadcast.onmessage = (
            event: MessageEvent<{ id?: string; message?: string }>
        ) => {
            if (event.data.id && event.data.message) {
                receiveCombatNotice(event.data.id, event.data.message)
            }
        }
        noticeBroadcastRef.current = localNoticeBroadcast

        const noticeChannel = supabase
            .channel("encounter-combat-notices", {
                config: { broadcast: { self: false } },
            })
            .on("broadcast", { event: "reflect" }, (event) => {
                const id = event.payload?.id
                const message = event.payload?.message
                if (typeof id === "string" && typeof message === "string") {
                    receiveCombatNotice(id, message)
                }
            })
            .subscribe()

        noticeChannelRef.current = noticeChannel

        return () => {
            noticeBroadcastRef.current = null
            noticeChannelRef.current = null
            localNoticeBroadcast.close()
            void supabase.removeChannel(noticeChannel)
        }
    }, [receiveCombatNotice])

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
            onSyncSelectedShadow?.(shadow, currentCombatant)
        }
    }, [combatants, shadows, onSyncSelectedShadow])

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

    function handleDamage(combatant: Combatant) {
        setDamageTarget(combatant)
    }

    async function handleDamageConfirm(
        enteredAmount: number,
        damageType: DamageType,
        sourceId: number | null,
    ) {
        if (!damageTarget) return
        const target = damageTarget
        const shadow = getTargetShadow(target, shadowMap)
        const element = damageType && damageType !== "heal" ? damageType : null
        const affinity = getTargetAffinity(shadow, element)
        const outcome = resolveDamage(
            enteredAmount,
            damageType,
            affinity?.value ?? null,
            shadow?.armor ?? 0,
        )
        const maximumHp = Math.max(0, target.max_hp ?? target.hp ?? 0)
        const currentHp = Math.max(0, Math.min(maximumHp, target.hp ?? 0))
        const nextHp = applyDamageOutcomeToHitPoints(currentHp, maximumHp, outcome)

        if (nextHp !== currentHp) {
            const error = await updateCombatant(target.id, { hp: nextHp })
            if (error) {
                setError(error.message)
                return
            }
        }

        const revealsHiddenAffinity = Boolean(enteredAmount > 0 && shadow && affinity && !affinity.discovered)
        if (revealsHiddenAffinity && affinity) {
            const revealError = await updateAffinityDiscovery(affinity.id, true)
            if (revealError) {
                setError(revealError.message)
                return
            }
            void onRefreshShadows()
        }

        const sourceCombatant = combatants.find((combatant) => combatant.id === sourceId)
        onDamageLogged?.(formatDamageLog({
            source: sourceCombatant?.display_name ?? null,
            target: target.display_name,
            outcome,
            damageType,
            affinity: affinity?.value ?? null,
        }))

        if (outcome.kind === "reflect" && element) {
            broadcastReflectNotice(
                `${outcome.amount} ${AFFINITY_LABELS[element]} damage was reflected!`,
            )
        }

        if (
            revealsHiddenAffinity && affinity?.value === "weak" &&
            outcome.kind === "damage" && outcome.amount > 0 &&
            sourceCombatant?.combatant_type === "player"
        ) {
            triggerWeaknessCutin(getCutinCharacter(sourceCombatant))
        }

        setDamageTarget(null)
    }

    function broadcastReflectNotice(message: string) {
        const id = window.crypto.randomUUID()
        receiveCombatNotice(id, message)
        noticeBroadcastRef.current?.postMessage({ id, message })
        void noticeChannelRef.current?.send({
            type: "broadcast",
            event: "reflect",
            payload: { id, message },
        })
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

    function triggerWeaknessCutin(character: "Wiz" | "Nik") {
        const eventId = window.crypto.randomUUID()
        playCutinEvent(eventId, character)
        cutinBroadcastRef.current?.postMessage({ eventId, character })
        void cutinChannelRef.current?.send({
            type: "broadcast",
            event: "play",
            payload: { character, eventId },
        })
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
                        <span />
                        <span>NAME</span>
                        <span />
                        <span className="modifier-header" title="Damage">{"\u2694\uFE0E"}</span>
                        <span className="modifier-header" title="Armor">{"\u{1F6E1}\uFE0E"}</span>
                        <span className="modifier-header" title="Accuracy">{"\u25CE"}</span>
                        <span />
                        {playerView && AFFINITY_ORDER.map((affinity) => (
                            <span
                                key={affinity}
                                className={`affinity-header ${affinity}`}
                            />
                        ))}
                        {playerView ? <span /> : <><span /><span /><span /></>}
                    </div>

                    {combatants.map((combatant, index) => (
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
                            onTriggerCutin={triggerWeaknessCutin}
                            onRemove={handleRemoveCombatant}
                            highlighted={
                                combatant.id === highlightedPlayerCombatantId
                            }
                            stripeIndex={index}
                        />
                    ))}

                </div>
            )}
            {cutinPlaying && (
                <WeaknessCutin
                    playToken={cutinPlayToken}
                    character={cutinCharacter}
                    onFinish={finishCutin}
                />
            )}
            {!playerView && damageTarget && (
                <DamageDialog
                    key={damageTarget.id}
                    combatant={damageTarget}
                    sources={combatants}
                    defaultSourceId={combatants.find((combatant) => combatant.is_current_turn)?.id ?? null}
                    onCancel={() => setDamageTarget(null)}
                    onConfirm={(amount, element, sourceId) => void handleDamageConfirm(amount, element, sourceId)}
                />
            )}
            {playerView && <PlayerQuickReference />}
            <CombatLootBar
                yen={lootYen}
                items={lootItems}
                notice={combatNotice}
            />
        </main>
    )
}

function getTargetShadow(target: Combatant, shadowMap: Map<number, Shadow>) {
    return target.combatant_type === "shadow" && target.shadow_id !== null
        ? shadowMap.get(target.shadow_id)
        : undefined
}

function getTargetAffinity(shadow: Shadow | undefined, element: AffinityElement | null) {
    return shadow && element ? getAffinity(shadow.shadow_affinities, element) : undefined
}

function getCutinCharacter(combatant: Combatant): "Wiz" | "Nik" {
    return combatant.display_name.toLowerCase().includes("nikolas") ? "Nik" : "Wiz"
}
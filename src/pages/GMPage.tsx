import ShadowLibrary from "./ShadowLibrary"
import EncounterPage from "./EncounterPage"
import { useCallback, useRef, useState } from "react"
import type { Combatant, Player, Shadow } from "../types"
import ShadowDetailsPanel from "./ShadowDetailsPanel"
import { updateAffinityDiscovery } from "../services/affinities"
import { damageAllShadowCombatants } from "../services/combatants"
import { useCombatController } from "../hooks/useCombatController"
import type { TurnHighlights } from "../utils/turnHighlights"
import PlayerSkillEditor from "../components/PlayerSkillEditor"
import CombatLog from "../components/CombatLog"
import {
    appendCombatLogEntry,
    formatLootLog,
    type CombatLogEntry,
} from "../utils/combatLog"

type SidePanelTab = "shadows" | "players" | "details"

const SIDE_PANEL_TABS: { id: SidePanelTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "shadows", label: "Shadows" },
    { id: "players", label: "Players" },
]
type GMPageProps = {
    shadows: Shadow[]
    combatLoot: {
        yen: number
        items: string[]
    }
    onCombatLootChange: (loot: {
        yen: number
        items: string[]
    }) => void
    onTurnHighlightsChange: (highlights: TurnHighlights) => void
    highlightedPlayerCombatantId: TurnHighlights["playerCombatantId"]
    highlightedSkillId: TurnHighlights["skillId"]
    loading: boolean
    error: string | null
    onSelectShadow: (shadow: Shadow) => void
    onRefreshShadows: () => Promise<void>
}

export default function GMPage({
    shadows,
    combatLoot,
    onCombatLootChange,
    onTurnHighlightsChange,
    highlightedPlayerCombatantId,
    highlightedSkillId,
    loading,
    error,
    onSelectShadow,
    onRefreshShadows,
}: Readonly<GMPageProps>) {
    const [sideTab, setSideTab] = useState<SidePanelTab>("details")
    const [selectedShadow, setSelectedShadow] =
        useState<Shadow | null>(null)
    const [selectedCombatant, setSelectedCombatant] =
        useState<Combatant | null>(null)
    const [selectedPlayer, setSelectedPlayer] =
        useState<Player | null>(null)
    const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([])
    const syncedCombatantIdRef = useRef<number | null>(null)
    const {
        players,
        playerRolls,
        combatActive,
        turnNumber,
        showInitiativeWindow,
        handleResetCombat,
        handleAddCombatant,
        handleNextTurn,
        handleEndCombat,
        togglePlayerInitiative,
        startInitiative,
        updatePlayerRoll,
        beginCombat,
    } = useCombatController({
        shadows,
        onCombatLootChange,
        onTurnHighlightsChange,
    })

    const addLogEntry = useCallback((kind: CombatLogEntry["kind"], text: string) => {
        setCombatLog((entries) => appendCombatLogEntry(entries, {
            id: window.crypto.randomUUID(),
            kind,
            text,
        }))
    }, [])

    const logDamage = useCallback((text: string) => addLogEntry("damage", text), [addLogEntry])

    const handleShadowClicked = useCallback((shadow: Shadow, combatant?: Combatant) => {
        setSelectedShadow(shadow)
        setSelectedCombatant(combatant ?? null)
        setSideTab("details")
    }, [])

    // Keeps the details data fresh; only a different current combatant changes the tab.
    const handleCurrentShadowSynced = useCallback((shadow: Shadow, combatant: Combatant) => {
        setSelectedShadow(shadow)
        setSelectedCombatant(combatant)
        if (syncedCombatantIdRef.current !== combatant.id) {
            syncedCombatantIdRef.current = combatant.id
            setSideTab("details")
        }
    }, [])

    async function handleBeginCombat() {
        await beginCombat()
        setSideTab("details")
    }

    async function handleNextTurnClick() {
        await handleNextTurn()
        setSideTab("details")
    }

    async function handleEndCombatClick() {
        const loot = await handleEndCombat()

        if (loot && (loot.yen > 0 || loot.items.length > 0)) {
            addLogEntry("loot", formatLootLog(loot))
        }
    }
    async function handleAffinityToggle(
        affinityId: number,
        discovered: boolean
    ) {
        try {
            const error = await updateAffinityDiscovery(
                affinityId,
                discovered
            )

            if (error) {
                throw error
            }

            setSelectedShadow((current) =>
                current
                    ? {
                        ...current,
                        shadow_affinities:
                            current.shadow_affinities.map((affinity) =>
                                affinity.id === affinityId
                                    ? { ...affinity, discovered }
                                    : affinity
                            ),
                    }
                    : current
            )

            await onRefreshShadows()
        } catch (error) {
            console.error(error)
        }
    }

    async function handleAllOutAttack() {
        const amount = window.prompt("Damage all shadows for how much?")
        const damage = amount === null ? Number.NaN : Number(amount)

        if (!Number.isFinite(damage) || damage <= 0) {
            return
        }

        const error = await damageAllShadowCombatants(damage, shadows)

        if (error) {
            console.error(error)
            return
        }

        addLogEntry("damage", `All-Out Attack dealt ${damage} damage to all shadows`)
    }

    return (
        <main className="gm-layout">

            <section className="gm-combat-panel">

                <nav className="gm-combat-controls">
                    {!combatActive ? (
                        <button
                            type="button"
                            onClick={startInitiative}
                        >
                            Start Combat
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => void handleEndCombatClick()}
                        >
                            End Combat
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => void handleNextTurnClick()}
                        disabled={!combatActive}
                    >
                        Next Turn
                    </button>

                    <button
                        type="button"
                        onClick={() => void handleAllOutAttack()}
                        disabled={!combatActive}
                    >
                        All-Out Attack
                    </button>

                    <button
                        type="button"
                        onClick={handleResetCombat}
                    >
                        Reset Combat
                    </button>

                    <span className="turn-number">
                        Turn Number: {turnNumber}
                    </span>

                </nav>

                <div className="gm-combat-body">
                    <EncounterPage
                        shadows={shadows}
                        playerView={false}
                        onRefreshShadows={onRefreshShadows}
                        onSelectShadow={handleShadowClicked}
                        onSyncSelectedShadow={handleCurrentShadowSynced}
                        onDamageLogged={logDamage}
                        lootYen={combatLoot.yen}
                        lootItems={combatLoot.items}
                        onCombatLootChange={onCombatLootChange}
                        highlightedPlayerCombatantId={highlightedPlayerCombatantId}
                    />
                </div>

                <CombatLog entries={combatLog} />

            </section>

            <section className="gm-side-panel">

                <nav className="library-tabs" role="tablist" aria-label="GM side panel">
                    {SIDE_PANEL_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={sideTab === tab.id}
                            className={
                                sideTab === tab.id
                                    ? "library-tab active"
                                    : "library-tab"
                            }
                            onClick={() => setSideTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className={sideTab === "details"
                    ? "gm-side-content details"
                    : "gm-side-content"}>

                    {sideTab === "shadows" && (
                        <ShadowLibrary
                            shadows={shadows}
                            loading={loading}
                            error={error}
                            onSelectShadow={onSelectShadow}
                            onAddToCombat={handleAddCombatant}
                        />
                    )}

                    {sideTab === "players" && (
                        selectedPlayer ? (
                            <PlayerSkillEditor
                                player={selectedPlayer}
                                onClose={() => setSelectedPlayer(null)}
                            />
                        ) : (
                            <div className="player-library-table">
                                {players.map((player) => (
                                    <div
                                        className="player-library-row"
                                        key={player.id}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={player.in_initiative}
                                            onChange={() =>
                                                void togglePlayerInitiative(player)
                                            }
                                            aria-label={`Include ${player.name} in initiative`}
                                        />
                                        <span>{player.name}</span>
                                        <button
                                            type="button"
                                            className="player-edit-button"
                                            onClick={() => setSelectedPlayer(player)}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {sideTab === "details" && (
                        <ShadowDetailsPanel
                            shadow={selectedShadow}
                            combatant={selectedCombatant}
                            onAffinityToggle={handleAffinityToggle}
                            highlightedSkillId={highlightedSkillId}
                        />
                    )}

                </div>

            </section>


            {showInitiativeWindow && (
                <div className="initiative-overlay">
                    <section className="initiative-modal">

                        <h2>
                            Enter Player Initiative
                        </h2>

                        <ul>
                            {players
                                .filter(
                                    (player) =>
                                        player.in_initiative
                                )
                                .map((player) => (
                                    <li key={player.id}>

                                        <span>
                                            {player.name}
                                        </span>

                                        <input
                                            type="number"
                                            value={
                                                playerRolls[player.id]
                                                ?? ""
                                            }
                                            onChange={(event) =>
                                                updatePlayerRoll(
                                                    player.id,
                                                    Number(
                                                        event.target.value
                                                    )
                                                )
                                            }
                                        />

                                    </li>
                                ))}
                        </ul>

                        <button
                            type="button"
                            onClick={() => void handleBeginCombat()}
                        >
                            Begin Combat
                        </button>

                    </section>
                </div>
            )}

        </main>
    )
}
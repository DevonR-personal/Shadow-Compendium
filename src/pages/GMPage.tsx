import ShadowLibrary from "./ShadowLibrary"
import EncounterPage from "./EncounterPage"
import { useState } from "react"
import type { Player, Shadow } from "../types"
import ShadowDetailsPanel from "./ShadowDetailsPanel"
import { updateAffinityDiscovery } from "../services/affinities"
import { damageAllShadowCombatants } from "../services/combatants"
import { useCombatController } from "../hooks/useCombatController"
import type { TurnHighlights } from "../utils/turnHighlights"
import PlayerSkillEditor from "../components/PlayerSkillEditor"

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
    const [libraryTab, setLibraryTab] =
        useState<"shadows" | "players">("shadows")
    const [selectedShadow, setSelectedShadow] =
        useState<Shadow | null>(null)
    const [selectedCombatant, setSelectedCombatant] =
        useState<import("../types").Combatant | null>(null)
    const [selectedPlayer, setSelectedPlayer] =
        useState<Player | null>(null)
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
        }
    }

    return (
        <main className="gm-layout">

            <section className="gm-library-panel">

                <nav className="library-tabs">
                    <button
                        type="button"
                        className={
                            libraryTab === "shadows"
                                ? "library-tab active"
                                : "library-tab"
                        }
                        onClick={() => setLibraryTab("shadows")}
                    >
                        Shadows
                    </button>

                    <button
                        type="button"
                        className={
                            libraryTab === "players"
                                ? "library-tab active"
                                : "library-tab"
                        }
                        onClick={() => setLibraryTab("players")}
                    >
                        Players
                    </button>
                </nav>


                <div className="library-content">

                    {libraryTab === "shadows" && (
                        <ShadowLibrary
                            shadows={shadows}
                            loading={loading}
                            error={error}
                            onSelectShadow={onSelectShadow}
                            onAddToCombat={handleAddCombatant}
                        />
                    )}


                    {libraryTab === "players" && (
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

                </div>

            </section>


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
                            onClick={handleEndCombat}
                        >
                            End Combat
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleNextTurn}
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

                </nav>

                <span className="turn-number">
                    Turn Number: {turnNumber}
                </span>

                <EncounterPage
                    shadows={shadows}
                    playerView={false}
                    onRefreshShadows={onRefreshShadows}
                    onSelectShadow={(shadow, combatant) => {
                        setSelectedShadow(shadow)
                        setSelectedCombatant(combatant ?? null)
                    }}
                    lootYen={combatLoot.yen}
                    lootItems={combatLoot.items}
                    onCombatLootChange={onCombatLootChange}
                    highlightedPlayerCombatantId={highlightedPlayerCombatantId}
                />

            </section>

            <section className="gm-details-panel">
                <ShadowDetailsPanel
                    shadow={selectedShadow}
                    combatant={selectedCombatant}
                    onAffinityToggle={handleAffinityToggle}
                    highlightedSkillId={highlightedSkillId}
                />
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
                            onClick={beginCombat}
                        >
                            Begin Combat
                        </button>

                    </section>
                </div>
            )}

        </main>
    )
}
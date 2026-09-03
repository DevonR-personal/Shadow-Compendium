import ShadowLibrary from "./ShadowLibrary"
import EncounterPage from "./EncounterPage"
import { useState } from "react"
import type { Shadow } from "../types"
import ShadowDetailsPanel from "./ShadowDetailsPanel"
import { updateAffinityDiscovery } from "../services/affinities"
import { useCombatController } from "../hooks/useCombatController"

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
    loading: boolean
    error: string | null
    onSelectShadow: (shadow: Shadow) => void
    onRefreshShadows: () => Promise<void>
}

export default function GMPage({
    shadows,
    combatLoot,
    onCombatLootChange,
    loading,
    error,
    onSelectShadow,
    onRefreshShadows,
}: Readonly<GMPageProps>) {
    const [libraryTab, setLibraryTab] =
        useState<"shadows" | "players">("shadows")
    const [selectedShadow, setSelectedShadow] =
        useState<Shadow | null>(null)
    const {
        players,
        playerRolls,
        combatActive,
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
    })
    async function handleAffinityToggle(
        affinityId: number,
        discovered: boolean
    ) {
        try {
            await updateAffinityDiscovery(
                affinityId,
                discovered
            )

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
                        <>
                            <h2>Players</h2>

                            <ul>
                                {players.map((player) => (
                                    <li key={player.id}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={player.in_initiative}
                                                onChange={() =>
                                                    togglePlayerInitiative(player)
                                                }
                                            />

                                            {player.name}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </>
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
                        onClick={handleResetCombat}
                    >
                        Reset Combat
                    </button>
                </nav>

                <EncounterPage
                    shadows={shadows}
                    playerView={false}
                    onRefreshShadows={onRefreshShadows}
                    onSelectShadow={setSelectedShadow}
                    lootYen={combatLoot.yen}
                    lootItems={combatLoot.items}
                    onCombatLootChange={onCombatLootChange}
                />

            </section>

            <section className="gm-details-panel">
                <ShadowDetailsPanel
                    shadow={selectedShadow}
                    onAffinityToggle={handleAffinityToggle}
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
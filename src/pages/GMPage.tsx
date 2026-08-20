import ShadowLibrary from "./ShadowLibrary"
import EncounterPage from "./EncounterPage"
import { useEffect, useState } from "react"
import type { Player, Shadow } from "../types"
import { rollDice } from "../utils/dice"
import {
    getInitiativePlayers,
    getPlayers,
    updatePlayerInitiative,
} from "../services/players"
import {
    getCombatants,
    updateCombatant,
    updatePlayerCombatantInitiative,
    updateCurrentTurn,
    addCombatant,
    addPlayerCombatant,
    resetCombat,
    nextTurn,
} from "../services/combatants"
import ShadowDetailsPanel from "./ShadowDetailsPanel"
import { updateAffinityDiscovery } from "../services/affinities"

type GMPageProps = {
    shadows: Shadow[]
    loading: boolean
    error: string | null
    onSelectShadow: (shadow: Shadow) => void
    onRefreshShadows: () => Promise<void>
}

async function handleResetCombat() {
    const error = await resetCombat()

    if (error) {
        console.error(error)
    }
}
async function handleAddCombatant(
    shadow: Shadow
) {
    const error = await addCombatant(shadow)

    if (error) {
        console.error(error)
    }
}
async function handleNextTurn() {
    const error = await nextTurn()

    if (error) {
        console.error(error)
    }
}


export default function GMPage({
    shadows,
    loading,
    error,
    onSelectShadow,
    onRefreshShadows,
}: Readonly<GMPageProps>) {
    const [players, setPlayers] = useState<Player[]>([])
    const [libraryTab, setLibraryTab] =
        useState<"shadows" | "players">("shadows")
    const [selectedShadow, setSelectedShadow] =
        useState<Shadow | null>(null)
    const [showInitiativeWindow, setShowInitiativeWindow] = useState(false)
    const [playerRolls, setPlayerRolls] = useState<Record<number, number>>({})
    useEffect(() => {
        async function loadPlayers() {
            const result = await getPlayers()

            if (result.error) {
                console.error(result.error)
                return
            }

            setPlayers(result.data)
        }

        loadPlayers()
    }, [])
    async function togglePlayerInitiative(
        player: Player
    ) {
        const result = await updatePlayerInitiative(
            player.id,
            !player.in_initiative
        )

        if (result.error) {
            console.error(result.error)
            return
        }

        setPlayers((current) =>
            current.map((item) =>
                item.id === player.id
                    ? {
                        ...item,
                        in_initiative:
                            !item.in_initiative,
                    }
                    : item
            )
        )
    }
    async function startInitiative() {
        // Add selected players
        const playersResult = await getInitiativePlayers()

        if (playersResult.error) {
            console.error(playersResult.error)
            return
        }

        for (const player of playersResult.data) {
            const error = await addPlayerCombatant(player.id, player.name)

            if (error) {
                console.error(error)
                return
            }
        }

        // Get the current combatants
        const combatantsResult = await getCombatants()

        if (combatantsResult.error) {
            console.error(combatantsResult.error)
            return
        }

        // Roll initiative for enemies only
        for (const combatant of combatantsResult.data) {
            if (combatant.combatant_type !== "shadow") {
                continue
            }

            const shadow = shadows.find(
                (shadow) => shadow.id === combatant.shadow_id
            )

            const agility =
                shadow?.shadow_stats?.[0]?.agility ?? 0

            const initiative =
                rollDice(2, 6) + agility

            const error =
                await updateCombatant(
                    combatant.id,
                    { initiative }
                )

            if (error) {
                console.error(error)
            }
        }

        setShowInitiativeWindow(true)
    }
    function updatePlayerRoll(
        playerId: number,
        value: number
    ) {
        setPlayerRolls((current) => ({
            ...current,
            [playerId]: value,
        }))
    }
    async function beginCombat() {

        for (const player of players) {

            if (!player.in_initiative) {
                continue
            }

            const roll = playerRolls[player.id]

            if (roll === undefined) {
                continue
            }

            const error =
                await updatePlayerCombatantInitiative(
                    player.id,
                    roll
                )

            if (error) {
                console.error(error)
                return
            }
        }

        const combatantsResult = await getCombatants()

        if (combatantsResult.error) {
            console.error(combatantsResult.error)
            return
        }

        const sortedCombatants =
            combatantsResult.data.toSorted(
                (a, b) =>
                    (b.initiative ?? 0) -
                    (a.initiative ?? 0)
            )

        for (
            let index = 0;
            index < sortedCombatants.length;
            index++
        ) {
            const error =
                await updateCombatant(
                    sortedCombatants[index].id,
                    { position: index }
                )

            if (error) {
                console.error(error)
                return
            }
        }
        const error = await updateCurrentTurn(
            sortedCombatants[0].id
        )

        if (error) {
            console.error(error)
            return
        }

        setShowInitiativeWindow(false)
    }
    async function handleAffinityToggle(
        affinityId: number,
        discovered: boolean
    ) {
        try {
            await updateAffinityDiscovery(
                affinityId,
                discovered
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
                    <button
                        type="button"
                        onClick={startInitiative}
                    >
                        Start Combat
                    </button>

                    <button
                        type="button"
                        onClick={handleNextTurn}
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
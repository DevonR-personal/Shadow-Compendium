import { useEffect, useState } from "react"
import type { Combatant, Player, Shadow } from "../types"
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
    setCombatActive as saveCombatActive,
    getCombatActive,
    endCombat,
    clearCombatLoot,
    setCombatLoot,
    setCombatTurnNumber,
    incrementCombatTurnNumber,
} from "../services/combatants"
import {
    calculateCombatLoot,
    sortCombatantsForInitiative,
} from "../utils/combat"
import {
    getTurnHighlights,
    type TurnHighlights,
} from "../utils/turnHighlights"

 type CombatLoot = {
    yen: number
    items: string[]
}

type UseCombatControllerProps = {
    readonly shadows: Shadow[]
    readonly onCombatLootChange: (loot: CombatLoot) => void
    readonly onTurnHighlightsChange: (highlights: TurnHighlights) => void
}

async function addShadowToCombat(shadow: Shadow) {
    const error = await addCombatant(shadow)

    if (error) {
        console.error(error)
    }
}

async function addSelectedPlayers(players: Player[]) {
    for (const player of players) {
        const error = await addPlayerCombatant(player.id, player.name)

        if (error) {
            return error
        }
    }

    return null
}

async function decayCombatantModifiers(combatant: Combatant) {
    const modifierKeys = [
        "damage_mod",
        "armor_mod",
        "accuracy_mod",
    ] as const
    const updates: Parameters<typeof updateCombatant>[1] = {}

    for (const modifierKey of modifierKeys) {
        const currentValue = combatant[modifierKey] ?? 0
        const turnKey = `${modifierKey}_turns` as const
        const currentTurns = combatant[turnKey] ?? 0

        if (currentValue === 0 || currentTurns === 0) {
            continue
        }

        const nextTurns = Math.max(0, currentTurns - 1)

        if (nextTurns === 0) {
            updates[modifierKey] = 0
            updates[turnKey] = 0
        } else {
            updates[turnKey] = nextTurns
        }
    }

    if (Object.keys(updates).length === 0) {
        return
    }

    const updateError = await updateCombatant(combatant.id, updates)

    if (updateError) {
        console.error(updateError)
    }
}

async function rollShadowInitiative(
    combatants: Awaited<ReturnType<typeof getCombatants>>["data"],
    shadows: Shadow[]
) {
    for (const combatant of combatants) {
        if (combatant.combatant_type !== "shadow") {
            continue
        }

        const shadow = shadows.find(
            (item) => item.id === combatant.shadow_id
        )
        const agility = shadow?.shadow_stats?.[0]?.agility ?? 0
        const initiative = rollDice(2, 6) + agility
        const error = await updateCombatant(
            combatant.id,
            { initiative }
        )

        if (error) {
            console.error(error)
        }
    }
}

async function persistCombatOrder(
    combatants: Awaited<ReturnType<typeof getCombatants>>["data"]
) {
    const sortedCombatants = sortCombatantsForInitiative(combatants)

    if (sortedCombatants.length === 0) {
        return {
            combatants: sortedCombatants,
            error: null,
        }
    }

    for (let index = 0; index < sortedCombatants.length; index++) {
        const error = await updateCombatant(
            sortedCombatants[index].id,
            { position: index }
        )

        if (error) {
            return {
                combatants: sortedCombatants,
                error,
            }
        }
    }

    const error = await updateCurrentTurn(sortedCombatants[0].id)

    return {
        combatants: sortedCombatants,
        error,
    }
}

export function useCombatController({
    shadows,
    onCombatLootChange,
    onTurnHighlightsChange,
}: UseCombatControllerProps) {
    const [players, setPlayers] = useState<Player[]>([])
    const [playerRolls, setPlayerRolls] = useState<Record<number, number>>({})
    const [combatActive, setCombatActive] = useState(false)
    const [turnNumber, setTurnNumber] = useState(0)
    const [showInitiativeWindow, setShowInitiativeWindow] = useState(false)

    useEffect(() => {
        async function loadPlayers() {
            const result = await getPlayers()

            if (result.error) {
                console.error(result.error)
                return
            }

            setPlayers(result.data)
        }

        async function loadCombatState() {
            const result = await getCombatActive()

            if (result.error) {
                console.error(result.error)
                return
            }

            setCombatActive(result.active)
            setTurnNumber(result.turnNumber)
        }

        void loadPlayers()
        void loadCombatState()
    }, [])

    async function handleResetCombat() {
        const error = await resetCombat()

        if (error) {
            console.error(error)
        }

        onTurnHighlightsChange({
            skillId: null,
            playerCombatantId: null,
        })
    }

    async function handleNextTurn() {
        const previousCombatantsResult = await getCombatants()

        if (previousCombatantsResult.error) {
            console.error(previousCombatantsResult.error)
            return
        }

        const endingCombatant = previousCombatantsResult.data.find(
            (combatant) => combatant.is_current_turn
        )

        const result = await nextTurn()

        if (result.error) {
            console.error(result.error)
            return
        }

        let currentTurnNumber = turnNumber

        if (result.wrapped) {
            const incrementResult = await incrementCombatTurnNumber()

            if (incrementResult.error) {
                console.error(incrementResult.error)
                return
            }

            currentTurnNumber = incrementResult.turnNumber
            setTurnNumber(currentTurnNumber)
        }

        const combatantsResult = await getCombatants()

        if (combatantsResult.error) {
            console.error(combatantsResult.error)
            return
        }

        if (endingCombatant) {
            await decayCombatantModifiers(endingCombatant)
        }

        onTurnHighlightsChange(
            getTurnHighlights(
                combatantsResult.data,
                shadows,
                currentTurnNumber
            )
        )
    }

    async function handleEndCombat() {
        const combatantsResult = await getCombatants()

        if (combatantsResult.error) {
            console.error(combatantsResult.error)
            return
        }

        const loot = calculateCombatLoot(
            combatantsResult.data,
            shadows
        )
        const lootError = await setCombatLoot(loot.yen, loot.items)

        if (lootError) {
            console.error(lootError)
            return
        }

        const combatError = await endCombat()

        if (combatError) {
            console.error(combatError)
            return
        }

        onCombatLootChange(loot)
        onTurnHighlightsChange({
            skillId: null,
            playerCombatantId: null,
        })
        setCombatActive(false)
        setShowInitiativeWindow(false)
    }

    async function togglePlayerInitiative(player: Player) {
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
                        in_initiative: !item.in_initiative,
                    }
                    : item
            )
        )
    }

    async function startInitiative() {
        onTurnHighlightsChange({
            skillId: null,
            playerCombatantId: null,
        })

        const playersResult = await getInitiativePlayers()

        if (playersResult.error) {
            console.error(playersResult.error)
            return
        }

        const playersError = await addSelectedPlayers(playersResult.data)

        if (playersError) {
            console.error(playersError)
            return
        }

        const combatantsResult = await getCombatants()

        if (combatantsResult.error) {
            console.error(combatantsResult.error)
            return
        }

        await rollShadowInitiative(combatantsResult.data, shadows)

        setShowInitiativeWindow(true)
    }

    function updatePlayerRoll(playerId: number, value: number) {
        setPlayerRolls((current) => ({
            ...current,
            [playerId]: value,
        }))
    }

    async function beginCombat() {
        const clearLootError = await clearCombatLoot()

        if (clearLootError) {
            console.error(clearLootError)
            return
        }

        for (const player of players) {
            if (!player.in_initiative) {
                continue
            }

            const roll = playerRolls[player.id]

            if (roll === undefined) {
                continue
            }

            const error = await updatePlayerCombatantInitiative(
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

        const orderResult = await persistCombatOrder(
            combatantsResult.data
        )

        if (orderResult.error || orderResult.combatants.length === 0) {
            if (orderResult.error) {
                console.error(orderResult.error)
            }
            return
        }

        const resetTurnError = await setCombatTurnNumber(1)

        if (resetTurnError) {
            console.error(resetTurnError)
            return
        }

        setTurnNumber(1)

        onTurnHighlightsChange(
            getTurnHighlights(
                orderResult.combatants.map((combatant) => ({
                    ...combatant,
                    is_current_turn: combatant.id === orderResult.combatants[0].id,
                })),
                shadows,
                1
            )
        )

        const combatStateError = await saveCombatActive(true)

        if (combatStateError) {
            console.error(combatStateError)
            return
        }

        setCombatActive(true)
        setShowInitiativeWindow(false)
    }

    return {
        players,
        playerRolls,
        combatActive,
        turnNumber,
        showInitiativeWindow,
        handleResetCombat,
        handleAddCombatant: addShadowToCombat,
        handleNextTurn,
        handleEndCombat,
        togglePlayerInitiative,
        startInitiative,
        updatePlayerRoll,
        beginCombat,
    }
}

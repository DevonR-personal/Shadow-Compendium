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
    setCombatActive,
    getCombatActive,
    endCombat,
    clearCombatLoot,
    setCombatLoot,
} from "../services/combatants"
import {
    calculateCombatLoot,
    sortCombatantsForInitiative,
} from "../utils/combat"

 type CombatLoot = {
    yen: number
    items: string[]
}

type UseCombatControllerProps = {
    readonly shadows: Shadow[]
    readonly onCombatLootChange: (loot: CombatLoot) => void
}

export function useCombatController({
    shadows,
    onCombatLootChange,
}: UseCombatControllerProps) {
    const [players, setPlayers] = useState<Player[]>([])
    const [playerRolls, setPlayerRolls] = useState<Record<number, number>>({})
    const [combatActive, setCombatActiveState] = useState(false)
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

            setCombatActiveState(result.active)
        }

        void loadPlayers()
        void loadCombatState()
    }, [])

    async function handleResetCombat() {
        const error = await resetCombat()

        if (error) {
            console.error(error)
        }
    }

    async function handleAddCombatant(shadow: Shadow) {
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
        setCombatActiveState(false)
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

        const combatantsResult = await getCombatants()

        if (combatantsResult.error) {
            console.error(combatantsResult.error)
            return
        }

        for (const combatant of combatantsResult.data) {
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

        const sortedCombatants = sortCombatantsForInitiative(
            combatantsResult.data
        )

        if (sortedCombatants.length === 0) {
            return
        }

        for (let index = 0; index < sortedCombatants.length; index++) {
            const error = await updateCombatant(
                sortedCombatants[index].id,
                { position: index }
            )

            if (error) {
                console.error(error)
                return
            }
        }

        const turnError = await updateCurrentTurn(
            sortedCombatants[0].id
        )

        if (turnError) {
            console.error(turnError)
            return
        }

        const combatStateError = await setCombatActive(true)

        if (combatStateError) {
            console.error(combatStateError)
            return
        }

        setCombatActiveState(true)
        setShowInitiativeWindow(false)
    }

    return {
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
    }
}

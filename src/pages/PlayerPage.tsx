import EncounterPage from "./EncounterPage"
import type { Shadow } from "../types"
import { usePlayers } from "../hooks/usePlayers"
import type { useHealthNotifications } from "../hooks/useHealthNotifications"

type PlayerPageProps = Readonly<{
    readonly shadows: Shadow[]
    healthNotifications: ReturnType<typeof useHealthNotifications>
    readonly combatLoot: {
        yen: number
        items: string[]
    }
    readonly onCombatLootChange: (loot: {
        yen: number
        items: string[]
    }) => void
    readonly highlightedPlayerCombatantId: number | null
    onRefreshShadows: () => Promise<void>
}>

export default function PlayerPage({
    shadows,
    healthNotifications,
    combatLoot,
    onCombatLootChange,
    highlightedPlayerCombatantId,
    onRefreshShadows,
}: PlayerPageProps) {
    const { players } = usePlayers()

    return (
        <EncounterPage
            healthNotifications={healthNotifications}
            shadows={shadows}
            players={players}
            playerView={true}
            onRefreshShadows={onRefreshShadows}
            onSelectShadow={() => {}}
            lootYen={combatLoot.yen}
            lootItems={combatLoot.items}
            onCombatLootChange={onCombatLootChange}
            highlightedPlayerCombatantId={highlightedPlayerCombatantId}
        />
    )
}
import EncounterPage from "./EncounterPage"
import type { Shadow } from "../types"

type PlayerPageProps = Readonly<{
    readonly shadows: Shadow[]
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
    combatLoot,
    onCombatLootChange,
    highlightedPlayerCombatantId,
    onRefreshShadows,
}: PlayerPageProps) {
    return (
        <EncounterPage
            shadows={shadows}
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
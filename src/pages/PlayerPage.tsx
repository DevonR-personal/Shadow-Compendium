import EncounterPage from "./EncounterPage"
import type { Shadow } from "../types"

type PlayerPageProps = Readonly<{
    readonly shadows: Shadow[]
    onRefreshShadows: () => Promise<void>
}>

export default function PlayerPage({
    shadows,
    onRefreshShadows,
}: PlayerPageProps) {
    return (
        <EncounterPage
            shadows={shadows}
            playerView={true}
            onRefreshShadows={onRefreshShadows}
        />
    )
}
import type { Shadow } from "../types"
import {
    getOffensiveAffinities,
    getWeaknesses,
    sortAffinities,
} from "../utils/affinities"
import AffinityMiniGrid from "./AffinityMiniGrid"

type ShadowRowProps = {
    readonly shadow: Shadow
    readonly onClick: (shadow: Shadow) => void
    readonly onAddToCombat: (shadow: Shadow) => void
}

export default function ShadowRow({
    shadow,
    onClick,
    onAddToCombat,
}: ShadowRowProps) {
    const offensiveAffinities =
        getOffensiveAffinities(shadow)

    const sortedOffensiveAffinities =
        sortAffinities(offensiveAffinities)

    const weaknesses =
        getWeaknesses(shadow)

    return (
        <div className="shadow-row">

            <button
                type="button"
                className="shadow-name-button"
                onClick={() => onAddToCombat(shadow)}
            >
                {shadow.name}
            </button>

            <span className="shadow-level">
                {shadow.level}
            </span>

            <AffinityMiniGrid
                highlightedAffinities={
                    sortedOffensiveAffinities
                }
            />

            <AffinityMiniGrid
                highlightedAffinities={
                    weaknesses
                }
            />

            <button
                type="button"
                className="shadow-view-button"
                onClick={() => onClick(shadow)}
            >
                ✎
            </button>

        </div>
    )
}
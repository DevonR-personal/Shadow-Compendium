import type { Shadow } from "../types"
import {
    getOffensiveAffinities,
    getWeaknesses,
    sortAffinities,
} from "../utils/affinities"

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
            .filter((affinity) => affinity !== "almighty")

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

            <div
                className={`shadow-offensive-icons count-${sortedOffensiveAffinities.length}`}
            >
                {sortedOffensiveAffinities.map((affinity) => (
                    <img
                        key={affinity}
                        src={`/icons/Icon_${affinity.charAt(0).toUpperCase() + affinity.slice(1)}.png`}
                        alt={affinity}
                        title={affinity}
                    />
                ))}
            </div>

            <div
                className={`shadow-defensive-icons count-${weaknesses.length}`}
            >
                {weaknesses.map((affinity) => (
                    <img
                        key={affinity}
                        src={`/icons/Icon_${affinity.charAt(0).toUpperCase() + affinity.slice(1)}.png`}
                        alt={affinity}
                        title={affinity}
                    />
                ))}
            </div>

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
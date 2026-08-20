import type { Affinity, AffinityValue } from "../types"
import { AFFINITY_ORDER } from "../constants/affinities"
import { getAffinity } from "../utils/affinities"

const DISPLAY_VALUES: Record<AffinityValue, string> = {
    weak: "WK",
    resist: "RS",
    null: "NU",
    reflect: "RF",
    drain: "DR",
    neutral: "—",
}

type AffinityGridProps = {
    readonly affinities: Affinity[]
    readonly revealHiddenValues: boolean
    readonly onAffinityClick?: (
        element: Affinity
    ) => void
}

export default function AffinityGrid({
    affinities,
    revealHiddenValues,
    onAffinityClick,
}: AffinityGridProps) {
    return (
        <>
            {AFFINITY_ORDER.map((element) => {
                const affinity = getAffinity(
                    affinities,
                    element
                )

                const hidden =
                    !revealHiddenValues &&
                    !affinity?.discovered

                let className = `affinity-cell ${element}`
                if (onAffinityClick) {
                    className += " gm-clickable"
                }
                let displayValue = "?"

                if (hidden) {
                    displayValue = "???"
                } else if (affinity) {
                    className += ` affinity affinity-${affinity.value}`
                    displayValue =
                        DISPLAY_VALUES[affinity.value]
                }

                return (
                    <button
                        key={element}
                        type="button"
                        className={className}
                        onClick={() => {
                            if (affinity) {
                                onAffinityClick?.(affinity)
                            }
                        }}
                        aria-label={
                            affinity?.discovered
                                ? `Hide ${element} affinity`
                                : `Reveal ${element} affinity`
                        }
                    >
                        <span
                            className={
                                affinity?.discovered
                                    ? "affinity-value revealed"
                                    : "affinity-value"
                            }
                        >
                            {displayValue}
                        </span>
                    </button>
                )
            })}
        </>
    )
}
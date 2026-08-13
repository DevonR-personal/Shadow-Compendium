import type { Affinity } from "../types"
import { AFFINITY_ORDER } from "../constants/affinities"
import { getAffinity } from "../utils/affinities"

const DISPLAY_VALUES: Record<string, string> = {
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
}

export default function AffinityGrid({
    affinities,
    revealHiddenValues,
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
                let displayValue = "?"

                if (hidden) {
                    displayValue = "???"
                } else if (affinity) {
                    className += ` affinity affinity-${affinity.value}`
                    displayValue =
                        DISPLAY_VALUES[affinity.value]
                }

                return (
                    <div
                        key={element}
                        className={className}
                    >
                        {displayValue}
                    </div>
                )
            })}
        </>
    )
}
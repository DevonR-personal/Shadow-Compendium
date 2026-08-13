import { AFFINITY_GRID_ORDER } from "../constants/affinities"
import type { SkillAffinity } from "../types"

const ICON_NAMES: Record<
    typeof AFFINITY_GRID_ORDER[number][number],
    string
> = {
    melee: "Melee",
    ranged: "Ranged",
    fire: "Fire",
    ice: "Ice",
    wind: "Wind",
    electric: "Electric",
    psychic: "Psychic",
    nuclear: "Nuclear",
    bless: "Bless",
    curse: "Curse",
}

type AffinityMiniGridProps = {
    readonly highlightedAffinities: readonly SkillAffinity[]
}

export default function AffinityMiniGrid({
    highlightedAffinities,
}: AffinityMiniGridProps) {

    return (
        <div className="affinity-mini-grid">
            {AFFINITY_GRID_ORDER.flat().map(
                (affinity) => (
                    <div
                        key={affinity}
                        className={
                            highlightedAffinities.includes(
                                affinity
                            )
                                ? "affinity-icon active"
                                : "affinity-icon inactive"
                        }
                    >
                        <img
                            src={`/icons/Icon_${ICON_NAMES[affinity]}.png`}
                            alt={affinity}
                        />
                    </div>
                )
            )}
        </div>
    )
}
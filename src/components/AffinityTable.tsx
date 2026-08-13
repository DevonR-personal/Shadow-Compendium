import AffinityRow from "./AffinityRow"
import type { Affinity } from "../types"
import {
    AFFINITY_ORDER,
    AFFINITY_LABELS,
} from "../constants/affinities"
import { getAffinity } from "../utils/affinities"

type AffinityTableProps = {
  readonly affinities: Affinity[]
  readonly loading: boolean

  readonly editable: boolean
  readonly revealHiddenValues: boolean

  readonly onToggleDiscovery?: (
    id: number,
    discovered: boolean
  ) => void
}

export default function AffinityTable({
  affinities,
  loading,
  editable,
  revealHiddenValues,
  onToggleDiscovery,
}: AffinityTableProps) {

  if (loading) {
    return <p>Loading affinities...</p>
  }

  return (
    <div className="affinity-list">
      {AFFINITY_ORDER.map((element) => {
        const affinity = getAffinity(affinities, element)

        if (!affinity) {
          return (
            <div
              className="affinity-row"
              key={element}
            >
              <strong>
                {AFFINITY_LABELS[element]}
              </strong>

              <span>Not configured</span>
            </div>
          )
        }

        return (
          <AffinityRow
            key={affinity.id}
            label={AFFINITY_LABELS[element]}
            affinity={affinity}
            editable={editable}
            revealHiddenValues={
              revealHiddenValues
            }
            onToggleDiscovery={
              onToggleDiscovery
            }
          />
        )
      })}
    </div>
  )
}
import DiscoveryButton from "./DiscoveryButton"
import type { Affinity } from "../types"
import { ELEMENT_IMAGES } from "../constants/skills"

type AffinityRowProps = {
  readonly label: string
  readonly affinity: Affinity

  readonly editable: boolean
  readonly revealHiddenValues: boolean

  readonly onToggleDiscovery?: (
    id: number,
    discovered: boolean
  ) => void
}

export default function AffinityRow({
  label,
  affinity,
  editable,
  revealHiddenValues,
  onToggleDiscovery,
}: AffinityRowProps) {
  const hidden =
    !revealHiddenValues &&
    !affinity.discovered

  const displayValue = hidden
    ? "???"
    : affinity.value.toUpperCase()

  return (
    <div className="affinity-row">
      <img
        src={ELEMENT_IMAGES[affinity.element]}
        alt={label}
        className="skill-icon"
        />

      <span
        className={
          hidden
            ? "affinity"
            : `affinity affinity-${affinity.value}`
        }
      >
        {displayValue}
      </span>

      {editable && onToggleDiscovery && (
        <DiscoveryButton
          discovered={affinity.discovered}
          onClick={() =>
            onToggleDiscovery(
              affinity.id,
              !affinity.discovered
            )
          }
        />
      )}
    </div>
  )
}
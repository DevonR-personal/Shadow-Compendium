import type {
  AffinityElement,
  AffinityValue,
} from "../types"
import {
  AFFINITY_LABELS,
  AFFINITY_ORDER,
  AFFINITY_VALUES,
} from "../constants/affinities"

type ShadowEditorProps = {
  readonly name: string
  readonly level: number | ""

  readonly affinities: Record<
    AffinityElement,
    AffinityValue
  >

  readonly saving: boolean

  readonly onNameChange: (value: string) => void
  readonly onLevelChange: (value: number | "") => void

  readonly onAffinityChange: (
    element: AffinityElement,
    value: AffinityValue
  ) => void

  readonly onCancel: () => void
  readonly onSave: () => void
}

export default function ShadowEditor({
  name,
  level,
  affinities,
  saving,
  onNameChange,
  onLevelChange,
  onAffinityChange,
  onCancel,
  onSave,
}: ShadowEditorProps) {
  return (
    <section className="editor">
      <h2>Edit Shadow</h2>

      <label>
        <span>Name</span>

        <input
          value={name}
          onChange={(event) =>
            onNameChange(event.target.value)
          }
        />
      </label>

      <label>
        <span>Level</span>

        <input
          type="number"
          value={level}
          onChange={(event) =>
            onLevelChange(
              event.target.value === ""
                ? ""
                : Number(event.target.value)
            )
          }
        />
      </label>

      <h3>Affinities</h3>

      <div className="affinity-editor">
        {AFFINITY_ORDER.map((element) => (
          <label
            key={element}
            className="affinity-edit-row"
          >
            <strong>
              {AFFINITY_LABELS[element]}
            </strong>

            <select
              value={
                affinities[element] ??
                "neutral"
              }
              onChange={(event) =>
                onAffinityChange(
                  element,
                  event.target
                    .value as AffinityValue
                )
              }
            >
              {AFFINITY_VALUES.map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {value.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="editor-actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={
            saving ||
            name.trim() === ""
          }
        >
          {saving
            ? "Saving..."
            : "Save Shadow"}
        </button>
      </div>
    </section>
  )
}
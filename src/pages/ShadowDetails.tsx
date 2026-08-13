import AffinityTable from "../components/AffinityTable"
import type { Shadow, Affinity } from "../types"

type ShadowDetailsProps = {
  readonly gmMode: boolean
  readonly shadow: Shadow

  readonly affinities: Affinity[]
  readonly affinitiesLoading: boolean

  readonly onBack: () => void
  readonly onEdit: () => void

  readonly onToggleDiscovery: (
    affinityId: number,
    discovered: boolean
  ) => void

  readonly error: string | null
}

export default function ShadowDetails({
  gmMode,shadow,
  affinities,
  affinitiesLoading,
  onBack,
  onEdit,
  onToggleDiscovery,
  error,
}: ShadowDetailsProps) {
  return (
    <main className="app">
      <button
        type="button"
        onClick={onBack}
      >
        ← Back to Shadow Library
      </button>

      <header className="shadow-header">
        <div>
          <h1>{shadow.name}</h1>

          {shadow.level !== null && (
            <p>Level {shadow.level}</p>
          )}
        </div>

        {gmMode && (
          <button
            type="button"
            onClick={onEdit}
          >
            Edit Shadow
          </button>
        )}
      </header>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <section>
        <h2>Affinities</h2>

        <AffinityTable
            affinities={affinities}
            loading={affinitiesLoading}
            editable={gmMode}
            revealHiddenValues={gmMode}
            onToggleDiscovery={onToggleDiscovery}
        />
      </section>
    </main>
  )
}
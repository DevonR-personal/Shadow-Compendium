import { useEffect, useState } from 'react'
import ShadowDetails from "./pages/ShadowDetails"
import ShadowEditor from "./components/ShadowEditor"
import {
  getShadows,
  updateShadow,
} from "./services/shadows"
import {
  getAffinities,
  updateAffinityDiscovery,
  updateAffinityValue,
} from "./services/affinities"
import type {
  Shadow,
  Affinity,
  AffinityValue,
} from "./types"
import { getErrorMessage } from "./utils/errors"
import GMPage from "./pages/GMPage"
import PlayerPage from './pages/PlayerPage'

const AFFINITY_ORDER = [
  "melee",
  "ranged",
  "fire",
  "ice",
  "wind",
  "electric",
  "psychic",
  "nuclear",
  "bless",
  "curse",
] as const

function App() {
  const [shadows, setShadows] = useState<Shadow[]>([])
  const [selectedShadow, setSelectedShadow] =
    useState<Shadow | null>(null)

  const [affinities, setAffinities] =
    useState<Affinity[]>([])

  const [loading, setLoading] = useState(true)
  const [affinitiesLoading, setAffinitiesLoading] =
    useState(false)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState<string | null>(null)

  // Editor state
  const [editName, setEditName] = useState('')
  const [editLevel, setEditLevel] =
    useState<number | ''>('')

  const [editAffinities, setEditAffinities] =
    useState<Record<string, AffinityValue>>({})
  // -----------------------------------------
  // Load Shadows
  // -----------------------------------------

  async function loadShadows() {
    try {
      setError(null)

      const shadowsResult = await getShadows()

      if (shadowsResult.error) {
        setError(shadowsResult.error.message)
      } else {
        setShadows(shadowsResult.data)
      }
    } catch (err) {
      console.error(err)

      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function refreshShadows() {
    const result = await getShadows()

    if (result.error) {
      console.error(result.error)
      return
    }

    setShadows(result.data)
  }

  useEffect(() => {
    loadShadows()
  }, [])

  // -----------------------------------------
  // Load affinities
  // -----------------------------------------

  async function loadAffinities(shadowId: number) {
    setAffinitiesLoading(true)

    try {
      setError(null)

      const affinities = await getAffinities(
        shadowId
      )

      setAffinities(affinities)
    } catch (err) {
      console.error(err)

      setError(getErrorMessage(err))
    } finally {
      setAffinitiesLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedShadow) {
      setAffinities([])
      return
    }

    loadAffinities(selectedShadow.id)
  }, [selectedShadow])

  // -----------------------------------------
  // Select Shadow
  // -----------------------------------------

  function selectShadow(shadow: Shadow) {
    setSelectedShadow(shadow)
    setEditing(false)
    setError(null)
  }

  // -----------------------------------------
  // Start editing
  // -----------------------------------------

  function startEditing() {
    if (!selectedShadow) return

    setEditName(selectedShadow.name)
    setEditLevel(selectedShadow.level ?? '')

    const affinityValues: Record<
      string,
      AffinityValue
    > = {}

    for (const element of AFFINITY_ORDER) {
      const affinity = affinities.find(
        (item) => item.element === element
      )

      affinityValues[element] =
        (affinity?.value as AffinityValue) ?? 'normal'
    }

    setEditAffinities(affinityValues)
    setEditing(true)
    setError(null)
  }

  // -----------------------------------------
  // Change editor affinity
  // -----------------------------------------

  function changeAffinity(
    element: string,
    value: AffinityValue
  ) {
    setEditAffinities((current) => ({
      ...current,
      [element]: value,
    }))
  }

  // -----------------------------------------
  // Save Shadow
  // -----------------------------------------

  async function saveShadow() {
    if (!selectedShadow) return

    setSaving(true)
    setError(null)

    try {
      // Update Shadow itself
      const updatedShadow = await updateShadow(
        selectedShadow.id,
        editName.trim(),
        editLevel === "" ? null : Number(editLevel),
        selectedShadow.armor,
        selectedShadow.arcana,
        selectedShadow.loot_item
      )

      // Update each affinity
      for (const element of AFFINITY_ORDER) {
        const affinity = affinities.find(
          (item) => item.element === element
        )

        if (!affinity) continue

        await updateAffinityValue(
          affinity.id,
          editAffinities[element]
        )
      }

      // Update local state
      setSelectedShadow((current) =>
        current
          ? {
            ...current,
            ...updatedShadow,
          }
          : current
      )
      setShadows((current) =>
        current.map((shadow) =>
          shadow.id === updatedShadow.id
            ? {
              ...shadow,
              ...updatedShadow,
            }
            : shadow
        )
      )

      await loadAffinities(updatedShadow.id)

      setEditing(false)
      setSaving(false)
    } catch (err) {
      console.error(err)

      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // -----------------------------------------
  // Toggle discovery
  // -----------------------------------------

  async function toggleDiscovery(
    affinityId: number,
    discovered: boolean
  ) {
    try {
      setError(null)

      await updateAffinityDiscovery(
        affinityId,
        discovered
      )

      setAffinities((current) =>
        current.map((affinity) =>
          affinity.id === affinityId
            ? {
              ...affinity,
              discovered,
            }
            : affinity
        )
      )
    } catch (err) {
      console.error(err)

      setError(getErrorMessage(err))
    }
  }

  // -----------------------------------------
  // Shadow Details
  // -----------------------------------------

  if (selectedShadow && editing) {
    return (
      <main className="app">
        <button
          type="button"
          onClick={() => setEditing(false)}
        >
          ← Back
        </button>

        <ShadowEditor
          name={editName}
          level={editLevel}
          affinities={editAffinities}
          saving={saving}
          onNameChange={setEditName}
          onLevelChange={setEditLevel}
          onAffinityChange={changeAffinity}
          onCancel={() => setEditing(false)}
          onSave={saveShadow}
        />
      </main>
    )
  }

  if (selectedShadow && !editing) {
    return (
      <ShadowDetails
        gmMode={true}
        shadow={selectedShadow}
        affinities={affinities}
        affinitiesLoading={affinitiesLoading}
        onBack={() => {
          setSelectedShadow(null)
          setEditing(false)
        }}
        onEdit={startEditing}
        onToggleDiscovery={toggleDiscovery}
        error={error}
      />
    )
  }

  const isPlayerView =
    window.location.pathname === "/player"

  if (isPlayerView) {
    return (
      <PlayerPage
        shadows={shadows}
        onRefreshShadows={refreshShadows}
      />
    )
  }

  return (
    <GMPage
      shadows={shadows}
      loading={loading}
      error={error}
      onSelectShadow={selectShadow}
      onRefreshShadows={refreshShadows}
    />
  )
}

export default App
import { useState } from 'react'
import ShadowDetails from "./pages/ShadowDetails"
import ShadowEditor from "./components/ShadowEditor"
import type { Shadow } from "./types"
import GMPage from "./pages/GMPage"
import PlayerPage from './pages/PlayerPage'
import { useShadowLibrary } from './hooks/useShadowLibrary'
import { useCombatLoot } from './hooks/useCombatLoot'
import { useShadowEditor } from './hooks/useShadowEditor'

function App() {
  const {
    shadows,
    setShadows,
    loading,
    error: libraryError,
    refreshShadows,
  } = useShadowLibrary()
  const {
    combatLoot,
    setCombatLoot,
  } = useCombatLoot()
  const [selectedShadow, setSelectedShadow] =
    useState<Shadow | null>(null)

  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    affinities,
    affinitiesLoading,
    editName,
    editLevel,
    editAffinities,
    saving,
    setEditName,
    setEditLevel,
    startEditing,
    changeAffinity,
    saveShadow,
    toggleDiscovery,
  } = useShadowEditor({
    selectedShadow,
    setSelectedShadow,
    setShadows,
    setError,
    setEditing,
  })

  // -----------------------------------------
  // Select Shadow
  // -----------------------------------------

  function selectShadow(shadow: Shadow) {
    setSelectedShadow(shadow)
    setEditing(false)
    setError(null)
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
        combatLoot={combatLoot}
        onCombatLootChange={setCombatLoot}
      />
    )
  }

  return (
    <GMPage
      shadows={shadows}
      loading={loading}
      error={error ?? libraryError}
      onSelectShadow={selectShadow}
      onRefreshShadows={refreshShadows}
      combatLoot={combatLoot}
      onCombatLootChange={setCombatLoot}
    />
  )
}

export default App
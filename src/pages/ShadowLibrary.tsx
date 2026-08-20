import ShadowRow from "../components/ShadowRow"
import type { Shadow } from "../types"

type ShadowLibraryProps = {
    readonly shadows: Shadow[]
    readonly loading: boolean
    readonly error: string | null
    readonly onSelectShadow: (shadow: Shadow) => void
    readonly onAddToCombat: (shadow: Shadow) => void
}

export default function ShadowLibrary({
    shadows,
    loading,
    error,
    onSelectShadow,
    onAddToCombat,
}: ShadowLibraryProps) {
    if (loading) {
        return <p>Loading Shadows...</p>
    }

    if (error) {
        return (
            <p className="error">
                Error loading Shadows: {error}
            </p>
        )
    }

    if (shadows.length === 0) {
        return <p>No Shadows found.</p>
    }

const sortedShadows = [...shadows].sort(
    (a, b) => (a.max_hp ?? 0) - (b.max_hp ?? 0)
)

    return (
        <div className="shadow-table">
            <div className="shadow-header-row">
                <span>Name</span>
                <span className="shadow-column-header">TL</span>
                <span className="shadow-column-header">⚔︎</span>
                <span className="shadow-column-header">🛡︎</span>
                <span></span>
            </div>

            {sortedShadows.map((shadow) => (
                <ShadowRow
                    key={shadow.id}
                    shadow={shadow}
                    onClick={onSelectShadow}
                    onAddToCombat={onAddToCombat}
                />
            ))}
        </div>
    )
}
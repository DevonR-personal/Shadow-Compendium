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

    return (
        <div className="shadow-table">
            <div className="shadow-header-row">
                <span>Name</span>
                <span>TL</span>
                <span>Offense</span>
                <span>Weaknesses</span>
                <span></span>
            </div>

            {shadows.map((shadow) => (
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
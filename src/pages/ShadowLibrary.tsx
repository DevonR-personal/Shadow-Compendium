import ShadowRow from "../components/ShadowRow"
import type { Shadow } from "../types"
import { useState } from "react"

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
    const [search, setSearch] = useState("")

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

    const normalizedSearch = search.trim().toLowerCase()
    const sortedShadows = shadows
        .filter((shadow) =>
            shadow.name.toLowerCase().includes(normalizedSearch)
        )
        .sort((a, b) => (a.max_hp ?? 0) - (b.max_hp ?? 0))

    return (
        <div className="shadow-library-content">
            <input
                className="shadow-search-input"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search shadows"
                aria-label="Search shadows by name"
            />

            {sortedShadows.length === 0 ? (
                <p>No matching shadows.</p>
            ) : (
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
            )}
        </div>
    )
}
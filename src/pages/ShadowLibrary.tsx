import ShadowRow from "../components/ShadowRow"
import { useState } from "react"
import { AFFINITY_LABELS, AFFINITY_ORDER } from "../constants/affinities"
import type { AffinityElement, Shadow } from "../types"

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
    const [weakness, setWeakness] = useState<AffinityElement | "">("")
    const [offensiveElement, setOffensiveElement] = useState<AffinityElement | "">("")
    const [level, setLevel] = useState("")
    const [minHp, setMinHp] = useState("")
    const [maxHp, setMaxHp] = useState("")
    const [sortBy, setSortBy] = useState("hp-asc")
    const [filtersOpen, setFiltersOpen] = useState(false)

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
    const filteredShadows = shadows.filter((shadow) => {
        const matchesName = shadow.name.toLowerCase().includes(normalizedSearch)
        const matchesWeakness = !weakness || shadow.shadow_affinities.some(
            (affinity) => affinity.element === weakness && affinity.value === "weak"
        )
        const matchesOffensiveElement = !offensiveElement || shadow.shadow_skills
            .flatMap((link) => link.skills)
            .some((skill) => skill.affinity === offensiveElement)
        const matchesLevel = level === "" || shadow.level === Number(level)
        const matchesMinHp = minHp === "" || shadow.max_hp >= Number(minHp)
        const matchesMaxHp = maxHp === "" || shadow.max_hp <= Number(maxHp)

        return matchesName && matchesWeakness && matchesOffensiveElement &&
            matchesLevel && matchesMinHp && matchesMaxHp
    })

    const sortedShadows = [...filteredShadows].sort((a, b) => {
        if (sortBy === "hp-desc") return b.max_hp - a.max_hp
        if (sortBy === "name") return a.name.localeCompare(b.name)
        if (sortBy === "level") return (a.level ?? Infinity) - (b.level ?? Infinity)
        return a.max_hp - b.max_hp
    })

    function clearFilters() {
        setSearch("")
        setWeakness("")
        setOffensiveElement("")
        setLevel("")
        setMinHp("")
        setMaxHp("")
        setSortBy("hp-asc")
    }

    function addRandomMatchingShadow() {
        if (sortedShadows.length === 0) return
        const [randomValue] = window.crypto.getRandomValues(new Uint32Array(1))
        const randomIndex = Math.floor(randomValue / 0x100000000 * sortedShadows.length)
        onAddToCombat(sortedShadows[randomIndex])
    }

    return (
        <div className="shadow-library-content">
            <input
                className="shadow-search-input"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name"
                aria-label="Filter shadows by name"
            />
            {filtersOpen && <div className="shadow-filters" id="shadow-library-filters">
                <select
                    value={weakness}
                    onChange={(event) => setWeakness(event.target.value as AffinityElement | "")}
                    aria-label="Filter by weakness"
                >
                    <option value="">Any weakness</option>
                    {AFFINITY_ORDER.map((element) => (
                        <option key={element} value={element}>{AFFINITY_LABELS[element]}</option>
                    ))}
                </select>
                <select
                    value={offensiveElement}
                    onChange={(event) => setOffensiveElement(event.target.value as AffinityElement | "")}
                    aria-label="Filter by offensive element"
                >
                    <option value="">Any offensive element</option>
                    {AFFINITY_ORDER.map((element) => (
                        <option key={element} value={element}>{AFFINITY_LABELS[element]}</option>
                    ))}
                </select>
                <div className="shadow-filter-grid">
                    <input type="number" min="0" value={level} onChange={(event) => setLevel(event.target.value)} placeholder="TL" aria-label="Threat level" />
                    <button
                        type="button"
                        className="shadow-random-button"
                        onClick={addRandomMatchingShadow}
                        disabled={sortedShadows.length === 0}
                        title={sortedShadows.length === 0 ? "No shadows match these filters" : "Add a random matching shadow to combat"}
                    >
                        Add random
                    </button>
                    <input type="number" min="0" value={minHp} onChange={(event) => setMinHp(event.target.value)} placeholder="HP min" aria-label="Minimum max HP" />
                    <input type="number" min="0" value={maxHp} onChange={(event) => setMaxHp(event.target.value)} placeholder="HP max" aria-label="Maximum max HP" />
                </div>
                <div className="shadow-filter-footer">
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort shadows">
                        <option value="hp-asc">Max HP: low to high</option>
                        <option value="hp-desc">Max HP: high to low</option>
                        <option value="name">Name: A to Z</option>
                        <option value="level">TL: low to high</option>
                    </select>
                    <button type="button" onClick={clearFilters} aria-label="Clear filters" title="Clear filters">Clear</button>
                </div>
                <button
                    type="button"
                    className="shadow-filter-toggle"
                    onClick={() => setFiltersOpen(false)}
                    aria-expanded="true"
                    aria-controls="shadow-library-filters"
                    aria-label="Hide filters"
                    title="Hide filters"
                >
                    ▴
                </button>
            </div>}
            {!filtersOpen && (
                <button
                    type="button"
                    className="shadow-filter-toggle collapsed"
                    onClick={() => setFiltersOpen(true)}
                    aria-expanded="false"
                    aria-controls="shadow-library-filters"
                    aria-label="Show filters"
                    title="Show filters"
                >
                    ▾
                </button>
            )}

            {sortedShadows.length === 0 ? (
                <p>No matching shadows.</p>
            ) : (
                <div className="shadow-table">
                    <div className="shadow-header-row">
                        <span>Name</span>
                        <span className="shadow-column-header">HP</span>
                        <span className="shadow-column-header">TL</span>
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
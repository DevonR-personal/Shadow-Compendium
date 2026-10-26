import { useRef, useState } from "react"
import type { CombatLogEntry } from "../utils/combatLog"

const HEIGHT_STORAGE_KEY = "shadow-tracker:gm-log-height-v2"
const MIN_HEIGHT = 64
const MAX_HEIGHT = 320
// Fits exactly three single-line entries.
const DEFAULT_HEIGHT = 75
const KEYBOARD_STEP = 16

function clampHeight(height: number) {
    return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height))
}

function readSavedHeight() {
    const saved = Number(window.localStorage.getItem(HEIGHT_STORAGE_KEY))
    return Number.isFinite(saved) && saved > 0
        ? clampHeight(saved)
        : DEFAULT_HEIGHT
}

type CombatLogProps = {
    readonly entries: readonly CombatLogEntry[]
}

export default function CombatLog({ entries }: CombatLogProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [height, setHeight] = useState(readSavedHeight)
    const dragRef = useRef<{ startY: number; startHeight: number } | null>(null)

    function resizeTo(next: number) {
        const clamped = clampHeight(next)
        setHeight(clamped)
        window.localStorage.setItem(HEIGHT_STORAGE_KEY, String(clamped))
    }

    function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
        event.currentTarget.setPointerCapture(event.pointerId)
        dragRef.current = { startY: event.clientY, startHeight: height }
    }

    function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
        const drag = dragRef.current
        if (!drag) return
        resizeTo(drag.startHeight + drag.startY - event.clientY)
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        if (event.key === "ArrowUp") {
            event.preventDefault()
            resizeTo(height + KEYBOARD_STEP)
        }
        if (event.key === "ArrowDown") {
            event.preventDefault()
            resizeTo(height - KEYBOARD_STEP)
        }
    }

    return (
        <section className="combat-log" aria-label="Combat log">
            {!collapsed && (
                <button
                    type="button"
                    className="combat-log-resize"
                    aria-label="Resize combat log"
                    title="Drag to resize"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={() => { dragRef.current = null }}
                    onPointerCancel={() => { dragRef.current = null }}
                    onKeyDown={handleKeyDown}
                />
            )}
            <button
                type="button"
                className="combat-log-toggle"
                aria-expanded={!collapsed}
                onClick={() => setCollapsed((current) => !current)}
            >
                <span>Log</span>
                <span aria-hidden="true">{collapsed ? "▴" : "▾"}</span>
            </button>
            {!collapsed && (
                <ol className="combat-log-list" style={{ height }}>
                    {entries.length === 0 ? (
                        <li className="combat-log-empty">Nothing has happened yet.</li>
                    ) : entries.map((entry) => (
                        <li
                            key={entry.id}
                            className={`combat-log-entry ${entry.kind}`}
                        >
                            {entry.text}
                        </li>
                    ))}
                </ol>
            )}
        </section>
    )
}

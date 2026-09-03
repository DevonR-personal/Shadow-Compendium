import { useState } from "react"

type CombatLootBarProps = {
    readonly yen: number
    readonly items: string[]
}

export default function CombatLootBar({
    yen,
    items,
}: CombatLootBarProps) {
    const lootKey = `${yen}:${items.join("\u0000")}`
    const [dismissedLootKey, setDismissedLootKey] = useState<string | null>(null)

    if (yen === 0 && items.length === 0) {
        return null
    }

    if (dismissedLootKey === lootKey) {
        return null
    }

    return (
        <div className="combat-loot-bar">
            <strong>
                {yen}¥
            </strong>

            {items.length > 0 && (
                <span>
                    {" — "}
                    {items.join(", ")}
                </span>
            )}

            <button
                type="button"
                className="combat-loot-dismiss"
                aria-label="Hide loot"
                onClick={() => setDismissedLootKey(lootKey)}
            >
                X
            </button>
        </div>
    )
}
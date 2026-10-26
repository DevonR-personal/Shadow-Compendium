import { useState } from "react"

type CombatLootBarProps = {
    readonly yen: number
    readonly items: string[]
    readonly notice?: { id: string; message: string } | null
}

export default function CombatLootBar({
    yen,
    items,
    notice = null,
}: CombatLootBarProps) {
    const lootKey = `${yen}:${items.join("\u0000")}`
    const [dismissedLootKey, setDismissedLootKey] = useState<string | null>(null)
    const contentKey = `${lootKey}:${notice?.id ?? ""}`

    if (yen === 0 && items.length === 0 && !notice) {
        return null
    }

    if (dismissedLootKey === contentKey) {
        return null
    }

    return (
        <div className="combat-loot-bar">
            {notice && <strong className="combat-loot-notice">{notice.message}</strong>}
            {(yen > 0 || items.length > 0) && <strong>{yen}¥</strong>}

            {items.length > 0 && (
                <span>
                    {items.join(", ")}
                </span>
            )}

            <button
                type="button"
                className="combat-loot-dismiss"
                aria-label="Hide loot"
                onClick={() => setDismissedLootKey(contentKey)}
            >
                X
            </button>
        </div>
    )
}
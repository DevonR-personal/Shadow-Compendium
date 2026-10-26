import { useState } from "react"
import { AFFINITY_LABELS, AFFINITY_ORDER } from "../constants/affinities"
import type { AffinityElement, Combatant } from "../types"
import type { DamageType } from "../utils/damageResolution"

type DamageDialogProps = {
    readonly combatant: Combatant
    readonly sources: readonly Combatant[]
    readonly defaultSourceId: number | null
    readonly onCancel: () => void
    readonly onConfirm: (
        amount: number,
        damageType: DamageType,
        sourceId: number | null,
    ) => void
}

export default function DamageDialog({
    combatant,
    sources,
    defaultSourceId,
    onCancel,
    onConfirm,
}: DamageDialogProps) {
    const [amount, setAmount] = useState("")
    const [damageType, setDamageType] = useState<DamageType>(null)
    const [sourceId, setSourceId] = useState<number | null>(defaultSourceId)

    function submit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        if (amount === "") return
        onConfirm(Number(amount), damageType, sourceId)
    }

    const iconSrc = damageType && damageType !== "heal"
        ? `/icons/Icon_${damageType.charAt(0).toUpperCase()}${damageType.slice(1)}.png`
        : null

    return (
        <div className="damage-dialog-backdrop">
            <dialog
                className="damage-dialog"
                open
                aria-labelledby="damage-dialog-title"
            >
                <header className="damage-dialog-header">
                    <h2 id="damage-dialog-title">Damage {combatant.display_name}</h2>
                    <button type="button" onClick={onCancel} aria-label="Close damage dialog">×</button>
                </header>
                <form onSubmit={submit}>
                    <label className="damage-dialog-field">
                        <span>Amount</span>
                        <input
                            autoFocus
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={amount}
                            onChange={(event) => {
                                if (/^\d*$/.test(event.target.value)) {
                                    setAmount(event.target.value)
                                }
                            }}
                            aria-label="Damage amount"
                        />
                    </label>
                    <label className="damage-dialog-field">
                        <span>Damage type</span>
                        <span className="damage-type-control">
                            {iconSrc
                                ? <img src={iconSrc} alt="" />
                                : <span className={damageType === "heal" ? "damage-type-heal-icon" : "damage-type-empty-icon"}>
                                    {damageType === "heal" ? "+" : "—"}
                                </span>}
                            <select
                                value={damageType ?? ""}
                                onChange={(event) => setDamageType(
                                    event.target.value === ""
                                        ? null
                                        : event.target.value === "heal"
                                            ? "heal"
                                            : event.target.value as AffinityElement,
                                )}
                                aria-label="Damage type"
                            >
                                <option value="">No element</option>
                                <option value="heal">Heal</option>
                                {AFFINITY_ORDER.map((entry) => (
                                    <option key={entry} value={entry}>{AFFINITY_LABELS[entry]}</option>
                                ))}
                            </select>
                        </span>
                    </label>
                    <label className="damage-dialog-field">
                        <span>Dealt by</span>
                        <span className="damage-type-control">
                            <select
                                value={sourceId ?? ""}
                                onChange={(event) => setSourceId(
                                    event.target.value === "" ? null : Number(event.target.value),
                                )}
                                aria-label="Dealt by"
                            >
                                <option value="">No character</option>
                                {sources.map((source) => (
                                    <option key={source.id} value={source.id}>{source.display_name}</option>
                                ))}
                            </select>
                        </span>
                    </label>
                    <footer className="damage-dialog-actions">
                        <button type="button" onClick={onCancel}>Cancel</button>
                        <button type="submit" disabled={amount === ""}>Confirm</button>
                    </footer>
                </form>
            </dialog>
        </div>
    )
}
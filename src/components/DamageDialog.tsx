import { useState } from "react"
import { AFFINITY_LABELS, AFFINITY_ORDER } from "../constants/affinities"
import type { Combatant } from "../types"
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

const TYPE_COLORS: Record<NonNullable<DamageType>, string> = {
    melee: "#ff9a2e",
    ranged: "#f2c14e",
    fire: "#ff5a2e",
    ice: "#3fa9ff",
    wind: "#4cd964",
    electric: "#ffe033",
    psychic: "#c05cff",
    nuclear: "#37e0e0",
    bless: "#f0d9a0",
    curse: "#ff3b52",
    heal: "#0fe794",
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

    return (
        <div className="damage-dialog-backdrop">
            <dialog
                className="damage-dialog"
                open
                aria-label={`Damage ${combatant.display_name}`}
                style={{ "--type-color": damageType ? TYPE_COLORS[damageType] : "#bbb" } as React.CSSProperties}
            >
                <form onSubmit={submit}>
                    <div className="damage-dialog-row">
                        <label className="damage-dialog-field damage-dialog-amount">
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
                        <div className="damage-dialog-field damage-dialog-type">
                            <span id="damage-type-label">Damage type</span>
                            <div
                                className="damage-type-picker"
                                role="radiogroup"
                                aria-labelledby="damage-type-label"
                            >
                                {AFFINITY_ORDER.map((entry) => (
                                    <button
                                        key={entry}
                                        type="button"
                                        role="radio"
                                        aria-checked={damageType === entry}
                                        aria-label={AFFINITY_LABELS[entry]}
                                        title={AFFINITY_LABELS[entry]}
                                        className={damageType === entry ? "damage-type-option selected" : "damage-type-option"}
                                        onClick={() => setDamageType(damageType === entry ? null : entry)}
                                    >
                                        <img
                                            src={`/icons/Icon_${entry.charAt(0).toUpperCase()}${entry.slice(1)}.png`}
                                            alt=""
                                        />
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={damageType === "heal"}
                                    aria-label="Heal"
                                    title="Heal"
                                    className={damageType === "heal" ? "damage-type-option selected" : "damage-type-option"}
                                    onClick={() => setDamageType(damageType === "heal" ? null : "heal")}
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={damageType === null}
                                    aria-label="No element"
                                    title="No element"
                                    className={damageType === null ? "damage-type-option selected" : "damage-type-option"}
                                    onClick={() => setDamageType(null)}
                                >
                                    <span className="damage-type-none">-</span>
                                </button>
                            </div>
                        </div>
                    </div>
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
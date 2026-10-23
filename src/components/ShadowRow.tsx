import type { Shadow } from "../types"

type ShadowRowProps = {
    readonly shadow: Shadow
    readonly onClick: (shadow: Shadow) => void
    readonly onAddToCombat: (shadow: Shadow) => void
}

export default function ShadowRow({
    shadow,
    onClick,
    onAddToCombat,
}: ShadowRowProps) {
    return (
        <div className="shadow-row">

            <button
                type="button"
                className="shadow-name-button"
                onClick={() => onAddToCombat(shadow)}
            >
                {shadow.name}
            </button>

            <span className="shadow-row-hp">
                {shadow.max_hp}
            </span>

            <span className="shadow-level">
                {shadow.level}
            </span>

            <button
                type="button"
                className="shadow-view-button"
                onClick={() => onClick(shadow)}
            >
                ✎
            </button>

        </div>
    )
}
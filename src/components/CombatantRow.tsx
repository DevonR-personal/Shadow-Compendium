import type { Combatant, Shadow } from "../types"
import type { getConditions } from "../services/conditions"
import {
    formatModifier,
    type ModifierKey,
} from "../utils/modifiers"
import AffinityGrid from "./AffinityGrid"
import HealthBar from "./HealthBar"

type CombatantRowProps = {
    readonly combatant: Combatant
    readonly shadow: Shadow | undefined
    readonly playerView: boolean
    readonly conditions: Awaited<ReturnType<typeof getConditions>>["data"]
    readonly onSelectShadow: (shadow: Shadow, combatant?: Combatant) => void
    readonly onDamage: (combatant: Combatant) => void
    readonly onToggleDowned: (combatant: Combatant) => void
    readonly onConditionChange: (
        combatant: Combatant,
        value: string
    ) => void
    readonly onModifierChange: (
        combatant: Combatant,
        key: ModifierKey,
        value: number
    ) => void
    readonly onRemove: (id: number) => void
    readonly highlighted: boolean
}

function CombatantName({
    combatant,
    shadow,
    onSelectShadow,
}: Pick<CombatantRowProps, "combatant" | "shadow" | "onSelectShadow">) {
    if (combatant.combatant_type === "shadow" && shadow) {
        return (
            <button
                type="button"
                className="combatant-name-button"
                onClick={() => onSelectShadow(shadow, combatant)}
            >
                {combatant.display_name}
            </button>
        )
    }

    return <span className="combatant-name-text">{combatant.display_name}</span>
}

function CombatantStatus({
    combatant,
    playerView,
    conditions,
    onToggleDowned,
    onConditionChange,
}: Pick<CombatantRowProps, "combatant" | "playerView" | "conditions" | "onToggleDowned" | "onConditionChange">) {
    if (playerView) {
        return (
            <div className="status-display">
                {combatant.downed && (
                    <span className="downed-label">DOWNED!</span>
                )}
                {combatant.condition && (
                    <span className="condition-label">
                        {combatant.condition.name}
                    </span>
                )}
            </div>
        )
    }

    return (
        <div className="status-controls">
            <select
                className="condition-select"
                value={combatant.condition_id ?? ""}
                onChange={(event) =>
                    onConditionChange(combatant, event.target.value)
                }
            >
                <option value="">—</option>
                {conditions.map((condition) => (
                    <option key={condition.id} value={condition.id}>
                        {condition.name}
                    </option>
                ))}
            </select>
            <button
                type="button"
                className={combatant.downed
                    ? "downed-toggle active"
                    : "downed-toggle"}
                onClick={() => onToggleDowned(combatant)}
            >
                {combatant.downed ? "Downed!" : "Down"}
            </button>
        </div>
    )
}

function getModifierOptions(modifierKey: ModifierKey) {
    if (modifierKey === "accuracy_mod") {
        return [-2, 2]
    }

    return Array.from({ length: 13 }, (_, index) => -12 + index * 2)
        .filter((entry) => entry !== 0)
}

function getModifierCellStyle(value: number, turns: number) {
    if (value === 0 || turns === 0) {
        return {
            background: "rgba(27, 30, 35, 0.9)",
            borderColor: "rgba(255, 255, 255, 0.12)",
        }
    }

    const intensity = turns === 3 ? 1.0 : turns === 2 ? 0.65 : 0.35
    const isPositive = value > 0

    return {
        background: isPositive
            ? `rgba(51, 102, 255, ${intensity * 0.9})`
            : `rgba(255, 68, 68, ${intensity * 0.9})`,
        borderColor: isPositive
            ? "rgba(100, 180, 255, 1)"
            : "rgba(255, 150, 150, 1)",
    }
}

function ModifierCell({
    combatant,
    modifierKey,
    playerView,
    onModifierChange,
}: Pick<CombatantRowProps, "combatant" | "playerView" | "onModifierChange"> & {
    readonly modifierKey: ModifierKey
}) {
    const value = combatant[modifierKey] ?? 0
    const turns = (combatant[`${modifierKey}_turns` as keyof Combatant] as number | null | undefined) ?? 0
    const displayValue = value === 0 || turns === 0 ? "-" : formatModifier(value)

    const cellStyle = getModifierCellStyle(value, turns)
    const options = getModifierOptions(modifierKey)

    if (playerView) {
        return (
            <span className="modifier-value" style={cellStyle}>
                {displayValue}
            </span>
        )
    }

    return (
        <div className="modifier-cell" style={cellStyle}>
            <select
                className="modifier-select"
                value={value === 0 || turns === 0 ? "" : String(value)}
                onChange={(event) => onModifierChange(combatant, modifierKey, Number(event.target.value))}
                aria-label={`Set ${modifierKey}`}
                style={{ background: "transparent" }}
            >
                <option value="">—</option>
                {options.map((entry) => (
                    <option key={entry} value={String(entry)}>
                        {entry > 0 ? `+${entry}` : entry}
                    </option>
                ))}
            </select>
        </div>
    )
}

function CombatantAffinities({
    combatant,
    shadow,
    playerView,
}: Pick<CombatantRowProps, "combatant" | "shadow" | "playerView">) {
    if (combatant.combatant_type === "shadow" && shadow && playerView) {
        return (
            <>
                <div className="player-affinity-spacer" />
                <div className="affinity-grid-wrapper">
                    <AffinityGrid
                        affinities={shadow.shadow_affinities}
                        revealHiddenValues={false}
                    />
                </div>
            </>
        )
    }

    return (
        <div className={combatant.combatant_type === "shadow"
            ? "gm-affinity-spacer"
            : playerView
                ? "player-affinity-fill"
                : "gm-affinity-spacer"} />
    )
}

function CombatantHealth({
    combatant,
    playerView,
    onDamage,
}: Pick<CombatantRowProps, "combatant" | "playerView" | "onDamage">) {
    if (playerView && combatant.combatant_type === "shadow") {
        return (
            <HealthBar
                hp={combatant.hp}
                maxHp={combatant.max_hp}
            />
        )
    }

    if (playerView) {
        return <div className="player-health-spacer" />
    }

    return (
        <button
            className="combatant-hp"
            type="button"
            onClick={() => onDamage(combatant)}
        >
            {combatant.hp ?? "-"}/{combatant.max_hp ?? "-"}
        </button>
    )
}

export default function CombatantRow({
    combatant,
    shadow,
    playerView,
    conditions,
    onSelectShadow,
    onDamage,
    onToggleDowned,
    onConditionChange,
    onModifierChange,
    onRemove,
    highlighted,
}: CombatantRowProps) {
    return (
        <>
            <div
                className={[
                    "combatant-row",
                    playerView
                        ? "player-combatant-row"
                        : "gm-combatant-row",
                    combatant.is_current_turn ? "current-turn" : "",
                    highlighted ? "turn-highlight" : "",
                ].join(" ")}
                key={combatant.id}
            >
                <span className="combatant-init">
                    {combatant.initiative ?? 0}
                </span>

                <span className="combatant-name-cell">
                    <CombatantName
                        combatant={combatant}
                        shadow={shadow}
                        onSelectShadow={onSelectShadow}
                    />
                </span>

                <span className="combatant-status">
                    <CombatantStatus
                        combatant={combatant}
                        playerView={playerView}
                        conditions={conditions}
                        onToggleDowned={onToggleDowned}
                        onConditionChange={onConditionChange}
                    />
                </span>

                <ModifierCell
                    combatant={combatant}
                    modifierKey="damage_mod"
                    playerView={playerView}
                    onModifierChange={onModifierChange}
                />
                <ModifierCell
                    combatant={combatant}
                    modifierKey="armor_mod"
                    playerView={playerView}
                    onModifierChange={onModifierChange}
                />
                <ModifierCell
                    combatant={combatant}
                    modifierKey="accuracy_mod"
                    playerView={playerView}
                    onModifierChange={onModifierChange}
                />

                <CombatantAffinities
                    combatant={combatant}
                    shadow={shadow}
                    playerView={playerView}
                />

                <CombatantHealth
                    combatant={combatant}
                    playerView={playerView}
                    onDamage={onDamage}
                />

                {!playerView && (
                    <button
                        className="remove-button"
                        type="button"
                        onClick={() => onRemove(combatant.id)}
                    >
                        x
                    </button>
                )}
            </div>

            {combatant.condition?.description && (
                <div
                    className={[
                        "combatant-condition-row",
                        playerView
                            ? "player-condition-row"
                            : "gm-condition-row",
                    ].join(" ")}
                >
                    {combatant.condition.description}
                </div>
            )}
        </>
    )
}

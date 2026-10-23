import type { Combatant, Shadow } from "../types"
import type { getConditions } from "../services/conditions"
import {
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
    readonly onTriggerCutin: () => void
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

function getModifierOptions(modifierKey: ModifierKey, level: number | null) {
    const max = modifierKey === "accuracy_mod" ? 2 : 12
    const alternating: number[] = []

    for (let step = 2; step <= max; step += 2) {
        alternating.push(step, -step)
    }

    const tl = (level ?? 0) * 2

    if (tl < 2 || tl > max) {
        return alternating
    }

    return [
        tl,
        -tl,
        ...alternating.filter((entry) => Math.abs(entry) !== tl),
    ]
}

function getModifierCellStyle(value: number, turns: number) {
    if (value === 0 || turns === 0) {
        return {
            background: "transparent",
            borderColor: "transparent",
        }
    }

    const isPositive = value > 0

    return {
        background: isPositive
            ? "rgba(10, 110, 72, 0.9)"
            : "rgba(150, 38, 38, 0.9)",
        borderColor: isPositive
            ? "rgba(15, 231, 148, 0.7)"
            : "rgba(255, 150, 150, 1)",
    }
}

function formatArrowModifier(value: number) {
    return `${value > 0 ? "▲" : "▼"} ${Math.abs(value)}`
}

function ModifierFadeBar({
    turns,
    debuff,
}: {
    readonly turns: number
    readonly debuff: boolean
}) {
    return (
        <span
            className={debuff
                ? "modifier-fade-bar modifier-fade-bar-debuff"
                : "modifier-fade-bar"}
            style={{ height: `${(Math.min(turns, 3) / 3) * 100}%` }}
        />
    )
}

function ModifierCell({
    combatant,
    level,
    modifierKey,
    playerView,
    onModifierChange,
}: Pick<CombatantRowProps, "combatant" | "playerView" | "onModifierChange"> & {
    readonly level: number | null
    readonly modifierKey: ModifierKey
}) {
    const value = combatant[modifierKey] ?? 0
    const turns = (combatant[`${modifierKey}_turns` as keyof Combatant] as number | null | undefined) ?? 0
    const isActive = value !== 0 && turns !== 0
    const displayValue = isActive ? formatArrowModifier(value) : "-"
    const pulseClass = isActive && turns === 1 ? " modifier-pulse" : ""

    const cellStyle = getModifierCellStyle(value, turns)
    const options = getModifierOptions(modifierKey, level)

    if (playerView) {
        return (
            <span
                className={`modifier-value${pulseClass}${isActive ? "" : " modifier-blank"}`}
                style={isActive ? cellStyle : undefined}
            >
                {isActive && displayValue}
                {isActive && <ModifierFadeBar turns={turns} debuff={value < 0} />}
            </span>
        )
    }

    return (
        <div
            className={`modifier-cell${pulseClass}${isActive ? "" : " modifier-blank"}`}
            style={isActive ? cellStyle : undefined}
        >
            {isActive && (
                <span className="modifier-current-value">
                    {displayValue}
                </span>
            )}
            {isActive && <ModifierFadeBar turns={turns} debuff={value < 0} />}
            <select
                className="modifier-select"
                value={value === 0 || turns === 0 ? "" : String(value)}
                onChange={(event) => onModifierChange(combatant, modifierKey, Number(event.target.value))}
                aria-label={`Set ${modifierKey}`}
            >
                <option value="">—</option>
                {options.map((entry) => (
                    <option key={entry} value={String(entry)}>
                        {formatArrowModifier(entry)}
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
    onTriggerCutin,
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
                    level={shadow?.level ?? null}
                    modifierKey="damage_mod"
                    playerView={playerView}
                    onModifierChange={onModifierChange}
                />
                <ModifierCell
                    combatant={combatant}
                    level={shadow?.level ?? null}
                    modifierKey="armor_mod"
                    playerView={playerView}
                    onModifierChange={onModifierChange}
                />
                <ModifierCell
                    combatant={combatant}
                    level={shadow?.level ?? null}
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

                {!playerView && combatant.combatant_type === "player" ? (
                    <button
                        className="cutin-trigger"
                        type="button"
                        onClick={onTriggerCutin}
                        aria-label={`Play Wiz weakness cut-in for ${combatant.display_name}`}
                        title="Play Wiz weakness cut-in"
                    >
                        ✦
                    </button>
                ) : !playerView ? <span className="cutin-trigger-spacer" /> : null}

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

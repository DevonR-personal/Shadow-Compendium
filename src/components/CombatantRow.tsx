import type { Combatant, Shadow } from "../types"
import type { getConditions } from "../services/conditions"
import AffinityGrid from "./AffinityGrid"
import HealthBar from "./HealthBar"

type CombatantRowProps = {
    readonly combatant: Combatant
    readonly shadow: Shadow | undefined
    readonly playerView: boolean
    readonly conditions: Awaited<ReturnType<typeof getConditions>>["data"]
    readonly onSelectShadow: (shadow: Shadow) => void
    readonly onDamage: (combatant: Combatant) => void
    readonly onToggleDowned: (combatant: Combatant) => void
    readonly onConditionChange: (
        combatant: Combatant,
        value: string
    ) => void
    readonly onRemove: (id: number) => void
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
                onClick={() => onSelectShadow(shadow)}
            >
                {combatant.display_name}
            </button>
        )
    }

    return <span>{combatant.display_name}</span>
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

function CombatantAffinities({
    combatant,
    shadow,
    playerView,
}: Pick<CombatantRowProps, "combatant" | "shadow" | "playerView">) {
    if (combatant.combatant_type === "shadow" && shadow && playerView) {
        return (
            <AffinityGrid
                affinities={shadow.shadow_affinities}
                revealHiddenValues={false}
            />
        )
    }

    return (
        <div className={combatant.combatant_type === "shadow"
            ? "gm-affinity-spacer"
            : "player-affinity-spacer"} />
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
    onRemove,
}: CombatantRowProps) {
    return (
        <div
            className={[
                "combatant-row",
                playerView
                    ? "player-combatant-row"
                    : "gm-combatant-row",
                combatant.is_current_turn
                    ? "current-turn"
                    : "",
            ].join(" ")}
            key={combatant.id}
        >
            <span className="combatant-init">
                {combatant.initiative ?? 0}
            </span>

            <CombatantName
                combatant={combatant}
                shadow={shadow}
                onSelectShadow={onSelectShadow}
            />

            <span className="combatant-status">
                <CombatantStatus
                    combatant={combatant}
                    playerView={playerView}
                    conditions={conditions}
                    onToggleDowned={onToggleDowned}
                    onConditionChange={onConditionChange}
                />
            </span>

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
    )
}

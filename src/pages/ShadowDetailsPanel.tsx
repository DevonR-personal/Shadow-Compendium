import type {
    Combatant,
    Shadow,
    Skill,
    SkillAffinity,
} from "../types"
import { AFFINITY_LABELS } from "../constants/affinities"
import { getSkillModifier } from "../utils/skills"
import AffinityGrid from "../components/AffinityGrid"

type ShadowDetailsPanelProps = {
    readonly shadow: Shadow | null
    readonly combatant?: Combatant | null
    readonly onAffinityToggle: (
        affinityId: number,
        discovered: boolean
    ) => void
    readonly highlightedSkillId: number | null
}

function getSkillAffinityLabel(
    affinity: SkillAffinity
) {
    if (affinity === "almighty") {
        return "Almighty"
    }

    return AFFINITY_LABELS[affinity]
}

function getDamageRoll(description: string | null) {
    return description?.match(/\b\d+d\d+\b/i)?.[0] ?? null
}

function SkillTable({
    title,
    skills,
    shadow,
    combatant,
    showAffinityAndRoll,
    highlightedSkillId,
}: {
    readonly title: string
    readonly skills: Skill[]
    readonly shadow: Shadow
    readonly combatant?: Combatant | null
    readonly showAffinityAndRoll: boolean
    readonly highlightedSkillId: number | null
}) {
    if (skills.length === 0) {
        return null
    }

    return (
        <section className="shadow-details-section">
            <h3>{title}</h3>
            <table className={showAffinityAndRoll
                ? "shadow-skill-table full"
                : "shadow-skill-table compact"}>
                <tbody>
                    {skills.map((skill) => (
                        <SkillTableRows
                            key={skill.id}
                            skill={skill}
                            modifier={getSkillModifier(skill, shadow)}
                            accuracyModifier={combatant?.accuracy_mod ?? 0}
                            damageModifier={combatant?.damage_mod ?? 0}
                            showAffinityAndRoll={showAffinityAndRoll}
                            highlighted={skill.id === highlightedSkillId}
                        />
                    ))}
                </tbody>
            </table>
        </section>
    )
}

function SkillTableRows({
    skill,
    modifier,
    accuracyModifier,
    damageModifier,
    showAffinityAndRoll,
    highlighted,
}: {
    readonly skill: Skill
    readonly modifier: number | null
    readonly accuracyModifier: number
    readonly damageModifier: number
    readonly showAffinityAndRoll: boolean
    readonly highlighted: boolean
}) {
    const affinityImage = skill.affinity
        ? `/icons/Icon_${getSkillAffinityLabel(skill.affinity)}.png`
        : null
    const damageRoll = getDamageRoll(skill.description)
    const effectiveModifier = modifier === null
        ? null
        : modifier + accuracyModifier
    const damageSuffix = damageModifier === 0
        ? ""
        : `${damageModifier > 0 ? "+" : ""}${damageModifier}`
    const formattedDamage = damageRoll
        ? damageRoll + damageSuffix
        : "—"

    return (
        <>
            <tr className={highlighted
                ? "shadow-skill-summary skill-turn-highlight"
                : "shadow-skill-summary"}>
                <th scope="row">{skill.name}</th>
                {showAffinityAndRoll && (
                    <td>
                        {affinityImage ? (
                            <img
                                className="shadow-skill-affinity-image"
                                src={affinityImage}
                                alt={skill.affinity ?? ""}
                            />
                        ) : (
                            "—"
                        )}
                    </td>
                )}
                <td>
                    {effectiveModifier === null
                        ? "—"
                        : effectiveModifier >= 0
                            ? `+${effectiveModifier}`
                            : effectiveModifier}
                </td>
                {showAffinityAndRoll && (
                    <td>{formattedDamage}</td>
                )}
            </tr>
            <tr className="shadow-skill-description">
                <td colSpan={showAffinityAndRoll ? 4 : 2}>
                    {skill.description ?? "No description."}
                </td>
            </tr>
        </>
    )
}

export default function ShadowDetailsPanel({
    shadow,
    combatant,
    onAffinityToggle,
    highlightedSkillId,
}: ShadowDetailsPanelProps) {
    if (!shadow) {
        return (
            <aside className="shadow-details-panel empty">
                <p>
                    Select a Shadow to view its details.
                </p>
            </aside>
        )
    }

    const stats =
        shadow.shadow_stats?.[0] ?? null
    const armorTotal = (shadow.armor ?? 0) + (combatant?.armor_mod ?? 0)

    const skills = shadow.shadow_skills
        .flatMap((entry) => entry.skills)

    const regularSkills =
        skills
            .filter(
                (skill) =>
                    skill.type === "skill"
            )
            .slice(0, 8)

    const activeSkills =
        skills
            .filter(
                (skill) =>
                    skill.type === "active"
            )
            .slice(0, 4)

    const passiveSkills =
        skills
            .filter(
                (skill) =>
                    skill.type === "passive"
            )
            .slice(0, 4)

    return (
        <aside className="shadow-details-panel">

            <header className="shadow-details-header">
                <h2>
                    {shadow.name}
                </h2>

                <span className="shadow-details-level">
                    TL {shadow.level ?? "—"}
                </span>
            </header>


            <section className="shadow-details-meta">

                <div>
                    <span className="shadow-details-label">
                        Arcana
                    </span>

                    <strong>
                        {shadow.arcana ?? "—"}
                    </strong>
                </div>

                <div className="shadow-details-loot">
                    <span className="shadow-details-label">
                        Loot
                    </span>

                    <strong>
                        {shadow.loot_item ?? "—"}
                    </strong>
                </div>

            </section>


            <section className="shadow-details-combat">

                <div>
                    <span className="shadow-details-label">
                        HP
                    </span>

                    <strong>
                        {shadow.max_hp}
                    </strong>
                </div>

                <div>
                    <span className="shadow-details-label">
                        Armor
                    </span>

                    <strong>
                        {armorTotal >= 0 ? `${armorTotal}` : armorTotal}
                    </strong>
                </div>

            </section>

            <section className="shadow-details-affinities">
                <h3>Affinities</h3>
                <div className="shadow-affinity-grid">
                    <AffinityGrid
                        affinities={
                            shadow.shadow_affinities
                        }
                        revealHiddenValues={true}
                        onAffinityClick={(affinity) =>
                            onAffinityToggle(
                                affinity.id,
                                !affinity.discovered
                            )
                        }
                    />
                </div>
            </section>

            <section className="shadow-stats">

                <div className="shadow-stat">
                    <span className="shadow-stat-label">
                        STR
                    </span>

                    <span className="shadow-stat-value">
                        {stats
                            ? `${stats.strength >= 0 ? "+" : ""}${stats.strength}`
                            : "—"}
                    </span>
                </div>


                <div className="shadow-stat">
                    <span className="shadow-stat-label">
                        AGI
                    </span>

                    <span className="shadow-stat-value">
                        {stats
                            ? `${stats.agility >= 0 ? "+" : ""}${stats.agility}`
                            : "—"}
                    </span>
                </div>


                <div className="shadow-stat">
                    <span className="shadow-stat-label">
                        END
                    </span>

                    <span className="shadow-stat-value">
                        {stats
                            ? `${stats.endurance >= 0 ? "+" : ""}${stats.endurance}`
                            : "—"}
                    </span>
                </div>


                <div className="shadow-stat">
                    <span className="shadow-stat-label">
                        MAG
                    </span>

                    <span className="shadow-stat-value">
                        {stats
                            ? `${stats.magic >= 0 ? "+" : ""}${stats.magic}`
                            : "—"}
                    </span>
                </div>

            </section>


            <SkillTable
                title="Skills"
                skills={regularSkills}
                shadow={shadow}
                combatant={combatant}
                showAffinityAndRoll={true}
                highlightedSkillId={highlightedSkillId}
            />
            <SkillTable
                title="Active"
                skills={activeSkills}
                shadow={shadow}
                combatant={combatant}
                showAffinityAndRoll={false}
                highlightedSkillId={highlightedSkillId}
            />
            <SkillTable
                title="Passive"
                skills={passiveSkills}
                shadow={shadow}
                combatant={combatant}
                showAffinityAndRoll={false}
                highlightedSkillId={highlightedSkillId}
            />

        </aside>
    )
}
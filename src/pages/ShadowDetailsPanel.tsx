import type {
    Shadow,
    Skill,
    SkillAffinity,
} from "../types"
import { AFFINITY_LABELS } from "../constants/affinities"
import { getSkillModifier } from "../utils/skills"
import AffinityGrid from "../components/AffinityGrid"

type ShadowDetailsPanelProps = {
    readonly shadow: Shadow | null
    readonly onAffinityToggle: (
        affinityId: number,
        discovered: boolean
    ) => void
}

function getSkillAffinityLabel(
    affinity: SkillAffinity
) {
    if (affinity === "almighty") {
        return "Almighty"
    }

    return AFFINITY_LABELS[affinity]
}

function SkillCard({
    skill,
    modifier,
}: {
    readonly skill: Skill
    readonly modifier: number | null
}) {
    const affinityClass = skill.affinity
        ? ` ${skill.affinity}`
        : ""

    const iconSrc = skill.affinity
        ? `/icons/Icon_${getSkillAffinityLabel(skill.affinity)}.png`
        : null

    return (
        <div className={`shadow-skill-card${affinityClass}`}
            title={skill.description ?? undefined}>

            {iconSrc && (
                <img
                    className="shadow-skill-icon"
                    src={iconSrc}
                    alt=""
                />
            )}

            <div className="shadow-skill-name">
                {skill.name}
            </div>

            {modifier !== null && (
                <div className="shadow-skill-modifier">
                    {modifier >= 0
                        ? `+${modifier}`
                        : modifier}
                </div>
            )}

        </div>
    )
}

export default function ShadowDetailsPanel({
    shadow,
    onAffinityToggle,
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
                        {shadow.armor ?? "—"}
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


            <section className="shadow-details-section">

                <h3>
                    Skills
                </h3>

                <div className="shadow-skill-grid">

                    {regularSkills.map(
                        (skill) => (
                            <SkillCard
                                key={skill.id}
                                skill={skill}
                                modifier={getSkillModifier(skill, shadow)}
                            />
                        )
                    )}

                </div>

            </section>


            <section className="shadow-details-section">

                <h3>
                    Active
                </h3>

                <div className="shadow-move-grid">

                    {activeSkills.map(
                        (skill) => (
                            <SkillCard
                                key={skill.id}
                                skill={skill}
                                modifier={getSkillModifier(skill, shadow)}
                            />
                        )
                    )}

                </div>

            </section>


            <section className="shadow-details-section">

                <h3>
                    Passive
                </h3>

                <div className="shadow-move-grid">

                    {passiveSkills.map(
                        (skill) => (
                            <SkillCard
                                key={skill.id}
                                skill={skill}
                                modifier={getSkillModifier(skill, shadow)}
                            />
                        )
                    )}

                </div>

            </section>

        </aside>
    )
}
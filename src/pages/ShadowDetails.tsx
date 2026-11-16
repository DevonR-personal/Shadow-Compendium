import type {
    Skill,
    Shadow,
    Affinity,
    SkillAffinity,
} from "../types"
import { AFFINITY_LABELS } from "../constants/affinities"
import { getSkillModifier } from "../utils/skills"
import AffinityGrid from "../components/AffinityGrid"

type ShadowDetailsProps = {
  readonly gmMode: boolean
  readonly shadow: Shadow

  readonly affinities: Affinity[]
  readonly affinitiesLoading: boolean

  readonly onBack: () => void
  readonly onEdit: () => void

  readonly onToggleDiscovery: (
    affinityId: number,
    discovered: boolean
  ) => void

  readonly error: string | null
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
    showAffinityAndRoll,
}: {
    readonly title: string
    readonly skills: Skill[]
    readonly shadow: Shadow
    readonly showAffinityAndRoll: boolean
}) {
    if (skills.length === 0) {
        return null
    }

    return (
        <section className="shadow-details-section">
            <h3>{title}</h3>
            <div className="shadow-details-fullscreen-skills">
                {skills.map((skill) => (
                    <table
                        key={skill.id}
                        className={showAffinityAndRoll
                            ? "shadow-skill-table full"
                            : "shadow-skill-table compact"}
                    >
                        <tbody>
                            <SkillTableRows
                                skill={skill}
                                modifier={getSkillModifier(skill, shadow)}
                                showAffinityAndRoll={showAffinityAndRoll}
                            />
                        </tbody>
                    </table>
                ))}
            </div>
        </section>
    )
}

function SkillTableRows({
    skill,
    modifier,
    showAffinityAndRoll,
}: {
    readonly skill: Skill
    readonly modifier: number | null
    readonly showAffinityAndRoll: boolean
}) {
    const affinityImage = skill.affinity
        ? `/icons/Icon_${getSkillAffinityLabel(skill.affinity)}.png`
        : null
    const damageRoll = getDamageRoll(skill.description)
    const formattedDamage = damageRoll
        ? damageRoll
        : "—"

    return (
        <>
            <tr className="shadow-skill-summary">
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
                    {modifier === null
                        ? "—"
                        : modifier >= 0
                            ? `+${modifier}`
                            : modifier}
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

export default function ShadowDetails({
  gmMode,
  shadow,
  onBack,
  onEdit,
  onToggleDiscovery,
  error,
}: ShadowDetailsProps) {
  const stats = shadow.shadow_stats?.[0] ?? null
  const armorTotal = shadow.armor ?? 0

  const skills = shadow.shadow_skills
    .flatMap((entry) => entry.skills)

  const regularSkills = skills
    .filter((skill) => skill.type === "skill")

  const activeSkills = skills
    .filter((skill) => skill.type === "active")

  const passiveSkills = skills
    .filter((skill) => skill.type === "passive")

  return (
    <main className="app shadow-details-fullscreen">
      <div className="shadow-details-fullscreen-toolbar">
        <button
          type="button"
          onClick={onBack}
        >
          ← Back to Shadow Library
        </button>

        {gmMode && (
          <button
            type="button"
            onClick={onEdit}
          >
            Edit Shadow
          </button>
        )}
      </div>

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      <div className="shadow-details-fullscreen-container">
        <section className="shadow-details-fullscreen-main">
          <header className="shadow-details-header">
            <h2>
              {shadow.name}
            </h2>

            <div className="shadow-details-meta">
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
            </div>

            <div className="shadow-details-header-meta">
              <span>
                Armor <strong>{armorTotal}</strong>
              </span>
              <span aria-hidden="true">|</span>
              <span className="shadow-details-level">
                TL {shadow.level ?? "—"}
              </span>
            </div>
          </header>

          <SkillTable
            title="Skills"
            skills={regularSkills}
            shadow={shadow}
            showAffinityAndRoll={true}
          />
          <SkillTable
            title="Active"
            skills={activeSkills}
            shadow={shadow}
            showAffinityAndRoll={false}
          />
          <SkillTable
            title="Passive"
            skills={passiveSkills}
            shadow={shadow}
            showAffinityAndRoll={false}
          />

          <div className="shadow-details-fullscreen-summary">
            <section className="shadow-stats">
              <div className="shadow-stat">
                <span className="shadow-stat-label">STR</span>
                <span className="shadow-stat-value">
                  {stats
                    ? `${stats.strength >= 0 ? "+" : ""}${stats.strength}`
                    : "—"}
                </span>
              </div>
              <div className="shadow-stat">
                <span className="shadow-stat-label">AGI</span>
                <span className="shadow-stat-value">
                  {stats
                    ? `${stats.agility >= 0 ? "+" : ""}${stats.agility}`
                    : "—"}
                </span>
              </div>
              <div className="shadow-stat">
                <span className="shadow-stat-label">END</span>
                <span className="shadow-stat-value">
                  {stats
                    ? `${stats.endurance >= 0 ? "+" : ""}${stats.endurance}`
                    : "—"}
                </span>
              </div>
              <div className="shadow-stat">
                <span className="shadow-stat-label">MAG</span>
                <span className="shadow-stat-value">
                  {stats
                    ? `${stats.magic >= 0 ? "+" : ""}${stats.magic}`
                    : "—"}
                </span>
              </div>
            </section>

            <section className="shadow-details-affinities" aria-label="Affinities">
              <div className="shadow-affinity-grid">
                <AffinityGrid
                  affinities={shadow.shadow_affinities}
                  revealHiddenValues={true}
                  onAffinityClick={(affinity) =>
                    onToggleDiscovery(
                      affinity.id,
                      !affinity.discovered
                    )
                  }
                />
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
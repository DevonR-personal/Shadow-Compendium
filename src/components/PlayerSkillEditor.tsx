import { useEffect, useState } from "react"
import type { Player, PlayerSkill, Skill } from "../types"
import { getSkills } from "../services/skills"
import {
    addPlayerSkill,
    getPlayerSkills,
    removePlayerSkill,
} from "../services/playerSkills"

type PlayerSkillEditorProps = {
    readonly player: Player
    readonly onClose: () => void
}

export default function PlayerSkillEditor({
    player,
    onClose,
}: PlayerSkillEditorProps) {
    const [playerSkills, setPlayerSkills] = useState<PlayerSkill[]>([])
    const [skills, setSkills] = useState<Skill[]>([])
    const [search, setSearch] = useState("")
    const [pickerOpen, setPickerOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [selectedSkillId, setSelectedSkillId] = useState<number | "">("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function loadData() {
        const [playerSkillsResult, skillsResult] = await Promise.all([
            getPlayerSkills(player.id),
            getSkills(),
        ])

        if (playerSkillsResult.error || skillsResult.error) {
            setError(
                playerSkillsResult.error?.message ??
                skillsResult.error?.message ??
                "Unable to load skills."
            )
        } else {
            setPlayerSkills(playerSkillsResult.data)
            setSkills(skillsResult.data)
        }

        setLoading(false)
    }

    useEffect(() => {
        void loadData()
    }, [player.id])

    async function handleAddSkill() {
        if (selectedSkillId === "") {
            return
        }

        setSaving(true)
        setError(null)
        const addError = await addPlayerSkill(player.id, selectedSkillId)

        if (addError) {
            setError(addError.message)
            setSaving(false)
            return
        }

        onClose()
    }

    async function handleRemoveSkill(id: number) {
        const removeError = await removePlayerSkill(id)

        if (removeError) {
            setError(removeError.message)
            return
        }

        setPlayerSkills((current) => current.filter((entry) => entry.id !== id))
    }

    const normalizedSearch = search.trim().toLowerCase()
    const availableSkills = skills.filter((skill) =>
        !playerSkills.some((entry) => entry.skill_id === skill.id) &&
        skill.name.toLowerCase().includes(normalizedSearch)
    )

    return (
        <section className="player-skill-editor">
            <div className="player-skill-editor-header">
                <h2>{player.name}</h2>
                <button type="button" onClick={onClose}>Cancel</button>
            </div>

            {error && <p className="error">{error}</p>}
            {loading ? (
                <p>Loading skills...</p>
            ) : (
                <>
                    <table className="player-skill-table">
                        <thead>
                            <tr>
                                <th scope="col">Skill</th>
                                <th scope="col">Type</th>
                                <th scope="col">Description</th>
                                <th scope="col"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {playerSkills.map((entry) => (
                                <tr key={entry.id}>
                                    <th scope="row">{entry.skill.name}</th>
                                    <td>{entry.skill.type}</td>
                                    <td>{entry.skill.description ?? "No description."}</td>
                                    <td>
                                        <button
                                            type="button"
                                            onClick={() => void handleRemoveSkill(entry.id)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="player-skill-add">
                        {!pickerOpen ? (
                            <button type="button" onClick={() => setPickerOpen(true)}>
                                Add Skill
                            </button>
                        ) : (
                            <div className="player-skill-picker">
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search skills"
                                    aria-label="Search skills"
                                    autoFocus
                                />
                                <select
                                    value={selectedSkillId}
                                    onChange={(event) => setSelectedSkillId(
                                        event.target.value === ""
                                            ? ""
                                            : Number(event.target.value)
                                    )}
                                    aria-label="Choose skill"
                                >
                                    <option value="">Choose a skill</option>
                                    {availableSkills.map((skill) => (
                                        <option key={skill.id} value={skill.id}>
                                            {skill.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => void handleAddSkill()}
                                    disabled={saving || selectedSkillId === ""}
                                >
                                    {saving ? "Adding..." : "Add"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPickerOpen(false)
                                        setSelectedSkillId("")
                                        setSearch("")
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </section>
    )
}

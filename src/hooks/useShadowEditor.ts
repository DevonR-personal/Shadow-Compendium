import { useEffect, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Affinity, AffinityValue, Shadow } from "../types"
import {
    getAffinities,
    updateAffinityDiscovery,
    updateAffinityValue,
} from "../services/affinities"
import { updateShadow } from "../services/shadows"
import { getErrorMessage } from "../utils/errors"
import { AFFINITY_ORDER } from "../constants/affinities"

type UseShadowEditorProps = {
    readonly selectedShadow: Shadow | null
    readonly setSelectedShadow: Dispatch<SetStateAction<Shadow | null>>
    readonly setShadows: Dispatch<SetStateAction<Shadow[]>>
    readonly setError: Dispatch<SetStateAction<string | null>>
    readonly setEditing: Dispatch<SetStateAction<boolean>>
}

export function useShadowEditor({
    selectedShadow,
    setSelectedShadow,
    setShadows,
    setError,
    setEditing,
}: UseShadowEditorProps) {
    const [affinities, setAffinities] = useState<Affinity[]>([])
    const [affinitiesLoading, setAffinitiesLoading] = useState(false)
    const [editName, setEditName] = useState("")
    const [editLevel, setEditLevel] = useState<number | "">("")
    const [editAffinities, setEditAffinities] = useState<
        Record<string, AffinityValue>
    >({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!selectedShadow) {
            setAffinities([])
            return
        }

        const shadowId = selectedShadow.id

        async function loadAffinities() {
            setAffinitiesLoading(true)

            try {
                setError(null)
                setAffinities(await getAffinities(shadowId))
            } catch (loadError) {
                console.error(loadError)
                setError(getErrorMessage(loadError))
            } finally {
                setAffinitiesLoading(false)
            }
        }

        void loadAffinities()
    }, [selectedShadow, setError])

    function startEditing() {
        if (!selectedShadow) return

        setEditName(selectedShadow.name)
        setEditLevel(selectedShadow.level ?? "")

        const affinityValues: Record<string, AffinityValue> = {}

        for (const element of AFFINITY_ORDER) {
            const affinity = affinities.find(
                (item) => item.element === element
            )
            affinityValues[element] =
                (affinity?.value as AffinityValue) ?? "neutral"
        }

        setEditAffinities(affinityValues)
        setEditing(true)
        setError(null)
    }

    function changeAffinity(element: string, value: AffinityValue) {
        setEditAffinities((current) => ({
            ...current,
            [element]: value,
        }))
    }

    async function saveShadow() {
        if (!selectedShadow) return

        setSaving(true)
        setError(null)

        try {
            const updatedShadow = await updateShadow(
                selectedShadow.id,
                editName.trim(),
                editLevel === "" ? null : Number(editLevel),
                selectedShadow.armor,
                selectedShadow.arcana,
                selectedShadow.loot_item
            )

            for (const element of AFFINITY_ORDER) {
                const affinity = affinities.find(
                    (item) => item.element === element
                )

                if (affinity) {
                    await updateAffinityValue(
                        affinity.id,
                        editAffinities[element]
                    )
                }
            }

            setSelectedShadow((current) =>
                current
                    ? { ...current, ...updatedShadow }
                    : current
            )
            setShadows((current) =>
                current.map((shadow) =>
                    shadow.id === updatedShadow.id
                        ? { ...shadow, ...updatedShadow }
                        : shadow
                )
            )
            setAffinities(await getAffinities(updatedShadow.id))
            setEditing(false)
            return true
        } catch (saveError) {
            console.error(saveError)
            setError(getErrorMessage(saveError))
            return false
        } finally {
            setSaving(false)
        }
    }

    async function toggleDiscovery(
        affinityId: number,
        discovered: boolean
    ) {
        try {
            setError(null)
            await updateAffinityDiscovery(affinityId, discovered)
            setAffinities((current) =>
                current.map((affinity) =>
                    affinity.id === affinityId
                        ? { ...affinity, discovered }
                        : affinity
                )
            )
            setSelectedShadow((current) =>
                current
                    ? {
                        ...current,
                        shadow_affinities:
                            current.shadow_affinities.map((affinity) =>
                                affinity.id === affinityId
                                    ? { ...affinity, discovered }
                                    : affinity
                            ),
                    }
                    : current
            )
        } catch (toggleError) {
            console.error(toggleError)
            setError(getErrorMessage(toggleError))
        }
    }

    return {
        affinities,
        affinitiesLoading,
        editName,
        editLevel,
        editAffinities,
        saving,
        setEditName,
        setEditLevel,
        startEditing,
        changeAffinity,
        saveShadow,
        toggleDiscovery,
    }
}

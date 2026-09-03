import { useCallback, useEffect, useState } from "react"
import type { Shadow } from "../types"
import { getShadows } from "../services/shadows"
import { getErrorMessage } from "../utils/errors"

export function useShadowLibrary() {
    const [shadows, setShadows] = useState<Shadow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function loadShadows() {
        try {
            setError(null)
            const result = await getShadows()

            if (result.error) {
                setError(result.error.message)
            } else {
                setShadows(result.data)
            }
        } catch (loadError) {
            console.error(loadError)
            setError(getErrorMessage(loadError))
        } finally {
            setLoading(false)
        }
    }

    const refreshShadows = useCallback(async () => {
        const result = await getShadows()

        if (result.error) {
            console.error(result.error)
            return
        }

        setShadows(result.data)
    }, [])

    useEffect(() => {
        void loadShadows()
    }, [])

    return {
        shadows,
        setShadows,
        loading,
        error,
        refreshShadows,
    }
}

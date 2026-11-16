import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../supabase"
import {
    createHealthNotification,
    isHealthNotification,
    type HealthNotification,
} from "../utils/healthNotifications"

export function useHealthNotifications() {
    const [notifications, setNotifications] = useState<HealthNotification[]>([])
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const localChannelRef = useRef<BroadcastChannel | null>(null)

    useEffect(() => {
        const seen = new Set<string>()
        const timers = new Set<number>()

        function receive(value: unknown) {
            if (!isHealthNotification(value) || seen.has(value.id)) return
            seen.add(value.id)
            setNotifications((current) => [...current, value])
            const timer = window.setTimeout(() => {
                setNotifications((current) => current.filter((entry) => entry.id !== value.id))
                seen.delete(value.id)
                timers.delete(timer)
            }, 2000)
            timers.add(timer)
        }

        const localChannel = new BroadcastChannel("shadow-tracker-health-notifications")
        localChannel.onmessage = (event: MessageEvent<unknown>) => receive(event.data)
        localChannelRef.current = localChannel

        const channel = supabase
            .channel("encounter-health-notifications", {
                config: { broadcast: { self: false } },
            })
            .on("broadcast", { event: "health-change" }, (event) => receive(event.payload))
            .subscribe()
        channelRef.current = channel

        return () => {
            channelRef.current = null
            localChannelRef.current = null
            localChannel.close()
            void supabase.removeChannel(channel)
            timers.forEach((timer) => window.clearTimeout(timer))
        }
    }, [])

    const notifyHealthChange = useCallback((
        combatantId: number,
        previousHp: number,
        nextHp: number,
        revealAmount: boolean,
    ) => {
        const notification = createHealthNotification(
            window.crypto.randomUUID(), combatantId, previousHp, nextHp, revealAmount,
        )
        if (!notification) return

        localChannelRef.current?.postMessage(notification)
        const channel = channelRef.current
        if (!channel) {
            console.error("Health notification channel is unavailable")
            return
        }
        void channel.send({
            type: "broadcast",
            event: "health-change",
            payload: notification,
        }).then((result) => {
            if (result !== "ok") console.error("Health notification broadcast failed:", result)
        }).catch((error: unknown) => {
            console.error("Health notification broadcast failed:", error)
        })
    }, [])

    return { notifications, notifyHealthChange }
}

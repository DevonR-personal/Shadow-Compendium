import { useCallback, useEffect, useRef, useState } from "react"
import { getPlayers } from "../services/players"
import { supabase } from "../supabase"
import type { Player } from "../types"

export function usePlayers() {
    const [players, setPlayers] = useState<Player[]>([])
    const requestId = useRef(0)
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
    const localChannelRef = useRef<BroadcastChannel | null>(null)

    const refreshPlayers = useCallback(async () => {
        const id = ++requestId.current
        const result = await getPlayers()

        if (result.error) {
            console.error(result.error)
        } else if (id === requestId.current) {
            setPlayers(result.data)
        }

        return result.error
    }, [])

    useEffect(() => {
        const requestCounter = requestId
        void refreshPlayers()

        const localChannel = new BroadcastChannel("shadow-tracker-player-updates")
        localChannel.onmessage = () => {
            void refreshPlayers()
        }
        localChannelRef.current = localChannel

        const channel = supabase
            .channel("player-updates")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "players" },
                () => {
                    void refreshPlayers()
                }
            )
            .on("broadcast", { event: "refresh" }, () => {
                void refreshPlayers()
            })
            .subscribe()
        channelRef.current = channel

        const interval = window.setInterval(() => {
            void refreshPlayers()
        }, 2000)

        return () => {
            requestCounter.current++
            channelRef.current = null
            localChannelRef.current = null
            localChannel.close()
            void supabase.removeChannel(channel)
            window.clearInterval(interval)
        }
    }, [refreshPlayers])

    const notifyPlayersChanged = useCallback(async () => {
        localChannelRef.current?.postMessage("refresh")
        const channel = channelRef.current
        if (channel) {
            void channel.send({
                type: "broadcast",
                event: "refresh",
                payload: {},
            }).then((result) => {
                if (result !== "ok") {
                    console.error("Player update broadcast failed:", result)
                }
            }).catch((error: unknown) => {
                console.error("Player update broadcast failed:", error)
            })
        }

        return refreshPlayers()
    }, [refreshPlayers])

    return { players, setPlayers, notifyPlayersChanged }
}

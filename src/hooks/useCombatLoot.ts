import { useEffect, useState } from "react"
import { getCombatLoot } from "../services/combatants"
import { supabase } from "../supabase"
import type { CombatLoot } from "../utils/combat"

export function useCombatLoot() {
    const [combatLoot, setCombatLoot] = useState<CombatLoot>({
        yen: 0,
        items: [],
    })

    useEffect(() => {
        async function loadCombatLoot() {
            const result = await getCombatLoot()

            if (result.error) {
                console.error(result.error)
                return
            }

            setCombatLoot({
                yen: result.yen,
                items: result.items,
            })
        }

        void loadCombatLoot()

        const combatStateChannel = supabase
            .channel("combat-state-loot")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "combat_state",
                },
                () => {
                    void loadCombatLoot()
                }
            )
            .subscribe()

        return () => {
            void supabase.removeChannel(combatStateChannel)
        }
    }, [])

    return {
        combatLoot,
        setCombatLoot,
    }
}

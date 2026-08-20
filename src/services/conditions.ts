import { supabase } from "../supabase"

export type Condition = {
    id: number
    name: string
    description: string
}

export async function getConditions() {
    const { data, error } = await supabase
        .from("conditions")
        .select("id, name, description")
        .order("name")

    if (error) {
        return {
            data: [],
            error,
        }
    }

    return {
        data: (data ?? []) as Condition[],
        error: null,
    }
}
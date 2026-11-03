// To add a character: drop the video in public/cutin and add one entry here.
// `match` is tested against the combatant's display name.
const WEAKNESS_CUTINS = {
    Wiz: { src: "/cutin/Wiz_cutin.mp4", match: null },
    Nik: { src: "/cutin/Nik_cutin.mp4", match: /nikolas/i },
    Elle: { src: "/cutin/Elle_cutin.mp4", match: /\b(elle|kelsey)\b/i },
    Lufel: { src: "/cutin/Lufel_cutin.mp4", match: /\b(lufel|ruferu)\b/i }
} as const satisfies Record<string, { src: string; match: RegExp | null }>

export type WeaknessCutinCharacter = keyof typeof WEAKNESS_CUTINS

// Used when no other character's pattern matches.
const DEFAULT_CHARACTER: WeaknessCutinCharacter = "Wiz"

export function getWeaknessCutinSource(character: WeaknessCutinCharacter): string {
    return WEAKNESS_CUTINS[character].src
}

export function getWeaknessCutinCharacter(displayName: string): WeaknessCutinCharacter {
    const entries = Object.entries(WEAKNESS_CUTINS) as [
        WeaknessCutinCharacter,
        { match: RegExp | null },
    ][]
    const found = entries.find(([, { match }]) => match?.test(displayName))
    return found?.[0] ?? DEFAULT_CHARACTER
}

export function isWeaknessCutinCharacter(value: unknown): value is WeaknessCutinCharacter {
    return typeof value === "string" && Object.hasOwn(WEAKNESS_CUTINS, value)
}

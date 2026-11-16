export type HealthNotification = {
    readonly id: string
    readonly combatantId: number
    readonly delta: number
}

export function createHealthNotification(
    id: string,
    combatantId: number,
    previousHp: number,
    nextHp: number,
    revealAmount: boolean,
): HealthNotification | null {
    const delta = nextHp - previousHp
    return revealAmount && delta !== 0 ? { id, combatantId, delta } : null
}

export function formatReflectNotice(amount: number, element: string, revealAmount: boolean) {
    return revealAmount
        ? `${amount} ${element} damage was reflected!`
        : `${element} damage was reflected!`
}

export function isHealthNotification(value: unknown): value is HealthNotification {
    if (typeof value !== "object" || value === null) return false
    const notification = value as Partial<HealthNotification>
    return typeof notification.id === "string" &&
        typeof notification.combatantId === "number" &&
        Number.isFinite(notification.combatantId) &&
        typeof notification.delta === "number" &&
        Number.isFinite(notification.delta) &&
        notification.delta !== 0
}

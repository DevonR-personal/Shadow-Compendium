export function rollDice(
    count: number,
    sides: number
) {
    let total = 0

    for (let i = 0; i < count; i++) {
        const randomValue = new Uint32Array(1)
        crypto.getRandomValues(randomValue)
        total += (randomValue[0] % sides) + 1
    }

    return total
}
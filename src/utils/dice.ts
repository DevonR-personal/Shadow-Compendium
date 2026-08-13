export function rollDice(
    count: number,
    sides: number
) {
    let total = 0

    for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1
    }

    return total
}
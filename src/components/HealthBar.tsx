type HealthBarProps = {
    readonly hp: number | null
    readonly maxHp: number | null
}

const HEART_COUNT = 5

export default function HealthBar({
    hp,
    maxHp,
}: HealthBarProps) {
    if (
        hp === null ||
        maxHp === null ||
        maxHp <= 0
    ) {
        return (
            <div className="health-bar">
                <span className="health-status">
                    —
                </span>
            </div>
        )
    }

    const percentage = Math.max(
        0,
        Math.min(100, (hp / maxHp) * 100)
    )

    return (
        <div
            className="health-bar"
            aria-label={`${Math.round(percentage)}% health`}
        >
            {Array.from(
                { length: HEART_COUNT },
                (_, index) => {
                    const heartStart =
                        index * (100 / HEART_COUNT)

                    const fill =
                        Math.max(
                            0,
                            Math.min(
                                100,
                                (
                                    percentage -
                                    heartStart
                                ) *
                                    HEART_COUNT
                            )
                        )

                    return (
                        <span
                            key={index}
                            className="health-heart"
                        >
                            <span
                                className="health-heart-fill"
                                style={{
                                    width: `${fill}%`,
                                }}
                            >
                                ♥
                            </span>

                            <span className="health-heart-empty">
                                ♥
                            </span>
                        </span>
                    )
                }
            )}
        </div>
    )
}
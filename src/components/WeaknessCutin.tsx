import { useEffect, useRef } from "react"

type WeaknessCutinProps = {
    readonly playToken: number
    readonly onFinish: () => void
}

function smoothstep(edge0: number, edge1: number, value: number) {
    const amount = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
    return amount * amount * (3 - 2 * amount)
}

export default function WeaknessCutin({
    playToken,
    onFinish,
}: WeaknessCutinProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas?.getContext("2d", { willReadFrequently: true })

        if (!video || !canvas || !context) return

        const activeVideo = video
        const activeCanvas = canvas
        const activeContext = context

        let animationFrame = 0

        function drawKeyedFrame() {
            if (activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                const scale = Math.min(
                    1,
                    1280 / activeVideo.videoWidth,
                    720 / activeVideo.videoHeight,
                )
                const width = Math.max(1, Math.round(activeVideo.videoWidth * scale))
                const height = Math.max(1, Math.round(activeVideo.videoHeight * scale))

                if (activeCanvas.width !== width || activeCanvas.height !== height) {
                    activeCanvas.width = width
                    activeCanvas.height = height
                }

                activeContext.drawImage(activeVideo, 0, 0, width, height)
                const frame = activeContext.getImageData(0, 0, width, height)
                const pixels = frame.data

                for (let index = 0; index < pixels.length; index += 4) {
                    const red = pixels[index]
                    const green = pixels[index + 1]
                    const blue = pixels[index + 2]
                    const greenDominance = green - Math.max(red, blue)
                    const keyedAmount = smoothstep(24, 92, greenDominance)

                    if (keyedAmount > 0) {
                        pixels[index + 1] = Math.round(
                            green - (green - Math.max(red, blue)) * keyedAmount * 0.8,
                        )
                        pixels[index + 3] = Math.round(pixels[index + 3] * (1 - keyedAmount))
                    }
                }

                activeContext.putImageData(frame, 0, 0)
            }

            if (!activeVideo.ended && !activeVideo.paused) {
                animationFrame = window.requestAnimationFrame(drawKeyedFrame)
            }
        }

        function startDrawing() {
            window.cancelAnimationFrame(animationFrame)
            drawKeyedFrame()
        }

        activeVideo.addEventListener("play", startDrawing)
        void activeVideo.play().catch(onFinish)

        return () => {
            activeVideo.removeEventListener("play", startDrawing)
            window.cancelAnimationFrame(animationFrame)
        }
    }, [onFinish, playToken])

    return (
        <div className="weakness-cutin">
            <video
                ref={videoRef}
                src="/cutin/Wiz_cutin.mp4"
                autoPlay
                muted
                playsInline
                onEnded={onFinish}
                onError={onFinish}
            />
            <canvas ref={canvasRef} />
            <button type="button" onClick={onFinish} aria-label="Dismiss cut-in">
                ×
            </button>
        </div>
    )
}
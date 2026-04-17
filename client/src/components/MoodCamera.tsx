import { useEffect, useMemo, useRef, useState } from 'react'
import { mapExpressionToMoodTag, type MoodTag } from '../lib/mood'
import { loadFaceApi } from '../lib/faceApiLoader'

type Decision =
  | { kind: 'ok'; mood: MoodTag; expression: string; confidence: number }
  | { kind: 'uncertain'; expression: string | null; confidence: number }

export default function MoodCamera({
  onDecision,
}: {
  onDecision: (decision: Decision) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<number | null>(null)
  const sampleHistoryRef = useRef<Array<{expression: string; confidence: number}>>([])
  const finalDecisionRef = useRef<Decision | null>(null)

  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expression, setExpression] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)

  const hint = useMemo(() => {
    if (!error) return null
    if (error === 'models_missing') {
      return 'Place the face-api.js model files in client/public/models (TinyFaceDetector + FaceExpressionNet).'
    }
    return null
  }, [error])

  function stopCamera() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const s = videoRef.current.srcObject as MediaStream
      s.getTracks().forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  function getFinalMoodStats() {
    const samples = sampleHistoryRef.current
    if (samples.length === 0) return null

    const count: Record<string, number> = {}
    samples.forEach((s) => {
      count[s.expression] = (count[s.expression] || 0) + 1
    })

    const topMood = Object.keys(count).reduce((a, b) => (count[a] > count[b] ? a : b))
    const topSamples = samples.filter((s) => s.expression === topMood)
    const avgConfidence = topSamples.reduce((sum, item) => sum + item.confidence, 0) / topSamples.length

    return { expression: topMood, confidence: avgConfidence, votes: count[topMood], total: samples.length }
  }

  function decideMood(): Decision {
    const stats = getFinalMoodStats()

    if (finalDecisionRef.current) {
      return finalDecisionRef.current
    }

    if (!stats || sampleHistoryRef.current.length < 5) {
      return {
        kind: 'uncertain',
        expression: stats?.expression || null,
        confidence: stats?.confidence || 0,
      }
    }

    const decision: Decision = stats.confidence > 0.6
      ? {
          kind: 'ok',
          mood: mapExpressionToMoodTag(stats.expression),
          expression: stats.expression,
          confidence: stats.confidence,
        }
      : {
          kind: 'uncertain',
          expression: stats.expression,
          confidence: stats.confidence,
        }

    if (decision.kind === 'ok') {
      finalDecisionRef.current = decision
    }

    return decision
  }

  useEffect(() => {
    let cancelled = false

    async function start() {
      setError(null)
      setIsReady(false)

      let faceapiLib: any
      try {
        faceapiLib = await loadFaceApi()
      } catch {
        setError('faceapi_not_loaded')
        return
      }

      try {
        await faceapiLib.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapiLib.nets.faceExpressionNet.loadFromUri('/models')
      } catch {
        setError('models_missing')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (!videoRef.current) throw new Error('no_video')
        videoRef.current.srcObject = stream
      } catch {
        setError('camera_denied')
        return
      }

      setIsReady(true)

      intervalRef.current = window.setInterval(async () => {
        const video = videoRef.current
        if (!video) return

        try {
          const detections = await faceapiLib
            .detectAllFaces(video, new faceapiLib.TinyFaceDetectorOptions())
            .withFaceExpressions()

          if (detections.length > 0) {
            const expressions = detections[0].expressions
            const mood = Object.keys(expressions).reduce((a, b) =>
              expressions[a] > expressions[b] ? a : b,
            )
            const conf = Number(expressions[mood] || 0)

            sampleHistoryRef.current.push({ expression: mood, confidence: conf })
            if (sampleHistoryRef.current.length > 5) sampleHistoryRef.current.shift()

            setExpression(mood)
            setConfidence(conf)

            const decision = decideMood()
            onDecision(decision)

            if (decision.kind === 'ok') {
              // final mood arrived, stop detection to lock final value
              finalDecisionRef.current = decision
              if (intervalRef.current) {
                window.clearInterval(intervalRef.current)
                intervalRef.current = null
              }
            }
          } else {
            setExpression(null)
            setConfidence(0)
            onDecision(decideMood())
          }
        } catch {
          onDecision(decideMood())
        }
      }, 2000)
    }

    start()

    return () => {
      cancelled = true
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="cameraCard">
      <div className="cameraHeader">
        <div>
          <div className="sectionTitle">AI Mood Detection</div>
          <div className="muted">
            {isReady ? 'Detecting every 2 seconds' : 'Starting camera…'}
            {expression ? ` • ${expression} (${confidence.toFixed(2)})` : ''}
          </div>
        </div>
      </div>

      {error ? (
        <div className="error">
          {error === 'camera_denied'
            ? 'Camera permission denied.'
            : error === 'models_missing'
              ? 'Face models not found.'
              : 'Face API not loaded.'}
          {hint ? <div className="muted" style={{ marginTop: 6 }}>{hint}</div> : null}
        </div>
      ) : null}

      <video id="video" ref={videoRef} width={400} height={300} autoPlay playsInline className="video" />
    </div>
  )
}


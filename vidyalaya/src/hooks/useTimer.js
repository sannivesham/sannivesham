import { useCallback, useEffect, useRef, useState } from 'react'

export function useTimer(initialSeconds) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    setSecondsLeft(initialSeconds)
    setRunning(false)
  }, [initialSeconds])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const start = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => setRunning(false), [])
  const reset = useCallback(() => {
    setRunning(false)
    setSecondsLeft(initialSeconds)
  }, [initialSeconds])

  return { secondsLeft, running, start, pause, reset, isDone: secondsLeft === 0 }
}

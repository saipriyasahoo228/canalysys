import { useEffect, useRef, useState } from 'react'

export function usePolling(queryKey, queryFn, { intervalMs = 10_000, enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const tickRef = useRef(0)

  const refresh = async () => {
    const tick = ++tickRef.current
    try {
      setLoading(true)
      const res = await queryFn()
      if (tick !== tickRef.current) return
      setData(res)
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!enabled) return

    let alive = true
    let timer = null

    const run = async () => {
      const tick = ++tickRef.current
      try {
        setLoading((v) => (data ? v : true))
        const res = await queryFn()
        if (!alive) return
        if (tick !== tickRef.current) return
        setData(res)
        setError(null)
      } catch (e) {
        if (!alive) return
        setError(e)
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    run()
    timer = setInterval(run, intervalMs)

    return () => {
      alive = false
      if (timer) clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, enabled, intervalMs])

  return { data, error, loading, refresh }
}

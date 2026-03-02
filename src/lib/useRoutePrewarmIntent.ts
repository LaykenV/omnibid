import { useCallback, useRef } from 'react'

export function useRoutePrewarmIntent(prewarmFn: () => void) {
  const hasFired = useRef(false)

  const handlePrewarm = useCallback(() => {
    if (hasFired.current) {
      return
    }

    hasFired.current = true
    prewarmFn()
  }, [prewarmFn])

  return {
    onMouseEnter: handlePrewarm,
    onFocus: handlePrewarm,
    onTouchStart: handlePrewarm,
  }
}

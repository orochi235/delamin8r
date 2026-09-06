import { useCallback, useEffect, useRef, useState } from 'react'
import { reticulize } from './reticulize.js'
import type { DriverName, Driver, ReticuleHandle, ReticuleOptions } from './types.js'

export interface UseReticule<T extends HTMLElement> {
  /** Put this on the container you want to become the parallax window. */
  ref: (node: T | null) => void
  handle: ReticuleHandle | null
  enableOrientation: () => Promise<boolean>
  setDriver: (driver: DriverName | Driver | false) => void
}

/**
 * A thin wrapper over `reticulize`. Options are read once when the container
 * mounts; change the `key` on the container to rebuild with new ones.
 */
export function useReticule<T extends HTMLElement = HTMLDivElement>(options: ReticuleOptions = {}): UseReticule<T> {
  const [handle, setHandle] = useState<ReticuleHandle | null>(null)
  const opts = useRef(options)
  opts.current = options

  const ref = useCallback((node: T | null) => {
    if (!node) {
      setHandle(null)
      return
    }
    setHandle(reticulize(node, opts.current))
  }, [])

  useEffect(() => () => handle?.destroy(), [handle])

  return {
    ref,
    handle,
    enableOrientation: useCallback(async () => (await handle?.enableOrientation()) ?? false, [handle]),
    setDriver: useCallback((d: DriverName | Driver | false) => handle?.setDriver(d), [handle]),
  }
}

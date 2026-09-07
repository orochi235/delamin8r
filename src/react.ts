import { useCallback, useEffect, useRef, useState } from 'react'
import { delaminate } from './delaminate.js'
import type { DriverName, Driver, DelaminateHandle, DelaminateOptions } from './types.js'

export interface UseDelaminate<T extends HTMLElement> {
  /** Put this on the container you want to become the parallax window. */
  ref: (node: T | null) => void
  handle: DelaminateHandle | null
  enableOrientation: () => Promise<boolean>
  setDriver: (driver: DriverName | Driver | false) => void
}

/**
 * A thin wrapper over `delaminate`. Options are read once when the container
 * mounts; change the `key` on the container to rebuild with new ones.
 */
export function useDelaminate<T extends HTMLElement = HTMLDivElement>(options: DelaminateOptions = {}): UseDelaminate<T> {
  const [handle, setHandle] = useState<DelaminateHandle | null>(null)
  const opts = useRef(options)
  opts.current = options

  const ref = useCallback((node: T | null) => {
    if (!node) {
      setHandle(null)
      return
    }
    setHandle(delaminate(node, opts.current))
  }, [])

  useEffect(() => () => handle?.destroy(), [handle])

  return {
    ref,
    handle,
    enableOrientation: useCallback(async () => (await handle?.enableOrientation()) ?? false, [handle]),
    setDriver: useCallback((d: DriverName | Driver | false) => handle?.setDriver(d), [handle]),
  }
}

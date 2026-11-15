import { afterEach, describe, expect, it, vi } from 'vitest'
import { delaminate } from '../src/delaminate.js'
import type { Driver } from '../src/types.js'
import './setup.js'

const driver = () => ({ start: vi.fn<Driver['start']>(), stop: vi.fn<Driver['stop']>() })

function mount(): HTMLElement {
  document.body.innerHTML = '<div id="panel"><h2>Title</h2><p>Body</p></div>'
  return document.getElementById('panel')!
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('handle lifecycle', () => {
  it('drops a custom driver whose start throws, and rethrows', () => {
    const handle = delaminate(mount(), { driver: false })
    const bad: Driver = {
      start: () => {
        throw new Error('no sensor')
      },
      stop: vi.fn(),
    }
    expect(() => handle.setDriver(bad)).toThrow('no sensor')
    const next = driver()
    handle.setDriver(next)
    expect(bad.stop).not.toHaveBeenCalled()
    expect(next.start).toHaveBeenCalledOnce()
    handle.destroy()
  })

  it('does nothing after destroy, and destroy is safe to repeat', () => {
    const panel = mount()
    const before = panel.outerHTML
    const handle = delaminate(panel, { driver: false })
    handle.destroy()
    handle.destroy()
    const late = driver()
    handle.setDriver(late)
    handle.refresh()
    handle.set(1, 1)
    expect(late.start).not.toHaveBeenCalled()
    expect(panel.outerHTML).toBe(before)
  })

  it('attaches nothing when orientation permission resolves after destroy', async () => {
    let grant: (v: string) => void = () => {}
    class Orientation {
      static requestPermission = () => new Promise<string>((r) => (grant = r))
    }
    vi.stubGlobal('DeviceOrientationEvent', Orientation)
    const panel = mount()
    const before = panel.outerHTML
    const handle = delaminate(panel, { driver: false })
    const asked = handle.enableOrientation()
    handle.destroy()
    grant('granted')
    await expect(asked).resolves.toBe(false)
    expect(panel.outerHTML).toBe(before)
  })
})

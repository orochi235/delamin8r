import { useDelaminate } from 'delamin8r/react'

export function Panel() {
  const { ref } = useDelaminate<HTMLDivElement>()
  return <div ref={ref}>{/* whatever you already had */}</div>
}

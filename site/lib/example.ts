/** A recipe: small enough that its own source is the explanation. */
export interface Example {
  id: string
  title: string
  note: string
  /** Highlighted HTML of the marked region of the module itself. */
  source: string
  mount(host: HTMLElement): () => void
}

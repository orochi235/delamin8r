import { delaminate } from 'delamin8r'

const handle = delaminate(document.querySelector('.panel') as HTMLElement)

// ...and to put the DOM back exactly as it was:
handle.destroy()

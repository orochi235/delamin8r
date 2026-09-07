/**
 * The subject the labs measure. Nothing in it knows about delamin8r — the
 * point of every page that uses it is that it is an ordinary card.
 */
export const SPECIMEN = `
  <div class="card">
    <div class="card__sheen" data-dl-skip></div>
    <div class="card__head">
      <h3 class="card__title">deploy 4f2a91c</h3>
      <span class="badge">staged</span>
    </div>
    <p class="card__lede">
      Seven checks ran against the branch. Nothing here was authored for depth &mdash;
      the tree already had it.
    </p>
    <dl class="rows">
      <div class="row"><dt>build</dt><dd class="row__val">42s</dd></div>
      <div class="row"><dt>typecheck</dt><dd class="row__val">clean</dd></div>
      <div class="row"><dt>unit</dt><dd class="row__val">318 / 318</dd></div>
      <div class="row"><dt>bundle</dt><dd class="row__val">21.4 kB</dd></div>
    </dl>
    <div class="card__foot">
      <button class="btn btn--go" type="button">promote</button>
      <button class="btn" type="button">logs</button>
    </div>
  </div>
`

export const stage = (extra = '') => `<div class="stagewrap"${extra}>${SPECIMEN}</div>`

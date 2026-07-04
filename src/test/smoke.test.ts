import { describe, it, expect } from 'vitest'

// Smoke test verifying the Vitest + jsdom toolchain is wired up correctly.
describe('test toolchain smoke test', () => {
  it('runs a trivial assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('has a jsdom DOM environment available', () => {
    const el = document.createElement('div')
    el.textContent = 'hsk'
    expect(el.textContent).toBe('hsk')
  })
})

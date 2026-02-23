/* global before, beforeEach, after, describe, it */

import { expect } from 'chai'
import { createElement, render } from 'preact' /** @jsx createElement */
import DropdownArrowDown from '../../src/dropdown-arrow-down'

describe('DropdownArrowDown', () => {
  describe('rendering', () => {
    let scratch

    before(() => {
      scratch = document.createElement('div');
      (document.body || document.documentElement).appendChild(scratch)
    })

    beforeEach(() => {
      // Preact 10: use render(null) instead of innerHTML = '' to properly
      // unmount components and reset Preact's internal VDOM state
      render(null, scratch)
    })

    after(() => {
      scratch.parentNode.removeChild(scratch)
      scratch = null
    })

    describe('basic usage', () => {
      it('renders an svg', () => {
        render(<DropdownArrowDown />, scratch)

        expect(scratch.innerHTML).to.contain('svg')
      })

      it('renders with a given custom class', () => {
        render(<DropdownArrowDown className='foo' />, scratch)

        // Preact 10: query the element directly rather than checking innerHTML
        // as attribute serialisation order is not guaranteed
        const svg = scratch.querySelector('svg')
        expect(svg.getAttribute('class')).to.equal('foo')
      })

      // IE issue so the dropdown svg is not focusable (tabindex won't work for this)
      it('renders an svg where focusable attribute is false', () => {
        render(<DropdownArrowDown />, scratch)

        // Preact 10: query the element directly rather than checking innerHTML
        const svg = scratch.querySelector('svg')
        expect(svg.getAttribute('focusable')).to.equal('false')
      })
    })
  })
})

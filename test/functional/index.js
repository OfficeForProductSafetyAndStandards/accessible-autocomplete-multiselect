/* global after, describe, before, beforeEach, it */

import { expect } from 'chai'
import {
  createElement,
  render,
  createRef
} from 'preact' /** @jsx createElement */
import { act } from 'preact/test-utils'
import Autocomplete from '../../src/autocomplete'
import Status from '../../src/status'

function suggest (query, syncResults) {
  const results = ['France', 'Germany', 'United Kingdom']
  syncResults(
    query
      ? results.filter(function (result) {
        return result.toLowerCase().indexOf(query.toLowerCase()) !== -1
      })
      : []
  )
}

describe('Autocomplete', () => {
  describe('rendering', () => {
    let scratch

    before(() => {
      scratch = document.createElement('div');
      (document.body || document.documentElement).appendChild(scratch)
    })

    beforeEach(() => {
      render(null, scratch)
    })

    after(() => {
      scratch.parentNode.removeChild(scratch)
      scratch = null
    })

    describe('basic usage', () => {
      it('renders an input', () => {
        render(<Autocomplete />, scratch)

        expect(scratch.innerHTML).to.contain('input')
        expect(scratch.innerHTML).to.contain('class="autocomplete__input')
        expect(scratch.innerHTML).to.contain('class="autocomplete__menu')
        expect(scratch.innerHTML).to.contain('name="input-autocomplete"')
      })

      it('renders an input with a required attribute', () => {
        render(<Autocomplete required />, scratch)

        expect(scratch.innerHTML).to.contain('required')
      })

      it('renders an input without a required attribute', () => {
        render(<Autocomplete required={false} />, scratch)

        expect(scratch.innerHTML).to.not.contain('required')
      })

      it('renders an input with a name attribute', () => {
        render(<Autocomplete name='bob' />, scratch)

        expect(scratch.innerHTML).to.contain('name="bob"')
      })

      it('renders an input with a custom CSS namespace', () => {
        render(<Autocomplete cssNamespace='bob' />, scratch)

        expect(scratch.innerHTML).to.contain('class="bob__input')
        expect(scratch.innerHTML).to.contain('class="bob__menu')
      })

      it('renders with an aria-expanded attribute', () => {
        render(<Autocomplete required />, scratch)

        const wrapperElement = scratch.getElementsByClassName(
          'autocomplete__wrapper'
        )[0]
        const inputElement = wrapperElement.getElementsByTagName('input')[0]

        expect(inputElement.getAttribute('aria-expanded')).to.equal('false')
      })

      it('renders with an aria-describedby attribute', () => {
        render(<Autocomplete id='autocomplete-default' />, scratch)

        const wrapperElement = scratch.getElementsByClassName(
          'autocomplete__wrapper'
        )[0]
        const inputElement = wrapperElement.getElementsByTagName('input')[0]

        expect(inputElement.getAttribute('aria-describedby')).to.equal(
          'autocomplete-default__assistiveHint'
        )
      })

      describe('renders with an aria-autocomplete attribute', () => {
        it('of value "list", when autoselect is not enabled', () => {
          render(<Autocomplete required />, scratch)

          const wrapperElement = scratch.getElementsByClassName(
            'autocomplete__wrapper'
          )[0]
          const inputElement = wrapperElement.getElementsByTagName('input')[0]

          expect(inputElement.getAttribute('aria-autocomplete')).to.equal(
            'list'
          )
        })

        it('of value "both", when autoselect is enabled', () => {
          render(<Autocomplete required autoselect />, scratch)

          const wrapperElement = scratch.getElementsByClassName(
            'autocomplete__wrapper'
          )[0]
          const inputElement = wrapperElement.getElementsByTagName('input')[0]

          expect(inputElement.getAttribute('aria-autocomplete')).to.equal(
            'both'
          )
        })
      })

      describe('menuAttributes', () => {
        it('renders with extra attributes on the menu', () => {
          render(
            <Autocomplete
              menuAttributes={{ 'data-test': 'test' }}
              id='autocomplete-default'
            />,
            scratch
          )

          const wrapperElement = scratch.getElementsByClassName(
            'autocomplete__wrapper'
          )[0]
          const dropdownElement = wrapperElement.getElementsByTagName('ul')[0]

          expect(dropdownElement.getAttribute('data-test')).to.equal('test')
        })

        describe('attributes computed by the component', () => {
          it('does not override attributes computed by the component', () => {
            const menuAttributes = {
              id: 'custom-id',
              role: 'custom-role'
            }

            render(
              <Autocomplete
                menuAttributes={menuAttributes}
                id='autocomplete-default'
              />,
              scratch
            )

            const menuElement =
              scratch.getElementsByClassName('autocomplete__menu')[0]
            expect(menuElement.id).to.equal(
              'autocomplete-default__listbox',
              'HTML id'
            )
            expect(menuElement.role).to.equal('listbox', 'HTML role')

            expect(menuAttributes.id).to.equal('custom-id', 'options id')
            expect(menuAttributes.role).to.equal('custom-role', 'options role')
          })
        })

        it('adds `className` to the computed value of the `class` attribute', () => {
          const menuAttributes = {
            className: 'custom-className'
          }

          render(
            <Autocomplete
              menuAttributes={menuAttributes}
              id='autocomplete-default'
            />,
            scratch
          )

          const menuElement =
            scratch.getElementsByClassName('autocomplete__menu')[0]
          expect(menuElement.getAttribute('class')).to.equal(
            'autocomplete__menu autocomplete__menu--inline autocomplete__menu--hidden custom-className'
          )

          expect(menuAttributes.className).to.equal('custom-className')
        })

        it('adds `class` to the computed value of the `class` attribute, ignoring `className` if present', () => {
          const menuAttributes = {
            className: 'custom-className',
            class: 'custom-class'
          }

          render(
            <Autocomplete
              menuAttributes={menuAttributes}
              id='autocomplete-default'
            />,
            scratch
          )

          const menuElement =
            scratch.getElementsByClassName('autocomplete__menu')[0]
          expect(menuElement.getAttribute('class')).to.equal(
            'autocomplete__menu autocomplete__menu--inline autocomplete__menu--hidden custom-class'
          )

          expect(menuAttributes.className).to.equal('custom-className')
          expect(menuAttributes.class).to.equal('custom-class')
        })

        it('adds `aria-labelledby` by default, based on the ID', () => {
          render(<Autocomplete id='autocomplete-default' />, scratch)

          const wrapperElement = scratch.getElementsByClassName(
            'autocomplete__wrapper'
          )[0]
          const dropdownElement = wrapperElement.getElementsByTagName('ul')[0]

          expect(dropdownElement.getAttribute('aria-labelledby')).to.equal(
            'autocomplete-default'
          )
        })

        it('overrides `aria-labelledby` if passed in menuAttributes', () => {
          render(
            <Autocomplete
              menuAttributes={{ 'aria-labelledby': 'test' }}
              id='autocomplete-default'
            />,
            scratch
          )

          const wrapperElement = scratch.getElementsByClassName(
            'autocomplete__wrapper'
          )[0]
          const dropdownElement = wrapperElement.getElementsByTagName('ul')[0]

          expect(dropdownElement.getAttribute('aria-labelledby')).to.equal(
            'test'
          )
        })
      })

      it('renders with extra class on the input', () => {
        render(
          <Autocomplete
            inputClasses='custom-class'
            id='autocomplete-default'
          />,
          scratch
        )

        const inputElement = scratch.getElementsByClassName(
          'autocomplete__input'
        )[0]

        expect(inputElement.getAttribute('class')).to.contain(' custom-class')
      })

      it('renders with extra class on the menu', () => {
        render(
          <Autocomplete menuClasses='custom-class' id='autocomplete-default' />,
          scratch
        )

        const menuElement =
          scratch.getElementsByClassName('autocomplete__menu')[0]

        expect(menuElement.getAttribute('class')).to.contain('custom-class')
      })

      it('renders with the correct roles', () => {
        render(<Autocomplete required />, scratch)

        const wrapperElement = scratch.getElementsByClassName(
          'autocomplete__wrapper'
        )[0]
        const inputElement = wrapperElement.getElementsByTagName('input')[0]
        const dropdownElement = wrapperElement.getElementsByTagName('ul')[0]

        expect(inputElement.getAttribute('role')).to.equal(
          'combobox',
          'input should have combobox role'
        )
        expect(dropdownElement.getAttribute('role')).to.equal(
          'listbox',
          'menu should have listbox role'
        )
      })
    })
  })

  describe('behaviour', () => {
    // Preact 10: setState on unmounted instances is a no-op, and setState on mounted
    // instances is async (microtask-based). We mount each component variant into its
    // own scratch element and use act() from preact/test-utils to flush state updates
    // synchronously before making assertions.
    let scratch1, scratch2, scratch3, scratch4, scratch5
    let autocomplete,
      autoselectAutocomplete,
      onConfirmAutocomplete,
      autoselectOnSelectAutocomplete,
      confirmOnBlurAutocomplete
    let onConfirmTriggered

    before(() => {
      scratch1 = document.createElement('div')
      scratch2 = document.createElement('div')
      scratch3 = document.createElement('div')
      scratch4 = document.createElement('div')
      scratch5 = document.createElement('div')
      const body = document.body || document.documentElement
      body.appendChild(scratch1)
      body.appendChild(scratch2)
      body.appendChild(scratch3)
      body.appendChild(scratch4)
      body.appendChild(scratch5)
    })

    after(() => {
      [scratch1, scratch2, scratch3, scratch4, scratch5].forEach((s) => {
        render(null, s)
        s.parentNode.removeChild(s)
      })
    })

    beforeEach(() => {
      onConfirmTriggered = false

      const ref1 = createRef()
      const ref2 = createRef()
      const ref3 = createRef()
      const ref4 = createRef()
      const ref5 = createRef()

      act(() => {
        // Unmount any previously mounted component first so Preact doesn't reconcile
        // (update) the existing instance. Without this, the constructor never re-runs
        // and state from the previous test bleeds into the next one.
        render(null, scratch1)
        render(null, scratch2)
        render(null, scratch3)
        render(null, scratch4)
        render(null, scratch5)
        render(
          <Autocomplete
            {...Autocomplete.defaultProps}
            id='test'
            source={suggest}
            ref={ref1}
          />,
          scratch1
        )
        render(
          <Autocomplete
            {...Autocomplete.defaultProps}
            autoselect
            id='test2'
            source={suggest}
            ref={ref2}
          />,
          scratch2
        )
        render(
          <Autocomplete
            {...Autocomplete.defaultProps}
            id='test3'
            onConfirm={() => {
              onConfirmTriggered = true
            }}
            source={suggest}
            ref={ref3}
          />,
          scratch3
        )
        render(
          <Autocomplete
            {...Autocomplete.defaultProps}
            autoselect
            id='test4'
            onConfirm={() => {
              onConfirmTriggered = true
            }}
            source={suggest}
            ref={ref4}
          />,
          scratch4
        )
        render(
          <Autocomplete
            {...Autocomplete.defaultProps}
            id='test5'
            onConfirm={() => {
              onConfirmTriggered = true
            }}
            confirmOnBlur={false}
            source={suggest}
            ref={ref5}
          />,
          scratch5
        )
      })

      autocomplete = ref1.current
      autoselectAutocomplete = ref2.current
      onConfirmAutocomplete = ref3.current
      autoselectOnSelectAutocomplete = ref4.current
      confirmOnBlurAutocomplete = ref5.current

      // Override componentDidUpdate to a no-op on each test instance.
      // When tests call setState() via act(), Preact re-renders and ref callbacks
      // repopulate elementReferences with real DOM elements. Without this override,
      // componentDidUpdate would call el.focus() on those DOM elements, triggering
      // real browser blur/focus events that cascade through our handlers (e.g.
      // handleInputFocus resets `selected`, handleInputBlur closes the menu) and
      // corrupt the state we're trying to assert on. Unit tests verify state logic
      // directly; DOM focus behaviour is covered by the wdio integration suite.
      const noop = () => {}
      autocomplete.componentDidUpdate = noop
      autoselectAutocomplete.componentDidUpdate = noop
      onConfirmAutocomplete.componentDidUpdate = noop
      autoselectOnSelectAutocomplete.componentDidUpdate = noop
      confirmOnBlurAutocomplete.componentDidUpdate = noop
    })

    describe('typing', () => {
      it('searches for options', () => {
        act(() => autocomplete.handleInputChange({ target: { value: 'f' } }))
        expect(autocomplete.state.menuOpen).to.equal(true)
        expect(autocomplete.state.options).to.contain('France')
      })

      it('hides menu when no options are available', () => {
        act(() => autocomplete.handleInputChange({ target: { value: 'aa' } }))
        expect(autocomplete.state.menuOpen).to.equal(false)
        expect(autocomplete.state.options.length).to.equal(0)
      })

      it('hides menu when query becomes empty', () => {
        act(() =>
          autocomplete.setState({
            query: 'f',
            options: ['France'],
            menuOpen: true
          })
        )
        act(() => autocomplete.handleInputChange({ target: { value: '' } }))
        expect(autocomplete.state.menuOpen).to.equal(false)
      })

      it('searches with the new term when query length changes', () => {
        act(() => autocomplete.setState({ query: 'fr', options: ['France'] }))
        act(() => autocomplete.handleInputChange({ target: { value: 'fb' } }))
        expect(autocomplete.state.options.length).to.equal(0)
      })

      it('removes the aria-describedby attribute when query is non empty', () => {
        expect(autocomplete.state.ariaHint).to.equal(true)
        act(() => autocomplete.handleInputChange({ target: { value: 'a' } }))
        expect(autocomplete.state.ariaHint).to.equal(false)
        act(() => autocomplete.handleInputChange({ target: { value: '' } }))
        expect(autocomplete.state.ariaHint).to.equal(true)
      })

      describe('with minLength', () => {
        beforeEach(() => {
          const ref = createRef()
          act(() => {
            render(null, scratch1)
            render(
              <Autocomplete
                {...Autocomplete.defaultProps}
                id='test'
                source={suggest}
                minLength={2}
                ref={ref}
              />,
              scratch1
            )
          })
          autocomplete = ref.current
          autocomplete.componentDidUpdate = () => {}
        })

        it("doesn't search when under limit", () => {
          act(() => autocomplete.handleInputChange({ target: { value: 'f' } }))
          expect(autocomplete.state.menuOpen).to.equal(false)
          expect(autocomplete.state.options.length).to.equal(0)
        })

        it('does search when over limit', () => {
          act(() =>
            autocomplete.handleInputChange({ target: { value: 'fra' } })
          )
          expect(autocomplete.state.menuOpen).to.equal(true)
          expect(autocomplete.state.options).to.contain('France')
        })

        it('hides results when going under limit', () => {
          act(() =>
            autocomplete.setState({
              menuOpen: true,
              query: 'fr',
              options: ['France']
            })
          )
          act(() => autocomplete.handleInputChange({ target: { value: 'f' } }))
          expect(autocomplete.state.menuOpen).to.equal(false)
          expect(autocomplete.state.options.length).to.equal(0)
        })
      })
    })

    describe('focusing input', () => {
      describe('when no query is present', () => {
        it('does not display menu', () => {
          act(() => autocomplete.setState({ query: '' }))
          act(() => autocomplete.handleInputFocus())
          expect(autocomplete.state.menuOpen).to.equal(false)
          expect(autocomplete.state.focused).to.equal(-1)
        })
      })

      describe('when a non-matched query is present (no matching options are present)', () => {
        it('does not display menu', () => {
          act(() => autocomplete.setState({ query: 'f' }))
          act(() => autocomplete.handleInputFocus())
          expect(autocomplete.state.menuOpen).to.equal(false)
          expect(autocomplete.state.focused).to.equal(-1)
        })
      })

      describe('when a matched query is present (matching options exist)', () => {
        describe('and no user choice has yet been made', () => {
          it('displays menu', () => {
            act(() =>
              autocomplete.setState({
                menuOpen: false,
                options: ['France'],
                query: 'fr',
                focused: null,
                selected: null,
                validChoiceMade: false
              })
            )
            act(() => autocomplete.handleInputFocus())
            expect(autocomplete.state.focused).to.equal(-1)
            expect(autocomplete.state.menuOpen).to.equal(true)
            expect(autocomplete.state.selected).to.equal(-1)
          })
        })
        describe('and a user choice HAS been made', () => {
          it('does not display menu', () => {
            act(() =>
              autocomplete.setState({
                menuOpen: false,
                options: ['France'],
                query: 'fr',
                focused: null,
                selected: null,
                validChoiceMade: true
              })
            )
            act(() => autocomplete.handleInputFocus())
            expect(autocomplete.state.focused).to.equal(-1)
            expect(autocomplete.state.menuOpen).to.equal(false)
          })
        })
      })

      describe('with option selected', () => {
        it('leaves menu open, does not change query', () => {
          act(() =>
            autocomplete.setState({
              menuOpen: true,
              options: ['France'],
              query: 'fr',
              focused: 0,
              selected: 0
            })
          )
          act(() => autocomplete.handleInputFocus())
          expect(autocomplete.state.focused).to.equal(-1)
          expect(autocomplete.state.menuOpen).to.equal(true)
          expect(autocomplete.state.query).to.equal('fr')
        })
      })

      describe('with defaultValue', () => {
        beforeEach(() => {
          const ref = createRef()
          act(() => {
            render(null, scratch1)
            render(
              <Autocomplete
                {...Autocomplete.defaultProps}
                defaultValue='France'
                id='test'
                source={suggest}
                ref={ref}
              />,
              scratch1
            )
          })
          autocomplete = ref.current
          autocomplete.componentDidUpdate = () => {}
        })

        it('is prefilled', () => {
          expect(autocomplete.state.options.length).to.equal(1)
          expect(autocomplete.state.options[0]).to.equal('France')
          expect(autocomplete.state.query).to.equal('France')
        })
      })
    })

    describe('blurring input', () => {
      it('unfocuses component', () => {
        act(() =>
          autocomplete.setState({
            menuOpen: true,
            options: ['France'],
            query: 'fr',
            focused: -1,
            selected: -1
          })
        )
        act(() => autocomplete.handleInputBlur({ relatedTarget: null }))
        expect(autocomplete.state.focused).to.equal(null)
        expect(autocomplete.state.menuOpen).to.equal(false)
        expect(autocomplete.state.query).to.equal('fr')
      })

      describe('with autoselect and onConfirm', () => {
        it('unfocuses component, updates query, triggers onConfirm', () => {
          act(() =>
            autoselectOnSelectAutocomplete.setState({
              menuOpen: true,
              options: ['France'],
              query: 'fr',
              focused: -1,
              selected: 0
            })
          )
          act(() =>
            autoselectOnSelectAutocomplete.handleInputBlur(
              { target: 'mock', relatedTarget: 'relatedMock' },
              0
            )
          )
          expect(autoselectOnSelectAutocomplete.state.focused).to.equal(null)
          expect(autoselectOnSelectAutocomplete.state.menuOpen).to.equal(false)
          expect(autoselectOnSelectAutocomplete.state.query).to.equal('France')
          expect(onConfirmTriggered).to.equal(true)
        })
      })

      describe('with confirmOnBlur false', () => {
        it('unfocuses component, does not touch query, does not trigger onConfirm', () => {
          act(() =>
            confirmOnBlurAutocomplete.setState({
              menuOpen: true,
              options: ['France'],
              query: 'fr',
              focused: -1,
              selected: 0
            })
          )
          act(() =>
            confirmOnBlurAutocomplete.handleInputBlur(
              { target: 'mock', relatedTarget: 'relatedMock' },
              0
            )
          )
          expect(confirmOnBlurAutocomplete.state.focused).to.equal(null)
          expect(confirmOnBlurAutocomplete.state.menuOpen).to.equal(false)
          expect(confirmOnBlurAutocomplete.state.query).to.equal('fr')
          expect(onConfirmTriggered).to.equal(false)
        })
      })
    })

    describe('focusing option', () => {
      it('sets the option as focused', () => {
        act(() => autocomplete.setState({ options: ['France'] }))
        act(() => autocomplete.handleOptionFocus(0))
        expect(autocomplete.state.focused).to.equal(0)
      })
    })

    describe('focusing out option', () => {
      describe('with input selected', () => {
        it('unfocuses component, does not change query', () => {
          act(() =>
            autocomplete.setState({
              menuOpen: true,
              options: ['France'],
              query: 'fr',
              focused: 0,
              selected: -1
            })
          )
          act(() =>
            autocomplete.handleOptionBlur(
              { target: 'mock', relatedTarget: 'relatedMock' },
              0
            )
          )
          expect(autocomplete.state.focused).to.equal(null)
          expect(autocomplete.state.menuOpen).to.equal(false)
          expect(autocomplete.state.query).to.equal('fr')
        })
      })

      describe('with option selected', () => {
        describe('with confirmOnBlur true', () => {
          it('unfocuses component, updates query', () => {
            act(() =>
              autocomplete.setState({
                menuOpen: true,
                options: ['France'],
                query: 'fr',
                focused: 0,
                selected: 0
              })
            )
            act(() =>
              autocomplete.handleOptionBlur(
                { target: 'mock', relatedTarget: 'relatedMock' },
                0
              )
            )
            expect(autocomplete.state.focused).to.equal(null)
            expect(autocomplete.state.menuOpen).to.equal(false)
            expect(autocomplete.state.query).to.equal('France')
          })
        })
        describe('with confirmOnBlur false', () => {
          it('unfocuses component, does not update query', () => {
            act(() =>
              confirmOnBlurAutocomplete.setState({
                menuOpen: true,
                options: ['France'],
                query: 'fr',
                focused: 0,
                selected: 0
              })
            )
            act(() =>
              confirmOnBlurAutocomplete.handleOptionBlur(
                { target: 'mock', relatedTarget: 'relatedMock' },
                0
              )
            )
            expect(confirmOnBlurAutocomplete.state.focused).to.equal(null)
            expect(confirmOnBlurAutocomplete.state.menuOpen).to.equal(false)
            expect(confirmOnBlurAutocomplete.state.query).to.equal('fr')
          })
        })
      })
    })

    describe('hovering option', () => {
      it('sets the option as hovered, does not change focused, does not change selected', () => {
        act(() =>
          autocomplete.setState({
            options: ['France'],
            hovered: null,
            focused: -1,
            selected: -1
          })
        )
        act(() => autocomplete.handleOptionMouseEnter({}, 0))
        expect(autocomplete.state.hovered).to.equal(0)
        expect(autocomplete.state.focused).to.equal(-1)
        expect(autocomplete.state.selected).to.equal(-1)
      })
    })

    describe('hovering out option', () => {
      it('sets focus back on selected, sets hovered to null', () => {
        act(() =>
          autocomplete.setState({
            options: ['France'],
            hovered: 0,
            focused: -1,
            selected: -1
          })
        )
        act(() => autocomplete.handleListMouseLeave({ toElement: 'mock' }, 0))
        expect(autocomplete.state.hovered).to.equal(null)
        expect(autocomplete.state.focused).to.equal(-1)
        expect(autocomplete.state.selected).to.equal(-1)
      })
    })

    describe('up key', () => {
      it('focuses previous element', () => {
        act(() =>
          autocomplete.setState({
            menuOpen: true,
            options: ['France'],
            focused: 0
          })
        )
        act(() =>
          autocomplete.handleKeyDown({ preventDefault: () => {}, keyCode: 38 })
        )
        expect(autocomplete.state.focused).to.equal(-1)
      })
    })

    describe('down key', () => {
      describe('0 options available', () => {
        it('does nothing', () => {
          act(() =>
            autocomplete.setState({
              menuOpen: false,
              options: [],
              focused: -1
            })
          )
          const stateBefore = autocomplete.state
          act(() =>
            autocomplete.handleKeyDown({
              preventDefault: () => {},
              keyCode: 40
            })
          )
          expect(autocomplete.state).to.equal(stateBefore)
        })
      })

      describe('1 option available', () => {
        it('focuses next element', () => {
          act(() =>
            autocomplete.setState({
              menuOpen: true,
              options: ['France'],
              focused: -1,
              selected: -1
            })
          )
          act(() =>
            autocomplete.handleKeyDown({
              preventDefault: () => {},
              keyCode: 40
            })
          )
          expect(autocomplete.state.focused).to.equal(0)
          expect(autocomplete.state.selected).to.equal(0)
        })
      })

      describe('2 or more option available', () => {
        it('focuses next element', () => {
          act(() =>
            autocomplete.setState({
              menuOpen: true,
              options: ['France', 'Germany'],
              focused: 0,
              selected: 0
            })
          )
          act(() =>
            autocomplete.handleKeyDown({
              preventDefault: () => {},
              keyCode: 40
            })
          )
          expect(autocomplete.state.focused).to.equal(1)
          expect(autocomplete.state.selected).to.equal(1)
        })
      })

      describe('autoselect', () => {
        describe('0 options available', () => {
          it('does nothing', () => {
            act(() =>
              autoselectAutocomplete.setState({
                menuOpen: false,
                options: [],
                focused: -1,
                selected: -1
              })
            )
            const stateBefore = autoselectAutocomplete.state
            act(() =>
              autoselectAutocomplete.handleKeyDown({
                preventDefault: () => {},
                keyCode: 40
              })
            )
            expect(autoselectAutocomplete.state).to.equal(stateBefore)
          })
        })

        describe('1 option available', () => {
          it('does nothing', () => {
            act(() =>
              autoselectAutocomplete.setState({
                menuOpen: true,
                options: ['France'],
                focused: -1,
                selected: 0
              })
            )
            const stateBefore = autoselectAutocomplete.state
            act(() =>
              autoselectAutocomplete.handleKeyDown({
                preventDefault: () => {},
                keyCode: 40
              })
            )
            expect(autoselectAutocomplete.state).to.equal(stateBefore)
          })
        })

        describe('2 or more option available', () => {
          it('on input, focuses second element', () => {
            act(() =>
              autoselectAutocomplete.setState({
                menuOpen: true,
                options: ['France', 'Germany'],
                focused: -1,
                selected: 0
              })
            )
            act(() =>
              autoselectAutocomplete.handleKeyDown({
                preventDefault: () => {},
                keyCode: 40
              })
            )
            expect(autoselectAutocomplete.state.focused).to.equal(1)
            expect(autoselectAutocomplete.state.selected).to.equal(1)
          })
        })
      })
    })

    describe('escape key', () => {
      it('unfocuses component', () => {
        act(() =>
          autocomplete.setState({
            menuOpen: true,
            options: ['France'],
            focused: -1
          })
        )
        act(() =>
          autocomplete.handleKeyDown({ preventDefault: () => {}, keyCode: 27 })
        )
        expect(autocomplete.state.menuOpen).to.equal(false)
        expect(autocomplete.state.focused).to.equal(null)
      })
    })

    describe('enter key', () => {
      describe('on an option', () => {
        it('prevents default, closes the menu, sets the query, focuses the input, triggers onConfirm', () => {
          let preventedDefault = false
          act(() =>
            onConfirmAutocomplete.setState({
              menuOpen: true,
              options: ['France'],
              focused: 0,
              selected: 0
            })
          )
          act(() =>
            onConfirmAutocomplete.handleKeyDown({
              preventDefault: () => {
                preventedDefault = true
              },
              keyCode: 13
            })
          )
          expect(onConfirmAutocomplete.state.menuOpen).to.equal(false)
          expect(onConfirmAutocomplete.state.query).to.equal('France')
          expect(onConfirmAutocomplete.state.focused).to.equal(-1)
          expect(onConfirmAutocomplete.state.selected).to.equal(-1)
          expect(preventedDefault).to.equal(true)
          expect(onConfirmTriggered).to.equal(true)
        })
      })

      describe('on the input', () => {
        describe('with menu opened', () => {
          it('prevents default, does nothing', () => {
            let preventedDefault = false
            act(() =>
              autocomplete.setState({
                menuOpen: true,
                options: [],
                query: 'asd',
                focused: -1,
                selected: -1
              })
            )
            const stateBefore = autocomplete.state
            act(() =>
              autocomplete.handleKeyDown({
                preventDefault: () => {
                  preventedDefault = true
                },
                keyCode: 13
              })
            )
            expect(autocomplete.state).to.equal(stateBefore)
            expect(preventedDefault).to.equal(true)
          })
        })

        describe('with menu closed', () => {
          it('bubbles, does not prevent default', () => {
            let preventedDefault = false
            act(() =>
              autocomplete.setState({
                menuOpen: false,
                options: ['France'],
                focused: -1,
                selected: -1
              })
            )
            const stateBefore = autocomplete.state
            act(() =>
              autocomplete.handleKeyDown({
                preventDefault: () => {
                  preventedDefault = true
                },
                keyCode: 13
              })
            )
            expect(autocomplete.state).to.equal(stateBefore)
            expect(preventedDefault).to.equal(false)
          })
        })

        describe('autoselect', () => {
          it('closes the menu, selects the first option, keeps input focused', () => {
            act(() =>
              autoselectAutocomplete.setState({
                menuOpen: true,
                options: ['France'],
                focused: -1,
                selected: 0
              })
            )
            act(() =>
              autoselectAutocomplete.handleKeyDown({
                preventDefault: () => {},
                keyCode: 13
              })
            )
            expect(autoselectAutocomplete.state.menuOpen).to.equal(false)
            expect(autoselectAutocomplete.state.query).to.equal('France')
            expect(autoselectAutocomplete.state.focused).to.equal(-1)
            expect(autoselectAutocomplete.state.selected).to.equal(-1)
          })
        })
      })
    })

    describe('space key', () => {
      describe('on an option', () => {
        it('prevents default, closes the menu, sets the query, focuses the input, triggers onConfirm', () => {
          let preventedDefault = false
          act(() =>
            onConfirmAutocomplete.setState({
              menuOpen: true,
              options: ['France'],
              focused: 0,
              selected: 0
            })
          )
          act(() =>
            onConfirmAutocomplete.handleKeyDown({
              preventDefault: () => {
                preventedDefault = true
              },
              keyCode: 32
            })
          )
          expect(onConfirmAutocomplete.state.menuOpen).to.equal(false)
          expect(onConfirmAutocomplete.state.query).to.equal('France')
          expect(onConfirmAutocomplete.state.focused).to.equal(-1)
          expect(onConfirmAutocomplete.state.selected).to.equal(-1)
          expect(preventedDefault).to.equal(true)
          expect(onConfirmTriggered).to.equal(true)
        })
      })
    })

    describe('an unrecognised key', () => {
      it('does nothing', () => {
        act(() =>
          autocomplete.setState({
            menuOpen: true,
            options: ['France'],
            focused: 0,
            selected: 0
          })
        )
        // With a mounted component, elementReferences[-1] is the real input element.
        // event.target is 'not the input element' so handlePrintableKey will call
        // inputElement.focus() but state won't change.
        act(() =>
          autocomplete.handleKeyDown({
            target: 'not the input element',
            keyCode: 4242
          })
        )
        expect(autocomplete.state.focused).to.equal(0)
        expect(autocomplete.state.selected).to.equal(0)
      })
    })

    describe('derived state', () => {
      it('initially assumes no valid choice on each new input', () => {
        act(() => autocomplete.handleInputChange({ target: { value: 'F' } }))
        expect(autocomplete.state.validChoiceMade).to.equal(false)
      })

      describe('identifies that the user has made a valid choice', () => {
        it('when an option is actively clicked', () => {
          act(() =>
            autocomplete.setState({
              query: 'f',
              options: ['France'],
              validChoiceMade: false
            })
          )
          act(() => autocomplete.handleOptionClick({}, 0))
          expect(autocomplete.state.validChoiceMade).to.equal(true)
        })

        it('when the input is blurred, autoselect is disabled, and the current query exactly matches an option', () => {
          act(() =>
            autocomplete.setState({
              query: 'France',
              options: ['France'],
              validChoiceMade: false
            })
          )
          act(() => autocomplete.handleComponentBlur({}))
          expect(autocomplete.state.validChoiceMade).to.equal(true)
        })

        it('when in the same scenario, but the match differs only by case sensitivity', () => {
          act(() =>
            autocomplete.setState({
              query: 'fraNCe',
              options: ['France'],
              validChoiceMade: false
            })
          )
          act(() => autocomplete.handleComponentBlur({}))
          expect(autocomplete.state.validChoiceMade).to.equal(true)
        })

        it('when the input is blurred, autoselect is enabled, and the current query results in at least one option', () => {
          act(() =>
            autoselectAutocomplete.setState({
              options: ['France'],
              validChoiceMade: false
            })
          )
          act(() =>
            autoselectAutocomplete.handleInputChange({
              target: { value: 'France' }
            })
          )
          act(() => autoselectAutocomplete.handleComponentBlur({}))
          expect(autoselectAutocomplete.state.validChoiceMade).to.equal(true)
        })
      })

      describe('identifies that the user has not made a valid choice', () => {
        it('when the input is blurred, autoselect is disabled, and the current query does not match an option', () => {
          act(() =>
            autocomplete.setState({
              query: 'Fracne',
              options: ['France'],
              validChoiceMade: false
            })
          )
          act(() => autocomplete.handleComponentBlur({}))
          expect(autocomplete.state.validChoiceMade).to.equal(false)
        })

        it('when the input is blurred, autoselect is enabled, but no options exist for the current query', () => {
          act(() =>
            autoselectAutocomplete.setState({
              options: [],
              validChoiceMade: false
            })
          )
          act(() =>
            autoselectAutocomplete.handleInputChange({
              target: { value: 'gpvx' }
            })
          )
          act(() => autoselectAutocomplete.handleComponentBlur({}))
          expect(autoselectAutocomplete.state.validChoiceMade).to.equal(false)
        })
      })

      describe('identifies that the valid choice situation has changed', () => {
        it('when the user amends a previously matched query such that it no longer matches an option', () => {
          act(() =>
            autocomplete.setState({
              query: 'France',
              options: ['France'],
              validChoiceMade: false
            })
          )
          act(() => autocomplete.handleComponentBlur({}))
          expect(autocomplete.state.validChoiceMade).to.equal(true)
          act(() =>
            autocomplete.handleInputChange({ target: { value: 'Francey' } })
          )
          act(() => autocomplete.handleComponentBlur({}))
          expect(autocomplete.state.validChoiceMade).to.equal(false)
          act(() =>
            autocomplete.handleInputChange({ target: { value: 'France' } })
          )
          act(() => autocomplete.handleComponentBlur({}))
          expect(autocomplete.state.validChoiceMade).to.equal(true)
          act(() =>
            autocomplete.handleInputChange({ target: { value: 'Franc' } })
          )
          act(() => autocomplete.handleComponentBlur({}))
          expect(autocomplete.state.validChoiceMade).to.equal(false)
        })
      })
    })
  })
})

describe('Status', () => {
  describe('rendering', () => {
    let scratch

    before(() => {
      scratch = document.createElement('div');
      (document.body || document.documentElement).appendChild(scratch)
    })

    beforeEach(() => {
      render(null, scratch)
    })

    after(() => {
      scratch.parentNode.removeChild(scratch)
      scratch = null
    })

    it('renders a pair of aria live regions', () => {
      render(<Status />, scratch)
      expect(scratch.innerHTML).to.contain('div')

      const wrapperElement = scratch.getElementsByTagName('div')[0]
      const ariaLiveA = wrapperElement.getElementsByTagName('div')[0]
      const ariaLiveB = wrapperElement.getElementsByTagName('div')[1]

      expect(ariaLiveA.getAttribute('role')).to.equal(
        'status',
        'first aria live region should be marked as role=status'
      )
      expect(ariaLiveA.getAttribute('aria-atomic')).to.equal(
        'true',
        'first aria live region should be marked as atomic'
      )
      expect(ariaLiveA.getAttribute('aria-live')).to.equal(
        'polite',
        'first aria live region should be marked as polite'
      )
      expect(ariaLiveB.getAttribute('role')).to.equal(
        'status',
        'second aria live region should be marked as role=status'
      )
      expect(ariaLiveB.getAttribute('aria-atomic')).to.equal(
        'true',
        'second aria live region should be marked as atomic'
      )
      expect(ariaLiveB.getAttribute('aria-live')).to.equal(
        'polite',
        'second aria live region should be marked as polite'
      )
    })

    describe('behaviour', () => {
      describe('silences aria live announcement', () => {
        it('when a valid choice has been made and the input has focus', (done) => {
          const ref = createRef()
          render(
            <Status
              {...Status.defaultProps}
              ref={ref}
              validChoiceMade
              isInFocus
            />,
            scratch
          )

          setTimeout(() => {
            expect(ref.current.state.silenced).to.equal(true)
            done()
          }, 1500)
        })

        it('when the input no longer has focus', (done) => {
          const ref = createRef()
          render(
            <Status
              {...Status.defaultProps}
              ref={ref}
              validChoiceMade={false}
              isInFocus={false}
            />,
            scratch
          )

          setTimeout(() => {
            expect(ref.current.state.silenced).to.equal(true)
            done()
          }, 1500)
        })
      })

      describe('does not silence aria live announcement', () => {
        it('when a valid choice has not been made and the input has focus', (done) => {
          const ref = createRef()
          render(
            <Status
              {...Status.defaultProps}
              ref={ref}
              validChoiceMade={false}
              isInFocus
            />,
            scratch
          )

          setTimeout(() => {
            expect(ref.current.state.silenced).to.equal(false)
            done()
          }, 1500)
        })
      })
    })
  })
})

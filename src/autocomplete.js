import { createElement, Component } from 'preact' /** @jsx createElement */
import Status from './status'
import DropdownArrowDown from './dropdown-arrow-down'

const IS_PREACT = process.env.COMPONENT_LIBRARY === 'PREACT'
const IS_REACT = process.env.COMPONENT_LIBRARY === 'REACT'

const keyCodes = {
  13: 'enter',
  27: 'escape',
  32: 'space',
  38: 'up',
  40: 'down'
}

function isIosDevice () {
  return typeof navigator !== 'undefined' && !!(navigator.userAgent.match(/(iPod|iPhone|iPad)/g) && navigator.userAgent.match(/AppleWebKit/g))
}

function isPrintableKeyCode (keyCode) {
  return (
    (keyCode > 47 && keyCode < 58) || // number keys
    keyCode === 32 || keyCode === 8 || // spacebar or backspace
    (keyCode > 64 && keyCode < 91) || // letter keys
    (keyCode > 95 && keyCode < 112) || // numpad keys
    (keyCode > 185 && keyCode < 193) || // ;=,-./` (in order)
    (keyCode > 218 && keyCode < 223) // [\]' (in order)
  )
}

// Preact does not implement onChange on inputs, but React does.
function onChangeCrossLibrary (handler) {
  if (IS_PREACT) { return { onInput: handler } }
  if (IS_REACT) { return { onChange: handler } }
}

export default class Autocomplete extends Component {
  static defaultProps = {
    autoselect: false,
    cssNamespace: 'autocomplete',
    defaultValue: '',
    displayMenu: 'inline',
    minLength: 0,
    name: 'input-autocomplete',
    placeholder: '',
    onConfirm: () => {},
    onDelete: () => {},
    confirmOnBlur: true,
    showNoOptionsFound: true,
    showAllValues: false,
    required: false,
    multiple: false,
    selectedOptions: [],
    tNoResults: () => 'No results found',
    tSelectedOptionDescription: () => 'Press Enter or Space to remove selection',
    tAssistiveHint: () => 'When autocomplete results are available use up and down arrows to review and enter to select.  Touch device users, explore by touch or with swipe gestures.',
    dropdownArrow: DropdownArrowDown,
    menuAttributes: {},
    inputClasses: null,
    hintClasses: null,
    menuClasses: null
  }

  elementReferences = {}

  constructor (props) {
    super(props)

    this.state = {
      focused: null,
      hovered: null,
      menuOpen: false,
      options: props.defaultValue ? [props.defaultValue] : [],
      selectedOptions: props.selectedOptions,
      query: props.defaultValue,
      validChoiceMade: false,
      selected: null,
      ariaHint: true
    }

    this.handleComponentBlur = this.handleComponentBlur.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleUpArrow = this.handleUpArrow.bind(this)
    this.handleDownArrow = this.handleDownArrow.bind(this)
    this.handleEnter = this.handleEnter.bind(this)
    this.handlePrintableKey = this.handlePrintableKey.bind(this)

    this.handleListMouseLeave = this.handleListMouseLeave.bind(this)

    this.handleOptionBlur = this.handleOptionBlur.bind(this)
    this.handleOptionClick = this.handleOptionClick.bind(this)
    this.handleOptionFocus = this.handleOptionFocus.bind(this)
    this.handleOptionMouseDown = this.handleOptionMouseDown.bind(this)
    this.handleOptionMouseEnter = this.handleOptionMouseEnter.bind(this)

    this.handleRemoveSelectedOptionClick = this.handleRemoveSelectedOptionClick.bind(this)

    this.handleInputBlur = this.handleInputBlur.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleInputClick = this.handleInputClick.bind(this)
    this.handleInputFocus = this.handleInputFocus.bind(this)

    this.pollInputElement = this.pollInputElement.bind(this)
    this.getDirectInputChanges = this.getDirectInputChanges.bind(this)
  }

  isQueryAnOption (query, options) {
    return options.map(entry => this.templateInputValue(entry).toLowerCase()).indexOf(query.toLowerCase()) !== -1
  }

  componentDidMount () {
    this.pollInputElement()
  }

  componentWillUnmount () {
    clearTimeout(this.$pollInput)
  }

  // Applications like Dragon NaturallySpeaking will modify the
  // `input` field by directly changing its `.value`. These events
  // don't trigger our JavaScript event listeners, so we need to poll
  // to handle when and if they occur.
  pollInputElement () {
    this.getDirectInputChanges()
    this.$pollInput = setTimeout(() => {
      this.pollInputElement()
    }, 100)
  }

  getDirectInputChanges () {
    const inputReference = this.elementReferences[-1]
    const queryHasChanged = inputReference && inputReference.value !== this.state.query

    if (queryHasChanged) {
      this.handleInputChange({ target: { value: inputReference.value } })
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { focused } = this.state
    const componentLostFocus = focused === null
    const focusedChanged = prevState.focused !== focused
    const focusDifferentElement = focusedChanged && !componentLostFocus
    if (focusDifferentElement) {
      this.elementReferences[focused].focus()
    }
    const focusedInput = focused === -1
    const componentGainedFocus = focusedChanged && prevState.focused === null
    const selectAllText = focusedInput && componentGainedFocus
    if (selectAllText) {
      const inputElement = this.elementReferences[focused]
      inputElement.setSelectionRange(0, inputElement.value.length)
    }
  }

  hasAutoselect () {
    return isIosDevice() ? false : this.props.autoselect
  }

  // This template is used when converting from a state.options object into a state.query.
  templateInputValue (value) {
    const inputValueTemplate = this.props.templates && this.props.templates.inputValue
    return inputValueTemplate ? inputValueTemplate(value) : value
  }

  // This template is used when displaying results / suggestions.
  templateSuggestion (value) {
    const suggestionTemplate = this.props.templates && this.props.templates.suggestion
    return suggestionTemplate ? suggestionTemplate(value) : value
  }

  resetInput () {
    this.setState({
      focused: null,
      menuOpen: false,
      query: '',
      selected: null,
      validChoiceMade: false
    })
  }

  handleComponentBlur (newState) {
    const { options, query, selected } = this.state
    let newQuery
    if (this.props.confirmOnBlur) {
      newQuery = newState.query || query
      this.props.onConfirm(options[selected])
    } else {
      newQuery = query
    }

    if (this.props.multiple) {
      this.resetInput()
    } else {
      this.setState({
        focused: null,
        menuOpen: newState.menuOpen || false,
        query: newQuery,
        selected: null,
        validChoiceMade: this.isQueryAnOption(newQuery, options)
      })
    }
  }

  handleListMouseLeave (event) {
    this.setState({
      hovered: null
    })
  }

  handleOptionBlur (event, index) {
    const { focused, menuOpen, options, selected } = this.state
    const focusingOutsideComponent = event.relatedTarget === null
    const focusingInput = event.relatedTarget === this.elementReferences[-1]
    const focusingAnotherOption = focused !== index && focused !== -1
    const blurComponent = (!focusingAnotherOption && focusingOutsideComponent) || !(focusingAnotherOption || focusingInput)
    if (blurComponent) {
      const keepMenuOpen = menuOpen && isIosDevice()
      this.handleComponentBlur({
        menuOpen: keepMenuOpen,
        query: this.templateInputValue(options[selected])
      })
    }
  }

  handleInputBlur (event) {
    const { focused, menuOpen, options, query, selected } = this.state
    const focusingAnOption = focused !== -1
    if (!focusingAnOption) {
      const keepMenuOpen = menuOpen && isIosDevice()
      const newQuery = isIosDevice() ? query : this.templateInputValue(options[selected])
      this.handleComponentBlur({
        menuOpen: keepMenuOpen,
        query: newQuery
      })
    }
  }

  handleInputChange (event) {
    const { minLength, source, showAllValues } = this.props
    const autoselect = this.hasAutoselect()
    const query = event.target.value
    const queryEmpty = query.length === 0
    const queryChanged = this.state.query !== query
    const queryLongEnough = query.length >= minLength

    this.setState({
      query,
      ariaHint: queryEmpty
    })

    const searchForOptions = showAllValues || (!queryEmpty && queryChanged && queryLongEnough)
    if (searchForOptions) {
      source(query, (options) => {
        const optionsAvailable = options.length > 0
        this.setState({
          menuOpen: optionsAvailable,
          options,
          selected: (autoselect && optionsAvailable) ? 0 : -1,
          validChoiceMade: false
        })
      })
    } else if (queryEmpty || !queryLongEnough) {
      this.setState({
        menuOpen: false,
        options: []
      })
    }
  }

  handleInputClick (event) {
    this.handleInputChange(event)
  }

  handleInputFocus (event) {
    const { query, validChoiceMade, options } = this.state
    const { minLength } = this.props
    const shouldReopenMenu = !validChoiceMade && query.length >= minLength && options.length > 0

    if (shouldReopenMenu) {
      this.setState(({ menuOpen }) => ({ focused: -1, menuOpen: shouldReopenMenu || menuOpen, selected: -1 }))
    } else {
      this.setState({ focused: -1 })
    }
  }

  handleOptionFocus (index) {
    this.setState({
      focused: index,
      hovered: null,
      selected: index
    })
  }

  handleOptionMouseEnter (event, index) {
    // iOS Safari prevents click event if mouseenter adds hover background colour
    // See: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html#//apple_ref/doc/uid/TP40006511-SW4
    if (!isIosDevice()) {
      this.setState({
        hovered: index
      })
    }
  }

  handleOptionClick (event, index) {
    const selectedOption = this.state.options[index]
    const newQuery = this.templateInputValue(selectedOption)
    this.props.onConfirm(selectedOption)
    if (this.props.multiple) {
      this.resetInput()
      if (this.state.selectedOptions.indexOf(selectedOption) === -1) {
        this.setState({
          selectedOptions: this.state.selectedOptions.concat([selectedOption])
        })
      }
    } else {
      this.setState({
        focused: -1,
        hovered: null,
        menuOpen: false,
        query: newQuery,
        selected: -1,
        validChoiceMade: true
      })
    }
  }

  handleRemoveSelectedOptionClick (event, index) {
    const selectedOptions = this.state.selectedOptions
    const toRemove = selectedOptions[index]
    if (toRemove) {
      const newSelectedOptions = selectedOptions.filter(o => o !== toRemove)

      this.setState({
        selectedOptions: newSelectedOptions
      })

      this.props.onRemove(toRemove)
    }
  }

  handleOptionMouseDown (event) {
    // Safari triggers focusOut before click, but if you
    // preventDefault on mouseDown, you can stop that from happening.
    // If this is removed, clicking on an option in Safari will trigger
    // `handleOptionBlur`, which closes the menu, and the click will
    // trigger on the element underneath instead.
    // See: http://stackoverflow.com/questions/7621711/how-to-prevent-blur-running-when-clicking-a-link-in-jquery
    event.preventDefault()
  }

  handleUpArrow (event) {
    event.preventDefault()
    const { menuOpen, selected } = this.state
    const isNotAtTop = selected !== -1
    const allowMoveUp = isNotAtTop && menuOpen
    if (allowMoveUp) {
      this.handleOptionFocus(selected - 1)
    }
  }

  handleDownArrow (event) {
    event.preventDefault()
    // if not open, open
    if (this.props.showAllValues && this.state.menuOpen === false) {
      event.preventDefault()
      this.props.source('', (options) => {
        this.setState({
          menuOpen: true,
          options,
          selected: 0,
          focused: 0,
          hovered: null
        })
      })
    } else if (this.state.menuOpen === true) {
      const { menuOpen, options, selected } = this.state
      const isNotAtBottom = selected !== options.length - 1
      const allowMoveDown = isNotAtBottom && menuOpen
      if (allowMoveDown) {
        this.handleOptionFocus(selected + 1)
      }
    }
  }

  handleSpace (event) {
    // if not open, open
    if (this.props.showAllValues && this.state.menuOpen === false && this.state.query === '') {
      event.preventDefault()
      this.props.source('', (options) => {
        this.setState({
          menuOpen: true,
          options
        })
      })
    }
    const focusIsOnOption = this.state.focused !== -1
    if (focusIsOnOption) {
      event.preventDefault()
      this.handleOptionClick(event, this.state.focused)
    }
  }

  handleEnter (event) {
    if (this.state.menuOpen) {
      event.preventDefault()
      const hasSelectedOption = this.state.selected >= 0
      if (hasSelectedOption) {
        this.handleOptionClick(event, this.state.selected)
      }
    }
  }

  handlePrintableKey (event) {
    const inputElement = this.elementReferences[-1]
    const eventIsOnInput = event.target === inputElement
    if (!eventIsOnInput) {
      // FIXME: This would be better if it was in componentDidUpdate,
      // but using setState to trigger that seems to not work correctly
      // in preact@8.1.0.
      inputElement.focus()
    }
  }

  handleKeyDown (event) {
    switch (keyCodes[event.keyCode]) {
      case 'up':
        this.handleUpArrow(event)
        break
      case 'down':
        this.handleDownArrow(event)
        break
      case 'space':
        this.handleSpace(event)
        break
      case 'enter':
        this.handleEnter(event)
        break
      case 'escape':
        this.handleComponentBlur({
          query: this.state.query
        })
        break
      default:
        if (isPrintableKeyCode(event.keyCode)) {
          this.handlePrintableKey(event)
        }
        break
    }
  }

  render () {
    const {
      cssNamespace,
      displayMenu,
      id,
      minLength,
      name,
      placeholder,
      required,
      multiple,
      showAllValues,
      tNoResults,
      tStatusQueryTooShort,
      tStatusNoResults,
      tStatusSelectedOption,
      tStatusResults,
      tSelectedOptionDescription,
      tAssistiveHint,
      dropdownArrow: dropdownArrowFactory,
      menuAttributes,
      inputClasses,
      hintClasses,
      menuClasses
    } = this.props
    const { focused, hovered, menuOpen, options, query, selected, ariaHint, validChoiceMade, selectedOptions } = this.state
    const autoselect = this.hasAutoselect()

    const inputFocused = focused === -1
    const noOptionsAvailable = options.length === 0
    const queryNotEmpty = query.length !== 0
    const queryLongEnough = query.length >= minLength
    const showNoOptionsFound = this.props.showNoOptionsFound &&
      inputFocused && noOptionsAvailable && queryNotEmpty && queryLongEnough

    const wrapperClassName = `${cssNamespace}__wrapper`
    const statusClassName = `${cssNamespace}__status`
    const dropdownArrowClassName = `${cssNamespace}__dropdown-arrow-down`
    const optionFocused = focused !== -1 && focused !== null

    const optionClassName = `${cssNamespace}__option`
    const selectedOptionsClassName = `${cssNamespace}__list`

    const hintClassName = `${cssNamespace}__hint`
    const selectedOptionText = this.templateInputValue(options[selected])
    const optionBeginsWithQuery = selectedOptionText &&
      selectedOptionText.toLowerCase().indexOf(query.toLowerCase()) === 0
    const hintValue = (optionBeginsWithQuery && autoselect)
      ? query + selectedOptionText.substr(query.length)
      : ''

    const assistiveHintID = id + '__assistiveHint'
    const ariaProps = {
      'aria-describedby': ariaHint ? assistiveHintID : null,
      'aria-expanded': menuOpen ? 'true' : 'false',
      'aria-activedescendant': optionFocused ? `${id}__option--${focused}` : null,
      'aria-controls': `${id}__listbox`,
      'aria-autocomplete': (this.hasAutoselect()) ? 'both' : 'list'
    }

    let dropdownArrow

    // we only need a dropdown arrow if showAllValues is set to a truthy value
    if (showAllValues) {
      dropdownArrow = dropdownArrowFactory({ className: dropdownArrowClassName })

      // if the factory returns a string we'll render this as HTML (usage w/o (P)React)
      if (typeof dropdownArrow === 'string') {
        dropdownArrow = <div className={`${cssNamespace}__dropdown-arrow-down-wrapper`} dangerouslySetInnerHTML={{ __html: dropdownArrow }} />
      }
    }

    const inputClassName = `${cssNamespace}__input`
    const inputClassList = [
      inputClassName,
      this.props.showAllValues ? `${inputClassName}--show-all-values` : `${inputClassName}--default`
    ]

    const componentIsFocused = focused !== null
    if (componentIsFocused) {
      inputClassList.push(`${inputClassName}--focused`)
    }

    if (inputClasses) {
      inputClassList.push(inputClasses)
    }

    const menuClassName = `${cssNamespace}__menu`
    const menuModifierDisplayMenu = `${menuClassName}--${displayMenu}`
    const menuIsVisible = menuOpen || showNoOptionsFound
    const menuModifierVisibility = `${menuClassName}--${(menuIsVisible) ? 'visible' : 'hidden'}`

    const menuClassList = [
      menuClassName,
      menuModifierDisplayMenu,
      menuModifierVisibility
    ]

    if (menuClasses) {
      menuClassList.push(menuClasses)
    }

    if (menuAttributes?.class || menuAttributes?.className) {
      menuClassList.push(menuAttributes?.class || menuAttributes?.className)
    }

    const computedMenuAttributes = {
      // set aria-labelledby first so that users can override it with menuAttributes
      'aria-labelledby': id,
      // Copy the attributes passed as props
      ...menuAttributes,
      // And add the values computed for the autocomplete
      id: `${id}__listbox`,
      role: 'listbox',
      className: menuClassList.join(' '),
      onMouseLeave: this.handleListMouseLeave
    }

    // Preact would override our computed `className`
    // with the `class` from the `menuAttributes` so
    // we need to clean it up from the computed attributes
    delete computedMenuAttributes.class

    return (
      <div className={wrapperClassName} onKeyDown={this.handleKeyDown}>
        <Status
          id={id}
          length={options.length}
          queryLength={query.length}
          minQueryLength={minLength}
          selectedOption={this.templateInputValue(options[selected])}
          selectedOptionIndex={selected}
          validChoiceMade={validChoiceMade}
          isInFocus={this.state.focused !== null}
          tQueryTooShort={tStatusQueryTooShort}
          tNoResults={tStatusNoResults}
          tSelectedOption={tStatusSelectedOption}
          tResults={tStatusResults}
          className={statusClassName}
        />

        {hintValue && (
          <span><input className={[hintClassName, hintClasses === null ? inputClasses : hintClasses].filter(Boolean).join(' ')} readonly tabIndex='-1' value={hintValue} /></span>
        )}

        <input
          {...ariaProps}
          autoComplete='off'
          className={inputClassList.join(' ')}
          id={id}
          onClick={this.handleInputClick}
          onBlur={this.handleInputBlur}
          {...onChangeCrossLibrary(this.handleInputChange)}
          onFocus={this.handleInputFocus}
          name={name}
          placeholder={placeholder}
          ref={(inputElement) => { this.elementReferences[-1] = inputElement }}
          type='text'
          role='combobox'
          required={required}
          value={query}
        />

        {dropdownArrow}

        <ul {...computedMenuAttributes}>
          {options.map((option, index) => {
            const showFocused = focused === -1 ? selected === index : focused === index
            const optionModifierFocused = showFocused && hovered === null ? ` ${optionClassName}--focused` : ''
            const optionModifierOdd = (index % 2) ? ` ${optionClassName}--odd` : ''
            const iosPosinsetHtml = (isIosDevice())
              ? `<span id=${id}__option-suffix--${index} style="border:0;clip:rect(0 0 0 0);height:1px;` +
                'marginBottom:-1px;marginRight:-1px;overflow:hidden;padding:0;position:absolute;' +
                'whiteSpace:nowrap;width:1px">' + ` ${index + 1} of ${options.length}</span>`
              : ''

            return (
              <li
                aria-selected={focused === index ? 'true' : 'false'}
                className={`${optionClassName}${optionModifierFocused}${optionModifierOdd}`}
                dangerouslySetInnerHTML={{ __html: this.templateSuggestion(option) + iosPosinsetHtml }}
                id={`${id}__option--${index}`}
                key={index}
                onBlur={(event) => this.handleOptionBlur(event, index)}
                onClick={(event) => this.handleOptionClick(event, index)}
                onMouseDown={this.handleOptionMouseDown}
                onMouseEnter={(event) => this.handleOptionMouseEnter(event, index)}
                ref={(optionEl) => { this.elementReferences[index] = optionEl }}
                role='option'
                tabIndex='-1'
                aria-posinset={index + 1}
                aria-setsize={options.length}
              />
            )
          })}

          {showNoOptionsFound && (
            <li className={`${optionClassName} ${optionClassName}--no-results`} role='option' aria-disabled='true'>{tNoResults()}</li>
          )}
        </ul>

        {multiple && selectedOptions.length > 0 && (
          <ul
            className={`${selectedOptionsClassName}`}
            id={`${id}__list`}
            role='listbox'
          >
            {selectedOptions.map((option, index) => {
              return (
                <li id={`${id}__selected-option--${index}`} className='autocomplete__selected-option' key={`${index}`}>
                  <span dangerouslySetInnerHTML={{ __html: this.templateSuggestion(option) }} />
                  <button
                    type='button'
                    className='autocomplete__remove-option'
                    aria-label={`${this.templateSuggestion(option)}, selected. ${tSelectedOptionDescription()}`}
                    onClick={(event) => this.handleRemoveSelectedOptionClick(event, index)}
                  >remove
                  </button>
                </li>
              )
            })}
            {showNoOptionsFound && (
              <li className={`${optionClassName} ${optionClassName}--no-results`}>{tNoResults()}</li>
            )}
          </ul>
        )}

        <span id={assistiveHintID} style={{ display: 'none' }}>{tAssistiveHint()}</span>

      </div>
    )
  }
}

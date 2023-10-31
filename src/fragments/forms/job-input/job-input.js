import { PlacesSearch, ReverseGeocode } from '@/support/ors-api-runner'
import AppMode from '@/support/app-modes/app-mode'
import constants from '@/resources/constants'
import appConfig from '@/config/app-config'
import GeoUtils from '@/support/geo-utils'
import Job from '@/fragments/forms/map-form/components/optimization/models/job'
import Utils from '@/support/utils'
import {EventBus} from '@/common/event-bus'


export default {
  data: () => ({
    debounceTimeoutId: null,
    modelDebounceTimeoutId: null,
    searching: false,
    focused: false,
    localModel: null,
    jobInputFloatingMenu: false,
    focusIsAutomatic: false
  }),
  props: {
    index: {
      Required: true
    },
    isLast: {
      Type: Boolean,
      default: false
    },
    box: {
      Type: Boolean,
      default: false
    },
    model: {
      Type: Job,
      Required: true
    },
    single: {
      Type: Boolean,
      default: false
    },
    autofocus: {
      Type: Boolean,
      default: false
    },
    height: {
      type: Number,
      default: 30
    },
    mb: {
      type: Number,
      default: 0
    },
    disabled: {
      type: Boolean,
      default: false
    },
    supportOptimization: {
      type: Boolean,
      default: true
    },
    supportSearch: {
      type: Boolean,
      default: true
    },
    pickJobSupported: {
      type: Boolean,
      default: false
    },
    idPostfix: {
      default: '',
      type: String
    }
  },
  created () {
    this.localModel = this.model.clone()
    this.getImgSrc = Utils.getImgSrc

    const context = this

    EventBus.$on('suggestionsUpdated', (data) => {
      context.suggestionUpdated(data)
    })
    this.resolveModel()
    this.focusIsAutomatic = this.autofocus
  },
  computed: {
    /**
     * Build and returns the input predictable id
     * @returns {String}
     */
    predictableId () {
      let id = `job-input-container-${this.idPostfix}-${this.index}`
      return id
    },
    /**
     * Determines if the automatic focus must be set or not
     * @returns {Boolean}
     */
    hasAutomaticFocus () {
      // If is a mobile device, do not use automatic
      // focus to avoid opening the keyboard
      if (this.isMobile) {
        return false
      }
      return this.focusIsAutomatic
    },
    /**
     * Determines if the device is mobile
     * @returns {Boolean}
     */
    isMobile () {
      let isMobile = Utils.isMobile()
      return isMobile
    },
    /**
     * Determines if the 'pick a job' button must show its tooltip
     * @returns {Boolean}
     */
    showInputPickJobTooltip () {
      let show = this.model.isEmpty() && !this.single && this.$store.getters.isSidebarVisible
      return show
    },
    /**
     * Get the input hint to be displayed
     * @returns {String}
     */
    hint () {
      let hint = ''
      if (this.model.isEmpty() && !this.single) {
        hint = this.$t('jobInput.fillOrRemoveInput')
      }
      return hint
    },
    /**
     * Determines if the input details must be hidden
     * @returns {Boolean}
     */
    hideDetails () {
      let hide =  this.single || (!this.focused && !this.hasAutomaticFocus)
      return hide
    },
    /**
     * Return the column breakpoint that must be applied to the input flex
     * @returns {String}
     */
    inputColumns () {
      const columns = 12 - (this.iconsBtnCounter * this.inputColumnFactor)
      return `xs${columns} sm${columns} md${columns} lg${columns}`
    },
    /**
     * Defines the input columns factor based on the current resolution
     * @returns {Integer}
     */
    inputColumnFactor () {
      return this.$lowResolution ? 2 : 1
    },
    /**
     * Return the quantity of input icon button rendered
     * @returns {Integer}
     */
    iconsBtnCounter () {
      let btnColumns = 0

      if (this.deleteAvailable && !this.jobMenuAvailable) {
        btnColumns++
      }
      if (this.switchCoordsAvailable && !this.jobMenuAvailable) {
        btnColumns++
      }
      if (this.optimizationAvailable && !this.jobMenuAvailable) {
        btnColumns++
      }
      if (this.jobMenuAvailable) {
        btnColumns++
      }

      return btnColumns
    },
    /**
     * Get the job input label based on the current view mode
     * @param {*} index
     */
    jobInputLabel () {
      let label = null
      if (this.disabled) {
        return label
      }
      if (this.supportOptimization) {
        if (this.isLast) {
          label = `(${this.index + 1}) ${this.$t('jobInput.routeDestination')}`
        } else {
          if (this.single) {
            label = this.model.isEmpty() ? this.$t('jobInput.findAJob') : this.$t('jobInput.job')
          } else {
            if (this.index === 0) {
              label = `(${this.index + 1}) ${this.$t('jobInput.startingLocation')}`
            } else {
              label = this.model.isEmpty() ? `(${this.index + 1}) ${this.$t('jobInput.addRouteStop')}` : `(${this.index + 1}) ${this.$t('jobInput.routeJob')}`
            }
          }
        }
      } else {
        label= `${this.$t('jobInput.findAJob')}`
      }
      let labelData = {label: label, supportOptimization: this.supportOptimization, single: this.single, jobModel: this.model}
      this.$root.appHooks.run('jobInputLabelBuilt', labelData)
      return labelData.label
    },

    /**
     * Determines if the delete button is available for the current job input
     */
    deleteAvailable () {
      return this.index !== 0
    },
    // Switch the coordinates position ([lat, long] -> [long, lat] and [long, lat] -> [lat, long])
    switchCoordsAvailable () {
      const canSwitch = this.model.nameIsNumeric()
      return canSwitch
    },
    searchAvailable () {
      let available = appConfig.supportsSearchMode
      return available
    },
    /**
     * Determines if the job input floating menu button is available for the current job input
     */
    jobMenuAvailable () {
      return this.$lowResolution && !this.single && (this.index > 0 || this.switchCoordsAvailable)
    },
    /**
     * Determines if the job input directions menu button is available for the current job input
     */
    optimizationAvailable () {
      if (!this.supportsOptimization || !appConfig.supportsOptimization) {
        return false
      } else {
        return this.single && this.index === 0
      }
    },
    /**
     * Determines if the current browser location option should be prepended to the suggestion lis of the current job input
     */
    showBrowserLocationInJobsList () {
      return this.focused
    },

    appendBtn () {
      if (this.supportSearch) {
        return 'search'
      } else if (this.$lowResolution || this.localModel.isEmpty()) {
        return 'map'
      }
    }
  },
  methods: {
    inputFocused (event) {
      event.stopPropagation()
      event.preventDefault()
      this.$emit('focused', true)
    },
    /**
     * Handle the click on the pick a job location btn
     */
    pickJobClick (event) {
      this.showInfo(this.$t('jobInput.clickOnTheMapToSelectAJob'))
      this.localModel = new Job()
      this.setPickJobSource()
      if(this.$lowResolution) {
        this.$store.commit('setLeftSideBarIsOpen', false)
      }
      event.stopPropagation()
      event.preventDefault()
    },
    /**
     * Set the pick job input source
     * @uses index
     * @uses predictableIda
     */
    setPickJobSource () {
      if (this.pickJobSupported) {
        this.$store.commit('pickJobIndex', this.index)
        this.$store.commit('pickJobId', this.predictableId)
      }
    },
    /**
     * Empty the pick job source
     */
    emptyPickJobSource () {
      this.$store.commit('pickJobIndex', null)
      this.$store.commit('pickJobId', null)
    },
    /**
     * Run search if in search mode or resolve place if model is unresolved
     */
    resolveModel () {
      if (this.$store.getters.mode !== constants.modes.search && this.localModel.unresolved === true) {
        this.resolveJob()
      }
    },
    /**
     * Resolve the coordinates of a place input index to a qualified location
     * @returns {Promise}
     */
    resolveJob () {
      const job = this.localModel
      EventBus.$emit('showLoading', true)
      const context = this
      return new Promise((resolve, reject) => {
        context.searching = false
        job.resolve(this.$store.getters.appRouteData.options.zoom).then(() => {
          resolve(job)
        }).catch(err => {
          console.error(err)
          reject(err)
        }).finally(() => {
          context.searching = false
          EventBus.$emit('showLoading', false)
        })
      })
    },

    /**
     * Handles the input change with a debounce-timeout
     * @param {*} event
     */
    changed (event = null) {
      if (event) {
        const isPasteEvent = event instanceof ClipboardEvent
        // In case of a ClipboardEvent (ctr + v)
        // we must just ignore, since the input
        // model  has not changed yet, and it will
        // trigger another change event when it changes
        if (!isPasteEvent) {
          event.preventDefault()
          event.stopPropagation()
          clearTimeout(this.debounceTimeoutId)
          const context = this

          // Make sure that the changes in the input are debounced
          this.debounceTimeoutId = setTimeout(function () {
            if (context.localModel.nameIsNumeric()) {
              let latLng = context.localModel.getLatLng()
              context.model.setLngLat(latLng.lng, latLng.lat)
            }
            if (event.key === 'Enter') {
              context.focused = false
              context.handleSearchInputEnter()
            } else {
              context.autocompleteSearch()
            }
          }, 1000)
        }
      }
    },

    /**
     * Send the app to search mode
     * @emits switchedToSearchMode
     * @emits searchChanged
     */
    sendToSearchMode () {
      if (!this.model.jobName || this.model.jobName.length === 0) {
        this.showError(this.$t('jobInput.pleaseTypeSomething'))

      } else {
        const previousMode = this.$store.getters.mode
        if (previousMode === constants.modes.search) {
          this.$emit('searchChanged')
        } else {
          this.$emit('switchedToSearchMode')
        }
        this.$store.commit('mode', constants.modes.search)
        const appMode = new AppMode(this.$store.getters.mode)
        const route = appMode.getRoute([this.localModel])
        this.$router.push(route)
      }
    },

    /**
     * Reset a job input at a given index
     * @param {*} index
     */
    jobCleared () {
      if (!this.model.isEmpty()) {
        this.$emit('cleared', this.index)
      }
      this.localModel = new Job()
      this.setFocus(true)
    },
    setFocus (data) {
      // When the user clicks outside an input
      // this method is called and is intended to
      // set the focus as false in this case.
      // To do so, we check if the was previously focused
      // The parameters passed (automatically) by the click-outside
      // is expected to be MouseEvent object and no a boolean.
      if (typeof data === 'object' && data.clickedOutside) {
        if (this.inputWasActiveAndLostFocus(data)) {
          this.emptyPickJobSource()
          this.focused = false
        }
      } else {
        this.focused = data // data is boolean in this case
        // If the input is focused, set the pick job source
        this.setPickJobSource()
      }
      // Once the focused was set to true based on a user
      // interaction event then it is not anymore in automatic mode
      if (this.focused) {
        this.focusIsAutomatic = false
      }
      // If the app is in the search mode, then run
      // the autocompleteSearch that will show the suggestions
      if (this.focused && this.$store.getters.mode === constants.modes.search) {
        this.autocompleteSearch()
      }
    },
    /**
     * Determines if the current job input was clicked outside
     * @returns {Boolean}
     */
    inputWasActiveAndLostFocus (event) {
      let isThisInputStored = this.$store.getters.pickPlaceIndex === this.index && this.$store.getters.pickJobId === this.predictableId
      let thisElIdWasOutSided = event.outsideEl.id === this.predictableId
      // Check if it matches the conditions
      if (thisElIdWasOutSided && isThisInputStored) {
        return true
      }
    },
  }
}

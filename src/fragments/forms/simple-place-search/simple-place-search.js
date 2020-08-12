/**
 * Simple Place Search component
 * @emits openDirectionsMode
 * @emits switchToDirections
 */

import PlaceInput from '@/fragments/forms/place-input/PlaceInput.vue'
import AppMode from '@/support/app-modes/app-mode'
import MapViewData from '@/models/map-view-data'
import {PlacesSearch} from '@/support/ors-api-runner'
import constants from '@/resources/constants'
import Place from '@/models/place'

export default {
  data: () => ({
    rawResponse: null,
    place: new Place(),
    searching: false,
    extraProfilesOpen: false,
    myLocation: false,
    autoFocusOnMap: true,
    openingRouteMode: false,
    newInfoAvailable: false
  }),
  props: {
    height: {
      default: 65
    }
  },
  created () {
    this.setEventListeners()
    this.setPlace()
    this.loadData()
  },
  components: {
    PlaceInput
  },
  computed: {
    visible () {
      let isVisible = this.$lowResolution
      if (this.$store.getters.leftSideBarOpen || this.$store.getters.leftSideBarPinned) {
        isVisible = false
      }
      return isVisible
    },
    showNewInfo () {
      return this.newInfoAvailable
    }
  },

  methods: {
    /**
     * Se the place model if the app is in place mode
     * and it there is only one place in appRouteData
     */
    setPlace () {
      let showPlaceNameModes = [constants.modes.place, constants.modes.roundTrip, constants.modes.search, constants.modes.isochrones]
      if (showPlaceNameModes.includes(this.$store.getters.mode) && this.$store.getters.appRouteData.places.length === 1) {
        this.place = this.$store.getters.appRouteData.places[0]
      }
    },
    /**
     * Every time the appRouteData changes
     * and it has at least one place defined
     * the map data is reloaded, so we keep the
     * the map serach and synchronized with the url
     */
    reloadAfterAppRouteDataChanged (appRouteData) {
      if (appRouteData && appRouteData.places.length > 0) {
        this.loadData()
      }
    },
    /**
     * Set event listeners
     */
    setEventListeners () {
      let context = this
      // Set marker clicked event listener
      // When in search place mode, if the marker is clicked, we select it as the target
      // for the inputIndex
      this.eventBus.$on('markerClicked', (marker) => {
        let lat = marker.data.geometry.coordinates[1]
        let lng = marker.data.geometry.coordinates[0]
        let placeOptions = { resolve: false, inputIndex: null, id: marker.data.properties.id }
        let place = new Place(lng, lat, marker.label, placeOptions)
        this.selectPlace(place)
      })

      // When a marker drag finishes, update
      // the place coordinates and re render the map
      this.eventBus.$on('markerDragged', (marker) => {
        context.place.coordinates = [marker.position.lng, marker.position.lat]
        context.loadData()
      })

      // reload the map data after the app route has changed
      this.eventBus.$on('appRouteDataChanged', (appRouteData) => {
        context.reloadAfterAppRouteDataChanged(appRouteData)
      })

      // When there are changes in the route and and the
      // side bar is not opend, notify visually that there
      // new data about the route calculated that can be seen
      // by openning the sidebar
      this.eventBus.$on('newInfoAvailable', () => {
        if (!context.$store.getters.leftSideBarOpen) {
          context.newInfoAvailable = true
        }
      })

      this.eventBus.$on('searched', () => {
        if (!context.$store.getters.leftSideBarOpen) {
          context.newInfoAvailable = true
        }
        context.$emit('searched')
      })

      this.eventBus.$on('refreshSearch', () => {
        context.search()
      })
    },

    /**
     * Load the map data from the url
     * rebuilding the place inputs and it values
     * and render the map with these data (place or route)
     */
    loadData () {
      let places = this.$store.getters.appRouteData.places.slice(0)

      if (places.length === 1 /* && this.$store.getters.leftSideBarOpen */) {
        this.place = places[0]
      }
      if (this.$store.getters.mode === constants.modes.search) {
        if (!this.place.nameIsCoord()) {
          this.$store.commit('mapCenter', this.$store.getters.appRouteData.options.center)
          this.search()
        }
      }
      this.$forceUpdate()
    },
    /**
     * When the menu btn is clicked, open the main
     * map search by setting the setLeftSideBarIsOpen
     */
    openMenu () {
      this.$store.commit('setLeftSideBarIsOpen', true)
      this.newInfoAvailable = false
    },

    /**
     * When there is already a place selected
     * and the route action is called, open the
     * side bar and emit and event passing the current
     * place to the map-search component
     * @emits openDirectionsMode
     * @emits switchToDirections
     */
    openDirectionsMode () {
      this.$store.commit('setLeftSideBarIsOpen', true)
      if (this.place.isEmpty()) {
        // Make sure that the place will
        // not be resolved if it is empty
        // when switching to directions
        this.place.placeName = ''
        this.place.unresolved = false
        this.eventBus.$emit('switchToDirections')
      } else {
        this.eventBus.$emit('openDirectionsMode', this.place)
      }
      this.openingRouteMode = true
      this.place = new Place()
    },

    /**
     * After each change on the map search we redirect the user to the built target app route
     * The data will be loaded from the path and the map will be updated, keeping the
     * url synchronized with the current map status
     */
    updateAppRoute () {
      if (this.$store.getters.mode !== constants.modes.directions && this.place.placeName === '') {
        this.$store.commit('mode', constants.modes.place)
      }
      let appMode = new AppMode(this.$store.getters.mode)
      let places = this.place.isEmpty() ? [] : [this.place]
      let route = appMode.getRoute(places)
      this.$router.push(route)
    },

    /**
     * Update map places to be displayed
     * @param {*} places
     */
    showSearchResults (places) {
      this.mapViewData = this.mapViewData || new MapViewData()
      this.mapViewData.places = places
      this.mapViewData.routes = []
      this.eventBus.$emit('mapViewDataChanged', this.mapViewData)
    },

    /**
     * Set a a suggested place as the selected one for a given place input
     * @param {*} data - can be the palce object or an object containing the place
     */
    selectPlace (data) {
      if (data.place) {
        this.place = data.place
      } else {
        this.place = data
      }

      this.$store.commit('mode', constants.modes.place)
      let appMode = new AppMode(this.$store.getters.mode)

      // Define new app route
      let route = appMode.getRoute([this.place])
      this.$store.commit('cleanMap', this.$store.getters.appRouteData.places.length === 0)
      this.$router.push(route)
    },

    /**
     * Reset the place input
     */
    placeCleared () {
      this.place = new Place()
      this.eventBus.$emit('clearMap')
      this.$forceUpdate()
      this.searching = true
      this.updateAppRoute()
    },

    /**
     * Defines the place input values at the given index based in the browser location api
     * It will requires the users' authorization to access the browser location. Id denied
     * will show a toaster with an error message
     * @param {*} location
     */
    setLocationFromBrowser (location) {
      let place = new Place(location.lon, location.lat, this.$t('simplePlaceSearch.yourLocation'))
      place.seFromBrowser(true)
      place.seSkipShowData(true)
      this.myLocation = true
      this.updateAppRoute()
    },

    /**
     * Search a place by name
     *
     */
    search () {
      this.searching = true
      let context = this

      // Run the place search
      this.eventBus.$emit('showLoading', true)
      PlacesSearch(this.place.placeName).then(places => {
        if (places.length === 0) {
          this.showInfo(this.$t('simplePlaceSearch.noPlaceFound'))
        } else {
          context.showSearchResults(places)
        }
      }).catch(response => {
        console.log(response)
        context.showError(context.$t('simplePlaceSearch.unknownSearchPlaceError'))
      }).finally(() => {
        context.searching = false
        context.eventBus.$emit('showLoading', false)
      })
    }
  }
}

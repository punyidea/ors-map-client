import FormActions from '@/fragments/forms/map-form/components/form-actions/FormActions'
import MapViewDataBuilder from '@/support/map-data-services/map-view-data-builder'
import FieldsContainer from '@/fragments/forms/fields-container/FieldsContainer'
import OrsFilterUtil from '@/support/map-data-services/ors-filter-util'
import PlaceInput from '@/fragments/forms/place-input/PlaceInput.vue'
import { Optimization } from '@/support/ors-api-runner'
import AppMode from '@/support/app-modes/app-mode'
import MapViewData from '@/models/map-view-data'
import constants from '@/resources/constants'
import appConfig from '@/config/app-config'
import Place from '@/models/place'
import {EventBus} from '@/common/event-bus'

// Local components
import MapFormMixin from '../map-form-mixin'
import OptimizationDetails from './components/optimization-details/OptimizationDetails'

export default {
  mixins: [MapFormMixin],
  data: () => ({
    mode: constants.modes.optimization,
    mapViewData: new MapViewData(),
    places: [new Place()],
    vehicles: [{'id':1,'profile':'driving-car','start':[2.35044,48.71764],'end':[2.35044,48.71764],'capacity':[4],'skills':[1,14],'time_window':[28800,43200]},
      {'id':2,'profile':'driving-car','start':[2.35044,48.71764],'end':[2.35044,48.71764],'capacity':[4],'skills':[2,14],'time_window':[28800,43200]}],
    roundTripActive: false,
    showManageJobsTooltip: true
  }),
  components: {
    PlaceInput,
    FieldsContainer,
    FormActions,
    OptimizationDetails
  },
  computed: {
    disabledActions () {
      return appConfig.disabledActionsForOptimization
    }
  },
  created () {
    this.loadData()
    const context = this
    // When the filters object has changed externally, reprocess the app route
    EventBus.$on('filtersChangedExternally', () => {
      if (context.active) {
        context.updateAppRoute()
      }
    })
    // When the user click on a marker to remove it
    EventBus.$on('removePlace', (data) => {
      if (context.active) {
        context.removePlace(data)
      }
    })

    /**
     * Update local object when a mapViewData is uploaded
     */
    EventBus.$on('mapViewDataUploaded', (mapViewData) => {
      if (context.active) {
        context.mapViewData = mapViewData
        context.places = mapViewData.places
      }
    })

    /**
     * If the map data view has changed and this component
     * is not active, then reset its data to the initial state
     */
    EventBus.$on('mapViewDataChanged', () => {
      if (!context.active) {
        context.mapViewData = new MapViewData()
        context.places = [new Place()]
      }
    })
    //
    // // When the user click on the map and select to add this point as an additional destination in the route
    // EventBus.$on('addAsIsochroneCenter', (data) => {
    //   context.addAsIsochroneCenter(data)
    // })

    // When a marker drag finishes, update
    // the place coordinates and re-render the map
    EventBus.$on('markerDragged', (marker) => {
      if (context.active) {
        const place = new Place(marker.position.lng, marker.position.lat)
        context.places[marker.inputIndex] = place
        context.places[marker.inputIndex].resolve().then(() => {
          context.updateAppRoute()
        })
      }
    })

    EventBus.$on('setInputPlace', (data) => {
      if (context.active) {
        context.places[data.pickPlaceIndex] = data.place
        let filledPlaces = context.getFilledPlaces()
        if (filledPlaces.length > 0) {
          context.updateAppRoute()
        } else {
          context.setSidebarIsOpen(true)
          context.$forceUpdate()
        }
      }
    })
  },
  watch: {
    $route: function () {
      if (this.$store.getters.mode === constants.modes.optimization) {
        this.loadData()
      } else {
        this.places = [new Place()]
      }
    }
  },
  methods: {
    /**
     * When the user click on the map and select a point as the route start
     * @param {*} data {latLng: ..., place:...}
     */
    addJob (data) {
      this.places.push(new Place(data.latLng.lng, data.latLng.lat, '', { resolve: true }))
      const context = this
      this.places.at(-1).resolve().then(() => {
        context.updateAppRoute()
      }).catch((err) => {
        console.log(err)
        context.showError(this.$t('optimization.couldNotResolveTheJobLocation'), { timeout: 0 })
      })
    },
    manageJobs(jobId) {
      // TODO: Have Job Management in separate component. Popup using Box component.
      console.log(jobId)
      this.showError(this.$t('global.notImplemented'), {timeout: 3000})

    },
    /**
     * Set a suggested place as the selected one for a given place input
     * @param {*} data - can be the place object or an object containing the place
     */
    selectPlace (data) {
      if (data.place) {
        this.places[data.index] = data.place
        this.$store.commit('mode', constants.modes.optimization)
        const appMode = new AppMode(this.$store.getters.mode)

        // Define new app route
        const route = appMode.getRoute(this.places)
        if (Object.keys(route.params).length > 1) { // params contains data and placeName? props
          this.$store.commit('cleanMap', this.$store.getters.appRouteData.places.length === 0)
          this.$router.push(route)
        }
      }
    },
    /**
     * Reset the place input
     */
    placeCleared (index) {
      this.places[index] = new Place()
      this.updateAppRoute()
    },
    /**
     * After each change on the map search we redirect the user to the built target app route
     * The data will be loaded from the path and the map will be updated, keeping the
     * url synchronized with the current map status
     */
    updateAppRoute () {
      const places = this.getFilledPlaces()
      this.$store.commit('mode', constants.modes.optimization)
      const appMode = new AppMode(this.$store.getters.mode)
      const route = appMode.getRoute(places)
      if (Object.keys(route.params).length > 1) {// params contains data and placeName? props
        this.$router.push(route)
      }
    },
    /**
     * Update the value in the filter when a parameter is updated in form-fields
     * and then change the app route
     *
     * @param {*} data
     */
    filterUpdated (data) {
      if (data.value !== undefined) {
        if (data.parentIndex !== undefined) {
          const parent = OrsFilterUtil.getFilterByAncestryAndItemIndex(data.parentIndex, data.index)
          parent.value = data.value
        } else {
          this.OrsMapFiltersAccessor[data.index].value = data.value
        }
      }
      this.updateAppRoute()
    },
    /**
     * Remove a place input at a given index
     * @param {*} index
     */
    removePlaceInput (index) {
      this.places.splice(index, 1)
      this.updateAppRoute()
    },
    /**
     * When the user reorder the place inputs, recalculates thr route
     */
    onReordered () {
      // If the user has changed the order
      // we have to change the app route
      // and reload the map
      this.updateAppRoute()
    },
    /**
     * Request and draw a route based on the value of multiples places input
     * @returns {Promise}
     */
    optimizeJobs () {
      const context = this
      return new Promise((resolve) => {
        const places = context.getFilledPlaces()

        if (places.length > 0) {
          context.showInfo(context.$t('optimization.optimizeJobs'), { timeout: 0 })
          EventBus.$emit('showLoading', true)

          // Calculate the route
          Optimization(places, context.vehicles).then(data => {
            data.options.translations = context.$t('global.units')
            data.options.translations.polygon = this.$t('global.polygon')

            data = context.$root.appHooks.run('beforeBuildOptimizationMapViewData', data)
            if (data) {
              MapViewDataBuilder.buildMapData(data, context.$store.getters.appRouteData).then((mapViewData) => {
                context.mapViewData = mapViewData
                EventBus.$emit('mapViewDataChanged', mapViewData)
                EventBus.$emit('newInfoAvailable')
                context.showSuccess(context.$t('optimization.optimizationResultReady'))
                context.setSidebarIsOpen()
                resolve(mapViewData)
              })
            }
          }).catch(result => {
            context.handleOptimizeJobsError(result)
          }).finally(() => {
            EventBus.$emit('showLoading', false)
          })
        } else {
          // There are no enough places or round trip to be routed
          resolve({})
        }
      })
    },
    /**
     * Handle the route places error response displaying the correct message
     * @param {*} result
     * @param {*} args
     */
    handleOptimizeJobsError (result) {
      this.$root.appHooks.run('beforeHandleOptimizationError', result)

      const errorCode = this.lodash.get(result, constants.responseErrorCodePath)
      if (errorCode) {
        const errorKey = `optimization.apiError.${errorCode}`
        let errorMsg = this.$t(errorKey)
        if (errorMsg === errorKey) {
          errorMsg = this.$t('optimization.genericErrorMsg')
        }
        this.showError(errorMsg, { timeout: 0, mode: 'multi-line' })
        console.error(result.response.error)
      } else {
        this.showError(this.$t('optimization.notPossible'), { timeout: 0 })
        console.error(result)
      }
    },

    /**
     * Load the map data from the url
     * rebuilding the place inputs, and its values
     * and render the map with this data (place or route)
     */
    loadData () {
      if (this.$store.getters.mode === constants.modes.optimization) {
        // Empty the array and populate it with the
        // places from the appRoute without changing the
        // object reference because it is a prop
        this.places = this.$store.getters.appRouteData.places

        if (this.places.length > 0) {
          this.optimizeJobs()
        } else {
          this.addPlaceInput()
        }
      }
    },
    vehicleColors(vehicleId) {
      return constants.vehicleColors[vehicleId]
    }
  }
}

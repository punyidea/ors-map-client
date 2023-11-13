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
import {EventBus} from '@/common/event-bus'

// Local components
import MapFormMixin from '../map-form-mixin'
import OptimizationDetails from './components/optimization-details/OptimizationDetails'
import JobList from './components/job-list/JobList.vue'
import EditJobs from './components/job-list/EditJobs.vue'
import Job from '@/models/job'
import Vehicle from '@/models/vehicle'

export default {
  mixins: [MapFormMixin],
  data: () => ({
    mode: constants.modes.optimization,
    mapViewData: new MapViewData(),
    jobs: [
      // {'id':1,'service':300,'amount':[1],'location':[1.98465,48.70329],'skills':[1],'time_windows':[[32400,36000]]},
      // {'id':2,'service':300,'amount':[1],'location':[2.03655,48.61128],'skills':[1]},
      // {'id':3,'service':300,'amount':[1],'location':[2.39719,49.07611],'skills':[2]},
      // {'id':4,'service':300,'amount':[1],'location':[2.41808,49.22619],'skills':[2]},
      // {'id':5,'service':300,'amount':[1],'location':[2.28325,48.5958],'skills':[14]},
      // {'id':6,'service':300,'amount':[1],'location':[2.89357,48.90736],'skills':[14]}
    ],
    vehicles: [Vehicle.fromJSON('{"id":1,"profile":"driving-car","start":[2.3414611816406254, 48.71401514864314],"end":[2.3414611816406254, 48.71401514864314],"capacity":[4],"time_window":[28800,43200]}'),
      Vehicle.fromJSON('{"id":2,"profile":"driving-car","start":[2.3717594146728516, 48.710107345900575],"end":[2.3717594146728516, 48.710107345900575],"capacity":[4],"time_window":[28800,43200]}')],
    // vehicles: [Vehicle.fromJSON('{"id":1,"profile":"driving-car","start":[2.3414611816406254, 48.71401514864314],"end":[2.3414611816406254, 48.71401514864314],"capacity":[4],"skills":[1,14],"time_window":[28800,43200]}'),
    //   Vehicle.fromJSON('{"id":2,"profile":"driving-car","start":[2.3717594146728516, 48.710107345900575],"end":[2.3717594146728516, 48.710107345900575],"capacity":[4],"skills":[2,14],"time_window":[28800,43200]}')],
    roundTripActive: false,
    showManageJobsTooltip: true,
    showJobManagement: false
  }),
  components: {
    PlaceInput,
    FieldsContainer,
    FormActions,
    OptimizationDetails,
    JobList,
    EditJobs
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
        context.jobs = mapViewData.jobs
        context.vehicles = mapViewData.vehicles
      }
    })

    /**
     * If the map data view has changed and this component
     * is not active, then reset its data to the initial state
     */
    EventBus.$on('mapViewDataChanged', () => {
      if (!context.active) {
        context.mapViewData = new MapViewData()
        context.jobs = []
        context.vehicles = []
      }
    })

    // On map right click -> addJob
    EventBus.$on('addJob', (data) => {
      context.addJob(data)
    })

    // On popup edit click -> edit job
    EventBus.$on('editJob', (index) => {
      context.manageJobs(index)
    })

    // On map right click -> addVehicle
    EventBus.$on('addVehicle', (data) => {
      context.addVehicle(data)
    })

    // When a marker drag finishes, update
    // the place coordinates and re-render the map
    EventBus.$on('markerDragged', (marker) => {
      if (context.active) {
        if (marker.text.startsWith('V')) {
          let vehicle = context.vehicles[parseInt(marker.text.slice(1))-1]
          console.log(vehicle)
          vehicle.setLngLat(marker.position.lng, marker.position.lat)
          context.optimizeJobs()
        } else {
          let job = context.jobs[parseInt(marker.text)-1]
          console.log(job)
          job.setLngLat(marker.position.lng, marker.position.lat)
          context.optimizeJobs()
        }
      }
    })
  },
  watch: {
    $route: function () {
      if (this.$store.getters.mode === constants.modes.optimization) {
        this.loadData()
      } else {
        this.jobs = []
        this.vehicles = []
      }
    }
  },
  methods: {
    /**
     * When the user click on the map and select a point as the route start
     * @param {*} data {latLng: ..., place:...}
     */
    addJob (data) {
      const job = Job.fromPlace(data.place)
      job.setId(this.jobs.length + 1)
      const context = this
      job.resolve().then(() => {
        context.jobs.push(job)
        context.manageJobs(job.id)
      }).catch((err) => {
        console.log(err)
        context.showError(this.$t('optimization.couldNotResolveTheJobLocation'), { timeout: 0 })
      })
    },
    manageJobs(jobId) {
      this.showJobManagement = true
      EventBus.$emit('showJobsModal', jobId)
    },
    /**
     * After each change on the map search we redirect the user to the built target app route
     * The data will be loaded from the path and the map will be updated, keeping the
     * url synchronized with the current map status
     */
    updateAppRoute () {
      const jobs = this.jobs
      this.$store.commit('mode', constants.modes.optimization)
      // TODO: adjust this for Jobs
      const appMode = new AppMode(this.$store.getters.mode)
      const route = appMode.getRoute(jobs)
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
     * Request and draw a route based on the value of multiples places input
     * @returns {Promise}
     */
    optimizeJobs () {
      const context = this
      return new Promise((resolve) => {
        if (context.jobs.length > 0) {
          context.showInfo(context.$t('optimization.optimizeJobs'), { timeout: 0 })
          EventBus.$emit('showLoading', true)

          // Calculate the route
          Optimization(context.jobs, context.vehicles).then(data => {
            data.options.translations = context.$t('global.units')
            data.options.translations.polygon = this.$t('global.polygon')

            data = context.$root.appHooks.run('beforeBuildOptimizationMapViewData', data)
            if (data) {
              MapViewDataBuilder.buildMapData(data, context.$store.getters.appRouteData).then((mapViewData) => {
                context.mapViewData = mapViewData
                context.mapViewData.jobs = context.jobs
                context.mapViewData.vehicles = context.vehicles
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
        this.jobs = this.$store.getters.appRouteData.jobs
        let places = this.$store.getters.appRouteData.places
        // TODO: load jobs
        let storedJobs = localStorage.getItem('jobs')
        const jobs = []
        if (storedJobs) {
          for (const job of JSON.parse(storedJobs)) {
            jobs.push(Job.fromJSON(job))
          }
        } else if (places.length > 0) {
          for (const [i, place] of places.entries()) {
            const job = Job.fromPlace(place)
            job.setId(i + 1)
            jobs.push(job)
          }
        }
        this.jobs = jobs
        if (this.jobs) {
          if (this.vehicles) {
            this.optimizeJobs()
          } else {
            this.showError('No vehicles given.')
          }
        } else {
          this.showError('No jobs given. Please add some Jobs to optimize.')
        }
      }
    },
    jobsChanged(editedJobs) {
      let newJobs = []
      for (const job of editedJobs) {
        newJobs.push(job.clone())
      }
      this.jobs = newJobs
      this.optimizeJobs()
    },
    vehiclesChanged(editedVehicles) {
      let newVehicles = []
      for (const vehicle of editedVehicles) {
        newVehicles.push(vehicle.clone())
      }
      this.vehicles = newVehicles
    },
    vehicleColors(vehicleId) {
      return constants.vehicleColors[vehicleId]
    }
  }
}

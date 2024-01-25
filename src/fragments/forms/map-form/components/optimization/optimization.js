import MapFormMixin from '../map-form-mixin'
import MapViewDataBuilder from '@/support/map-data-services/map-view-data-builder'
import FieldsContainer from '@/fragments/forms/fields-container/FieldsContainer'
import OrsFilterUtil from '@/support/map-data-services/ors-filter-util'
import FormActions from '@/fragments/forms/map-form/components/form-actions/FormActions'
import PlaceInput from '@/fragments/forms/place-input/PlaceInput.vue'
import {EventBus} from '@/common/event-bus'
import { Optimization } from '@/support/ors-api-runner'
import AppMode from '@/support/app-modes/app-mode'
import MapViewData from '@/models/map-view-data'
import constants from '@/resources/constants'
import appConfig from '@/config/app-config'
import Job from '@/models/job'
import Vehicle from '@/models/vehicle'
import Skill from '@/models/skill'

// Local components
import OptimizationDetails from './components/optimization-details/OptimizationDetails'
import JobList from './components/job-list/JobList.vue'
import VehicleList from './components/vehicle-list/VehicleList.vue'
import EditJobs from './components/job-list/EditJobs.vue'
import EditVehicles from './components/vehicle-list/EditVehicles.vue'
import EditSkills from './components/skill-list/EditSkills.vue'

export default {
  mixins: [MapFormMixin],
  data: () => ({
    mode: constants.modes.optimization,
    mapViewData: new MapViewData(),
    skills: [],
    jobs: [],
    vehicles: [],
    roundTripActive: false,
    showManageJobsTooltip: true,
    showJobManagement: false,
    showVehicleManagement: false,
    showSkillManagement: false
  }),
  components: {
    FieldsContainer,
    FormActions,
    PlaceInput,
    OptimizationDetails,
    JobList,
    VehicleList,
    EditJobs,
    EditVehicles,
    EditSkills
  },
  computed: {
    jobsJSON () {
      const jsonJobs = []
      for (const job of this.jobs) {
        jsonJobs.push(job.toJSON())
      }
      return jsonJobs
    },
    vehiclesJSON () {
      const jsonVehicles = []
      for (const v of this.vehicles) {
        jsonVehicles.push(v.toJSON())
      }
      return jsonVehicles
    },
    skillsJSON () {
      const jsonSkills = []
      for (const skill of this.skills) {
        jsonSkills.push(skill.toJSON())
      }
      return jsonSkills
    },
    disabledActions () {
      return appConfig.disabledActionsForOptimization
    }
  },
  created () {
    let storedSkills = localStorage.getItem('skills')
    if (storedSkills) {
      const skills = []
      for (const s of JSON.parse(storedSkills)) {
        skills.push(new Skill(s.name, s.id))
      }
      this.skills = skills
    } else {
      this.skills = [Skill.fromJSON('{"name":"length over 1.5m", "id":1}')]
      localStorage.setItem('skills', JSON.stringify(this.skillsJSON))
    }
    this.jobs = [Job.fromJSON('{"id":1,"service":300,"skills":[1],"amount":[1],"location":[8.68525,49.420822]}')]
    this. vehicles = [Vehicle.fromJSON('{"id":1,"profile":"driving-car","start":[ 8.675863, 49.418477 ],"end":[ 8.675863, 49.418477 ],"capacity":[4],"skills":[1]}')]

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

    // On popup edit click -> edit vehicle
    EventBus.$on('editVehicle', (index) => {
      context.manageVehicles(index)
    })

    // When a marker drag finishes, update
    // the place coordinates and re-render the map
    EventBus.$on('markerDragged', (marker) => {
      if (context.active) {
        if (marker.text.startsWith('V')) {
          let vehicle = context.vehicles[parseInt(marker.text.slice(1))-1]
          vehicle.setLngLat(marker.position.lng, marker.position.lat)
          context.optimizeJobs()
        } else {
          let job = context.jobs[parseInt(marker.text)-1]
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
        this.skills = []
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

    addVehicle (data) {
      const vehicle = Vehicle.fromPlace(data.place)
      vehicle.setId(this.vehicles.length + 1)
      const context = this
      vehicle.resolve().then(() => {
        context.vehicles.push(vehicle)
        context.manageVehicles(vehicle.id)
      }).catch((err) => {
        console.log(err)
        context.showError(this.$t('optimization.couldNotResolveTheVehicleLocation'), { timeout: 0 })
      })
    },
    manageVehicles(vehicleId) {
      this.showVehicleManagement = true
      EventBus.$emit('showVehiclesModal', vehicleId)
    },

    manageSkills(skillId) {
      this.showSkillManagement = true
      EventBus.$emit('showSkillsModal', skillId)
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
        if (context.jobs.length) {
          if (context.vehicles.length) {
            context.showInfo(context.$t('optimization.optimizeJobs'), { timeout: 0 })
            EventBus.$emit('showLoading', true)

            // Calculate the optimized routes
            Optimization(context.jobs, context.vehicles).then(data => {
              data.options.translations = context.$t('global.units')

              data = context.$root.appHooks.run('beforeBuildOptimizationMapViewData', data)
              if (data) {
                MapViewDataBuilder.buildMapData(data, context.$store.getters.appRouteData).then((mapViewData) => {
                  context.mapViewData = mapViewData
                  context.mapViewData.jobs = context.jobs
                  context.mapViewData.vehicles = context.vehicles
                  EventBus.$emit('mapViewDataChanged', mapViewData)
                  EventBus.$emit('newInfoAvailable')
                  context.showSuccess(context.$t('optimization.optimizationResultReady'), { timeout: 2000 })
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
            context.showError('No vehicles given. Please add a Vehicle to optimize')
          }
        } else {
          context.showError('No jobs given. Please add some Jobs to optimize')
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
        const defaultJobs = this.jobs
        this.jobs = this.$store.getters.appRouteData.jobs
        let places = this.$store.getters.appRouteData.places
        // TODO: load jobs
        let storedJobs = localStorage.getItem('jobs')
        let storedVehicles = localStorage.getItem('vehicles')
        if (storedVehicles) {
          const vehicles = []
          for (const v of JSON.parse(storedVehicles)) {
            vehicles.push(Vehicle.fromJSON(v))
          }
          this.vehicles = vehicles
        }
        const jobs = []
        if (places.length > 0) {
          for (const [i, place] of places.entries()) {
            const job = Job.fromPlace(place)
            job.setId(i + 1)
            jobs.push(job)
          }
        } else if (storedJobs) {
          for (const job of JSON.parse(storedJobs)) {
            jobs.push(Job.fromJSON(job))
          }
        }
        this.jobs = jobs
        if (!this.jobs.length) {
          this.jobs = defaultJobs
        }
        this.optimizeJobs()
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
    skillsChanged(editedSkills) {
      let newSkills = []
      for (const skill of editedSkills) {
        newSkills.push(skill.clone())
      }
      this.skills = newSkills
    },
  }
}

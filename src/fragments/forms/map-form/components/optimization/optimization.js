import FieldsContainer from '@/fragments/forms/fields-container/FieldsContainer'
import JobInput from '@/fragments/forms/job-input/JobInput.vue'
import MapViewData from '@/models/map-view-data'
import constants from '@/resources/constants'
import appConfig from '@/config/app-config'
import Draggable from 'vuedraggable'
import FormActions from '@/fragments/forms/map-form/components/form-actions/FormActions'
import MapFormMixin from '../map-form-mixin'

// Local components
import JobDetails from './components/job-details/JobDetails.vue'
import Job from '@/fragments/forms/map-form/components/optimization/models/job'

export default {
  mixins: [MapFormMixin],
  data: () => ({
    mode: constants.modes.optimization,
    mapViewData: new MapViewData(),
    jobs: [new Job()],
    vehicles: [],
    roundTripActive: false,
    jobFocusIndex: null
  }),
  components: {
    JobInput,
    FieldsContainer,
    Draggable,
    FormActions,
    JobDetails,
  },
  created () {
    this.setListeners()
    this.loadData()
  },
  watch: {},
  computed: {
    disabledActions () {
      return appConfig.disabledActionsForOptimization
    },

    getJobs () {
      if (this.jobs.length === 0) {
        this.addJobInput()
      }
      return this.jobs
    },

    getVehicles () {
      if (this.vehicles.length === 0) {
        this.addVehicleInput()
      }
      return this.vehicles
    },
  },
  methods: {
    addInput () {
      this.addJobInput()
      this.setFocusedJobInput(this.jobs.length - 1)
    },

    // Set the place focus index
    setFocusedJobInput(index) {
      this.jobFocusIndex = index
      setTimeout(() => {
        this.$forceUpdate()
      }, 200)
    },

    addJobInput(job = null) {
      job = job || new Job()
      this.jobs.push(job)
    },

    removeJobInput(index) {
      this.jobs.splice(index, 1)
      this.mapViewData.jobs = this.jobs
      // If there are no more jobs, then
      // there may not be routes
      if (!this.jobs.length > 0) {
        this.mapViewData.routes = []
      }
    },

    clearJobs() {
      this.places = this.jobs
      this.clearPlaces()
    },

    setListeners () {
      const context = this
    },

    onReordered () {
      // reminder to reload via button?
    },

    /*
     * on go button click:
     * send request
     * render route / set route to be ready to be rendered
     * reload map data, update url but keep map search
     *
     * on reorder: also wait on button click?
     */
  },
}

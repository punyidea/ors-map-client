import {EventBus} from '@/common/event-bus'
import RouteImporter from '@/fragments/forms/route-importer/RouteImporter.vue'
import MapFormBtn from '@/fragments/forms/map-form-btn/MapFormBtn.vue'

export default {
  data: () => ({
    isJobsOpen: false,
  }),
  props: {
    jobs: {
      Type: Array,
      Required: true
    },
    // Amount of place inputs
    disabledActions: {
      default: () => [],
      type: Array
    }
  },
  components: {
    MapFormBtn,
    RouteImporter,
    EventBus
  },
  created () {
    const context = this

    // edit Jobs box is open
    EventBus.$on('showJobsModal', () => {
      context.isJobsOpen = true
    })
  },
  methods: {
    closeJobsModal () {
      this.isJobsOpen = false
    },

    isEnabled (action) {
      const disabled = this.disabledActions
      return !disabled.includes(action)
    },

    contentUploaded (data) {
      this.$emit('contentUploaded', data)
    },

    importJobs () {
      // TODO: import jobs
    },
    exportJobs () {
      // TODO: export jobs
    },
  }
}

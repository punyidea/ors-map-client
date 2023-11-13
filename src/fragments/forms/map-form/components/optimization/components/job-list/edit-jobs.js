import {EventBus} from '@/common/event-bus'
import RouteImporter from '@/fragments/forms/route-importer/RouteImporter.vue'
import MapFormBtn from '@/fragments/forms/map-form-btn/MapFormBtn.vue'
import PlaceInput from '@/fragments/forms/place-input/PlaceInput.vue'
import Job from '@/models/job'

export default {
  data: () => ({
    isJobsOpen: true,
    editId: 0,
    editJobs: []
  }),
  props: {
    jobs: {
      Type: Array[Job],
      Required: true
    },
    // Amount of place inputs
    disabledActions: {
      default: () => [],
      type: Array,
    }
  },
  components: {
    PlaceInput,
    MapFormBtn,
    RouteImporter,
    EventBus
  },
  computed: {
    jobsJSON () {
      const jsonJobs = []
      for (const job of this.jobs) {
        jsonJobs.push(job.toJSON())
      }
      return jsonJobs
    }
  },
  created () {
    for (const job of this.jobs) {
      this.editJobs.push(job.clone())
    }
    const context = this

    // edit Jobs box is open
    EventBus.$on('showJobsModal', (editId) => {
      context.isJobsOpen = true
      context.editId = editId
    })
  },
  methods: {
    closeJobsModal () {
      this.isJobsOpen = false
      this.$emit('close')
    },

    isEnabled (action) {
      const disabled = this.disabledActions
      return !disabled.includes(action)
    },

    contentUploaded (data) {
      this.$emit('contentUploaded', data)
    },
    importJobs () {
      // TODO: Import from JSON
      this.showError(this.$t('global.notImplemented'), {timeout: 3000})
    },
    exportJobs () {
      navigator.clipboard.writeText(JSON.stringify(this.jobsJSON)).then(() => {
        this.showSuccess(this.$t('job.copiedToClipboard'), {timeout: 3000})
      }, () => {
        this.showError(this.$t('job.copiedToClipboardFailed'), {timeout: 3000})
      },)
    },
    removeJob (id) {
      this.editJobs.splice(id-1,1)
      for (const i in this.editJobs) {
        this.editJobs[i].setId(parseInt(i)+1)
      }
    },
    addJob (fromMap) {
      if(fromMap) {
      //   choose point from map
      }
    },
    saveJobs () {
      this.$emit('jobsChanged', this.editJobs)
      this.closeJobsModal()
    },
    restoreJobs () {
      this.editJobs = this.jobs
    }
  }
}

import RouteImporter from '@/fragments/forms/route-importer/RouteImporter.vue'
import MapFormBtn from '@/fragments/forms/map-form-btn/MapFormBtn.vue'
import PlaceInput from '@/fragments/forms/place-input/PlaceInput.vue'
import SkillList from './SkillList.vue'
import {EventBus} from '@/common/event-bus'
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
    skills: {
      Type: Array[Skill],
      Required: false
    },
    // Amount of place inputs
    disabledActions: {
      default: () => [],
      type: Array,
    }
  },
  components: {
    RouteImporter,
    MapFormBtn,
    PlaceInput,
    EventBus,
    SkillList
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
    isEnabled (action) {
      const disabled = this.disabledActions
      return !disabled.includes(action)
    },

    closeJobsModal () {
      this.isJobsOpen = false
      this.$emit('close')
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
    saveJobs () {
      this.$emit('jobsChanged', this.editJobs)
      this.closeJobsModal()
    },
    addJob (fromMap) {
      if(fromMap) {
        // TODO: choose point from map
        this.showError(this.$t('global.notImplemented'), {timeout: 3000})
      }
    },
    removeJob (id) {
      this.editJobs.splice(id-1,1)
      for (const i in this.editJobs) {
        this.editJobs[i].setId(parseInt(i)+1)
      }
    },
    copyJob () {
      this.showError(this.$t('global.notImplemented'), {timeout: 3000})
    },
    restoreJobs () {
      this.editJobs = this.jobs
    }
  }
}

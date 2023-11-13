import {EventBus} from '@/common/event-bus'
import RouteImporter from '@/fragments/forms/route-importer/RouteImporter.vue'
import MapFormBtn from '@/fragments/forms/map-form-btn/MapFormBtn.vue'
import PlaceInput from '@/fragments/forms/place-input/PlaceInput.vue'
import Vehicle from '@/models/vehicle'

export default {
  data: () => ({
    isVehiclesOpen: true,
    editId: 0,
    editVehicles: []
  }),
  props: {
    vehicles: {
      Type: Array[Vehicle],
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
    vehiclesJSON () {
      const jsonVehicles = []
      for (const v of this.vehicles) {
        jsonVehicles.push(v.toJSON())
      }
      return jsonVehicles
    }
  },
  created () {
    for (const v of this.vehicles) {
      this.editVehicles.push(v.clone())
    }
    const context = this

    // edit Vehicles box is open
    EventBus.$on('showVehiclesModal', (editId) => {
      context.isVehiclesOpen = true
      context.editId = editId
    })
  },
  methods: {
    closeVehiclesModal () {
      this.isVehiclesOpen = false
      this.$emit('close')
    },

    isEnabled (action) {
      const disabled = this.disabledActions
      return !disabled.includes(action)
    },

    contentUploaded (data) {
      this.$emit('contentUploaded', data)
    },
    importVehicles () {
      // TODO: Import from JSON
      this.showError(this.$t('global.notImplemented'), {timeout: 3000})
    },
    exportVehicles () {
      navigator.clipboard.writeText(JSON.stringify(this.vehiclesJSON)).then(() => {
        this.showSuccess(this.$t('vehicle.copiedToClipboard'), {timeout: 3000})
      }, () => {
        this.showError(this.$t('vehicle.copiedToClipboardFailed'), {timeout: 3000})
      },)
    },
    removeVehicle (id) {
      this.editVehicles.splice(id-1,1)
      for (const i in this.editVehicles) {
        this.editVehicles[i].setId(parseInt(i)+1)
      }
    },
    addVehicle () {

    },
    saveVehicles () {
      this.$emit('vehiclesChanged', this.editVehicles)
      this.closeVehiclesModal()
    },
    restoreVehicles () {
      this.editVehicles = this.vehicles
    }
  }
}

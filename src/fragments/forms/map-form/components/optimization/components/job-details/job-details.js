import Share from '@/fragments/forms/map-form/components/share/Share'
import Print from '@/fragments/forms/map-form/components/print/Print'
import resolver from '@/support/routes-resolver'
import MapViewData from '@/models/map-view-data'
import geoUtils from '@/support/geo-utils'
import constants from '@/resources/constants'

export default {
  props: {
    mapViewData: {
      required: true,
      type: MapViewData
    }
  },
  data: () => ({
    imageUrlFallBack: (resolver.homeUrl() + '/static/img/map-pin-600x400.jpg').replace('//', '/'),
    worldImageryTileProviderBaseUrl: constants.worldImageryTileProviderBaseUrl,
  }),
  methods: {

    job () {
      const job = this.mapViewData.places[0]
      if (!job.properties.country) {
        job.resolve().then(() => {
          if (!job.properties.layer) {
            job.properties.layer = 'notAvailable'
          }
        })
      }
      return job
    },

    // Copy latitude/longitude to clipboard
    copyLatLng () {
      const latLng = `${this.place.lat}, ${this.place.lng}`
      if (this.copyToClipboard(latLng)) {
        this.showSuccess(this.$t('placeDetails.latlngCopied'), { timeout: 2000 })
      }
    },
    // Copy longitude, latitude to clipboard
    copyLngLat () {
      const lngLat = `${this.place.lng}, ${this.place.lat}`
      if (this.copyToClipboard(lngLat)) {
        this.showSuccess(this.$t('placeDetails.lnglatCopied'), { timeout: 2000 })
      }
    },
  },
  computed: {
    shareUrl () {
      return location.href
    },
    imagePath () {
      if (this.jobLayer) {
        const zoom = geoUtils.zoomLevelByLayer(this.jobLayer)
        const tileData = geoUtils.getTileData(this.job.lat, this.place.lng, zoom)
        const url = `${this.worldImageryTileProviderBaseUrl}/${tileData.z}/${tileData.y}/${tileData.x}`
        return url
      } else {
        return this.imageUrlFallBack
      }
    },
    jobLayer () {
      const layer = this.jobs.properties.layer
      if (layer !== 'notAvailable') {
        return layer
      }
    }
  },
  components: {
    Share,
    Print
  }
}

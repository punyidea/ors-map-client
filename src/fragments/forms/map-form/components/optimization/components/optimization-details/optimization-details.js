import Download from '@/fragments/forms/map-form/components/download/Download'
import Share from '@/fragments/forms/map-form/components/share/Share'
import Print from '@/fragments/forms/map-form/components/print/Print'
import MapViewData from '@/models/map-view-data'
import OptimizationSteps from './components/optimization-steps/OptimizationSteps'
import geoUtils from '@/support/geo-utils'
import constants from '@/resources/constants'

export default {
  data: () => ({
    localMapViewData: null,
    panelExtended: [true, true, true],
  }),
  props: {
    mapViewData: {
      Type: MapViewData,
      Required: true
    }
  },
  components: {
    OptimizationSteps,
    Share,
    Download,
    Print
  },
  computed: {
    hasRoutes () {
      return this.localMapViewData.isRouteData
    },
    shareUrl () {
      return location.href
    },
    /**
     * Builds and return the routes
     * parsed, with translations and
     * humanized content
     * @returns {Array} of route objects
     */
    parsedRoutes () {
      if (!this.hasRoutes) {
        return []
      }
      const routes = []
      for (const key in this.localMapViewData.routes) {
        const route = Object.assign({}, this.localMapViewData.routes[key])
        if (!route.summary) {
          route.summary = geoUtils.getHumanizedTimeAndDistance({distance: route.distance, duration:route.duration, unit: 'm'},  this.$t('global.units'))
          this.parseSteps(route.steps)
          route.distance = route.summary.distance
          route.duration = route.summary.duration
        }
        routes.push(route)
      }
      return routes
    },
  },
  created() {
    this.localMapViewData = this.mapViewData.clone()
  },
  methods: {
    /**
     * get the parsed segments by
     * humanizing the duration and distances
     * @param {*} steps
     * @returns {Object} segments
     */
    parseSteps (steps) {
      for (const step of steps) {
        let {duration, distance} = geoUtils.getHumanizedTimeAndDistance({distance: step.distance, duration:step.duration, unit: 'm'},  this.$t('global.units'))
        step.duration = duration
        step.distance = distance
      }
    },
    vehicleColors(vehicleId) {
      return constants.vehicleColors[vehicleId]
    },
    generateRoute(routeId) {
      // TODO: Move to route tab and generate route for this vehicle using jobs as via points
      console.log(routeId)
      this.showError(this.$t('global.notImplemented'), {timeout: 3000})
    }
  },
  watch: {
    /**
     * Every time the response data changes
     * the map builder is reset and the
     * map data is reloaded
     */
    mapViewData: {
      handler: function () {
        this.localMapViewData = this.mapViewData.clone()
      },
      deep: true
    },
  }
}

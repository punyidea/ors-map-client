import Download from '@/fragments/forms/map-form/components/download/Download'
import Share from '@/fragments/forms/map-form/components/share/Share'
import Print from '@/fragments/forms/map-form/components/print/Print'
import MapViewData from '@/models/map-view-data'


export default {
  data: () => ({
    localMapViewData: null
  }),
  props: {
    mapViewData: {
      Type: MapViewData,
      Required: true
    }
  },
  components: {
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
      const context = this
      for (const key in this.localMapViewData.routes) {
        const route = Object.assign({}, this.localMapViewData.routes[key])
        const unit = route.summary.unit || route.summary.originalUnit
        if (!route.summary.humanized) {
          route.summary = context.getHumanizedSummary(route.summary, unit)
          route.summary.humanized = true
          context.parseSegments(route.properties.segments)
          this.localMapViewData.routes[key].summary = route.summary
        }
        routes.push(route)
      }
      return routes
    }
  },
  created() {
    this.localMapViewData = this.mapViewData.clone()
  },
  methods: {
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

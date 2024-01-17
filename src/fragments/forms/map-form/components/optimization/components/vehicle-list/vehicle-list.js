import constants from "@/resources/constants";

export default {
  data: () => ({
    vehicleExtended: [false]
  }),
  props: {
    vehicles: {
      Type: Array,
      Required: true
    }
  },
  methods: {
    skillIds(vehicle) {
      const ids = []
      for (const skill of vehicle.skills) {
        ids.push(skill.id)
      }
      return ids
    },
    vehicleColors(vehicleId) {
      return constants.vehicleColors[vehicleId]
    },
  }
}

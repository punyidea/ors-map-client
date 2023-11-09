export default {
  data: () => ({
    jobExtended: [true, false, true]
  }),
  props: {
    jobs: {
      Type: Array,
      Required: true
    }
  }
}

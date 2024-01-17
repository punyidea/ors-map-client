export default {
  data: () => ({
    jobExtended: [true]
  }),
  props: {
    jobs: {
      Type: Array,
      Required: true
    }
  },
  methods: {
    skillIds(job) {
      const ids = []
      for (const skill of job.skills) {
        ids.push(skill.id)
      }
      return ids
    }
  }
}

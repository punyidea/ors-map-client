import Job from "@/models/job";

export default {
  data: () => ({
    isSkillsOpen: true,
    skills: []
  }),
  props: {
    skills: {
      Type: Array[Skill],
      Required: false
    },
  },
  computed: {
  },
  methods: {
    closeSkillsModal() {
      this.isSkillsOpen = false
      this.$emit('close')
    },

    saveSkills () {
      this.$emit('skillsChanged', this.skills)
      this.closeSkillsModal()
    },
  }
}

import Skill from '@/models/skill'

export default {
  data: () => ({
    isSkillsOpen: true,
    editId: 0,
    skills: [new Skill()]
  }),
  methods: {
    closeSkillsModal() {
      this.isSkillsOpen = false
      this.$emit('close')
    },

    saveSkills () {
      this.$emit('skillsChanged', this.skills)
      this.closeSkillsModal()
    },
    addSkill () {
      // TODO
      this.showError(this.$t('global.notImplemented'), {timeout: 3000})
    },
    removeSkill (id) {
      this.skills.splice(id-1,1)
      for (const i in this.skills) {
        this.skills[i].setId(parseInt(i)+1)
      }
    },
  }
}

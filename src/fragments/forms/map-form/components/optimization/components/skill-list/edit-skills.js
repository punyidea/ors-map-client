import {EventBus} from '@/common/event-bus'
import Skill from '@/models/skill'

export default {
  data: () => ({
    isSkillsOpen: true,
    editId: 0,
    editSkills: [],
    selectedSkills: []
  }),
  props: {
    skills: {
      Type: Array[Skill],
      Required: false
    },
  },
  components: {
    EventBus
  },
  computed: {
    editSkillsJSON () {
      const jsonSkills = []
      for (const skill of this.editSkills) {
        jsonSkills.push(skill.toJSON())
      }
      return jsonSkills
    }
  },
  created() {
    for (const skill of this.skills) {
      this.editSkills.push(skill.clone())
    }

    const context = this
    // edit Skills box is open
    EventBus.$on('showSkillsModal', (editId) => {
      context.isSkillsOpen = true
      context.editId = editId
    })
  },
  methods: {
    closeSkillsModal() {
      this.isSkillsOpen = false
      this.$emit('close')
    },

    saveSkills () {
      this.$emit('skillsChanged', this.editSkills)
      localStorage.setItem('skills', JSON.stringify(this.editSkillsJSON))
      this.closeSkillsModal()
    },
    addSkill () {
      const newSkill = new Skill('', this.editSkills.length + 1)
      this.editSkills.push(newSkill)
    },
    removeSkill (id) {
      this.editSkills.splice(id-1,1)
      for (const i in this.editSkills) {
        this.editSkills[i].setId(parseInt(i)+1)
      }
    },
  }
}

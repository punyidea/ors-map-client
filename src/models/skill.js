class Skill {
  constructor(skill_name = '', skill_length = null) {
    this.name = skill_name
    this.id = skill_length
  }

  setId(id) {
    this.id = id
  }
}

export default Skill

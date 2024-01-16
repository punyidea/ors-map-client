class Skill {
  constructor(skill_name = '', skill_id = null) {
    this.name = skill_name
    this.id = skill_id
  }

  static fromJSON(skillJSONString) {
    let skill = JSON.parse(skillJSONString)
    return new Skill(skill.name, skill.id)
  }

  static getName(id) {
    const storedSkills = localStorage.getItem('skills')
    let skillObjects = []
    let skillIds = []
    for (const skill of JSON.parse(storedSkills)) {
      const thisSkill = Skill.fromJSON(skill)
      skillObjects.push(thisSkill)
      skillIds.push(thisSkill.id)
    }

    if (id in skillIds) {
      return skillObjects[skillIds.indexOf(id)]
    } else {
      const newSkill = new Skill('Enter skill name', id)
      skillObjects.push(newSkill)
      const jsonSkills = []
      for (const skill of skillObjects) {
        jsonSkills.push(skill.toJSON())
      }
      localStorage.setItem('skills', jsonSkills)
      return newSkill
    }
  }

  clone() {
    return Skill.fromJSON(this.toJSON(true))
  }

  setId(id) {
    this.id = id
  }

  toJSON(stringify = false) {
    let out = {
      'name': this.name,
      'id': this.id
    }
    return stringify ? JSON.stringify(out) : out
  }
}

export default Skill

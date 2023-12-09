class Skill {
  constructor(skill_name = '', skill_id = null) {
    this.name = skill_name
    this.id = skill_id
  }

  static fromJSON(skillJSONString) {
    let skill = JSON.parse(skillJSONString)
    return new Skill(skill.name, skill.id)
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

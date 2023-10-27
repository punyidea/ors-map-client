import Place from '@/models/place'

class Job extends Place {
  constructor(lng = null, lat = null, placeName = '', options = {}) {
    super(options = {})

    this.jobName = this.placeName
    this.location = this.coordinates

    this.service = options.service
    this.amount = options.amount
    this.skills = options.skills
  }
}
export default Job

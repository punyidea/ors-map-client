import Place from '@/models/place'

class Job extends Place {
  constructor(options = {}) {
    super(options = {})

    this.id = this.placeName
    this.service = options.service // time spent at job
    this.amount = options.amount

    this.location = this.coordinates

    this.skills = options.skills
    this.time_windows = options.time_windows
  }
}
export default Job

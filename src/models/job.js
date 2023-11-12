import Place from '@/models/place'

class Job extends Place {
  constructor(lng = null, lat = null, placeName = '', options = {}) {
    super(lng, lat, placeName, options)

    this.location = this.coordinates

    this.id = options.id || null
    this.service = options.service || 0 // time spent at job
    this.skills = options.skills || []
    this.priority = options.priority || 0
    this.time_windows = options.time_windows || []
  }

  static fromPlace(place) {
    return new Job(place.lng, place.lat, place.placeName, {
      id: place.placeId
    })
  }

  /**
   * @param {String} jobJSONString
   */
  static fromJSON(jobJSONString) {
    let job = JSON.parse(jobJSONString)
    return new Job(job.location[0], job.location[1], job.placeName, {
      id: job.id,
      service: job.service,
      skills: job.skills,
      priority: job.priority,
      time_windows: job.time_windows,
      resolve: true
    })
  }

  clone() {
    return Job.fromJSON(this.toJSON(true))
  }

  /**
   * Set the job id
   * @param {*} id
   */
  setId(id) {
    this.id = id
  }

  toJSON(stringify = false) {
    let out = {
      'id': this.id,
      'location': this.location,
      'service': this.service,
      'amount': this.amount
    }

    if (this.skills.length) {
      out['skills'] = this.skills
    }
    if (this.time_windows.length) {
      out['time_windows'] = this.time_windows
    }
    return stringify ? JSON.stringify(out) : out
  }

  static jobsFromFeatures(jobs) {
    const out = []
    for (const job of jobs) {
      jobs.push(Job.fromJSON(job))
    }
    return out
  }
}
export default Job

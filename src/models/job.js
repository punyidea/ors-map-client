import Place from '@/models/place'

class Job extends Place {
  constructor(lng = null, lat = null, placeName = '', options = {}) {
    super(lng, lat, placeName, options)

    this.location = this.coordinates

    this.service = options.service || 300 // time spent at job
    this.amount = options.amount || [1]
    this.skills = options.skills || []
    this.time_windows = options.time_windows || []
    this.id = options.id || null
  }

  static fromPlace(place) {
    return new Job(place.lng, place.lat, place.placeName, {
      placeId: place.placeId
    })
  }

  /**
   * Set the job id
   * @param {*} id
   */
  setId(id) {
    this.id = id
  }

  toJSON() {
    let out = {
      'id': this.id,
      'location': this.location,
      'service': this.service,
      'amount': this.amount
    }
    for (const prop of ['skills','time_window']) {
      if (this[prop].length) {
        out[prop] = this[prop]
      }
    }
  }
}
export default Job

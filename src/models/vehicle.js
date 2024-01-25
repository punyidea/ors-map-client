import Place from '@/models/place'
import Skill from '@/models/skill'

class Vehicle extends Place {
  constructor(lng = null, lat = null, placeName = '', options = {}) {
    super(lng, lat, placeName, options)

    this.start = options.start || this.coordinates
    this.end = options.end || this.coordinates

    this.id = options.id || null
    this.description = options.description || ''
    this.profile = options.profile || 'driving-car'
    this.capacity = options.capacity || [0]
    this.skills = options.skills || []
    this.time_window = options.time_window || []
  }

  static fromPlace(place) {
    return new Vehicle(place.lng, place.lat, place.placeName, {
      id: place.placeId,
    })
  }

  /**
   * @param {String} vehicleJSONString
   */
  static fromJSON(vehicleJSONString) {
    let vehicle = JSON.parse(vehicleJSONString)
    let skillObjects = []
    if (vehicle.skills) {
      for (let id of vehicle.skills) {
        skillObjects.push(Skill.getName(id))
      }
    }
    return new Vehicle(
      vehicle.start[0] || vehicle.end[0],
      vehicle.start[1] || vehicle.end[1],
      vehicle.placeName,
      {
        id: vehicle.id,
        description: vehicle.description,
        profile: vehicle.profile,
        start: vehicle.start,
        end: vehicle.end,
        capacity: vehicle.capacity,
        skills: skillObjects,
        time_window: vehicle.time_window,
        resolve: true,
      }
    )
  }

  clone() {
    return Vehicle.fromJSON(this.toJSON(true))
  }

  /**
   * Set the vehicle id
   * @param {*} id
   */
  setId(id) {
    this.id = id
  }

  toJSON(stringify = false) {
    let out = {
      id: this.id,
      description: this.description,
      profile: this.profile,
      start: this.start,
      end: this.end,
      capacity: this.capacity,
    }

    if (this.skills.length) {
      let skillIds = []
      for (const skill of this.skills) {
        skillIds.push(skill.id)
      }
      skillIds.sort()
      out.skills = skillIds
    }
    if (this.time_window.length) {
      out.time_window = this.time_window
    }
    return stringify ? JSON.stringify(out) : out
  }

  static vehiclesFromFeatures(vehicles) {
    const out = []
    for (const v of vehicles) {
      vehicles.push(Vehicle.fromJSON(v))
    }
    return out
  }

  setLngLat (lng, lat) {
    super.setLngLat(lng, lat)
    this.start = this.coordinates
    this.end = this.coordinates
  }
}

export default Vehicle

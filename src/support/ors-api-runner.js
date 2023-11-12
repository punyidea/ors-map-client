import OrsParamsParser from '@/support/map-data-services/ors-params-parser'
import constants from '@/resources/constants'
import GeoUtils from '@/support/geo-utils'
import AppLoader from '@/app-loader'
import Place from '@/models/place'
import store from '@/store/store'
import lodash from 'lodash'

import OrsApiClient from 'openrouteservice-js'

// By default, we use the openrouteservice-js npm package to query the API.
// But, if it is needed to test and change the openrouteservice-js itself the lib source code
// can be put in the /src/ors-js folder, and then we can use it to apply changes and see
// these changes on the fly. This is only to developers who will work on
// the openrouteservice-js project. If you want to do this, comment the OrsApiClient import above
// and uncomment the import line below to use a local and unpacked openrouteservice-js lib
// import OrsApiClient from '@/ors-js/src'

/**
 * Get the Directions function accessor
 * @param {Array} Places
 * @param {Object} customArgs
 * @returns {Promise}
 */
const Directions = (places, customArgs = null) => {
  const mapSettings = store.getters.mapSettings

  // Build the ors client object
  const directions = new OrsApiClient.Directions({
    api_key: mapSettings.apiKey,
    host: mapSettings.apiBaseUrl,
    service: mapSettings.endpoints.directions
  })

  return new Promise((resolve, reject) => {
    OrsParamsParser.buildRoutingArgs(places).then(args => {
      if (customArgs) {
        args = Object.assign(args, customArgs)
      }
      directions.calculate(args).then(response => {
        const data = { options: { origin: constants.dataOrigins.directions, apiVersion: constants.apiVersion }, content: response }
        resolve(data)
      }).catch(err => {
        err.response.json().then((error) => {
          const result = { response: error, args: args }
          reject(result)
        })
      })
    })
  })
}

/**
 * Get the Geocode function accessor
 * @param {String} term
 * @param {Number} size
 * @returns {Promise}
 */
const Geocode = (term, size = 10) => {
  const mapSettings = store.getters.mapSettings
  const client = new OrsApiClient.Geocode({
    api_key: mapSettings.apiKey,
    host: mapSettings.apiBaseUrl,
    service: mapSettings.endpoints.geocodeSearch
  })
  const args = OrsParamsParser.buildPlaceSearchArgs(term)
  args.size = size
  return new Promise((resolve, reject) => {
    client.geocode(args).then((response) => {
      const places = Place.placesFromFeatures(response.features)
      resolve(places)
    }).catch(err => {
      err.response.json().then((error) => {
        reject(error)
      })
    })
  })
}

/**
 * Find places by using reverse geocode
 * @param {Number} lat
 * @param {Number} lng
 * @param {Number} size
 * @returns {Promise}
 */
const ReverseGeocode = (lat, lng, size = 10) => {
  const mapSettings = store.getters.mapSettings

  const client = new OrsApiClient.Geocode({
    api_key: mapSettings.apiKey,
    host: mapSettings.apiBaseUrl,
    service: mapSettings.endpoints.reverseGeocode
  })
  const args = OrsParamsParser.buildReverseSearchArgs(lat, lng)
  args.size = size
  return new Promise((resolve, reject) => {
    client.reverseGeocode(args).then((response) => {
      const places = Place.placesFromFeatures(response.features)
      resolve(places)
    }).catch(err => {
      err.response.json().then((error) => {
        reject(error)
      })
    })
  })
}

/**
 * Run a search for places given a term. If the search is set to
 * be run within a restricted are and no results are found with
 * this restriction than the function runs a second query ignoring
 * the bounding box restriction
 * @param {*} term
 * @param {*} quantity - default 100
 * @param {*} restrictArea - default true
 * @returns {Promise}
 */
const PlacesSearch = (term, quantity = 100, restrictArea = true) => {
  return new Promise((resolve, reject) => {
    const mapSettings = store.getters.mapSettings

    const client = new OrsApiClient.Geocode({
      api_key: mapSettings.apiKey,
      host: mapSettings.apiBaseUrl,
      service: mapSettings.endpoints.geocodeSearch
    })

    let promises = []

    // Build a search localities only
    let localityArgs = OrsParamsParser.buildPlaceSearchArgs(term, false)
    localityArgs.size = quantity / (quantity / 2)
    localityArgs.layers = ['locality']
    promises.push(client.geocode(localityArgs))
    AppLoader.getInstance().appHooks.run('placeSearchLocalityArgsDefined', localityArgs)

    // Build a search counties only
    let countyArgs = OrsParamsParser.buildPlaceSearchArgs(term, false)
    countyArgs.size = quantity / (quantity / 1)
    countyArgs.layers = ['county']
    promises.push(client.geocode(countyArgs))
    AppLoader.getInstance().appHooks.run('placeSearchCountyArgsDefined', countyArgs)

    // Build a search for addresses
    let addressesArgs = OrsParamsParser.buildPlaceSearchArgs(term, false)
    addressesArgs.size = quantity
    addressesArgs.layers = ['country', 'region', 'macrocounty', 'macroregion', 'neighbourhood', 'borough', 'street', 'address', 'postalcode'] // `coarse` will bring places by postal code
    promises.push(client.geocode(addressesArgs))
    AppLoader.getInstance().appHooks.run('placeSearchAddressArgsDefined', addressesArgs)

    // Build a search for venues
    const restrictToBbox = restrictArea && mapSettings.prioritizeSearchingForNearbyPlaces
    let poisArgs = OrsParamsParser.buildPlaceSearchArgs(term, restrictToBbox)
    poisArgs.size = quantity
    poisArgs.layers = ['venue'] // venue = POI
    promises.push(client.geocode(poisArgs))
    AppLoader.getInstance().appHooks.run('placeSearchPoisArgsDefined', addressesArgs)

    promises = AppLoader.getInstance().appHooks.run('placeSearchPromisesDefined', promises)

    Promise.all(promises).then((responses) => {
      const places = buildPlacesSearchResult(responses, quantity)
      resolve(places)
    }).catch(err => {
      err.response.json().then((error) => {
        reject(error)
      })
    })
  })
}

/**
 * Build places result from promises response
 * @param {Array} responses
 * @returns {Array} of Places
 */
const buildPlacesSearchResult = (responses, quantity) => {
  let features = []

  // Get the locality from the list, if available
  if (Array.isArray(responses) && responses.length > 0) {
    let localityFeatures = responses[0].features
    if(localityFeatures && localityFeatures.length > 0) {
      quantity = quantity - localityFeatures.length
      features = features.concat(localityFeatures)
    }

    let countyFeatures = responses[1].features
    if(countyFeatures && countyFeatures.length > 0) {
      quantity = quantity - countyFeatures.length
      features = features.concat(countyFeatures)
    }

    // By default, get all the features of the administrative places list
    let adminFeatures = []
    if (responses.length > 1) {
      adminFeatures = responses[2].features
    }

    // If there are administrative places and also places
    // from POIs (venues) then merge them into the collection
    let poisFeatures = responses.length === 4 ? responses[3].features : []

    if (poisFeatures.length > 0) {
      let half = Math.round((quantity / 2))
      let amountTobGetFromPOIsList = poisFeatures.length > half ? half : poisFeatures.length
      let amountTobGetFromAdminList = quantity - amountTobGetFromPOIsList
      features = features.concat(adminFeatures.slice(0, amountTobGetFromAdminList))
      features = features.concat(poisFeatures.slice(0, amountTobGetFromPOIsList))
    } else {
      features = features.concat(adminFeatures)
    }
  }
  features = sortFeatures(features)

  let places = Place.placesFromFeatures(features)
  places = AppLoader.getInstance().appHooks.run('placeSearchResultPrepared', places)
  return places
}

/**
 * Sort features by layer and distance from current map center
 * @param {*} features
 * @returns {Array} features
 */
const sortFeatures  = (features) => {
  if (features.length < 2) {
    return features
  }
  // Se the distance of each location considering the current map center
  for (let key in features) {
    let featureLatLng = GeoUtils.buildLatLong(features[key].geometry.coordinates[1], features[key].geometry.coordinates[0])
    features[key].distance = GeoUtils.calculateDistanceBetweenLocations(store.getters.mapSettings.mapCenter, featureLatLng, store.getters.mapSettings.unit)
    // Add a unique id for each feature
    features[key].properties.unique_id = features[key].properties.id || `osm_id_${features[key].properties.osm_id}`
  }
  // Sort by distance
  features = lodash.sortBy(features, ['distance', 'asc'])

  let bestMatchIndex = lodash.findIndex(features, function(f) { return f.bestMatch === true})
  if (bestMatchIndex > -1) {
    // Move best match to first position (duplicated items will be removed later)
    features.splice(0, 0, features[bestMatchIndex])
  }

  let postalCodeIndex = lodash.findIndex(features, function(f) { return f.properties.layer === 'postalcode'})
  if (postalCodeIndex > 1) {
    // Move postalcode place to first position (duplicated items will be removed later)
    features.splice(0, 0, features[postalCodeIndex])
  } else {
    let closestCityIndex = lodash.findIndex(features, function(f) { return f.properties.layer === 'locality' || f.properties.layer === 'city'})
    if (closestCityIndex > 1) {
      // Move the closest city to second position (duplicated items will be removed later)
      features.splice(1, 0, features[closestCityIndex])
    }
  }
  let closestCountyIndex = lodash.findIndex(features, function(f) { return f.properties.layer === 'county' })
  if (closestCountyIndex > 1) {
    // Move the closest city to second position (duplicated items will be removed later)
    features.splice(2, 0, features[closestCountyIndex])
  }

  let closestCountryIndex = lodash.findIndex(features, function(f) { return f.properties.layer === 'country'})
  if (closestCountryIndex > 2) {
    // Move the closest city to third position (duplicated items will be removed later)
    features.splice(3, 0, features[closestCountryIndex])
  }
  // remove duplicated
  features = lodash.uniqBy(features, function (f) { return f.properties.unique_id })
  return features
}

/**
 * Get the POIs
 * @param {Object} filters {
 *  category_group_ids: Array,
 *  category_ids: Array,
 *  name: Array [String],
 *  wheelchair: Array ["yes","no","limited","designated"],
 *  smoking: Array ['dedicated','yes','no','separated','isolated','outside'],
 *  fee: Array ['yes', 'no']
 * } @see https://openrouteservice.org/dev/#/api-docs/pois/post
 * @param {Number} limit
 * @param {Number} distanceBuffer
 * @returns {Promise}
 */
const Pois = (filters, limit = 100, distanceBuffer = 500) => {
  const mapSettings = store.getters.mapSettings

  const pois = new OrsApiClient.Pois({
    api_key: mapSettings.apiKey,
    host: mapSettings.apiBaseUrl,
    service: mapSettings.endpoints.pois
  })

  return new Promise((resolve, reject) => {
    let args = OrsParamsParser.buildPoisSearchArgs(filters, limit, distanceBuffer)
    pois.pois(args).then((response) => {
      resolve(response)
    }).catch((err) => {
      err.response.json().then((error) => {
        reject(error)
      })
    })
  })
}

/**
 * Get isochrones for a list of places
 * @param {*} places
 * @returns {Promise}
 */
const Isochrones = (places) => {
  const mapSettings = store.getters.mapSettings

  const isochrones = new OrsApiClient.Isochrones({
    api_key: mapSettings.apiKey,
    host: mapSettings.apiBaseUrl,
    service: mapSettings.endpoints.isochrones
  })
  return new Promise((resolve, reject) => {
    OrsParamsParser.buildIsochronesArgs(places).then(args => {
      isochrones.calculate(args).then((response) => {
        const data = { options: { origin: constants.dataOrigins.isochrones, apiVersion: constants.apiVersion }, content: response }
        resolve(data)
      }).catch((err) => {
        err.response.json().then((error) => {
          const result = { response: error, args: args }
          reject(result)
        })
      })
    })
  })
}

/**
 * Optimize a list of Jobs for Vehicles
 * @returns {Promise}
 * @param jobs
 * @param vehicles
 */
const Optimization = (jobs, vehicles = []) => {
  console.log(vehicles)
  const mapSettings = store.getters.mapSettings

  const optimization = new OrsApiClient.Optimization({
    api_key: mapSettings.apiKey,
    host: mapSettings.apiBaseUrl,
    service: mapSettings.endpoints.optimization
  })
  return new Promise((resolve, reject) => {
    OrsParamsParser.buildOptimizationArgs(jobs, vehicles).then(args => {
      let mock = false  // TODO: remove Mock
      console.log(args)
      if (mock) {
        resolve({ options: { origin: constants.dataOrigins.optimization, apiVersion: constants.apiVersion }, content: optimizationMockData })
      } else {
        optimization.calculate(args).then((response) => {
          const data = { options: { origin: constants.dataOrigins.optimization, apiVersion: constants.apiVersion }, content: response }
          resolve(data)
        }).catch((err) => {
          err.response.json().then((error) => {
            const result = { response: error, args: args }
            reject(result)
          })
        })
      }
    })
  })
}

const optimizationMockData = {'code':0,'summary':{'cost':20572,'unassigned':0,'delivery':[6],'amount':[6],'pickup':[0],'service':1800,'duration':20572,'waiting_time':0,'distance':312835,'computing_times':{'loading':117,'solving':1,'routing':72}},'unassigned':[],'routes':[{'vehicle':1,'cost':7716,'delivery':[3],'amount':[3],'pickup':[0],'service':900,'duration':7716,'waiting_time':0,'distance':92013,'steps':[{'type':'start','location':[2.35044,48.71764],'load':[3],'arrival':29676,'duration':0,'distance':0},{'type':'job','location':[1.98465,48.70329],'id':1,'service':300,'waiting_time':0,'job':1,'load':[2],'arrival':32400,'duration':2724,'distance':31759},{'type':'job','location':[2.03655,48.61128],'id':2,'service':300,'waiting_time':0,'job':2,'load':[1],'arrival':33990,'duration':4014,'distance':47462},{'type':'job','location':[2.28325,48.5958],'id':5,'service':300,'waiting_time':0,'job':5,'load':[0],'arrival':36345,'duration':6069,'distance':71232},{'type':'end','location':[2.35044,48.71764],'load':[0],'arrival':38292,'duration':7716,'distance':92013}],'geometry':'otihHanjMr@rCXpAbAx@j@pDJ\\PVt@x@XHNH_@lCI`C?fAz@zWBtEAbBCjBQvE[|Dw@`IsAzL]tEE`B?vBRfGAz@E|@Gj@G\\IPKJEJEXBXHRBr@EzA?zBF~BBjCBfU?xB@dCBxLBlAHz@VdB`@~AlDbKZdAR`ANpAFtA@dCIvC@|@JlAlB|NF~BCx@QXK`@EZ?^BZHZLVPRTHZ?XMRSLYF]@a@Zq@f@o@`@_@jAoA`@SfCi@dBYh@?~@Ph@Xz@`AP^R`A?JIp@Kd@gAxBWb@q@x@a@n@u@|A]hAKXeApBGNKb@Cj@Bn@DZLb@Fx@?jAQ~D]lG_Cx]KxAeAnOGdAcB`WKxAIhAm@`JgDdh@Kp@_AtMoA`OgAdKuAfK_BxKMlA_BbKuBfK{CjMuIx[eBlGuBhHy@lC]xAYxAqAfGg@fCQp@c@vAuA|Ec@bB{@xCmC~H{BfHkAjEa@~Ae@xBUpBM|AMtAQxCAn@?rFTvEVlCXpB\\dBp@zC|@~CjFzOpBpGvAdFl@dCx@nDrAjIh@dE`@hD\\rE@RJ~@H~ANjDDvB@HBjABbEBbDFnANdAPx@|@tCHn@J~@FxACzDQnRQbJIdCObCYbEMjA}DpPWdAwB`KI^W~AQvAMhBGhC_@fYQbDKz@WlBc@bBaArCCHwA`FwAjE{EzK}FvMq@vBi@vBw@bFY~As@hCcCbGmAjDk@jC]pB{@zEa@~B[|BIjB@`CFtABv@LvFJtF@ZHfGFjBFdA^lERlCFfBAdBEl@EvAKdASl@s@hAYlAOZSx@I^AXKl@c@zC[jBe@bBQv@u@`FIf@l@V\\Nd@NLJFRDDL?f@V`DdE`@d@TZ~AnBpCvCfBhBhAp@hEjEhAlAjBdB|A`Bl@z@x@r@bAlArM|MlGrGdChCvDzDbNfNRRNZl@j@f@d@vB~BLLLNLHj@t@`@f@z@n@zD`Et\\~\\|BfCr@~@Rd@Rj@Hb@LdA@t@?lAKtAIh@_@hAMZq@x@y@d@qAf@sCf@[XKPKh@APDr@Rn@f@|@L`@Bd@?PEb@w@rEKf@]v@gI~OI^?n@F`@Tf@`@f@r@~@nAhBzC`E~@lALN|AtBV\\LNl@v@FJTXZ`@TZlA|AvDdFNt@Hp@Hd@NfAr@lNf@hI@FRtDZtE@ZLjBZpG@RDb@B^L`Cz@vOTtE@z@Bz@?x@@fAAnAAhBBz@F~@\\hEB~@?x@Ar@OdBWfBIp@Q|CCTu@tDUpAeBxIi@jGg@lGM`AKh@mBrHa@|BGj@Eh@?bADdAPzBB|@AlAIbAYpCXFzEbA^Jj@NVTJRJr@?vAMbK@nCAd@Eh@CJIBAH@HFDB`@Pz@`@~GxAh[?`E@`EN`MAxC?\\?dAJpAX~CBN@d@@HDdAFpAJnB?j@D|@DTHXLV^p@JVDZ^hF|@vHH~AIlKCp@OvAYlBGp@IjGGzOBx@fApIBLBf@LxBNrD@hBEtASzCWpFGzHJxEAt@SnEAlCCf@UjAiAzDSf@]xAi@lCKb@Wj@s@p@Y`@IPKr@AZ?l@Cx@a@`FGz@c@`DSxAGzBEvACRIAEDCJy@AO?a@@g@?{@C_@E_A_@eDt@k@JMJGHFTHPrAhBZh@LXJf@Jx@HfAX`HJl@nAjFNj@dAvDX|@^`AvB|E`AbCZ|@Lt@LtAB|@A`AUfGCbB?~A\\zI@vB\\`QHvGRfD\\dCDbAGtE@dFCx@I^St@i@vAKt@GbAGvB[rOGfAId@oGtj@u@dGc@jCgFdXE`@RhWDxDB|EBVR~@@`@?NLPJVZxAv@hCPb@pAbCR^j@bAXXdA`@VRb@^HFZh@`ArCZf@b@^rA~@H[LwATFUGMvAIZNPZ^fAlBr@tA^v@lA`Cz@vAj@d@~D~BhFzCpF`DbAl@pAt@xPxJ|BlAzPbI~An@^{@Vu@hBmI`AoDHQBGj@qAlBcD|AeD|@{Bp@cBVe@PMRGdAQh@AlC@nEKvACnAc@fCcAjB}@t@SlBq@l@Cb@BlAb@|@XZ?\\KfAaArAwAzAiChF_Kv@gApA{@lFgDy@gCe@cB_@_BUsAf@c@vDeEZYn@[f@CP?f@J|QjGzB^nGn@bFf@ZTFPNJPEHQ\\I`AFr@BbBFt@HfATrL~Cj@LrBJrGKpXi@bCKtE[fF_@dDBpi@|@z@Fx@Lz@PlVtGp@HfA?`@Gd@Kh@Sd@YfDuCrBy@bEwAn@_@j@e@d@k@b@q@Xo@Z}@Ty@lIgb@T{@Xu@t@oA^a@`Ao@f@Qf@KvIWxEO`BOxBe@xImCl@Mf@GxAEpCBL?f@@TD|ClAnBdAvAnAbAjA~BvCVb@PRNLp@NVAZGNILITYRg@`@oANa@NOj@[hB{AfAaAXGRu@HQVc@`@k@\\]b@Yl@a@bBgAY}EGg@i@eCkA_ESmAEe@FK@GAQIIKAGYQuAcB{YEs@Cc@EmAw@sKImELw^JwCJ_C@uAH_ABULwAd@eJHy@JwBC{@CMIeCE{@COCaAF_A[w@M{@ImC?gAF_CPuBNa@BCDSCODw@l@yDHq@F}@DuAGoFDaBFk@RgARk@xBaFRSR?BCFO@KEYF]r@aCNu@NeA^aCrGjBpBhAx@l@t@x@f@d@r@v@~@pAxA~BzApCj@zA`AxCn@hChBjIn@rDTdANCxAk@nBcA~CaA`Aq@nCoChA_At@_@rCq@LENOPSZu@^g@fAw@v@_@n@]FId@u@{@gCaG_RyAeExAdE`G~Qz@fCe@t@GHo@\\w@^gAv@_@f@[t@QRONMDsCp@u@^iA~@oCnCaAp@_D`AoBbAyAj@kAcFIQiBkIo@iCaAyCk@{A_@iAu@}AyA}BXy@`CoI~@qEdA_DzB}Ir@kDxBmIx@iCVe@HQvL{TbB}DhE_Ip@}@~AuAlAsALO|B}A`DoBn@e@vAcAfB{A|H_HVWzM{NROzAiBjCmCbDkDZ_@~A_BPQj@g@rBmBLKRU|EoEtAgBtAiBtAgB`AwAXY`AeAfAaArA{AJJJ@HADK@IEOv@c@`@M~EwA@CBMHcBTeCHkA@kAC{@E}@q@aEe@gBO}@GcCKaGDk@DKf@u@p@s@j@StASz@GrDYhBSb@Mb@Wb@]x@sA`CgIzA}Ex@sBv@wB~DoOn@aCp@oBdEaKZ_ATgAlBuI~AwEjBeEx@kCvAmGpGkPbDoGvEaItAaC~AuE^s@`@o@tAcBT_@Pa@z@mCfAeCDM?WGeD?_AFs@`B\\?w@DqAN{DBy@?qBQyBi@}CI{@@mABeADe@RaBnAgEv@wDNmATqDByACkBIcCc@aHCqA@{JEwBiDui@k@cH[kESuBQwCQwBqAyc@Q{]G{A?i@Cs@@_@FMBQ@SGYGyAAaCJsDCcAMoAe@eF[gCYkBWqAuAiG}@uEQo@Si@y@eBcAwBkB{DgBuDg@yAOs@WmBIoAWmHC}@{@uW_Bye@]sJC[GaCCmBB{D?iGCwAOaDk@mFyBuNKiABg@Ha@RUFQDS?WIe@IQMMKa@[s@kAiDc@gB]cBYkBUkBSsCKmDGmFGwDIgAg@oFg@qCqAcFs@yB}AuFUmAEo@EcDQmBBg@HMBUAOCMKKMAMHc@ASKOMU]IYeAiEUqAM_@i@mGYcEa@mEa@cEy@mFa@qBgAqE}DeNmFkQiAwEEs@DU@]E]IUMOMEW?OGKSWsAUw@Uu@Yk@uGsTmAaEcAoE_@sB]gCOcBM{ASeFi@aXHmBJ{DFs@PiANIJSBUAWESKMSeEKyBIy@My@]}Ai@eC]uAi@{B_AeEg@qDu@kGM{@[qAUq@[m@e@m@OQYS]OeAWaE?[I_Aa@s@yAE[GYMUGo@B{@v@}KXeEFcAzAgTPaBL_A`@qBNi@Xq@Ze@Z?ZKTYPa@Di@?m@Gg@Jm@HOLGTCl@?RA|@O?OE]DK@}HBSv@oCbAuD?g@G]k@y@g@q@MQ}@kAGe@AW?w@Dm@^}AZqBHy@D{ADSP_@j@u@`BsBT]bAoA\\k@PNjAqBf@{@L[D[A[W_CUgAKuAAe@@uAEuAMcAQ_A@]FWFGZYjAsAXm@La@`BoD~@uBRk@uDwDK[CYBWCUKMEAc@k@Qc@I]w@sESsBKuC[mEAi@HeIJqF?qABoAFoABeADUF?HM?MEKMAYgCGcCEsDKgB{@wIQoAs@wDg@_Cm@wBOgAEsACwDEcAKs@HMAOEIIAEiBDhBIJALDJLBJr@DbABvDDrANfAl@vBf@~Br@vDPnAz@vIJfBDrDFbCXfCGH?RHJETCdAGnACnA?pAKpFIdI@h@ZlEJtCRrBv@rEH\\Pb@Nr@EJCHBZFLFBj@f@tDvDSj@_AtBaBnDM`@Yl@kArA[XGFGVA\\P~@LbADtAAtA@d@JtATfAV~B@ZEZMZg@z@kApBQOe@e@kAkA_CyAm@u@s@iAi@m@e@_@SIw@OiAAkAJE?]D]BiDReGtAoARgAEcCYe@AkCToCZcDx@k@VeDvAOPM@YB_@HuAL}AKiBKkDWs@E_ASw@YeBcA{@c@iAEQ?uAYsG{AiCaADrA?|@KxAY|Be@|BK^oDoBwIwEoBeAeJ}EaT_LaDcBwDkBeBu@oD}@{Bg@aB_@yCm@SEm@MyMsC_AYy@]eHoDgEyB[QwEeCcCoAe@SKEeA[kAa@gJuCaJiCsAa@_Cq@y@UUG{JqCOEc@MwDeAkBi@eEkA_HmBs@U{C{@wBm@{@UqGkB_@IeF}A[IIC}DiAeJkCyOkEcBg@aL_D_AWiA[qJoCoJoCuCw@uCy@cCs@sDgA{IaCgCw@qCw@SG_I{B}JuCoCs@mIaCqIcC}WuHyLkDmJkCQCmASeBQ_CKs@?mPf@kSp@m@B_HVI@[@uENS@}Sv@kCC{D]eB]yA_@wCiAyBmAcFkDG[sAwAyAeBud@qm@oDsEsAyA[[kBsAWOSGqBc@^mAd@kADMbFuJXm@Rm@XkAVaBLkAh@uEXcEFi@h@}CLqAn@qFd@qEFs@Ck@Dq@RSLYF]@a@A_@G]KYQUSKUEWm@[uBmB}NKmAA}@HwCAeCGuAOqASaA[eAmDcKa@_BWeBI{@CmACyLAeC?yBCgUCkCG_C?{BNqAF[JWLKDKD_@AOKYEu@@kB@{@SgG?wBDaB\\uErA{Lv@aIZ}DPwEBkB@cBCuE{@{W?gAHaC^mCOIYIu@y@QWK]k@qDcAy@YqAs@sC'},{'vehicle':2,'cost':12856,'delivery':[3],'amount':[3],'pickup':[0],'service':900,'duration':12856,'waiting_time':0,'distance':220822,'steps':[{'type':'start','location':[2.35044,48.71764],'load':[3],'arrival':28800,'duration':0,'distance':0},{'type':'job','location':[2.89357,48.90736],'id':6,'service':300,'waiting_time':0,'job':6,'load':[2],'arrival':31515,'duration':2715,'distance':58655},{'type':'job','location':[2.39719,49.07611],'id':3,'service':300,'waiting_time':0,'job':3,'load':[1],'arrival':34753,'duration':5653,'distance':117868},{'type':'job','location':[2.41808,49.22619],'id':4,'service':300,'waiting_time':0,'job':4,'load':[0],'arrival':37366,'duration':7966,'distance':144404},{'type':'end','location':[2.35044,48.71764],'load':[0],'arrival':42556,'duration':12856,'distance':220822}],'geometry':'otihHanjMr@rCXpAbAx@j@pDJ\\PVt@x@XHNHh@{Bd@qAf@aAb@o@dAgAh@a@lAi@rA[r@E^?d@Bb@F|HjBxBb@`BH`ACfDSn@?f@FPHFLPPNDRCRSHYB_@E_@Lo@To@DWBm@@C?{@As@@S?g@CuFBu@JIBE@SAIIMEAKBCB}CmDoCwCsCcD{@}@{AeBmBoBBUCSKSIESBGDsDaEmAuAsC}CsC}CkBqBAo@?w@CUGOMOMAEkHAwC?MC_EAqECsECqEC{DA[Ai@}JTyCJ[Dg@@O@gCDwHXsJRcP^cAHuBZ{@TiF~AiA^aBh@aR~FsUnHeAJwAXcEhAuCp@_LnDgBv@gBl@eDzAiA`@uAT_CPq@@aCIiBQqAWkA_@iBs@uCaB_Au@iDeD}I{I}@s@mCcBeBu@iCo@aBY}CGuEJMIOCg@Se@e@kD{FSe@Ok@Q{ACk@@qCTmICm@d@yL@sEEqAQiCWqBQkAk@_COYc@uA}@kCg@iAi@_Ae@w@eAoAs@u@gAy@yAq@eA_@iAW{@I{BG}@D_Cf@w@\\kBhA_f@tXaBdA}@\\s@NmBDw@E{@Qc@OqAw@g@e@k@u@i@_Aa@}@a@oA[uAQiAS}BqCuc@iBkZeA}Ly@mHcAmGeAeF{AqIgAyHq@qF[qEOwFCcIA_GMaCQcC}@}EiA_EqFqQ_AmEa@uDKoCCmBBmBxAuc@ZoL@{CQwQKoFSsOGyBMoJQaDa@yC[wAm@yBu@kBo@eAiA{AwAoAu@e@_Aa@c@OiAUmAK_BAkC^uHlAgGv@wKbAkHDqBCe@CqEW{Eq@qI_BSCuA[{HmC{FmCqBcAy@o@]]yE{CmByAgFwEuBeBoEgDqA{@_CkAoDqAgBi@eDu@_DYaDK{@EcJQaBCsGO_CGy@CmADyC?i@BsFb@_ACoAQ}Am@w@k@s@s@w@}@kA{Ba@iAg@wBgAwGa@qBa@wAyC}GcA}BuCsFSSsDwI{CaHuAoCaA}AqAoAwAgAmAg@uGgAaBa@sAk@mA_AiAmAo@mAy@aBg@sAa@oA]qAcA_F}@mEe@kCi@mDq@{Fq@sHuB}XaAcMaEij@u@kMOuFOgJ?iFFaDDaCH{A^{FDc@d@qDn@kErAwHl@mCp@mDlAkH^aCh@mEf@iE^wDXiDnAyPr@gQx@iWP}FJ_FBgDG_EKsCQgCSkBYyB_@qBk@gCo@yBu@sBs@aBcAmByBkDo@y@qBqCqB{CaDkFgE}Hy@_BwBkEqEmKuBuFe@mAeBiFkBsG{@kDY{A[yBWsCSmDEcC?uCFaFRwJ^uRxDwmBvAct@b@kU`@oQXwHf@uJ`@{Fv@uJr@oHfGoi@fC_UzAiOtA_PxA{WVgHb@wQLaLBqFA{LAuDO_MWqKq@mSIeCcAaZi@}N]}IwBom@aAsWa@iNYaNIcGGyGAyBAoEAiHDyHZqTrFiaC|CqqAlB_y@p@kYtBy~@PsPD{NCyISoOk@}VoBam@kGumBuC}|@gGokBuAi`@]mHmA{Ps@yIk@cGm@mFkA}IoBoMmAcHm@cCsBeKuA{FqBeIyBaI_CuHiFeOwBuF{BkFiGuM{C_GuDoGmDyFwAyBuDkF}EmGuAcBiH{HeGcG}EsF}DaE_BkBMMwMsI_C}A_NkL}GuGoAoAqCaDuDiE}AoBuC{DyDqFsD}FkCuE{BcEkCmF{DqIeCcGiDcJ}CeJiCyIqBwHaCsJcAmES{@YoAuD{Pe@}BsAcGiFwUoB}H}BmI}AcFuC_JiCoHA[gC{GeH_Qq@kBi@gBo@kCyB{Lm@qCi@iBk@wAg@aAmAgB{A}A}AeAy@_@mBe@i@GyBGg[\\yDFqD^kDl@kAZwC|@cDvAiCxA{DhCwIlGoYbSMCkEjCuAt@gAZaB`@oFbAOAQIKQMIKGQUm@cBk@{BoGwVnGvVj@zBVtB@ZAXAVBXHR?fA{@|A{ArBaC|BqLpIyDfCkFzCwBbAoCr@sBZcFd@]JyC~AWBQEQOUCSHQRK^C`@BTDRR\\JFXb@FVr@hHRfCBjAAnAM|D}@zVHRIvBCnC?hBDpER`Fl@~HrBdYTfEFzBBpC?tCC`BQvFY`EWrCWfBw@~Ey@tDe@dBe@xA[~@}A|D}A~Cg@z@_BbCaApAkClCq@l@wAdAqBpAyBdA}@ZcAZcCh@eCZy@FqDBaEUmu@oGuAMcHm@wGg@_Dc@kBc@oCcAqDoBiBaBsD}DaCqDeAoBc@aAcCyFw@yA{A}BsAuAiCeByA_AuI}Ek@e@GMG]KMKGMAKBKHSEaCgAgAa@kAa@cAYoB[{CWmG[q@W{B_@{Bo@y@Eq@@cAHa@?IUKOOIOCOBWTKTEX?ZDZJVFx@MfDe@nIyAjVe@lHq@vMU~DgCfr@{@rVQfIMj^d@fXVdKp@r]TtRD`Cj@|Yf@`VJ|EXvLb@vQz@xc@J|CRlDr@~FdLxz@bIll@|AlLL`ADf@dIhl@n@hFvIfo@TxBP`CPzEh@r^BzAnFzyCThL@b@JhGXvN@d@@l@~@ri@BlAHzDF~D@|FCtCKzC[vF}@fJQ~AkBlQeEza@MlAWvBQlCMpCErBAtC@pBHbCJzBPxBXdC\\`C\\xBj@bCr@fC~@hCZt@tGrMdCnG~AzF`@jBt@lE^lCXxCPnCPfG`Bdj@^~JnArd@f@pOf@vPf@dQh@bRJhEh@nR`@bN|@h[V`KAhBIrCU`BUp@g@x@k@d@q@Z{DFQPs[_AoIMcA@mBDyAHiD^oCd@qBh@eA^}@ZyB`AyAv@}A~@uCtBw@l@kAhAyA|AmBxB{AtBaAxAsBlDu@xAiB|DyB~Fu@rBgVft@uUds@eAvCyUvs@wKl\\]hAgGtQ_BtFQp@[jBSvBEj@AbBBt@Dx@Hv@N|@Nv@j@`BZp@z@tAbBlB|B~BtAdBx@pAzArCh@vAXd@tFxPdF`PhBnGdEhOjHzZfIt^jNlm@dHb[xDfPhB~I|@xEf@lCrD`VnAhJz@zHJhALfCBrAAtAMhDSrB]nB_@`Bc@rAo@|Ae@|@m@z@kApAaAz@kG~D{ApAuAxAcAnAaAtAeAhBcArB_AvBaDdI_B~EaAhDaBlGqA|FeCvLcAhFg@fCsClNqFvXYrAo@vDaF|UqB~KiCpOaElSgAtDe@rBEXsA|GaAzGgAvFKVsDlRs@dE]dCi@jE_@jE[pEMjCMrE_Anb@QbJYhB[jAQ`@cAfB]j@k@j@SJc@Fg@Ck@SoCuBW?sCcC{BgBgDcCoDwCs@o@eXkVyWeU_B{Ae@]eFiEeA_AoHsG{JqIkJcI{EoEeFgG[_@_HeImAoA}@y@gBuAkBkAyAs@cC}@{IgC{C_AgKsCyAa@cMkDcJkCuGkBeCgAs`@mT}A}@{F_DyEsDuBwAaA_@m@Ms@Cg@@kANiAVqARo@@m@C{AUSK][Mm@GQS]SUe@Sc@C[FULa@d@Q`@Kb@Gb@Aj@Dr@AhAEf@yBbPgAlGgA|EaBxEoB|EkBxDkBbDqAjBc@p@kA|AmD|Dg_@l\\_GpF}BdCuBtCgBnCwAbCeBdDsA`DqAfDuAhEu@jCs@rCo@vCc@xBy@~Ek@nEOzAY`DOxB]zGKxDG~DAdD@lBHnFJ`CRzE`@tFtBjSfCtU^`E`@|FNdCLxDHpF@bB?rDCtCGdBMbEUbESnC{@jIgAzGuAhHkArEwAzEs@pB_B|DgB~DiExIoElIuCbF{H~LcCnDyC~DoM|P}Z|a@kD`FkC`FkAdCqBnFaAbDgAjE}AfIyCfQg@|Cg@jD?D}AlMg@dF_AvK{@lL]pFk@rLs@~SKbFChC?REzCAxCA|AId@GTMV_@\\m@N]?q@OcAc@e@]OOM[C]?e@@U?c@Ia@IMQQKSOe@?o@B{@NaB?{AWHKLo@bAIFG?IGuBkEqBoBEI]{CEQm@eASc@Wq@[i@s@e@eFUwCMc@Oa@WOOQa@k@sBEOa@eAc@gAaDeGy@yAa@_A`@~@x@xA`DdGb@fA`@dADNj@rBP`@NN`@Vb@NvCLdFTr@d@Zh@Vp@LWd@uA\\mAn@gKRs@LQJG?QAuCDsBJoCfDki@D}A?u@GoBGw@YoFAmABsAJsAPiAnAiFb@t@Bx@WjCKNOPa@D{RmJ{IuEoKeFmJoFSjAcG{CeIqF}AcAs@g@eBoAaAi@{Aq@eBm@yBm@q@OmAMi@CsA@oBNyHbBiBTaADkACgBQ}Aa@mB{@oCaBiAi@GC_CyBeCmBy@w@[g@Um@Mm@Iu@OoEE[Uo@KSY[OKe@OQAe@Bi@P_@Vc@^a@l@e@|@uIfS{CzHaA|BkBlEuAbDs@nBk@|Aa@xAaA~Do@xD_@fC]lDSxCuAzf@SzDCd@ItAQfBw@vFa@~ByDjP_BtEaAbBiAxAmAfAoBjAwAd@cBPs@@eACq@Iu@MaAY}@a@gAy@q@s@_DsDoBoCa@w@KYGWE]KOMICAUWK_@s@}Ii@{DWaA_@cBe@oBSk@c@_AqAwB{C{DuLoMkBgBeAy@wAy@_Bi@MEq@Kk@?mAFaBTgA\\y@^]NsCpAqB`AkC`BaBtAw@`AsAtB}@hBo@|AmBjF{BjFeBvCqBdCiAdAiBhAmCz@kGhBsFbCWNg@\\{@v@cA|@e@j@kBzCwBtEy@bCu@pC{EbXwCtOcDfQgAdGG\\cDrQ[`C]rCQrAU|@GDGJELCP?PDNFNB`ACnBKvDSvFI|COLI@kEiE{FcF_A_Au@cAy@mAo@iA{BoEq@_BiA{C@WWGk@O{Cy@iMgDi@Yy@y@eLkL{BaCWQQKcHyDySyLaEyBk@]aQuJwI{EeB{@eBs@MWEa@UNa@?k@Us@g@YWCKIQKEQBKFABi@N_F[gM_@OEQOCMKQIEQ@GBILCH_@Rib@sAy@SCIKGG@IJQD{@DaUq@{CK_@Ka@KKIIWMKWEMFMRCJOD_@AuEy@yFsBeFsBkFoDuCcBi@E_@Fg@X{O|MgYvVm@l@w@rAqF~LeA`By@p@ag@zZoBnASJkC`By@d@uBtA{@j@MH[Nc@TKJIPEL@`@RdAb@dBFn@ANELOPM@UOOe@GgAAm@CuHCcAUqDoAsQGo@[sDg@kGWiCi@iDuB{L_@cCa@mDO}AASIqAGaAO_EO{HMeE]uE[_DQqAo@yD{Hyb@G]WgA_AsDw@_Ci@wAcA{Bu@sAs@mAeA{AqA{AcAgAgAgAs@u@cAaAuA_BkAcBs@sAu@aBaAqCuBuHo@gCI_@aAeEKe@g@aCI][sA{@_DIi@I`@Ep@[bFUKeBGY}AQwAQiD@m@]JgDpBi@VgA^gBh@qDpA}@Pg@BkA?eCPqD|@}B`@cDTGwAGsACeB_AHe@BKGyC_GaB}CSo@Rn@`B|CxC~FJFd@C~@IBdBFrAFvAbDU|Ba@pD}@dCQjA?f@C|@QpDqAfBi@fA_@h@WfDqB\\Kt@Ov@?\\Dj@R`@T@BLFHGFQVWV_@f@cALc@@_@KoB?m@@WDI?Kx@u@LSFKXs@L]\\aAn@sBNo@V_BHu@Dy@F_@FUJc@vAkFl@}ArEyMz@qCp@oCLo@F_AA{@Ee@Ig@Oe@Yu@{AeDe@aBMs@Iq@C{@@m@Fi@Lq@~@wDlB}HLmAHeBBeDGuGIeBk@yGEgBDmBDs@NsA|AyKNu@La@R]TSNIL]B]CSEQEk@FiAzAsHjGy[|Fm[`@uBdFsXR{@LWNKh@QVEVSTe@H_@@m@Ik@M[KQMc@C]@]Hm@t@wDz@kDhEsOr@sBd@_AXe@\\y@HSL]r@eCx@{BXaAjDoP`@eBRc@NQNMdAo@^]`@q@Xy@Nw@lA}Jl@iGBQRk@FCJSB@d@N|BbA|HnDd@RJ@|BSVKLQ`BeDLOVGdBLTBVVBYtA{EzGiUFIHIdDiBFKVgADITMRGTD|E`C?\\DTNLP@JIHQ@_@ESfDkD~GkHrYuZPQTWl{@a~@n[i\\nBsBdG{GXWTER@NFRCHGJODS@]G_@li@ek@pRiSlGaHJKp@i@x@q@lAaAZm@PuA@aC@OJYVQ`Aa@`AEdAAb@StEkB`@O`@OlI{C~Y{KfNsEvSeHfGuBjTqHv@Yt@YtDqAf@QvDqAp@UdC_ArCaARMDDF@JK`@Kj@BzAFTCf@Bx@BP@|ELT@fENnADp@Bj@BH?hDL|@DdCL`I\\f@B`EPrBFnCJHF~k@pBzj@vBlSt@lCRhH\\^TDLPRHBRAHGLWDa@AQEQIMS{@JsAN{AFaBFeCVcILaBBg@RiBb@kCvAoHl@qC|@oEPq@dAuDNy@PeFFk@rAQ~@Mp@Y`D_CdBqAd@QDCrBo@fAY`BU~E}@`@MROHND@LAHO@SAK~DqCh@]BCd@[jKmHpEeDp@Qz@GNAn@UF@JALGFMDQ@SASvB{@^OxAk@hB_@tCa@LUzDKti@uBt[iAfPs@~CIvGA|EJtGb@nAP~E|@zDlAdB`@rDhA|NzGnDlA~EtAtFnAdIhA~K|AbGjAhFrAnBt@|ElBdBz@vMjHzCpApIzCjIbCtPrEzIvB|Ct@lIdCnJhDpEjBzB|@f@RxKpEnKhEhFtBlP|GjDtAlCdAnBx@hAb@nBx@hAd@nBv@nHxCfHxCvKhEvT`JvAj@PH`GfC`CnAjEbCvGpEnCzBjCzB~D|DpBtBxFnGfXtZfCrClB|BtZl]bFpGz@jAv@zATj@`@`AfArDr@|Bn@pBXt@^x@l@bAh@p@zDbErCfCdBdBvCtDnAnBdS`]vCpE`HpL~PjZlIpNxAjCxAtCtHxMnAfCnArC^dApBrF~@`C~AfDbA~Ab@l@d@j@jAnApAfA|AdAfBx@l@TzA\\rH`AtKfAxCRvHPhCAl@D~GWnGYhFi@lCa@|EaA~EoA|GqB`NuEzYkKbA[lJaDbHgB~FmAxFq@j@IpBUtPoA^AtMcAvG]xEItDFlAFrEb@lAPzEbAhDdAbNrE~C`AhFrAtB`@lHtA`Cd@pFnAnCx@vCjAnClAhDlBjBlAp@d@fNbKdC~A`DhApCr@dMlDrBp@~@^pCrAjFtBr@X~Cn@dDTfABhAE`AIvAYvBu@x@[rC}A`L{HbBaAvAq@lAc@|Aa@zDs@`Da@vD_AV@tBc@n@Ep@A|@@v@J~@Vh@TfAn@x@n@t@z@nAdBZf@~@zBb@rAZvAZfA^|@Zb@\\Vr@RX@XG\\O`@]\\e@Zw@vAqEr@wBpCoH^}@hAoCt@oA\\_@~@u@dGiDfIsEzA}@tHgEjJoEjBmAfBgB`EyE~AyApAo@rAa@`BQ|@BfB^hDfAvCx@r@Lr@LrAJz@C|@I~A]vKeEzEmAhAg@t@k@r@s@|GeJvCqDz@}@nAcAz@m@rAq@dBo@lCq@nNoDxGoB~@Y`EgAzAYdEgAlCo@rDcA~Bq@tL}BlG{AhAc@`BWhDWpA@tDWpDi@zCo@bEeAbASxEq@lAKpA?bAHdA\\p@XjE~BvBv@fCfAfDhBjAjAjAvAp@rAf@nAf@nBXtAN`Bn@lKzAjS`@rDl@`GPJz@|K`AnMrBtXv@hIj@fFh@dDrA|Hn@bD~@nDh@hBf@xAnBjDhApArAdAzAj@pJhBlAh@xA`AhApAv@pAvAlCvFdN?Zx@~B~@lClD`Jh@fBbGbSjAvCv@vAv@dAp@n@|@n@x@b@rAZvAH~@CjDe@dAAh@EpCEnCF~BDbHP`BBzIPz@BxBNpBRv@Dh@JlCh@`Bf@|Aj@pBz@pBhAfH~EnBlBpExDlBxAdFfDtGnDlD|AdC`ApDjAdEfAxFfA~El@vEVf@BlBBfF?lBETKvHg@rO_CxCe@jAOhAArALx@P`Bl@h@^bBvAh@l@lApBh@lAx@hCVfARhANrAJjAF`BPnMXhVTxQA~BEfCUpG}Ahe@ApB@fCLtC^nDx@zD`GxRz@~Cp@~CXnCPtC@p@J`RLhEV|El@hFjA`I~CtPdAnGx@hH`AvL|ArV|Cdf@HtAd@hDZzA`@lAb@`Al@`Al@r@f@f@jAx@t@V|@Tv@Hx@@x@It@O~@]fBeAnZsQvMsHv@[v@Up@KjAIhDJZR|@Zr@^d@Z~@~@pCfDf@|@Tf@bEhMJTVx@Px@RfBJnDC|COdHw@xQQpF?tFHhIKZIb@M\\YN]CSSw@gAQa@G]A]@Y^o@lCMhBC`@AlBI|CEzEMrBHjEl@fCr@nB~@rAx@`Ax@jJfJjCfCv@lAbAn@fB|@b@Ll@DjA\\fB`@rANvBHxBA`AGrBWrJwCjXwIvC_A~L{DrHaCxJ{CfFcB`Bi@hA_@dHuBrB[dAGbPa@pQY~EKN?T?~J]rA?BAx@Ar@CPCbCGnCEnCG~BG`CGhAC|ACbCGtAEXBb@?tCCtCID`HBvE?|ABdD?x@Av@BhC@lAHzKCfB@x@@lCBvBD|FAX@rC@pCBxCBvFB|DAn@BzBCBEN?RBFDD@lDBhCBr@@r@?z@ABCl@EVm@p@QJMCSBSRK\\WRmATgDRaABaBIyBc@}HkBc@Ge@C_@?s@DsAZmAh@i@`@eAfAc@n@g@`Ae@pAi@zBOIYIu@y@QWK]k@qDcAy@YqAs@sC'}]}


export { Directions }
export { Geocode }
export { Pois }
export { PlacesSearch }
export { ReverseGeocode }
export { Isochrones }
export { Optimization }

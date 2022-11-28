import {GeoLookup} from 'mastoservers/types/common'

let lookupCache: GeoLookup | undefined

const userIntl = Intl.DateTimeFormat().resolvedOptions()
const userTz = userIntl.timeZone
const userTzRegion = userTz.split('/')[0]
// const userLocale = userIntl.locale.split('-')[0]

export const sortZones = (lookup: GeoLookup) => {
  return Object.keys(lookup).sort((a, b) => {
    const aNearUser = a.startsWith(userTzRegion)
    const bNearUser = b.startsWith(userTzRegion)

    if (aNearUser && !bNearUser) {
      return -1
    }

    if (bNearUser && !aNearUser) {
      return 1
    }

    return a.localeCompare(b)
  })
}

export const getLookup = async (useRequire = false) => {
  if (useRequire) {
    return require('../public/json/en.geo.json') as GeoLookup
  }

  if (lookupCache) {
    return lookupCache
  }

  const response = await fetch('/json/en.geo.json')
  const lookup = (await response.json()) as GeoLookup
  lookupCache = lookup
  return lookup
}

export const getUserTz = () => userTz

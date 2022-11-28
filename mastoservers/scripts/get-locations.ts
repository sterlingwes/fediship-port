import dns from 'dns'
import {writeFileSync} from 'fs'
import geoip from 'geoip-lite'
import {Server, GeoLookup} from '../types/common'
import {resolve} from 'path'
import servers from '../public/json/en.servers.json'

const dnsp = dns.promises

const loadGeo = async (server: Server) => {
  const ipInfo = await dnsp.lookup(server.domain)
  const geoInfo = geoip.lookup(ipInfo.address)
  return geoInfo
}

const geoLookupPromise = servers.reduce(async (chain, server) => {
  const acc = await chain
  const geoInfo = await loadGeo(server)
  if (!geoInfo) {
    return acc
  }

  const {timezone} = geoInfo
  if (!acc[timezone]) {
    acc[timezone] = []
  }

  acc[timezone] = acc[timezone].concat(server)
  return acc
}, Promise.resolve({}) as Promise<GeoLookup>)

geoLookupPromise.then((lookup) => {
  Object.values(lookup).forEach((servers) =>
    servers.sort((a, b) => {
      if (
        typeof b.total_users === 'number' &&
        typeof a.total_users === 'number'
      ) {
        return b.total_users - a.total_users
      }

      if (b.total_users) {
        return 1
      }

      if (a.total_users) {
        return -1
      }

      return 0
    }),
  )

  const outPath = resolve(__dirname, '../public/json/en.geo.json')
  const result = JSON.stringify(lookup)
  console.log(result)
  writeFileSync(outPath, result)
})

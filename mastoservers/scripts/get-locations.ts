import dns from 'dns'
import {writeFileSync} from 'fs'
import geoip from 'geoip-lite'
import ipCheck from 'ip-range-check'
import {Server, GeoLookup} from '../types/common'
import {resolve} from 'path'
import servers from '../public/json/en.servers.json'

const dnsp = dns.promises

// https://www.cloudflare.com/ips-v4
const cloudflareRanges = `173.245.48.0/20
103.21.244.0/22
103.22.200.0/22
103.31.4.0/22
141.101.64.0/18
108.162.192.0/18
190.93.240.0/20
188.114.96.0/20
197.234.240.0/22
198.41.128.0/17
162.158.0.0/15
104.16.0.0/13
104.24.0.0/14
172.64.0.0/13
131.0.72.0/22`.split(/\s/)

const loadGeo = async (server: Server) => {
  const ipInfo = await dnsp.lookup(server.domain)
  const geoInfo = geoip.lookup(ipInfo.address)
  return {geoInfo, ipInfo}
}

const geoLookupPromise = servers.reduce(async (chain, server) => {
  const acc = await chain
  const {geoInfo, ipInfo} = await loadGeo(server)

  const isCloudflare = ipCheck(ipInfo.address, cloudflareRanges)
  if (isCloudflare) {
    acc.Global = acc.Global ? acc.Global.concat(server) : [server]
    return acc
  }

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
  writeFileSync(outPath, result)
})

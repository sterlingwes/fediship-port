import {useState} from 'react'
import Link from 'next/link'
import {GeoLookup} from '../types/common'
import styles from '../styles/Home.module.css'
import {Container} from '../components/container'
import {getLookup, getUserTz, sortZones} from '../lib/state'

export default function Home({
  serverLookup,
  sortOrder,
}: {
  serverLookup: GeoLookup
  sortOrder: string[]
}) {
  return (
    <Container>
      <p className={styles.description}>Choose your closest region or city:</p>

      <div className={styles.grid}>
        {serverLookup &&
          sortOrder.map((timezone) => (
            <Link
              href={`/zone/${timezone.replace('/', '-')}`}
              key={timezone}
              className={
                timezone === getUserTz()
                  ? `${styles.card} ${styles.cardHighlight}`
                  : styles.card
              }>
              <h2>
                {timezone}
                {timezone === 'Global' ? '*' : ''}
              </h2>
              <p>{serverLookup[timezone].length} servers</p>
            </Link>
          ))}
      </div>

      <div
        className={styles.description}
        style={{textAlign: 'left', maxWidth: 800}}>
        <p>
          * Servers classified under "Global" may use edge caching which makes
          it hard to determine the geographical location of the server(s).
          Please refer to the Region listed in the server profile for a better
          guide.
        </p>

        <h3>Why this exists</h3>
        <p>
          If you're interacting with a site or service as request-heavy as
          Mastodon you want those requests to travel the shortest distance as
          possible. The speed of a site (or its requests) is roughly the speed
          that the server responds to you plus its physical distance from you.
        </p>
        <p>
          Choosing a server to join that's closer to you is an important
          consideration (alongside the kind of community you're joining), and it
          can be hard to determine with currently available resources, so that's
          what this site is for.
        </p>
        <p>
          Ping me at{' '}
          <a href="https://swj.io/@wes" className={styles.accentText}>
            @wes@swj.io
          </a>{' '}
          if you have feedback!
        </p>
      </div>
    </Container>
  )
}

export async function getStaticProps() {
  const serverLookup = await getLookup(true)
  const sortOrder = sortZones(serverLookup)

  return {props: {serverLookup, sortOrder}}
}

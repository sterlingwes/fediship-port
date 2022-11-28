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
              <h2>{timezone}</h2>
              <p>{serverLookup[timezone].length} servers</p>
            </Link>
          ))}
      </div>
    </Container>
  )
}

export async function getStaticProps() {
  const serverLookup = await getLookup(true)
  const sortOrder = sortZones(serverLookup)

  return {props: {serverLookup, sortOrder}}
}

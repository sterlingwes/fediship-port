import Link from 'next/link'
import {useRouter} from 'next/router'
import {Container} from '../../../../components/container'
import styles from '../../../../styles/Home.module.css'
import {getLookup} from '../../../../lib/state'
import {useEffect, useState} from 'react'
import {Server} from '../../../../types/common'
import Image from 'next/image'

const numFormat = new Intl.NumberFormat()

export default function ServerPage({server}: {server: Server}) {
  const router = useRouter()
  const domain = router.query.server as string

  return (
    <Container>
      <h2>
        <span className={styles.accentText}>{domain}</span>
      </h2>
      <p>
        <Link href={`/zone/${router.query.id as string}`}>{'<'} Go Back</Link>
      </p>
      {server && (
        <div className={styles.detailContainer}>
          <div>
            <Image
              src={server.proxied_thumbnail}
              alt={`${server.domain} thumbnail`}
              width={450}
              height={300}
            />
            <div className={styles.grid}>
              <a
                href={`https://${server.domain}`}
                key={server.domain}
                className={styles.card}>
                <h2>Visit {server.domain}</h2>
                <p>You will leave this site in the same window</p>
              </a>
            </div>
          </div>
          <div>
            <p>{server.description}</p>
            {server.approval_required && <p>Registration Approval Required</p>}
            <p>Region: {server.region}</p>
            <p>Users: {numFormat.format(server.total_users)}</p>
            <p>Categories: {server.categories?.join(', ')}</p>
            <p>Languages: {server.languages?.join(', ')}</p>
            <p>
              Active users last week: {numFormat.format(server.last_week_users)}
            </p>
          </div>
        </div>
      )}
    </Container>
  )
}

export async function getStaticProps({
  params,
}: {
  params: {id: string; server: string}
}) {
  const lookup = await getLookup(true)
  const timezone = params.id.replace('-', '/')
  const servers = lookup[timezone] as Server[]
  const server = servers.find((s) => s.domain === params.server)

  return {props: {server}}
}

export async function getStaticPaths() {
  const lookup = await getLookup(true)

  const paths = Object.keys(lookup).reduce(
    (acc, timezone) =>
      acc.concat(
        lookup[timezone].map((server) => ({
          params: {
            id: timezone.replace('/', '-'),
            server: server.domain,
          },
        })),
      ),
    [] as Array<{params: Record<string, string>}>,
  )

  return {paths, fallback: false}
}

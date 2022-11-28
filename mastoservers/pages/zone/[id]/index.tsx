import Link from 'next/link'
import {useRouter} from 'next/router'
import {Container} from '../../../components/container'
import styles from '../../../styles/Home.module.css'
import {getLookup} from '../../../lib/state'
import {Server} from '../../../types/common'

const numFormat = new Intl.NumberFormat()

export default function ZonePage({servers}: {servers: Server[]}) {
  const router = useRouter()
  const id = router.query.id as string
  const timezone = id.replace('-', '/')

  return (
    <Container>
      <h2>
        Servers in <span className={styles.accentText}>{timezone}</span>
      </h2>
      <p>
        <Link href="/">{'<'} Go Back</Link>
      </p>
      <div className={styles.grid}>
        {servers.map((server) => (
          <Link
            href={`/zone/${id}/${server.domain}`}
            key={server.domain}
            className={styles.card}>
            <h2>{server.domain}</h2>
            <p>
              {numFormat.format(server.total_users)} users •{' '}
              {server.categories.join(', ')}
            </p>
          </Link>
        ))}
      </div>
    </Container>
  )
}

export async function getStaticProps({params}: {params: {id: string}}) {
  const lookup = await getLookup(true)
  const timezone = params.id.replace('-', '/')
  const servers = lookup[timezone] as Server[]

  return {props: {servers}}
}

export async function getStaticPaths() {
  const lookup = await getLookup(true)

  const paths = Object.keys(lookup).reduce(
    (acc, timezone) =>
      acc.concat(
        lookup[timezone].map((server) => ({
          params: {
            id: timezone.replace('/', '-'),
          },
        })),
      ),
    [] as Array<{params: Record<string, string>}>,
  )

  return {paths, fallback: false}
}

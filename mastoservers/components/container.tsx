import {ReactNode} from 'react'
import {Header} from './header'
import styles from '../styles/Home.module.css'

export const Container = ({children}: {children: ReactNode}) => (
  <div className={styles.container}>
    <Header />
    <main className={styles.main}>
      <h1 className={styles.title}>Mastodon server finder</h1>
      {children}
    </main>
  </div>
)

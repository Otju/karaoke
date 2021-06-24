import { useQuery } from 'urql'
import { useParams, useHistory } from 'react-router-dom'
import { SongQuery } from '../graphql/queries'
import { getWindowDimensions } from '../hooks/useWindowDimensions'

import Canvas from './Canvas'

interface props {
  voice: any
  tuner: any
}

const KaraokePage = ({ voice, tuner }: props) => {
  const { id } = useParams<{ id: string }>()
  const history = useHistory()

  const [result] = useQuery({
    query: SongQuery,
    variables: { id },
  })

  const { data, fetching, error } = result

  if (fetching) return <p>Loading...</p>
  if (error) return <p>Oh no... {error.message}</p>

  if (!id) {
    history.push('/')
    return <span>No song selected</span>
  }

  const { width, height } = getWindowDimensions()

  return (
    <Canvas voice={voice} tuner={tuner} songInfo={data.getSong} width={width} height={height} />
  )
}

export default KaraokePage

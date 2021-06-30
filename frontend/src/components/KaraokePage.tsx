import { useQuery } from 'urql'
import { useParams, useHistory } from 'react-router-dom'
import { SongQuery } from '../graphql/queries'
import { getWindowDimensions } from '../hooks/useWindowDimensions'
import Canvas from './Canvas'
import useMic from '../hooks/useMic'

interface props {
  deviceIds: string[]
}

const KaraokePage = ({ deviceIds }: props) => {
  const Player1 = useMic({ deviceId: deviceIds[0] })
  const Player2 = useMic({ deviceId: deviceIds[1] })
  const Player3 = useMic({ deviceId: deviceIds[2] })
  const Player4 = useMic({ deviceId: deviceIds[3] })

  const players = [Player1, Player2, Player3, Player4]

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
    <>
      <Canvas songInfo={data.getSong} width={width} height={height - 10} players={players} />
    </>
  )
}

export default KaraokePage

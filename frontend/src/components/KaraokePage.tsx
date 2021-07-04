import { useQuery } from 'urql'
import { useParams, useHistory } from 'react-router-dom'
import { SongQuery } from '../graphql/queries'
import { getWindowDimensions } from '../hooks/useWindowDimensions'
import Canvas from './Canvas'
import useMic from '../hooks/useMic'
import { Player } from '../types/types'

interface props {
  deviceIds: string[]
  audioContext: AudioContext
}

const KaraokePage = ({ deviceIds }: props) => {
  const { id } = useParams<{ id: string }>()
  const history = useHistory()

  const [result] = useQuery({
    query: SongQuery,
    variables: { id },
  })

  const { data, fetching, error } = result

  const tempo = data ? data.getSong.bpm * 60 : 130

  const Player1 = useMic({ deviceId: deviceIds[0], tempo })
  const Player2 = useMic({ deviceId: deviceIds[1], tempo })
  const Player3 = useMic({ deviceId: deviceIds[2], tempo })
  const Player4 = useMic({ deviceId: deviceIds[3], tempo })

  const players: Player[] = [Player1, Player2, Player3, Player4]

  if (fetching) return <p>Loading...</p>
  if (error) return <p>Oh no... {error.message}</p>

  if (!id) {
    history.push('/')
    return <span>No song selected</span>
  }

  const { width, height } = getWindowDimensions()

  return <Canvas songInfo={data.getSong} width={width} height={height - 10} players={players} />
}

export default KaraokePage

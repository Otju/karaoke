import { Link } from 'react-router-dom'
import { Song } from '../types/types'
import { AiFillYoutube } from 'react-icons/ai'
import { useQuery } from 'urql'

import { SongsQuery } from '../graphql/queries'

interface NoYtProps {
  size: number
}

const NoYt = ({ size }: NoYtProps) => {
  return (
    <div className="noYt tooltipContainer">
      <svg height={size} width={size}>
        <AiFillYoutube size={size} />
        <line x1="0" y1="0" x2={size} y2={size} style={{ stroke: 'rgb(0,0,0)', strokeWidth: 2 }} />
      </svg>
      <span className="tooltip">No synced YouTube video</span>
    </div>
  )
}

const SongSelect = () => {
  const [result] = useQuery({
    query: SongsQuery,
  })
  const { data, fetching, error } = result
  if (fetching) return <p>Loading...</p>
  if (error) return <p>Oh no... {error.message}</p>

  const songs = data.getSongs as Song[]

  return (
    <div className="centerX">
      <ul>
        {songs.map(({ title, artist, _id, videoId }, i) => {
          return (
            <Link to={`song/${_id}`}>
              <li key={i} className={`listElement ${videoId || 'dangerColor'}`}>
                <div className="col3">
                  {artist}: {title}
                </div>
                <div className="col3">{!videoId && <NoYt size={25} />}</div>
              </li>
            </Link>
          )
        })}
      </ul>
    </div>
  )
}

export default SongSelect

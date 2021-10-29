import { useState } from 'react'
import { FaHeart, FaPlay } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { addFavorited, checkIfFavorited, deleteFavorited } from '../utils/localStorage'

interface props {
  colorClass: string
  smallImage?: string
  artist: string
  title: string
  icon: JSX.Element
  idString: string
}

export default ({ colorClass, smallImage, artist, icon, title, idString }: props) => {
  const [isFavorited, setIsFavorited] = useState(checkIfFavorited(idString))
  const handleFavorite = () => {
    if (isFavorited) {
      deleteFavorited(idString)
      setIsFavorited(false)
    } else {
      addFavorited(idString)
      setIsFavorited(true)
    }
  }
  return (
    <li className={`songListItem ${colorClass}`}>
      <img
        src={smallImage || '/missingCover.png'}
        alt="Missing cover"
        className="coverPicture absCenterY"
        height={100}
        width={100}
      ></img>
      <div className="songInfo">
        <div className="songName">
          <p>{artist}</p>
          <p>{title}</p>
        </div>
        <div className="songInfoControls">
          <button className="songInfoButton">
            <FaHeart
              size={30}
              className="songInfoButtonIcon"
              color={isFavorited ? 'red' : 'black'}
              onClick={handleFavorite}
            />
          </button>
          <Link to={`song/${idString}`}>
            <button className="songInfoButton">
              <FaPlay size={30} className="songInfoButtonIcon" style={{ marginLeft: 4 }} />
            </button>
          </Link>
        </div>
        <div className="songIcon">{icon}</div>
      </div>
    </li>
  )
}

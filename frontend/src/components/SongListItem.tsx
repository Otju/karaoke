import { useState } from 'react'
import { ColorClass } from '../types/types'
import Modal from './Modal'
import { addOneItem, itemExists, removeOneItem } from '../utils/localStorage'
import { FaHeart, FaPlayCircle, FaRegHeart } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import useYoutube from '../hooks/useYoutube'

interface props {
  colorClass: ColorClass
  smallImage: string | undefined
  bigImage: string | undefined
  artist: string
  title: string
  icon: JSX.Element
  language: string
  genres: string[] | undefined
  year: number | undefined
  _id: number
  videoId: string | undefined
}

const SongListItem = ({
  colorClass,
  smallImage,
  artist,
  title,
  icon,
  bigImage,
  language,
  genres,
  year,
  _id,
  videoId,
}: props) => {
  const [isVisible, seIsVisible] = useState(false)
  const [isFavorited, setIsFavorited] = useState(itemExists('favoritesongs', _id))
  const setInvisible = () => {
    seIsVisible(false)
  }

  const addFavorite = () => {
    setIsFavorited(true)
    addOneItem('favoritesongs', _id)
  }

  const removeFavorite = () => {
    setIsFavorited(false)
    removeOneItem('favoritesongs', _id)
  }

  const handleFavorite = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    if (isFavorited) removeFavorite()
    else addFavorite()
  }

  const { YTPlayer } = useYoutube(videoId)

  const modalContent = (
    <div className="row relative">
      <div className="column rightMargin">
        <img src={bigImage} alt="Missing cover" height={300} width={300}></img>
        <div className="row centerX">
          <div onClick={handleFavorite} className="clickable margins">
            {isFavorited ? <FaHeart color="red" size={50} /> : <FaRegHeart size={50} />}
          </div>
          <Link to={`song/${_id}`} key={_id} className="clickable margins">
            <FaPlayCircle size={50} />
          </Link>
        </div>
      </div>
      <div style={{ marginBottom: 5 }}>{YTPlayer}</div>
      <div className="songModalInfo imageTextBackground">
        {artist}
        <p>{title}</p>
        <p>{language}</p>
        <p>{year || ''}</p>
        <p>
          {genres ? genres.map((genre, i) => (i !== genres.length - 1 ? `${genre}, ` : genre)) : ''}
        </p>
      </div>
    </div>
  )

  return (
    <>
      <li className="songListItem" onClick={() => seIsVisible(true)}>
        <img
          src={smallImage || '/missingCover.png'}
          alt="Missing cover"
          className="coverPicture absCenterY"
          height={100}
          width={100}
        ></img>
        <div className="songInfo">
          <div className={`songName ${colorClass}`}>
            <p>{artist}</p>
            <p>{title}</p>
          </div>
          <div className={`songIcon ${colorClass}`}>{icon}</div>
          <div
            className={`songIcon songInfoButton ${isFavorited || 'visibleOnSongInfoHover'}`}
            onClick={handleFavorite}
          >
            {isFavorited ? (
              <FaHeart color="red" size={40} className="clickable" />
            ) : (
              <FaRegHeart size={40} className="clickable" />
            )}
          </div>
          <div className="songIcon visibleOnSongInfoHover">
            <Link to={`song/${_id.toString()}`}>
              <FaPlayCircle size={40} className="clickable" color="white" />
            </Link>
          </div>
        </div>
      </li>
      <Modal setInvisible={setInvisible} isVisible={isVisible} children={modalContent}></Modal>
    </>
  )
}

export default SongListItem

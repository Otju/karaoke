import { useState } from 'react'
import { ColorClass } from '../types/types'
import Modal from './Modal'
import { addOneItem, itemExists, removeOneItem } from '../utils/localStorage'
import { AiFillHeart, AiFillPlayCircle } from 'react-icons/ai'
import { Link } from 'react-router-dom'

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

  const modalContent = (
    <div className="songModal">
      <img src={bigImage} alt="Missing cover" height={300} width={300}></img>
      <div className="songModalInfo">
        {artist}
        <p>{title}</p>
        <p>{language}</p>
        <p>{year || ''}</p>
        <p>
          {genres ? genres.map((genre, i) => (i !== genres.length - 1 ? `${genre}, ` : genre)) : ''}
        </p>
      </div>
      <div onClick={() => (isFavorited ? removeFavorite() : addFavorite())} className="clickable">
        {<AiFillHeart color={isFavorited ? 'red' : ''} size={50} />}
      </div>
      <Link to={`song/${_id}`} key={_id} className="clickable">
        <AiFillPlayCircle size={50} />
      </Link>
    </div>
  )

  return (
    <>
      <li className={`songListItem ${colorClass}`} onClick={() => seIsVisible(true)}>
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
          <div className="songIcon">{icon}</div>
          {isFavorited && <div className="songIcon">{<AiFillHeart color="red" size={30} />}</div>}
        </div>
      </li>
      <Modal setInvisible={setInvisible} isVisible={isVisible} children={modalContent}></Modal>
    </>
  )
}

export default SongListItem

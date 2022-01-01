import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'urql'
import { FavoritesQuery } from '../graphql/queries'
import { Song } from '../types/types'
import { getItem } from '../utils/localStorage'
import useYoutube from '../hooks/useYoutube'

const FavoritePage = () => {
  const favorites = getItem('favoritesongs') || []
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [currentVideoId, setCurrentVideoId] = useState<string | undefined>(undefined)
  const [movingDirection, setMovingDirection] = useState<-1 | 0 | 1>(0)
  const [result] = useQuery({
    query: FavoritesQuery,
    variables: { ids: favorites },
  })

  useEffect(() => {
    if (!result.fetching && !result.error && result.data) {
      setCurrentVideoId(result.data.getFavorites[currentSongIndex].videoId)
    }
  }, [result, currentSongIndex])

  const { YTPlayer, handlePlay } = useYoutube(currentVideoId)

  if (result.fetching || result.error || !result.data) {
    return <div></div>
  }
  const songs: Song[] = result.data.getFavorites

  const nextIndex = (currentIndex: number) => {
    let newIndex = currentIndex + 1
    if (newIndex >= favorites.length) {
      newIndex = 0
    }
    return newIndex
  }
  const previousIndex = (currentIndex: number) => {
    let newIndex = currentIndex - 1
    if (newIndex < 0) {
      newIndex = newIndex = favorites.length - 1
    }
    return newIndex
  }

  const handlePrev = () => {
    setMovingDirection(-1)
    setCurrentSongIndex(previousIndex(currentSongIndex))
    handlePlay()
  }

  const handleNext = () => {
    setMovingDirection(1)
    setCurrentSongIndex(nextIndex(currentSongIndex))
    handlePlay()
  }

  const prevSong = songs[previousIndex(currentSongIndex)]
  const currentSong = songs[currentSongIndex]
  const nextSong = songs[nextIndex(currentSongIndex)]
  const prevPrevSong = songs[previousIndex(previousIndex(currentSongIndex))]
  const nextNextSong = songs[nextIndex(nextIndex(currentSongIndex))]

  return (
    <div>
      <div className="center">
        <div className="coverContainer">
          <img
            src={prevSong.bigImage}
            alt="Album cover"
            className={`leftCover clickable ${movingDirection === 1 && 'toLeftCover'}`}
            onClick={handlePrev}
            key={`left${currentSongIndex}`}
          />
          <Link to={`/song/${currentSong._id}`}>
            <img
              src={currentSong.bigImage}
              alt="Album cover"
              className={`currentCover clickable ${
                movingDirection === 1 && 'toCentralCoverFromRight'
              } ${movingDirection === -1 && 'toCentralCoverFromLeft'}`}
              key={`middle${currentSongIndex}`}
            />
          </Link>
          <img
            src={nextSong.bigImage}
            alt="Album cover"
            className={`rightCover clickable ${movingDirection === -1 && 'toRightCover'}`}
            onClick={handleNext}
            key={`right${currentSongIndex}`}
          />
          <img
            src={movingDirection === 1 ? prevPrevSong.bigImage : nextNextSong.bigImage}
            alt="Album cover"
            className={movingDirection === 1 ? 'leftCover' : 'rightCover'}
            style={{ zIndex: -10 }}
            key={`extra${currentSongIndex}`}
          />
        </div>
      </div>
      <h3>
        {currentSongIndex + 1}/{favorites.length}
      </h3>
      {YTPlayer}
    </div>
  )
}

export default FavoritePage

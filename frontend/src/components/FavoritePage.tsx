import { useState } from 'react'
import YouTube from 'react-youtube'
import { useQuery } from 'urql'
import { FavoritesQuery } from '../graphql/queries'
import useSwitch from '../hooks/useSwitch'
import { Song } from '../types/types'
import { getItem } from '../utils/localStorage'

const FavoritePage = () => {
  const favorites = getItem('favoritesongs') || []
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [player, setPlayer] = useState(null)

  const [result] = useQuery({
    query: FavoritesQuery,
    variables: { ids: favorites },
  })

  const { value: isAutoplay, field } = useSwitch()

  if (result.fetching || result.error || !result.data) {
    return <div></div>
  }
  const songs: Song[] = result.data.getFavorites

  const nextIndex = () => {
    let newIndex = currentSongIndex + 1
    if (newIndex >= favorites.length) {
      newIndex = 0
    }
    return newIndex
  }
  const previousIndex = () => {
    let newIndex = currentSongIndex - 1
    if (newIndex < 0) {
      newIndex = newIndex = favorites.length - 1
    }
    return newIndex
  }

  const handlePrev = () => {
    setCurrentSongIndex(previousIndex())
    handlePlay()
  }

  const handleNext = () => {
    setCurrentSongIndex(nextIndex())
    handlePlay()
  }

  const prevSong = songs[previousIndex()]
  const currentSong = songs[currentSongIndex]
  const nextSong = songs[nextIndex()]

  const handleReady = (event: any) => {
    const newPlayer = event.target
    setPlayer(newPlayer)
  }

  const handlePlay = () => {
    if (isAutoplay) {
      setTimeout(() => {
        //@ts-ignore
        if (player) player.playVideo()
      }, 500)
    }
  }

  return (
    <div>
      <h1>Favorites</h1>
      <button onClick={handlePrev}>PREV</button>
      <img src={prevSong.bigImage} alt="Album cover" style={{ height: 200, width: 200 }} />
      <img src={currentSong.bigImage} alt="Album cover" style={{ height: 300, width: 300 }} />
      <img src={nextSong.bigImage} alt="Album cover" style={{ height: 200, width: 200 }} />
      <button onClick={handleNext}>NEXT</button>
      <p>
        {currentSongIndex + 1}/{favorites.length}
      </p>
      <div className="centerX">
        {currentSong.videoId ? (
          <YouTube
            onReady={handleReady}
            videoId={currentSong.videoId}
            opts={{
              height: '200',
              width: '400',
              playerVars: {
                controls: 1,
                disablekb: 1,
                iv_load_policy: 3,
                modestbranding: 1,
                showinfo: 0,
                rel: 0,
              },
            }}
          />
        ) : (
          'Missing video'
        )}
      </div>
      <p>Autoplay video</p>
      {field}
    </div>
  )
}

export default FavoritePage

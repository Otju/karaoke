import YouTube from 'react-youtube'
import { useState } from 'react'
import useSwitch from './useSwitch'

const useYoutube = (videoId: string | undefined) => {
  const { getValue: getIsAutoPlay, field } = useSwitch('allowAutoplay')

  const [player, setPlayer] = useState(null)

  const handleReady = (event: any) => {
    const newPlayer = event.target
    setPlayer(newPlayer)
    handlePlay(newPlayer)
  }

  const handlePlay = (newPlayer?: any) => {
    if (getIsAutoPlay()) {
      setTimeout(() => {
        //@ts-ignore
        const playerToUse = newPlayer || player
        if (playerToUse) playerToUse.playVideo()
      }, 500)
    }
  }

  const YTPlayer = (
    <div className="center column">
      {videoId ? (
        <>
          <YouTube
            onReady={handleReady}
            videoId={videoId}
            opts={{
              height: '300',
              width: '500',
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
          <p>Autoplay video</p>
          {field}
        </>
      ) : (
        'Missing video'
      )}
    </div>
  )

  return { YTPlayer, handlePlay }
}

export default useYoutube

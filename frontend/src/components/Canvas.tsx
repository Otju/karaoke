import { useRef, useEffect } from 'react'
import { useState } from 'react'
import YouTube from 'react-youtube'
import {
  IoPauseSharp,
  IoPlaySharp,
  IoPlaySkipForwardSharp,
  IoArrowBackSharp,
  IoSettingsSharp,
} from 'react-icons/io5'
import { Song, ScoreInfo, SungNote, Tuner } from '../types/types'
import drawPitch from '../utils/drawPitch'
import { Link } from 'react-router-dom'

interface props {
  songInfo: Song
  startTime?: number
  width: number
  height: number
  tuners: Tuner[]
  lyricPlayMode?: boolean
  settingsAreOpen?: boolean
}

const Canvas = ({
  tuners,
  songInfo,
  width,
  height,
  startTime,
  lyricPlayMode,
  settingsAreOpen,
}: props) => {
  const [animationId, setAnimationId] = useState(0)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [timedSungNotes, setTimedSungNotes] = useState<SungNote[][]>([[], [], [], []])
  const [savedStartTime, setSavedStartTime] = useState<number | null>(null)
  const [pauseTime, setPauseTime] = useState<number | null>(null)
  const [player, setPlayer] = useState<any>()
  const [stopped, setStopped] = useState(true)
  const [mouseLastMove, setMouseLastMove] = useState(0)
  const [mouseOnButton, setMouseOnButton] = useState(false)
  const [time, setTime] = useState(0)
  const [scoreInfo, setScoreInfo] = useState<ScoreInfo[]>(
    [...Array(4)].map(() => ({
      score: 0,
      hitNotes: 0,
      missedNotes: 0,
      scorePerNote: 1,
    }))
  )

  const playerCount = lyricPlayMode ? 1 : tuners.filter(({ isEnabled }) => isEnabled).length

  const canvasRef = useRef(null)

  useEffect(() => {
    let totalnoteLength = 0
    songInfo.notePages.forEach(({ notes }) => {
      notes.forEach(({ type, length }) => {
        if (type === 'normal') {
          totalnoteLength += length
        } else if (type === 'golden') {
          totalnoteLength += length * 2
        }
      })
    })
    const maxScore = 10000
    const scorePerNote = maxScore / totalnoteLength
    setScoreInfo((oldInfo) => ({ ...oldInfo, scorePerNote }))
  }, [songInfo])

  const { bpm: barsPerMinute, notePages, gap, videoId } = songInfo

  const bpm = barsPerMinute * 4
  const bpms = bpm / 60 / 1000

  const mainMarginBottom = 160
  const mainMarginTop = 130

  const playerColors = [
    ['rgb(255, 0, 0)', 'rgba(255, 0, 0, 0.9)'],
    ['rgb(9, 9, 187)', ' rgba(9, 9, 187, 0.9)'],
    ['rgb(13, 170, 13)', 'rgba(13, 170, 13, 0.9)'],
    ['rgb(211, 149, 15)', 'rgba(211, 149, 15, 0.9)'],
  ]
  const heightPerPlayer = (height - mainMarginTop - mainMarginBottom) / playerCount
  const marginsForPlayers = [...Array(playerCount)].map((_, i) => {
    const height = heightPerPlayer - heightPerPlayer * 0.16
    const noteTopMargin = mainMarginTop + height * i + heightPerPlayer * 0.08
    const [color, transparentColor] = playerColors[i]
    return { height, noteTopMargin, color, transparentColor }
  })

  const clearSungNotes = () => {
    setTimedSungNotes([[], [], [], []])
  }

  useEffect(() => {
    const canvas = canvasRef.current
    //@ts-ignore
    const ctx = canvas.getContext('2d')
    drawPitch(
      ctx,
      currentBeat,
      { width, height },
      notePages,
      lyricPlayMode ? 24 : 1,
      scoreInfo,
      setScoreInfo,
      marginsForPlayers,
      clearSungNotes,
      timedSungNotes
    )
  }, [
    tuners,
    width,
    height,
    notePages,
    lyricPlayMode,
    scoreInfo,
    currentBeat,
    marginsForPlayers,
    timedSungNotes,
  ])

  useEffect(() => {
    if (startTime && player) {
      handleSkip(startTime)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime])

  const handleReady = (event: any) => {
    const newPlayer = event.target
    setPlayer(newPlayer)
    if (lyricPlayMode) {
      handlePlayAndSkip(newPlayer)
    }
  }

  const start = () => {
    if (lyricPlayMode) {
      clearSungNotes()
    }
    tuners.forEach((tuner) => {
      tuner.play()
    })
    tuners.forEach((tuner) => {
      tuner.updatePitch()
    })
    const timeNow = document.timeline.currentTime
    if (pauseTime && timeNow) {
      if (savedStartTime) {
        const newStartTime = savedStartTime + (timeNow - pauseTime)
        setSavedStartTime(newStartTime)
        render(timeNow, newStartTime)
      }
    } else {
      setSavedStartTime(timeNow)
      render(timeNow, timeNow)
    }
  }

  const render = (timestamp: number | null, startTime: number | null) => {
    if (timestamp && startTime) {
      const timeToCurrentBeat = (currentTimeStamp: number) =>
        (currentTimeStamp - startTime - gap) * bpms
      const newCurrentBeat = timeToCurrentBeat(timestamp)
      setCurrentBeat(newCurrentBeat)
      if (lyricPlayMode) {
        setTimedSungNotes(([notes]) => [[...notes, { name: 'A', beat: newCurrentBeat }]])
      } else {
        setTimedSungNotes((players) =>
          players.map((notes, i) => {
            if (tuners[i]) {
              const name = tuners[i].noteName
              return [...notes, { name, beat: newCurrentBeat }]
            }
            return notes
          })
        )
      }

      setAnimationId(requestAnimationFrame((callback) => render(callback, startTime)))
    }
  }

  const stop = () => {
    tuners.forEach((tuner) => {
      tuner.stopUpdatingPitch()
    })
    const timeNow = document.timeline.currentTime
    setPauseTime(timeNow)
    cancelAnimationFrame(animationId)
  }

  const handlePlay = (newPlayer?: any) => {
    setStopped(false)
    const playerToUse = newPlayer || player
    playerToUse.playVideo()
  }

  const handlePause = () => {
    setStopped(true)
    player.pauseVideo()
  }

  useEffect(() => {
    if (player && settingsAreOpen && !stopped) {
      handlePause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsAreOpen, stopped, player])

  const handleSkip = (value: number, newPlayer?: any) => {
    const playerToUse = newPlayer || player
    playerToUse.pauseVideo()
    const timeNow = document.timeline.currentTime
    setPauseTime(timeNow)
    const newStartTime = Math.floor(value / 1000)
    playerToUse.seekTo(newStartTime)
    if (timeNow) {
      setSavedStartTime(timeNow - newStartTime * 1000)
    }
    playerToUse.playVideo()
  }

  const handlePlayAndSkip = (newPlayer?: any) => {
    handlePlay(newPlayer)
    handleSkip(gap, newPlayer)
  }

  const handleMouseMove = () => {
    setMouseLastMove(document.timeline.currentTime || 0)
  }
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime((prevTime) => prevTime + 1000)
    }, 1000)
    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const buttonsAreHidden = !mouseOnButton && time - mouseLastMove > 2000

  const getScoreText = (scorePercentage: number | undefined) => {
    if (scorePercentage === undefined) {
      return null
    }
    if (scorePercentage >= 0.9) {
      return ['Perfect!', 'green']
    } else if (scorePercentage >= 0.8) {
      return ['Amazing!', 'green']
    } else if (scorePercentage >= 0.7) {
      return ['Great!', 'green']
    } else if (scorePercentage >= 0.6) {
      return ['Good', 'green']
    } else if (scorePercentage >= 0.5) {
      return ['Decent', 'yellow']
    } else if (scorePercentage >= 0.3) {
      return [':(', 'red']
    } else {
      return ['Dude, really?', 'red']
    }
  }
  return (
    <div className="canvasContainer" onMouseMove={handleMouseMove}>
      <div
        style={{
          pointerEvents: 'none',
          visibility: stopped ? 'hidden' : 'visible',
        }}
      >
        <YouTube
          videoId={videoId}
          onReady={handleReady}
          opts={{
            height: height.toString(),
            width: width.toString(),
            playerVars: {
              controls: 0,
              disablekb: 1,
              iv_load_policy: 3,
              modestbranding: 1,
              showinfo: 0,
              rel: 0,
            },
          }}
          onPlay={start}
          onPause={stop}
          className="fullSizeYtPlayer"
        />
      </div>
      {stopped ? (
        <div className="absCenter pauseBackground">
          <IoPauseSharp size={70} className="videoPauseLogo" key={pauseTime} />
        </div>
      ) : (
        <div className="absCenter">
          <IoPlaySharp size={70} className="videoPauseLogo" key={pauseTime} />
        </div>
      )}
      {marginsForPlayers.map(({ noteTopMargin, height, color }, i) => {
        const { percentageOnPage, score, missedNotes, hitNotes } = scoreInfo[i]
        const scoreText = getScoreText(percentageOnPage)
        return (
          <div className="scoreBox" style={{ top: noteTopMargin + height * 0.16 }}>
            <span style={{ color }}>{score.toFixed(0)}</span>
            <div className="percentageScore" key={missedNotes + hitNotes}>
              {scoreText && <b style={{ color: scoreText[1] }}>{scoreText[0]}</b>}
            </div>
          </div>
        )
      })}
      <div className={buttonsAreHidden ? 'fadeOut' : 'fadeIn'}>
        <div className="playControls">
          {player && !lyricPlayMode && (
            <>
              <button
                className="bigButton"
                onClick={() => (stopped ? handlePlay() : handlePause())}
                onMouseEnter={() => setMouseOnButton(true)}
                onMouseLeave={() => setMouseOnButton(false)}
              >
                {stopped ? <IoPlaySharp size={30} /> : <IoPauseSharp size={30} />}
              </button>
              <button
                className="bigButton"
                onClick={() => handleSkip(gap)}
                onMouseEnter={() => setMouseOnButton(true)}
                onMouseLeave={() => setMouseOnButton(false)}
              >
                <IoPlaySkipForwardSharp size={30} />
              </button>
            </>
          )}
        </div>
        {!lyricPlayMode && (
          <>
            <Link to="/" className="leftSide firstTop">
              <button
                className="bigButton"
                onMouseEnter={() => setMouseOnButton(true)}
                onMouseLeave={() => setMouseOnButton(false)}
              >
                <IoArrowBackSharp size={30} />
              </button>
            </Link>
            <Link to={`/tweak/${songInfo._id}`} className="leftSide secondTop">
              <button
                className="bigButton"
                onMouseEnter={() => setMouseOnButton(true)}
                onMouseLeave={() => setMouseOnButton(false)}
              >
                <IoSettingsSharp size={30} />
              </button>
            </Link>
          </>
        )}
      </div>
      <div className="absCenter" style={{ zIndex: 400 }}>
        <canvas ref={canvasRef} width={width} height={height} />
      </div>
      <div className="vocalBackground"></div>
    </div>
  )
}

export default Canvas

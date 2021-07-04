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
import { Song, ScoreInfo, Player, SungNote } from '../types/types'
import drawPitch from '../utils/drawPitch'
import { Link } from 'react-router-dom'

interface props {
  songInfo: Song
  startTime?: number
  width: number
  height: number
  players: Player[]
  lyricPlayMode?: boolean
}

const Canvas = ({ players, songInfo, width, height, startTime, lyricPlayMode }: props) => {
  const [animationId, setAnimationId] = useState(0)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [timedSungNotes, setTimedSungNotes] = useState<SungNote[][]>([[], [], [], []])
  const [savedStartTime, setSavedStartTime] = useState<number | null>(null)
  const [pauseTime, setPauseTime] = useState<number | null>(null)
  const [player, setPlayer] = useState<any>()
  const [stopped, setStopped] = useState(true)
  const [mouseLastMove, setMouseLastMove] = useState(0)
  const [mouseOnButton, setMouseOnButton] = useState(false)
  const [currentWholeBeat, setCurrentWholeBeat] = useState<number>(0)
  const [time, setTime] = useState(0)
  const [scoreInfo, setScoreInfo] = useState<ScoreInfo[]>(
    [...Array(4)].map(() => ({
      score: 0,
      hitNotes: 0,
      missedNotes: 0,
      scorePerNote: 1,
    }))
  )

  const playerCount = players ? players.filter((player) => player.isEnabled).length : 1

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

  const clearAllSungNotes = (players: Player[]) => {
    players?.forEach((player) => {
      player.clearSungNotes()
    })
    setTimedSungNotes([[], [], [], []])
  }

  const handleAllAudioTicks = (players: Player[]) => {
    players?.forEach((player) => {
      player.handleAudioProcessTick()
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    //@ts-ignore
    const ctx = canvas.getContext('2d')
    drawPitch(
      ctx,
      currentBeat,
      { width: width, height },
      notePages,
      lyricPlayMode ? 24 : 1,
      scoreInfo,
      setScoreInfo,
      marginsForPlayers,
      () => clearAllSungNotes(players),
      timedSungNotes
    )
  }, [
    players,
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
    clearAllSungNotes(players)
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
      const newWholeBeat = Math.round(currentBeat / 100)
      if (newWholeBeat !== currentWholeBeat) {
        console.log(currentBeat / 100)
        console.log('NEW')
        if (players[0].sungNotes.length > 0) {
          console.log(players[0].sungNotes)
        }
        setCurrentWholeBeat(newWholeBeat)
        setTimedSungNotes((playersWithNotes) =>
          playersWithNotes.map((notes, i) => {
            const { sungNotes } = players[i]
            const currentTime = new Date().getTime()
            const newestNoteGroup = sungNotes[sungNotes.length - 1]
            if (newestNoteGroup && newestNoteGroup.timestamp) {
              const timeDifference = currentTime - newestNoteGroup.timestamp
              const beatDifference = bpms * timeDifference
              const startBeat = currentBeat - beatDifference
              const newNotes = newestNoteGroup.notes.map(({ key }, i) => {
                const samplesPerBeat = 4
                const beatsForward = i * (1 / samplesPerBeat)
                const beat = startBeat + beatsForward
                return { name: key, beat }
              })
              return [...notes, ...newNotes]
            } else {
              return notes
            }
          })
        )
        handleAllAudioTicks(players)
      }
      setAnimationId(requestAnimationFrame((callback) => render(callback, startTime)))
    }
  }

  const stop = () => {
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

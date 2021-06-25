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
import { Song, SungNote, Note, ScoreInfo } from '../types/types'
import drawPitch from '../utils/drawPitch'
import { Link } from 'react-router-dom'

interface props {
  voice: any
  tuner: any
  songInfo: Song
  lyricPlayMode?: boolean
  startTime?: number
  width: number
  height: number
}

const Canvas = ({ voice, tuner, songInfo, lyricPlayMode, width, height, startTime }: props) => {
  const [note, setNote] = useState<Note>({ name: '', currentBeat: -40 })
  const [animationId, setAnimationId] = useState(0)
  const [savedStartTime, setSavedStartTime] = useState<number | null>(null)
  const [pauseTime, setPauseTime] = useState<number | null>(null)
  const [player, setPlayer] = useState<any>()
  const [stopped, setStopped] = useState(true)
  const [sungNotes, setSungNotes] = useState<SungNote[]>([])
  const [currentWholeBeat, setCurrentWholeBeat] = useState<number>(0)
  const [mouseLastMove, setMouseLastMove] = useState(0)
  const [mouseOnButton, setMouseOnButton] = useState(false)
  const [time, setTime] = useState(0)
  const [scoreInfo, setScoreInfo] = useState<ScoreInfo>({
    score: 0,
    hitNotes: 0,
    missedNotes: 0,
    scorePerNote: 1,
  })

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

  const { bpm, notePages, gap, videoId } = songInfo

  useEffect(() => {
    const canvas = canvasRef.current
    //@ts-ignore
    const ctx = canvas.getContext('2d')
    drawPitch(
      ctx,
      note.currentBeat,
      sungNotes,
      setSungNotes,
      { width: width, height },
      notePages,
      lyricPlayMode ? 12 : 1,
      scoreInfo,
      setScoreInfo
    )
  }, [note, sungNotes, width, height, notePages, lyricPlayMode, scoreInfo])

  useEffect(() => {
    setSungNotes((notes) => [...notes, { name: note.name, wholeBeat: currentWholeBeat }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWholeBeat])

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
    if (!lyricPlayMode) {
      voice.play()
      tuner.updatePitch()
    }
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
      let currentRelativeTime = timestamp - startTime - gap
      const currentBeat = ((bpm * 4) / 60 / 1000) * currentRelativeTime
      const newWholeBeat = Math.round(currentBeat)
      if (newWholeBeat !== currentWholeBeat) {
        setCurrentWholeBeat(newWholeBeat)
      }
      let newNote
      if (lyricPlayMode) {
        newNote = { name: 'A', currentBeat }
      } else {
        newNote = { name: tuner.noteName, currentBeat }
      }
      setNote(newNote)
      setAnimationId(requestAnimationFrame((callback) => render(callback, startTime)))
    }
  }

  const stop = () => {
    const timeNow = document.timeline.currentTime
    setPauseTime(timeNow)
    if (!lyricPlayMode) {
      tuner.stopUpdatingPitch()
    }
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

  const scoreText = getScoreText(scoreInfo.percentageOnPage)

  return (
    <div style={{ width, height }} className="canvasContainer" onMouseMove={handleMouseMove}>
      <div>
        <div style={{ pointerEvents: 'none', visibility: stopped ? 'hidden' : 'visible' }}>
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
          />
        </div>
        {stopped && <h1 className="absCenter">PAUSED</h1>}
        <div className="scoreBox">
          <span>Score: {scoreInfo.score.toFixed(0)}</span>

          {scoreInfo.addedAmount !== undefined && scoreText && (
            <span
              className="percentageScore"
              key={scoreInfo.missedNotes + scoreInfo.hitNotes}
            ></span>
          )}
          <span className="percentageScore" key={scoreInfo.missedNotes + scoreInfo.hitNotes}>
            {scoreInfo.addedAmount !== undefined && scoreText && (
              <b style={{ color: scoreText[1] }}>+ {scoreInfo.addedAmount.toFixed(0)}</b>
            )}
            <br />
            {scoreText && <b style={{ color: scoreText[1] }}>{scoreText[0]}</b>}
          </span>
        </div>
      </div>
      <div className={buttonsAreHidden ? 'fadeOut' : 'fadeIn'}>
        <div className="playControls">
          {player &&
            (lyricPlayMode ? (
              <>
                <button
                  className="bigButton"
                  onClick={() => (stopped ? handlePlayAndSkip() : handlePause())}
                  onMouseEnter={() => setMouseOnButton(true)}
                  onMouseLeave={() => setMouseOnButton(false)}
                >
                  {stopped ? <IoPlaySharp size={30} /> : <IoPauseSharp size={30} />}
                </button>
              </>
            ) : (
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
            ))}
        </div>
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
      </div>
      <div className="absCenter" style={{ zIndex: 400 }}>
        <canvas ref={canvasRef} width={width} height={height} />
      </div>
    </div>
  )
}

export default Canvas

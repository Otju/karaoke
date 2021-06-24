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
import { Song, SungNote, Note } from '../types/types'
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

  const canvasRef = useRef(null)

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
      { width: width / 2, height },
      notePages,
      lyricPlayMode ? 12 : 1
    )
  }, [note, sungNotes, width, height, notePages, lyricPlayMode])

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
    setPlayer(event.target)
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

  const handlePlay = () => {
    setStopped(false)
    player.playVideo()
  }

  const handlePause = () => {
    setStopped(true)
    player.pauseVideo()
  }

  const handleSkip = (value: number) => {
    player.pauseVideo()
    const timeNow = document.timeline.currentTime
    setPauseTime(timeNow)
    const newStartTime = Math.floor(value / 1000)
    player.seekTo(newStartTime)
    if (timeNow) {
      setSavedStartTime(timeNow - newStartTime * 1000)
    }
    player.playVideo()
  }

  const handlePlayAndSkip = () => {
    handlePlay()
    handleSkip(gap)
  }

  return (
    <div style={{ width, height }} className="canvasContainer">
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
      </div>
      {
        <div className="playControls" style={{ zIndex: 500 }}>
          {player &&
            (lyricPlayMode ? (
              <>
                <button
                  className="bigButton"
                  onClick={() => (stopped ? handlePlayAndSkip() : handlePause())}
                >
                  {stopped ? <IoPlaySharp size={30} /> : <IoPauseSharp size={30} />}
                </button>
              </>
            ) : (
              <>
                <button
                  className="bigButton"
                  onClick={() => (stopped ? handlePlay() : handlePause())}
                >
                  {stopped ? <IoPlaySharp size={30} /> : <IoPauseSharp size={30} />}
                </button>
                <button className="bigButton" onClick={() => handleSkip(gap)}>
                  <IoPlaySkipForwardSharp size={30} />
                </button>
              </>
            ))}
        </div>
      }
      <div className="absCenter" style={{ zIndex: 400 }}>
        <canvas ref={canvasRef} width={width / 2} height={height} />
      </div>
      <div className="vocalBackground"></div>
      <Link to="/" className="leftSide firstTop">
        <button className="bigButton">
          <IoArrowBackSharp size={30} />
        </button>
      </Link>
      <Link to={`/tweak/${songInfo._id}`} className="leftSide secondTop">
        <button className="bigButton">
          <IoSettingsSharp size={30} />
        </button>
      </Link>
    </div>
  )
}

export default Canvas

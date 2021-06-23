import { useRef, useEffect } from 'react'
import { useState } from 'react'
import YouTube from 'react-youtube'
import useWindowDimensions from '../hooks/useWindowDimensions'
import {
  IoPauseSharp,
  IoPlaySharp,
  IoPlaySkipForwardSharp,
  IoArrowBackSharp,
  IoSettingsSharp,
} from 'react-icons/io5'
import { Note, Octave, Song, SungNote } from '../types/types'
import drawPitch from '../utils/drawPitch'
import { Link } from 'react-router-dom'

/*
const pitchToY = (pitch: number, octaveNotes?: number[]) => {
  if (!octaveNotes) {
    return 0
  }
  const noteNumber = closestIndex(pitch, octaveNotes) + 1
  const y = canvasheight - canvasheight * (noteNumber / 24)
  return y
}
*/

interface props {
  voice: any
  tuner: any
  songInfo: Song
}

const Canvas = ({ voice, tuner, songInfo }: props) => {
  const [note, setNote] = useState<Note>({ pitch: 0, name: '', currentBeat: -40 })
  const [animationId, setAnimationId] = useState(0)
  const [savedStartTime, setSavedStartTime] = useState<number | null>(null)
  const [pauseTime, setPauseTime] = useState<number | null>(null)
  const [player, setPlayer] = useState<any>()
  const [stopped, setStopped] = useState(true)
  const [currentOctave, setCurrentOctave] = useState<Octave | undefined>()
  const [sungNotes, setSungNotes] = useState<SungNote[]>([])
  const [currentWholeBeat, setCurrentWholeBeat] = useState<number>(0)
  const [customVideoId, setCustomVideoId] = useState('')

  const { height, width } = useWindowDimensions()

  const canvasRef = useRef(null)

  const { bpm, notePages, gap, videoId } = songInfo

  useEffect(() => {
    const canvas = canvasRef.current
    //@ts-ignore
    const ctx = canvas.getContext('2d')
    drawPitch(
      ctx,
      note.pitch,
      note.currentBeat,
      currentOctave,
      setCurrentOctave,
      sungNotes,
      setSungNotes,
      { width: width / 2, height },
      notePages
    )
  }, [note, currentOctave, sungNotes, width, height, notePages])

  useEffect(() => {
    setSungNotes((notes) => [
      ...notes,
      { pitch: note.pitch, name: note.name, wholeBeat: currentWholeBeat },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWholeBeat])

  const handleReady = (event: any) => {
    setPlayer(event.target)
  }

  const start = () => {
    voice.play()
    tuner.updatePitch()
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
      const newNote = { pitch: tuner.pitch, name: tuner.noteName, currentBeat }
      setNote(newNote)
      setAnimationId(requestAnimationFrame((callback) => render(callback, startTime)))
    }
  }

  const stop = () => {
    const timeNow = document.timeline.currentTime
    setPauseTime(timeNow)
    tuner.stopUpdatingPitch()
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

  const handleSkip = () => {
    player.pauseVideo()
    const timeNow = document.timeline.currentTime
    setPauseTime(timeNow)
    const newStartTime = Math.floor(gap / 1000)
    player.seekTo(newStartTime)
    if (timeNow) {
      setSavedStartTime(timeNow - newStartTime * 1000)
    }
    player.playVideo()
  }

  return (
    <div>
      <div>
        <div style={{ pointerEvents: 'none', visibility: stopped ? 'hidden' : 'visible' }}>
          <YouTube
            videoId={videoId || customVideoId}
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
      <div className="playControls" style={{ zIndex: 500 }}>
        <input
          type="text"
          onChange={(e) => setCustomVideoId(e.target.value)}
          value={customVideoId}
        />
        {player && (
          <div>
            <button onClick={() => (stopped ? handlePlay() : handlePause())}>
              {stopped ? <IoPlaySharp size={30} /> : <IoPauseSharp size={30} />}
            </button>
            <button onClick={handleSkip}>
              <IoPlaySkipForwardSharp size={30} />
            </button>
          </div>
        )}
        <button onClick={() => setCurrentOctave(undefined)}>
          Low C: {currentOctave ? `C${currentOctave.octave}` : '?'}
        </button>
      </div>
      <div className="absCenter" style={{ zIndex: 400 }}>
        <canvas ref={canvasRef} width={width / 2} height={height} />
      </div>
      <div className="vocalBackground"></div>
      <Link to="/" className="leftSide firstTop">
        <button>
          <IoArrowBackSharp size={30} />
        </button>
      </Link>
      <Link to={`/tweak/${songInfo._id}`} className="leftSide secondTop">
        <button>
          <IoSettingsSharp size={30} />
        </button>
      </Link>
    </div>
  )
}

export default Canvas

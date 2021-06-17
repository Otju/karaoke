import { useRef, useEffect } from 'react'
import { useState } from 'react'
import Wad from 'web-audio-daw'
import songData from '../data/Mamma-Mia.json'
import YouTube from 'react-youtube'
import useWindowDimensions from '../hooks/useWindowDimensions'
import { IoPauseSharp, IoPlaySharp, IoPlaySkipForwardSharp } from 'react-icons/io5'

const voice = new Wad({ source: 'mic' })
const tuner = new Wad.Poly()

const { bpm, notePages, gap } = songData

interface RadiusInput {
  tl?: number
  tr?: number
  br?: number
  bl?: number
}

interface Radius {
  tl: number
  tr: number
  br: number
  bl: number
}

type RadiusField = 'tl' | 'tr' | 'br' | 'bl'

const roundRect = (
  ctx: any,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | RadiusInput,
  fill = true,
  stroke = true
) => {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius }
  } else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 }
    for (const side in defaultRadius) {
      const sideAsType = side as RadiusField
      radius[sideAsType] = radius[sideAsType] || defaultRadius[sideAsType]
    }
  }
  const rad = radius as Radius
  ctx.beginPath()
  ctx.moveTo(x + rad.tl, y)
  ctx.lineTo(x + width - rad.tr, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + rad.tr)
  ctx.lineTo(x + width, y + height - rad.br)
  ctx.quadraticCurveTo(x + width, y + height, x + width - rad.br, y + height)
  ctx.lineTo(x + rad.bl, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - rad.bl)
  ctx.lineTo(x, y + rad.tl)
  ctx.quadraticCurveTo(x, y, x + rad.tl, y)
  ctx.closePath()
  if (fill) {
    ctx.fill()
  }
  if (stroke) {
    ctx.stroke()
  }
}

const closestIndex = (num: number, arr: number[]) => {
  let curr = arr[0],
    diff = Math.abs(num - curr)
  let index = 0
  for (let val = 0; val < arr.length; val++) {
    let newdiff = Math.abs(num - arr[val])
    if (newdiff < diff) {
      diff = newdiff
      curr = arr[val]
      index = val
    }
  }
  return index
}

tuner.setVolume(0)
tuner.add(voice)

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

interface Octave {
  min: number
  max: number
  octave: number
  trueMax: number
  octaveNotes: OctaveNote[]
}

interface OctaveNote {
  name: string
  freq: number
}

const octaves: Octave[] = []

const a4Freq = 440
const multiplier = 2 ** (1 / 12)
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const calculateC = (number: number) => {
  const a4Freq = 440
  const power = 3 + number * 12
  const freq = a4Freq * multiplier ** power
  return freq
}

const calculateTwoOctaveNotes = (number: number) => {
  const notes = []
  const startCPower = 3 + number * 12
  for (let i = 0; i < 24; i++) {
    const power = startCPower + i
    const name = i >= 12 ? `${noteNames[i - 12]}2` : noteNames[i]
    const freq = a4Freq * multiplier ** power
    notes.push({ name, freq, number: i + 1 })
  }
  return notes
}

for (let i = -3; i <= 2; i++) {
  const min = calculateC(i)
  const max = calculateC(i + 1)
  const trueMax = calculateC(i + 2)
  const octave = i + 5
  const octaveNotes = calculateTwoOctaveNotes(i)
  octaves.push({ min, max, octave, trueMax, octaveNotes })
}

interface Dimensions {
  height: number
  width: number
}

const drawPitch = (
  ctx: any,
  pitch: number,
  currentBeat: number,
  currentOctave: Octave | undefined,
  setCurrentOctave: Function,
  sungNotes: SungNote[],
  setSungNotes: Function,
  pageSize: Dimensions
) => {
  const canvasheight = pageSize.height
  const canvaswidth = pageSize.width

  const currentNotePageIndex = notePages.findIndex(
    ({ startBeat, endBeat }) => currentBeat >= startBeat - 20 && currentBeat <= endBeat
  )
  const currentNotePage = notePages[currentNotePageIndex]
  const nextPageLyrics = notePages[currentNotePageIndex + 1].notes
    .map(({ lyric }) => lyric)
    .join('')
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  if (currentNotePage) {
    ctx.font = '32px Arial'
    const { startBeat } = currentNotePage
    ctx.beginPath()
    const lineX = (currentBeat - startBeat) * 20
    ctx.moveTo(lineX, 0)
    ctx.lineTo(lineX, canvasheight)
    ctx.stroke()
    ctx.beginPath()
    ctx.fillStyle = 'black'
    ctx.fill()
    let notFilledLyrics = ''
    let filledLyrics = ''

    currentNotePage.notes.forEach(({ beat, length, note, lyric, isSecondOctave }) => {
      const calcOctave = () => {
        const isActive = beat <= currentBeat && beat + length >= currentBeat
        if (isActive) {
          const newCurrentOctaveIndex = octaves.findIndex(
            ({ min, max }) => pitch >= min && pitch < max
          )
          if (newCurrentOctaveIndex !== -1) {
            const newCurrentOctave = isSecondOctave
              ? octaves[newCurrentOctaveIndex - 1]
              : octaves[newCurrentOctaveIndex]
            setCurrentOctave(newCurrentOctave)
          }
        }
      }
      if (!currentOctave) calcOctave()
      const relativeBeat = beat - startBeat
      const x = relativeBeat * 20
      const y = canvasheight - canvasheight * (note / 24)
      ctx.fillStyle = '#FF0000'
      roundRect(ctx, x, y, length * 20, 30, 5, true, false)
      if (currentBeat >= beat) {
        filledLyrics += lyric
      } else {
        notFilledLyrics += lyric
      }
    })

    const centerOfCanvas = canvaswidth / 2
    const filledLength = ctx.measureText(filledLyrics).width
    const notFilledLength = ctx.measureText(notFilledLyrics).width
    const totalWidth = filledLength + notFilledLength
    const textX = centerOfCanvas - totalWidth / 2

    const nextPageLyricsX = centerOfCanvas - ctx.measureText(nextPageLyrics).width / 2

    ctx.fillStyle = 'red'
    ctx.fillText(filledLyrics, textX, canvasheight - 60)
    ctx.fillStyle = 'white'
    ctx.fillText(notFilledLyrics, textX + filledLength, canvasheight - 60)
    ctx.fillText(nextPageLyrics, nextPageLyricsX, canvasheight - 20)

    sungNotes.forEach(({ wholeBeat, name, pitch }) => {
      if (wholeBeat === currentNotePage.startBeat - 1) {
        setSungNotes([])
      }
      const currentNote = currentNotePage.notes.find(
        ({ beat, length }) => wholeBeat >= beat && wholeBeat < beat + length
      )
      if (currentNote && name && currentOctave) {
        let index = currentNote.note - 1
        const closestNoteToSungNoteIndex = closestIndex(
          pitch,
          currentOctave.octaveNotes.map(({ freq }) => freq)
        )
        const isRightNote = closestNoteToSungNoteIndex === index
        const relativeBeat = wholeBeat - startBeat
        const x = relativeBeat * 20
        const y = canvasheight - canvasheight * ((closestNoteToSungNoteIndex + 1) / 24)
        ctx.fillStyle = isRightNote ? 'blue' : 'rgba(0, 0, 255, 0.3)'
        const width = isRightNote ? 30 : 20
        const { beat, length } = currentNote
        if (wholeBeat === beat) {
          //Start of note
          roundRect(ctx, x, y, 20, width, { tl: 5, bl: 5 }, true, false)
        } else if (wholeBeat === beat + length - 1) {
          //End of note
          roundRect(ctx, x, y, 20, width, { tr: 5, br: 5 }, true, false)
        } else {
          ctx.fillRect(x, y, 20, width)
        }
      }
    })
  }
}

interface Note {
  pitch: number
  name: string
  currentBeat: number
}

interface SungNote {
  pitch: number
  name: string
  wholeBeat: number
}

const Canvas = (props: any) => {
  const [note, setNote] = useState<Note>({ pitch: 0, name: '', currentBeat: -40 })
  const [id, setId] = useState(0)
  const [savedStartTime, setSavedStartTime] = useState<number | null>(null)
  const [pauseTime, setPauseTime] = useState<number | null>(null)
  const [player, setPlayer] = useState<any>()
  const [stopped, setStopped] = useState(true)
  const [currentOctave, setCurrentOctave] = useState<Octave | undefined>()
  const [sungNotes, setSungNotes] = useState<SungNote[]>([])
  const [currentWholeBeat, setCurrentWholeBeat] = useState<number>(0)

  const { height, width } = useWindowDimensions()

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
      setId(requestAnimationFrame((callback) => render(callback, startTime)))
    }
  }

  const stop = () => {
    const timeNow = document.timeline.currentTime
    setPauseTime(timeNow)
    tuner.stopUpdatingPitch()
    cancelAnimationFrame(id)
  }

  const canvasRef = useRef(null)

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
      { width: width / 2, height }
    )
  }, [note, currentOctave, sungNotes, width, height])

  useEffect(() => {
    setSungNotes((notes) => [
      ...notes,
      { pitch: note.pitch, name: note.name, wholeBeat: currentWholeBeat },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWholeBeat])

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
            videoId={'unfzfe8f9NI'}
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
        <canvas ref={canvasRef} {...props} width={width / 2} height={height} />
      </div>
      <div className="vocalBackground"></div>
    </div>
  )
}

export default Canvas

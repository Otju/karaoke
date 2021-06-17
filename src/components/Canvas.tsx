import { useRef, useEffect } from 'react'
import { useState } from 'react'
import Wad from 'web-audio-daw'
import songData from '../data/Mamma-Mia.json'
import YouTube from 'react-youtube'

const voice = new Wad({ source: 'mic' })
const tuner = new Wad.Poly()

const canvasheight = 400
const canvaswidth = 1000

const { bpm, notePages, gap } = songData

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

const pitchToY = (pitch: number, octaveNotes?: number[]) => {
  if (!octaveNotes) {
    return 0
  }
  const noteNumber = closestIndex(pitch, octaveNotes) + 1
  const y = canvasheight - canvasheight * (noteNumber / 24)
  return y
}

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

const drawPitch = (
  ctx: any,
  pitch: number,
  currentBeat: number,
  currentOctave: Octave | undefined,
  setCurrentOctave: Function,
  sungNotes: SungNote[]
) => {
  const currentNotePageIndex = notePages.findIndex(
    ({ startBeat, endBeat }) => currentBeat >= startBeat - 20 && currentBeat <= endBeat
  )
  const currentNotePage = notePages[currentNotePageIndex]
  const nextPageLyrics = notePages[currentNotePageIndex + 1].notes
    .map(({ lyric }) => lyric)
    .join('')
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  if (currentNotePage) {
    ctx.font = '24px Arial'
    const { startBeat } = currentNotePage
    let y = pitchToY(
      pitch,
      currentOctave?.octaveNotes.map(({ freq }) => freq)
    )
    ctx.beginPath()
    const lineX = (currentBeat - startBeat) * 20
    ctx.moveTo(lineX, 0)
    ctx.lineTo(lineX, canvasheight)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc((currentBeat - startBeat) * 20, y, 10, 0, Math.PI * 2, false)
    ctx.fillStyle = 'black'
    ctx.fill()
    /*
    currentOctave?.octaveNotes.forEach(({ name, freq }) => {
      const y = pitchToY(
        freq,
        currentOctave?.octaveNotes.map(({ freq }) => freq)
      )
      ctx.fillText(name, 20, y)
    })
    */
    let notFilledLyrics = ''
    let filledLyrics = ''
    //let partlyFilledLyrics = ''
    //let gradient

    currentNotePage.notes.forEach(({ beat, length, note, lyric, noteName, isSecondOctave }) => {
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
      //const isCurrentBeat = beat <= currentBeat && beat + length >= currentBeat
      ctx.fillStyle = '#FF0000' //isCurrentBeat ? 'green' :
      ctx.fillRect(x, y, length * 20, 30)
      ctx.fillText(`${noteName}${isSecondOctave ? '2' : ''}`, x, y)
      if (currentBeat >= beat) {
        //const endBeatOfNote = beat + length
        //if (currentBeat >= endBeatOfNote) {
        filledLyrics += lyric
        //} else {
        /*
          const percentageComplete = (currentBeat - beat) / (endBeatOfNote - beat)
          partlyFilledLyrics += lyric
          gradient = ctx.createLinearGradient(
            ctx.measureText(partlyFilledLyrics).width * percentageComplete,
            0,
            ctx.measureText(partlyFilledLyrics).width * percentageComplete * 2,
            0
          )
          gradient.addColorStop(0, 'red')
          gradient.addColorStop(1, 'black')
          console.log(partlyFilledLyrics, percentageComplete)
          */
        //}
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

    ctx.fillStyle = '#FF0000'
    ctx.fillText(filledLyrics, textX, 400)
    //ctx.fillStyle = gradient
    //ctx.fillText(partlyFilledLyrics, 20 + filledLength, 400)
    ctx.fillStyle = '#000000'
    ctx.fillText(
      notFilledLyrics,
      textX + /*tx.measureText(partlyFilledLyrics).width*/ +filledLength,
      400
    )
    ctx.fillText(nextPageLyrics, nextPageLyricsX, 440)

    sungNotes.forEach(({ wholeBeat, name, pitch }) => {
      const currentNote = currentNotePage.notes.find(
        ({ beat, length }) => wholeBeat >= beat && wholeBeat < beat + length
      )
      if (currentNote && name && currentOctave) {
        let index = currentNote.note - 1
        const currentNotePitch = currentOctave?.octaveNotes[index]?.freq
        const isRightPitch = pitch < currentNotePitch * 1.05 && pitch > currentNotePitch * 0.95
        if (isRightPitch) {
          const relativeBeat = wholeBeat - startBeat
          const x = relativeBeat * 20
          const y = canvasheight - canvasheight * (currentNote.note / 24)
          ctx.fillStyle = 'blue'
          ctx.fillRect(x, y, 20, 30)
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
    drawPitch(ctx, note.pitch, note.currentBeat, currentOctave, setCurrentOctave, sungNotes)
  }, [note, currentOctave, sungNotes])

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
      <div style={{ position: 'relative' }}>
        <div style={{ pointerEvents: 'none', visibility: stopped ? 'hidden' : 'visible' }}>
          <YouTube
            videoId={'unfzfe8f9NI'}
            onReady={handleReady}
            opts={{
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
        {stopped && (
          <h1
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              top: '45%',
            }}
          >
            PAUSED
          </h1>
        )}
      </div>
      {player && (
        <div>
          <button onClick={handlePlay}>Start</button>
          <button onClick={handlePause}>Stop</button>
          <button onClick={handleSkip}>Skip to start</button>
        </div>
      )}
      {note.pitch ? (
        <h2>
          {note.pitch}:{note.name}
          <button onClick={() => setCurrentOctave(undefined)}>C{currentOctave?.octave}</button>
        </h2>
      ) : null}
      <canvas ref={canvasRef} {...props} width={canvaswidth} height={canvasheight} />
    </div>
  )
}

export default Canvas

import { useQuery, useMutation } from 'urql'
import { useParams, useHistory } from 'react-router-dom'
import { SongQuery } from '../graphql/queries'
import { UpdateVideoInfo } from '../graphql/mutations'
import { Song } from '../types/types'
import React, { useState } from 'react'
import { useEffect } from 'react'
import Canvas from './Canvas'
import SkipButton from './SkipButton'

const SongTweak = () => {
  const [videoIdField, setVideoIdField] = useState('')
  const [isInvalid, setIsInvalid] = useState(false)

  const [parsedID, setParsedID] = useState('')
  const [startTime, setStartTime] = useState<number>(0)

  const [, updateVideoInfo] = useMutation(UpdateVideoInfo)

  const { id } = useParams<{ id: string }>()
  const history = useHistory()

  const [result] = useQuery({
    query: SongQuery,
    variables: { id },
  })
  const { data, fetching, error } = result

  useEffect(() => {
    if (data) {
      const song = data.getSong as Song
      if (song) {
        if (song.videoId) {
          setParsedID(song.videoId)
        }
        setStartTime(song.gap)
      }
    }
  }, [data])

  if (fetching) return <p>Loading...</p>
  if (error) return <p>Oh no... {error.message}</p>

  if (!id) {
    history.push('/')
    return <span>No song</span>
  }

  const song = data.getSong as Song

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setVideoIdField(newValue)
  }

  const handleSet = () => {
    let parsedIDTemp
    if (videoIdField.includes('yout')) {
      const idMatch = videoIdField.match(
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
      )
      if (idMatch && idMatch[1]) {
        parsedIDTemp = idMatch[1]
      }
    } else {
      const idMatch = videoIdField.match(/^\s*[^"&?/\s]{11}\s*$/i)
      if (idMatch && idMatch[0]) {
        parsedIDTemp = idMatch[0]
      }
    }
    if (!parsedIDTemp) {
      setIsInvalid(true)
    } else {
      setIsInvalid(false)
      setParsedID(parsedIDTemp)
    }
  }
  /*
  const handleReady = (event: any) => {
    const newPlayer = event.target
    setPlayer(newPlayer)
    if (newPlayer && oldStartTime) {
      newPlayer.seekTo(oldStartTime / 1000)
      newPlayer.pauseVideo()
    }
  }

  const setTime = () => {
    const time = player.getCurrentTime()
    if (time) {
      setStartTime(time * 1000)
    }
  }
  */

  const handleSubmit = () => {
    updateVideoInfo({ id, gap: startTime, videoId: parsedID }).then(() => {
      history.push(`/song/${id}`)
    })
  }

  const handleTimeChange = (amount: number) => {
    setStartTime((startTime || 0) + amount * 1000)
  }

  return (
    <div>
      {!parsedID ? (
        <div>
          {isInvalid && <h2>INVALID ID</h2>}
          <input
            placeholder="Paste YouTube link here"
            onChange={handleChange}
            value={videoIdField}
          />
          <button className="bigButton" onClick={handleSet}>
            Select link
          </button>
          <a
            target="_blank"
            rel="noreferrer"
            href={`https://www.youtube.com/results?search_query=${song.artist.replaceAll(
              ' ',
              '+'
            )}+${song.title.replaceAll(' ', '+')}+official+music+video`}
          >
            Go to YouTube with search
          </a>
        </div>
      ) : (
        <div>
          <div>
            YouTube video ID: {parsedID}
            <button className="bigButton" onClick={() => setParsedID('')}>
              Change
            </button>
          </div>
          <div>
            <SkipButton amount={-10} onClick={handleTimeChange} />
            <SkipButton amount={-1} onClick={handleTimeChange} />
            <SkipButton amount={-0.1} onClick={handleTimeChange} />
            <SkipButton amount={-0.01} onClick={handleTimeChange} />
            Start time: {(startTime / 1000).toFixed(2)}s
            <SkipButton amount={0.01} onClick={handleTimeChange} />
            <SkipButton amount={0.1} onClick={handleTimeChange} />
            <SkipButton amount={1} onClick={handleTimeChange} />
            <SkipButton amount={10} onClick={handleTimeChange} />
          </div>
          <button className="bigButton" onClick={handleSubmit}>
            Submit
          </button>
          <div className="relative">
            <Canvas
              lyricPlayMode={true}
              voice={null}
              tuner={null}
              songInfo={{ ...song, gap: startTime, videoId: parsedID }}
              startTime={startTime}
              width={1000}
              height={500}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SongTweak

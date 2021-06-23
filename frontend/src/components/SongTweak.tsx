import { useQuery, useMutation } from 'urql'
import { useParams, useHistory } from 'react-router-dom'
import { SongQuery } from '../graphql/queries'
import { UpdateVideoInfo } from '../graphql/mutations'
import { Song } from '../types/types'
import React, { useState } from 'react'
import YouTube from 'react-youtube'
import { useEffect } from 'react'

const SongTweak = () => {
  const [videoIdField, setVideoIdField] = useState('')
  const [isInvalid, setIsInvalid] = useState(false)
  const [player, setPlayer] = useState<any>()

  const [parsedID, setParsedID] = useState('')
  const [startTime, setStartTime] = useState<number | null>(null)

  const [updateTodoResult, updateVideoInfo] = useMutation(UpdateVideoInfo)

  console.log(updateTodoResult)

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
  const handleReady = (event: any) => {
    setPlayer(event.target)
  }

  const setTime = () => {
    const time = player.getCurrentTime()
    if (time) {
      setStartTime(time * 1000)
    }
  }

  const handleSubmit = () => {
    updateVideoInfo({ id, gap: startTime, videoId: parsedID }).then((res) => {
      console.log(res)
      history.push(`/song/${id}`)
    })
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
          <button onClick={handleSet}>Select link</button>
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
      ) : !startTime ? (
        <div>
          <button onClick={setTime}>Set start time</button>
          <YouTube
            videoId={song.videoId || parsedID}
            opts={{
              playerVars: {
                iv_load_policy: 3,
                modestbranding: 1,
                showinfo: 0,
                rel: 0,
              },
            }}
            onReady={handleReady}
          />
          <h3>Pause at the point the lyrics start at, an press the "Set start time" -button</h3>
          <h3>YouTube controls: </h3>
          Normal YouTube controls, just click on the timeline. <br />
          You can skip one frame forward or back with "," and "." or "{'<'}" and "{'>'}" <br />
          You can also change the video playback speed from the gear icon in the bottom right
          <br />
        </div>
      ) : (
        <div>
          <div>
            YouTube video ID: {parsedID} <button onClick={() => setParsedID('')}>Change</button>
          </div>
          <div>
            Start time: {(startTime / 1000).toFixed(3)}s
            <button onClick={() => setStartTime(null)}>Change</button>
          </div>
          <button onClick={handleSubmit}>Submit</button>
        </div>
      )}
    </div>
  )
}

export default SongTweak

import { useQuery, useMutation } from 'urql'
import { SongQuery } from '../graphql/queries'
import { UpdateVideoInfo } from '../graphql/mutations'
import { Song } from '../types/types'
import React, { useState } from 'react'
import { useEffect } from 'react'
import SyncPage from './SyncPage'
import { Switch, Route, Link, useParams, useHistory } from 'react-router-dom'

const SongTweakPage = () => {
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

  const handleSubmit = () => {
    updateVideoInfo({ id, gap: startTime, videoId: parsedID }).then(() => {
      history.push(`/song/${id}`)
    })
  }

  const handleTimeChange = (amount: number) => {
    setStartTime((startTime || 0) + amount * 1000)
  }

  const ytLink = `https://www.youtube.com/results?search_query=${song.artist.replaceAll(
    ' ',
    '+'
  )}+${song.title.replaceAll(' ', '+')}+official+music+video`

  if (!song.videoId && !parsedID) {
    history.push(`/tweak/${id}/videoId`)
    return null
  }

  const handleIdReset = () => {
    history.push(`/tweak/${id}/videoId`)
    setParsedID('')
  }

  return (
    <Switch>
      <Route path="/tweak/:id/videoId">
        <div>
          {isInvalid && <h2>INVALID ID</h2>}
          <input
            style={{ width: 500 }}
            placeholder="Paste YouTube link here (ex. https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
            onChange={handleChange}
            value={videoIdField}
          />
          <button className="bigButton" onClick={handleSet}>
            Select link
          </button>
          <p>
            <a target="_blank" rel="noreferrer" href={ytLink}>
              Youtube search for video: <br />
              <span style={{ textDecoration: 'underline' }}>{ytLink}</span>
            </a>
          </p>
        </div>
      </Route>
      <Route path="/tweak/:id/gap">
        <SyncPage
          startTime={startTime}
          handleTimeChange={handleTimeChange}
          song={song}
          parsedID={parsedID}
          id={id}
        />
      </Route>
      <Route path="/tweak/:id">
        <div>
          <h3>
            YouTube video ID: {parsedID}
            <button className="bigButton" onClick={handleIdReset}>
              Change
            </button>
          </h3>
          <h3>
            Vocals start at: {(startTime / 1000).toFixed(2)}s
            <Link to={`/tweak/${id}/gap`}>
              <button className="bigButton">Change</button>
            </Link>
          </h3>
          <br />
          <div>
            <button className="bigButton" onClick={handleSubmit}>
              Ready!
            </button>
          </div>
        </div>
      </Route>
    </Switch>
  )
}

export default SongTweakPage

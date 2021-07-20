import { useQuery } from 'urql'
import { useParams, useHistory } from 'react-router-dom'
import { SongQuery } from '../graphql/queries'
import { getWindowDimensions } from '../hooks/useWindowDimensions'
import Canvas from './Canvas'
import { Tuner } from '../types/types'
import { useState, useEffect } from 'react'
import SettingsPage from './SettingsPage'
import getAudioDevices from '../utils/getAudioDevices'
import { IoSettingsSharp } from 'react-icons/io5'
import Modal from './Modal'
const Wad = require('../utils/wad')

const KaraokePage = () => {
  const { id } = useParams<{ id: string }>()
  const history = useHistory()

  const [result] = useQuery({
    query: SongQuery,
    variables: { id },
  })

  const [allDevices, setAllDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceIds, setDeviceIds] = useState<string[]>([
    'disabled',
    'disabled',
    'disabled',
    'disabled',
  ])
  const [tuners, setTuners] = useState<Tuner[]>([])

  const allow = () => {
    setTuners(
      [...Array(4)].map(() => {
        const tuner = new Wad.Poly()
        tuner.setVolume(0)
        return tuner
      })
    )
  }

  const [settingsAreOpen, setSettingsAreOpen] = useState(false)

  const allowed = tuners.length !== 0

  useEffect(() => {
    if (deviceIds && allowed) {
      deviceIds.forEach((deviceId, i) => {
        if (deviceId && deviceId !== 'disabled') {
          const voice = new Wad({
            source: 'mic',
            deviceId,
          })
          const tuner = tuners[i]
          tuner.add(voice)
          setTuners((oldTuners) => {
            const newTuners = [...oldTuners]
            tuner.isEnabled = true
            newTuners[i] = tuner
            return newTuners
          })
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceIds, allowed])

  useEffect(() => {
    try {
      getAudioDevices({ setAllDevices, setDeviceIds })
    } catch (err) {
      console.error(err)
    }
  }, [setDeviceIds])

  const { data, fetching, error } = result

  if (fetching) return <p>Loading...</p>
  if (error) return <p>Oh no... {error.message}</p>

  if (!id) {
    history.push('/')
    return <span>No song selected</span>
  }

  const { width, height } = getWindowDimensions()

  return allowed ? (
    <>
      <button className="bigButton settingsButton" onClick={() => setSettingsAreOpen(true)}>
        <IoSettingsSharp size={30} />
      </button>
      <Modal isVisible={settingsAreOpen} setInvisible={() => setSettingsAreOpen(false)}>
        <SettingsPage setDeviceIds={setDeviceIds} deviceIds={deviceIds} allDevices={allDevices} />
      </Modal>
      <Canvas
        songInfo={data.getSong}
        width={width}
        height={height - 10}
        tuners={tuners}
        settingsAreOpen={settingsAreOpen}
      />
    </>
  ) : (
    <button onClick={allow}>Allow?</button>
  )
}

export default KaraokePage

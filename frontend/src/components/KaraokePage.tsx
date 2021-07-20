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
import Wad from '../Wad/main'

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

  const [settingsAreOpen, setSettingsAreOpen] = useState(false)

  const [tuners, setTuners] = useState<Tuner[]>(
    [...Array(4)].map(() => {
      //@ts-ignore
      const tuner = new Wad.Poly()
      tuner.setVolume(0)
      return tuner
    })
  )

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceIds])

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

  return (
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
  )
}

export default KaraokePage

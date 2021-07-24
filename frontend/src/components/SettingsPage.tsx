import { Settings } from '../types/types'
import DropDown from './DropDown'

interface props {
  setSettings: Function
  settings: Settings
  allDevices: MediaDeviceInfo[]
}

const SettingsPage = ({ setSettings, settings, allDevices }: props) => {
  const handlePlayerDeviceSet = (newId: string, i: number) => {
    setSettings((oldSettings: Settings) => {
      const playerSettings = oldSettings.playerSettings.map(
        ({ deviceId: oldId, ...otherFields }, i2) => ({
          deviceId: i === i2 ? newId : oldId,
          ...otherFields,
        })
      )
      return { ...oldSettings, playerSettings }
    })
  }

  const handlePlayerSetDifficulty = (newDifficulty: string, i: number) => {
    setSettings((oldSettings: Settings) => {
      const playerSettings = oldSettings.playerSettings.map(
        ({ difficulty: oldDifficulty, ...otherFields }, i2) => ({
          difficulty: i === i2 ? newDifficulty : oldDifficulty,
          ...otherFields,
        })
      )
      return { ...oldSettings, playerSettings }
    })
  }

  return (
    <div className="settingsPage">
      <div className="column margins">
        <h3>Microphones</h3>
        {[...Array(4)].map((_, i) => {
          return (
            <DropDown
              array={[
                { value: 'disabled', label: 'Disabled' },
                ...allDevices.map(({ deviceId, label }) => ({
                  value: deviceId,
                  label: label.replace(/\([\S]{4}:[\S]{4}\)/g, ''),
                })),
              ]}
              setValue={(newId: string) => handlePlayerDeviceSet(newId, i)}
              currentSelected={settings.playerSettings[i].deviceId}
              name={`Player ${i + 1}`}
              key={i}
            />
          )
        })}
      </div>
      <div className="column margins">
        <h3>Difficulty</h3>
        {[...Array(4)].map((_, i) => {
          return (
            <DropDown
              array={['Expert', 'Hard', 'Normal', 'Easy', 'Auto-Play'].map((item) => ({
                label: item,
                value: item,
              }))}
              setValue={(newId: string) => handlePlayerSetDifficulty(newId, i)}
              currentSelected={settings.playerSettings[i].difficulty}
              name={`Player ${i + 1}`}
              key={i}
            />
          )
        })}
      </div>
    </div>
  )
}

export default SettingsPage

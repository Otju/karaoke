import DropDown from './DropDown'

interface props {
  setDeviceIds: Function
  deviceIds: string[]
  allDevices: MediaDeviceInfo[]
}

const SettingsPage = ({ setDeviceIds, deviceIds, allDevices }: props) => {
  const handlePlayerDeviceSet = (newId: string, i: number) => {
    setDeviceIds((deviceIds: string[]) => deviceIds.map((oldId, i2) => (i === i2 ? newId : oldId)))
  }

  return (
    <div className="settingsPage">
      {[...Array(4)].map((_, i) => {
        return (
          <DropDown
            allDevices={allDevices}
            setPlayerDevice={(newId: string) => handlePlayerDeviceSet(newId, i)}
            currentSelected={deviceIds[i]}
            name={`Player ${i + 1} microphone`}
          />
        )
      })}
    </div>
  )
}

export default SettingsPage

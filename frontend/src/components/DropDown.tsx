interface props {
  allDevices: MediaDeviceInfo[]
  setPlayerDevice: (newId: string) => void
  currentSelected: string
  name: string
}

const DropDown = ({ allDevices, setPlayerDevice, currentSelected, name }: props) => {
  const handleChange = (event: React.FormEvent<HTMLSelectElement>) => {
    setPlayerDevice(event.currentTarget.value)
  }
  return (
    <label>
      {name}
      <select value={currentSelected} onChange={handleChange}>
        <option value={'disabled'}>Disabled</option>
        {allDevices.map(({ label, deviceId }) => (
          <option value={deviceId}>{label.replace(/\([\S]{4}:[\S]{4}\)/g, '')}</option>
        ))}
      </select>
    </label>
  )
}

export default DropDown

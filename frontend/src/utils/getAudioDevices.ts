interface props {
  setAllDevices: Function
  setDeviceIds: Function
  dontSetDefault?: boolean
}

const getAudioDevices = async ({ setAllDevices, setDeviceIds, dontSetDefault }: props) => {
  let devices = await navigator.mediaDevices.enumerateDevices()
  devices = devices.filter(
    (device) =>
      device.kind === 'audioinput' &&
      device.deviceId !== 'communications' &&
      device.deviceId !== 'default'
  )
  setAllDevices(devices)
  if (!dontSetDefault) {
    setDeviceIds(([_, ...oldDeviceIds]: string[]) => [devices[0].deviceId, ...oldDeviceIds])
  }
}
export default getAudioDevices

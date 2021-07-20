interface props {
  setAllDevices: Function
  setDeviceIds: Function
  dontSetDefault?: boolean
}

const getAudioDevices = async ({ setAllDevices, setDeviceIds, dontSetDefault }: props) => {
  await navigator.mediaDevices.getUserMedia({ audio: true })
  let devices = await navigator.mediaDevices.enumerateDevices()
  console.log(devices)
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

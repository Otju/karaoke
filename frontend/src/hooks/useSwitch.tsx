import { useState } from 'react'

const useSwitch = () => {
  const [value, setValue] = useState<boolean>(false)
  const handleClick = () => {
    setValue(!value)
  }
  const field = (
    <label className="switch">
      <input type="checkbox" onClick={handleClick} />
      <span className="slider"></span>
    </label>
  )
  return { value, setValue, field }
}

export default useSwitch

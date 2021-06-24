import { useState } from 'react'
import { IconType } from 'react-icons'

import CrossedIcon from '../components/CrossedIcon'

interface props {
  Icon: IconType
  defaultValue?: boolean
  color?: string
  tooltip?: string
  onClick?: Function
}

const useCheckBox = ({ Icon, defaultValue, color, tooltip, onClick }: props) => {
  const [value, setValue] = useState<boolean>(Boolean(defaultValue))
  const handleClick = () => {
    if (onClick) onClick()
    setValue(!value)
  }
  const field = (
    <button onClick={handleClick} className="invisibleButton" style={{ color }}>
      <CrossedIcon Icon={Icon} crossed={!value} tooltip={tooltip} />
    </button>
  )
  return { value, setValue, field }
}

export default useCheckBox

import { useState } from 'react'
import { IconType } from 'react-icons'

import CrossedIcon from '../components/CrossedIcon'

interface props {
  Icon: IconType
  defaultValue?: boolean
  color?: string
  tooltip?: string
}

const useCheckBox = ({ Icon, defaultValue, color, tooltip }: props) => {
  const [value, setValue] = useState<boolean>(Boolean(defaultValue))
  const field = (
    <button onClick={() => setValue(!value)} className="invisibleButton" style={{ color }}>
      <CrossedIcon Icon={Icon} crossed={!value} tooltip={tooltip} />
    </button>
  )
  return { value, setValue, field }
}

export default useCheckBox

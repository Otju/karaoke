import { IconType } from 'react-icons/lib'

interface IconProps {
  size?: number
  Icon: IconType
  tooltip?: string
  crossed?: boolean
}

const CrossedIcon = ({ size = 25, Icon, tooltip, crossed = true }: IconProps) => {
  return (
    <div className="noYt tooltipContainer">
      <svg height={size} width={size}>
        {<Icon size={size} />}
        {crossed && (
          <line
            x1="0"
            y1="0"
            x2={size}
            y2={size}
            style={{ stroke: 'rgb(0,0,0)', strokeWidth: 2 }}
          />
        )}
      </svg>
      {tooltip && <span className="tooltip">{tooltip}</span>}
    </div>
  )
}

export default CrossedIcon

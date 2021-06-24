import { useState, useRef } from 'react'
import { IconType } from 'react-icons'

interface props {
  Icon?: IconType
  placeholder?: string
  handleClick?: (value: string) => any
}

const useFocus = () => {
  const htmlElRef = useRef(null)
  const setFocus = () => {
    //@ts-ignore
    htmlElRef.current && htmlElRef.current.focus()
  }
  return [htmlElRef, setFocus]
}

const useInput = ({ placeholder, Icon, handleClick }: props) => {
  const [value, setValue] = useState('')
  const [inputRef, setInputFocus] = useFocus()
  const onClick = () => {
    if (handleClick) {
      handleClick(value)
      //@ts-ignore
      setInputFocus()
    }
  }
  const field = (
    <span className="inputContainer">
      <input
        type="text"
        className={Icon ? 'twoRounded' : 'allRounded'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={(event) => event.key === 'Enter' && onClick()}
        autoFocus
        ref={inputRef}
      />
      {Icon && (
        <button className="inputButton" onClick={onClick}>
          <Icon size={30} />
        </button>
      )}
    </span>
  )
  return { value, setValue, field }
}

export default useInput

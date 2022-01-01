import { getItem, LocalStorageName, setItem } from '../utils/localStorage'

const useSwitch = (localStorage: LocalStorageName) => {
  const handleClick = () => {
    const value = getItem(localStorage)
    setItem(localStorage, !value)
  }
  const field = (
    <label className="switch">
      <input type="checkbox" onClick={handleClick} defaultChecked={getItem(localStorage)} />
      <span className="slider"></span>
    </label>
  )
  return { getValue: () => getItem(localStorage), field }
}

export default useSwitch

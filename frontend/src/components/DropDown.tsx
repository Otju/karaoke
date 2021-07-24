interface DropDownInput {
  value: any
  label: string
}

interface props {
  array: DropDownInput[]
  setValue: (value: string) => void
  currentSelected: string
  name: string
}

const DropDown = ({ array, setValue, currentSelected, name }: props) => {
  const handleChange = (event: React.FormEvent<HTMLSelectElement>) => {
    setValue(event.currentTarget.value)
  }
  return (
    <label className="row dropwDown">
      {name}
      <select value={currentSelected} onChange={handleChange}>
        {array.map(({ value, label }) => {
          return (
            <option value={value} key={label}>
              {label}
            </option>
          )
        })}
      </select>
    </label>
  )
}

export default DropDown

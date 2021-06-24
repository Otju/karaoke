import { RiArrowGoBackLine, RiArrowGoForwardLine } from 'react-icons/ri'

interface props {
  amount: number
  onClick: (value: number) => void
}

const SkipButton = ({ amount, onClick }: props) => {
  const isBackward = amount < 0
  const style = isBackward ? { right: '40px' } : { left: '40px' }
  return (
    <button className="footerButton" onClick={() => onClick(amount)}>
      <div style={{ position: 'relative' }}>
        {isBackward ? <RiArrowGoBackLine size="45" /> : <RiArrowGoForwardLine size="45" />}
        <div className="skipText" style={style}>
          {amount}s
        </div>
      </div>
    </button>
  )
}

export default SkipButton

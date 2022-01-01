interface props {
  children: any
  isVisible: boolean
  setInvisible: () => void
}

const Modal = ({ children, setInvisible, isVisible }: props) => {
  return isVisible ? (
    <div className="modal">
      <div onClick={setInvisible} className="modalCloseDiv"></div>
      <div className="modal-content">{children}</div>
    </div>
  ) : null
}

export default Modal

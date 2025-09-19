import './Divider.css'

function Divider({ text }) {
  return (
    <div className="divider">
      <div className="divider-line"></div>
      <span className="divider-text">{text}</span>
      <div className="divider-line"></div>
    </div>
  )
}

export default Divider

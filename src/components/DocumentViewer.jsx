import './DocumentViewer.css'

function isPdf(url = '') {
  return /\.pdf($|\?)/i.test(url) || url.startsWith('data:application/pdf')
}
function isImage(url = '') {
  return /(\.png|\.jpe?g|\.gif|\.bmp|\.webp|\.svg)($|\?)/i.test(url) || url.startsWith('data:image')
}
function isVideo(url = '') {
  return /(\.mp4|\.mov|\.webm|\.ogg)($|\?)/i.test(url) || url.startsWith('data:video')
}
function isOffice(url = '') {
  return /(\.docx?|\.pptx?|\.xlsx?)($|\?)/i.test(url)
}

function DocumentViewer({ src, onClose }) {
  if (!src) return null
  const pdf = isPdf(src)
  const image = isImage(src)
  const video = isVideo(src)
  const office = isOffice(src)
  const officeViewer = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(src)}`

  return (
    <div className="dv-overlay" role="dialog" aria-modal="true">
      <div className="dv-card">
        <button className="dv-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="dv-body">
          {image && (
            <img src={src} alt="document" className="dv-image" />
          )}
          {video && (
            <video className="dv-video" src={src} controls />
          )}
          {pdf && (
            <iframe title="document" src={src} className="dv-frame" />
          )}
          {(!image && !video && !pdf) && (
            <iframe title="document" src={office ? officeViewer : src} className="dv-frame" />
          )}
        </div>
      </div>
    </div>
  )
}

export default DocumentViewer



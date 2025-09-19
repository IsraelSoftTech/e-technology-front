import './Analytics.css'

function Analytics({ totals = { Students: 0, Courses: 0, Classes: 0, Transactions: 0 } }) {
  const slices = [
    { key: 'Users', value: (totals.Users ?? 0), color: '#3757ff' },
    { key: 'Courses', value: (totals.Courses ?? 0), color: '#FE7235' },
    { key: 'Classes', value: (totals.Classes ?? 0), color: '#10b981' },
    { key: 'Transactions', value: (totals.Transactions ?? 0), color: '#f59e0b' },
  ]
  const total = slices.reduce((a,b)=> a + (b.value||0), 0)
  const w = 600, h = 260
  const cx = 160, cy = 130, r = 90

  const toArc = (startAngle, endAngle) => {
    const sx = cx + r * Math.cos(startAngle)
    const sy = cy + r * Math.sin(startAngle)
    const ex = cx + r * Math.cos(endAngle)
    const ey = cy + r * Math.sin(endAngle)
    const large = endAngle - startAngle > Math.PI ? 1 : 0
    return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`
  }

  let acc = -Math.PI / 2
  const arcs = total > 0 ? slices.map(s => {
    const angle = (s.value / total) * Math.PI * 2
    const d = toArc(acc, acc + angle)
    const mid = acc + angle / 2
    acc += angle
    return { ...s, d, mid }
  }) : []

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h3>Platform Analytics</h3>
        <p>Overview of key metrics</p>
      </div>
      <div className="chart" style={{ overflowX: 'auto' }}>
        <svg width={w} height={h} role="img" aria-label="Platform metrics distribution">
          {total === 0 ? (
            <g>
              <circle cx={cx} cy={cy} r={r} fill="#f3f4f6" />
              <text x={cx} y={cy} textAnchor="middle" fill="#6b7280">No data</text>
            </g>
          ) : (
            <g>
              {arcs.map(a => (
                <path key={a.key} d={a.d} fill={a.color} />
              ))}
              {arcs.map(a => {
                const lx = cx + (r + 16) * Math.cos(a.mid)
                const ly = cy + (r + 16) * Math.sin(a.mid)
                const pct = total ? Math.round((a.value / total) * 100) : 0
                return <text key={`t-${a.key}`} x={lx} y={ly} fontSize="10" fill="#111827" textAnchor={lx > cx ? 'start' : 'end'}>{pct}%</text>
              })}
            </g>
          )}
          <g transform={`translate(${cx + r + 60}, ${cy - 60})`} fill="#111827">
            {slices.map((s, idx) => (
              <g key={s.key} transform={`translate(0, ${idx * 22})`}>
                <rect width="12" height="12" fill={s.color} rx="2" />
                <text x="18" y="10" fontSize="12">{s.key}: {s.value}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  )
}

export default Analytics

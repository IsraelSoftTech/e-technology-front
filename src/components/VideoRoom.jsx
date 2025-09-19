import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SIGNAL_URL = (import.meta && import.meta.env && import.meta.env.VITE_SIGNAL_URL) || 'http://localhost:4000'

export default function VideoRoom({ roomId, user, role, onClose }){
  const socketRef = useRef(null)
  const myIdRef = useRef(null)
  const localVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const peersRef = useRef({}) // id -> { pc, stream, name }

  const [participants, setParticipants] = useState({}) // id -> { stream, name }
  const [chat, setChat] = useState([])
  const seenMsgIdsRef = useRef(new Set())
  const [msg, setMsg] = useState('')
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

  const displayName = (user && (user.username || user.name || user.email)) || 'Me'

  const addParticipant = (id, data) => {
    setParticipants(prev => ({ ...prev, [id]: { ...(prev[id]||{}), ...data } }))
  }
  const removeParticipant = (id) => {
    setParticipants(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  const getLocalMedia = async () => {
    try { return await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true }) } catch { /* ignore */ }
    return await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  }

  const createPC = (remoteId) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    pc.onicecandidate = (e) => {
      if (e.candidate) socketRef.current?.emit('ice-candidate', { to: remoteId, candidate: e.candidate, roomId })
    }
    pc.ontrack = (ev) => {
      const stream = ev.streams[0]
      peersRef.current[remoteId] = peersRef.current[remoteId] || { pc, stream: null, name: participants[remoteId]?.name }
      peersRef.current[remoteId].stream = stream
      addParticipant(remoteId, { stream })
    }
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current))
    return pc
  }

  useEffect(()=>{
    (async()=>{
      const local = await getLocalMedia()
      localStreamRef.current = local
      if (localVideoRef.current) localVideoRef.current.srcObject = local

      const socket = io(SIGNAL_URL, { transports: ['websocket'] })
      socketRef.current = socket

      socket.on('connect', ()=>{
        myIdRef.current = socket.id
        socket.emit('join-room', { roomId, userId: user?.id, role })
        socket.emit('broadcast', { roomId, event: 'meta', payload: { name: displayName } })
        socket.emit('who', { roomId })
      })

      socket.on('room-users', async ({ peers }) => {
        const others = (peers||[]).filter(id => id && id !== myIdRef.current)
        // prune participants and peer refs to present set
        const present = new Set(others)
        setParticipants(prev => {
          const next = {}
          for (const id of Object.keys(prev)) if (present.has(id)) next[id] = prev[id]
          return next
        })
        Object.keys(peersRef.current).forEach(id => { if (!present.has(id)) { try{ peersRef.current[id].pc?.close() }catch{ /* ignore */ } delete peersRef.current[id] } })
        for (const id of others) {
          if (peersRef.current[id]) continue
          const pc = createPC(id)
          peersRef.current[id] = { ...(peersRef.current[id]||{}), pc }
          addParticipant(id, { stream: null })
          const offer = await pc.createOffer(); await pc.setLocalDescription(offer)
          socket.emit('offer', { to: id, description: offer, roomId })
        }
      })

      socket.on('user-joined', async ({ socketId }) => {
        if (!socketId || socketId === myIdRef.current || peersRef.current[socketId]) return
        const pc = createPC(socketId)
        peersRef.current[socketId] = { pc, stream: null }
        addParticipant(socketId, { stream: null })
        const offer = await pc.createOffer(); await pc.setLocalDescription(offer)
        socket.emit('offer', { to: socketId, description: offer, roomId })
      })

      socket.on('offer', async ({ from, description }) => {
        if (!from || from === myIdRef.current) return
        let pc = peersRef.current[from]?.pc
        if (!pc) { pc = createPC(from); peersRef.current[from] = { ...(peersRef.current[from]||{}), pc } }
        await pc.setRemoteDescription(new RTCSessionDescription(description))
        const answer = await pc.createAnswer(); await pc.setLocalDescription(answer)
        socket.emit('answer', { to: from, description: answer, roomId })
      })

      socket.on('answer', async ({ from, description }) => {
        const pc = peersRef.current[from]?.pc
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(description))
      })

      socket.on('ice-candidate', async ({ from, candidate }) => {
        const pc = peersRef.current[from]?.pc
        if (pc && candidate) try{ await pc.addIceCandidate(new RTCIceCandidate(candidate)) }catch { /* ignore */ }
      })

      socket.on('broadcast', ({ event, payload, from }) => {
        if (event === 'meta' && payload?.name && from !== myIdRef.current) addParticipant(from, { name: payload.name })
        if (event === 'chat' && payload?.text) {
          const mid = payload.id || `${from}-${payload.text}-${Date.now()}`
          if (seenMsgIdsRef.current.has(mid)) return
          seenMsgIdsRef.current.add(mid)
          setChat(prev => [...prev, { id: mid, user: payload.user || participants[from]?.name || 'User', text: payload.text }])
        }
        if (event === 'presence') {
          const ids = (payload?.ids || []).filter(id => id && id !== myIdRef.current)
          const present = new Set(ids)
          // prune participants not present
          setParticipants(prev => {
            const next = {}
            for (const id of ids) if (prev[id]) next[id] = prev[id]
            return next
          })
          // prune peers
          Object.keys(peersRef.current).forEach(id => { if (!present.has(id)) { try{ peersRef.current[id].pc?.close() }catch { /* ignore */ } delete peersRef.current[id] } })
        }
      })

      socket.on('user-left', ({ socketId }) => {
        const entry = peersRef.current[socketId]
        if (entry?.pc) entry.pc.close()
        delete peersRef.current[socketId]
        removeParticipant(socketId)
      })

      socket.on('kicked', ({ roomId: rid }) => { if (rid === roomId) onClose && onClose() })
    })()

    return () => {
      const peersSnapshot = { ...peersRef.current }
      try{
        const s = socketRef.current
        if (s){ s.emit('leave-room', { roomId }); s.removeAllListeners(); s.disconnect() }
        Object.values(peersSnapshot).forEach(p => p.pc?.close())
        localStreamRef.current?.getTracks().forEach(t => t.stop())
      }catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const toggleMic = () => {
    const next = !micOn; setMicOn(next)
    localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = next)
  }
  const toggleCam = () => {
    const next = !camOn; setCamOn(next)
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = next)
  }
  const shareScreen = async () => {
    try{
      const disp = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const track = disp.getVideoTracks()[0]
      for (const entry of Object.values(peersRef.current)){
        const sender = entry.pc.getSenders().find(s => s.track && s.track.kind === 'video')
        if (sender) await sender.replaceTrack(track)
      }
      track.onended = async () => {
        const cam = localStreamRef.current?.getVideoTracks()[0]
        if (!cam) return
        for (const entry of Object.values(peersRef.current)){
          const sender = entry.pc.getSenders().find(s => s.track && s.track.kind === 'video')
          if (sender) await sender.replaceTrack(cam)
        }
      }
    }catch { /* ignore */ }
  }
  const sendChat = () => {
    const text = msg.trim(); if (!text) return
    const id = `${myIdRef.current || 'me'}-${Date.now()}`
    seenMsgIdsRef.current.add(id)
    setChat(prev => [...prev, { id, user: 'You', text }])
    socketRef.current?.emit('broadcast', { roomId, event: 'chat', payload: { id, text, user: displayName } })
    setMsg('')
  }
  const kick = (id) => { if (role === 'teacher') socketRef.current?.emit('kick-user', { roomId, targetId: id }) }

  const liveIds = Object.keys(participants).filter(id => {
    const p = participants[id]
    const s = p && p.stream
    if (!s || typeof s.getVideoTracks !== 'function') return false
    const vt = s.getVideoTracks()
    return vt && vt.some(t => t.readyState === 'live' && t.enabled)
  })
  const peopleCount = 1 + liveIds.length

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card" style={{ width:'96vw', height:'90vh', maxWidth:'1400px' }}>
        <div className="modal-title" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>Class Room</div>
          <div>
            <button className="modal-btn" onClick={toggleMic}>{micOn ? 'Mute' : 'Unmute'}</button>
            <button className="modal-btn" onClick={toggleCam} style={{ marginLeft: '.5rem' }}>{camOn ? 'Hide Video' : 'Show Video'}</button>
            <button className="modal-btn" onClick={shareScreen} style={{ marginLeft: '.5rem' }}>Share Screen</button>
            <button className="modal-btn danger" onClick={onClose} style={{ marginLeft: '.5rem' }}>Close</button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1rem', height:'calc(90vh - 56px)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', alignContent:'start', gap:'.75rem', overflow:'auto', background:'#0b0f19', padding:'.75rem', borderRadius:'8px' }}>
            <div style={{ position:'relative' }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width:'100%', background:'#111827', borderRadius:'6px' }}></video>
              <div style={{ position:'absolute', left:8, bottom:8, background:'rgba(0,0,0,.6)', color:'#fff', padding:'2px 6px', borderRadius:4, fontSize:12 }}>{displayName} (You)</div>
            </div>
            {liveIds.map(id => (
              <div key={id} style={{ position:'relative' }}>
                <video autoPlay playsInline style={{ width:'100%', background:'#111827', borderRadius:'6px' }} ref={el => { const p = participants[id]; if (el && p && p.stream) el.srcObject = p.stream }}></video>
                <div style={{ position:'absolute', left:8, bottom:8, background:'rgba(0,0,0,.6)', color:'#fff', padding:'2px 6px', borderRadius:4, fontSize:12 }}>{participants[id].name || ''}</div>
                {role==='teacher' && (
                  <button className="modal-btn danger" onClick={()=> kick(id)} style={{ position:'absolute', right:8, top:8 }}>Remove</button>
                )}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <div style={{ fontWeight:600, marginBottom:'.5rem' }}>{`People (${peopleCount})`}</div>
            <div style={{ flex:1, overflow:'auto', border:'1px solid #e5e7eb', borderRadius:8, padding:'.5rem', marginBottom:'.5rem' }}>
              <div style={{ marginBottom:'.25rem' }}><strong>{displayName}</strong> (You)</div>
              {liveIds.map(id => (<div key={id} style={{ marginBottom:'.25rem' }}>{participants[id].name || ''}</div>))}
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
              <div style={{ fontWeight:600, marginBottom:'.25rem' }}>Chat</div>
              <div style={{ flex:1, overflow:'auto', border:'1px solid #e5e7eb', borderRadius:8, padding:'.5rem' }}>
                {chat.map((c, i) => (
                  <div key={i} style={{ marginBottom:4 }}>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{c.user}</div>
                    <div>{c.text}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', marginTop:'.5rem' }}>
                <input value={msg} onChange={(e)=> setMsg(e.target.value)} placeholder="Type a message" style={{ flex:1 }} />
                <button className="modal-btn primary" onClick={sendChat} style={{ marginLeft:'.5rem' }}>Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

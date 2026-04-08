// hooks/useSocket.js
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useDispatch } from 'react-redux'
import { pushEvent, setConnected } from '../store/wafSlice'

let socket = null

export function useSocket() {
  const dispatch = useDispatch()

  useEffect(() => {
    socket = io('http://localhost:4000', { transports: ['websocket'] })

    socket.on('connect', () => {
      dispatch(setConnected(true))
    })

    socket.on('disconnect', () => {
      dispatch(setConnected(false))
    })

    socket.on('waf:event', (event) => {
      dispatch(pushEvent(event))
    })

    return () => {
      socket?.disconnect()
      dispatch(setConnected(false))
    }
  }, [dispatch])
}

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket'
import api from '../utils/api'
import Swal from 'sweetalert2'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pump_user')) } catch { return null }
  })
  const [notifications, setNotifications] = useState([])
  const [bookingAlert, setBookingAlert] = useState(null)

  const dismissBookingAlert = useCallback(() => setBookingAlert(null), [])
  const acceptBookingAlert  = useCallback(() => setBookingAlert(null), [])

  useEffect(() => {
    if (!user?.id) return

    const attachListeners = () => {
      const socket = getSocket()
      if (!socket) return

      socket.off('new_booking')
      socket.off('booking_cancelled')
      socket.off('booking_taken')
      socket.off('job_completed_admin')

      socket.on('job_completed_admin', (data) => {
        if (data.trialMessage) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Job Completed',
            text: data.trialMessage,
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
          })
        }
      })

      socket.on('new_booking', (data) => {
        // Popup alert set karo (sound popup mein bajegi)
        setBookingAlert({
          bookingId:    data.bookingId,
          customerName: data.customerName || 'Customer',
          address:      data.address || '',
          serviceType:  data.serviceType || 'fuel',
          fuelType:     data.fuelType || null,
          quantity:     data.quantity || null,
          amount:       data.amount || 0,
        })

        // Notification bell mein bhi add karo
        setNotifications(prev => [{
          id: Date.now(),
          type: 'new_booking',
          title: 'New Booking!',
          message: `${data.customerName} requested ${data.serviceType} service`,
          bookingId: data.bookingId,
          time: new Date(),
          read: false,
        }, ...prev])
      })

      socket.on('booking_cancelled', (data) => {
        setNotifications(prev => [{
          id: Date.now(),
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          message: 'A booking was cancelled',
          bookingId: data.bookingId,
          time: new Date(),
          read: false,
        }, ...prev])
      })

      socket.on('booking_taken', (data) => {
        setNotifications(prev =>
          prev.filter((n) => n.bookingId?.toString() !== data.bookingId?.toString())
        )
        // Agar same booking ka alert open hai toh dismiss karo
        setBookingAlert(prev =>
          prev?.bookingId?.toString() === data.bookingId?.toString() ? null : prev
        )
      })
    }

    connectSocket(user.id, attachListeners)

    const existing = getSocket()
    if (existing?.connected) attachListeners()

    return () => {
      const socket = getSocket()
      if (socket) {
        socket.off('new_booking')
        socket.off('booking_cancelled')
        socket.off('booking_taken')
        socket.off('job_completed_admin')
      }
      disconnectSocket()
    }
  }, [user?.id])

  const login = (token, userData) => {
    localStorage.setItem('pump_token', token)
    localStorage.setItem('pump_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    disconnectSocket()
    localStorage.removeItem('pump_token')
    localStorage.removeItem('pump_user')
    setUser(null)
  }

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      notifications, unreadCount, markAllRead,
      bookingAlert, dismissBookingAlert, acceptBookingAlert,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaGasPump, FaWrench, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaUser } from 'react-icons/fa'
import { MdAccessTime } from 'react-icons/md'

export default function BookingAlertPopup() {
  const { bookingAlert, dismissBookingAlert, acceptBookingAlert } = useAuth()
  const navigate = useNavigate()
  const audioRef = useRef(null)

  useEffect(() => {
    if (!bookingAlert) return

    try {
      const audio = new Audio('/sound/booking.wav')
      audio.loop = true
      audio.play().catch((err) => {
        console.warn("Audio play blocked (likely browser autoplay policy):", err)
      })
      audioRef.current = audio
    } catch {}

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [bookingAlert])

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  const handleAccept = () => {
    stopSound()
    acceptBookingAlert()
    navigate('/bookings')
  }

  const handleDismiss = () => {
    stopSound()
    dismissBookingAlert()
  }

  if (!bookingAlert) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />

      <div className="fixed bottom-0 left-0 right-0 z-[101] animate-slide-up">
        <div className="bg-white rounded-t-[2rem] shadow-2xl overflow-hidden">
          {/* Pulse bar */}
          <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 animate-pulse" />

          <div className="flex justify-center pt-4 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Icon */}
          <div className="flex flex-col items-center px-5 pt-3 pb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-300/50 mb-3 animate-bounce">
              {bookingAlert.serviceType === 'fuel'
                ? <FaGasPump className="text-white text-2xl" />
                : <FaWrench className="text-white text-2xl" />}
            </div>
            <p className="text-gray-900 font-black text-base">New Booking Request!</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {bookingAlert.serviceType === 'fuel' ? 'Fuel delivery requested' : 'Mechanic service requested'}
            </p>
          </div>

          {/* Details */}
          <div className="mx-5 mb-4 bg-gray-50 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <FaUser className="text-orange-500 text-xs" />
              </div>
              <div>
                <p className="text-gray-400 text-[9px] uppercase tracking-wider">Customer</p>
                <p className="text-gray-900 font-bold text-xs">{bookingAlert.customerName}</p>
              </div>
            </div>

            {bookingAlert.serviceType === 'fuel' && bookingAlert.fuelType && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <FaGasPump className="text-amber-500 text-xs" />
                </div>
                <div>
                  <p className="text-gray-400 text-[9px] uppercase tracking-wider">Fuel</p>
                  <p className="text-gray-900 font-bold text-xs capitalize">
                    {bookingAlert.fuelType} · {bookingAlert.quantity}L
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaMapMarkerAlt className="text-red-500 text-xs" />
              </div>
              <div>
                <p className="text-gray-400 text-[9px] uppercase tracking-wider">Location</p>
                <p className="text-gray-700 text-xs leading-relaxed">{bookingAlert.address || 'Location shared'}</p>
              </div>
            </div>

            {bookingAlert.amount > 0 && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 text-xs font-black">₹</span>
                </div>
                <div>
                  <p className="text-gray-400 text-[9px] uppercase tracking-wider">Amount</p>
                  <p className="text-gray-900 font-black text-sm">₹{bookingAlert.amount}</p>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 px-5 pb-8">
            <button onClick={handleDismiss}
              className="flex-1 py-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-500 font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <FaTimesCircle className="text-base" /> Dismiss
            </button>
            <button onClick={handleAccept}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-300/50 active:scale-95 transition-transform">
              <FaCheckCircle className="text-base" /> View Booking
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

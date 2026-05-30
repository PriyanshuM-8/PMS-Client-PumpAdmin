import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  MdDashboard, MdBookmarks, MdPeople, MdPerson, MdLogout,
  MdNotifications, MdClose, MdLocalGasStation, MdBuild, MdAccountBalanceWallet, MdDeliveryDining
} from 'react-icons/md'
import logo from '/Images/Logo.png'

const links = [
  { to: '/',               Icon: MdDashboard,            label: 'Dashboard' },
  { to: '/bookings',       Icon: MdBookmarks,            label: 'Bookings' },
  { to: '/customers',      Icon: MdPeople,               label: 'Customers' },
  { to: '/delivery-boys',  Icon: MdDeliveryDining,       label: 'Delivery Boys' },
  { to: '/profile',        Icon: MdLocalGasStation,      label: 'Pump Profile' },
  { to: '/wallet',         Icon: MdAccountBalanceWallet, label: 'Wallet' },
]

export default function Sidebar() {
  const { user, logout, notifications, unreadCount, markAllRead } = useAuth()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)

  const handleBellClick = () => {
    setShowNotif(prev => !prev)
    if (!showNotif) markAllRead()
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-white border-r border-gray-100 shadow-sm flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-9 rounded-xl  flex items-center justify-center  overflow-hidden">
              <img src={logo} alt="logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-gray-900 font-black text-sm leading-tight">PumpAdmin</p>
              <p className="text-orange-400 text-[9px] font-semibold">Management Panel</p>
            </div>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button onClick={handleBellClick}
              className="relative w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-orange-50 hover:border-orange-200 transition">
              <MdNotifications className="text-gray-500 text-base" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute left-0 top-10 w-72 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <p className="text-gray-800 font-bold text-xs">Notifications</p>
                  <button onClick={() => setShowNotif(false)}
                    className="text-gray-400 hover:text-gray-600">
                    <MdClose className="text-sm" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-center text-gray-300 text-xs py-6">No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <button key={n.id}
                        onClick={() => { navigate('/bookings'); setShowNotif(false) }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-orange-50 transition border-b border-gray-50 last:border-0 text-left">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${n.type === 'new_booking' ? 'bg-orange-100' : 'bg-red-100'}`}>
                          {n.type === 'new_booking'
                            ? <MdBookmarks className="text-orange-500 text-sm" />
                            : <MdClose className="text-red-500 text-sm" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-bold text-xs">{n.title}</p>
                          <p className="text-gray-400 text-[10px] mt-0.5 truncate">{n.message}</p>
                          <p className="text-gray-300 text-[9px] mt-0.5">
                            {n.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md shadow-orange-200/60'
                  : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'
              }`
            }>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/60 rounded-r-full" />}
                <Icon className="text-base w-5 flex-shrink-0" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile */}
      <div className="px-3 py-4 border-t border-gray-50">
        <div className="bg-gradient-to-tr from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-gray-800 text-xs font-bold truncate">{user?.name || 'Pump Admin'}</p>
              <p className="text-orange-400 text-[9px] font-semibold truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 text-xs font-bold transition border border-transparent hover:border-red-100">
          <MdLogout className="text-sm" /> Logout
        </button>
      </div>
    </aside>
  )
}

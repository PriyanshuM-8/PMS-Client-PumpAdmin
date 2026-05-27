import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Bookings from './pages/Bookings'
import Customers from './pages/Customers'
import Profile from './pages/Profile'
import Wallet from './pages/Wallet'
import DeliveryBoys from './pages/DeliveryBoys'
import BookingAlertPopup from './components/BookingAlertPopup'

function Layout() {
  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar />
      <main className="flex-1 ml-56 p-6 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/delivery-boys" element={<DeliveryBoys />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BookingAlertPopup />
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/*" element={user ? <Layout /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

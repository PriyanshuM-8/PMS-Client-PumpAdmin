import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pump_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 401 sirf tab reload karo jab token expire ho (user logged in tha)
    // Login page pe 401 aana normal hai — reload mat karo
    const isLoginRoute = err.config?.url?.includes('/auth/login') ||
                         err.config?.url?.includes('/auth/verify-otp')
    if (err.response?.status === 401 && !isLoginRoute) {
      localStorage.removeItem('pump_token')
      localStorage.removeItem('pump_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

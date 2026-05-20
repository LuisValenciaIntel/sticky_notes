import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import ChangePasswordPage from './pages/ChangePasswordPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

// app-level state machine: 'login' | 'change_password' | 'dashboard'
export default function App() {
  const [page, setPage] = useState('login')
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  useEffect(() => {
    if (!token) {
      setPage('login')
      return
    }
    // Verify token and check must_change_password flag
    fetch('/api/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('unauthorized')
        return r.json()
      })
      .then((user) => {
        setPage(user.must_change_password ? 'change_password' : 'dashboard')
      })
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
        setPage('login')
      })
  }, [token])

  function handleLoginSuccess(newToken, mustChange) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setPage(mustChange ? 'change_password' : 'dashboard')
  }

  function handlePasswordChanged() {
    setPage('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
    setPage('login')
  }

  if (page === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  if (page === 'change_password') {
    return <ChangePasswordPage token={token} onPasswordChanged={handlePasswordChanged} onLogout={handleLogout} />
  }

  return <DashboardPage token={token} onLogout={handleLogout} />
}

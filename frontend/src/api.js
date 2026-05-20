// Thin wrapper around fetch for API calls.
// All requests go through /api (proxied by Vite to http://localhost:8000).

export async function apiLogin(username, password) {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Login failed')
  return data // { access_token, token_type, must_change_password }
}

export async function apiMe(token) {
  const res = await fetch('/api/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch user')
  return data
}

export async function apiChangePassword(token, currentPassword, newPassword) {
  const res = await fetch('/api/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to change password')
  return data
}

export async function apiCreateNote(token, { title, content, color }) {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content, color }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to create note')
  return data
}

export async function apiCreateUser(token, { username, password }) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to create user')
  return data
}

export async function apiSearchNotes(token, search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}` : ''
  const res = await fetch(`/api/notes${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch notes')
  return data
}

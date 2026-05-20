import { useState, useEffect } from 'react'
import { apiSearchNotes, apiCreateNote, apiMe, apiCreateUser } from '../api.js'

const NOTE_COLORS = [
  { label: 'Yellow', value: '#fff7a8' },
  { label: 'Green', value: '#b8f5b0' },
  { label: 'Blue', value: '#b0d8f5' },
  { label: 'Pink', value: '#f5b0d0' },
  { label: 'Orange', value: '#ffd6a0' },
  { label: 'Purple', value: '#dab0f5' },
]

export default function DashboardPage({ token, onLogout }) {
  const [username, setUsername] = useState('')
  const [isTestUser, setIsTestUser] = useState(false)
  const [activePanel, setActivePanel] = useState(null) // 'search' | 'create' | null

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // Create state
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteColor, setNoteColor] = useState('#fff7a8')
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // User-management state for the seeded test account only
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [userCreateError, setUserCreateError] = useState('')
  const [userCreateSuccess, setUserCreateSuccess] = useState('')
  const [userCreateLoading, setUserCreateLoading] = useState(false)

  useEffect(() => {
    apiMe(token)
      .then((u) => {
        setUsername(u.username)
        setIsTestUser(u.username === 'test')
      })
      .catch(() => {})
  }, [token])

  // Search
  async function handleSearch(e) {
    e.preventDefault()
    setSearchError('')
    setSearchLoading(true)
    setHasSearched(true)
    try {
      const notes = await apiSearchNotes(token, searchQuery)
      setSearchResults(notes)
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearchLoading(false)
    }
  }

  function handleClearSearch() {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    setSearchError('')
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    setUserCreateError('')
    setUserCreateSuccess('')
    setUserCreateLoading(true)
    try {
      await apiCreateUser(token, { username: newUsername, password: newPassword })
      setUserCreateSuccess('User created successfully. They must change password on first login.')
      setNewUsername('')
      setNewPassword('')
    } catch (err) {
      setUserCreateError(err.message)
    } finally {
      setUserCreateLoading(false)
    }
  }

  // Create
  async function handleCreateNote(e) {
    e.preventDefault()
    setCreateError('')
    setCreateSuccess('')
    setCreateLoading(true)
    try {
      await apiCreateNote(token, { title: noteTitle, content: noteContent, color: noteColor })
      setCreateSuccess('Note created successfully!')
      setNoteTitle('')
      setNoteContent('')
      setNoteColor('#fff7a8')
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreateLoading(false)
    }
  }

  function formatDate(isoStr) {
    return new Date(isoStr).toLocaleString()
  }

  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-brand">
          <span className="header-logo">📝</span>
          <span className="header-title">Sticky Notes</span>
        </div>
        <div className="header-user">
          <span className="header-username">👤 {username}</span>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard cards */}
      <main className="dashboard-main">
        <h2 className="dashboard-greeting">Welcome back, {username}!</h2>
        <p className="dashboard-subtitle">What would you like to do?</p>

        <div className="cards-grid">
          {/* Search Card */}
          <div
            className={`dashboard-card ${activePanel === 'search' ? 'card-active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'search' ? null : 'search')}
          >
            <div className="card-icon">🔍</div>
            <h3 className="card-title">Search Notes</h3>
            <p className="card-description">Find notes by title or content</p>
          </div>

          {/* Create Card */}
          <div
            className={`dashboard-card ${activePanel === 'create' ? 'card-active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'create' ? null : 'create')}
          >
            <div className="card-icon">✏️</div>
            <h3 className="card-title">Create Note</h3>
            <p className="card-description">Add a new sticky note</p>
          </div>

          {isTestUser && (
            <div
              className={`dashboard-card ${activePanel === 'users' ? 'card-active' : ''}`}
              onClick={() => setActivePanel(activePanel === 'users' ? null : 'users')}
            >
              <div className="card-icon">👥</div>
              <h3 className="card-title">Create Users</h3>
              <p className="card-description">Admin view for the test account</p>
            </div>
          )}
        </div>

        {/* Search Panel */}
        {activePanel === 'search' && (
          <section className="panel">
            <div className="panel-header">
              <h3>Search Notes</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setActivePanel(null)}>✕</button>
            </div>

            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or content…"
                className="search-input"
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={searchLoading}>
                {searchLoading ? 'Searching…' : 'Search'}
              </button>
              {hasSearched && (
                <button type="button" className="btn btn-ghost" onClick={handleClearSearch}>
                  Clear
                </button>
              )}
            </form>

            {searchError && <div className="alert alert-error">{searchError}</div>}

            {hasSearched && !searchLoading && (
              <div className="search-results">
                {searchResults.length === 0 ? (
                  <p className="empty-state">No notes found.</p>
                ) : (
                  <div className="notes-grid">
                    {searchResults.map((note) => (
                      <div
                        key={note.id}
                        className="note-card"
                        style={{ backgroundColor: note.color }}
                      >
                        <h4 className="note-title">{note.title}</h4>
                        <p className="note-content">{note.content}</p>
                        <span className="note-date">{formatDate(note.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Create Panel */}
        {activePanel === 'create' && (
          <section className="panel">
            <div className="panel-header">
              <h3>Create Note</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setActivePanel(null)}>✕</button>
            </div>

            <form onSubmit={handleCreateNote} className="create-form">
              <div className="form-group">
                <label htmlFor="noteTitle">Title</label>
                <input
                  id="noteTitle"
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="noteContent">Content</label>
                <textarea
                  id="noteContent"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write your note here…"
                  rows={5}
                  required
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`color-swatch ${noteColor === c.value ? 'color-swatch-selected' : ''}`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                      onClick={() => setNoteColor(c.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Live preview */}
              <div className="note-preview" style={{ backgroundColor: noteColor }}>
                <strong>{noteTitle || 'Note title'}</strong>
                <p>{noteContent || 'Note content preview…'}</p>
              </div>

              {createError && <div className="alert alert-error">{createError}</div>}
              {createSuccess && <div className="alert alert-success">{createSuccess}</div>}

              <button type="submit" className="btn btn-primary" disabled={createLoading}>
                {createLoading ? 'Saving…' : 'Save Note'}
              </button>
            </form>
          </section>
        )}

        {activePanel === 'users' && isTestUser && (
          <section className="panel">
            <div className="panel-header">
              <h3>Create Users</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setActivePanel(null)}>✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="create-form">
              <div className="form-group">
                <label htmlFor="newUsername">Username</label>
                <input
                  id="newUsername"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="New username"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Temporary password"
                  required
                />
              </div>

              {userCreateError && <div className="alert alert-error">{userCreateError}</div>}
              {userCreateSuccess && <div className="alert alert-success">{userCreateSuccess}</div>}

              <button type="submit" className="btn btn-primary" disabled={userCreateLoading}>
                {userCreateLoading ? 'Creating…' : 'Create User'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

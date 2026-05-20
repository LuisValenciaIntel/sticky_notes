import { useEffect, useState } from 'react'
import {
  apiSearchNotes,
  apiCreateNote,
  apiMe,
  apiCreateUser,
  apiUpdateNote,
  apiDeleteNote,
} from '../api.js'

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
  const [activePanel, setActivePanel] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showAllNotes, setShowAllNotes] = useState(true)

  const [selectedNote, setSelectedNote] = useState(null)
  const [modalTitle, setModalTitle] = useState('')
  const [modalContent, setModalContent] = useState('')
  const [modalColor, setModalColor] = useState('#fff7a8')
  const [modalError, setModalError] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteColor, setNoteColor] = useState('#fff7a8')
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [userCreateError, setUserCreateError] = useState('')
  const [userCreateSuccess, setUserCreateSuccess] = useState('')
  const [userCreateLoading, setUserCreateLoading] = useState(false)

  async function loadNotes(search = '') {
    setSearchError('')
    setSearchLoading(true)
    try {
      const notes = await apiSearchNotes(token, search)
      setSearchResults(notes)
      setShowAllNotes(!search)
    } catch (err) {
      setSearchError(err.message)
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    apiMe(token)
      .then((u) => {
        setUsername(u.username)
        setIsTestUser(u.username === 'test')
      })
      .catch(() => {})
  }, [token])

  useEffect(() => {
    loadNotes('')
  }, [token])

  async function handleSearch(e) {
    e.preventDefault()
    await loadNotes(searchQuery)
  }

  function handleClearSearch() {
    setSearchQuery('')
    loadNotes('')
  }

  function openNoteModal(note) {
    setSelectedNote(note)
    setModalTitle(note.title)
    setModalContent(note.content)
    setModalColor(note.color)
    setModalError('')
    setModalLoading(false)
    setDeleteLoading(false)
  }

  function closeNoteModal() {
    setSelectedNote(null)
    setModalError('')
    setModalLoading(false)
    setDeleteLoading(false)
  }

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
      loadNotes(searchQuery)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreateLoading(false)
    }
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

  async function handleSaveNote() {
    if (!selectedNote) return
    setModalError('')
    setModalLoading(true)
    try {
      const updated = await apiUpdateNote(token, selectedNote.id, {
        title: modalTitle,
        content: modalContent,
        color: modalColor,
      })
      setSearchResults((prev) => prev.map((note) => (note.id === updated.id ? updated : note)))
      setSelectedNote(updated)
    } catch (err) {
      setModalError(err.message)
    } finally {
      setModalLoading(false)
    }
  }

  async function handleDeleteNote() {
    if (!selectedNote) return
    setModalError('')
    setDeleteLoading(true)
    try {
      await apiDeleteNote(token, selectedNote.id)
      setSearchResults((prev) => prev.filter((note) => note.id !== selectedNote.id))
      closeNoteModal()
    } catch (err) {
      setModalError(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  function formatDate(isoStr) {
    return new Date(isoStr).toLocaleString()
  }

  return (
    <div className="dashboard-wrapper">
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

      <main className="dashboard-main">
        <h2 className="dashboard-greeting">Welcome back, {username}!</h2>
        <p className="dashboard-subtitle">What would you like to do?</p>

        <div className="cards-grid">
          <div
            className={`dashboard-card ${activePanel === 'search' ? 'card-active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'search' ? null : 'search')}
          >
            <div className="card-icon">🔍</div>
            <h3 className="card-title">Search Notes</h3>
            <p className="card-description">Find notes by title or content</p>
          </div>

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

        {activePanel === 'search' && (
          <section className="panel">
            <div className="panel-header">
              <h3>Search Notes</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setActivePanel(null)}>
                ✕
              </button>
            </div>

            {showAllNotes && !searchLoading && !searchQuery && (
              <div className="search-hint">Showing all notes. Use search to filter results.</div>
            )}

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
              <button type="button" className="btn btn-ghost" onClick={handleClearSearch}>
                Show All
              </button>
            </form>

            {searchError && <div className="alert alert-error">{searchError}</div>}

            {!searchLoading && (
              <div className="search-results">
                {searchResults.length === 0 ? (
                  <p className="empty-state">No notes found.</p>
                ) : (
                  <div className="notes-grid">
                    {searchResults.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        className="note-card note-card-button"
                        style={{ backgroundColor: note.color }}
                        onClick={() => openNoteModal(note)}
                      >
                        <h4 className="note-title">{note.title}</h4>
                        <p className="note-content">{note.content}</p>
                        <span className="note-date">{formatDate(note.created_at)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activePanel === 'create' && (
          <section className="panel">
            <div className="panel-header">
              <h3>Create Note</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setActivePanel(null)}>
                ✕
              </button>
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
              <button className="btn btn-ghost btn-sm" onClick={() => setActivePanel(null)}>
                ✕
              </button>
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

        {selectedNote && (
          <div className="modal-backdrop" onClick={closeNoteModal}>
            <div className="note-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Note Details</h3>
                <button className="btn btn-ghost btn-sm" onClick={closeNoteModal}>
                  ✕
                </button>
              </div>

              <div className="note-preview modal-preview" style={{ backgroundColor: modalColor }}>
                <div className="form-group">
                  <label htmlFor="modalTitle">Title</label>
                  <input
                    id="modalTitle"
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modalContent">Content</label>
                  <textarea
                    id="modalContent"
                    rows={6}
                    value={modalContent}
                    onChange={(e) => setModalContent(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Color</label>
                  <div className="color-picker">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        className={`color-swatch ${modalColor === c.value ? 'color-swatch-selected' : ''}`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                        onClick={() => setModalColor(c.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {modalError && <div className="alert alert-error">{modalError}</div>}

              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={handleDeleteNote} disabled={deleteLoading}>
                  {deleteLoading ? 'Deleting…' : 'Delete'}
                </button>
                <button className="btn btn-primary" onClick={handleSaveNote} disabled={modalLoading}>
                  {modalLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

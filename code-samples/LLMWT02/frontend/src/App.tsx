import { useEffect, useState, type FormEvent } from 'react'
import { addNote, getNotes, type Note } from './api'
import './App.css'

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getNotes()
      .then(setNotes)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : 'Could not load notes'),
      )
      .finally(() => setIsLoading(false))
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextText = text.trim()
    if (!nextText) return

    setIsSaving(true)
    setError('')
    try {
      const note = await addNote(nextText)
      setNotes((current) => [...current, note])
      setText('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save note')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main>
      <header>
        <p className="eyebrow">Worktree dev slot</p>
        <h1>Branch notes</h1>
        <p className="intro">This list lives in the Cosmos database assigned to this slot.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <label htmlFor="note">Add a note</label>
        <div className="input-row">
          <input
            id="note"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="What changed on this branch?"
            maxLength={200}
          />
          <button type="submit" disabled={isSaving || !text.trim()}>
            {isSaving ? 'Saving...' : 'Add note'}
          </button>
        </div>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="notes" aria-live="polite" aria-busy={isLoading}>
        <div className="section-heading">
          <h2>Notes</h2>
          <span>{notes.length}</span>
        </div>
        {isLoading ? (
          <p className="empty">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="empty">No notes in this slot yet.</p>
        ) : (
          <ul>
            {notes.map((note) => <li key={note.id}>{note.text}</li>)}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App

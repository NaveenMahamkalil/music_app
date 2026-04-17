import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as any)?.from || '/dashboard'

  if (user) return <Navigate to={from} replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(String(err?.message || 'Login failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Login</h1>
        <p className="subtitle">Welcome back. Your session stays signed in.</p>

        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>

          {error ? <div className="error">{error}</div> : null}

          <button className="btn primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <div className="footerRow">
          <span>New here?</span> <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  )
}


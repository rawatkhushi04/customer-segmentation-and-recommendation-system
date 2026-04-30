import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.email, form.password)
      navigate(data.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg grid-bg flex items-center justify-center px-4">

      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent/20 border border-accent/30 rounded-2xl mb-4 shadow-glow">
            <span className="font-display font-black text-2xl text-accent">S</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-text">Welcome back</h1>
          <p className="text-dim text-sm mt-2 font-body">Sign in to your SegmentIQ account</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-card">

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-dim uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm font-body placeholder:text-muted transition-all duration-200 hover:border-accent/40"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-dim uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text text-sm font-body placeholder:text-muted transition-all duration-200 hover:border-accent/40"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent hover:bg-glow text-white font-display font-semibold rounded-xl transition-all duration-200 shadow-glow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-dim text-sm font-body mt-6">
            No account?{' '}
            <Link to="/register" className="text-accent hover:text-glow transition-colors">
              Create one
            </Link>
          </p>
        </div>

        {/* Session info */}
        <p className="text-center text-xs text-muted font-mono mt-4">
          Sessions expire after 15 minutes for security
        </p>
      </div>
    </div>
  )
}

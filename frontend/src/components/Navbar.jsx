import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout }    = useAuth()
  const { totalItems, setIsOpen } = useCart()
  const navigate            = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-glow">
            <span className="text-white font-display font-bold text-sm">S</span>
          </div>
          <span className="font-display font-bold text-text text-lg tracking-tight">
            Segment<span className="text-accent">IQ</span>
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            {/* Customer ID */}
            <div className="text-right hidden sm:block">
              <p className="text-xs text-dim font-mono">CUSTOMER ID</p>
              <p className="text-sm font-mono text-accent">#{user.customer_id}</p>
            </div>
            <div className="w-px h-8 bg-border" />

            {/* Cart button */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative flex items-center gap-2 px-3 py-1.5 border border-border rounded-xl hover:border-accent/40 transition-all group"
            >
              <span className="text-base">🛒</span>
              <span className="text-sm text-dim group-hover:text-text transition-colors hidden sm:block">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent text-white text-xs font-mono rounded-full flex items-center justify-center shadow-glow">
                  {totalItems}
                </span>
              )}
            </button>

            <div className="w-px h-8 bg-border" />
            <span className="text-sm text-dim hidden sm:block">{user.username}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-body text-dim border border-border rounded-lg hover:border-accent hover:text-accent transition-all duration-200"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

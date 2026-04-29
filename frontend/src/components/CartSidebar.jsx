import { useState } from 'react'
import { useCart } from '../context/CartContext'
import api from '../api/axios'

export default function CartSidebar({ onCheckoutComplete }) {
  const {
    cart, isOpen, setIsOpen,
    removeFromCart, updateQuantity, clearCart,
    totalItems, totalPrice
  } = useCart()

  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setLoading(true)
    setError('')
    try {
      // POST each cart item as a purchase
      await Promise.all(
        cart.map(item =>
          api.post('/dashboard/purchase', {
            stock_code  : item.stock_code,
            description : item.description,
            quantity    : item.quantity,
            unit_price  : item.unit_price,
          })
        )
      )
      setSuccess(true)
      clearCart()
      setTimeout(() => {
        setSuccess(false)
        setIsOpen(false)
        onCheckoutComplete?.()   // re-fetch dashboard → new cluster + recommendations
      }, 2000)
    } catch (err) {
      setError('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-xl text-text">Your Cart</h2>
            <p className="text-xs text-dim font-mono mt-0.5">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-dim hover:text-text hover:border-accent/40 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl animate-fade-in">
              ✓
            </div>
            <h3 className="font-display font-bold text-xl text-emerald-400">Order Placed!</h3>
            <p className="text-dim font-body text-sm">Your recommendations are being updated based on your purchases.</p>
          </div>
        )}

        {/* Empty State */}
        {!success && cart.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="text-5xl">🛒</span>
            <p className="font-display font-semibold text-text">Cart is empty</p>
            <p className="text-dim text-sm font-body">Add products from the catalog below</p>
          </div>
        )}

        {/* Cart Items */}
        {!success && cart.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {cart.map((item) => (
                <div key={item.stock_code} className="bg-surface border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs text-accent">{item.stock_code}</span>
                      <p className="text-sm text-text font-body mt-0.5 leading-snug line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.stock_code)}
                      className="text-muted hover:text-red-400 transition-colors text-sm flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.stock_code, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-border text-dim hover:border-accent/40 hover:text-accent transition-all text-sm flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="font-mono text-sm text-text w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.stock_code, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-border text-dim hover:border-accent/40 hover:text-accent transition-all text-sm flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <span className="font-display font-semibold text-accent text-sm">
                      £{(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-border space-y-4">
              {error && (
                <p className="text-red-400 text-xs font-body text-center">{error}</p>
              )}

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-dim font-body text-sm">Total</span>
                <span className="font-display font-bold text-2xl text-text">
                  £{totalPrice.toFixed(2)}
                </span>
              </div>

              {/* Info box */}
              <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3">
                <p className="text-xs text-accent/80 font-body">
                  🤖 After checkout, our AI will re-analyze your profile and update your recommendations.
                </p>
              </div>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 bg-accent hover:bg-glow text-white font-display font-semibold rounded-xl transition-all duration-200 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : `Checkout · £${totalPrice.toFixed(2)}`}
              </button>

              <button
                onClick={clearCart}
                className="w-full py-2 text-dim text-sm font-body hover:text-red-400 transition-colors"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

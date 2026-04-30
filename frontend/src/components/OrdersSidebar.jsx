import { useEffect, useState } from 'react'
import api from '../api/axios'

export default function OrdersSidebar({ isOpen, onClose }) {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const fetchOrders = async () => {
      setLoading(true)
      try {
        const res = await api.get('/dashboard/purchases')
        setOrders(res.data)
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    fetchOrders()
  }, [isOpen])

  const total = orders.reduce((sum, o) => sum + o.unit_price * o.quantity, 0)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-xl text-text">Order History</h2>
            <p className="text-xs text-dim font-mono mt-0.5">{orders.length} item(s) purchased</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-dim hover:text-text hover:border-accent/40 transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="text-5xl">📦</span>
            <p className="font-display font-semibold text-text">No orders yet</p>
            <p className="text-dim text-sm font-body">Your purchases will appear here</p>
          </div>
        ) : (
          <>
            {/* Orders list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-surface border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-mono text-xs text-accent">{order.stock_code}</span>
                    <span className="font-display font-semibold text-sm text-text">
                      £{(order.unit_price * order.quantity).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-text font-body leading-snug mb-3">{order.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-dim font-mono">
                      {new Date(order.invoice_date).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </span>
                    <span className="text-xs text-dim font-mono">
                      ×{order.quantity} @ £{order.unit_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer total */}
            <div className="px-6 py-5 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-dim uppercase tracking-widest">Total Spent</p>
                  <p className="text-xs text-dim font-body mt-0.5">{orders.length} items</p>
                </div>
                <p className="font-display font-bold text-2xl text-accent">£{total.toFixed(2)}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

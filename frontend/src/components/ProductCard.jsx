import { useState } from 'react'
import { useCart } from '../context/CartContext'

const colors     = ['bg-blue-500/10 border-blue-500/20', 'bg-purple-500/10 border-purple-500/20', 'bg-emerald-500/10 border-emerald-500/20']
const textColors = ['text-blue-300', 'text-purple-300', 'text-emerald-300']

export default function ProductCard({ product, index }) {
  const { addToCart, cart } = useCart()
  const [added, setAdded]   = useState(false)

  const color  = colors[index % colors.length]
  const text   = textColors[index % textColors.length]
  const inCart = cart.some(i => i.stock_code === product.StockCode)

  const handleAdd = () => {
    addToCart({
      stock_code  : product.StockCode,
      description : product.Description,
      unit_price  : product.UnitPrice ?? 1.0,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className={`opacity-0 animate-fade-up border rounded-2xl p-5 ${color} hover:scale-[1.02] transition-all duration-300 flex flex-col delay-${(index % 5) + 1}`}>

      <div className="flex items-start justify-between mb-4">
        <span className={`font-mono text-xs px-2 py-1 rounded-md bg-black/30 ${text}`}>
          {product.StockCode}
        </span>
        <span className="text-lg">🏷️</span>
      </div>

      <p className="font-body text-text text-sm leading-relaxed mb-4 flex-1 min-h-[40px]">
        {product.Description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
        <div>
          <p className="text-dim text-xs font-mono">PRICE</p>
          <p className={`font-display font-semibold ${text}`}>
            £{(product.UnitPrice ?? 0).toFixed(2)}
          </p>
        </div>

        <button
          onClick={handleAdd}
          className={`px-3 py-1.5 rounded-xl text-xs font-display font-semibold transition-all duration-200
            ${added || inCart
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'bg-accent/20 border border-accent/30 text-accent hover:bg-accent hover:text-white'
            }`}
        >
          {added ? '✓ Added' : inCart ? 'In Cart' : '+ Add'}
        </button>
      </div>
    </div>
  )
}

export default function ProductCard({ product, index }) {
  const colors = ['bg-blue-500/10 border-blue-500/20', 'bg-purple-500/10 border-purple-500/20', 'bg-emerald-500/10 border-emerald-500/20']
  const textColors = ['text-blue-300', 'text-purple-300', 'text-emerald-300']
  const color = colors[index % colors.length]
  const text  = textColors[index % textColors.length]

  return (
    <div
      className={`opacity-0 animate-fade-up border rounded-2xl p-5 ${color} hover:scale-[1.02] transition-all duration-300 cursor-pointer delay-${index + 1}`}
    >
      {/* Stock code badge */}
      <div className="flex items-start justify-between mb-4">
        <span className={`font-mono text-xs px-2 py-1 rounded-md bg-black/30 ${text}`}>
          {product.StockCode}
        </span>
        <span className="text-lg">🏷️</span>
      </div>

      {/* Product name */}
      <p className="font-body text-text text-sm leading-relaxed mb-4 min-h-[40px]">
        {product.Description}
      </p>

      {/* Price */}
      {product.UnitPrice && (
        <div className="flex items-center justify-between">
          <span className="text-dim text-xs font-mono">UNIT PRICE</span>
          <span className={`font-display font-semibold ${text}`}>
            £{product.UnitPrice.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}

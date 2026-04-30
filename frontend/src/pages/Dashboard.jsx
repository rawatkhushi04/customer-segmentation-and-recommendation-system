import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import ClusterBadge from '../components/ClusterBadge'
import ProductCard from '../components/ProductCard'
import CartSidebar from '../components/CartSidebar'
import OrdersSidebar from '../components/OrdersSidebar'
import api from '../api/axios'

export default function Dashboard() {
  const { user }                        = useAuth()
  const [data, setData]                 = useState(null)
  const [loading, setLoading]           = useState(true)
  const [products, setProducts]         = useState([])
  const [search, setSearch]             = useState('')
  const [sortBy, setSortBy]             = useState('default')
  const [searching, setSearching]       = useState(false)
  const [ordersOpen, setOrdersOpen]     = useState(false)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/')
      setData(res.data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  useEffect(() => {
    const fetchProducts = async () => {
      setSearching(true)
      try {
        const res = await api.get(`/products/?search=${encodeURIComponent(search)}&limit=50&sort_by=${sortBy}`)
        setProducts(res.data)
      } catch { /* silent */ }
      finally { setSearching(false) }
    }
    const t = setTimeout(fetchProducts, 400)
    return () => clearTimeout(t)
  }, [search, sortBy])

  const handleCheckoutComplete = () => {
    setLoading(true)
    fetchDashboard()
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-dim font-mono text-sm">Analyzing your profile...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg grid-bg">
      <Navbar onOrdersClick={() => setOrdersOpen(true)} />
      <CartSidebar onCheckoutComplete={handleCheckoutComplete} />
      <OrdersSidebar isOpen={ordersOpen} onClose={() => setOrdersOpen(false)} />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <div className="mb-10 opacity-0 animate-fade-up">
          <p className="font-mono text-xs text-dim uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="font-display font-bold text-4xl text-text">
            Hello, <span className="text-accent">{user?.username}</span>
          </h1>
          <p className="text-dim font-body mt-2">{data?.message}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Customer ID',     value: `#${user?.customer_id}`, mono: true },
            { label: 'Total Purchases', value: data?.purchase_count ?? 0 },
            { label: 'Cluster',         value: data?.cluster_id !== null && data?.cluster_id !== undefined ? `Cluster ${data.cluster_id}` : '—' },
            { label: 'Status',          value: data?.is_new_user ? 'New User' : 'Active', green: !data?.is_new_user },
          ].map((stat, i) => (
            <div key={i} className={`opacity-0 animate-fade-up delay-${i+1} bg-card border border-border rounded-2xl p-5`}>
              <p className="text-xs font-mono text-dim uppercase tracking-widest mb-2">{stat.label}</p>
              <p className={`font-display font-bold text-2xl ${stat.mono ? 'font-mono text-accent' : stat.green ? 'text-emerald-400' : 'text-text'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* New User State */}
        {data?.is_new_user && (
          <div className="opacity-0 animate-fade-up delay-3 bg-card border border-border rounded-3xl p-10 text-center mb-10">
            <div className="text-5xl mb-4">👋</div>
            <h2 className="font-display font-bold text-2xl text-text mb-2">Welcome to SegmentIQ!</h2>
            <p className="text-dim font-body max-w-md mx-auto">
              You have no purchase history yet. Browse and buy products below — our AI will build your personalized profile after your first order.
            </p>
          </div>
        )}

        {/* Cluster + Recommendations */}
        {!data?.is_new_user && (
          <div className="opacity-0 animate-fade-up delay-2 mb-12">
            <div className="mb-6">
              <p className="text-xs font-mono text-dim uppercase tracking-widest mb-1">AI Analysis</p>
              <h2 className="font-display font-bold text-2xl text-text">Your Shopper Profile</h2>
            </div>

            <div className="mb-8">
              <ClusterBadge clusterId={data?.cluster_id} clusterName={data?.cluster_name} />
            </div>

            {data?.recommendations?.length > 0 && (
              <>
                <p className="text-xs font-mono text-dim uppercase tracking-widest mb-4">Recommended For You</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {data.recommendations.map((rec, i) => (
                    <ProductCard key={i} product={rec} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Product Catalog */}
        <div className="opacity-0 animate-fade-up delay-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-mono text-dim uppercase tracking-widest mb-1">Catalog</p>
              <h2 className="font-display font-bold text-2xl text-text">
                All Products
                <span className="ml-3 text-sm font-mono text-dim font-normal">({products.length})</span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dim text-sm">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text font-body placeholder:text-muted w-full sm:w-52 transition-all hover:border-accent/40"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-text font-body transition-all hover:border-accent/40 cursor-pointer"
              >
                <option value="default">Default</option>
                <option value="price_high">Price: High → Low</option>
                <option value="price_low">Price: Low → High</option>
              </select>
            </div>
          </div>

          {searching ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product, i) => (
                <ProductCard
                  key={product.stock_code}
                  product={{
                    StockCode  : product.stock_code,
                    Description: product.description,
                    UnitPrice  : product.unit_price,
                  }}
                  index={i}
                />
              ))}
              {products.length === 0 && (
                <div className="col-span-4 text-center py-12 text-dim font-body">No products found.</div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}

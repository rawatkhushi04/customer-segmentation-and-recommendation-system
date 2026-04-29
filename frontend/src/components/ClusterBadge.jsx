const CLUSTER_CONFIG = {
  0: { label: 'Casual Weekend Shopper', icon: '🛍️', color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/30', text: 'text-violet-300' },
  1: { label: 'Occasional Big Spender', icon: '💎', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', text: 'text-amber-300' },
  2: { label: 'Eager Early-Bird Shopper', icon: '🌅', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-300' },
}

export default function ClusterBadge({ clusterId, clusterName }) {
  const config = CLUSTER_CONFIG[clusterId] ?? {
    label: clusterName, icon: '📊',
    color: 'from-accent/20 to-accent/10',
    border: 'border-accent/30',
    text: 'text-accent',
  }

  return (
    <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r ${config.color} border ${config.border} animate-fade-in`}>
      <span className="text-2xl">{config.icon}</span>
      <div>
        <p className="text-xs text-dim font-mono uppercase tracking-widest">Your Segment</p>
        <p className={`font-display font-semibold text-lg ${config.text}`}>{config.label}</p>
      </div>
    </div>
  )
}

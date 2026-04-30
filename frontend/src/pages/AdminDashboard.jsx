import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import api from '../api/axios'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [segmentation, setSegmentation] = useState(null)
  const [sales, setSales] = useState(null)
  const [abTest, setAbTest] = useState(null)
  const [modelPanel, setModelPanel] = useState(null)
  const [customerHistory, setCustomerHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [activityLogs, setActivityLogs] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ file_name: '', rows_uploaded: '', notes: '' })
  const [uploadLogMsg, setUploadLogMsg] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [customerDetail, setCustomerDetail] = useState(null)
  const [customerError, setCustomerError] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const loadOverview = async () => {
    setLoading(true)
    try {
      const [segRes, salesRes, abRes, modelRes] = await Promise.all([
        api.get('/admin/segmentation-dashboard'),
        api.get('/admin/sales-analytics'),
        api.get('/admin/ab-testing'),
        api.get('/admin/model-control-panel'),
      ])
      setSegmentation(segRes.data)
      setSales(salesRes.data)
      setAbTest(abRes.data)
      setModelPanel(modelRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOverview()
  }, [])

  const loadCustomerHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await api.get('/admin/customers')
      setCustomerHistory(res.data || [])
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history' && customerHistory.length === 0) {
      loadCustomerHistory()
    }
  }, [activeTab])

  const loadActivityLogs = async () => {
    setActivityLoading(true)
    try {
      const res = await api.get('/admin/activity-logs')
      setActivityLogs(res.data || [])
    } finally {
      setActivityLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivityLogs()
    }
  }, [activeTab])

  const fetchCustomer = async () => {
    setCustomerError('')
    setCustomerDetail(null)
    setActionMsg('')
    if (!customerId.trim()) {
      setCustomerError('Enter a valid customer ID.')
      return
    }
    try {
      const res = await api.get(`/admin/customers/${customerId}`)
      setCustomerDetail(res.data)
    } catch (err) {
      setCustomerError(err.response?.data?.detail || 'Customer lookup failed.')
    }
  }

  const fetchCustomerById = async (id) => {
    setCustomerId(String(id))
    setCustomerError('')
    setActionMsg('')
    try {
      const res = await api.get(`/admin/customers/${id}`)
      setCustomerDetail(res.data)
    } catch (err) {
      setCustomerError(err.response?.data?.detail || 'Customer lookup failed.')
    }
  }

  const recomputeCluster = async () => {
    setActionMsg('')
    if (!customerId.trim()) {
      setCustomerError('Enter a valid customer ID before recompute.')
      return
    }
    try {
      const res = await api.post(`/admin/model-control-panel/recompute-cluster/${customerId}`)
      setActionMsg(res.data.message)
      await Promise.all([loadOverview(), fetchCustomer()])
    } catch (err) {
      setActionMsg(err.response?.data?.detail || 'Recompute failed.')
    }
  }

  const logDataUpload = async (e) => {
    e.preventDefault()
    setUploadLogMsg('')
    if (!uploadForm.file_name.trim()) {
      setUploadLogMsg('File name is required.')
      return
    }
    try {
      await api.post('/admin/activity-logs/data-upload', {
        file_name: uploadForm.file_name,
        rows_uploaded: uploadForm.rows_uploaded ? Number(uploadForm.rows_uploaded) : null,
        notes: uploadForm.notes || null,
      })
      setUploadLogMsg('Data upload logged successfully.')
      setUploadForm({ file_name: '', rows_uploaded: '', notes: '' })
      await loadActivityLogs()
    } catch (err) {
      setUploadLogMsg(err.response?.data?.detail || 'Failed to log data upload.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg grid-bg">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16 space-y-8">
        <div>
          <p className="font-mono text-xs text-dim uppercase tracking-widest mb-1">Admin</p>
          <h1 className="font-display font-bold text-4xl text-text">Admin Control Center</h1>
          <p className="text-dim mt-2">Manage segmentation, sales, recommendations, and model operations.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl border ${activeTab === 'overview' ? 'bg-accent text-white border-accent' : 'border-border text-text'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl border ${activeTab === 'history' ? 'bg-accent text-white border-accent' : 'border-border text-text'}`}
          >
            Customer History
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-xl border ${activeTab === 'activity' ? 'bg-accent text-white border-accent' : 'border-border text-text'}`}
          >
            Activity Logs
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display font-bold text-2xl text-text mb-4">Segmentation Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Metric label="Total Customers" value={segmentation?.total_customers || 0} />
            <Metric label="Assigned Customers" value={segmentation?.assigned_customers || 0} />
            <Metric label="Unassigned Customers" value={segmentation?.unassigned_customers || 0} />
          </div>
          <div className="space-y-2">
            {(segmentation?.clusters || []).map((c) => (
              <div key={`${c.cluster_id}-${c.cluster_name}`} className="flex justify-between bg-surface rounded-lg p-3 border border-border">
                <span className="text-text">{c.cluster_name}</span>
                <span className="text-accent font-mono">{c.customer_count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display font-bold text-2xl text-text mb-4">Sales Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Metric label="Total Orders" value={sales?.total_orders || 0} />
            <Metric label="Revenue" value={`$${sales?.total_revenue || 0}`} />
            <Metric label="Avg Order Value" value={`$${sales?.average_order_value || 0}`} />
            <Metric label="Unique Customers" value={sales?.unique_customers || 0} />
          </div>
          <div className="space-y-2">
            {(sales?.top_products || []).map((p) => (
              <div key={p.StockCode} className="bg-surface rounded-lg p-3 border border-border">
                <p className="text-accent font-mono text-sm">{p.StockCode}</p>
                <p className="text-text text-sm">{p.Description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display font-bold text-2xl text-text mb-4">A/B Testing Dashboard</h2>
          <p className="text-dim text-sm mb-4">Compare old vs new recommendation strategy performance.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-mono text-dim uppercase tracking-widest mb-2">{abTest?.baseline?.name || 'Old Recommendation'}</p>
              <p className="text-text text-sm">Users Evaluated: <span className="text-accent">{abTest?.baseline?.users_evaluated ?? 0}</span></p>
              <p className="text-text text-sm">Hits: <span className="text-accent">{abTest?.baseline?.hits ?? 0}</span></p>
              <p className="text-text text-sm">Hit Rate: <span className="text-accent">{abTest?.baseline?.hit_rate ?? 0}%</span></p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-xs font-mono text-dim uppercase tracking-widest mb-2">{abTest?.challenger?.name || 'New Recommendation'}</p>
              <p className="text-text text-sm">Users Evaluated: <span className="text-accent">{abTest?.challenger?.users_evaluated ?? 0}</span></p>
              <p className="text-text text-sm">Hits: <span className="text-accent">{abTest?.challenger?.hits ?? 0}</span></p>
              <p className="text-text text-sm">Hit Rate: <span className="text-accent">{abTest?.challenger?.hit_rate ?? 0}%</span></p>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-sm text-text">
              Better Performing Variant:{' '}
              <span className="text-emerald-400 font-semibold uppercase">{abTest?.winner || 'tie'}</span>
            </p>
            <p className="text-xs text-dim mt-1">{abTest?.summary || 'No summary available.'}</p>
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display font-bold text-2xl text-text mb-4">Customer Detail View</h2>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Enter customer ID"
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text w-full sm:w-64"
            />
            <button onClick={fetchCustomer} className="px-4 py-2.5 bg-accent rounded-xl text-white font-semibold">Load Customer</button>
          </div>
          {customerError && <p className="text-red-400 text-sm mb-3">{customerError}</p>}
          {customerDetail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Metric label="Customer" value={`#${customerDetail.customer_id}`} />
                <Metric label="Purchases" value={customerDetail.purchase_count} />
                <Metric label="Spend" value={`$${customerDetail.total_spend}`} />
                <Metric label="Cluster" value={customerDetail.cluster_name || 'Unassigned'} />
              </div>
              <div className="bg-surface border border-border rounded-lg p-3">
                <p className="text-text text-sm">{customerDetail.username} ({customerDetail.email})</p>
              </div>
            </div>
          )}
        </section>

        <section className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display font-bold text-2xl text-text mb-4">Model Control Panel</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Metric label="Model Status" value={modelPanel?.model_status || 'unknown'} />
            <Metric label="Total Users" value={modelPanel?.total_users || 0} />
            <Metric label="Clustered Users" value={modelPanel?.clustered_users || 0} />
            <Metric label="Need Training Data" value={modelPanel?.users_needing_training_data || 0} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={recomputeCluster} className="px-4 py-2.5 bg-accent rounded-xl text-white font-semibold">
              Recompute Cluster For Customer ID
            </button>
            <button onClick={loadOverview} className="px-4 py-2.5 border border-border rounded-xl text-text">
              Refresh Panel
            </button>
          </div>
          {actionMsg && <p className="text-emerald-400 text-sm mt-3">{actionMsg}</p>}
        </section>
          </>
        )}

        {activeTab === 'history' && (
          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-display font-bold text-2xl text-text mb-4">Customer History</h2>
            <p className="text-dim text-sm mb-4">Click a customer to view complete history and purchases.</p>

            {historyLoading ? (
              <div className="py-8 text-center text-dim">Loading customers...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {customerHistory.map((c) => (
                    <button
                      key={c.customer_id}
                      onClick={() => fetchCustomerById(c.customer_id)}
                      className="w-full text-left bg-surface border border-border rounded-lg p-3 hover:border-accent/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-accent font-mono text-sm">#{c.customer_id}</p>
                        <p className="text-xs text-dim">{c.cluster_name || 'Unassigned'}</p>
                      </div>
                      <p className="text-text text-sm font-semibold">{c.username}</p>
                      <p className="text-dim text-xs">{c.email}</p>
                      <p className="text-dim text-xs mt-1">Purchases: {c.purchase_count} | Spend: ${c.total_spend}</p>
                    </button>
                  ))}
                  {customerHistory.length === 0 && <p className="text-dim text-sm">No customers found.</p>}
                </div>

                <div className="bg-surface border border-border rounded-lg p-4 min-h-[300px]">
                  {customerError && <p className="text-red-400 text-sm mb-3">{customerError}</p>}
                  {!customerDetail && <p className="text-dim text-sm">Select a customer from the left to view history.</p>}
                  {customerDetail && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Metric label="Customer" value={`#${customerDetail.customer_id}`} />
                        <Metric label="Cluster" value={customerDetail.cluster_name || 'Unassigned'} />
                        <Metric label="Purchases" value={customerDetail.purchase_count} />
                        <Metric label="Spend" value={`$${customerDetail.total_spend}`} />
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3">
                        <p className="text-text text-sm font-semibold">{customerDetail.username}</p>
                        <p className="text-dim text-xs">{customerDetail.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text font-semibold mb-2">Purchase History</p>
                        <div className="max-h-[220px] overflow-y-auto space-y-2">
                          {(customerDetail.purchases || []).map((p, idx) => (
                            <div key={`${p.stock_code}-${idx}`} className="border border-border rounded-md p-2 bg-card">
                              <p className="text-accent font-mono text-xs">{p.stock_code}</p>
                              <p className="text-text text-xs">{p.description}</p>
                              <p className="text-dim text-xs">Qty: {p.quantity} | Unit: ${p.unit_price}</p>
                            </div>
                          ))}
                          {(!customerDetail.purchases || customerDetail.purchases.length === 0) && (
                            <p className="text-dim text-xs">No purchases yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'activity' && (
          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-display font-bold text-2xl text-text mb-4">Activity Logs</h2>
            <p className="text-dim text-sm mb-4">
              Track model runs, dashboard access, and data upload events.
            </p>

            <div className="bg-surface border border-border rounded-xl p-4 mb-6">
              <p className="text-sm text-text font-semibold mb-3">Log Data Upload</p>
              <form onSubmit={logDataUpload} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  value={uploadForm.file_name}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, file_name: e.target.value }))}
                  placeholder="File name (e.g., april_data.csv)"
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-text"
                />
                <input
                  value={uploadForm.rows_uploaded}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, rows_uploaded: e.target.value }))}
                  placeholder="Rows uploaded"
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-text"
                />
                <input
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes"
                  className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-text"
                />
                <button type="submit" className="px-4 py-2 bg-accent text-white rounded-lg font-semibold">
                  Add Upload Log
                </button>
              </form>
              {uploadLogMsg && <p className="text-xs text-dim mt-2">{uploadLogMsg}</p>}
            </div>

            <div className="flex justify-end mb-3">
              <button onClick={loadActivityLogs} className="px-4 py-2 border border-border rounded-lg text-sm text-text">
                Refresh Logs
              </button>
            </div>

            {activityLoading ? (
              <div className="py-8 text-center text-dim">Loading activity logs...</div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="bg-surface border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text">{log.action}</p>
                      <p className="text-xs text-dim">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-accent uppercase">{log.event_type}</span>
                      <span className="text-xs text-dim">By: {log.actor}</span>
                    </div>
                    {log.details && <p className="text-xs text-dim mt-2">{log.details}</p>}
                  </div>
                ))}
                {activityLogs.length === 0 && <p className="text-dim text-sm">No logs recorded yet.</p>}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-xs font-mono text-dim uppercase tracking-widest mb-1">{label}</p>
      <p className="font-display font-bold text-xl text-text">{value}</p>
    </div>
  )
}

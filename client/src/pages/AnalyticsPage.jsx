import { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import useLeads from '../hooks/useLeads';
import useRole from '../hooks/useRole';
import { LEAD_STATUSES, STATUS_COLORS, SOURCE_LABELS } from '../constants';

/* ── Shared chart colours from theme ───────────────────── */
const TEAL   = '#13a3a3';
const GOLD   = '#e5b62b';
const DANGER = '#e55b5b';
const SUCCESS= '#4fb86e';
const TEXT2  = '#8fa8cc';
const TEXT3  = '#506080';
const BGCARD = '#0a1628';

const SOURCE_COLORS = {
  website:      '#45a3e5',
  referral:     GOLD,
  social_media: '#8b5cf6',
  paid_ads:     TEAL,
  cold_call:    '#e5914c',
  other:        TEXT3,
};

/* ── Tooltip skin that matches the dark theme ───────────── */
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--bg-3)',
        border: '1px solid var(--glass-border-2)',
        borderRadius: 'var(--radius)',
        padding: '0.6rem 0.9rem',
        fontSize: '0.8125rem',
        color: 'var(--text)',
        boxShadow: 'var(--shadow)',
      }}
    >
      {label && <p style={{ color: TEXT2, marginBottom: '0.3rem', fontWeight: 600 }}>{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color || 'var(--text)', margin: '0.1rem 0' }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ── Skeleton placeholder ────────────────────────────────── */
const ChartSkeleton = () => (
  <div
    style={{
      height: 220,
      background: 'var(--glass-2)',
      borderRadius: 'var(--radius)',
      animation: 'fadeIn 0.2s ease',
    }}
  />
);

/* ── Section card ────────────────────────────────────────── */
const ChartCard = ({ title, subtitle, children, style }) => (
  <div
    className="glass-card"
    style={{
      background: BGCARD,
      border: '1px solid var(--glass-border)',
      borderRadius: 'var(--radius)',
      padding: '1.25rem',
      ...style,
    }}
  >
    <div style={{ marginBottom: '1rem' }}>
      <p className="section-title" style={{ marginBottom: '0.1rem' }}>{title}</p>
      {subtitle && <p style={{ fontSize: '0.75rem', color: TEXT3 }}>{subtitle}</p>}
    </div>
    {children}
  </div>
);

/* ── Main page ────────────────────────────────────────────── */
const AnalyticsPage = () => {
  const { analytics, loading, error, fetchAnalytics, exportCSV } = useLeads();
  const { can } = useRole();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = useCallback(async () => {
    try {
      await exportCSV();
    } catch {
      /* error shown via hook */
    }
  }, [exportCSV]);

  /* Build chart data from analytics */
  const funnelData = LEAD_STATUSES.map((s) => ({
    name: s,
    value: analytics.counts[s] ?? 0,
    color: STATUS_COLORS[s],
  }));

  const sourceData = (analytics.bySource || [])
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: SOURCE_LABELS[d.source] || d.source,
      value: d.count,
      color: SOURCE_COLORS[d.source] || TEXT3,
    }));

  const winLossData = [
    { name: 'Won',  value: analytics.counts?.Won  || 0, color: SUCCESS },
    { name: 'Lost', value: analytics.counts?.Lost || 0, color: DANGER  },
    {
      name: 'Open',
      value: Math.max(
        0,
        (analytics.total || 0) -
          (analytics.counts?.Won || 0) -
          (analytics.counts?.Lost || 0)
      ),
      color: TEXT3,
    },
  ].filter((d) => d.value > 0);

  const trendData = analytics.trend || [];

  /* ── KPI row ────────────────────────────────────────────── */
  const kpis = [
    { label: 'Total Leads',   value: analytics.total || 0,          color: TEAL   },
    { label: 'Won',           value: analytics.counts?.Won  || 0,   color: SUCCESS },
    { label: 'Lost',          value: analytics.counts?.Lost || 0,   color: DANGER  },
    { label: 'Win Rate',      value: `${analytics.winRate  || 0}%`, color: GOLD   },
  ];

  return (
    <div className="page" style={{ animation: 'fadeUp 0.2s ease both' }}>
      {/* Header */}
      <div className="page__header">
        <div>
          <h1 className="page__title">Analytics</h1>
          <p className="page__subtitle">Pipeline performance and lead insights</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {can('export_leads') && (
            <button
              className="btn btn--ghost"
              onClick={handleExport}
              id="export-csv-btn"
              disabled={loading}
            >
              ↓ Export CSV
            </button>
          )}
          <Link to="/leads?new=true" className="btn btn--primary">
            + Add Lead
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '1rem',
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="glass-card"
            style={{
              background: BGCARD,
              padding: '1rem 1.25rem',
              borderTop: `2px solid ${kpi.color}`,
              animation: 'fadeUp 0.2s ease both',
            }}
          >
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              {kpi.label}
            </p>
            <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
              {loading ? '—' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* 1. Pipeline funnel (horizontal bar) */}
        <ChartCard
          title="Pipeline Funnel"
          subtitle="Lead count per stage"
          style={{ gridColumn: 'span 2' }}
        >
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 12, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: TEXT3, fontSize: 11 }}
                  axisLine={{ stroke: 'var(--glass-border)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: TEXT2, fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name="Leads" radius={[0, 3, 3, 0]} maxBarSize={22}>
                  {funnelData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 2. Leads by source (pie) */}
        <ChartCard title="Leads by Source" subtitle="Distribution across channels">
          {loading ? (
            <ChartSkeleton />
          ) : sourceData.length === 0 ? (
            <div className="empty-state" style={{ border: 'none', padding: '2rem' }}>
              <p>No source data yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={72}
                  innerRadius={36}
                  paddingAngle={2}
                >
                  {sourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: TEXT2, fontSize: '0.75rem' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 3. Win / loss / open (pie) */}
        <ChartCard title="Win / Loss Rate" subtitle={`Win rate: ${analytics.winRate || 0}%`}>
          {loading ? (
            <ChartSkeleton />
          ) : winLossData.length === 0 ? (
            <div className="empty-state" style={{ border: 'none', padding: '2rem' }}>
              <p>No closed deals yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={winLossData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={72}
                  innerRadius={36}
                  paddingAngle={2}
                >
                  {winLossData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: TEXT2, fontSize: '0.75rem' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* 4. Monthly trend (line) */}
        <ChartCard
          title="Monthly Trend"
          subtitle="Leads created over the last 12 months"
          style={{ gridColumn: 'span 2' }}
        >
          {loading ? (
            <ChartSkeleton />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={trendData}
                margin={{ top: 4, right: 24, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--glass-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: TEXT3, fontSize: 11 }}
                  axisLine={{ stroke: 'var(--glass-border)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: TEXT3, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'var(--glass-border-2)' }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: TEXT2, fontSize: '0.75rem', textTransform: 'capitalize' }}>{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke={TEAL}
                  strokeWidth={2}
                  dot={{ r: 3, fill: TEAL, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="won"
                  name="Won"
                  stroke={SUCCESS}
                  strokeWidth={2}
                  dot={{ r: 3, fill: SUCCESS, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  strokeDasharray="4 2"
                />
                <Line
                  type="monotone"
                  dataKey="lost"
                  name="Lost"
                  stroke={DANGER}
                  strokeWidth={2}
                  dot={{ r: 3, fill: DANGER, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  strokeDasharray="4 2"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;

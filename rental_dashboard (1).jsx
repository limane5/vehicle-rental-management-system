import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Gauge, Users, Car, TrendingUp, Fuel, Wifi, WifiOff } from "lucide-react";

// Point this at your running Flask API (see backend/app.py). Leave as-is
// to keep using the sample data below if no backend is reachable.
const API_BASE = "http://localhost:5000/api";

// ---------------------------------------------------------------------
// Fallback sample data, shaped exactly like the Oracle views from
// 10_innovation_analytics.sql. Used automatically whenever the Flask
// API (backend/app.py) isn't reachable, so this dashboard always
// renders something even without a live database connection.
// ---------------------------------------------------------------------
const FALLBACK_REVENUE_BY_BRAND = [
  { BRAND: "Toyota", TOTAL_RENTALS: 34, TOTAL_REVENUE: 5100, AVG_RENTAL_VALUE: 150 },
  { BRAND: "Honda", TOTAL_RENTALS: 27, TOTAL_REVENUE: 3780, AVG_RENTAL_VALUE: 140 },
  { BRAND: "Nissan", TOTAL_RENTALS: 21, TOTAL_REVENUE: 2940, AVG_RENTAL_VALUE: 140 },
  { BRAND: "Ford", TOTAL_RENTALS: 18, TOTAL_REVENUE: 3060, AVG_RENTAL_VALUE: 170 },
  { BRAND: "Hyundai", TOTAL_RENTALS: 15, TOTAL_REVENUE: 1950, AVG_RENTAL_VALUE: 130 },
];

const FALLBACK_MONTHLY_REVENUE = [
  { REVENUE_MONTH: "2026-02", MONTHLY_REVENUE: 2100, PAYMENT_COUNT: 14 },
  { REVENUE_MONTH: "2026-03", MONTHLY_REVENUE: 2650, PAYMENT_COUNT: 18 },
  { REVENUE_MONTH: "2026-04", MONTHLY_REVENUE: 2380, PAYMENT_COUNT: 16 },
  { REVENUE_MONTH: "2026-05", MONTHLY_REVENUE: 3120, PAYMENT_COUNT: 21 },
  { REVENUE_MONTH: "2026-06", MONTHLY_REVENUE: 3590, PAYMENT_COUNT: 24 },
  { REVENUE_MONTH: "2026-07", MONTHLY_REVENUE: 2990, PAYMENT_COUNT: 19 },
];

const FALLBACK_FLEET_UTILIZATION = [
  { STATUS: "AVAILABLE", VEHICLE_COUNT: 26, PCT_OF_FLEET: 57.8 },
  { STATUS: "RENTED", VEHICLE_COUNT: 16, PCT_OF_FLEET: 35.6 },
  { STATUS: "MAINTENANCE", VEHICLE_COUNT: 3, PCT_OF_FLEET: 6.6 },
];

const FALLBACK_TOP_CUSTOMERS = [
  { CUSTOMER_NAME: "Jean Baptiste", TOTAL_RENTALS: 6, TOTAL_SPEND: 920 },
  { CUSTOMER_NAME: "Aline Uwase", TOTAL_RENTALS: 5, TOTAL_SPEND: 780 },
  { CUSTOMER_NAME: "Eric Habimana", TOTAL_RENTALS: 5, TOTAL_SPEND: 705 },
  { CUSTOMER_NAME: "Divine Mukamana", TOTAL_RENTALS: 4, TOTAL_SPEND: 610 },
  { CUSTOMER_NAME: "Patrick Nkurunziza", TOTAL_RENTALS: 3, TOTAL_SPEND: 465 },
];

const FALLBACK_ACTIVE_RENTALS = [
  { RENTAL_ID: 118, CUSTOMER_NAME: "Jean Baptiste", BRAND: "Toyota", MODEL: "Corolla", RENTAL_DATE: "2026-07-10" },
  { RENTAL_ID: 121, CUSTOMER_NAME: "Aline Uwase", BRAND: "Honda", MODEL: "Civic", RENTAL_DATE: "2026-07-12" },
  { RENTAL_ID: 124, CUSTOMER_NAME: "Eric Habimana", BRAND: "Ford", MODEL: "Escape", RENTAL_DATE: "2026-07-13" },
  { RENTAL_ID: 126, CUSTOMER_NAME: "Divine Mukamana", BRAND: "Nissan", MODEL: "Sentra", RENTAL_DATE: "2026-07-14" },
];

const palette = {
  bg: "#131209",
  panel: "#1D1B12",
  card: "#26231765",
  cardSolid: "#26231A",
  border: "#3A3623",
  borderStrong: "#544E30",
  text: "#F2EEDF",
  textMuted: "#A9A488",
  amber: "#F2A623",
  amberDeep: "#BA7517",
  teal: "#4FBF9A",
  tealDeep: "#0F6E56",
  red: "#E0654F",
  redDeep: "#993C1D",
};

function Odometer({ value, prefix = "", decimals = 0 }) {
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  );
}

function Gauge360({ segments, size = 220 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = size / 2 - 18;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -220;
  const sweep = 260;
  let acc = 0;
  const arcs = segments.map((seg) => {
    const a0 = startAngle + (acc / total) * sweep;
    acc += seg.value;
    const a1 = startAngle + (acc / total) * sweep;
    const toRad = (a) => ((a - 90) * Math.PI) / 180;
    const x0 = cx + radius * Math.cos(toRad(a0));
    const y0 = cy + radius * Math.sin(toRad(a0));
    const x1 = cx + radius * Math.cos(toRad(a1));
    const y1 = cy + radius * Math.sin(toRad(a1));
    const large = a1 - a0 > 180 ? 1 : 0;
    return { d: `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`, color: seg.color, key: seg.label };
  });
  const rentedPct = segments.find((s) => s.label === "RENTED")?.value ?? 0;
  const pct = Math.round((rentedPct / total) * 100);

  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      {arcs.map((a) => (
        <path key={a.key} d={a.d} stroke={a.color} strokeWidth={14} fill="none" strokeLinecap="round" />
      ))}
      <text x={cx} y={size * 0.5} textAnchor="middle" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 34, fill: palette.text, fontWeight: 500 }}>
        {pct}%
      </text>
      <text x={cx} y={size * 0.62} textAnchor="middle" style={{ fontFamily: "Oswald, sans-serif", fontSize: 12, letterSpacing: 1.5, fill: palette.textMuted }}>
        FLEET IN USE
      </text>
    </svg>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div style={{ background: palette.cardSolid, border: `1px solid ${palette.border}`, borderRadius: 4, padding: "16px 18px", flex: 1, minWidth: 150 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon size={16} color={accent} strokeWidth={1.75} />
        <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 11, letterSpacing: 1.5, color: palette.textMuted, textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, color: palette.text, fontWeight: 500 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontFamily: "Oswald, sans-serif", fontSize: 13, letterSpacing: 2, color: palette.amber, textTransform: "uppercase" }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: palette.border }} />
    </div>
  );
}

export default function RentalDashboard() {
  const [tab, setTab] = useState("overview");
  const [live, setLive] = useState(false);
  const [revenueByBrand, setRevenueByBrand] = useState(FALLBACK_REVENUE_BY_BRAND);
  const [monthlyRevenue, setMonthlyRevenue] = useState(FALLBACK_MONTHLY_REVENUE);
  const [fleetUtilization, setFleetUtilization] = useState(FALLBACK_FLEET_UTILIZATION);
  const [topCustomers, setTopCustomers] = useState(FALLBACK_TOP_CUSTOMERS);
  const [activeRentals, setActiveRentals] = useState(FALLBACK_ACTIVE_RENTALS);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveData() {
      try {
        const [rev, monthly, fleet, customers, rentals] = await Promise.all([
          fetch(`${API_BASE}/revenue-by-brand`).then((r) => r.json()),
          fetch(`${API_BASE}/monthly-revenue`).then((r) => r.json()),
          fetch(`${API_BASE}/fleet-utilization`).then((r) => r.json()),
          fetch(`${API_BASE}/top-customers`).then((r) => r.json()),
          fetch(`${API_BASE}/active-rentals`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        if ([rev, monthly, fleet, customers, rentals].some((d) => d?.error)) throw new Error("API error");
        setRevenueByBrand(rev);
        setMonthlyRevenue(monthly);
        setFleetUtilization(fleet);
        setTopCustomers(customers);
        setActiveRentals(rentals);
        setLive(true);
      } catch {
        // Backend not reachable — silently keep the fallback sample data.
        if (!cancelled) setLive(false);
      }
    }

    loadLiveData();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalRevenue = useMemo(() => revenueByBrand.reduce((s, r) => s + Number(r.TOTAL_REVENUE), 0), [revenueByBrand]);
  const totalRentals = useMemo(() => revenueByBrand.reduce((s, r) => s + Number(r.TOTAL_RENTALS), 0), [revenueByBrand]);
  const fleetSize = useMemo(() => fleetUtilization.reduce((s, f) => s + Number(f.VEHICLE_COUNT), 0), [fleetUtilization]);

  return (
    <div style={{ background: palette.bg, minHeight: "100%", fontFamily: "Inter, sans-serif", color: palette.text, padding: "0 0 24px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .rd-tab { cursor: pointer; }
        .rd-scroll::-webkit-scrollbar { height: 6px; }
        .rd-scroll::-webkit-scrollbar-thumb { background: ${palette.border}; border-radius: 3px; }
      `}</style>

      {/* header */}
      <div style={{ borderBottom: `1px solid ${palette.border}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 4, background: palette.amber, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Car size={18} color={palette.bg} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontFamily: "Oswald, sans-serif", fontSize: 18, letterSpacing: 1, fontWeight: 500 }}>FLEET CONTROL</div>
            <div style={{ fontSize: 11, color: palette.textMuted, letterSpacing: 0.5 }}>Vehicle Rental Management System — Analytics</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: live ? palette.teal : palette.textMuted, fontFamily: "Oswald, sans-serif", letterSpacing: 1 }}>
            {live ? <Wifi size={13} strokeWidth={2} /> : <WifiOff size={13} strokeWidth={2} />}
            {live ? "LIVE DATA" : "SAMPLE DATA"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
          {["overview", "rentals"].map((t) => (
            <div
              key={t}
              className="rd-tab"
              onClick={() => setTab(t)}
              style={{
                fontFamily: "Oswald, sans-serif",
                fontSize: 12,
                letterSpacing: 1,
                textTransform: "uppercase",
                padding: "8px 16px",
                borderRadius: 4,
                border: `1px solid ${tab === t ? palette.amber : palette.border}`,
                color: tab === t ? palette.amber : palette.textMuted,
                background: tab === t ? "#F2A62314" : "transparent",
              }}
            >
              {t}
            </div>
          ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* KPI strip */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
          <KpiCard icon={TrendingUp} label="Total revenue" value={<Odometer value={totalRevenue} prefix="$" />} sub="Across all brands" accent={palette.amber} />
          <KpiCard icon={Fuel} label="Total rentals" value={<Odometer value={totalRentals} />} sub="Lifetime transactions" accent={palette.teal} />
          <KpiCard icon={Car} label="Fleet size" value={<Odometer value={fleetSize} />} sub={`${fleetUtilization.find(f => f.STATUS === "RENTED")?.VEHICLE_COUNT ?? 0} currently rented`} accent={palette.text} />
          <KpiCard icon={Users} label="Top customer" value={topCustomers[0].CUSTOMER_NAME} sub={<Odometer value={topCustomers[0].TOTAL_SPEND} prefix="$" />} accent={palette.red} />
        </div>

        {tab === "overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 28 }}>
              <div style={{ background: palette.cardSolid, border: `1px solid ${palette.border}`, borderRadius: 4, padding: 18 }}>
                <SectionLabel>Revenue by brand</SectionLabel>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueByBrand}>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.border} vertical={false} />
                    <XAxis dataKey="BRAND" tick={{ fill: palette.textMuted, fontSize: 11 }} axisLine={{ stroke: palette.border }} tickLine={false} />
                    <YAxis tick={{ fill: palette.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: palette.panel, border: `1px solid ${palette.border}`, fontSize: 12 }} labelStyle={{ color: palette.text }} />
                    <Bar dataKey="TOTAL_REVENUE" fill={palette.amber} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: palette.cardSolid, border: `1px solid ${palette.border}`, borderRadius: 4, padding: 18, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <SectionLabel>Fleet status</SectionLabel>
                <Gauge360
                  segments={[
                    { label: "AVAILABLE", value: fleetUtilization[0].VEHICLE_COUNT, color: palette.teal },
                    { label: "RENTED", value: fleetUtilization[1].VEHICLE_COUNT, color: palette.amber },
                    { label: "MAINTENANCE", value: fleetUtilization[2].VEHICLE_COUNT, color: palette.red },
                  ]}
                />
                <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {fleetUtilization.map((f) => (
                    <div key={f.STATUS} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: palette.textMuted }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: f.STATUS === "AVAILABLE" ? palette.teal : f.STATUS === "RENTED" ? palette.amber : palette.red }} />
                      {f.STATUS} ({f.VEHICLE_COUNT})
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
              <div style={{ background: palette.cardSolid, border: `1px solid ${palette.border}`, borderRadius: 4, padding: 18 }}>
                <SectionLabel>Monthly revenue</SectionLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={palette.teal} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={palette.teal} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={palette.border} vertical={false} />
                    <XAxis dataKey="REVENUE_MONTH" tick={{ fill: palette.textMuted, fontSize: 11 }} axisLine={{ stroke: palette.border }} tickLine={false} />
                    <YAxis tick={{ fill: palette.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: palette.panel, border: `1px solid ${palette.border}`, fontSize: 12 }} labelStyle={{ color: palette.text }} />
                    <Area type="monotone" dataKey="MONTHLY_REVENUE" stroke={palette.teal} fill="url(#revFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: palette.cardSolid, border: `1px solid ${palette.border}`, borderRadius: 4, padding: 18 }}>
                <SectionLabel>Top customers</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {topCustomers.map((c, i) => (
                    <div key={c.CUSTOMER_NAME} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: palette.textMuted, fontSize: 11, width: 16 }}>{i + 1}</span>
                        <span>{c.CUSTOMER_NAME}</span>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: palette.amber }}>${c.TOTAL_SPEND}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "rentals" && (
          <div style={{ background: palette.cardSolid, border: `1px solid ${palette.border}`, borderRadius: 4, padding: 18, overflowX: "auto" }} className="rd-scroll">
            <SectionLabel>Active rentals</SectionLabel>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: palette.textMuted, fontFamily: "Oswald, sans-serif", fontSize: 11, letterSpacing: 1 }}>
                  <th style={{ padding: "8px 10px" }}>RENTAL #</th>
                  <th style={{ padding: "8px 10px" }}>CUSTOMER</th>
                  <th style={{ padding: "8px 10px" }}>VEHICLE</th>
                  <th style={{ padding: "8px 10px" }}>SINCE</th>
                </tr>
              </thead>
              <tbody>
                {activeRentals.map((r) => (
                  <tr key={r.RENTAL_ID} style={{ borderTop: `1px solid ${palette.border}` }}>
                    <td style={{ padding: "10px", fontFamily: "'JetBrains Mono', monospace", color: palette.amber }}>#{r.RENTAL_ID}</td>
                    <td style={{ padding: "10px" }}>{r.CUSTOMER_NAME}</td>
                    <td style={{ padding: "10px", color: palette.textMuted }}>{r.BRAND} {r.MODEL}</td>
                    <td style={{ padding: "10px", fontFamily: "'JetBrains Mono', monospace", color: palette.textMuted }}>{r.RENTAL_DATE}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ padding: "0 24px", fontSize: 11, color: palette.textMuted }}>
        {live
          ? "Connected to the live database via the Flask API (backend/app.py)."
          : "Backend not reachable — showing sample data. Run backend/app.py against your Oracle DB for live figures."}
      </div>
    </div>
  );
}

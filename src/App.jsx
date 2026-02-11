import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Line, ReferenceLine, ComposedChart } from "recharts";

const COLORS = { benefit: "#2d6a4f", cost: "#c1121f", neutral: "#457b9d", accent: "#e9c46a", bg: "#f8f9fa" };

export default function BCDashboard() {
  const [rooms, setRooms] = useState(10);
  const [screenPrice, setScreenPrice] = useState(6000);
  const [licensePrice, setLicensePrice] = useState(3600);
  const [installCost, setInstallCost] = useState(5000);
  const [meetingsPerWeek, setMeetingsPerWeek] = useState(30);
  const [startupTimeSaved, setStartupTimeSaved] = useState(480);
  const [consultantsPerMeeting, setConsultantsPerMeeting] = useState(3);
  const [avgHourlyRate, setAvgHourlyRate] = useState(1200);
  const [weeks, setWeeks] = useState(46);
  const [tab, setTab] = useState("overview");

  const totalScreenCost = rooms * screenPrice;
  const totalInstallCost = rooms * installCost;
  const totalLicenseCostYear = rooms * licensePrice;
  const totalInvestment = totalScreenCost + totalInstallCost;
  const totalCostYear1 = totalInvestment + totalLicenseCostYear;

  const timeSavedSecondsYear = meetingsPerWeek * startupTimeSaved * weeks;
  const timeSavedHoursYear = timeSavedSecondsYear / 3600;
  const productivitySavingYear = timeSavedHoursYear * consultantsPerMeeting * avgHourlyRate;

  const netYear1 = productivitySavingYear - totalCostYear1;
  const netYearOngoing = productivitySavingYear - totalLicenseCostYear;
  const paybackMonths = (productivitySavingYear - totalLicenseCostYear) > 0
    ? totalInvestment / ((productivitySavingYear - totalLicenseCostYear) / 12)
    : -1;

  const waterfallData = [
    { name: "Produktivitets-\nbesparing", value: productivitySavingYear, type: "benefit" },
    { name: "Skärm-\nkostnad", value: -totalScreenCost, type: "cost" },
    { name: "Installations-\nkostnad", value: -totalInstallCost, type: "cost" },
    { name: "Licens-\nkostnad (år)", value: -totalLicenseCostYear, type: "cost" },
    { name: "Netto\nÅr 1", value: netYear1, type: "result" },
  ];

  let runningTotal = 0;
  const waterfallBars = waterfallData.map((d, i) => {
    const isLast = i === waterfallData.length - 1;
    if (isLast) {
      const bottom = Math.min(0, runningTotal);
      const top = Math.max(0, runningTotal);
      return { ...d, bottom, top, display: runningTotal };
    }
    const prevTotal = runningTotal;
    runningTotal += d.value;
    if (d.value >= 0) {
      return { ...d, bottom: prevTotal, top: runningTotal, display: d.value };
    } else {
      return { ...d, bottom: runningTotal, top: prevTotal, display: d.value };
    }
  });

  const cashflow = [];
  let cumulative = 0;
  for (let y = 0; y <= 5; y++) {
    if (y === 0) {
      cumulative = -totalInvestment;
      cashflow.push({ year: `År ${y}`, annual: -totalInvestment, cumulative });
    } else {
      const annual = productivitySavingYear - totalLicenseCostYear;
      cumulative += annual;
      cashflow.push({ year: `År ${y}`, annual, cumulative });
    }
  }

  const baseNet = netYear1;
  const sensVars = [
    { name: "Uppstartstid sparad", lo: calcNet(startupTimeSaved * 0.5), hi: calcNet(startupTimeSaved * 1.5) },
    { name: "Antal möten/vecka", lo: calcNetMeetings(meetingsPerWeek * 0.7), hi: calcNetMeetings(meetingsPerWeek * 1.3) },
    { name: "Konsultpris/h", lo: calcNetRate(avgHourlyRate * 0.8), hi: calcNetRate(avgHourlyRate * 1.2) },
    { name: "Skärmpris", lo: calcNetScreen(screenPrice * 1.3), hi: calcNetScreen(screenPrice * 0.7) },
  ];
  const sensData = sensVars.map(s => ({
    name: s.name,
    negative: Math.round((s.lo - baseNet) / 1000),
    positive: Math.round((s.hi - baseNet) / 1000),
  }));

  function calcNet(st) {
    const t = meetingsPerWeek * st * weeks / 3600 * consultantsPerMeeting * avgHourlyRate;
    return t - totalCostYear1;
  }
  function calcNetMeetings(m) {
    const t = m * startupTimeSaved * weeks / 3600 * consultantsPerMeeting * avgHourlyRate;
    return t - totalCostYear1;
  }
  function calcNetRate(r) {
    const t = meetingsPerWeek * startupTimeSaved * weeks / 3600 * consultantsPerMeeting * r;
    return t - totalCostYear1;
  }
  function calcNetScreen(sp) {
    const tc = rooms * sp + totalInstallCost + totalLicenseCostYear;
    return productivitySavingYear - tc;
  }

  const fmt = (v) => `${Math.round(v).toLocaleString("sv-SE")} kr`;
  const fmtK = (v) => `${Math.round(v / 1000)}k`;

  const tabs = [
    { id: "overview", label: "Översikt" },
    { id: "waterfall", label: "Vattenfall" },
    { id: "cashflow", label: "Kassaflöde" },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#f0f2f5", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>
          Business Case: Teams Room-skärmar i mötesrum
        </h1>
        <p style={{ color: "#555", marginBottom: 24, fontSize: 14 }}>
          Ska vi köpa in ny teknik i mötesrummen, eller behålla det gamla?
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total investering", val: fmt(totalInvestment), color: COLORS.cost },
            { label: "Produktivitetsbesparing/år", val: fmt(productivitySavingYear), color: productivitySavingYear >= 0 ? COLORS.benefit : COLORS.cost },
            { label: "Netto År 1", val: fmt(netYear1), color: netYear1 >= 0 ? COLORS.benefit : COLORS.cost },
            { label: "Payback-tid", val: paybackMonths > 0 && paybackMonths < 60 ? `${paybackMonths.toFixed(1)} mån` : "N/A", color: COLORS.neutral },
          ].map((k, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: k.color, marginTop: 4 }}>{k.val}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#333" }}>Justera variabler</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { label: "Antal mötesrum", val: rooms, set: setRooms, min: 1, max: 30, step: 1, unit: "st" },
              { label: "Pris per touchpanel (kr)", val: screenPrice, set: setScreenPrice, min: 2000, max: 15000, step: 500, unit: "kr" },
              { label: "Licens per rum/år (kr)", val: licensePrice, set: setLicensePrice, min: 0, max: 12000, step: 100, unit: "kr" },
              { label: "Installationskostnad/rum", val: installCost, set: setInstallCost, min: 0, max: 20000, step: 500, unit: "kr" },
              { label: "Möten per vecka (alla rum)", val: meetingsPerWeek, set: setMeetingsPerWeek, min: 10, max: 500, step: 5, unit: "st" },
              { label: "Tid sparad per möte (sek)", val: startupTimeSaved, set: setStartupTimeSaved, min: -300, max: 300, step: 5, unit: "sek" },
              { label: "Konsulter per möte (snitt)", val: consultantsPerMeeting, set: setConsultantsPerMeeting, min: 1, max: 10, step: 1, unit: "st" },
              { label: "Konsultpris per timme", val: avgHourlyRate, set: setAvgHourlyRate, min: 500, max: 2500, step: 50, unit: "kr" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 4 }}>
                  <span>{s.label}</span>
                  <span style={{ fontWeight: 600 }}>{s.val.toLocaleString("sv-SE")} {s.unit}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                  onChange={e => s.set(Number(e.target.value))}
                  style={{ width: "100%", accentColor: COLORS.neutral }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                background: tab === t.id ? COLORS.neutral : "#fff",
                color: tab === t.id ? "#fff" : "#333",
                fontWeight: tab === t.id ? 600 : 400,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                fontSize: 14,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          {tab === "overview" && (
            <div>
              <h3 style={{ marginTop: 0, color: "#333" }}>Kostnad vs. Nytta (År 1)</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={[
                  { name: "Touchpaneler", value: totalScreenCost, type: "cost" },
                  { name: "Installation", value: totalInstallCost, type: "cost" },
                  { name: "Licenser (år)", value: totalLicenseCostYear, type: "cost" },
                  { name: "Produktivitet (år)", value: Math.abs(productivitySavingYear), type: productivitySavingYear >= 0 ? "benefit" : "negative" },
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Bar dataKey="value" name="Belopp" radius={[6, 6, 0, 0]}>
                    <Cell fill={COLORS.cost} />
                    <Cell fill={COLORS.cost} />
                    <Cell fill={COLORS.cost} />
                    <Cell fill={productivitySavingYear >= 0 ? COLORS.benefit : COLORS.cost} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 24, fontSize: 13 }}>
                <span><span style={{ display: "inline-block", width: 12, height: 12, background: COLORS.cost, borderRadius: 2, marginRight: 6, verticalAlign: "middle" }}/>Kostnad</span>
                <span><span style={{ display: "inline-block", width: 12, height: 12, background: COLORS.benefit, borderRadius: 2, marginRight: 6, verticalAlign: "middle" }}/>Nytta</span>
              </div>
              {startupTimeSaved < 0 && (
                <p style={{ fontSize: 13, color: COLORS.cost, textAlign: "center", marginTop: 8 }}>
                  ⚠ Negativ tid sparad – den nya lösningen tar längre tid än den gamla!
                </p>
              )}
            </div>
          )}

          {tab === "waterfall" && (() => {
            const allVals = waterfallBars.flatMap(d => [d.bottom, d.top]);
            const maxVal = Math.max(...allVals);
            const minVal = Math.min(...allVals, 0);
            const range = maxVal - minVal || 1;
            const chartH = 350;
            const toY = (v) => chartH - ((v - minVal) / range) * chartH;
            const barW = 60;
            const gap = 40;
            const totalW = waterfallBars.length * (barW + gap) - gap;
            const pad = 60;
            return (
            <div>
              <h3 style={{ marginTop: 0, color: "#333" }}>Vattenfallsdiagram – Resultat År 1</h3>
              <div style={{ overflowX: "auto" }}>
              <svg width={totalW + pad * 2 + 40} height={chartH + 100} style={{ display: "block", margin: "0 auto" }}>
                <g transform={`translate(${pad + 40}, 20)`}>
                  {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
                    const val = minVal + range * (1 - f);
                    const y = f * chartH;
                    return <g key={i}>
                      <line x1={-10} x2={totalW} y1={y} y2={y} stroke="#eee" />
                      <text x={-15} y={y + 4} textAnchor="end" fontSize={11} fill="#888">{fmtK(val)}</text>
                    </g>;
                  })}
                  {minVal < 0 && <line x1={-10} x2={totalW} y1={toY(0)} y2={toY(0)} stroke="#999" strokeWidth={1.5} />}
                  {waterfallBars.map((d, i) => {
                    const x = i * (barW + gap);
                    const yTop = toY(d.top);
                    const yBottom = toY(d.bottom);
                    const h = Math.max(yBottom - yTop, 1);
                    const col = d.type === "benefit" ? COLORS.benefit : d.type === "cost" ? COLORS.cost : (d.display >= 0 ? COLORS.benefit : COLORS.cost);
                    const isLast = i === waterfallBars.length - 1;
                    const isSecondLast = i === waterfallBars.length - 2;
                    const runAfter = d.type === "result" ? null : (d.value >= 0 ? d.top : d.bottom);
                    return <g key={i}>
                      <rect x={x} y={yTop} width={barW} height={h} fill={col} rx={4} />
                      <text x={x + barW / 2} y={yTop - 8} textAnchor="middle" fontSize={12} fontWeight={600} fill={col}>
                        {d.display >= 0 ? "+" : ""}{fmtK(d.display)}
                      </text>
                      {!isLast && !isSecondLast && runAfter !== null && (
                        <line x1={x + barW} x2={x + barW + gap} y1={toY(runAfter)} y2={toY(runAfter)} stroke="#ccc" strokeDasharray="4 2" />
                      )}
                      <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize={10} fill="#555">
                        {d.name.split("\n").map((line, li) => (
                          <tspan key={li} x={x + barW / 2} dy={li === 0 ? 0 : 14}>{line}</tspan>
                        ))}
                      </text>
                    </g>;
                  })}
                </g>
              </svg>
              </div>
              <p style={{ fontSize: 13, color: "#666", textAlign: "center" }}>
                Visar hur nyckelvariabler bygger upp nettoresultatet för År 1
              </p>
            </div>);
          })()}

          {tab === "cashflow" && (
            <div>
              <h3 style={{ marginTop: 0, color: "#333" }}>Kassaflöde på 5 års sikt</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={cashflow} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={fmtK} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => fmt(v)} />
                  <Legend />
                  <ReferenceLine y={0} stroke="#999" />
                  <Bar dataKey="annual" name="Årligt kassaflöde" radius={[6, 6, 0, 0]}>
                    {cashflow.map((e, i) => (
                      <Cell key={i} fill={e.annual >= 0 ? COLORS.benefit : COLORS.cost} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="cumulative" name="Kumulativt" stroke={COLORS.neutral} strokeWidth={3} dot={{ r: 5, fill: COLORS.neutral }} />
                </ComposedChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 13, color: "#666", textAlign: "center" }}>
                {paybackMonths > 0 && paybackMonths < 60
                  ? `Payback-tid: ~${paybackMonths.toFixed(1)} månader`
                  : "Investeringen betalar inte tillbaka sig inom 5 år med nuvarande antaganden"}
              </p>
            </div>
          )}

          {tab === "sensitivity" && (
            <div>
              <h3 style={{ marginTop: 0, color: "#333" }}>Känslighetsanalys (påverkan i tkr vs. basscenario)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sensData} layout="vertical" margin={{ top: 10, right: 40, left: 120, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" tick={{ fontSize: 12 }} label={{ value: "tkr", position: "right", fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
                  <Tooltip formatter={v => `${v} tkr`} />
                  <Legend />
                  <ReferenceLine x={0} stroke="#999" />
                  <Bar dataKey="negative" name="Pessimistiskt" fill={COLORS.cost} radius={[4, 4, 4, 4]} />
                  <Bar dataKey="positive" name="Optimistiskt" fill={COLORS.benefit} radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 13, color: "#666", textAlign: "center" }}>
                Visar hur resultatet påverkas när varje variabel ändras ±30% (±20–50% beroende på variabel)
              </p>
            </div>
          )}
        </div>

        <p style={{ fontSize: 11, color: "#aaa", marginTop: 16, textAlign: "center" }}>
          Branding-effekter (signalvärde, rekrytering, retention) ej kvantifierade – behandlas kvalitativt i beslutsunderlaget.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Lora, Poppins } from "next/font/google";
import "./calculator.css";

const lora = Lora({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--calc-font-display" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--calc-font-sans" });

type Inputs = {
  rooms: string;
  price: string;
  ota: string;
  direct: string;
  otaComm: string;
  mktg: string;
  uplift: string;
  reward: string;
  upsell: string;
};

const DEFAULTS: Inputs = {
  rooms: "50",
  price: "4000",
  ota: "70",
  direct: "30",
  otaComm: "18",
  mktg: "80000",
  uplift: "15",
  reward: "5",
  upsell: "60000",
};

// Indian digit grouping (₹12,34,567), rounded to the rupee.
function fmtINR(n: number) {
  n = Math.round(n);
  const sign = n < 0 ? "−" : "";
  const s = Math.abs(n).toString();
  let last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  if (rest !== "") last3 = "," + last3;
  return sign + "₹" + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + last3;
}

// Monthly figures for a 30-day month. OTA % and Direct % are shares of room
// capacity, so occupancy is their sum (capped at 100%). Rewards and Apti's 1%
// fee apply only to what engagement generates (new direct + up-sell for the
// fee), never to OTA or pre-existing direct revenue.
function calc(v: Inputs) {
  const rooms = +v.rooms;
  const price = +v.price;
  const otaPct = +v.ota;
  const directPct = +v.direct;
  const otaComm = +v.otaComm / 100;
  const mktgSpend = +v.mktg || 0;
  const upliftPts = +v.uplift; // percentage points added to direct %
  const rewardPct = +v.reward / 100;
  const upsellRevenue = +v.upsell || 0;

  const roomsCapacityRevenue = rooms * 30 * price; // revenue if 100% occupied

  const occPresent = Math.min(otaPct + directPct, 100);
  const otaRevenue = roomsCapacityRevenue * (otaPct / 100);
  const directRevenuePresent = roomsCapacityRevenue * (directPct / 100);
  const totalRevenuePresent = otaRevenue + directRevenuePresent;

  const otaCommissionPaid = otaRevenue * otaComm;
  const netBefore = totalRevenuePresent - otaCommissionPaid - mktgSpend;

  // Capped so OTA % + new Direct % never exceeds 100% occupancy.
  const newDirectPct = Math.min(directPct + upliftPts, 100 - otaPct);
  const newDirectRevenue = roomsCapacityRevenue * (newDirectPct / 100);
  const engagementRevenue = Math.max(newDirectRevenue - directRevenuePresent, 0); // net-new revenue only

  const occAfter = Math.min(otaPct + newDirectPct, 100);
  const rewardCost = engagementRevenue * rewardPct;
  const aptiFee = (engagementRevenue + upsellRevenue) * 0.01;

  const netAfter =
    totalRevenuePresent + engagementRevenue + upsellRevenue - otaCommissionPaid - mktgSpend - rewardCost - aptiFee;

  return {
    totalRevenuePresent,
    otaCommissionPaid,
    mktgSpend,
    netBefore,
    netAfter,
    netGain: netAfter - netBefore,
    engagementRevenue,
    upsellRevenue,
    rewardCost,
    aptiFee,
    occPresent,
    occAfter,
    directPct,
    newDirectPct,
  };
}

type SliderProps = {
  id: keyof Inputs;
  label: React.ReactNode;
  display: string;
  min: number;
  max: number;
  step?: number;
  values: Inputs;
  onChange: (id: keyof Inputs, value: string) => void;
};

function SliderRow({ id, label, display, min, max, step, values, onChange }: SliderProps) {
  return (
    <div className="row">
      <div className="row-head">
        <label htmlFor={`calc-${id}`}>{label}</label>
        <span className="val">{display}</span>
      </div>
      <input
        type="range"
        id={`calc-${id}`}
        min={min}
        max={max}
        step={step}
        value={values[id]}
        onChange={(e) => onChange(id, e.target.value)}
      />
    </div>
  );
}

function NumberRow({ id, label, values, onChange }: Pick<SliderProps, "id" | "label" | "values" | "onChange">) {
  return (
    <div className="row">
      <div className="row-head">
        <label htmlFor={`calc-${id}`}>{label}</label>
      </div>
      <div className="numfield">
        <span className="prefix">₹</span>
        <input
          type="number"
          id={`calc-${id}`}
          min={0}
          step={1000}
          value={values[id]}
          onChange={(e) => onChange(id, e.target.value)}
        />
      </div>
    </div>
  );
}

const hint = (text: string) => <span className="hint">{text}</span>;

export default function RevenueCalculator() {
  const [values, setValues] = useState<Inputs>(DEFAULTS);
  const [periodMonths, setPeriodMonths] = useState<1 | 12>(1);

  const set = (id: keyof Inputs, value: string) => setValues((v) => ({ ...v, [id]: value }));
  const r = calc(values);
  const m = periodMonths;
  const pct = (id: keyof Inputs) => values[id] + "%";

  return (
    <div className={`apti-calc ${lora.variable} ${poppins.variable}`}>
      <div className="wrap">
        <header>
          <div className="mark">A</div>
          <div className="brand">Apti</div>
        </header>

        <h1>Revenue opportunity you missed?</h1>
        <p className="lede">
          Model your property&apos;s revenue mix today, then see what engagement tech adds on top when it lifts direct
          bookings — and what that&apos;s genuinely worth after rewards and Apti&apos;s fee on the revenue it generates.
        </p>

        <div className="grid">
          {/* INPUT PANEL */}
          <div className="panel">
            <div className="step">
              <div className="step-num">1</div>
              <p className="section-title">Present Revenue</p>
            </div>
            <p className="section-sub">
              Your property and current booking mix, before Apti. Occupancy is calculated automatically from your OTA
              and direct booking %.
            </p>

            <div className="body-indent">
              <SliderRow id="rooms" label="No. of rooms" display={values.rooms} min={1} max={500} values={values} onChange={set} />
              <SliderRow id="price" label="Avg price / day" display={fmtINR(+values.price)} min={500} max={30000} step={100} values={values} onChange={set} />
              <SliderRow id="ota" label="% of bookings from OTA" display={pct("ota")} min={0} max={100} values={values} onChange={set} />
              <SliderRow id="direct" label="% of direct bookings" display={pct("direct")} min={0} max={100} values={values} onChange={set} />

              <div className="occupancy-readout">
                <div className="lbl">
                  Occupancy<small>auto = OTA % + Direct %</small>
                </div>
                <div className={`num${+values.ota + +values.direct > 100 ? " warn" : ""}`}>{Math.round(r.occPresent)}%</div>
              </div>
            </div>

            <hr className="sep" />

            <div className="step">
              <div className="step-num">2</div>
              <p className="section-title">Expenses</p>
            </div>
            <p className="section-sub">What it currently costs you to sell those rooms.</p>

            <div className="body-indent">
              <SliderRow id="otaComm" label="% OTA commission" display={pct("otaComm")} min={0} max={35} values={values} onChange={set} />
              <NumberRow id="mktg" label={<>Total marketing expenses {hint("/ month")}</>} values={values} onChange={set} />
            </div>

            <hr className="sep" />

            <div className="step">
              <div className="step-num">3</div>
              <p className="section-title">Expected Engagement Revenue</p>
            </div>
            <p className="section-sub">
              Engagement tech % is added on top of your present direct booking %, filling rooms that would otherwise sit
              vacant.
            </p>

            <div className="body-indent">
              <SliderRow
                id="uplift"
                label={<>Engagement tech % {hint("(added to direct booking %)")}</>}
                display={pct("uplift")}
                min={0}
                max={100}
                values={values}
                onChange={set}
              />
              <SliderRow
                id="reward"
                label={<>Engagement tech rewards % {hint("(on engagement revenue only)")}</>}
                display={pct("reward")}
                min={0}
                max={30}
                values={values}
                onChange={set}
              />
              <NumberRow id="upsell" label={<>Up-sell revenue {hint("/ month")}</>} values={values} onChange={set} />
            </div>
          </div>

          {/* RESULTS PANEL */}
          <div className="panel results">
            <div className="toggle">
              <button type="button" className={m === 1 ? "active" : ""} onClick={() => setPeriodMonths(1)}>
                Monthly
              </button>
              <button type="button" className={m === 12 ? "active" : ""} onClick={() => setPeriodMonths(12)}>
                Annual
              </button>
            </div>

            <div className="headline-metric">
              <div className="lbl">Net revenue gain with Apti</div>
              <div className="amt">{fmtINR(r.netGain * m)}</div>
              <div className="sub">
                after rewards paid &amp; Apti&apos;s <b>1% fee on engagement revenue only</b>
              </div>
            </div>

            <div className="compare">
              <div className="card now">
                <div className="clbl">Net revenue — today</div>
                <div className="cval">{fmtINR(r.netBefore * m)}</div>
              </div>
              <div className="card after">
                <div className="clbl">Net revenue — with Apti</div>
                <div className="cval">{fmtINR(r.netAfter * m)}</div>
              </div>
            </div>

            <div className="bar-row">
              <div className="brow-top">
                <span>Occupancy</span>
                <span>
                  {Math.round(r.occPresent)}% → {Math.round(r.occAfter)}%
                </span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${r.occAfter}%` }} />
              </div>
            </div>
            <div className="bar-row">
              <div className="brow-top">
                <span>Direct booking share</span>
                <span>
                  {Math.round(r.directPct)}% → {Math.round(r.newDirectPct)}%
                </span>
              </div>
              <div className="bar-track">
                <div className="bar-fill marigold" style={{ width: `${r.newDirectPct}%` }} />
              </div>
            </div>

            <p className="subhead">PRESENT REVENUE &amp; EXPENSES</p>
            <div className="linelist">
              <LineItem name="Total room revenue" amount={fmtINR(r.totalRevenuePresent * m)} />
              <LineItem name="OTA commission paid" amount={"−" + fmtINR(r.otaCommissionPaid * m)} tone="neg" />
              <LineItem name="Marketing expenses" amount={"−" + fmtINR(r.mktgSpend * m)} tone="neg" />
            </div>

            <p className="subhead">EXPECTED ENGAGEMENT REVENUE</p>
            <div className="linelist">
              <LineItem name="Engagement revenue generated" amount={"+" + fmtINR(r.engagementRevenue * m)} tone="pos" />
              <LineItem name="Up-sell revenue added" amount={"+" + fmtINR(r.upsellRevenue * m)} tone="pos" />
              <LineItem name="Rewards paid out" amount={"−" + fmtINR(r.rewardCost * m)} tone="neg" />
              <LineItem name="Apti platform fee (1% of engagement revenue)" amount={"−" + fmtINR(r.aptiFee * m)} tone="neg" />
            </div>

            <div className="footnote">
              Figures are indicative, based on a 30-day month. Occupancy is auto-derived as OTA % + Direct % and capped
              at 100%. Apti&apos;s fee and reward payouts are calculated only on the revenue engagement tech generates (new
              direct bookings + up-sell) — never on OTA revenue or your pre-existing direct revenue.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LineItem({ name, amount, tone }: { name: string; amount: string; tone?: "pos" | "neg" }) {
  return (
    <div className="lineitem">
      <span className="name">{name}</span>
      <span className={`amt${tone ? ` ${tone}` : ""}`}>{amount}</span>
    </div>
  );
}

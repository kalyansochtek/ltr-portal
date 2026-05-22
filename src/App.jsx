import { useState, useRef, useCallback, useEffect  } from "react";
import { fetchSAMData } from "./api";

// ─── API ──────────────────────────────────────────────────────────────────────
const SYS = `You are an AI public-sector capture strategist for Logical Technology and Research (LTR). Be direct, skeptical, strategic, and operationally credible. Never guarantee awards. Never overstate PWIN. Identify operational, financial, legal, procurement, compliance, staffing, and reputation risks. Always evaluate PRIME/SUB/TEAM/NO-BID. LTR holds: GSA MAS, Polaris HUBZone, OASIS+ HUBZone, SeaPort-NxG. Respond only in valid JSON as instructed.`;

async function ai(prompt, max = 1000) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": typeof import_meta_env !== "undefined" ? import_meta_env.VITE_ANTHROPIC_API_KEY : "",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: max, system: SYS, messages: [{ role: "user", content: prompt }] }),
  });
  const d = await r.json();
  const t = d.content?.map(i => i.text || "").join("") || "";
  try { return JSON.parse(t.replace(/```json|```/g, "").trim()); }
  catch { return { raw: t }; }
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const OPPS = [
  { id:1, title:"IT Modernization Support Services", agency:"DHS CISA", sector:"Federal", naics:"541512", type:"RFP", setAside:"HUBZone", due:"2025-08-15", decision:"PRIME", pwin:72, vehicle:"Polaris HUBZone", stage:"Capture", value:8.5, margin:18, incumbent:"TechFlow Inc", incumbentStr:"Medium" },
  { id:2, title:"Cybersecurity Operations Center", agency:"DoD DISA", sector:"Federal", naics:"541519", type:"RFI", setAside:"8(a)", due:"2025-07-30", decision:"TEAM", pwin:45, vehicle:"OASIS+ HUBZone", stage:"Qualify", value:22, margin:14, incumbent:"CyberGuard LLC", incumbentStr:"Strong" },
  { id:3, title:"AI/ML Analytics Platform", agency:"VA TechOps", sector:"Federal", naics:"541511", type:"Sources Sought", setAside:"SB", due:"2025-09-01", decision:"SUB", pwin:38, vehicle:"GSA MAS", stage:"Identify", value:4.2, margin:12, incumbent:"None Known", incumbentStr:"Weak" },
  { id:4, title:"State ERP Modernization", agency:"Virginia DoT", sector:"State", naics:"541512", type:"RFP", setAside:"None", due:"2025-07-20", decision:"TEAM", pwin:51, vehicle:"NASPO", stage:"Capture", value:15, margin:16, incumbent:"SAP Partner Group", incumbentStr:"Strong" },
  { id:5, title:"County 911 CAD Upgrade", agency:"Fairfax County", sector:"County", naics:"334290", type:"RFP", setAside:"None", due:"2025-10-01", decision:"SUB", pwin:33, vehicle:"Sourcewell", stage:"Identify", value:3.1, margin:11, incumbent:"None Known", incumbentStr:"Weak" },
  { id:6, title:"Transit Data Analytics", agency:"WMATA", sector:"Transportation", naics:"541511", type:"Sources Sought", setAside:"SB", due:"2025-08-20", decision:"PRIME", pwin:64, vehicle:"GSA MAS", stage:"Qualify", value:6.8, margin:20, incumbent:"Accenture Federal", incumbentStr:"Medium" },
];

const CONTACTS = [
  { id:1, name:"Patricia Williams", title:"Contracting Officer", agency:"DHS CISA", type:"Government", stage:"Engaged", calls:3, lastContact:"2025-06-01", email:"p.williams@cisa.dhs.gov", phone:"202-555-0181" },
  { id:2, name:"Marcus Johnson", title:"Small Business Rep", agency:"VA TechOps", type:"Government", stage:"Contacted", calls:1, lastContact:"2025-05-20", email:"m.johnson@va.gov", phone:"202-555-0142" },
  { id:3, name:"Sarah Chen", title:"CEO", agency:"CyberCore Solutions", type:"Partner", stage:"Partner", calls:5, lastContact:"2025-05-28", email:"s.chen@cybercore.com", phone:"703-555-0167" },
  { id:4, name:"Derek Thompson", title:"BD Director", agency:"FedTech Associates", type:"Competitor", stage:"Monitor", calls:0, lastContact:"2025-04-15", email:"d.thompson@fedtech.com", phone:"571-555-0193" },
  { id:5, name:"Linda Park", title:"Program Manager", agency:"DoD DISA", type:"Government", stage:"New", calls:0, lastContact:"", email:"l.park@disa.mil", phone:"703-555-0122" },
];

const CALLS_LOG = [
  { id:1, contactId:1, contact:"Patricia Williams", agency:"DHS CISA", date:"2025-06-01", duration:"14m", outcome:"Positive", notes:"Confirmed HUBZone preference. Follow up with cap statement." },
  { id:2, contactId:2, contact:"Marcus Johnson", agency:"VA TechOps", date:"2025-05-20", duration:"8m", outcome:"Voicemail", notes:"Left voicemail, will retry next week." },
  { id:3, contactId:3, contact:"Sarah Chen", agency:"CyberCore Solutions", date:"2025-05-28", duration:"32m", outcome:"Positive", notes:"Agreed to team on DHS opp. Need NDA." },
];

const REGS = [
  { id:1, name:"SAM.gov Registration", status:"Active", expires:"2026-03-15", daysLeft:303, risk:"Low" },
  { id:2, name:"SBA DSBS Profile", status:"Active", expires:"2026-06-01", daysLeft:381, risk:"Low" },
  { id:3, name:"HUBZone Certification", status:"Active", expires:"2025-09-30", daysLeft:136, risk:"Medium" },
  { id:4, name:"Virginia SWaM Cert", status:"Expiring", expires:"2025-07-31", daysLeft:75, risk:"High" },
  { id:5, name:"CMMC Level 2", status:"In Progress", expires:"N/A", daysLeft:null, risk:"High" },
  { id:6, name:"Sourcewell Cooperative", status:"Not Registered", expires:"N/A", daysLeft:null, risk:"Medium" },
];

const LOSSES = [
  { opp:"DoD Cloud Migration", reason:"Pricing", detail:"$2.1M above competitive range", date:"2025-03", value:18 },
  { opp:"HHS Data Analytics BPA", reason:"Incumbent Advantage", detail:"6-year incumbent, strong CPARS", date:"2025-01", value:8 },
  { opp:"VA Case Management", reason:"Weak Partner", detail:"Sub lacked required past performance", date:"2024-11", value:12 },
  { opp:"DHS SOC Operations", reason:"Poor Relationships", detail:"No prior agency touchpoints", date:"2024-09", value:22 },
  { opp:"Army IT Support", reason:"Wrong Vehicle", detail:"Used MAS; agency preferred OASIS", date:"2024-07", value:9 },
];

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=Space+Grotesk:wght@300;400;500;600;700&family=Fira+Code:wght@300;400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --ink:#0a0c14;
  --ink2:#0f1220;
  --ink3:#161928;
  --ink4:#1c2035;
  --line:#242840;
  --line2:#2e3352;
  --mist:#3d4468;
  --fog:#5a6380;
  --pale:#8892a4;
  --dust:#b0bac8;
  --snow:#dce3ed;
  --white:#f4f7fb;

  --blue:#4d8ef0;
  --blue2:#3a7de8;
  --blue-dim:rgba(77,142,240,.08);
  --blue-glow:rgba(77,142,240,.18);
  --violet:#7c5cfc;
  --violet-dim:rgba(124,92,252,.08);
  --teal:#0fb8b8;
  --teal-dim:rgba(15,184,184,.08);
  --amber:#f0a830;
  --amber-dim:rgba(240,168,48,.08);
  --emerald:#22c88a;
  --emerald-dim:rgba(34,200,138,.08);
  --rose:#f0485a;
  --rose-dim:rgba(240,72,90,.08);
  --coral:#f07848;

  --body:'DM Sans',sans-serif;
  --head:'Space Grotesk',sans-serif;
  --code:'Fira Code',monospace;

  --r4:4px;--r6:6px;--r8:8px;--r12:12px;--r16:16px;
  --sh:0 1px 3px rgba(0,0,0,.4),0 4px 16px rgba(0,0,0,.3);
  --sh2:0 2px 8px rgba(0,0,0,.5),0 8px 32px rgba(0,0,0,.4);
}

body{background:var(--ink);color:var(--snow);font-family:var(--body);font-size:14px;line-height:1.5;min-height:100vh;overflow-x:hidden}
::selection{background:var(--blue-glow);color:var(--white)}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--line2);border-radius:4px}

.app{display:flex;min-height:100vh}

/* ── SIDEBAR ─────────────────────────────────────────────────────────────── */
.sb{
  width:224px;flex-shrink:0;
  background:var(--ink2);
  border-right:1px solid var(--line);
  display:flex;flex-direction:column;
  position:sticky;top:0;height:100vh;overflow-y:auto;
  z-index:10;
}
.sb-logo{
  padding:22px 18px 18px;
  border-bottom:1px solid var(--line);
}
.logo-lockup{display:flex;align-items:center;gap:11px;margin-bottom:5px}
.logo-icon{
  width:36px;height:36px;flex-shrink:0;
  background:linear-gradient(140deg,var(--blue) 0%,var(--violet) 100%);
  border-radius:var(--r8);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--head);font-size:12px;font-weight:700;
  color:#fff;letter-spacing:.04em;
  box-shadow:0 0 16px rgba(77,142,240,.3);
}
.logo-name{font-family:var(--head);font-size:15px;font-weight:700;color:var(--white);letter-spacing:-.01em}
.logo-tag{font-family:var(--code);font-size:8.5px;color:var(--fog);letter-spacing:.12em;text-transform:uppercase}

.nav-group{padding:14px 10px 3px;font-family:var(--code);font-size:8px;color:var(--mist);letter-spacing:.18em;text-transform:uppercase;font-weight:400}

.ni{
  display:flex;align-items:center;gap:9px;
  padding:7px 12px;margin:1px 7px;
  border-radius:var(--r6);cursor:pointer;
  font-size:12.5px;font-weight:500;color:var(--pale);
  transition:all .15s ease;border:1px solid transparent;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.ni:hover{background:var(--ink3);color:var(--snow)}
.ni.active{background:var(--blue-dim);color:var(--blue);border-color:rgba(77,142,240,.15)}
.ni-ic{font-size:13px;width:16px;text-align:center;flex-shrink:0}
.ni-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;transition:all .15s}

.sb-bottom{
  margin-top:auto;padding:14px 18px;
  border-top:1px solid var(--line);
}
.sb-status{display:flex;align-items:center;gap:7px;font-family:var(--code);font-size:9px;color:var(--fog)}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--emerald);box-shadow:0 0 6px var(--emerald);animation:pulse-dot 2s infinite}
@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.4}}

/* ── MAIN ────────────────────────────────────────────────────────────────── */
.main{flex:1;min-width:0;overflow-y:auto;background:var(--ink)}

.ph{
  padding:22px 32px 18px;
  border-bottom:1px solid var(--line);
  background:var(--ink2);
  display:flex;align-items:flex-end;justify-content:space-between;
  position:sticky;top:0;z-index:5;
  backdrop-filter:blur(8px);
}
.ph-title{font-family:var(--head);font-size:19px;font-weight:700;color:var(--white);letter-spacing:-.02em;margin-bottom:2px}
.ph-sub{font-family:var(--code);font-size:10px;color:var(--fog);letter-spacing:.04em}
.ct{padding:26px 32px}

/* ── CARDS ────────────────────────────────────────────────────────────────── */
.card{
  background:var(--ink2);
  border:1px solid var(--line);
  border-radius:var(--r12);
  padding:20px;
  transition:border-color .2s;
}
.card:hover{border-color:var(--line2)}
.card-flush{padding:0}
.ctit{
  font-family:var(--code);font-size:9.5px;font-weight:500;
  letter-spacing:.12em;text-transform:uppercase;
  color:var(--fog);margin-bottom:14px;
}

/* ── GRID ─────────────────────────────────────────────────────────────────── */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.g5{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
.stk{display:flex;flex-direction:column;gap:14px}

/* ── STAT CARDS ──────────────────────────────────────────────────────────── */
.stat{
  background:var(--ink2);border:1px solid var(--line);
  border-radius:var(--r12);padding:18px;
  position:relative;overflow:hidden;
  cursor:default;transition:all .2s;
}
.stat:hover{border-color:var(--line2);transform:translateY(-1px)}
.stat-glow{
  position:absolute;top:-30px;right:-30px;
  width:90px;height:90px;border-radius:50%;
  opacity:.1;filter:blur(24px);pointer-events:none;
}
.stat-label{font-family:var(--code);font-size:9px;color:var(--fog);text-transform:uppercase;letter-spacing:.12em;margin-bottom:7px}
.stat-value{font-family:var(--head);font-size:26px;font-weight:700;letter-spacing:-.03em;line-height:1}
.stat-note{font-family:var(--code);font-size:10px;color:var(--pale);margin-top:5px}
.stat-delta{font-family:var(--code);font-size:10px;margin-top:4px}

/* ── FORM ─────────────────────────────────────────────────────────────────── */
.fg{margin-bottom:13px}
.fl{display:block;font-family:var(--code);font-size:9.5px;font-weight:500;color:var(--pale);margin-bottom:5px;text-transform:uppercase;letter-spacing:.08em}
.fi,.fsel,.fta{
  width:100%;background:var(--ink);border:1px solid var(--line2);
  border-radius:var(--r6);padding:8px 11px;
  color:var(--snow);font-family:var(--body);font-size:13px;
  transition:all .15s;
}
.fi:focus,.fsel:focus,.fta:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 2px var(--blue-glow)}
.fta{min-height:80px;resize:vertical}
.fr2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.fr3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}

/* ── BUTTONS ──────────────────────────────────────────────────────────────── */
.btn{
  display:inline-flex;align-items:center;gap:6px;
  padding:8px 16px;border-radius:var(--r6);
  font-family:var(--body);font-size:12.5px;font-weight:600;
  cursor:pointer;border:none;transition:all .15s;letter-spacing:.01em;
  white-space:nowrap;
}
.btn-p{background:var(--blue);color:#fff}
.btn-p:hover{background:var(--blue2);transform:translateY(-1px);box-shadow:0 4px 12px rgba(77,142,240,.3)}
.btn-s{background:var(--ink3);color:var(--snow);border:1px solid var(--line2)}
.btn-s:hover{border-color:var(--blue);color:var(--blue)}
.btn-g{background:var(--emerald-dim);color:var(--emerald);border:1px solid rgba(34,200,138,.2)}
.btn-r{background:var(--rose-dim);color:var(--rose);border:1px solid rgba(240,72,90,.2)}
.btn-a{background:var(--amber-dim);color:var(--amber);border:1px solid rgba(240,168,48,.2)}
.btn-v{background:var(--violet-dim);color:var(--violet);border:1px solid rgba(124,92,252,.2)}
.btn-lg{padding:11px 22px;font-size:13.5px}
.btn-sm{padding:4px 10px;font-size:11px}
.btn:disabled{opacity:.35;cursor:not-allowed;transform:none!important;box-shadow:none!important}
.w100{width:100%}

/* ── BADGES ──────────────────────────────────────────────────────────────── */
.bdg{
  display:inline-flex;align-items:center;
  padding:2px 7px;border-radius:var(--r4);
  font-family:var(--code);font-size:9px;font-weight:500;
  letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;
}
.bdg-b{background:var(--blue-dim);color:var(--blue);border:1px solid rgba(77,142,240,.15)}
.bdg-g{background:var(--emerald-dim);color:var(--emerald);border:1px solid rgba(34,200,138,.15)}
.bdg-r{background:var(--rose-dim);color:var(--rose);border:1px solid rgba(240,72,90,.15)}
.bdg-a{background:var(--amber-dim);color:var(--amber);border:1px solid rgba(240,168,48,.15)}
.bdg-v{background:var(--violet-dim);color:var(--violet);border:1px solid rgba(124,92,252,.15)}
.bdg-t{background:var(--teal-dim);color:var(--teal);border:1px solid rgba(15,184,184,.15)}
.bdg-f{background:rgba(90,99,128,.1);color:var(--pale);border:1px solid rgba(90,99,128,.15)}
.bdg-c{background:rgba(240,120,72,.1);color:var(--coral);border:1px solid rgba(240,120,72,.15)}

/* ── TABLE ────────────────────────────────────────────────────────────────── */
.tbl{width:100%;border-collapse:collapse;font-size:12.5px}
.tbl th{
  text-align:left;padding:9px 12px;
  font-family:var(--code);font-size:9px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--fog);
  border-bottom:1px solid var(--line);
  white-space:nowrap;
}
.tbl td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}
.tbl tbody tr{transition:background .1s}
.tbl tbody tr:hover td{background:rgba(255,255,255,.02)}

/* ── PROGRESS ─────────────────────────────────────────────────────────────── */
.pbar{height:4px;background:var(--line);border-radius:2px;overflow:hidden}
.pfill{height:100%;border-radius:2px;transition:width .5s cubic-bezier(.4,0,.2,1)}

/* ── SCORE RING ───────────────────────────────────────────────────────────── */
.ring{position:relative;display:inline-flex;align-items:center;justify-content:center}
.ring svg{transform:rotate(-90deg)}
.ring-inner{position:absolute;text-align:center;pointer-events:none}

/* ── KANBAN ───────────────────────────────────────────────────────────────── */
.kboard{display:flex;gap:12px;overflow-x:auto;padding-bottom:10px}
.kcol{min-width:184px;flex-shrink:0;background:var(--ink2);border:1px solid var(--line);border-radius:var(--r12);padding:12px}
.khead{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.kcard{
  background:var(--ink3);border:1px solid var(--line);
  border-radius:var(--r8);padding:11px;margin-bottom:7px;
  cursor:pointer;transition:all .15s;
}
.kcard:hover{border-color:var(--blue);transform:translateY(-1px);box-shadow:var(--sh)}

/* ── ALERTS ───────────────────────────────────────────────────────────────── */
.alert{padding:9px 13px;border-radius:var(--r6);font-size:12px;border-left:2px solid;margin-bottom:7px;line-height:1.5}
.alert-b{background:var(--blue-dim);border-color:var(--blue);color:#93c5fd}
.alert-g{background:var(--emerald-dim);border-color:var(--emerald);color:#6ee7b7}
.alert-r{background:var(--rose-dim);border-color:var(--rose);color:#fca5a5}
.alert-a{background:var(--amber-dim);border-color:var(--amber);color:#fcd34d}

/* ── DECISION BOX ─────────────────────────────────────────────────────────── */
.dec-box{border-radius:var(--r12);padding:22px;text-align:center;border:1.5px solid;margin-bottom:16px}
.dec-prime{border-color:var(--emerald);background:var(--emerald-dim)}
.dec-sub{border-color:var(--blue);background:var(--blue-dim)}
.dec-team{border-color:var(--amber);background:var(--amber-dim)}
.dec-nobid{border-color:var(--rose);background:var(--rose-dim)}

/* ── UPLOAD ZONE ──────────────────────────────────────────────────────────── */
.upload{
  border:1.5px dashed var(--line2);border-radius:var(--r12);
  padding:40px 24px;text-align:center;cursor:pointer;
  transition:all .2s;background:var(--ink);
}
.upload:hover{border-color:var(--blue);background:var(--blue-dim)}

/* ── DIALER MODAL ─────────────────────────────────────────────────────────── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:100}
.modal{background:var(--ink2);border:1px solid var(--line2);border-radius:var(--r16);padding:28px;width:340px;box-shadow:var(--sh2)}

/* ── MISC ─────────────────────────────────────────────────────────────────── */
.div{height:1px;background:var(--line);margin:16px 0}
.row{display:flex;align-items:center}
.row-b{display:flex;align-items:center;justify-content:space-between}
.gap6{gap:6px}.gap8{gap:8px}.gap10{gap:10px}.gap12{gap:12px}
.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}.mb20{margin-bottom:20px}
.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}
.mono{font-family:var(--code)}
.c-fog{color:var(--fog)}.c-pale{color:var(--pale)}.c-snow{color:var(--snow)}.c-blue{color:var(--blue)}.c-grn{color:var(--emerald)}.c-red{color:var(--rose)}.c-amb{color:var(--amber)}.c-vio{color:var(--violet)}
.f11{font-size:11px}.f12{font-size:12px}.f13{font-size:13px}.f14{font-size:14px}
.fw6{font-weight:600}.fw7{font-weight:700}
.spin-wrap{display:flex;align-items:center;gap:10px;padding:16px;color:var(--fog);font-family:var(--code);font-size:11px}
.spinner{width:15px;height:15px;border:2px solid var(--line2);border-top-color:var(--blue);border-radius:50%;animation:spin .75s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.tabs{display:flex;gap:2px;border-bottom:1px solid var(--line);margin-bottom:18px}
.tab{padding:8px 14px;font-size:12px;font-weight:500;cursor:pointer;color:var(--fog);border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s;white-space:nowrap}
.tab.on{color:var(--blue);border-bottom-color:var(--blue)}
.tab:hover{color:var(--snow)}
.chk-group{display:flex;flex-wrap:wrap;gap:7px}
.chk-item{display:flex;align-items:center;gap:5px;font-size:12.5px;cursor:pointer}
.chk-item input{accent-color:var(--blue)}
.chip{display:inline-flex;padding:2px 8px;border-radius:10px;font-size:9.5px;background:var(--ink3);color:var(--pale);font-family:var(--code);border:1px solid var(--line)}
.section-stripe{
  height:3px;border-radius:2px;
  background:linear-gradient(90deg,var(--blue),var(--violet));
  margin-bottom:20px;
}
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function pc(p) { return p >= 65 ? "var(--emerald)" : p >= 42 ? "var(--amber)" : "var(--rose)"; }

function Ring({ score, size = 88, color }) {
  const r = (size - 10) / 2, c = 2 * Math.PI * r, f = (score / 100) * c;
  const col = color || pc(score);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--line)" strokeWidth={5}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={5}
          strokeDasharray={`${f} ${c}`} strokeLinecap="round"/>
      </svg>
      <div className="ring-inner">
        <div style={{ fontFamily:"var(--head)", fontSize: size < 70 ? 16 : 21, fontWeight:700, color:col, lineHeight:1 }}>{score}</div>
        <div style={{ fontFamily:"var(--code)", fontSize:8, color:"var(--fog)", marginTop:2 }}>/100</div>
      </div>
    </div>
  );
}

function Bar({ v, color, h = 4 }) {
  const c = color || pc(v);
  return <div className="pbar" style={{ height: h }}><div className="pfill" style={{ width: `${Math.min(v, 100)}%`, background: c }} /></div>;
}

function Dec({ d }) {
  const m = { PRIME:"bdg-g", SUB:"bdg-b", TEAM:"bdg-a", "NO-BID":"bdg-r" };
  return <span className={`bdg ${m[d] || "bdg-f"}`}>{d}</span>;
}

function Sec({ s }) {
  const m = { Federal:"bdg-b", State:"bdg-v", County:"bdg-c", City:"bdg-t", Transportation:"bdg-g", Education:"bdg-a", "Public Safety":"bdg-r", Utilities:"bdg-f", "Public Health":"bdg-t" };
  return <span className={`bdg ${m[s] || "bdg-f"}`}>{s}</span>;
}

function Spin({ msg }) {
  return <div className="spin-wrap"><div className="spinner"/>{msg || "Processing..."}</div>;
}

function Dl() { return <div className="div"/>; }

// ─── EXECUTIVE DASHBOARD ─────────────────────────────────────────────────────
function ExecDash({ setPage, opps, contacts, calls }) {
  const active = opps.filter(o => o.decision !== "NO-BID");
  const pipe = active.reduce((a, o) => a + o.value, 0);
  const wtd = active.reduce((a, o) => a + o.value * (o.pwin / 100), 0);
  const avgPwin = Math.round(opps.reduce((a, o) => a + o.pwin, 0) / opps.length);
  const avgMargin = Math.round(active.reduce((a, o) => a + o.margin, 0) / active.length);
  const urgent = opps.filter(o => { const d = (new Date(o.due) - new Date()) / 86400000; return d > 0 && d < 60; });
  const sectors = [...new Set(opps.map(o => o.sector))].map(s => ({ s, v: opps.filter(o => o.sector === s).reduce((a, o) => a + o.value, 0) }));

  return (
    <div>
      <div className="ph">
        <div>
          <div className="ph-title">LTR-PSGOS — Executive Command Center</div>
          <div className="ph-sub">PUBLIC SECTOR GROWTH OPERATING SYSTEM · AI-POWERED CAPTURE INTELLIGENCE</div>
        </div>
        <div className="row gap8">
          <span className="bdg bdg-g"><span style={{ width:5,height:5,borderRadius:"50%",background:"var(--emerald)",display:"inline-block",marginRight:5,boxShadow:"0 0 5px var(--emerald)" }}/>LIVE</span>
          <span className="mono f11 c-fog">MAY 2026</span>
        </div>
      </div>

      <div className="ct">
        <div className="g5 mb16">
          {[
            { l:"Total Pipeline", v:`$${pipe.toFixed(1)}M`, n:`${active.length} active opportunities`, a:"var(--blue)" },
            { l:"Weighted Forecast", v:`$${wtd.toFixed(1)}M`, n:"PWIN-adjusted value", a:"var(--emerald)" },
            { l:"Avg PWIN", v:`${avgPwin}%`, n:"portfolio probability", a:pc(avgPwin) },
            { l:"Avg Margin", v:`${avgMargin}%`, n:"estimated gross margin", a:"var(--amber)" },
            { l:"BD Network", v:contacts.length, n:`${calls.length} interactions logged`, a:"var(--violet)" },
          ].map((s, i) => (
            <div className="stat" key={i}>
              <div className="stat-glow" style={{ background: s.a }}/>
              <div className="stat-label">{s.l}</div>
              <div className="stat-value" style={{ color: s.a }}>{s.v}</div>
              <div className="stat-note">{s.n}</div>
            </div>
          ))}
        </div>

        <div className="g2 mb16" style={{ alignItems:"start" }}>
          <div className="card">
            <div className="ctit">Pipeline by Sector</div>
            {sectors.map(({ s, v }) => (
              <div key={s} style={{ marginBottom:10 }}>
                <div className="row-b mb8"><div className="row gap8"><Sec s={s}/><span className="f12">${v.toFixed(1)}M</span></div>
                  <span className="mono f11 c-fog">{Math.round((v/pipe)*100)}%</span></div>
                <Bar v={Math.round((v/pipe)*100)} color="var(--blue)"/>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="ctit">Platform Navigation</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                ["📊 PWIN Dashboard","pwin","btn-p"],
                ["🤖 AI Briefing","briefing","btn-v"],
                ["📄 Upload Analyzer","upload","btn-s"],
                ["⚡ Decision Engine","decision","btn-s"],
                ["🔍 Incumbent Intel","incumbent","btn-s"],
                ["📋 Proposal Status","proposal","btn-s"],
                ["📞 Contact Database","contacts","btn-s"],
                ["📈 Analytics","analytics","btn-s"],
              ].map(([l, p, c], i) => (
                <button key={i} className={`btn ${c} w100`} style={{ justifyContent:"flex-start", fontSize:11.5 }} onClick={() => setPage(p)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="g2 mb16" style={{ alignItems:"start" }}>
          <div className="card">
            <div className="ctit">⚠ Urgent Deadlines</div>
            {urgent.length === 0
              ? <div className="f12 c-fog">No urgent deadlines in next 60 days.</div>
              : urgent.map((o, i) => {
                const d = Math.round((new Date(o.due) - new Date()) / 86400000);
                return (
                  <div key={i} style={{ padding:"9px 0", borderBottom:"1px solid var(--line)" }}>
                    <div className="row-b mb8">
                      <span className="fw6 f12">{o.title}</span>
                      <span className={`bdg ${d < 30 ? "bdg-r" : "bdg-a"}`}>{d}d left</span>
                    </div>
                    <div className="row gap6"><Sec s={o.organizationType}/><Dec d={o.typeOfSetAsideDescription}/><span className="mono f11 c-fog">50% PWIN</span></div>
                  </div>
                );
              })}
          </div>

          <div className="card">
            <div className="ctit">LTR Vehicle Portfolio</div>
            {[
              { v:"GSA MAS", note:"Multiple Award Schedule — IT & professional services", status:"ACTIVE" },
              { v:"Polaris HUBZone", note:"GWAC — IT services, HUBZone set-aside", status:"ACTIVE" },
              { v:"OASIS+ HUBZone", note:"GWAC — professional services, HUBZone", status:"ACTIVE" },
              { v:"SeaPort-NxG", note:"Navy/DoD professional services vehicle", status:"ACTIVE" },
            ].map((v, i) => (
              <div key={i} style={{ padding:"9px 0", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div className="fw6 f12 c-blue mb8" style={{ marginBottom:2 }}>{v.v}</div>
                  <div className="mono f11 c-fog">{v.note}</div>
                </div>
                <span className="bdg bdg-g">{v.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-flush">
          <div className="row-b" style={{ padding:"16px 20px 12px" }}>
            <div className="ctit" style={{ margin:0 }}>Full Opportunity Pipeline</div>
            <button className="btn btn-s btn-sm" onClick={() => setPage("opps")}>View All</button>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>Opportunity</th><th>Agency</th><th>Sector</th><th>Stage</th><th>Decision</th><th>PWIN</th><th>Value</th><th>Margin</th><th>Due</th></tr>
            </thead>
            <tbody>
              {opps.map(o => (
                <tr key={o.id}>
                  <td className="fw6 f12" style={{ maxWidth:200 }}>{o.title}</td>
                  <td><span className="bdg bdg-b">{o.fullParentPathName}</span></td>
                  <td><Sec s={o.organizationType}/></td>
                  <td><span className="bdg bdg-f">{o.stage}</span></td>
                  <td><Dec d={o.typeOfSetAsideDescription}/></td>
                  <td><span className="mono fw7 f12" style={{ color: pc(o.pwin) }}>50%</span></td>
                  <td className="mono f11 c-fog">${o.naicsCode}</td>
                  <td className="mono f11" style={{ color: o.margin >= 18 ? "var(--emerald)" : o.margin >= 12 ? "var(--amber)" : "var(--rose)" }}>15%</td>
                  <td className="mono f11 c-fog">{o.responseDeadLine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PWIN DASHBOARD ──────────────────────────────────────────────────────────
function PWINDash({ opps }) {
  const [view, setView] = useState("all");
  const views = { all: opps, high: opps.filter(o => o.pwin >= 60), urgent: opps.filter(o => { const d = (new Date(o.due) - new Date()) / 86400000; return d > 0 && d < 45; }), nobid: opps.filter(o => o.decision === "NO-BID") };
  const shown = views[view] || opps;

  return (
    <div>
      <div className="ph"><div><div className="ph-title">PWIN Dashboard</div><div className="ph-sub">PROBABILITY-WEIGHTED PIPELINE · PWIN FORECASTING · OPPORTUNITY SCORING</div></div></div>
      <div className="ct">
        <div className="g4 mb16">
          {[
            { l:"Weighted Pipeline", v:`$${opps.filter(o=>o.decision!=="NO-BID").reduce((a,o)=>a+o.value*(o.pwin/100),0).toFixed(1)}M`, a:"var(--emerald)" },
            { l:"High PWIN ≥60%", v:opps.filter(o=>o.pwin>=60).length, a:"var(--emerald)" },
            { l:"Medium 40–59%", v:opps.filter(o=>o.pwin>=40&&o.pwin<60).length, a:"var(--amber)" },
            { l:"Low PWIN <40%", v:opps.filter(o=>o.pwin<40).length, a:"var(--rose)" },
          ].map((s,i) => <div className="stat" key={i}><div className="stat-glow" style={{background:s.a}}/><div className="stat-label">{s.l}</div><div className="stat-value" style={{color:s.a}}>{s.v}</div></div>)}
        </div>
        <div className="tabs">
          {[["all","All"],["high","High PWIN"],["urgent","Urgent <45d"],["nobid","No-Bid"]].map(([k,l]) =>
            <div key={k} className={`tab ${view===k?"on":""}`} onClick={()=>setView(k)}>{l}</div>)}
        </div>
        <div className="stk">
          {shown.map((o, i) => {
            const dLeft = Math.round((new Date(o.due) - new Date()) / 86400000);
            return (
              <div className="card" key={i}>
                <div className="row-b mb16">
                  <div>
                    <div className="fw7 f14 c-snow mb8" style={{ marginBottom:6 }}>{o.title}</div>
                    <div className="row gap6"><span className="bdg bdg-b">{o.fullParentPathName}</span><Sec s={o.organizationType}/><span className="bdg bdg-f">{o.type}</span><Dec d={o.typeOfSetAsideDescription}/></div>
                  </div>
                  <Ring score={50} size={74} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
                  {[
                    { l:"Contract Value", v:`$${o.naicsCode}`, c:"var(--snow)" },
                    { l:"Wtd. Value", v:`$${(o.value*o.pwin/100).toFixed(1)}M`, c:"var(--emerald)" },
                    { l:"Est. Margin", v:`$15%`, c: o.margin>=18?"var(--emerald)":o.margin>=12?"var(--amber)":"var(--rose)" },
                    { l:"Vehicle", v:o.vehicle, c:"var(--blue)", small:true },
                    { l:"Due In", v:dLeft>0?`${dLeft}d`:"Overdue", c:dLeft<30?"var(--rose)":dLeft<60?"var(--amber)":"var(--fog)" },
                  ].map(({ l, v, c, small }) => (
                    <div key={l}>
                      <div className="mono c-fog" style={{ fontSize:8.5, textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>{l}</div>
                      <div className="mono fw7" style={{ fontSize: small?10:15, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AI BRIEFING ──────────────────────────────────────────────────────────────
function AIBriefing({ opps, contacts, calls }) {
  const [type, setType] = useState("weekly");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState(null);

  const generate = async () => {
    setLoading(true); setBrief(null);
    const prompt = `Generate an executive AI briefing for LTR. Type: ${type}. Return JSON only:
{"headline":"","pipelineHealth":"GREEN|YELLOW|RED","pipelineNote":"","topOpportunities":[{"title":"","action":"","urgency":"HIGH|MEDIUM|LOW"}],"keyRisks":[{"risk":"","impact":"HIGH|MEDIUM|LOW"}],"winningMomentum":[],"warningSignals":[],"executiveRecommendations":[],"nextWeekPriorities":[],"bdActivity":{"calls":${calls.length},"contacts":${contacts.length},"openOpps":${opps.filter(o=>o.decision!=="NO-BID").length}}}
Pipeline: ${JSON.stringify(opps.map(o=>({title:o.title,pwin:o.pwin,value:o.value,stage:o.stage,due:o.due,decision:o.decision})))}. Be executive-focused and direct. Return valid JSON only.`;
    try { const d = await ai(prompt); setBrief(d); } catch { setBrief({ error:"Generation failed." }); }
    setLoading(false);
  };

  const hc = h => h === "GREEN" ? "var(--emerald)" : h === "YELLOW" ? "var(--amber)" : "var(--rose)";

  return (
    <div>
      <div className="ph">
        <div><div className="ph-title">AI Executive Briefing</div><div className="ph-sub">AI-GENERATED PIPELINE · RISK · GROWTH INTELLIGENCE REPORTS</div></div>
        <div className="row gap8">
          <select className="fsel" style={{ maxWidth:200, fontSize:12 }} value={type} onChange={e=>setType(e.target.value)}>
            <option value="weekly">Weekly Summary</option>
            <option value="pipeline">Pipeline Report</option>
            <option value="risk">Risk Report</option>
            <option value="growth">Growth Strategy</option>
          </select>
          <button className="btn btn-p" onClick={generate} disabled={loading}>{loading ? "Generating…" : "🤖 Generate Briefing"}</button>
        </div>
      </div>
      <div className="ct">
        {!brief && !loading && (
          <div className="card" style={{ textAlign:"center", padding:"52px 24px" }}>
            <div style={{ fontSize:40, marginBottom:14 }}>🤖</div>
            <div className="fw7 f14 c-snow mb8">AI Executive Intelligence Briefing</div>
            <div className="f12 c-fog" style={{ maxWidth:400, margin:"0 auto" }}>Select a briefing type above and click Generate to receive a strategic AI summary of your BD pipeline, risks, and recommended next actions.</div>
          </div>
        )}
        {loading && <div className="card"><Spin msg="Generating executive AI briefing…"/></div>}
        {brief && !brief.error && (
          <div className="stk">
            <div className="card" style={{ borderColor: hc(brief.pipelineHealth), borderWidth:1.5 }}>
              <div className="row-b mb14">
                <div>
                  <div className="fw7" style={{ fontSize:16, color:"var(--snow)", marginBottom:4 }}>{brief.headline}</div>
                  <div className="mono f11 c-fog">{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
                </div>
                <div style={{ textAlign:"center" }}>
                  <div className="mono" style={{ fontSize:8, color:"var(--fog)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>Pipeline Health</div>
                  <div className="mono fw7" style={{ fontSize:18, color: hc(brief.pipelineHealth) }}>{brief.pipelineHealth}</div>
                </div>
              </div>
              <div className="alert alert-b">{brief.pipelineNote}</div>
            </div>
            <div className="g3">
              <div className="stat"><div className="stat-label">Open Opportunities</div><div className="stat-value c-blue">{brief.bdActivity?.openOpps}</div></div>
              <div className="stat"><div className="stat-label">Contacts</div><div className="stat-value c-vio">{brief.bdActivity?.contacts}</div></div>
              <div className="stat"><div className="stat-label">Calls Logged</div><div className="stat-value c-amb">{brief.bdActivity?.calls}</div></div>
            </div>
            <div className="g2">
              <div className="card">
                <div className="ctit">Opportunities Requiring Action</div>
                {brief.topOpportunities?.map((o,i) => (
                  <div key={i} style={{ padding:"8px 0", borderBottom:"1px solid var(--line)" }}>
                    <div className="row-b mb8"><span className="fw6 f12">{o.title}</span><span className={`bdg ${o.urgency==="HIGH"?"bdg-r":o.urgency==="MEDIUM"?"bdg-a":"bdg-f"}`}>{o.urgency}</span></div>
                    <div className="f11 c-fog">{o.action}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="ctit c-red">Key Risks</div>
                {brief.keyRisks?.map((r,i) => (
                  <div key={i} className="alert alert-r" style={{ margin:"3px 0" }}>
                    <div className="row-b"><span>{r.risk}</span><span className={`bdg ${r.impact==="HIGH"?"bdg-r":r.impact==="MEDIUM"?"bdg-a":"bdg-f"}`}>{r.impact}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="g2">
              <div className="card">
                <div className="ctit c-grn">Winning Momentum</div>
                {brief.winningMomentum?.map((w,i) => <div key={i} className="alert alert-g" style={{ margin:"3px 0" }}>↑ {w}</div>)}
                <Dl/>
                <div className="ctit c-amb">Warning Signals</div>
                {brief.warningSignals?.map((w,i) => <div key={i} className="alert alert-a" style={{ margin:"3px 0" }}>⚠ {w}</div>)}
              </div>
              <div className="card">
                <div className="ctit">Executive Recommendations</div>
                {brief.executiveRecommendations?.map((r,i) => <div key={i} className="alert alert-b" style={{ margin:"3px 0" }}>{i+1}. {r}</div>)}
                <Dl/>
                <div className="ctit">Next Week Priorities</div>
                {brief.nextWeekPriorities?.map((p,i) => <div key={i} style={{ fontSize:12, padding:"5px 0", borderBottom:"1px solid var(--line)" }}>→ {p}</div>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── UPLOAD ANALYZER ─────────────────────────────────────────────────────────
function UploadAnalyzer({ onSave }) {
  const [text, setText] = useState(""); const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const [note, setNote] = useState(""); const fileRef = useRef();

  const handleFile = f => { setFile(f); const r = new FileReader(); r.onload = e => setText(e.target.result?.substring(0,6000)||""); r.readAsText(f); };

  const analyze = async () => {
    setLoading(true); setResult(null);
    const prompt = `Analyze this government solicitation. Return JSON only:
{"title":"","agency":"","sector":"Federal|State|County|City|Transportation|Education|Public Safety|Utilities|Public Health","opportunityType":"RFP|RFI|Sources Sought|Draft RFP","naicsCodes":[],"laborCategories":[],"setAside":"","cooperativePurchasing":"Yes|No|Unknown","dueDate":"","estimatedValue":"","scope":"","vehicleFit":[],"evaluationFactors":[],"complianceRequirements":[],"mandatorySubmissions":[],"incumbentIndicators":"","likelyAcquisitionPath":"","proposalBurden":"LOW|MEDIUM|HIGH","keyRisks":[],"initialDecision":"PRIME|SUB|TEAM|NO-BID","pwin":55,"pwinRationale":""}
Document: ${text||`File: ${file?.name}`}. Return valid JSON only.`;
    try { const d = await ai(prompt); setResult(d); } catch { setResult({ error:"Analysis failed." }); }
    setLoading(false);
  };

  const save = () => {
    if (!result) return;
    onSave({ id:Date.now(), title:result.title||file?.name||"Unknown", agency:result.agency||"Unknown", sector:result.sector||"Federal", naics:result.naicsCodes?.[0]||"N/A", type:result.opportunityType||"RFP", setAside:result.setAside||"None", due:result.dueDate||"TBD", decision:result.initialDecision||"TEAM", pwin:result.pwin||50, vehicle:result.vehicleFit?.[0]||"GSA MAS", stage:"Identify", value:0, margin:14, incumbent:"Unknown", incumbentStr:"Unknown" });
    alert("✓ Saved to pipeline");
  };

  const dCl = d => d==="PRIME"?"dec-prime":d==="NO-BID"?"dec-nobid":d==="TEAM"?"dec-team":"dec-sub";
  const dC = d => d==="PRIME"?"var(--emerald)":d==="NO-BID"?"var(--rose)":d==="TEAM"?"var(--amber)":"var(--blue)";

  return (
    <div>
      <div className="ph"><div><div className="ph-title">Opportunity Upload Analyzer</div><div className="ph-sub">PDF · DOCX · XLSX · TXT — FEDERAL · STATE · LOCAL · COOPERATIVE</div></div></div>
      <div className="ct">
        {!result ? (
          <div className="stk">
            <div className="card">
              <div className="ctit">Upload or Paste Solicitation</div>
              <div className="upload" onClick={() => fileRef.current.click()}>
                <div style={{ fontSize:32, marginBottom:10 }}>{file?"📄":"⬆️"}</div>
                <div className="fw6 f14 c-snow mb8">{file ? file.name : "Drop file here or click to browse"}</div>
                <div className="mono f11 c-fog">PDF · DOCX · XLSX · TXT · ZIP</div>
                <input ref={fileRef} type="file" style={{ display:"none" }} accept=".pdf,.docx,.txt,.xlsx,.zip" onChange={e => e.target.files[0] && handleFile(e.target.files[0])}/>
              </div>
              {!file && <><Dl/><div className="ctit">Or Paste Document Text</div><textarea className="fta" style={{ minHeight:140 }} placeholder="Paste solicitation text, scope of work, or opportunity description…" value={text} onChange={e=>setText(e.target.value)}/></>}
              <button className="btn btn-p btn-lg mt16" onClick={analyze} disabled={loading||(!file&&!text)}>
                {loading ? "Analyzing…" : "🔍 Analyze Solicitation"}
              </button>
              {loading && <Spin msg="Extracting scope, NAICS, compliance requirements, vehicle fit, and bid recommendation…"/>}
            </div>
          </div>
        ) : (
          <div className="stk">
            <div className="row-b">
              <span className="bdg bdg-g">✓ Analysis Complete</span>
              <div className="row gap8">
                <button className="btn btn-s btn-sm" onClick={() => { setResult(null); setFile(null); setText(""); }}>← New</button>
                <button className="btn btn-g btn-sm" onClick={save}>Save to Pipeline</button>
              </div>
            </div>
            {result.error ? <div className="alert alert-r">{result.error}</div> : (
              <>
                <div className="g2">
                  <div className="card">
                    <div className="ctit">Overview</div>
                    {[["Title",result.title],["Agency",result.agency],["Sector",result.sector],["Type",result.opportunityType],["NAICS",result.naicsCodes?.join(", ")],["Set-Aside",result.setAside],["Cooperative",result.cooperativePurchasing],["Due Date",result.dueDate],["Est. Value",result.estimatedValue]].filter(([,v])=>v).map(([k,v]) => (
                      <div key={k} className="row-b" style={{ padding:"6px 0", borderBottom:"1px solid var(--line)" }}>
                        <span className="mono f11 c-fog">{k}</span>
                        <span className="fw6 f12">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <div className={`dec-box ${dCl(result.initialDecision)}`}>
                      <div className="mono c-fog" style={{ fontSize:9, letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>LTR Should</div>
                      <div style={{ fontFamily:"var(--head)", fontSize:32, fontWeight:700, color:dC(result.initialDecision) }}>{result.initialDecision}</div>
                      <div className="mono c-fog f11" style={{ marginTop:5 }}>PWIN: {result.pwin}%</div>
                    </div>
                    <div className="alert alert-b mb12">{result.pwinRationale}</div>
                    <div className="ctit">Vehicle Fit</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>{result.vehicleFit?.map(v=><span key={v} className="bdg bdg-b">{v}</span>)}</div>
                    <div className="ctit">Proposal Burden</div>
                    <span className={`bdg ${result.proposalBurden==="HIGH"?"bdg-r":result.proposalBurden==="MEDIUM"?"bdg-a":"bdg-g"}`}>{result.proposalBurden}</span>
                  </div>
                </div>
                <div className="g3">
                  <div className="card">
                    <div className="ctit">Scope</div>
                    <p className="f12 c-pale" style={{ lineHeight:1.65 }}>{result.scope}</p>
                    {result.laborCategories?.length > 0 && <><Dl/><div className="ctit">Labor Categories</div><div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>{result.laborCategories.map(l=><span key={l} className="chip">{l}</span>)}</div></>}
                  </div>
                  <div className="card">
                    <div className="ctit">Compliance Requirements</div>
                    {result.complianceRequirements?.map((c,i) => <div key={i} className="f12" style={{ padding:"4px 0", borderBottom:"1px solid var(--line)", color:"var(--pale)" }}>⚠ {c}</div>)}
                  </div>
                  <div className="card">
                    <div className="ctit c-red">Key Risks</div>
                    {result.keyRisks?.map((r,i) => <div key={i} className="alert alert-r" style={{ margin:"3px 0", fontSize:11 }}>{r}</div>)}
                    <Dl/>
                    <div className="ctit">Admin Notes</div>
                    <textarea className="fta" value={note} onChange={e=>setNote(e.target.value)} placeholder="Internal BD notes…"/>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPANY ASSESSMENT ───────────────────────────────────────────────────────
function CompanyAssess() {
  const [form, setForm] = useState({ companyName:"", uei:"", cage:"", state:"", revenue:"", employees:"", naics:"", certifications:[], vehicles:[], pastPerf:"", capabilities:"", weaknesses:"", cmmc:"", fedramp:"", cyber:"", clearances:[], targetSectors:[] });
  const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const tog = (k,v) => setForm(f=>({...f,[k]:f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v]}));

  const assess = async () => {
    setLoading(true); setResult(null);
    const prompt = `Assess company for public-sector readiness and LTR partnership fit. Return JSON only:
{"readinessScore":72,"ltrFitScore":65,"maturityTier":"ENTERPRISE|GROWTH|EMERGING|NOT READY","strengthsList":[],"weaknessesList":[],"hiddenRisks":[],"partnershipRecommendation":"PRIME PARTNER|SUB UNDER LTR|TEAMING CANDIDATE|DO NOT PURSUE","partnershipRationale":"","complianceGaps":[],"vehicleAlignment":[],"sectorFit":[],"nextSteps":[],"flaggedConcerns":[],"certPathway":""}
Profile: ${JSON.stringify(form)}. Be skeptical. Return valid JSON only.`;
    try { const d = await ai(prompt); setResult(d); } catch { setResult({ error:"Failed." }); }
    setLoading(false);
  };

  const certs = ["8(a)","HUBZone","SDVOSB","VOSB","WOSB","EDWOSB","MBE","DBE","SBE","AbilityOne"];
  const vehicles = ["GSA MAS","Polaris HUBZone","OASIS+ HUBZone","SeaPort-NxG","SEWP V","CIO-SP4","NASPO","Sourcewell","None"];
  const sectors = ["Federal","State","County","City","Transportation","Education","Public Safety","Utilities","Public Health"];
  const clearances = ["Public Trust","Secret","Top Secret","TS/SCI","SSBI","None"];

  return (
    <div>
      <div className="ph"><div><div className="ph-title">Company Readiness Assessment</div><div className="ph-sub">FEDERAL · STATE · LOCAL · COOPERATIVE PURCHASING READINESS</div></div></div>
      <div className="ct">
        {!result ? (
          <div className="g2" style={{ alignItems:"start" }}>
            <div className="stk">
              <div className="card">
                <div className="ctit">Company Identity</div>
                <div className="fr2">
                  <div className="fg"><label className="fl">Company Name</label><input className="fi" value={form.companyName} onChange={e=>set("companyName",e.target.value)} placeholder="Acme Federal Solutions"/></div>
                  <div className="fg"><label className="fl">State</label><input className="fi" value={form.state} onChange={e=>set("state",e.target.value)} placeholder="Virginia"/></div>
                </div>
                <div className="fr3">
                  <div className="fg"><label className="fl">UEI</label><input className="fi" value={form.uei} onChange={e=>set("uei",e.target.value)} placeholder="SAM.gov UEI"/></div>
                  <div className="fg"><label className="fl">CAGE</label><input className="fi" value={form.cage} onChange={e=>set("cage",e.target.value)} placeholder="CAGE Code"/></div>
                  <div className="fg"><label className="fl">Revenue</label><input className="fi" value={form.revenue} onChange={e=>set("revenue",e.target.value)} placeholder="$2.5M"/></div>
                </div>
                <div className="fr2">
                  <div className="fg"><label className="fl">Employees</label><input className="fi" value={form.employees} onChange={e=>set("employees",e.target.value)} placeholder="25"/></div>
                  <div className="fg"><label className="fl">Primary NAICS</label><input className="fi" value={form.naics} onChange={e=>set("naics",e.target.value)} placeholder="541512, 541519…"/></div>
                </div>
              </div>
              <div className="card">
                <div className="ctit">Certifications</div>
                <div className="chk-group">{certs.map(c=><label key={c} className="chk-item"><input type="checkbox" checked={form.certifications.includes(c)} onChange={()=>tog("certifications",c)}/>{c}</label>)}</div>
                <Dl/>
                <div className="ctit">Contract Vehicles</div>
                <div className="chk-group">{vehicles.map(v=><label key={v} className="chk-item"><input type="checkbox" checked={form.vehicles.includes(v)} onChange={()=>tog("vehicles",v)}/>{v}</label>)}</div>
              </div>
              <div className="card">
                <div className="ctit">Target Sectors</div>
                <div className="chk-group">{sectors.map(s=><label key={s} className="chk-item"><input type="checkbox" checked={form.targetSectors.includes(s)} onChange={()=>tog("targetSectors",s)}/>{s}</label>)}</div>
                <Dl/>
                <div className="ctit">Security Clearances</div>
                <div className="chk-group">{clearances.map(c=><label key={c} className="chk-item"><input type="checkbox" checked={form.clearances.includes(c)} onChange={()=>tog("clearances",c)}/>{c}</label>)}</div>
              </div>
            </div>
            <div className="stk">
              <div className="card">
                <div className="fg"><label className="fl">Key Capabilities</label><textarea className="fta" value={form.capabilities} onChange={e=>set("capabilities",e.target.value)} placeholder="Core technical capabilities, solutions, and service areas…"/></div>
                <div className="fg"><label className="fl">Known Weaknesses</label><textarea className="fta" value={form.weaknesses} onChange={e=>set("weaknesses",e.target.value)} placeholder="Gaps, limitations, past performance issues…"/></div>
                <div className="fg"><label className="fl">Past Performance</label><textarea className="fta" value={form.pastPerf} onChange={e=>set("pastPerf",e.target.value)} placeholder="Contract numbers, agencies, values, recency…"/></div>
              </div>
              <div className="card">
                <div className="ctit">Compliance Posture</div>
                <div className="fr3">
                  <div className="fg"><label className="fl">CMMC Level</label><select className="fsel" value={form.cmmc} onChange={e=>set("cmmc",e.target.value)}><option value="">Unknown</option><option>Level 1</option><option>Level 2</option><option>Level 3</option><option>Not Started</option></select></div>
                  <div className="fg"><label className="fl">FedRAMP</label><select className="fsel" value={form.fedramp} onChange={e=>set("fedramp",e.target.value)}><option value="">N/A</option><option>Authorized</option><option>In Process</option><option>Ready</option><option>None</option></select></div>
                  <div className="fg"><label className="fl">Cybersecurity</label><select className="fsel" value={form.cyber} onChange={e=>set("cyber",e.target.value)}><option value="">Select…</option><option>Strong</option><option>Moderate</option><option>Developing</option><option>Weak</option></select></div>
                </div>
              </div>
              <button className="btn btn-p btn-lg w100" onClick={assess} disabled={loading||!form.companyName}>{loading?"Assessing…":"🤖 Run AI Readiness Assessment"}</button>
              {loading && <Spin msg="Analyzing readiness, partnership fit, and public-sector maturity…"/>}
            </div>
          </div>
        ) : (
          <div className="stk">
            <div className="row-b"><span className="bdg bdg-g">✓ {form.companyName} — Complete</span><button className="btn btn-s btn-sm" onClick={()=>setResult(null)}>← New</button></div>
            <div className="g4">
              <div className="stat" style={{ textAlign:"center" }}><Ring score={result.readinessScore||0} size={80}/><div className="mono c-fog" style={{ fontSize:9, textTransform:"uppercase", letterSpacing:".1em", marginTop:8 }}>Readiness</div></div>
              <div className="stat" style={{ textAlign:"center" }}><Ring score={result.ltrFitScore||0} size={80} color="var(--violet)"/><div className="mono c-fog" style={{ fontSize:9, textTransform:"uppercase", letterSpacing:".1em", marginTop:8 }}>LTR Fit</div></div>
              <div className="stat"><div className="stat-label">Maturity Tier</div><div className="stat-value" style={{ fontSize:17, marginTop:8, color:result.maturityTier==="ENTERPRISE"?"var(--emerald)":result.maturityTier==="GROWTH"?"var(--amber)":"var(--rose)" }}>{result.maturityTier}</div><div className="stat-note">{result.certPathway}</div></div>
              <div className="stat"><div className="stat-label">Partnership Rec.</div><div style={{ marginTop:8 }}><span className={`bdg ${result.partnershipRecommendation?.includes("PRIME")?"bdg-g":result.partnershipRecommendation?.includes("DO NOT")?"bdg-r":"bdg-a"}`}>{result.partnershipRecommendation}</span><div className="f11 c-fog mt8">{result.partnershipRationale}</div></div></div>
            </div>
            <div className="g3">
              <div className="card"><div className="ctit c-grn">✓ Strengths</div>{result.strengthsList?.map((s,i)=><div key={i} className="alert alert-g" style={{ margin:"3px 0", fontSize:11 }}>{s}</div>)}</div>
              <div className="card"><div className="ctit c-amb">⚠ Weaknesses</div>{result.weaknessesList?.map((w,i)=><div key={i} className="alert alert-a" style={{ margin:"3px 0", fontSize:11 }}>{w}</div>)}</div>
              <div className="card"><div className="ctit c-red">🚨 Hidden Risks</div>{result.hiddenRisks?.map((r,i)=><div key={i} className="alert alert-r" style={{ margin:"3px 0", fontSize:11 }}>{r}</div>)}</div>
            </div>
            <div className="g3">
              <div className="card"><div className="ctit">Sector Fit</div><div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{result.sectorFit?.map(s=><Sec key={s} s={s}/>)}</div></div>
              <div className="card"><div className="ctit">Vehicle Alignment</div><div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{result.vehicleAlignment?.map(v=><span key={v} className="bdg bdg-b">{v}</span>)}</div></div>
              <div className="card"><div className="ctit">Compliance Gaps</div>{result.complianceGaps?.map((g,i)=><div key={i} className="f12 c-pale" style={{ padding:"4px 0", borderBottom:"1px solid var(--line)" }}>✗ {g}</div>)}</div>
            </div>
            <div className="card"><div className="ctit">Next Steps</div><div className="g3">{result.nextSteps?.map((s,i)=><div key={i} className="alert alert-b">{i+1}. {s}</div>)}</div></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DECISION ENGINE ─────────────────────────────────────────────────────────
function DecisionEngine() {
  const [form, setForm] = useState({ oppTitle:"", agency:"", sector:"Federal", value:"", naics:"", setAside:"", notes:"", staffingRisk:"3", complianceRisk:"3", marginPotential:"3", strategicValue:"3", incumbentStrength:"3" });
  const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const dC = d => d==="PRIME"?"var(--emerald)":d==="NO-BID"?"var(--rose)":d==="TEAM"?"var(--amber)":"var(--blue)";
  const dCl = d => d==="PRIME"?"dec-prime":d==="NO-BID"?"dec-nobid":d==="TEAM"?"dec-team":"dec-sub";

  const evaluate = async () => {
    setLoading(true); setResult(null);
    const prompt = `Evaluate for LTR's Prime/Sub/Team/No-Bid decision. Return JSON only:
{"decision":"PRIME|SUB|TEAM|NO-BID","confidence":78,"rationale":"","vehicleAlignment":{"score":80,"notes":""},"agencyRelationship":{"score":60,"notes":""},"pastPerformanceFit":{"score":70,"notes":""},"staffingRealism":{"score":65,"notes":""},"financialExposure":{"score":40,"notes":""},"marginQuality":{"score":60,"notes":""},"complianceRisk":{"score":30,"notes":""},"deliveryRisk":{"score":50,"notes":""},"incumbentStrength":{"score":70,"notes":""},"scalability":{"score":65,"notes":""},"strategicValue":{"score":70,"notes":""},"pwin":58,"requiredPartners":[],"criticalRisks":[],"conditions":[]}
Opportunity: ${JSON.stringify(form)}. Return valid JSON only.`;
    try { const d = await ai(prompt); setResult(d); } catch { setResult({ error:"Failed." }); }
    setLoading(false);
  };

  return (
    <div>
      <div className="ph"><div><div className="ph-title">Prime / Sub Decision Engine</div><div className="ph-sub">11-FACTOR AI BID ANALYSIS · PWIN · RISK SCORECARD</div></div></div>
      <div className="ct">
        {!result ? (
          <div className="g2" style={{ alignItems:"start" }}>
            <div className="card">
              <div className="ctit">Opportunity Parameters</div>
              <div className="fg"><label className="fl">Opportunity Title</label><input className="fi" value={form.oppTitle} onChange={e=>set("oppTitle",e.target.value)} placeholder="IT Modernization Support…"/></div>
              <div className="fr2">
                <div className="fg"><label className="fl">Agency</label><input className="fi" value={form.agency} onChange={e=>set("agency",e.target.value)} placeholder="DHS CISA"/></div>
                <div className="fg"><label className="fl">Sector</label><select className="fsel" value={form.sector} onChange={e=>set("sector",e.target.value)}>{["Federal","State","County","City","Transportation","Education","Public Safety","Utilities","Public Health"].map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div className="fr2">
                <div className="fg"><label className="fl">Est. Value</label><input className="fi" value={form.value} onChange={e=>set("value",e.target.value)} placeholder="$5M"/></div>
                <div className="fg"><label className="fl">Set-Aside</label><select className="fsel" value={form.setAside} onChange={e=>set("setAside",e.target.value)}><option value="">None/Full & Open</option><option>HUBZone</option><option>8(a)</option><option>SDVOSB</option><option>WOSB</option><option>Small Business</option><option>NASPO</option><option>Sourcewell</option></select></div>
              </div>
              <div className="fg"><label className="fl">Context & Intelligence</label><textarea className="fta" value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Incumbent, competitors, agency relationship, compliance concerns…"/></div>
            </div>
            <div className="card">
              <div className="ctit">Risk & Value Factors (1=Low · 5=High)</div>
              {[["staffingRisk","Staffing Risk"],["complianceRisk","Compliance Risk"],["marginPotential","Margin Potential"],["strategicValue","Strategic Value"],["incumbentStrength","Incumbent Strength"]].map(([k,l]) => (
                <div key={k} style={{ marginBottom:16 }}>
                  <div className="row-b mb8"><span className="mono f11 c-fog">{l}</span><span className="mono fw7 f13 c-blue">{form[k]}/5</span></div>
                  <input type="range" min={1} max={5} value={form[k]} onChange={e=>set(k,e.target.value)} style={{ width:"100%", accentColor:"var(--blue)", cursor:"pointer" }}/>
                </div>
              ))}
              <button className="btn btn-p btn-lg w100 mt16" onClick={evaluate} disabled={loading||!form.oppTitle}>{loading?"Evaluating…":"⚡ Run Decision Analysis"}</button>
              {loading && <Spin msg="Evaluating 11 decision factors…"/>}
            </div>
          </div>
        ) : (
          <div className="stk">
            <div className="row-b"><span className="bdg bdg-g">✓ Decision Complete</span><button className="btn btn-s btn-sm" onClick={()=>setResult(null)}>← New</button></div>
            <div className="g2">
              <div className="card">
                <div className={`dec-box ${dCl(result.decision)}`}>
                  <div className="mono c-fog" style={{ fontSize:9, letterSpacing:".12em", textTransform:"uppercase", marginBottom:8 }}>LTR Recommendation</div>
                  <div style={{ fontFamily:"var(--head)", fontSize:32, fontWeight:700, color:dC(result.decision) }}>{result.decision}</div>
                  <div className="mono c-fog f11 mt8">Confidence: {result.confidence}%</div>
                </div>
                <div className="alert alert-b mb12">{result.rationale}</div>
                <div className="row-b mt16"><span className="f13 c-fog">PWIN Estimate</span><span className="mono fw7" style={{ fontSize:24, color:pc(result.pwin) }}>{result.pwin}%</span></div>
                {result.requiredPartners?.length > 0 && <><Dl/><div className="ctit">Required Partners</div>{result.requiredPartners.map((p,i)=><div key={i} className="f12 c-pale" style={{ padding:"4px 0", borderBottom:"1px solid var(--line)" }}>+ {p}</div>)}</>}
              </div>
              <div className="card">
                <div className="ctit">11-Factor Scorecard</div>
                {[["vehicleAlignment","Vehicle Alignment"],["agencyRelationship","Agency Relationship"],["pastPerformanceFit","Past Performance"],["staffingRealism","Staffing Realism"],["financialExposure","Financial Exposure"],["marginQuality","Margin Quality"],["complianceRisk","Compliance Risk"],["deliveryRisk","Delivery Risk"],["incumbentStrength","Incumbent Strength"],["scalability","Scalability"],["strategicValue","Strategic Value"]].filter(([k])=>result[k]).map(([k,l]) => (
                  <div key={k} style={{ marginBottom:9 }}>
                    <div className="row-b mb8"><span className="f12">{l}</span><span className="mono f11">{result[k]?.score}</span></div>
                    <Bar v={result[k]?.score||0}/>
                    {result[k]?.notes && <div className="mono f10 c-fog mt8" style={{ fontStyle:"italic", marginTop:2 }}>{result[k].notes}</div>}
                  </div>
                ))}
                {result.criticalRisks?.length > 0 && <><Dl/><div className="ctit c-red">Critical Risks</div>{result.criticalRisks.map((r,i)=><div key={i} className="alert alert-r" style={{ margin:"3px 0", fontSize:11 }}>{r}</div>)}</>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── INCUMBENT INTEL ─────────────────────────────────────────────────────────
function IncumbentIntel({ opps }) {
  const [sel, setSel] = useState(null); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);

  const analyze = async opp => {
    setSel(opp); setLoading(true); setResult(null);
    const prompt = `Analyze incumbent for this opportunity. Return JSON only:
{"incumbentName":"${opp.incumbent}","strengthScore":${opp.incumbentStr==="Strong"?80:opp.incumbentStr==="Medium"?55:30},"incumbentStrengths":[],"incumbentVulnerabilities":[],"cparsRisk":"HIGH|MEDIUM|LOW","cparsRationale":"","staffingChurnRisk":"HIGH|MEDIUM|LOW","protestHistory":"Known|None Known|Unknown","recompeteStrategy":"","ltrApproach":"","keyRisks":[],"winConditions":[]}
Opportunity: ${JSON.stringify({title:opp.title,agency:opp.agency,value:opp.value,pwin:opp.pwin,setAside:opp.setAside})}. Return valid JSON only.`;
    try { const d = await ai(prompt); setResult(d); } catch { setResult({ error:"Failed." }); }
    setLoading(false);
  };

  const rc = s => s==="HIGH"?"bdg-r":s==="MEDIUM"?"bdg-a":"bdg-g";

  return (
    <div>
      <div className="ph"><div><div className="ph-title">Incumbent Intelligence</div><div className="ph-sub">STRENGTH ANALYSIS · CPARS RISK · RECOMPETE STRATEGY · DISPLACEMENT PLANNING</div></div></div>
      <div className="ct">
        <div className="g2" style={{ alignItems:"start" }}>
          <div className="card">
            <div className="ctit">Select Opportunity</div>
            {opps.map((o,i) => (
              <div key={i} onClick={()=>analyze(o)} style={{ padding:11, borderRadius:"var(--r8)", border:`1px solid ${sel?.id===o.id?"var(--blue)":"var(--line)"}`, marginBottom:7, cursor:"pointer", background:sel?.id===o.id?"var(--blue-dim)":"transparent", transition:"all .15s" }}>
                <div className="fw6 f12 mb8" style={{ marginBottom:5 }}>{o.title}</div>
                <div className="row gap6 mb8"><span className="bdg bdg-b">{o.fullParentPathName}</span><Sec s={o.organizationType}/></div>
                <div className="row gap8"><span className="mono f10 c-fog">Incumbent:</span><span className="fw6 f11">{o.incumbent}</span><span className={`bdg ${o.incumbentStr==="Strong"?"bdg-r":o.incumbentStr==="Medium"?"bdg-a":"bdg-g"}`}>{o.incumbentStr}</span></div>
              </div>
            ))}
          </div>
          <div className="stk">
            {!sel && <div className="card" style={{ textAlign:"center", padding:"40px 24px" }}><div className="f13 c-fog">← Select an opportunity to analyze the incumbent</div></div>}
            {loading && <div className="card"><Spin msg="Analyzing incumbent strength, CPARS risk, and displacement strategy…"/></div>}
            {result && !result.error && (
              <>
                <div className="card">
                  <div className="row-b mb16">
                    <div><div className="fw7" style={{ fontSize:15, color:"var(--snow)" }}>{result.incumbentName}</div><div className="f11 c-fog mt8">{sel?.agency} — {sel?.title}</div></div>
                    <Ring score={result.strengthScore} size={70} color={result.strengthScore>=70?"var(--rose)":result.strengthScore>=50?"var(--amber)":"var(--emerald)"}/>
                  </div>
                  <div className="g3" style={{ gap:10, marginBottom:14 }}>
                    {[["CPARS Risk",result.cparsRisk,rc(result.cparsRisk)],["Staffing Churn",result.staffingChurnRisk,rc(result.staffingChurnRisk)],["Protest History",result.protestHistory||"Unknown","bdg-f"]].map(([l,v,c]) => (
                      <div key={l}><div className="mono c-fog" style={{ fontSize:8, textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>{l}</div><span className={`bdg ${c}`}>{v}</span></div>
                    ))}
                  </div>
                  <Dl/>
                  <div className="ctit">Vulnerabilities</div>
                  {result.incumbentVulnerabilities?.map((v,i)=><div key={i} className="alert alert-g" style={{ margin:"3px 0" }}>{v}</div>)}
                </div>
                <div className="card">
                  <div className="ctit">Recompete Strategy</div>
                  <p className="f12 c-pale" style={{ lineHeight:1.65, marginBottom:14 }}>{result.recompeteStrategy}</p>
                  <div className="ctit">LTR Approach</div>
                  <p className="f12 c-fog" style={{ lineHeight:1.65, marginBottom:14 }}>{result.ltrApproach}</p>
                  <div className="ctit">Win Conditions</div>
                  {result.winConditions?.map((c,i)=><div key={i} className="alert alert-b" style={{ margin:"3px 0" }}>→ {c}</div>)}
                  <Dl/>
                  <div className="ctit c-red">Key Risks</div>
                  {result.keyRisks?.map((r,i)=><div key={i} className="alert alert-r" style={{ margin:"3px 0" }}>{r}</div>)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROPOSAL READINESS ───────────────────────────────────────────────────────
function ProposalReadiness({ opps }) {
  const [sel, setSel] = useState(opps[0]);
  const [items, setItems] = useState([
    { id:1, section:"Past Performance", status:"In Progress", risk:"Medium", owner:"BD Lead", notes:"Need 3 more references" },
    { id:2, section:"Technical Approach", status:"Not Started", risk:"High", owner:"Capture Mgr", notes:"" },
    { id:3, section:"Management Approach", status:"In Progress", risk:"Low", owner:"PM", notes:"Draft complete" },
    { id:4, section:"Staffing Plan", status:"Gap", risk:"High", owner:"Recruiter", notes:"Missing 2 key labor categories" },
    { id:5, section:"Pricing Volume", status:"Not Started", risk:"High", owner:"Finance", notes:"Awaiting labor rates" },
    { id:6, section:"Résumés", status:"In Progress", risk:"Medium", owner:"Recruiting", notes:"4 of 8 collected" },
    { id:7, section:"Security Clearances", status:"Complete", risk:"Low", owner:"FSO", notes:"All verified" },
    { id:8, section:"Partner Sections", status:"Gap", risk:"High", owner:"Partner Mgr", notes:"CyberCore behind schedule" },
  ]);
  const complete = items.filter(i=>i.status==="Complete").length;
  const pct = Math.round((complete/items.length)*100);
  const upd = (id,k,v) => setItems(p=>p.map(i=>i.id===id?{...i,[k]:v}:i));
  const sb = s => s==="Complete"?"bdg-g":s==="In Progress"?"bdg-b":s==="Gap"?"bdg-r":"bdg-f";
  const rb = r => r==="High"?"bdg-r":r==="Medium"?"bdg-a":"bdg-g";

  return (
    <div>
      <div className="ph">
        <div><div className="ph-title">Proposal Readiness</div><div className="ph-sub">SECTION TRACKING · STAFFING GAPS · COMPLIANCE CHECKLIST · PARTNER STATUS</div></div>
        <select className="fsel" style={{ maxWidth:280, fontSize:12 }} value={sel?.id} onChange={e=>setSel(opps.find(o=>o.id===parseInt(e.target.value)))}>
          {opps.map(o=><option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
      </div>
      <div className="ct">
        <div className="g4 mb16">
          {[
            { l:"Completion", v:`${pct}%`, c:pct>=70?"var(--emerald)":pct>=40?"var(--amber)":"var(--rose)" },
            { l:"Complete", v:`${complete}/${items.length}`, c:"var(--snow)" },
            { l:"High Risk Items", v:items.filter(i=>i.risk==="High").length, c:"var(--rose)" },
            { l:"Days to Due", v:sel?Math.max(0,Math.round((new Date(sel.due)-new Date())/86400000)):"—", c:"var(--fog)" },
          ].map((s,i)=><div className="stat" key={i}><div className="stat-glow" style={{background:s.c}}/><div className="stat-label">{s.l}</div><div className="stat-value" style={{color:s.c,fontSize:22}}>{s.v}</div></div>)}
        </div>
        <div className="card mb16">
          <div className="ctit">Overall Completion</div>
          <Bar v={pct} color={pct>=70?"var(--emerald)":pct>=40?"var(--amber)":"var(--rose)"} h={8}/>
          <div className="mono f10 c-fog mt8">{pct}% complete · {items.filter(i=>i.risk==="High").length} high-risk items require attention</div>
        </div>
        <div className="card card-flush">
          <table className="tbl">
            <thead><tr><th>Section</th><th>Status</th><th>Risk</th><th>Owner</th><th>Notes</th><th>Update</th></tr></thead>
            <tbody>{items.map(item=>(
              <tr key={item.id}>
                <td className="fw6 f12">{item.section}</td>
                <td><span className={`bdg ${sb(item.status)}`}>{item.status}</span></td>
                <td><span className={`bdg ${rb(item.risk)}`}>{item.risk}</span></td>
                <td className="f11 c-fog">{item.owner}</td>
                <td className="f11 c-fog" style={{ maxWidth:180 }}>{item.notes}</td>
                <td><select className="fsel" style={{ fontSize:10, padding:"3px 6px" }} value={item.status} onChange={e=>upd(item.id,"status",e.target.value)}>{["Not Started","In Progress","Complete","Gap","Blocked"].map(s=><option key={s}>{s}</option>)}</select></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {items.filter(i=>i.risk==="High").length>0&&(
          <div className="card mt16">
            <div className="ctit c-red">🚨 High-Risk Items Requiring Immediate Action</div>
            <div className="g2">{items.filter(i=>i.risk==="High").map((item,i)=><div key={i} className="alert alert-r">{item.section}: {item.notes||"Requires attention"} — Owner: {item.owner}</div>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CONTACT DATABASE ─────────────────────────────────────────────────────────
function ContactDB({ contacts, setContacts, calls, setCalls }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [dialer, setDialer] = useState(null);
  const [calling, setCalling] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [callNote, setCallNote] = useState("");
  const [callOutcome, setCallOutcome] = useState("Positive");
  const [newC, setNewC] = useState({ name:"", title:"", agency:"", type:"Government", email:"", phone:"", stage:"New" });
  const timerRef = useRef(); const fileRef = useRef();

  const types = ["All","Government","Partner","Competitor","Prospect"];
  const filtered = contacts.filter(c=>(filter==="All"||c.type===filter)&&(c.name+c.agency+(c.email||"")).toLowerCase().includes(search.toLowerCase()));

  const startCall = c => { setDialer(c); setCalling(false); setCallTime(0); setCallNote(""); };
  const toggleCall = () => {
    if (!calling) { setCalling(true); timerRef.current = setInterval(()=>setCallTime(t=>t+1),1000); }
    else {
      clearInterval(timerRef.current); setCalling(false);
      const log = { id:Date.now(), contactId:dialer.id, contact:dialer.name, agency:dialer.agency, date:new Date().toISOString().split("T")[0], duration:`${Math.floor(callTime/60)}m ${callTime%60}s`, outcome:callOutcome, notes:callNote };
      setCalls(p=>[log,...p]);
      setContacts(p=>p.map(c=>c.id===dialer.id?{...c,calls:c.calls+1,lastContact:log.date}:c));
      setDialer(null);
    }
  };

  const importCSV = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = ev => {
      const lines = ev.target.result.split("\n").filter(Boolean);
      const hdrs = lines[0].split(",").map(h=>h.trim().toLowerCase());
      const imported = lines.slice(1).map((line,i) => { const vals=line.split(","); const obj={}; hdrs.forEach((h,j)=>obj[h]=vals[j]?.trim()||""); return{id:Date.now()+i,name:obj.name||"Unknown",title:obj.title||"",agency:obj.agency||"",type:obj.type||"Prospect",email:obj.email||"",phone:obj.phone||"",stage:"New",calls:0,lastContact:""}; });
      setContacts(p=>[...imported,...p]);
    }; r.readAsText(f);
  };

  const add = () => { setContacts(p=>[{id:Date.now(),...newC,calls:0,lastContact:""},...p]); setNewC({name:"",title:"",agency:"",type:"Government",email:"",phone:"",stage:"New"}); setShowAdd(false); };
  const fmt = t => `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;
  const tc = t => t==="Government"?"bdg-g":t==="Partner"?"bdg-v":t==="Competitor"?"bdg-r":"bdg-a";

  return (
    <div>
      <div className="ph">
        <div><div className="ph-title">Contact Database</div><div className="ph-sub">{contacts.length} CONTACTS · {calls.length} INTERACTIONS · BD RELATIONSHIP MANAGEMENT</div></div>
        <div className="row gap8">
          <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }} onChange={importCSV}/>
          <button className="btn btn-s btn-sm" onClick={()=>fileRef.current.click()}>⬆ Import CSV</button>
          <button className="btn btn-p btn-sm" onClick={()=>setShowAdd(true)}>+ Add Contact</button>
        </div>
      </div>
      <div className="ct">
        {showAdd && (
          <div className="card mb16">
            <div className="row-b mb16"><div className="ctit" style={{ margin:0 }}>New Contact</div><button className="btn btn-s btn-sm" onClick={()=>setShowAdd(false)}>✕</button></div>
            <div className="fr3">{[["name","Full Name"],["title","Title"],["agency","Agency / Company"]].map(([k,l])=><div className="fg" key={k}><label className="fl">{l}</label><input className="fi" value={newC[k]} onChange={e=>setNewC(p=>({...p,[k]:e.target.value}))}/></div>)}</div>
            <div className="fr3">{[["email","Email"],["phone","Phone"]].map(([k,l])=><div className="fg" key={k}><label className="fl">{l}</label><input className="fi" value={newC[k]} onChange={e=>setNewC(p=>({...p,[k]:e.target.value}))}/></div>)}<div className="fg"><label className="fl">Type</label><select className="fsel" value={newC.type} onChange={e=>setNewC(p=>({...p,type:e.target.value}))}>{["Government","Partner","Competitor","Prospect"].map(t=><option key={t}>{t}</option>)}</select></div></div>
            <button className="btn btn-p" onClick={add} disabled={!newC.name}>Add Contact</button>
          </div>
        )}
        <div className="row-b mb16">
          <div className="row gap6">{types.map(t=><button key={t} className={`btn btn-sm ${filter===t?"btn-p":"btn-s"}`} onClick={()=>setFilter(t)}>{t} ({t==="All"?contacts.length:contacts.filter(c=>c.type===t).length})</button>)}</div>
          <input className="fi" style={{ maxWidth:220 }} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="card card-flush mb16">
          <table className="tbl">
            <thead><tr><th>Name / Title</th><th>Agency</th><th>Type</th><th>Stage</th><th>Last Contact</th><th>Calls</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map(c=>(
              <tr key={c.id}>
                <td><div className="fw6 f12">{c.name}</div><div className="mono f10 c-fog">{c.title}</div></td>
                <td><span className="bdg bdg-b">{c.agency}</span></td>
                <td><span className={`bdg ${tc(c.type)}`}>{c.type}</span></td>
                <td><span className="bdg bdg-f">{c.stage}</span></td>
                <td className="mono f10 c-fog">{c.lastContact||"—"}</td>
                <td className="mono f11" style={{ textAlign:"center" }}>{c.calls}</td>
                <td><div className="row gap6"><button className="btn btn-g btn-sm" onClick={()=>startCall(c)}>📞</button><button className="btn btn-s btn-sm" onClick={()=>setSel(sel?.id===c.id?null:c)}>View</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {sel && (
          <div className="card">
            <div className="row-b mb16"><div><div className="fw7" style={{ fontSize:15, color:"var(--snow)" }}>{sel.name}</div><div className="f12 c-fog">{sel.title} · {sel.agency}</div></div><button className="btn btn-s btn-sm" onClick={()=>setSel(null)}>✕</button></div>
            <div className="fr3"><div><div className="fl">Email</div><div className="f12">{sel.email||"—"}</div></div><div><div className="fl">Phone</div><div className="f12">{sel.phone||"—"}</div></div><div><div className="fl">Last Contact</div><div className="mono f12">{sel.lastContact||"Never"}</div></div></div>
            <Dl/>
            <div className="ctit">Call History</div>
            {calls.filter(c=>c.contactId===sel.id).length===0?<div className="f12 c-fog">No calls logged yet.</div>:calls.filter(c=>c.contactId===sel.id).map((cl,i)=>(
              <div key={i} style={{ padding:"7px 0", borderBottom:"1px solid var(--line)" }}>
                <div className="row-b"><span className="fw6 f12">{cl.date} · {cl.duration}</span><span className={`bdg ${cl.outcome==="Positive"?"bdg-g":cl.outcome==="Voicemail"?"bdg-f":"bdg-a"}`}>{cl.outcome}</span></div>
                <div className="f11 c-fog mt8">{cl.notes}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {dialer && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="fw7" style={{ fontSize:16, color:"var(--snow)", marginBottom:3 }}>{dialer.name}</div>
            <div className="mono f11 c-fog mb16">{dialer.title} · {dialer.agency}</div>
            <div className="mono fw7" style={{ fontSize:22, letterSpacing:".08em", textAlign:"center", padding:"14px", background:"var(--ink)", borderRadius:"var(--r8)", marginBottom:14, color:"var(--blue)" }}>{calling?fmt(callTime):dialer.phone||"No number"}</div>
            {calling && <>
              <div className="fg"><label className="fl">Outcome</label><select className="fsel" value={callOutcome} onChange={e=>setCallOutcome(e.target.value)}>{["Positive","Neutral","Negative","Voicemail","No Answer"].map(o=><option key={o}>{o}</option>)}</select></div>
              <div className="fg"><label className="fl">Notes</label><textarea className="fta" value={callNote} onChange={e=>setCallNote(e.target.value)} placeholder="Discussion notes…"/></div>
            </>}
            <button onClick={toggleCall} style={{ width:"100%", padding:"13px", borderRadius:"var(--r8)", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"var(--body)", background:calling?"var(--rose)":"var(--emerald)", color:"#fff", marginBottom:8, transition:"all .15s" }}>{calling?"⬛ End & Log Call":"📞 Start Call"}</button>
            <button className="btn btn-s w100" onClick={()=>{clearInterval(timerRef.current);setDialer(null);}}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PIPELINE BOARD ───────────────────────────────────────────────────────────
function PipelineBoard({ opps, setOpps }) {
  const stages = ["Identify","Qualify","Capture","Proposal","Submitted","Award","No-Bid"];
  const colors = { Identify:"var(--fog)", Qualify:"var(--blue)", Capture:"var(--amber)", Proposal:"var(--coral)", Submitted:"var(--violet)", Award:"var(--emerald)", "No-Bid":"var(--rose)" };
  const move = (opp, stage) => setOpps(p=>p.map(o=>o.id===opp.id?{...o,stage}:o));
  return (
    <div>
      <div className="ph"><div><div className="ph-title">Pipeline Board</div><div className="ph-sub">CAPTURE LIFECYCLE · STAGE MANAGEMENT · OPPORTUNITY TRACKING</div></div></div>
      <div className="ct">
        <div className="kboard">
          {stages.map(stage => {
            const items = opps.filter(o=>o.stage===stage);
            const val = items.reduce((a,o)=>a+o.value,0);
            return (
              <div className="kcol" key={stage}>
                <div className="khead">
                  <div className="mono" style={{ fontSize:9, letterSpacing:".1em", textTransform:"uppercase", color:colors[stage] }}>{stage}</div>
                  <span className="bdg bdg-f">{items.length}</span>
                </div>
                <div className="mono f10 c-fog mb12">${val.toFixed(1)}M</div>
                {items.map(o=>(
                  <div className="kcard" key={o.id}>
                    <div className="fw6 f11 c-snow mb8" style={{ lineHeight:1.35 }}>{o.title}</div>
                    <div className="mono f10 c-fog mb8">{o.fullParentPathName}</div>
                    <div className="row gap6 mb8"><Dec d={o.typeOfSetAsideDescription}/><span className="mono f10" style={{ color:pc(o.pwin) }}>50%</span></div>
                    <Sec s={o.organizationType}/>
                    <div style={{ marginTop:8 }}>
                      <select className="fsel" style={{ fontSize:10, padding:"3px 6px" }} value={o.stage} onChange={e=>move(o,e.target.value)}>
                        {stages.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {items.length===0&&<div className="mono f9 c-fog" style={{ textAlign:"center", padding:"18px 0" }}>EMPTY</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── WHY WE LOSE ─────────────────────────────────────────────────────────────
function WhyWeLose() {
  const [loading, setLoading] = useState(false); const [insight, setInsight] = useState(null);
  const analyze = async () => {
    setLoading(true); setInsight(null);
    const prompt = `Analyze LTR's loss patterns. Return JSON only:
{"topLossReasons":[{"reason":"Pricing","count":2,"pct":35,"recommendation":""},{"reason":"Incumbent Advantage","count":1,"pct":20,"recommendation":""},{"reason":"Weak Partner","count":1,"pct":18,"recommendation":""},{"reason":"Poor Relationships","count":1,"pct":15,"recommendation":""},{"reason":"Wrong Vehicle","count":1,"pct":12,"recommendation":""}],"strategicInsights":[],"priorityActions":[],"vehicleInsight":"","partnerInsight":"","relationshipGap":""}
Loss data: ${JSON.stringify(LOSSES)}. Be direct and actionable. Return valid JSON only.`;
    try { const d = await ai(prompt); setInsight(d); } catch { setInsight({ error:"Failed." }); }
    setLoading(false);
  };
  const lc = { Pricing:"var(--rose)", "Incumbent Advantage":"var(--coral)", "Weak Partner":"var(--amber)", "Poor Relationships":"var(--violet)", "Wrong Vehicle":"var(--teal)" };

  return (
    <div>
      <div className="ph">
        <div><div className="ph-title">Why We Lose Analytics</div><div className="ph-sub">LOSS PATTERN ANALYSIS · STRATEGIC RECOMMENDATIONS · WIN RATE IMPROVEMENT</div></div>
        <button className="btn btn-p btn-sm" onClick={analyze} disabled={loading}>{loading?"Analyzing…":"🤖 AI Loss Analysis"}</button>
      </div>
      <div className="ct">
        <div className="g2 mb16" style={{ alignItems:"start" }}>
          <div className="card card-flush">
            <div className="ctit" style={{ padding:"16px 20px 0" }}>Loss History</div>
            <table className="tbl">
              <thead><tr><th>Opportunity</th><th>Reason</th><th>Detail</th><th>Value</th><th>Date</th></tr></thead>
              <tbody>{LOSSES.map((l,i)=>(
                <tr key={i}>
                  <td className="fw6 f12">{l.opp}</td>
                  <td><span className="bdg" style={{ background:`${lc[l.reason]||"var(--fog)"}18`, color:lc[l.reason]||"var(--fog)", border:`1px solid ${lc[l.reason]||"var(--fog)"}30` }}>{l.reason}</span></td>
                  <td className="f11 c-fog">{l.detail}</td>
                  <td className="mono f11 c-fog">${l.value}M</td>
                  <td className="mono f10 c-fog">{l.date}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="card">
            <div className="ctit">Loss Reason Breakdown</div>
            {[["Pricing",2,35],["Incumbent Advantage",1,20],["Weak Partner",1,18],["Poor Relationships",1,15],["Wrong Vehicle",1,12]].map(([r,c,p])=>(
              <div key={r} style={{ marginBottom:11 }}>
                <div className="row-b mb8"><span className="f12 fw6" style={{ color:lc[r] }}>{r}</span><span className="mono f10 c-fog">{c} · {p}%</span></div>
                <Bar v={p} color={lc[r]}/>
              </div>
            ))}
          </div>
        </div>
        {loading&&<div className="card"><Spin msg="Analyzing loss patterns and generating strategic recommendations…"/></div>}
        {insight&&!insight.error&&(
          <div className="stk">
            <div className="g2">
              <div className="card"><div className="ctit">Strategic Insights</div>{insight.strategicInsights?.map((x,i)=><div key={i} className="alert alert-b" style={{ margin:"3px 0" }}>💡 {x}</div>)}</div>
              <div className="card"><div className="ctit">Priority Actions</div>{insight.priorityActions?.map((x,i)=><div key={i} className="alert alert-g" style={{ margin:"3px 0" }}>→ {x}</div>)}</div>
            </div>
            <div className="g3">
              {[["Vehicle Usage Insight",insight.vehicleInsight],["Partner Weakness Pattern",insight.partnerInsight],["Relationship Gap",insight.relationshipGap]].map(([t,v])=>(
                <div className="card" key={t}><div className="ctit">{t}</div><p className="f12 c-pale" style={{ lineHeight:1.65 }}>{v}</p></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HEAT MAP ─────────────────────────────────────────────────────────────────
function HeatMap({ opps }) {
  const sectors = ["Federal","State","County","City","Transportation","Education","Public Safety","Utilities","Public Health"];
  const pipe = opps.reduce((a,o)=>a+o.value,0)||1;
  const sData = sectors.map(s=>({ s, items:opps.filter(o=>o.sector===s), val:opps.filter(o=>o.sector===s).reduce((a,o)=>a+o.value,0), avgPwin:opps.filter(o=>o.sector===s).length?Math.round(opps.filter(o=>o.sector===s).reduce((a,o)=>a+o.pwin,0)/opps.filter(o=>o.sector===s).length):0 }));
  const STATES = ["VA","MD","DC","CA","TX","FL","NY","PA","GA","OH","NC","IL","WA","CO","AZ","MN"];
  const stateHeat = STATES.map(s=>({ s, v:Math.round(Math.random()*75+10) }));
  return (
    <div>
      <div className="ph"><div><div className="ph-title">Agency & Geographic Heat Map</div><div className="ph-sub">SECTOR CONCENTRATION · GEOGRAPHIC SPREAD · MODERNIZATION TRENDS</div></div></div>
      <div className="ct">
        <div className="g2 mb16" style={{ alignItems:"start" }}>
          <div className="card">
            <div className="ctit">Sector Heat Map</div>
            {sData.map(({ s, items, val, avgPwin }) => (
              <div key={s} style={{ marginBottom:12 }}>
                <div className="row-b mb8"><div className="row gap8"><Sec s={s}/><span className="f12">{items.length} opp{items.length!==1?"s":""}</span></div><div className="row gap8"><span className="mono f10 c-fog">${val.toFixed(1)}M</span>{avgPwin>0&&<span className="mono f10" style={{ color:pc(avgPwin) }}>{avgPwin}%</span>}</div></div>
                <Bar v={val?(val/Math.max(...sData.map(x=>x.val),1))*100:0} color="var(--blue)"/>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="ctit">State Activity</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:16 }}>
              {stateHeat.map(({ s, v }) => (
                <div key={s} style={{ background:`rgba(77,142,240,${v/100*.7+.06})`, borderRadius:"var(--r6)", padding:"9px 6px", textAlign:"center", cursor:"pointer", transition:"all .2s" }} title={`${s}: ${v}% activity`}>
                  <div className="mono fw7 f12">{s}</div>
                  <div className="mono f9 c-fog" style={{ marginTop:2 }}>{v}%</div>
                </div>
              ))}
            </div>
            <Dl/>
            <div className="ctit">Modernization Trends</div>
            {[
              { area:"AI/ML & Data Analytics", trend:"↑ HIGH", fit:"Strong", c:"var(--emerald)" },
              { area:"Cybersecurity & Zero Trust", trend:"↑ HIGH", fit:"Strong", c:"var(--emerald)" },
              { area:"Cloud Migration", trend:"↑ MEDIUM", fit:"Moderate", c:"var(--amber)" },
              { area:"State ERP Modernization", trend:"↑ MEDIUM", fit:"Moderate", c:"var(--amber)" },
            ].map((t,i)=>(
              <div key={i} style={{ padding:"7px 0", borderBottom:"1px solid var(--line)" }}>
                <div className="row-b mb8"><span className="fw6 f12">{t.area}</span><span className="mono f10" style={{ color:t.c }}>{t.trend}</span></div>
                <span className={`bdg ${t.fit==="Strong"?"bdg-g":"bdg-a"}`}>LTR Fit: {t.fit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MARGIN & FINANCIAL RISK ──────────────────────────────────────────────────
function MarginRisk({ opps }) {
  const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const avgM = Math.round(opps.reduce((a,o)=>a+o.margin,0)/opps.length);
  const atRisk = opps.filter(o=>o.margin<14);
  const analyze = async () => {
    setLoading(true); setResult(null);
    const prompt = `Analyze financial risk for federal contractor pipeline. Return JSON only:
{"overallRisk":"HIGH|MEDIUM|LOW","riskRationale":"","marginCompressionRisk":"HIGH|MEDIUM|LOW","customerConcentrationRisk":"HIGH|MEDIUM|LOW","subPassThroughRisk":"HIGH|MEDIUM|LOW","recommendations":[],"pricingWarnings":[],"protectiveActions":[]}
Pipeline: ${JSON.stringify(opps.map(o=>({title:o.title,value:o.value,margin:o.margin,decision:o.decision,sector:o.sector})))}. Return valid JSON only.`;
    try { const d = await ai(prompt, 800); setResult(d); } catch { setResult({ error:"Failed." }); }
    setLoading(false);
  };
  const rc = r => r==="HIGH"?"var(--rose)":r==="MEDIUM"?"var(--amber)":"var(--emerald)";
  return (
    <div>
      <div className="ph">
        <div><div className="ph-title">Margin & Financial Risk</div><div className="ph-sub">MARGIN COMPRESSION · PRICING RISK · CUSTOMER CONCENTRATION · FINANCIAL EXPOSURE</div></div>
        <button className="btn btn-p btn-sm" onClick={analyze} disabled={loading}>{loading?"Analyzing…":"🤖 AI Risk Analysis"}</button>
      </div>
      <div className="ct">
        <div className="g4 mb16">
          {[
            { l:"Avg Portfolio Margin", v:`${avgM}%`, c:avgM>=18?"var(--emerald)":avgM>=12?"var(--amber)":"var(--rose)" },
            { l:"Healthy ≥18%", v:opps.filter(o=>o.margin>=18).length, c:"var(--emerald)" },
            { l:"Low Margin <14%", v:atRisk.length, c:"var(--rose)" },
            { l:"At-Risk Pipeline", v:`$${atRisk.reduce((a,o)=>a+o.value,0).toFixed(1)}M`, c:"var(--rose)" },
          ].map((s,i)=><div className="stat" key={i}><div className="stat-glow" style={{background:s.c}}/><div className="stat-label">{s.l}</div><div className="stat-value" style={{color:s.c,fontSize:22}}>{s.v}</div></div>)}
        </div>
        <div className="card mb16">
          <div className="ctit">Margin by Opportunity</div>
          {opps.map((o,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div className="row-b mb8"><span className="fw6 f12" style={{ maxWidth:280 }}>{o.title}</span><div className="row gap8"><span className="mono f10 c-fog">${o.naicsCode}</span><span className="mono fw7 f12" style={{ color:o.margin>=18?"var(--emerald)":o.margin>=12?"var(--amber)":"var(--rose)" }}>15%</span></div></div>
              <Bar v={15} color={o.margin>=18?"var(--emerald)":o.margin>=12?"var(--amber)":"var(--rose)"} h={6}/>
            </div>
          ))}
        </div>
        {loading&&<div className="card"><Spin msg="Analyzing financial risks…"/></div>}
        {result&&!result.error&&(
          <div className="stk">
            <div className="g3">
              {[["Overall Risk",result.overallRisk],["Margin Compression",result.marginCompressionRisk],["Customer Concentration",result.customerConcentrationRisk]].map(([l,v])=>(
                <div className="stat" key={l}><div className="stat-glow" style={{background:rc(v)}}/><div className="stat-label">{l}</div><div className="stat-value" style={{color:rc(v),fontSize:18}}>{v}</div></div>
              ))}
            </div>
            <div className="g2">
              <div className="card"><div className="ctit">Risk Detail</div><div className="alert alert-r mb12">{result.riskRationale}</div>{result.pricingWarnings?.map((w,i)=><div key={i} className="alert alert-a" style={{ margin:"3px 0" }}>{w}</div>)}</div>
              <div className="card"><div className="ctit">Recommendations</div>{result.recommendations?.map((r,i)=><div key={i} className="alert alert-g" style={{ margin:"3px 0" }}>→ {r}</div>)}<Dl/><div className="ctit">Protective Actions</div>{result.protectiveActions?.map((a,i)=><div key={i} className="alert alert-b" style={{ margin:"3px 0" }}>{a}</div>)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── REGISTRATION TRACKER ─────────────────────────────────────────────────────
function RegTracker() {
  const [regs, setRegs] = useState(REGS);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:"", status:"Active", expires:"", risk:"Medium" });
  const [loading, setLoading] = useState(false); const [advice, setAdvice] = useState(null);

  const add = () => {
    const d = form.expires ? Math.round((new Date(form.expires)-new Date())/86400000) : null;
    setRegs(p=>[{id:Date.now(),...form,daysLeft:d},...p]);
    setForm({name:"",status:"Active",expires:"",risk:"Medium"}); setShowAdd(false);
  };
  const getAdvice = async () => {
    setLoading(true); setAdvice(null);
    const prompt = `Analyze registrations for a federal contractor. Return JSON only:
{"urgentActions":[],"certPathways":[{"cert":"HUBZone","eligible":"Likely|Possible|Unlikely","nextStep":"","timeline":""},{"cert":"8(a)","eligible":"Possible","nextStep":"","timeline":""},{"cert":"WOSB","eligible":"Unknown","nextStep":"","timeline":""}],"complianceRisk":"HIGH|MEDIUM|LOW","missedOpportunities":[],"recommendations":[]}
Registrations: ${JSON.stringify(regs)}. Return valid JSON only.`;
    try { const d = await ai(prompt); setAdvice(d); } catch { setAdvice({ error:"Failed." }); }
    setLoading(false);
  };
  const sc = s => s==="Active"?"bdg-g":s==="Expiring"?"bdg-a":s==="In Progress"?"bdg-b":"bdg-r";
  const rc2 = r => r==="High"?"var(--rose)":r==="Medium"?"var(--amber)":"var(--emerald)";

  return (
    <div>
      <div className="ph">
        <div><div className="ph-title">Registration & Compliance Tracker</div><div className="ph-sub">SAM.GOV · CERTIFICATIONS · COOPERATIVE PURCHASING · STATE PORTALS</div></div>
        <div className="row gap8">
          <button className="btn btn-s btn-sm" onClick={()=>setShowAdd(true)}>+ Add Registration</button>
          <button className="btn btn-p btn-sm" onClick={getAdvice} disabled={loading}>{loading?"Analyzing…":"🤖 AI Advice"}</button>
        </div>
      </div>
      <div className="ct">
        {showAdd&&(
          <div className="card mb16">
            <div className="row-b mb16"><div className="ctit" style={{ margin:0 }}>Add Registration</div><button className="btn btn-s btn-sm" onClick={()=>setShowAdd(false)}>✕</button></div>
            <div className="fr3">
              <div className="fg"><label className="fl">Name</label><input className="fi" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="SAM.gov, HUBZone…"/></div>
              <div className="fg"><label className="fl">Status</label><select className="fsel" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option>Active</option><option>Expiring</option><option>In Progress</option><option>Not Registered</option><option>Expired</option></select></div>
              <div className="fg"><label className="fl">Expiration</label><input className="fi" type="date" value={form.expires} onChange={e=>setForm(p=>({...p,expires:e.target.value}))}/></div>
            </div>
            <button className="btn btn-p" onClick={add} disabled={!form.name}>Add</button>
          </div>
        )}
        <div className="g3 mb16">
          {[{ l:"Active", v:regs.filter(r=>r.status==="Active").length, c:"var(--emerald)" },{ l:"Expiring / At Risk", v:regs.filter(r=>r.status==="Expiring"||r.risk==="High").length, c:"var(--rose)" },{ l:"Not Registered", v:regs.filter(r=>r.status==="Not Registered").length, c:"var(--fog)" }].map((s,i)=><div className="stat" key={i}><div className="stat-label">{s.l}</div><div className="stat-value" style={{color:s.c,fontSize:22}}>{s.v}</div></div>)}
        </div>
        <div className="card card-flush mb16">
          <table className="tbl">
            <thead><tr><th>Registration / Certification</th><th>Status</th><th>Expires</th><th>Days Left</th><th>Risk</th></tr></thead>
            <tbody>{regs.map((r,i)=>(
              <tr key={i}>
                <td className="fw6 f12">{r.name}</td>
                <td><span className={`bdg ${sc(r.status)}`}>{r.status}</span></td>
                <td className="mono f10 c-fog">{r.expires||"N/A"}</td>
                <td>{r.daysLeft!=null?<span className="mono f11" style={{ color:r.daysLeft<90?"var(--rose)":r.daysLeft<180?"var(--amber)":"var(--emerald)" }}>{r.daysLeft}d</span>:<span className="mono f11 c-fog">—</span>}</td>
                <td><span className="bdg" style={{ background:`${rc2(r.risk)}18`, color:rc2(r.risk), border:`1px solid ${rc2(r.risk)}30` }}>{r.risk}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {loading&&<div className="card"><Spin msg="Analyzing compliance posture and certification pathways…"/></div>}
        {advice&&!advice.error&&(
          <div className="stk">
            <div className="g2">
              <div className="card">
                <div className="ctit c-red">Urgent Actions</div>
                {advice.urgentActions?.map((a,i)=><div key={i} className="alert alert-r" style={{ margin:"3px 0" }}>🚨 {a}</div>)}
                <Dl/>
                <div className="ctit">Missed Opportunities</div>
                {advice.missedOpportunities?.map((m,i)=><div key={i} className="alert alert-a" style={{ margin:"3px 0" }}>⚠ {m}</div>)}
              </div>
              <div className="card card-flush">
                <div className="ctit" style={{ padding:"16px 20px 0" }}>Certification Pathway Advisor</div>
                <table className="tbl">
                  <thead><tr><th>Certification</th><th>Eligibility</th><th>Next Step</th><th>Timeline</th></tr></thead>
                  <tbody>{advice.certPathways?.map((c,i)=>(
                    <tr key={i}>
                      <td className="fw6 f12">{c.cert}</td>
                      <td><span className={`bdg ${c.eligible==="Likely"?"bdg-g":c.eligible==="Possible"?"bdg-a":"bdg-r"}`}>{c.eligible}</span></td>
                      <td className="f11 c-fog">{c.nextStep}</td>
                      <td className="mono f10 c-fog">{c.timeline}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <div className="card"><div className="ctit">Recommendations</div><div className="g3">{advice.recommendations?.map((r,i)=><div key={i} className="alert alert-b">{r}</div>)}</div></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function Analytics({ opps, contacts, calls }) {
  const pipe = opps.filter(o=>o.decision!=="NO-BID").reduce((a,o)=>a+o.value,0);
  const wtd = opps.filter(o=>o.decision!=="NO-BID").reduce((a,o)=>a+o.value*(o.pwin/100),0);
  const avgPwin = Math.round(opps.reduce((a,o)=>a+o.pwin,0)/opps.length);
  const sectors = [...new Set(opps.map(o=>o.sector))];
  return (
    <div>
      <div className="ph"><div><div className="ph-title">Analytics & Intelligence</div><div className="ph-sub">PIPELINE · WIN RATES · SECTOR DIVERSIFICATION · BD PERFORMANCE</div></div></div>
      <div className="ct">
        <div className="g5 mb16">
          {[
            { l:"Total Pipeline", v:`$${pipe.toFixed(1)}M`, a:"var(--blue)" },
            { l:"Weighted Forecast", v:`$${wtd.toFixed(1)}M`, a:"var(--emerald)" },
            { l:"Avg PWIN", v:`${avgPwin}%`, a:pc(avgPwin) },
            { l:"Total Calls", v:calls.length, a:"var(--amber)" },
            { l:"Contacts", v:contacts.length, a:"var(--violet)" },
          ].map((s,i)=><div className="stat" key={i}><div className="stat-glow" style={{background:s.a}}/><div className="stat-label">{s.l}</div><div className="stat-value" style={{color:s.a,fontSize:22}}>{s.v}</div></div>)}
        </div>
        <div className="g2 mb16">
          <div className="card">
            <div className="ctit">PWIN Distribution</div>
            {[["≥65% High Confidence",65,100,"var(--emerald)"],["42–64% Competitive",42,64,"var(--amber)"],["<42% At Risk",0,41,"var(--rose)"]].map(([l,lo,hi,c])=>{
              const cnt=opps.filter(o=>o.pwin>=lo&&o.pwin<=hi).length;
              return <div key={l} style={{ marginBottom:10 }}><div className="row-b mb8"><span className="f12 fw6" style={{ color:c }}>{l}</span><span className="mono f10 c-fog">{cnt}</span></div><Bar v={opps.length?Math.round((cnt/opps.length)*100):0} color={c}/></div>;
            })}
          </div>
          <div className="card">
            <div className="ctit">Decision Mix</div>
            {["PRIME","SUB","TEAM","NO-BID"].map(d=>{
              const cnt=opps.filter(o=>o.decision===d).length;
              const c=d==="PRIME"?"var(--emerald)":d==="TEAM"?"var(--amber)":d==="SUB"?"var(--blue)":"var(--rose)";
              return <div key={d} style={{ marginBottom:10 }}><div className="row-b mb8"><Dec d={d}/><span className="mono f10 c-fog">{cnt} ({opps.length?Math.round((cnt/opps.length)*100):0}%)</span></div><Bar v={opps.length?Math.round((cnt/opps.length)*100):0} color={c}/></div>;
            })}
          </div>
        </div>
        <div className="g2 mb16">
          <div className="card">
            <div className="ctit">Sector Diversification</div>
            {sectors.map(s=>{
              const val=opps.filter(o=>o.sector===s).reduce((a,o)=>a+o.value,0);
              return <div key={s} style={{ marginBottom:10 }}><div className="row-b mb8"><div className="row gap8"><Sec s={s}/></div><span className="mono f10 c-fog">${val.toFixed(1)}M</span></div><Bar v={pipe?Math.round((val/pipe)*100):0} color="var(--blue)"/></div>;
            })}
          </div>
          <div className="card">
            <div className="ctit">Margin Distribution</div>
            {[["≥18% Healthy",18,100,"var(--emerald)"],["12–17% Adequate",12,17,"var(--amber)"],["<12% At Risk",0,11,"var(--rose)"]].map(([l,lo,hi,c])=>{
              const items=opps.filter(o=>o.margin>=lo&&o.margin<=hi);
              return <div key={l} className="stat mb12" style={{ padding:14 }}><div className="stat-glow" style={{background:c}}/><div className="stat-label" style={{ marginBottom:4 }}>{l}</div><div className="stat-value" style={{color:c,fontSize:18}}>{items.length} opps <span className="mono f10 c-fog">${items.reduce((a,o)=>a+o.value,0).toFixed(1)}M</span></div></div>;
            })}
            <div className="ctit">Call Outcomes</div>
            {["Positive","Neutral","Negative","Voicemail"].map(o=>{
              const cnt=calls.filter(c=>c.outcome===o).length;
              const c=o==="Positive"?"var(--emerald)":o==="Negative"?"var(--rose)":o==="Voicemail"?"var(--fog)":"var(--amber)";
              return cnt>0?<div key={o} style={{ marginBottom:8 }}><div className="row-b mb8"><span className="f12 fw6" style={{ color:c }}>{o}</span><span className="mono f10 c-fog">{cnt}</span></div><Bar v={calls.length?Math.round((cnt/calls.length)*100):0} color={c}/></div>:null;
            })}
            {calls.length===0&&<div className="f12 c-fog">No call data yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SAVED OPPS ───────────────────────────────────────────────────────────────
function SavedOpps({ opps }) {
  const [filter, setFilter] = useState("ALL");
  const fs = ["ALL","PRIME","SUB","TEAM","NO-BID"];
  const shown = filter==="ALL"?opps:opps.filter(o=>o.decision===filter);
  return (
    <div>
      <div className="ph"><div><div className="ph-title">Opportunity Database</div><div className="ph-sub">{opps.length} TRACKED OPPORTUNITIES · FULL PIPELINE REGISTRY</div></div></div>
      <div className="ct">
        <div className="tabs">{fs.map(f=><div key={f} className={`tab ${filter===f?"on":""}`} onClick={()=>setFilter(f)}>{f} ({f==="ALL"?opps.length:opps.filter(o=>o.decision===f).length})</div>)}</div>
        <div className="card card-flush">
          <table className="tbl">
            <thead><tr><th>Opportunity</th><th>Agency</th><th>Sector</th><th>Set-Aside</th><th>Vehicle</th><th>Stage</th><th>Decision</th><th>PWIN</th><th>Value</th><th>Margin</th><th>Due</th></tr></thead>
            <tbody>
              {shown.length===0?<tr><td colSpan={11} style={{ textAlign:"center", padding:32, color:"var(--fog)" }}>No opportunities in this category.</td></tr>:shown.map(o=>(
                <tr key={o.id}>
                  <td className="fw6 f12" style={{ maxWidth:180 }}>{o.title}</td>
                  <td><span className="bdg bdg-b">{o.fullParentPathName}</span></td>
                  <td><Sec s={o.organizationType}/></td>
                  <td className="f11 c-fog">{o.setAside}</td>
                  <td className="mono f10 c-fog">{o.vehicle}</td>
                  <td><span className="bdg bdg-f">{o.stage}</span></td>
                  <td><Dec d={o.typeOfSetAsideDescription}/></td>
                  <td><span className="mono fw7 f11" style={{ color:pc(o.pwin) }}>50%</span></td>
                  <td className="mono f10 c-fog">${o.naicsCode}</td>
                  <td className="mono f10" style={{ color:o.margin>=18?"var(--emerald)":o.margin>=12?"var(--amber)":"var(--rose)" }}>15%</td>
                  <td className="mono f10 c-fog">{o.responseDeadLine}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
const [samData, setSamData] = useState([]);

  const [page, setPage] = useState("exec");
  const [opps, setOpps] = useState([]);
  const [contacts, setContacts] = useState(CONTACTS);
  const [calls, setCalls] = useState(CALLS_LOG);
  const addOpp = useCallback(o => setOpps(p => [o, ...p]), []);

useEffect(() => {
 async function loadSAM() {
  const samData = await fetchSAMData();

  if (samData?.opportunitiesData) {

    const formattedOpps =
      samData.opportunitiesData.map((item, index) => ({
        id: index + 1,

        title: item.title || "No Title",

        agency:
          item.fullParentPathName || "Unknown Agency",

        sector: item.naicsCode || "N/A",

        setAside:
          item.typeOfSetAsideDescription || "Open",

        vehicle: item.type || "Federal",

        stage: "IDENTIFY",

        decision: "PRIME",

        pwin: 50,

        value: "$1M",

        margin: 15,

        due: item.responseDeadLine
          ? item.responseDeadLine.split("T")[0]
          : "N/A",
      }));

    setOpps(formattedOpps);
  }
}

  loadSAM();
}, []);

  const NAV = [
    { id:"exec",      label:"Executive Dashboard",   ic:"◈",  sec:"OVERVIEW" },
    { id:"pwin",      label:"PWIN Dashboard",         ic:"◎" },
    { id:"briefing",  label:"AI Briefing",            ic:"✦" },
    { id:"analytics", label:"Analytics",              ic:"⬡" },
    { id:"upload",    label:"Upload Analyzer",        ic:"⊕",  sec:"CAPTURE" },
    { id:"company",   label:"Company Assessment",     ic:"⊞" },
    { id:"decision",  label:"Decision Engine",        ic:"⚡" },
    { id:"incumbent", label:"Incumbent Intel",        ic:"◉" },
    { id:"proposal",  label:"Proposal Readiness",     ic:"☑" },
    { id:"contacts",  label:"Contact Database",       ic:"◇",  sec:"BD OUTREACH" },
    { id:"pipeline",  label:"Pipeline Board",         ic:"▦" },
    { id:"whylose",   label:"Why We Lose",            ic:"⊗",  sec:"INTELLIGENCE" },
    { id:"heatmap",   label:"Agency Heat Map",        ic:"⊛" },
    { id:"margin",    label:"Margin & Financial",     ic:"◈" },
    { id:"regs",      label:"Registration Tracker",   ic:"⊟" },
    { id:"opps",      label:"Opportunity Database",   ic:"▤",  sec:"DATA" },
  ];

  const render = () => {
    switch(page) {
      case "exec":      return <ExecDash setPage={setPage} opps={opps} contacts={contacts} calls={calls}/>;
      case "pwin":      return <PWINDash opps={opps}/>;
      case "briefing":  return <AIBriefing opps={opps} contacts={contacts} calls={calls}/>;
      case "analytics": return <Analytics opps={opps} contacts={contacts} calls={calls}/>;
      case "upload":    return <UploadAnalyzer onSave={addOpp}/>;
      case "company":   return <CompanyAssess/>;
      case "decision":  return <DecisionEngine/>;
      case "incumbent": return <IncumbentIntel opps={opps}/>;
      case "proposal":  return <ProposalReadiness opps={opps}/>;
      case "contacts":  return <ContactDB contacts={contacts} setContacts={setContacts} calls={calls} setCalls={setCalls}/>;
      case "pipeline":  return <PipelineBoard opps={opps} setOpps={setOpps}/>;
      case "whylose":   return <WhyWeLose/>;
      case "heatmap":   return <HeatMap opps={opps}/>;
      case "margin":    return <MarginRisk opps={opps}/>;
      case "regs":      return <RegTracker/>;
      case "opps":      return <SavedOpps opps={opps}/>;
      default:          return <ExecDash setPage={setPage} opps={opps} contacts={contacts} calls={calls}/>;
    }
  };

  let lastSec = null;
  return (
    <>
      <style>{G}</style>
      <div className="app">
        <aside className="sb">
          <div className="sb-logo">
            <div className="logo-lockup">
              <div className="logo-icon">LTR</div>
              <div><div className="logo-name">PSGOS</div></div>
            </div>
            <div className="logo-tag">Public Sector Growth OS</div>
          </div>

          <nav style={{ padding:"6px 0", flex:1, overflowY:"auto" }}>
            {NAV.map(item => {
              const showSec = item.sec && item.sec !== lastSec;
              if (item.sec) lastSec = item.sec;
              return (
                <div key={item.id}>
                  {showSec && <div className="nav-group">{item.sec}</div>}
                  <div className={`ni ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                    <div className="ni-dot" style={{ background: page===item.id?"var(--blue)":"var(--line2)" }}/>
                    <span>{item.label}</span>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="sb-bottom">
            <div className="sb-status">
              <div className="live-dot"/>
              <span>LTR-PSGOS v4.0</span>
            </div>
            <div className="mono f9 c-fog" style={{ marginTop:3 }}>LOGICAL TECHNOLOGY & RESEARCH</div>
          </div>
        </aside>

        <main className="main">{render()}</main>
      </div>
    </>
  );
}

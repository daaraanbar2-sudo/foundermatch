import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════ */
const T = {
  black:"#0a0a0a", offBlack:"#111111", card:"#161616", border:"#2a2a2a",
  accent:"#e8ff47", accentDim:"#c9e030", white:"#f5f5f0", muted:"#888880",
  danger:"#ff5f5f", success:"#4fffb0",
};
const F = { display:"'Bebas Neue',sans-serif", serif:"'Instrument Serif',serif", body:"'DM Sans',sans-serif" };

/* ══════════════════════════════════════
   SUPABASE CLIENT
══════════════════════════════════════ */
const SUPABASE_URL = "https://vepqolhwtjdyyhznhfyi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcHFvbGh3dGpkeXloem5oZnlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDI2NjMsImV4cCI6MjA4ODMxODY2M30.ncZpsym86t55Io2QNq087KsSC_U4a9vCk1PJCLnalb4";
const IS_LIVE = true;
const _sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth:{ persistSession:true, storageKey:"fm-auth" } });

/* ══════════════════════════════════════
   MATCH ALGORITHM (mirrors lib/supabase.js)
══════════════════════════════════════ */
const ROLE_COMP = {
  Technical:{ Business:1, Marketing:.8, Designer:.8, Operator:.7 },
  Business: { Technical:1, Designer:.7, Marketing:.6 },
  Designer: { Technical:.8, Business:.7, Marketing:.6 },
  Marketing:{ Technical:.8, Business:.6, Designer:.6 },
  Operator: { Technical:.7, Business:.8 },
};
const TZ_OFF = { PST:-8,MST:-7,CST:-6,EST:-5,BRT:-3,GMT:0,CET:1,IST:5.5,SGT:8,JST:9,AEST:10 };
function calcMatch(me, them) {
  const si = new Set(me.interests||[]), ti = new Set(them.interests||[]);
  const shI = [...si].filter(x=>ti.has(x)).length, maxI = Math.max(si.size,ti.size,1);
  const ss = new Set(me.skills||[]), ts = new Set(them.skills||[]);
  const shS = [...ss].filter(x=>ts.has(x)).length, maxS = Math.max(ss.size,ts.size,1);
  const rm  = ROLE_COMP[me.role]||{};
  const rsc = (rm[them.role]||(me.role!==them.role?.5:.1))*30;
  const diff= Math.abs((TZ_OFF[me.timezone]??0)-(TZ_OFF[them.timezone]??0));
  const tzr = diff<=1?1:diff<=3?.75:diff<=6?.5:diff<=9?.25:0;
  return Math.round((shI/maxI)*40 + rsc + (shS/maxS)*20 + tzr*10);
}

/* ══════════════════════════════════════
   DEMO DATA (used when no Supabase config)
══════════════════════════════════════ */
const DEMO_USER = {
  id:"demo-user", name:"Your Name", email:"you@example.com",
  role:"Technical", experience_years:"4–6", location:"San Francisco",
  timezone:"PST", bio:"Building AI-powered tools for startups. Looking for a business-minded cofounder with GTM experience.",
  idea_status:"Have an idea", looking_for:["Business Cofounder","Marketer"],
  subscription_status:"free", profile_strength:72, onboarding_done:true,
  skills:["AI","Engineering","SaaS","Python","Product"],
  interests:["AI","SaaS","Fintech"],
};

const DEMO_FOUNDERS = [
  { id:"f1", name:"Alex Chen",     initials:"AC", bg:T.accent,  role:"Technical",  experience_years:"7–10", location:"San Francisco", timezone:"PST", skills:["AI","Engineering","SaaS","Python","LLMs"],    interests:["AI","SaaS","Fintech"],       idea_status:"Already building", looking_for:["Business Cofounder"],  bio:"Ex-Google ML engineer, 8 yrs. Built and shipped 3 AI products. Looking for business cofounder with fundraising experience.", connStatus:"pending",   profile_strength:91 },
  { id:"f2", name:"Sara Patel",    initials:"SP", bg:"#e8a0ff", role:"Business",   experience_years:"4–6",  location:"New York",      timezone:"EST", skills:["Sales","Fundraising","Product","GTM","Ops"],  interests:["Healthtech","SaaS","AI"],    idea_status:"Looking for ideas",  looking_for:["Technical Cofounder"], bio:"Former VC-backed founder. Raised $4M. Looking to build again in AI or health.", connStatus:"connected", profile_strength:88 },
  { id:"f3", name:"Marcus Kim",    initials:"MK", bg:"#ff9e6b", role:"Designer",   experience_years:"4–6",  location:"Austin",        timezone:"CST", skills:["Product","Mobile Apps","Figma","Brand","UX"],interests:["Consumer Apps","AI"],       idea_status:"Already building",  looking_for:["Technical Cofounder"], bio:"Product designer at Airbnb 5 yrs. Building the future of consumer experiences.", connStatus:"none",      profile_strength:79 },
  { id:"f4", name:"Lena Hoffmann", initials:"LH", bg:"#6be8d4", role:"Marketing",  experience_years:"7–10", location:"Berlin",        timezone:"CET", skills:["Marketing","Sales","SaaS","SEO","Paid Ads"], interests:["Climate","Fintech","Web3"], idea_status:"Have an idea",      looking_for:["Technical Cofounder"], bio:"CMO background with 3 exits. Passionate about climate tech and sustainable models.", connStatus:"none",      profile_strength:85 },
  { id:"f5", name:"James Okafor",  initials:"JO", bg:"#ff6b6b", role:"Operator",   experience_years:"7–10", location:"London",        timezone:"GMT", skills:["Ops","Hiring","Finance","Strategy","B2B"],   interests:["SaaS","Marketplace","AI"],  idea_status:"Looking for ideas",  looking_for:["Technical Cofounder"], bio:"COO at two YC startups. Expert at turning zero-to-one into repeatable scale.", connStatus:"none",      profile_strength:82 },
  { id:"f6", name:"Priya Singh",   initials:"PS", bg:"#a0d4ff", role:"Technical",  experience_years:"2–3",  location:"Toronto",       timezone:"EST", skills:["React","Node.js","AWS","Mobile","TypeScript"],interests:["Fintech","AI","Web3"],      idea_status:"Have an idea",      looking_for:["Business Cofounder"],  bio:"Full-stack engineer, strong product mindset. Shipped 3 side projects, ready to go full-time.", connStatus:"none", profile_strength:74 },
];

const DEMO_IDEAS = [
  { id:"i1", title:"AI Legal Assistant",         description:"Automate legal doc review for SMBs using GPT-4 — flag risks, suggest edits.", category:"AI",          stage:"MVP started",  looking_for:"Technical Founder", view_count:234, team:[DEMO_FOUNDERS[0],DEMO_FOUNDERS[1]] },
  { id:"i2", title:"AI Meeting Notes for Sales", description:"Real-time transcription and CRM sync for sales teams. Integrates with HubSpot.", category:"SaaS",        stage:"Researching",  looking_for:"Business Founder",  view_count:189, team:[DEMO_FOUNDERS[1]]              },
  { id:"i3", title:"Airbnb for Storage",          description:"Peer-to-peer storage connecting neighbors with spare space to those who need it.", category:"Marketplace", stage:"Just an idea", looking_for:"Designer",          view_count:142, team:[DEMO_FOUNDERS[2],DEMO_FOUNDERS[4]] },
  { id:"i4", title:"AI Personal CFO",             description:"Autonomous financial planning and execution. Connects to your accounts, runs on autopilot.", category:"Fintech",     stage:"MVP started",  looking_for:"Technical Founder", view_count:312, team:[DEMO_FOUNDERS[3]]              },
];

const DEMO_CHAT = [
  { id:"m1", sender_id:"f2", receiver_id:"demo-user", content:"Hey! Really impressed by your ML background.", created_at:"2025-03-05T10:22:00Z", read:true },
  { id:"m2", sender_id:"demo-user", receiver_id:"f2", content:"Thanks — your fundraising track record is exactly what I need.", created_at:"2025-03-05T10:24:00Z", read:true },
  { id:"m3", sender_id:"f2", receiver_id:"demo-user", content:"Want to jump on a call this week?", created_at:"2025-03-05T10:25:00Z", read:true },
  { id:"m4", sender_id:"demo-user", receiver_id:"f2", content:"Absolutely — Thursday 3pm PST works.", created_at:"2025-03-05T10:26:00Z", read:true },
  { id:"m5", sender_id:"f2", receiver_id:"demo-user", content:"Perfect. Sending a calendar invite now 🚀", created_at:"2025-03-05T10:27:00Z", read:false },
];

const ALL_SKILLS    = ["AI","SaaS","Mobile Apps","Marketing","Sales","Fundraising","Product","Engineering","Design","React","Python","Node.js","AWS","LLMs","Data Science","SEO","Ops","B2B","GTM","Brand","TypeScript","Web3","DevOps","Fintech"];
const ALL_INTERESTS = ["AI","SaaS","Fintech","Healthtech","Climate","Marketplace","Consumer Apps","Web3","EdTech","Gaming","DevTools","Enterprise","BioTech","LegalTech"];
const ROLES = ["Technical","Business","Designer","Marketing","Operator","Other"];
const IDEA_STATUSES = ["Looking for ideas","Have an idea","Already building"];
const LOOKING_FOR   = ["Technical Cofounder","Business Cofounder","Designer","Marketer","Operator"];

/* ══════════════════════════════════════
   AUTH CONTEXT
══════════════════════════════════════ */
const AuthCtx = createContext({});
function useAuth() { return useContext(AuthCtx); }

/* ══════════════════════════════════════
   SUPABASE API WRAPPER (demo ↔ live)
══════════════════════════════════════ */
function makeApi(sb, isDemo) {
  if (isDemo) return {
    auth: {
      signUp:  async (vals) => { return { user: DEMO_USER }; },
      signIn:  async ()     => { return { user: DEMO_USER }; },
      signOut: async ()     => {},
      reset:   async ()     => {},
    },
    profiles: {
      get:               async ()        => DEMO_USER,
      update:            async ()        => {},
      completeOnboarding:async ()        => {},
      getViewers:        async ()        => DEMO_FOUNDERS.slice(0,4),
    },
    founders: {
      list: async ({ role, search } = {}) => {
        let f = DEMO_FOUNDERS.map(x => ({ ...x, match: calcMatch(DEMO_USER, x) })).sort((a,b)=>b.match-a.match);
        if (role && role!=="All") f = f.filter(x=>x.role===role);
        if (search) { const q=search.toLowerCase(); f=f.filter(x=>x.name.toLowerCase().includes(q)||x.skills.some(s=>s.toLowerCase().includes(q))); }
        return f;
      },
      get: async (id) => DEMO_FOUNDERS.find(f=>f.id===id) || DEMO_FOUNDERS[0],
    },
    connections: {
      send:           async () => {},
      accept:         async () => {},
      decline:        async () => {},
      listConnected:  async () => DEMO_FOUNDERS.filter(f=>f.connStatus==="connected").map(f=>({ connectionId:"c-"+f.id, profile:f })),
      listPending:    async () => DEMO_FOUNDERS.filter(f=>f.connStatus==="pending").map(f=>({ connectionId:"c-"+f.id, profile:f })),
      getSuggested:   async () => DEMO_FOUNDERS.filter(f=>f.connStatus==="none").map(f=>({...f, match:calcMatch(DEMO_USER,f)})),
      getStatus:      async (uid, oid) => { const f=DEMO_FOUNDERS.find(x=>x.id===oid); return f ? { status:f.connStatus, sender_id:uid } : null; },
    },
    messages: {
      listConversations: async () => DEMO_FOUNDERS.filter(f=>f.connStatus==="connected").map(f=>({
        partnerId:f.id, partnerName:f.name, partnerRole:f.role,
        partnerInitials:f.initials, partnerBg:f.bg,
        lastMessage:"Tap to open this conversation.", lastTime:new Date().toISOString(), unread:f.id==="f2"?2:0,
      })),
      getChat:  async () => DEMO_CHAT,
      send:     async (sid, rid, content) => ({ id:"new-"+Date.now(), sender_id:sid, receiver_id:rid, content, created_at:new Date().toISOString(), read:false }),
      markRead: async () => {},
      subscribe:(uid, cb) => () => {},
    },
    ideas: {
      list:   async () => DEMO_IDEAS,
      get:    async (id) => DEMO_IDEAS.find(i=>i.id===id)||DEMO_IDEAS[0],
      create: async (data) => ({ id:"new-"+Date.now(), ...data }),
      join:   async () => {},
    },
  };

  // ── LIVE API (Supabase) ──────────────────────────────
  return {
    auth: {
      signUp:  ({ name, email, password }) => sb.auth.signUp({ email, password, options:{data:{name}} }).then(({data,error})=>{ if(error)throw new Error(error.message); return data; }),
      signIn:  ({ email, password })        => sb.auth.signInWithPassword({ email, password }).then(({data,error})=>{ if(error)throw new Error(error.message); return data; }),
      signOut: ()                           => sb.auth.signOut(),
      reset:   (email)                      => sb.auth.resetPasswordForEmail(email),
    },
    profiles: {
      get: async (uid, vid) => {
        const { data, error } = await sb.from("profiles").select("*, profile_skills(skills(name)), profile_interests(interests(name))").eq("id", uid).single();
        if (error) throw new Error(error.message);
        if (vid && vid !== uid) sb.from("profile_views").upsert({ viewer_id:vid, viewed_id:uid }, { onConflict:"viewer_id,viewed_id" }).then(()=>{});
        return { ...data, skills: data.profile_skills.map(ps=>ps.skills.name), interests: data.profile_interests.map(pi=>pi.interests.name) };
      },
      update: async (uid, fields) => {
        const { error } = await sb.from("profiles").update({ ...fields, updated_at:new Date().toISOString() }).eq("id", uid);
        if (error) throw new Error(error.message);
        const { data:str } = await sb.rpc("calc_profile_strength", { p_id:uid });
        if (str != null) await sb.from("profiles").update({ profile_strength:str }).eq("id", uid);
      },
      completeOnboarding: async (uid, d) => {
        await sb.from("profiles").update({ role:d.role, experience_years:d.experienceYears, idea_status:d.ideaStatus, looking_for:d.lookingFor, bio:d.bio, location:d.location, timezone:d.timezone, linkedin_url:d.linkedinUrl||"", twitter_url:d.twitterUrl||"", website_url:d.websiteUrl||"", onboarding_done:true, updated_at:new Date().toISOString() }).eq("id", uid);
        // skills
        const { data:sk } = await sb.from("skills").select("id,name").in("name", d.skills);
        await sb.from("profile_skills").delete().eq("profile_id", uid);
        if (sk?.length) await sb.from("profile_skills").insert(sk.map(s=>({ profile_id:uid, skill_id:s.id })));
        // interests
        const { data:in_ } = await sb.from("interests").select("id,name").in("name", d.interests);
        await sb.from("profile_interests").delete().eq("profile_id", uid);
        if (in_?.length) await sb.from("profile_interests").insert(in_.map(i=>({ profile_id:uid, interest_id:i.id })));
        const { data:str } = await sb.rpc("calc_profile_strength", { p_id:uid });
        if (str != null) await sb.from("profiles").update({ profile_strength:str }).eq("id", uid);
      },
      getViewers: async (uid) => {
        const { data } = await sb.from("profile_views").select("viewer_id, viewed_at, profiles!viewer_id(id,name,role,location)").eq("viewed_id", uid).order("viewed_at", { ascending:false }).limit(20);
        return (data||[]).map(v=>({ ...v.profiles, viewedAt:v.viewed_at }));
      },
    },
    founders: {
      list: async ({ userId, myProfile, role, search } = {}) => {
        let q = sb.from("profiles").select("*, profile_skills(skills(name)), profile_interests(interests(name))").eq("onboarding_done", true);
        if (userId) q = q.neq("id", userId);
        if (role && role !== "All") q = q.eq("role", role);
        const { data, error } = await q.limit(40);
        if (error) throw new Error(error.message);
        let list = data.map(f => ({ ...f, skills: f.profile_skills.map(ps=>ps.skills.name), interests: f.profile_interests.map(pi=>pi.interests.name) }));
        if (search) { const q2=search.toLowerCase(); list=list.filter(f=>f.name.toLowerCase().includes(q2)||f.skills.some(s=>s.toLowerCase().includes(q2))); }
        if (myProfile) { list=list.map(f=>({...f,match:calcMatch(myProfile,f)})); list.sort((a,b)=>b.match-a.match); }
        return list;
      },
      get: async (id, vid) => {
        const { data, error } = await sb.from("profiles").select("*, profile_skills(skills(name)), profile_interests(interests(name))").eq("id", id).single();
        if (error) throw new Error(error.message);
        if (vid && vid !== id) sb.from("profile_views").upsert({ viewer_id:vid, viewed_id:id }, { onConflict:"viewer_id,viewed_id" }).then(()=>{});
        return { ...data, skills: data.profile_skills.map(ps=>ps.skills.name), interests: data.profile_interests.map(pi=>pi.interests.name) };
      },
    },
    connections: {
      send:    async (sid, rid) => { const { error } = await sb.from("connections").insert({ sender_id:sid, receiver_id:rid, status:"pending" }); if (error&&!error.message.includes("unique")) throw new Error(error.message); },
      accept:  async (cid)      => { await sb.from("connections").update({ status:"connected", updated_at:new Date().toISOString() }).eq("id", cid); },
      decline: async (cid)      => { await sb.from("connections").update({ status:"declined", updated_at:new Date().toISOString() }).eq("id", cid); },
      listConnected: async (uid) => {
        const { data, error } = await sb.from("connections").select("id, sender:profiles!sender_id(id,name,role,location), receiver:profiles!receiver_id(id,name,role,location)").or(`sender_id.eq.${uid},receiver_id.eq.${uid}`).eq("status","connected");
        if (error) throw new Error(error.message);
        return data.map(c=>({ connectionId:c.id, profile: c.sender.id===uid ? c.receiver : c.sender }));
      },
      listPending: async (uid) => {
        const { data, error } = await sb.from("connections").select("id, sender:profiles!sender_id(id,name,role,location)").eq("receiver_id", uid).eq("status","pending");
        if (error) throw new Error(error.message);
        return data.map(c=>({ connectionId:c.id, profile:c.sender }));
      },
      getSuggested: async (uid) => {
        const { data } = await sb.from("profiles").select("id,name,role,location,profile_photo_url").eq("onboarding_done",true).neq("id",uid).limit(20);
        return data||[];
      },
      getStatus: async (uid, oid) => {
        const { data } = await sb.from("connections").select("id,status,sender_id").or(`and(sender_id.eq.${uid},receiver_id.eq.${oid}),and(sender_id.eq.${oid},receiver_id.eq.${uid})`).maybeSingle();
        return data;
      },
    },
    messages: {
      listConversations: async (uid) => {
        const { data, error } = await sb.from("messages").select("id,content,read,created_at,sender_id,receiver_id, sender:profiles!sender_id(id,name,role), receiver:profiles!receiver_id(id,name,role)").or(`sender_id.eq.${uid},receiver_id.eq.${uid}`).order("created_at",{ascending:false});
        if (error) throw new Error(error.message);
        const seen = new Set(); const convos = [];
        for (const m of data) {
          const p = m.sender_id===uid ? m.receiver : m.sender;
          if (!seen.has(p.id)) {
            seen.add(p.id);
            convos.push({ partnerId:p.id, partnerName:p.name, partnerRole:p.role, lastMessage:m.content, lastTime:m.created_at, unread:!m.read&&m.receiver_id===uid?1:0 });
          }
        }
        return convos;
      },
      getChat: async (uid, oid) => {
        const { data, error } = await sb.from("messages").select("id,content,read,created_at,sender_id,receiver_id").or(`and(sender_id.eq.${uid},receiver_id.eq.${oid}),and(sender_id.eq.${oid},receiver_id.eq.${uid})`).order("created_at",{ascending:true});
        if (error) throw new Error(error.message);
        return data;
      },
      send: async (sid, rid, content) => {
        const { data, error } = await sb.from("messages").insert({ sender_id:sid, receiver_id:rid, content }).select().single();
        if (error) throw new Error(error.message);
        return data;
      },
      markRead: async (uid, sid) => {
        await sb.from("messages").update({read:true}).eq("receiver_id",uid).eq("sender_id",sid).eq("read",false);
      },
      subscribe: (uid, cb) => {
        const ch = sb.channel(`msg:${uid}`).on("postgres_changes",{ event:"INSERT", schema:"public", table:"messages", filter:`receiver_id=eq.${uid}` }, p => cb(p.new)).subscribe();
        return () => sb.removeChannel(ch);
      },
    },
    ideas: {
      list: async ({ trending } = {}) => {
        const { data, error } = await sb.from("ideas").select("*, creator:profiles!creator_id(id,name), idea_members(profile_id,profiles(id,name,role))").limit(20);
        if (error) throw new Error(error.message);
        let list = data.map(i=>({ ...i, memberCount:i.idea_members.length, team:i.idea_members.map(m=>m.profiles) }));
        if (trending) list.sort((a,b)=>(b.memberCount+b.view_count)-(a.memberCount+a.view_count));
        return list;
      },
      get: async (id) => {
        const { data, error } = await sb.from("ideas").select("*, creator:profiles!creator_id(*), idea_members(role,joined_at,profiles(*))").eq("id",id).single();
        if (error) throw new Error(error.message);
        await sb.from("ideas").update({ view_count:(data.view_count||0)+1 }).eq("id",id);
        return { ...data, team:data.idea_members.map(m=>({...m.profiles,memberRole:m.role})) };
      },
      create: async (d, uid) => {
        const { data, error } = await sb.from("ideas").insert({ title:d.title, description:d.description, category:d.category, stage:d.stage, looking_for:d.lookingFor, creator_id:uid }).select().single();
        if (error) throw new Error(error.message);
        await sb.from("idea_members").insert({ idea_id:data.id, profile_id:uid, role:"Creator" });
        return data;
      },
      join: async (iid, uid) => { const { error } = await sb.from("idea_members").insert({ idea_id:iid, profile_id:uid }); if (error&&!error.message.includes("unique")) throw new Error(error.message); },
    },
  };
}

/* ══════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════ */
const Tag = ({ label, highlight, active, onClick }) => (
  <span onClick={onClick} style={{ fontSize:10, letterSpacing:"0.05em", padding:"5px 11px", border:`1px solid ${highlight||active?T.accent:T.border}`, color:highlight||active?T.accent:T.muted, borderRadius:2, whiteSpace:"nowrap", fontFamily:F.body, cursor:onClick?"pointer":"default", background:active?"rgba(232,255,71,0.07)":"none", transition:"all 0.15s", display:"inline-block" }}>{label}</span>
);
const SectionLabel = ({ children }) => (
  <div style={{ fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:T.accent, marginBottom:14, display:"flex", alignItems:"center", gap:10, fontFamily:F.body }}>
    <span style={{ display:"block", width:20, height:1, background:T.accent }} />{children}
  </div>
);
const Btn = ({ children, onClick, style={}, disabled, ghost }) => (
  <button onClick={onClick} disabled={disabled} style={{ background:ghost?"none":disabled?T.border:T.accent, color:ghost?T.muted:disabled?T.muted:T.black, border:ghost?`1px solid ${T.border}`:"none", padding:"13px 24px", fontWeight:600, fontSize:14, borderRadius:2, cursor:disabled?"not-allowed":"pointer", fontFamily:F.body, width:"100%", letterSpacing:"0.02em", transition:"background 0.15s", ...style }}>{children}</button>
);
const Inp = ({ label, type="text", placeholder, value, onChange }) => (
  <div>
    {label && <label style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, display:"block", marginBottom:8, fontFamily:F.body }}>{label}</label>}
    <input type={type} placeholder={placeholder} value={value||""} onChange={onChange||(() => {})} style={{ width:"100%", padding:"13px 16px", background:"#111", border:`1px solid ${T.border}`, color:T.white, fontSize:14, fontFamily:F.body, borderRadius:2, boxSizing:"border-box", outline:"none" }} />
  </div>
);
const Avatar = ({ initials, bg="#2a2a2a", size=44, url }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:url?`url(${url}) center/cover`:bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*.33, color:T.black, flexShrink:0, fontFamily:F.body }}>{url?"":initials}</div>
);
const LockRow = ({ label="Upgrade to unlock" }) => (
  <div style={{ border:`1px dashed ${T.border}`, borderRadius:2, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
    <span style={{ fontSize:11, color:"#444" }}>⬡</span>
    <span style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>{label}</span>
    <span style={{ marginLeft:"auto", fontSize:10, color:T.accent, fontFamily:F.body, fontWeight:700 }}>+ PLUS</span>
  </div>
);
const MatchBar = ({ score }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
    <div style={{ flex:1, height:2, background:T.border, borderRadius:1 }}><div style={{ width:`${score}%`, height:"100%", background:T.accent, borderRadius:1 }} /></div>
    <span style={{ fontSize:11, color:T.accent, fontFamily:F.body, fontWeight:700, whiteSpace:"nowrap" }}>{score}%</span>
  </div>
);
const Toggle = ({ on, onClick }) => (
  <div onClick={onClick} style={{ width:44, height:24, borderRadius:12, background:on?T.accent:T.border, cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
    <div style={{ position:"absolute", top:3, left:on?23:3, width:18, height:18, borderRadius:9, background:on?T.black:T.muted, transition:"left 0.2s" }} />
  </div>
);
const Spinner = () => (
  <div style={{ display:"flex", justifyContent:"center", padding:"40px 0" }}>
    <div style={{ width:24, height:24, border:`2px solid ${T.border}`, borderTopColor:T.accent, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
  </div>
);
const Toast = ({ msg, onClose }) => (
  msg ? <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", background:T.card, border:`1px solid ${T.accent}`, padding:"12px 20px", borderRadius:2, zIndex:999, fontSize:13, color:T.white, fontFamily:F.body, whiteSpace:"nowrap", boxShadow:"0 8px 32px rgba(0,0,0,0.8)" }}>{msg}</div> : null
);
function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso), now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff/60)}m`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h`;
  return `${Math.floor(diff/86400)}d`;
}
function initials(name="") { return name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); }
const BG_POOL = ["#e8ff47","#e8a0ff","#ff9e6b","#6be8d4","#ff6b6b","#a0d4ff","#ffd76b","#b0ffb0"];
function avatarBg(id="") { return BG_POOL[id.charCodeAt(id.length-1)%BG_POOL.length]; }

/* ══════════════════════════════════════
   BOTTOM NAV
══════════════════════════════════════ */
const NAV_TABS = [
  { id:"home",        icon:"⊞", label:"Home"    },
  { id:"discover",    icon:"◎", label:"Browse"  },
  { id:"connections", icon:"⟳", label:"Network" },
  { id:"messages",    icon:"✉", label:"Messages"},
  { id:"profile",     icon:"◉", label:"Profile" },
];
const ROOT_IDS = NAV_TABS.map(t=>t.id);

function BottomNav({ screen, setScreen, unreadCount }) {
  const active = ROOT_IDS.includes(screen) ? screen
    : screen==="founderProfile" ? "discover"
    : screen==="founderTeam"    ? "connections"
    : screen==="settings"       ? "profile"
    : "home";
  return (
    <div style={{ display:"flex", background:T.offBlack, borderTop:`1px solid ${T.border}`, paddingBottom:"env(safe-area-inset-bottom,12px)", flexShrink:0 }}>
      {NAV_TABS.map(t => (
        <button key={t.id} onClick={()=>setScreen(t.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, border:"none", background:"none", cursor:"pointer", padding:"10px 0 8px", outline:"none", position:"relative" }}>
          <span style={{ fontSize:16, lineHeight:1, opacity:active===t.id?1:.3 }}>{t.icon}</span>
          <span style={{ fontSize:9, letterSpacing:"0.07em", textTransform:"uppercase", fontFamily:F.body, fontWeight:600, color:active===t.id?T.accent:T.muted }}>{t.label}</span>
          {active===t.id && <div style={{ width:14, height:1, background:T.accent }} />}
          {t.id==="messages" && unreadCount>0 && <div style={{ position:"absolute", top:7, right:"25%", width:8, height:8, borderRadius:"50%", background:T.accent }} />}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   CONFIG / SETUP SCREEN
══════════════════════════════════════ */
function SetupScreen({ onSave, onDemo }) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ padding:"64px 28px 40px", borderBottom:`1px solid ${T.border}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px)`, backgroundSize:"60px 60px", opacity:0.12, pointerEvents:"none" }} />
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
            <span style={{ display:"block", width:24, height:1, background:T.accent }} />
            <span style={{ fontSize:10, letterSpacing:"0.14em", textTransform:"uppercase", color:T.accent, fontFamily:F.body }}>FounderMatch</span>
          </div>
          <div style={{ fontFamily:F.display, fontSize:52, color:T.white, lineHeight:0.9, marginBottom:4 }}>CONNECT TO</div>
          <div style={{ fontFamily:F.serif, fontSize:56, fontStyle:"italic", color:T.accent, marginBottom:28 }}>supabase.</div>
          <p style={{ fontSize:13, color:T.muted, lineHeight:1.7, marginBottom:32, fontFamily:F.body }}>
            Enter your Supabase project credentials to use the live backend, or run in <strong style={{ color:T.white }}>Demo Mode</strong> with sample data.
          </p>
        </div>
      </div>
      <div style={{ padding:"28px 28px 16px", display:"flex", flexDirection:"column", gap:18 }}>
        <Inp label="Supabase Project URL" placeholder="https://xxxx.supabase.co" value={url} onChange={e=>setUrl(e.target.value)} />
        <Inp label="Supabase Anon Key" placeholder="eyJhbGci..." value={key} onChange={e=>setKey(e.target.value)} />
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"14px 16px" }}>
          <div style={{ fontSize:10, color:T.muted, fontFamily:F.body, lineHeight:1.7 }}>
            Find these in your Supabase dashboard →<br/>
            <strong style={{ color:T.white }}>Settings → API → Project URL &amp; anon/public key</strong><br/>
            Run <strong style={{ color:T.accent }}>schema.sql</strong> in the SQL Editor first.
          </div>
        </div>
        <Btn onClick={() => url && key && onSave(url.trim(), key.trim())} disabled={!url||!key}>Connect →</Btn>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ flex:1, height:1, background:T.border }} />
          <span style={{ fontSize:11, color:T.muted, fontFamily:F.body }}>or</span>
          <div style={{ flex:1, height:1, background:T.border }} />
        </div>
        <Btn ghost onClick={onDemo}>Run in Demo Mode</Btn>
        <p style={{ textAlign:"center", fontSize:11, color:T.muted, fontFamily:F.body }}>Demo mode uses sample data. No Supabase account needed.</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   LANDING
══════════════════════════════════════ */
function LandingScreen({ setScreen }) {
  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ padding:"64px 28px 40px", borderBottom:`1px solid ${T.border}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px)`, backgroundSize:"60px 60px", opacity:0.12, pointerEvents:"none" }} />
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:28 }}><span style={{ display:"block", width:28, height:1, background:T.accent }} /><span style={{ fontSize:10, letterSpacing:"0.16em", textTransform:"uppercase", color:T.accent, fontFamily:F.body }}>FounderMatch</span></div>
          <div style={{ fontFamily:F.display, fontSize:64, lineHeight:0.9, color:T.white, marginBottom:4 }}>FIND YOUR</div>
          <div style={{ fontFamily:F.serif, fontSize:68, fontStyle:"italic", color:T.accent, marginBottom:32 }}>cofounder.</div>
          <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:10, marginBottom:40 }}>
            {["Swipe through vetted founders","AI-powered compatibility matching","Idea Marketplace + Founder Teams","Direct encrypted messaging"].map(i=>(
              <li key={i} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:T.white, fontFamily:F.body }}><span style={{ color:T.accent }}>→</span>{i}</li>
            ))}
          </ul>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Btn onClick={()=>setScreen("signup")}>Create Free Profile →</Btn>
            <Btn ghost onClick={()=>setScreen("login")}>Sign In</Btn>
          </div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr" }}>
        {[["12K+","Founders"],["3.2K","Teams"],["89%","Match Rate"]].map(([v,l],i)=>(
          <div key={l} style={{ padding:"22px 12px", borderRight:i<2?`1px solid ${T.border}`:"none", textAlign:"center" }}>
            <div style={{ fontFamily:F.display, fontSize:26, color:T.accent }}>{v}</div>
            <div style={{ fontSize:9, color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:4, fontFamily:F.body }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SIGN UP
══════════════════════════════════════ */
function SignupScreen({ setScreen }) {
  const { api } = useAuth();
  const [step, setStep] = useState(1);
  const [vals, setVals] = useState({ name:"", email:"", pass:"", confirm:"" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = k => e => setVals(v=>({...v,[k]:e.target.value}));

  async function doSignup() {
    if (vals.pass !== vals.confirm) { setErr("Passwords don't match"); return; }
    setLoading(true); setErr("");
    try { await api.auth.signUp({ name:vals.name, email:vals.email, password:vals.pass }); setStep(2); }
    catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:T.black, overflow:"hidden" }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 20px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <button onClick={()=>step===1?setScreen("landing"):setStep(1)} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← {step===1?"BACK":"ACCOUNT"}</button>
        <div style={{ fontFamily:F.display, fontSize:38, color:T.white, lineHeight:0.92 }}>CREATE</div>
        <div style={{ fontFamily:F.serif, fontSize:40, fontStyle:"italic", color:T.accent, marginBottom:14 }}>account.</div>
        <div style={{ display:"flex", gap:4, marginBottom:6 }}>{[1,2].map(n=><div key={n} style={{ flex:1, height:2, borderRadius:1, background:step>=n?T.accent:T.border, transition:"background 0.3s" }} />)}</div>
        <div style={{ fontSize:10, color:T.muted, fontFamily:F.body, letterSpacing:"0.07em" }}>STEP {step} OF 2</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"28px 28px 48px", display:"flex", flexDirection:"column", gap:20 }}>
        {step===1 ? <>
          <Inp label="Full Name" placeholder="Your full name" value={vals.name} onChange={set("name")} />
          <Inp label="Email Address" type="email" placeholder="you@example.com" value={vals.email} onChange={set("email")} />
          <Inp label="Password" type="password" placeholder="Min 8 characters" value={vals.pass} onChange={set("pass")} />
          <Inp label="Confirm Password" type="password" placeholder="Repeat password" value={vals.confirm} onChange={set("confirm")} />
          {err && <div style={{ fontSize:12, color:T.danger, fontFamily:F.body, background:"rgba(255,95,95,0.08)", border:`1px solid ${T.danger}`, padding:"10px 14px", borderRadius:2 }}>{err}</div>}
          <Btn onClick={doSignup} disabled={loading||!vals.name||!vals.email||!vals.pass}>{loading?"Creating…":"Continue →"}</Btn>
          <p style={{ textAlign:"center", fontSize:13, color:T.muted, fontFamily:F.body, margin:0 }}>Have an account? <span onClick={()=>setScreen("login")} style={{ color:T.accent, cursor:"pointer" }}>Sign in</span></p>
        </> : <>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"24px", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>✉</div>
            <div style={{ fontFamily:F.display, fontSize:18, color:T.white, letterSpacing:"0.04em", marginBottom:8 }}>CHECK YOUR EMAIL</div>
            <div style={{ fontSize:13, color:T.muted, fontFamily:F.body, lineHeight:1.6 }}>We sent a verification link to<br/><strong style={{ color:T.white }}>{vals.email}</strong></div>
          </div>
          <Btn onClick={()=>setScreen("questionnaire")}>I Verified — Continue →</Btn>
          <div style={{ textAlign:"center" }}><span style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>Didn't receive it? </span><span style={{ fontSize:12, color:T.accent, fontFamily:F.body, cursor:"pointer" }}>Resend</span></div>
        </>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   LOGIN
══════════════════════════════════════ */
function LoginScreen({ setScreen }) {
  const { setUser, setIsPaid } = useAuth();
  const [vals, setVals] = useState({ email:"", pass:"" });
  const [reset, setReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const set = k => e => setVals(v=>({...v,[k]:e.target.value}));

  async function doLogin() {
    setLoading(true); setErr("");
    try {
      if (!_sb) throw new Error("Not connected to database");
      const { data, error } = await _sb.auth.signInWithPassword({ email:vals.email, password:vals.pass });
      if (error) throw new Error(error.message);
      if (data?.user) {
        const uid = data.user.id;
        const [profRes, skRes, inrRes] = await Promise.all([
          _sb.from("profiles").select("*").eq("id", uid).single(),
          _sb.from("profile_skills").select("skills(name)").eq("profile_id", uid),
          _sb.from("profile_interests").select("interests(name)").eq("profile_id", uid),
        ]);
        const profile = profRes.data || {};
        const skills  = (skRes.data||[]).map(s=>s.skills?.name).filter(Boolean);
        const interests = (inrRes.data||[]).map(i=>i.interests?.name).filter(Boolean);
        setUser({ ...profile, skills, interests });
        setIsPaid(profile?.subscription_status === "plus");
        setScreen(profile?.onboarding_done ? "home" : "questionnaire");
      }
    } catch(e) { setErr(e.message||"Invalid credentials"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 28px", borderBottom:`1px solid ${T.border}` }}>
        <button onClick={()=>setScreen("landing")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← BACK</button>
        <div style={{ fontFamily:F.display, fontSize:38, color:T.white, lineHeight:0.92 }}>WELCOME</div>
        <div style={{ fontFamily:F.serif, fontSize:40, fontStyle:"italic", color:T.accent }}>{reset?"back.":"back."}</div>
      </div>
      <div style={{ padding:"28px 28px 48px", display:"flex", flexDirection:"column", gap:20 }}>
        {!reset ? <>
          <Inp label="Email Address" type="email" placeholder="you@example.com" value={vals.email} onChange={set("email")} />
          <Inp label="Password" type="password" placeholder="Your password" value={vals.pass} onChange={set("pass")} />
          <div style={{ textAlign:"right", marginTop:-10 }}><span onClick={()=>setReset(true)} style={{ fontSize:12, color:T.accent, fontFamily:F.body, cursor:"pointer" }}>Forgot password?</span></div>
          {err && <div style={{ fontSize:12, color:T.danger, fontFamily:F.body, background:"rgba(255,95,95,0.08)", border:`1px solid ${T.danger}`, padding:"10px 14px", borderRadius:2 }}>{err}</div>}
          <Btn onClick={doLogin} disabled={loading||!vals.email||!vals.pass}>{loading?"Signing in…":"Sign In →"}</Btn>
          <p style={{ textAlign:"center", fontSize:13, color:T.muted, fontFamily:F.body, margin:0 }}>No account? <span onClick={()=>setScreen("signup")} style={{ color:T.accent, cursor:"pointer" }}>Create one free</span></p>
        </> : <>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"16px" }}><div style={{ fontSize:12, color:T.muted, fontFamily:F.body, lineHeight:1.6 }}>Enter your email and we'll send a reset link.</div></div>
          <Inp label="Email Address" type="email" placeholder="you@example.com" value={vals.email} onChange={set("email")} />
          <Btn onClick={async()=>{ await api.auth.reset(vals.email); setReset(false); }}>Send Reset Link →</Btn>
          <div style={{ textAlign:"center" }}><span onClick={()=>setReset(false)} style={{ fontSize:12, color:T.accent, fontFamily:F.body, cursor:"pointer" }}>← Back to sign in</span></div>
        </>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   QUESTIONNAIRE
══════════════════════════════════════ */
function QuestionnaireScreen({ setScreen }) {
  const { api, user, setUser } = useAuth();
  const TOTAL = 6;
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [yoe, setYoe] = useState("");
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [ideaStatus, setIdeaStatus] = useState("");
  const [lookingFor, setLookingFor] = useState([]);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("PST");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const toggleArr = (arr, setArr, val) => setArr(prev => prev.includes(val) ? prev.filter(v=>v!==val) : [...prev, val]);
  const canNext = [true, !!role, skills.length>=1, interests.length>=1, !!ideaStatus, lookingFor.length>=1][step-1];

  async function finish() {
    setSaving(true);
    try {
      await api.profiles.completeOnboarding(user.id, { role, experienceYears:yoe, skills, interests, ideaStatus, lookingFor, bio, location, timezone, linkedinUrl });
      const updated = await api.profiles.get(user.id);
      setUser(updated);
      setScreen("home");
    } catch(e) { console.error(e); setSaving(false); }
  }

  const stepContent = () => {
    if (step===1) return <>
      <div style={{ marginBottom:6, fontFamily:F.display, fontSize:12, color:T.muted, letterSpacing:"0.1em" }}>LET'S GET STARTED</div>
      <div style={{ fontFamily:F.display, fontSize:30, color:T.white, lineHeight:0.92, marginBottom:4 }}>TELL US ABOUT</div>
      <div style={{ fontFamily:F.serif, fontSize:32, fontStyle:"italic", color:T.accent, marginBottom:20 }}>yourself.</div>
      <div style={{ fontSize:13, color:T.muted, fontFamily:F.body, lineHeight:1.6, marginBottom:24 }}>Answer a few quick questions to find compatible cofounders. Takes ~2 minutes.</div>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px", marginBottom:20 }}>
        <SectionLabel>What you'll share</SectionLabel>
        {["Founder role & skills","Startup interests","Current idea status","What you need in a cofounder","Bio & location"].map(i=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.white, fontFamily:F.body }}><span style={{ color:T.accent, fontSize:11 }}>→</span>{i}</div>
        ))}
      </div>
      <Btn onClick={()=>setStep(2)}>Begin Setup →</Btn>
    </>;

    if (step===2) return <>
      <div style={{ fontFamily:F.display, fontSize:30, color:T.white, lineHeight:0.92, marginBottom:4 }}>YOUR FOUNDER</div>
      <div style={{ fontFamily:F.serif, fontSize:32, fontStyle:"italic", color:T.accent, marginBottom:8 }}>role.</div>
      <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginBottom:20 }}>Pick the one that best describes you.</div>
      <div style={{ display:"flex", flexDirection:"column", gap:2, marginBottom:20 }}>
        {ROLES.map(r=>(
          <div key={r} onClick={()=>setRole(r)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:role===r?"rgba(232,255,71,0.06)":T.card, border:`1px solid ${role===r?T.accent:T.border}`, cursor:"pointer", transition:"all 0.15s" }}>
            <span style={{ fontFamily:F.display, fontSize:17, color:role===r?T.accent:T.white, letterSpacing:"0.04em" }}>{r.toUpperCase()}</span>
            {role===r && <span style={{ color:T.accent }}>✓</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:F.body, marginBottom:10 }}>Years of Experience</div>
      <div style={{ display:"flex", gap:2 }}>
        {["0–1","2–3","4–6","7–10","10+"].map(y=>(
          <div key={y} onClick={()=>setYoe(y)} style={{ flex:1, padding:"12px 0", textAlign:"center", cursor:"pointer", background:yoe===y?"rgba(232,255,71,0.06)":T.card, border:`1px solid ${yoe===y?T.accent:T.border}` }}>
            <div style={{ fontSize:10, fontFamily:F.display, color:yoe===y?T.accent:T.white, letterSpacing:"0.04em" }}>{y}</div>
            <div style={{ fontSize:8, color:T.muted, fontFamily:F.body }}>yrs</div>
          </div>
        ))}
      </div>
    </>;

    if (step===3) return <>
      <div style={{ fontFamily:F.display, fontSize:30, color:T.white, lineHeight:0.92, marginBottom:4 }}>YOUR CORE</div>
      <div style={{ fontFamily:F.serif, fontSize:32, fontStyle:"italic", color:T.accent, marginBottom:8 }}>skills.</div>
      <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginBottom:18 }}>Select all that apply. Pick at least 3.</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
        {ALL_SKILLS.map(s=><Tag key={s} label={s} active={skills.includes(s)} onClick={()=>toggleArr(skills,setSkills,s)} />)}
      </div>
      <div style={{ fontSize:11, color:T.muted, fontFamily:F.body }}>{skills.length} selected</div>
    </>;

    if (step===4) return <>
      <div style={{ fontFamily:F.display, fontSize:30, color:T.white, lineHeight:0.92, marginBottom:4 }}>STARTUP</div>
      <div style={{ fontFamily:F.serif, fontSize:32, fontStyle:"italic", color:T.accent, marginBottom:8 }}>interests.</div>
      <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginBottom:18 }}>What spaces excite you most? Pick at least 2.</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
        {ALL_INTERESTS.map(i=><Tag key={i} label={i} active={interests.includes(i)} highlight={interests.includes(i)} onClick={()=>toggleArr(interests,setInterests,i)} />)}
      </div>
      <div style={{ fontSize:11, color:T.muted, fontFamily:F.body }}>{interests.length} selected</div>
    </>;

    if (step===5) return <>
      <div style={{ fontFamily:F.display, fontSize:30, color:T.white, lineHeight:0.92, marginBottom:4 }}>CURRENT IDEA</div>
      <div style={{ fontFamily:F.serif, fontSize:32, fontStyle:"italic", color:T.accent, marginBottom:18 }}>status.</div>
      <div style={{ display:"flex", flexDirection:"column", gap:2, marginBottom:20 }}>
        {IDEA_STATUSES.map(s=>(
          <div key={s} onClick={()=>setIdeaStatus(s)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px", background:ideaStatus===s?"rgba(232,255,71,0.06)":T.card, border:`1px solid ${ideaStatus===s?T.accent:T.border}`, cursor:"pointer" }}>
            <div>
              <div style={{ fontFamily:F.display, fontSize:16, color:ideaStatus===s?T.accent:T.white, letterSpacing:"0.04em" }}>{s.toUpperCase()}</div>
              <div style={{ fontSize:10, color:T.muted, fontFamily:F.body, marginTop:2 }}>{s==="Looking for ideas"?"Open to any opportunity":s==="Have an idea"?"Got a concept, need the team":"Already in motion"}</div>
            </div>
            {ideaStatus===s && <span style={{ color:T.accent }}>✓</span>}
          </div>
        ))}
      </div>
      <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:F.body, marginBottom:10 }}>Looking For</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {LOOKING_FOR.map(l=><Tag key={l} label={l} active={lookingFor.includes(l)} onClick={()=>toggleArr(lookingFor,setLookingFor,l)} />)}
      </div>
    </>;

    if (step===6) return <>
      <div style={{ fontFamily:F.display, fontSize:30, color:T.white, lineHeight:0.92, marginBottom:4 }}>ALMOST</div>
      <div style={{ fontFamily:F.serif, fontSize:32, fontStyle:"italic", color:T.accent, marginBottom:20 }}>done.</div>
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        <div>
          <label style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, display:"block", marginBottom:8, fontFamily:F.body }}>Short Bio (max 300 chars)</label>
          <textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,300))} placeholder="What are you building and what cofounder do you need?" style={{ width:"100%", minHeight:90, padding:"13px 16px", background:"#111", border:`1px solid ${T.border}`, color:T.white, fontSize:13, fontFamily:F.body, borderRadius:2, boxSizing:"border-box", outline:"none", resize:"none", lineHeight:1.6 }} />
          <div style={{ fontSize:10, color:T.muted, fontFamily:F.body, textAlign:"right", marginTop:4 }}>{bio.length}/300</div>
        </div>
        <Inp label="Location (City, Country)" placeholder="San Francisco, US" value={location} onChange={e=>setLocation(e.target.value)} />
        <div>
          <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:F.body, marginBottom:10 }}>Timezone</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {["PST","EST","GMT","CET","IST","SGT","AEST"].map(tz=><Tag key={tz} label={tz} active={timezone===tz} onClick={()=>setTimezone(tz)} />)}
          </div>
        </div>
        <Inp label="LinkedIn URL (optional)" placeholder="https://linkedin.com/in/..." value={linkedinUrl} onChange={e=>setLinkedinUrl(e.target.value)} />
        <div style={{ background:"rgba(232,255,71,0.05)", border:`1px solid ${T.accent}`, padding:"14px 16px" }}>
          <div style={{ fontFamily:F.display, fontSize:13, color:T.accent, letterSpacing:"0.04em", marginBottom:4 }}>READY TO LAUNCH</div>
          <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, lineHeight:1.6 }}>Your profile goes live immediately. Edit anytime from the Profile screen.</div>
        </div>
      </div>
    </>;
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:T.black, overflow:"hidden" }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 18px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        {step>1 && <button onClick={()=>setStep(s=>s-1)} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:12, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← BACK</button>}
        <div style={{ display:"flex", gap:3, marginBottom:6 }}>
          {Array.from({length:TOTAL}).map((_,i)=><div key={i} style={{ flex:1, height:2, borderRadius:1, background:step>i?T.accent:T.border, transition:"background 0.3s" }} />)}
        </div>
        <div style={{ fontSize:10, color:T.muted, fontFamily:F.body, letterSpacing:"0.08em" }}>STEP {step} OF {TOTAL}</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"24px 28px 20px" }}>{stepContent()}</div>
      {step>1 && (
        <div style={{ padding:"14px 28px 28px", background:T.offBlack, borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
          <Btn onClick={step<TOTAL?()=>setStep(s=>s+1):finish} disabled={!canNext||saving}>
            {saving?"Saving…":step<TOTAL?"Continue →":"Complete Setup →"}
          </Btn>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   HOME / DASHBOARD
══════════════════════════════════════ */
function HomeScreen({ setScreen }) {
  const { api, user, isPaid } = useAuth();
  const [founders, setFounders] = useState([]);
  const [pending, setPending] = useState([]);
  const [convos, setConvos] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    if (!user) return;
    Promise.all([
      api.founders.list({ userId:user.id, myProfile:user, role:"All" }).catch(()=>[]),
      api.connections.listPending(user.id).catch(()=>[]),
      api.messages.listConversations(user.id).catch(()=>[]),
      api.ideas.list({ trending:true }).catch(()=>[]),
    ]).then(([f,p,c,i])=>{ setFounders(f.slice(0,4)); setPending(p); setConvos(c.slice(0,2)); setIdeas(i.slice(0,2)); }).finally(()=>setLoading(false));
  },[user]);

  if (loading) return <div style={{ flex:1, background:T.black }}><Spinner /></div>;

  const strength = user?.profile_strength || 0;

  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 20px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:10, color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:F.body, marginBottom:6 }}>Good morning</div>
            <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.9 }}>FIND YOUR</div>
            <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>cofounder.</div>
          </div>
          <div onClick={()=>setScreen("profile")} style={{ cursor:"pointer", paddingTop:4 }}>
            <Avatar initials={initials(user?.name)} bg={avatarBg(user?.id||"")} size={42} />
          </div>
        </div>
      </div>

      {/* profile strength */}
      {strength < 90 && (
        <div style={{ margin:"14px 28px 0", background:T.card, border:`1px solid ${T.border}`, padding:"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:10, color:T.muted, fontFamily:F.body, letterSpacing:"0.08em", textTransform:"uppercase" }}>Profile Strength</span>
            <span style={{ fontSize:10, color:T.accent, fontFamily:F.body, fontWeight:700 }}>{strength}%</span>
          </div>
          <div style={{ height:2, background:T.border, borderRadius:1 }}><div style={{ width:`${strength}%`, height:"100%", background:T.accent, borderRadius:1, transition:"width 0.5s" }} /></div>
          <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:8 }}>Complete your profile to improve match visibility →</div>
        </div>
      )}

      {/* pending */}
      {pending.length > 0 && (
        <div style={{ marginTop:20, borderTop:`1px solid ${T.border}`, paddingTop:16 }}>
          <div style={{ padding:"0 28px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <SectionLabel>Pending Requests</SectionLabel>
            <span onClick={()=>setScreen("connections")} style={{ fontSize:10, color:T.accent, cursor:"pointer", fontFamily:F.body, letterSpacing:"0.08em" }}>VIEW →</span>
          </div>
          {pending.map(c=>(
            <div key={c.connectionId} style={{ margin:"0 28px 6px", background:T.card, border:`1px solid ${T.border}`, padding:"14px", display:"flex", gap:12, alignItems:"center" }}>
              <Avatar initials={initials(c.profile.name)} bg={avatarBg(c.profile.id||"")} size={36} />
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:F.display, fontSize:13, color:T.white, letterSpacing:"0.03em" }}>{c.profile.name.toUpperCase()}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:F.body }}>{c.profile.role}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button style={{ padding:"6px 10px", background:"none", border:`1px solid ${T.border}`, color:T.muted, fontSize:10, cursor:"pointer", fontFamily:F.body, borderRadius:2 }}>✕</button>
                <button style={{ padding:"6px 10px", background:T.accent, border:"none", color:T.black, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:F.body, borderRadius:2 }}>✓</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* top matches */}
      <div style={{ marginTop:20, borderTop:`1px solid ${T.border}`, paddingTop:16 }}>
        <div style={{ padding:"0 28px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <SectionLabel>Top Matches</SectionLabel>
          <span onClick={()=>setScreen("discover")} style={{ fontSize:10, color:T.accent, cursor:"pointer", fontFamily:F.body, letterSpacing:"0.08em" }}>SEE ALL →</span>
        </div>
        <div style={{ display:"flex", overflowX:"auto", paddingLeft:28 }}>
          {founders.map(f=>(
            <div key={f.id} onClick={()=>setScreen("founderProfile")} style={{ minWidth:148, background:T.card, border:`1px solid ${T.border}`, padding:16, marginRight:2, cursor:"pointer", flexShrink:0 }}>
              <Avatar initials={initials(f.name)} bg={avatarBg(f.id)} size={38} />
              <div style={{ marginTop:10, fontFamily:F.display, fontSize:14, color:T.white, letterSpacing:"0.03em" }}>{(f.name||"").split(" ")[0].toUpperCase()}</div>
              <div style={{ fontSize:10, color:T.muted, fontFamily:F.body, marginBottom:10 }}>{f.role}</div>
              {isPaid && f.match!=null ? <MatchBar score={f.match} /> : <LockRow label="Score" />}
            </div>
          ))}
          <div style={{ width:28, flexShrink:0 }} />
        </div>
      </div>

      {/* recent messages */}
      {convos.length > 0 && (
        <div style={{ marginTop:20, borderTop:`1px solid ${T.border}`, paddingTop:16 }}>
          <div style={{ padding:"0 28px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <SectionLabel>Recent Messages</SectionLabel>
            <span onClick={()=>setScreen("messages")} style={{ fontSize:10, color:T.accent, cursor:"pointer", fontFamily:F.body, letterSpacing:"0.08em" }}>SEE ALL →</span>
          </div>
          {convos.map(c=>(
            <div key={c.partnerId} onClick={()=>setScreen("messages")} style={{ margin:"0 28px 2px", background:T.card, border:`1px solid ${T.border}`, padding:"12px 14px", display:"flex", gap:12, alignItems:"center", cursor:"pointer" }}>
              <div style={{ position:"relative" }}>
                <Avatar initials={initials(c.partnerName)} bg={c.partnerBg||avatarBg(c.partnerId)} size={36} />
                {c.unread>0 && <div style={{ position:"absolute", top:-2, right:-2, width:14, height:14, borderRadius:"50%", background:T.accent, color:T.black, fontSize:8, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.body }}>{c.unread}</div>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:F.display, fontSize:12, color:T.white, letterSpacing:"0.03em" }}>{(c.partnerName||"").toUpperCase()}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:200 }}>{c.lastMessage}</div>
              </div>
              <div style={{ fontSize:10, color:T.muted, fontFamily:F.body }}>{fmtTime(c.lastTime)}</div>
            </div>
          ))}
        </div>
      )}

      {/* trending */}
      <div style={{ marginTop:20, borderTop:`1px solid ${T.border}`, paddingTop:16, paddingBottom:32 }}>
        <div style={{ padding:"0 28px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <SectionLabel>Trending Ideas</SectionLabel>
          <span onClick={()=>setScreen("marketplace")} style={{ fontSize:10, color:T.accent, cursor:"pointer", fontFamily:F.body, letterSpacing:"0.08em" }}>VIEW ALL →</span>
        </div>
        <div style={{ padding:"0 28px", display:"flex", flexDirection:"column", gap:2 }}>
          {ideas.map((idea,i)=>(
            <div key={idea.id} style={{ background:T.card, border:`1px solid ${T.border}`, padding:"14px 16px", filter:!isPaid&&i>0?"blur(3px)":"none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                <div style={{ fontFamily:F.display, fontSize:13, color:T.white, letterSpacing:"0.03em", maxWidth:"72%", lineHeight:1.1 }}>{(idea.title||"").toUpperCase()}</div>
                <Tag label={idea.category} highlight />
              </div>
              <div style={{ fontSize:11, color:T.muted, fontFamily:F.body }}>🚀 {(idea.team?.length||idea.memberCount||0)} members · {idea.stage}</div>
            </div>
          ))}
          {!isPaid && (
            <div style={{ background:"rgba(232,255,71,0.04)", border:`1px dashed ${T.border}`, padding:"14px", textAlign:"center" }}>
              <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginBottom:8 }}>Unlock all trending ideas with Plus</div>
              <Btn style={{ padding:"9px", width:"auto", display:"inline-block", fontSize:12 }}>Upgrade to Plus</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   DISCOVER
══════════════════════════════════════ */
function DiscoverScreen({ setScreen, setActiveFounderId }) {
  const { api, user, isPaid } = useAuth();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [founders, setFounders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const f = await api.founders.list({ userId:user?.id, myProfile:user, role:filter, search });
      setFounders(f);
    } finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[filter]);
  useEffect(()=>{ const t=setTimeout(load,350); return()=>clearTimeout(t); },[search]);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:T.black, overflow:"hidden" }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 0", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
          <div>
            <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92 }}>BROWSE</div>
            <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>founders.</div>
          </div>
        </div>
        <div style={{ background:"#111", border:`1px solid ${T.border}`, borderRadius:2, display:"flex", alignItems:"center", gap:10, padding:"11px 14px", marginBottom:14 }}>
          <span style={{ color:T.muted }}>⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, skill, location…" style={{ background:"none", border:"none", color:T.white, fontSize:13, fontFamily:F.body, outline:"none", flex:1 }} />
          {search && <span onClick={()=>setSearch("")} style={{ color:T.muted, cursor:"pointer", fontSize:14 }}>✕</span>}
        </div>
        <div style={{ display:"flex", overflowX:"auto", marginBottom:-1 }}>
          {["All","Technical","Business","Designer","Marketing","Operator"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"9px 14px", border:"none", borderBottom:filter===f?`2px solid ${T.accent}`:"2px solid transparent", background:"none", color:filter===f?T.accent:T.muted, fontSize:10, fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", cursor:"pointer", fontFamily:F.body, whiteSpace:"nowrap", flexShrink:0 }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"14px 28px 24px", display:"flex", flexDirection:"column", gap:2 }}>
        {loading ? <Spinner /> : founders.length===0 ? (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:T.border, letterSpacing:"0.04em", marginBottom:8 }}>NO FOUNDERS FOUND</div>
            <div style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>Try a different filter or search term.</div>
          </div>
        ) : founders.map(f=>(
          <div key={f.id} onClick={()=>{ setActiveFounderId(f.id); setScreen("founderProfile"); }} style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px", cursor:"pointer" }}>
            <div style={{ display:"flex", gap:14, alignItems:"flex-start", marginBottom:12 }}>
              <Avatar initials={initials(f.name)} bg={avatarBg(f.id)} size={46} />
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:F.display, fontSize:17, color:T.white, letterSpacing:"0.03em", lineHeight:1 }}>{(f.name||"").toUpperCase()}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:3 }}>{f.role} · {f.location} · {f.experience_years}y</div>
              </div>
              {isPaid&&f.match!=null ? <div style={{ fontFamily:F.display, fontSize:20, color:T.accent }}>{f.match}%</div> : <Tag label="PLUS" highlight />}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
              {(f.skills||[]).slice(0,4).map(s=><Tag key={s} label={s} />)}
            </div>
            {isPaid ? <p style={{ margin:"0 0 12px", fontSize:12, color:T.muted, lineHeight:1.6, fontFamily:F.body }}>{f.bio}</p> : <div style={{ marginBottom:12 }}><LockRow label="Unlock full profile" /></div>}
            <div style={{ display:"flex", gap:6 }}>
              <Btn ghost style={{ flex:1, padding:"9px", fontSize:12 }}>Skip</Btn>
              <Btn style={{ flex:2, padding:"9px", fontSize:12 }}>Connect →</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   FOUNDER PROFILE
══════════════════════════════════════ */
function FounderProfileScreen({ setScreen, founderId }) {
  const { api, user, isPaid } = useAuth();
  const [f, setF] = useState(null);
  const [connStatus, setConnStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(()=>{
    if (!founderId) return;
    Promise.all([
      api.founders.get(founderId, user?.id),
      api.connections.getStatus(user?.id, founderId),
    ]).then(([founder, conn])=>{ setF({ ...founder, match: user ? calcMatch(user, founder) : null }); setConnStatus(conn); }).finally(()=>setLoading(false));
  },[founderId]);

  async function connect() {
    if (!user) return;
    setSending(true);
    try { await api.connections.send(user.id, founderId); setConnStatus({ status:"pending", sender_id:user.id }); setToast("Connection request sent!"); setTimeout(()=>setToast(""),3000); }
    catch(e) { setToast(e.message); setTimeout(()=>setToast(""),3000); }
    finally { setSending(false); }
  }

  if (loading) return <div style={{ flex:1, background:T.black }}><Spinner /></div>;
  if (!f) return null;

  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <Toast msg={toast} />
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}` }}>
        <button onClick={()=>setScreen("discover")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:16, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← BROWSE</button>
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <Avatar initials={initials(f.name)} bg={avatarBg(f.id)} size={64} />
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:26, color:T.white, lineHeight:0.92 }}>{(f.name||"").toUpperCase()}</div>
            <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:5 }}>{f.role} · {f.location} · {f.timezone}</div>
            <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:2 }}>{f.experience_years} yrs exp · {f.idea_status}</div>
          </div>
        </div>
        <div style={{ marginTop:14 }}>{isPaid&&f.match!=null ? <MatchBar score={f.match} /> : <LockRow label="Match score — upgrade to see" />}</div>
      </div>

      <div style={{ padding:"14px 28px 40px", display:"flex", flexDirection:"column", gap:2 }}>
        {[
          { label:"About", el: isPaid ? <p style={{ margin:0, fontSize:13, color:T.muted, lineHeight:1.7, fontFamily:F.body }}>{f.bio||"No bio yet."}</p> : <LockRow label="Unlock full bio" /> },
          { label:"Skills", el: isPaid ? <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{(f.skills||[]).map(s=><Tag key={s} label={s} />)}</div> : <LockRow label="Unlock skills" /> },
          { label:"Startup Interests", el: isPaid ? <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{(f.interests||[]).map(i=><Tag key={i} label={i} highlight />)}</div> : <LockRow label="Unlock interests" /> },
          { label:"Looking For", el: <div>{(f.looking_for||[]).map(l=><Tag key={l} label={l} />)}<div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:8 }}>{f.idea_status}</div></div> },
        ].map(s=>(
          <div key={s.label} style={{ background:T.card, border:`1px solid ${T.border}`, padding:"16px" }}>
            <SectionLabel>{s.label}</SectionLabel>{s.el}
          </div>
        ))}

        {isPaid && f.match!=null && (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"16px" }}>
            <SectionLabel>Compatibility Breakdown</SectionLabel>
            {[["Shared interests","40%"],["Complementary roles","30%"],["Shared skills","20%"],["Timezone proximity","10%"]].map(([l,w])=>(
              <div key={l} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:11, color:T.muted, fontFamily:F.body }}>{l}</span>
                  <span style={{ fontSize:10, color:T.muted, fontFamily:F.body }}>{w} weight</span>
                </div>
                <div style={{ height:2, background:T.border, borderRadius:1 }}><div style={{ width:`${f.match}%`, height:"100%", background:T.accent, borderRadius:1, opacity:0.6 }} /></div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", gap:8, marginTop:6 }}>
          <Btn ghost style={{ flex:1, padding:"12px" }} onClick={()=>setScreen("messages")}>💬 Message</Btn>
          {connStatus?.status==="connected" ? (
            <Btn style={{ flex:2, padding:"12px", background:T.border, color:T.muted }} disabled>Connected ✓</Btn>
          ) : connStatus?.status==="pending" ? (
            <Btn style={{ flex:2, padding:"12px", background:"none", border:`1px solid ${T.accent}`, color:T.accent }} disabled>Request Sent ✓</Btn>
          ) : (
            <Btn style={{ flex:2, padding:"12px" }} onClick={connect} disabled={sending}>{sending?"Sending…":"Send Connection →"}</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   CONNECTIONS
══════════════════════════════════════ */
function ConnectionsScreen({ setScreen, setActiveFounderId }) {
  const { api, user, isPaid } = useAuth();
  const [tab, setTab] = useState("connections");
  const [connected, setConnected] = useState([]);
  const [pending, setPending] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [c, p, s] = await Promise.all([
        api.connections.listConnected(user.id),
        api.connections.listPending(user.id),
        api.connections.getSuggested(user.id),
      ]);
      setConnected(c); setPending(p);
      setSuggested(s.map(f=>({...f, match:calcMatch(user,{...f,skills:f.skills||[],interests:f.interests||[]})})));
    } finally { setLoading(false); }
  }
  useEffect(()=>{ if(user) load(); },[user]);

  async function accept(cid) { await api.connections.accept(cid); load(); }
  async function decline(cid) { await api.connections.decline(cid); load(); }

  const list = tab==="connections"?connected : tab==="pending"?pending : suggested;
  const counts = [connected.length, pending.length, suggested.length];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:T.black, overflow:"hidden" }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 0", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92, marginBottom:4 }}>YOUR</div>
        <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent, marginBottom:16 }}>network.</div>
        <div style={{ display:"flex", gap:0 }}>
          {["connections","pending","suggested"].map((t,i)=>(
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:"10px 4px", border:"none", borderBottom:tab===t?`2px solid ${T.accent}`:"2px solid transparent", background:"none", color:tab===t?T.accent:T.muted, fontSize:9, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", cursor:"pointer", fontFamily:F.body, whiteSpace:"nowrap" }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
              {counts[i]>0 && <span style={{ marginLeft:4, background:tab===t?T.accent:T.border, color:tab===t?T.black:T.muted, borderRadius:2, padding:"1px 5px", fontSize:8 }}>{counts[i]}</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 28px 24px", display:"flex", flexDirection:"column", gap:2 }}>
        {loading ? <Spinner /> : list.length===0 ? (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:T.border, letterSpacing:"0.04em", marginBottom:8 }}>NOTHING HERE YET</div>
            <div style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>
              {tab==="connections"?"Browse founders and start connecting.":tab==="pending"?"No pending requests.":"You've connected with everyone!"}
            </div>
          </div>
        ) : list.map(item=>{
          const f = item.profile || item;
          return (
            <div key={item.connectionId||f.id} style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px" }}>
              <div style={{ display:"flex", gap:14, alignItems:"flex-start", marginBottom:12 }}>
                <Avatar initials={initials(f.name)} bg={avatarBg(f.id||"")} size={44} />
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:F.display, fontSize:16, color:T.white, letterSpacing:"0.03em", lineHeight:1 }}>{(f.name||"").toUpperCase()}</div>
                  <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:3 }}>{f.role} · {f.location}</div>
                  {isPaid && f.match && <div style={{ marginTop:8 }}><MatchBar score={f.match} /></div>}
                </div>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                {(f.skills||[]).slice(0,3).map(s=><Tag key={s} label={s} />)}
              </div>
              {tab==="pending" ? (
                <div style={{ display:"flex", gap:6 }}>
                  <Btn ghost style={{ flex:1, padding:"9px", fontSize:12 }} onClick={()=>decline(item.connectionId)}>Decline</Btn>
                  <Btn style={{ flex:2, padding:"9px", fontSize:12 }} onClick={()=>accept(item.connectionId)}>Accept →</Btn>
                </div>
              ) : tab==="connections" ? (
                <div style={{ display:"flex", gap:6 }}>
                  <Btn ghost style={{ flex:1, padding:"9px", fontSize:12 }} onClick={()=>{ setActiveFounderId(f.id); setScreen("founderProfile"); }}>View Profile</Btn>
                  <Btn style={{ flex:2, padding:"9px", fontSize:12 }} onClick={()=>setScreen("messages")}>Message →</Btn>
                </div>
              ) : (
                <div style={{ display:"flex", gap:6 }}>
                  <Btn ghost style={{ flex:1, padding:"9px", fontSize:12 }}>Skip</Btn>
                  <Btn style={{ flex:2, padding:"9px", fontSize:12 }}>Connect →</Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MESSAGES
══════════════════════════════════════ */
function MessagesScreen({ setScreen, setActiveFounderId }) {
  const { api, user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [chat, setChat] = useState(null); // { partnerId, partnerName, partnerBg }
  const [chatMsgs, setChatMsgs] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(()=>{
    if (!user) return;
    api.messages.listConversations(user.id).then(c=>setConvos(c)).finally(()=>setLoading(false));
    const unsub = api.messages.subscribe(user.id, (msg)=>{
      setChatMsgs(prev=>[...prev, msg]);
      setConvos(prev=>{
        const idx = prev.findIndex(c=>c.partnerId===msg.sender_id);
        if (idx>=0) { const n=[...prev]; n[idx]={...n[idx], lastMessage:msg.content, lastTime:msg.created_at, unread:(n[idx].unread||0)+1}; return n; }
        return prev;
      });
    });
    return unsub;
  },[user]);

  useEffect(()=>{
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  },[chatMsgs]);

  async function openChat(c) {
    setChat(c);
    const msgs = await api.messages.getChat(user.id, c.partnerId);
    setChatMsgs(msgs);
    api.messages.markRead(user.id, c.partnerId).then(()=>{
      setConvos(prev=>prev.map(x=>x.partnerId===c.partnerId?{...x,unread:0}:x));
    });
  }

  async function sendMsg() {
    if (!newMsg.trim() || !chat) return;
    const content = newMsg.trim(); setNewMsg("");
    const msg = await api.messages.send(user.id, chat.partnerId, content);
    setChatMsgs(prev=>[...prev, msg]);
  }

  if (chat) {
    const f = chat;
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", background:T.black, overflow:"hidden" }}>
        <div style={{ background:T.offBlack, padding:"52px 28px 14px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <button onClick={()=>setChat(null)} style={{ background:"none", border:"none", color:T.muted, fontSize:18, cursor:"pointer", padding:0, marginRight:2 }}>←</button>
            <Avatar initials={initials(f.partnerName)} bg={f.partnerBg||avatarBg(f.partnerId)} size={34} />
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:F.display, fontSize:14, color:T.white, letterSpacing:"0.03em" }}>{(f.partnerName||"").toUpperCase()}</div>
              <div style={{ fontSize:9, color:T.success, fontFamily:F.body, letterSpacing:"0.1em" }}>● ACTIVE</div>
            </div>
            <button onClick={()=>{ setActiveFounderId(f.partnerId); setChat(null); setScreen("founderProfile"); }} style={{ background:"none", border:`1px solid ${T.border}`, color:T.muted, fontSize:9, cursor:"pointer", padding:"6px 10px", fontFamily:F.body, letterSpacing:"0.06em", borderRadius:2 }}>PROFILE</button>
          </div>
        </div>
        <div ref={scrollRef} style={{ flex:1, overflowY:"auto", padding:"16px 18px" }}>
          {chatMsgs.map(msg=>(
            <div key={msg.id} style={{ display:"flex", justifyContent:msg.sender_id===user.id?"flex-end":"flex-start", marginBottom:10, gap:8, alignItems:"flex-end" }}>
              {msg.sender_id!==user.id && <Avatar initials={initials(f.partnerName)} bg={f.partnerBg||avatarBg(f.partnerId)} size={22} />}
              <div style={{ maxWidth:"76%", padding:"10px 13px", background:msg.sender_id===user.id?T.accent:T.card, color:msg.sender_id===user.id?T.black:T.white, borderRadius:2, fontSize:13, lineHeight:1.55, fontFamily:F.body, border:msg.sender_id===user.id?"none":`1px solid ${T.border}` }}>
                <div>{msg.content}</div>
                <div style={{ fontSize:9, marginTop:4, opacity:.45, textAlign:"right" }}>{fmtTime(msg.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:"10px 14px 24px", background:T.offBlack, borderTop:`1px solid ${T.border}`, flexShrink:0, display:"flex", gap:8 }}>
          <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="Type a message…" style={{ flex:1, padding:"11px 14px", background:"#111", border:`1px solid ${T.border}`, borderRadius:2, color:T.white, fontSize:13, fontFamily:F.body, outline:"none" }} />
          <button onClick={sendMsg} style={{ width:44, height:44, borderRadius:2, border:"none", background:newMsg.trim()?T.accent:T.border, color:T.black, fontSize:16, cursor:"pointer", flexShrink:0, transition:"background 0.15s" }}>↑</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 20px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92, marginBottom:4 }}>YOUR</div>
        <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent, marginBottom:16 }}>messages.</div>
        <div style={{ background:"#111", border:`1px solid ${T.border}`, borderRadius:2, display:"flex", alignItems:"center", gap:10, padding:"11px 14px" }}>
          <span style={{ color:T.muted }}>⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations…" style={{ background:"none", border:"none", color:T.white, fontSize:13, fontFamily:F.body, outline:"none", flex:1 }} />
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {loading ? <Spinner /> : convos.filter(c=>!search||c.partnerName.toLowerCase().includes(search.toLowerCase())).map(c=>(
          <div key={c.partnerId} onClick={()=>openChat(c)} style={{ display:"flex", alignItems:"center", gap:14, padding:"17px 28px", borderBottom:`1px solid ${T.border}`, cursor:"pointer" }}>
            <div style={{ position:"relative" }}>
              <Avatar initials={initials(c.partnerName)} bg={c.partnerBg||avatarBg(c.partnerId)} size={44} />
              {c.unread>0 && <div style={{ position:"absolute", top:-3, right:-3, width:16, height:16, borderRadius:"50%", background:T.accent, color:T.black, fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F.body }}>{c.unread}</div>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontFamily:F.display, fontSize:13, color:T.white, letterSpacing:"0.03em" }}>{(c.partnerName||"").toUpperCase()}</span>
                <span style={{ fontSize:10, color:T.muted, fontFamily:F.body }}>{fmtTime(c.lastTime)}</span>
              </div>
              <div style={{ fontSize:12, color:T.muted, marginTop:3, fontFamily:F.body, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:220 }}>{c.lastMessage}</div>
            </div>
          </div>
        ))}
        {!loading && convos.length===0 && (
          <div style={{ textAlign:"center", padding:"60px 28px" }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:T.border, marginBottom:10 }}>NO MESSAGES YET</div>
            <div style={{ fontSize:12, color:T.muted, fontFamily:F.body, marginBottom:20 }}>Connect with founders to start conversations.</div>
            <Btn onClick={()=>setScreen("discover")} style={{ width:"auto", padding:"11px 24px", display:"inline-block", fontSize:12 }}>Browse Founders →</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MARKETPLACE
══════════════════════════════════════ */
function MarketplaceScreen({ setScreen, setActiveIdeaId }) {
  const { api, user, isPaid } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | trending

  useEffect(()=>{
    api.ideas.list({ trending:tab==="trending" }).then(setIdeas).finally(()=>setLoading(false));
  },[tab]);

  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 0", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92 }}>IDEA</div>
            <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>marketplace.</div>
          </div>
          {isPaid && <Btn style={{ width:"auto", padding:"10px 14px", fontSize:11, marginTop:8 }}>+ Post Idea</Btn>}
        </div>
        {!isPaid && (
          <div style={{ background:"rgba(232,255,71,0.04)", border:`1px solid ${T.accent}`, padding:"16px 18px", marginBottom:16 }}>
            <div style={{ fontFamily:F.display, fontSize:15, color:T.accent, letterSpacing:"0.04em", marginBottom:6 }}>PLUS FEATURE</div>
            <div style={{ fontSize:12, color:T.muted, fontFamily:F.body, lineHeight:1.6, marginBottom:10 }}>Post ideas, join teams, and access the full marketplace.</div>
            <Btn style={{ padding:"10px", fontSize:12 }}>Upgrade to Plus →</Btn>
          </div>
        )}
        <div style={{ display:"flex", gap:0, marginBottom:-1 }}>
          {[["all","All Ideas"],["trending","🔥 Trending"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{ padding:"9px 16px", border:"none", borderBottom:tab===id?`2px solid ${T.accent}`:"2px solid transparent", background:"none", color:tab===id?T.accent:T.muted, fontSize:10, fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", cursor:"pointer", fontFamily:F.body }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:"14px 28px 40px", display:"flex", flexDirection:"column", gap:2 }}>
        {loading ? <Spinner /> : ideas.map((idea,i)=>(
          <div key={idea.id} onClick={()=>{ setActiveIdeaId(idea.id); setScreen("founderTeam"); }} style={{ background:T.card, border:`1px solid ${tab==="trending"&&i===0?T.accent:T.border}`, padding:"18px", cursor:"pointer", filter:!isPaid&&i>0?"blur(3px)":"none", pointerEvents:!isPaid&&i>0?"none":"auto" }}>
            {tab==="trending" && <div style={{ fontFamily:F.display, fontSize:32, color:i===0?T.accent:i===1?"#999":"#5a4a2e", lineHeight:1, marginBottom:8 }}>0{i+1}</div>}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ fontFamily:F.display, fontSize:16, color:T.white, letterSpacing:"0.03em", maxWidth:"72%", lineHeight:1.1 }}>{(idea.title||"").toUpperCase()}</div>
              <Tag label={idea.category} highlight />
            </div>
            <p style={{ margin:"0 0 12px", fontSize:12, color:T.muted, lineHeight:1.5, fontFamily:F.body }}>{idea.description}</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              <Tag label={idea.stage} /><Tag label={`${idea.memberCount||0} members`} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:11, color:T.muted, fontFamily:F.body }}>Seeking <strong style={{ color:T.white }}>{idea.looking_for}</strong></span>
              <span style={{ fontSize:11, color:T.muted, fontFamily:F.body }}>👁 {idea.view_count||0}</span>
            </div>
            <div style={{ display:"flex", gap:-4, marginBottom:12 }}>
              {(idea.team||[]).slice(0,3).map((m,j)=><div key={j} style={{ marginRight:4 }}><Avatar initials={initials(m?.name||"")} bg={avatarBg(m?.id||"")} size={22} /></div>)}
            </div>
            <Btn style={{ padding:"9px", fontSize:11 }}>Join Team →</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   FOUNDER TEAM
══════════════════════════════════════ */
function FounderTeamScreen({ setScreen, ideaId }) {
  const { api, user } = useAuth();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(()=>{
    if (!ideaId) return;
    api.ideas.get(ideaId).then(setIdea).finally(()=>setLoading(false));
  },[ideaId]);

  async function join() {
    if (!user) return;
    setJoining(true);
    try { await api.ideas.join(ideaId, user.id); setJoined(true); setToast("Requested to join!"); setTimeout(()=>setToast(""),3000); }
    catch(e) { setToast(e.message); setTimeout(()=>setToast(""),3000); }
    finally { setJoining(false); }
  }

  if (loading) return <div style={{ flex:1, background:T.black }}><Spinner /></div>;
  if (!idea) return null;

  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <Toast msg={toast} />
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}` }}>
        <button onClick={()=>setScreen("marketplace")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← IDEAS</button>
        <div style={{ fontFamily:F.display, fontSize:28, color:T.white, lineHeight:0.92 }}>{(idea.title||"").split(" ").slice(0,2).join(" ").toUpperCase()}</div>
        <div style={{ fontFamily:F.serif, fontSize:30, fontStyle:"italic", color:T.accent, marginBottom:10 }}>{(idea.title||"").split(" ").slice(2).join(" ")||"idea."}</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          <Tag label={idea.category} highlight />
          <Tag label={idea.stage} />
          <Tag label={`👁 ${idea.view_count||0} views`} />
        </div>
      </div>
      <div style={{ padding:"14px 28px 40px", display:"flex", flexDirection:"column", gap:2 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px" }}>
          <SectionLabel>About This Idea</SectionLabel>
          <p style={{ margin:0, fontSize:13, color:T.muted, lineHeight:1.7, fontFamily:F.body }}>{idea.description}</p>
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px" }}>
          <SectionLabel>Current Team</SectionLabel>
          {(idea.team||[]).map((m,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
              <Avatar initials={initials(m?.name||"")} bg={avatarBg(m?.id||"")} size={36} />
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:F.display, fontSize:14, color:T.white, letterSpacing:"0.03em" }}>{(m?.name||"").toUpperCase()}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:F.body }}>{m?.role} · {m?.memberRole||"Member"}</div>
              </div>
            </div>
          ))}
          {(!idea.team||idea.team.length===0) && <div style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>No members yet.</div>}
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px" }}>
          <SectionLabel>Open Roles</SectionLabel>
          {[idea.looking_for, "Designer"].filter(Boolean).map(role=>(
            <div key={role} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize:13, color:T.white, fontFamily:F.body, fontWeight:500 }}>{role}</div>
                <div style={{ fontSize:10, color:T.muted, fontFamily:F.body, marginTop:2 }}>Equity-based · Remote</div>
              </div>
              <button style={{ padding:"6px 12px", background:"none", border:`1px solid ${T.accent}`, color:T.accent, fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:F.body, letterSpacing:"0.07em", borderRadius:2 }}>APPLY →</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:8 }}>
          <Btn onClick={join} disabled={joining||joined}>{joining?"Requesting…":joined?"Request Sent ✓":"Request to Join Team →"}</Btn>
          <Btn ghost onClick={()=>setScreen("messages")}>Message Founder</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   EDIT PROFILE SCREEN
══════════════════════════════════════ */
function EditProfileScreen({ setScreen }) {
  const { api, user, setUser } = useAuth();
  const [name, setName]         = useState(user?.name||"");
  const [bio, setBio]           = useState(user?.bio||"");
  const [location, setLocation] = useState(user?.location||"");
  const [timezone, setTimezone] = useState(user?.timezone||"PST");
  const [ideaStatus, setIdeaStatus] = useState(user?.idea_status||"");
  const [lookingFor, setLookingFor] = useState(user?.looking_for||[]);
  const [skills, setSkills]     = useState(user?.skills||[]);
  const [interests, setInterests] = useState(user?.interests||[]);
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url||"");
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState("");
  const toggleArr = (arr, setArr, val) => setArr(prev => prev.includes(val) ? prev.filter(v=>v!==val) : [...prev, val]);

  async function save() {
    setSaving(true);
    try {
      await api.profiles.update(user.id, { name, bio, location, timezone, idea_status:ideaStatus, looking_for:lookingFor, linkedin_url:linkedinUrl });
      if (IS_LIVE && _sb) {
        // update skills
        const { data:sk } = await _sb.from("skills").select("id,name").in("name", skills);
        await _sb.from("profile_skills").delete().eq("profile_id", user.id);
        if (sk?.length) await _sb.from("profile_skills").insert(sk.map(s=>({ profile_id:user.id, skill_id:s.id })));
        // update interests
        const { data:inr } = await _sb.from("interests").select("id,name").in("name", interests);
        await _sb.from("profile_interests").delete().eq("profile_id", user.id);
        if (inr?.length) await _sb.from("profile_interests").insert(inr.map(i=>({ profile_id:user.id, interest_id:i.id })));
      }
      const updated = await api.profiles.get(user.id);
      setUser({ ...updated, skills, interests });
      setToast("Profile saved!"); setTimeout(()=>setToast(""),2500);
    } catch(e) { setToast("Error: " + e.message); setTimeout(()=>setToast(""),3000); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:T.black, overflow:"hidden" }}>
      <Toast msg={toast} />
      <div style={{ background:T.offBlack, padding:"52px 28px 20px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <button onClick={()=>setScreen("profile")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← PROFILE</button>
        <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92 }}>EDIT</div>
        <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>profile.</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"18px 28px 32px", display:"flex", flexDirection:"column", gap:18 }}>
        <Inp label="Full Name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
        <div>
          <label style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, display:"block", marginBottom:8, fontFamily:F.body }}>Bio (max 300 chars)</label>
          <textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,300))} placeholder="What are you building and what do you need in a cofounder?" style={{ width:"100%", minHeight:90, padding:"13px 16px", background:"#111", border:`1px solid ${T.border}`, color:T.white, fontSize:13, fontFamily:F.body, borderRadius:2, boxSizing:"border-box", outline:"none", resize:"none", lineHeight:1.6 }} />
          <div style={{ fontSize:10, color:T.muted, textAlign:"right", marginTop:4, fontFamily:F.body }}>{bio.length}/300</div>
        </div>
        <Inp label="Location" value={location} onChange={e=>setLocation(e.target.value)} placeholder="San Francisco, US" />
        <div>
          <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:F.body, marginBottom:10 }}>Timezone</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {["PST","MST","CST","EST","GMT","CET","IST","SGT","JST","AEST"].map(tz=>(
              <div key={tz} onClick={()=>setTimezone(tz)} style={{ padding:"8px 14px", border:`1px solid ${timezone===tz?T.accent:T.border}`, background:timezone===tz?"rgba(232,255,71,0.07)":"none", cursor:"pointer", borderRadius:2 }}>
                <span style={{ fontSize:11, fontFamily:F.body, color:timezone===tz?T.accent:T.muted }}>{tz}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:F.body, marginBottom:10 }}>Idea Status</div>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {IDEA_STATUSES.map(s=>(
              <div key={s} onClick={()=>setIdeaStatus(s)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px", background:ideaStatus===s?"rgba(232,255,71,0.06)":T.card, border:`1px solid ${ideaStatus===s?T.accent:T.border}`, cursor:"pointer" }}>
                <span style={{ fontSize:13, fontFamily:F.body, color:ideaStatus===s?T.accent:T.white }}>{s}</span>
                {ideaStatus===s && <span style={{ color:T.accent }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:F.body, marginBottom:10 }}>Looking For</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {LOOKING_FOR.map(l=><Tag key={l} label={l} active={lookingFor.includes(l)} onClick={()=>toggleArr(lookingFor,setLookingFor,l)} />)}
          </div>
        </div>
        <div>
          <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:F.body, marginBottom:10 }}>Skills</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {ALL_SKILLS.map(s=><Tag key={s} label={s} active={skills.includes(s)} onClick={()=>toggleArr(skills,setSkills,s)} />)}
          </div>
        </div>
        <div>
          <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:F.body, marginBottom:10 }}>Startup Interests</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {ALL_INTERESTS.map(i=><Tag key={i} label={i} active={interests.includes(i)} highlight={interests.includes(i)} onClick={()=>toggleArr(interests,setInterests,i)} />)}
          </div>
        </div>
        <Inp label="LinkedIn URL" value={linkedinUrl} onChange={e=>setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
        <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Changes →"}</Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PROFILE
══════════════════════════════════════ */
function ProfileScreen({ setScreen }) {
  const { api, user, setUser, isPaid, setIsPaid } = useAuth();
  const [viewers, setViewers] = useState([]);

  useEffect(()=>{
    if (user && isPaid) api.profiles.getViewers(user.id).then(setViewers).catch(()=>{});
  },[user, isPaid]);

  const strength = user?.profile_strength || 0;

  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <Avatar initials={initials(user?.name)} bg={avatarBg(user?.id||"")} size={62} />
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:26, color:T.white, lineHeight:0.92 }}>{(user?.name||"YOUR NAME").toUpperCase()}</div>
            <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:5 }}>{user?.role} · {user?.location} · {user?.timezone}</div>
            <div style={{ marginTop:10 }}>
              {isPaid ? <Tag label="⭐ PLUS MEMBER" highlight />
                      : <button onClick={()=>setScreen("subscription")} style={{ background:T.accent, color:T.black, border:"none", padding:"6px 12px", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:F.body, letterSpacing:"0.07em", borderRadius:2 }}>UPGRADE TO PLUS →</button>}
            </div>
          </div>
        </div>
        <div style={{ marginTop:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:10, color:T.muted, fontFamily:F.body, letterSpacing:"0.08em", textTransform:"uppercase" }}>Profile Strength</span>
            <span style={{ fontSize:10, color:T.accent, fontFamily:F.body, fontWeight:600 }}>{strength}%</span>
          </div>
          <div style={{ height:2, background:T.border, borderRadius:1 }}><div style={{ width:`${strength}%`, height:"100%", background:T.accent, borderRadius:1, transition:"width 0.5s" }} /></div>
        </div>
      </div>
      <div style={{ padding:"14px 28px 48px", display:"flex", flexDirection:"column", gap:2 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px" }}>
          <SectionLabel>About</SectionLabel>
          <p style={{ margin:0, fontSize:13, color:T.muted, lineHeight:1.7, fontFamily:F.body }}>{user?.bio||"No bio yet. Tap Edit Profile to add one."}</p>
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px" }}>
          <SectionLabel>My Skills</SectionLabel>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {(user?.skills||[]).length > 0 ? (user.skills.map(s=><Tag key={s} label={s} />)) : <span style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>No skills added yet.</span>}
          </div>
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px" }}>
          <SectionLabel>Startup Interests</SectionLabel>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {(user?.interests||[]).length > 0 ? (user.interests.map(i=><Tag key={i} label={i} highlight />)) : <span style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>No interests added yet.</span>}
          </div>
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px" }}>
          <SectionLabel>Looking For</SectionLabel>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {(user?.looking_for||[]).length > 0 ? (user.looking_for.map(l=><Tag key={l} label={l} />)) : <span style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>Not set.</span>}
          </div>
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px" }}>
          <SectionLabel>Who Viewed Your Profile</SectionLabel>
          {isPaid
            ? viewers.length>0
              ? <div style={{ display:"flex", gap:8, alignItems:"center" }}>{viewers.slice(0,5).map((v,i)=><Avatar key={i} initials={initials(v.name)} bg={avatarBg(v.id||"")} size={30} />)}<span style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>+{Math.max(0,viewers.length-5)} others</span></div>
              : <div style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>No views yet — share your profile!</div>
            : <LockRow label="Upgrade to see who viewed you" />
          }
        </div>
        {[
          { label:"Edit Profile",   icon:"✎", action:()=>setScreen("editProfile") },
          { label:"Settings",       icon:"⚙", action:()=>setScreen("settings")    },
          { label:"Subscription",   icon:"⭐", action:()=>setScreen("subscription")},
          { label:"Share Profile",  icon:"⬆", action:()=>{ if(navigator.share) navigator.share({ title:"FounderMatch", url:window.location.href }); } },
          { label:"Sign Out",       icon:"←", action:async()=>{ await api.auth.signOut(); window.location.reload(); }, danger:true },
        ].map(item=>(
          <div key={item.label} onClick={item.action} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", background:T.card, border:`1px solid ${T.border}`, cursor:"pointer" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ fontSize:15 }}>{item.icon}</span>
              <span style={{ fontSize:13, fontFamily:F.body, color:item.danger?T.danger:T.white }}>{item.label}</span>
            </div>
            {!item.danger && <span style={{ color:T.muted, fontSize:14 }}>›</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SUBSCRIPTION SCREEN
══════════════════════════════════════ */
function SubscriptionScreen({ setScreen }) {
  const { user, isPaid, setIsPaid } = useAuth();
  const [loading, setLoading] = useState(null); // "monthly"|"annual"
  const [err, setErr]         = useState("");

  async function checkout(plan) {
    if (!user) return;
    setLoading(plan); setErr("");
    try {
      const priceId = plan === "monthly"
        ? import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID
        : import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID;
      const res  = await fetch("/api/create-checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ priceId, userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else throw new Error(data.error || "Failed to create checkout");
    } catch(e) { setErr(e.message); setLoading(null); }
  }

  async function cancelSub() {
    // For now just toggle — full cancel via Stripe portal coming soon
    setIsPaid(false);
    if (_sb) await _sb.from("profiles").update({ subscription_status:"free" }).eq("id", user.id);
  }

  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}` }}>
        <button onClick={()=>setScreen("profile")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← PROFILE</button>
        <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92 }}>YOUR</div>
        <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>plan.</div>
      </div>
      <div style={{ padding:"20px 28px 48px", display:"flex", flexDirection:"column", gap:12 }}>
        {err && <div style={{ padding:"12px 16px", background:"rgba(255,95,95,0.08)", border:`1px solid ${T.danger}`, fontSize:12, color:T.danger, fontFamily:F.body, borderRadius:2 }}>{err}</div>}

        {/* Free plan */}
        <div style={{ background:T.card, border:`1px solid ${!isPaid?T.accent:T.border}`, padding:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:!isPaid?T.accent:T.muted, letterSpacing:"0.04em" }}>FREE</div>
            {!isPaid && <Tag label="CURRENT" highlight />}
          </div>
          <div style={{ fontSize:24, fontFamily:F.display, color:T.white, marginBottom:12 }}>$0<span style={{ fontSize:12, color:T.muted, fontFamily:F.body }}>/mo</span></div>
          {["Browse founder profiles","Send 3 connection requests/day","Basic messaging","Limited idea access"].map(f=>(
            <div key={f} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.muted, fontFamily:F.body }}><span style={{ color:T.border }}>→</span>{f}</div>
          ))}
        </div>

        {/* Plus plan */}
        <div style={{ background:T.card, border:`1px solid ${isPaid?T.accent:T.border}`, padding:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:isPaid?T.accent:T.white, letterSpacing:"0.04em" }}>PLUS</div>
            {isPaid && <Tag label="ACTIVE" highlight />}
          </div>
          {["Full profile bios & match scores","Unlimited connections","Unlimited messaging","Full idea marketplace","See who viewed your profile","Priority in search results"].map(f=>(
            <div key={f} style={{ display:"flex", gap:8, padding:"6px 0", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.white, fontFamily:F.body }}><span style={{ color:T.accent }}>→</span>{f}</div>
          ))}
          {isPaid ? (
            <div style={{ marginTop:16 }}>
              <button onClick={cancelSub} style={{ width:"100%", padding:"12px", background:"none", border:`1px solid ${T.danger}`, color:T.danger, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:F.body, borderRadius:2, letterSpacing:"0.06em" }}>CANCEL SUBSCRIPTION</button>
            </div>
          ) : (
            <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={()=>checkout("monthly")} disabled={!!loading} style={{ width:"100%", padding:"14px", background:T.accent, border:"none", color:T.black, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:F.body, borderRadius:2, letterSpacing:"0.04em" }}>
                {loading==="monthly" ? "Redirecting…" : "Monthly · $20/mo →"}
              </button>
              <button onClick={()=>checkout("annual")} disabled={!!loading} style={{ width:"100%", padding:"14px", background:"none", border:`1px solid ${T.accent}`, color:T.accent, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:F.body, borderRadius:2, letterSpacing:"0.04em" }}>
                {loading==="annual" ? "Redirecting…" : "Annual · $200/yr — Save $40 →"}
              </button>
            </div>
          )}
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"16px" }}>
          <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, lineHeight:1.7, textAlign:"center" }}>Secured by Stripe. Cancel anytime. No refunds for partial months.</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SETTINGS
══════════════════════════════════════ */
function SettingsScreen({ setScreen }) {
  const { api, user, setUser, isPaid, setIsPaid } = useAuth();
  const [notifs, setNotifs]   = useState({ messages:true, matches:true, ideas:false, news:false });
  const [privacy, setPrivacy] = useState({ publicProfile:true, showLocation:true, showOnline:true });
  const [toast, setToast]     = useState("");
  // inline edit state
  const [editing, setEditing] = useState(null); // "name"|"password"|"timezone"|"location"
  const [editVal, setEditVal] = useState("");
  const [editVal2, setEditVal2] = useState(""); // confirm password
  const [saving, setSaving]   = useState(false);

  function startEdit(field, current="") { setEditing(field); setEditVal(current); setEditVal2(""); }

  async function commitEdit() {
    if (!user || !editing) return;
    setSaving(true);
    try {
      if (editing === "password") {
        if (editVal.length < 8) { setToast("Password must be at least 8 characters"); setTimeout(()=>setToast(""),3000); setSaving(false); return; }
        if (editVal !== editVal2) { setToast("Passwords don't match"); setTimeout(()=>setToast(""),3000); setSaving(false); return; }
        if (IS_LIVE && _sb) {
          const { error } = await _sb.auth.updateUser({ password: editVal });
          if (error) throw new Error(error.message);
        }
        setToast("Password updated!");
      } else {
        const fieldMap = { name:"name", timezone:"timezone", location:"location" };
        await api.profiles.update(user.id, { [fieldMap[editing]]: editVal });
        const updated = await api.profiles.get(user.id);
        setUser({ ...updated, skills: user.skills||[], interests: user.interests||[] });
        setToast("Saved!");
      }
      setEditing(null);
      setTimeout(()=>setToast(""),2500);
    } catch(e) { setToast("Error: " + e.message); setTimeout(()=>setToast(""),3000); }
    finally { setSaving(false); }
  }

  // Inline edit modal
  const EditModal = () => {
    if (!editing) return null;
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:100, display:"flex", alignItems:"flex-end" }}>
        <div style={{ width:"100%", maxWidth:430, margin:"0 auto", background:T.offBlack, border:`1px solid ${T.border}`, borderRadius:"4px 4px 0 0", padding:"24px 24px 40px" }}>
          <div style={{ fontFamily:F.display, fontSize:18, color:T.white, letterSpacing:"0.04em", marginBottom:20 }}>
            {editing==="name"?"CHANGE NAME":editing==="password"?"CHANGE PASSWORD":editing==="timezone"?"CHANGE TIMEZONE":"CHANGE LOCATION"}
          </div>
          {editing==="timezone" ? (
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
              {["PST","MST","CST","EST","GMT","CET","IST","SGT","JST","AEST"].map(tz=>(
                <div key={tz} onClick={()=>setEditVal(tz)} style={{ padding:"10px 16px", border:`1px solid ${editVal===tz?T.accent:T.border}`, background:editVal===tz?"rgba(232,255,71,0.07)":"none", cursor:"pointer", borderRadius:2 }}>
                  <span style={{ fontSize:12, fontFamily:F.body, color:editVal===tz?T.accent:T.muted }}>{tz}</span>
                </div>
              ))}
            </div>
          ) : editing==="password" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
              <Inp label="New Password" type="password" placeholder="Min 8 characters" value={editVal} onChange={e=>setEditVal(e.target.value)} />
              <Inp label="Confirm Password" type="password" placeholder="Repeat new password" value={editVal2} onChange={e=>setEditVal2(e.target.value)} />
            </div>
          ) : (
            <div style={{ marginBottom:20 }}>
              <Inp label={editing==="name"?"Full Name":"Location (City, Country)"} placeholder={editing==="name"?"Your full name":"San Francisco, US"} value={editVal} onChange={e=>setEditVal(e.target.value)} />
            </div>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <Btn ghost style={{ flex:1, padding:"12px" }} onClick={()=>setEditing(null)}>Cancel</Btn>
            <Btn style={{ flex:2, padding:"12px" }} onClick={commitEdit} disabled={saving}>{saving?"Saving…":"Save →"}</Btn>
          </div>
        </div>
      </div>
    );
  };

  const Row = ({ label, sub, right, onClick, danger }) => (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 18px", background:T.card, border:`1px solid ${T.border}`, cursor:onClick?"pointer":"default" }}>
      <div>
        <div style={{ fontSize:13, fontFamily:F.body, color:danger?T.danger:T.white, fontWeight:500 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:2 }}>{sub}</div>}
      </div>
      {right || (onClick && !danger && <span style={{ color:T.muted, fontSize:14 }}>›</span>)}
    </div>
  );

  const Section = ({ title, children }) => (
    <div>
      <div style={{ fontSize:10, color:T.muted, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:F.body, marginBottom:6, paddingLeft:2 }}>{title}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:1 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <Toast msg={toast} />
      <EditModal />
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}` }}>
        <button onClick={()=>setScreen("profile")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← PROFILE</button>
        <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92 }}>APP</div>
        <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>settings.</div>
      </div>

      <div style={{ padding:"16px 28px 48px", display:"flex", flexDirection:"column", gap:16 }}>
        <Section title="Account">
          <Row label="Full Name"       sub={user?.name||"—"}          onClick={()=>startEdit("name", user?.name||"")} />
          <Row label="Email"           sub={user?.email||"—"}         />
          <Row label="Change Password" sub="Update your password"     onClick={()=>startEdit("password")} />
          <Row label="Timezone"        sub={user?.timezone||"Not set"} onClick={()=>startEdit("timezone", user?.timezone||"PST")} />
          <Row label="Location"        sub={user?.location||"Not set"} onClick={()=>startEdit("location", user?.location||"")} />
        </Section>

        <Section title="Subscription">
          <div style={{ background:T.card, border:`1px solid ${isPaid?T.accent:T.border}`, padding:"18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div>
                <div style={{ fontFamily:F.display, fontSize:17, color:isPaid?T.accent:T.white, letterSpacing:"0.04em" }}>{isPaid?"PLUS PLAN":"FREE PLAN"}</div>
                <div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:2 }}>{isPaid?"All features · Billed monthly":"Limited features"}</div>
              </div>
              {isPaid && <Tag label="ACTIVE" highlight />}
            </div>
            {isPaid
              ? <div style={{ display:"flex", gap:8 }}>
                  <Btn ghost style={{ flex:1, padding:"9px", fontSize:11 }} onClick={()=>setScreen("subscription")}>Manage Plan</Btn>
                  <button onClick={()=>setIsPaid(false)} style={{ flex:1, padding:"9px", background:"none", border:`1px solid ${T.danger}`, color:T.danger, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:F.body, borderRadius:2 }}>CANCEL</button>
                </div>
              : <Btn onClick={()=>setScreen("subscription")} style={{ padding:"11px", fontSize:12 }}>Upgrade to Plus · $12/mo →</Btn>
            }
          </div>
        </Section>

        <Section title="Notifications">
          {[{k:"messages",l:"New Messages",s:"When someone messages you"},{k:"matches",l:"New Matches",s:"When a new founder matches"},{k:"ideas",l:"Idea Updates",s:"Activity in your joined ideas"},{k:"news",l:"Product News",s:"Updates and features"}].map(n=>(
            <div key={n.k} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 18px", background:T.card, border:`1px solid ${T.border}` }}>
              <div><div style={{ fontSize:13, fontFamily:F.body, color:T.white, fontWeight:500 }}>{n.l}</div><div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:2 }}>{n.s}</div></div>
              <Toggle on={notifs[n.k]} onClick={()=>setNotifs(p=>({...p,[n.k]:!p[n.k]}))} />
            </div>
          ))}
        </Section>

        <Section title="Privacy">
          {[{k:"publicProfile",l:"Public Profile",s:"Visible in discovery"},{k:"showLocation",l:"Show Location",s:"Display city on profile"},{k:"showOnline",l:"Show Online Status",s:"Let others see when active"}].map(n=>(
            <div key={n.k} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"15px 18px", background:T.card, border:`1px solid ${T.border}` }}>
              <div><div style={{ fontSize:13, fontFamily:F.body, color:T.white, fontWeight:500 }}>{n.l}</div><div style={{ fontSize:11, color:T.muted, fontFamily:F.body, marginTop:2 }}>{n.s}</div></div>
              <Toggle on={privacy[n.k]} onClick={()=>setPrivacy(p=>({...p,[n.k]:!p[n.k]}))} />
            </div>
          ))}
          <Row label="Blocked Users" sub="0 blocked" onClick={()=>setScreen("blockedUsers")} />
          <Row label="Download My Data" sub="Export your FounderMatch data" onClick={()=>{
            if (!user) return;
            const data = JSON.stringify({ profile: user, exportedAt: new Date().toISOString() }, null, 2);
            const blob = new Blob([data], { type:"application/json" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url; a.download = "foundermatch-data.json"; a.click();
            URL.revokeObjectURL(url);
          }} />
        </Section>

        <Section title="Support">
          <Row label="Help Center"      onClick={()=>setScreen("helpCenter")}   />
          <Row label="Send Feedback"    onClick={()=>setScreen("sendFeedback")} />
          <Row label="Terms of Service" onClick={()=>setScreen("terms")}        />
          <Row label="Privacy Policy"   onClick={()=>setScreen("privacy")}      />
          <div style={{ padding:"14px 18px", background:T.card, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:10, color:"#444", fontFamily:F.body, textAlign:"center" }}>FounderMatch v1.0.0 · Built with ♥</div>
          </div>
        </Section>

        <Section title="Account Actions">
          <Row label="Sign Out" onClick={async()=>{ await api.auth.signOut(); window.location.reload(); }} danger />
          <Row label="Deactivate Account" sub="Temporarily hide your profile" onClick={()=>{}} danger />
          <Row label="Delete Account" sub="Permanently delete all data" onClick={()=>{}} danger />
        </Section>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   BLOCKED USERS
══════════════════════════════════════ */
function BlockedUsersScreen({ setScreen }) {
  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}` }}>
        <button onClick={()=>setScreen("settings")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← SETTINGS</button>
        <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92 }}>BLOCKED</div>
        <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>users.</div>
      </div>
      <div style={{ padding:"28px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:200 }}>
        <div style={{ fontFamily:F.display, fontSize:18, color:T.border, letterSpacing:"0.04em", marginBottom:8 }}>NO BLOCKED USERS</div>
        <div style={{ fontSize:12, color:T.muted, fontFamily:F.body, textAlign:"center", lineHeight:1.6 }}>Users you block won't be able to see your profile or send you messages.</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   HELP CENTER
══════════════════════════════════════ */
function HelpCenterScreen({ setScreen }) {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q:"How does matching work?", a:"FounderMatch uses a 4-factor algorithm: 40% shared startup interests, 30% complementary roles, 20% shared skills, and 10% timezone proximity. The higher the score, the better the fit." },
    { q:"What's the difference between Free and Plus?", a:"Free lets you browse profiles, send 3 connection requests per day, and message connections. Plus unlocks full profile bios, match scores, unlimited connections, the full idea marketplace, and who viewed your profile." },
    { q:"How do I connect with a founder?", a:"Browse founders in the Discover tab, tap on a profile, and hit 'Send Connection'. If they accept, you can start messaging." },
    { q:"Can I edit my profile after signing up?", a:"Yes — go to Profile → Edit Profile to update your bio, skills, interests, location, timezone, and what you're looking for." },
    { q:"How do I post an idea to the marketplace?", a:"Upgrade to Plus, then tap '+ Post Idea' in the Marketplace tab. You can set a title, description, category, stage, and what kind of cofounder you're looking for." },
    { q:"How do I cancel my Plus subscription?", a:"Go to Profile → Subscription → Cancel Subscription. You'll keep Plus access until the end of your billing period." },
    { q:"How do I delete my account?", a:"Go to Settings → Delete Account. This permanently removes all your data and cannot be undone." },
    { q:"I found a bug — how do I report it?", a:"Go to Settings → Send Feedback and describe what happened. We read every report and fix bugs fast." },
  ];
  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}` }}>
        <button onClick={()=>setScreen("settings")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← SETTINGS</button>
        <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92 }}>HELP</div>
        <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>center.</div>
      </div>
      <div style={{ padding:"14px 28px 48px", display:"flex", flexDirection:"column", gap:2 }}>
        {faqs.map((f,i)=>(
          <div key={i} onClick={()=>setOpen(open===i?null:i)} style={{ background:T.card, border:`1px solid ${open===i?T.accent:T.border}`, padding:"16px 18px", cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:13, fontFamily:F.body, color:open===i?T.accent:T.white, fontWeight:500, flex:1, paddingRight:12 }}>{f.q}</div>
              <span style={{ color:T.muted, fontSize:14, flexShrink:0 }}>{open===i?"−":"+"}</span>
            </div>
            {open===i && <div style={{ fontSize:12, color:T.muted, fontFamily:F.body, lineHeight:1.7, marginTop:12, paddingTop:12, borderTop:`1px solid ${T.border}` }}>{f.a}</div>}
          </div>
        ))}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, padding:"18px", marginTop:8 }}>
          <div style={{ fontSize:12, color:T.muted, fontFamily:F.body, lineHeight:1.6, marginBottom:12 }}>Still need help? Send us a message and we'll get back to you within 24 hours.</div>
          <Btn onClick={()=>setScreen("sendFeedback")} style={{ padding:"11px", fontSize:12 }}>Contact Support →</Btn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   SEND FEEDBACK
══════════════════════════════════════ */
function SendFeedbackScreen({ setScreen }) {
  const { user } = useAuth();
  const [type, setType]       = useState("feedback");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  async function submit() {
    if (!message.trim()) return;
    setSending(true);
    try {
      if (IS_LIVE && _sb) {
        await _sb.from("feedback").insert({ user_id: user?.id||null, type, message, created_at: new Date().toISOString() }).catch(()=>{});
      }
      setSent(true);
    } finally { setSending(false); }
  }

  if (sent) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}` }}>
        <button onClick={()=>setScreen("settings")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← SETTINGS</button>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"28px" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✓</div>
        <div style={{ fontFamily:F.display, fontSize:24, color:T.accent, letterSpacing:"0.04em", marginBottom:8 }}>THANK YOU!</div>
        <div style={{ fontSize:13, color:T.muted, fontFamily:F.body, textAlign:"center", lineHeight:1.6, marginBottom:28 }}>We read every message and will get back to you within 24 hours.</div>
        <Btn onClick={()=>setScreen("settings")} style={{ width:"auto", padding:"12px 28px" }}>Back to Settings</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:T.black, overflow:"hidden" }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <button onClick={()=>setScreen("settings")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← SETTINGS</button>
        <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92 }}>SEND</div>
        <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>feedback.</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 28px 48px", display:"flex", flexDirection:"column", gap:18 }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, fontFamily:F.body, marginBottom:10 }}>Type</div>
          <div style={{ display:"flex", gap:2 }}>
            {[["feedback","💬 Feedback"],["bug","🐛 Bug Report"],["feature","✨ Feature Request"]].map(([val,label])=>(
              <div key={val} onClick={()=>setType(val)} style={{ flex:1, padding:"10px 8px", textAlign:"center", border:`1px solid ${type===val?T.accent:T.border}`, background:type===val?"rgba(232,255,71,0.06)":"none", cursor:"pointer" }}>
                <div style={{ fontSize:10, fontFamily:F.body, color:type===val?T.accent:T.muted }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:T.muted, display:"block", marginBottom:8, fontFamily:F.body }}>Message</label>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder={type==="bug"?"Describe what happened and how to reproduce it…":type==="feature"?"What feature would you like to see?…":"Tell us what you think…"} style={{ width:"100%", minHeight:140, padding:"13px 16px", background:"#111", border:`1px solid ${T.border}`, color:T.white, fontSize:13, fontFamily:F.body, borderRadius:2, boxSizing:"border-box", outline:"none", resize:"none", lineHeight:1.6 }} />
          <div style={{ fontSize:10, color:T.muted, textAlign:"right", marginTop:4, fontFamily:F.body }}>{message.length} chars</div>
        </div>
        <Btn onClick={submit} disabled={!message.trim()||sending}>{sending?"Sending…":"Send →"}</Btn>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   TERMS OF SERVICE
══════════════════════════════════════ */
function TermsScreen({ setScreen }) {
  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}` }}>
        <button onClick={()=>setScreen("settings")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← SETTINGS</button>
        <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92 }}>TERMS OF</div>
        <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>service.</div>
      </div>
      <div style={{ padding:"24px 28px 48px", display:"flex", flexDirection:"column", gap:20 }}>
        {[
          { title:"1. Acceptance of Terms", body:"By accessing or using FounderMatch, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service." },
          { title:"2. Eligibility", body:"You must be at least 18 years old to use FounderMatch. By using the service, you represent that you meet this requirement and that all information you provide is accurate." },
          { title:"3. User Accounts", body:"You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use." },
          { title:"4. Acceptable Use", body:"You agree not to misuse FounderMatch. This includes not posting false information, harassing other users, attempting to scrape data, or using the platform for any illegal purpose." },
          { title:"5. Content", body:"You retain ownership of content you post. By posting, you grant FounderMatch a non-exclusive license to use, display, and distribute that content on the platform." },
          { title:"6. Subscriptions & Payments", body:"Plus subscriptions are billed monthly. Cancellations take effect at the end of the current billing period. No refunds are provided for partial months." },
          { title:"7. Termination", body:"We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from the Settings screen." },
          { title:"8. Disclaimer", body:"FounderMatch is provided 'as is' without warranty of any kind. We do not guarantee that you will find a cofounder or that any match will be successful." },
          { title:"9. Changes", body:"We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms." },
          { title:"10. Contact", body:"For questions about these terms, contact us via the Send Feedback screen in the app." },
        ].map(s=>(
          <div key={s.title}>
            <div style={{ fontFamily:F.display, fontSize:13, color:T.accent, letterSpacing:"0.04em", marginBottom:6 }}>{s.title.toUpperCase()}</div>
            <div style={{ fontSize:12, color:T.muted, fontFamily:F.body, lineHeight:1.8 }}>{s.body}</div>
          </div>
        ))}
        <div style={{ fontSize:11, color:"#444", fontFamily:F.body, marginTop:8 }}>Last updated: March 2026</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   PRIVACY POLICY
══════════════════════════════════════ */
function PrivacyScreen({ setScreen }) {
  return (
    <div style={{ flex:1, overflowY:"auto", background:T.black }}>
      <div style={{ background:T.offBlack, padding:"52px 28px 24px", borderBottom:`1px solid ${T.border}` }}>
        <button onClick={()=>setScreen("settings")} style={{ background:"none", border:"none", color:T.muted, fontSize:11, cursor:"pointer", marginBottom:14, padding:0, fontFamily:F.body, letterSpacing:"0.08em" }}>← SETTINGS</button>
        <div style={{ fontFamily:F.display, fontSize:34, color:T.white, lineHeight:0.92 }}>PRIVACY</div>
        <div style={{ fontFamily:F.serif, fontSize:36, fontStyle:"italic", color:T.accent }}>policy.</div>
      </div>
      <div style={{ padding:"24px 28px 48px", display:"flex", flexDirection:"column", gap:20 }}>
        {[
          { title:"What We Collect", body:"We collect information you provide when creating your account — name, email, professional background, skills, and interests. We also collect usage data to improve the product." },
          { title:"How We Use It", body:"Your profile data is used to match you with compatible founders. Your email is used for account management and notifications (which you can turn off in Settings)." },
          { title:"What We Share", body:"Your profile is visible to other FounderMatch users according to your privacy settings. We never sell your personal data to third parties." },
          { title:"Data Storage", body:"Your data is stored securely on Supabase infrastructure with encryption at rest and in transit. We retain your data until you delete your account." },
          { title:"Your Rights", body:"You can export your data at any time from Settings → Download My Data. You can delete your account and all associated data from Settings → Delete Account." },
          { title:"Cookies", body:"We use essential cookies to keep you logged in. We do not use tracking or advertising cookies." },
          { title:"Third-Party Services", body:"We use Supabase for database and authentication, and Stripe for payments. These services have their own privacy policies." },
          { title:"Children's Privacy", body:"FounderMatch is not intended for users under 18. We do not knowingly collect data from minors." },
          { title:"Changes", body:"We may update this policy and will notify you of significant changes via email." },
          { title:"Contact", body:"Questions about privacy? Reach us via the Send Feedback screen in the app." },
        ].map(s=>(
          <div key={s.title}>
            <div style={{ fontFamily:F.display, fontSize:13, color:T.accent, letterSpacing:"0.04em", marginBottom:6 }}>{s.title.toUpperCase()}</div>
            <div style={{ fontSize:12, color:T.muted, fontFamily:F.body, lineHeight:1.8 }}>{s.body}</div>
          </div>
        ))}
        <div style={{ fontSize:11, color:"#444", fontFamily:F.body, marginTop:8 }}>Last updated: March 2026</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   ROOT APP
══════════════════════════════════════ */
export default function FounderMatch() {
  const [screen, setScreen]        = useState("loading");
  const [user, setUser]            = useState(null);
  const [isPaid, setIsPaid]        = useState(false);
  const [activeFounderId, setAFId] = useState(null);
  const [activeIdeaId, setAIId]    = useState(null);
  const [unreadCount, setUnread]   = useState(0);

  // api is stable — built once from _sb (live) or demo
  const api = IS_LIVE ? makeApi(_sb, false) : makeApi(null, true);

  // ── Boot: check for existing session ────────────────────
  useEffect(()=>{
    // Hard timeout — always escape loading screen after 4 seconds
    const hardTimeout = setTimeout(() => setScreen(s => s === "loading" ? "landing" : s), 4000);

    async function boot() {
      // Clear any invalid auth tokens before starting
       try { localStorage.removeItem("fm-auth"); } catch(e) {}
      try {
        const params = new URLSearchParams(window.location.search);
        const checkoutStatus = params.get("checkout");
        if (checkoutStatus === "success") {
          window.history.replaceState({}, "", window.location.pathname);
        }

        const { data:{ session } } = await _sb.auth.getSession();
        clearTimeout(hardTimeout);
        if (session?.user) {
          const { data:profile } = await _sb.from("profiles").select("*").eq("id", session.user.id).single();
          const { data:sk }  = await _sb.from("profile_skills").select("skills(name)").eq("profile_id", session.user.id);
          const { data:inr } = await _sb.from("profile_interests").select("interests(name)").eq("profile_id", session.user.id);
          const fullProfile  = { ...(profile||{}), skills:(sk||[]).map(s=>s.skills?.name).filter(Boolean), interests:(inr||[]).map(i=>i.interests?.name).filter(Boolean) };
          setUser(fullProfile);
          setIsPaid(profile?.subscription_status === "plus");
          if (checkoutStatus === "success") {
            setIsPaid(true);
            setScreen("subscription");
          } else {
            setScreen(profile?.onboarding_done ? "home" : "questionnaire");
          }
        } else {
          setScreen("landing");
        }
      } catch(e) {
        clearTimeout(hardTimeout);
        console.error("Boot error:", e);
        setScreen("landing");
      }
    }
    boot();
  }, []);

  // ── Auth state listener ──────────────────────────────────
  useEffect(()=>{
    if (!IS_LIVE) return;
    const { data:{ subscription } } = _sb.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const profile = await api.profiles.get(session.user.id);
          setUser(profile);
          setIsPaid(profile.subscription_status === "plus");
          setScreen(profile.onboarding_done ? "home" : "questionnaire");
        } catch(e) { setScreen("landing"); }
      } else if (event === "SIGNED_OUT") {
        setUser(null); setScreen("landing");
      }
    });
    return () => subscription?.unsubscribe?.();
  }, []);

  // ── Unread badge ─────────────────────────────────────────
  useEffect(()=>{
    if (!user) return;
    api.messages.listConversations(user.id).then(c=>{ setUnread(c.reduce((a,x)=>a+(x.unread||0),0)); }).catch(()=>{});
  },[user]);

  // ── Loading splash ───────────────────────────────────────
  if (screen === "loading") return (
    <div style={{ width:"100vw", height:"100dvh", background:T.black, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", maxWidth:430, margin:"0 auto" }}>
      <div style={{ fontFamily:F.display, fontSize:48, color:T.white, lineHeight:0.9, marginBottom:4 }}>FOUNDER</div>
      <div style={{ fontFamily:F.serif, fontSize:50, fontStyle:"italic", color:T.accent, marginBottom:32 }}>match.</div>
      <Spinner />
    </div>
  );

  const AUTH_SCREENS  = ["landing","signup","login","questionnaire"];
  const showNav       = !AUTH_SCREENS.includes(screen);
  const NO_TABS = ["founderProfile","founderTeam","settings","editProfile","subscription","blockedUsers","helpCenter","sendFeedback","terms","privacy"];
  const showTabs      = showNav && !NO_TABS.includes(screen);

  const ctx = { api, user, setUser, isPaid, setIsPaid };

  const renderScreen = () => {
    switch(screen) {
      case "landing":        return <LandingScreen setScreen={setScreen} />;
      case "signup":         return <SignupScreen setScreen={setScreen} />;
      case "login":          return <LoginScreen setScreen={setScreen} />;
      case "questionnaire":  return <QuestionnaireScreen setScreen={setScreen} />;
      case "home":           return <HomeScreen setScreen={setScreen} />;
      case "discover":       return <DiscoverScreen setScreen={setScreen} setActiveFounderId={setAFId} />;
      case "founderProfile": return <FounderProfileScreen setScreen={setScreen} founderId={activeFounderId} />;
      case "connections":    return <ConnectionsScreen setScreen={setScreen} setActiveFounderId={setAFId} />;
      case "messages":       return <MessagesScreen setScreen={setScreen} setActiveFounderId={setAFId} />;
      case "marketplace":    return <MarketplaceScreen setScreen={setScreen} setActiveIdeaId={setAIId} />;
      case "founderTeam":    return <FounderTeamScreen setScreen={setScreen} ideaId={activeIdeaId} />;
      case "profile":        return <ProfileScreen setScreen={setScreen} />;
      case "editProfile":    return <EditProfileScreen setScreen={setScreen} />;
      case "subscription":   return <SubscriptionScreen setScreen={setScreen} />;
      case "settings":       return <SettingsScreen setScreen={setScreen} />;
      case "blockedUsers":   return <BlockedUsersScreen setScreen={setScreen} />;
      case "helpCenter":     return <HelpCenterScreen setScreen={setScreen} />;
      case "sendFeedback":   return <SendFeedbackScreen setScreen={setScreen} />;
      case "terms":          return <TermsScreen setScreen={setScreen} />;
      case "privacy":        return <PrivacyScreen setScreen={setScreen} />;
      default:               return <HomeScreen setScreen={setScreen} />;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        html,body,#root{height:100%;background:#0a0a0a;}
        ::-webkit-scrollbar{width:0;height:0;}
        input,textarea,select{font-family:'DM Sans',sans-serif!important;-webkit-appearance:none;background:#111!important;color:#f5f5f0!important;}
        input::placeholder,textarea::placeholder{color:#3a3a3a!important;}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <AuthCtx.Provider value={ctx}>
        <div style={{ width:"100vw", height:"100dvh", display:"flex", flexDirection:"column", background:T.black, fontFamily:F.body, overflow:"hidden", maxWidth:430, margin:"0 auto", position:"relative" }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px)`, backgroundSize:"60px 60px", opacity:0.04, pointerEvents:"none", zIndex:0 }} />
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative", zIndex:1 }}>
            {renderScreen()}
          </div>
          {showTabs && <BottomNav screen={screen} setScreen={setScreen} unreadCount={unreadCount} />}
        </div>
      </AuthCtx.Provider>
    </>
  );
}
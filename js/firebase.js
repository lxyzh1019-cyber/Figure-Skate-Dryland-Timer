/* ============================================================================
   firebase.js — best-effort Firestore mirror of sessions.
   The SDK is lazy-loaded from gstatic inside a try/catch, so importing this
   module NEVER throws: if the network is blocked (offline / CSP), every helper
   simply no-ops and the app keeps working on localStorage alone.
   Collection: jenn_skating_sessions (unchanged from the original app).
   ============================================================================ */
const CONFIG = {
  apiKey:            "AIzaSyBvasH4OqU76196ZmZSXX_e8-L2PYnvyaY",
  authDomain:        "chore-tracker-a461b.firebaseapp.com",
  projectId:         "chore-tracker-a461b",
  storageBucket:     "chore-tracker-a461b.firebasestorage.app",
  messagingSenderId: "282740057913",
  appId:             "1:282740057913:web:72defcf2e53ae13237eae8"
};
const COL = "jenn_skating_sessions";

let _db = null, _api = null, _tried = false;

async function init() {
  if (_tried) return _db;
  _tried = true;
  try {
    const appMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const fsMod  = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const app = appMod.initializeApp(CONFIG);
    _db = fsMod.getFirestore(app);
    _api = fsMod;
  } catch (e) {
    _db = null; _api = null;   // offline / blocked — degrade to local-only
  }
  return _db;
}

export async function fsAddSession(entry) {
  const db = await init(); if (!db || !_api) return null;
  try {
    const ref = await _api.addDoc(_api.collection(db, COL), { ...entry, createdAt: _api.serverTimestamp() });
    return ref.id;
  } catch { return null; }
}
export async function fsUpdateSession(id, patch) {
  const db = await init(); if (!db || !_api || !id) return;
  try { await _api.updateDoc(_api.doc(db, COL, id), patch); } catch {}
}
export async function fsGetRecent(n = 7) {
  const db = await init(); if (!db || !_api) return [];
  try {
    const q = _api.query(_api.collection(db, COL), _api.orderBy("createdAt", "desc"), _api.limit(n));
    const snap = await _api.getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}
export async function fsGetAll() {
  const db = await init(); if (!db || !_api) return [];
  try {
    const q = _api.query(_api.collection(db, COL), _api.orderBy("createdAt", "asc"));
    const snap = await _api.getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

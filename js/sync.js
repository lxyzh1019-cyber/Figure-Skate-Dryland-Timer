/* ============================================================
   SYNC — keep this device and the cloud mirror in agreement.

   The mirror used to be write-only: sessions went up (fsAddSession)
   and fsGetAll was exported but never called, so a cleared
   localStorage — Safari evicts it after ~7 idle days, and it is
   per-browser and per-device besides — wiped everything the skater
   had earned while a full copy sat intact in the cloud.

   Reading it back fixed the wipe but not the disagreement: the same
   skater read level 26 on the iPad and level 18 on the desktop,
   because only SESSIONS are mirrored. A second device can rebuild
   the XP that came from training and nothing else — not the quiz
   XP, not the prize wallet — and any session that failed to upload
   (offline, or before the mirror existed) lived on one device
   forever.

   So a boot now does three things, all best-effort, all additive:

     1. pull    — merge in sessions this device is missing
     2. push    — upload sessions the cloud is missing
     3. journey — merge the part of the journey the session log
                  cannot re-derive, then publish the merged result

   Local-first still holds. Nothing is overwritten or deleted on
   either side; every step can only ADD.
   ============================================================ */

import { settings, mergeSessions, reconcileJourneyWithSessions, loadSessions,
         sessionKey, journeySnapshot, mergeCloudJourney, logEvent } from "./store.js";

let _done = false;

/* Cap the catch-up upload so a device with a long history doesn't fire
   hundreds of writes on one boot; the rest go up on later boots. */
const BACKFILL_LIMIT = 40;

/* Runs once per app load, after the first paint. Never throws: an offline
   device, blocked Firestore rules or a mirror opt-out all just mean "nothing
   synced", and the app carries on with whatever is on the device.
   Returns { added, xpAdded, uploaded, journeyXp }. */
export async function restoreFromCloud() {
  const idle = { added: 0, xpAdded: 0, uploaded: 0, journeyXp: 0 };
  if (_done) return idle;
  _done = true;
  // Mirroring off (privacy opt-out) means there is nothing of ours up there,
  // and reading would contradict the setting the grown-up chose.
  if (settings.cloudMirror === false) return idle;
  try {
    const { fsGetAll, fsAddSession, fsGetJourney, fsSaveJourney } = await import("./firebase.js");
    const remote = await fsGetAll();
    // The collection is this app's alone (jenn_skating_sessions), so every
    // session doc in it belongs to this skater — no athlete filter needed. The
    // journey doc shares the collection, so it is skipped here.
    const remoteSessions = (remote || []).filter(d => d && d.kind !== "journey");

    // 1. pull
    const added = mergeSessions(remoteSessions);
    const xpAdded = added ? reconcileJourneyWithSessions() : 0;

    // 2. push — anything this device has that the cloud doesn't
    const remoteKeys = new Set(remoteSessions.map(sessionKey));
    const missing = loadSessions().filter(s => s.isoDate && !remoteKeys.has(sessionKey(s)));
    let uploaded = 0;
    for (const s of missing.slice(0, BACKFILL_LIMIT)) {
      if (await fsAddSession(s)) uploaded++;
    }

    // 3. journey — merge what the session log can't rebuild, then publish the
    // merged result so the other device picks it up on its next boot.
    const journeyXp = mergeCloudJourney(await fsGetJourney());
    await fsSaveJourney(journeySnapshot());

    if (added || uploaded || journeyXp) {
      logEvent("cloud_sync", { added, xpAdded, uploaded, journeyXp });
    }
    return { added, xpAdded, uploaded, journeyXp };
  } catch (e) {
    console.warn("Cloud sync skipped:", e);
    return idle;
  }
}

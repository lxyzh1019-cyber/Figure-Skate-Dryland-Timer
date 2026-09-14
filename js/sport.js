/* ============================================================
   SPORT — everything that says which app this is.

   The shared core under core/ never names a sport. Every name, storage key,
   collection, image path and line of copy it needs to be THIS app is defined
   here, once, and read through core/sport.js. The sibling app carries its own
   copy of this file with its own values; the core is byte-identical in both.
   ============================================================ */

export const APP_ID = "figure-skating";                    // stamped on every session row
export const APP_NAME = "Skate";                           // short name: passkey, home-screen title
export const APP_TITLE = "Skate with Grace — Dryland Timer"; // passkey relying-party name
export const ATHLETE_DEFAULT = "Jenn";                     // until a grown-up renames her
/* The name records were keyed by before athlete identity became an id — the
   default name at the time. Read by the identity migration, never changed. */
export const LEGACY_ATHLETE = "Jenn";

export const SESSIONS_COLLECTION = "jenn_skating_sessions"; // this app's Firestore collection
export const BACKUP_APP = "skate-with-grace-dryland";     // stamped on a backup file; a restore checks it
export const BACKUP_FILE_PREFIX = "skate-backup-";
export const CSV_FILE_PREFIX = "skate-dryland-summary-";

/* localStorage keys. Frozen: a renamed key is a wiped history. The first
   fifteen are the keys this app has always used; the rest are new with the
   shared core and had no predecessor here. */
export const STORAGE_KEYS = {
  settings:       "skateTrainingSettingsV2",
  progress:       "skateTrainingProgressV2",
  skipHistory:    "skateTrainingSkipHistoryV2",
  engage:         "skateEngagementPickV2",
  readiness:      "skate_readiness",
  readinessLog:   "skate_readiness_log_v1",
  dayProgress:    "skate_day_progress",
  learning:       "skate_learning_records",
  ladder:         "skate_ladder_rungs",
  quiz:           "skate_quiz_v1",
  gate:           "skate_gate_state",
  sessions:       "skate_sessions_v2",
  tracker:        "skate_tracker_v2",
  events:         "skate_events_v1",
  prLog:          "skate_pr_log",
  journey:        "skate_journey_v1",
  formCheck:      "skate_form_check_v1",
  profiles:       "skate_profiles_v1",
  grownupPin:     "skate_grownup_pin_v1",
  grownupPasskey: "skate_grownup_passkey_v1"
};

/* Journey documents an earlier mirror wrote under a key that is not an
   athlete's — the part after "journey-". Read and merged on every sync so the
   ledger they hold is never stranded; never written to. Empty when there
   were none. */
export const LEGACY_JOURNEY_KEYS = ["state"];

/* How the plan names its sport-specific parts. */
export const SKILL_BLOCK = "skateskill";        // the technique block that survives every light
export const TRANSFER_FIELD = "skateTransfer";  // on a move: the skill it builds
export const LORE_TRANSFER_FIELD = "skate";     // on a rank's lore: what the rank teaches
export const DAY_LOAD_FIELD = "iceLoad";        // on a day: "double" hides jump rope in the warm-up

/* Images the core places itself. The poses on the session and today screens
   come from POSES in js/data.js. */
export const IMAGES = {
  mascot:    "assets/skate/hero-home.png",
  avatar:    "assets/skate/hero-home.png",
  bodyFront: "assets/skate/body-front.png",
  bodyBack:  "assets/skate/body-back.png"
};

/* The two emoji that stand for the sport and its world, wherever the core
   needs a glyph rather than a picture: the sessions chip, the rank fallback,
   the greeting, the photo placeholder. */
export const EMOJI = { sport: "⛸️", world: "❄️" };

/* The lines of copy that say which sport this is. Everything else the core
   says is the same for every athlete. */
export const COPY = {
  weatherCaption:   "Rink day!",
  journeyMore:      "↑ MORE OF THE ICE AWAITS",
  summit:           "Top of the ladder 🏔️ skate for the love of it",
  greeting:         "Ready to shine on the ice?",
  readinessIntro:   "A few quick checks before we hit the ice",
  bodyMapAlt:       "skater body map",
  sessionQuizIntro: "How does today's work help you skate?",
  transferHeading:  "⛸️ On-ice transfer",
  transferBuilds:   "⛸️ Builds:",
  transferMove:     "⛸️ ice:",
  transferIcon:     "⛸️",
  skillBlockLabel:  "Skate-Skill",
  storyTitle:       "Your ice story",
  storyTagline:     "Every level is a new chapter on the ice ❄️",
  storyLockedTease: "A new chapter is waiting further along your journey…",
  rankQuizStory:    "What does that rank teach you about skating?",
  rankQuizFact:     "Every rank comes with one true fact. Which one belongs to",
  firstMilestone:   "Your first glide is one GO away!",
  backupWrongFile:  "That file isn't a Skate with Grace backup."
};

/* Session mechanics that only one sport uses. The landing check after every
   gated jump, and the jump-fatigue tier-drop it feeds, are this app's. */
export const FEATURES = {
  landingCheck: true
};

/* ============================================================
   2026.2 CONTENT MODEL — workout data, overload, and static tables.
   Each training day = Warm-up → Coordination → Main (Traffic-Light
   rounds) → Finisher → Skate-Skill. Sunday = Spa (recovery only).
   Plan content is the Jenn Skating Dryland 2026.2 (v10) plan on the
   Splash-style engine: GO always runs the day's main workout.
   ============================================================ */

/* ------------------------------------------------------------
   PROGRESSIVE OVERLOAD  (v2)
   Anchored to the week of Mon May 25, 2026. Capped mid-July.
   Timed work: +2s every 2 weeks.  Rep-based: +1 rep every 2 weeks.
   ------------------------------------------------------------ */
export const OVERLOAD_ANCHOR = new Date(2026, 4, 25);   // May 25 2026 (month is 0-indexed)
export const OVERLOAD_CAP_WEEKS = 7;                    // week 7 ~= mid-July, then frozen

// Returns 1-based training week (1..OVERLOAD_CAP_WEEKS)
export function overloadWeek() {
  const now = new Date();
  if (now < OVERLOAD_ANCHOR) return 1;
  const days = Math.floor((now - OVERLOAD_ANCHOR) / 86400000);
  return Math.min(OVERLOAD_CAP_WEEKS, Math.floor(days / 7) + 1);
}
// Timed work seconds for a given base value, adjusted for the current week.
export function adjWork(baseSeconds) {
  return baseSeconds + Math.floor((overloadWeek() - 1) / 2) * 2;
}
// Extra reps for rep-based sets: +1 every 2 weeks.
export function repBonus() {
  return Math.floor((overloadWeek() - 1) / 2);
}

/* 2026.2 runs with overload PAUSED (mirrors the reference app: the manual
   table shows PAUSED). Flip this to false to re-enable auto-progression. */
export const OVERLOAD_PAUSED = true;

/* Overload-adjusted work seconds for a timed exercise. */
export function exWork(ex) {
  if (ex.work == null) return ex.work;
  return OVERLOAD_PAUSED ? ex.work : adjWork(ex.work);
}
/* Rep count shown for a rep-based exercise, with the +1-rep bonus applied
   to the leading "N reps" figure in repsDetail. */
export function exRepsDetail(ex) {
  if (OVERLOAD_PAUSED) return ex.repsDetail;
  const bonus = repBonus();
  if (!bonus || !ex.repsDetail) return ex.repsDetail;
  return ex.repsDetail.replace(/^(\d+)/, n => parseInt(n, 10) + bonus);
}
/* Overload-adjusted dose string for display (bumps a leading rep count,
   or a leading seconds figure for timed work). */
export function exDose(ex) {
  if (ex.byReps || ex.driver === "reps") return exRepsDetail(ex) || ex.dose;
  if (ex.driver === "time" && ex.work != null) {
    const w = exWork(ex);
    return ex.eachSide ? Math.floor(w / 2) + "s/side" : (ex.dose || w + "s");
  }
  return ex.dose;
}

/* Suggested clock time for a rep-driven move, as a short label ("45s", "2:30").
   Timed moves already run their own countdown, so they return "" — the ring
   shows the countdown instead. */
export function exSuggestedTime(ex) {
  const secs = ex && ex.driver === "reps" ? ex.estSecs : 0;
  if (!secs) return "";
  if (secs < 60) return secs + "s";
  return Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
}
/* Dose plus its suggested time, for the plan lists and the move library:
   "8/side · ~60s". Timed moves keep their dose unchanged. */
export function exDoseWithTime(ex) {
  if (!ex) return "";
  const dose = exDose(ex) || "";
  const t = exSuggestedTime(ex);
  return t ? (dose ? dose + " · ~" + t : "~" + t) : dose;
}

export const MANTRA = "I am STRONG. I am GRACEFUL. I can SKATE THIS.";

export const PRONUNCIATION_MAP = {
  "Pallof Press": "Pal-off Press",
  "SL-RDL": "Single-Leg Romanian Deadlift",
  "Carioca": "Ka-ree-oh-ka",
  "Copenhagen Plank": "Copen-hah-gen Plank",
  "Hip CARs": "Hip Cars"
};

export const ENCOURAGEMENTS_BY_STYLE = {
  classic: [
    "Strong finish.",
    "Good control on that set.",
    "Clean round. Stay steady.",
    "Solid effort.",
    "Discipline is showing. Nice work.",
    "Power and calm. Good combo.",
    "That round looked sharp.",
    "Quality work.",
    "Hold your line.",
    "Keep the form tidy."
  ],
  fun: [
    "Boom. That was awesome!",
    "Level up unlocked!",
    "Big energy. Love it!",
    "You're a beast — keep rolling!",
    "Crushing it. High five!",
    "Whoa, that was clean!",
    "Sparkly form. So good!",
    "You stayed cool under pressure. Nice!",
    "Banger of a round!",
    "That was straight up fire!"
  ],
  encouraging: [
    "You're doing great. Keep going.",
    "Every rep counts. Proud of you.",
    "One round at a time. You've got this.",
    "Breathe — you're strong.",
    "Trust the work. It's adding up.",
    "Steady. Strong. Calm.",
    "You showed up. That matters.",
    "Small wins build big wins.",
    "Your body remembers. Keep teaching it.",
    "Soft knees, strong core. Beautiful."
  ]
};

/* ------------------------------------------------------------
   HOW-TO / VALIDATED COACHING CHANNELS — each block routes to ONE
   trusted channel covering that kind of work. The demo link is a
   broad YouTube search with the channel NAME appended, so it always
   returns real videos while biasing toward the validated channel.
   ------------------------------------------------------------ */
export const COACH_CHANNELS = {
  skate:    { label: "Figure-skating off-ice", name: "iSk8 Mom Maja", url: "https://www.youtube.com/@iSk8MomMaja" },
  mobility: { label: "Mobility & warm-up",     name: "Tom Merrick",   url: "https://www.youtube.com/@TomMerrick" },
  speed:    { label: "Speed & coordination",   name: "ALTIS",         url: "https://www.youtube.com/@ALTIS" },
  strength: { label: "Strength & core",        name: "ATHLEAN-X",     url: "https://www.youtube.com/@athleanx" }
};
export const BLOCK_CHANNEL = {
  warmup: "mobility", recovery: "mobility",
  coordination: "speed",
  main: "strength", prep: "strength", finisher: "strength",
  skateskill: "skate"
};
export const channelForBlock = b => COACH_CHANNELS[BLOCK_CHANNEL[b]] || COACH_CHANNELS.strength;
/* There used to be a second URL builder here (`yt(q, ch)`) that appended the
   channel name, alongside videoSearchUrl() which did not. Nothing ever called
   it, so the channel bias this file documents was never actually applied and
   every demo link went out as a bare keyword search. One builder now —
   videoSearchUrl below — and it does the appending. */

export const EXERCISE_HOWTO = {
  // — skate-skill drills —
  "Axis Micro": {
    text: "Stand tall in front of a mirror, crown of the head stacked over the skating foot. Hold your arm carriage and run the 4 self-checks OUT LOUD: Am I stacked? Did I lean right? Was my checkout quiet? Am I holding without gripping?",
    search: "releve balance port de bras posture drill"
  },
  "Spin Board Backspin Hold": {
    text: "On the spinner board, set your backspin position: crown up, free leg checked, arms pulled in tight. Hold 10+ rotations. You can't change feet on the board. Dizzy for more than 30–45 seconds → STOP.",
    search: "off ice spinner board backspin position"
  },
  "Spin Board Layback Hold": {
    text: "Start with a clean upright hold on the spinner board. Only then add a small layback line — chest opens up, hips stay pressed forward, crown stays tall. Follow the 10/15/20-second on-ramp.",
    search: "off ice spinner board layback position"
  },
  "Turn-and-Stick Single-Leg Landing": {
    text: "Small jump with a ¼ or ½ turn, land on ONE foot and freeze for 2 full seconds — knee over toe, free leg checked, arms in landing position. If you can't freeze it, make the turn smaller.",
    search: "off ice single leg jump landing hold"
  },
  "Active Split Slide": {
    text: "Slide slowly toward YOUR end-range split with hips square, using sliders or a smooth floor. Active flexibility only — never a passive over-split, never partner-pressed. Post-session only.",
    search: "active split flexibility drill safe progression"
  },
  "Active Hamstring Lengthening": {
    text: "Lie on your back, raise one straight leg as high as YOUR muscles can hold it — no hands pulling. Hold 3 seconds, lower with control. The strength holds the flexibility.",
    search: "active straight leg raise hamstring exercise"
  },
  "Half-Kneeling Hip-Flexor Hold": {
    text: "Half-kneel, tuck the pelvis (posterior tilt), grow tall through the crown. You should feel the front of the kneeling-side hip lengthen — this serves the spiral and layback line.",
    search: "half kneeling hip flexor stretch posterior tilt"
  },
  // — jumps & landings (the heart of the plan) —
  "Box Jump → Stick": {
    text: "Jump onto a low plyo box with a fast, quiet contact — then FREEZE for 2 seconds. Knees track over toes, chest tall. The freeze IS the exercise: a landing you can't hold doesn't count.",
    search: "box jump stick landing drill youth"
  },
  "Lateral Bound → Stick": {
    text: "Push sideways off one leg, land on the other and FREEZE 2 seconds. Stillness is the training — no continuous bouncing. Land soft, knee over toe.",
    search: "lateral bound stick landing drill"
  },
  "Skater Jump": {
    text: "Bound side to side, single-leg to single-leg, landing soft with a frozen finish each side. Grade each landing 1–5 in your head — wobbly past 2 seconds means shorten the distance.",
    search: "skater jump lateral bound landing technique"
  },
  "Rotational Jump w/ Frozen Landing": {
    text: "Two-foot jump with a ¼ turn, then ½, then full — crown up, free arms checked, freeze the landing 2–3 seconds. Progress the turn only when the landing stays quiet.",
    search: "off ice rotation jump landing hold"
  },
  "Band Arm-Pull-In": {
    text: "Hold a light band out wide, then snap the arms into your rotation position — fast pull, FROZEN finish. This is your air-position speed, trained on the floor.",
    search: "off ice rotation arm pull in drill"
  },
  "Eccentric Step-Down": {
    text: "Stand on a low step on one leg. Lower the free heel to the floor over a slow 4-count — knee tracking over the toe the whole way. This builds the landing leg.",
    search: "single leg eccentric step down knee control"
  },
  "Low Box Step-Up Drive": {
    text: "Step onto a low box driving through the WHOLE foot, then punch the opposite knee up tall. Control down. Left knee tracks over the toe — no caving.",
    search: "box step up knee drive exercise"
  },
  // — strength & core —
  "SL-RDL": {
    text: "Single-leg Romanian deadlift: hinge from the hip with a flat back, free leg reaching long behind. Right-side quality matters most. Feel the hamstring, not the low back.",
    search: "single leg romanian deadlift bodyweight tutorial"
  },
  "Push-up": {
    text: "Ribs down, body in one line, full range — chest to just above the floor. Use an incline (bench or counter) if the hips sag. Quality beats count.",
    search: "push up progression incline correct form"
  },
  "Suitcase Carry": {
    text: "Carry one weight at your side and walk tall. Don't side-bend — resist the lean. This is your axis, under load.",
    search: "suitcase carry anti lateral core exercise"
  },
  "Pallof Press": {
    text: "Hold a band at your chest, press straight out and hold 2 seconds while the band tries to twist you. Hips square, no rotation. Anti-rotation = quiet checkouts.",
    search: "pallof press anti rotation exercise", channel: "The Prehab Guys"
  },
  "Glute Bridge": {
    text: "Lie on your back, feet flat, drive the hips up and SQUEEZE at the top 2 seconds — don't arch the low back. The hip is the motor for every jump.",
    search: "glute bridge exercise correct form"
  },
  "Dead Bug": {
    text: "Low back glued to the floor. Extend opposite arm and leg while exhaling slowly. If the back lifts, make the range smaller.",
    search: "dead bug exercise correct form", channel: "The Prehab Guys"
  },
  "Bird Dog": {
    text: "From all fours, reach opposite arm and leg LONG — length, not lift. Flat back, no low-back arch, no hip rotation.",
    search: "bird dog exercise correct form", channel: "The Prehab Guys"
  },
  "Superman": {
    text: "Lie face-down, lift arms and legs into a long line — thoracic extension, length not crunch. Hold, breathe, lower.",
    search: "superman exercise back extension correct form", channel: "ATHLEAN-X"
  },
  "Copenhagen Plank": {
    text: "Side plank with the top foot on a low bench, bottom leg lifted. Adductors actively working — this is edge control, not just hanging. Short holds, switch sides.",
    search: "copenhagen plank adductor exercise progression"
  },
  "Resisted Band March": {
    text: "Band around the hips anchored behind you. March with fast knee drive, trunk tall — don't let the band fold you forward.",
    search: "resisted band march knee drive drill"
  },
  "Pull-Up (heavy)": {
    text: "3 slow 4-second eccentric lowers, then max CLEAN reps. Shoulders depress first, then pull. Never to failure, never kipping — one swing = set over.",
    search: "strict pull up eccentric lower tutorial"
  },
  "Scap Pull-Up + Dead Hang": {
    text: "Hang from the bar, slide the shoulders DOWN away from the ears (no elbow bend), then relax into a dead hang and decompress.",
    search: "scapular pull up dead hang exercise"
  },
  // — prep pair —
  "Monster Walk": {
    text: "Mini-band around the ankles or knees, quarter-squat, step sideways keeping tension — knees pushed OUT over the toes. This wakes up the muscles that guard your landing knee.",
    search: "monster walk lateral band walk glute exercise"
  },
  "Side Plank Reach": {
    text: "Side plank, hips stacked and lifted; reach the top arm under and back through. If the hip drops, shorten the reach.",
    search: "side plank reach under exercise tutorial"
  },
  "Band External Rotation": {
    text: "Elbow pinned to your side, rotate the forearm out slowly against the band. Builds shoulder durability for carriage and pull work.",
    search: "band external rotation shoulder exercise", channel: "The Prehab Guys"
  },
  "Side-Lying ER": {
    text: "Lie on your side, elbow on ribs, rotate a light weight up slowly. Second cuff angle — light and slow beats heavy and fast.",
    search: "side lying external rotation shoulder exercise", channel: "The Prehab Guys"
  },
  // — warm-up / mobility (biased toward clean mobility demos) —
  "Jump Rope": { search: "jump rope basic bounce technique tutorial" },
  "Band Pass-Through": { search: "resistance band pass through shoulder mobility drill", channel: "Tom Merrick" },
  "Cat-Camel": { search: "cat camel spine mobility exercise tutorial" },
  "90/90 Hip Switch": { search: "90 90 hip switch mobility drill", channel: "Tom Merrick" },
  "Leg Swings": { search: "leg swings dynamic warm up drill tutorial" },
  "Wall Slides": { search: "wall slides shoulder mobility exercise tutorial" },
  "Knee-to-Wall Ankle": { search: "knee to wall ankle mobility drill tutorial" },
  "Half-Kneeling Ankle Rock": { search: "half kneeling ankle dorsiflexion rock mobility drill" },
  "Calf Raise": { search: "full range calf raise exercise tutorial" },
  "Hip CARs": { search: "hip CARs controlled articular rotations tutorial", channel: "Tom Merrick" },
  // — coordination / running mechanics —
  "A-March": { search: "A march running drill technique" },
  "A-Skip": { search: "A skip running drill technique" },
  "Carioca": { search: "carioca drill running technique" },
  "Skip for Height": { search: "skip for height power drill technique" },
  "Lateral Shuffle → Stick": { search: "lateral shuffle stop stick agility drill" },
  // — recovery (foam rolling / breathing) —
  "Calves — foam roller": { search: "foam rolling calves technique tutorial" },
  "Quads — roller or gun": { search: "foam rolling quads technique tutorial" },
  "Lats / upper back — roller, arms overhead": { search: "foam rolling lats upper back technique tutorial" },
  "Glutes — foam roller": { search: "foam rolling glutes technique tutorial" },
  "Touch-up — massage gun (parent)": { search: "massage gun technique legs safe use tutorial" }
};

/* Best available YouTube search query for an exercise: a hand-picked
   query (biased toward a specific, kid-appropriate demo source) when
   one exists in EXERCISE_HOWTO, else a generic fallback. */
export function videoSearchQuery(ex) {
  if (!ex || !ex.name) return "";
  const howto = EXERCISE_HOWTO[ex.name];
  const base = (howto && howto.search) || ((ex.searchableName || ex.name) + " exercise tutorial correct form");
  // Bias toward a validated channel. A bare keyword string is why the skate
  // drills returned unrelated videos: nothing on YouTube is called "Axis
  // Micro", so "releve balance port de bras" alone lands in general ballet.
  // Naming a channel pins it to a real source. A move whose best source isn't
  // its block's default declares `channel`; everything else takes the block's.
  const channel = (howto && howto.channel) || channelForBlock(ex.block).name;
  return base + " " + channel;
}
export function videoSearchUrl(ex) {
  const q = videoSearchQuery(ex);
  return q ? "https://www.youtube.com/results?search_query=" + encodeURIComponent(q) : "#";
}

/* ------------------------------------------------------------
   X() — exercise factory. Returns an object compatible with the
   timer/voice runner (work / byReps+repsDetail / reset / cue / redFlag).
   ------------------------------------------------------------ */
export function X(o) {
  const driver = o.driver ||
    (o.work != null ? "time" : (o.repsDetail != null ? "reps" : null));
  const ex = {
    name: o.name,
    block: o.block || "main",
    driver,
    dose: o.dose || "",
    reset: o.reset || "",                 // short setup phrase spoken first
    cue: o.cue || "",
    redFlag: o.fix || null,               // correction (shown as red-flag / "the fix")
    parentWatch: o.parentWatch || null,   // "what to watch" (feeds quiz/cards)
    skateTransfer: o.skateTransfer || null, // skill it builds on the ice (feeds quiz/cards)
    faultAnchor: !!o.faultAnchor,
    gate: o.gate || null,                 // null | "valgus"
    parentEcho: !!o.parentEcho,           // anti-extension breath gate
    searchableName: o.searchableName || o.name,
    demoUrl: o.demoUrl || null,
    rest: o.rest != null ? o.rest : 5
  };
  if (driver === "reps") {
    ex.byReps = true;
    ex.repsDetail = o.repsDetail || o.dose;
    // Suggested seconds to work to. Rep moves are self-paced (tap Done), so
    // this paces the athlete and feeds the session estimate — it never cuts
    // the set short. Required for every rep move; smoke tests enforce it.
    ex.estSecs = o.estSecs || null;
  }
  else if (driver === "time") { ex.work = o.work; }
  if (o.eachSide) ex.eachSide = true;
  return ex;
}

/* Light → number of rounds for the Main block. */
export const LIGHT_ROUNDS = { green: 3, yellow: 2, red: 1, recovery: 0 };

/* Top-7 exercises tracked on the Independence Ladder. */
export const TOP7 = [
  "Eccentric Step-Down", "Pull-Up (heavy)", "Box Jump → Stick",
  "Skater Jump", "Rotational Jump w/ Frozen Landing",
  "Spin Board Backspin Hold", "Turn-and-Stick Single-Leg Landing"
];

export const MICRO_LOOP = { q: "Where does a clean landing freeze?", a: "knee over toe" };
export const BREATH_REHEARSAL =
  "Axis self-check out loud: Am I stacked? Did I lean right? Was my checkout quiet? Did I hold without gripping?";

/* Shared finisher + skate-skill block builders */
const FINISHER = () => [
  X({ name: "Copenhagen Plank", block: "finisher", driver: "time", work: 35, eachSide: true,
      dose: "15–20s/side", reset: "Switch sides only.",
      cue: "Adductors actively working — edge control, not just hanging.",
      skateTransfer: "Edge / adductor control", searchableName: "copenhagen plank adductor" })
];

/* Skating-Skill block = Axis Micro + Spin Board (+ landing work).
   A = Spin/Push days (Tue/Fri); B = Single-Leg days (Mon/Thu); SAT = power days. */
const SKATESKILL_A = () => [
  X({ name: "Axis Micro", block: "skateskill", driver: "time", work: 60, dose: "~2 min + 4 self-checks",
      reset: "Crown over the skating foot.",
      cue: "Mirror balance + arm carriage. Run the 4 self-checks OUT LOUD: stacked? leaned right? quiet checkout? holding without gripping?",
      skateTransfer: "Axis / alignment", searchableName: "releve balance port de bras ballet" }),
  X({ name: "Spin Board Backspin Hold", block: "skateskill", driver: "reps", repsDetail: "10+ rotations ×3", dose: "10+ rot ×3", estSecs: 90,
      reset: "Crown up, free leg checked.",
      cue: "Backward one-foot / scratch spin on the board. You can't change feet on the board. Dizzy >30–45s → STOP.",
      skateTransfer: "Backspin position", searchableName: "off-ice spinner backward scratch spin" }),
  X({ name: "Spin Board Layback Hold", block: "skateskill", driver: "time", work: 40, dose: "10/15/20s on-ramp ×2",
      reset: "Upright first, then small layback.",
      cue: "Train the upright hold; add a small layback line. Keep the on-ramp progressing.",
      skateTransfer: "Layback line", searchableName: "off-ice spinner upright spin" }),
  X({ name: "Turn-and-Stick Single-Leg Landing", block: "skateskill", driver: "reps", repsDetail: "≤5/side ×2", dose: "≤5/side ×2", estSecs: 100,
      gate: "valgus", reset: "Crown up, free leg checked.",
      cue: "¼/½ turn, land on ONE foot, freeze 2s.",
      parentWatch: "Left-knee valgus / can't freeze", fix: "Reduce the turn.",
      skateTransfer: "Single-leg rotational landing", searchableName: "off-ice jump landing position hold one foot" })
];
const SKATESKILL_B = () => [
  X({ name: "Active Split Slide", block: "skateskill", driver: "time", work: 60, eachSide: true, dose: "3×20–30s/side",
      reset: "Own end-range only.",
      cue: "Slide to YOUR end-range — hips square. Never passive over-split or partner-pressed. Post-session only.",
      parentWatch: "Pelvis twists or pain", fix: "Back off the range.",
      skateTransfer: "Spiral / split line", searchableName: "active split flexibility drill" }),
  X({ name: "Active Hamstring Lengthening", block: "skateskill", driver: "reps", repsDetail: "5×3s/side", dose: "5×3s/side", estSecs: 55,
      reset: "Supine, raise the leg.",
      cue: "Hold the leg up with your OWN quad/hip-flexor — no hands pulling.",
      skateTransfer: "Active flexibility", searchableName: "active straight leg raise hamstring" }),
  X({ name: "Half-Kneeling Hip-Flexor Hold", block: "skateskill", driver: "time", work: 60, eachSide: true, dose: "30s/side",
      reset: "Posterior tilt, tall.",
      cue: "Tuck the pelvis, stay tall — serves spiral + layback line.",
      skateTransfer: "Hip-flexor length", searchableName: "half kneeling hip flexor stretch" }),
  X({ name: "Axis Micro", block: "skateskill", driver: "time", work: 40, dose: "4 self-checks + short layback",
      reset: "Crown over the skating foot.",
      cue: "Self-checks KEPT on split days (the drift instrument). 4 yes/no out loud. Add a short layback hold on-ramp ×2.",
      skateTransfer: "Axis / alignment", searchableName: "releve balance port de bras ballet" })
];
const SKATESKILL_SAT = () => [
  X({ name: "Axis Micro", block: "skateskill", driver: "time", work: 60, dose: "~3 min + 4 self-checks",
      reset: "Crown over the skating foot.",
      cue: "Short mirror Axis Micro + 4 self-checks out loud.",
      skateTransfer: "Axis / alignment", searchableName: "releve balance port de bras ballet" }),
  X({ name: "Active Split Slide", block: "skateskill", driver: "time", work: 40, eachSide: true, dose: "2×20s/side",
      reset: "Own end-range only.",
      cue: "Cooldown flexibility — active end-range, post-session only.",
      skateTransfer: "Spiral / split line", searchableName: "active split flexibility drill" })
];

const SCAP_HANG = () => [
  X({ name: "Scap Pull-Up + Dead Hang", block: "skateskill", driver: "time", work: 30, dose: "30s",
      reset: "Hang tall, shoulders ready.", cue: "Shoulders slide DOWN, hang and decompress.",
      skateTransfer: "Shoulder control / decompression", searchableName: "scapular pull up dead hang" })
];

/* Shared prep pairs (inserted after the Main block when present). */
const PREP_LANDING = () => [
  X({ name: "Monster Walk", block: "main", driver: "reps", repsDetail: "8 steps/dir ×2", dose: "8 steps/dir ×2", estSecs: 50,
      cue: "Band tension on, knees pushed OUT over the toes — guard the landing knee.",
      parentWatch: "Knees collapse inward", fix: "Smaller steps, keep tension.",
      skateTransfer: "Landing-knee control", searchableName: "monster walk lateral band walk" }),
  X({ name: "Side Plank Reach", block: "main", driver: "time", work: 40, eachSide: true, dose: "20s/side",
      cue: "Hips stacked and lifted, reach under and back.",
      parentWatch: "Hip drops", fix: "Lift the hip, shorten the reach.",
      skateTransfer: "Anti-side-bend / axis" })
];
const PREP_SHOULDER = () => [
  X({ name: "Band External Rotation", block: "main", driver: "reps", repsDetail: "12/side", dose: "12/side", estSecs: 75,
      cue: "Elbow pinned to the side, rotate slow.",
      parentWatch: "Elbow drifts off the ribs", fix: "Pin the elbow, slow down.",
      skateTransfer: "Shoulder durability" }),
  X({ name: "Side-Lying ER", block: "main", driver: "reps", repsDetail: "10/side", dose: "10/side", estSecs: 60,
      cue: "Second cuff angle — light, slow.",
      parentWatch: "Rushing / too heavy", fix: "Lighter, slower.",
      skateTransfer: "Shoulder durability" })
];

/* Coach-handoff + landing-fork notes shown on the skate-skill brief. */
export const COACH_HANDOFF = "Jump TIMING is an ICE skill — hand the coach: on-ice rotation timing, entry edges, and checkout under speed. Land builds the parts (landing leg, air position, spin posture); the ice assembles the timing.";
export const BREATH_DECISION = "Landing = land and FREEZE, knee over toe — never ride out a wobble to save the rep. A landing you can't hold for 2 seconds doesn't count. Coach preference overrides this.";

/* Intent words picked AFTER Round 1 (targets what R1 revealed). */
export const INTENT_WORDS = ["SHARP", "LOCK", "DRIVE", "HOLD", "PULL"];

export const DAYS = {
  monday: {
    title: "Single-Leg + Axis",
    subtitle: "PM · ice day · keep light, ice carries the jump load",
    badge: "MON",
    theme: "Single-Leg + Axis",
    tag: "SINGLE-LEG + AXIS",
    mantra: "Crown up. Land and freeze.",
    iceLoad: "pm",
    defaultLight: "green",
    timeLo: 22, timeHi: 28,
    equipment: ["Low step", "Mat", "Mirror", "Pull-up bar", "Mini band"],
    prSentinel: "Layback hold — longest clean seconds",
    blocks: {
      warmup: [
        X({ name: "Jump Rope", block: "warmup", driver: "time", work: 75, dose: "60–90s", cue: "Off the toes, quiet, tall." }),
        X({ name: "Cat-Camel", block: "warmup", driver: "reps", repsDetail: "8 cycles", dose: "8 cycles", estSecs: 35, cue: "Move segment by segment." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel nailed down — both ankles, right a touch deeper." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "8/dir/leg", dose: "8/dir/leg", estSecs: 75, cue: "Relaxed, build range." })
      ],
      coordination: [
        X({ name: "A-March", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Knee up, toe up, foot down under hip." }),
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Same pattern with rhythm." }),
        X({ name: "Lateral Shuffle → Stick", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "8m/side", cue: "Low, stop dead each end." })
      ],
      main: [
        X({ name: "Eccentric Step-Down", block: "main", driver: "reps", repsDetail: "5 · 4s lower/side", dose: "5 · 4s/side", estSecs: 70, gate: "valgus", faultAnchor: true,
            reset: "Slow lower, knee over toe.", cue: "Slow lower, knee over toe.",
            parentWatch: "Left-knee valgus", fix: "Shorter range.",
            skateTransfer: "Landing-leg control", searchableName: "single leg eccentric step down" }),
        X({ name: "SL-RDL", block: "main", driver: "reps", repsDetail: "6/side (R emphasis)", dose: "6/side", estSecs: 55,
            reset: "Hinge, flat back.", cue: "Hinge from the hip, flat back, R-side quality.",
            parentWatch: "Back rounds", fix: "Reduce range.",
            skateTransfer: "Hip hinge / posterior", searchableName: "single leg romanian deadlift bodyweight" }),
        X({ name: "Dead Bug", block: "main", driver: "reps", repsDetail: "8/side", dose: "8/side", estSecs: 60, faultAnchor: true,
            reset: "Back flat, exhale on extend.", cue: "Exhale as limbs extend, low back glued.",
            parentWatch: "Low back lifts off floor", fix: "Smaller range.",
            skateTransfer: "Anti-extension core", searchableName: "dead bug core exercise" }),
        X({ name: "Bird Dog", block: "main", driver: "reps", repsDetail: "8/side", dose: "8/side", estSecs: 60,
            reset: "Thoracic-led, length not crunch.", cue: "Reach long, no low-back arch.",
            parentWatch: "Low-back arches", fix: "Reset, lead from the upper back.",
            skateTransfer: "Posterior body line", searchableName: "bird dog exercise" })
      ],
      finisher: FINISHER(),
      skateskill: [...SKATESKILL_B(), ...SCAP_HANG()]
    },
    prepMenu: PREP_LANDING()
  },

  tuesday: {
    title: "Spin + Push/Carry",
    subtitle: "PM · ice day · skill + accessory, low CNS",
    badge: "TUE",
    theme: "Spin + Push/Carry",
    tag: "SPIN + PUSH/CARRY",
    mantra: "Quiet spins. Strong shoulders.",
    iceLoad: "pm",
    defaultLight: "green",
    timeLo: 20, timeHi: 26,
    equipment: ["Spinner board", "Resistance band", "Light weight", "Mat", "Mirror"],
    prSentinel: "Clean push-ups",
    blocks: {
      warmup: [
        X({ name: "Band Pass-Through", block: "warmup", driver: "reps", repsDetail: "8–10", dose: "8–10", estSecs: 30, cue: "Wide, no shrug." }),
        X({ name: "Wall Slides", block: "warmup", driver: "reps", repsDetail: "8", dose: "8", estSecs: 30, cue: "Back on wall, ribs down." }),
        X({ name: "90/90 Hip Switch", block: "warmup", driver: "reps", repsDetail: "6/side", dose: "6/side", estSecs: 40, cue: "Knees lead." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Carioca", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "10m/side", cue: "Hip over hip — trunk-hip separation." }),
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Rhythm, light." }),
        X({ name: "Skip for Height", block: "coordination", driver: "time", work: 60, dose: "8m", cue: "Drive knee + opposite arm." })
      ],
      main: [
        X({ name: "Push-up", block: "main", driver: "reps", repsDetail: "5–8 (incline if needed)", dose: "5–8", estSecs: 30,
            reset: "Ribs down, full range.", cue: "Ribs down, full range.",
            parentWatch: "Hips sag", fix: "Incline higher.",
            skateTransfer: "Pressing strength", searchableName: "push up progression incline" }),
        X({ name: "Suitcase Carry", block: "main", driver: "time", work: 40, eachSide: true, dose: "20s/side",
            reset: "Stand tall, one weight.", cue: "Don't side-bend — resist the lean right.",
            parentWatch: "Trunk tilts toward the weight", fix: "Lighter load.",
            skateTransfer: "Anti-lateral / axis", searchableName: "suitcase carry anti lateral core" }),
        X({ name: "Pallof Press", block: "main", driver: "reps", repsDetail: "12/side · 2s hold", dose: "12/side · 2s", estSecs: 100,
            reset: "Hips square.", cue: "Press out, resist the rotation.",
            parentWatch: "Hip rotates", fix: "Wider stance.",
            skateTransfer: "Anti-rotation core", searchableName: "pallof press band" }),
        X({ name: "Glute Bridge", block: "main", driver: "reps", repsDetail: "12 · 2s squeeze", dose: "12 · 2s", estSecs: 50,
            reset: "Squeeze the top.", cue: "Squeeze top, don't arch.",
            parentWatch: "Low-back arch", fix: "Reduce range.",
            skateTransfer: "Hip extension power", searchableName: "glute bridge exercise" })
      ],
      finisher: [],
      skateskill: SKATESKILL_A()
    },
    prepMenu: PREP_SHOULDER()
  },

  wednesday: {
    title: "POWER A — Jump + Pull + Drive",
    subtitle: "AM · NO ice · the real power day",
    badge: "WED",
    theme: "Jump + Pull + Drive",
    tag: "POWER A",
    mantra: "I am SHARP. I am STRONG. I can SKATE THIS.",
    iceLoad: "none",
    defaultLight: "green",
    timeLo: 30, timeHi: 35,
    equipment: ["Plyo box", "Pull-up bar", "Resistance band", "Mat"],
    prSentinel: "Pull-up clean reps (after 3 eccentric)",
    blocks: {
      warmup: [
        X({ name: "Jump Rope", block: "warmup", driver: "time", work: 90, dose: "90s", cue: "Reactive, quiet." }),
        X({ name: "Calf Raise", block: "warmup", driver: "reps", repsDetail: "12 · full range", dose: "12", estSecs: 40, cue: "Heel below the step." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "6–8/side", dose: "6–8/side", estSecs: 35, cue: "Open the hips (+ 90/90)." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Light, rhythmic — primes the jumps." })
      ],
      main: [
        X({ name: "Box Jump → Stick", block: "main", driver: "time", work: 30, dose: "30s · stick each", gate: "valgus", faultAnchor: true,
            reset: "Fast contact, freeze.", cue: "Fast contact, freeze 2s.",
            parentWatch: "Left-knee valgus / can't freeze", fix: "Drop a round tier.",
            skateTransfer: "Jump takeoff + landing", searchableName: "box jump stick landing" }),
        X({ name: "Skater Jump", block: "main", driver: "time", work: 30, dose: "30s · single→single", gate: "valgus",
            reset: "Full push.", cue: "Full push, land soft + freeze. Grade landing 1–5.",
            parentWatch: "Unstable past 2s", fix: "Shorten the distance.",
            skateTransfer: "Lateral push + single-leg landing", searchableName: "skater jump lateral bound landing" }),
        X({ name: "Rotational Jump w/ Frozen Landing", block: "main", driver: "reps", repsDetail: "≤6 · ¼→½→full · 2-foot", dose: "≤6", estSecs: 50, gate: "valgus",
            reset: "Crown up, free leg checked.", cue: "Crown up, free leg checked, freeze 2–3s.",
            parentWatch: "Free-leg flail", fix: "Reduce the turn.",
            skateTransfer: "Rotation + landing", searchableName: "off-ice rotation jump landing hold quarter half" }),
        X({ name: "Band Arm-Pull-In", block: "main", driver: "time", work: 20, dose: "20s · fast intent",
            reset: "Fast pull.", cue: "Fast pull, frozen finish.",
            parentWatch: "Loose finish", fix: "Slow down, fix the freeze.",
            skateTransfer: "Pull-in / rotation speed", searchableName: "off-ice rotation pull in drill arms" })
      ],
      finisher: [
        X({ name: "Resisted Band March", block: "finisher", driver: "time", work: 20, dose: "20s · drive knee",
            reset: "Band on hips, tall trunk.", cue: "Drive the knee fast, stay tall.",
            parentWatch: "Trunk leans", fix: "Slow down, square up.",
            skateTransfer: "Posterior-chain drive", searchableName: "resisted band march drive" }),
        X({ name: "Low Box Step-Up Drive", block: "finisher", driver: "reps", repsDetail: "6/side · low box", dose: "6/side", estSecs: 50, gate: "valgus",
            reset: "Whole-foot drive.", cue: "Drive through the whole foot, opposite knee up.",
            parentWatch: "Left-knee valgus", fix: "Lower box / stop.",
            skateTransfer: "Single-leg drive power", searchableName: "box step up drive knee" }),
        X({ name: "Pull-Up (heavy)", block: "finisher", driver: "reps", repsDetail: "3 × 4s ecc, then max clean", dose: "3 × 4s ecc + max", estSecs: 150,
            reset: "Depress shoulders first.", cue: "Shoulders down first. No failure, no kip.",
            parentWatch: "Swing / shrug", fix: "Dead-hang only.",
            skateTransfer: "Pulling strength", searchableName: "strict pull up eccentric lower" })
      ],
      skateskill: SKATESKILL_SAT()
    },
    prepMenu: []
  },

  thursday: {
    title: "Single-Leg + Core",
    subtitle: "PM · ice day · light, mirrors Monday",
    badge: "THU",
    theme: "Single-Leg + Core",
    tag: "SINGLE-LEG + CORE",
    mantra: "Crown up. Land and freeze.",
    iceLoad: "pm",
    defaultLight: "green",
    timeLo: 22, timeHi: 28,
    equipment: ["Low step", "Mat", "Mirror", "Resistance band", "Mini band"],
    prSentinel: "Single-leg eccentric hold seconds",
    blocks: {
      warmup: [
        X({ name: "Knee-to-Wall Ankle", block: "warmup", driver: "reps", repsDetail: "8/side both", dose: "8/side", estSecs: 40, cue: "Heel flat, knee past toes." }),
        X({ name: "Cat-Camel", block: "warmup", driver: "reps", repsDetail: "8 cycles", dose: "8 cycles", estSecs: 35, cue: "Segment by segment." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "8/dir/leg", dose: "8/dir/leg", estSecs: 75, cue: "Relaxed, build range." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Lateral Shuffle → Stick", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "8m/side", cue: "Low, dead stop." }),
        X({ name: "A-March", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Foot under hip." }),
        X({ name: "Carioca", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "10m/side", cue: "Hip-trunk separation." })
      ],
      main: [
        X({ name: "Eccentric Step-Down", block: "main", driver: "reps", repsDetail: "5 · 4s lower/side", dose: "5 · 4s/side", estSecs: 70, gate: "valgus", faultAnchor: true,
            reset: "Slow, knee over toe.", cue: "Slow lower, knee over toe.",
            parentWatch: "Left-knee valgus", fix: "Shorter range.",
            skateTransfer: "Landing-leg control", searchableName: "single leg eccentric step down" }),
        X({ name: "SL-RDL", block: "main", driver: "reps", repsDetail: "6/side (R)", dose: "6/side", estSecs: 55,
            reset: "Flat back, hinge.", cue: "Hinge from the hip, flat back.",
            parentWatch: "Back rounds", fix: "Reduce range.",
            skateTransfer: "Hip hinge / posterior", searchableName: "single leg romanian deadlift bodyweight" }),
        X({ name: "Dead Bug", block: "main", driver: "reps", repsDetail: "8/side", dose: "8/side", estSecs: 60, faultAnchor: true,
            reset: "Exhale, back glued.", cue: "Exhale as limbs extend, low back glued.",
            parentWatch: "Low back lifts", fix: "Smaller range.",
            skateTransfer: "Anti-extension core", searchableName: "dead bug core exercise" }),
        X({ name: "Bird Dog", block: "main", driver: "reps", repsDetail: "8/side", dose: "8/side", estSecs: 60,
            reset: "Thoracic-led, length not crunch.", cue: "Reach long, no low-back arch.",
            parentWatch: "Low-back arches", fix: "Reset, lead from the upper back.",
            skateTransfer: "Posterior body line", searchableName: "bird dog exercise" })
      ],
      finisher: [
        X({ name: "Pallof Press", block: "finisher", driver: "reps", repsDetail: "12/side · 2s hold", dose: "12/side · 2s", estSecs: 100,
            reset: "Hips square.", cue: "Press out, resist the twist.",
            parentWatch: "Hip rotates", fix: "Wider stance.",
            skateTransfer: "Anti-rotation core", searchableName: "pallof press band" }),
        X({ name: "Copenhagen Plank", block: "finisher", driver: "time", work: 35, eachSide: true, dose: "15–20s/side",
            reset: "Switch sides only.", cue: "Adductors actively working — edge control.",
            skateTransfer: "Edge / adductor control", searchableName: "copenhagen plank adductor" })
      ],
      skateskill: SKATESKILL_B()
    },
    prepMenu: PREP_LANDING()
  },

  friday: {
    title: "Spin + Push/Carry",
    subtitle: "PM · ice day · save energy for Saturday",
    badge: "FRI",
    theme: "Spin + Push/Carry",
    tag: "SPIN + PUSH/CARRY",
    mantra: "Sweat in training, no tears in competition.",
    iceLoad: "pm",
    defaultLight: "green",
    timeLo: 20, timeHi: 26,
    equipment: ["Spinner board", "Resistance band", "Light weight", "Mat", "Mirror", "Pull-up bar"],
    prSentinel: "Clean push-ups OR layback hold",
    blocks: {
      warmup: [
        X({ name: "Jump Rope", block: "warmup", driver: "time", work: 75, dose: "60–90s", cue: "Off the toes, quiet." }),
        X({ name: "Band Pass-Through", block: "warmup", driver: "reps", repsDetail: "8–10", dose: "8–10", estSecs: 30, cue: "Wide, no shrug." }),
        X({ name: "90/90 Hip Switch", block: "warmup", driver: "reps", repsDetail: "6/side", dose: "6/side", estSecs: 40, cue: "Knees lead." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Skip for Height", block: "coordination", driver: "time", work: 60, dose: "8m", cue: "Knee + opposite arm drive." }),
        X({ name: "Carioca", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "10m/side", cue: "Hip over hip." }),
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Light, rhythmic." })
      ],
      main: [
        X({ name: "Push-up", block: "main", driver: "reps", repsDetail: "5–8 (incline if needed)", dose: "5–8", estSecs: 30,
            reset: "Ribs down, full range.", cue: "Ribs down, full range.",
            parentWatch: "Hips sag", fix: "Incline higher.",
            skateTransfer: "Pressing strength", searchableName: "push up progression incline" }),
        X({ name: "Suitcase Carry", block: "main", driver: "time", work: 40, eachSide: true, dose: "20s/side",
            reset: "Stand tall, one weight.", cue: "Don't side-bend — resist the lean right.",
            parentWatch: "Trunk tilts toward the weight", fix: "Lighter load.",
            skateTransfer: "Anti-lateral / axis", searchableName: "suitcase carry anti lateral core" }),
        X({ name: "Pallof Press", block: "main", driver: "reps", repsDetail: "12/side · 2s hold", dose: "12/side · 2s", estSecs: 100,
            reset: "Hips square.", cue: "Press out, resist the rotation.",
            parentWatch: "Hip rotates", fix: "Wider stance.",
            skateTransfer: "Anti-rotation core", searchableName: "pallof press band" }),
        X({ name: "Glute Bridge", block: "main", driver: "reps", repsDetail: "12 · 2s squeeze", dose: "12 · 2s", estSecs: 50,
            reset: "Squeeze the top.", cue: "Squeeze top, don't arch.",
            parentWatch: "Low-back arch", fix: "Reduce range.",
            skateTransfer: "Hip extension power", searchableName: "glute bridge exercise" })
      ],
      finisher: [],
      skateskill: [...SKATESKILL_A(), ...SCAP_HANG()]
    },
    prepMenu: PREP_SHOULDER()
  },

  saturday: {
    title: "POWER B — Jump + Pull + Drive",
    subtitle: "AM · NO ice · second power day, 72h from Wed",
    badge: "SAT",
    theme: "Jump + Pull + Drive",
    tag: "POWER B",
    mantra: "I am SHARP. I am STRONG. I can SKATE THIS.",
    iceLoad: "none",
    defaultLight: "green",
    timeLo: 30, timeHi: 35,
    equipment: ["Plyo box", "Pull-up bar", "Resistance band", "Mat"],
    prSentinel: "Rotational-jump landing grade 1–5",
    blocks: {
      warmup: [
        X({ name: "Jump Rope", block: "warmup", driver: "time", work: 90, dose: "90s", cue: "Reactive, quiet." }),
        X({ name: "Calf Raise", block: "warmup", driver: "reps", repsDetail: "12 · full range", dose: "12", estSecs: 40, cue: "Heel below the step." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "8/dir/leg", dose: "8/dir/leg", estSecs: 75, cue: "Open the hips." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Skip for Height", block: "coordination", driver: "time", work: 60, dose: "8m", cue: "Explosive — primes the jumps." })
      ],
      main: [
        X({ name: "Lateral Bound → Stick", block: "main", driver: "time", work: 30, dose: "30s · stick each", gate: "valgus", faultAnchor: true,
            reset: "Stillness is the training.", cue: "Push laterally, land and FREEZE 2s.",
            parentWatch: "Continuous bounce", fix: "Hold each landing.",
            skateTransfer: "Lateral power + landing", searchableName: "lateral bound stick landing drill" }),
        X({ name: "Skater Jump", block: "main", driver: "time", work: 30, dose: "30s", gate: "valgus",
            reset: "Full push.", cue: "Full push, freeze. Grade landing 1–5.",
            parentWatch: "Unstable past 2s", fix: "Shorten the distance.",
            skateTransfer: "Lateral push + single-leg landing", searchableName: "skater jump lateral bound landing" }),
        X({ name: "Rotational Jump w/ Frozen Landing", block: "main", driver: "reps", repsDetail: "≤6 · progress turn", dose: "≤6", estSecs: 50, gate: "valgus",
            reset: "Crown up, free leg checked.", cue: "Crown up, freeze 2–3s.",
            parentWatch: "Free-leg flail", fix: "Reduce the turn.",
            skateTransfer: "Rotation + landing", searchableName: "off-ice rotation jump landing hold quarter half" }),
        X({ name: "Band Arm-Pull-In", block: "main", driver: "time", work: 20, dose: "20s", reset: "Fast pull.",
            cue: "Fast pull, frozen finish.",
            parentWatch: "Loose finish", fix: "Slow down, fix the freeze.",
            skateTransfer: "Pull-in / rotation speed", searchableName: "off-ice rotation pull in drill arms" })
      ],
      finisher: [
        X({ name: "Resisted Band March", block: "finisher", driver: "time", work: 20, dose: "20s",
            reset: "Band on hips, tall trunk.", cue: "Drive the knee, stay tall.",
            parentWatch: "Trunk leans", fix: "Square up.",
            skateTransfer: "Posterior-chain drive", searchableName: "resisted band march drive" }),
        X({ name: "Low Box Step-Up Drive", block: "finisher", driver: "reps", repsDetail: "6/side", dose: "6/side", estSecs: 50, gate: "valgus",
            reset: "Whole-foot drive.", cue: "Drive through the whole foot.",
            parentWatch: "Left-knee valgus", fix: "Lower box / stop.",
            skateTransfer: "Single-leg drive power", searchableName: "box step up drive knee" }),
        X({ name: "Pull-Up (heavy)", block: "finisher", driver: "reps", repsDetail: "3 × 4s ecc + max clean", dose: "3 × 4s ecc + max", estSecs: 150,
            reset: "Depress shoulders first.", cue: "No failure, no kip.",
            parentWatch: "Swing / shrug", fix: "Dead-hang only.",
            skateTransfer: "Pulling strength", searchableName: "strict pull up eccentric lower" }),
        X({ name: "Bird Dog", block: "finisher", driver: "reps", repsDetail: "8/side (3rd weekly)", dose: "8/side", estSecs: 60,
            reset: "Thoracic-led.", cue: "Reach long, no low-back arch.",
            parentWatch: "Low-back arches", fix: "Reset, lead from the upper back.",
            skateTransfer: "Posterior body line", searchableName: "bird dog exercise" })
      ],
      skateskill: SKATESKILL_SAT()
    },
    prepMenu: []
  },

  sunday: {
    title: "Foam Roll + Review — Recovery Only",
    subtitle: "No training · recovery + weekly look-back",
    badge: "SUN",
    theme: "Recovery",
    tag: "",
    mantra: "Rest IS training.",
    iceLoad: "none",
    defaultLight: "recovery",
    timeLo: 10, timeHi: 14,
    spa: true,
    equipment: ["Foam roller", "Massage gun (parent-operated)", "Mat"],
    safety: "Foam roll slow (2–3 cm/sec), pause 20s on tender spots. NEVER roll the lower-back spine or neck — parent-guided. Massage gun is PARENT-OPERATED only, lowest speed, big muscles only — never on bones, joints, spine, neck, or growth plates.",
    recovery: [
      { name: "Calves — foam roller", block: "recovery", dose: "60s/side", why: "Jump rope + landing volume lands here." },
      { name: "Quads — roller or gun", block: "recovery", dose: "60s/side", why: "Power days (Wed/Sat)." },
      { name: "Glutes — foam roller", block: "recovery", dose: "45s/side", why: "Drive + landing absorption." },
      { name: "Lats / upper back — roller, arms overhead", block: "recovery", dose: "60s", why: "Pull work + overhead range." },
      { name: "Touch-up — massage gun (parent)", block: "recovery", dose: "30–45s/muscle", why: "Lowest speed, comfort not pain. No spine/neck." }
    ],
    recoveryHolds: [
      X({ name: "Hip CARs", block: "skateskill", driver: "reps", repsDetail: "3/dir each side", dose: "3/dir", estSecs: 60, cue: "Gentle, controlled rotations." }),
      X({ name: "Superman", block: "skateskill", driver: "time", work: 24, dose: "3×8s", cue: "Thoracic extension — length, not crunch.", searchableName: "superman thoracic extension hold" }),
      X({ name: "Active Split Slide", block: "skateskill", driver: "time", work: 60, eachSide: true, dose: "3×20–30s/side", cue: "Own end-range, hips square — never passive over-split.", searchableName: "active split flexibility drill" }),
      X({ name: "Half-Kneeling Hip-Flexor Hold", block: "skateskill", driver: "time", work: 60, eachSide: true, dose: "30s/side", cue: "Posterior tilt, tall — spiral + layback line.", searchableName: "half kneeling hip flexor stretch" })
    ],
    blocks: { warmup: [], coordination: [], main: [], finisher: [], skateskill: [] },
    prepMenu: []
  }
};

export const STANDING_RULES = [
  "No-Debt / Stop: a missed day is never doubled. Quality over quantity.",
  "Valgus gate: jumps stay at Box Jump → Stick until landings are clean — left-knee tracks over the toe.",
  "Jump fatigue gate: 2 poor landings in a row → drop one round tier (🟢→🟡→🔴).",
  "Spin dizziness stop: dizzy >30–45s, nausea, headache, or balance worse after → stop the spin block.",
  "Pull Series: 2× heavy / 1–2× scap / NEVER to failure. Kip or swing → dead-hang only.",
  "Bilateral ankle gate (right deeper): Ankle Rock first every session before single-leg / loaded work.",
  "Coordination always FRESH — first after warm-up, never to fatigue."
];

export const ENGAGEMENT_SYSTEMS = {
  peer: { label: "Peer Challenge vs Parent", desc: "Same timer/drill, parent genuinely tries. Compare after both are done." },
  roleflip: { label: "Role Flip", desc: "Jenn demos one exercise + gives the parent ONE coaching cue before the round." }
};

/* ------------------------------------------------------------
   Day keys — repo uses monday..sunday; the design's week strip
   runs Mon-first with short keys. One mapping, applied everywhere.
   ------------------------------------------------------------ */
export const WEEK_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export const DAY_SHORT = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun"
};
export const DAY_LONG = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday"
};

export const BLOCK_ORDER = ["warmup", "coordination", "main", "finisher", "skateskill"];
export const BLOCK_LABEL = {
  warmup: "Warm-up", coordination: "Coordination", main: "Main Circuit",
  prep: "Prep Pair", finisher: "Finisher", skateskill: "Skate-Skill", recovery: "Recovery"
};
/* Per-block emoji + token color so the kid always knows which part she's in. */
export const BLOCK_META = {
  warmup:       { emoji: "🔥", color: "var(--coral)",  wash: "var(--coral-wash)",  ink: "var(--coral-ink)" },
  coordination: { emoji: "⚡", color: "var(--sun)",    wash: "var(--sun-wash)",    ink: "var(--sun-ink)" },
  main:         { emoji: "💪", color: "var(--sea)",    wash: "var(--sea-wash)",    ink: "var(--sea-ink)" },
  prep:         { emoji: "🎯", color: "var(--grape)",  wash: "var(--grape-wash)",  ink: "var(--grape-ink)" },
  finisher:     { emoji: "🪝", color: "var(--mint)",   wash: "var(--mint-wash)",   ink: "var(--mint-ink)" },
  skateskill:   { emoji: "⛸️", color: "var(--aqua)",   wash: "var(--aqua-wash)",   ink: "var(--aqua-ink)" },
  recovery:     { emoji: "🧊", color: "var(--grape)",  wash: "var(--grape-wash)",  ink: "var(--grape-ink)" }
};

export const MIN_REST = 3;
export const SIDE_SWITCH_BUFFER = 5;
export const ROUND_REST = 25;   // flat all weeks (settings can override)

/* ============================================================
   SKATE WITH GRACE DESIGN DATA — journey ranks, lore, prizes, readiness.
   ============================================================ */

export const CHEERS = [
  "Boom — that was awesome! 🌟", "Sparkly form, keep it up! ✨", "Big energy. Love it! 💪",
  "You stayed steady. Nice! ❄️", "Clean round — power and grace! ⛸️"
];

/* Rank ladder — the same 18 rungs at the same levels as the swim app, so that
   "level 12" and "the seventh rank" mean the same amount of work in both
   sisters' timers. The rung LEVELS moved when the level curve became shared:
   the old spacing (1,3,5,8,12,16,21,26,31,36,41,46,50,55,60,65,70,75) was
   drawn for a curve that cost a third as much, and on that curve the top rung
   would now cost 180,760 XP — somewhere in 2029. The names, order and stories
   are untouched.

   The top three (41/46/50) extend the summit past Ice Legend. Reason: at the
   real 6-day training pace (~1,180 XP/week) level 36 arrived only ~13 weeks
   into the program, which put the whole ladder out of reach of the intended
   December horizon. Raising the ceiling — rather than re-pricing levels or
   clawing XP back — is the only lever that lands the summit in December
   WITHOUT moving an already-earned level backwards. */
export const LADDER = [
  { level: 1,  name: "First Glide",    icon: "❄️", habitat: "#F5C2CE" },
  { level: 3,  name: "Snowflake",      icon: "❄️", habitat: "#E8EEF7" },
  { level: 6,  name: "Frost Spinner",  icon: "🌀", habitat: "#C9D8F0" },
  { level: 9,  name: "Edge Dancer",    icon: "⛸️", habitat: "#D9A7B8" },
  { level: 12, name: "Axel Rising",    icon: "🌟", habitat: "#E8B54D" },
  { level: 15, name: "Ice Star",       icon: "⭐", habitat: "#C77A93" },
  { level: 18, name: "Rink Royalty",   icon: "👑", habitat: "#B0486B" },
  { level: 21, name: "Crystal Blade",  icon: "💎", habitat: "#9FD8EA" },
  { level: 24, name: "Aurora Edge",    icon: "🌌", habitat: "#8E7CC3" },
  { level: 26, name: "Ice Legend",     icon: "🏆", habitat: "#F2C14E" },
  { level: 29, name: "Comet Spiral",   icon: "☄️", habitat: "#5B6ABF" },
  { level: 32, name: "Solstice Flame", icon: "🔥", habitat: "#E8703A" },
  { level: 35, name: "Eternal Edge",   icon: "♾️", habitat: "#A8E6DF" },
  { level: 38, name: "Snow Petrel",    icon: "🕊️", habitat: "#DDE7F2" },
  { level: 41, name: "Frost Flower",   icon: "🌸", habitat: "#F2D6E4" },
  { level: 44, name: "Midnight Sun",   icon: "☀️", habitat: "#F4B860" },
  { level: 47, name: "Glacier Heart",  icon: "🏔️", habitat: "#7FB2D9" },
  { level: 50, name: "Winter Sovereign", icon: "👑", habitat: "#C9A227" }
];

/* The final rung — nothing above this level changes rank, so the UI can
   honestly say "you're at the summit" instead of teasing a next rank. */
export const MAX_LEVEL = LADDER[LADDER.length - 1].level;

// Each rank gets a rich story chapter + a skating tie-in + a real ice/winter fact.
// Future ranks stay locked (mystery cards) so there's always something to discover.
export const RANK_LORE = {
  "First Glide":   { chapter: "Chapter 1 · The Frozen Pond", story: "Every champion's story starts with one push. The first glide is wobbly and short — and that's exactly how it's supposed to be. You showed up, you pushed off, and the ice remembered you. Courage comes before skill, always.", skate: "This is your body learning to balance over one blade — the base of everything.", fact: "Ice is slippery because your blade melts a micro-thin layer of water as it glides — you're really skating on water!" },
  "Snowflake":     { chapter: "Chapter 1 · The Frozen Pond", story: "No two snowflakes are the same — and no two skaters are either. You've stopped copying and started finding YOUR way of moving: your rhythm, your carriage, your line. Light, unique, unafraid to fall and float back up.", skate: "Soft knees and light landings — falling quietly is a skill, and you're building it.", fact: "Every snowflake has exactly six sides, but scientists have never found two identical ones." },
  "Frost Spinner": { chapter: "Chapter 2 · The Practice Rink", story: "The world blurs, but you don't. A spinner learns the biggest secret on the ice: the calmer your centre, the faster you can turn. While everything whirls around you, your crown stays tall and your core stays quiet.", skate: "Your spin-board holds become real spins here — centred, stacked, unhurried.", fact: "Elite skaters spin up to 6 times per second — faster than a ceiling fan — and train their brains to ignore the dizziness." },
  "Edge Dancer":   { chapter: "Chapter 2 · The Practice Rink", story: "Now the blade sings. An edge dancer doesn't fight the ice — she leans into it and lets the curve carry her. Inside edge, outside edge, one smooth line into the next. This is where skating stops being steps and starts being dancing.", skate: "Copenhagen planks and suitcase carries built this: your edges hold because your middle does.", fact: "A skating blade has TWO edges with a hollow groove between them — every curve you carve uses just one edge at a time." },
  "Axel Rising":   { chapter: "Chapter 3 · The Cold Air", story: "The axel is the only jump that takes off facing FORWARD — a leap of pure bravery into an extra half-turn. Rising means you're not afraid of the hard thing anymore; you take off toward it. Land, freeze, smile, again.", skate: "Every Box Jump → Stick and frozen landing was practice for this exact moment.", fact: "The axel is named after Axel Paulsen, who first landed it in 1882 — on speed-skating blades!" },
  "Ice Star":      { chapter: "Chapter 3 · The Cold Air", story: "A star doesn't shine because someone is watching — it shines because that's what it is. Your practice habits glow now: you check your own axis, grade your own landings, coach your own corrections. The work became part of you.", skate: "The 4 self-checks out loud — stacked, no lean, quiet checkout, no gripping — are YOUR voice now.", fact: "Starlight you see tonight left its star years ago — steady work, like starlight, shows up later and lasts." },
  "Rink Royalty":  { chapter: "Chapter 4 · The Big Ice", story: "The rink is yours now. Royalty isn't about a crown — it's about how you carry yourself when a program gets hard: tall, calm, generous to other skaters, brave on the big ice. Younger skaters watch how you practice. That's the real crown.", skate: "Strength, spins, landings, and grace — the whole week's work, skating as one.", fact: "Olympic rinks are 30×60 metres — big enough that a full program can cover more than a kilometre of skating." },
  "Crystal Blade": { chapter: "Chapter 4 · The Big Ice", story: "A crystal forms under pressure, slowly, layer by layer — and comes out harder and clearer than everything around it. Seasons of practice pressed you into something rare: precision that looks effortless because it isn't.", skate: "Your jump landings freeze crystal-still now — 2 whole seconds, knee over toe, every time.", fact: "Glacier ice looks deep blue because centuries of pressure squeeze out every air bubble — the clearest ice is the oldest." },
  "Aurora Edge":   { chapter: "Chapter 5 · The Midnight Ice", story: "Some nights the sky itself dances. The aurora doesn't perform for anyone — it moves because the energy inside it has to come out. Your skating is like that now: power and artistry in the same breath, impossible to look away from.", skate: "Spirals, laybacks, split lines — flexibility you OWN, held by your own strength.", fact: "The northern lights happen when particles from the sun crash into the sky 100 km up — nature's own light show over the ice." },
  "Ice Legend":    { chapter: "Chapter 5 · The Midnight Ice", story: "Legends aren't born on competition day. They're built on quiet Tuesday drylands, on landings frozen when nobody was watching, on getting up one more time than falling down. You did the work every single day — and now the ice tells your story.", skate: "Everything you built — axis, edges, spins, jumps, grace — all in one skater.", fact: "The oldest ice skates ever found are over 3,000 years old, carved from horse bones — skating is one of humanity's oldest joys." },
  "Comet Spiral":  { chapter: "Chapter 6 · The Long Winter", story: "A comet only gets its tail when it comes close to the fire — the pressure is what makes it visible. You're past the part where anyone is impressed by talent. What people see now is the long, bright trail of every session behind you, and it's the trail that makes the light.", skate: "Spirals held long and calm at full speed, because the engine underneath never runs out.", fact: "Halley's Comet takes about 76 years to come back around — some things are worth waiting years for, and worth the trip." },
  "Solstice Flame":{ chapter: "Chapter 6 · The Long Winter", story: "The solstice is the longest, darkest night of the whole year — and it's exactly when the light starts coming back. This rank belongs to the skater who kept training through the cold months when it was hard to get up, hard to care, hard to keep going. You carried your own flame through the dark part.", skate: "Full programs with power left in the tank at the end — winter conditioning showing up on the ice.", fact: "The winter solstice around Dec 21 is the shortest day of the year, and every single day after it is brighter than the last." },
  "Eternal Edge":  { chapter: "Chapter 7 · The Far Ice", story: "Here is the secret the edge was keeping: it doesn't end. Skaters who get this far stop asking how much further there is to go, because the answer stopped mattering — they'd skate anyway. You're past the part where a ladder is what keeps you going, and the ice ahead is wide open.", skate: "Everything is yours now: axis, edges, spins, jumps, grace. From here you're refining a skater, not building one.", fact: "Antarctic ice sheets hold ice that has been frozen for over 800,000 years — the deepest ice keeps the longest record." },
  "Snow Petrel":   { chapter: "Chapter 8 · Beyond the Rink", story: "A snow petrel is a small white bird that flies straight into blizzards on purpose. It doesn't wait for the weather to be kind — it has learned to read the wind so well that rough air carries it instead of knocking it down. That's you on the days that used to stop you.", skate: "Bad ice, cold rinks, early mornings, tired legs — none of them change how you skate any more.", fact: "Snow petrels nest up to 300 km inland in Antarctica, farther from open water than almost any other bird on Earth." },
  "Frost Flower":  { chapter: "Chapter 8 · Beyond the Rink", story: "Frost flowers grow on brand-new sea ice when the air is far colder than the water — tiny crystal blooms built out of nothing but vapour, in the harshest place there is. They only appear because the conditions are brutal. Your best skating is made of the same stuff: it exists because the hard days happened.", skate: "The delicate parts — carriage, hands, the finish of a spiral — held together by everything underneath.", fact: "Frost flowers bloom on young sea ice in still, bitter cold, each one grown from vapour in a few hours — and gone just as fast." },
  "Midnight Sun":  { chapter: "Chapter 9 · The Endless Season", story: "Far enough north, the sun stops setting. For weeks the light just keeps going, and the day has no edge to it at all. That's what your practice has become — not a thing you start and stop, but something always running quietly underneath everything else.", skate: "Training stopped being an event on the calendar. It's just how you live now.", fact: "North of the Arctic Circle the sun stays above the horizon for weeks — and at the North Pole itself, for six straight months." },
  "Glacier Heart": { chapter: "Chapter 9 · The Endless Season", story: "A glacier looks like it's standing still. It isn't — it is moving, every hour, with more force than anything else on land, carving valleys out of mountains because it simply never stops. Nobody watching sees it happen. Everybody sees what it made.", skate: "Years of quiet work showing up as something people can see from across the rink.", fact: "Glaciers really do flow — some surge more than 20 metres in a single day — and the ice at the bottom can be thousands of years old." },
  "Winter Sovereign": { chapter: "Chapter 9 · The Endless Season", story: "The very top. Not because you beat anyone — because you kept going long after the ladder stopped being the reason. Winter belongs to the skater who was still showing up when it was dark at four in the afternoon and nobody would have noticed if she hadn't. There is nothing above this one. Go skate for the love of it.", skate: "Nothing left to prove on this ladder. Every session from here is yours to spend how you like.", fact: "Figure skating was the FIRST winter sport in the Olympics — it appeared at the 1908 Summer Games in London, sixteen years before the first Winter Olympics existed." }
};
export const RANK_TEASE = {
  "Snowflake": "Something one-of-a-kind is drifting closer…", "Frost Spinner": "A calm centre in a spinning world awaits…",
  "Edge Dancer": "The blade is learning to sing…", "Axel Rising": "A brave forward leap lies ahead…",
  "Ice Star": "A steady glow is starting to shine…", "Rink Royalty": "A crown waits on the big ice…",
  "Crystal Blade": "Something rare is forming under pressure…", "Aurora Edge": "The midnight sky is starting to dance…",
  "Ice Legend": "The legend of the ice awaits at the very top…",
  "Comet Spiral": "Something is burning a long bright trail out past the legend…",
  "Solstice Flame": "A flame that only lights on the year's darkest night…",
  "Eternal Edge": "Past the legend the ice keeps going — nobody has said how far…",
  "Snow Petrel": "Something small and white flies straight into the storm…",
  "Frost Flower": "Something delicate grows where it has no right to…",
  "Midnight Sun": "Somewhere ahead, the light stops going out…",
  "Glacier Heart": "Something enormous is moving, too slowly to see…",
  "Winter Sovereign": "The very summit. No one has told you what's up there yet…"
};

// Level-up prize pool — a grown-up curates this in Settings.
// Default rewards lean on experiences, privileges, and autonomy rather than food
// or screen time — linking a child's training to food ("earn dessert") or iPad
// bargaining is a pattern child-sport psychologists caution against. Grown-ups
// can still add whatever they like in Settings; this is only the starting pool.
export const PRIZE_POOL = [
  { icon: "🎡", label: "Plan a weekend outing" },
  // `qty` caps how many of a prize exist. Chore skips are a finite supply of
  // six: each one won burns one, and at zero the prize stops being dealt.
  // A prize with no qty is unlimited.
  { icon: "✨", label: "Skip one chore", qty: 6 },
  { icon: "⚽", label: "+30 min play time" },
  { icon: "🎬", label: "Family movie pick" },
  { icon: "🛌", label: "Stay up 20 min later" },
  { icon: "🎯", label: "Choose the next family activity" },
  { icon: "⛸️", label: "Pick a fun game at practice" },
  { icon: "🎨", label: "One-on-one time with a grown-up" }
];

/* XP cost of going from level n to n+1 — SHARED with the swim app, so that a
   level means the same amount of work in both sisters' timers.

   This replaced the old V2 curve, 100 + (n-1)*20, which was roughly a third of
   the swim app's price per level. That made the two apps' numbers meaningless
   next to each other: level 18 here was less XP than level 12 there. Re-pricing
   moves an already-earned level — the one thing this file otherwise never does
   — and it moved this skater from level 18 to level 8 on the day it shipped.
   Her XP did not change; only what a level costs did.

   Being shared, it is frozen for the same reason it always was: change it in
   one app and the two drift apart again, and somebody's level moves. */
export function levelCost(n) {
  if (n <= 8) return 500 + (n - 1) * 30;
  if (n <= 17) return 1000 + (n - 9) * 45;
  return 1500 + (n - 18) * 50;
}
export function fmtXp(n) { return Math.round(n).toLocaleString("en-US"); }
/* Rank for a given level — highest ladder entry at or below the level. */
export function rankForLevel(level) {
  let rank = LADDER[0];
  for (const r of LADDER) if (level >= r.level) rank = r;
  return rank;
}

export const COACH_VOICE_ITEMS = [
  "Count your time", "Tell you the next exercise", "Remind you to breathe",
  "Warn about common mistakes", "Prompt a self-check"
];

/* ------------------------------------------------------------
   READINESS CHECK (4-Q + body map).
   ------------------------------------------------------------ */
export const READINESS_QS = [
  { id: "q_pain",  text: "Any aches or sore spots today?", isPain: true, yesLabel: "😊 All good", noLabel: "😣 A bit sore" },
  { id: "q_sleep", text: "How well did you sleep last night?", yesLabel: "😴 Good", noLabel: "🥱 Not great" },
  { id: "q_light", text: "How do your muscles feel from your last skate?", yesLabel: "💪 Fresh", noLabel: "😮‍💨 Tired" },
  { id: "q_ready", text: "What's your energy like right now?", yesLabel: "⚡ Full", noLabel: "💤 Low" }
];

// Anatomically distinct front vs. back regions — only true shared joints
// (head/neck, shoulders, arms, knees) carry one zone number across both views.
export const BODY_ZONES = [
  { n: 1,  label: "Head",         group: "shared" },
  { n: 17, label: "Neck",         group: "shared" },
  { n: 2,  label: "Shoulders",    group: "shared" },
  { n: 3,  label: "Arms",         group: "shared" },
  { n: 4,  label: "Knees",        group: "shared" },
  { n: 5,  label: "Chest / Ribs", group: "front" },
  { n: 6,  label: "Abs / Core",   group: "front" },
  { n: 7,  label: "Hip / Groin",  group: "front" },
  { n: 8,  label: "Quads (Front Thigh)", group: "front" },
  { n: 9,  label: "Shin",         group: "front" },
  { n: 10, label: "Ankle / Foot", group: "front" },
  { n: 11, label: "Upper Back",   group: "back" },
  { n: 12, label: "Lower Back",   group: "back" },
  { n: 13, label: "Glutes",       group: "back" },
  { n: 14, label: "Hamstrings (Back Thigh)", group: "back" },
  { n: 15, label: "Calf",         group: "back" },
  { n: 16, label: "Achilles / Heel", group: "back" }
];

export const SEVERITY_LEVELS = [
  { level: 1, emoji: "🙂", label: "OK",                   color: "var(--mint)",  desc: "Moved normally. Both sides feel similar." },
  { level: 2, emoji: "😐", label: "Tired but controlled", color: "var(--sun)",   desc: "Tired or shaky, but still controlled. Better after 1–2 minutes rest." },
  { level: 3, emoji: "😟", label: "Changed movement",     color: "var(--coral)", desc: "Limp, lean, twist, shake, or less range. Tell coach or parent." },
  { level: 4, emoji: "🥺", label: "Pain / Stop",          color: "var(--stop)",  desc: "Pain, sharp pain, swelling, numbness, tingling, or affects normal activity. Stop now." }
];

// Unified colored-circle icon set (🟢🟡🔴🟣). The CTA carries the light's OWN
// color — a red-light day shows a warm caution button, not the same yellow as
// a green day — so the safety signal survives all the way to the action.
export const LIGHT_META = {
  green:    { emoji: "🟢", color: "var(--mint)",  btnColor: "var(--mint)",  btnDeep: "var(--mint-deep)",  btnText: "#fff",           btnIcon: "💪", label: "Green Light — Full power!",  btnLabel: "Start Training!", desc: "You're good to go! Full 3 rounds. Focus on quality." },
  yellow:   { emoji: "🟡", color: "var(--sun)",   btnColor: "var(--sun)",   btnDeep: "var(--sun-deep)",   btnText: "var(--sun-ink)", btnIcon: "❄️", label: "Yellow Light — Go easy",     btnLabel: "Start Training!", desc: "2 rounds max. Listen to your body — clean form over effort." },
  red:      { emoji: "🔴", color: "var(--stop)",  btnColor: "var(--coral)", btnDeep: "var(--coral-deep)", btnText: "#fff",           btnIcon: "💙", label: "Red Light — Light day",      btnLabel: "Start easy day",  desc: "1 round only. Something feels off — take it easy today." },
  recovery: { emoji: "🟣", color: "var(--grape)", btnColor: "var(--grape)", btnDeep: "var(--grape-deep)", btnText: "#fff",           btnIcon: "🧊", label: "Recovery — Rest is training", btnLabel: "Start Recovery",  desc: "Rest day. Tell a grown-up, then stretch and hydrate." }
};

export const BODY_RESULTS = {
  1: { emoji: "✅", color: "var(--mint)",  desc: "You are OK. Keep moving with control.",          cta: "Continue to Training",    ctaIcon: "💪", ctaColor: "var(--mint)", ctaDeep: "var(--mint-deep)", ctaText: "#fff", action: "continue" },
  2: { emoji: "⏱️", color: "var(--sun)",   desc: "Take 1–2 minutes rest, then go easy — 2 rounds max, clean form.", cta: "Start easy — Yellow light", ctaIcon: "💛", ctaColor: "var(--sun)", ctaDeep: "var(--sun-deep)", ctaText: "var(--sun-ink)", action: "continue", secondary: "retry", secondaryLabel: "Rest 1–2 min, then re-check" },
  3: { emoji: "🗣️", color: "var(--coral)", desc: "Tell your coach or parent first. If they say OK — light day only, 1 easy round.", cta: "Start light day — Red light", ctaIcon: "💙", ctaColor: "var(--coral)", ctaDeep: "var(--coral-deep)", ctaText: "#fff", action: "continue", secondary: "back", secondaryLabel: "Stop — back to Today", needsGrownup: true },
  4: { emoji: "🛑", color: "var(--stop)",  desc: "Stop now. Tell your coach or parent right away.",   cta: "Stop — back to Today",    ctaIcon: "🛑", ctaColor: "var(--stop)", ctaDeep: "var(--stop-deep)", ctaText: "#fff", action: "back" }
};

/* Per-day mascot greeting rotates through the illustration set. */
export const POSES = {
  welcome: "assets/skate/illo-welcome.png",
  greatwork: "assets/skate/illo-great-job.png",
  celebrate: "assets/skate/illo-way-to-go.png",
  keepgoing: "assets/skate/illo-keep-going.png",
  breath: "assets/skate/illo-take-a-breath.png",
  think: "assets/skate/illo-focus.png",
  seeyou: "assets/skate/illo-nice-work.png",
  remember: "assets/skate/illo-you-can-do-it.png"
};

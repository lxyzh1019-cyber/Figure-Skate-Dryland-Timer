/* ============================================================
   2026.2 CONTENT MODEL — workout data, overload, and static tables.
   Each training day = Warm-up → Coordination → Main (Traffic-Light
   rounds) → Finisher → Skate-Skill. Sunday = Spa (recovery only).
   Plan content is the Jenn Skating Dryland 2026.2 (v10) plan on the
   Splash-style engine: GO always runs the day's main workout.
   ============================================================ */

/* The mechanism these tables are built with — the X() move factory, the
   structured prescription, overload and the level curve — lives in the shared
   core. This file is content only. */
import { X } from "../core/plan.js";


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
   HOW-TO / VALIDATED COACHING CHANNELS — a reference list, not a
   mechanism. Nothing appends these names. Where a move's best demo
   comes from one of these channels, the name is written INTO that
   move's `search` string by hand, the way the swim app does it.
   ------------------------------------------------------------ */
export const COACH_CHANNELS = {
  skate:    { label: "Figure-skating off-ice", name: "FLEXAFIT by Signe Ronka", url: "https://www.youtube.com/@FLEXAFIT" },
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
/* Appending a channel name to EVERY query made the results worse, not better.
   The name this file used to append for skate-skill work was not a findable
   YouTube channel, so those eight drills searched a phrase matching nothing
   and the ranking collapsed. Sport context belongs IN the search string
   ("off ice ... figure skating"), never glued on as a channel — and a move
   with a precise standard name ranks best on that name alone. One builder,
   no appending, same as the swim app. */

export const EXERCISE_HOWTO = {
  // — skate-skill drills —
  "Axis Micro": {
    text: "Stand tall in front of a mirror, crown of the head stacked over the skating foot. Hold your arm carriage and run the 4 self-checks OUT LOUD: Am I stacked? Did I lean right? Was my checkout quiet? Am I holding without gripping?",
    search: "figure skating off ice balance and posture drill"
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
    search: "figure skating off ice single leg jump landing hold"
  },
  "Active Split Slide": {
    text: "Slide slowly toward YOUR end-range split with hips square, using sliders or a smooth floor. Active flexibility only — never a passive over-split, never partner-pressed. Post-session only.",
    search: "active split flexibility drill safe progression figure skating"
  },
  "Active Hamstring Lengthening": {
    text: "Lie on your back, raise one straight leg as high as YOUR muscles can hold it — no hands pulling. Hold 3 seconds, lower with control. The strength holds the flexibility.",
    search: "active straight leg raise hamstring exercise tutorial"
  },
  "Half-Kneeling Hip-Flexor Hold": {
    text: "Half-kneel, tuck the pelvis (posterior tilt), grow tall through the crown. You should feel the front of the kneeling-side hip lengthen — this serves the spiral and layback line.",
    search: "half kneeling hip flexor stretch posterior tilt figure skating"
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
    search: "figure skating off ice rotation arm pull in drill"
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
    search: "pallof press anti rotation exercise The Prehab Guys"
  },
  "Glute Bridge": {
    text: "Lie on your back, feet flat, drive the hips up and SQUEEZE at the top 2 seconds — don't arch the low back. The hip is the motor for every jump.",
    search: "glute bridge exercise correct form"
  },
  "Dead Bug": {
    text: "Low back glued to the floor. Extend opposite arm and leg while exhaling slowly. If the back lifts, make the range smaller.",
    search: "dead bug exercise correct form The Prehab Guys"
  },
  "Bird Dog": {
    text: "From all fours, reach opposite arm and leg LONG — length, not lift. Flat back, no low-back arch, no hip rotation.",
    search: "bird dog exercise correct form The Prehab Guys"
  },
  "Superman": {
    text: "Lie face-down, lift arms and legs into a long line — thoracic extension, length not crunch. Hold, breathe, lower.",
    search: "superman exercise back extension correct form"
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
    search: "scapular pull up dead hang exercise figure skater shoulder"
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
    search: "band external rotation shoulder exercise The Prehab Guys"
  },
  "Side-Lying ER": {
    text: "Lie on your side, elbow on ribs, rotate a light weight up slowly. Second cuff angle — light and slow beats heavy and fast.",
    search: "side lying external rotation shoulder exercise The Prehab Guys"
  },
  // — warm-up / mobility (biased toward clean mobility demos) —
  "Jump Rope": { search: "jump rope basic bounce technique tutorial" },
  "Band Pass-Through": { search: "resistance band pass through shoulder mobility drill Tom Merrick" },
  "Cat-Camel": { search: "cat camel spine mobility exercise tutorial" },
  "90/90 Hip Switch": { search: "90 90 hip switch mobility drill Tom Merrick" },
  "Leg Swings": { search: "leg swings dynamic warm up drill tutorial" },
  "Wall Slides": { search: "wall slides shoulder mobility exercise tutorial" },
  "Knee-to-Wall Ankle": { search: "knee to wall ankle mobility drill tutorial" },
  "Half-Kneeling Ankle Rock": { search: "half kneeling ankle dorsiflexion rock mobility drill" },
  "Calf Raise": { search: "calf raise off a step heel drops below how to proper form" },
  "Hip CARs": { search: "hip CARs controlled articular rotations tutorial Tom Merrick" },
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
  if (howto && howto.search) return howto.search;
  return (ex.searchableName || ex.name) + " exercise tutorial correct form";
}
export function videoSearchUrl(ex) {
  const q = videoSearchQuery(ex);
  return q ? "https://www.youtube.com/results?search_query=" + encodeURIComponent(q) : "#";
}

/* ONE LIGHT, ONE WHOLE-SESSION DOSE. The light decides which BLOCKS run as
   well as how many main rounds. Warm-up and skate-skill survive every light:
   one prepares the body, the other is technique work at almost no load. The
   same policy as the swim app's, block for block. */
export const LIGHT_SESSION_POLICY = {
  green:    { mainRounds: 3, blocks: ["warmup", "coordination", "main", "prep", "finisher", "skateskill"] },
  yellow:   { mainRounds: 2, blocks: ["warmup", "coordination", "main", "skateskill"] },
  red:      { mainRounds: 1, blocks: ["warmup", "main", "skateskill"] },
  recovery: { mainRounds: 0, blocks: ["recovery"] }
};

/* Light → number of rounds for the Main block. Derived from the policy above so
   the rounds and the blocks can never drift apart. */
export const LIGHT_ROUNDS = Object.fromEntries(
  Object.entries(LIGHT_SESSION_POLICY).map(([k, v]) => [k, v.mainRounds]));

/* ---- the valgus gate ------------------------------------------------------
   LOCKED means every jump stays at the box jump and its frozen landing;
   UNLOCKED means the bounds, rotational and single-leg jumps are allowed. The
   gate is a CEILING on jump progressions, and the floor is the drill she
   earns her way up from — never the thing held back. */
export const VALGUS_FLOOR = "Box Jump → Stick";
export const VALGUS_PROGRESSIONS = ["Lateral Bound → Stick", "Rotational Jump w/ Frozen Landing", "Skater Jump", "Turn-and-Stick Single-Leg Landing"];

/* Top-7 exercises tracked on the Independence Ladder. */
/* ---- structured prescriptions -------------------------------------------
   The runner counts a rep move from `prescription` (sets × reps × sides ×
   directions, tempo, hold), never from the display string. Where a dose is
   written the way a coach says it — "8/side (+2 R)", "3 × 4s ecc + max
   clean" — the structure is given explicitly on the move, beside the
   unchanged dose text; the parser reads the plain ones itself and throws on
   anything it cannot, so a new dose format fails at load rather than quietly
   counting to ten. The Pull-Up's "then max clean" is self-paced after its
   three eccentric singles. */

export const TOP7 = [
  "Eccentric Step-Down", "Pull-Up (heavy)", "Box Jump → Stick",
  "Skater Jump", "Rotational Jump w/ Frozen Landing",
  "Spin Board Backspin Hold", "Turn-and-Stick Single-Leg Landing"
];

/* The one question the coach asks out loud at the end of the skill block. The
   options used to be hardcoded in shared core/ as the swimmer's three — so the
   right answer to THIS question was never on screen and every attempt scored
   wrong, and the coach answered "It's the hips" to a question about landings.
   They live here now, beside the answer; the smoke test enforces that `a` is
   one of `opts`. */
export const MICRO_LOOP = {
  q: "Where does a clean landing freeze?",
  a: "knee over toe",
  opts: ["knee over toe", "knee inside the toe", "flat on the heel"],
  yes: "Yes — knee over toe!",
  no: "It freezes with the knee over the toe."
};
export const BREATH_REHEARSAL =
  "Axis self-check out loud: Am I stacked? Did I lean right? Was my checkout quiet? Did I hold without gripping?";
/* Same rehearsal, written to be heard rather than read. The engine used to
   speak the swimmer's breathing line here; each app now says its own. */
export const BREATH_SAY =
  "Axis self-check. Am I stacked? Did I lean? Was my checkout quiet? Did I hold without gripping?";

/* The two reflection chip sets on the finish screen. These lived in shared
   core/ with swimming words in them — "Point my toes", "Breathe out loud" —
   which this app then offered to a skater. They are skating words now. */
export const REFLECT_WELL = ["Quiet landings", "Strong holds", "Clean edges", "Staying focused"];
export const REFLECT_NEXT = ["Slow down", "Stand taller", "Knee over toe", "Keep core tight"];

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
      skateTransfer: "Axis / alignment", searchableName: "figure skating off ice balance and posture" }),
  X({ name: "Spin Board Backspin Hold", prescription: { sets: 3, reps: 10 }, block: "skateskill", driver: "reps", repsDetail: "10+ rotations ×3", dose: "10+ rot ×3", estSecs: 90,
      reset: "Crown up, free leg checked.",
      cue: "Backward one-foot / scratch spin on the board. You can't change feet on the board. Dizzy >30–45s → STOP.",
      skateTransfer: "Backspin position", searchableName: "off-ice spinner backward scratch spin" }),
  X({ name: "Spin Board Layback Hold", block: "skateskill", driver: "time", work: 40, dose: "10/15/20s on-ramp ×2",
      reset: "Upright first, then small layback.",
      cue: "Train the upright hold; add a small layback line. Keep the on-ramp progressing.",
      skateTransfer: "Layback line", searchableName: "off-ice spinner upright spin" }),
  X({ name: "Turn-and-Stick Single-Leg Landing", prescription: { sets: 2, reps: 5, sides: 2 }, block: "skateskill", driver: "reps", repsDetail: "≤5/side ×2", dose: "≤5/side ×2", estSecs: 100,
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
  X({ name: "Active Hamstring Lengthening", prescription: { reps: 5, sides: 2, holdSeconds: 3 }, block: "skateskill", driver: "reps", repsDetail: "5×3s/side", dose: "5×3s/side", estSecs: 55,
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
      skateTransfer: "Axis / alignment", searchableName: "figure skating off ice balance and posture" })
];
const SKATESKILL_SAT = () => [
  X({ name: "Axis Micro", block: "skateskill", driver: "time", work: 60, dose: "~3 min + 4 self-checks",
      reset: "Crown over the skating foot.",
      cue: "Short mirror Axis Micro + 4 self-checks out loud.",
      skateTransfer: "Axis / alignment", searchableName: "figure skating off ice balance and posture" }),
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
  X({ name: "Monster Walk", prescription: { sets: 2, reps: 8, dirs: 2 }, block: "main", driver: "reps", repsDetail: "8 steps/dir ×2", dose: "8 steps/dir ×2", estSecs: 50,
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
        X({ name: "Half-Kneeling Ankle Rock", prescription: { reps: 8, sides: 2 }, block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel nailed down — both ankles, right a touch deeper." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "8/dir/leg", dose: "8/dir/leg", estSecs: 75, cue: "Relaxed, build range." })
      ],
      coordination: [
        X({ name: "A-March", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Knee up, toe up, foot down under hip." }),
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Same pattern with rhythm." }),
        X({ name: "Lateral Shuffle → Stick", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "8m/side", cue: "Low, stop dead each end." })
      ],
      main: [
        X({ name: "Eccentric Step-Down", prescription: { reps: 5, sides: 2, tempo: [4, 0, 1] }, block: "main", driver: "reps", repsDetail: "5 · 4s lower/side", dose: "5 · 4s/side", estSecs: 70, gate: "valgus", faultAnchor: true,
            reset: "Slow lower, knee over toe.", cue: "Slow lower, knee over toe.",
            parentWatch: "Left-knee valgus", fix: "Shorter range.",
            skateTransfer: "Landing-leg control", searchableName: "single leg eccentric step down" }),
        X({ name: "SL-RDL", prescription: { reps: 6, sides: 2 }, block: "main", driver: "reps", repsDetail: "6/side (R emphasis)", dose: "6/side", estSecs: 55,
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
        X({ name: "Half-Kneeling Ankle Rock", prescription: { reps: 8, sides: 2 }, block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Carioca", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "10m/side", cue: "Hip over hip — trunk-hip separation." }),
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Rhythm, light." }),
        X({ name: "Skip for Height", block: "coordination", driver: "time", work: 60, dose: "8m", cue: "Drive knee + opposite arm." })
      ],
      main: [
        X({ name: "Push-up", prescription: { reps: 5, repsHigh: 8 }, block: "main", driver: "reps", repsDetail: "5–8 (incline if needed)", dose: "5–8", estSecs: 30,
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
        X({ name: "Glute Bridge", prescription: { reps: 12, holdSeconds: 2 }, block: "main", driver: "reps", repsDetail: "12 · 2s squeeze", dose: "12 · 2s", estSecs: 50,
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
        X({ name: "Calf Raise", prescription: { reps: 12 }, block: "warmup", driver: "reps", repsDetail: "12 · full range", dose: "12", estSecs: 40, cue: "Heel below the step." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "6–8/side", dose: "6–8/side", estSecs: 35, cue: "Open the hips (+ 90/90)." }),
        X({ name: "Half-Kneeling Ankle Rock", prescription: { reps: 8, sides: 2 }, block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel down, both sides, right deeper." })
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
        X({ name: "Rotational Jump w/ Frozen Landing", prescription: { reps: 6 }, block: "main", driver: "reps", repsDetail: "≤6 · ¼→½→full · 2-foot", dose: "≤6", estSecs: 50, gate: "valgus",
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
        X({ name: "Low Box Step-Up Drive", prescription: { reps: 6, sides: 2 }, block: "finisher", driver: "reps", repsDetail: "6/side · low box", dose: "6/side", estSecs: 50, gate: "valgus",
            reset: "Whole-foot drive.", cue: "Drive through the whole foot, opposite knee up.",
            parentWatch: "Left-knee valgus", fix: "Lower box / stop.",
            skateTransfer: "Single-leg drive power", searchableName: "box step up drive knee" }),
        X({ name: "Pull-Up (heavy)", prescription: { sets: 3, reps: 1, tempo: [4, 0, 1] }, block: "finisher", driver: "reps", repsDetail: "3 × 4s ecc, then max clean", dose: "3 × 4s ecc + max", estSecs: 150,
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
        X({ name: "Knee-to-Wall Ankle", prescription: { reps: 8, sides: 2 }, block: "warmup", driver: "reps", repsDetail: "8/side both", dose: "8/side", estSecs: 40, cue: "Heel flat, knee past toes." }),
        X({ name: "Cat-Camel", block: "warmup", driver: "reps", repsDetail: "8 cycles", dose: "8 cycles", estSecs: 35, cue: "Segment by segment." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "8/dir/leg", dose: "8/dir/leg", estSecs: 75, cue: "Relaxed, build range." }),
        X({ name: "Half-Kneeling Ankle Rock", prescription: { reps: 8, sides: 2 }, block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Lateral Shuffle → Stick", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "8m/side", cue: "Low, dead stop." }),
        X({ name: "A-March", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Foot under hip." }),
        X({ name: "Carioca", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "10m/side", cue: "Hip-trunk separation." })
      ],
      main: [
        X({ name: "Eccentric Step-Down", prescription: { reps: 5, sides: 2, tempo: [4, 0, 1] }, block: "main", driver: "reps", repsDetail: "5 · 4s lower/side", dose: "5 · 4s/side", estSecs: 70, gate: "valgus", faultAnchor: true,
            reset: "Slow, knee over toe.", cue: "Slow lower, knee over toe.",
            parentWatch: "Left-knee valgus", fix: "Shorter range.",
            skateTransfer: "Landing-leg control", searchableName: "single leg eccentric step down" }),
        X({ name: "SL-RDL", prescription: { reps: 6, sides: 2 }, block: "main", driver: "reps", repsDetail: "6/side (R)", dose: "6/side", estSecs: 55,
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
        X({ name: "Half-Kneeling Ankle Rock", prescription: { reps: 8, sides: 2 }, block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Skip for Height", block: "coordination", driver: "time", work: 60, dose: "8m", cue: "Knee + opposite arm drive." }),
        X({ name: "Carioca", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "10m/side", cue: "Hip over hip." }),
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Light, rhythmic." })
      ],
      main: [
        X({ name: "Push-up", prescription: { reps: 5, repsHigh: 8 }, block: "main", driver: "reps", repsDetail: "5–8 (incline if needed)", dose: "5–8", estSecs: 30,
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
        X({ name: "Glute Bridge", prescription: { reps: 12, holdSeconds: 2 }, block: "main", driver: "reps", repsDetail: "12 · 2s squeeze", dose: "12 · 2s", estSecs: 50,
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
        X({ name: "Calf Raise", prescription: { reps: 12 }, block: "warmup", driver: "reps", repsDetail: "12 · full range", dose: "12", estSecs: 40, cue: "Heel below the step." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "8/dir/leg", dose: "8/dir/leg", estSecs: 75, cue: "Open the hips." }),
        X({ name: "Half-Kneeling Ankle Rock", prescription: { reps: 8, sides: 2 }, block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", estSecs: 45, cue: "Heel down, both sides, right deeper." })
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
        X({ name: "Rotational Jump w/ Frozen Landing", prescription: { reps: 6 }, block: "main", driver: "reps", repsDetail: "≤6 · progress turn", dose: "≤6", estSecs: 50, gate: "valgus",
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
        X({ name: "Low Box Step-Up Drive", prescription: { reps: 6, sides: 2 }, block: "finisher", driver: "reps", repsDetail: "6/side", dose: "6/side", estSecs: 50, gate: "valgus",
            reset: "Whole-foot drive.", cue: "Drive through the whole foot.",
            parentWatch: "Left-knee valgus", fix: "Lower box / stop.",
            skateTransfer: "Single-leg drive power", searchableName: "box step up drive knee" }),
        X({ name: "Pull-Up (heavy)", prescription: { sets: 3, reps: 1, tempo: [4, 0, 1] }, block: "finisher", driver: "reps", repsDetail: "3 × 4s ecc + max clean", dose: "3 × 4s ecc + max", estSecs: 150,
            reset: "Depress shoulders first.", cue: "No failure, no kip.",
            parentWatch: "Swing / shrug", fix: "Dead-hang only.",
            skateTransfer: "Pulling strength", searchableName: "strict pull up eccentric lower" }),
        X({ name: "Bird Dog", prescription: { reps: 8, sides: 2 }, block: "finisher", driver: "reps", repsDetail: "8/side (3rd weekly)", dose: "8/side", estSecs: 60,
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
      X({ name: "Hip CARs", prescription: { reps: 3, sides: 2, dirs: 2 }, block: "skateskill", driver: "reps", repsDetail: "3/dir each side", dose: "3/dir", estSecs: 60, cue: "Gentle, controlled rotations." }),
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
  warmup: "Warm-up", coordination: "Coordination", main: "Main",
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

/* ---- moves that need setting up ------------------------------------------
   A band has to be anchored, a box walked to, a rope untangled, a spin board
   placed. Those moves used to start on the same five-second rest as a floor
   move, so the clock was already running while she was still rigging.
   Recognised two ways: an explicit `setup: true` on a move whose name says
   nothing about its gear, and a name test for everything that announces
   itself. */
export const SETUP_SECONDS = 5;
const SETUP_NAME = /\bband\b|pull-?up|dead hang|jump rope|roller|massage gun|spin board|\bbox\b|slider/i;
export function needsSetup(ex) {
  if (!ex) return false;
  if (ex.setup === true) return true;
  return SETUP_NAME.test(String(ex.name || ""));
}

export const MIN_REST = 3;
/* Re-exported from the core so the constant has exactly one definition. */
export { SIDE_SWITCH_BUFFER } from "../core/util.js";
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
  { icon: "✨", label: "Skip one chore" },
  { icon: "⚽", label: "+30 min play time" },
  { icon: "🎬", label: "Family movie pick" },
  { icon: "🛌", label: "Stay up 20 min later" },
  { icon: "🎯", label: "Choose the next family activity" },
  { icon: "⛸️", label: "Pick a fun game at practice" },
  { icon: "🎨", label: "One-on-one time with a grown-up" }
];

/* Rank for a given level — highest ladder entry at or below the level. */
export function rankForLevel(level) {
  let rank = LADDER[0];
  for (const r of LADDER) if (level >= r.level) rank = r;
  return rank;
}

/* ------------------------------------------------------------
   READINESS CHECK (4-Q + body map).
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   KID COACHING — the watch-out and the fix, in her words.

   The Quiz Deck asks "what should you watch out for?" and "if this feels wrong,
   what's the fix?" and used to answer from `parentWatch` and `redFlag` — notes
   written for a grown-up watching from the side. Two problems came out of that.

   The wrong answers on a card are drawn from OTHER moves' text, and four moves
   here shared the same watch-out word for word: "Left-knee valgus" on Eccentric
   Step-Down, Turn-and-Stick, Box Jump and Low Box Step-Up. Put two of those on
   one card and more than one option is genuinely correct, so a right answer gets
   marked wrong. The fixes had the same problem — "Reduce range." twice, "Reduce
   the turn." twice, "Slow down" twice.

   Every line here names the move's OWN body part and shape, so no two of them
   can be mistaken for each other, and reads as something a coach would say to an
   eleven-year-old rather than about her. `parentWatch` / `redFlag` stay exactly
   as they are for the grown-up's Form Check tab — this is the kid-facing pair.
   ------------------------------------------------------------ */
export const KID_COACHING = {
  "Eccentric Step-Down": { watch: "Your standing knee drifting inward while you lower",
                           fix: "Step down from a lower box and keep the knee tracking over the toe" },
  "Turn-and-Stick Single-Leg Landing": { watch: "Landing and then hopping, instead of freezing on the spot",
                           fix: "Turn a smaller amount, until you can freeze the landing for two full seconds" },
  "Box Jump → Stick":    { watch: "Landing soft and then shuffling your feet to catch yourself",
                           fix: "Use a lower box and freeze the landing before you step down" },
  "Low Box Step-Up Drive": { watch: "Pushing off the back foot instead of driving from the top leg",
                           fix: "Lower the box and let only the top leg do the work" },
  "SL-RDL":              { watch: "Your back rounding as your chest comes down",
                           fix: "Come down less far and keep your chest flat like a tabletop" },
  "Dead Bug":            { watch: "Your low back peeling up off the floor as you reach out",
                           fix: "Reach a shorter way out, until your low back stays glued down" },
  "Bird Dog":            { watch: "Your low back sagging into an arch as you reach",
                           fix: "Lead the reach from your upper back and reach less far" },
  "Active Split Slide":  { cue: "Slide to your own end-range, hips square.",
                           watch: "Your pelvis twisting to let you slide further",
                           fix: "Slide less far and keep both hip bones facing the same way" },
  "Monster Walk":        { cue: "Band on, knees pushed OUT over the toes.",
                           watch: "Your knees collapsing inward between steps",
                           fix: "Take smaller steps and keep the band tight the whole way" },
  "Side Plank Reach":    { watch: "Your bottom hip sagging down toward the floor",
                           fix: "Push your bottom hip up to the ceiling and reach less far" },
  "Push-up":             { watch: "Your hips sagging so your middle makes a banana shape",
                           fix: "Put your hands on something higher until your body stays in one line" },
  "Suitcase Carry":      { watch: "Your whole trunk tipping toward the weight",
                           fix: "Carry something lighter and walk tall with both shoulders level" },
  "Pallof Press":        { watch: "Your hips turning toward the band as your arms press out",
                           fix: "Widen your feet and keep both hips facing straight ahead" },
  "Glute Bridge":        { watch: "Your low back arching to push your hips higher",
                           fix: "Lift a little lower and finish the last bit with your glutes, not your back" },
  "Band External Rotation": { watch: "Your elbow floating away from your ribs",
                           fix: "Pin your elbow to your ribs and turn slower" },
  "Side-Lying ER":       { watch: "Rushing the turn, or using a weight you have to throw",
                           fix: "Go lighter and take two whole seconds each way" },
  "Skater Jump":         { cue: "Full push, land soft, then freeze.",
                           watch: "Wobbling after the first second instead of holding still",
                           fix: "Jump a shorter distance and hold each landing for a full two seconds" },
  "Rotational Jump w/ Frozen Landing": { watch: "Your free leg flailing out to find balance",
                           fix: "Turn a smaller amount and pull the free leg tight before you land" },
  "Band Arm-Pull-In":    { watch: "Your arms drifting loose at the finish",
                           fix: "Finish with the arms locked tight to your chest and hold it" },
  "Resisted Band March": { watch: "Your trunk leaning back against the band",
                           fix: "Walk taller with your ribs down, and take shorter steps" },
  "Pull-Up (heavy)":     { cue: "Shoulders down first, no kipping.",
                           watch: "Your legs swinging and your shoulders shrugging up",
                           fix: "Hang dead still first, then pull — no swing, no shrug" },
  "Lateral Bound → Stick": { watch: "Bouncing straight into the next bound without stopping",
                           fix: "Land, freeze, count one — then go" },

  /* Moves the grown-up notes never covered, so the deck could never ask about
     them. A watch-out and a fix each is what makes them askable at all. */
  /* Short cue forms for the quiz card only — see movePool in core/store.js. */
  "Active Hamstring Lengthening": { cue: "Hold the leg up with your own muscles, no hands." },
  "A-Skip":              { cue: "Same as A-March, with a skip rhythm." },

  "Copenhagen Plank":    { watch: "Your bottom hip dropping toward the floor",
                           fix: "Bend the top knee onto the bench and keep your body in one line" },
  "Spin Board Backspin Hold": { cue: "Backward one-foot spin, weight over one spot.",
                           watch: "Your weight sliding back toward your heel",
                           fix: "Find the spot just behind the ball of your foot and stay over it" },
  "Spin Board Layback Hold": { cue: "Hold it upright first, then a small layback line.",
                           watch: "Your head dropping back before your upper back opens",
                           fix: "Open from the upper back first and let the head follow last" },
  "Scap Pull-Up + Dead Hang": { watch: "Bending your elbows instead of sliding your shoulders down",
                           fix: "Keep your arms dead straight and move only your shoulder blades" },
  "Calf Raise":          { watch: "Your ankles rolling out toward your little toes",
                           fix: "Press up through your big toe and come down slowly" },
  "Knee-to-Wall Ankle":  { watch: "Your heel lifting as your knee reaches for the wall",
                           fix: "Move closer only while your heel stays stuck to the floor" },
  "Axis Micro":          { cue: "Four axis self-checks, said out loud.",
                           watch: "Your ribs flaring so your middle bends instead of stacking",
                           fix: "Pull your ribs down and stack your head over your hips" },
  "Jump Rope":           { watch: "Loud, flat landings on your whole foot",
                           fix: "Stay on the balls of your feet and make every landing quiet" },
  "Cat-Camel":           { watch: "Moving your whole back at once instead of bit by bit",
                           fix: "Move one part of your spine at a time, slowly" },
  "Band Pass-Through":   { watch: "Your shoulders shrugging up to get the band over",
                           fix: "Widen your hands and keep your shoulders down the whole way round" },
  "Wall Slides":         { watch: "Your low back arching off the wall as your arms go up",
                           fix: "Press your ribs to the wall and go only as high as they stay there" },
  "90/90 Hip Switch":    { watch: "Slumping backwards as your knees swap over",
                           fix: "Sit tall, lean on your hands less, and let your knees lead the switch" },
  "A-March":             { watch: "Your foot landing out in front of your body",
                           fix: "Put your foot down underneath your hip, toe pulled up" },
  "Carioca":             { watch: "Your shoulders turning along with your hips",
                           fix: "Keep your chest facing forward and turn only your hips" },
  "Superman":            { watch: "Your neck craning up and your arms flapping fast",
                           fix: "Lift lower, look at the floor, and hold the shape still" },
  "Half-Kneeling Ankle Rock": { watch: "Your heel lifting as you rock the knee forward",
                           fix: "Rock a shorter way, with the heel pinned to the floor" },
  "Lateral Shuffle → Stick": { watch: "Standing tall between shuffles instead of staying low",
                           fix: "Stay low the whole way and freeze the last step" }
};

/* ------------------------------------------------------------
   TRAINING PRINCIPLES — attitude, efficiency, and why it works.

   Everything else the app asks about is a move or a rank: what a cue is, which
   chapter taught what. Nothing ever asked her about training itself — whether a
   bad-sleep day is worth training, whether ten sloppy reps beat six clean ones,
   or why the same moves keep coming back week after week.

   That last one is the point of this set. Results come from repeating the SAME
   movement, not a similar one. A different exercise that works the same muscles
   builds a different skill, and swapping it in restarts the learning — which is
   the single thing a kid bored of week six most needs to hear, and the single
   thing she is most likely to get wrong on her own.

   Authored, not generated: a principle has no sibling move to borrow a wrong
   answer from. Every wrong option here is something an eleven-year-old actually
   believes, so the card cannot be solved by spotting the silly one.

   `tier: 2` waits until the `after` question is mastered — see questionPrereq
   in core/store.js.
   ------------------------------------------------------------ */
export const TRAINING_QS = [
  { id: "honest", kind: "attitude", tier: 1,
    q: "You slept badly and you feel flat. What does the Body Check want to hear?",
    why: "Honest answers are the only thing Coach can pick a day from. A smaller day done properly still builds you — a big day faked doesn't.",
    opts: [
      { t: "The truth — then train the day Coach gives me", ok: true },
      { t: "That I feel great, so I still get the full session", ok: false },
      { t: "Nothing — skip today and do double tomorrow", ok: false } ] },

  { id: "wrongrep", kind: "attitude", tier: 2, after: "honest",
    q: "You graded a landing wobbly and the app wrote it down. What is that worth?",
    why: "A landing you missed and noticed is worth more than one you got right by luck — it tells you exactly what to fix on the next one.",
    opts: [
      { t: "It tells me which part to fix on the next landing", ok: true },
      { t: "Nothing — wobbly landings don't count", ok: false },
      { t: "It cancels out the landings I froze clean", ok: false } ] },

  { id: "showup", kind: "attitude", tier: 1,
    q: "Which week makes a stronger skater?",
    why: "Four ordinary sessions beat one heroic one. Your body changes from what you do most weeks, not from your best day.",
    opts: [
      { t: "Four ordinary sessions I actually finished", ok: true },
      { t: "One huge session and three days off", ok: false },
      { t: "Whichever week felt hardest", ok: false } ] },

  { id: "clean6", kind: "efficiency", tier: 1,
    q: "Ten sloppy jumps or six frozen landings — which one builds the axel?",
    why: "Your body learns the shape you repeat. Sloppy reps are still practice; they just teach the sloppy shape.",
    opts: [
      { t: "Six frozen landings", ok: true },
      { t: "Ten sloppy jumps — more reps is more work", ok: false },
      { t: "Neither — only ice time builds jumps", ok: false } ] },

  { id: "twowobbly", kind: "efficiency", tier: 2, after: "clean6",
    q: "Two wobbly landings in a row and Coach drops a round. Why not push through?",
    why: "Two in a row means your landing leg is done. Every jump after that teaches a wobbly landing — and that is the exact shape you'd take to the ice.",
    opts: [
      { t: "Tired legs would only practise the wobble", ok: true },
      { t: "Pushing through is how you get tougher", ok: false },
      { t: "The app is being careful because I might get bored", ok: false } ] },

  { id: "rest", kind: "efficiency", tier: 2, after: "clean6",
    q: "Why is the rest between rounds part of the workout?",
    why: "Rest is what buys the next round its quality. Skip it and round three teaches your body a tired, messy shape.",
    opts: [
      { t: "It's what lets the next round be as clean as the first", ok: true },
      { t: "It's a break so the session isn't boring", ok: false },
      { t: "It's there to stretch the session out to 30 minutes", ok: false } ] },

  { id: "sameagain", kind: "results", tier: 1,
    q: "Why do the same moves keep coming back every week?",
    why: "A movement only becomes automatic when you repeat THE SAME movement. Variety feels fun; repetition is what actually changes you.",
    opts: [
      { t: "Repeating the same movement is what makes it automatic", ok: true },
      { t: "So the app doesn't have to think up new ones", ok: false },
      { t: "Because they're the easiest ones to set up at home", ok: false } ] },

  { id: "swapit", kind: "results", tier: 2, after: "sameagain",
    q: "A different exercise works the same muscles. Can you swap it in?",
    why: "Your body learns the exact movement you practise, not the muscle group. A similar exercise builds a similar skill — not the same one — and the swap starts the learning over.",
    opts: [
      { t: "No — a similar movement builds a similar skill, not the same one", ok: true },
      { t: "Yes — same muscles means the same result", ok: false },
      { t: "Yes, as long as the new one is harder", ok: false } ] },

  { id: "comeback", kind: "attitude", tier: 1,
    q: "You missed two sessions because you were sick. What happens now?",
    why: "Missed days are gone, not owed. Picking up at the day your body is on today is what gets you back fastest — doubling up just buys a worse week.",
    opts: [
      { t: "Pick up at the day Coach gives me today", ok: true },
      { t: "Add the two I missed on top of this week", ok: false },
      { t: "Start the whole plan again from week one", ok: false } ] },

  { id: "helpask", kind: "attitude", tier: 2, after: "honest",
    q: "Something hurts and you can't tell whether it's the bad kind. What's the rule?",
    why: "Sore that settles in a minute is training. Anything that changes how you move is a grown-up's call, not yours — that's the whole point of the Body Check.",
    opts: [
      { t: "Tell a grown-up before I train it — they decide, not me", ok: true },
      { t: "Train around it and see whether it goes away", ok: false },
      { t: "Stop training altogether until it's completely gone", ok: false } ] },

  { id: "compare", kind: "attitude", tier: 1,
    q: "Someone at your rink is landing a jump you aren't. What should that change about your training?",
    why: "Your plan is built on what your body can do now. Copying someone else's week is how you end up doing their training badly instead of yours well.",
    opts: [
      { t: "Nothing — my plan is built on what my body can do now", ok: true },
      { t: "I should copy whatever they're doing", ok: false },
      { t: "I should push harder than my plan says", ok: false } ] },

  { id: "warmup", kind: "efficiency", tier: 1,
    q: "Why does every session start with the same warm-up?",
    why: "The warm-up isn't filler before the real work — it's what makes the real work worth doing. Cold, your shapes are worse, so you'd be practising worse shapes.",
    opts: [
      { t: "It gets me ready to make good shapes, so the main set counts", ok: true },
      { t: "It uses up time before the hard part starts", ok: false },
      { t: "It's the part that actually makes me stronger", ok: false } ] },

  { id: "halfrange", kind: "efficiency", tier: 2, after: "clean6",
    q: "You can freeze a landing properly 6 times, but the plan says 10. What do you do?",
    why: "Quality sets the number. Four rough landings on the end don't add four reps of training — they add four reps of the wrong shape.",
    opts: [
      { t: "Do the ones I can do properly and say so honestly", ok: true },
      { t: "Do all 10, however they come out", ok: false },
      { t: "Do 6 and tell the app it was 10", ok: false } ] },

  { id: "tempo", kind: "efficiency", tier: 2, after: "clean6",
    q: "Why does Coach count the seconds instead of letting you go at your own speed?",
    why: "The speed IS part of the movement. A slow step-down and a fast one are two different exercises, so rushing it means practising something the plan never asked for.",
    opts: [
      { t: "The speed is part of the exercise — faster is a different exercise", ok: true },
      { t: "So the session always finishes at the same time", ok: false },
      { t: "To make it harder than it really needs to be", ok: false } ] },

  { id: "missweek", kind: "results", tier: 1,
    q: "You skip a whole week. What does that actually cost?",
    why: "A movement fades when you stop repeating it. Missing one rep costs a rep; missing a week costs some of what the weeks before it built.",
    opts: [
      { t: "Some of what the repeating had already built", ok: true },
      { t: "Nothing, as long as I train twice as hard afterwards", ok: false },
      { t: "Only the XP I would have earned that week", ok: false } ] },

  { id: "automatic", kind: "results", tier: 2, after: "sameagain",
    q: "How do you know a movement has actually become automatic?",
    why: "Automatic is about attention, not effort. When the shape holds while you're thinking about something else, it's yours.",
    opts: [
      { t: "I can do it right without thinking about the cue", ok: true },
      { t: "It doesn't feel hard any more", ok: false },
      { t: "I can do more reps than I used to", ok: false } ] },

  { id: "harder", kind: "results", tier: 2, after: "sameagain",
    q: "You want to make a move harder. Which one is still the SAME movement?",
    why: "Same shape, more challenge — that's progress. Change the shape and you haven't made it harder, you've started a different skill.",
    opts: [
      { t: "The same shape, done slower and with more weight", ok: true },
      { t: "A new exercise that works the same muscles", ok: false },
      { t: "The same muscles, but on a machine instead", ok: false } ] },

  { id: "gotboring", kind: "results", tier: 2, after: "sameagain",
    q: "Six weeks of Eccentric Step-Down and it feels easy now. What should change?",
    why: "Same movement, more challenge — slower, lower, heavier. Trading it for a new exercise throws away six weeks of learning and starts a different skill from zero.",
    opts: [
      { t: "Keep the same move and make it harder — slower, lower, more load", ok: true },
      { t: "Swap it for a new exercise so it stays interesting", ok: false },
      { t: "Drop it — easy means I've finished learning it", ok: false } ] }
];

/* The pain question is LAST, and that ordering is load-bearing.

   It used to be first here, and answering "a bit sore" jumps straight to the
   body map — so on a sore morning the other three were never asked and the
   general readiness score was never computed at all. The body map's severity
   then produced the light on its own: a skater sleeping badly, flat and out of
   energy, with one merely tired ankle, was handed a Yellow day. Asking pain
   last costs no extra taps and means both signals always exist, so the light
   can be the more cautious of the two. Nothing reads this list positionally —
   every consumer is by `id`. */
export const READINESS_QS = [
  { id: "q_sleep", text: "How well did you sleep last night?", yesLabel: "😴 Good", noLabel: "🥱 Not great" },
  { id: "q_light", text: "How do your muscles feel from your last skate?", yesLabel: "💪 Fresh", noLabel: "😮‍💨 Tired" },
  { id: "q_ready", text: "What's your energy like right now?", yesLabel: "⚡ Full", noLabel: "💤 Low" },
  { id: "q_pain",  text: "Any aches or sore spots today?", isPain: true, yesLabel: "😊 All good", noLabel: "😣 A bit sore" }
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
  { level: 2, emoji: "😐", label: "Tired but controlled", color: "var(--sun)",   desc: "Tired or shaky, but still controlled. Better after 1–2 min rest." },
  { level: 3, emoji: "😟", label: "Changed movement",     color: "var(--coral)", desc: "Limp, lean, twist, shake, or less range. Tell coach or parent." },
  { level: 4, emoji: "🥺", label: "Pain / Stop",          color: "var(--stop)",  desc: "Pain, sharp pain, swelling, numbness, tingling, or affects normal activity. Stop now." }
];

// Unified colored-circle icon set (🟢🟡🔴🟣). The CTA carries the light's OWN
// color — a red-light day shows a warm caution button, not the same yellow as
// a green day — so the safety signal survives all the way to the action.
export const LIGHT_META = {
  green:    { emoji: "🟢", color: "var(--mint)",  btnColor: "var(--mint)",  btnDeep: "var(--mint-deep)",  btnText: "#fff",           btnIcon: "💪", label: "Green Light — Full power!",  btnLabel: "Start training", desc: "You're good to go! Full 3 rounds. Focus on quality." },
  yellow:   { emoji: "🟡", color: "var(--sun)",   btnColor: "var(--sun)",   btnDeep: "var(--sun-deep)",   btnText: "var(--sun-ink)", btnIcon: "❄️", label: "Yellow Light — Go easy",     btnLabel: "Start training", desc: "2 rounds max. Listen to your body — clean form over effort." },
  red:      { emoji: "🔴", color: "var(--stop)",  btnColor: "var(--coral)", btnDeep: "var(--coral-deep)", btnText: "#fff",           btnIcon: "💙", label: "Red Light — Light day",      btnLabel: "Start easy day",  desc: "1 round only. Something feels off — take it easy today." },
  recovery: { emoji: "🟣", color: "var(--grape)", btnColor: "var(--grape)", btnDeep: "var(--grape-deep)", btnText: "#fff",           btnIcon: "🧊", label: "Recovery — Rest is training", btnLabel: "Start recovery",  desc: "Rest day. Tell a grown-up, then stretch and hydrate." }
};

export const BODY_RESULTS = {
  1: { emoji: "✅", color: "var(--mint)",  desc: "You are OK. Keep moving with control.",          cta: "Start training",    ctaIcon: "💪", ctaColor: "var(--mint)", ctaDeep: "var(--mint-deep)", ctaText: "#fff", action: "continue" },
  2: { emoji: "⏱️", color: "var(--sun)",   desc: "Take 1–2 min rest, then go easy — 2 rounds max, clean form.", cta: "Start easy — yellow light", ctaIcon: "💛", ctaColor: "var(--sun)", ctaDeep: "var(--sun-deep)", ctaText: "var(--sun-ink)", action: "continue", secondary: "retry", secondaryLabel: "Rest 1–2 min, then re-check" },
  3: { emoji: "🗣️", color: "var(--coral)", desc: "Tell your coach or parent first. If they say OK — light day only, 1 easy round.", cta: "Start light day — red light", ctaIcon: "💙", ctaColor: "var(--coral)", ctaDeep: "var(--coral-deep)", ctaText: "#fff", action: "continue", secondary: "back", secondaryLabel: "Stop — back to Today", needsGrownup: true },
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

/* Coach's Quiz — the questions the finish screen asks, connecting today's
   land work to the ice. Rotated by core/vm/session.js sessionQuizFor(). */
/* ------------------------------------------------------------
   THE COACH'S QUIZ — one card at the end of every session.

   This bank had six questions and every wrong answer was a joke: "To pose for a
   photo", "Warmer skates", "Louder toe picks". The right answer was always the
   only real coaching sentence, so she could score six out of six knowing
   nothing at all — which is exactly why the quiz stopped meaning anything to
   her. A wrong answer here is now something TRUE of a different move, or
   something a skater her age genuinely believes. You have to know which one
   applies.

   Eighteen of them now, not six, so the end-of-session card stops coming back
   round every few days.

   `tier: 2` questions are application — you felt this, so what do you change —
   and stay closed until the `after` question is mastered. Ids are the XP ledger
   keys ("coach|<id>"), so the original six keep theirs and nothing she has
   already learned gets charged for twice.
   ------------------------------------------------------------ */
export const SESSION_QUIZ = [
  { id: "freeze", tier: 1, q: "Why do we land and FREEZE for 2 seconds on every jump?", why: "A landing you can hold is a landing you own — the freeze teaches your leg the checkout.", opts: [
    { t: "A frozen landing means the landing leg is really in control", ok: true },
    { t: "It gives the next jump time to build up height", ok: false },
    { t: "It stops you getting dizzy between jumps", ok: false } ] },

  { id: "boxjump", tier: 1, q: "Box jumps make your legs stronger. Where does that power show up on the ice?", why: "Every jump takeoff is leg power — land power becomes ice height.", opts: [
    { t: "Higher, stronger jump takeoffs", ok: true },
    { t: "A quieter, steadier landing leg", ok: false },
    { t: "A tighter spin once you're already turning", ok: false } ] },

  { id: "clean", tier: 1, q: "Why does Coach say \u201cslow and clean beats fast and sloppy\u201d?", why: "Your body learns the shape you practise — so practise the good one.", opts: [
    { t: "Clean shapes on land become clean landings on the ice", ok: true },
    { t: "Slow reps use up more energy, so they count for more", ok: false },
    { t: "Going slowly is how you avoid getting out of breath", ok: false } ] },

  { id: "core", tier: 1, q: "Why do we brace our core (like a strong tube) during land work?", why: "A braced core keeps your axis stacked, so spins stay centred and landings stay quiet.", opts: [
    { t: "A stiff middle keeps your axis tall for spins and landings", ok: true },
    { t: "It opens the hips so your edges can go deeper", ok: false },
    { t: "It trains you to hold your breath through a long programme", ok: false } ] },

  { id: "balance", tier: 1, q: "Balance moves (like Eccentric Step-Down) — what do they build for skating?", why: "A steady knee over the toe is the landing leg every jump comes home to.", opts: [
    { t: "A landing leg that stays steady, knee over toe", ok: true },
    { t: "More height on the takeoff of every jump", ok: false },
    { t: "A faster rotation once you're in the air", ok: false } ] },

  { id: "crown", tier: 1, q: "Why do we keep the crown of the head UP in spins and landings?", why: "A tall crown stacks your axis — lean the head and the whole spin drifts.", opts: [
    { t: "A tall crown keeps your axis stacked so spins stay centred", ok: true },
    { t: "Looking up is what stops you feeling dizzy", ok: false },
    { t: "It keeps your weight back over the heel of the blade", ok: false } ] },

  { id: "eccentric", tier: 1, q: "Eccentric Step-Down is done SLOWLY on the way down. Why the slow part?", why: "A landing is a controlled fall. The slow lowering is the exact job your leg does the instant you hit the ice.", opts: [
    { t: "Lowering slowly is the same job as absorbing a landing", ok: true },
    { t: "Slow means you can go lower than you otherwise could", ok: false },
    { t: "Slow is easier, so you can do more of them", ok: false } ] },

  { id: "skater", tier: 1, q: "Skater Jump — side to side, and you stick every landing. What is it for?", why: "Jumps land sideways, not straight ahead. Sticking a side landing is the skill the ice actually asks for.", opts: [
    { t: "Landing under control when you're travelling sideways", ok: true },
    { t: "Getting your feet to move faster through footwork", ok: false },
    { t: "Building the height you need for a double", ok: false } ] },

  { id: "pullup", tier: 1, q: "Pull-Up (heavy) — no swinging, no kipping. What does the \u201cclean\u201d part build?", why: "A pull you control is upper body you can hold still in the air. A swing borrows from your legs and teaches your arms nothing.", opts: [
    { t: "An upper body you can hold still and tight in the air", ok: true },
    { t: "Grip strength for holding the boards", ok: false },
    { t: "Bigger arms, so the pull-in is faster", ok: false } ] },

  { id: "spinboard", tier: 1, q: "Spin Board Backspin Hold — what is the board actually training?", why: "The board takes the ice out of it, so the only thing left to practise is where your weight sits and how still you stay.", opts: [
    { t: "Finding the spot on the foot the spin stays centred over", ok: true },
    { t: "Getting used to being dizzy so it stops bothering you", ok: false },
    { t: "Spinning faster by pulling the arms in harder", ok: false } ] },

  { id: "copenhagen", tier: 1, q: "Copenhagen Plank works the inside of the leg. Why does a skater want that?", why: "Every edge pushes sideways. The inside of the leg is what holds the knee over the toe when it does.", opts: [
    { t: "It holds the knee over the toe when you push on an edge", ok: true },
    { t: "It makes the free leg easier to lift behind you", ok: false },
    { t: "It stops your ankles rolling inside the boot", ok: false } ] },

  { id: "hinge", tier: 1, q: "Hip Hinge — flat back, hips travel backwards. What is that protecting?", why: "The hips are built to bend under load. The lower back is not.", opts: [
    { t: "Your lower back — the hips do the bending, not the spine", ok: true },
    { t: "Your knees, by keeping them completely straight", ok: false },
    { t: "Your shoulders, by keeping them pulled down", ok: false } ] },

  { id: "fixlanding", tier: 2, after: "freeze", q: "Your landings keep travelling instead of stopping. Which land move goes after that?", why: "Fix the checkout where you can hold it still, then take it to the ice.", opts: [
    { t: "Turn-and-Stick — the same landing, held", ok: true },
    { t: "Box Jump — you need a stronger takeoff", ok: false },
    { t: "Spin Board — your axis must be off", ok: false } ] },

  { id: "kneein", tier: 2, after: "balance", q: "Your knee dives inward as you land. What does that mean and what changes?", why: "Knee over toe, every time. A knee that dives in is the landing leg giving up — go lower and slower until it stops.", opts: [
    { t: "The landing leg is losing control — go lower, slower, knee over toe", ok: true },
    { t: "It's normal on a hard landing; keep going", ok: false },
    { t: "You're landing too softly and need more height", ok: false } ] },

  { id: "roundthree", tier: 2, after: "clean", q: "Round three, and your form has gone. What's the right call?", why: "The shape is the point of the round. A round trained sloppy is practice at being sloppy.", opts: [
    { t: "Slow down and hold the shape — a clean round is what counts", ok: true },
    { t: "Push harder, the last round is where the gains are", ok: false },
    { t: "Skip ahead and come back to it at the end", ok: false } ] },

  { id: "spindrift", tier: 2, after: "crown", q: "Your spin travels across the ice instead of staying in one spot. What's the first thing to check?", why: "A head that leans takes the axis with it, and a leaning axis travels. Crown up first, then look at the foot.", opts: [
    { t: "Whether the head is leaning — a tipped axis travels", ok: true },
    { t: "Whether you're pulling the arms in fast enough", ok: false },
    { t: "Whether the entry edge was deep enough", ok: false } ] },

  { id: "bracewhen", tier: 2, after: "core", q: "Why brace your middle BEFORE the hard part, not during it?", why: "A middle braced late has already bent, and the power leaked out through the bend.", opts: [
    { t: "Brace late and it has already bent — the power leaked", ok: true },
    { t: "Bracing after means you get one more breath in first", ok: false },
    { t: "It makes no difference as long as you brace at some point", ok: false } ] },

  { id: "tiredlegs", tier: 2, after: "eccentric", q: "Two wobbly landings in a row and Coach takes a round away. What is that protecting?", why: "Tired legs can only practise the wobble. Stopping the round protects the shape you take to the ice tomorrow.", opts: [
    { t: "The shape — tired legs would only rehearse the wobble", ok: true },
    { t: "Your energy, so there's some left for the next block", ok: false },
    { t: "The timer, so the session still finishes on time", ok: false } ] }
];

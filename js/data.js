/* ============================================================================
   data.js — Jenn Skating Dryland 2026.2 (v10) plan content.
   Pure data + builders, ported verbatim from the original single-file app so
   the V2 UI renders the real plan. No DOM, no storage, no side effects.
   AM micro-activation and evening variants are intentionally dropped (V2):
   GO = the day's main workout, Sunday = recovery circuit.
   ============================================================================ */

/* ---- Progressive overload (anchored to Mon May 25 2026, capped week 7 /
   mid-July). Timed work +2s every 2 weeks; rep-based +1 rep every 2 weeks. ---- */
const OVERLOAD_ANCHOR = new Date(2026, 4, 25);
const OVERLOAD_CAP_WEEKS = 7;
export function overloadWeek() {
  const now = new Date();
  if (now < OVERLOAD_ANCHOR) return 1;
  const days = Math.floor((now - OVERLOAD_ANCHOR) / 86400000);
  return Math.min(OVERLOAD_CAP_WEEKS, Math.floor(days / 7) + 1);
}
export function adjWork(baseSeconds) { return baseSeconds + Math.floor((overloadWeek() - 1) / 2) * 2; }
export function repBonus() { return Math.floor((overloadWeek() - 1) / 2); }

/* X() normalizes an exercise into the shape the timer/voice engine expects
   (work / byReps+repsDetail / reset / cue / redFlag …). */
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
    redFlag: o.fix || null,               // correction (shown as red-flag)
    parentWatch: o.parentWatch || null,   // "what to watch" (feeds quiz/cards)
    swimTransfer: o.swimTransfer || null, // skill it builds (feeds quiz/cards)
    faultAnchor: !!o.faultAnchor,
    gate: o.gate || null,                 // null | "valgus"
    parentEcho: !!o.parentEcho,           // anti-extension breath gate
    searchableName: o.searchableName || o.name,
    demoUrl: o.demoUrl || null,
    rest: o.rest != null ? o.rest : 5
  };
  if (driver === "reps") { ex.byReps = true; ex.repsDetail = o.repsDetail || o.dose; }
  else if (driver === "time") { ex.work = o.work; }
  if (o.eachSide) ex.eachSide = true;
  return ex;
}

/* Light → number of rounds for the Main block. */
export const LIGHT_ROUNDS = { green: 3, yellow: 2, red: 1, recovery: 0 };

export const MANTRA = "I am STRONG. I am FAST. I can SWIM THIS.";
export const DAY_MANTRA = {
  monday:    "Practice makes perfect.",
  tuesday:   "I am STRONG. I am FAST. I can SWIM THIS.",
  wednesday: "Practice makes perfect.",
  thursday:  "I am STRONG. I am FAST. I can SWIM THIS.",
  friday:    "Sweat in training, no tears in competition.",
  saturday:  "I am STRONG. I am FAST. I can SWIM THIS.",
  sunday:    "Sweat in training, no tears in competition."
};

export const READINESS_QUESTIONS = [
  { id: "q1", text: "Are you ready to become a better skater today?" },
  { id: "q2", text: "Is your body pain-free — ankles, knees, hips, back, shoulders?", painGate: true },
  { id: "q3", text: "Did you sleep okay and is your energy full?" },
  { id: "q4", text: "Does your body feel light, not heavy from skating?" },
  { id: "q5", text: "Can you stack your axis — crown over your skating foot, no lean right?" },
  { id: "q6", text: "Can you land and FREEZE for 2 seconds, knee over toe?" },
  { id: "q7", text: "Do your shoulders stay DOWN when you hang or pull?" },
  { id: "q8", text: "Do you WANT to give this 100% today?" }
];

export const TOP7 = [
  "Eccentric Step-Down", "Pull-Up (heavy)", "Box Jump → Stick",
  "Skater Jump", "Rotational Jump w/ Frozen Landing",
  "Spin Board Backspin Hold", "Turn-and-Stick Single-Leg Landing"
];

export const MICRO_LOOP = { q: "Where does a clean landing freeze?", a: "knee over toe" };
export const BREATH_REHEARSAL =
  "Axis self-check out loud: Am I stacked? Did I lean right? Was my checkout quiet? Did I hold without gripping?";
export const INTENT_WORDS = ["SHARP", "LOCK", "DRIVE", "HOLD", "PULL"];

const FINISHER = () => [
  X({ name: "Copenhagen Plank", block: "finisher", driver: "time", work: 35, eachSide: true,
      dose: "15–20s/side", reset: "Switch sides only.",
      cue: "Adductors actively working — edge control, not just hanging.",
      swimTransfer: "Edge / adductor control", searchableName: "copenhagen plank adductor" })
];

/* Skating-Skill block = Axis Micro + Spin Board (+ landing work).
   A = Spin/Push days (Tue/Fri); B = Single-Leg days (Mon/Thu); SAT = power days. */
const SKATESKILL_A = () => [
  X({ name: "Axis Micro", block: "swimskill", driver: "time", work: 60, dose: "~2 min + 4 self-checks",
      reset: "Crown over the skating foot.",
      cue: "Mirror balance + arm carriage. Run the 4 self-checks OUT LOUD: stacked? leaned right? quiet checkout? holding without gripping?",
      swimTransfer: "Axis / alignment", searchableName: "releve balance port de bras ballet" }),
  X({ name: "Spin Board Backspin Hold", block: "swimskill", driver: "reps", repsDetail: "10+ rotations ×3", dose: "10+ rot ×3",
      reset: "Crown up, free leg checked.",
      cue: "Backward one-foot / scratch spin on the board. You can't change feet on the board. Dizzy >30–45s → STOP.",
      swimTransfer: "Backspin position", searchableName: "off-ice spinner backward scratch spin" }),
  X({ name: "Spin Board Layback Hold", block: "swimskill", driver: "time", work: 40, dose: "10/15/20s on-ramp ×2",
      reset: "Upright first, then small layback.",
      cue: "Train the upright hold; add a small layback line. Keep the on-ramp progressing.",
      swimTransfer: "Layback line", searchableName: "off-ice spinner upright spin" }),
  X({ name: "Turn-and-Stick Single-Leg Landing", block: "swimskill", driver: "reps", repsDetail: "≤5/side ×2", dose: "≤5/side ×2", eachSide: true,
      gate: "valgus", reset: "Crown up, free leg checked.",
      cue: "¼/½ turn, land on ONE foot, freeze 2s.",
      parentWatch: "left-knee valgus / can't freeze", fix: "Reduce the turn.",
      swimTransfer: "Single-leg rotational landing", searchableName: "off-ice jump landing position hold one foot" })
];
const SKATESKILL_B = () => [
  X({ name: "Active Split Slide", block: "swimskill", driver: "time", work: 60, eachSide: true, dose: "3×20–30s/side",
      reset: "Own end-range only.",
      cue: "Slide to YOUR end-range — hips square. Never passive over-split or partner-pressed. Post-session only.",
      parentWatch: "pelvis twists or pain", fix: "Back off the range.",
      swimTransfer: "Spiral / split line", searchableName: "active split flexibility drill" }),
  X({ name: "Active Hamstring Lengthening", block: "swimskill", driver: "reps", repsDetail: "5×3s/side", dose: "5×3s/side", eachSide: true,
      reset: "Supine, raise the leg.",
      cue: "Hold the leg up with your OWN quad/hip-flexor — no hands pulling.",
      swimTransfer: "Active flexibility", searchableName: "active straight leg raise hamstring" }),
  X({ name: "Half-Kneeling Hip-Flexor Hold", block: "swimskill", driver: "time", work: 60, eachSide: true, dose: "30s/side",
      reset: "Posterior tilt, tall.",
      cue: "Tuck the pelvis, stay tall — serves spiral + layback line.",
      swimTransfer: "Hip-flexor length", searchableName: "half kneeling hip flexor stretch" }),
  X({ name: "Axis Micro", block: "swimskill", driver: "time", work: 40, dose: "4 self-checks + short layback",
      reset: "Crown over the skating foot.",
      cue: "Self-checks KEPT on split days (the drift instrument). 4 yes/no out loud. Add a short layback hold on-ramp ×2.",
      swimTransfer: "Axis / alignment", searchableName: "releve balance port de bras ballet" })
];
const SKATESKILL_SAT = () => [
  X({ name: "Axis Micro", block: "swimskill", driver: "time", work: 60, dose: "~3 min + 4 self-checks",
      reset: "Crown over the skating foot.",
      cue: "Short mirror Axis Micro + 4 self-checks out loud.",
      swimTransfer: "Axis / alignment", searchableName: "releve balance port de bras ballet" }),
  X({ name: "Active Split Slide", block: "swimskill", driver: "time", work: 40, eachSide: true, dose: "2×20s/side",
      reset: "Own end-range only.",
      cue: "Cooldown flexibility — active end-range, post-session only.",
      swimTransfer: "Spiral / split line", searchableName: "active split flexibility drill" })
];

export const HARD_EXERCISES = new Set([
  "Box Jump", "Squat Jump", "Lateral Bound", "Bosu Squat",
  "Wide-Grip Pull-Up", "Wide Pull-Up", "Box Jump-Down",
  "Box Jump / Lateral Bound", "Jump Rope Simulation", "Squat Jump (light)"
]);

export const DAYS = {
  monday: {
    title: "Single-Leg + Axis",
    subtitle: "PM · ice day · keep light, ice carries the jump load",
    badge: "MON", theme: "Single-Leg + Axis",
    mantra: "Crown up. Land and freeze.",
    poolLoad: "pm", defaultLight: "green", timeLo: 22, timeHi: 28,
    equipment: ["Low step", "Mat", "Mirror", "Pull-up bar"],
    prSentinel: "Layback hold — longest clean seconds", amActivation: null,
    blocks: {
      warmup: [
        X({ name: "Jump Rope", block: "warmup", driver: "time", work: 75, dose: "60–90s", cue: "Off the toes, quiet, tall." }),
        X({ name: "Cat-Camel", block: "warmup", driver: "reps", repsDetail: "8 cycles", dose: "8 cycles", cue: "Move segment by segment." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", eachSide: true, cue: "Heel nailed down — both ankles, right a touch deeper." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "8/dir/leg", dose: "8/dir/leg", cue: "Relaxed, build range." })
      ],
      coordination: [
        X({ name: "A-March", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Knee up, toe up, foot down under hip." }),
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Same pattern with rhythm." }),
        X({ name: "Lateral Shuffle → Stick", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "8m/side", cue: "Low, stop dead each end." })
      ],
      main: [
        X({ name: "Eccentric Step-Down", block: "main", driver: "reps", repsDetail: "5 · 4s lower/side", dose: "5 · 4s/side", eachSide: true, gate: "valgus", faultAnchor: true,
            reset: "Slow lower, knee over toe.", cue: "Slow lower, knee over toe.",
            parentWatch: "Left-knee valgus", fix: "Shorter range.",
            swimTransfer: "Landing-leg control", searchableName: "single leg eccentric step down" }),
        X({ name: "SL-RDL", block: "main", driver: "reps", repsDetail: "6/side (R emphasis)", dose: "6/side", eachSide: true,
            reset: "Hinge, flat back.", cue: "Hinge from the hip, flat back, R-side quality.",
            parentWatch: "Back rounds", fix: "Reduce range.",
            swimTransfer: "Hip hinge / posterior", searchableName: "single leg romanian deadlift bodyweight" }),
        X({ name: "Dead Bug", block: "main", driver: "reps", repsDetail: "8/side", dose: "8/side", eachSide: true, faultAnchor: true,
            reset: "Back flat, exhale on extend.", cue: "Exhale as limbs extend, low back glued.",
            parentWatch: "Low back lifts off floor", fix: "Smaller range.",
            swimTransfer: "Anti-extension core", searchableName: "dead bug core exercise" }),
        X({ name: "Bird Dog", block: "main", driver: "reps", repsDetail: "8/side", dose: "8/side", eachSide: true,
            reset: "Thoracic-led, length not crunch.", cue: "Reach long, no low-back arch.",
            parentWatch: "Low-back arches", fix: "Reset, lead from the upper back.",
            swimTransfer: "Posterior body line", searchableName: "bird dog exercise" })
      ],
      finisher: FINISHER(),
      swimskill: [
        ...SKATESKILL_B(),
        X({ name: "Scap Pull-Up + Dead Hang", block: "swimskill", driver: "time", work: 30, dose: "30s",
            reset: "Hang tall, shoulders ready.", cue: "Shoulders slide DOWN, hang and decompress.",
            swimTransfer: "Shoulder control / decompression", searchableName: "scapular pull up dead hang" })
      ]
    },
    prepMenu: []
  },

  tuesday: {
    title: "Spin + Push/Carry",
    subtitle: "PM · ice day · skill + accessory, low CNS",
    badge: "TUE", theme: "Spin + Push/Carry",
    mantra: "Quiet spins. Strong shoulders.",
    poolLoad: "pm", defaultLight: "green", timeLo: 20, timeHi: 26,
    equipment: ["Spinner board", "Resistance band", "Light weight", "Mat", "Mirror"],
    prSentinel: "Clean push-ups", amActivation: null,
    blocks: {
      warmup: [
        X({ name: "Band Pass-Through", block: "warmup", driver: "reps", repsDetail: "8–10", dose: "8–10", cue: "Wide, no shrug." }),
        X({ name: "Wall Slides", block: "warmup", driver: "reps", repsDetail: "8", dose: "8", cue: "Back on wall, ribs down." }),
        X({ name: "90/90 Hip Switch", block: "warmup", driver: "reps", repsDetail: "6/side", dose: "6/side", eachSide: true, cue: "Knees lead." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", eachSide: true, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Carioca", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "10m/side", cue: "Hip over hip — trunk-hip separation." }),
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Rhythm, light." }),
        X({ name: "Skip for Height", block: "coordination", driver: "time", work: 60, dose: "8m", cue: "Drive knee + opposite arm." })
      ],
      main: [
        X({ name: "Push-up", block: "main", driver: "reps", repsDetail: "5–8 (incline if needed)", dose: "5–8",
            reset: "Ribs down, full range.", cue: "Ribs down, full range.",
            parentWatch: "Hips sag", fix: "Incline higher.",
            swimTransfer: "Pressing strength", searchableName: "push up progression incline" }),
        X({ name: "Suitcase Carry", block: "main", driver: "time", work: 40, eachSide: true, dose: "20s/side",
            reset: "Stand tall, one weight.", cue: "Don't side-bend — resist the lean right.",
            parentWatch: "Trunk tilts toward the weight", fix: "Lighter load.",
            swimTransfer: "Anti-lateral / axis", searchableName: "suitcase carry anti lateral core" }),
        X({ name: "Pallof Press", block: "main", driver: "reps", repsDetail: "12/side · 2s hold", dose: "12/side · 2s", eachSide: true,
            reset: "Hips square.", cue: "Press out, resist the rotation.",
            parentWatch: "Hip rotates", fix: "Wider stance.",
            swimTransfer: "Anti-rotation core", searchableName: "pallof press band" }),
        X({ name: "Glute Bridge", block: "main", driver: "reps", repsDetail: "12 · 2s squeeze", dose: "12 · 2s",
            reset: "Squeeze the top.", cue: "Squeeze top, don't arch.",
            parentWatch: "Low-back arch", fix: "Reduce range.",
            swimTransfer: "Hip extension power", searchableName: "glute bridge exercise" })
      ],
      finisher: [],
      swimskill: SKATESKILL_A()
    },
    prepMenu: []
  },

  wednesday: {
    title: "POWER A — Jump + Pull + Drive",
    subtitle: "AM · NO ice · the real power day",
    badge: "WED", theme: "Jump + Pull + Drive",
    mantra: "I am SHARP. I am STRONG. I can SKATE THIS.",
    poolLoad: "none", defaultLight: "green", timeLo: 30, timeHi: 35,
    equipment: ["Plyo box", "Pull-up bar", "Resistance band", "Mat"],
    prSentinel: "Pull-up clean reps (after 3 eccentric)", amActivation: null,
    blocks: {
      warmup: [
        X({ name: "Jump Rope", block: "warmup", driver: "time", work: 90, dose: "90s", cue: "Reactive, quiet." }),
        X({ name: "Calf Raise", block: "warmup", driver: "reps", repsDetail: "12 · full range", dose: "12", cue: "Heel below the step." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "6–8/side", dose: "6–8/side", eachSide: true, cue: "Open the hips (+ 90/90)." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", eachSide: true, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Light, rhythmic — primes the jumps." })
      ],
      main: [
        X({ name: "Box Jump → Stick", block: "main", driver: "time", work: 30, dose: "30s · stick each", gate: "valgus", faultAnchor: true,
            reset: "Fast contact, freeze.", cue: "Fast contact, freeze 2s.",
            parentWatch: "Left-knee valgus / can't freeze", fix: "Drop a round tier.",
            swimTransfer: "Jump takeoff + landing", searchableName: "box jump stick landing" }),
        X({ name: "Skater Jump", block: "main", driver: "time", work: 30, dose: "30s · single→single", gate: "valgus",
            reset: "Full push.", cue: "Full push, land soft + freeze. Grade landing 1–5.",
            parentWatch: "Unstable past 2s", fix: "Shorten the distance.",
            swimTransfer: "Lateral push + single-leg landing", searchableName: "skater jump lateral bound landing" }),
        X({ name: "Rotational Jump w/ Frozen Landing", block: "main", driver: "reps", repsDetail: "≤6 · ¼→½→full · 2-foot", dose: "≤6", gate: "valgus",
            reset: "Crown up, free leg checked.", cue: "Crown up, free leg checked, freeze 2–3s.",
            parentWatch: "Free-leg flail", fix: "Reduce the turn.",
            swimTransfer: "Rotation + landing", searchableName: "off-ice rotation jump landing hold quarter half" }),
        X({ name: "Band Arm-Pull-In", block: "main", driver: "time", work: 20, dose: "20s · fast intent",
            reset: "Fast pull.", cue: "Fast pull, frozen finish.",
            parentWatch: "Loose finish", fix: "Slow down, fix the freeze.",
            swimTransfer: "Pull-in / rotation speed", searchableName: "off-ice rotation pull in drill arms" })
      ],
      finisher: [
        X({ name: "Resisted Band March", block: "finisher", driver: "time", work: 20, dose: "20s · drive knee",
            reset: "Band on hips, tall trunk.", cue: "Drive the knee fast, stay tall.",
            parentWatch: "Trunk leans", fix: "Slow down, square up.",
            swimTransfer: "Posterior-chain drive", searchableName: "resisted band march drive" }),
        X({ name: "Low Box Step-Up Drive", block: "finisher", driver: "reps", repsDetail: "6/side · low box", dose: "6/side", eachSide: true, gate: "valgus",
            reset: "Whole-foot drive.", cue: "Drive through the whole foot, opposite knee up.",
            parentWatch: "Left-knee valgus", fix: "Lower box / stop.",
            swimTransfer: "Single-leg drive power", searchableName: "box step up drive knee" }),
        X({ name: "Pull-Up (heavy)", block: "finisher", driver: "reps", repsDetail: "3 × 4s ecc, then max clean", dose: "3 × 4s ecc + max",
            reset: "Depress shoulders first.", cue: "Shoulders down first. No failure, no kip.",
            parentWatch: "Swing / shrug", fix: "Dead-hang only.",
            swimTransfer: "Pulling strength", searchableName: "strict pull up eccentric lower" })
      ],
      swimskill: SKATESKILL_SAT()
    },
    prepMenu: []
  },

  thursday: {
    title: "Single-Leg + Core",
    subtitle: "PM · ice day · light, mirrors Monday",
    badge: "THU", theme: "Single-Leg + Core",
    mantra: "Crown up. Land and freeze.",
    poolLoad: "pm", defaultLight: "green", timeLo: 22, timeHi: 28,
    equipment: ["Low step", "Mat", "Mirror", "Resistance band"],
    prSentinel: "Single-leg eccentric hold seconds", amActivation: null,
    blocks: {
      warmup: [
        X({ name: "Knee-to-Wall Ankle", block: "warmup", driver: "reps", repsDetail: "8/side both", dose: "8/side", eachSide: true, cue: "Heel flat, knee past toes." }),
        X({ name: "Cat-Camel", block: "warmup", driver: "reps", repsDetail: "8 cycles", dose: "8 cycles", cue: "Segment by segment." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "8/dir/leg", dose: "8/dir/leg", cue: "Relaxed, build range." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", eachSide: true, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Lateral Shuffle → Stick", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "8m/side", cue: "Low, dead stop." }),
        X({ name: "A-March", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Foot under hip." }),
        X({ name: "Carioca", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "10m/side", cue: "Hip-trunk separation." })
      ],
      main: [
        X({ name: "Eccentric Step-Down", block: "main", driver: "reps", repsDetail: "5 · 4s lower/side", dose: "5 · 4s/side", eachSide: true, gate: "valgus", faultAnchor: true,
            reset: "Slow, knee over toe.", cue: "Slow lower, knee over toe.",
            parentWatch: "Left-knee valgus", fix: "Shorter range.",
            swimTransfer: "Landing-leg control", searchableName: "single leg eccentric step down" }),
        X({ name: "SL-RDL", block: "main", driver: "reps", repsDetail: "6/side (R)", dose: "6/side", eachSide: true,
            reset: "Flat back, hinge.", cue: "Hinge from the hip, flat back.",
            parentWatch: "Back rounds", fix: "Reduce range.",
            swimTransfer: "Hip hinge / posterior", searchableName: "single leg romanian deadlift bodyweight" }),
        X({ name: "Dead Bug", block: "main", driver: "reps", repsDetail: "8/side", dose: "8/side", eachSide: true, faultAnchor: true,
            reset: "Exhale, back glued.", cue: "Exhale as limbs extend, low back glued.",
            parentWatch: "Low back lifts", fix: "Smaller range.",
            swimTransfer: "Anti-extension core", searchableName: "dead bug core exercise" }),
        X({ name: "Bird Dog", block: "main", driver: "reps", repsDetail: "8/side", dose: "8/side", eachSide: true,
            reset: "Thoracic-led, length not crunch.", cue: "Reach long, no low-back arch.",
            parentWatch: "Low-back arches", fix: "Reset, lead from the upper back.",
            swimTransfer: "Posterior body line", searchableName: "bird dog exercise" })
      ],
      finisher: [
        X({ name: "Pallof Press", block: "finisher", driver: "reps", repsDetail: "12/side · 2s hold", dose: "12/side · 2s", eachSide: true,
            reset: "Hips square.", cue: "Press out, resist the twist.",
            parentWatch: "Hip rotates", fix: "Wider stance.",
            swimTransfer: "Anti-rotation core", searchableName: "pallof press band" }),
        X({ name: "Copenhagen Plank", block: "finisher", driver: "time", work: 35, eachSide: true, dose: "15–20s/side",
            reset: "Switch sides only.", cue: "Adductors actively working — edge control.",
            swimTransfer: "Edge / adductor control", searchableName: "copenhagen plank adductor" })
      ],
      swimskill: SKATESKILL_B()
    },
    prepMenu: []
  },

  friday: {
    title: "Spin + Push/Carry",
    subtitle: "PM · ice day · save energy for Saturday",
    badge: "FRI", theme: "Spin + Push/Carry",
    mantra: "Sweat in training, no tears in competition.",
    poolLoad: "pm", defaultLight: "green", timeLo: 20, timeHi: 26,
    equipment: ["Spinner board", "Resistance band", "Light weight", "Mat", "Mirror", "Pull-up bar"],
    prSentinel: "Clean push-ups OR layback hold", amActivation: null,
    blocks: {
      warmup: [
        X({ name: "Jump Rope", block: "warmup", driver: "time", work: 75, dose: "60–90s", cue: "Off the toes, quiet." }),
        X({ name: "Band Pass-Through", block: "warmup", driver: "reps", repsDetail: "8–10", dose: "8–10", cue: "Wide, no shrug." }),
        X({ name: "90/90 Hip Switch", block: "warmup", driver: "reps", repsDetail: "6/side", dose: "6/side", eachSide: true, cue: "Knees lead." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", eachSide: true, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Skip for Height", block: "coordination", driver: "time", work: 60, dose: "8m", cue: "Knee + opposite arm drive." }),
        X({ name: "Carioca", block: "coordination", driver: "time", work: 60, eachSide: true, dose: "10m/side", cue: "Hip over hip." }),
        X({ name: "A-Skip", block: "coordination", driver: "time", work: 60, dose: "10m", cue: "Light, rhythmic." })
      ],
      main: [
        X({ name: "Push-up", block: "main", driver: "reps", repsDetail: "5–8 (incline if needed)", dose: "5–8",
            reset: "Ribs down, full range.", cue: "Ribs down, full range.",
            parentWatch: "Hips sag", fix: "Incline higher.",
            swimTransfer: "Pressing strength", searchableName: "push up progression incline" }),
        X({ name: "Suitcase Carry", block: "main", driver: "time", work: 40, eachSide: true, dose: "20s/side",
            reset: "Stand tall, one weight.", cue: "Don't side-bend — resist the lean right.",
            parentWatch: "Trunk tilts toward the weight", fix: "Lighter load.",
            swimTransfer: "Anti-lateral / axis", searchableName: "suitcase carry anti lateral core" }),
        X({ name: "Pallof Press", block: "main", driver: "reps", repsDetail: "12/side · 2s hold", dose: "12/side · 2s", eachSide: true,
            reset: "Hips square.", cue: "Press out, resist the rotation.",
            parentWatch: "Hip rotates", fix: "Wider stance.",
            swimTransfer: "Anti-rotation core", searchableName: "pallof press band" }),
        X({ name: "Glute Bridge", block: "main", driver: "reps", repsDetail: "12 · 2s squeeze", dose: "12 · 2s",
            reset: "Squeeze the top.", cue: "Squeeze top, don't arch.",
            parentWatch: "Low-back arch", fix: "Reduce range.",
            swimTransfer: "Hip extension power", searchableName: "glute bridge exercise" })
      ],
      finisher: [],
      swimskill: [
        ...SKATESKILL_A(),
        X({ name: "Scap Pull-Up + Dead Hang", block: "swimskill", driver: "time", work: 30, dose: "30s",
            reset: "Hang tall, shoulders ready.", cue: "Shoulders slide DOWN, hang and decompress.",
            swimTransfer: "Shoulder control / decompression", searchableName: "scapular pull up dead hang" })
      ]
    },
    prepMenu: []
  },

  saturday: {
    title: "POWER B — Jump + Pull + Drive",
    subtitle: "AM · NO ice · second power day, 72h from Wed",
    badge: "SAT", theme: "Jump + Pull + Drive",
    mantra: "I am SHARP. I am STRONG. I can SKATE THIS.",
    poolLoad: "none", defaultLight: "green", timeLo: 30, timeHi: 35,
    equipment: ["Plyo box", "Pull-up bar", "Resistance band", "Mat"],
    prSentinel: "Rotational-jump landing grade 1–5", amActivation: null,
    blocks: {
      warmup: [
        X({ name: "Jump Rope", block: "warmup", driver: "time", work: 90, dose: "90s", cue: "Reactive, quiet." }),
        X({ name: "Calf Raise", block: "warmup", driver: "reps", repsDetail: "12 · full range", dose: "12", cue: "Heel below the step." }),
        X({ name: "Leg Swings", block: "warmup", driver: "reps", repsDetail: "8/dir/leg", dose: "8/dir/leg", eachSide: true, cue: "Open the hips." }),
        X({ name: "Half-Kneeling Ankle Rock", block: "warmup", driver: "reps", repsDetail: "8/side (+2 R)", dose: "8/side", eachSide: true, cue: "Heel down, both sides, right deeper." })
      ],
      coordination: [
        X({ name: "Skip for Height", block: "coordination", driver: "time", work: 60, dose: "8m", cue: "Explosive — primes the jumps." })
      ],
      main: [
        X({ name: "Lateral Bound → Stick", block: "main", driver: "time", work: 30, dose: "30s · stick each", gate: "valgus", faultAnchor: true,
            reset: "Stillness is the training.", cue: "Push laterally, land and FREEZE 2s.",
            parentWatch: "Continuous bounce", fix: "Hold each landing.",
            swimTransfer: "Lateral power + landing", searchableName: "lateral bound stick landing drill" }),
        X({ name: "Skater Jump", block: "main", driver: "time", work: 30, dose: "30s", gate: "valgus",
            reset: "Full push.", cue: "Full push, freeze. Grade landing 1–5.",
            parentWatch: "Unstable past 2s", fix: "Shorten the distance.",
            swimTransfer: "Lateral push + single-leg landing", searchableName: "skater jump lateral bound landing" }),
        X({ name: "Rotational Jump w/ Frozen Landing", block: "main", driver: "reps", repsDetail: "≤6 · progress turn", dose: "≤6", gate: "valgus",
            reset: "Crown up, free leg checked.", cue: "Crown up, freeze 2–3s.",
            parentWatch: "Free-leg flail", fix: "Reduce the turn.",
            swimTransfer: "Rotation + landing", searchableName: "off-ice rotation jump landing hold quarter half" }),
        X({ name: "Band Arm-Pull-In", block: "main", driver: "time", work: 20, dose: "20s", reset: "Fast pull.",
            cue: "Fast pull, frozen finish.",
            parentWatch: "Loose finish", fix: "Slow down, fix the freeze.",
            swimTransfer: "Pull-in / rotation speed", searchableName: "off-ice rotation pull in drill arms" })
      ],
      finisher: [
        X({ name: "Resisted Band March", block: "finisher", driver: "time", work: 20, dose: "20s",
            reset: "Band on hips, tall trunk.", cue: "Drive the knee, stay tall.",
            parentWatch: "Trunk leans", fix: "Square up.",
            swimTransfer: "Posterior-chain drive", searchableName: "resisted band march drive" }),
        X({ name: "Low Box Step-Up Drive", block: "finisher", driver: "reps", repsDetail: "6/side", dose: "6/side", eachSide: true, gate: "valgus",
            reset: "Whole-foot drive.", cue: "Drive through the whole foot.",
            parentWatch: "Left-knee valgus", fix: "Lower box / stop.",
            swimTransfer: "Single-leg drive power", searchableName: "box step up drive knee" }),
        X({ name: "Pull-Up (heavy)", block: "finisher", driver: "reps", repsDetail: "3 × 4s ecc + max clean", dose: "3 × 4s ecc + max",
            reset: "Depress shoulders first.", cue: "No failure, no kip.",
            parentWatch: "Swing / shrug", fix: "Dead-hang only.",
            swimTransfer: "Pulling strength", searchableName: "strict pull up eccentric lower" }),
        X({ name: "Bird Dog", block: "finisher", driver: "reps", repsDetail: "8/side (3rd weekly)", dose: "8/side", eachSide: true,
            reset: "Thoracic-led.", cue: "Reach long, no low-back arch.",
            parentWatch: "Low-back arches", fix: "Reset, lead from the upper back.",
            swimTransfer: "Posterior body line", searchableName: "bird dog exercise" })
      ],
      swimskill: SKATESKILL_SAT()
    },
    prepMenu: []
  },

  sunday: {
    title: "Foam Roll + Review — Recovery Only",
    subtitle: "No training · recovery + weekly look-back",
    badge: "SUN", theme: "Recovery",
    mantra: "Rest IS training.",
    poolLoad: "none", defaultLight: "recovery", timeLo: 10, timeHi: 14, spa: true,
    amActivation: null,
    equipment: ["Foam roller", "Massage gun (parent-operated)", "Mat"],
    safety: "Foam roll slow (2–3 cm/sec), pause 20s on tender spots. ⚠ NEVER roll the lower-back spine or neck — parent-guided. Massage gun is PARENT-OPERATED only, lowest speed, big muscles only — never on bones, joints, spine, neck, or growth plates.",
    recovery: [
      { name: "Calves — foam roller", dose: "60s/side", why: "Jump rope + landing volume lands here." },
      { name: "Quads — roller or gun", dose: "60s/side", why: "Power days (Wed/Sat)." },
      { name: "Glutes — foam roller", dose: "45s/side", why: "Drive + landing absorption." },
      { name: "Lats / upper back — roller, arms overhead", dose: "60s", why: "Pull work + overhead range." },
      { name: "Touch-up — massage gun (parent)", dose: "30–45s/muscle", why: "Lowest speed, comfort not pain. No spine/neck." }
    ],
    recoveryHolds: [
      X({ name: "Hip CARs", block: "swimskill", driver: "reps", repsDetail: "3/dir each side", dose: "3/dir", eachSide: true, cue: "Gentle, controlled rotations." }),
      X({ name: "Superman", block: "swimskill", driver: "time", work: 24, dose: "3×8s", cue: "Thoracic extension — length, not crunch.", searchableName: "superman thoracic extension hold" }),
      X({ name: "Active Split Slide", block: "swimskill", driver: "time", work: 60, eachSide: true, dose: "3×20–30s/side", cue: "Own end-range, hips square — never passive over-split.", searchableName: "active split flexibility drill" }),
      X({ name: "Half-Kneeling Hip-Flexor Hold", block: "swimskill", driver: "time", work: 60, eachSide: true, dose: "30s/side", cue: "Posterior tilt, tall — spiral + layback line.", searchableName: "half kneeling hip flexor stretch" })
    ],
    blocks: { warmup: [], coordination: [], main: [], finisher: [], swimskill: [] },
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
  roleflip: { label: "Role Flip", desc: "Jenn demos one unit + gives the parent ONE coaching cue before the round." }
};

export const COACH_CHANNELS = {
  skate:    { label: "Figure-skating off-ice", name: "iSk8 Mom Maja", url: "https://www.youtube.com/@iSk8MomMaja" },
  mobility: { label: "Mobility & warm-up",      name: "Tom Merrick",   url: "https://www.youtube.com/@TomMerrick" },
  speed:    { label: "Speed & coordination",    name: "ALTIS",         url: "https://www.youtube.com/@ALTIS" },
  strength: { label: "Strength & core",         name: "ATHLEAN-X",     url: "https://www.youtube.com/@athleanx" }
};

export const HR_ZONES = {
  z2: { label: "Z1–Z2 · Quality / Skill",     bpm: "<130 bpm",    color: "var(--rose-400)" },
  z3: { label: "Z2 · Working",                bpm: "130–150 bpm", color: "var(--gold)" },
  z4: { label: "Power Peak · Full Recovery",  bpm: "150–170 bpm", color: "var(--stop)" }
};

export const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* Count the "moves" in a day's session (main + coordination + finisher + skill),
   used for the day-card "N moves" label. Warm-up is athlete-led, not counted. */
export function countMoves(day) {
  const b = day.blocks || {};
  return (b.coordination?.length || 0) + (b.main?.length || 0) +
         (b.finisher?.length || 0) + (b.swimskill?.length || 0);
}

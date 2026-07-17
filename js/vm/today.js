/* ============================================================================
   vm/today.js — pure view-model for the Today (Landing) screen.
   No DOM. Reads plan data + stored stats, returns a flat object the screen
   renderer maps straight into markup.
   ============================================================================ */
import { DAYS, DAY_KEYS, DAY_SHORT, countMoves } from "../data.js";
import {
  loadSettings, loadSessions, thisWeekSessions, currentStreak, journeyState,
  mondayOfThisWeek, sessionDay, localDateKey
} from "../store.js";

const DAY_MS = 86400000;
const THEME_ICON = {
  "Single-Leg + Axis": "🦵", "Spin + Push/Carry": "🌀",
  "Jump + Pull + Drive": "⚡", "Single-Leg + Core": "🎯", "Recovery": "💤"
};

function isoOf(d) { return d.toISOString().slice(0, 10); }

/* Map each weekday (Sun..Sat, matching DAY_KEYS/DAY_SHORT order) to a dated cell. */
function buildWeek(selectedKey, todayKey) {
  const monday = mondayOfThisWeek();
  // DAY_KEYS = [sunday, monday..saturday]; each weekday maps to its date within
  // the current Monday-based week (Sunday closes the week at offset +6).
  // "done" is keyed by the session's actual calendar day, not the workout name.
  const doneDates = new Set(thisWeekSessions().map(sessionDay));
  return DAY_KEYS.map((key, i) => {
    const day = DAYS[key];
    // date for this weekday within the current Mon-based week
    let offset;
    if (key === "sunday") offset = 6;                 // Sunday closes the week
    else offset = DAY_KEYS.indexOf(key) - 1;          // monday=0 … saturday=5
    const date = new Date(monday); date.setDate(monday.getDate() + offset);
    const isToday = key === todayKey;
    const isSelected = key === selectedKey;
    const isDone = doneDates.has(localDateKey(date));
    const isRest = !!day.spa;
    let status = "upcoming";
    if (isDone) status = "done";
    else if (isToday) status = "today";
    else if (isRest) status = "rest";
    return {
      key, short: DAY_SHORT[i], date: date.getDate(),
      isToday, isSelected, status,
      icon: status === "done" ? "✓" : (isRest ? "💤" : (THEME_ICON[day.theme] || "⛸️"))
    };
  });
}

export function todayKeyNow() {
  return DAY_KEYS[new Date().getDay() === 0 ? 0 : new Date().getDay()]; // getDay 0=Sun
}

export function buildTodayVM(state) {
  const settings = loadSettings();
  const todayKey = todayKeyNow();
  const selectedKey = state.selectedDay || todayKey;
  const day = DAYS[selectedKey];
  const journey = journeyState();
  const week = buildWeek(selectedKey, todayKey);
  const weekCount = thisWeekSessions().length;
  const streak = currentStreak();

  const isRecovery = !!day.spa;
  const moves = countMoves(day);

  const dateLine = new Date().toLocaleDateString(undefined,
    { weekday: "long", month: "short", day: "numeric" });

  return {
    athleteName: settings.athleteName,
    weather: state.weather || null,
    dateLine,
    selectedKey,
    todayKey,
    isSelectedToday: selectedKey === todayKey,
    week,
    legend: [
      { icon: "✓", label: "Done" },
      { icon: "⛸️", label: "Training" },
      { icon: "💤", label: "Rest" }
    ],
    statChips: [
      streak > 0
        ? { icon: "🔥", value: streak, label: "day streak", color: "var(--coral)" }
        : { icon: "⛸️", value: "Go!", label: "ready today", color: "var(--rose-500)" },
      { icon: "🏅", value: weekCount, label: "this week", color: "var(--rose-500)" },
      { icon: "⭐", value: "LVL " + journey.level, label: journey.rankName, color: "var(--gold-deep, #D99A2E)" }
    ],
    journey,
    dayView: {
      badgeLabel: day.badge,
      title: day.title,
      subtitle: day.subtitle,
      mins: `${day.timeLo}–${day.timeHi}`,
      movesLabel: isRecovery ? "Recovery" : `${moves} moves`,
      equipment: day.equipment || [],
      mantra: day.mantra,
      isRecovery,
      ctaLabel: isRecovery ? "Start recovery" : "Start today’s session",
      showBackToToday: selectedKey !== todayKey
    }
  };
}

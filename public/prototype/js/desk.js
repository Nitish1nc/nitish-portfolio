/* Coordinate contract, top-left of each card.
   Wide space is 1000 by 560, the recorded session.
   Narrow retunes the same three moments so a phone can still tell them apart. */

const WIDE = {
  started: { note: [36, 96], pdf: [340, 360], idea: [820, 72] },
  tried: { note: [300, 196], pdf: [340, 360], idea: [268, 16] },
  left: { note: [300, 148], pdf: [340, 360], idea: [860, 70] },
  link: [0, 156],
  place: { note: [500, 150], pdf: [540, 360], idea: [1000, 64], link: [0, 156] },
  tidy: { note: [0, 48], pdf: [500, 48], idea: [1000, 48] },
};

const NARROW = {
  started: { note: [0, 36], pdf: [40, 400], idea: [1000, 36] },
  tried: { note: [120, 200], pdf: [160, 410], idea: [100, 4] },
  left: { note: [0, 186], pdf: [24, 420], idea: [1000, 16] },
  link: [0, 186],
  place: { note: [1000, 16], pdf: [20, 400], idea: [1000, 220], link: [0, 200] },
  tidy: { note: [160, 8], pdf: [160, 200], idea: [160, 392] },
};

const STORY = {
  started: { note: [80, 120], pdf: [400, 340], idea: [720, 100] },
  tried: { note: [360, 200], pdf: [400, 340], idea: [380, 40] },
  left: { note: [360, 200], pdf: [400, 340], idea: [740, 120] },
};

const board = document.getElementById("board");
const stageCol = document.getElementById("stage-col");
const statusEl = document.getElementById("status");
const stampEl = document.getElementById("stamp");
const idea = document.getElementById("card-idea");
const link = document.getElementById("card-link");
const halo = document.getElementById("halo");
const ghostStart = document.getElementById("ghost-start");
const ghostTried = document.getElementById("ghost-tried");
const briefBody = document.getElementById("brief-body");
const progress = document.getElementById("progress");
const topbar = document.getElementById("topbar");
const cards = {
  note: document.getElementById("card-note"),
  pdf: document.getElementById("card-pdf"),
  idea,
  link,
};

const chapters = [...document.querySelectorAll(".chapter")];
const stopButtons = [...document.querySelectorAll("[data-stop]")];

let section = "desk";
let lock = null;
let drag = null;
let tidying = false;
let tidyTimer = 0;
let shown = { note: [360, 200], pdf: [400, 340], idea: [740, 120] };
let near = false;
let briefKey = "";
let raf = 0;
const drift = { x: 0, y: 0, tx: 0, ty: 0 };
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useNarrow() {
  return board.clientWidth < 480;
}

function mix(a, b, u) {
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
}

function smooth(u) {
  return u * u * (3 - 2 * u);
}

function poseAt(map, t) {
  const leg = t < 0.5 ? [map.started, map.tried, t / 0.5] : [map.tried, map.left, (t - 0.5) / 0.5];
  const u = smooth(leg[2]);
  return {
    note: mix(leg[0].note, leg[1].note, u),
    pdf: mix(leg[0].pdf, leg[1].pdf, u),
    idea: mix(leg[0].idea, leg[1].idea, u),
  };
}

function phaseOf(t) {
  if (t < 0.34) return "started";
  if (t < 0.78) return "tried";
  return "left";
}

function trailProgress() {
  const el = document.getElementById("trail");
  const total = el.offsetHeight - window.innerHeight;
  if (total <= 0) return 0;
  const seen = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total);
  return seen / total;
}

function activeSection() {
  const narrow = window.innerWidth < 850;
  const block = narrow ? stageCol.getBoundingClientRect().height : 0;
  const probe = narrow ? block + 36 : window.innerHeight * 0.46;
  let current = chapters[0].dataset.section;
  for (const chapter of chapters) {
    const rect = chapter.getBoundingClientRect();
    if (rect.top <= probe && rect.bottom > probe) current = chapter.dataset.section;
  }
  return current;
}

function shownT() {
  if (lock) return lock.t;
  if (section === "trail") return trailProgress();
  return 1;
}

function membersFor(t) {
  if (drag && near) return ["note", "pdf", "idea"];
  if (lock || section === "trail") {
    if (t < 0.22) return ["pdf"];
    if (t < 0.72) return ["note", "pdf", "idea"];
    return ["note", "pdf"];
  }
  return ["note", "pdf"];
}

function setXY(el, x, y, animate) {
  const wasLive = el.classList.contains("is-live");
  if (!animate || reduce) {
    el.classList.add("is-live");
    el.style.setProperty("--x", x);
    el.style.setProperty("--y", y);
    return;
  }
  el.classList.remove("is-live");
  if (wasLive) {
    requestAnimationFrame(() => {
      el.style.setProperty("--x", x);
      el.style.setProperty("--y", y);
    });
  } else {
    el.style.setProperty("--x", x);
    el.style.setProperty("--y", y);
  }
}

function box(x, y) {
  const w = board.clientWidth;
  const h = board.clientHeight;
  const cw = cards.note.offsetWidth;
  const ch = cards.note.offsetHeight;
  return {
    left: (x / 1000) * (w - cw),
    top: (y / 560) * (h - ch),
    width: cw,
    height: ch,
  };
}

function placeHalo(names, pose, animate) {
  const boxes = names.map((name) => box(pose[name][0], pose[name][1]));
  const pad = board.clientWidth < 580 ? 10 : 22;
  const left = Math.min(...boxes.map((b) => b.left)) - pad;
  const top = Math.min(...boxes.map((b) => b.top)) - pad;
  const right = Math.max(...boxes.map((b) => b.left + b.width)) + pad;
  const bottom = Math.max(...boxes.map((b) => b.top + b.height)) + pad;
  halo.classList.toggle("is-live", !animate || reduce);
  halo.style.left = left + "px";
  halo.style.top = top + "px";
  halo.style.width = right - left + "px";
  halo.style.height = bottom - top + "px";
}

function timeLabel(t) {
  if (t < 0.34) return "20:00";
  if (t < 0.78) return "20:16";
  return "20:24";
}

function stampText(point, t) {
  return timeLabel(t) + " · " + Math.round(point[0]) + ", " + Math.round(point[1]);
}

function statusText(t) {
  if (tidying) return "Packed. Putting the desk back.";
  if (drag) {
    return near
      ? "Beside the question. Release, and it returns."
      : "Drag the idea. Release, and it returns.";
  }
  if (lock || section === "trail") {
    const phase = phaseOf(t);
    if (phase === "started") return "20:00. The note is on the left. Nothing has been tried.";
    if (phase === "tried") return "20:16. The idea is with the question. This point is a trial.";
    return "20:24. The idea is put back. The note stays.";
  }
  if (section === "place") return "A new card can land before it has a name.";
  if (section === "group") return "The pool is the group. The idea was put back.";
  if (section === "ask") return "The brief matches the cards you can see.";
  if (section === "close") return "Personal prototype. Sample cards. Nothing is saved.";
  return "Settled. The note stayed with the chapter.";
}

function briefHTML(t) {
  const phase = drag && near ? "tried" : phaseOf(lock || section === "trail" ? t : 1);
  if (phase === "started") {
    return (
      row("Question", "<strong>Why don’t eigenvectors turn?</strong><br><em>Still on the left, at (80, 120). The chapter is waiting.</em>") +
      row("Anchor", "<strong>Linear algebra · Chapter 2</strong><br><em>At (400, 340) for the whole window.</em>") +
      row("Not yet", "<strong>A thought, still taking shape</strong><br><em>On the right, where it started. Nothing has been tried.</em>")
    );
  }
  if (phase === "tried") {
    return (
      row("Trial", "<strong>The idea is beside the question.</strong><br><em>At (380, 40) at 20:16. This point records a placement. It is not a decision yet.</em>") +
      row("With it", "<strong>Why don’t eigenvectors turn?</strong><br><em>Now at (360, 200), on the chapter.</em>") +
      row("Anchor", "<strong>Linear algebra · Chapter 2</strong><br><em>Still at (400, 340).</em>") +
      "<p class=\"brief-foot\">A later reading can still put the idea back. This point only says it was brought over.</p>"
    );
  }
  return (
    row("Question", "<strong>Why don’t eigenvectors turn?</strong><br>Keep the question. The answer can wait.<br><em>Moved from (80, 120) to (360, 200), and stayed.</em>") +
    row("Stayed", "<strong>Linear algebra · Chapter 2</strong><br><em>At (400, 340) for all three points.</em>") +
    row("Set aside", "<strong>A thought, still taking shape</strong><br><em>At (380, 40) at 20:16, beside the note. At (740, 120) at 20:24, near where it started.</em>") +
    "<p class=\"brief-foot\">Use the question and the material that stayed. The set-aside card is what was tried and put back.</p>"
  );
}

function row(tag, html) {
  return "<div class=\"brief-row\"><p class=\"tag\">" + tag + "</p><p>" + html + "</p></div>";
}

function paintBrief(t) {
  const key = (drag && near ? "near" : phaseOf(lock || section === "trail" ? t : 1)) + (section === "ask" ? "" : "-wait");
  if (key === briefKey) return;
  briefKey = key;
  briefBody.innerHTML = briefHTML(t);
}

function pressStops(t) {
  const phase = phaseOf(t);
  const active = lock || section === "trail" || section === "group" || section === "ask" || section === "close" || section === "desk" || section === "place";
  const shownPhase = lock || section === "trail" ? phase : "left";
  for (const button of stopButtons) {
    button.setAttribute("aria-pressed", String(active && button.dataset.stop === shownPhase));
  }
}

function measureChrome() {
  if (window.innerWidth >= 850) {
    document.documentElement.style.setProperty("--stage-block", "0px");
    return;
  }
  document.documentElement.style.setProperty("--stage-block", stageCol.offsetHeight + "px");
}

function render() {
  section = activeSection();
  document.body.dataset.section = section;
  chapters.forEach((chapter) => {
    if (chapter.dataset.section === section) chapter.classList.add("is-in");
  });

  const narrow = useNarrow();
  document.body.classList.toggle("is-narrow", narrow);
  const map = narrow ? NARROW : WIDE;
  const t = shownT();
  const follow = Boolean(drag) || (section === "trail" && !lock && !tidying);
  const base = tidying ? map.tidy : poseAt(map, lock || section === "trail" ? t : 1);
  const pose = {
    note: base.note.slice(),
    pdf: base.pdf.slice(),
    idea: base.idea.slice(),
  };

  const showLink = section === "place" && !lock && !tidying;
  if (showLink) {
    pose.note = map.place.note.slice();
    pose.pdf = map.place.pdf.slice();
    pose.idea = map.place.idea.slice();
  }
  if (drag) pose.idea = shown.idea.slice();

  setXY(cards.note, pose.note[0], pose.note[1], !follow);
  setXY(cards.pdf, pose.pdf[0], pose.pdf[1], !follow);
  setXY(cards.idea, pose.idea[0], pose.idea[1], !follow && !drag);
  shown = { note: pose.note.slice(), pdf: pose.pdf.slice(), idea: pose.idea.slice() };

  link.classList.toggle("is-shown", showLink);
  const linkAt = showLink ? map.place.link : map.link;
  setXY(cards.link, linkAt[0], showLink ? linkAt[1] : linkAt[1] - 90, showLink);

  const onTrail = (section === "trail" || lock) && !tidying;
  const g0 = onTrail ? (t <= 0.5 ? t / 0.5 : Math.max(0, 1 - (t - 0.5) / 0.4)) * 0.72 : 0;
  const g1 = onTrail ? (t <= 0.5 ? 0 : (t - 0.5) / 0.5) * 0.72 : 0;
  ghostStart.style.setProperty("--x", map.started.idea[0]);
  ghostStart.style.setProperty("--y", map.started.idea[1]);
  ghostTried.style.setProperty("--x", map.tried.idea[0]);
  ghostTried.style.setProperty("--y", map.tried.idea[1]);
  ghostStart.classList.toggle("is-live", follow);
  ghostTried.classList.toggle("is-live", follow);
  ghostStart.style.opacity = String(g0);
  ghostTried.style.opacity = String(g1);

  const names = membersFor(t);
  placeHalo(names, pose, !follow);
  document.body.classList.toggle("is-near", Boolean(drag && near));
  document.body.classList.toggle("is-locked", Boolean(lock));

  const stampOn = onTrail || Boolean(drag);
  idea.classList.toggle("is-stamped", stampOn);
  if (stampOn) {
    const storyT = lock || section === "trail" ? t : 0.5;
    const point = drag ? pose.idea : poseAt(STORY, storyT).idea;
    stampEl.textContent = stampText(point, storyT);
  }

  const nextStatus = statusText(t);
  if (statusEl.textContent !== nextStatus) statusEl.textContent = nextStatus;
  pressStops(t);
  paintBrief(t);

  const scrolled = document.documentElement.scrollHeight - window.innerHeight;
  const p = scrolled > 0 ? window.scrollY / scrolled : 0;
  progress.style.transform = "scaleX(" + p + ")";
  topbar.classList.toggle("is-scrolled", window.scrollY > 8);
  measureChrome();

  if (!reduce) {
    drift.x += (drift.tx - drift.x) * 0.08;
    drift.y += (drift.ty - drift.y) * 0.08;
    board.style.backgroundPosition = drift.x + "px " + drift.y + "px";
    if (Math.hypot(drift.tx - drift.x, drift.ty - drift.y) > 0.3) requestRender();
  }
}

function requestRender() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    render();
  });
}

function pointFromEvent(event) {
  const rect = board.getBoundingClientRect();
  const cw = cards.note.offsetWidth;
  const ch = cards.note.offsetHeight;
  const px = event.clientX - rect.left - drag.ox;
  const py = event.clientY - rect.top - drag.oy;
  const x = clamp((px / Math.max(rect.width - cw, 1)) * 1000, 0, 1000);
  const y = clamp((py / Math.max(rect.height - ch, 1)) * 560, 0, 560);
  return [x, y];
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

idea.addEventListener("pointerdown", (event) => {
  if (event.button !== undefined && event.button !== 0) return;
  tidying = false;
  clearTimeout(tidyTimer);
  const rect = board.getBoundingClientRect();
  const current = box(shown.idea[0], shown.idea[1]);
  drag = {
    ox: event.clientX - rect.left - current.left,
    oy: event.clientY - rect.top - current.top,
  };
  idea.setPointerCapture(event.pointerId);
  idea.classList.add("is-dragging");
  document.body.classList.add("has-dragged");
});

idea.addEventListener("pointermove", (event) => {
  if (!drag) return;
  shown.idea = pointFromEvent(event);
  const ideaBox = box(shown.idea[0], shown.idea[1]);
  const noteBox = box(shown.note[0], shown.note[1]);
  const dx = ideaBox.left + ideaBox.width / 2 - (noteBox.left + noteBox.width / 2);
  const dy = ideaBox.top + ideaBox.height / 2 - (noteBox.top + noteBox.height / 2);
  near = Math.hypot(dx, dy) < Math.max(ideaBox.width, ideaBox.height) * 0.9;
  requestRender();
});

function endDrag(event) {
  if (!drag) return;
  if (idea.hasPointerCapture(event.pointerId)) idea.releasePointerCapture(event.pointerId);
  drag = null;
  near = false;
  idea.classList.remove("is-dragging");
  requestRender();
}

idea.addEventListener("pointerup", endDrag);
idea.addEventListener("pointercancel", endDrag);

document.getElementById("tidy").addEventListener("click", () => {
  if (drag) return;
  tidying = true;
  clearTimeout(tidyTimer);
  requestRender();
  tidyTimer = setTimeout(() => {
    tidying = false;
    requestRender();
  }, 1100);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-stop]");
  if (!button) return;
  const t = { started: 0, tried: 0.5, left: 1 }[button.dataset.stop];
  tidying = false;
  clearTimeout(tidyTimer);
  lock = { t, y: window.scrollY };
  requestRender();
});

window.addEventListener("keydown", (event) => {
  const key = { 1: "started", 2: "tried", 3: "left" }[event.key];
  if (!key) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const t = { started: 0, tried: 0.5, left: 1 }[key];
  lock = { t, y: window.scrollY };
  requestRender();
});

window.addEventListener("scroll", () => {
  if (lock && Math.abs(window.scrollY - lock.y) > 28) lock = null;
  requestRender();
}, { passive: true });

window.addEventListener("resize", requestRender);

window.addEventListener("pointermove", (event) => {
  if (reduce) return;
  drift.tx = (event.clientX / window.innerWidth - 0.5) * 14;
  drift.ty = (event.clientY / window.innerHeight - 0.5) * 10;
  requestRender();
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-in");
  });
}, { threshold: 0.12 });

chapters.forEach((chapter) => revealObserver.observe(chapter));

render();

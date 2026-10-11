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

function setPx(el, left, top, animate) {
  const write = () => {
    el.style.left = left + "px";
    el.style.top = top + "px";
  };
  const wasLive = el.classList.contains("is-live");
  if (!animate || reduce) {
    el.classList.add("is-live");
    write();
    return;
  }
  el.classList.remove("is-live");
  if (wasLive) requestAnimationFrame(write);
  else write();
}

function cardSize() {
  return { w: cards.note.offsetWidth, h: cards.note.offsetHeight };
}

function pxFrom(x, y) {
  const size = cardSize();
  const bw = board.clientWidth;
  const bh = board.clientHeight;
  return {
    left: (x / 1000) * Math.max(bw - size.w, 0),
    top: (y / 560) * Math.max(bh - size.h, 0),
    width: size.w,
    height: size.h,
  };
}

function overlaps(a, b, gap) {
  const xPen = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const yPen = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return xPen + gap > 0 && yPen + gap > 0;
}

/* The design y maps into (board height - card height), so a short board
   collapses a vertical pile into overlapping text. Push the later card
   until a real gap remains, then shift the group back inside the board. */
function separate(items, gap) {
  for (let pass = 0; pass < 4; pass++) {
    const list = items.slice().sort((a, b) => a.top - b.top || a.left - b.left);
    let moved = false;
    for (let i = 0; i < list.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = list[j];
        const b = list[i];
        const xPen = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
        const yPen = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
        const xNeed = xPen + gap;
        const yNeed = yPen + gap;
        if (xNeed <= 0 || yNeed <= 0) continue;
        if (yNeed <= xNeed) b.top += yNeed;
        else if (b.left >= a.left) b.left += xNeed;
        else a.left += xNeed;
        moved = true;
      }
    }
    if (!moved) break;
  }
}

function fitInside(items, margin) {
  const bw = board.clientWidth;
  const bh = board.clientHeight;
  if (!items.length || bw < 1 || bh < 1) return;
  let minL = Math.min(...items.map((i) => i.left));
  let maxR = Math.max(...items.map((i) => i.left + i.width));
  let minT = Math.min(...items.map((i) => i.top));
  let maxB = Math.max(...items.map((i) => i.top + i.height));
  const roomX = bw - margin * 2;
  const roomY = bh - margin * 2;
  if (maxR - minL > roomX && maxR > minL) {
    const scale = roomX / (maxR - minL);
    const mid = (minL + maxR) / 2;
    items.forEach((i) => {
      const c = i.left + i.width / 2;
      i.left = mid + (c - mid) * scale - i.width / 2;
    });
  } else {
    if (minL < margin) items.forEach((i) => { i.left += margin - minL; });
    maxR = Math.max(...items.map((i) => i.left + i.width));
    if (maxR > bw - margin) items.forEach((i) => { i.left -= maxR - (bw - margin); });
  }
  minT = Math.min(...items.map((i) => i.top));
  maxB = Math.max(...items.map((i) => i.top + i.height));
  if (maxB - minT > roomY && maxB > minT) {
    const scale = roomY / (maxB - minT);
    const mid = (minT + maxB) / 2;
    items.forEach((i) => {
      const c = i.top + i.height / 2;
      i.top = mid + (c - mid) * scale - i.height / 2;
    });
  } else {
    if (minT < margin) items.forEach((i) => { i.top += margin - minT; });
    maxB = Math.max(...items.map((i) => i.top + i.height));
    if (maxB > bh - margin) items.forEach((i) => { i.top -= maxB - (bh - margin); });
  }
  items.forEach((i) => {
    i.left = clamp(i.left, 0, Math.max(0, bw - i.width));
    i.top = clamp(i.top, 0, Math.max(0, bh - i.height));
  });
}

function clearGhost(box, blockers) {
  const gap = 14;
  const bw = board.clientWidth;
  const bh = board.clientHeight;
  const fits = (left, top) => {
    if (left < 0 || top < 0 || left + box.width > bw + 0.5 || top + box.height > bh + 0.5) return false;
    const candidate = { left, top, width: box.width, height: box.height };
    return !blockers.some((card) => overlaps(candidate, card, gap));
  };
  if (fits(box.left, box.top)) return { ...box };
  const minT = Math.min(...blockers.map((card) => card.top));
  const maxB = Math.max(...blockers.map((card) => card.top + card.height));
  const minL = Math.min(...blockers.map((card) => card.left));
  const maxR = Math.max(...blockers.map((card) => card.left + card.width));
  const options = [
    { left: box.left, top: minT - box.height - gap },
    { left: box.left, top: maxB + gap },
    { left: minL - box.width - gap, top: box.top },
    { left: maxR + gap, top: box.top },
    { left: maxR + gap, top: maxB - box.height },
    { left: minL - box.width - gap, top: minT },
    { left: 0, top: 0 },
    { left: bw - box.width, top: 0 },
    { left: 0, top: bh - box.height },
    { left: bw - box.width, top: bh - box.height },
  ];
  let best = null;
  let bestD = Infinity;
  for (const option of options) {
    const left = clamp(option.left, 0, Math.max(0, bw - box.width));
    const top = clamp(option.top, 0, Math.max(0, bh - box.height));
    if (!fits(left, top)) continue;
    const dist = Math.hypot(left - box.left, top - box.top);
    if (dist < bestD) {
      best = { left, top, width: box.width, height: box.height };
      bestD = dist;
    }
  }
  if (best) return best;
  return {
    left: clamp(box.left, 0, Math.max(0, bw - box.width)),
    top: clamp(box.top, 0, Math.max(0, bh - box.height)),
    width: box.width,
    height: box.height,
  };
}

function placeHalo(names, boxes, animate) {
  const found = names.map((name) => boxes[name]).filter(Boolean);
  if (!found.length) return;
  const pad = board.clientWidth < 580 ? 10 : 16;
  let left = Math.min(...found.map((b) => b.left)) - pad;
  let top = Math.min(...found.map((b) => b.top)) - pad;
  let right = Math.max(...found.map((b) => b.left + b.width)) + pad;
  let bottom = Math.max(...found.map((b) => b.top + b.height)) + pad;
  left = Math.max(4, left);
  top = Math.max(4, top);
  right = Math.min(board.clientWidth - 4, right);
  bottom = Math.min(board.clientHeight - 4, bottom);
  halo.classList.toggle("is-live", !animate || reduce);
  halo.style.left = left + "px";
  halo.style.top = top + "px";
  halo.style.width = Math.max(0, right - left) + "px";
  halo.style.height = Math.max(0, bottom - top) + "px";
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

  const items = ["note", "pdf", "idea"].map((name) => ({ name, ...pxFrom(pose[name][0], pose[name][1]) }));
  if (showLink) items.push({ name: "link", ...pxFrom(map.place.link[0], map.place.link[1]) });
  if (drag) {
    const ideaItem = items.find((item) => item.name === "idea");
    ideaItem.left = drag.left;
    ideaItem.top = drag.top;
  }
  const loose = drag ? items.filter((item) => item.name !== "idea") : items;
  const onTrail = (section === "trail" || lock) && !tidying;
  const haloOn = onTrail || section === "group" || section === "ask" || section === "close" || Boolean(drag && near);
  separate(loose, 14);
  fitInside(loose, haloOn ? (narrow ? 12 : 18) : 8);
  if (drag) {
    const size = cardSize();
    const ideaItem = items.find((item) => item.name === "idea");
    ideaItem.left = clamp(drag.left, 0, Math.max(0, board.clientWidth - size.w));
    ideaItem.top = clamp(drag.top, 0, Math.max(0, board.clientHeight - size.h));
  }

  const boxes = {};
  items.forEach((item) => { boxes[item.name] = item; });
  ["note", "pdf", "idea"].forEach((name) => {
    const box = boxes[name];
    cards[name].style.zIndex = name === "idea" && drag ? "6" : String(4 + Math.round((board.clientHeight - box.top) / 4));
    setPx(cards[name], box.left, box.top, name === "idea" ? !follow && !drag : !follow);
  });

  link.classList.toggle("is-shown", showLink);
  if (showLink) {
    cards.link.style.zIndex = "5";
    setPx(cards.link, boxes.link.left, boxes.link.top, !follow);
  } else {
    const parked = pxFrom(map.link[0], map.link[1] - 90);
    setPx(cards.link, parked.left, parked.top, false);
  }

  const g0 = onTrail ? (t <= 0.5 ? t / 0.5 : Math.max(0, 1 - (t - 0.5) / 0.4)) * 0.72 : 0;
  const g1 = onTrail ? (t <= 0.5 ? 0 : (t - 0.5) / 0.5) * 0.72 : 0;
  const blockers = ["note", "pdf", "idea"].map((name) => boxes[name]);
  if (showLink) blockers.push(boxes.link);
  const gStart = clearGhost(pxFrom(map.started.idea[0], map.started.idea[1]), blockers);
  const gTried = clearGhost(pxFrom(map.tried.idea[0], map.tried.idea[1]), g0 > 0.05 ? blockers.concat([gStart]) : blockers);
  setPx(ghostStart, gStart.left, gStart.top, !follow);
  setPx(ghostTried, gTried.left, gTried.top, !follow);
  ghostStart.style.opacity = String(g0);
  ghostTried.style.opacity = String(g1);

  const names = membersFor(t);
  placeHalo(names, boxes, !follow);
  document.body.classList.toggle("is-near", Boolean(drag && near));
  document.body.classList.toggle("is-locked", Boolean(lock));

  const stampOn = onTrail || Boolean(drag);
  idea.classList.toggle("is-stamped", stampOn);
  if (stampOn) {
    const storyT = lock || section === "trail" ? t : 0.5;
    let point = poseAt(STORY, storyT).idea;
    if (drag) {
      const size = cardSize();
      point = [
        (drag.left / Math.max(board.clientWidth - size.w, 1)) * 1000,
        (drag.top / Math.max(board.clientHeight - size.h, 1)) * 560,
      ];
    }
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

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

idea.addEventListener("pointerdown", (event) => {
  if (event.button !== undefined && event.button !== 0) return;
  tidying = false;
  clearTimeout(tidyTimer);
  const rect = idea.getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();
  drag = {
    ox: event.clientX - rect.left,
    oy: event.clientY - rect.top,
    left: rect.left - boardRect.left,
    top: rect.top - boardRect.top,
  };
  idea.setPointerCapture(event.pointerId);
  idea.classList.add("is-dragging");
  document.body.classList.add("has-dragged");
});

idea.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const rect = board.getBoundingClientRect();
  const size = cardSize();
  drag.left = clamp(event.clientX - rect.left - drag.ox, 0, Math.max(0, rect.width - size.w));
  drag.top = clamp(event.clientY - rect.top - drag.oy, 0, Math.max(0, rect.height - size.h));
  const noteRect = cards.note.getBoundingClientRect();
  const dx = rect.left + drag.left + size.w / 2 - (noteRect.left + noteRect.width / 2);
  const dy = rect.top + drag.top + size.h / 2 - (noteRect.top + noteRect.height / 2);
  near = Math.hypot(dx, dy) < Math.max(size.w, size.h) * 0.9;
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

const THEME_COLOR = { paper: "#f2f0ea", dusk: "#e7e2f2", night: "#1c1b18", grove: "#e7eee4" };
const themeMeta = document.querySelector('meta[name="theme-color"]');
const themeButtons = [...document.querySelectorAll(".themes button")];

function applyTheme(name) {
  const theme = THEME_COLOR[name] ? name : "paper";
  if (theme === "paper") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  themeMeta.setAttribute("content", THEME_COLOR[theme]);
  themeButtons.forEach((button) => {
    button.setAttribute("aria-checked", String(button.dataset.theme === theme));
  });
  try { localStorage.setItem("desk-theme", theme); } catch (e) {}
}

document.querySelector(".themes").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  applyTheme(button.dataset.theme);
});

applyTheme(document.documentElement.dataset.theme || "paper");
render();

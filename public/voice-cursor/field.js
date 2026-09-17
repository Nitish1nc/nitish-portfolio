(function () {
  const field = document.querySelector(".control-field");
  if (!field) return;

  const status = document.querySelector(".console-status");
  const statusTitle = status.querySelector("strong");
  const statusHint = status.querySelector("span:last-child");
  const statusLive = status.querySelector("[data-live]");
  const readoutSmall = document.querySelector(".route-readout small");
  const readoutP = document.querySelector(".route-readout p");
  const readoutSpan = document.querySelector(".route-readout div span");
  const swatch = document.querySelector(".route-swatch");
  const velocity = document.querySelector(".velocity-readout");
  const trails = Array.from(document.querySelectorAll(".motion-trail"));
  const routeButtons = Array.from(document.querySelectorAll(".field-route"));

  const routes = {
    save: { id: "save", label: "Capture", sub: "Voice route ready", code: "ROUTE: SAVE", copy: "Loose thoughts stay parked without breaking flow." },
    ask: { id: "ask", label: "Ask AI", sub: "Voice route ready", code: "ROUTE: ASK", copy: "Questions route to the intelligence layer." },
    act: { id: "act", label: "Command", sub: "Voice route ready", code: "ROUTE: ACT", copy: "Language becomes a concrete next move." },
    dictate: { id: "dictate", label: "Dictate", sub: "Voice route ready", code: "ROUTE: WRITE", copy: "Thought becomes text where you already are." },
    none: { id: "none", label: "Observe mode", sub: "Voice layer resting", code: "ROUTE: NONE", copy: "Bring the pointer back to the center to clear intent." }
  };

  const CENTER = 0.22;
  let last = { x: 0.5, y: 0.5, t: performance.now() };
  let energy = 0.18;
  let trailI = 0;

  function routeFromAngle(deg) {
    if (deg >= 315 || deg < 45) return "save";
    if (deg >= 45 && deg < 135) return "ask";
    if (deg >= 135 && deg < 225) return "act";
    return "dictate";
  }

  function setRoute(id, live) {
    const r = routes[id] || routes.none;
    field.dataset.route = id === "none" ? "" : id;
    field.classList.toggle("is-neutral", id === "none");
    status.classList.toggle("is-live", !!live);
    if (statusLive) statusLive.textContent = live ? "Motion detected" : "Neutral gear";
    statusTitle.textContent = r.label;
    statusHint.textContent = r.sub;
    readoutSmall.textContent = r.code;
    readoutP.textContent = id === "none" ? "Voice layer is resting" : r.label;
    readoutSpan.textContent = r.copy;
    swatch.className = "route-swatch " + (id === "none" ? "rest" : "live");
    routeButtons.forEach((btn) => {
      const match = btn.classList.contains("route-" + id);
      btn.setAttribute("aria-pressed", match ? "true" : "false");
    });
    document.querySelector(".neutral-anchor").setAttribute("aria-pressed", id === "none" ? "true" : "false");
  }

  function applyPoint(nx, ny, moving) {
    const dx = nx - 0.5;
    const dy = ny - 0.5;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const deg = (angle * 180) / Math.PI + 90;
    const normDeg = (deg + 360) % 360;

    field.style.setProperty("--orb-x", nx * 100 + "%");
    field.style.setProperty("--orb-y", ny * 100 + "%");
    field.style.setProperty("--tether-angle", angle + "rad");
    field.style.setProperty("--tether-length", Math.min(dist * 100, 48) + "%");

    if (moving) {
      const t = trails[trailI % trails.length];
      t.style.left = nx * 100 + "%";
      t.style.top = ny * 100 + "%";
      t.style.opacity = String(Math.min(0.7, energy));
      trailI += 1;
    }

    if (dist < CENTER) {
      setRoute("none", false);
    } else {
      setRoute(routeFromAngle(normDeg), true);
    }
  }

  function onPointer(e) {
    const rect = field.getBoundingClientRect();
    const nx = Math.min(0.92, Math.max(0.08, (e.clientX - rect.left) / rect.width));
    const ny = Math.min(0.92, Math.max(0.08, (e.clientY - rect.top) / rect.height));
    const now = performance.now();
    const dt = Math.max(16, now - last.t);
    const speed = Math.hypot(nx - last.x, ny - last.y) / dt;
    energy = Math.min(1, speed * 28);
    field.style.setProperty("--motion-energy", String(0.18 + energy * 0.6));
    velocity.textContent = "feedback " + Math.round(energy * 100) + "%";
    applyPoint(nx, ny, true);
    last = { x: nx, y: ny, t: now };
  }

  field.addEventListener("pointermove", onPointer);
  field.addEventListener("pointerdown", onPointer);
  field.addEventListener("pointerleave", () => {
    applyPoint(0.5, 0.5, false);
    energy = 0.18;
    velocity.textContent = "feedback 0%";
    trails.forEach((t) => { t.style.opacity = "0"; });
  });

  document.querySelector(".neutral-anchor").addEventListener("click", () => {
    applyPoint(0.5, 0.5, false);
    velocity.textContent = "feedback 0%";
  });

  routeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = ["dictate", "ask", "act", "save"].find((k) => btn.classList.contains("route-" + k));
      const map = { save: [0.5, 0.18], ask: [0.78, 0.28], act: [0.5, 0.82], dictate: [0.22, 0.5] };
      const p = map[id];
      applyPoint(p[0], p[1], false);
      velocity.textContent = "feedback 32%";
    });
  });

  applyPoint(0.5, 0.5, false);
})();

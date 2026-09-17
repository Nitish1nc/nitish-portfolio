(() => {
  const DWELL_MS = 1500;
  const MOVE_CANCEL = 8;
  const material = document.getElementById("material");
  const drop = document.getElementById("dropzone");
  const stackEl = document.getElementById("stack");
  const pasteLog = document.getElementById("paste-log");
  const toast = document.getElementById("toast");
  const ring = document.getElementById("hold-ring");
  const ringArc = document.getElementById("ring-arc");
  const liveLabel = document.getElementById("live-label");
  const statCopy = document.getElementById("stat-copy");
  const statPaste = document.getElementById("stat-paste");
  const statSaved = document.getElementById("stat-saved");
  const statHoming = document.getElementById("stat-homing");

  const stack = [];
  let live = null;
  let copies = 0;
  let pastes = 0;
  let holdTimer = null;
  let holdStart = 0;
  let holdX = 0;
  let holdY = 0;
  let raf = null;
  let holdingOnDrop = false;

  const CIRC = 2 * Math.PI * 26;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  function renderStack() {
    stackEl.innerHTML = "";
    if (!stack.length) {
      stackEl.innerHTML = '<p class="empty">Nothing latched yet. Highlight a line in the source.</p>';
      liveLabel.textContent = "empty";
      return;
    }
    stack.forEach((item, i) => {
      const div = document.createElement("button");
      div.type = "button";
      div.className = "stack-item" + (item === live ? " live" : "");
      div.innerHTML = `<b>${i + 1}</b><span>${item.slice(0, 90)}${item.length > 90 ? "…" : ""}</span>`;
      div.addEventListener("click", () => {
        live = item;
        renderStack();
        showToast("Slot " + (i + 1) + " is live. Hold 1.5s on the drop pane to paste.");
      });
      stackEl.appendChild(div);
    });
    const idx = stack.indexOf(live) + 1;
    liveLabel.textContent = idx ? "slot " + idx : "empty";
  }

  function latch(text) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length < 3) return;
    const existing = stack.indexOf(clean);
    if (existing !== -1) {
      stack.splice(existing, 1);
      if (live === clean) live = stack[0] || null;
      showToast("Same line again. Popped from the stack.");
      renderStack();
      return;
    }
    stack.unshift(clean);
    if (stack.length > 9) stack.pop();
    live = clean;
    copies += 1;
    statCopy.textContent = copies;
    renderStack();
    showToast("Latched. No ⌘C.");
  }

  material.addEventListener("mouseup", () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    if (!material.contains(sel.anchorNode)) return;
    latch(sel.toString());
  });

  function setRing(x, y, p) {
    ring.style.display = "block";
    ring.style.left = x + "px";
    ring.style.top = y + "px";
    ringArc.style.strokeDashoffset = String(CIRC * (1 - p));
  }

  function stopHold(didFire) {
    holdingOnDrop = false;
    drop.classList.remove("holding");
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (!didFire) ring.style.display = "none";
  }

  function firePaste() {
    if (!live) {
      showToast("Stack is empty. Highlight something first.");
      stopHold(false);
      return;
    }
    const p = document.createElement("p");
    p.textContent = live;
    pasteLog.prepend(p);
    pastes += 1;
    statPaste.textContent = pastes;
    // Conservative KLM: 2 homing events (0.4s each) + 2 chords skipped, net of dwell.
    const homingAvoided = 2;
    statHoming.textContent = String(pastes * homingAvoided);
    const saved = (pastes * 1.2).toFixed(1);
    statSaved.textContent = saved + "s";
    showToast("Pasted. Hands never left the pad.");
    drop.classList.add("armed");
    setTimeout(() => drop.classList.remove("armed"), 500);
    stopHold(true);
    setTimeout(() => { ring.style.display = "none"; }, 200);
  }

  function tick() {
    const p = Math.min(1, (performance.now() - holdStart) / DWELL_MS);
    setRing(holdX, holdY, p);
    if (p < 1) raf = requestAnimationFrame(tick);
  }

  function onDown(e) {
    if (e.button !== 0) return;
    if (!e.target.closest || !e.target.closest(".sim-wrap")) return;
    const onDrop = drop.contains(e.target);
    holdingOnDrop = onDrop;
    if (onDrop) drop.classList.add("holding");
    holdStart = performance.now();
    holdX = e.clientX;
    holdY = e.clientY;
    setRing(holdX, holdY, 0);
    raf = requestAnimationFrame(tick);
    holdTimer = setTimeout(() => {
      if (holdingOnDrop) firePaste();
      else {
        showToast("Hold on the drop pane to paste.");
        stopHold(false);
      }
    }, DWELL_MS);
  }

  function onMove(e) {
    if (!holdTimer) return;
    const dx = e.clientX - holdX;
    const dy = e.clientY - holdY;
    if (Math.hypot(dx, dy) > MOVE_CANCEL) {
      showToast("Moved. Dwell cancelled.");
      stopHold(false);
    }
  }

  function onUp() {
    if (holdTimer) stopHold(false);
  }

  document.addEventListener("mousedown", onDown);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);

  document.addEventListener("keydown", (e) => {
    if (!e.ctrlKey || !e.shiftKey) return;
    const n = e.code.match(/^Digit([1-9])$/);
    if (!n) return;
    e.preventDefault();
    const i = Number(n[1]) - 1;
    if (!stack[i]) {
      showToast("No slot " + n[1] + " yet.");
      return;
    }
    live = stack[i];
    renderStack();
    showToast("Slot " + n[1] + " armed. Hold to paste.");
  });

  renderStack();
})();

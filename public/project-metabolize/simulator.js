/* Metabolize Simulator - Isolated Module */
(function () {
  'use strict';

  class AudioEngine {
    constructor() {
      this.ctx = null; this.enabled = true; this.masterGain = null; this._lastPrune = 0;
    }
    init() {
      if (this.ctx) return;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
      } catch (e) {}
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    tone(freq, dur, type, gain, delay) {
      if (!this.enabled || !this.ctx) return;
      this.resume();
      var t = this.ctx.currentTime + (delay || 0);
      var osc = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(gain || 0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + dur);
    }
    pop() {
      this.tone(1250, 0.05, 'square', 0.22);
      this.tone(1900, 0.06, 'sine', 0.16, 0.015);
      this.tone(880, 0.1, 'triangle', 0.12, 0.03);
    }
    click() { this.tone(900, 0.05, 'square', 0.12); }
    reject() { this.tone(140, 0.14, 'sine', 0.25); this.tone(110, 0.12, 'triangle', 0.15, 0.03); }
    compress() {
      var notes = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < notes.length; i++) this.tone(notes[i], 0.28, 'sine', 0.22, i * 0.055);
      this.tone(130.81, 0.4, 'sine', 0.28, 0.04);
      this.tone(2093, 0.18, 'sine', 0.07, 0.18);
    }
    prune() {
      var now = performance.now();
      if (now - this._lastPrune < 90) return;
      this._lastPrune = now;
      if (!this.enabled || !this.ctx) return;
      this.resume();
      var t = this.ctx.currentTime;
      var osc = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(190, t + 0.18);
      g.gain.setValueAtTime(0.13, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g); g.connect(this.masterGain);
      osc.start(t); osc.stop(t + 0.22);
    }
    survive() { this.tone(1046.5, 0.14, 'sine', 0.26); this.tone(1568, 0.09, 'sine', 0.13, 0.035); }
    flip() { this.tone(800, 0.07, 'triangle', 0.18); this.tone(1200, 0.05, 'sine', 0.13, 0.035); }
    complete() {
      var chord = [261.63, 329.63, 392, 523.25, 659.25, 783.99];
      for (var i = 0; i < chord.length; i++) this.tone(chord[i], 0.8, 'sine', 0.18, i * 0.04);
      for (var j = 0; j < 5; j++) this.tone(2000 + Math.random() * 2000, 0.3, 'sine', 0.045, 0.3 + j * 0.08);
      this.tone(65.41, 1.0, 'sine', 0.32, 0.02);
    }
    toggle() {
      this.enabled = !this.enabled;
      if (this.enabled) { this.init(); this.resume(); this.tone(880, 0.1, 'sine', 0.2); }
      return this.enabled;
    }
  }

  var audio = new AudioEngine();
  window.MetabolizeAudio = audio;
  document.addEventListener('pointerdown', function () { audio.init(); audio.resume(); }, { once: true });

  var ARTICLE = [
    "For decades, the dominant model of note-taking has been fundamentally linear: read from top to bottom, write from top to bottom, review from top to bottom. This approach assumes that knowledge is best stored and retrieved in the same sequential order it was encountered. But a growing body of cognitive science research suggests this assumption is not just limiting - it may be actively working against how human memory actually functions.",
    "The human brain did not evolve to process information in linear streams. Our memory systems are fundamentally spatial and associative. The hippocampus, the brain's primary memory consolidation center, contains place cells and grid cells that encode information in geometric relationships. When you remember where you parked your car or where you left your keys, you are not recalling a linear list - you are navigating a spatial map. The same neural machinery that handles physical navigation also handles conceptual navigation.",
    "Research by Burgess and colleagues at University College London has demonstrated that spatial memory is remarkably robust compared to other memory systems. People can remember the locations of hundreds of objects in a virtual environment with high accuracy, even after significant delays. More importantly, when information is encoded with spatial context, it becomes retrievable through multiple pathways - not just semantic association, but also geometric positioning and visual landmarks.",
    "Traditional note-taking ignores this entirely. When you write notes in a linear document, you strip away the spatial context that your brain naturally uses to organize and retrieve information. Every paragraph looks the same. Every point has equal visual weight. The structure that exists in your head - the sense that some ideas are central and others peripheral, that some concepts cluster together while others stand apart - gets flattened into a uniform stream of text.",
    "The solution is not to abandon notes, but to redesign them. A spatial note system preserves the geometric relationships between ideas. Important concepts occupy prominent positions. Related ideas cluster together visually. The distance between notes on the page reflects the conceptual distance between them. When you review these notes, your brain can use both semantic and spatial cues to retrieve information, effectively doubling the retrieval pathways available.",
    "But spatial organization alone is not enough. The real breakthrough comes when you combine spatial encoding with recursive compression. Each time you review a set of notes, you re-encounter the spatial layout you previously created. This re-encounter is itself a memory strengthening event. Then, by selectively extracting only the most essential ideas and re-arranging them in a new spatial configuration, you force your brain to make explicit judgments about what matters and what does not.",
    "This recursive process - encode spatially, review, compress, re-encode - creates a metabolizing system. Notes do not accumulate indefinitely. They shrink through successive passes, each pass forcing a re-evaluation of what is truly essential. A ten-page document becomes three pages, then one page, then a handful of core concepts arranged in a spatial pattern that your brain can navigate intuitively.",
    "The result is not just better notes. It is a fundamentally different relationship with information. Instead of hoarding knowledge in ever-growing archives, you develop a practice of continuous refinement. Your notes become living documents that evolve with your understanding, rather than static records of what you once thought was important. The cognitive load of managing your knowledge decreases even as the quality of your understanding increases.",
    "This approach requires a shift in mindset. Most note-taking systems are designed for accumulation. They reward you for capturing more, organizing more, and storing more. A metabolizing system rewards you for the opposite: for distilling, for compressing, for letting go of what is not essential. It treats forgetting not as a failure, but as a feature - a natural pruning process that leaves only what is cognitively load-bearing.",
    "The evidence is clear: spatial memory is powerful, recursive processing deepens understanding, and active compression reduces cognitive debt. The question is not whether this approach works. The question is why we have been teaching people to take notes linearly for so long, when the science of how we actually remember has been available for decades."
  ];

  var GUIDED_PASS1 = [
    { term: "a growing body of cognitive science research suggests this assumption is not just limiting", p: 0 },
    { term: "working against how human memory actually functions", p: 0 },
    { term: "memory systems are fundamentally spatial and associative", p: 1 },
    { term: "place cells and grid cells that encode information in geometric relationships", p: 1 },
    { term: "navigating a spatial map", p: 1 },
    { term: "spatial memory is remarkably robust", p: 2 },
    { term: "retrievable through multiple pathways", p: 2 },
    { term: "strip away the spatial context that your brain naturally uses", p: 3 },
    { term: "flattened into a uniform stream of text", p: 3 },
    { term: "preserves the geometric relationships between ideas", p: 4 },
    { term: "doubling the retrieval pathways available", p: 4 },
    { term: "combine spatial encoding with recursive compression", p: 5 },
    { term: "re-encounter is itself a memory strengthening event", p: 5 },
    { term: "creates a metabolizing system", p: 6 },
    { term: "A ten-page document becomes three pages, then one page", p: 6 },
    { term: "a practice of continuous refinement", p: 7 },
    { term: "decreases even as the quality of your understanding increases", p: 7 },
    { term: "forgetting not as a failure, but as a feature", p: 8 }
  ];

  var SURVIVORS = {
    2: [
      "memory systems are fundamentally spatial and associative",
      "spatial memory is remarkably robust",
      "retrievable through multiple pathways",
      "preserves the geometric relationships between ideas",
      "combine spatial encoding with recursive compression",
      "creates a metabolizing system",
      "forgetting not as a failure, but as a feature"
    ],
    3: [
      "memory systems are fundamentally spatial and associative",
      "combine spatial encoding with recursive compression",
      "forgetting not as a failure, but as a feature"
    ]
  };

  var PASS_INSTRUCTIONS = {
    1: 'Pass 1: Highlight the key ideas from this article',
    2: 'Pass 2: Click cards to keep only what is essential, then compress',
    3: 'Pass 3: Keep only the irreducible core'
  };

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function norm(s) { return s.toLowerCase().replace(/\s+/g, ' ').trim(); }
  function wordCount(s) { return (s || '').trim().split(/\s+/).filter(Boolean).length; }
  function uid() { return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function findTermRange(pEl, term) {
    var text = pEl.textContent;
    var idx = text.indexOf(term);
    if (idx === -1) return null;
    var walker = document.createTreeWalker(pEl, NodeFilter.SHOW_TEXT);
    var node, pos = 0, sN = null, sO = 0, eN = null, eO = 0;
    while ((node = walker.nextNode())) {
      var len = node.textContent.length;
      if (sN === null && pos + len > idx) { sN = node; sO = idx - pos; }
      if (sN !== null && pos + len >= idx + term.length) { eN = node; eO = idx + term.length - pos; break; }
      pos += len;
    }
    if (!sN || !eN) return null;
    var range = document.createRange();
    range.setStart(sN, sO);
    range.setEnd(eN, eO);
    return range;
  }

  function Simulator(opts) {
    this.mount = opts.mount;
    this.mode = opts.mode || 'guided';
    var self = this;
    this.originalWords = ARTICLE.reduce(function (n, p) { return n + wordCount(p); }, 0);
    this.resetState();
    this.buildDOM();
    this.bindEvents();
    this.renderCanvas();
    this.updateMeter();
    this.updateCompressBtn();
    window.addEventListener('resize', function () { self.relayoutOverlays(); });
  }

  Simulator.prototype.resetState = function () {
    this.pass = 1;
    this.items = [];
    this.isCompressing = false;
    this.isComplete = false;
  };

  Simulator.prototype.buildDOM = function () {
    var paragraphsHtml = '';
    for (var i = 0; i < ARTICLE.length; i++) {
      paragraphsHtml += '<p data-p="' + i + '">' + ARTICLE[i] + '</p>';
    }
    this.mount.innerHTML =
      '<div class="sim-container">' +
        '<div class="sim-header">' +
          '<h2>The Compression Loop</h2>' +
          '<p>Highlight on the left. Watch signal accumulate on the right. Then compress, recursively, until only the core remains.</p>' +
          '<div class="sim-mode-toggle">' +
            '<button class="sim-mode-btn' + (this.mode === 'guided' ? ' active' : '') + '" data-mode="guided">Guided Mode</button>' +
            '<button class="sim-mode-btn' + (this.mode === 'free' ? ' active' : '') + '" data-mode="free">Free Mode</button>' +
          '</div>' +
        '</div>' +
        '<div class="sim-split">' +
          '<div class="sim-source">' +
            '<div class="sim-panel-header"><span class="sim-panel-title">Source Document</span><span class="sim-version-badge" data-badge>v0</span></div>' +
            '<div class="sim-pass-bar pass-1" data-passbar>' + PASS_INSTRUCTIONS[1] + '</div>' +
            '<div class="sim-source-body" data-source>' + paragraphsHtml + '</div>' +
          '</div>' +
          '<div class="sim-canvas">' +
            '<div class="sim-panel-header"><span class="sim-panel-title">Compression Canvas</span>' +
              '<span style="display:flex;gap:8px;align-items:center;">' +
                '<button class="sim-add-btn" data-add title="Add your own note">+ Note</button>' +
                '<span class="sim-version-badge" data-badge>v0</span>' +
              '</span></div>' +
            '<div class="sim-canvas-body" data-canvas>' +
              '<div class="sim-canvas-empty" data-empty>' +
                '<div class="sim-canvas-empty-icon">&#10022;</div>' +
                '<p>Highlight text on the left. Key ideas land here, spaced the way they were in the source.</p>' +
              '</div>' +
            '</div>' +
            '<div class="sim-free-hint" data-freehint style="display:none;">Free mode: highlight anything. Click canvas cards to choose what survives compression.</div>' +
            '<div class="sim-meter">' +
              '<div class="sim-meter-bar-track"><div class="sim-meter-bar-fill" data-meterfill></div></div>' +
              '<div class="sim-meter-stats">' +
                '<span class="sim-meter-stat"><span class="val">' + this.originalWords + '</span><span class="lbl">source words</span></span>' +
                '<span class="sim-meter-stat"><span class="val" data-mcur>0</span><span class="lbl">on canvas</span></span>' +
                '<span class="sim-meter-ratio" data-mratio></span>' +
              '</div>' +
            '</div>' +
            '<div class="sim-controls">' +
              '<div class="sim-pass-dots">' +
                '<div class="sim-pass-dot active" data-dot="1">1</div>' +
                '<div class="sim-pass-connector" data-conn="1"></div>' +
                '<div class="sim-pass-dot" data-dot="2">2</div>' +
                '<div class="sim-pass-connector" data-conn="2"></div>' +
                '<div class="sim-pass-dot" data-dot="3">3</div>' +
              '</div>' +
              '<button class="sim-compress-btn" data-compress disabled>' +
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>' +
                '<span data-clabel>Compress to v1</span>' +
              '</button>' +
            '</div>' +
            '<div class="sim-completion" data-completion>' +
              '<div class="sim-particles" data-particles></div>' +
              '<div class="sim-completion-icon">&#10024;</div>' +
              '<div class="sim-completion-title">Compression Complete</div>' +
              '<div class="sim-completion-sub">You distilled a full page into its irreducible core. Load, metabolized.</div>' +
              '<div class="sim-completion-stat" data-cstat></div>' +
              '<button class="sim-reset-btn" data-reset>Run it again</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    this.el = {
      source: this.mount.querySelector('[data-source]'),
      canvas: this.mount.querySelector('[data-canvas]'),
      empty: this.mount.querySelector('[data-empty]'),
      passbar: this.mount.querySelector('[data-passbar]'),
      badges: Array.prototype.slice.call(this.mount.querySelectorAll('[data-badge]')),
      meterFill: this.mount.querySelector('[data-meterfill]'),
      mCur: this.mount.querySelector('[data-mcur]'),
      mRatio: this.mount.querySelector('[data-mratio]'),
      compress: this.mount.querySelector('[data-compress]'),
      cLabel: this.mount.querySelector('[data-clabel]'),
      completion: this.mount.querySelector('[data-completion]'),
      cStat: this.mount.querySelector('[data-cstat]'),
      particles: this.mount.querySelector('[data-particles]'),
      freehint: this.mount.querySelector('[data-freehint]')
    };
  };

  Simulator.prototype.bindEvents = function () {
    var self = this;

    this.el.source.addEventListener('mouseup', function () { self.onSelect(); });

    this.mount.querySelector('[data-compress]').addEventListener('click', function () { self.compress(); });
    this.mount.querySelector('[data-reset]').addEventListener('click', function () { self.reset(); });
    this.mount.querySelector('[data-add]').addEventListener('click', function () { self.addNote(); });

    Array.prototype.forEach.call(this.mount.querySelectorAll('.sim-mode-btn'), function (btn) {
      btn.addEventListener('click', function () {
        if (self.isCompressing) return;
        Array.prototype.forEach.call(self.mount.querySelectorAll('.sim-mode-btn'), function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        self.mode = btn.dataset.mode;
        self.reset();
      });
    });

    this.el.canvas.addEventListener('click', function (e) {
      var editBtn = e.target.closest('.sim-edit-btn');
      var expandBtn = e.target.closest('.sim-expand-btn');
      var card = e.target.closest('.sim-canvas-item');
      if (editBtn && card) { self.startEdit(card.dataset.id); return; }
      if (expandBtn && card) {
        var txt = card.querySelector('.sim-item-text');
        txt.classList.toggle('expanded');
        expandBtn.textContent = txt.classList.contains('expanded') ? '–' : '…';
        audio.click();
        return;
      }
      if (card && self.isSelectable() && !self.isCompressing && !self.isComplete) {
        var item = null;
        for (var i = 0; i < self.items.length; i++) {
          if (self.items[i].id === card.dataset.id) { item = self.items[i]; break; }
        }
        if (!item) return;
        item.selected = !item.selected;
        card.classList.toggle('selected', item.selected);
        audio.click();
        self.updateCompressBtn();
      }
    });
  };

  Simulator.prototype.onSelect = function () {
    if (this.isCompressing || this.isComplete || this.pass !== 1) return;
    var sel = window.getSelection();
    var text = sel.toString().replace(/\s+/g, ' ').trim();
    if (!text || text.length < 3 || sel.rangeCount === 0) return;

    var range = sel.getRangeAt(0);
    var node = range.commonAncestorContainer;
    var pEl = node.nodeType === 1 ? node.closest('p') : (node.parentElement ? node.parentElement.closest('p') : null);
    if (!pEl || !this.el.source.contains(pEl)) { sel.removeAllRanges(); return; }

    if (this.mode === 'guided') {
      var match = this.matchGuided(text);
      if (!match) { this.rejectFeedback(pEl); sel.removeAllRanges(); return; }
      var dup = false;
      for (var i = 0; i < this.items.length; i++) {
        if (this.items[i].canonical === match.term) { dup = true; break; }
      }
      if (dup) { this.rejectFeedback(pEl); sel.removeAllRanges(); return; }
      var termRange = findTermRange(pEl, match.term);
      this.capture(match.term, match.term, match.p, termRange || range.cloneRange());
    } else {
      this.capture(text, null, parseInt(pEl.dataset.p, 10), range.cloneRange());
    }
    sel.removeAllRanges();
  };

  Simulator.prototype.matchGuided = function (selText) {
    var sel = norm(selText);
    if (sel.length < 8) return null;
    var best = null, bestCover = 0;
    for (var i = 0; i < GUIDED_PASS1.length; i++) {
      var term = norm(GUIDED_PASS1[i].term);
      var cover = 0;
      if (term.indexOf(sel) !== -1) cover = sel.length / term.length;
      else if (sel.indexOf(term) !== -1) cover = 1;
      if (cover > bestCover) { bestCover = cover; best = GUIDED_PASS1[i]; }
    }
    return bestCover >= 0.5 ? best : null;
  };

  Simulator.prototype.rejectFeedback = function (pEl) {
    pEl.classList.add('shake');
    setTimeout(function () { pEl.classList.remove('shake'); }, 350);
    audio.reject();
  };

  Simulator.prototype.capture = function (text, canonical, pIndex, range) {
    var item = {
      id: uid(),
      text: text,
      canonical: canonical,
      p: pIndex,
      range: range,
      overlays: [],
      selected: false,
      pinned: false,
      pruned: false
    };
    this.items.push(item);
    this.paintOverlays(item);
    audio.pop();
    this.renderCanvas();
    this.updateMeter();
    this.updateCompressBtn();

    var self = this;
    requestAnimationFrame(function () {
      var card = self.el.canvas.querySelector('[data-id="' + item.id + '"]');
      if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };

  Simulator.prototype.addNote = function () {
    if (this.isCompressing || this.isComplete) return;
    var lastP = this.items.length ? this.items[this.items.length - 1].p : 0;
    var item = {
      id: uid(), text: '', canonical: null, p: lastP, range: null,
      overlays: [], selected: true, pinned: true, pruned: false
    };
    this.items.push(item);
    audio.click();
    this.renderCanvas();
    this.updateCompressBtn();
    this.startEdit(item.id);
  };

  Simulator.prototype.paintOverlays = function (item) {
    if (!item.range) return;
    var rects;
    try { rects = Array.prototype.slice.call(item.range.getClientRects()); } catch (e) { return; }
    var hostRect = this.el.source.getBoundingClientRect();
    var scrollTop = this.el.source.scrollTop;
    var scrollLeft = this.el.source.scrollLeft;
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (r.width < 2 || r.height < 2) continue;
      var o = document.createElement('div');
      o.className = 'sim-highlight-overlay pass-1';
      o.style.left = (r.left - hostRect.left + scrollLeft) + 'px';
      o.style.top = (r.top - hostRect.top + scrollTop) + 'px';
      o.style.width = r.width + 'px';
      o.style.height = r.height + 'px';
      this.el.source.appendChild(o);
      item.overlays.push(o);
    }
  };

  Simulator.prototype.relayoutOverlays = function () {
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      for (var j = 0; j < item.overlays.length; j++) item.overlays[j].remove();
      item.overlays = [];
      if (item.canonical) {
        var pEl = this.el.source.querySelector('p[data-p="' + item.p + '"]');
        if (pEl) item.range = findTermRange(pEl, item.canonical) || item.range;
      }
      this.paintOverlays(item);
      if (item.pruned) {
        for (var k = 0; k < item.overlays.length; k++) item.overlays[k].classList.add('pruned');
      }
    }
  };

  Simulator.prototype.gapClass = function (a, b) {
    var d = Math.abs(a - b);
    if (d >= 4) return 'large';
    if (d >= 2) return 'medium';
    if (d >= 1) return 'small';
    return null;
  };

  Simulator.prototype.escapeHtml = function (s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  };

  Simulator.prototype.isSelectable = function () {
    if (this.mode === 'free') return true;
    return this.pass >= 2;
  };

  Simulator.prototype.renderCanvas = function () {
    var selectable = this.isSelectable();
    var old = this.el.canvas.querySelectorAll('.sim-canvas-item, .sim-spatial-gap');
    for (var i = 0; i < old.length; i++) old[i].remove();

    this.el.empty.style.display = this.items.length ? 'none' : 'flex';

    for (var j = 0; j < this.items.length; j++) {
      var item = this.items[j];
      if (j > 0) {
        var g = this.gapClass(item.p, this.items[j - 1].p);
        if (g) {
          var gap = document.createElement('div');
          gap.className = 'sim-spatial-gap ' + g;
          this.el.canvas.appendChild(gap);
        }
      }
      var card = document.createElement('div');
      card.className = 'sim-canvas-item pass-' + Math.min(this.pass, 3) + (selectable ? ' selectable' : '') + (item.selected ? ' selected' : '');
      card.dataset.id = item.id;
      var long = (item.text || '').length > 110;
      card.innerHTML =
        '<span class="sim-item-text">' + this.escapeHtml(item.text) + '</span>' +
        (long ? '<button class="sim-item-btn sim-expand-btn" title="Expand">…</button>' : '') +
        '<button class="sim-item-btn sim-edit-btn" title="Edit (pins this note)">&#9998;</button>';
      this.el.canvas.appendChild(card);
    }
  };

  Simulator.prototype.startEdit = function (id) {
    var card = this.el.canvas.querySelector('[data-id="' + id + '"]');
    var item = null;
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].id === id) { item = this.items[i]; break; }
    }
    if (!card || !item) return;
    var span = card.querySelector('.sim-item-text');
    if (!span) return;

    var input = document.createElement('input');
    input.className = 'sim-edit-input';
    input.value = item.text;
    input.placeholder = 'Type your refined term...';
    span.replaceWith(input);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    var self = this;
    var committed = false;
    function commit() {
      if (committed) return;
      committed = true;
      var v = input.value.replace(/\s+/g, ' ').trim();
      if (v) { item.text = v; item.pinned = true; }
      audio.click();
      self.renderCanvas();
      self.updateMeter();
    }
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = item.text; input.blur(); }
    });
  };

  Simulator.prototype.updateMeter = function () {
    var cur = 0;
    for (var i = 0; i < this.items.length; i++) cur += wordCount(this.items[i].text);
    this.el.mCur.textContent = cur;
    var ratio = Math.max(0, Math.round((1 - cur / this.originalWords) * 100));
    this.el.meterFill.style.width = ratio + '%';
    this.el.mRatio.textContent = cur > 0 ? ratio + '% lighter' : '';
    this._currentWords = cur;
  };

  Simulator.prototype.updateCompressBtn = function () {
    var enabled = false;
    if (this.isComplete || this.isCompressing) enabled = false;
    else if (this.pass === 1 && this.mode === 'guided') enabled = this.items.length >= 1;
    else enabled = this.items.some(function (i) { return i.selected; });

    this.el.compress.disabled = !enabled;
    this.el.cLabel.textContent = this.pass <= 3 ? 'Compress to v' + this.pass : 'Compress';
    this.el.freehint.style.display = (this.mode === 'free' && this.pass === 1) ? 'block' : 'none';
  };

  Simulator.prototype.compress = async function () {
    if (this.isCompressing || this.isComplete) return;
    this.isCompressing = true;
    this.el.compress.disabled = true;
    this.el.compress.classList.add('compressing');
    audio.compress();

    var survivors, pruned;
    if (this.pass === 1 && this.mode === 'guided') {
      var list = SURVIVORS[2];
      survivors = this.items.filter(function (i) { return (i.canonical && list.indexOf(i.canonical) !== -1) || i.pinned; });
      pruned = this.items.filter(function (i) { return survivors.indexOf(i) === -1; });
    } else {
      survivors = this.items.filter(function (i) { return i.selected; });
      pruned = this.items.filter(function (i) { return !i.selected; });
    }
    if (!survivors.length) { survivors = this.items.slice(); pruned = []; }

    var self = this;

    /* 1. Prune: staggered exit, gray the source highlights */
    pruned.forEach(function (item, i) {
      setTimeout(function () {
        var card = self.el.canvas.querySelector('[data-id="' + item.id + '"]');
        if (card) card.classList.add('sim-pruning');
        for (var j = 0; j < item.overlays.length; j++) item.overlays[j].classList.add('pruned');
        item.pruned = true;
        audio.prune();
      }, i * 70);
    });
    await wait(pruned.length * 70 + 420);

    /* 2. Survivors glow */
    survivors.forEach(function (item) {
      var card = self.el.canvas.querySelector('[data-id="' + item.id + '"]');
      if (card) card.classList.add('sim-surviving');
    });
    audio.survive();
    await wait(380);

    /* 3. Version badge flip */
    var v = Math.min(this.pass, 3);
    this.el.badges.forEach(function (b) {
      b.textContent = 'v' + v;
      b.classList.add('flipping');
      setTimeout(function () { b.classList.remove('flipping'); }, 420);
    });
    audio.flip();

    /* 4. Advance pass, rebuild canvas cleanly */
    this.items = survivors;
    this.pass++;
    this.isCompressing = false;
    this.el.compress.classList.remove('compressing');

    if (this.pass > 3) {
      this.updateMeter();
      this.complete();
      return;
    }

    /* Pre-selection for next pass */
    if (this.mode === 'guided') {
      var nextList = SURVIVORS[this.pass + 1] || [];
      this.items.forEach(function (i) {
        i.selected = (i.canonical && nextList.indexOf(i.canonical) !== -1) || i.pinned;
      });
    } else {
      this.items.forEach(function (i) { i.selected = false; });
    }

    this.el.passbar.textContent = PASS_INSTRUCTIONS[this.pass];
    this.el.passbar.className = 'sim-pass-bar pass-' + this.pass;

    /* Pass dots */
    var dots = this.mount.querySelectorAll('.sim-pass-dot');
    var conns = this.mount.querySelectorAll('.sim-pass-connector');
    for (var d = 0; d < dots.length; d++) {
      dots[d].classList.remove('active', 'complete');
      if (d + 1 < this.pass) dots[d].classList.add('complete');
      else if (d + 1 === this.pass) dots[d].classList.add('active');
    }
    for (var c = 0; c < conns.length; c++) {
      conns[c].classList.toggle('complete', c + 1 < this.pass);
    }

    this.renderCanvas();
    this.updateMeter();
    this.updateCompressBtn();
  };

  Simulator.prototype.complete = function () {
    this.isComplete = true;
    this.renderCanvas();
    audio.complete();

    var finalWords = this._currentWords || 0;
    var ratio = Math.round((1 - finalWords / this.originalWords) * 100);
    this.el.cStat.textContent = this.originalWords + ' words → ' + finalWords + ' words (' + ratio + '% reduction)';

    var self = this;
    setTimeout(function () {
      self.el.completion.classList.add('visible');
      self.spawnParticles();
    }, 250);
  };

  Simulator.prototype.spawnParticles = function () {
    var colors = ['#F59E0B', '#10B981', '#8B5CF6', '#FCD34D', '#A7F3D0'];
    for (var i = 0; i < 26; i++) {
      (function (i, self) {
        setTimeout(function () {
          var p = document.createElement('div');
          p.className = 'sim-particle';
          p.style.background = colors[Math.floor(Math.random() * colors.length)];
          p.style.left = (50 + (Math.random() - 0.5) * 40) + '%';
          p.style.top = (45 + (Math.random() - 0.5) * 20) + '%';
          p.style.setProperty('--tx', ((Math.random() - 0.5) * 220) + 'px');
          p.style.setProperty('--ty', ((Math.random() - 0.5) * 220) + 'px');
          self.el.particles.appendChild(p);
          setTimeout(function () { p.remove(); }, 950);
        }, i * 28);
      })(i, this);
    }
  };

  Simulator.prototype.reset = function () {
    this.resetState();

    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      for (var j = 0; j < item.overlays.length; j++) item.overlays[j].remove();
    }
    this.el.source.querySelectorAll('.sim-highlight-overlay').forEach(function (o) { o.remove(); });

    this.el.badges.forEach(function (b) { b.textContent = 'v0'; });
    this.el.passbar.textContent = PASS_INSTRUCTIONS[1];
    this.el.passbar.className = 'sim-pass-bar pass-1';
    this.el.completion.classList.remove('visible');
    this.el.particles.innerHTML = '';
    this.el.compress.classList.remove('compressing');

    var dots = this.mount.querySelectorAll('.sim-pass-dot');
    var conns = this.mount.querySelectorAll('.sim-pass-connector');
    for (var d = 0; d < dots.length; d++) {
      dots[d].classList.remove('active', 'complete');
      if (d === 0) dots[d].classList.add('active');
    }
    for (var c = 0; c < conns.length; c++) conns[c].classList.remove('complete');

    this.renderCanvas();
    this.updateMeter();
    this.updateCompressBtn();
  };

  /* Auto-mount */
  function boot() {
    var mount = document.getElementById('simulator-mount');
    if (mount) new Simulator({ mount: mount, mode: 'guided' });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

(function () {
  'use strict';

  function loadConfig() {
    var el = document.getElementById('dashboard-data');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      console.error('note-to-dashboard: bad dashboard-data JSON', e);
      return null;
    }
  }

  var CFG = loadConfig();
  if (!CFG) return;

  var MODULES = (CFG.modules || []).map(function (m) {
    return {
      id: m.id,
      num: m.num,
      label: m.scienceName,
      plain: m.plainName,
      intro: m.intro,
      whatToDo: m.whatToDo,
      writerRule: m.writerRule,
      soFar: m.soFar || '',
      widgets: m.widgets || [],
    };
  });

  var storageKey = 'n2d-' + (CFG.slug || 'dashboard');
  var state = {
    lab: 0,
    labsCompleted: 0,
    bufferMode: 'staccato',
    bufferStep: 0,
    prosodySustained: true,
    prosodyLen: 5,
    closureStep: 0,
    predictTrack: 0,
    predictChoice: 'none',
  };

  function loadState() {
    try {
      var raw = sessionStorage.getItem(storageKey);
      if (raw) Object.assign(state, JSON.parse(raw));
    } catch (e) {
      /* ignore */
    }
  }

  function saveState() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rich(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&lt;(\/?(?:strong|em))&gt;/gi, '<$1>');
  }

  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function svgDefs() {
    return (
      '<svg class="iv-svg-defs" aria-hidden="true"><defs>' +
      '<linearGradient id="iv-breath-grad" x1="0%" y1="0%" x2="100%" y2="0%">' +
      '<stop offset="0%" stop-color="#7c3aed"/><stop offset="85%" stop-color="#8b5cf6"/>' +
      '<stop offset="100%" stop-color="#22d3ee" stop-opacity="0.7"/></linearGradient>' +
      '<linearGradient id="iv-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">' +
      '<stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#8b5cf6"/>' +
      '</linearGradient></defs></svg>'
    );
  }

  function breathSvg(sustained) {
    var path = sustained
      ? 'M8 30 C 40 8, 80 8, 112 22 S 184 36, 216 18 S 280 6, 312 20'
      : 'M8 22 L 80 22';
    var halt = sustained
      ? ''
      : '<line class="iv-breath-halt" x1="80" y1="10" x2="80" y2="34" stroke="currentColor" stroke-width="2" opacity="0.4"/>';
    var cx = sustained ? 312 : 80;
    var cy = sustained ? 20 : 22;
    return (
      '<svg class="iv-breath-svg" viewBox="0 0 320 44" aria-hidden="true">' +
      '<path class="iv-breath-path' +
      (sustained ? ' iv-breath-path--sustained' : '') +
      '" d="' +
      path +
      '" fill="none"' +
      (sustained ? '' : ' stroke="currentColor"') +
      '/>' +
      halt +
      '<circle class="iv-breath-dot" cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="4" fill="currentColor"/></svg>'
    );
  }

  function arcSvg(step, steps) {
    var nodes = steps.map(function (s, i) {
      var ys = [48, 28, 28, 16];
      return {
        x: 40 + i * 80,
        y: ys[i] || 28,
        active: i <= step,
        closed: step === steps.length - 1 && i === step,
        label: s.role,
      };
    });
    var activePath =
      step === 0
        ? 'M40 48'
        : step === 1
          ? 'M40 48 Q 80 28, 120 28'
          : step === 2
            ? 'M40 48 Q 120 8, 200 28'
            : 'M40 48 Q 120 8, 200 28 T 360 16';
    var circles = nodes
      .map(function (n) {
        return (
          '<g><circle cx="' +
          n.x +
          '" cy="' +
          n.y +
          '" r="' +
          (n.active ? 7 : 5) +
          '" class="' +
          (n.closed
            ? 'iv-arc-dot iv-arc-dot--closed'
            : n.active
              ? 'iv-arc-dot iv-arc-dot--active'
              : 'iv-arc-dot') +
          '"/><text x="' +
          n.x +
          '" y="66" text-anchor="middle" class="iv-arc-label' +
          (n.active ? ' iv-arc-label--active' : '') +
          '">' +
          esc(n.label) +
          '</text></g>'
        );
      })
      .join('');
    return (
      '<svg class="iv-arc-svg" viewBox="0 0 360 70" aria-hidden="true">' +
      '<path d="M40 48 Q 120 8, 200 28 T 360 16" fill="none" class="iv-arc-track"/>' +
      '<path d="' +
      activePath +
      '" fill="none" class="iv-arc-active"/>' +
      circles +
      '</svg>'
    );
  }

  function usageBar(held, purged, total) {
    total = total || 4;
    var pct = (held / total) * 100;
    return (
      '<div class="iv-usage"><div class="iv-usage__labels"><span>' +
      (purged
        ? 'Shelf: purge after each stop'
        : 'Shelf holding ' + held + ' of ' + total + ' components') +
      '</span><span>' +
      (purged ? 'Reset each beat' : 'Open until resolution') +
      '</span></div><div class="iv-usage__track"><div class="iv-bar-fill' +
      (purged ? ' iv-bar-fill--warn' : '') +
      '" style="width:' +
      pct +
      '%"></div></div></div>'
    );
  }

  function toggle(id, checked, leftLabel, rightLabel) {
    return (
      '<div class="iv-toggle-row"><span class="iv-toggle-label">' +
      esc(leftLabel) +
      '</span><button type="button" class="iv-toggle' +
      (checked ? ' is-on' : '') +
      '" id="' +
      id +
      '" role="switch" aria-checked="' +
      checked +
      '"><span class="iv-toggle__knob"></span></button><span class="iv-toggle-label">' +
      esc(rightLabel) +
      '</span></div>'
    );
  }

  function chip(text, opts) {
    opts = opts || {};
    var cls = 'iv-chip';
    if (opts.active) cls += ' iv-chip--active';
    if (opts.purged) cls += ' iv-chip--purged';
    if (opts.tappable) {
      return (
        '<button type="button" class="' +
        cls +
        ' iv-chip--tappable" data-buffer-step="' +
        opts.step +
        '">' +
        esc(text) +
        '</button>'
      );
    }
    return '<span class="' + cls + '">' + esc(text) + '</span>';
  }

  function callout(tone, title, body) {
    return (
      '<div class="iv-callout iv-callout--' +
      tone +
      '"><div class="iv-callout__title">' +
      esc(title) +
      '</div><div class="iv-callout__body">' +
      body +
      '</div></div>'
    );
  }

  function beatStrip(clauses, step, purgedMode) {
    var html = '<div class="iv-beat-strip" role="group" aria-label="Staccato beats">';
    clauses.forEach(function (c, i) {
      if (i > 0) {
        html +=
          '<span class="iv-beat-stop' +
          (purgedMode && i <= step ? ' iv-beat-stop--hit' : '') +
          '" aria-hidden="true">.</span>';
      }
      var isActive = i === step;
      var isPast = i < step;
      var cls = 'iv-beat';
      if (isActive) cls += ' iv-beat--active';
      if (purgedMode && isPast) cls += ' iv-beat--purged';
      html +=
        '<button type="button" class="' +
        cls +
        ' iv-beat--tappable" data-buffer-step="' +
        i +
        '" aria-pressed="' +
        isActive +
        '"><span class="iv-beat__letter">' +
        esc(c.beat || String(i + 1)) +
        '</span><span class="iv-beat__label">Beat ' +
        esc(c.beat || String(i + 1)) +
        '</span>' +
        (purgedMode && isPast ? '<span class="iv-beat__tag">purged</span>' : '') +
        '</button>';
    });
    html += '</div>';
    html +=
      '<p class="iv-beat-line">' +
      esc(clauses[step].line || clauses[step].text || '') +
      '</p>';
    return html;
  }

  function widgetShelfToggle(data) {
    var staccato = data.staccato || [];
    var multi = data.multi || [];
    var mode = state.bufferMode;
    var clauses = mode === 'staccato' ? staccato : multi;
    var max = Math.max(0, clauses.length - 1);
    var step = clamp(state.bufferStep, 0, max);
    var held = mode === 'staccato' ? 1 : step + 1;
    var purged = mode === 'staccato';
    var chips =
      mode === 'staccato'
        ? beatStrip(clauses, step, true)
        : '<div class="iv-chips">' +
          clauses
            .map(function (c, i) {
              return chip(c.text, {
                active: i === step || i <= step,
                tappable: true,
                step: i,
              });
            })
            .join('') +
          '</div>';
    return (
      usageBar(held, purged, clauses.length) +
      chips +
      '<div class="iv-btn-row">' +
      toggle(
        'toggle-buffer-mode',
        mode === 'multi',
        data.staccatoLabel || 'Staccato',
        data.multiLabel || 'Multi-clause'
      ) +
      '</div>' +
      '<div class="iv-btn-row">' +
      '<button type="button" class="labs-btn iv-btn" id="buffer-prev"' +
      (step <= 0 ? ' disabled' : '') +
      '>Previous</button>' +
      '<button type="button" class="labs-btn iv-btn iv-btn--primary" id="buffer-next"' +
      (step >= max ? ' disabled' : '') +
      '>Next</button>' +
      '<span class="iv-meta">' +
      (step + 1) +
      ' of ' +
      clauses.length +
      '</span></div>' +
      callout(
        mode === 'staccato' ? 'warn' : 'info',
        'Signal',
        mode === 'staccato'
          ? rich(data.signalStaccato || '')
          : rich(data.signalMulti || '')
      )
    );
  }

  function widgetBreath(data) {
    var chain = data.chain || [];
    var sustained = state.prosodySustained;
    var len = clamp(state.prosodyLen, 1, Math.max(1, chain.length));
    var visible = chain.slice(0, len);
    var chainChips = sustained
      ? visible
          .map(function (v, i) {
            return chip(i === 0 ? v : '…' + v, { active: true });
          })
          .join('')
      : chip('Beat A', { active: true }) + chip('Beat B', { purged: true });
    var controls = sustained
      ? '<div class="iv-btn-row"><span class="iv-meta">Chain length</span>' +
        '<button type="button" class="labs-btn iv-btn" id="prosody-shorter"' +
        (len <= 1 ? ' disabled' : '') +
        '>Shorter</button>' +
        '<button type="button" class="labs-btn iv-btn" id="prosody-longer"' +
        (len >= chain.length ? ' disabled' : '') +
        '>Longer</button>' +
        '<span class="iv-stat"><span class="iv-stat__value">' +
        len +
        '</span><span class="iv-stat__label">links</span></span></div>'
      : '<p class="iv-lab-note">Isolated stops cut the motor plan.</p>';
    return (
      toggle(
        'toggle-prosody',
        sustained,
        data.haltLeft || 'Abrupt halt',
        data.breathRight || 'Sustained breath'
      ) +
      '<div class="glass iv-card"><div class="iv-card__head"><span>Contour</span><span class="iv-card__trail">' +
      (sustained ? 'one breath' : 'hard stop') +
      '</span></div><div class="iv-card__body' +
      (sustained ? ' iv-card__body--sustained' : '') +
      '">' +
      breathSvg(sustained) +
      '<div class="iv-chips">' +
      chainChips +
      '</div></div></div>' +
      controls
    );
  }

  function widgetArc(data) {
    var steps = data.steps || [];
    var step = clamp(state.closureStep, 0, Math.max(0, steps.length - 1));
    var closed = steps.length && step === steps.length - 1;
    var built = steps
      .slice(0, step + 1)
      .map(function (s) {
        return s.text;
      })
      .join(' ');
    var pills = steps
      .map(function (s, i) {
        return (
          '<button type="button" class="filter-btn iv-pill' +
          (i === step ? ' active' : '') +
          '" data-closure-step="' +
          i +
          '">' +
          (i + 1) +
          '. ' +
          esc(s.role) +
          '</button>'
        );
      })
      .join('');
    return (
      arcSvg(step, steps) +
      '<div class="glass iv-card"><div class="iv-card__head"><span>Evolving proposition</span><span class="iv-card__trail' +
      (closed ? ' iv-card__trail--closed' : '') +
      '">' +
      (closed ? 'CLOSED' : 'OPEN') +
      '</span></div><div class="iv-card__body"><p class="iv-built">' +
      esc(built) +
      '</p><hr class="iv-divider"/><p class="iv-hold">' +
      esc((steps[step] && steps[step].hold) || '') +
      '</p></div></div>' +
      '<div class="iv-pills">' +
      pills +
      '</div>' +
      '<div class="iv-btn-row">' +
      '<button type="button" class="labs-btn iv-btn" id="closure-back"' +
      (step <= 0 ? ' disabled' : '') +
      '>Back</button>' +
      '<button type="button" class="labs-btn iv-btn iv-btn--primary" id="closure-advance"' +
      (closed ? ' disabled' : '') +
      '>Advance arc</button></div>'
    );
  }

  function widgetPredict(data) {
    var tracks = data.tracks || [];
    var track = clamp(state.predictTrack, 0, Math.max(0, tracks.length - 1));
    var item = tracks[track] || { cue: '', predicted: '', distractor: '', why: '' };
    var choice = state.predictChoice;
    var trackPills = tracks
      .map(function (_, i) {
        return (
          '<button type="button" class="filter-btn iv-pill' +
          (i === track ? ' active' : '') +
          '" data-predict-track="' +
          i +
          '">Track ' +
          (i + 1) +
          '</button>'
        );
      })
      .join('');
    var feedback = '';
    if (choice === 'hit') feedback = callout('success', 'Prediction locked', esc(item.why));
    else if (choice === 'miss') {
      feedback =
        callout('warn', 'Expectation broken', 'A mismatch snaps the cadence.') +
        '<p class="iv-nudge"><strong>Try the other button.</strong></p>';
    } else {
      feedback = '<p class="iv-meta iv-meta--spaced">Pick the continuation the parser expects.</p>';
    }
    return (
      '<div class="iv-pills">' +
      trackPills +
      '</div>' +
      '<div class="glass iv-card"><div class="iv-card__head"><span>What next?</span></div><div class="iv-card__body"><p class="iv-cue"><strong>' +
      esc(item.cue) +
      '</strong></p><div class="iv-btn-row iv-btn-row--choices">' +
      '<button type="button" class="labs-btn iv-btn' +
      (choice === 'hit' ? ' iv-btn--choice-hit' : '') +
      '" data-predict-choice="hit">' +
      esc(item.predicted) +
      '</button>' +
      '<button type="button" class="labs-btn iv-btn' +
      (choice === 'miss' ? ' iv-btn--choice-miss' : '') +
      '" data-predict-choice="miss">' +
      esc(item.distractor) +
      '</button></div>' +
      feedback +
      '</div></div>'
    );
  }

  function widgetNumbered(data) {
    var steps = data.steps || [];
    return (
      '<ol class="iv-mechanism-preview">' +
      steps
        .map(function (s, i) {
          return (
            '<li><span class="iv-mechanism-preview__num">' +
            String(i + 1).padStart(2, '0') +
            '</span><div><h3>' +
            esc(s.label) +
            '</h3><p>' +
            esc(s.body) +
            '</p></div></li>'
          );
        })
        .join('') +
      '</ol>'
    );
  }

  function widgetProse(data) {
    return (
      '<div class="glass iv-card"><div class="iv-card__head"><span>' +
      esc(data.title || 'Note') +
      '</span></div><div class="iv-card__body"><p class="iv-built">' +
      esc(data.body || '') +
      '</p></div></div>'
    );
  }

  function widgetCompare(data) {
    return (
      '<div class="iv-hero-contrast">' +
      '<div class="iv-contrast-card"><h3>' +
      esc(data.leftLabel || 'A') +
      '</h3><p>' +
      esc(data.leftBody || '') +
      '</p></div>' +
      '<div class="iv-contrast-card iv-contrast-card--held"><h3>' +
      esc(data.rightLabel || 'B') +
      '</h3><p>' +
      esc(data.rightBody || '') +
      '</p></div></div>'
    );
  }

  function widgetChecklist(data) {
    var items = data.items || [];
    return (
      '<ul class="iv-caveat__terms" style="list-style:none;padding:0">' +
      items
        .map(function (t) {
          return '<li><span class="iv-term">' + esc(t) + '</span></li>';
        })
        .join('') +
      '</ul>'
    );
  }

  function widgetHierarchy(data) {
    var levels = data.levels || [];
    return (
      '<ol class="iv-mechanism-preview">' +
      levels
        .map(function (lv, i) {
          return (
            '<li><span class="iv-mechanism-preview__num">L' +
            (i + 1) +
            '</span><div><h3>' +
            esc(lv.label) +
            '</h3><p>' +
            esc(lv.body) +
            '</p></div></li>'
          );
        })
        .join('') +
      '</ol>'
    );
  }

  function renderWidget(w) {
    if (!w || !w.type) return widgetProse({ title: 'Missing widget', body: '' });
    var d = w.data || {};
    if (w.type === 'shelf-toggle') return widgetShelfToggle(d);
    if (w.type === 'breath-contour') return widgetBreath(d);
    if (w.type === 'arc-stepper') return widgetArc(d);
    if (w.type === 'predict-choice') return widgetPredict(d);
    if (w.type === 'numbered-steps') return widgetNumbered(d);
    if (w.type === 'compare-pair') return widgetCompare(d);
    if (w.type === 'checklist') return widgetChecklist(d);
    if (w.type === 'hierarchy-stack') return widgetHierarchy(d);
    if (w.type === 'prose-card') return widgetProse(d);
    return widgetProse({
      title: 'Unknown widget: ' + w.type,
      body: 'Fell back to prose-card.',
    });
  }

  function renderModuleBody(mod) {
    var widgets = (mod.widgets || [])
      .map(function (w) {
        return renderWidget(w);
      })
      .join('');
    return (
      '<div class="iv-lab">' +
      '<p class="iv-lab-intro">' +
      rich(mod.intro) +
      '</p>' +
      '<div class="iv-controls"><p class="iv-what-to-do">' +
      rich(mod.whatToDo) +
      '</p></div>' +
      widgets +
      '</div>'
    );
  }

  function progressBar(lab, completed) {
    var segs = MODULES.map(function (m, i) {
      var cls = 'iv-progress__seg';
      if (i < completed) cls += ' is-done';
      if (i === lab) cls += ' is-current';
      return '<div class="' + cls + '" title="' + esc(m.plain) + '"></div>';
    }).join('');
    return (
      '<div class="iv-progress" aria-label="Lab progress">' +
      '<div class="iv-progress__label"><span>Progress</span><span>Lab ' +
      MODULES[lab].num +
      ': ' +
      esc(MODULES[lab].plain) +
      '</span></div>' +
      '<div class="iv-progress__track">' +
      segs +
      '</div></div>'
    );
  }

  function soFarLine(completed) {
    if (completed <= 0) return '';
    var parts = [];
    for (var i = 0; i < completed && i < MODULES.length; i++) {
      if (MODULES[i].soFar) parts.push(MODULES[i].soFar);
    }
    if (!parts.length) return '';
    return (
      '<p class="iv-so-far" aria-label="What you have seen so far"><strong>So far:</strong> ' +
      esc(parts.join(' ')) +
      '</p>'
    );
  }

  function renderStepper() {
    var root = document.getElementById('lab-app');
    if (!root || !MODULES.length) return;
    var lab = clamp(state.lab, 0, MODULES.length - 1);
    var completed = clamp(state.labsCompleted, 0, MODULES.length);
    var current = MODULES[lab];
    var next = lab < MODULES.length - 1 ? MODULES[lab + 1] : null;
    var pills = MODULES.map(function (m, i) {
      return (
        '<button type="button" class="filter-btn iv-pill iv-pill--map' +
        (i === lab ? ' active' : '') +
        (i < completed ? ' iv-pill--done' : '') +
        '" data-lab="' +
        i +
        '">' +
        m.num +
        ' ' +
        esc(m.plain) +
        '</button>'
      );
    }).join('');

    root.innerHTML =
      svgDefs() +
      progressBar(lab, completed) +
      soFarLine(completed) +
      '<nav class="iv-map" aria-label="Lab map">' +
      pills +
      '</nav>' +
      '<section class="iv-lab-panel glass" aria-labelledby="lab-heading">' +
      '<header class="iv-lab-header"><span class="meta-label">' +
      current.num +
      '</span><h2 id="lab-heading" class="heading text-xl font-semibold text-white">' +
      esc(current.label) +
      '</h2><p class="iv-plain-name">' +
      esc(current.plain) +
      '</p></header>' +
      renderModuleBody(current) +
      '<div class="iv-writer-rule"><span class="iv-writer-rule__label">Writer rule</span><p>' +
      esc(current.writerRule) +
      '</p></div></section>' +
      '<div class="iv-nav-row"><div class="iv-nav-row__actions">' +
      '<button type="button" class="labs-btn iv-btn" id="lab-prev"' +
      (lab <= 0 ? ' disabled' : '') +
      '>Previous lab</button>' +
      (next
        ? '<button type="button" class="labs-btn iv-btn iv-btn--primary" id="lab-next">Next: ' +
          esc(next.plain) +
          '</button>'
        : '<button type="button" class="labs-btn iv-btn iv-btn--primary" id="lab-finish">See full takeaway</button>') +
      '</div><span class="iv-nav-row__badge">Lab ' +
      current.num +
      ' of ' +
      String(MODULES.length).padStart(2, '0') +
      '</span></div>';

    var takeaway = document.getElementById('takeaway');
    if (takeaway && lab === MODULES.length - 1 && takeaway.classList.contains('is-visible')) {
      takeaway.hidden = false;
    }
    wireEvents();
    saveState();
  }

  function markLabComplete(index) {
    if (index >= state.labsCompleted) {
      state.labsCompleted = Math.min(MODULES.length, index + 1);
    }
  }

  function currentShelfData() {
    var mod = MODULES[state.lab];
    if (!mod) return { staccato: [], multi: [] };
    var w = (mod.widgets || []).find(function (x) {
      return x.type === 'shelf-toggle';
    });
    return (w && w.data) || { staccato: [], multi: [] };
  }

  function currentArcSteps() {
    var mod = MODULES[state.lab];
    if (!mod) return [];
    var w = (mod.widgets || []).find(function (x) {
      return x.type === 'arc-stepper';
    });
    return (w && w.data && w.data.steps) || [];
  }

  function currentBreathChain() {
    var mod = MODULES[state.lab];
    if (!mod) return [];
    var w = (mod.widgets || []).find(function (x) {
      return x.type === 'breath-contour';
    });
    return (w && w.data && w.data.chain) || [];
  }

  function wireEvents() {
    var root = document.getElementById('lab-app');
    if (!root) return;

    root.querySelectorAll('[data-lab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.lab = parseInt(btn.getAttribute('data-lab'), 10);
        renderStepper();
      });
    });

    var prev = document.getElementById('lab-prev');
    if (prev) {
      prev.addEventListener('click', function () {
        state.lab = Math.max(0, state.lab - 1);
        renderStepper();
      });
    }
    var next = document.getElementById('lab-next');
    if (next) {
      next.addEventListener('click', function () {
        markLabComplete(state.lab);
        state.lab = Math.min(MODULES.length - 1, state.lab + 1);
        renderStepper();
      });
    }
    var finish = document.getElementById('lab-finish');
    if (finish) {
      finish.addEventListener('click', function () {
        markLabComplete(state.lab);
        var takeaway = document.getElementById('takeaway');
        if (takeaway) {
          takeaway.hidden = false;
          takeaway.classList.add('is-visible');
          takeaway.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        saveState();
      });
    }

    var bufferToggle = document.getElementById('toggle-buffer-mode');
    if (bufferToggle) {
      bufferToggle.addEventListener('click', function () {
        state.bufferMode = state.bufferMode === 'staccato' ? 'multi' : 'staccato';
        state.bufferStep = 0;
        renderStepper();
      });
    }
    var bufferPrev = document.getElementById('buffer-prev');
    if (bufferPrev) {
      bufferPrev.addEventListener('click', function () {
        state.bufferStep = Math.max(0, state.bufferStep - 1);
        renderStepper();
      });
    }
    var bufferNext = document.getElementById('buffer-next');
    if (bufferNext) {
      bufferNext.addEventListener('click', function () {
        var data = currentShelfData();
        var list = state.bufferMode === 'staccato' ? data.staccato : data.multi;
        var max = Math.max(0, (list || []).length - 1);
        state.bufferStep = Math.min(max, state.bufferStep + 1);
        renderStepper();
      });
    }
    root.querySelectorAll('[data-buffer-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.bufferStep = parseInt(btn.getAttribute('data-buffer-step'), 10);
        renderStepper();
      });
    });

    var prosodyToggle = document.getElementById('toggle-prosody');
    if (prosodyToggle) {
      prosodyToggle.addEventListener('click', function () {
        state.prosodySustained = !state.prosodySustained;
        renderStepper();
      });
    }
    var prosodyShorter = document.getElementById('prosody-shorter');
    if (prosodyShorter) {
      prosodyShorter.addEventListener('click', function () {
        state.prosodyLen = Math.max(1, state.prosodyLen - 1);
        renderStepper();
      });
    }
    var prosodyLonger = document.getElementById('prosody-longer');
    if (prosodyLonger) {
      prosodyLonger.addEventListener('click', function () {
        var max = Math.max(1, currentBreathChain().length);
        state.prosodyLen = Math.min(max, state.prosodyLen + 1);
        renderStepper();
      });
    }

    root.querySelectorAll('[data-closure-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.closureStep = parseInt(btn.getAttribute('data-closure-step'), 10);
        renderStepper();
      });
    });
    var closureBack = document.getElementById('closure-back');
    if (closureBack) {
      closureBack.addEventListener('click', function () {
        state.closureStep = Math.max(0, state.closureStep - 1);
        renderStepper();
      });
    }
    var closureAdvance = document.getElementById('closure-advance');
    if (closureAdvance) {
      closureAdvance.addEventListener('click', function () {
        var steps = currentArcSteps();
        state.closureStep = Math.min(Math.max(0, steps.length - 1), state.closureStep + 1);
        renderStepper();
      });
    }

    root.querySelectorAll('[data-predict-track]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.predictTrack = parseInt(btn.getAttribute('data-predict-track'), 10);
        state.predictChoice = 'none';
        renderStepper();
      });
    });
    root.querySelectorAll('[data-predict-choice]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.predictChoice = btn.getAttribute('data-predict-choice');
        renderStepper();
      });
    });
  }

  function hydrateStaticWidgets() {
    document.querySelectorAll('.iv-static-widget[data-widget]').forEach(function (el) {
      try {
        var w = JSON.parse(el.getAttribute('data-widget'));
        el.innerHTML = renderWidget(w);
      } catch (e) {
        el.textContent = 'Widget failed to load.';
      }
    });
  }

  function boot() {
    loadState();
    if (
      CFG.archetype === 'stepper-lab' ||
      CFG.archetype === 'contrast-toggle'
    ) {
      renderStepper();
    } else {
      hydrateStaticWidgets();
      var takeaway = document.getElementById('takeaway');
      if (takeaway) takeaway.hidden = false;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

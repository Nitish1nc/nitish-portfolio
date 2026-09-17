(function () {
  'use strict';

  var MECHANISMS = [
    {
      id: 'buffer',
      num: '01',
      label: 'Working Memory Shelf',
      plain: 'The shelf',
      writerRule:
        'So on the page, chain clauses into one arc. Do not package and purge after every beat.',
      soFar: 'Isolated stops clear the shelf after each period. Chained syntax keeps it open.',
    },
    {
      id: 'prosody',
      num: '02',
      label: 'Prosodic Simulation',
      plain: 'The breath',
      writerRule:
        'So on the page, use parallel rhythm (-ing chains, matched cadence) so implicit prosody stays mid-breath.',
      soFar: 'Parallel grammar keeps the inner ear mid-breath instead of putting the microphone down.',
    },
    {
      id: 'closure',
      num: '03',
      label: 'Syntactic Integration',
      plain: 'The held thought',
      writerRule:
        'So on the page, park the claim on the main stem and land resolution at the end. Do not settle every clause on its own.',
      soFar: 'Integration cost stays high until semantic closure finally lands.',
    },
    {
      id: 'predict',
      num: '04',
      label: 'Predictive Syntax',
      plain: 'The next-word pull',
      writerRule:
        'So on the page, set a grammatical pattern the parser can ride. Breaking it snaps the voice.',
      soFar: 'Once rhythm locks in, the brain loads the next shape before the word arrives.',
    },
  ];

  var STACCATO = [
    { id: 's1', beat: 'A', line: 'First claim lands and wraps up.' },
    { id: 's2', beat: 'B', line: 'Shelf purged. A fresh claim starts.' },
    { id: 's3', beat: 'C', line: 'Purged again. No arc survives.' },
  ];

  var MULTI_CLAUSE = [
    { id: 'm1', text: 'She stopped at the door' },
    { id: 'm2', text: 'while he waited in the hallway' },
    { id: 'm3', text: 'as nothing moved between them' },
    { id: 'm4', text: 'until rain finally broke the silence.' },
  ];

  var BREATH_CHAIN = ['understanding', 'mapping', 'basing', 'using', 'integrating'];

  var CLOSURE_STEPS = [
    {
      role: 'Claim',
      text: 'Treating a disorder is not about suppressing symptoms',
      hold: 'Main stem parked. The reader cannot wrap up yet.',
    },
    {
      role: 'Condition',
      text: 'when you keep reopening the same diagnostic frame',
      hold: 'Condition attaches to the stem. Still one evolving proposition.',
    },
    {
      role: 'Qualification',
      text: 'and each new clause depends on that frame holding',
      hold: 'Integration cost rises. Semantic closure still pending.',
    },
    {
      role: 'Resolution',
      text: 'until the full treatment arc finally lands as one idea.',
      hold: 'Resolution arrives. The internal listener can put the mic down.',
    },
  ];

  var PREDICT_TRACKS = [
    {
      cue: 'After establishing parallel -ing…',
      predicted: 'another -ing verb',
      distractor: 'a hard full stop',
      why: 'Rhythm locks the next grammatical shape before the word arrives.',
    },
    {
      cue: 'After a subordinate if-clause…',
      predicted: 'a then-resolution',
      distractor: 'an unrelated new topic',
      why: 'Hierarchy sets an expectation of completion, not a reset.',
    },
    {
      cue: 'After not X, but…',
      predicted: 'a contrastive Y',
      distractor: 'a dictionary gloss of X',
      why: 'Contrast frames create forward pull toward the opposing term.',
    },
  ];

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
      var raw =
        sessionStorage.getItem('n2d-inner-voice') ||
        sessionStorage.getItem('inner-voice-state');
      if (raw) Object.assign(state, JSON.parse(raw));
    } catch (e) {
      /* ignore */
    }
  }

  function saveState() {
    try {
      sessionStorage.setItem('n2d-inner-voice', JSON.stringify(state));
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

  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function svgDefs() {
    return (
      '<svg class="iv-svg-defs" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="iv-breath-grad" x1="0%" y1="0%" x2="100%" y2="0%">' +
      '<stop offset="0%" stop-color="#7c3aed"/>' +
      '<stop offset="85%" stop-color="#8b5cf6"/>' +
      '<stop offset="100%" stop-color="#22d3ee" stop-opacity="0.7"/>' +
      '</linearGradient>' +
      '<linearGradient id="iv-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">' +
      '<stop offset="0%" stop-color="#7c3aed"/>' +
      '<stop offset="100%" stop-color="#8b5cf6"/>' +
      '</linearGradient>' +
      '</defs></svg>'
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
    var pathClass = sustained ? 'iv-breath-path iv-breath-path--sustained' : 'iv-breath-path';
    var strokeAttr = sustained ? '' : ' stroke="currentColor"';
    return (
      '<svg class="iv-breath-svg" viewBox="0 0 320 44" aria-hidden="true">' +
      '<path class="' +
      pathClass +
      '" d="' +
      path +
      '" fill="none"' +
      strokeAttr +
      '/>' +
      halt +
      '<circle class="iv-breath-dot" cx="' +
      cx +
      '" cy="' +
      cy +
      '" r="4" fill="currentColor"/>' +
      '</svg>'
    );
  }

  function arcSvg(step) {
    var nodes = CLOSURE_STEPS.map(function (s, i) {
      var ys = [48, 28, 28, 16];
      return {
        x: 40 + i * 80,
        y: ys[i],
        active: i <= step,
        closed: step === CLOSURE_STEPS.length - 1 && i === step,
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
          (n.closed ? 'iv-arc-dot iv-arc-dot--closed' : n.active ? 'iv-arc-dot iv-arc-dot--active' : 'iv-arc-dot') +
          '"/>' +
          '<text x="' +
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
    var barClass = purged ? 'iv-bar-fill iv-bar-fill--warn' : 'iv-bar-fill';
    return (
      '<div class="iv-usage">' +
      '<div class="iv-usage__labels">' +
      '<span>' +
      (purged ? 'Shelf: purge after each stop' : 'Shelf holding ' + held + ' of ' + total + ' components') +
      '</span>' +
      '<span>' +
      (purged ? 'Reset each beat' : 'Open until resolution') +
      '</span>' +
      '</div>' +
      '<div class="iv-usage__track"><div class="' +
      barClass +
      '" style="width:' +
      pct +
      '%"></div></div>' +
      '</div>'
    );
  }

  function toggle(id, checked, leftLabel, rightLabel) {
    return (
      '<div class="iv-toggle-row">' +
      '<span class="iv-toggle-label">' +
      esc(leftLabel) +
      '</span>' +
      '<button type="button" class="iv-toggle' +
      (checked ? ' is-on' : '') +
      '" id="' +
      id +
      '" role="switch" aria-checked="' +
      checked +
      '"><span class="iv-toggle__knob"></span></button>' +
      '<span class="iv-toggle-label">' +
      esc(rightLabel) +
      '</span>' +
      '</div>'
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
      '">' +
      '<div class="iv-callout__title">' +
      esc(title) +
      '</div>' +
      '<div class="iv-callout__body">' +
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
          '" aria-hidden="true" title="Full stop">.</span>';
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
        '">' +
        '<span class="iv-beat__letter">' +
        esc(c.beat || String(i + 1)) +
        '</span>' +
        '<span class="iv-beat__label">Beat ' +
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

  function renderBuffer() {
    var mode = state.bufferMode;
    var clauses = mode === 'staccato' ? STACCATO : MULTI_CLAUSE;
    var max = clauses.length - 1;
    var step = clamp(state.bufferStep, 0, max);
    var held = mode === 'staccato' ? 1 : step + 1;
    var purged = mode === 'staccato';
    var chips =
      mode === 'staccato'
        ? beatStrip(clauses, step, true)
        : (function () {
            return (
              '<div class="iv-chips">' +
              clauses
                .map(function (c, i) {
                  var isActive = i === step;
                  var showHeld = i <= step;
                  return chip(c.text, {
                    active: isActive || showHeld,
                    tappable: true,
                    step: i,
                  });
                })
                .join('') +
              '</div>'
            );
          })();
    return (
      '<div class="iv-lab">' +
      '<p class="iv-lab-intro">This is the <strong>working memory shelf</strong> (phonological loop in the literature). Short beats like <em>Point A, Point B, Point C</em> hit a period, package the claim, and clear the shelf. Chained, multi-clause grammar signals that the thought is incomplete. Your brain opens a buffer, stacks each component, and refuses to clear until resolution arrives.</p>' +
      '<div class="iv-controls">' +
      '<p class="iv-what-to-do"><strong>1.</strong> Flip Staccato vs Multi-clause. <strong>2.</strong> Step through clauses (or tap a chip).</p>' +
      toggle('toggle-buffer-mode', mode === 'multi', 'Staccato', 'Multi-clause') +
      '</div>' +
      usageBar(held, purged, clauses.length) +
      chips +
      '<div class="iv-btn-row">' +
      '<button type="button" class="labs-btn iv-btn" id="buffer-prev"' +
      (step <= 0 ? ' disabled' : '') +
      '>Previous clause</button>' +
      '<button type="button" class="labs-btn iv-btn iv-btn--primary" id="buffer-next"' +
      (step >= max ? ' disabled' : '') +
      '>Next clause</button>' +
      '<span class="iv-meta">Clause ' +
      (step + 1) +
      ' of ' +
      clauses.length +
      '</span></div>' +
      callout(
        mode === 'staccato' ? 'warn' : 'info',
        'Signal',
        mode === 'staccato'
          ? 'Each full stop: wrap-up, package, purge. The shelf never carries a long arc.'
          : 'Grammar says <em>not done yet</em>. Earlier clauses stay active while the brain awaits downstream resolution.'
      ) +
      '</div>'
    );
  }

  function renderProsody() {
    var sustained = state.prosodySustained;
    var len = clamp(state.prosodyLen, 1, 5);
    var visible = BREATH_CHAIN.slice(0, len);
    var chainChips = sustained
      ? visible
          .map(function (v, i) {
            return chip(i === 0 ? v : '…' + v, { active: true });
          })
          .join('')
      : chip('Beat A', { active: true }) + chip('Beat B', { purged: true });
    var chainControls = sustained
      ? '<div class="iv-btn-row">' +
        '<span class="iv-meta">Chain length</span>' +
        '<button type="button" class="labs-btn iv-btn" id="prosody-shorter"' +
        (len <= 1 ? ' disabled' : '') +
        '>Shorter</button>' +
        '<button type="button" class="labs-btn iv-btn" id="prosody-longer"' +
        (len >= 5 ? ' disabled' : '') +
        '>Longer</button>' +
        '<span class="iv-stat"><span class="iv-stat__value">' +
        len +
        '</span><span class="iv-stat__label">-ing links</span></span></div>'
      : '<p class="iv-lab-note">Isolated stops cut the motor plan. No continuous spoken contour.</p>';
    return (
      '<div class="iv-lab">' +
      '<p class="iv-lab-intro">This is <strong>implicit prosody</strong> (IPH): even during silent reading, auditory regions construct rhythm, intonation, and pauses. Chaining parallel <em>-ing</em> grammar (<em>understanding… mapping… basing… using…</em>) sets a cadence that feels like a speaker carrying one breath without putting the microphone down.</p>' +
      '<div class="iv-controls">' +
      '<p class="iv-what-to-do"><strong>1.</strong> Toggle Abrupt halt vs Sustained breath. <strong>2.</strong> If breath is on, try Shorter / Longer.</p>' +
      toggle('toggle-prosody', sustained, 'Abrupt halt', 'Sustained breath') +
      '</div>' +
      '<div class="glass iv-card">' +
      '<div class="iv-card__head"><span>Inner voice contour</span><span class="iv-card__trail">' +
      (sustained ? 'one breath' : 'hard stop') +
      '</span></div>' +
      '<div class="iv-card__body' +
      (sustained ? ' iv-card__body--sustained' : '') +
      '">' +
      breathSvg(sustained) +
      '<div class="iv-chips">' +
      chainChips +
      '</div></div></div>' +
      chainControls +
      '</div>'
    );
  }

  function renderClosure() {
    var step = clamp(state.closureStep, 0, CLOSURE_STEPS.length - 1);
    var closed = step === CLOSURE_STEPS.length - 1;
    var built = CLOSURE_STEPS.slice(0, step + 1)
      .map(function (s) {
        return s.text;
      })
      .join(' ');
    var pills = CLOSURE_STEPS.map(function (s, i) {
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
    }).join('');
    return (
      '<div class="iv-lab">' +
      '<p class="iv-lab-intro">This is <strong>syntactic integration cost</strong>. Because each new clause depends on the main stem, the reader cannot reach semantic closure until the very end. The mind stays engaged, treating every new element as an extension of the same overarching idea rather than a separate assertion.</p>' +
      arcSvg(step) +
      '<div class="glass iv-card">' +
      '<div class="iv-card__head"><span>Evolving proposition</span><span class="iv-card__trail' +
      (closed ? ' iv-card__trail--closed' : '') +
      '">' +
      (closed ? 'CLOSED' : 'OPEN') +
      '</span></div>' +
      '<div class="iv-card__body"><p class="iv-built">' +
      esc(built) +
      '</p><hr class="iv-divider"/><p class="iv-hold">' +
      esc(CLOSURE_STEPS[step].hold) +
      '</p></div></div>' +
      '<div class="iv-controls iv-controls--wrap">' +
      '<p class="iv-what-to-do"><strong>1.</strong> Tap a step pill or use Advance arc. <strong>2.</strong> Watch the arc fill until resolution lands.</p>' +
      '<div class="iv-pills">' +
      pills +
      '</div></div>' +
      '<div class="iv-btn-row">' +
      '<button type="button" class="labs-btn iv-btn" id="closure-back"' +
      (step <= 0 ? ' disabled' : '') +
      '>Back</button>' +
      '<button type="button" class="labs-btn iv-btn iv-btn--primary" id="closure-advance"' +
      (closed ? ' disabled' : '') +
      '>Advance arc</button>' +
      '<span class="iv-stat iv-stat--' +
      (closed ? 'success' : 'warn') +
      '"><span class="iv-stat__value">' +
      (closed ? 'Landed' : 'Holding') +
      '</span><span class="iv-stat__label">Semantic closure</span></span></div>' +
      '</div>'
    );
  }

  function renderPredict() {
    var track = clamp(state.predictTrack, 0, PREDICT_TRACKS.length - 1);
    var choice = state.predictChoice;
    var item = PREDICT_TRACKS[track];
    var trackPills = PREDICT_TRACKS.map(function (_, i) {
      return (
        '<button type="button" class="filter-btn iv-pill' +
        (i === track ? ' active' : '') +
        '" data-predict-track="' +
        i +
        '">Track ' +
        (i + 1) +
        '</button>'
      );
    }).join('');
    var hitClass = choice === 'hit' ? ' iv-btn--choice-hit' : choice === 'miss' ? '' : '';
    var missClass = choice === 'miss' ? ' iv-btn--choice-miss' : choice === 'hit' ? '' : '';
    var feedback = '';
    if (choice === 'hit') {
      feedback = callout('success', 'Prediction locked', item.why);
    } else if (choice === 'miss') {
      feedback =
        callout(
          'warn',
          'Expectation broken',
          'A mismatch snaps the cadence. Flow feels spoken only while predictions keep landing.'
        ) +
        '<p class="iv-nudge"><strong>Try the other button.</strong> Feel what lands versus what snaps the cadence.</p>';
    } else {
      feedback = '<p class="iv-meta iv-meta--spaced">Pick the continuation the parser is already loading.</p>';
    }
    return (
      '<div class="iv-lab">' +
      '<p class="iv-lab-intro">This is the <strong>next-word pull</strong>. Language processing is predictive: once a rhythmic, hierarchical structure is set, the parser anticipates the grammatical shape of what comes next. That forward momentum (related to storage and integration costs in DLT) is what makes written words feel like a spoken voice.</p>' +
      '<div class="iv-controls iv-controls--wrap">' +
      '<p class="iv-what-to-do"><strong>1.</strong> Pick a track. <strong>2.</strong> Choose the continuation your parser expects (try both if you miss).</p>' +
      '<div class="iv-pills">' +
      trackPills +
      '</div></div>' +
      '<div class="glass iv-card">' +
      '<div class="iv-card__head"><span>What does the parser expect next?</span></div>' +
      '<div class="iv-card__body"><p class="iv-cue"><strong>' +
      esc(item.cue) +
      '</strong></p>' +
      '<div class="iv-btn-row iv-btn-row--choices">' +
      '<button type="button" class="labs-btn iv-btn' +
      hitClass +
      '" data-predict-choice="hit">' +
      esc(item.predicted) +
      '</button>' +
      '<button type="button" class="labs-btn iv-btn' +
      missClass +
      '" data-predict-choice="miss">' +
      esc(item.distractor) +
      '</button></div>' +
      feedback +
      '</div></div></div>'
    );
  }

  function renderLabContent(id) {
    if (id === 'buffer') return renderBuffer();
    if (id === 'prosody') return renderProsody();
    if (id === 'closure') return renderClosure();
    return renderPredict();
  }

  function progressBar(lab, completed) {
    var segs = MECHANISMS.map(function (m, i) {
      var cls = 'iv-progress__seg';
      if (i < completed) cls += ' is-done';
      if (i === lab) cls += ' is-current';
      return '<div class="' + cls + '" title="' + esc(m.plain) + '"></div>';
    }).join('');
    return (
      '<div class="iv-progress" aria-label="Lab progress">' +
      '<div class="iv-progress__label">' +
      '<span>Progress</span>' +
      '<span>Lab ' +
      MECHANISMS[lab].num +
      ': ' +
      esc(MECHANISMS[lab].plain) +
      '</span></div>' +
      '<div class="iv-progress__track">' +
      segs +
      '</div></div>'
    );
  }

  function soFarLine(lab, completed) {
    if (completed <= 0) return '';
    var parts = [];
    for (var i = 0; i < completed && i < MECHANISMS.length; i++) {
      parts.push(MECHANISMS[i].soFar);
    }
    return (
      '<p class="iv-so-far" aria-label="What you have seen so far">' +
      '<strong>So far:</strong> ' +
      esc(parts.join(' ')) +
      '</p>'
    );
  }

  function render() {
    var root = document.getElementById('lab-app');
    if (!root) return;
    var lab = clamp(state.lab, 0, MECHANISMS.length - 1);
    var completed = clamp(state.labsCompleted, 0, MECHANISMS.length);
    var current = MECHANISMS[lab];
    var next = lab < MECHANISMS.length - 1 ? MECHANISMS[lab + 1] : null;

    var pills = MECHANISMS.map(function (m, i) {
      var done = i < completed;
      return (
        '<button type="button" class="filter-btn iv-pill iv-pill--map' +
        (i === lab ? ' active' : '') +
        (done ? ' iv-pill--done' : '') +
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
      soFarLine(lab, completed) +
      '<nav class="iv-map" aria-label="Lab map">' +
      pills +
      '</nav>' +
      '<section class="iv-lab-panel glass" aria-labelledby="lab-heading">' +
      '<header class="iv-lab-header">' +
      '<span class="meta-label">' +
      current.num +
      '</span>' +
      '<h2 id="lab-heading" class="heading text-xl font-semibold text-white">' +
      esc(current.label) +
      '</h2>' +
      '<p class="iv-plain-name">' +
      esc(current.plain) +
      '</p></header>' +
      renderLabContent(current.id) +
      '<div class="iv-writer-rule">' +
      '<span class="iv-writer-rule__label">Writer rule</span>' +
      '<p>' +
      esc(current.writerRule) +
      '</p></div>' +
      '</section>' +
      '<div class="iv-nav-row">' +
      '<div class="iv-nav-row__actions">' +
      '<button type="button" class="labs-btn iv-btn" id="lab-prev"' +
      (lab <= 0 ? ' disabled' : '') +
      '>Previous lab</button>' +
      (next
        ? '<button type="button" class="labs-btn iv-btn iv-btn--primary" id="lab-next">Next: ' +
          esc(next.plain) +
          '</button>'
        : '<button type="button" class="labs-btn iv-btn iv-btn--primary" id="lab-finish">See full takeaway</button>') +
      '</div>' +
      '<span class="iv-nav-row__badge">Lab ' +
      current.num +
      ' of 04</span></div>';

    var takeaway = document.getElementById('takeaway');
    if (takeaway) {
      if (lab === MECHANISMS.length - 1 && takeaway.classList.contains('is-visible')) {
        takeaway.hidden = false;
      }
    }

    wireEvents();
    saveState();
  }

  function markLabComplete(index) {
    if (index >= state.labsCompleted) {
      state.labsCompleted = Math.min(MECHANISMS.length, index + 1);
    }
  }

  function wireEvents() {
    var root = document.getElementById('lab-app');
    if (!root) return;

    root.querySelectorAll('[data-lab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.lab = parseInt(btn.getAttribute('data-lab'), 10);
        render();
      });
    });

    var prev = document.getElementById('lab-prev');
    if (prev) {
      prev.addEventListener('click', function () {
        state.lab = Math.max(0, state.lab - 1);
        render();
      });
    }

    var next = document.getElementById('lab-next');
    if (next) {
      next.addEventListener('click', function () {
        markLabComplete(state.lab);
        state.lab = Math.min(MECHANISMS.length - 1, state.lab + 1);
        render();
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
        render();
      });
    }

    var bufferPrev = document.getElementById('buffer-prev');
    if (bufferPrev) {
      bufferPrev.addEventListener('click', function () {
        state.bufferStep = Math.max(0, state.bufferStep - 1);
        render();
      });
    }

    var bufferNext = document.getElementById('buffer-next');
    if (bufferNext) {
      bufferNext.addEventListener('click', function () {
        var max = (state.bufferMode === 'staccato' ? STACCATO : MULTI_CLAUSE).length - 1;
        state.bufferStep = Math.min(max, state.bufferStep + 1);
        render();
      });
    }

    root.querySelectorAll('[data-buffer-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.bufferStep = parseInt(btn.getAttribute('data-buffer-step'), 10);
        render();
      });
    });

    var prosodyToggle = document.getElementById('toggle-prosody');
    if (prosodyToggle) {
      prosodyToggle.addEventListener('click', function () {
        state.prosodySustained = !state.prosodySustained;
        render();
      });
    }

    var prosodyShorter = document.getElementById('prosody-shorter');
    if (prosodyShorter) {
      prosodyShorter.addEventListener('click', function () {
        state.prosodyLen = Math.max(1, state.prosodyLen - 1);
        render();
      });
    }

    var prosodyLonger = document.getElementById('prosody-longer');
    if (prosodyLonger) {
      prosodyLonger.addEventListener('click', function () {
        state.prosodyLen = Math.min(5, state.prosodyLen + 1);
        render();
      });
    }

    root.querySelectorAll('[data-closure-step]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.closureStep = parseInt(btn.getAttribute('data-closure-step'), 10);
        render();
      });
    });

    var closureBack = document.getElementById('closure-back');
    if (closureBack) {
      closureBack.addEventListener('click', function () {
        state.closureStep = Math.max(0, state.closureStep - 1);
        render();
      });
    }

    var closureAdvance = document.getElementById('closure-advance');
    if (closureAdvance) {
      closureAdvance.addEventListener('click', function () {
        state.closureStep = Math.min(CLOSURE_STEPS.length - 1, state.closureStep + 1);
        render();
      });
    }

    root.querySelectorAll('[data-predict-track]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.predictTrack = parseInt(btn.getAttribute('data-predict-track'), 10);
        state.predictChoice = 'none';
        render();
      });
    });

    root.querySelectorAll('[data-predict-choice]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.predictChoice = btn.getAttribute('data-predict-choice');
        render();
      });
    });
  }

  loadState();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();

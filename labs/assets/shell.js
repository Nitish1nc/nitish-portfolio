/**
 * NitishLabs shared page shell.
 * Injects nav + footer into [data-labs-nav] and [data-labs-footer].
 *
 * Optional attrs on placeholders:
 *   data-labs-variant="home|ideas|article"  (auto-detected if omitted)
 *   data-labs-active="Latest"               (active nav label override)
 */
(function () {
  var EXPERIMENT_DIRS = ['encoding-is-not-understanding', 'capture-first-decode-later', 'inner-voice', 'metabolize', 'atlas', 'reality-engine', 'hydraulic-crumble', 'relief-valve'];

  function isExperimentPath(path) {
    return EXPERIMENT_DIRS.some(function (dir) {
      return new RegExp('/' + dir + '(/|$)').test(path);
    });
  }

  function rootPrefix() {
    var path = (location.pathname || '').replace(/\\/g, '/');
    if (/\/(posts|projects)\//.test(path)) return '../';
    if (isExperimentPath(path)) return '../';
    return '';
  }

  function detectVariant() {
    var path = (location.pathname || '').replace(/\\/g, '/');
    if (/ideas\.html?$/i.test(path) || /\/ideas\/?$/i.test(path)) return 'ideas';
    if (/\/(posts|projects)\//.test(path)) return 'article';
    if (isExperimentPath(path)) return 'article';
    return 'home';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function link(href, label, opts) {
    opts = opts || {};
    var classes = opts.block ? 'block nav-link' : 'nav-link';
    if (opts.active) classes += ' is-active';
    return (
      '<a href="' +
      escapeHtml(href) +
      '" class="' +
      classes +
      '"' +
      (opts.active ? ' aria-current="page"' : '') +
      '>' +
      escapeHtml(label) +
      '</a>'
    );
  }

  function buildNav(variant, root, activeLabel) {
    var home = root + 'index.html';
    var ideas = root + 'ideas.html';
    var isHome = variant === 'home';
    var isIdeas = variant === 'ideas';
    var isArticle = variant === 'article';

    var brandHref = isHome ? home.replace(/index\.html$/, '') || './' : home;
    if (isHome) brandHref = './';

    var desktopLinks;
    var mobileLinks;

    if (isArticle) {
      desktopLinks = [
        link(home, 'Lab', { active: activeLabel === 'Lab' }),
        link(ideas, 'Latest', { active: activeLabel === 'Latest' }),
        link(home + '#experiments', 'Experiments', { active: activeLabel === 'Experiments' })
      ].join('\n ');
      mobileLinks = [
        link(home, 'Lab', { block: true, active: activeLabel === 'Lab' }),
        link(ideas, 'Latest', { block: true, active: activeLabel === 'Latest' }),
        link(home + '#experiments', 'Experiments', {
          block: true,
          active: activeLabel === 'Experiments'
        })
      ].join('\n ');
    } else if (isIdeas) {
      desktopLinks = [
        link(home, 'Home', { active: activeLabel === 'Home' }),
        link(home + '#context', 'Context'),
        link(home + '#ideas', 'Ideas'),
        link(home + '#experiments', 'Experiments'),
        link(home + '#models', 'Mental Models'),
        link(ideas, 'Latest', { active: activeLabel === 'Latest' || !activeLabel })
      ].join('\n ');
      mobileLinks = [
        link(home, 'Home', { block: true, active: activeLabel === 'Home' }),
        link(home + '#context', 'Context', { block: true }),
        link(home + '#ideas', 'Ideas', { block: true }),
        link(home + '#experiments', 'Experiments', { block: true }),
        link(home + '#models', 'Mental Models', { block: true }),
        link(ideas, 'Latest', {
          block: true,
          active: activeLabel === 'Latest' || !activeLabel
        })
      ].join('\n ');
    } else {
      desktopLinks = [
        link('#welcome', 'Welcome', { active: activeLabel === 'Welcome' }),
        link('#context', 'Before you go', { active: activeLabel === 'Before you go' }),
        link('#doors', 'Doors', { active: activeLabel === 'Doors' }),
        link(ideas, 'Stream', { active: activeLabel === 'Stream' }),
        link(ideas, 'Latest', { active: activeLabel === 'Latest' }),
        link('#about', 'Closing', { active: activeLabel === 'Closing' })
      ].join('\n ');
      mobileLinks = [
        link('#welcome', 'Welcome', { block: true }),
        link('#context', 'Before you go', { block: true }),
        link('#doors', 'Doors', { block: true }),
        link(ideas, 'Stream', { block: true }),
        link(ideas, 'Latest', { block: true }),
        link('#about', 'Closing', { block: true })
      ].join('\n ');
    }

    var navClass = isArticle ? 'labs-nav' : 'labs-shell-nav';
    return (
      '<nav class="' +
      navClass +
      '">' +
      '<div class="labs-nav__inner">' +
      '<a href="' +
      escapeHtml(brandHref) +
      '" class="flex items-center gap-3 group">' +
      '<div class="brand-mark w-8 h-8 flex items-center justify-center text-white font-bold text-sm">N</div>' +
      '<span class="heading text-xl font-semibold tracking-tight group-hover:text-white transition-colors">NitishLabs</span>' +
      '</a>' +
      '<div id="desktop-nav" class="labs-nav__links">' +
      desktopLinks +
      '</div>' +
      '<button type="button" id="menu-btn" class="labs-nav__menu-btn nav-link" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">' +
      '<i class="fa-solid fa-bars text-lg" aria-hidden="true"></i>' +
      '</button>' +
      '</div>' +
      '<div id="mobile-nav" class="labs-nav__mobile hidden" hidden>' +
      mobileLinks +
      '</div>' +
      '</nav>'
    );
  }

  function buildFooter(variant, root) {
    var home = root + 'index.html';
    var ideas = root + 'ideas.html';

    if (variant === 'article') {
      return (
        '<footer class="article-footer labs-shell-footer" data-labs-shell-footer>' +
        '<a href="' +
        escapeHtml(ideas) +
        '">← Latest from the Lab</a>' +
        '<a href="' +
        escapeHtml(home) +
        '">Lab home</a>' +
        '</footer>'
      );
    }

    if (variant === 'ideas') {
      return (
        '<footer class="labs-shell-footer border-t border-zinc-800/60 py-10">' +
        '<div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-zinc-500">' +
        '<div>© 2026 NitishLabs · Nitish Chauhan</div>' +
        '<a href="' +
        escapeHtml(home) +
        '" class="nav-link">← Back to Lab</a>' +
        '</div>' +
        '</footer>'
      );
    }

    return (
      '<footer class="labs-shell-footer border-t border-zinc-800/60 py-10">' +
      '<div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">' +
      '<div>© 2026 NitishLabs · Nitish Chauhan</div>' +
      '<div class="flex gap-6">' +
      '<a href="https://www.nitishchauhan.com" class="hover:text-white transition-colors">Portfolio</a>' +
      '<a href="https://chat.nitishchauhan.com" class="hover:text-white transition-colors">Chat</a>' +
      '</div>' +
      '</div>' +
      '</footer>'
    );
  }

  function wireMobileNav(rootEl) {
    var menuBtn = rootEl.querySelector('#menu-btn');
    var mobileNav = rootEl.querySelector('#mobile-nav');
    if (!menuBtn || !mobileNav) return;

    function setOpen(open) {
      mobileNav.classList.toggle('hidden', !open);
      if (open) mobileNav.removeAttribute('hidden');
      else mobileNav.setAttribute('hidden', '');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    setOpen(false);
    menuBtn.addEventListener('click', function () {
      setOpen(mobileNav.classList.contains('hidden'));
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        setOpen(false);
      });
    });
  }

  function mount() {
    var root = rootPrefix();
    var navHost = document.querySelector('[data-labs-nav]');
    var footerHost = document.querySelector('[data-labs-footer]');
    var variant =
      (navHost && navHost.getAttribute('data-labs-variant')) ||
      (footerHost && footerHost.getAttribute('data-labs-variant')) ||
      detectVariant();
    var activeLabel =
      (navHost && navHost.getAttribute('data-labs-active')) ||
      (variant === 'ideas' ? 'Latest' : '');

    if (navHost) {
      navHost.outerHTML = buildNav(variant, root, activeLabel);
      var nav = document.querySelector('nav.labs-shell-nav, nav.labs-nav');
      if (nav) wireMobileNav(nav);
    }

    if (footerHost) {
      footerHost.outerHTML = buildFooter(variant, root);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

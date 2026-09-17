/**
 * Resolve NitishLabs post covers.
 *
 * Convention (for Visual Wiki Map / cover agents):
 * labs/posts/<slug>/carousel/cover.svg (preferred)
 * labs/posts/<slug>/carousel/cover.png
 * fallback → slide-01.svg
 *
 * Usage:
 * data-labs-cover="posts/slug/carousel" (from index / ideas)
 * data-labs-cover="slug/carousel" (from post pages)
 * or pass cover URL via data-labs-cover-src
 */
(function () {
 function candidates(base, explicit) {
 const list = [];
 if (explicit) list.push(explicit);
 let root = base ? String(base).replace(/\/$/, '') : '';
 if (!root && explicit) {
 root = String(explicit).replace(/\/cover\.(svg|png)$/i, '');
 }
 if (root) {
 [root + '/cover.svg', root + '/cover.png', root + '/slide-01.svg'].forEach(function (url) {
 if (list.indexOf(url) === -1) list.push(url);
 });
 }
 return list;
 }

 function tryLoad(img, urls, wrap, index) {
 if (index >= urls.length) {
 wrap.classList.add('is-empty');
 img.removeAttribute('src');
 return;
 }
 const url = urls[index];
 const probe = new Image();
 probe.onload = function () {
 img.src = url;
 wrap.classList.toggle('is-fallback', /slide-01\.(svg|png)$/i.test(url));
 wrap.classList.remove('is-empty');
 };
 probe.onerror = function () {
 tryLoad(img, urls, wrap, index + 1);
 };
 probe.src = url;
 }

 function hydrate(el) {
 const base = el.getAttribute('data-labs-cover') || '';
 const explicit = el.getAttribute('data-labs-cover-src') || '';
 let img = el.querySelector('img');
 if (!img) {
 img = document.createElement('img');
 img.alt = el.getAttribute('data-labs-cover-alt') || 'Post cover';
 img.width = 1600;
 img.height = 900;
 img.loading = el.getAttribute('data-labs-loading') || 'lazy';
 el.appendChild(img);
 }
 tryLoad(img, candidates(base, explicit), el, 0);
 }

 function hydrateAll(root) {
 (root || document).querySelectorAll('[data-labs-cover], [data-labs-cover-src]').forEach(hydrate);
 }

 window.LabsCovers = {
 hydrate: hydrate,
 hydrateAll: hydrateAll,
 /** Derive carousel dir from posts/<slug>.html href (site-root relative). */
 baseFromHref: function (href) {
 const m = String(href || '').match(/(?:^|\/)posts\/([^/]+)\.html$/);
 return m ? 'posts/' + m[1] + '/carousel' : '';
 },
 /** Derive carousel dir relative to a post page in labs/posts/. */
 baseFromSlug: function (slug) {
 return slug ? slug.replace(/\/$/, '') + '/carousel' : '';
 }
 };

 if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', function () {
 hydrateAll();
 });
 } else {
 hydrateAll();
 }
})();

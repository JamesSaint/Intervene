/* intervene — interaction layer
   Mobile nav, scroll reveals, contact form. Vanilla. No dependencies. */
(function () {
  'use strict';

  /* ----- mobile nav ----- */
  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.querySelector('.nav-mobile');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        drawer.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
        document.documentElement.style.overflow = '';
      });
    });
  }

  /* ----- reveal on scroll ----- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ----- live clock in topbar ----- */
  var clock = document.querySelector('[data-clock]');
  if (clock) {
    var tick = function () {
      var d = new Date();
      var hh = String(d.getUTCHours()).padStart(2, '0');
      var mm = String(d.getUTCMinutes()).padStart(2, '0');
      clock.textContent = hh + ':' + mm + ' UTC';
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ----- contact form (Formspree-friendly) ----- */
  var form = document.querySelector('form[data-contact]');
  if (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('.honey').value) return; // honeypot
      var data = new FormData(form);
      var endpoint = form.getAttribute('action');
      if (status) {
        status.classList.remove('success', 'error');
        status.textContent = 'Sending…';
        status.style.display = 'block';
      }
      fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
      .then(function (r) {
        if (r.ok) {
          form.reset();
          if (status) {
            status.classList.add('success');
            status.textContent = 'Received. A senior advisor will respond within one to two working days.';
          }
        } else {
          throw new Error('Submit failed');
        }
      })
      .catch(function () {
        if (status) {
          status.classList.add('error');
          status.textContent = 'Could not send. Email advisory@intervene.group directly.';
        }
      });
    });
  }
})();

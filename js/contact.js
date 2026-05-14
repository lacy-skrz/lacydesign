/* contact.js — contact modal with EmailJS, shared across all pages */

(function () {
  'use strict';

  var SERVICE_ID  = 'service_bdhupfl';
  var TEMPLATE_ID = 'template_tsn5ebo';
  var PUBLIC_KEY  = 'RjWiJEIskG-UiRvUT';

  // ── Inject modal HTML ──────────────────────────────────────────────────────
  // FIX 1: aria-describedby added to dialog element, pointing at intro paragraph
  // FIX 3: tabindex="-1" on modal-title so focus can be sent to it on open,
  //         ensuring screen readers announce the heading before the first field
  var modalHTML = [
    '<div id="contact-modal" class="modal-overlay" role="dialog" aria-modal="true"',
    '     aria-labelledby="modal-title" aria-describedby="modal-intro" hidden>',
    '  <div class="modal-panel">',
    '    <div class="modal-header">',
    '      <h2 class="modal-title" id="modal-title" tabindex="-1">Get in touch</h2>',
    '      <button class="modal-close" aria-label="Close contact form">',
    '        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true" focusable="false">',
    '          <line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/>',
    '        </svg>',
    '      </button>',
    '    </div>',
    '    <p class="modal-intro" id="modal-intro">I\'d love to hear from you. I\'ll get back to you as soon as I can.</p>',
    '    <form id="contact-form" novalidate>',
    '      <div class="modal-field">',
    '        <label class="modal-label" for="contact-name">Name <span class="modal-required">(required)</span></label>',
    '        <input class="modal-input" id="contact-name" name="from_name" type="text" autocomplete="name" required aria-required="true" />',
    '        <span class="modal-error" id="name-error" role="alert" aria-live="polite"></span>',
    '      </div>',
    '      <div class="modal-field">',
    '        <label class="modal-label" for="contact-email">Email <span class="modal-required">(required)</span></label>',
    '        <input class="modal-input" id="contact-email" name="from_email" type="email" autocomplete="email" required aria-required="true" />',
    '        <span class="modal-error" id="email-error" role="alert" aria-live="polite"></span>',
    '      </div>',
    '      <div class="modal-field">',
    '        <label class="modal-label" for="contact-message">Message <span class="modal-required">(required)</span></label>',
    '        <textarea class="modal-input modal-textarea" id="contact-message" name="message" rows="5" required aria-required="true"></textarea>',
    '        <span class="modal-error" id="message-error" role="alert" aria-live="polite"></span>',
    '      </div>',
    '      <div class="modal-actions">',
    '        <button type="submit" class="modal-submit btn-primary" id="contact-submit">',
    '          Send message',
    '          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 7h10M7 2l5 5-5 5"/></svg>',
    '        </button>',
    '      </div>',
    '      <p class="modal-status" id="modal-status" role="status" aria-live="polite"></p>',
    '    </form>',
    '  </div>',
    '</div>'
  ].join('\n');

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // ── References ─────────────────────────────────────────────────────────────
  var modal      = document.getElementById('contact-modal');
  var modalTitle = document.getElementById('modal-title');
  var closeBtn   = modal.querySelector('.modal-close');
  var form       = document.getElementById('contact-form');
  var submitBtn  = document.getElementById('contact-submit');
  var statusEl   = document.getElementById('modal-status');

  // ── FIX 1: Background inert management ─────────────────────────────────────
  // The spec requires aria-modal to be backed by truly inert background content.
  // We collect all direct children of <body> except the modal and toggle `inert`
  // on them so keyboard and AT users cannot reach content behind the dialog.
  function getBackgroundElements() {
    return Array.prototype.slice.call(document.body.children).filter(function (el) {
      return el !== modal;
    });
  }

  function setBackgroundInert(inert) {
    getBackgroundElements().forEach(function (el) {
      if (inert) {
        el.setAttribute('inert', '');
        el.setAttribute('aria-hidden', 'true');
      } else {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      }
    });
  }

  // ── Open / close ───────────────────────────────────────────────────────────
  var previouslyFocused = null;

  function openModal() {
    previouslyFocused = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    setBackgroundInert(true);
    // FIX 3: Focus the title (tabindex="-1") so screen readers announce the
    // heading + description before the user reaches the first field
    modalTitle.focus();
  }

  function closeModal() {
    setBackgroundInert(false);
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    resetForm();
    if (previouslyFocused) previouslyFocused.focus();
  }

  function resetForm() {
    form.reset();
    statusEl.textContent = '';
    statusEl.className = 'modal-status';
    clearErrors();
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Send message <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 7h10M7 2l5 5-5 5"/></svg>';
  }

  // Wire every contact trigger on the page
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-contact-trigger]');
    if (trigger) {
      e.preventDefault();
      openModal();
    }
  });

  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  // ── Focus trap ──────────────────────────────────────────────────────────────
  // Traps Tab/Shift+Tab within interactive elements only (excludes tabindex="-1" title)
  modal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var focusable = modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
    );
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  function clearErrors() {
    ['name-error', 'email-error', 'message-error'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.textContent = ''; }
    });
    form.querySelectorAll('.modal-input').forEach(function (input) {
      input.removeAttribute('aria-invalid');
    });
  }

  function validateForm() {
    var valid = true;
    clearErrors();

    var name    = document.getElementById('contact-name');
    var email   = document.getElementById('contact-email');
    var message = document.getElementById('contact-message');

    // Mark all errors first, then focus only the first invalid field
    if (!name.value.trim()) {
      markError('name-error', name, 'Please enter your name.');
      valid = false;
    }
    if (!email.value.trim()) {
      markError('email-error', email, 'Please enter your email address.');
      if (valid) valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      markError('email-error', email, 'Please enter a valid email address.');
      if (valid) valid = false;
    }
    if (!message.value.trim()) {
      markError('message-error', message, 'Please enter a message.');
      if (valid) valid = false;
    }

    // Focus the first invalid field after all errors are marked
    if (!valid) {
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
    }

    return valid;
  }

  function markError(errorId, inputEl, msg) {
    var el = document.getElementById(errorId);
    if (el) el.textContent = msg;
    inputEl.setAttribute('aria-invalid', 'true');
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateForm()) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending\u2026';
    statusEl.textContent = '';
    statusEl.className = 'modal-status';

    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form, PUBLIC_KEY)
      .then(function () {
        statusEl.textContent = 'Message sent! I\'ll be in touch soon.';
        statusEl.classList.add('modal-status--success');
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send message <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 7h10M7 2l5 5-5 5"/></svg>';
      })
      .catch(function () {
        statusEl.textContent = 'Something went wrong. Please try again or reach out via LinkedIn.';
        statusEl.classList.add('modal-status--error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send message <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2 7h10M7 2l5 5-5 5"/></svg>';
      });
  });

})();

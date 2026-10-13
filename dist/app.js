const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Ukrainian typography: prevent short words and number-unit pairs from hanging.
const typographyPattern = /(^|[\s([{"«„—–-])(а|в|у|і|й|з|із|зі|до|на|за|по|та|чи|не)[ \t]+(?=\S)/giu;
const quantityPattern = /(\d[\d.,–—-]*)[ \t]+(грн|зл|pln|eur|роки|років|місяці|місяців|уроки|уроків|модулі|модулів)(?=[\s.,!?;:]|$)/giu;
const typographyWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
  acceptNode(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest('script, style, noscript, textarea, pre, code')) return NodeFilter.FILTER_REJECT;
    return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
  }
});

while (typographyWalker.nextNode()) {
  const node = typographyWalker.currentNode;
  let value = node.nodeValue;
  for (let pass = 0; pass < 3; pass += 1) {
    const improved = value
      .replace(typographyPattern, (_, lead, word) => `${lead}${word}\u00a0`)
      .replace(quantityPattern, (_, number, unit) => `${number}\u00a0${unit}`);
    if (improved === value) break;
    value = improved;
  }
  node.nodeValue = value;
}

let accordionPanelId = 0;
$$('[data-accordion]').forEach((group) => {
  $$('.accordion-trigger', group).forEach((trigger) => {
    const panel = trigger.closest('.accordion-item').querySelector('.accordion-panel');
    panel.id ||= `accordion-panel-${accordionPanelId += 1}`;
    trigger.setAttribute('aria-controls', panel.id);
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!isOpen));
      panel.hidden = isOpen;
      item.classList.toggle('is-open', !isOpen);
    });
  });
});

const deadlineKey = 'ssp-promo-deadline-v2';
const savedDeadline = Number(sessionStorage.getItem(deadlineKey));
const deadline = savedDeadline > Date.now() ? savedDeadline : Date.now() + (60 * 60 * 1000);
sessionStorage.setItem(deadlineKey, String(deadline));

const countdownNodes = $$('[data-countdown]');
function renderCountdown() {
  const remaining = Math.max(0, deadline - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const milliseconds = remaining % 1000;
  const parts = { days, hours, minutes, seconds, milliseconds };
  countdownNodes.forEach((node) => {
    Object.entries(parts).forEach(([unit, value]) => {
      const target = node.querySelector(`[data-unit="${unit}"]`);
      if (target) target.textContent = String(value).padStart(unit === 'milliseconds' ? 3 : 2, '0');
    });
  });
}
renderCountdown();
let countdownTimer = window.setInterval(renderCountdown, 40);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.clearInterval(countdownTimer);
    countdownTimer = 0;
    return;
  }
  renderCountdown();
  if (!countdownTimer) countdownTimer = window.setInterval(renderCountdown, 40);
});

const dialog = document.querySelector('[data-dialog]');
$$('[data-checkout]').forEach((button) => button.addEventListener('click', () => dialog?.showModal()));
$$('[data-dialog-close]').forEach((button) => button.addEventListener('click', () => dialog?.close()));
dialog?.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) dialog.close();
});

const consultationCard = document.querySelector('[data-consultation-card]');
const consultationClose = consultationCard?.querySelector('[data-consultation-close]');
const consultationOpen = consultationCard?.querySelector('[data-consultation-open]');

const setConsultationCollapsed = (collapsed) => {
  if (!consultationCard || !consultationOpen) return;
  consultationCard.classList.toggle('is-collapsed', collapsed);
  consultationOpen.disabled = !collapsed;
  consultationOpen.setAttribute('aria-expanded', String(!collapsed));
};

consultationClose?.addEventListener('click', () => setConsultationCollapsed(true));
consultationOpen?.addEventListener('click', () => setConsultationCollapsed(false));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

$$('.reveal').forEach((node) => observer.observe(node));

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
});

$$('[data-slider]').forEach((slider) => {
  const section = slider.closest('section');
  const previous = section?.querySelector('[data-slider-prev]');
  const next = section?.querySelector('[data-slider-next]');
  const isAudienceSlider = slider.classList.contains('audience-track');
  let pointerId = null;
  let startX = 0;
  let startScroll = 0;
  let dragged = false;

  const maxScroll = () => Math.max(0, slider.scrollWidth - slider.clientWidth);
  const cardStep = () => {
    const card = slider.firstElementChild;
    if (!card) return slider.clientWidth * .85;
    const gap = parseFloat(getComputedStyle(slider).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  };
  const updateButtons = () => {
    const maximum = maxScroll();
    if (previous) previous.disabled = slider.scrollLeft <= 2;
    if (next) next.disabled = slider.scrollLeft >= maximum - 2;
  };
  const move = (direction) => slider.scrollBy({ left: direction * cardStep(), behavior: 'smooth' });

  previous?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));

  slider.addEventListener('wheel', (event) => {
    if (isAudienceSlider && !event.shiftKey) return;
    if (maxScroll() <= 0 || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const atStart = slider.scrollLeft <= 2;
    const atEnd = slider.scrollLeft >= maxScroll() - 2;
    if ((event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) return;
    event.preventDefault();
    slider.scrollLeft += event.deltaY;
  }, { passive: false });

  slider.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startScroll = slider.scrollLeft;
    dragged = false;
    slider.classList.add('is-dragging');
    slider.setPointerCapture(pointerId);
  });
  slider.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) > 4) dragged = true;
    slider.scrollLeft = startScroll - distance;
  });
  const stopDragging = (event) => {
    if (event.pointerId !== pointerId) return;
    slider.classList.remove('is-dragging');
    if (slider.hasPointerCapture(pointerId)) slider.releasePointerCapture(pointerId);
    pointerId = null;
  };
  slider.addEventListener('pointerup', stopDragging);
  slider.addEventListener('pointercancel', stopDragging);
  slider.addEventListener('click', (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);
  slider.addEventListener('scroll', updateButtons, { passive: true });
  addEventListener('resize', updateButtons);
  if (isAudienceSlider) slider.scrollTo({ left: 0, behavior: 'auto' });
  updateButtons();
});


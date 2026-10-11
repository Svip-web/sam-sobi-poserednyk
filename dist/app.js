const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

$$('[data-accordion]').forEach((group) => {
  $$('.accordion-trigger', group).forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const panel = item.querySelector('.accordion-panel');
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!isOpen));
      panel.hidden = isOpen;
      item.classList.toggle('is-open', !isOpen);
    });
  });
});

const deadlineKey = 'ssp-promo-deadline';
const savedDeadline = Number(sessionStorage.getItem(deadlineKey));
const deadline = savedDeadline > Date.now() ? savedDeadline : Date.now() + (6 * 60 * 60 * 1000);
sessionStorage.setItem(deadlineKey, String(deadline));

const countdownNodes = $$('[data-countdown]');
function renderCountdown() {
  const remaining = Math.max(0, deadline - Date.now());
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const parts = [hours, minutes, seconds].map((n) => String(n).padStart(2, '0'));
  countdownNodes.forEach((node) => {
    const values = node.querySelectorAll('b');
    parts.forEach((part, index) => { if (values[index]) values[index].textContent = part; });
  });
}
renderCountdown();
setInterval(renderCountdown, 1000);

const dialog = document.querySelector('[data-dialog]');
$$('[data-checkout]').forEach((button) => button.addEventListener('click', () => dialog?.showModal()));
$$('[data-dialog-close]').forEach((button) => button.addEventListener('click', () => dialog?.close()));
dialog?.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) dialog.close();
});

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
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
});

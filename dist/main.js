const menuButton = document.querySelector('.menu');
const navigationMenu = document.querySelector('#navigation');
const mobile = window.matchMedia('(max-width: 960px)');

function closeMenu(returnFocus = false) {
  menuButton.setAttribute('aria-expanded', 'false');
  navigationMenu.classList.remove('open');
  if (returnFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(opening));
  navigationMenu.classList.toggle('open', opening);
});
document.addEventListener('keydown', (event) => {
  if (
    event.key === 'Escape' &&
    menuButton.getAttribute('aria-expanded') === 'true'
  )
    closeMenu(true);
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('header')) closeMenu();
});
document.querySelector('header').addEventListener('focusout', (event) => {
  if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
    closeMenu();
});
mobile.addEventListener('change', () => {
  const focusWasInNavigation = navigationMenu.contains(document.activeElement);
  closeMenu(mobile.matches && focusWasInNavigation);
});
document.documentElement.classList.add('js');

document.querySelectorAll('[data-copy-email]').forEach((control) => {
  const button = control.querySelector('button');
  const status = control.querySelector('[role="status"]');
  const fallback = control.querySelector('input');
  let fadeTimer;
  let dismissTimer;
  control.hidden = false;

  button.addEventListener('click', async () => {
    button.disabled = true;
    clearTimeout(fadeTimer);
    clearTimeout(dismissTimer);
    document
      .querySelectorAll('.copy-email-status.is-toast')
      .forEach((message) => {
        message.classList.remove('is-toast', 'is-visible');
        message.textContent = '';
      });
    status.classList.remove('is-toast', 'is-visible');
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(button.dataset.email);
      fallback.hidden = true;
      status.textContent = button.dataset.copied;
      status.classList.add('is-toast', 'is-visible');
      fadeTimer = setTimeout(() => status.classList.remove('is-visible'), 2700);
      dismissTimer = setTimeout(() => {
        status.classList.remove('is-toast');
        status.textContent = '';
      }, 3000);
    } catch {
      // Clipboard permission can be denied or unavailable in some browsers.
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
      status.textContent = button.dataset.copyFailed;
    } finally {
      button.disabled = false;
    }
  });
});

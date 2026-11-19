document.querySelectorAll('[data-inquiry-form]').forEach((form) => {
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;

    const buttonLabel = button.textContent;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    button.disabled = true;
    button.textContent = form.dataset.sending;
    form.setAttribute('aria-busy', 'true');
    status.textContent = form.dataset.sending;
    status.removeAttribute('data-error');

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString(),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Submission was not accepted');

      form.reset();
      status.textContent = form.dataset.success;
      button.hidden = true;
    } catch {
      status.textContent = form.dataset.error;
      status.dataset.error = 'true';
      button.disabled = false;
    } finally {
      clearTimeout(timeout);
      button.textContent = buttonLabel;
      form.removeAttribute('aria-busy');
      status.focus();
    }
  });
});

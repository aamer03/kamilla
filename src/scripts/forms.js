const inquiryForms = [...document.querySelectorAll('[data-inquiry-form]')];
const captchaWidgets = new Map();
const captchaContainers = [
  ...document.querySelectorAll('[data-inquiry-captcha]'),
];

window.onInquiryCaptchaReady = () => {
  captchaContainers.forEach((container) => {
    if (!container.dataset.sitekey) return;
    const notice = container.parentElement.querySelector(
      '[data-captcha-notice]',
    );
    const widget = window.grecaptcha.render(container, {
      sitekey: container.dataset.sitekey,
      size: window.matchMedia('(max-width: 480px)').matches
        ? 'compact'
        : 'normal',
      callback: () => {
        notice.hidden = true;
      },
      'expired-callback': () => {
        notice.hidden = false;
      },
      'error-callback': () => {
        notice.hidden = false;
      },
    });
    captchaWidgets.set(container.closest('form'), widget);
    notice.hidden = true;
  });
};

if (captchaContainers.some((container) => container.dataset.sitekey)) {
  const script = document.createElement('script');
  const language = document.documentElement.lang;
  script.src = `https://www.google.com/recaptcha/api.js?onload=onInquiryCaptchaReady&render=explicit&hl=${encodeURIComponent(language)}`;
  script.async = true;
  script.defer = true;
  document.head.append(script);
}

inquiryForms.forEach((form) => {
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');
  const email = form.querySelector('[name="email"]');
  const phone = form.querySelector('[name="phone"]');
  const contactMethod = form.querySelector('[name="preferred-contact-method"]');
  const resume = form.querySelector('[data-resume-input]');
  const removeResume = form.querySelector('[data-remove-resume]');
  const resumeReference = form.querySelector('[name="resume-reference"]');
  if (resume) resume.disabled = false;

  function validateResume() {
    if (!resume) return;
    const file = resume.files[0];
    let message = '';
    if (file && !/\.(pdf|doc|docx)$/i.test(file.name)) {
      message = form.dataset.resumeTypeError;
    } else if (file && file.size > 4 * 1024 * 1024) {
      message = form.dataset.resumeSizeError;
    }
    resume.setCustomValidity(message);
  }

  resume?.addEventListener('change', () => {
    resumeReference.value = '';
    removeResume.hidden = !resume.files.length;
    status.textContent = '';
    validateResume();
  });
  removeResume?.addEventListener('click', () => {
    resume.value = '';
    resumeReference.value = '';
    resume.setCustomValidity('');
    removeResume.hidden = true;
    status.textContent = form.dataset.resumeRemoved;
    status.removeAttribute('data-error');
    resume.focus();
  });
  const certifications = [
    ...form.querySelectorAll('[name="certifications[]"]'),
  ];

  function validateCertifications(changed) {
    if (!certifications.length) return;
    if (changed?.checked) {
      certifications.forEach((checkbox) => {
        if (
          checkbox !== changed &&
          (changed.value === 'None yet' || checkbox.value === 'None yet')
        ) {
          checkbox.checked = false;
        }
      });
    }
    certifications[0].setCustomValidity(
      certifications.some((checkbox) => checkbox.checked)
        ? ''
        : form.dataset.certificationsRequired,
    );
  }

  certifications.forEach((checkbox) => {
    checkbox.addEventListener('change', () => validateCertifications(checkbox));
  });
  validateCertifications();

  function validateContact() {
    email.setCustomValidity('');
    phone.setCustomValidity('');
    if (!email.value.trim() && !phone.value.trim()) {
      email.setCustomValidity(form.dataset.contactRequired);
    } else if (contactMethod.value === 'Email' && !email.value.trim()) {
      email.setCustomValidity(form.dataset.emailRequired);
    } else if (
      ['Phone call', 'Text message'].includes(contactMethod.value) &&
      !phone.value.trim()
    ) {
      phone.setCustomValidity(form.dataset.phoneRequired);
    }
  }

  form.addEventListener('input', validateContact);
  form.addEventListener('change', validateContact);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    validateContact();
    validateCertifications();
    validateResume();
    if (!form.reportValidity()) return;
    const widget = captchaWidgets.get(form);
    if (widget === undefined || !window.grecaptcha.getResponse(widget)) {
      status.textContent = form.dataset.captchaRequired;
      status.dataset.error = 'true';
      status.focus();
      return;
    }

    const buttonLabel = button.textContent;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      resume ? 30000 : 20000,
    );
    button.disabled = true;
    button.textContent = form.dataset.sending;
    form.setAttribute('aria-busy', 'true');
    status.textContent = form.dataset.sending;
    status.removeAttribute('data-error');
    let failureMessage = form.dataset.error;
    if (resume) {
      resume.disabled = true;
      removeResume.disabled = true;
    }

    try {
      if (resume?.files.length && !resumeReference.value) {
        failureMessage = form.dataset.resumeUploadError;
        const upload = new FormData();
        upload.append('resume', resume.files[0]);
        const uploaded = await fetch('/api/resume-upload', {
          method: 'POST',
          headers: { 'X-Resume-Upload': '1' },
          body: upload,
          signal: controller.signal,
        });
        if (!uploaded.ok) throw new Error('Upload was not accepted');
        const result = await uploaded.json();
        if (!/^[0-9a-f-]{36}$/.test(result.reference))
          throw new Error('Invalid upload reference');
        resumeReference.value = result.reference;
      }
      failureMessage = form.dataset.error;
      const data = new FormData(form);
      const captchaResponse = window.grecaptcha.getResponse(widget);
      if (!captchaResponse) {
        failureMessage = form.dataset.captchaRequired;
        throw new Error('Verification expired');
      }
      data.set('g-recaptcha-response', captchaResponse);
      const response = await fetch('/', {
        method: 'POST',
        // Only a private storage reference goes to Netlify Forms, never the file.
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Submission was not accepted');

      form.reset();
      if (removeResume) removeResume.hidden = true;
      status.textContent = form.dataset.success;
      button.hidden = true;
    } catch {
      window.grecaptcha.reset(widget);
      status.textContent = failureMessage;
      status.dataset.error = 'true';
      button.disabled = false;
    } finally {
      clearTimeout(timeout);
      button.textContent = buttonLabel;
      form.removeAttribute('aria-busy');
      if (resume) {
        resume.disabled = false;
        removeResume.disabled = false;
      }
      status.focus();
    }
  });
});

const inquiryChooser = document.querySelector('[data-inquiry-chooser]');

if (inquiryChooser && inquiryForms.length) {
  const choices = [...inquiryChooser.querySelectorAll('[name="inquiry-type"]')];

  function showChosenForm() {
    const selected = choices.find((choice) => choice.checked);
    inquiryForms.forEach((form) => {
      form.hidden = form.getAttribute('name') !== selected?.value;
    });
  }

  function openLinkedForm() {
    const selected = choices.find(
      (choice) =>
        choice.getAttribute('aria-controls') === window.location.hash.slice(1),
    );
    if (!selected) return;
    selected.checked = true;
    showChosenForm();
    document
      .getElementById(selected.getAttribute('aria-controls'))
      .scrollIntoView();
  }

  choices.forEach((choice) =>
    choice.addEventListener('change', showChosenForm),
  );
  document.querySelector('.inquiry-grid').classList.add('single-inquiry');
  showChosenForm();
  inquiryChooser.hidden = false;
  openLinkedForm();
  window.addEventListener('hashchange', openLinkedForm);
}

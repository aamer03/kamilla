export function createCaptchaController(root = document, browser = window) {
  const captchaWidgets = new Map();
  const captchaContainers = [
    ...root.querySelectorAll('[data-inquiry-captcha]'),
  ];

  browser.onInquiryCaptchaReady = () => {
    captchaContainers.forEach((container) => {
      if (!container.dataset.sitekey) return;
      const notice = container.parentElement.querySelector(
        '[data-captcha-notice]',
      );
      const widget = browser.grecaptcha.render(container, {
        sitekey: container.dataset.sitekey,
        size: browser.matchMedia('(max-width: 480px)').matches
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
    const script = root.createElement('script');
    const language = root.documentElement.lang;
    script.src = `https://www.google.com/recaptcha/api.js?onload=onInquiryCaptchaReady&render=explicit&hl=${encodeURIComponent(language)}`;
    script.async = true;
    script.defer = true;
    root.head.append(script);
  }

  return {
    getResponse(form) {
      const id = captchaWidgets.get(form);
      return id === undefined ? '' : browser.grecaptcha.getResponse(id);
    },
    reset(form) {
      const id = captchaWidgets.get(form);
      if (id !== undefined) browser.grecaptcha.reset(id);
    },
  };
}

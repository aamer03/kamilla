async function submitWithToken(
  token,
  configured = true,
  attachment = false,
  failUpload = false,
) {
  const handlers = {};
  const field = (value) => ({ value, setCustomValidity() {} });
  const status = { dataset: {}, focus() {}, removeAttribute() {} };
  const button = { textContent: 'Send' };
  const notice = {};
  const fields = {};
  const confirmation = {
    focus() {
      this.focused = true;
    },
    getAttribute: () => 'Thank you',
  };
  const uploadStatus = { hidden: true, removeAttribute() {}, dataset: {} };
  const retryUpload = {
    addEventListener: (_, handler) => {
      handlers.retry = handler;
    },
  };
  const resumeReference = { value: '' };
  const uploadToken = { value: '' };
  const resume = attachment
    ? {
        files: [
          new File(['%PDF-1.7 test'], 'resume.pdf', {
            type: 'application/pdf',
          }),
        ],
        setCustomValidity() {},
        addEventListener() {},
      }
    : undefined;
  const removeResume = { addEventListener() {} };
  const form = {
    dataset: {
      captchaRequired: 'Verification required',
      sending: 'Sending',
      success: 'Sent',
      uploading: 'Uploading',
      uploadComplete: 'Uploaded',
      uploadPending: 'Retry attachment',
    },
    querySelector(selector) {
      return {
        'button[type="submit"]': button,
        '.form-status': status,
        '[name="email"]': field('test@example.com'),
        '[name="phone"]': field(''),
        '[name="preferred-contact-method"]': field('Email'),
        '[data-inquiry-fields]': fields,
        '[data-inquiry-success]': confirmation,
        '[data-upload-status]': uploadStatus,
        '[data-retry-upload]': retryUpload,
        '[data-resume-input]': resume,
        '[data-remove-resume]': removeResume,
        '[name="resume-reference"]': resumeReference,
        '[name="resume-upload-token"]': uploadToken,
      }[selector];
    },
    querySelectorAll: () => [],
    addEventListener: (name, handler) => {
      handlers[name] = handler;
    },
    reportValidity: () => true,
    setAttribute() {},
    removeAttribute() {},
    reset() {},
  };
  const container = {
    dataset: { sitekey: configured ? 'public-test-key' : '' },
    parentElement: { querySelector: () => notice },
    closest: () => form,
  };
  let sent;
  const calls = [];
  const window = {
    crypto: require('node:crypto').webcrypto,
    matchMedia: () => ({ matches: true }),
    grecaptcha: { render: () => 0, getResponse: () => token, reset() {} },
  };
  class Data extends FormData {
    constructor() {
      super();
      this.set('form-name', attachment ? 'aide-inquiry' : 'client-inquiry');
      this.set('resume-reference', resumeReference.value);
      this.set('resume-upload-token', uploadToken.value);
    }
  }
  const root = {
    querySelectorAll: (selector) =>
      selector === '[data-inquiry-form]' ? [form] : [container],
    querySelector: () => null,
    documentElement: { lang: 'en' },
    createElement: () => ({}),
    head: { append() {} },
  };
  const send = async (url, options) => {
    calls.push({ url, options });
    if (url === '/api/resume-upload') {
      if (failUpload) {
        failUpload = false;
        return { ok: false, status: 503 };
      }
      return {
        ok: true,
        status: 201,
        json: async () => ({ reference: resumeReference.value }),
      };
    }
    sent = options;
    return { ok: true };
  };
  const { createCaptchaController } =
    await import('../../src/scripts/forms/captcha.js');
  const { initializeInquiryForm } =
    await import('../../src/scripts/forms/submission.js');
  const captcha = createCaptchaController(root, window);
  initializeInquiryForm(form, captcha, { browser: window, Data, send });
  if (configured) window.onInquiryCaptchaReady();
  await handlers.submit({ preventDefault() {} });
  return {
    sent,
    status,
    fields,
    confirmation,
    calls,
    uploadStatus,
    retryUpload,
    handlers,
  };
}

module.exports = { submitWithToken };

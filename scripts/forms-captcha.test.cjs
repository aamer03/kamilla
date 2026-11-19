const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

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
  vm.runInNewContext(fs.readFileSync('src/scripts/forms.js', 'utf8'), {
    document: {
      querySelectorAll: (selector) =>
        selector === '[data-inquiry-form]' ? [form] : [container],
      querySelector: () => null,
      documentElement: { lang: 'en' },
      createElement: () => ({}),
      head: { append() {} },
    },
    window,
    FormData: Data,
    URLSearchParams,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async (url, options) => {
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
    },
  });
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

test('missing widget or unsolved CAPTCHA blocks network submission', async () => {
  for (const configured of [true, false]) {
    const result = await submitWithToken('', configured);
    assert.equal(result.sent, undefined);
    assert.equal(result.status.textContent, 'Verification required');
  }
});

test('solved CAPTCHA token is included for Netlify server verification', async () => {
  const result = await submitWithToken('test-token');
  assert.equal(
    new URLSearchParams(result.sent.body).get('g-recaptcha-response'),
    'test-token',
  );
  assert.equal(result.fields.hidden, true);
  assert.equal(result.confirmation.hidden, false);
  assert.equal(result.confirmation.focused, true);
});

test('résumé upload follows verified form submission and retries without resending the inquiry', async () => {
  const result = await submitWithToken('captcha-token', true, true, true);
  assert.deepEqual(
    result.calls.map((call) => call.url),
    ['/', '/api/resume-upload'],
  );
  assert.equal(result.fields.hidden, true);
  assert.equal(result.confirmation.hidden, false);
  assert.equal(result.uploadStatus.textContent, 'Retry attachment');
  assert.equal(result.retryUpload.hidden, false);
  const posted = new URLSearchParams(result.sent.body);
  assert.match(posted.get('resume-upload-token'), /^[a-f0-9]{64}$/);
  assert.equal(
    result.calls[1].options.headers['X-Resume-Permit'],
    posted.get('resume-upload-token'),
  );
  await result.handlers.retry();
  assert.equal(result.uploadStatus.textContent, 'Uploaded');
  assert.equal(result.calls.filter((call) => call.url === '/').length, 1);
  await result.handlers.submit({ preventDefault() {} });
  assert.equal(result.calls.filter((call) => call.url === '/').length, 1);
});

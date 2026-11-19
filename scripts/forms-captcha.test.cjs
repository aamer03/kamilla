const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

async function submitWithToken(token, configured = true) {
  const handlers = {};
  const field = (value) => ({ value, setCustomValidity() {} });
  const status = { dataset: {}, focus() {}, removeAttribute() {} };
  const button = { textContent: 'Send' };
  const notice = {};
  const form = {
    dataset: {
      captchaRequired: 'Verification required',
      sending: 'Sending',
      success: 'Sent',
    },
    querySelector(selector) {
      return {
        'button[type="submit"]': button,
        '.form-status': status,
        '[name="email"]': field('test@example.com'),
        '[name="phone"]': field(''),
        '[name="preferred-contact-method"]': field('Email'),
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
  const window = {
    matchMedia: () => ({ matches: true }),
    grecaptcha: { render: () => 0, getResponse: () => token, reset() {} },
  };
  class Data extends FormData {
    constructor() {
      super();
      this.set('form-name', 'client-inquiry');
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
    fetch: async (_, options) => {
      sent = options;
      return { ok: true };
    },
  });
  if (configured) window.onInquiryCaptchaReady();
  await handlers.submit({ preventDefault() {} });
  return { sent, status };
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
  assert.equal(result.status.textContent, 'Sent');
});

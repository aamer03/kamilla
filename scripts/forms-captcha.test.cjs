const test = require('node:test');
const assert = require('node:assert/strict');

const { submitWithToken } = require('./fixtures/inquiry.cjs');

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

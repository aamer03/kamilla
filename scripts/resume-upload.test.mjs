import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createVerifiedHandler } from '../netlify/functions/verified-inquiry.mjs';
import { createHandler as createUploadHandler } from '../netlify/functions/resume-upload.mjs';

const token = 'a'.repeat(64);
const reference = '11111111-1111-4111-8111-111111111111';
function createHandler(
  storeFactory,
  permitStoreFactory = () => ({
    get: async () => ({ reference, expiresAt: Date.now() + 60000 }),
  }),
) {
  return createUploadHandler(storeFactory, permitStoreFactory);
}
function request(file, { origin = 'https://example.com', marker = '1' } = {}) {
  const body = new FormData();
  body.append('resume', file);
  return new Request('https://example.com/api/resume-upload', {
    method: 'POST',
    headers: {
      origin,
      'X-Resume-Upload': marker,
      'X-Resume-Permit': token,
      'X-Resume-Reference': reference,
    },
    body,
  });
}
const pdf = () =>
  new File(['%PDF-1.7\nDisposable test document'], 'resume.pdf', {
    type: 'application/pdf',
  });

test('stores a private file and returns only an opaque reference', async () => {
  let stored;
  const handler = createHandler(() => ({
    set: async (...args) => {
      stored = args;
    },
  }));
  const response = await handler(request(pdf()));
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.deepEqual(Object.keys(result), ['reference']);
  assert.match(result.reference, /^[0-9a-f-]{36}$/);
  assert.equal(stored[0], result.reference);
  assert.equal(Buffer.from(stored[1]).toString(), await pdf().text());
  assert.equal(stored[2].metadata.contentType, 'application/pdf');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('rejects reads, cross-origin uploads and missing custom header before storage', async () => {
  const handler = createHandler(() => {
    throw new Error('Must not access storage');
  });
  assert.equal(
    (await handler(new Request('https://example.com/api/resume-upload')))
      .status,
    405,
  );
  assert.equal(
    (await handler(request(pdf(), { origin: 'https://evil.example' }))).status,
    403,
  );
  assert.equal((await handler(request(pdf(), { marker: '' }))).status, 403);
});

test('rejects spoofed extensions, MIME types, empty files and oversized bodies', async () => {
  let writes = 0;
  const handler = createHandler(() => ({ set: async () => writes++ }));
  for (const file of [
    new File(['executable'], 'fake.pdf', { type: 'application/pdf' }),
    new File(['%PDF-1.7'], 'fake.exe'),
    new File(['%PDF-1.7'], 'fake.pdf', { type: 'text/html' }),
    new File(['PK\x03\x04random archive'], 'fake.docx'),
  ])
    assert.equal((await handler(request(file))).status, 415);
  assert.equal((await handler(request(new File([], 'empty.pdf')))).status, 400);
  assert.equal(
    (
      await handler(
        request(new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'large.pdf')),
      )
    ).status,
    413,
  );
  const oversized = request(
    new File([new Uint8Array(4 * 1024 * 1024 + 100000)], 'large.pdf'),
  );
  const buffered = new Request(oversized.url, {
    method: 'POST',
    headers: oversized.headers,
    body: await oversized.arrayBuffer(),
  });
  assert.equal((await handler(buffered)).status, 413);
  assert.equal(writes, 0);
});

test('storage failure exposes no private details and never reports success', async () => {
  const handler = createHandler(() => ({
    set: async () => {
      throw new Error('private credentials');
    },
  }));
  const response = await handler(request(pdf()));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'unavailable' });
});

test('unverified, mismatched and expired permits cannot store a résumé', async () => {
  let writes = 0;
  for (const [permit, expected] of [
    [null, 425],
    [{ reference: 'wrong', expiresAt: Date.now() + 60000 }, 403],
    [{ reference, expiresAt: Date.now() - 1 }, 403],
  ]) {
    const handler = createHandler(
      () => ({ set: async () => writes++ }),
      () => ({ get: async () => permit }),
    );
    assert.equal((await handler(request(pdf()))).status, expected);
  }
  const noToken = request(pdf());
  noToken.headers.delete('x-resume-permit');
  assert.equal(
    (await createHandler(() => ({ set: async () => writes++ }))(noToken))
      .status,
    403,
  );
  assert.equal(writes, 0);
});

test('verified events issue short-lived, hashed permits and cannot renew a reused token', async () => {
  const entries = new Map();
  const store = {
    setJSON: async (key, value, options) => {
      if (!options.onlyIfNew || !entries.has(key)) entries.set(key, value);
    },
  };
  let clock = 1000;
  const handler = createVerifiedHandler(
    () => store,
    () => clock,
  );
  await handler({
    data: {
      'form-name': 'aide-inquiry',
      'resume-reference': reference,
      'resume-upload-token': token,
    },
  });
  const digest = createHash('sha256').update(token).digest('hex');
  assert.deepEqual(entries.get(digest), { reference, expiresAt: 901000 });
  clock = 5000;
  await handler({
    data: { 'resume-reference': reference, 'resume-upload-token': token },
  });
  assert.equal(entries.get(digest).expiresAt, 901000);
  await handler({
    data: { 'resume-reference': reference, 'resume-upload-token': 'forged' },
  });
  assert.equal(entries.size, 1);
});

test('a retried upload cannot overwrite a stored résumé', async () => {
  const files = new Map();
  const handler = createHandler(() => ({
    set: async (key, value, options) => {
      if (!options.onlyIfNew || !files.has(key)) files.set(key, value);
    },
  }));
  assert.equal((await handler(request(pdf()))).status, 201);
  const another = new File(['%PDF-1.7\nDifferent contents'], 'resume.pdf', {
    type: 'application/pdf',
  });
  assert.equal((await handler(request(another))).status, 201);
  assert.equal(files.size, 1);
  assert.equal(
    Buffer.from(files.get(reference)).toString(),
    await pdf().text(),
  );
});

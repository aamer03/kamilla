import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import {
  MAX_RESUME_BYTES,
  PERMIT_TOKEN_PATTERN,
  RESUME_REFERENCE_PATTERN,
} from '../../src/shared/upload-policy.js';

const maxBytes = MAX_RESUME_BYTES;
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function reply(status, body) {
  return Response.json(body, { status, headers });
}

// Storage is private: there is deliberately no HTTP read/list/download route.
// The store factory is injectable so tests never write real applicant data.
export function createHandler(
  storeFactory = () => getStore('private-resumes'),
  permitStoreFactory = () =>
    getStore({ name: 'resume-upload-permits', consistency: 'strong' }),
  now = Date.now,
) {
  return async (request) => {
    if (request.method !== 'POST') return reply(405, { error: 'method' });
    const origin = new URL(request.url).origin;
    if (
      request.headers.get('origin') !== origin ||
      request.headers.get('x-resume-upload') !== '1'
    )
      return reply(403, { error: 'origin' });
    if (
      !request.headers.get('content-type')?.startsWith('multipart/form-data;')
    ) {
      return reply(415, { error: 'type' });
    }
    if (Number(request.headers.get('content-length')) > maxBytes + 65536) {
      return reply(413, { error: 'size' });
    }

    try {
      const token = request.headers.get('x-resume-permit') || '';
      const reference = request.headers.get('x-resume-reference') || '';
      if (
        !PERMIT_TOKEN_PATTERN.test(token) ||
        !RESUME_REFERENCE_PATTERN.test(reference)
      ) {
        return reply(403, { error: 'verification' });
      }
      const permit = await permitStoreFactory().get(
        createHash('sha256').update(token).digest('hex'),
        { type: 'json' },
      );
      if (!permit) return reply(425, { error: 'verification-pending' });
      if (
        permit.reference !== reference ||
        !Number.isFinite(permit.expiresAt) ||
        permit.expiresAt <= now()
      ) {
        return reply(403, { error: 'verification' });
      }
      // Bound memory even when Content-Length is missing or untrusted.
      const reader = request.body?.getReader();
      if (!reader) return reply(400, { error: 'file' });
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes + 65536) {
          await reader.cancel();
          return reply(413, { error: 'size' });
        }
        chunks.push(value);
      }
      const data = await new Response(new Blob(chunks), {
        headers: { 'Content-Type': request.headers.get('content-type') },
      }).formData();
      const file = data.get('resume');
      if (
        !(file instanceof File) ||
        data.getAll('resume').length !== 1 ||
        !file.size
      ) {
        return reply(400, { error: 'file' });
      }
      if (file.size > maxBytes) return reply(413, { error: 'size' });
      const extension = file.name.split('.').pop().toLowerCase();
      const bytes = new Uint8Array(await file.arrayBuffer());
      const startsWith = (signature) =>
        signature.every((byte, index) => bytes[index] === byte);
      const types = {
        pdf: ['application/pdf', startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])],
        doc: [
          'application/msword',
          startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
        ],
        docx: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          startsWith([0x50, 0x4b, 0x03, 0x04]) &&
            Buffer.from(bytes).includes(Buffer.from('word/document.xml')) &&
            Buffer.from(bytes).includes(Buffer.from('[Content_Types].xml')),
        ],
      };
      const type = types[extension];
      if (
        !type?.[1] ||
        (file.type &&
          file.type !== type[0] &&
          file.type !== 'application/octet-stream')
      ) {
        return reply(415, { error: 'type' });
      }
      await storeFactory().set(reference, bytes.buffer, {
        onlyIfNew: true,
        metadata: {
          filename: file.name.slice(0, 200),
          contentType: type[0],
          uploadedAt: new Date().toISOString(),
        },
      });
      return reply(201, { reference });
    } catch {
      // Do not log résumé data, filenames, or storage credentials.
      return reply(503, { error: 'unavailable' });
    }
  };
}

export default createHandler();

export const config = {
  path: '/api/resume-upload',
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};

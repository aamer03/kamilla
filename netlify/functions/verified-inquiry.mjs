import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import {
  PERMIT_TOKEN_PATTERN,
  RESUME_REFERENCE_PATTERN,
  PERMIT_TTL_MS,
} from '../../src/shared/upload-policy.js';

export function createVerifiedHandler(
  storeFactory = () =>
    getStore({ name: 'resume-upload-permits', consistency: 'strong' }),
  now = Date.now,
) {
  return async ({ data }) => {
    const token = data?.['resume-upload-token'];
    const reference = data?.['resume-reference'];
    if (data?.['form-name'] && data['form-name'] !== 'aide-inquiry') return;
    if (
      !PERMIT_TOKEN_PATTERN.test(token || '') ||
      !RESUME_REFERENCE_PATTERN.test(reference || '')
    )
      return;
    // Netlify verifies the event signature before invoking formSubmitted.
    // This module has no public HTTP handler and never issues permits from a request body.
    await storeFactory().setJSON(
      createHash('sha256').update(token).digest('hex'),
      {
        reference,
        expiresAt: now() + PERMIT_TTL_MS,
      },
      { onlyIfNew: true },
    );
  };
}

export default { formSubmitted: createVerifiedHandler() };

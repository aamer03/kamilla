import {
  MAX_RESUME_BYTES,
  RESUME_EXTENSION_PATTERN,
} from '../../shared/upload-policy.js';
export function createResumeUpload(form, status, { browser, Data, send }) {
  const resume = form.querySelector('[data-resume-input]');
  const removeResume = form.querySelector('[data-remove-resume]');
  const resumeReference = form.querySelector('[name="resume-reference"]');
  const uploadToken = form.querySelector('[name="resume-upload-token"]');
  const uploadStatus = form.querySelector('[data-upload-status]');
  const retryUpload = form.querySelector('[data-retry-upload]');
  let pendingResumeFile;
  if (resume) resume.disabled = false;

  async function uploadVerifiedResume() {
    if (!pendingResumeFile) return;
    uploadStatus.hidden = false;
    uploadStatus.textContent = form.dataset.uploading;
    uploadStatus.removeAttribute('data-error');
    retryUpload.hidden = true;
    retryUpload.disabled = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const body = new Data();
        body.append('resume', pendingResumeFile);
        const response = await send('/api/resume-upload', {
          method: 'POST',
          headers: {
            'X-Resume-Upload': '1',
            'X-Resume-Permit': uploadToken.value,
            'X-Resume-Reference': resumeReference.value,
          },
          body,
          signal: controller.signal,
        });
        if (response.status === 425 && attempt < 4) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1)),
          );
          continue;
        }
        if (!response.ok) throw new Error('Upload not accepted');
        const result = await response.json();
        if (result.reference !== resumeReference.value)
          throw new Error('Reference mismatch');
        uploadStatus.textContent = form.dataset.uploadComplete;
        pendingResumeFile = undefined;
        form.reset();
        return;
      }
    } catch {
      uploadStatus.textContent = form.dataset.uploadPending;
      uploadStatus.dataset.error = 'true';
      retryUpload.hidden = false;
    } finally {
      clearTimeout(timer);
      retryUpload.disabled = false;
    }
  }
  retryUpload.addEventListener('click', uploadVerifiedResume);

  function validateResume() {
    if (!resume) return;
    const file = resume.files[0];
    let message = '';
    if (file && !RESUME_EXTENSION_PATTERN.test(file.name)) {
      message = form.dataset.resumeTypeError;
    } else if (file && file.size > MAX_RESUME_BYTES) {
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

  return {
    validate: validateResume,
    upload: uploadVerifiedResume,
    hasFile: () => Boolean(pendingResumeFile),
    timeout: resume ? 30000 : 20000,
    prepare() {
      if (resume?.files.length) {
        pendingResumeFile = resume.files[0];
        resumeReference.value = browser.crypto.randomUUID();
        uploadToken.value = [
          ...browser.crypto.getRandomValues(new Uint8Array(32)),
        ]
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('');
      }
    },
    setBusy(busy) {
      if (resume) {
        resume.disabled = busy;
        removeResume.disabled = busy;
      }
    },
  };
}

import { createCaptchaController } from './forms/captcha.js';
import { initializeInquiryForm } from './forms/submission.js';
import { initializeFormSwitcher } from './forms/switcher.js';

const forms = [...document.querySelectorAll('[data-inquiry-form]')];
const captcha = createCaptchaController();
forms.forEach((form) => initializeInquiryForm(form, captcha));
initializeFormSwitcher(forms);

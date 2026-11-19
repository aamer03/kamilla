export function createFormValidation(form) {
  const email = form.querySelector('[name="email"]');
  const phone = form.querySelector('[name="phone"]');
  const contactMethod = form.querySelector('[name="preferred-contact-method"]');
  const certifications = [
    ...form.querySelectorAll('[name="certifications[]"]'),
  ];

  function validateCertifications(changed) {
    if (!certifications.length) return;
    if (changed?.checked) {
      certifications.forEach((checkbox) => {
        if (
          checkbox !== changed &&
          (changed.value === 'None yet' || checkbox.value === 'None yet')
        ) {
          checkbox.checked = false;
        }
      });
    }
    certifications[0].setCustomValidity(
      certifications.some((checkbox) => checkbox.checked)
        ? ''
        : form.dataset.certificationsRequired,
    );
  }

  certifications.forEach((checkbox) => {
    checkbox.addEventListener('change', () => validateCertifications(checkbox));
  });
  validateCertifications();

  function validateContact() {
    email.setCustomValidity('');
    phone.setCustomValidity('');
    if (!email.value.trim() && !phone.value.trim()) {
      email.setCustomValidity(form.dataset.contactRequired);
    } else if (contactMethod.value === 'Email' && !email.value.trim()) {
      email.setCustomValidity(form.dataset.emailRequired);
    } else if (
      ['Phone call', 'Text message'].includes(contactMethod.value) &&
      !phone.value.trim()
    ) {
      phone.setCustomValidity(form.dataset.phoneRequired);
    }
  }

  form.addEventListener('input', validateContact);
  form.addEventListener('change', validateContact);

  return () => {
    validateContact();
    validateCertifications();
  };
}

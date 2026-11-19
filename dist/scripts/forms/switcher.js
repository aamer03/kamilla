export function initializeFormSwitcher(
  forms,
  root = document,
  browser = window,
) {
  const inquiryChooser = root.querySelector('[data-inquiry-chooser]');

  if (inquiryChooser && forms.length) {
    const choices = [
      ...inquiryChooser.querySelectorAll('[name="inquiry-type"]'),
    ];

    function showChosenForm() {
      const selected = choices.find((choice) => choice.checked);
      forms.forEach((form) => {
        form.hidden = form.getAttribute('name') !== selected?.value;
      });
    }

    function openLinkedForm() {
      const selected = choices.find(
        (choice) =>
          choice.getAttribute('aria-controls') ===
          browser.location.hash.slice(1),
      );
      if (!selected) return;
      selected.checked = true;
      showChosenForm();
      root
        .getElementById(selected.getAttribute('aria-controls'))
        .scrollIntoView();
    }

    choices.forEach((choice) =>
      choice.addEventListener('change', showChosenForm),
    );
    root.querySelector('.inquiry-grid').classList.add('single-inquiry');
    showChosenForm();
    inquiryChooser.hidden = false;
    openLinkedForm();
    browser.addEventListener('hashchange', openLinkedForm);
  }
}

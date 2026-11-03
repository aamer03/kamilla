const menuButton = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
const mobile = window.matchMedia('(max-width: 960px)');

function closeMenu(returnFocus = false) {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
    if (returnFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(opening));
    navigation.classList.toggle('open', opening);
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
document.addEventListener('click', event => {
    if (!event.target.closest('header')) closeMenu();
});
document.querySelector('header').addEventListener('focusout', event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) closeMenu();
});
mobile.addEventListener('change', () => {
    const focusWasInNavigation = navigation.contains(document.activeElement);
    closeMenu(mobile.matches && focusWasInNavigation);
});
document.documentElement.classList.add('js');

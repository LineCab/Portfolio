/* ==========================================================================
   Menu burger (petits écrans) : ouvre et ferme le panneau de navigation.
   Il se referme au clic sur un lien, en dehors du menu ou avec Échap.
   ========================================================================== */

(function () {
  const entete = document.querySelector('.entete');
  const bouton = entete && entete.querySelector('.burger');
  if (!bouton) return;
  const menu = document.getElementById(bouton.getAttribute('aria-controls'));

  const estOuvert = () => entete.classList.contains('menu-ouvert');

  function basculer(ouvrir) {
    entete.classList.toggle('menu-ouvert', ouvrir);
    bouton.setAttribute('aria-expanded', String(ouvrir));
    bouton.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
  }

  bouton.addEventListener('click', () => basculer(!estOuvert()));

  menu.addEventListener('click', (evenement) => {
    if (evenement.target.closest('a')) basculer(false);
  });

  document.addEventListener('click', (evenement) => {
    if (estOuvert() && !entete.contains(evenement.target)) basculer(false);
  });

  document.addEventListener('keydown', (evenement) => {
    if (evenement.key === 'Escape' && estOuvert()) {
      basculer(false);
      bouton.focus();
    }
  });

  // Retour sur grand écran : le menu redevient la barre de navigation normale
  window.matchMedia('(min-width: 961px)').addEventListener('change', (requete) => {
    if (requete.matches) basculer(false);
  });
})();

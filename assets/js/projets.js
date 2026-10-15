/* ==========================================================================
   Page Projets
   - Le sommaire suit la lecture : le projet qui franchit le milieu de la
     fenêtre devient actif et la barre verte montre la progression.
   - Vidéos : si une balise <video> est ajoutée dans le cadre d'un projet,
     la vidéo du projet en cours se lance (sans le son) et les autres se
     mettent en pause. Le bouton rond permet de la lire ou de l'arrêter.
   ========================================================================== */

(function () {
  const projets = Array.from(document.querySelectorAll('.projet'));
  const liens = Array.from(document.querySelectorAll('.sommaire__liste a'));
  const progression = document.querySelector('.sommaire__progression');
  const videos = projets.map((projet) => projet.querySelector('.projet__media video'));
  const boutons = projets.map((projet) => projet.querySelector('.lecture'));
  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sur un écran très haut (plus de 2200 px), toute la page est visible :
  // le sommaire ne suit plus la lecture et chaque vidéo visible joue.
  const ecranTresHaut = () => (window.innerHeight || 900) >= 2200;

  let actif = 0;
  let actifPrecedent = null;
  const partVisible = projets.map(() => 0); // part de chaque vidéo visible à l'écran (0 à 1)
  const doitJouer = projets.map(() => false);
  let choixManuel = []; // 'play' ou 'pause' quand la visiteuse a cliqué sur le bouton

  // ---------- Vidéos ----------

  function synchroniserVideos() {
    const suiviLecture = !ecranTresHaut();
    if (suiviLecture && actif !== actifPrecedent) {
      choixManuel = [];
      actifPrecedent = actif;
    }
    videos.forEach((video, i) => {
      if (!video) return;
      if (partVisible[i] < 0.1) choixManuel[i] = undefined;
      const auto = !mouvementReduit && (suiviLecture ? i === actif && partVisible[i] >= 0.25 : partVisible[i] >= 0.5);
      const jouer = choixManuel[i] === 'pause' ? false : (choixManuel[i] === 'play' ? true : auto);
      if (jouer && video.paused) {
        // Une vidéo relancée automatiquement repart du début
        if (!doitJouer[i] && choixManuel[i] !== 'play') video.currentTime = 0;
        video.play().catch(() => {});
      } else if (!jouer && !video.paused) {
        video.pause();
      }
      doitJouer[i] = jouer;
    });
  }

  function afficherBouton(i, joue) {
    const bouton = boutons[i];
    if (!bouton) return;
    bouton.classList.toggle('joue', joue);
    bouton.setAttribute('aria-label', joue ? 'Mettre la vidéo en pause' : 'Lire la vidéo');
  }

  videos.forEach((video, i) => {
    if (!video) return;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.addEventListener('play', () => afficherBouton(i, true));
    video.addEventListener('pause', () => afficherBouton(i, false));
  });

  boutons.forEach((bouton, i) => {
    if (!bouton) return;
    bouton.addEventListener('click', () => {
      const video = videos[i];
      if (!video) return;
      if (!video.paused) {
        choixManuel[i] = 'pause';
        doitJouer[i] = false;
        video.pause();
      } else {
        choixManuel[i] = 'play';
        doitJouer[i] = true;
        video.play().catch(() => {});
      }
    });
  });

  if ('IntersectionObserver' in window) {
    const observateur = new IntersectionObserver((entrees) => {
      entrees.forEach((entree) => {
        const i = videos.indexOf(entree.target);
        if (i >= 0) partVisible[i] = entree.isIntersecting ? entree.intersectionRatio : 0;
      });
      synchroniserVideos();
    }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
    videos.forEach((video) => { if (video) observateur.observe(video); });
  } else {
    partVisible.fill(1);
  }

  // ---------- Sommaire ----------

  let image = null;

  function mettreAJour() {
    if (image) return;
    image = requestAnimationFrame(() => {
      image = null;
      let nouvelActif = 0;
      let avancement = 0;
      if (!ecranTresHaut()) {
        const ligne = window.innerHeight * 0.45;
        projets.forEach((projet, i) => {
          const r = projet.getBoundingClientRect();
          if (r.top <= ligne) {
            nouvelActif = i;
            avancement = (i + Math.min(1, Math.max(0, (ligne - r.top) / Math.max(1, r.height)))) / projets.length;
          }
        });
      }
      actif = nouvelActif;
      synchroniserVideos();
      liens.forEach((lien, i) => {
        if (i === actif) lien.setAttribute('aria-current', 'location');
        else lien.removeAttribute('aria-current');
      });
      if (progression) progression.style.setProperty('--progression', (avancement * 100).toFixed(1) + '%');
    });
  }

  window.addEventListener('scroll', mettreAJour, { passive: true });
  window.addEventListener('resize', mettreAJour);
  mettreAJour();
})();

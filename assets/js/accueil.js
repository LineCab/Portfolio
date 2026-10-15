/* ==========================================================================
   Page Accueil : le projet MyIndygo raconté au défilement
   --------------------------------------------------------------------------
   La zone .defilement est haute de 5,5 écrans. Pendant qu'on la parcourt, la
   scène reste collée sous l'en-tête et la progression « q » (en hauteurs de
   scène, de 0 à 4,5) pilote l'animation :
     étape 1 → 2 : le téléphone passe de droite à gauche en tournant ;
     étape 2 → 3 : il revient à droite ;
     étape 3 → 4 : il sort de l'écran et l'ordinateur s'ouvre.
   Le script ne fait que calculer des valeurs et les poser en variables CSS
   (--x, --opacite, --transform…) sur les éléments ; toute la mise en forme
   est dans accueil.css.
   ========================================================================== */

(function () {
  const zone = document.querySelector('.defilement');
  if (!zone) return;

  const $ = (selecteur) => zone.querySelector(selecteur);
  const $$ = (selecteur) => Array.from(zone.querySelectorAll(selecteur));

  const el = {
    scene: $('.scene'),
    halo: $('.halo'),
    ombre: $('.ombre-portee'),
    ordinateur: $('.ordinateur'),
    capotDos: $('.ordinateur__dos'),
    capot: $('.ordinateur__capot'),
    ecranEteint: $('.ordinateur__ecran-eteint'),
    telephoneScene: $('.telephone-scene'),
    telephone: $('.telephone'),
    captures: $$('.telephone__capture'),
    reflet: $('.telephone__reflet'),
    annotations: $$('.annotations'),
    bulles: [$$('.bulle[data-annotation="1"]'), $$('.bulle[data-annotation="2"]')],
    textes: $$('.txt'),
    etapes: $$('.etape'),
    indice: $('.indice')
  };

  // Pose des variables CSS sur un élément (seulement celles qui ont changé)
  function regler(element, variables) {
    if (!element) return;
    const avant = element._variables || (element._variables = {});
    for (const nom in variables) {
      const valeur = String(variables[nom]);
      if (avant[nom] !== valeur) {
        element.style.setProperty('--' + nom, valeur);
        avant[nom] = valeur;
      }
    }
  }

  function attributs(element, valeurs) {
    for (const nom in valeurs) element.setAttribute(nom, valeurs[nom]);
  }

  const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Positions de chaque étape, en hauteurs d'écran défilées
  const ARRETS = [0, 1.45, 2.95, 4.5];

  const etat = {
    live: false,   // false sur un écran très haut (≥ 2200 px) : la scène reste alors fixe
    largeur: 1440, // largeur de la fenêtre
    hauteur: 900,  // hauteur de la scène
    etroit: false, // écran de moins de 820 px
    entete: 0,     // hauteur de l'en-tête collant, sous lequel la scène se colle
    q: 0           // progression du défilement
  };
  let qFixe = 0;       // progression quand la scène est fixe (animée par les boutons d'étapes)
  let animation = null;
  let image = null;

  const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // ---------- Calcul de toutes les valeurs de l'animation ----------

  function calculer() {
    const live = etat.live;
    const W = etat.largeur;
    const V = etat.hauteur;
    const narrow = etat.etroit;
    // Petit téléphone (écran de 720 px de haut ou moins) : animation plus petite et plus haute
    const court = narrow && V <= 632;
    const reduce = mouvementReduit;
    const q = live ? etat.q : qFixe;

    const ST = [0.35, 1.85, 3.35], TR = 0.7;
    const raw = (i) => clamp((q - ST[i]) / TR, 0, 1);
    const r0 = raw(0), r1 = raw(1), r2 = raw(2);
    const t0 = ease(r0), t1 = ease(r1), t2 = ease(r2);
    const pos = t0 + t1 + t2;

    // Le téléphone suit la grille de 1440 px, même sur grand écran
    const Wc = Math.min(W, 1440);
    const px = (pct) => W / 2 + (pct / 100 - 0.5) * Wc;
    const xR = narrow ? 50 : 66, xL = narrow ? 50 : 34;
    let x, ry, rz, arc = 0, op = 1, sc = 1, e0 = 0, e1 = 0, e2 = 0;
    if (r0 < 1) {
      x = px(lerp(xR, xL, t0));
      ry = lerp(-18, 18, t0) - (reduce ? 0 : 360 * t0);
      rz = lerp(-6, 6, t0);
      arc = Math.sin(Math.PI * t0);
      if (reduce) { e0 = 1 - t0; e1 = t0; } else if (t0 < 0.5) { e0 = 1; } else { e1 = 1; }
    } else if (r1 < 1) {
      x = px(lerp(xL, xR, t1));
      ry = lerp(18, -18, t1) + (reduce ? 0 : 360 * t1);
      rz = lerp(6, -6, t1);
      arc = Math.sin(Math.PI * t1);
      if (reduce) { e1 = 1 - t1; e2 = t1; } else if (t1 < 0.5) { e1 = 1; } else { e2 = 1; }
    } else {
      x = narrow ? W / 2 : lerp(px(xR), W + 0.2 * V, t2);
      ry = -18 + (reduce ? 0 : 150 * t2);
      rz = -6;
      e2 = 1;
      op = 1 - clamp(t2 * 2.2, 0, 1);
      sc = 1 - 0.25 * t2;
    }
    if (narrow) sc = sc * (court ? 0.44 : 0.5);
    const dy = -5 * arc;
    const dz = reduce ? 0 : -16 * arc;
    const phT = 'translate(-50%, -50%) translate3d(0, ' + dy.toFixed(2) + 'cqh, ' + dz.toFixed(2) + 'cqh) rotateZ(' + rz.toFixed(2) + 'deg) rotateX(8deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
    const cosY = Math.abs(Math.cos(ry * Math.PI / 180));
    const g = (((ry % 360) + 360) % 360) / 360 * 100;

    // Ordinateur : maquette réaliste, toujours au-dessus de la barre d'étapes
    const marge = Math.max(clamp(0.045 * W, 20, 64), W / 2 - 656);
    const txtW = Math.min(0.36 * W, 500);
    const RATIO = 1742 / 1780;
    const lapH = narrow ? Math.min((court ? 0.36 : 0.42) * V, (W - 40) / RATIO) : Math.min(0.8 * V, V - 150, (W - 2 * marge - txtW - 48) / RATIO);
    const lapW = lapH * RATIO;
    const lapX = narrow ? (W - lapW) / 2 : marge;
    const lapY = narrow ? 0.06 * V : Math.max(16, (V - 110 - lapH) / 2 + 6);
    const lin = ease(clamp((r2 - 0.05) / 0.45, 0, 1));
    const lo = clamp((r2 - 0.05) / 0.25, 0, 1);
    const lpTr = reduce ? 'none' : 'translate3d(0, ' + ((1 - lin) * 14).toFixed(2) + 'cqh, 0) rotate(' + ((1 - lin) * -5).toFixed(2) + 'deg) scale(' + (0.94 + 0.06 * lin).toFixed(3) + ')';
    // Charnière du capot : l'image de l'écran est reprojetée (homographie) pour chaque angle d'ouverture
    const LID_P = [[3.09242617, 2.29050448, 0.282165858, 183.652585], [-1.3455345, 1.59895099, 3.12790417, 1267.23039], [0.000237886726, -0.000188901624, 0.000249738624, 1]];
    const LID_GI = [[0.290626613, -0.0691902064, 34.3056039], [-0.151892775, -0.281167901, 384.200011], [-0.0000996934607, -0.000040104925, 1.06913114]];
    const LID_OUVERT = 102.921, LID_TRANCHE = 46.475;
    const ouv = reduce ? LID_OUVERT : LID_OUVERT * ease(clamp((r2 - 0.35) / 0.5, 0, 1));
    const cO = Math.cos(ouv * Math.PI / 180), sO = Math.sin(ouv * Math.PI / 180);
    const Gm = [0, 1, 2].map((r) => [LID_P[r][0], cO * LID_P[r][1] - sO * LID_P[r][2], LID_P[r][3]]);
    const Hm = [0, 1, 2].map((r) => [0, 1, 2].map((c) => Gm[r][0] * LID_GI[0][c] + Gm[r][1] * LID_GI[1][c] + Gm[r][2] * LID_GI[2][c]));
    const hk = Hm[2][2], sL = lapW / 1742;
    const lidT = 'matrix3d(' + [Hm[0][0] / hk, Hm[1][0] / hk, 0, Hm[2][0] / hk / sL, Hm[0][1] / hk, Hm[1][1] / hk, 0, Hm[2][1] / hk / sL, 0, 0, 1, 0, Hm[0][2] / hk * sL, Hm[1][2] / hk * sL, 0, 1].map((v) => (+v).toPrecision(9)).join(', ') + ')';
    const faceVisible = ouv > LID_TRANCHE;
    const ecranOff = 1 - clamp((r2 - 0.82) / 0.18, 0, 1);

    const o = [0, 1, 2, 3].map((k) => clamp(1 - Math.abs(pos - k) * 2.2, 0, 1));
    const y = [0, 1, 2, 3].map((k) => ((k - pos) * 6).toFixed(2));
    const active = Math.round(pos);
    const fill = (k) => clamp((pos - (k - 1)) * 100, 0, 100).toFixed(1);

    // Bulles d'annotation : accrochées à l'écran du téléphone au repos (mêmes calculs 3D que le CSS)
    const RAD = Math.PI / 180;
    const proj = (cx, ryD, rzD, u, v, z) => {
      let c = Math.cos(ryD * RAD), sn = Math.sin(ryD * RAD);
      const x1 = c * u + sn * z, y1 = v, z1 = -sn * u + c * z;
      c = Math.cos(8 * RAD); sn = Math.sin(8 * RAD);
      const y2 = c * y1 - sn * z1, z2 = sn * y1 + c * z1;
      c = Math.cos(rzD * RAD); sn = Math.sin(rzD * RAD);
      const X = cx + c * x1 - sn * y2, Y = 0.5 * V + sn * x1 + c * y2;
      const d = 2.22 * V, ox = 0.5 * W, oy = 0.45 * V, k = d / (d - z2);
      return { x: ox + (X - ox) * k, y: oy + (Y - oy) * k };
    };
    const pw = 0.32 * V, ph = 0.66 * V, pad = 0.0115 * V, zf = 0.019 * V;
    const bord = clamp(0.045 * W, 20, 64);
    const ecart = Math.max(22, 0.03 * V);
    const appels = (hs, he, gauche, ancres) => {
      const cx = px(gauche ? xL : xR), ryD = gauche ? 18 : -18, rzD = gauche ? 6 : -6;
      const xs = [];
      [-zf, zf].forEach((z) => {
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach((cn) => { xs.push(proj(cx, ryD, rzD, cn[0] * pw / 2, cn[1] * ph / 2, z).x); });
      });
      const bl = Math.min.apply(null, xs), br = Math.max.apply(null, xs);
      const place = gauche ? bl - ecart - bord : W - bord - br - ecart;
      const bw = Math.min(232, Math.floor(place));
      const ok = !narrow && bw >= 150;
      const rev = clamp((q - hs) / 0.22, 0, 1) * clamp((he - q) / 0.12, 0, 1);
      return {
        affichage: ok ? 'block' : 'none',
        largeur: bw,
        points: ancres.map((an, i) => {
          const A = proj(cx, ryD, rzD, -pw / 2 + pad + an[0] * (pw - 2 * pad), -ph / 2 + pad + an[1] * (ph - 2 * pad), zf);
          const cy = clamp(A.y + an[2] * V, 0.12 * V, 0.84 * V);
          const bx = gauche ? bl - ecart - bw : br + ecart;
          const sx = gauche ? bx + bw : bx;
          const dx = A.x - sx, dv = A.y - cy;
          const lag = i * 0.25;
          const ob = clamp((rev - lag) / 0.5, 0, 1);
          const dr = clamp((rev - lag - 0.1) / 0.5, 0, 1);
          const dot = clamp((rev - lag - 0.55) / 0.15, 0, 1);
          return {
            gauche: bx.toFixed(1),
            haut: cy.toFixed(1),
            decalage: reduce ? '0' : ((1 - ob) * (gauche ? -14 : 14)).toFixed(1),
            opacite: ob.toFixed(3),
            trace: 'M ' + sx.toFixed(1) + ' ' + cy.toFixed(1) + ' C ' + (sx + dx * 0.55).toFixed(1) + ' ' + cy.toFixed(1) + ', ' + (A.x - dx * 0.2).toFixed(1) + ' ' + (A.y - dv * 0.35).toFixed(1) + ', ' + A.x.toFixed(1) + ' ' + A.y.toFixed(1),
            traceDecalage: (1 - dr).toFixed(4),
            sx: sx.toFixed(1),
            sy: cy.toFixed(1),
            ax: A.x.toFixed(1),
            ay: A.y.toFixed(1),
            point: dot.toFixed(3),
            halo: (0.22 * dot).toFixed(3)
          };
        })
      };
    };

    return {
      zoneH: Math.round(live ? V * 5.5 : V),
      stageH: Math.round(V),
      phX: x.toFixed(1),
      phTop: narrow ? (court ? '25%' : '30%') : '50%',
      phT,
      phO: op.toFixed(3),
      ecrans: [e0, e1, e2].map((e) => e.toFixed(3)),
      glare: g.toFixed(1) + '%',
      shW: (20 * (0.35 + 0.65 * cosY) * sc).toFixed(2),
      shY: (36 * sc + 2).toFixed(2),
      shO: (0.9 * op).toFixed(3),
      lpX: lapX.toFixed(1), lpY: lapY.toFixed(1), lpW: lapW.toFixed(1), lpH: lapH.toFixed(1),
      lpTr,
      lo: lo.toFixed(3),
      ecranOff: ecranOff.toFixed(3),
      lidT,
      lidFace: faceVisible ? '1' : '0',
      lidDos: faceVisible ? '0' : '1',
      textes: [0, 1, 2, 3].map((k) => ({ opacite: o[k].toFixed(3), clic: o[k] > 0.5 ? 'auto' : 'none', y: y[k] + 'cqh' })),
      active,
      remplissages: ['100', fill(1), fill(2), fill(3)],
      hint: clamp(1 - q * 3, 0, 1).toFixed(3),
      annotations: [
        appels(1.05, 1.85, true, [[0.06, 0.546, -0.1], [0.06, 0.85, 0.065]]),
        appels(2.55, 3.35, false, [[0.8, 0.1, -0.02]])
      ]
    };
  }

  // ---------- Application des valeurs sur la page ----------

  function rendre() {
    const v = calculer();

    regler(zone, { hauteur: v.zoneH + 'px' });
    regler(el.scene, { hauteur: v.stageH + 'px' });

    regler(el.halo, { x: v.phX + 'px', haut: v.phTop, opacite: v.phO });
    regler(el.ombre, { x: v.phX + 'px', haut: v.phTop, decalage: v.shY + 'cqh', largeur: v.shW + 'cqh', opacite: v.shO });

    regler(el.ordinateur, { x: v.lpX + 'px', y: v.lpY + 'px', largeur: v.lpW + 'px', hauteur: v.lpH + 'px', opacite: v.lo, transform: v.lpTr });
    regler(el.capotDos, { transform: v.lidT, opacite: v.lidDos });
    regler(el.capot, { transform: v.lidT, opacite: v.lidFace });
    regler(el.ecranEteint, { opacite: v.ecranOff });

    regler(el.telephoneScene, { opacite: v.phO });
    regler(el.telephone, { x: v.phX + 'px', haut: v.phTop, transform: v.phT });
    el.captures.forEach((capture, i) => regler(capture, { opacite: v.ecrans[i] }));
    regler(el.reflet, { position: v.glare });

    v.annotations.forEach((a, n) => {
      const svg = el.annotations[n];
      regler(svg, { affichage: a.affichage });
      const traits = svg.querySelectorAll('.annotation__trait');
      const departs = svg.querySelectorAll('.annotation__depart');
      const halos = svg.querySelectorAll('.annotation__halo');
      const points = svg.querySelectorAll('.annotation__point');
      a.points.forEach((p, i) => {
        attributs(traits[i], { d: p.trace });
        regler(traits[i], { decalage: p.traceDecalage });
        attributs(departs[i], { cx: p.sx, cy: p.sy });
        regler(departs[i], { opacite: p.opacite });
        attributs(halos[i], { cx: p.ax, cy: p.ay });
        regler(halos[i], { opacite: p.halo });
        attributs(points[i], { cx: p.ax, cy: p.ay });
        regler(points[i], { opacite: p.point });
        regler(el.bulles[n][i], {
          gauche: p.gauche + 'px',
          haut: p.haut + 'px',
          largeur: a.largeur + 'px',
          decalage: p.decalage + 'px',
          opacite: p.opacite,
          affichage: a.affichage
        });
      });
    });

    el.textes.forEach((texte, k) => regler(texte, v.textes[k]));

    el.etapes.forEach((etape, k) => {
      if (k === v.active) etape.setAttribute('aria-current', 'step');
      else etape.removeAttribute('aria-current');
      regler(etape.querySelector('.etape__remplissage'), { remplissage: v.remplissages[k] + '%' });
    });

    regler(el.indice, { opacite: v.hint });
  }

  // ---------- Mesure de la fenêtre et suivi du défilement ----------

  function suivreDefilement() {
    if (!etat.live || image) return;
    image = requestAnimationFrame(() => {
      image = null;
      if (!etat.live) return;
      let q = (etat.entete - zone.getBoundingClientRect().top) / etat.hauteur;
      q = q < 0 ? 0 : (q > 4.5 ? 4.5 : q);
      if (Math.abs(q - etat.q) > 0.0004) {
        etat.q = q;
        rendre();
      }
    });
  }

  function mesurer(premiereFois) {
    const vw = document.documentElement.clientWidth || window.innerWidth || 1440;
    const entete = parseFloat(getComputedStyle(el.scene).top) || 0;
    const vh = (window.innerHeight || 900) - entete;
    const live = vh < 2200;
    const V = live ? Math.max(520, vh) : 900;
    // Sur mobile, la barre d'adresse change la hauteur de quelques pixels : on l'ignore
    if (!premiereFois && etat.live === live && etat.largeur === vw && Math.abs(etat.hauteur - V) < (live ? 120 : 1)) return;
    etat.live = live;
    etat.largeur = vw;
    etat.hauteur = V;
    etat.etroit = vw < 820;
    etat.entete = entete;
    rendre();
    requestAnimationFrame(suivreDefilement);
  }

  // Clic sur une étape : défilement jusqu'à elle (ou animation si la scène est fixe)
  function allerA(k) {
    const cible = ARRETS[k];
    if (etat.live) {
      const haut = zone.getBoundingClientRect().top + window.pageYOffset - etat.entete + cible * etat.hauteur;
      window.scrollTo({ top: Math.round(haut), behavior: mouvementReduit ? 'auto' : 'smooth' });
      return;
    }
    const depart = qFixe;
    if (animation) cancelAnimationFrame(animation);
    if (mouvementReduit) {
      qFixe = cible;
      rendre();
      return;
    }
    let debut = null;
    const duree = 900 + 450 * Math.min(3, Math.abs(cible - depart) / 1.5);
    const pas = (temps) => {
      if (debut === null) debut = temps;
      const u = Math.min(1, (temps - debut) / duree);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      qFixe = depart + (cible - depart) * e;
      rendre();
      animation = u < 1 ? requestAnimationFrame(pas) : null;
    };
    animation = requestAnimationFrame(pas);
  }

  el.etapes.forEach((etape, k) => etape.addEventListener('click', () => allerA(k)));
  window.addEventListener('resize', () => mesurer(false));
  window.addEventListener('scroll', suivreDefilement, { passive: true });
  mesurer(true);
})();

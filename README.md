# Portfolio — Line Cabaret

Portfolio de Line Cabaret, designer UI/UX. Site statique en HTML, CSS et JavaScript, sans dépendance ni étape de compilation : il suffit d'ouvrir `index.html` dans un navigateur.

## Organisation des fichiers

```
├── index.html              Accueil
├── projets.html            Projets
├── a-propos.html           À propos
└── assets/
    ├── css/
    │   ├── global.css      Commun aux trois pages : couleurs, police, en-tête, boutons, contact
    │   ├── accueil.css
    │   ├── projets.css
    │   └── a-propos.css
    ├── js/
    │   ├── accueil.js      Animation du projet MyIndygo au défilement
    │   └── projets.js      Sommaire qui suit la lecture, vidéos des projets
    ├── fonts/
    │   └── archivo-latin.woff2
    └── images/
        ├── accueil/
        ├── projets/
        └── a-propos/
```

Chaque page charge `global.css` puis sa propre feuille de style. Les couleurs et la marge latérale du site sont des variables définies en haut de `global.css` (`--accent`, `--encre`, `--creme`, `--marge`…) : changer `--accent` change le vert partout.

## Modifier le contenu

- **Textes et liens** : directement dans les fichiers HTML.
- **Photos de la page À propos** : remplacer les fichiers dans `assets/images/a-propos/` en gardant le même nom, ou changer le `src` des balises `<img>`.
- **Vidéo d'un projet** (page Projets) : ajouter une balise `<video src="…"></video>` dans le `<figure class="projet__media">` du projet. Elle se lance automatiquement quand on arrive sur le projet et le bouton rond permet de la mettre en pause.

## Publication

Les liens entre les pages sont relatifs : le dossier peut être publié tel quel, par exemple avec GitHub Pages (Settings → Pages → branche `main`, dossier `/ (root)`).

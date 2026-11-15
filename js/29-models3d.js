'use strict';
/* ===================== MODELE 3D BUDYNKÓW (three.js) =====================
   Każdy budynek ma własną prostą bryłę. Renderujemy ją raz do obrazka PNG (jeden wspólny kontekst WebGL,
   bo przeglądarki limitują ich liczbę), a kafelki, menu i okno budynku używają tego obrazka.
   Brak WebGL albo three.js: bImg() zwraca zwykłą ikonę (emoji), gra działa jak wcześniej. */
const B3D = { cache: {}, r: null, scene: null, cam: null };
const B3D_INK = 0x1b1446;
const B3D_SIZE = 256;

function b3dMesh(geo, color, { out = true, mat = {} } = {}) {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: .85, metalness: 0, ...mat }));
  if (out) { const o = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: B3D_INK, side: THREE.BackSide })); o.scale.setScalar(1.08); m.add(o); }   // obrys jak w ikonach 2D
  return m;
}
const b3dAt = (m, x, y, z, rx = 0, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; };
const B3D_GREY = 0xe8e1d6, B3D_ORANGE = 0xf28a1e, B3D_YELLOW = 0xffc21a, B3D_BLUE = 0x7cc4f5, B3D_RED = 0xe5383b, B3D_WHITE = 0xffffff, B3D_GREEN = 0x5cbf7a, B3D_DARK = 0x2a2060;
const b3dPad = g => g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(1.35, 1.45, .25, 10), B3D_GREY), 0, .125, 0));

const B3D_MODELS = {
  /* Elektrownia: kopuła reaktora ze świecącym rdzeniem i bateriami */
  warsztat(g) {
    b3dPad(g);
    g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.7, .9, 1.1, 8), B3D_ORANGE), 0, .8, 0));
    g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.5, .5, .3, 8), B3D_YELLOW, { mat: { emissive: 0xffa400, emissiveIntensity: .55 } }), 0, 1.5, 0));
    g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.14, .14, .9, 6), B3D_WHITE), 0, 2.05, 0));
    g.add(b3dAt(b3dMesh(new THREE.SphereGeometry(.17, 8, 6), B3D_RED), 0, 2.55, 0));
    [-.95, .95].forEach(x => { g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.22, .22, .7, 8), B3D_WHITE), x, .6, .45)); g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.1, .1, .12, 6), B3D_YELLOW), x, 1, .45)); });
  },
  /* Szklarnia: szklana kopuła z roślinami w środku */
  lab(g) {
    b3dPad(g);
    g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(1, 1.05, .35, 12), B3D_WHITE), 0, .42, 0));
    [[-.3, 0, .1, B3D_GREEN], [.35, .2, -.2, 0x3fa564], [.05, -.1, .45, B3D_GREEN]].forEach(([x, , z, c], i) => {
      g.add(b3dAt(b3dMesh(new THREE.ConeGeometry(.28, .8 + i * .15, 6), c), x, 1 + i * .08, z));
      g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.05, .05, .3, 5), 0x8a5a2b), x, .65, z));
    });
    g.add(b3dAt(b3dMesh(new THREE.SphereGeometry(.2, 8, 6), B3D_RED), .55, .75, .45));
    g.add(b3dAt(b3dMesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), B3D_BLUE, { out: false, mat: { transparent: true, opacity: .42, side: THREE.DoubleSide, roughness: .2 } }), 0, .6, 0));
  },
  /* Łowca lodu: wieża wiertnicza z kryształami lodu */
  lowca(g) {
    b3dPad(g);
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.06, .08, 2, 5), 0x645f7e), sx * .38, 1.2, sz * .38, -sz * .17, 0, sx * .17)));
    g.add(b3dAt(b3dMesh(new THREE.BoxGeometry(.55, .3, .55), B3D_RED), 0, 2.25, 0));
    g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.07, .07, 1.6, 6), B3D_YELLOW), 0, 1.3, 0));
    g.add(b3dAt(b3dMesh(new THREE.ConeGeometry(.2, .5, 6), B3D_ORANGE), 0, .5, 0, Math.PI));
    [[.95, .4, .75], [-.9, .6, .2], [.3, -.9, .55], [-.5, .8, .45]].forEach(([x, z, s]) => g.add(b3dAt(b3dMesh(new THREE.OctahedronGeometry(.32 * (s + .5)), 0xcfe9fb, { mat: { emissive: 0x7cc4f5, emissiveIntensity: .25 } }), x, .45, z, 0, x, 0)));
  },
  /* Satelita: antena satelitarna i mały satelita na orbicie */
  satelita(g) {
    b3dPad(g);
    g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.3, .45, .6, 8), B3D_GREY), 0, .55, 0));
    g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.09, .09, .9, 6), B3D_DARK), 0, 1.2, 0));
    const dish = b3dMesh(new THREE.SphereGeometry(.95, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2.3), B3D_WHITE, { out: false, mat: { side: THREE.DoubleSide } });
    g.add(b3dAt(dish, 0, 1.55, 0, -Math.PI * .72, Math.PI / 7, 0));
    g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.04, .04, .9, 5), B3D_DARK), .05, 2.05, -.55, -Math.PI * .22, 0, 0));
    g.add(b3dAt(b3dMesh(new THREE.SphereGeometry(.13, 8, 6), B3D_RED), .1, 2.45, -.92));
    const sat = new THREE.Group();   // mały satelita nad bazą
    sat.add(b3dMesh(new THREE.BoxGeometry(.32, .32, .32), B3D_YELLOW));
    [-1, 1].forEach(s => sat.add(b3dAt(b3dMesh(new THREE.BoxGeometry(.5, .04, .3), B3D_BLUE), s * .45, 0, 0)));
    g.add(b3dAt(sat, -.9, 2.5, .6, .3, .6, .2));
  },
  /* Hangar: łukowaty hangar i rakieta gotowa do startu */
  hangar(g) {
    b3dPad(g);
    g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.95, .95, 1.7, 14, 1, false, Math.PI / 2, Math.PI), B3D_WHITE, { mat: { side: THREE.DoubleSide } }), -.35, .25, 0, Math.PI / 2, 0, 0));
    const door = new THREE.Mesh(new THREE.CircleGeometry(.9, 14, 0, Math.PI), new THREE.MeshBasicMaterial({ color: B3D_DARK }));
    g.add(b3dAt(door, -.35, .26, .86));
    g.add(b3dAt(b3dMesh(new THREE.BoxGeometry(1.1, .12, .08), B3D_ORANGE), -.35, 1.06, .87));
    g.add(b3dAt(b3dMesh(new THREE.CylinderGeometry(.22, .26, 1.5, 8), B3D_WHITE), .95, 1, .1));
    g.add(b3dAt(b3dMesh(new THREE.ConeGeometry(.22, .5, 8), B3D_RED), .95, 2, .1));
    [0, 1, 2].forEach(i => { const a = i * Math.PI * 2 / 3; g.add(b3dAt(b3dMesh(new THREE.BoxGeometry(.06, .45, .3), B3D_RED), .95 + Math.cos(a) * .3, .4, .1 + Math.sin(a) * .3, 0, -a, 0)); });
  },
};

function b3dInit() {
  const c = document.createElement('canvas'); c.width = c.height = B3D_SIZE;
  B3D.r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true, preserveDrawingBuffer: true });
  B3D.r.setPixelRatio(1); B3D.r.setSize(B3D_SIZE, B3D_SIZE, false); B3D.r.setClearColor(0x000000, 0);
  B3D.scene = new THREE.Scene();
  B3D.scene.add(new THREE.HemisphereLight(0xffffff, 0x8f8cb8, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(3, 5, 4); B3D.scene.add(sun);
  B3D.cam = new THREE.OrthographicCamera(-2, 2, 2.15, -1.85, .1, 50);
  B3D.cam.position.set(5, 4.4, 5); B3D.cam.lookAt(0, .85, 0);
}
function b3dRender(type) {
  if (typeof THREE === 'undefined' || !B3D_MODELS[type]) return null;
  try {
    if (!B3D.r) b3dInit();
    const g = new THREE.Group();
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.7, 20), new THREE.MeshBasicMaterial({ color: B3D_INK, transparent: true, opacity: .16 }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = .005; g.add(shadow);
    B3D_MODELS[type](g); g.rotation.y = -Math.PI / 6;
    B3D.scene.add(g); B3D.r.render(B3D.scene, B3D.cam);
    const url = B3D.r.domElement.toDataURL('image/png');
    B3D.scene.remove(g);
    g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    return url;
  } catch (_) { return null; }
}
const bld3d = type => B3D.cache[type] !== undefined ? B3D.cache[type] : (B3D.cache[type] = b3dRender(type));
const bImg = (type, fallback) => { const u = bld3d(type); return u ? `<img class="bimg" src="${u}" alt="">` : fallback; };

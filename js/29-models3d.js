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

/* ===================== TŁA PLANET: realistyczny teren Księżyca i Marsa =====================
   Teren z szumu i kraterów, renderowany raz do JPEG (blob URL, żeby nie kopiować wielkich napisów do DOM).
   Dla planet bez tła (egzoplanety) zostaje płaski kolor z PLANETS[i].bg. */
function b3dRng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function b3dNoise(seed) {
  const h = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453; return n - Math.floor(n); };
  const sm = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
  const n2 = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi); return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v); };
  return (x, y, oct = 5) => { let a = 1, f = 1, s = 0, t = 0; for (let i = 0; i < oct; i++) { s += n2(x * f, y * f) * a; t += a; a *= .5; f *= 2; } return s / t; };
}
const B3D_BG = {
  ksiezyc1: { kind: 'moon', seed: 3, craters: 38, amp: 1.5, sun: [-14, 3.2, 8], earth: false, tone: [.5, .5, .52] },
  ksiezyc2: { kind: 'moon', seed: 11, craters: 22, amp: .8, sun: [12, 7, 6], earth: true, tone: [.42, .42, .45] },
  mars:     { kind: 'mars', seed: 5, amp: 2.2, rocks: 90 },
};
function b3dTerrain(cfg, w, d, seg) {
  const rnd = b3dRng(cfg.seed * 977), noise = b3dNoise(cfg.seed), craters = [];
  for (let i = 0; i < (cfg.craters || 0); i++) { const r = 1.6 + Math.pow(rnd(), 1.6) * 7; craters.push({ x: (rnd() - .5) * 44, z: 8 - rnd() * 48, r }); }   // kratery w polu widzenia kamery }
  const height = (x, z) => {
    let y = (noise(x * .08, z * .08, 5) - .5) * cfg.amp * 2 + (noise(x * .5, z * .5, 3) - .5) * .25;
    const far = Math.max(0, -z - 18) / 40; y += far * far * (cfg.kind === 'mars' ? 7 : 3.5) * noise(x * .05 + 9, z * .05, 4);   // dalekie wzgórza
    for (const c of craters) {
      const t = Math.hypot(x - c.x, z - c.z) / c.r;
      if (t < 1) y -= c.r * .22 * (1 - t * t) * (1 - t * .25);
      y += c.r * .09 * Math.exp(-Math.pow((t - 1) / .22, 2));   // wał krateru
    }
    return y;
  };
  const geo = new THREE.PlaneGeometry(w, d, seg, seg); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = height(x, z); pos.setY(i, y);
    const g = noise(x * .9 + 40, z * .9, 4), grain = (noise(x * 4, z * 4, 2) - .5) * .12;
    if (cfg.kind === 'moon') { const v = cfg.tone[0] * (.7 + g * .6) + grain; col.set([v, v * 1.0, v * 1.03], i * 3); }
    else { const v = .75 + g * .5 + grain; col.set([.62 * v, .27 * v, .15 * v], i * 3); }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  return { geo, height, rnd };
}
function b3dBgRender(id) {
  const cfg = B3D_BG[id]; if (!cfg || typeof THREE === 'undefined') return null;
  try {
    if (!B3D.r) b3dInit();
    const W = 560, H = 420, scene = new THREE.Scene(), moon = cfg.kind === 'moon';
    const { geo, height, rnd } = b3dTerrain(cfg, 90, 90, 150);
    scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: false })));
    if (moon) {
      scene.background = new THREE.Color(0x02030a);
      const n = 900, p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, e = rnd() * 1.1 + .05, r = 120; p.set([Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, -Math.abs(Math.sin(a) * Math.cos(e)) * r - 10], i * 3); }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3));
      scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.1, sizeAttenuation: false })));
      scene.add(new THREE.AmbientLight(0x8c93b0, .22));
      const sun = new THREE.DirectionalLight(0xfff4e0, 3.4); sun.position.set(...cfg.sun); scene.add(sun);
      if (cfg.earth) {   // Ziemia na niebie: oceany, lądy i chmury z szumu
        const eg = new THREE.SphereGeometry(5, 40, 28), ep = eg.attributes.position, ec = new Float32Array(ep.count * 3), en = b3dNoise(99);
        for (let i = 0; i < ep.count; i++) {
          const x = ep.getX(i), y = ep.getY(i), z = ep.getZ(i), land = en(x * .5 + 7, y * .5 + z * .4, 4), cloud = en(x * .9 + 3, y * .9, 4);
          const c = land > .55 ? [.22, .5, .24] : [.1, .28, .62], k = cloud > .6 ? Math.min(1, (cloud - .6) * 4) : 0;
          ec.set([c[0] + (1 - c[0]) * k, c[1] + (1 - c[1]) * k, c[2] + (1 - c[2]) * k], i * 3);
        }
        eg.setAttribute('color', new THREE.BufferAttribute(ec, 3));
        const earth = new THREE.Mesh(eg, new THREE.MeshLambertMaterial({ vertexColors: true })); earth.position.set(-26, 22, -85); scene.add(earth);
      }
    } else {
      const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, '#9d6a4d'); gr.addColorStop(.55, '#d49a73'); gr.addColorStop(1, '#ecc9a3'); x.fillStyle = gr; x.fillRect(0, 0, 4, 256);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
      scene.fog = new THREE.Fog(0xd8a982, 18, 78);
      scene.add(new THREE.HemisphereLight(0xffd8b8, 0x6b3a22, 1.0));
      const sun = new THREE.DirectionalLight(0xfff0d8, 2.6); sun.position.set(-8, 9, -4); scene.add(sun);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), new THREE.MeshBasicMaterial({ color: 0xfff4dc, fog: false })); disc.position.set(-22, 18, -88); scene.add(disc);
      const halo = new THREE.Mesh(new THREE.CircleGeometry(6, 24), new THREE.MeshBasicMaterial({ color: 0xffe2b8, transparent: true, opacity: .25, fog: false })); halo.position.set(-22, 18, -89); scene.add(halo);
      const phobos = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), new THREE.MeshBasicMaterial({ color: 0xb09a8a, fog: false })); phobos.position.set(24, 26, -90); scene.add(phobos);
      const rg = new THREE.DodecahedronGeometry(1, 0), rm = new THREE.MeshStandardMaterial({ color: 0x6e3a24, roughness: 1, flatShading: true });
      for (let i = 0; i < cfg.rocks; i++) {
        const x = (rnd() - .5) * 60, z = -rnd() * 45 + 12, s = .12 + Math.pow(rnd(), 3) * .9, m = new THREE.Mesh(rg, rm);
        m.position.set(x, height(x, z) + s * .3, z); m.scale.set(s, s * (.6 + rnd() * .5), s); m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); scene.add(m);
      }
    }
    const cam = new THREE.PerspectiveCamera(48, W / H, .1, 300); cam.position.set(0, 3.6, 14); cam.lookAt(0, moon ? .2 : .9, -20);
    B3D.r.setSize(W, H, false); B3D.r.render(scene, cam);
    const url = B3D.r.domElement.toDataURL('image/jpeg', .86);
    B3D.r.setSize(B3D_SIZE, B3D_SIZE, false);
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    const bin = atob(url.split(',')[1]), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([u8], { type: 'image/jpeg' }));
  } catch (_) { return null; }
}
const planetBg = id => B3D.bg && id in B3D.bg ? B3D.bg[id] : ((B3D.bg = B3D.bg || {})[id] = b3dBgRender(id));

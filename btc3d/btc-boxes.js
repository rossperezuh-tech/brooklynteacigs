/*!
 * Brooklyn Tea Cigs — floating 3D packs (black + gold)
 *
 * Use:
 *   <div class="btc-boxes"></div>
 *   <script src="/btc3d/btc-boxes.js" defer></script>
 *
 * Options on the div:
 *   data-boxes="black,gold"   which packs, in order ("black", "gold", or both)
 *   data-speed="1"            spin speed (0.5 = slower, 2 = faster)
 *
 * Give the div a size (CSS width + height or aspect-ratio). Background is transparent.
 * Needs three.js r147 from jsDelivr (loaded automatically). Falls back to poster.jpg without WebGL.
 */
(function () {
  "use strict";
  var SCRIPT = document.currentScript;
  var BASE = (SCRIPT && SCRIPT.src) ? SCRIPT.src.replace(/[^\/]*$/, "") : "/btc3d/";
  var CDN = "https://cdn.jsdelivr.net/npm/three@0.147.0/";
  var FACES = ["front", "back", "left", "right", "top", "bottom"];

  function loadScript(src) {
    return new Promise(function (ok, bad) {
      var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = bad;
      document.head.appendChild(s);
    });
  }
  function ready() {
    if (window.THREE && THREE.RoomEnvironment) return Promise.resolve();
    var p = window.THREE ? Promise.resolve() : loadScript(CDN + "build/three.min.js");
    return p.then(function () { return loadScript(CDN + "examples/js/environments/RoomEnvironment.js"); });
  }
  function webgl() {
    try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
    catch (e) { return false; }
  }
  function poster(el) {
    if (el.querySelector(".btc-poster")) return;
    var img = document.createElement("img");
    img.className = "btc-poster"; img.alt = "Brooklyn Tea Cigs packs, black and gold";
    img.src = BASE + "poster.jpg";
    img.style.cssText = "width:100%;height:100%;object-fit:contain;display:block";
    el.appendChild(img);
  }

  function mount(el) {
    var sets = (el.getAttribute("data-boxes") || "black,gold").split(",").map(function (s) { return s.trim(); })
      .filter(function (s) { return s === "black" || s === "gold"; });
    if (!sets.length) sets = ["black", "gold"];
    var speed = parseFloat(el.getAttribute("data-speed") || "1") || 1;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    if (el.clientHeight < 50) el.style.aspectRatio = sets.length > 1 ? "16 / 11" : "4 / 5";

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch (e) { poster(el); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);
    var cv = renderer.domElement;
    cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .8s ease";
    cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "3D preview of the Brooklyn Tea Cigs packs");
    el.appendChild(cv);

    var scene = new THREE.Scene();
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.03).texture;
    var camera = new THREE.PerspectiveCamera(26, 1, 5, 3000);
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x12160f, 0.35));
    var key = new THREE.DirectionalLight(0xfff1d6, 2.2); key.position.set(120, 200, 200); scene.add(key);
    var rim = new THREE.DirectionalLight(0xcfe0ff, 1.1); rim.position.set(-210, 110, -170); scene.add(rim);

    var loader = new THREE.TextureLoader(), aniso = renderer.capabilities.getMaxAnisotropy();
    var pending = 0, shown = false;
    function reveal() { if (!shown) { shown = true; cv.style.opacity = "1"; el.classList.add("btc-live"); } }
    function tex(file, srgb) {
      pending++;
      var t = loader.load(BASE + "tex/" + file, function () { if (--pending === 0) reveal(); }, undefined, function () { if (--pending === 0) reveal(); });
      t.encoding = srgb ? THREE.sRGBEncoding : THREE.LinearEncoding; t.anisotropy = aniso; return t;
    }
    function mat(set, face) {
      var art = tex(set + "/" + face + "_art.jpg", true), orm = tex(set + "/" + face + "_orm.jpg", false);
      return new THREE.MeshStandardMaterial({
        map: art, roughness: 1, roughnessMap: orm, metalness: set === "gold" ? 0.80 : 0.90, metalnessMap: orm,
        normalMap: tex(set + "/" + face + "_nrm.jpg", false), normalScale: new THREE.Vector2(0.6, 0.6),
        emissive: 0xffffff, emissiveMap: art, emissiveIntensity: set === "gold" ? 0.26 : 0.12,
        envMapIntensity: set === "gold" ? 2.1 : 1.3
      });
    }

    var W = 61, D = 26, H = 89;
    function quad(g, m, bl, br, tr, tl) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute([].concat(bl, br, tr, tl), 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, m));
    }
    function pack(set) {
      var g = new THREE.Group(), m = {};
      FACES.forEach(function (f) { m[f] = mat(set, f); });
      var x = W / 2, z = D / 2, y0 = -H / 2, y1 = H / 2;
      quad(g, m.front, [-x, y0, z], [x, y0, z], [x, y1, z], [-x, y1, z]);
      quad(g, m.right, [x, y0, z], [x, y0, -z], [x, y1, -z], [x, y1, z]);
      quad(g, m.back, [x, y0, -z], [-x, y0, -z], [-x, y1, -z], [x, y1, -z]);
      quad(g, m.left, [-x, y0, -z], [-x, y0, z], [-x, y1, z], [-x, y1, -z]);
      quad(g, m.top, [x, y1, -z], [-x, y1, -z], [-x, y1, z], [x, y1, z]);
      quad(g, m.bottom, [x, y0, z], [-x, y0, z], [-x, y0, -z], [x, y0, -z]);
      return g;
    }

    // soft floating shadow
    var sc = document.createElement("canvas"); sc.width = sc.height = 128;
    var sx = sc.getContext("2d"), gr = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(0,0,0,.55)"); gr.addColorStop(0.5, "rgba(0,0,0,.22)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    sx.fillStyle = gr; sx.fillRect(0, 0, 128, 128);
    var shTex = new THREE.CanvasTexture(sc);

    var GAP = 92, items = [];
    sets.forEach(function (set, i) {
      var holder = new THREE.Group();
      holder.position.x = (i - (sets.length - 1) / 2) * GAP;
      var p = pack(set); holder.add(p);
      var sh = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = -H / 2 - 16; holder.add(sh);
      scene.add(holder);
      items.push({ p: p, sh: sh, phase: i * Math.PI * 0.9, dir: i % 2 ? -1 : 1, base: i % 2 ? 0.5 : -0.5 });
    });

    // gentle tilt toward the mouse
    var mx = 0, my = 0, tx = 0, ty = 0;
    el.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = el.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2; my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    el.addEventListener("pointerleave", function () { mx = my = 0; });

    function resize() {
      var w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      var spanW = (sets.length - 1) * GAP + 80, spanH = H + 50;
      var vf = THREE.MathUtils.degToRad(camera.fov);
      var dist = Math.max((spanH / 2) / Math.tan(vf / 2), (spanW / 2) / (Math.tan(vf / 2) * camera.aspect)) * 1.05;
      camera.position.set(0, dist * 0.16, dist); camera.lookAt(0, -4, 0);
      camera.updateProjectionMatrix();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(el); else window.addEventListener("resize", resize);
    resize();

    var visible = true;
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: "100px" }).observe(el);

    var t = 0, last = performance.now();
    renderer.setAnimationLoop(function (now) {
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (!visible || document.hidden) return;
      if (!reduce) t += dt * speed;
      tx += (mx - tx) * Math.min(1, dt * 3); ty += (my - ty) * Math.min(1, dt * 3);
      items.forEach(function (it) {
        var bob = reduce ? 0 : Math.sin(t * 1.1 + it.phase) * 4;
        it.p.position.y = bob;
        it.p.rotation.y = it.base + it.dir * t * 0.32 + tx * 0.35;
        it.p.rotation.x = 0.06 + Math.sin(t * 0.7 + it.phase) * 0.04 + ty * 0.12;
        it.p.rotation.z = Math.sin(t * 0.5 + it.phase) * 0.03;
        var s = 1 - bob / 30; it.sh.scale.set(s, s, 1); it.sh.material.opacity = 0.9 - bob / 14;
      });
      key.position.set(Math.cos(t * 0.6) * 230, 190 + Math.sin(t * 0.42) * 50, Math.sin(t * 0.6) * 170 + 150);
      renderer.render(scene, camera);
    });
    setTimeout(reveal, 6000);
  }

  function boot() {
    var els = document.querySelectorAll(".btc-boxes");
    if (!els.length) return;
    if (!webgl()) { els.forEach(poster); return; }
    ready().then(function () { els.forEach(function (el) { if (!el.__btc) { el.__btc = 1; mount(el); } }); })
           .catch(function () { els.forEach(poster); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

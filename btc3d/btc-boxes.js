/*!
 * Brooklyn Tea Cigs — floating 3D packs (black + gold)
 * Drop-in: <div class="btc-boxes"></div> + <script src="/btc3d/btc-boxes.js" defer></script>
 * Options on the div: data-boxes="black,gold" (or just "gold"), data-speed="1"
 */
(function () {
  "use strict";
  var SCRIPT = document.currentScript;
  var BASE = (SCRIPT && SCRIPT.src) ? SCRIPT.src.replace(/[^\/]*$/, "") : "/btc3d/";
  var CDN = "https://cdn.jsdelivr.net/npm/three@0.147.0/";
  var TEX = {"black":{"front_body":{"art":"black/front_body_art.jpg","orm":"black/front_body_orm.png","glow":"black/front_body_glow.jpg"},"front_lid":{"art":"black/front_lid_art.jpg","orm":"black/front_lid_orm.png","glow":"black/front_lid_glow.jpg"},"back_body":{"art":"black/back_body_art.jpg","orm":"black/back_body_orm.png","glow":"black/back_body_glow.jpg"},"back_lid":{"art":"black/back_lid_art.jpg","orm":"black/back_lid_orm.png","glow":"black/back_lid_glow.jpg"},"left_body":{"art":"black/left_body_art.jpg","orm":"black/left_body_orm.png","glow":"black/left_body_glow.jpg"},"left_lid":{"art":"black/left_lid_art.jpg","orm":"black/left_lid_orm.png","glow":"black/left_lid_glow.jpg"},"right_body":{"art":"black/right_body_art.jpg","orm":"black/right_body_orm.png","glow":"black/right_body_glow.jpg"},"right_lid":{"art":"black/right_lid_art.jpg","orm":"black/right_lid_orm.png","glow":"black/right_lid_glow.jpg"},"top":{"art":"black/top_art.jpg","orm":"black/top_orm.png","glow":"black/top_glow.jpg"},"bottom":{"art":"black/bottom_art.jpg","orm":"black/bottom_orm.png","glow":"black/bottom_glow.jpg"}},"gold":{"front_body":{"art":"gold/front_body_art.jpg","orm":"gold/front_body_orm.png","glow":"gold/front_body_art.jpg"},"front_lid":{"art":"gold/front_lid_art.jpg","orm":"gold/front_lid_orm.png","glow":"gold/front_lid_art.jpg"},"back_body":{"art":"gold/back_body_art.jpg","orm":"gold/back_body_orm.png","glow":"gold/back_body_art.jpg"},"back_lid":{"art":"gold/back_lid_art.jpg","orm":"gold/back_lid_orm.png","glow":"gold/back_lid_art.jpg"},"left_body":{"art":"gold/left_body_art.jpg","orm":"gold/left_body_orm.png","glow":"gold/left_body_art.jpg"},"left_lid":{"art":"gold/left_lid_art.jpg","orm":"gold/left_lid_orm.png","glow":"gold/left_lid_art.jpg"},"right_body":{"art":"gold/right_body_art.jpg","orm":"gold/right_body_orm.png","glow":"gold/right_body_glow.jpg"},"right_lid":{"art":"gold/right_lid_art.jpg","orm":"gold/right_lid_orm.png","glow":"gold/right_lid_art.jpg"},"top":{"art":"gold/top_art.jpg","orm":"gold/top_orm.png","glow":"gold/top_art.jpg"},"bottom":{"art":"gold/bottom_art.jpg","orm":"gold/bottom_orm.png","glow":"gold/bottom_art.jpg"}}};

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
    img.className = "btc-poster"; img.alt = "Brooklyn Tea Cigs packs, matte black and gold";
    img.src = BASE + "poster.png";
    img.style.cssText = "width:100%;height:100%;object-fit:contain;display:block";
    el.appendChild(img);
  }

  function mount(el) {
    var sets = (el.getAttribute("data-boxes") || "black,gold").split(",").map(function (s) { return s.trim(); }).filter(function (s) { return TEX[s]; });
    var speed = parseFloat(el.getAttribute("data-speed") || "1") || 1;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    if (!el.style.height && el.clientHeight < 50) el.style.aspectRatio = sets.length > 1 ? "16 / 11" : "4 / 5";

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch (e) { poster(el); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.setClearColor(0x000000, 0);
    var cv = renderer.domElement;
    cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .8s ease";
    cv.setAttribute("aria-label", "3D preview of the Brooklyn Tea Cigs packs");
    cv.setAttribute("role", "img");
    el.appendChild(cv);

    var scene = new THREE.Scene();
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(renderer), 0.04).texture;
    var camera = new THREE.PerspectiveCamera(26, 1, 1, 3000);

    scene.add(new THREE.HemisphereLight(0xf2ead8, 0x1a2216, 0.25));
    var key = new THREE.DirectionalLight(0xfff3dc, 1.8); key.position.set(120, 220, 180); scene.add(key);
    var rim = new THREE.DirectionalLight(0xbfd6ff, 0.9); rim.position.set(-200, 120, -160); scene.add(rim);

    var loader = new THREE.TextureLoader(), aniso = renderer.capabilities.getMaxAnisotropy();
    var pending = 0, shown = false;
    function reveal() { if (!shown) { shown = true; cv.style.opacity = "1"; el.classList.add("btc-live"); } }
    function tex(file, srgb) {
      pending++;
      var t = loader.load(BASE + "tex/" + file, function () { if (--pending === 0) reveal(); }, undefined, function () { if (--pending === 0) reveal(); });
      t.encoding = srgb ? THREE.sRGBEncoding : THREE.LinearEncoding; t.anisotropy = aniso; return t;
    }
    var cache = {};
    function mat(set, face) {
      var k = set + face; if (cache[k]) return cache[k];
      var f = TEX[set][face], orm = tex(f.orm, false);
      return (cache[k] = new THREE.MeshPhysicalMaterial({
        map: tex(f.art, true), roughness: 1, roughnessMap: orm, metalness: 1, metalnessMap: orm,
        iridescence: 0.6, iridescenceMap: orm, iridescenceIOR: 1.55, iridescenceThicknessRange: [180, 520],
        emissive: 0xffffff, emissiveMap: tex(f.glow, true), emissiveIntensity: set === "gold" ? 0.32 : 0.6
      }));
    }
    var board = new THREE.MeshStandardMaterial({ color: 0xe8e3d6, roughness: 0.95 });

    var W = 61, D = 26, H = 89, BODY = 68, LID = 21, T = 0.45;
    function wall(set, w, h, d, idx, face) {
      var ms = [board, board, board, board, board, board]; ms[idx] = mat(set, face);
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ms);
    }
    function pack(set) {
      var g = new THREE.Group(), m;
      function add(mesh, x, y, z) { mesh.position.set(x, y, z); g.add(mesh); }
      add(wall(set, W, BODY, T, 4, "front_body"), 0, BODY / 2, D / 2 - T / 2);
      add(wall(set, W, BODY, T, 5, "back_body"), 0, BODY / 2, -D / 2 + T / 2);
      add(wall(set, T, BODY, D - 2 * T, 1, "left_body"), -W / 2 + T / 2, BODY / 2, 0);
      add(wall(set, T, BODY, D - 2 * T, 0, "right_body"), W / 2 - T / 2, BODY / 2, 0);
      add(wall(set, W, T, D, 3, "bottom"), 0, T / 2, 0);
      var Y = BODY + 0.15;
      add(wall(set, W, LID, T, 4, "front_lid"), 0, Y + LID / 2, D / 2 - T / 2);
      add(wall(set, W, LID, T, 5, "back_lid"), 0, Y + LID / 2, -D / 2 + T / 2);
      add(wall(set, T, LID, D - 2 * T, 1, "left_lid"), -W / 2 + T / 2, Y + LID / 2, 0);
      add(wall(set, T, LID, D - 2 * T, 0, "right_lid"), W / 2 - T / 2, Y + LID / 2, 0);
      add(wall(set, W, T, D, 2, "top"), 0, Y + LID - 0.15 - T / 2, 0);
      g.children.forEach(function (c) { c.position.y -= H / 2; });   // spin about the middle
      return g;
    }

    // soft floating shadow
    var sc = document.createElement("canvas"); sc.width = sc.height = 128;
    var sx = sc.getContext("2d"), gr = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(0.5, "rgba(0,0,0,0.22)"); gr.addColorStop(1, "rgba(0,0,0,0)");
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
      // fit the row of packs with breathing room
      var spanW = (sets.length - 1) * GAP + 80, spanH = H + 50;
      var vf = THREE.MathUtils.degToRad(camera.fov);
      var dH = (spanH / 2) / Math.tan(vf / 2);
      var dW = (spanW / 2) / (Math.tan(vf / 2) * camera.aspect);
      var dist = Math.max(dH, dW) * 1.05;
      camera.position.set(0, dist * 0.16, dist);
      camera.lookAt(0, -4, 0);
      camera.updateProjectionMatrix();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(el); else window.addEventListener("resize", resize);
    resize();

    var visible = true;
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: "100px" }).observe(el);

    var t = 0, last = performance.now();
    function frame(now) {
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
      key.position.set(Math.cos(t * 0.6) * 220, 200 + Math.sin(t * 0.42) * 40, Math.sin(t * 0.6) * 220 + 80);
      renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(frame);
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

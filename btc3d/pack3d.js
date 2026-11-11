/*!
 * Brooklyn Tea Cigs — interactive 3D pack for the homepage hero.
 * Drag to turn, tap to open the lid, double-tap to take a cigarette out.
 *
 * Same model as btc3d/viewer.html, but the textures load from btc3d/tex
 * instead of being inlined, and touch is page-friendly: a sideways drag
 * turns the pack while an up/down swipe still scrolls the page.
 *
 * Use:
 *   <div class="pack3d" data-pack="black"> (optional still image) </div>
 *   <p data-pack-hint></p>                  optional live hint text
 * Load THREE (r147) and THREE.RoomEnvironment first. Adds .live to the div
 * once the pack is drawn, so a still image inside can fade out.
 */
(function () {
  "use strict";
  var SCRIPT = document.currentScript;
  var BASE = (SCRIPT && SCRIPT.src) ? SCRIPT.src.replace(/[^\/]*$/, "") : "btc3d/";
  var stage = document.querySelector(".pack3d");
  if (!stage || !window.THREE || !THREE.RoomEnvironment) return;
  var NAME = stage.getAttribute("data-pack") === "gold" ? "gold" : "black";
  var hint = document.querySelector("[data-pack-hint]");
  var HINT = {
    idle: "Drag to turn · tap to open · double-tap to take one out",
    open: "Double-tap to take one out · tap to close",
    out: "Double-tap to put it back",
    back: "Tap again to close"
  };
  function say(k) { if (hint) hint.textContent = HINT[k]; }

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);
  var cv = renderer.domElement;
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;" +
    "touch-action:pan-y;-webkit-tap-highlight-color:transparent;opacity:0;transition:opacity .8s ease";
  cv.setAttribute("role", "img");
  cv.setAttribute("tabindex", "0");
  cv.setAttribute("aria-label", "3D model of the black pack. Drag or use the arrow keys to turn it, tap or press Enter to open the lid.");
  stage.appendChild(cv);

  var scene = new THREE.Scene();
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.03).texture;
  // Straight-on camera so the first frame lines up with the still it replaces.
  var camera = new THREE.PerspectiveCamera(34, 1, 5, 2500);
  camera.position.set(0, 42, 244);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x12160f, 0.35));
  var key = new THREE.DirectionalLight(0xfff1d6, 2.2); key.position.set(120, 200, 200); scene.add(key);
  var rim = new THREE.DirectionalLight(0xcfe0ff, 1.1); rim.position.set(-210, 110, -170); scene.add(rim);
  var fill = new THREE.DirectionalLight(0xffe7c0, 0.5); fill.position.set(-120, 20, 220); scene.add(fill);

  // ---------- materials ----------
  var loader = new THREE.TextureLoader(), aniso = renderer.capabilities.getMaxAnisotropy();
  var FACES = ["front", "back", "left", "right", "top", "bottom"];
  var mats = {};
  function tex(file, srgb, done) {
    var t = loader.load(BASE + "tex/" + NAME + "/" + file, done, undefined, done);
    t.encoding = srgb ? THREE.sRGBEncoding : THREE.LinearEncoding; t.anisotropy = aniso;
    return t;
  }
  function buildMats(ready) {
    var left = FACES.length * 3;
    function done() { if (--left === 0) ready(); }
    FACES.forEach(function (f) {
      var orm = tex(f + "_orm.jpg", false, done), art = tex(f + "_art.jpg", true, done);
      mats[f] = new THREE.MeshStandardMaterial({
        map: art, roughness: 1, roughnessMap: orm, metalness: NAME === "gold" ? 0.80 : 0.90, metalnessMap: orm,
        normalMap: tex(f + "_nrm.jpg", false, done), normalScale: new THREE.Vector2(0.6, 0.6),
        emissive: 0xffffff, emissiveMap: art, emissiveIntensity: NAME === "gold" ? 0.26 : 0.12,
        envMapIntensity: NAME === "gold" ? 2.1 : 1.3
      });
    });
  }
  var board = new THREE.MeshStandardMaterial({ color: 0xe9e4d8, roughness: 0.95 });
  var collarMat = new THREE.MeshStandardMaterial({ color: 0xf2eee3, roughness: 0.9 });

  // ---------- geometry (mm) ----------
  var W = 61, D = 26, H = 89, BODY = 68, LID = 21, T = 0.45, E = 0.07;
  var printed = [];
  function quad(parent, face, bl, br, tr, tl, v0, v1) {
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([].concat(bl, br, tr, tl), 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, v0, 1, v0, 1, v1, 0, v1], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals();
    var m = new THREE.Mesh(g, board); parent.add(m); printed.push({ mesh: m, face: face });
  }
  function box(parent, w, h, d, x, y, z, mat) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || board); m.position.set(x, y, z); parent.add(m); return m;
  }
  var pack = new THREE.Group(); scene.add(pack);
  var inner = new THREE.Group(); inner.position.y = -H / 2; pack.add(inner);
  var body = new THREE.Group(); inner.add(body);
  var vB = BODY / H;
  box(body, W - 2 * E, BODY - E, T, 0, BODY / 2, D / 2 - T / 2 - E);
  box(body, W - 2 * E, BODY - E, T, 0, BODY / 2, -D / 2 + T / 2 + E);
  box(body, T, BODY - E, D - 2 * T, -W / 2 + T / 2 + E, BODY / 2, 0);
  box(body, T, BODY - E, D - 2 * T, W / 2 - T / 2 - E, BODY / 2, 0);
  box(body, W - 2 * E, T, D - 2 * E, 0, T / 2 + E, 0);
  quad(body, "front", [-W / 2, 0, D / 2], [W / 2, 0, D / 2], [W / 2, BODY, D / 2], [-W / 2, BODY, D / 2], 0, vB);
  quad(body, "right", [W / 2, 0, D / 2], [W / 2, 0, -D / 2], [W / 2, BODY, -D / 2], [W / 2, BODY, D / 2], 0, vB);
  quad(body, "back", [W / 2, 0, -D / 2], [-W / 2, 0, -D / 2], [-W / 2, BODY, -D / 2], [W / 2, BODY, -D / 2], 0, vB);
  quad(body, "left", [-W / 2, 0, -D / 2], [-W / 2, 0, D / 2], [-W / 2, BODY, D / 2], [-W / 2, BODY, -D / 2], 0, vB);
  quad(body, "bottom", [W / 2, 0, D / 2], [-W / 2, 0, D / 2], [-W / 2, 0, -D / 2], [W / 2, 0, -D / 2], 0, 1);

  // inner frame: 30 mm tall, 13 mm proud of the body, dipped at the front
  (function () {
    var TC = 0.4, CH = 30, CBOT = BODY - 17, DIP = 9, cw = W - 2 * T - 2 * TC - 0.3, cd = D - 2 * T - 1.0;
    var s = new THREE.Shape(), hw = cw / 2, dipW = cw * 0.64 / 2;
    s.moveTo(-hw, 0); s.lineTo(hw, 0); s.lineTo(hw, CH); s.lineTo(dipW, CH);
    s.lineTo(dipW, CH - DIP + 2); s.quadraticCurveTo(dipW, CH - DIP, dipW - 2, CH - DIP);
    s.lineTo(-dipW + 2, CH - DIP); s.quadraticCurveTo(-dipW, CH - DIP, -dipW, CH - DIP + 2);
    s.lineTo(-dipW, CH); s.lineTo(-hw, CH); s.closePath();
    var cf = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: TC, bevelEnabled: false }), collarMat);
    cf.position.set(0, CBOT, D / 2 - T - TC - 0.25); body.add(cf);
    [-1, 1].forEach(function (sx) { box(body, TC, CH, cd, sx * (W / 2 - T - TC / 2 - 0.25), CBOT + CH / 2, D / 2 - T - cd / 2 - 0.25, collarMat); });
  })();

  // 20 sticks, 7-6-7, filter up
  function filterTex() {
    var c = document.createElement("canvas"); c.width = 512; c.height = 256;
    var g = c.getContext("2d"), rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(7);
    g.fillStyle = "#ead6a8"; g.fillRect(0, 0, 512, 256);
    g.strokeStyle = "#1b1712"; g.fillStyle = "#1b1712"; g.lineCap = "round"; g.lineJoin = "round";
    for (var ty = 0; ty < 256; ty += 64) for (var tx = 0; tx < 512; tx += 64) {
      var cx = tx + 32 + (rnd() - 0.5) * 10, cy = ty + 32 + (rnd() - 0.5) * 10, k = Math.floor(rnd() * 4);
      g.lineWidth = 2.2; g.beginPath();
      if (k === 0) { g.arc(cx, cy, 20, 0, 7); g.moveTo(cx + 11, cy); g.arc(cx, cy, 11, 0, 7);
        for (var a = 0; a < 12; a++) { var t = a * Math.PI / 6; g.moveTo(cx + 11 * Math.cos(t), cy + 11 * Math.sin(t)); g.lineTo(cx + 20 * Math.cos(t), cy + 20 * Math.sin(t)); } }
      else if (k === 1) { for (var j = -1; j <= 1; j++) { g.moveTo(cx - 24, cy + j * 12); for (var q = 0; q < 6; q++) g.lineTo(cx - 24 + (q + 1) * 8, cy + j * 12 + (q % 2 ? -6 : 6)); } }
      else if (k === 2) { g.moveTo(cx, cy - 24); g.quadraticCurveTo(cx + 18, cy, cx, cy + 24); g.quadraticCurveTo(cx - 18, cy, cx, cy - 24); g.moveTo(cx, cy - 20); g.lineTo(cx, cy + 22);
        for (var v = -12; v <= 12; v += 6) { g.moveTo(cx, cy + v); g.lineTo(cx + 8, cy + v - 6); g.moveTo(cx, cy + v); g.lineTo(cx - 8, cy + v - 6); } }
      else { g.moveTo(cx - 26, cy - 26); g.lineTo(cx + 26, cy - 26); g.lineTo(cx, cy + 20); g.closePath(); g.moveTo(cx - 14, cy - 18); g.lineTo(cx + 14, cy - 18); g.lineTo(cx, cy + 6); g.closePath(); }
      g.stroke();
      for (var d = 0; d < 5; d++) { g.beginPath(); g.arc(tx + 6 + rnd() * 52, ty + 6 + rnd() * 52, 1.8, 0, 7); g.fill(); }
    }
    g.fillStyle = "#1b1712"; g.fillRect(0, 150, 512, 54);
    g.fillStyle = "#ead6a8";
    for (var x = 8; x < 512; x += 30) { g.fillRect(x, 162, 6, 30); g.fillRect(x + 10, 170, 10, 6); g.fillRect(x + 10, 182, 10, 6); }
    var tt = new THREE.CanvasTexture(c); tt.encoding = THREE.sRGBEncoding; tt.anisotropy = aniso;
    return tt;
  }
  function paperTex() {
    var c = document.createElement("canvas"); c.width = c.height = 256; var g = c.getContext("2d"), im = g.createImageData(256, 256);
    for (var p = 0; p < im.data.length; p += 4) { var v = 120 + Math.random() * 60; im.data[p] = im.data[p + 1] = im.data[p + 2] = v; im.data[p + 3] = 255; }
    g.putImageData(im, 0, 0); var tt = new THREE.CanvasTexture(c); tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(2, 6); return tt;
  }
  var stick = {};
  (function () {
    var R = 3.95, L = 84, FIL = 22, P = 8.1, ROW = 8 * 0.866, n = 20, i = 0;
    var tubeG = new THREE.CylinderGeometry(R, R, L - FIL, 24, 1, true), filtG = new THREE.CylinderGeometry(R, R, FIL, 24, 1, true);
    var endG = new THREE.CircleGeometry(R, 24); endG.rotateX(Math.PI / 2);
    var tubeM = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 1, metalness: 0, envMapIntensity: 0.25, bumpMap: paperTex(), bumpScale: 0.12 });
    var filtM = new THREE.MeshStandardMaterial({ map: filterTex(), roughness: 0.85 });
    var tube = new THREE.InstancedMesh(tubeG, tubeM, n);
    var filt = new THREE.InstancedMesh(filtG, filtM, n);
    var tipG = new THREE.CircleGeometry(R * 0.97, 24); tipG.rotateX(-Math.PI / 2);
    var tipM = new THREE.MeshStandardMaterial({ color: 0xf6f4ef, roughness: 1, bumpMap: paperTex(), bumpScale: 0.6 });
    var tip = new THREE.InstancedMesh(tipG, tipM, n);
    var m = new THREE.Matrix4(), rot = new THREE.Matrix4();
    [[7, -ROW], [6, 0], [7, ROW]].forEach(function (r) {
      for (var k = 0; k < r[0]; k++) {
        var x = (k - (r[0] - 1) / 2) * P, z = r[1];
        rot.makeRotationY((i * 2.399) % 6.283);
        m.makeTranslation(x, T + E + (L - FIL) / 2, z); tube.setMatrixAt(i, m);
        m.makeTranslation(x, T + E + L - FIL / 2, z).multiply(rot); filt.setMatrixAt(i, m);
        m.makeTranslation(x, T + E + L - 0.4, z); tip.setMatrixAt(i, m);
        i++;
      }
    });
    body.add(tube); body.add(filt); body.add(tip);
    var PULL = 16, pz = ROW, base = T + E;
    var g = new THREE.Group();
    var a = new THREE.Mesh(tubeG, tubeM); a.position.y = (L - FIL) / 2; g.add(a);
    var f = new THREE.Mesh(filtG, filtM); f.position.y = L - FIL / 2; f.rotation.y = (PULL * 2.399) % 6.283; g.add(f);
    var tp = new THREE.Mesh(tipG, tipM); tp.position.y = L - 0.4; g.add(tp);
    var bt = new THREE.Mesh(endG, new THREE.MeshStandardMaterial({ color: 0x3a342c, roughness: 1 })); g.add(bt);
    g.position.set(0, base, pz); g.visible = false; body.add(g);
    var hide = new THREE.Matrix4().makeScale(0, 0, 0), keep = new THREE.Matrix4();
    tube.getMatrixAt(PULL, keep);
    var keepF = new THREE.Matrix4(), keepT = new THREE.Matrix4(); filt.getMatrixAt(PULL, keepF); tip.getMatrixAt(PULL, keepT);
    stick = {
      g: g, base: base, z: pz,
      out: function (on) {
        tube.setMatrixAt(PULL, on ? hide : keep); filt.setMatrixAt(PULL, on ? hide : keepF); tip.setMatrixAt(PULL, on ? hide : keepT);
        tube.instanceMatrix.needsUpdate = filt.instanceMatrix.needsUpdate = tip.instanceMatrix.needsUpdate = true;
        g.visible = on;
      }
    };
  })();

  // lid, hinged on the back score
  var hinge = new THREE.Group(); hinge.position.set(0, BODY + 0.14, -D / 2); inner.add(hinge);
  var LH = LID - 0.14;
  box(hinge, W - 2 * E, LH - E, T, 0, LH / 2, D - T / 2 - E);
  box(hinge, W - 2 * E, LH - E, T, 0, LH / 2, T / 2 + E);
  box(hinge, T, LH - E, D - 2 * T, -W / 2 + T / 2 + E, LH / 2, D / 2);
  box(hinge, T, LH - E, D - 2 * T, W / 2 - T / 2 - E, LH / 2, D / 2);
  box(hinge, W - 2 * E, T, D - 2 * E, 0, LH - T / 2 - E, D / 2);
  quad(hinge, "front", [-W / 2, 0, D], [W / 2, 0, D], [W / 2, LH, D], [-W / 2, LH, D], vB, 1);
  quad(hinge, "right", [W / 2, 0, D], [W / 2, 0, 0], [W / 2, LH, 0], [W / 2, LH, D], vB, 1);
  quad(hinge, "back", [W / 2, 0, 0], [-W / 2, 0, 0], [-W / 2, LH, 0], [W / 2, LH, 0], vB, 1);
  quad(hinge, "left", [-W / 2, 0, 0], [-W / 2, 0, D], [-W / 2, LH, D], [-W / 2, LH, 0], vB, 1);
  quad(hinge, "top", [W / 2, LH, 0], [-W / 2, LH, 0], [-W / 2, LH, D], [W / 2, LH, D], 0, 1);

  // soft contact shadow
  var sc = document.createElement("canvas"); sc.width = sc.height = 128;
  var sx = sc.getContext("2d"), gr = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(0,0,0,.62)"); gr.addColorStop(0.5, "rgba(0,0,0,.24)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  sx.fillStyle = gr; sx.fillRect(0, 0, 128, 128);
  var shadow = new THREE.Mesh(new THREE.PlaneGeometry(120, 62), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -H / 2 - 13; scene.add(shadow);

  // ---------- lid + cigarette ----------
  var lidTarget = 0, lidAngle = 0, spin = !reduce, lastTouch = -1e9, yawTo = null;
  function toggleLid() {
    var open = lidTarget === 0;
    lidTarget = open ? -THREE.MathUtils.degToRad(112) : 0;
    if (open) {
      spin = false; vel = 0;
      var az = Math.atan2(camera.position.x, camera.position.z) - 0.42;   // turn the opening toward the viewer
      var cur = pack.rotation.y, d = ((az - cur + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      yawTo = cur + d;
    }
    say(open ? "open" : "idle");
  }
  var pullTarget = 0, pull = 0;
  function togglePull() {
    if (pullTarget === 0) { if (lidTarget === 0) toggleLid(); pullTarget = 1; say("out"); }
    else { pullTarget = 0; say("back"); }
  }

  // ---------- turning by hand ----------
  // touch-action:pan-y hands vertical swipes to the browser (page scroll,
  // reported here as pointercancel); sideways drags turn the pack.
  var drag = null, vel = 0, tapTimer = null, lastTap = 0;
  function grab() { spin = false; yawTo = null; lastTouch = performance.now(); }
  cv.addEventListener("pointerdown", function (e) {
    if (e.button > 0) return;
    var now = performance.now();
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, t0: now, t: now, moved: false };
    vel = 0;
    if (e.pointerType === "mouse") { try { cv.setPointerCapture(e.pointerId); } catch (err) {} cv.style.cursor = "grabbing"; }
  });
  cv.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var now = performance.now(), dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(e.clientX - drag.x0) > 6) { drag.moved = true; grab(); }
    if (drag.moved) {
      var k = 4 / Math.max(240, cv.clientWidth);          // a full-width drag turns the pack about 230°
      pack.rotation.y += dx * k;
      var dt = Math.max(1, now - drag.t) / 1000;
      vel = vel * 0.6 + (dx * k / dt) * 0.4;
      lastTouch = now;
    }
    drag.x = e.clientX; drag.t = now;
  });
  function release(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null; cv.style.cursor = "grab";
    if (cancelled || reduce || performance.now() - d.t > 80) vel = 0;
    if (cancelled || d.moved) return;
    var dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (dx * dx + dy * dy >= 64 || performance.now() - d.t0 >= 400) return;
    var now = performance.now();
    if (now - lastTap < 380) { clearTimeout(tapTimer); tapTimer = null; lastTap = 0; togglePull(); return; }
    lastTap = now;
    tapTimer = setTimeout(function () {
      tapTimer = null;
      if (pullTarget) pullTarget = 0;
      toggleLid();
    }, 380);
  }
  cv.addEventListener("pointerup", function (e) { release(e, false); });
  cv.addEventListener("pointercancel", function (e) { release(e, true); });
  cv.addEventListener("dblclick", function (e) {
    e.preventDefault();
    if (tapTimer) { clearTimeout(tapTimer); tapTimer = null; }
    if (lastTap !== 0) { lastTap = 0; togglePull(); }
  });
  cv.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault(); grab(); pack.rotation.y += e.key === "ArrowLeft" ? -0.35 : 0.35;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); if (pullTarget) pullTarget = 0; toggleLid();
    }
  });

  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w / h < 0.9 ? 34 : 27; camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener("resize", resize);
  resize();

  var visible = true;
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { rootMargin: "100px" }).observe(stage);

  var t = 0, last = performance.now();
  pack.rotation.y = -0.5;
  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!visible || document.hidden) return;
    t += dt;
    if (!spin && !reduce && !drag && lidTarget === 0 && yawTo === null && now - lastTouch > 3500) spin = true;
    if (!drag && Math.abs(vel) > 0.01) { pack.rotation.y += vel * dt; vel *= Math.pow(0.03, dt); }
    else if (!drag) {
      vel = 0;
      if (yawTo !== null) pack.rotation.y += (yawTo - pack.rotation.y) * Math.min(1, dt * 4);
      else if (spin) pack.rotation.y += dt * 0.34;
    }
    var bob = reduce ? 0 : Math.sin(t * 1.15) * 2.4;
    pack.position.y = bob;
    pack.rotation.z = reduce ? 0 : Math.sin(t * 0.6) * 0.018;
    var s = 1 - bob / 34; shadow.scale.set(s, s, 1); shadow.material.opacity = 0.92 - bob / 12;
    var lidGoal = (lidTarget === 0 && pull > 0.02) ? lidAngle : lidTarget;
    lidAngle += (lidGoal - lidAngle) * (reduce ? 1 : Math.min(1, dt * 5));
    if (stick.g) {
      var goal = (pullTarget && lidAngle < -1.2) ? 1 : 0;
      pull += (goal - pull) * (reduce ? 1 : Math.min(1, dt * 2.2));
      if (Math.abs(goal - pull) < 0.002) pull = goal;
      stick.out(pull > 0.001);
      var e1 = Math.min(1, pull / 0.55), e2 = Math.max(0, (pull - 0.55) / 0.45);
      e1 = e1 * e1 * (3 - 2 * e1); e2 = e2 * e2 * (3 - 2 * e2);
      stick.g.position.set(e2 * 3, stick.base + e1 * 60 + e2 * 3, stick.z);
      stick.g.rotation.set(e2 * 0.16, 0, -e2 * 0.28);
      pack.position.y -= pull * 46;                 // drop the pack so the whole cigarette stays in view
      shadow.position.y = -H / 2 - 13 - pull * 46;
    }
    hinge.rotation.x = lidAngle;
    if (!reduce) key.position.set(Math.cos(t * 0.55) * 230, 190 + Math.sin(t * 0.4) * 50, Math.sin(t * 0.55) * 170 + 150);
    renderer.render(scene, camera);
  }

  buildMats(function () {
    printed.forEach(function (p) { p.mesh.material = mats[p.face]; });
    renderer.setAnimationLoop(frame);
    cv.style.opacity = "1";
    stage.classList.add("live");
    if (hint) { say("idle"); hint.classList.add("on"); }
  });
})();

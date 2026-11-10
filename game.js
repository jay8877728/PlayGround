import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const $ = id => document.getElementById(id);
const sceneCanvas = $('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121a22);
scene.fog = new THREE.FogExp2(0x172129, 0.012);
const camera = new THREE.PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 180);
const renderer = new THREE.WebGLRenderer({ canvas: sceneCanvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const hemi = new THREE.HemisphereLight(0xb9c9d9, 0x20232b, 1.5); scene.add(hemi);
const moon = new THREE.DirectionalLight(0xd0dcff, 2.2); moon.position.set(-12, 24, 15); moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.left = -25; moon.shadow.camera.right = 25; moon.shadow.camera.top = 25; moon.shadow.camera.bottom = -25; scene.add(moon);
const pinkLight = new THREE.PointLight(0xf33782, 45, 28); pinkLight.position.set(6, 8, -8); scene.add(pinkLight);
const cyanLight = new THREE.PointLight(0x20c7e9, 35, 24); cyanLight.position.set(-10, 7, 3); scene.add(cyanLight);

const mat = (color, roughness = .72, metalness = .04, emissive = 0x000000) => new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: emissive ? 0.65 : 0 });
const mats = {
  asphalt: mat(0x20262b, .92), sidewalk: mat(0x41464a), concrete: mat(0x55595a), dark: mat(0x11161c, .86),
  glassBlue: new THREE.MeshStandardMaterial({ color: 0x182b38, metalness: .48, roughness: .3, emissive: 0x10202b, emissiveIntensity: .35 }),
  glassWarm: new THREE.MeshStandardMaterial({ color: 0x513a2b, metalness: .25, roughness: .36, emissive: 0xff8a36, emissiveIntensity: .24 }),
  neonPink: new THREE.MeshStandardMaterial({ color: 0xf83287, emissive: 0xf83287, emissiveIntensity: 2.2 }),
  neonCyan: new THREE.MeshStandardMaterial({ color: 0x3ce4f2, emissive: 0x3ce4f2, emissiveIntensity: 2.2 }),
  neonGold: new THREE.MeshStandardMaterial({ color: 0xf8c349, emissive: 0xffa52f, emissiveIntensity: 1.8 }),
  white: mat(0xcfd4d9), red: mat(0xa73536), green: mat(0x536d53),
};
function box(parent, size, position, material, cast = true, receive = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material); mesh.position.set(...position); mesh.castShadow = cast; mesh.receiveShadow = receive; parent.add(mesh); return mesh;
}
function cylinderBetween(parent, a, b, radius, material, radiusTop = radius) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), d = vb.clone().sub(va);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radius, d.length(), 9), material);
  mesh.position.copy(va.add(vb).multiplyScalar(.5)); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
}

// A rain-darkened street arena, inset between illuminated city blocks.
box(scene, [90, .55, 90], [0, -.55, 0], mats.asphalt, false);
box(scene, [17, .12, 19], [0, -.2, 0], mats.sidewalk, false);
box(scene, [13.8, .14, 15.8], [0, -.08, 0], mats.asphalt, false);
for (let i = -6; i <= 6; i += 1.5) {
  const dash = box(scene, [0.08, .015, .8], [i, .005, 0], mat(0x8e7560), false, false); dash.material.transparent = true; dash.material.opacity = .45;
}
// Puddles give the asphalt a glossy, reflective suggestion without expensive real-time reflections.
for (let i = 0; i < 13; i++) {
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(.35 + Math.random() * .85, 16), new THREE.MeshStandardMaterial({ color: 0x456273, roughness: .14, metalness: .55, transparent: true, opacity: .23 }));
  puddle.rotation.x = -Math.PI / 2; puddle.position.set((Math.random() - .5) * 14, .011, (Math.random() - .5) * 15); puddle.scale.y = .3; scene.add(puddle);
}
// Sidewalk curb and painted lane marks.
for (const x of [-8.4, 8.4]) box(scene, [.22, .22, 19], [x, -.06, 0], mats.concrete, false);
for (const z of [-8.5, 8.5]) box(scene, [17, .18, .22], [0, -.04, z], mats.concrete, false);
for (const side of [-1, 1]) {
  const x = side * 10.2;
  for (let i = 0; i < 4; i++) {
    const depth = 14 + Math.random() * 8, width = 4.2 + Math.random() * 3, height = 14 + Math.random() * 21;
    const z = (i - 1.5) * 8 + (Math.random() - .5) * 2;
    const building = new THREE.Group(); building.position.set(x + (Math.random() - .5) * 1.8, 0, z); scene.add(building);
    const shellMat = [mats.glassBlue, mats.dark, mat(0x30383d), mat(0x343338)][Math.floor(Math.random() * 4)];
    box(building, [width, height, depth], [0, height / 2 - .3, 0], shellMat, false);
    box(building, [width + .12, .5, depth + .12], [0, height - .35, 0], mat(0x151b20), false);
    for (let floor = 1; floor < height / 2.2; floor++) {
      const y = floor * 2.2;
      for (let col = -1; col <= 1; col++) {
        const windowMat = Math.random() < .23 ? (Math.random() > .5 ? mats.glassWarm : mats.neonCyan) : mats.glassBlue;
        box(building, [.07, .95, .82], [side * (width / 2 + .045), y, col * (depth / 3)], windowMat, false, false);
      }
    }
    if (i % 2 === 0) {
      const signMat = i % 4 === 0 ? mats.neonPink : mats.neonCyan;
      const sign = box(building, [.15, 2.4, 2.7], [side * (width / 2 + .12), 4.5, -depth * .24], signMat, false, false);
      sign.material = signMat;
      box(building, [.22, .08, 3.2], [side * (width / 2 + .12), 5.85, -depth * .24], mats.neonGold, false, false);
    }
  }
}
// Street lamps, barriers, bins and a corner shop dressing the playable block.
for (const x of [-8.1, 8.1]) for (const z of [-6.5, 6.5]) {
  cylinderBetween(scene, [x, 0, z], [x, 5.4, z], .075, mats.dark);
  box(scene, [.9, .12, .17], [x - Math.sign(x) * .35, 5.25, z], mats.neonGold, false, false);
  const lamp = new THREE.PointLight(0xffcb81, 24, 11); lamp.position.set(x - Math.sign(x) * .4, 4.9, z); scene.add(lamp);
}
for (let i = 0; i < 6; i++) {
  const z = -6 + i * 2.4;
  box(scene, [.08, .85, 1.5], [-7.55, .4, z], i % 2 ? mats.neonGold : mats.dark);
  box(scene, [.08, .85, 1.5], [7.55, .4, z], i % 2 ? mats.dark : mats.neonPink);
}
const shop = new THREE.Group(); shop.position.set(-7.3, 0, -7.1); scene.add(shop);
box(shop, [2.4, 2.7, 3.1], [0, 1.25, 0], mat(0x28363b));
box(shop, [2.45, .55, 3.2], [0, 2.65, 0], mats.neonPink, false, false);
box(shop, [2.5, .08, 3.3], [0, 2.29, 0], mats.neonCyan, false, false);
for (let x = -1; x <= 1; x += 2) box(shop, [.55, 1.3, .05], [x * .55, 1.1, 1.58], mats.glassWarm, false, false);

// Human fighter rigs made from articulated shapes; limb pivots drive combat and locomotion.
const skinTone = [0xc98d68, 0xd7a47c, 0x9a6249, 0xe0b28f];
const outfits = [
  { name: 'THE PHANTOM', style: 'COUNTER STRIKER', outfit: 'NIGHT OPS', coat: 0x202b34, accent: 0xd8ff3f, pants: 0x20252d, skin: 0xc98d68, hair: 0x171719 },
  { name: 'IRON SAINT', style: 'PRESSURE FIGHTER', outfit: 'REDLINE', coat: 0x692c30, accent: 0xf5c354, pants: 0x252326, skin: 0xd7a47c, hair: 0x1b1716 },
  { name: 'VOLT', style: 'KICKBOXER', outfit: 'CYBER TIGER', coat: 0x315556, accent: 0x32e6e1, pants: 0x222c31, skin: 0x9a6249, hair: 0x171719 },
  { name: 'MERCY', style: 'TECHNICAL GRAPPLER', outfit: 'GHOST WHITE', coat: 0x727d7b, accent: 0xf4f0dc, pants: 0x333a3e, skin: 0xe0b28f, hair: 0x333032 },
];
function makeFighter(config = outfits[0], team = 0, isBot = false) {
  const root = new THREE.Group(); scene.add(root);
  const rig = new THREE.Group(); root.add(rig);
  const shirt = mat(config.coat), pants = mat(config.pants), skin = mat(config.skin), hair = mat(config.hair), accent = mat(config.accent, .4, .15, config.accent);
  const bootMat = mat(0x13181c), gloveMat = team ? mat(0xa93c45) : accent;
  const torso = new THREE.Group(); torso.position.y = 1.24; rig.add(torso);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(.31, .39, .76, 12), shirt); chest.position.y = .02; chest.castShadow = true; torso.add(chest);
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(.29, .31, .25, 12), pants); waist.position.y = -.48; torso.add(waist);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .07, 12), accent); belt.position.y = -.37; torso.add(belt);
  const head = new THREE.Group(); head.position.set(0, .66, 0); torso.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(.235, 16, 12), skin); skull.scale.set(.84, 1.12, .9); skull.castShadow = true; head.add(skull);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(.241, 14, 8, 0, Math.PI * 2, 0, Math.PI * .59), hair); hairCap.position.y = .06; head.add(hairCap);
  const brow = new THREE.Mesh(new THREE.BoxGeometry(.36, .07, .16), hair); brow.position.set(0, .04, .19); head.add(brow);
  const face = new THREE.Mesh(new THREE.BoxGeometry(.19, .035, .024), mat(0xe4c3a9)); face.position.set(0, -.06, .211); head.add(face);
  if (config.name === 'THE PHANTOM' || config.name === 'MERCY') {
    const mask = new THREE.Mesh(new THREE.BoxGeometry(.32, .14, .055), accent); mask.position.set(0, -.08, .2); head.add(mask);
  }
  const shoulderPads = [];
  const arms = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group(); shoulder.position.set(side * .39, .44, 0); torso.add(shoulder); shoulderPads.push(shoulder);
    const upper = cylinderBetween(shoulder, [0, 0, 0], [side * .08, -.34, 0], .14, shirt, .125);
    const elbow = new THREE.Group(); elbow.position.set(side * .08, -.34, 0); shoulder.add(elbow);
    cylinderBetween(elbow, [0, 0, 0], [side * .015, -.31, .015], .105, skin, .085);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), gloveMat); glove.position.set(side * .015, -.4, .02); elbow.add(glove);
    const gloveBand = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .09, 10), accent); gloveBand.position.set(side * .015, -.3, .015); elbow.add(gloveBand);
    arms.push({ shoulder, elbow, side, upper });
  }
  const legs = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(side * .19, -.58, 0); torso.add(hip);
    cylinderBetween(hip, [0, 0, 0], [side * .015, -.43, 0], .17, pants, .135);
    const knee = new THREE.Group(); knee.position.set(side * .015, -.43, 0); hip.add(knee);
    cylinderBetween(knee, [0, 0, 0], [0, -.4, 0], .115, pants, .085);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(.22, .13, .36), bootMat); shoe.position.set(0, -.42, .08); knee.add(shoe);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(.225, .045, .12), accent); stripe.position.set(0, -.38, .2); knee.add(stripe);
    legs.push({ hip, knee, side });
  }
  // Hood/cape hints, shoulder straps, and bright piping make the silhouettes read clearly.
  const strap = new THREE.Mesh(new THREE.BoxGeometry(.08, .72, .04), accent); strap.position.set(.13, .05, .32); torso.add(strap);
  const numberPatch = new THREE.Mesh(new THREE.BoxGeometry(.18, .17, .025), team ? mats.neonPink : accent); numberPatch.position.set(-.19, .02, .32); torso.add(numberPatch);
  return { root, rig, torso, head, arms, legs, team, health: 100, stamina: 100, action: 'idle', actionUntil: 0, isBot, name: config.name, score: 0, hitFlash: 0 };
}
const player = makeFighter(outfits[0], 0);
player.root.position.set(-2.2, 0, 1.5);
let rivals = [];
let fighterIndex = 0;
let selectedMode = '1v1';
let inFight = false, training = false, matchStarted = false, waiting = false;
let socket = null, roomCode = '', myServerId = null, serverMode = null;
let fightStart = 0, lastStateSend = 0, lastTime = performance.now(), fpsTime = 0, frames = 0;
const keys = new Set();
let joystickVector = { x: 0, y: 0 }, joystickTouch = null;
let moveVector = { x: 0, y: 0 };

function fighterConfig(index) { return outfits[(index + outfits.length) % outfits.length]; }
function setFighter(index) {
  fighterIndex = (index + outfits.length) % outfits.length;
  const config = fighterConfig(fighterIndex); $('fighter-name').textContent = config.name; $('fighter-style').textContent = config.style; $('fighter-outfit').textContent = config.outfit;
  document.querySelectorAll('.fighter-dots span').forEach((el, i) => el.classList.toggle('selected', i === fighterIndex));
  // Keep the currently rendered rig in sync with the selected style.
  const old = player.root; const pos = old.position.clone(); const rot = old.rotation.y; scene.remove(old);
  const rebuilt = makeFighter(config, 0); rebuilt.root.position.copy(pos); rebuilt.root.rotation.y = rot;
  Object.assign(player, rebuilt);
}
function toast(message) { const el = $('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2400); }
function setConnection(text, online = false) { const el = $('connection-status'); el.querySelector('span:last-of-type').textContent = text; el.classList.toggle('online', online); el.querySelector('b').textContent = online ? 'LIVE' : '—'; }
function endpoint() {
  if (window.GAME_SERVER_URL) return window.GAME_SERVER_URL;
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.hostname || 'localhost'}:3001`;
}
function connect() {
  try { socket = new WebSocket(endpoint()); } catch { setConnection('OFFLINE · TRAINING AVAILABLE'); return; }
  socket.addEventListener('open', () => { setConnection('CITY NETWORK CONNECTED', true); socket.send(JSON.stringify({ type: 'profile', name: 'KAI_ROGUE' })); });
  socket.addEventListener('message', e => { try { handleMessage(JSON.parse(e.data)); } catch (err) { console.warn('Bad game message', err); } });
  socket.addEventListener('close', () => { if (!inFight) setConnection('OFFLINE · TRAINING AVAILABLE'); else toast('Connection lost.'); });
  socket.addEventListener('error', () => { if (!inFight) setConnection('NETWORK UNAVAILABLE · TRAINING READY'); });
}
function send(data) { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data)); }
function handleMessage(message) {
  if (message.type === 'welcome') myServerId = message.playerId;
  if (message.type === 'profile') { /* profile acknowledged */ }
  if (message.type === 'joined') {
    roomCode = message.roomCode; serverMode = message.mode; myServerId = message.playerId;
    $('lobby-status').textContent = `ROOM ${roomCode} · ${message.players.length}/${({ '1v1': 2, '2v2': 4, '5v5': 10 })[message.mode]} FIGHTERS`;
    updateRoster(message.players);
    if (waiting) { $('match-title').textContent = 'WAITING FOR FIGHTERS'; $('match-description').textContent = 'Your room is ready. More fighters are joining the city.'; }
  }
  if (message.type === 'room_created') {
    roomCode = message.roomCode; $('room-code').textContent = roomCode; $('room-code-wrap').classList.remove('hidden'); $('match-title').textContent = 'ROOM CREATED'; $('match-description').textContent = 'Share this code with your crew.'; $('lobby-status').textContent = 'Waiting for your crew to join…';
  }
  if (message.type === 'player_joined') {
    if (message.player?.id !== myServerId) ensureRemote(message.player);
    $('lobby-status').textContent = `ROOM ${roomCode} · ${message.count} FIGHTERS CONNECTED`;
  }
  if (message.type === 'player_left') { removeRemote(message.playerId); $('lobby-status').textContent = `ROOM ${roomCode} · ${message.count} FIGHTERS`; }
  if (message.type === 'match_start') {
    $('match-overlay').classList.add('hidden'); waiting = false; enterFight(false, true); fightStart = message.startAt || Date.now() + 3000;
    notifyFight('3'); setTimeout(() => notifyFight('2'), 1000); setTimeout(() => notifyFight('1'), 2000); setTimeout(() => { matchStarted = true; notifyFight('FIGHT!'); }, 3000);
  }
  if (message.type === 'state') {
    const remote = rivals.find(r => r.serverId === message.playerId); if (remote) { remote.targetX = message.x; remote.targetZ = message.z; remote.action = message.action || 'idle'; remote.stamina = message.stamina ?? remote.stamina; }
  }
  if (message.type === 'hit') {
    const target = message.targetId === myServerId ? player : rivals.find(r => r.serverId === message.targetId);
    if (target) { target.health = message.health; target.stamina = message.stamina ?? target.stamina; target.hitFlash = .35; }
    const attacker = rivals.find(r => r.serverId === message.attackerId);
    if (attacker) { attacker.action = message.kind; attacker.actionUntil = performance.now() + 350; }
    if (message.attackerId === myServerId) { player.score = message.score; toast(message.blocked ? 'BLOCKED · ' + message.damage + ' DAMAGE' : `CLEAN HIT · ${message.damage} DAMAGE`); }
    updateFightHud();
  }
  if (message.type === 'hit_result' && !message.hit && message.reason === 'stamina') toast('Too exhausted — recover your stamina.');
  if (message.type === 'round_end') { matchStarted = false; notifyFight(message.winner === (rivals[0]?.team) ? 'DEFEAT' : 'VICTORY'); setTimeout(() => leaveFight(), 2600); }
  if (message.type === 'error') { toast(message.message || 'Network error'); $('lobby-status').textContent = message.message || 'Network error'; }
}
function ensureRemote(data) {
  if (!data || data.id === myServerId || rivals.some(r => r.serverId === data.id)) return;
  const config = outfits[(rivals.length + 1) % outfits.length];
  const fighter = makeFighter({ ...config, name: data.name || config.name }, data.team || 1);
  fighter.serverId = data.id; fighter.team = data.team; fighter.targetX = data.x ?? 4; fighter.targetZ = data.z ?? 0; fighter.root.position.set(fighter.targetX, 0, fighter.targetZ); fighter.root.rotation.y = Math.PI;
  rivals.push(fighter);
}
function removeRemote(id) { const idx = rivals.findIndex(r => r.serverId === id); if (idx >= 0) { scene.remove(rivals[idx].root); rivals.splice(idx, 1); } }
function updateRoster(players = []) {
  players.forEach(p => { if (p.id !== myServerId) ensureRemote(p); else { player.team = p.team; player.root.position.set(p.x, 0, p.z); } });
}
function setMode(mode) {
  selectedMode = mode; document.querySelectorAll('.mode-card').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  $('queue-mode').textContent = mode === '1v1' ? '1V1 DUEL' : mode === '2v2' ? '2V2 TAG TEAM' : '5V5 STREET WAR';
}
function queueMatch() {
  if (socket?.readyState !== WebSocket.OPEN) { openTraining(true); toast('Network unavailable — launching local training.'); return; }
  waiting = true; $('match-overlay').classList.remove('hidden'); $('room-code-wrap').classList.add('hidden'); $('join-room-wrap').classList.add('hidden'); $('match-title').textContent = 'FINDING A MATCH'; $('match-description').textContent = 'Searching the city for fighters…'; $('lobby-status').textContent = 'Connecting to the underground circuit'; send({ type: 'matchmake', mode: selectedMode });
}
function showPrivate() {
  $('match-overlay').classList.remove('hidden'); $('room-code-wrap').classList.add('hidden'); $('join-room-wrap').classList.remove('hidden'); $('room-input').value = ''; $('match-title').textContent = 'PRIVATE ROOM'; $('match-description').textContent = 'Create a room for your crew, or enter a code to join.'; $('lobby-status').textContent = 'Room size follows the selected mode.'; waiting = true;
}
function enterFight(isTraining = false, isOnline = false) {
  inFight = true; training = isTraining; matchStarted = isTraining; $('fight-ui').classList.remove('hidden'); $('match-overlay').classList.add('hidden'); $('training-modal').classList.add('hidden');
  $('round-mode').textContent = isTraining ? 'TRAINING SESSION' : `${(serverMode || selectedMode).toUpperCase()} · RANKED`; $('room-label').textContent = roomCode ? `ROOM ${roomCode}` : 'NEON DISTRICT';
  player.health = 100; player.stamina = 100; player.score = 0; player.team = isOnline ? player.team : 0;
  player.root.position.set(isOnline && player.team === 1 ? 2.2 : -2.2, 0, 1.5);
  if (isTraining) {
    rivals.forEach(r => scene.remove(r.root)); rivals = [];
    const amount = selectedMode === '5v5' ? 3 : selectedMode === '2v2' ? 2 : 1;
    for (let i = 0; i < amount; i++) { const bot = makeFighter(outfits[(i + 1) % outfits.length], 1, true); bot.root.position.set(2.4 + (i % 2) * 2, 0, (i - 1) * 2.3); bot.root.rotation.y = Math.PI; bot.targetX = bot.root.position.x; bot.targetZ = bot.root.position.z; rivals.push(bot); }
    notifyFight('FIGHT!');
  } else {
    // Keep the server roster created by the `joined` message; never substitute a local bot in online play.
    notifyFight('GET READY');
  }
  fightStart = Date.now(); updateFightHud();
}
function openTraining(fromQueue = false) { $('training-modal').classList.remove('hidden'); if (fromQueue) $('training-modal').dataset.fromQueue = '1'; }
function startTraining() { enterFight(true); }
function leaveFight() {
  inFight = false; training = false; matchStarted = false; $('fight-ui').classList.add('hidden'); $('training-modal').classList.add('hidden'); $('match-overlay').classList.add('hidden');
  send({ type: 'leave_room' }); waiting = false; roomCode = ''; serverMode = null; rivals.forEach(r => scene.remove(r.root)); rivals = []; player.root.position.set(-2.2, 0, 1.5); player.health = 100; player.stamina = 100;
}
function notifyFight(text) { const el = $('fight-notice'); el.textContent = text; el.classList.add('show'); clearTimeout(notifyFight.timer); notifyFight.timer = setTimeout(() => el.classList.remove('show'), 800); }
function updateFightHud() {
  const enemy = rivals[0]; $('you-health').style.width = `${player.health}%`; $('you-health-text').textContent = Math.ceil(player.health);
  $('you-stamina').style.width = `${player.stamina}%`;
  $('enemy-health').style.width = `${enemy?.health ?? 100}%`; $('enemy-health-text').textContent = Math.ceil(enemy?.health ?? 100); $('enemy-stamina').style.width = `${enemy?.stamina ?? 100}%`;
}
function action(actionName) {
  if (!inFight || !matchStarted) return;
  if (actionName === 'block' || actionName === 'dodge') {
    player.action = actionName; player.actionUntil = performance.now() + (actionName === 'block' ? 480 : 380);
    if (actionName === 'dodge') { player.stamina = Math.max(0, player.stamina - 12); player.root.position.x += player.team ? -.85 : .85; }
    if (training) setTimeout(() => { if (player.action === actionName) player.action = 'idle'; }, 480);
    return;
  }
  if (actionName !== 'punch' && actionName !== 'kick') return;
  const cost = actionName === 'kick' ? 18 : 10;
  if (player.stamina < cost) { toast('Too exhausted — recover your stamina.'); return; }
  player.stamina -= cost; player.action = actionName; player.actionUntil = performance.now() + (actionName === 'kick' ? 500 : 340);
  if (!training) send({ type: 'attack', kind: actionName });
  else {
    const enemy = rivals.find(r => r.health > 0 && Math.hypot(r.root.position.x - player.root.position.x, r.root.position.z - player.root.position.z) < (actionName === 'kick' ? 2.7 : 2));
    if (enemy) { const blocked = enemy.action === 'block'; enemy.health = Math.max(0, enemy.health - (blocked ? 4 : actionName === 'kick' ? 16 : 9)); enemy.hitFlash = .35; if (!enemy.health) player.score += 1; toast(blocked ? 'BLOCKED' : 'CLEAN HIT'); updateFightHud(); }
  }
}
function moveInput() {
  let x = joystickVector.x, y = joystickVector.y;
  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  if (keys.has('w') || keys.has('arrowup')) y -= 1;
  if (keys.has('s') || keys.has('arrowdown')) y += 1;
  const len = Math.hypot(x, y); return len > 1 ? { x: x / len, y: y / len } : { x, y };
}
function updateFighter(f, dt, now, movement = { x: 0, y: 0 }) {
  const moving = Math.hypot(movement.x, movement.y) > .08;
  if (f.actionUntil < now && !['idle', 'run', 'jump'].includes(f.action)) f.action = 'idle';
  if (f.action === 'idle' || f.action === 'run') f.action = moving ? 'run' : 'idle';
  const t = now * .001;
  const gait = moving ? Math.sin(t * 11) : 0;
  f.torso.rotation.z = moving ? Math.sin(t * 11) * .045 : Math.sin(t * 2.2) * .015;
  f.torso.position.y = 1.24 + (moving ? Math.abs(Math.sin(t * 11)) * .035 : Math.sin(t * 2.1) * .018);
  f.head.rotation.y = Math.sin(t * 1.2) * .035;
  for (const leg of f.legs) { leg.hip.rotation.x = gait * .44 * leg.side; leg.knee.rotation.x = Math.max(0, gait * leg.side) * -.5; }
  for (const arm of f.arms) { arm.shoulder.rotation.x = moving ? -gait * .3 * arm.side : 0; arm.shoulder.rotation.z = -arm.side * .13; arm.elbow.rotation.x = 0; }
  if (f.action === 'block') { for (const arm of f.arms) { arm.shoulder.rotation.x = -1.12; arm.shoulder.rotation.z = -arm.side * .36; arm.elbow.rotation.x = -1.15; } }
  if (f.action === 'punch') { const arm = f.arms[f.actionSide || 1]; arm.shoulder.rotation.x = -1.22; arm.elbow.rotation.x = -.35; arm.shoulder.rotation.z = -arm.side * .08; }
  if (f.action === 'kick') { const leg = f.legs[f.actionSide || 1]; leg.hip.rotation.x = -1.15; leg.knee.rotation.x = -.18; f.torso.rotation.z = -.1; }
  if (f.action === 'dodge') { f.torso.rotation.z = .32; f.torso.rotation.x = -.3; }
  if (f.hitFlash > 0) { f.hitFlash -= dt; f.torso.rotation.z += Math.sin(t * 70) * f.hitFlash * .08; }
  if (f.action === 'jump') f.root.position.y = Math.max(0, f.root.position.y - dt * 2.8);
  else f.root.position.y = THREE.MathUtils.damp(f.root.position.y, 0, 9, dt);
  if (!f.isBot && f !== player && f.targetX != null) {
    f.root.position.x = THREE.MathUtils.damp(f.root.position.x, f.targetX, 8, dt);
    f.root.position.z = THREE.MathUtils.damp(f.root.position.z, f.targetZ, 8, dt);
  }
}
function botUpdate(bot, dt, now) {
  if (!inFight || !training || bot.health <= 0) return;
  const dx = player.root.position.x - bot.root.position.x, dz = player.root.position.z - bot.root.position.z, d = Math.hypot(dx, dz);
  bot.root.rotation.y = Math.atan2(dx, dz);
  if (d > 1.65) { bot.root.position.x += dx / Math.max(d, .01) * dt * .9; bot.root.position.z += dz / Math.max(d, .01) * dt * .9; bot.action = 'run'; }
  else if (now > (bot.nextAttack || 0)) { bot.action = Math.random() > .72 ? 'kick' : 'punch'; bot.actionUntil = now + 380; bot.nextAttack = now + 1700 + Math.random() * 1200; if (player.action !== 'block' && player.action !== 'dodge') { player.health = Math.max(0, player.health - (bot.action === 'kick' ? 8 : 5)); player.hitFlash = .3; updateFightHud(); } }
}
function update(dt, now) {
  const input = inFight ? moveInput() : { x: 0, y: 0 };
  moveVector = input;
  if (inFight && matchStarted) {
    const speed = keys.has('shift') ? 5.1 : 3.45;
    const oldX = player.root.position.x, oldZ = player.root.position.z;
    player.root.position.x = THREE.MathUtils.clamp(player.root.position.x + input.x * speed * dt, -6.6, 6.6);
    player.root.position.z = THREE.MathUtils.clamp(player.root.position.z + input.y * speed * dt, -7.2, 7.2);
    player.root.rotation.y = Math.atan2(input.x || (rivals[0] ? rivals[0].root.position.x - player.root.position.x : 1), input.y || 0);
    if (!input.x && !input.y && rivals.length) player.root.rotation.y = Math.atan2(rivals[0].root.position.x - player.root.position.x, rivals[0].root.position.z - player.root.position.z);
    if (training) player.stamina = Math.min(100, player.stamina + dt * 12);
    if (socket?.readyState === WebSocket.OPEN && now - lastStateSend > 60) {
      lastStateSend = now; send({ type: 'state', x: player.root.position.x, z: player.root.position.z, facing: Math.sign(Math.sin(player.root.rotation.y)) || 1, stamina: player.stamina, action: player.action });
    }
    if (training) rivals.forEach(r => botUpdate(r, dt, now));
    if (now - fightStart > 1000 && now % 500 < 20) {
      const secs = Math.max(0, 180 - Math.floor((now - fightStart) / 1000)); $('fight-timer').textContent = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    }
    if (player.health <= 0 && training) { notifyFight('DEFEAT'); setTimeout(leaveFight, 2000); }
    if (rivals.length && rivals.every(r => r.health <= 0) && training) { notifyFight('VICTORY'); setTimeout(leaveFight, 2000); }
    if (Math.abs(player.root.position.x - oldX) + Math.abs(player.root.position.z - oldZ) > .001) player.action = ['punch', 'kick', 'block', 'dodge'].includes(player.action) && player.actionUntil > now ? player.action : 'run';
  }
  updateFighter(player, dt, now, inFight ? input : { x: 0, y: 0 });
  rivals.forEach(r => updateFighter(r, dt, now, r.isBot && training ? { x: .3, y: 0 } : { x: 0, y: 0 }));
  if (inFight) {
    const target = new THREE.Vector3(player.root.position.x * .25, 1.55, player.root.position.z + 1.2);
    const behind = new THREE.Vector3(player.root.position.x - Math.sin(player.root.rotation.y) * 8.5, 4.7, player.root.position.z - Math.cos(player.root.rotation.y) * 8.5);
    camera.position.lerp(behind, 1 - Math.exp(-dt * 2.8)); camera.lookAt(target);
  } else {
    const time = now * .00012; camera.position.lerp(new THREE.Vector3(Math.sin(time) * .8, 4.4, 19), .015); camera.lookAt(0, 2.3, 0);
    player.root.rotation.y = Math.sin(now * .00025) * .09;
  }
}
function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, .045); lastTime = now;
  update(dt, now);
  renderer.render(scene, camera);
  frames++; if (now - fpsTime > 1200) { fpsTime = now; frames = 0; }
}

// UI wiring
$('mode-list').addEventListener('click', e => { const button = e.target.closest('[data-mode]'); if (button) setMode(button.dataset.mode); });
$('play-button').addEventListener('click', queueMatch);
$('private-button').addEventListener('click', showPrivate);
$('join-room').addEventListener('click', () => { const code = $('room-input').value.trim().toUpperCase(); if (code.length !== 6) return toast('Enter a 6-character room code.'); if (socket?.readyState !== WebSocket.OPEN) return toast('City network is unavailable.'); $('lobby-status').textContent = 'Joining room…'; $('room-code-wrap').classList.add('hidden'); send({ type: 'join_room', roomCode: code }); });
$('room-input').addEventListener('input', e => e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
$('copy-code').addEventListener('click', async () => { try { await navigator.clipboard.writeText(roomCode); toast('Room code copied.'); } catch { toast(`ROOM CODE: ${roomCode}`); } });
$('close-match').addEventListener('click', () => { $('match-overlay').classList.add('hidden'); waiting = false; send({ type: 'leave_room' }); roomCode = ''; });
$('training-button').addEventListener('click', () => openTraining());
$('start-training').addEventListener('click', startTraining);
$('close-training').addEventListener('click', () => $('training-modal').classList.add('hidden'));
$('fighter-prev').addEventListener('click', () => setFighter(fighterIndex - 1)); $('fighter-next').addEventListener('click', () => setFighter(fighterIndex + 1)); $('fighter-cycle').addEventListener('click', () => setFighter(fighterIndex + 1));
$('leave-fight').addEventListener('click', leaveFight);
$('sound-toggle').addEventListener('click', () => toast('Atmosphere audio coming soon.'));
$('leaderboard-button').addEventListener('click', () => toast('Global rankings will be available when accounts are enabled.'));
document.querySelectorAll('.fight-btn').forEach(button => {
  const begin = e => { e.preventDefault(); button.classList.add('pressed'); action(button.dataset.action); };
  const end = () => { button.classList.remove('pressed'); if (button.dataset.action === 'block' && player.action === 'block') player.action = 'idle'; };
  button.addEventListener('pointerdown', begin); button.addEventListener('pointerup', end); button.addEventListener('pointercancel', end); button.addEventListener('pointerleave', end);
});
window.addEventListener('keydown', e => { const key = e.key.toLowerCase(); keys.add(key); if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault(); if (e.repeat) return; if (key === 'j') action('punch'); if (key === 'k') action('kick'); if (key === 'l') { player.action = 'block'; player.actionUntil = performance.now() + 800; } if (key === ' ') action('dodge'); if (key === 'i') player.action = 'jump'; });
window.addEventListener('keyup', e => { const key = e.key.toLowerCase(); keys.delete(key); if (key === 'l' && player.action === 'block') player.action = 'idle'; });
const joystick = $('joystick'), knob = $('joy-knob');
function joyMove(e) { if (joystickTouch !== e.pointerId) return; const rect = joystick.getBoundingClientRect(); let dx = e.clientX - (rect.left + rect.width / 2), dy = e.clientY - (rect.top + rect.height / 2); const radius = rect.width * .35, d = Math.hypot(dx, dy); if (d > radius) { dx *= radius / d; dy *= radius / d; } joystickVector = { x: dx / radius, y: dy / radius }; knob.style.transform = `translate(${dx}px,${dy}px)`; }
joystick.addEventListener('pointerdown', e => { joystickTouch = e.pointerId; joystick.setPointerCapture(e.pointerId); joyMove(e); });
joystick.addEventListener('pointermove', joyMove); joystick.addEventListener('pointerup', () => { joystickTouch = null; joystickVector = { x: 0, y: 0 }; knob.style.transform = ''; }); joystick.addEventListener('pointercancel', () => { joystickTouch = null; joystickVector = { x: 0, y: 0 }; knob.style.transform = ''; });
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65)); renderer.setSize(innerWidth, innerHeight); });

setFighter(0); setMode('1v1'); connect(); animate();

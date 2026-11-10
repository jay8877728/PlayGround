import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { randomBytes } from 'node:crypto';

const PORT = Number(process.env.GAME_PORT || 3001);
const MODES = { '1v1': 2, '2v2': 4, '5v5': 10 };
const rooms = new Map();
const queue = new Map(Object.keys(MODES).map(mode => [mode, []]));
const clients = new Map();
const server = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, players: clients.size, rooms: rooms.size }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('City Brawl multiplayer server');
});
const wss = new WebSocketServer({ server });

const send = (client, type, data = {}) => {
  if (client.readyState === 1) client.send(JSON.stringify({ type, ...data }));
};
const broadcast = (room, type, data = {}, except = null) => {
  for (const player of room.players.values()) if (player !== except) send(player.socket, type, data);
};
const roomCode = () => randomBytes(3).toString('hex').toUpperCase();
const createRoom = (mode, privateRoom = false) => {
  const code = roomCode();
  const room = { code, mode, capacity: MODES[mode], private: privateRoom, players: new Map(), started: false, createdAt: Date.now() };
  rooms.set(code, room);
  return room;
};
const leaveRoom = client => {
  if (!client.room) return;
  const room = client.room;
  room.players.delete(client.id);
  client.room = null;
  broadcast(room, 'player_left', { playerId: client.id, count: room.players.size });
  if (!room.players.size) rooms.delete(room.code);
  else if (room.started) checkRound(room);
};
const checkRound = room => {
  const alive = [...room.players.values()].filter(p => p.health > 0);
  const teams = new Set(alive.map(p => p.team));
  if (room.started && teams.size <= 1) {
    const winner = teams.size ? [...teams][0] : null;
    room.started = false;
    broadcast(room, 'round_end', { winner, standings: [...room.players.values()].map(({ id, name, team, health, score }) => ({ id, name, team, health, score })) });
  }
};
const joinRoom = (client, room, team = null) => {
  if (client.room) leaveRoom(client);
  if (room.players.size >= room.capacity) return send(client.socket, 'error', { message: 'Room is full' });
  const id = client.id;
  const teamCounts = [0, 0];
  for (const member of room.players.values()) teamCounts[member.team] += 1;
  const assignedTeam = team ?? (teamCounts[0] <= teamCounts[1] ? 0 : 1);
  const player = { id, name: client.name, team: assignedTeam, health: 100, stamina: 100, score: 0, x: assignedTeam ? 4 : -4, z: 0, facing: assignedTeam ? -1 : 1, socket: client.socket, lastStateAt: Date.now(), nextAttackAt: 0 };
  room.players.set(id, player);
  client.room = room;
  send(client.socket, 'joined', { roomCode: room.code, mode: room.mode, playerId: id, team: assignedTeam, players: [...room.players.values()].map(({ id, name, team, health, stamina, score, x, z }) => ({ id, name, team, health, stamina, score, x, z })) });
  broadcast(room, 'player_joined', { player: { id, name: player.name, team: player.team, health: player.health, x: player.x, z: player.z }, count: room.players.size }, client.socket);
  if (room.players.size === room.capacity) {
    room.started = true;
    room.startAt = Date.now() + 3000;
    broadcast(room, 'match_start', { mode: room.mode, countdown: 3, startAt: room.startAt });
  }
};

wss.on('connection', socket => {
  const client = { id: randomBytes(8).toString('hex'), name: 'Fighter', room: null, socket };
  clients.set(client.id, client);
  send(socket, 'welcome', { playerId: client.id, modes: Object.keys(MODES) });
  socket.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return send(socket, 'error', { message: 'Invalid message' }); }
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'profile') {
      client.name = String(msg.name || 'Fighter').slice(0, 18);
      return send(socket, 'profile', { name: client.name });
    }
    if (msg.type === 'matchmake') {
      const mode = MODES[msg.mode] ? msg.mode : '1v1';
      leaveRoom(client);
      let room = [...rooms.values()].find(r => !r.private && !r.started && r.mode === mode && r.players.size < r.capacity);
      if (!room) room = createRoom(mode);
      return joinRoom(client, room);
    }
    if (msg.type === 'create_room') {
      const mode = MODES[msg.mode] ? msg.mode : '1v1';
      const room = createRoom(mode, true);
      joinRoom(client, room);
      return send(socket, 'room_created', { roomCode: room.code, mode });
    }
    if (msg.type === 'join_room') {
      const code = String(msg.roomCode || '').toUpperCase();
      const room = rooms.get(code);
      if (!room || !room.private) return send(socket, 'error', { message: 'Room not found' });
      return joinRoom(client, room);
    }
    if (msg.type === 'leave_room') return leaveRoom(client);
    if (!client.room) return send(socket, 'error', { message: 'Join a room first' });
    const room = client.room;
    const player = room.players.get(client.id);
    if (!player) return;
    if (msg.type === 'state') {
      if (Date.now() - player.lastStateAt < 25) return;
      player.lastStateAt = Date.now();
      player.x = clamp(msg.x, -24, 24);
      player.z = clamp(msg.z, -24, 24);
      player.facing = Math.sign(Number(msg.facing)) || player.facing;
      player.stamina = clamp(msg.stamina, 0, 100);
      player.action = ['idle', 'punch', 'kick', 'block', 'dodge', 'jump', 'run'].includes(msg.action) ? msg.action : 'idle';
      broadcast(room, 'state', { playerId: player.id, x: player.x, z: player.z, facing: player.facing, stamina: player.stamina, action: player.action }, client.socket);
    }
    if (msg.type === 'attack') {
      if (!room.started || Date.now() < (room.startAt || 0) || player.health <= 0) return;
      const kind = msg.kind === 'kick' ? 'kick' : 'punch';
      if (Date.now() < player.nextAttackAt) return;
      player.nextAttackAt = Date.now() + (kind === 'kick' ? 650 : 400);
      if (player.stamina < (kind === 'kick' ? 18 : 10)) return send(socket, 'hit_result', { hit: false, kind, reason: 'stamina' });
      player.stamina -= kind === 'kick' ? 18 : 10;
      const range = kind === 'kick' ? 2.4 : 1.65;
      const damage = kind === 'kick' ? 16 : 9;
      const target = [...room.players.values()].find(p => p.team !== player.team && p.health > 0 && Math.hypot(p.x - player.x, p.z - player.z) < range + 0.45 && (p.x - player.x) * player.facing > -0.5);
      if (!target) return send(socket, 'hit_result', { hit: false, kind });
      const defending = target.action === 'block';
      target.health = Math.max(0, target.health - (defending ? Math.ceil(damage * 0.25) : damage));
      if (!defending) target.stamina = Math.max(0, target.stamina - 8);
      if (target.health === 0) player.score += 1;
      broadcast(room, 'hit', { attackerId: player.id, targetId: target.id, kind, damage: defending ? Math.ceil(damage * 0.25) : damage, health: target.health, stamina: target.stamina, blocked: defending, score: player.score });
      checkRound(room);
    }
    if (msg.type === 'emote') broadcast(room, 'emote', { playerId: client.id, emote: String(msg.emote || '').slice(0, 20) }, socket);
  });
  socket.on('close', () => { leaveRoom(client); clients.delete(client.id); });
  socket.on('error', () => { leaveRoom(client); clients.delete(client.id); });
});
function clamp(value, min, max) { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min; }
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) if (!room.players.size || (room.private && !room.players.size && now - room.createdAt > 60000)) rooms.delete(code);
}, 30000).unref();
server.listen(PORT, '0.0.0.0', () => console.log(`City Brawl server listening on :${PORT}`));

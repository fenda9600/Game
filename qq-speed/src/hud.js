import { formatTime } from './util.js';

const $ = (id) => document.getElementById(id);

export const ITEM_INFO = {
  nitro: { icon: '🔥', name: '氮气' },
  missile: { icon: '🚀', name: '导弹' },
  banana: { icon: '🍌', name: '香蕉皮' },
  shield: { icon: '😇', name: '天使' },
  magnet: { icon: '🧲', name: '磁铁' },
};

export class HUD {
  constructor() {
    this.el = $('hud');
    this.rank = $('rank');
    this.lap = $('lap');
    this.time = $('time');
    this.best = $('best');
    this.spd = $('spd');
    this.rk = $('rk');
    this.rkof = $('rkof');
    this.gaugeFill = $('gaugefill');
    this.gauge = $('gauge');
    this.n2o = [$('n2o0'), $('n2o1')];
    this.msgs = $('msgs');
    this.cd = $('countdown');
    this.warnEl = $('warn');
    this.finalEl = $('finalcount');
    this.vig = $('vignette');
    this.hit = $('hitflash');
    this.items = $('items');
    this.slots = [$('slot0'), $('slot1')];
    this.keys = $('keys');
    this.songtip = $('songtip');
    this.mm = $('mm');
    this.mmx = this.mm.getContext('2d');
    this.sp = $('sp');
    this.spx = this.sp.getContext('2d');
    this.fx = $('fx');
    this.fxx = this.fx.getContext('2d');
    this.cueEl = $('techcue');
    this.cueKey = this.cueEl.querySelector('.k');
    this.cueTxt = this.cueEl.querySelector('.t');
    this.cueBar = this.cueEl.querySelector('.bar i');
    this.comboEl = $('combo');
    this.comboT = 0;
    this.touch = false;
    this.lines = [];
    this.cache = {};
    this.resizeFx();
    window.addEventListener('resize', () => this.resizeFx());
  }

  resizeFx() {
    const r = Math.min(window.devicePixelRatio || 1, 1.5);
    this.fx.width = Math.floor(window.innerWidth * r);
    this.fx.height = Math.floor(window.innerHeight * r);
  }

  show(v) { this.el.classList.toggle('hidden', !v); if (!v) this.clearFx(); }

  set(key, el, val, prop = 'textContent') {
    if (this.cache[key] === val) return;
    this.cache[key] = val;
    el[prop] = val;
  }

  setItemMode(on) {
    this.items.classList.toggle('hidden', !on);
    $('gaugebox').classList.toggle('hidden', on);
    this.cache = {};
  }

  setupMinimap(track) {
    const W = this.mm.width, pad = 26;
    const b = track.bounds;
    const sc = (W - pad * 2) / Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    // 俯视时世界 +x 在车手左侧（右手系），所以屏幕 x 取 -x，小地图才不会左右镜像
    this.mmT = (x, z) => [W / 2 - (x - b.cx) * sc, W / 2 - (z - b.cz) * sc];
    const off = document.createElement('canvas');
    off.width = off.height = W;
    const g = off.getContext('2d');
    const path = () => {
      g.beginPath();
      for (let i = 0; i <= track.N; i += 2) {
        const k = i % track.N;
        const [x, y] = this.mmT(track.px[k], track.pz[k]);
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
    };
    g.lineJoin = 'round';
    g.strokeStyle = 'rgba(4,2,20,.6)';
    g.lineWidth = 18;
    path();
    g.stroke();
    // 霓虹线路
    g.shadowColor = '#27f0ff';
    g.shadowBlur = 14;
    g.strokeStyle = 'rgba(39,240,255,.85)';
    g.lineWidth = 10;
    path();
    g.stroke();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(235,253,255,.95)';
    g.lineWidth = 4;
    path();
    g.stroke();
    // 高架段着色
    g.strokeStyle = 'rgba(255,61,240,.95)';
    g.lineWidth = 5;
    for (let i = 0; i < track.N; i++) {
      if (!track.bridge[i]) continue;
      const [x1, y1] = this.mmT(track.px[i], track.pz[i]);
      const j = (i + 1) % track.N;
      const [x2, y2] = this.mmT(track.px[j], track.pz[j]);
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
    const s = track.sample(0, {});
    const [sx, sy] = this.mmT(s.x, s.z);
    g.save();
    g.translate(sx, sy);
    g.rotate(Math.PI / 2 - s.hd);
    g.fillStyle = '#111';
    g.fillRect(-3, -12, 6, 24);
    g.fillStyle = '#fff';
    for (let k = 0; k < 4; k++) g.fillRect(k % 2 ? 0 : -3, -12 + k * 6, 3, 6);
    g.restore();
    this.mmBase = off;
  }

  drawMinimap(racers, player) {
    const g = this.mmx, W = this.mm.width;
    g.clearRect(0, 0, W, W);
    if (this.mmBase) g.drawImage(this.mmBase, 0, 0);
    for (const r of racers) {
      if (r === player) continue;
      const [x, y] = this.mmT(r.x, r.z);
      g.fillStyle = '#' + r.model.userData.skin.body.toString(16).padStart(6, '0');
      g.strokeStyle = '#fff';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x, y, 8, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    const [x, y] = this.mmT(player.x, player.z);
    g.save();
    g.translate(x, y);
    g.rotate(Math.PI - player.h);
    g.fillStyle = '#ffd23a';
    g.strokeStyle = '#000';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 16);
    g.lineTo(11, -11);
    g.lineTo(0, -5);
    g.lineTo(-11, -11);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  }

  drawSpeedo(kmh, boost) {
    const g = this.spx, W = this.sp.width, c = W / 2, R = W * 0.4;
    g.clearRect(0, 0, W, W);
    const a0 = Math.PI * 0.75, sweep = Math.PI * 1.5, maxK = 300;
    g.lineCap = 'round';
    g.lineWidth = 26;
    g.strokeStyle = 'rgba(12,8,40,.75)';
    g.beginPath();
    g.arc(c, c, R, a0, a0 + sweep);
    g.stroke();
    // 赛博仪表：外圈青色细环 + 分段刻度
    g.lineCap = 'butt';
    g.lineWidth = 2;
    g.strokeStyle = 'rgba(39,240,255,.5)';
    g.beginPath();
    g.arc(c, c, R + 20, a0, a0 + sweep);
    g.stroke();
    g.lineWidth = 6;
    g.strokeStyle = 'rgba(255,61,240,.35)';
    for (let k = 0; k < 30; k++) {
      const a = a0 + (sweep * k) / 30;
      g.beginPath();
      g.arc(c, c, R + 27, a, a + sweep / 30 - 0.03);
      g.stroke();
    }
    g.lineCap = 'round';
    const f = Math.min(1, kmh / maxK);
    const grd = g.createLinearGradient(0, W, W, 0);
    if (boost) { grd.addColorStop(0, '#27f0ff'); grd.addColorStop(1, '#ffffff'); }
    else { grd.addColorStop(0, '#27f0ff'); grd.addColorStop(0.55, '#8a5cff'); grd.addColorStop(1, '#ff3df0'); }
    g.strokeStyle = grd;
    g.lineWidth = 18;
    g.shadowColor = boost ? '#27f0ff' : '#ff3df0';
    g.shadowBlur = 18;
    g.beginPath();
    g.arc(c, c, R, a0, a0 + sweep * f);
    g.stroke();
    g.shadowBlur = 0;
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(255,255,255,.7)';
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.font = 'italic 900 20px Arial Black, Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let k = 0; k <= 10; k++) {
      const a = a0 + (sweep * k) / 10;
      const r1 = R - 26, r2 = R - (k % 2 ? 34 : 42);
      g.beginPath();
      g.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      g.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
      g.stroke();
      if (k % 2 === 0) g.fillText(String(k * 30), c + Math.cos(a) * (R - 62), c + Math.sin(a) * (R - 62));
    }
  }

  update(st) {
    this.set('lap', this.lap, st.lap);
    this.set('time', this.time, formatTime(st.time));
    this.set('best', this.best, '最佳单圈 ' + formatTime(st.best));
    this.set('spd', this.spd, String(Math.round(st.kmh)));
    this.set('rk', this.rk, String(st.rank));
    this.set('rkof', this.rkof, '/' + st.total);
    const gw = Math.round(st.gauge * 100);
    this.set('gauge', this.gaugeFill.style, gw + '%', 'width');
    this.gauge.classList.toggle('full', st.gauge >= 0.999);
    for (let k = 0; k < 2; k++) this.n2o[k].classList.toggle('on', st.nitro > k);
    const rows = st.standings.map((r, i) => `<div class="row${r.me ? ' me' : ''}${r.fin ? ' fin' : ''}"><span class="p">${i + 1}</span><span class="dot" style="background:${r.color}"></span><span class="n">${r.name}</span></div>`).join('');
    this.set('rows', this.rank, rows, 'innerHTML');
    if (st.items) {
      for (let k = 0; k < 2; k++) {
        const it = st.items[k];
        const html = it ? `${ITEM_INFO[it].icon}<small>${ITEM_INFO[it].name}</small>` : '';
        this.set('slot' + k, this.slots[k], html, 'innerHTML');
      }
    }
    this.vig.style.opacity = st.nitroOn ? 1 : st.smallOn ? 0.8 : 0;
    this.vig.classList.toggle('small', !st.nitroOn && st.smallOn);
  }

  // 技巧窗口提示：蓝=可小喷，金=可双喷，紫=可接氮气（颜色与车尾火花一致）
  cue(tech, k = 0, perfect = false) {
    const show = tech === 'blue' || tech === 'gold' || tech === 'purple';
    const key = show ? tech + (tech === 'blue' && perfect ? '*' : '') : '';
    if (this.cache.cue !== key) {
      this.cache.cue = key;
      this.cueEl.className = show ? tech : 'hidden';
      if (show) {
        const tapKey = this.touch ? '👆小喷' : '↑';
        const [k1, label] = {
          blue: [tapKey, perfect ? '完美小喷' : '小喷'],
          gold: [tapKey, '双喷'],
          purple: [this.touch ? '👆氮气' : 'Ctrl', '接氮气'],
        }[tech];
        this.cueKey.textContent = k1;
        this.cueTxt.textContent = label;
      }
    }
    if (show) this.cueBar.style.width = Math.round(k * 100) + '%';
  }

  // 技巧链：漂移 › 完美小喷 › 双喷 › 接氮气（错过的窗口划掉显示）
  combo(label, cls, fresh = false) {
    const now = performance.now();
    if (fresh || now - this.comboT > 2600) this.comboEl.innerHTML = '';
    this.comboT = now;
    if (this.comboEl.children.length) this.comboEl.insertAdjacentHTML('beforeend', '<i>›</i>');
    const b = document.createElement('b');
    b.className = cls;
    b.textContent = label;
    this.comboEl.appendChild(b);
    while (this.comboEl.children.length > 11) this.comboEl.firstChild.remove();
    this.comboEl.classList.add('show');
    clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => this.comboEl.classList.remove('show'), 2600);
  }

  clearCombo() {
    this.comboEl.innerHTML = '';
    this.comboEl.classList.remove('show');
    this.cue('');
  }

  message(text, color = '#27c7ff', small = false) {
    const d = document.createElement('div');
    d.className = 'msg' + (small ? ' sm' : '');
    d.style.setProperty('--c', color);
    d.textContent = text;
    this.msgs.appendChild(d);
    while (this.msgs.children.length > 3) this.msgs.firstChild.remove();
    setTimeout(() => d.remove(), 1150);
  }

  countdown(t) {
    this.cd.innerHTML = t ? `<span>${t}</span>` : '';
  }

  warn(text) {
    if (this.cache.warn === text) return;
    this.cache.warn = text;
    this.warnEl.classList.toggle('hidden', !text);
    if (text) this.warnEl.textContent = text;
  }

  // 冲线倒计时：text + 大号秒数
  finalCount(text, n) {
    const key = text + '|' + n;
    if (this.cache.fc === key) return;
    this.cache.fc = key;
    this.finalEl.classList.toggle('hidden', !text);
    if (text) this.finalEl.innerHTML = `${text} <b>${n}</b> 秒后结束`;
  }

  flash() {
    this.hit.style.transition = 'none';
    this.hit.style.opacity = 1;
    requestAnimationFrame(() => {
      this.hit.style.transition = 'opacity .5s';
      this.hit.style.opacity = 0;
    });
  }

  song(name) {
    this.songtip.textContent = '♪ ' + name;
    this.songtip.classList.add('show');
    clearTimeout(this.songT);
    this.songT = setTimeout(() => this.songtip.classList.remove('show'), 2200);
  }

  toggleKeys() { this.keys.classList.toggle('hidden'); }

  clearFx() { this.fxx.clearRect(0, 0, this.fx.width, this.fx.height); this.lines.length = 0; }

  // 速度线
  speedLines(dt, k, color) {
    const g = this.fxx, W = this.fx.width, H = this.fx.height;
    g.clearRect(0, 0, W, H);
    if (k <= 0.01 && !this.lines.length) return;
    const cx = W / 2, cy = H * 0.45;
    const spawn = k * 90 * dt * 60 / 60;
    for (let i = 0; i < spawn * 1.2; i++)
      this.lines.push({ a: Math.random() * Math.PI * 2, r: 0.35 + Math.random() * 0.2, v: 1.8 + Math.random() * 1.6, l: 0.08 + Math.random() * 0.14, w: 1 + Math.random() * 2.5 });
    const D = Math.hypot(W, H) / 2;
    g.strokeStyle = color;
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const L = this.lines[i];
      L.r += L.v * dt;
      if (L.r > 1.2) { this.lines.splice(i, 1); continue; }
      const r1 = L.r * D, r2 = (L.r + L.l) * D;
      g.globalAlpha = Math.min(1, k * 1.2) * Math.min(1, (L.r - 0.3) * 3) * 0.55;
      g.lineWidth = L.w * (W / 1400);
      g.beginPath();
      g.moveTo(cx + Math.cos(L.a) * r1, cy + Math.sin(L.a) * r1 * 0.75);
      g.lineTo(cx + Math.cos(L.a) * r2, cy + Math.sin(L.a) * r2 * 0.75);
      g.stroke();
    }
    g.globalAlpha = 1;
  }
}

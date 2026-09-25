// 车库：金币、赛车购买、装备改装（本地存档 localStorage）
import { CAR_SKINS } from './carModel.js';
import { BASE_PERF } from './vehicle.js';

const KEY = 'feiche3d.profile.v1';
const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('en-US');
const hex = (c) => '#' + c.toString(16).padStart(6, '0');
export const BODY_NAMES = { sport: '跑车', gt: 'GT 宽体', hyper: '超跑' };

// 各车基础属性（相对原版手感的倍率）；price 0 = 初始赠送
export const CARS = {
  red: { price: 0, vmax: 1.0, accel: 1.0, handling: 1.0, drift: 1.0, nitro: 1.0, desc: '均衡型入门赛车，什么路都能跑。' },
  blue: { price: 0, vmax: 0.99, accel: 1.02, handling: 1.05, drift: 1.04, nitro: 1.0, desc: '转向灵活，适合练习漂移出弯。' },
  pink: { price: 600, vmax: 0.985, accel: 1.08, handling: 1.06, drift: 1.08, nitro: 1.02, desc: '起步快、甩尾轻，新手的好帮手。' },
  white: { price: 900, vmax: 1.015, accel: 1.0, handling: 1.08, drift: 1.0, nitro: 1.06, desc: 'GT 宽体车身，贴地稳定，集气更快。' },
  green: { price: 1500, vmax: 1.02, accel: 1.12, handling: 1.03, drift: 1.04, nitro: 1.04, desc: '涡轮增压，出弯加速一骑绝尘。' },
  yellow: { price: 2400, vmax: 1.05, accel: 1.04, handling: 0.98, drift: 1.0, nitro: 1.08, desc: '极速型超跑，长直道上的王者。' },
  purple: { price: 3500, vmax: 1.035, accel: 1.06, handling: 1.06, drift: 1.14, nitro: 1.12, desc: '漂移之王：甩尾更深、集气更猛。' },
  black: { price: 5000, vmax: 1.06, accel: 1.1, handling: 1.07, drift: 1.1, nitro: 1.14, desc: '顶级全能超跑，车神的最终座驾。' },
};

// 装备改装（全车通用），每项 5 级
export const UPGRADES = [
  { id: 'engine', name: '引擎', icon: '⚙️', desc: '极速 +0.8% / 级', cost: [200, 400, 700, 1100, 1600] },
  { id: 'turbo', name: '涡轮', icon: '🌀', desc: '加速 +4% / 级', cost: [200, 400, 700, 1100, 1600] },
  { id: 'tires', name: '轮胎', icon: '🛞', desc: '转向与抓地 +2.5%、漂移 +1.5% / 级', cost: [150, 350, 600, 950, 1400] },
  { id: 'nitro', name: '氮气罐', icon: '🔥', desc: '集气 +3%、氮气 +0.12s、小喷推力 +0.4 / 级', cost: [200, 400, 700, 1100, 1600] },
];
const MAX_LV = 5;

export class Profile {
  constructor() {
    let p = {};
    try { p = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { /* 忽略 */ }
    this.coins = Number.isFinite(p.coins) ? p.coins : 500;
    this.owned = Array.isArray(p.owned) ? p.owned.filter((id) => CARS[id]) : [];
    for (const id of Object.keys(CARS)) if (CARS[id].price === 0 && !this.owned.includes(id)) this.owned.push(id);
    this.up = Object.fromEntries(UPGRADES.map((u) => [u.id, Math.max(0, Math.min(MAX_LV, p.up?.[u.id] | 0))]));
    this.races = p.races | 0;
    this.wins = p.wins | 0;
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify({ coins: this.coins, owned: this.owned, up: this.up, races: this.races, wins: this.wins })); } catch { /* 忽略 */ }
  }

  owns(id) { return this.owned.includes(id); }

  buyCar(id) {
    const c = CARS[id];
    if (!c || this.owns(id) || this.coins < c.price) return false;
    this.coins -= c.price;
    this.owned.push(id);
    this.save();
    return true;
  }

  upgradeCost(id) {
    const u = UPGRADES.find((x) => x.id === id);
    const lv = this.up[id];
    return lv >= MAX_LV ? null : u.cost[lv];
  }

  buyUpgrade(id) {
    const cost = this.upgradeCost(id);
    if (cost === null || this.coins < cost) return false;
    this.coins -= cost;
    this.up[id]++;
    this.save();
    return true;
  }

  addCoins(n) {
    this.coins += n;
    this.save();
  }
}

// 赛车 + 改装 → 物理修正
export function perfFor(skinId, up) {
  const c = CARS[skinId] || CARS.red;
  const u = up || {};
  const e = u.engine | 0, t = u.turbo | 0, r = u.tires | 0, n = u.nitro | 0;
  return {
    ...BASE_PERF,
    vmax: c.vmax * (1 + 0.008 * e),
    accel: c.accel * (1 + 0.04 * t),
    turn: c.handling * (1 + 0.025 * r),
    grip: c.handling * (1 + 0.025 * r),
    drift: c.drift * (1 + 0.015 * r),
    gauge: c.nitro * (1 + 0.03 * n),
    nitroTime: (c.nitro - 1) * 3 + 0.12 * n,
    spray: 0.4 * n,
  };
}

// 属性条（0~100）：[名称, 基础值, 含改装值]
function statBars(skinId, up) {
  const b = perfFor(skinId, {});
  const f = perfFor(skinId, up);
  const k = (v, lo, hi) => Math.max(4, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  return [
    ['极速', k(b.vmax, 0.95, 1.12), k(f.vmax, 0.95, 1.12)],
    ['加速', k(b.accel, 0.9, 1.4), k(f.accel, 0.9, 1.4)],
    ['操控', k(b.turn, 0.9, 1.25), k(f.turn, 0.9, 1.25)],
    ['漂移', k(b.drift, 0.9, 1.25), k(f.drift, 0.9, 1.25)],
    ['氮气', k(b.gauge, 0.9, 1.35), k(f.gauge, 0.9, 1.35)],
  ];
}

// 比赛奖励：名次 + 冠军奖励 + 技巧奖励，按圈数和难度加成
const PLACE_COINS = [300, 200, 150, 110, 80, 60];
const DIFF_K = [0.8, 1, 1.5];
export function raceReward({ place, laps, diff, stats }) {
  const lapK = { 1: 0.6, 2: 1, 3: 1.3, 5: 1.8 }[laps] ?? laps * 0.36;
  const lines = [];
  const base = Math.round((PLACE_COINS[place - 1] ?? 50) * lapK);
  lines.push([`第 ${place} 名`, base]);
  if (place === 1) lines.push(['冠军奖励', Math.round(200 * lapK)]);
  const tech = Math.min(Math.round(200 * lapK), stats.perfect * 6 + stats.double * 10 + stats.chain * 8);
  if (tech > 0) lines.push([`技巧奖励（完美小喷 ${stats.perfect} · 双喷 ${stats.double} · 接氮气 ${stats.chain}）`, tech]);
  const sub = lines.reduce((a, l) => a + l[1], 0);
  const dk = DIFF_K[diff] ?? 1;
  const total = Math.round(sub * dk);
  if (dk !== 1) lines.push([`难度加成 ×${dk}`, total - sub]);
  return { lines, total };
}

// ---------- 车库界面 ----------
export class GarageUI {
  constructor(profile, { onPreview, onSelect, onClose, sound }) {
    this.p = profile;
    this.onPreview = onPreview;
    this.onSelect = onSelect;
    this.onClose = onClose;
    this.sound = sound;
    this.el = $('garage');
    this.view = 0;
    $('glist').addEventListener('click', (e) => {
      const c = e.target.closest('.gcar');
      if (!c) return;
      this.view = +c.dataset.i;
      this.sound('click');
      this.render();
      this.onPreview(this.view);
    });
    $('gbuy').addEventListener('click', () => {
      const id = CAR_SKINS[this.view].id;
      if (this.p.owns(id)) {
        this.selected = this.view;
        this.onSelect(this.view);
        this.sound('click');
      } else if (this.p.buyCar(id)) {
        this.selected = this.view;
        this.onSelect(this.view);
        this.sound('gauge');
        this.flash(`购入 ${CAR_SKINS[this.view].name}！`);
      } else this.sound('wrong');
      this.render();
    });
    $('gups').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-id]');
      if (!b) return;
      if (this.p.buyUpgrade(b.dataset.id)) {
        this.sound('gauge');
        this.flash(`${UPGRADES.find((u) => u.id === b.dataset.id).name} 升到 Lv.${this.p.up[b.dataset.id]}`);
      } else this.sound('wrong');
      this.render();
    });
    $('gback').addEventListener('click', () => this.close());
  }

  open(view, selected) {
    this.view = view;
    this.selected = selected;
    this.el.classList.remove('hidden');
    document.body.classList.add('garage');
    this.render();
    this.onPreview(view);
  }

  close() {
    this.el.classList.add('hidden');
    document.body.classList.remove('garage');
    this.sound('click');
    this.onClose();
  }

  get isOpen() { return !this.el.classList.contains('hidden'); }

  flash(text) {
    const f = $('gflash');
    f.textContent = text;
    f.classList.remove('show');
    void f.offsetWidth;
    f.classList.add('show');
  }

  render() {
    const p = this.p;
    $('gcoins').textContent = fmt(p.coins);
    $('glist').innerHTML = CAR_SKINS.map((s, i) => {
      const c = CARS[s.id];
      const own = p.owns(s.id);
      const tag = i === this.selected ? '<em class="use">使用中</em>' : own ? '<em>已拥有</em>' : `<em class="price${p.coins >= c.price ? '' : ' poor'}">🪙 ${fmt(c.price)}</em>`;
      return `<div class="gcar${i === this.view ? ' sel' : ''}${own ? '' : ' lock'}" data-i="${i}">
        <span class="sw" style="background:linear-gradient(135deg,${hex(s.body)} 55%,${hex(s.accent)} 56%)"></span>
        <span class="nm">${s.name}<small>${BODY_NAMES[s.bodyType]}</small></span>${tag}</div>`;
    }).join('');
    const s = CAR_SKINS[this.view];
    const c = CARS[s.id];
    $('gname').textContent = s.name;
    $('gdesc').textContent = `${BODY_NAMES[s.bodyType]} · ${c.desc}`;
    $('gstats').innerHTML = statBars(s.id, p.up).map(([n, b, f]) =>
      `<div class="gs"><span>${n}</span><div class="bar"><i class="up" style="width:${f}%"></i><i style="width:${b}%"></i></div></div>`).join('');
    const own = p.owns(s.id);
    const buy = $('gbuy');
    buy.disabled = false;
    buy.classList.toggle('sec', own && this.view === this.selected);
    if (!own) {
      buy.textContent = `购买 🪙 ${fmt(c.price)}`;
      buy.disabled = p.coins < c.price;
    } else buy.textContent = this.view === this.selected ? '✔ 使用中' : '使用这辆';
    $('gups').innerHTML = UPGRADES.map((u) => {
      const lv = p.up[u.id];
      const cost = p.upgradeCost(u.id);
      const pips = Array.from({ length: MAX_LV }, (_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('');
      const btn = cost === null ? '<button disabled>已满级</button>' : `<button data-id="${u.id}"${p.coins < cost ? ' disabled' : ''}>升级 🪙 ${fmt(cost)}</button>`;
      return `<div class="gup"><span class="ic">${u.icon}</span><div class="info"><b>${u.name} <small>Lv.${lv}</small></b><small>${u.desc}</small><span class="pips">${pips}</span></div>${btn}</div>`;
    }).join('');
  }
}

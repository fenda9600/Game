import * as THREE from 'three';
import { softDotTexture, textTexture } from './textures.js';

// 技巧提示颜色：蓝=可小喷，金=可双喷，紫=可接氮气（charge = 漂移已蓄够、出弯即可小喷）
export const TECH_COLORS = { charge: 0x8fd8ff, blue: 0x2f9dff, gold: 0xffc21a, purple: 0xb04dff };
const CUES = ['blue', 'gold', 'purple'];
// 金色亮度高，泛光后会把整车糊掉，单独压低
const CUE_GAIN = { blue: 1, gold: 0.55, purple: 1, charge: 1 };
let flareMats = null;
function flareMat(tech) {
  flareMats ||= Object.fromEntries(CUES.map((k) => [k, new THREE.SpriteMaterial({
    map: softDotTexture(), color: new THREE.Color(TECH_COLORS[k]).multiplyScalar(CUE_GAIN[k] * 2),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false,
  })]));
  return flareMats[tech];
}

// 车尾光斑脉动 + 底盘光改成提示色，远处的旁观者也能一眼看出窗口
export function updateTechFx(u, tech, k = 0) {
  const cue = CUES.includes(tech);
  u.flare.visible = cue;
  if (cue) {
    u.flare.material = flareMat(tech);
    const s = 1.6 + Math.sin(performance.now() * 0.028) * 0.3 + (1 - k) * 0.3;
    u.flare.scale.set(s * 1.5, s, 1);
  }
  if (u.techNow !== tech) {
    u.techNow = tech;
    u.glowMat.color.setHex(cue ? TECH_COLORS[tech] : u.skin.glow);
    if (cue) u.glowMat.color.multiplyScalar(CUE_GAIN[tech] * 0.9);
    u.under.scale.setScalar(cue ? 1.15 : 1);
  }
}

// bodyType：sport 跑车 / gt 宽体大尾翼 / hyper 超跑（鲨鱼鳍、双层尾翼、鸭翼）
export const CAR_SKINS = [
  { id: 'red', name: '烈焰战神', body: 0xe0262b, accent: 0xffc93a, glow: 0xff5a1f, rim: 0xd9d9d9, bodyType: 'sport' },
  { id: 'blue', name: '冰蓝幻影', body: 0x1f6ff2, accent: 0x6ff3ff, glow: 0x27c7ff, rim: 0xe6f2ff, bodyType: 'sport' },
  { id: 'purple', name: '紫电魅影', body: 0x7b3df0, accent: 0xff6fd8, glow: 0xc26bff, rim: 0xf0e0ff, bodyType: 'hyper' },
  { id: 'yellow', name: '黄金闪电', body: 0xffc21a, accent: 0x1b1b1b, glow: 0xffe066, rim: 0x2b2b2b, bodyType: 'hyper' },
  { id: 'white', name: '白鲸号', body: 0xf3f5f8, accent: 0x2a7bff, glow: 0x5ab0ff, rim: 0x9aa7b8, bodyType: 'gt' },
  { id: 'pink', name: '粉红甜心', body: 0xff7eb6, accent: 0xffffff, glow: 0xff9ed0, rim: 0xffffff, bodyType: 'sport' },
  { id: 'green', name: '翡翠之星', body: 0x19b86a, accent: 0xe8ff5a, glow: 0x6dff9e, rim: 0xe8ffe8, bodyType: 'gt' },
  { id: 'black', name: '暗夜猎手', body: 0x1b1d22, accent: 0xff2d55, glow: 0xff2d55, rim: 0x707782, bodyType: 'hyper' },
  // 卡丁车：尖峰（棱角刀锋）/ 棉花糖（软绵圆润），带霓虹饰条
  { id: 'mallow_berry', name: '棉花糖·莓莓', body: 0xffa6c9, accent: 0xfff4f8, glow: 0xff6fb5, rim: 0xffffff, bodyType: 'marshmallow' },
  { id: 'mallow_mint', name: '棉花糖·薄荷', body: 0x96efd4, accent: 0xfffbf0, glow: 0x3ff0ff, rim: 0xffffff, bodyType: 'marshmallow' },
  { id: 'spike_red', name: '尖峰·赤焰', body: 0xd81f3c, accent: 0x1c1c24, glow: 0xff3a5c, rim: 0x2b2b30, bodyType: 'spike' },
  { id: 'spike_neon', name: '尖峰·极光', body: 0x12151f, accent: 0x19f0ff, glow: 0xff2bd6, rim: 0x19f0ff, bodyType: 'spike' },
  { id: 'spike_void', name: '尖峰·暗物质', body: 0x2a1255, accent: 0xb46bff, glow: 0x7a5cff, rim: 0xd8c8ff, bodyType: 'spike' },
  // 概念车：隼影（操控特化）/ 裂空（极速特化）/ 雷脉（加速特化）；wheels 覆盖默认轮距与轮胎宽度
  { id: 'apex', name: '隼影', body: 0xf2f4f7, accent: 0x2b2f38, glow: 0x2fd8ff, rim: 0x2b2f38, rimRing: 0x2fd8ff, bodyType: 'apex', wheels: { x: 1.0, zf: 1.22, zr: -1.22, w: 0.52 } },
  { id: 'velocity', name: '裂空', body: 0xd21f2a, accent: 0x1c1d22, glow: 0xffae1a, rim: 0x25262b, hub: 0xffae1a, bodyType: 'velocity', wheels: { x: 0.9, zf: 1.58, zr: -1.45, w: 0.42 } },
  { id: 'pulse', name: '雷脉', body: 0x7433e6, accent: 0x2a2c33, glow: 0xb6ff2a, rim: 0x2a2c33, rimRing: 0xb6ff2a, bodyType: 'pulse', wheels: { x: 1.0, zf: 1.42, zr: -1.4, w: 0.52 } },
];
export const isKart = (skin) => skin.bodyType === 'spike' || skin.bodyType === 'marshmallow';
const isConcept = (skin) => skin.bodyType === 'apex' || skin.bodyType === 'velocity' || skin.bodyType === 'pulse';

function profileShape(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

// 侧面轮廓挤出：shape 的 x = 车身纵向（+ 为车头），挤出方向 = 车宽
function extrudeSide(shape, width, bevel) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: width - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 4,
    curveSegments: 16,
  });
  g.translate(0, 0, -(width - bevel * 2) / 2);
  g.rotateY(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

let sharedGeo = null;
function geos() {
  if (sharedGeo) return sharedGeo;
  // 车身：低趴跑车，带轮拱
  const body = new THREE.Shape();
  body.moveTo(-2.18, 0.34);
  body.lineTo(-1.92, 0.3);
  body.absarc(-1.38, 0.3, 0.54, Math.PI, 0, true);
  body.lineTo(0.84, 0.3);
  body.absarc(1.38, 0.3, 0.54, Math.PI, 0, true);
  body.lineTo(2.12, 0.3);
  body.quadraticCurveTo(2.34, 0.34, 2.3, 0.5);
  body.lineTo(2.12, 0.66);
  body.quadraticCurveTo(1.5, 0.78, 0.72, 0.86);
  body.lineTo(-0.2, 0.92);
  body.lineTo(-1.6, 0.96);
  body.quadraticCurveTo(-2.1, 0.98, -2.24, 0.86);
  body.lineTo(-2.26, 0.5);
  body.closePath();
  const bodyGeo = extrudeSide(body, 2.0, 0.14);

  const cabin = profileShape([
    [0.78, 0.84], [0.05, 1.3], [-0.95, 1.32], [-1.62, 0.96], [-1.2, 0.9], [0.4, 0.84],
  ]);
  const cabinGeo = extrudeSide(cabin, 1.46, 0.12);

  // 侧裙
  const skirt = profileShape([[-1.9, 0.3], [0.84, 0.3], [0.84, 0.42], [-1.9, 0.42]]);
  const skirtGeo = extrudeSide(skirt, 2.08, 0.03);

  const tire = new THREE.CylinderGeometry(0.47, 0.47, 0.4, 24);
  tire.rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(0.31, 0.31, 0.42, 16);
  rim.rotateZ(Math.PI / 2);
  const spoke = new THREE.BoxGeometry(0.44, 0.07, 0.5);
  // 卡丁车轮胎更宽、轮毂更小
  const kartTire = new THREE.CylinderGeometry(0.47, 0.47, 0.56, 24);
  kartTire.rotateZ(Math.PI / 2);
  const kartRim = new THREE.CylinderGeometry(0.25, 0.25, 0.58, 12);
  kartRim.rotateZ(Math.PI / 2);
  sharedGeo = { bodyGeo, cabinGeo, skirtGeo, tire, rim, spoke, kartTire, kartRim };
  for (const g of Object.values(sharedGeo)) g.userData.shared = true; // 换车时不释放
  return sharedGeo;
}

// ---------- 卡丁车 ----------
// 与跑车共用坐标：x 车宽、y 向上、z 向前；车轮在 (±0.93, 0.47, ±1.38)
function kartAdder(root) {
  return (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x, y, z);
    o.rotation.set(rx, ry, rz);
    o.castShadow = true;
    root.add(o);
    return o;
  };
}

// 头盔车手：尖峰款头盔带刀锋冠，棉花糖款头盔顶着一颗绒球和两只圆耳朵
function addDriver(root, add, { suit, helmet, visor, style, trim }) {
  const suitM = new THREE.MeshStandardMaterial({ color: suit, roughness: 0.6 });
  const helmM = style === 'marshmallow'
    ? new THREE.MeshPhysicalMaterial({ color: helmet, roughness: 0.6, sheen: 1, sheenRoughness: 0.5, sheenColor: 0xffffff })
    : new THREE.MeshPhysicalMaterial({ color: helmet, metalness: 0.5, roughness: 0.25, clearcoat: 1 });
  add(new THREE.CapsuleGeometry(0.3, 0.4, 6, 12), suitM, 0, 0.98, -0.58, -0.28);
  for (const sx of [-1, 1]) add(new THREE.CapsuleGeometry(0.085, 0.5, 4, 8), suitM, sx * 0.3, 0.98, -0.18, Math.PI / 2 - 0.55, 0, -sx * 0.28);
  const head = add(new THREE.SphereGeometry(0.34, 20, 16), helmM, 0, 1.56, -0.64);
  // 面罩：头盔正面一圈深色弧面
  const v = new THREE.Mesh(new THREE.SphereGeometry(0.352, 20, 8, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.45, 0.62), visor);
  head.add(v);
  if (style === 'spike') {
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.62, 4), trim);
    crest.rotation.x = -Math.PI / 2 - 0.35;
    crest.position.set(0, 0.3, -0.2);
    head.add(crest);
  } else {
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), trim);
    pom.position.set(0, 0.37, 0);
    head.add(pom);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), helmM);
      ear.scale.set(1, 1, 0.55);
      ear.position.set(sx * 0.24, 0.24, 0);
      head.add(ear);
    }
  }
  // 方向盘
  add(new THREE.TorusGeometry(0.18, 0.035, 6, 18), new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.5 }), 0, 1.0, 0.12, -1.0);
}

function buildKartBody(root, skin, M) {
  const add = kartAdder(root);
  const { dark, glass, headM, tailM, neonM, rimM } = M;
  const exhausts = [];
  // 底板
  add(new THREE.BoxGeometry(1.2, 0.12, 3.7), dark, 0, 0.3, 0);
  if (skin.bodyType === 'spike') {
    const { paint, accent } = M;
    // 棱角车体（侧面轮廓挤出）：前低后高的楔形
    add(extrudeSide(profileShape([[-1.75, 0.3], [1.15, 0.3], [1.65, 0.42], [1.1, 0.64], [-0.15, 0.68], [-0.45, 0.98], [-1.25, 1.0], [-1.85, 0.72]]), 1.28, 0.05), paint, 0, 0, 0);
    // 刀锋车鼻
    const nose = new THREE.ConeGeometry(0.6, 1.5, 4);
    nose.rotateX(Math.PI / 2);
    nose.rotateZ(Math.PI / 4);
    nose.scale(1.15, 0.42, 1);
    add(nose, accent, 0, 0.44, 2.05);
    add(new THREE.BoxGeometry(1.7, 0.05, 0.34), accent, 0, 0.26, 2.2); // 前铲
    for (const sx of [-1, 1]) {
      // 侧舱刀锋 + 向后的尖刺 + 霓虹边
      add(extrudeSide(profileShape([[-0.95, 0.3], [0.75, 0.3], [0.5, 0.6], [-0.95, 0.52]]), 0.3, 0.03), accent, sx * 0.74, 0, 0);
      for (const z of [0.42, 0.02, -0.38]) {
        const spike = new THREE.ConeGeometry(0.07, 0.46, 4);
        spike.rotateX(-Math.PI / 2);
        add(spike, paint, sx * 0.8, 0.6, z, 0, sx * 0.25, 0);
      }
      add(new THREE.BoxGeometry(0.03, 0.04, 1.55), neonM, sx * 0.9, 0.42, -0.1);
      // 竖直尾鳍
      add(extrudeSide(profileShape([[-2.05, 0.72], [-1.35, 0.82], [-2.25, 1.68]]), 0.06, 0.01), paint, sx * 0.58, 0, 0);
      add(new THREE.BoxGeometry(0.34, 0.06, 0.08), headM, sx * 0.36, 0.5, 2.12, 0, sx * 0.3, 0); // 细长 LED 大灯
      add(new THREE.BoxGeometry(0.46, 0.06, 0.06), tailM, sx * 0.3, 0.78, -2.1);
    }
    // 刀锋尾翼 + 霓虹后缘
    add(new THREE.BoxGeometry(1.95, 0.05, 0.42), accent, 0, 1.46, -2.02, -0.15);
    add(new THREE.BoxGeometry(1.95, 0.035, 0.04), neonM, 0, 1.43, -2.24);
    add(new THREE.BoxGeometry(0.95, 0.42, 0.6), dark, 0, 0.56, -1.72); // 引擎
    for (let k = 0; k < 4; k++) {
      const spike = new THREE.ConeGeometry(0.06, 0.34, 4);
      spike.rotateX(-Math.PI / 2);
      add(spike, rimM, (k - 1.5) * 0.36, 0.38, -2.3);
    }
    addDriver(root, add, { suit: skin.accent, helmet: skin.body, visor: glass, style: 'spike', trim: neonM });
  } else {
    // 棉花糖：绒面材质 + 奶油泡泡
    const puff = new THREE.MeshPhysicalMaterial({ color: skin.body, roughness: 0.62, sheen: 1, sheenRoughness: 0.45, sheenColor: 0xffffff });
    const cream = new THREE.MeshPhysicalMaterial({ color: skin.accent, roughness: 0.7, sheen: 1, sheenRoughness: 0.6, sheenColor: 0xffffff });
    const pillow = new THREE.SphereGeometry(1, 28, 18);
    add(pillow, puff, 0, 0.6, 0.05).scale.set(0.8, 0.4, 1.9);
    // 车沿一圈棉花糖泡泡
    const blob = new THREE.SphereGeometry(0.24, 14, 10);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const b = add(blob, cream, Math.cos(a) * 0.74, 0.8, Math.sin(a) * 1.72 + 0.05);
      b.scale.set(1, 0.72, 1.15);
    }
    add(new THREE.CapsuleGeometry(0.22, 1.1, 6, 12), cream, 0, 0.44, 1.98, 0, 0, Math.PI / 2); // 前保险杠
    for (const sx of [-1, 1]) {
      add(new THREE.CapsuleGeometry(0.24, 1.3, 6, 12), cream, sx * 0.8, 0.46, -0.05, Math.PI / 2); // 侧舱
      add(new THREE.BoxGeometry(0.03, 0.04, 1.4), neonM, sx * 1.05, 0.46, -0.05);
      add(new THREE.SphereGeometry(0.14, 14, 10), headM, sx * 0.38, 0.66, 1.72); // 圆灯
      add(new THREE.SphereGeometry(0.1, 12, 8), tailM, sx * 0.36, 0.74, -1.92);
      add(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), cream, sx * 0.45, 1.02, -1.9); // 尾翼支架
    }
    add(new THREE.CapsuleGeometry(0.13, 1.35, 6, 12), puff, 0, 1.24, -1.92, 0, 0, Math.PI / 2); // 圆滚滚尾翼
    add(new THREE.SphereGeometry(0.5, 18, 12), puff, 0, 0.62, -1.62).scale.set(1.1, 0.8, 0.8); // 引擎仓
    for (const [x, y, z, r] of [[-0.3, 0.95, -1.55, 0.2], [0.28, 0.98, -1.6, 0.17], [0, 1.02, -1.4, 0.15]]) add(new THREE.SphereGeometry(r, 12, 10), cream, x, y, z);
    addDriver(root, add, { suit: skin.body, helmet: skin.accent, visor: glass, style: 'marshmallow', trim: puff });
  }
  // 排气管（尾焰从这里喷出）
  for (const sx of [-0.28, 0.28]) {
    add(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 12), rimM, sx, 0.6, -2.12, Math.PI / 2);
    exhausts.push(new THREE.Vector3(sx, 0.6, -2.28));
  }
  return exhausts;
}

// ---------- 概念车 ----------
// 侧面轮廓：沿车身纵向走底边（遇到车轮挖出轮拱），再按 top 点列从车头绕回车尾
function archedProfile(z0, z1, arches, top, y0 = 0.3, r = 0.56) {
  const s = new THREE.Shape();
  s.moveTo(z0, y0);
  for (const zc of arches) {
    s.lineTo(zc - r, y0);
    s.absarc(zc, y0, r, Math.PI, 0, true);
  }
  s.lineTo(z1, y0);
  for (const [z, y] of top) s.lineTo(z, y);
  s.closePath();
  return s;
}

function buildConceptBody(root, skin, M) {
  const add = kartAdder(root);
  const { paint, accent, dark, glass, headM, tailM } = M;
  const W = skin.wheels;
  // 概念车饰条亮度压低一些，泛光后仍保留青 / 琥珀 / 青柠的颜色；尾翼端板用同色烤漆
  const neonM = new THREE.MeshStandardMaterial({ color: skin.glow, emissive: skin.glow, emissiveIntensity: 1.6 });
  const plateM = new THREE.MeshPhysicalMaterial({ color: skin.glow, metalness: 0.3, roughness: 0.3, clearcoat: 1 });
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const exhausts = [];
  if (skin.bodyType === 'apex') {
    // 隼影：短轴距、超宽轮距的赛道小钢炮，中央水滴座舱 + 四个独立轮拱
    add(extrudeSide(archedProfile(-2.0, 2.05, [], [[2.12, 0.46], [1.3, 0.7], [0.45, 0.78], [-1.35, 0.84], [-1.98, 0.76]]), 1.3, 0.1), paint, 0, 0, 0);
    const canopy = add(new THREE.SphereGeometry(1, 28, 18), glass, 0, 0.86, -0.15);
    canopy.scale.set(0.56, 0.4, 1.35);
    add(box(0.12, 0.02, 1.6), neonM, 0, 0.8, 1.2, 0.2); // 车头中线
    for (const sx of [-1, 1]) {
      for (const zc of [W.zf, W.zr]) {
        const f = zc > 0;
        add(extrudeSide(archedProfile(zc - 0.78, zc + 0.8, [zc], f
          ? [[zc + 0.84, 0.56], [zc + 0.5, 0.98], [zc - 0.2, 1.04], [zc - 0.7, 0.86]]
          : [[zc + 0.72, 0.82], [zc + 0.2, 1.06], [zc - 0.5, 1.02], [zc - 0.82, 0.6]], 0.3, 0.58), 0.58, 0.06), paint, sx * W.x, 0, 0);
      }
      add(box(0.34, 0.3, 1.0), paint, sx * 0.82, 0.48, 0); // 侧舱
      add(box(0.05, 0.1, 0.9), dark, sx * 0.99, 0.5, 0.05); // 侧进气
      add(box(0.03, 0.04, 1.0), neonM, sx * 1.0, 0.36, 0);
      add(box(0.46, 0.035, 0.34), dark, sx * 0.55, 0.27, 2.1, 0, sx * 0.18, 0); // 分体前铲
      add(box(0.34, 0.03, 0.2), accent, sx * 1.08, 0.46, 1.95, 0, 0, sx * 0.25); // 鸭翼
      add(box(0.3, 0.03, 0.18), accent, sx * 1.1, 0.6, 1.9, 0, 0, sx * 0.25);
      add(box(0.06, 0.34, 0.06), neonM, sx * 0.66, 0.66, -2.04); // U 形尾灯两竖
      add(box(0.07, 0.62, 0.72), plateM, sx * 1.12, 1.26, -1.92); // 青色尾翼端板
      add(box(0.07, 0.4, 0.16), dark, sx * 0.5, 1.02, -1.86); // 尾翼支柱
    }
    add(box(1.5, 0.07, 0.07), neonM, 0, 0.62, 2.06, -0.3); // 一字眉大灯
    add(box(1.2, 0.05, 0.05), headM, 0, 0.56, 2.08);
    add(box(2.2, 0.06, 0.52), accent, 0, 1.48, -1.96, -0.1); // 双层尾翼
    add(box(2.1, 0.05, 0.34), accent, 0, 1.24, -2.0, -0.18);
    add(box(1.36, 0.06, 0.06), neonM, 0, 0.5, -2.04);
    add(box(0.9, 0.05, 0.05), tailM, 0, 0.78, -2.02);
    add(box(1.6, 0.18, 0.3), dark, 0, 0.34, -1.95); // 扩散器
    for (const sx of [-0.3, 0.3]) {
      add(new THREE.CylinderGeometry(0.12, 0.13, 0.2, 16), dark, sx, 0.42, -2.0, Math.PI / 2);
      add(new THREE.TorusGeometry(0.13, 0.025, 8, 20), neonM, sx, 0.42, -2.1);
      exhausts.push(new THREE.Vector3(sx, 0.42, -2.14));
    }
  } else if (skin.bodyType === 'velocity') {
    // 裂空：修长低矮的楔形超跑，箭头车鼻 + 长溜背 + 平贴尾翼
    add(extrudeSide(archedProfile(-2.62, 2.78, [W.zr, W.zf], [[2.84, 0.4], [2.55, 0.54], [0.65, 0.8], [-0.4, 0.84], [-2.4, 0.76], [-2.64, 0.64]]), 1.84, 0.12), paint, 0, 0, 0);
    add(extrudeSide(profileShape([[0.7, 0.78], [-0.05, 1.1], [-0.95, 1.1], [-2.2, 0.8], [-0.2, 0.8]]), 1.2, 0.1), glass, 0, 0, 0);
    add(box(0.62, 0.03, 2.1), accent, 0, 0.68, 1.62, 0.14); // 黑色中脊（引擎盖）
    add(box(0.9, 0.04, 1.6), accent, 0, 0.84, -1.55, -0.02); // 尾部黑脊
    add(box(1.86, 0.04, 0.34), accent, 0, 0.8, -2.45, -0.05); // 平贴尾翼
    const nose = new THREE.ConeGeometry(0.4, 0.7, 4);
    nose.rotateX(Math.PI / 2);
    nose.scale(1.6, 0.35, 1);
    add(nose, accent, 0, 0.38, 2.86); // 箭头车鼻
    for (const sx of [-1, 1]) {
      add(box(0.55, 0.05, 0.12), headM, sx * 0.55, 0.66, 2.42, 0.14, sx * 0.4, 0); // 细长大灯
      add(box(0.6, 0.03, 0.06), neonM, sx * 0.56, 0.62, 2.46, 0.14, sx * 0.4, 0);
      add(box(0.05, 0.3, 1.0), dark, sx * 0.93, 0.56, -0.35); // 侧进气
      add(box(0.04, 0.04, 1.3), neonM, sx * 0.94, 0.38, 0.05);
      add(extrudeSide(profileShape([[-1.1, 0.8], [-1.75, 0.78], [-1.7, 1.2]]), 0.05, 0.01), paint, sx * 0.62, 0, 0); // 尾鳍
      add(box(0.44, 0.05, 0.3), accent, sx * 0.72, 0.26, 2.5, 0, sx * 0.3, 0); // 前铲
    }
    add(box(1.7, 0.07, 0.07), neonM, 0, 0.68, -2.77); // 琥珀色贯穿尾灯
    add(box(1.2, 0.04, 0.05), tailM, 0, 0.6, -2.77);
    add(box(1.5, 0.2, 0.3), dark, 0, 0.36, -2.52);
    for (const sx of [-0.42, 0.42]) {
      add(new THREE.CylinderGeometry(0.17, 0.18, 0.3, 20), dark, sx, 0.4, -2.68, Math.PI / 2);
      add(new THREE.TorusGeometry(0.17, 0.03, 8, 24), neonM, sx, 0.4, -2.8);
      exhausts.push(new THREE.Vector3(sx, 0.4, -2.86));
    }
  } else {
    // 雷脉：方正厚重的 GT 肌肉跑车，阶梯宽轮拱 + 中高位单尾翼 + 叠放方形氮气口
    add(extrudeSide(archedProfile(-2.34, 2.36, [W.zr, W.zf], [[2.4, 0.8], [0.95, 0.92], [-1.8, 0.96], [-2.34, 0.94]]), 2.0, 0.08), paint, 0, 0, 0);
    add(extrudeSide(profileShape([[0.95, 0.9], [0.2, 1.34], [-1.0, 1.36], [-1.75, 0.94]]), 1.62, 0.08), glass, 0, 0, 0);
    add(box(1.44, 0.06, 1.1), paint, 0, 1.44, -0.4); // 车顶
    add(box(0.9, 0.08, 0.9), accent, 0, 0.95, 1.4); // 引擎盖进气
    for (const sx of [-1, 1]) {
      for (const zc of [W.zf, W.zr]) {
        add(box(0.36, 0.16, 1.32), accent, sx * 1.02, 1.0, zc); // 阶梯宽轮拱
        add(box(0.36, 0.3, 0.14), accent, sx * 1.02, 0.84, zc + (zc > 0 ? 0.68 : -0.68));
      }
      add(box(0.26, 0.03, 0.1), neonM, sx * 1.02, 1.09, W.zf + 0.28); // 翼子板青柠色块
      add(box(0.26, 0.03, 0.1), neonM, sx * 1.02, 1.09, W.zf + 0.08);
      add(box(0.1, 0.02, 0.5), neonM, sx * 0.3, 0.95, 1.95); // 引擎盖条纹
      for (const dx of [0.52, 0.78]) add(box(0.2, 0.12, 0.05), headM, sx * dx, 0.66, 2.48); // 双方块大灯
      add(box(0.04, 0.04, 1.4), neonM, sx * 1.01, 0.36, 0);
      add(box(0.04, 0.3, 0.04), neonM, sx * 0.62, 0.42, 2.47, 0, 0, sx * 0.4); // 前唇青柠线
      add(box(0.54, 0.18, 0.05), neonM, sx * 0.64, 0.78, -2.36); // 方形尾灯
      add(box(0.36, 0.08, 0.06), dark, sx * 0.64, 0.78, -2.36);
      add(box(0.07, 0.5, 0.62), plateM, sx * 1.03, 1.38, -2.06); // 尾翼端板
      add(box(0.08, 0.34, 0.16), dark, sx * 0.55, 1.12, -2.0);
    }
    add(box(2.0, 0.07, 0.46), accent, 0, 1.3, -2.06, -0.1); // 单尾翼
    add(box(1.8, 0.05, 0.36), dark, 0, 0.26, 2.44); // 前铲
    add(box(1.2, 0.05, 0.05), tailM, 0, 0.64, -2.37);
    add(box(1.7, 0.28, 0.3), dark, 0, 0.4, -2.28); // 方形扩散器
    for (const y of [0.4, 0.58]) {
      add(box(0.46, 0.14, 0.1), neonM, 0, y, -2.38);
      add(box(0.38, 0.08, 0.12), dark, 0, y, -2.39);
      exhausts.push(new THREE.Vector3(0, y, -2.46));
    }
  }
  return exhausts;
}

export function buildCar(skin, { name = null, isPlayer = false } = {}) {
  const G = geos();
  const car = new THREE.Group();
  const root = new THREE.Group(); // 车身（用于侧倾/俯仰/漂移甩尾）
  car.add(root);

  const paint = new THREE.MeshPhysicalMaterial({
    color: skin.body, metalness: 0.55, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08,
  });
  const accent = new THREE.MeshStandardMaterial({ color: skin.accent, metalness: 0.5, roughness: 0.35 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0c1220, metalness: 0.9, roughness: 0.06, clearcoat: 1 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.7 });
  const tireM = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const rimM = new THREE.MeshStandardMaterial({ color: skin.rim, metalness: 0.9, roughness: 0.25 });
  const headM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe8f4ff, emissiveIntensity: 3.5 });
  const tailM = new THREE.MeshStandardMaterial({ color: 0xff2030, emissive: 0xff1020, emissiveIntensity: 4 });
  const neonM = new THREE.MeshStandardMaterial({ color: skin.glow, emissive: skin.glow, emissiveIntensity: 3.5 });

  const kart = isKart(skin);
  let exhausts;
  if (kart) exhausts = buildKartBody(root, skin, { paint, accent, dark, glass, headM, tailM, neonM, rimM });
  else if (isConcept(skin)) exhausts = buildConceptBody(root, skin, { paint, accent, dark, glass, headM, tailM, neonM });
  else {
    const body = new THREE.Mesh(G.bodyGeo, paint);
    body.castShadow = true;
    root.add(body);
    const cabin = new THREE.Mesh(G.cabinGeo, glass);
    cabin.castShadow = true;
    root.add(cabin);
    const skirt = new THREE.Mesh(G.skirtGeo, accent);
    root.add(skirt);

    // 车顶赛车条纹
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, 1.5), accent);
    stripe.position.set(0, 0.84, 1.45);
    stripe.rotation.x = 0.1;
    root.add(stripe);

    // 尾翼
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.07, 0.46), accent);
    wing.position.set(0, 1.36, -1.95);
    wing.rotation.x = -0.12;
    wing.castShadow = true;
    root.add(wing);
    const posts = [];
    for (const sx of [-0.62, 0.62]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.18), dark);
      post.position.set(sx, 1.12, -1.95);
      root.add(post);
      posts.push(post);
    }
    for (const sx of [-1.06, 1.06]) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.6), paint);
      plate.position.set(sx, 1.32, -1.97);
      root.add(plate);
    }

    // 车型差异（车库里买到的新车一眼能认出来）
    const add = (geo, m, x, y, z, rz = 0) => {
      const o = new THREE.Mesh(geo, m);
      o.position.set(x, y, z);
      o.rotation.z = rz;
      o.castShadow = true;
      root.add(o);
      return o;
    };
    if (skin.bodyType === 'gt') {
      // 天鹅颈大尾翼 + 引擎盖进气口 + 侧面散热口
      wing.scale.set(1.12, 1.2, 1.25);
      wing.position.set(0, 1.58, -2.02);
      for (const p of posts) { p.scale.y = 2.1; p.position.y = 1.2; }
      add(new THREE.BoxGeometry(0.72, 0.14, 0.95), dark, 0, 0.9, 0.95);
      for (const sx of [-1.045, 1.045]) for (const dz of [0, 0.22]) add(new THREE.BoxGeometry(0.03, 0.2, 0.12), dark, sx, 0.62, 0.55 + dz);
      add(new THREE.BoxGeometry(2.04, 0.08, 0.34), accent, 0, 0.28, 2.28);
    } else if (skin.bodyType === 'hyper') {
      // 鲨鱼鳍 + 双层尾翼 + 前鸭翼 + 前铲
      wing.position.y = 1.44;
      for (const p of posts) { p.scale.y = 1.4; p.position.y = 1.16; }
      add(new THREE.BoxGeometry(2.0, 0.05, 0.28), accent, 0, 1.2, -2.12);
      const fin = add(new THREE.BoxGeometry(0.05, 0.34, 1.5), paint, 0, 1.18, -1.25);
      fin.rotation.x = -0.12;
      for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.36, 0.03, 0.22), accent, sx * 0.94, 0.5, 2.16, sx * 0.3);
      add(new THREE.BoxGeometry(1.96, 0.05, 0.36), dark, 0, 0.24, 2.3);
    }

    // 车灯
    for (const sx of [-0.62, 0.62]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.12), headM);
      hl.position.set(sx, 0.64, 2.3);
      hl.rotation.x = -0.5;
      root.add(hl);
    }
    // 贯穿式尾灯 + 两侧灯组
    const tl = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.08), tailM);
    tl.position.set(0, 0.78, -2.39);
    root.add(tl);
    for (const sx of [-0.72, 0.72]) {
      const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.08), tailM);
      t2.position.set(sx, 0.74, -2.39);
      root.add(t2);
    }
    // 后扩散器
    const diff = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.3), dark);
    diff.position.set(0, 0.36, -2.3);
    root.add(diff);
    // 前格栅
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.1), dark);
    grille.position.set(0, 0.42, 2.4);
    root.add(grille);
    // 侧面霓虹灯条
    for (const sx of [-1.05, 1.05]) {
      const n = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 2.2), neonM);
      n.position.set(sx, 0.46, -0.5);
      root.add(n);
    }
    // 排气管
    exhausts = [];
    for (const sx of [-0.42, 0.42]) {
      const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 12), rimM);
      ex.rotation.x = Math.PI / 2;
      ex.position.set(sx, 0.4, -2.42);
      root.add(ex);
      exhausts.push(new THREE.Vector3(sx, 0.4, -2.56));
    }
  }

  // 底盘光
  const glowMat = new THREE.MeshBasicMaterial({
    color: skin.glow, map: softDotTexture(), transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const under = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5.6), glowMat);
  under.rotation.x = -Math.PI / 2;
  under.position.y = 0.06;
  car.add(under);

  // 车轮
  const wheels = [];
  const WH = skin.wheels;
  const wheelPos = WH ? [[-WH.x, WH.zf], [WH.x, WH.zf], [-WH.x, WH.zr], [WH.x, WH.zr]] : [[-0.93, 1.38], [0.93, 1.38], [-0.93, -1.38], [0.93, -1.38]];
  const tireScale = WH ? WH.w / 0.4 : 1;
  const ringM = skin.rimRing ? new THREE.MeshStandardMaterial({ color: skin.rimRing, emissive: skin.rimRing, emissiveIntensity: 1.2 }) : null;
  const hubM = skin.hub ? new THREE.MeshStandardMaterial({ color: skin.hub, emissive: skin.hub, emissiveIntensity: 1.5 }) : null;
  for (const [x, z] of wheelPos) {
    const steer = new THREE.Group();
    steer.position.set(x, 0.47, z);
    const spin = new THREE.Group();
    steer.add(spin);
    const t = new THREE.Mesh(kart ? G.kartTire : G.tire, tireM);
    t.castShadow = true;
    t.scale.x = tireScale;
    spin.add(t);
    const r = new THREE.Mesh(kart ? G.kartRim : G.rim, rimM);
    r.scale.x = tireScale;
    spin.add(r);
    // 概念车轮毂：外侧发光圈 / 发光中心
    const out = Math.sign(x) * (0.21 * tireScale + 0.01);
    if (ringM) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.022, 6, 28), ringM);
      ring.rotation.y = Math.PI / 2;
      ring.position.x = out;
      spin.add(ring);
    }
    if (hubM) {
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), hubM);
      hub.rotation.z = Math.PI / 2;
      hub.position.x = out;
      spin.add(hub);
    }
    for (let k = 0; k < 3; k++) {
      const sp = new THREE.Mesh(G.spoke, rimM);
      sp.rotation.x = (k * Math.PI) / 3;
      sp.scale.set(tireScale, kart ? 0.8 : 1, kart ? 0.62 : 1.1);
      spin.add(sp);
    }
    car.add(steer);
    wheels.push({ steer, spin, front: z > 0, x, z });
  }

  // 氮气尾焰（两个锥体，加色混合）
  const flameMatOuter = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3aa0ff).multiplyScalar(2.2), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const flameMatInner = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 2.5, 2.5), transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const flames = [];
  for (const e of exhausts) {
    const fg = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.6, 12, 1, true), flameMatOuter);
    outer.rotation.x = -Math.PI / 2;
    outer.position.z = -0.8;
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.9, 10, 1, true), flameMatInner);
    inner.rotation.x = -Math.PI / 2;
    inner.position.z = -0.45;
    fg.add(outer, inner);
    fg.position.copy(e);
    fg.visible = false;
    root.add(fg);
    flames.push(fg);
  }

  // 技巧提示光斑（车尾）
  const flare = new THREE.Sprite(flareMat('blue'));
  flare.position.set(0, 0.72, -2.75);
  flare.visible = false;
  flare.renderOrder = 4;
  root.add(flare);

  // 名字标签
  let tag = null;
  if (name) {
    const tex = textTexture(name, { w: 512, h: 96, fg: '#ffffff', font: 'bold 56px "PingFang SC","Microsoft YaHei",sans-serif', stroke: 'rgba(0,0,0,0.75)' });
    tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true }));
    tag.scale.set(4.2, 0.8, 1);
    tag.position.set(0, 2.5, 0);
    car.add(tag);
  }

  // 护盾（道具：天使）
  const shield = new THREE.Mesh(
    new THREE.SphereGeometry(2.9, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
  );
  shield.scale.set(1, 0.6, 1.25);
  shield.position.y = 0.8;
  shield.visible = false;
  car.add(shield);

  car.userData = { root, wheels, flames, exhausts, flameMatOuter, under, glowMat, tag, shield, skin, isPlayer, tailM, flare };
  return car;
}

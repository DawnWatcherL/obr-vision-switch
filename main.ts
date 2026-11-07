import OBR from '@owlbear-rodeo/sdk';
import type { Item } from '@owlbear-rodeo/sdk';
import './style.css';

const VISION = 'com.battle-system.smoke/visionRange';
const DARK = 'com.battle-system.smoke/visionDark';
const HAS = 'com.battle-system.smoke/hasVision';
const BACKUP = 'wow.vision-switch/originalRange';
const OPTED = 'wow.vision-switch/managed';
const app = document.querySelector<HTMLDivElement>('#app')!;
let items: Item[] = [];
let selected = new Set<string>();
let busy = false;
let night = false;

const n = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function eligible(item: Item): boolean {
  return n(item.metadata[VISION]) !== null && item.metadata[HAS] === true;
}
async function refresh() {
  items = (await OBR.scene.items.getItems()).filter(eligible);
  const valid = new Set(items.map(i => i.id));
  selected = new Set([...selected].filter(id => valid.has(id)));
  night = items.some(i => n(i.metadata[BACKUP]) !== null);
  render();
}
function render() {
  const rows = items.map(i => {
    const active = n(i.metadata[BACKUP]) !== null;
    const range = n(i.metadata[VISION]);
    const original = n(i.metadata[BACKUP]);
    return `<label class="token"><input type="checkbox" data-id="${esc(i.id)}" ${selected.has(i.id)?'checked':''}/><span class="name">${esc(i.name||'未命名角色')}<small>普通视野 ${range} · 黑暗视觉 ${n(i.metadata[DARK]) ?? '未设'}${active?` · 已暂存 ${original}`:''}</small></span></label>`;
  }).join('');
  app.innerHTML = `<h2>☀️ / 🌙 视野开关</h2><p class="sub">只修改所选角色的普通视野，黑暗视觉不变。</p>
    <div class="state">${night?'检测到已关闭普通视野的角色':'当前没有由本扩展关闭视野的角色'}</div>
    <div class="actions"><button id="off" ${busy?'disabled':''}>🌙 关灯</button><button id="on" ${busy?'disabled':''}>☀️ 开灯</button></div>
    <div class="toolbar"><strong>选择需要控制的 Token</strong><button id="reload">刷新</button></div>
    <p class="sub">显示所有启用了 Smoke 视野的 Token，不按图层或归属过滤；默认不选中任何 Token，请只勾选玩家角色。</p>
    <section>${rows || '<p>未找到已开启 Smoke 视野的 Token。</p>'}</section>
    <p class="foot">保护：第一次关灯保存原值；重复关灯不会覆盖备份。开灯时只恢复本扩展保存过的角色。关闭/重开面板不会丢失备份。</p>`;
  app.querySelectorAll<HTMLInputElement>('input[data-id]').forEach(el => el.onchange = () => { if(el.checked) selected.add(el.dataset.id!); else selected.delete(el.dataset.id!); });
  app.querySelector<HTMLButtonElement>('#off')!.onclick = () => void change(false);
  app.querySelector<HTMLButtonElement>('#on')!.onclick = () => void change(true);
  app.querySelector<HTMLButtonElement>('#reload')!.onclick = () => void refresh();
}
async function change(on: boolean) {
  if (busy) return;
  const ids = [...selected];
  if (!ids.length) { alert('请先勾选要控制的玩家角色。'); return; }
  busy = true; render();
  try {
    await OBR.scene.items.updateItems(ids, changed => {
      for (const item of changed) {
        const original = n(item.metadata[BACKUP]);
        if (on) {
          if (original !== null) {
            item.metadata[VISION] = original;
            delete item.metadata[BACKUP];
            delete item.metadata[OPTED];
          }
        } else {
          const current = n(item.metadata[VISION]);
          if (original === null && current !== null) item.metadata[BACKUP] = current;
          item.metadata[VISION] = 0;
          item.metadata[OPTED] = true;
        }
      }
    });
    await refresh();
  } catch (e) { alert('修改失败：' + String(e)); }
  finally { busy = false; render(); }
}
let subscribed = false;

async function loadScene() {
  try {
    if (!await OBR.scene.isReady()) {
      app.textContent = '正在等待 Owlbear 场景加载...';
      return;
    }
    await refresh();
    if (!subscribed) {
      subscribed = true;
      OBR.scene.items.onChange(() => {
        if (!busy) void refresh();
      });
    }
  } catch (e) {
    app.textContent = '场景加载失败：' + String(e);
  }
}

OBR.onReady(async () => {
  try {
    if ((await OBR.player.getRole()) !== 'GM') {
      app.textContent = '此控制器仅供 GM 使用。';
      return;
    }
    OBR.scene.onReadyChange(() => { void loadScene(); });
    await loadScene();
  } catch (e) {
    app.textContent = '初始化失败：' + String(e);
  }
});

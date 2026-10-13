/* ============================================================================
   main.js  -  ĐIỀU PHỐI CHUNG (nạp sau cùng)
   ----------------------------------------------------------------------------
   1. Chuyển tab:  showTab('pt' | 'hk' | 'dt' | 've')
   2. Nối các module với nhau qua sự kiện (giao thức do hai module tự định nghĩa):
        tientqn:dinhtam:send     Định Tâm  -> tab 1 hoặc 2: điền ô Hướng (°)
        tientqn:dinhtam:to-draw  Định Tâm  -> Công cụ vẽ:    chuyển sang tab 4
        tientqn:draw:send        Công cụ vẽ -> Định Tâm:     chuyển sang tab 3
   3. Gắn module Định Tâm (khi nạp trang) và Công cụ vẽ (lần đầu mở tab 4).

   Muốn thêm tab mới: thêm nút #btn-xx và <section id="tab-xx"> vào index.html,
   thêm 'xx' vào TABS bên dưới, rồi viết hàm khởi tạo trong showTab().
   ============================================================================ */

const TABS = ['pt', 'hk', 'dt', 've'];
const DEG_ID = { pt: 'pt_degreeInput', hk: 'hk_degreeInput' };   // tab 3 và 4 không có ô Hướng
let activeTab = 'pt';
let veMounted = false;

/* ---------- kích thước ---------- */
function tabbarHeight() {
    const tb = document.querySelector('.tabbar');
    return tb ? tb.offsetHeight : 50;
}
function updateTabbarHeight() {
    document.documentElement.style.setProperty('--tabbar-h', tabbarHeight() + 'px');
}
function veHeight() {
    return Math.max(420, window.innerHeight - tabbarHeight());
}
function sizeVe() {   // Công cụ vẽ cao đúng phần màn hình còn lại dưới thanh tab
    const root = document.querySelector('#tab-ve .dv-root');
    if (!root) return;
    root.style.setProperty('--dv-h', veHeight() + 'px');
    if (window.TIENTQN && TIENTQN.draw) TIENTQN.draw.resize();
}

/* ---------- vẽ lại tab đang mở ---------- */
function renderActive() {
    if (activeTab === 'pt') PT.updateData();
    else if (activeTab === 'hk') HK.updateData();
}

/* ---------- gắn Công cụ vẽ (lần đầu mở tab 4, lúc khung đã hiện để đo đúng kích thước) ---------- */
function mountDraw() {
    if (veMounted) return;
    veMounted = true;
    // Công cụ vẽ gắn phím tắt (Space, Delete, Ctrl+Z, Ctrl+A...) vào window và chỉ kiểm tra focus.
    // Nếu không chặn, các phím này vẫn chạy khi bạn đang ở tab khác. Bọc lại để chỉ chạy khi tab 4 đang mở.
    const orig = window.addEventListener;
    window.addEventListener = function (type, fn, opt) {
        if (type === 'keydown' && typeof fn === 'function') {
            const f = fn;
            fn = function (e) { if (activeTab === 've') return f.call(this, e); };
        }
        return orig.call(this, type, fn, opt);
    };
    try {
        DrawApp.mount(document.getElementById('tab-congcuve'), { height: veHeight() + 'px' });
    } finally {
        delete window.addEventListener;   // trả lại hàm gốc
    }
}

/* ---------- chuyển tab ---------- */
function showTab(name) {
    if (name === activeTab) return;
    // Giữ nguyên Hướng (°) khi chuyển giữa tab 1 và tab 2
    const from = DEG_ID[activeTab] && document.getElementById(DEG_ID[activeTab]);
    const to   = DEG_ID[name] && document.getElementById(DEG_ID[name]);
    if (from && to) to.value = from.value;

    activeTab = name;
    TABS.forEach(t => {
        const on = (t === name);
        document.getElementById('tab-' + t).classList.toggle('active', on);
        const b = document.getElementById('btn-' + t);
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on);
    });
    document.body.classList.toggle('on-ve', name === 've');
    document.getElementById('toast').classList.remove('show');   // thông báo cũ không đè lên tab mới

    renderActive();
    if (name === 've') { mountDraw(); requestAnimationFrame(sizeVe); }
    if (name === 'dt' && window.TIENTQN && TIENTQN.dinhTam) requestAnimationFrame(() => TIENTQN.dinhTam.recompute());
    window.scrollTo(0, 0);
}

/* ---------- thông báo nhỏ ---------- */
let toastTimer = null;
function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
}

/* ---------- Định Tâm -> tab 1 / tab 2: nhận Hướng ---------- */
document.addEventListener('tientqn:dinhtam:send', function (e) {
    const d = e.detail || {};
    const pl = d.payload;
    const tab = { lacviet: 'pt', hkpt: 'hk' }[d.target];
    if (!pl || !tab) return;
    const h = pl.phongThuy && pl.phongThuy.huong;
    if (!h || !isFinite(h.angleInRef)) return;

    const deg = Math.round(h.angleInRef * 10) / 10;        // góc hướng theo hệ quy chiếu đã chọn (Bắc thật / Bắc từ)
    document.getElementById(DEG_ID[tab]).value = String(deg);
    showTab(tab);                                           // chuyển tab và vẽ lại với Hướng mới

    const ref = pl.phongThuy.refFrame === 'mag' ? 'Bắc từ' : 'Bắc thật';
    toast('Đã nhận Hướng ' + String(deg).replace('.', ',') + '° (' + ref + ') từ tab Định Tâm: sơn ' + h.son + ', cung ' + h.cung + ' (' + h.que + ').');
    // module vừa hiện dòng "tab nhận cần có mã lắng nghe": nay đã có người nhận nên ẩn đi
    setTimeout(() => { const m = document.getElementById('dt-msg'); if (m) m.hidden = true; }, 0);
});

/* ---------- Định Tâm -> Công cụ vẽ ---------- */
document.addEventListener('tientqn:dinhtam:to-draw', function (e) {
    const first = !veMounted;
    showTab('ve');
    // Lần đầu: Công cụ vẽ vừa gắn xong nên chưa kịp nghe sự kiện đang phát, gửi lại một lần
    if (first) setTimeout(() => document.dispatchEvent(new CustomEvent('tientqn:dinhtam:to-draw', { detail: e.detail })), 80);
});

/* ---------- Công cụ vẽ -> Định Tâm ---------- */
document.addEventListener('tientqn:draw:send', function () {
    showTab('dt');
    setTimeout(() => { const s = document.getElementById('dt-s2'); if (s) s.scrollIntoView({ behavior: 'smooth' }); }, 150);
});

/* ---------- khởi động ---------- */
DinhTamApp.mount(document.getElementById('tab-dinhtam'));

window.addEventListener('load', () => { updateTabbarHeight(); renderActive(); });
window.addEventListener('resize', () => {
    updateTabbarHeight();
    setTimeout(() => { renderActive(); if (activeTab === 've') sizeVe(); }, 250);
});

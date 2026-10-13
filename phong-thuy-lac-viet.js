/* ============================================================================
   phong-thuy-lac-viet.js  -  TAB 1: PHONG THỦY LẠC VIỆT & CỔ THƯ
   ----------------------------------------------------------------------------
   Xuất ra biến toàn cục:  PT  (PT.updateData() vẽ lại toàn bộ tab)
   Đọc các ô nhập (index.html):  pt_yearInput, pt_genderSelect, pt_degreeInput
   Gồm:
     - Bát Trạch, Hoá Khí, Huyệt khí Bảo Châu: 4 biểu đồ canvas (pt_canvas...)
     - renderPhienTinh(): bảng Phiên tinh phòng
     - renderDongTho():   bảng Động thổ / Cưới hỏi (DT_TAMTAI, DT_HOANGOC, DT_KIMLAU)
   Không phụ thuộc file JS nào khác. Việc gọi updateData() khi nạp trang,
   đổi cỡ cửa sổ và chuyển tab do main.js đảm nhiệm.
   ============================================================================ */

const PT = (function(){
/* =========== DỮ LIỆU CHUNG =========== */
const SON24=[
    {name:'Nhâm',deg:345,start:337.5,end:352.5},{name:'Tý',deg:0,start:352.5,end:7.5},{name:'Quý',deg:15,start:7.5,end:22.5},
    {name:'Sửu',deg:30,start:22.5,end:37.5},{name:'Cấn',deg:45,start:37.5,end:52.5},{name:'Dần',deg:60,start:52.5,end:67.5},
    {name:'Giáp',deg:75,start:67.5,end:82.5},{name:'Mão',deg:90,start:82.5,end:97.5},{name:'Ất',deg:105,start:97.5,end:112.5},
    {name:'Thìn',deg:120,start:112.5,end:127.5},{name:'Tốn',deg:135,start:127.5,end:142.5},{name:'Tỵ',deg:150,start:142.5,end:157.5},
    {name:'Bính',deg:165,start:157.5,end:172.5},{name:'Ngọ',deg:180,start:172.5,end:187.5},{name:'Đinh',deg:195,start:187.5,end:202.5},
    {name:'Mùi',deg:210,start:202.5,end:217.5},{name:'Khôn',deg:225,start:217.5,end:232.5},{name:'Thân',deg:240,start:232.5,end:247.5},
    {name:'Canh',deg:255,start:247.5,end:262.5},{name:'Dậu',deg:270,start:262.5,end:277.5},{name:'Tân',deg:285,start:277.5,end:292.5},
    {name:'Tuất',deg:300,start:292.5,end:307.5},{name:'Càn',deg:315,start:307.5,end:322.5},{name:'Hợi',deg:330,start:322.5,end:337.5}
];

const DU_NIEN = {
    'Càn': {'Càn':'Phục Vị', 'Khảm':'Lục Sát', 'Cấn':'Thiên Y', 'Chấn':'Ngũ Quỷ', 'Tốn':'Họa Hại', 'Ly':'Tuyệt Mạng', 'Khôn':'Phúc Đức', 'Đoài':'Sinh Khí'},
    'Khảm': {'Càn':'Lục Sát', 'Khảm':'Phục Vị', 'Cấn':'Ngũ Quỷ', 'Chấn':'Thiên Y', 'Tốn':'Sinh Khí', 'Ly':'Phúc Đức', 'Khôn':'Tuyệt Mạng', 'Đoài':'Họa Hại'},
    'Cấn': {'Càn':'Thiên Y', 'Khảm':'Ngũ Quỷ', 'Cấn':'Phục Vị', 'Chấn':'Lục Sát', 'Tốn':'Tuyệt Mạng', 'Ly':'Họa Hại', 'Khôn':'Sinh Khí', 'Đoài':'Phúc Đức'},
    'Chấn': {'Càn':'Ngũ Quỷ', 'Khảm':'Thiên Y', 'Cấn':'Lục Sát', 'Chấn':'Phục Vị', 'Tốn':'Phúc Đức', 'Ly':'Sinh Khí', 'Khôn':'Họa Hại', 'Đoài':'Tuyệt Mạng'},
    'Tốn': {'Càn':'Họa Hại', 'Khảm':'Sinh Khí', 'Cấn':'Tuyệt Mạng', 'Chấn':'Phúc Đức', 'Tốn':'Phục Vị', 'Ly':'Thiên Y', 'Khôn':'Ngũ Quỷ', 'Đoài':'Lục Sát'},
    'Ly': {'Càn':'Tuyệt Mạng', 'Khảm':'Phúc Đức', 'Cấn':'Họa Hại', 'Chấn':'Sinh Khí', 'Tốn':'Thiên Y', 'Ly':'Phục Vị', 'Khôn':'Lục Sát', 'Đoài':'Ngũ Quỷ'},
    'Khôn': {'Càn':'Phúc Đức', 'Khảm':'Tuyệt Mạng', 'Cấn':'Sinh Khí', 'Chấn':'Họa Hại', 'Tốn':'Ngũ Quỷ', 'Ly':'Lục Sát', 'Khôn':'Phục Vị', 'Đoài':'Thiên Y'},
    'Đoài': {'Càn':'Sinh Khí', 'Khảm':'Họa Hại', 'Cấn':'Phúc Đức', 'Chấn':'Tuyệt Mạng', 'Tốn':'Lục Sát', 'Ly':'Ngũ Quỷ', 'Khôn':'Thiên Y', 'Đoài':'Phục Vị'}
};

const HUONG = [{deg: 0}, {deg: 45}, {deg: 90}, {deg: 135}, {deg: 180}, {deg: 225}, {deg: 270}, {deg: 315}];
const DIR_TRADITIONAL = ['Khảm', 'Cấn', 'Chấn', 'Tốn', 'Ly', 'Khôn', 'Đoài', 'Càn'];
const DIR_LACVIET     = ['Khảm', 'Cấn', 'Chấn', 'Khôn', 'Ly', 'Tốn', 'Đoài', 'Càn'];

const HOA_KHI_DATA = {
    0:   { label: ['SỰ NGHIỆP'], color: '#e71d25' }, 
    45:  { label: ['TRI THỨC'], color: '#f1d115' }, 
    90:  { label: ['GIA ĐÌNH', 'SỨC KHỎE'], color: '#e71d25' }, 
    135: { label: ['PHÚ QUÝ'], color: '#f1d115' }, 
    180: { label: ['DANH TIẾNG', 'ĐỊA VỊ'], color: '#e71d25' }, 
    225: { label: ['HÔN NHÂN'], color: '#e71d25' }, 
    270: { label: ['CON CÁI'], color: '#f1d115' }, 
    315: { label: ['QUÝ NHÂN'], color: '#f1d115' } 
};

const HK_HIGHLIGHTS = {
    'Nhâm': '#f1d115', 'Giáp': '#f1d115', 'Ất': '#f1d115', 'Bính': '#f1d115', 'Thân': '#f1d115',
    'Sửu': '#e71d25', 'Thìn': '#e71d25', 'Tỵ': '#e71d25', 'Canh': '#e71d25', 'Hợi': '#e71d25'
};

const QUAI_COLORS = {
    'Càn': '#2b4a9b', 'Khảm': '#2b4a9b', 
    'Cấn': '#279b4a', 'Chấn': '#279b4a', 
    'Khôn': '#e71d25', 'Ly': '#e71d25', 
    'Tốn': '#ffffff', 'Đoài': '#ffffff' 
};

const QUAI_SYMBOLS = {'Càn':'☰', 'Khảm':'☵', 'Cấn':'☶', 'Chấn':'☳', 'Tốn':'☴', 'Ly':'☲', 'Khôn':'☷', 'Đoài':'☱'};

const GUA_64 = [
    "Khôn", "Bác", "Tỷ", "Quan", "Dự", "Tấn", "Tụy", "Bĩ", "Khiêm", "Cấn", "Kiển", "Tiệm", "Tiểu Quá", "Lữ", "Hàm", "Độn",
    "Sư", "Mông", "Khảm", "Hoán", "Giải", "Vị Tế", "Khốn", "Tụng", "Thăng", "Cổ", "Tỉnh", "Tốn", "Hằng", "Đỉnh", "Đại Quá", "Cấu",
    "Phục", "Di", "Truân", "Ích", "Chấn", "Phệ Hạp", "Tùy", "Vô Vọng", "Minh Di", "Bí", "Ký Tế", "Gia Nhân", "Phong", "Ly", "Cách", "Đồng Nhân",
    "Lâm", "Tổn", "Tiết", "Trung Phu", "Quy Muội", "Khuê", "Đoài", "Lý", "Thái", "Đại Súc", "Nhu", "Tiểu Súc", "Đại Tráng", "Đại Hữu", "Quải", "Kiền"
];

/* =========== DỮ LIỆU PHIÊN TINH PHÒNG =========== */
const PT_COLS = [
    {name: "HỌA HẠI", sub: "LỘC TỒN<br>- Mộc", good: false},
    {name: "THIÊN Y", sub: "CỰ MÔN<br>+ Hoả Thổ", good: true},
    {name: "PHÚC ĐỨC", sub: "VŨ KHÚC<br>- Kim", good: true},
    {name: "LỤC SÁT", sub: "VĂN KHÚC<br>- Thuỷ", good: false},
    {name: "SINH KHÍ", sub: "THAM LANG<br>+ Mộc", good: true},
    {name: "NGŨ QUỶ", sub: "LIÊM TRINH<br>- Hoả", good: false},
    {name: "TUYỆT MẠNG", sub: "PHÁ QUÂN<br>+ Kim", good: false},
    {name: "PHỤC VỊ", sub: "TẢ PHÙ<br>- Kim Thuỷ", good: true}
];

const PT_ROWS = [
    {quai: 'Càn', cells: ['Tốn', 'Cấn', 'Khôn', 'Khảm', 'Đoài', 'Chấn', 'Ly', 'Càn']},
    {quai: 'Khảm', cells: ['Đoài', 'Chấn', 'Ly', 'Càn', 'Tốn', 'Cấn', 'Khôn', 'Khảm']},
    {quai: 'Cấn', cells: ['Ly', 'Càn', 'Đoài', 'Chấn', 'Khôn', 'Khảm', 'Tốn', 'Cấn']},
    {quai: 'Chấn', cells: ['Khôn', 'Khảm', 'Tốn', 'Cấn', 'Ly', 'Càn', 'Đoài', 'Chấn']},
    {quai: 'Khôn', cells: ['Chấn', 'Đoài', 'Càn', 'Ly', 'Cấn', 'Tốn', 'Khảm', 'Khôn']},
    {quai: 'Ly', cells: ['Cấn', 'Tốn', 'Khảm', 'Khôn', 'Chấn', 'Đoài', 'Càn', 'Ly']},
    {quai: 'Tốn', cells: ['Càn', 'Ly', 'Chấn', 'Đoài', 'Khảm', 'Khôn', 'Cấn', 'Tốn']},
    {quai: 'Đoài', cells: ['Khảm', 'Khôn', 'Cấn', 'Tốn', 'Càn', 'Ly', 'Chấn', 'Đoài']}
];

/* =========== CÁC HÀM TÍNH TOÁN =========== */
function toR(d){return(d-90)*Math.PI/180}
function sumDigits(num) {
    let sum = 0;
    while(num > 0) { sum += num % 10; num = Math.floor(num / 10); }
    return sum;
}
function getQuaiNum(year, gender) {
    let sum = sumDigits(year);
    while (sum > 9) sum = sumDigits(sum);
    let quaiNum;
    if (gender === 'nam') {
        quaiNum = (11 - sum) % 9;
        if (quaiNum === 0) quaiNum = 9;
        if (quaiNum === 5) quaiNum = 2;
    } else {
        quaiNum = (4 + sum) % 9;
        if (quaiNum === 0) quaiNum = 9;
        if (quaiNum === 5) quaiNum = 8;
    }
    return quaiNum;
}
function getCungPhi(quaiNum, system) {
    const mapCothu  = {1:'Khảm', 2:'Khôn', 3:'Chấn', 4:'Tốn', 6:'Càn', 7:'Đoài', 8:'Cấn', 9:'Ly'};
    const mapLacviet = {1:'Khảm', 2:'Khôn', 3:'Chấn', 4:'Tốn', 6:'Càn', 7:'Ly', 8:'Cấn', 9:'Đoài'};
    return system === 'lacviet' ? mapLacviet[quaiNum] : mapCothu[quaiNum];
}
function getSysName(idx, sys) {
    const base = SON24[idx].name;
    if (sys === 'lacviet' || sys === 'hoakhi' || sys === 'baochau') {
        if (idx === 10) return 'Khôn'; 
        if (idx === 16) return 'Tốn';  
    }
    return base;
}
function getHuongCung(deg, system) {
    if (deg === null || isNaN(deg)) return null;
    let normDeg = (deg % 360 + 360) % 360;
    let idx = Math.floor((normDeg + 22.5) / 45) % 8;
    const dirMap = system === 'lacviet' ? DIR_LACVIET : DIR_TRADITIONAL;
    return dirMap[idx];
}

function formatStarName(str) {
    return str.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
}

/* =========== HIỂN THỊ PHIÊN TINH PHÒNG =========== */
function renderPhienTinh(cungPhiLV, huongCungLV) {
    const yinYangSVG = `
        <svg width="44" height="44" viewBox="0 0 100 100" style="display:block; margin: 0 auto;">
          <circle cx="50" cy="50" r="48" fill="#fff" stroke="#111" stroke-width="2"/>
          <path d="M 50,2 A 48,48 0 0,1 50,98 Z" fill="#e71d25"/>
          <path d="M 50,98 A 48,48 0 0,1 50,2 Z" fill="#2b4a9b"/>
          <circle cx="50" cy="26" r="24" fill="#2b4a9b"/>
          <circle cx="50" cy="74" r="24" fill="#e71d25"/>
        </svg>
    `;

    let tableHTML = `<table class="pt-table"><thead><tr><th style="padding: 4px; vertical-align: middle;">${yinYangSVG}</th>`;
    
    PT_COLS.forEach(col => {
        tableHTML += `<th><b>${col.name}</b><br>${col.sub}</th>`;
    });
    tableHTML += `</tr></thead><tbody>`;

    let activeColIdx = -1;

    PT_ROWS.forEach(row => {
        let isRowActive = (row.quai === cungPhiLV);
        tableHTML += `<tr class="${isRowActive ? 'highlight-row' : ''}">`;
        tableHTML += `<th><span class="quai-sym">${QUAI_SYMBOLS[row.quai]}</span>${row.quai.toUpperCase()}</th>`;

        row.cells.forEach((cellQuai, cIdx) => {
            let isCellActive = (isRowActive && cellQuai === huongCungLV);
            if (isCellActive) activeColIdx = cIdx;
            tableHTML += `<td class="${isCellActive ? 'highlight-cell' : ''}">
                <span class="quai-sym">${QUAI_SYMBOLS[cellQuai]}</span>${cellQuai.toUpperCase()}
            </td>`;
        });
        tableHTML += `</tr>`;
    });
    tableHTML += `</tbody></table>`;
    document.getElementById('pt_ptTableContainer').innerHTML = tableHTML;

    // Ứng dụng
    let appText = "";
    if (huongCungLV) {
        let goodRooms = [];
        for (let i = 1; i <= 25; i++) {
            let colIdx = (activeColIdx + i - 1) % 8;
            if (PT_COLS[colIdx].good) {
                goodRooms.push(`${i} (${formatStarName(PT_COLS[colIdx].name)})`);
            }
        }
        
        let startStar = PT_COLS[activeColIdx];
        appText = `
        1. Lấy Mệnh Trạch chủ <b>${cungPhiLV.toUpperCase()}</b> phối Hướng nhà <b>${huongCungLV.toUpperCase()}</b> sinh ra sao <b>${formatStarName(startStar.name)}</b> (Ngăn Phòng/Tầng số 1).<br>
        2. Vị trí có Sao Tốt sẽ rơi vào các Ngăn phòng/ Tầng thứ: 
        <b style="color:#d32f2f; font-size:1.1rem; display:block; margin-top:8px; line-height: 1.6;">${goodRooms.join(', ')}...</b>`;
    } else {
        appText = "<i>Vui lòng nhập Hướng Nhà (°) ở trên cùng để tính toán chính xác vị trí tầng/phòng tốt dành riêng cho bạn.</i>";
    }
    document.getElementById('pt_ptAppText').innerHTML = appText;
}

/* =========== VẼ ĐỒ HÌNH CHUNG =========== */
function drawOuterRings(ctx, cx, cy, system, R_OUTER, R_SON_OUTER, R_DEG_TEXT) {
    for(let i=0; i<SON24.length; i++){
        let s = Object.assign({}, SON24[i]);
        s.name = getSysName(i, system);

        const startRad = toR(s.start);
        const endRad = toR(s.end);
        const midRad = toR(s.deg);

        let bgCol = '#ffffff';
        if (system === 'hoakhi' && HK_HIGHLIGHTS[s.name]) {
            bgCol = HK_HIGHLIGHTS[s.name];
        }
        
        ctx.beginPath();
        ctx.arc(cx, cy, R_SON_OUTER, startRad, endRad);
        ctx.arc(cx, cy, R_OUTER, endRad, startRad, true);
        ctx.closePath();
        ctx.fillStyle = bgCol;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.save();
        const R_son_center = (R_OUTER + R_SON_OUTER)/2;
        ctx.translate(cx+R_son_center*Math.cos(midRad), cy+R_son_center*Math.sin(midRad));
        ctx.rotate(midRad+Math.PI/2);
        
        ctx.fillStyle = (bgCol === '#e71d25') ? '#ffffff' : '#111';
        ctx.font='bold 14px "Segoe UI",sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(s.name,0,0);
        ctx.restore();

        const er = toR(s.end);
        ctx.beginPath(); ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=0.7;
        ctx.moveTo(cx+R_SON_OUTER*Math.cos(er), cy+R_SON_OUTER*Math.sin(er));
        ctx.lineTo(cx+(R_DEG_TEXT-5)*Math.cos(er), cy+(R_DEG_TEXT-5)*Math.sin(er)); ctx.stroke();

        const mr = toR(s.deg);
        ctx.beginPath(); ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5;
        ctx.moveTo(cx+R_SON_OUTER*Math.cos(mr), cy+R_SON_OUTER*Math.sin(mr));
        ctx.lineTo(cx+(R_DEG_TEXT-5)*Math.cos(mr), cy+(R_DEG_TEXT-5)*Math.sin(mr)); ctx.stroke();

        ctx.save();
        ctx.translate(cx+R_DEG_TEXT*Math.cos(mr), cy+R_DEG_TEXT*Math.sin(mr));
        ctx.rotate(mr+Math.PI/2);
        ctx.fillStyle='#333'; ctx.font='bold 10px "Segoe UI",sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(`${s.deg}°`,0,0);
        ctx.restore();

        ctx.save();
        ctx.translate(cx+R_DEG_TEXT*Math.cos(er), cy+R_DEG_TEXT*Math.sin(er));
        ctx.rotate(er+Math.PI/2);
        ctx.fillStyle='#777'; ctx.font='500 9px "Segoe UI",sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(`${s.end}°`,0,0);
        ctx.restore();
    }
    ctx.beginPath();ctx.arc(cx,cy,R_SON_OUTER,0,2*Math.PI);ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=1.2;ctx.stroke();
}

function drawFacingArrow(ctx, cx, cy, facingDeg, R_DEG_TEXT) {
    if (facingDeg !== null && !isNaN(facingDeg) && facingDeg >= 0 && facingDeg <= 360) {
        const rad = toR(facingDeg);
        const radBack = toR(facingDeg + 180);
        const arrowLen = R_DEG_TEXT + 12; 
        
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.9)'; 
        ctx.lineWidth = 1.5; 
        ctx.moveTo(cx + arrowLen * Math.cos(radBack), cy + arrowLen * Math.sin(radBack));
        ctx.lineTo(cx + arrowLen * Math.cos(rad), cy + arrowLen * Math.sin(rad));
        ctx.stroke();
        
        ctx.beginPath();
        ctx.fillStyle = 'rgba(231, 76, 60, 0.9)';
        const headLen = 16;
        const headWidth = 0.035; 
        ctx.moveTo(cx + (arrowLen + headLen) * Math.cos(rad), cy + (arrowLen + headLen) * Math.sin(rad));
        ctx.lineTo(cx + arrowLen * Math.cos(rad - headWidth), cy + arrowLen * Math.sin(rad - headWidth));
        ctx.lineTo(cx + arrowLen * Math.cos(rad + headWidth), cy + arrowLen * Math.sin(rad + headWidth));
        ctx.fill();
    }
}

function drawBatTrach(canvasId, system, year, gender, facingDeg, subId) {
    const canvas = document.getElementById(canvasId); if(!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = 580, H = 580;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    
    const cx = W / 2, cy = H / 2;
    const R_DEG_TEXT = 275; const R_SON_OUTER = 245; 
    const R_OUTER = 195; const R_MID = 130; const R_INNER = 70;

    const quaiNum = getQuaiNum(year, gender);
    const cungPhi = getCungPhi(quaiNum, system);
    const dirMap = system === 'lacviet' ? DIR_LACVIET : DIR_TRADITIONAL;
    const nhomMenh = ['Khảm', 'Ly', 'Chấn', 'Tốn'].includes(cungPhi) ? 'Đông Tứ Mệnh' : 'Tây Tứ Mệnh';
    
    const se = document.getElementById(subId);
    if(se) se.innerHTML = `Năm Sinh: <b>${year}</b> · Giới Tính: <b>${gender === 'nam' ? 'Nam' : 'Nữ'}</b><br>Cung Phi: <b>${cungPhi} (${quaiNum}) - ${nhomMenh}</b>`;

    ctx.lineWidth = 1.2;

    for (let i = 0; i < 8; i++) {
        const huongInfo = HUONG[i];
        const dirCung = dirMap[i];
        const duNien = DU_NIEN[cungPhi][dirCung];
        
        const startRad = toR(huongInfo.deg - 22.5);
        const endRad = toR(huongInfo.deg + 22.5);
        const midRad = toR(huongInfo.deg);

        const isGood = ['Sinh Khí', 'Thiên Y', 'Phúc Đức', 'Phục Vị'].includes(duNien);
        const bgColor = isGood ? '#ffe500' : '#ffffff'; 

        ctx.beginPath();
        ctx.arc(cx, cy, R_OUTER, startRad, endRad);
        ctx.arc(cx, cy, R_MID, endRad, startRad, true);
        ctx.closePath();
        ctx.fillStyle = bgColor; ctx.fill();
        ctx.strokeStyle = '#222'; ctx.stroke();

        ctx.save();
        const rTextOuter = (R_OUTER + R_MID) / 2;
        ctx.translate(cx + rTextOuter * Math.cos(midRad), cy + rTextOuter * Math.sin(midRad));
        ctx.rotate(midRad + Math.PI/2);
        ctx.fillStyle = '#000'; ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(duNien.toUpperCase(), 0, 0);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx, cy, R_MID, startRad, endRad);
        ctx.arc(cx, cy, R_INNER, endRad, startRad, true);
        ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();

        ctx.save();
        const rTextMid = (R_MID + R_INNER) / 2;
        ctx.translate(cx + rTextMid * Math.cos(midRad), cy + rTextMid * Math.sin(midRad));
        ctx.rotate(midRad + Math.PI/2);
        
        const hLabel = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'][i];
        ctx.fillStyle = '#555'; ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(hLabel.toUpperCase(), 0, -12);
        ctx.fillStyle = '#000'; ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.fillText(dirCung, 0, 10);
        ctx.restore();
    }

    drawOuterRings(ctx, cx, cy, system, R_OUTER, R_SON_OUTER, R_DEG_TEXT);

    ctx.beginPath(); ctx.arc(cx, cy, R_INNER, 0, 2*Math.PI);
    ctx.fillStyle = '#ffe500'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.fillStyle = '#000'; ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(cungPhi, cx, cy - 8);
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText(QUAI_SYMBOLS[cungPhi], cx, cy + 22);

    drawFacingArrow(ctx, cx, cy, facingDeg, R_DEG_TEXT);
}

function drawHoaKhi(canvasId, facingDeg, subId) {
    const canvas = document.getElementById(canvasId); if(!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = 580, H = 580;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    
    const cx = W / 2, cy = H / 2;
    const R_DEG_TEXT = 275; const R_SON_OUTER = 245; 
    const R_OUTER = 195; const R_MID = 110; const R_INNER = 55;

    const se = document.getElementById(subId);
    if(se) se.innerHTML = `Tính thừa khí du niên theo mô hình Lạc Việt<br>`;

    ctx.lineWidth = 1.2;

    for (let i = 0; i < 8; i++) {
        const huongInfo = HUONG[i];
        const data = HOA_KHI_DATA[huongInfo.deg];
        const dirCung = DIR_LACVIET[i]; 
        
        const startRad = toR(huongInfo.deg - 22.5);
        const endRad = toR(huongInfo.deg + 22.5);
        const midRad = toR(huongInfo.deg);

        ctx.beginPath();
        ctx.arc(cx, cy, R_OUTER, startRad, endRad);
        ctx.arc(cx, cy, R_MID, endRad, startRad, true);
        ctx.closePath();
        ctx.fillStyle = data.color; ctx.fill();
        ctx.strokeStyle = '#222'; ctx.stroke();

        ctx.save();
        const rTextOuter = (R_OUTER + R_MID) / 2;
        ctx.translate(cx + rTextOuter * Math.cos(midRad), cy + rTextOuter * Math.sin(midRad));
        ctx.rotate(midRad + Math.PI/2);
        
        ctx.fillStyle = (data.color === '#e71d25') ? '#fff' : '#000';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        
        if (data.label.length === 1) {
            ctx.fillText(data.label[0], 0, 0);
        } else {
            ctx.fillText(data.label[0], 0, -10);
            ctx.fillText(data.label[1], 0, 12);
        }
        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx, cy, R_MID, startRad, endRad);
        ctx.arc(cx, cy, R_INNER, endRad, startRad, true);
        ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();

        ctx.save();
        const rTextMid = (R_MID + R_INNER) / 2; 
        ctx.translate(cx + rTextMid * Math.cos(midRad), cy + rTextMid * Math.sin(midRad));
        ctx.rotate(midRad + Math.PI/2);
        
        ctx.font = 'bold 42px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        
        const quaiColor = QUAI_COLORS[dirCung];
        ctx.fillStyle = quaiColor;
        
        if (quaiColor === '#ffffff') {
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#222';
            ctx.strokeText(QUAI_SYMBOLS[dirCung], 0, 0);
        } else {
            ctx.fillText(QUAI_SYMBOLS[dirCung], 0, 0);
        }
        ctx.restore();
    }

    drawOuterRings(ctx, cx, cy, 'hoakhi', R_OUTER, R_SON_OUTER, R_DEG_TEXT);

    const tcR = 40;
    ctx.beginPath(); ctx.arc(cx, cy, R_INNER, 0, 2*Math.PI);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath(); ctx.arc(0, 0, tcR, -Math.PI/2, Math.PI/2);
    ctx.fillStyle = '#e71d25'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, tcR, Math.PI/2, 3*Math.PI/2);
    ctx.fillStyle = '#2b4a9b'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -tcR/2, tcR/2, 0, 2*Math.PI);
    ctx.fillStyle = '#2b4a9b'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, tcR/2, tcR/2, 0, 2*Math.PI);
    ctx.fillStyle = '#e71d25'; ctx.fill();
    ctx.restore();

    drawFacingArrow(ctx, cx, cy, facingDeg, R_DEG_TEXT);
}

function drawHuyetKhi(canvasId, facingDeg, subId) {
    const canvas = document.getElementById(canvasId); if(!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = 580, H = 580;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    
    const cx = W / 2, cy = H / 2;
    const R_DEG_TEXT = 280; const R_64 = 250; 
    const R_72 = 195; const R_24_IN = 135; const R_8 = 85; const R_CENTER = 40;

    const se = document.getElementById(subId);
    if(se) se.innerHTML = `<b>Màu Vàng: Tuyến vị Vượng Tướng (Chính Khí / Bảo Châu)</b>`;

    const branchStems = [
        ['Giáp', 'Bính', 'Mậu', 'Canh', 'Nhâm'], // Tý 
        ['Ất', 'Đinh', 'Kỷ', 'Tân', 'Quý'],      // Sửu 
        ['Bính', 'Mậu', 'Canh', 'Nhâm', 'Giáp'], // Dần 
        ['Đinh', 'Kỷ', 'Tân', 'Quý', 'Ất'],      // Mão 
        ['Mậu', 'Canh', 'Nhâm', 'Giáp', 'Bính'], // Thìn 
        ['Kỷ', 'Tân', 'Quý', 'Ất', 'Đinh'],      // Tỵ 
        ['Canh', 'Nhâm', 'Giáp', 'Bính', 'Mậu'], // Ngọ 
        ['Tân', 'Quý', 'Ất', 'Đinh', 'Kỷ'],      // Mùi 
        ['Nhâm', 'Giáp', 'Bính', 'Mậu', 'Canh'], // Thân 
        ['Quý', 'Ất', 'Đinh', 'Kỷ', 'Tân'],      // Dậu 
        ['Giáp', 'Bính', 'Mậu', 'Canh', 'Nhâm'], // Tuất 
        ['Ất', 'Đinh', 'Kỷ', 'Tân', 'Quý']       // Hợi 
    ];
    
    let cells72 = [];
    for (let m = 0; m < 24; m++) {
        let branchIndex = Math.floor(m / 2); 
        let stems = branchStems[branchIndex];
        const isYellow = (s) => ['Bính','Đinh','Canh','Tân'].includes(s);
        if (m % 2 === 0) {
            cells72.push({text: '', yellow: false});
            cells72.push({text: stems[0], yellow: isYellow(stems[0])});
            cells72.push({text: stems[1], yellow: isYellow(stems[1])});
        } else {
            cells72.push({text: stems[2], yellow: isYellow(stems[2])});
            cells72.push({text: stems[3], yellow: isYellow(stems[3])});
            cells72.push({text: stems[4], yellow: isYellow(stems[4])});
        }
    }

    ctx.lineWidth = 0.8;
    for (let i = 0; i < 64; i++) {
        let startDeg = 337.5 + i * (360/64); 
        let endDeg = startDeg + (360/64);
        let midDeg = startDeg + (360/128);

        ctx.beginPath();
        ctx.arc(cx, cy, R_64, toR(startDeg), toR(endDeg));
        ctx.arc(cx, cy, R_72, toR(endDeg), toR(startDeg), true);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.stroke();

        ctx.save();
        const rText = (R_64 + R_72) / 2;
        ctx.translate(cx + rText * Math.cos(toR(midDeg)), cy + rText * Math.sin(toR(midDeg)));
        let angle = toR(midDeg);
        if (angle > Math.PI/2 && angle < 3*Math.PI/2) ctx.rotate(angle + Math.PI);
        else ctx.rotate(angle);
        
        ctx.fillStyle = '#333';
        ctx.font = '600 10.5px "Segoe UI", sans-serif'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(GUA_64[i], 0, 0);
        ctx.restore();
    }

    for (let i = 0; i < 72; i++) {
        let cell = cells72[i];
        let startDeg = 337.5 + i * 5;
        let endDeg = startDeg + 5;
        let midDeg = startDeg + 2.5;

        ctx.beginPath();
        ctx.arc(cx, cy, R_72, toR(startDeg), toR(endDeg));
        ctx.arc(cx, cy, R_24_IN, toR(endDeg), toR(startDeg), true);
        ctx.closePath();
        ctx.fillStyle = cell.yellow ? '#f1d115' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.stroke();

        if (cell.text) {
            ctx.save();
            const rText = (R_72 + R_24_IN) / 2;
            ctx.translate(cx + rText * Math.cos(toR(midDeg)), cy + rText * Math.sin(toR(midDeg)));
            let angle = toR(midDeg);
            if (angle > Math.PI/2 && angle < 3*Math.PI/2) ctx.rotate(angle + Math.PI); 
            else ctx.rotate(angle);
            
            ctx.fillStyle = '#111';
            ctx.font = 'bold 12px "Segoe UI", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(cell.text, 0, 0);
            ctx.restore();
        }
    }

    for (let i = 0; i < 24; i++) {
        let s = Object.assign({}, SON24[i]);
        s.name = getSysName(i, 'baochau');
        
        ctx.beginPath();
        ctx.arc(cx, cy, R_24_IN, toR(s.start), toR(s.end));
        ctx.arc(cx, cy, R_8, toR(s.end), toR(s.start), true);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();

        ctx.save();
        const rText = (R_24_IN + R_8) / 2;
        ctx.translate(cx + rText * Math.cos(toR(s.deg)), cy + rText * Math.sin(toR(s.deg)));
        let angle = toR(s.deg);
        if (angle > Math.PI/2 && angle < 3*Math.PI/2) ctx.rotate(angle + Math.PI); 
        else ctx.rotate(angle);
        
        ctx.fillStyle = '#111';
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s.name, 0, 0);
        ctx.restore();
    }

    const bgPalaceColors = {
        'Càn': '#f1d115', 'Khảm': '#ffffff', 'Cấn': '#f1d115', 'Chấn': '#ffffff',
        'Khôn': '#f1d115', 'Ly': '#ffffff', 'Tốn': '#ffffff', 'Đoài': '#f1d115' 
    };

    for (let i = 0; i < 8; i++) {
        let dirCung = DIR_LACVIET[i];
        let p = HUONG[i];
        let startDeg = p.deg - 22.5;
        let endDeg = p.deg + 22.5;
        
        ctx.beginPath();
        ctx.arc(cx, cy, R_8, toR(startDeg), toR(endDeg));
        ctx.arc(cx, cy, R_CENTER, toR(endDeg), toR(startDeg), true);
        ctx.closePath();
        ctx.fillStyle = bgPalaceColors[dirCung]; 
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();

        ctx.save();
        const rText = (R_8 + R_CENTER) / 2;
        ctx.translate(cx + rText * Math.cos(toR(p.deg)), cy + rText * Math.sin(toR(p.deg)));
        ctx.rotate(toR(p.deg) + Math.PI/2);
        
        ctx.font = 'bold 36px "Segoe UI", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        
        const quaiColor = QUAI_COLORS[dirCung];
        ctx.fillStyle = quaiColor;
        
        if (quaiColor === '#ffffff') {
            ctx.lineWidth = 1; ctx.strokeStyle = '#222';
            ctx.strokeText(QUAI_SYMBOLS[dirCung], 0, 0);
        } else {
            ctx.fillText(QUAI_SYMBOLS[dirCung], 0, 0);
        }
        ctx.restore();
    }

    ctx.beginPath(); ctx.arc(cx, cy, R_CENTER, 0, 2*Math.PI);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath(); ctx.arc(0, 0, R_CENTER, -Math.PI/2, Math.PI/2);
    ctx.fillStyle = '#e71d25'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, R_CENTER, Math.PI/2, 3*Math.PI/2);
    ctx.fillStyle = '#2b4a9b'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -R_CENTER/2, R_CENTER/2, 0, 2*Math.PI);
    ctx.fillStyle = '#2b4a9b'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, R_CENTER/2, R_CENTER/2, 0, 2*Math.PI);
    ctx.fillStyle = '#e71d25'; ctx.fill();
    ctx.restore();

    for(let i=0; i<SON24.length; i++){
        let s = SON24[i];
        const er = toR(s.end);
        ctx.beginPath(); ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=0.7;
        ctx.moveTo(cx+R_64*Math.cos(er), cy+R_64*Math.sin(er));
        ctx.lineTo(cx+(R_DEG_TEXT-5)*Math.cos(er), cy+(R_DEG_TEXT-5)*Math.sin(er)); ctx.stroke();

        const mr = toR(s.deg);
        ctx.beginPath(); ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=0.5;
        ctx.moveTo(cx+R_64*Math.cos(mr), cy+R_64*Math.sin(mr));
        ctx.lineTo(cx+(R_DEG_TEXT-5)*Math.cos(mr), cy+(R_DEG_TEXT-5)*Math.sin(mr)); ctx.stroke();

        ctx.save();
        ctx.translate(cx+R_DEG_TEXT*Math.cos(mr), cy+R_DEG_TEXT*Math.sin(mr));
        ctx.rotate(mr+Math.PI/2);
        ctx.fillStyle='#333'; ctx.font='bold 10px "Segoe UI",sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(`${s.deg}°`,0,0);
        ctx.restore();

        ctx.save();
        ctx.translate(cx+R_DEG_TEXT*Math.cos(er), cy+R_DEG_TEXT*Math.sin(er));
        ctx.rotate(er+Math.PI/2);
        ctx.fillStyle='#777'; ctx.font='500 9px "Segoe UI",sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(`${s.end}°`,0,0);
        ctx.restore();
    }
    ctx.beginPath();ctx.arc(cx,cy,R_64,0,2*Math.PI);ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=1.2;ctx.stroke();
    
    drawFacingArrow(ctx, cx, cy, facingDeg, R_DEG_TEXT);
}

/* =========== MAIN THỰC THI =========== */
function updateData() {
    const yearInput = document.getElementById('pt_yearInput').value;
    const genderSelect = document.getElementById('pt_genderSelect').value;
    const degInput = document.getElementById('pt_degreeInput').value;
    
    let year = parseInt(yearInput) || 1990;
    let facingDeg = degInput !== "" ? parseFloat(degInput) : null;
    
    let quaiNum = getQuaiNum(year, genderSelect);
    let cungPhiLV = getCungPhi(quaiNum, 'lacviet');
    let huongCungLV = getHuongCung(facingDeg, 'lacviet');
    
    drawBatTrach('pt_canvasLV', 'lacviet', year, genderSelect, facingDeg, 'pt_subLV');
    drawBatTrach('pt_canvasCT', 'cothu', year, genderSelect, facingDeg, 'pt_subCT');
    drawHoaKhi('pt_canvasHK', facingDeg, 'pt_subHK');
    drawHuyetKhi('pt_canvasBaoChau', facingDeg, 'pt_subBaoChau');
    
    renderPhienTinh(cungPhiLV, huongCungLV);
    renderDongTho(year, genderSelect);
}


/* =========== BẢNG ĐỘNG THỔ / CƯỚI HỎI =========== */
const DT_CHI = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
const DT_CAN = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
// nhóm tam hợp của Địa chi tuổi (chi % 4) → 3 Địa chi năm gặp Tam Tai
const DT_TAMTAI = {0:[2,3,4], 1:[11,0,1], 2:[8,9,10], 3:[5,6,7]};
const DT_HOANGOC = {1:['Nhất Kiết',false], 2:['Nhì Nghi',false], 3:['Tam Địa Sát',true], 4:['Tứ Tấn Tài',false], 5:['Ngũ Thọ Tử',true], 0:['Lục Hoang Ốc',true]};
// Kim Lâu Súc (dư 8) chỉ ảnh hưởng chăn nuôi: vẫn động thổ được nên không tính là phạm
const DT_KIMLAU = {1:'Kim Lâu Thân', 3:'Kim Lâu Thê', 6:'Kim Lâu Tử'};

// Năm tính theo Lập Xuân (xấp xỉ 4/2)
function nienYearNow(){
    const d = new Date();
    return (d.getMonth() === 0 || (d.getMonth() === 1 && d.getDate() < 4)) ? d.getFullYear() - 1 : d.getFullYear();
}
function dtCanChi(y){
    const ci = ((y - 4) % 12 + 12) % 12;
    return { can: DT_CAN[((y - 4) % 10 + 10) % 10], chi: DT_CHI[ci], ci: ci };
}
function dtLi(violated, text){ return `<li${violated ? ' class="v"' : ''}>${text}</li>`; }

function renderDongTho(birthYear, gender){
    const start = nienYearNow();
    const isNam = (gender === 'nam');
    const bc = dtCanChi(birthYear);
    let r1 = '<th>Năm</th>', r2 = '<th scope="row">Động thổ</th>', r3 = '<th scope="row">Cưới hỏi</th>';

    for (let k = 0; k < 12; k++) {
        const y = start + k;
        const n = dtCanChi(y);
        const tuoi = y - birthYear + 1;

        if (tuoi < 1) {
            r1 += `<th>${y}<br><b>${n.can} ${n.chi}</b><br><small>chưa sinh</small></th>`;
            r2 += `<td class="na">Chưa sinh</td>`;
            r3 += isNam ? `<td class="na">Chưa sinh</td>`
                        : `<td class="ok"><ul>${dtLi(false, 'Nữ: mặc định luôn được')}</ul></td>`;
            continue;
        }
        r1 += `<th>${y}<br><b>${n.can} ${n.chi}</b><br><small>${tuoi} tuổi</small></th>`;

        const thaiTue = (bc.ci === n.ci);
        const xung    = (((bc.ci + 6) % 12) === n.ci);
        const tamTai  = DT_TAMTAI[bc.ci % 4].includes(n.ci);
        const ho      = DT_HOANGOC[tuoi % 6];
        const kimLau  = DT_KIMLAU[tuoi % 9];

        const liThaiTue = dtLi(thaiTue, thaiTue ? `Thái Tuế: phạm (tuổi ${bc.chi} trùng năm ${n.chi})` : 'Thái Tuế: không phạm');
        const liTamTai  = dtLi(tamTai,  tamTai  ? `Tam Tai: phạm (tuổi ${bc.chi} gặp năm ${n.chi})`   : 'Tam Tai: không phạm');

        // Dòng 2: Động thổ
        const lis2 = liThaiTue
            + dtLi(xung, xung ? `Xung Thái Tuế: phạm (${bc.chi} xung ${n.chi})` : 'Xung Thái Tuế: không phạm')
            + liTamTai
            + dtLi(ho[1], `Hoang Ốc: ${ho[0]} – ${ho[1] ? 'phạm' : 'không phạm'}`)
            + dtLi(!!kimLau, kimLau ? `Kim Lâu: phạm (${kimLau})`
                : (tuoi % 9 === 8 ? 'Kim Lâu: Kim Lâu Súc – vẫn động thổ được' : `Kim Lâu: không phạm (dư ${tuoi % 9})`));
        const okDT = !(thaiTue || xung || tamTai || ho[1] || kimLau);
        r2 += `<td class="${okDT ? 'ok' : 'bad'}"><ul>${lis2}</ul></td>`;

        // Dòng 3: Cưới hỏi (chỉ xét Nam; Nữ luôn được)
        if (isNam) {
            const okCH = !(tamTai || thaiTue);
            r3 += `<td class="${okCH ? 'ok' : 'bad'}"><ul>${liTamTai}${liThaiTue}</ul></td>`;
        } else {
            r3 += `<td class="ok"><ul>${dtLi(false, 'Nữ: mặc định luôn được')}</ul></td>`;
        }
    }

    document.getElementById('pt_dtTableContainer').innerHTML =
        `<table class="dt-table"><thead><tr>${r1}</tr></thead><tbody><tr>${r2}</tr><tr>${r3}</tr></tbody></table>`;
    document.getElementById('pt_dtInfo').innerHTML =
        `Tính cho tuổi <b>${bc.can} ${bc.chi}</b> (sinh ${birthYear}, ${isNam ? 'Nam' : 'Nữ'}) · 12 năm từ <b>${start}</b>. ` +
        `<span style="color:#2e7d32;font-weight:600">Ô xanh: được</span> · <span style="color:#c62828;font-weight:600">Ô hồng: phạm</span>.`;
}


return { updateData };
})();

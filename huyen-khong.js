/* ============================================================================
   huyen-khong.js  -  TAB 2: HUYỀN KHÔNG PHI TINH
   ----------------------------------------------------------------------------
   Xuất ra biến toàn cục:  HK  (HK.updateData(), HK.refreshAll(), HK.gotoToday())
   Đọc các ô nhập (index.html):  hk_yearSelect, hk_degreeInput
   Gồm:
     - getVan(), trungCungStar(): vận và sao nhập trung cung theo năm
     - phiTinh() / phiNghich() / vanTinh(): bay sao thuận, nghịch, vận bàn
     - computeZones(): Thái Tuế, Xung, Tuế Phá, Tam Sát (TAM_SAT_IDX), Ngũ Hoàng,
       Nhị Hắc, Tài Thần, Hỷ Thần và danh sách cung động thổ được (cungSach)
     - drawChart(), drawCuoc(): vẽ biểu đồ và biểu tượng cái cuốc
   Không phụ thuộc file JS nào khác.
   ============================================================================ */

const HK = (function(){
/* =========== DATA =========== */
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
const CUNG={Khảm:{col:'#2969b0'},Khôn:{col:'#8d6e63'},Chấn:{col:'#3a7d44'},Tốn:{col:'#2e7d5b'},Ly:{col:'#c0392b'},Đoài:{col:'#d4a017'},Càn:{col:'#7a7a7a'},Cấn:{col:'#a0724a'}};
const SAO={1:{name:'Nhất Bạch',col:'#2969b0'},2:{name:'Nhị Hắc',col:'#5d4037'},3:{name:'Tam Bích',col:'#2e7d32'},4:{name:'Tứ Lục',col:'#00695c'},5:{name:'Ngũ Hoàng',col:'#e6a800'},6:{name:'Lục Bạch',col:'#546e7a'},7:{name:'Thất Xích',col:'#c62828'},8:{name:'Bát Bạch',col:'#bf8040'},9:{name:'Cửu Tử',col:'#9c27b0'}};

const LT_GRID=[
    {cung:'Càn',num:6,row:0,col:0},{cung:'Khảm',num:1,row:0,col:1},{cung:'Cấn',num:8,row:0,col:2},
    {cung:'Đoài',num:7,row:1,col:0},{cung:'Trung',num:5,row:1,col:1},{cung:'Chấn',num:3,row:1,col:2},
    {cung:'Khôn',num:2,row:2,col:0},{cung:'Ly',num:9,row:2,col:1},{cung:'Tốn',num:4,row:2,col:2}
];
const HD_GRID=[
    {cung:'Càn',num:6,row:0,col:0},{cung:'Khảm',num:1,row:0,col:1},{cung:'Cấn',num:8,row:0,col:2},
    {cung:'Đoài',num:9,row:1,col:0},{cung:'Trung',num:5,row:1,col:1},{cung:'Chấn',num:3,row:1,col:2},
    {cung:'Tốn',num:4,row:2,col:0},{cung:'Ly',num:7,row:2,col:1},{cung:'Khôn',num:2,row:2,col:2}
];

const LXT_LT=[5,6,7,8,9,1,2,3,4];
const LXT_HD=[5,6,7,8,9,1,2,3,4];

const DIA_CHI=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
const THIEN_CAN=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];

/* =========== HELPERS =========== */
function toR(d){return(d-90)*Math.PI/180}
function getCanChi(y){return{can:THIEN_CAN[((y-4)%10+10)%10],chi:DIA_CHI[((y-4)%12+12)%12]}}
function getVan(y){if(y>=2024&&y<=2043)return 9;if(y>=2004&&y<=2023)return 8;if(y>=1984&&y<=2003)return 7;if(y>=1964&&y<=1983)return 6;if(y>=1944&&y<=1963)return 5;if(y>=1924&&y<=1943)return 4;if(y>=1904&&y<=1923)return 3;if(y>=1884&&y<=1903)return 2;return 1}
function trungCungStar(y){let s=((7-(y-1984))%9+9)%9;return s===0?9:s}
function phiTinh(grid,trung,lxt){const m={};for(let i=0;i<9;i++)m[lxt[i]]=((trung-1+i)%9)+1;return grid.map(c=>({...c,star:m[c.num]||trung}))}

function phiNghich(grid,trung,lxt){
    const m={};
    for(let i=0;i<9;i++){
        let s=((trung-1-i)%9+9)%9+1;
        m[lxt[i]]=s;
    }
    return grid.map(c=>({...c,star:m[c.num]||trung}))
}

function vanTinh(grid,van,lxt){const m={};for(let i=0;i<9;i++)m[lxt[i]]=((van-1+i)%9)+1;return grid.map(c=>({...c,star:m[c.num]||van}))}

// Lấy danh sách index hình học của Cung
function getCungIndices(cung, sys) {
    switch(cung) {
        case 'Khảm': return [0,1,2];
        case 'Cấn': return [3,4,5];
        case 'Chấn': return [6,7,8];
        case 'Ly': return [12,13,14];
        case 'Đoài': return [18,19,20];
        case 'Càn': return [21,22,23];
    }
    if (sys === 'hado') {
        if (cung === 'Khôn') return [9,10,11]; 
        if (cung === 'Tốn') return [15,16,17]; 
    } else {
        if (cung === 'Tốn') return [9,10,11]; 
        if (cung === 'Khôn') return [15,16,17]; 
    }
    return [];
}

// Lấy Tên theo vị trí Index
function getSysName(idx, sys) {
    const base = SON24[idx].name;
    if (sys === 'hado') {
        if (idx === 10) return 'Khôn';
        if (idx === 16) return 'Tốn';
    }
    return base;
}

function sysNameToIdx(name, sys) {
    if (sys === 'hado') {
        if (name === 'Khôn') return 10;
        if (name === 'Tốn') return 16;
    }
    return SON24.findIndex(s => s.name === name);
}

// Hàm đổi tên cung sang tên hướng
function getDirectionName(cung, sysName) {
    if (cung === 'Trung') return 'Trung Cung';
    const dirMap = {
        'Khảm': 'Bắc',
        'Cấn': 'Đông Bắc',
        'Chấn': 'Đông',
        'Ly': 'Nam',
        'Đoài': 'Tây',
        'Càn': 'Tây Bắc'
    };
    if (dirMap[cung]) return dirMap[cung];

    if (sysName === 'hado') {
        if (cung === 'Khôn') return 'Đông Nam';
        if (cung === 'Tốn') return 'Tây Nam';
    } else {
        if (cung === 'Tốn') return 'Đông Nam';
        if (cung === 'Khôn') return 'Tây Nam';
    }
    return cung;
}

function computeZones(y, sysName){
    const {can, chi} = getCanChi(y);
    const trung = trungCungStar(y);
    const chiIdx = DIA_CHI.indexOf(chi);
    
    const ttBaseIdx = chiIdx * 2 + 1; 
    const thaiTueSons = [(ttBaseIdx - 1 + 24) % 24, ttBaseIdx].map(i => getSysName(i, sysName));
    
    const oppBaseIdx = (ttBaseIdx + 12) % 24;
    const xungSons = [(oppBaseIdx - 1 + 24) % 24, oppBaseIdx].map(i => getSysName(i, sysName));
    
    const tpBaseIdx = ((chiIdx + 3) % 12) * 2 + 1;
    const tuePhaSons = [(tpBaseIdx - 1 + 24) % 24, tpBaseIdx].map(i => getSysName(i, sysName));
    
    const TAM_SAT_IDX = {
        'Dần':[22,23,0,1,2,3], 'Ngọ':[22,23,0,1,2,3], 'Tuất':[22,23,0,1,2,3],
        'Thân':[10,11,12,13,14,15], 'Tý':[10,11,12,13,14,15], 'Thìn':[10,11,12,13,14,15],
        'Hợi':[16,17,18,19,20,21], 'Mão':[16,17,18,19,20,21], 'Mùi':[16,17,18,19,20,21],
        'Tỵ':[4,5,6,7,8,9], 'Dậu':[4,5,6,7,8,9], 'Sửu':[4,5,6,7,8,9]
    };
    const tamSatSons = TAM_SAT_IDX[chi].map(i => getSysName(i, sysName));

    const sysGrid = sysName === 'hado' ? HD_GRID : LT_GRID;
    const lxt = sysName === 'hado' ? LXT_HD : LXT_LT;
    const tPhi = phiTinh(sysGrid, trung, lxt);
    const nPhi = phiNghich(sysGrid, trung, lxt);
    
    const nhCell = tPhi.find(c => c.star === 5), nhCung = nhCell ? nhCell.cung : 'Trung';
    const nguHoangSons = nhCung === 'Trung' ? [] : getCungIndices(nhCung, sysName).map(i => getSysName(i, sysName));
    
    const nh2Cell = tPhi.find(c => c.star === 2), nh2Cung = nh2Cell ? nh2Cell.cung : 'Trung';
    const nhiHacSons = nh2Cung === 'Trung' ? [] : getCungIndices(nh2Cung, sysName).map(i => getSysName(i, sysName));

    const nghich5Cell = nPhi.find(c => c.star === 5), nghich5Cung = nghich5Cell ? nghich5Cell.cung : 'Trung';
    const nguHoangNghichSons = nghich5Cung === 'Trung' ? [] : getCungIndices(nghich5Cung, sysName).map(i => getSysName(i, sysName));

    const nghich2Cell = nPhi.find(c => c.star === 2), nghich2Cung = nghich2Cell ? nghich2Cell.cung : 'Trung';
    const nhiHacNghichSons = nghich2Cung === 'Trung' ? [] : getCungIndices(nghich2Cung, sysName).map(i => getSysName(i, sysName));
    
    const TAI_CUNG = { 'Giáp':'Cấn', 'Ất':'Chấn', 'Bính':'Tốn', 'Đinh':'Ly', 'Mậu':'Tốn', 'Kỷ':'Ly', 'Canh':'Khôn', 'Tân':'Đoài', 'Nhâm':'Càn', 'Quý':'Khảm' };
    const taiThanSons = getCungIndices(TAI_CUNG[can], 'lacthu').map(i => getSysName(i, sysName));
    
    const HY_CUNG = { 'Giáp':'Cấn', 'Ất':'Càn', 'Bính':'Đoài', 'Đinh':'Ly', 'Mậu':'Tốn', 'Kỷ':'Cấn', 'Canh':'Càn', 'Tân':'Đoài', 'Nhâm':'Ly', 'Quý':'Tốn' };
    const hyThanSons = getCungIndices(HY_CUNG[can], 'lacthu').map(i => getSysName(i, sysName));

    // Cung "sạch": cả 3 sơn của cung không nằm trong bất kỳ vùng xấu nào đang xét
    const badSet = new Set([].concat(thaiTueSons, xungSons, tuePhaSons, tamSatSons,
        nguHoangSons, nhiHacSons, nguHoangNghichSons, nhiHacNghichSons));
    const cungSach = ['Khảm','Cấn','Chấn','Tốn','Ly','Khôn','Đoài','Càn']
        .filter(c => getCungIndices(c, sysName).every(i => !badSet.has(getSysName(i, sysName))));
    // Trung cung không có sơn: chỉ phạm khi Ngũ Hoàng hoặc Nhị Hắc (thuận/nghịch) nhập trung
    const trungPham = [nhCung, nh2Cung, nghich5Cung, nghich2Cung].includes('Trung');
    if (!trungPham) cungSach.push('Trung');

    return {
        cungSach,
        can, chi, trung, van: getVan(y),
        thaiTueSons, xungSons, tuePhaSons, tamSatSons, 
        nguHoangSons, nhiHacSons,
        nguHoangNghichSons, nhiHacNghichSons,
        taiThanSons, hyThanSons, 
        nguHoangCung: nhCung, nhiHacCung: nh2Cung,
        nguHoangNghichCung: nghich5Cung, nhiHacNghichCung: nghich2Cung
    };
}

/* =========== DRAW =========== */
/* Biểu tượng cái cuốc đang cuốc xuống (dùng chung cho canvas và ghi chú) */
const CUOC = {
    ground: 'M3 21.6L21 21.6',
    flecks: ['M17 20.2l1.2-1.4', 'M19.6 20.4l1-1.2', 'M5.6 19.8l-1.1-1.3'],
    handle: 'M19.4 3.4L12.6 12.6',
    neck:   'M12.6 12.6L11 14.4',
    blade:  'M6.4 13.6L15.8 17.2L13.2 21.4L5 19.2Z',
    edge:   'M5 19.2L13.2 21.4'
};
function drawCuoc(ctx, x, y, r){
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 2*Math.PI);
    ctx.fillStyle = '#fff3cd'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#c98f00'; ctx.stroke();
    const k = (r / 11.4) * 0.86;
    ctx.scale(k, k); ctx.translate(-12, -12);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 1.8; ctx.stroke(new Path2D(CUOC.ground));
    ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1.2;
    CUOC.flecks.forEach(d => ctx.stroke(new Path2D(d)));
    ctx.strokeStyle = '#8d5a2b'; ctx.lineWidth = 2.8; ctx.stroke(new Path2D(CUOC.handle));
    ctx.strokeStyle = '#455a64'; ctx.lineWidth = 3;   ctx.stroke(new Path2D(CUOC.neck));
    const bl = new Path2D(CUOC.blade);
    ctx.fillStyle = '#b0bec5'; ctx.fill(bl);
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 1.1; ctx.stroke(bl);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.stroke(new Path2D(CUOC.edge));
    ctx.restore();
}
function cuocSvg(px){
    return `<svg width="${px}" height="${px}" viewBox="0 0 24 24" style="vertical-align:-5px" aria-hidden="true">`
        + `<circle cx="12" cy="12" r="11.4" fill="#fff3cd" stroke="#c98f00" stroke-width="1.2"/>`
        + `<g transform="translate(12 12) scale(0.86) translate(-12 -12)" stroke-linecap="round" stroke-linejoin="round" fill="none">`
        + `<path d="${CUOC.ground}" stroke="#6d4c41" stroke-width="1.8"/>`
        + CUOC.flecks.map(d => `<path d="${d}" stroke="#8d6e63" stroke-width="1.2"/>`).join('')
        + `<path d="${CUOC.handle}" stroke="#8d5a2b" stroke-width="2.8"/>`
        + `<path d="${CUOC.neck}" stroke="#455a64" stroke-width="3"/>`
        + `<path d="${CUOC.blade}" fill="#b0bec5" stroke="#37474f" stroke-width="1.1"/>`
        + `<path d="${CUOC.edge}" stroke="#fff" stroke-width="1.2"/>`
        + `</g></svg>`;
}

function drawChart(canvasId,sysName,zones,year,subId, facingDeg){
    const canvas=document.getElementById(canvasId);if(!canvas)return;
    
    // Internal canvas resolution set high for crisp rendering
    const dpr=window.devicePixelRatio||1, W=560, H=560;
    canvas.width=W*dpr; canvas.height=H*dpr;
    const ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
    const cx=W/2, cy=H/2;

    const R_deg_text=258;     
    const R_son_outer=244;    
    const R_son_inner=210;    
    const R_zone_inner=182;   

    const halfSide=R_zone_inner/Math.sqrt(2);
    const gridX=cx-halfSide,gridY=cy-halfSide;
    const cellW=(2*halfSide)/3,cellH=(2*halfSide)/3;

    ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);

    // ── Zone coloring ──
    const ZC={
        thaiTue: 'rgba(46, 204, 113, 0.65)',
        xung: 'rgba(231, 76, 60, 0.65)',
        tuePha: 'rgba(149, 165, 166, 0.65)',
        tamSat: 'rgba(230, 126, 34, 0.65)',
        nguHoang: 'rgba(241, 196, 15, 0.65)',
        nhiHac: 'rgba(160, 82, 45, 0.65)',
        nguHoangNghich: 'rgba(255, 140, 0, 0.65)',  
        nhiHacNghich: 'rgba(139, 69, 19, 0.65)',   
        taiThan: 'rgba(52, 152, 219, 0.55)',
        hyThan: 'rgba(255, 105, 180, 0.65)'
    };
    const zd=[
        {s:zones.thaiTueSons, c:ZC.thaiTue},
        {s:zones.xungSons, c:ZC.xung},
        {s:zones.tuePhaSons, c:ZC.tuePha},
        {s:zones.tamSatSons, c:ZC.tamSat},
        {s:zones.nguHoangSons, c:ZC.nguHoang},
        {s:zones.nhiHacSons, c:ZC.nhiHac},
        {s:zones.nguHoangNghichSons, c:ZC.nguHoangNghich},
        {s:zones.nhiHacNghichSons, c:ZC.nhiHacNghich},
        {s:zones.taiThanSons, c:ZC.taiThan},
        {s:zones.hyThanSons, c:ZC.hyThan}
    ];
    
    for(const z of zd){
        if(!z.s||!z.s.length)continue;
        for(const sn of z.s){
            const idx = sysNameToIdx(sn, sysName);
            const s = SON24[idx];
            if(!s)continue;
            ctx.beginPath();ctx.arc(cx,cy,R_son_inner,toR(s.start),toR(s.end));
            ctx.arc(cx,cy,R_zone_inner,toR(s.end),toR(s.start),true);
            ctx.closePath();ctx.fillStyle=z.c;ctx.fill();
        }
    }

    ctx.beginPath();ctx.arc(cx,cy,R_son_inner,0,2*Math.PI);ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1.2;ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,R_zone_inner,0,2*Math.PI);ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=2;ctx.stroke();

    // ── Cửu Cung grid ──
    ctx.fillStyle='#fefdf9';ctx.fillRect(gridX,gridY,cellW*3,cellH*3);
    ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=2;ctx.strokeRect(gridX,gridY,cellW*3,cellH*3);
    ctx.lineWidth=1;ctx.strokeStyle='rgba(0,0,0,0.3)';
    for(let i=1;i<3;i++){
        ctx.beginPath();ctx.moveTo(gridX+i*cellW,gridY);ctx.lineTo(gridX+i*cellW,gridY+cellH*3);ctx.stroke();
        ctx.beginPath();ctx.moveTo(gridX,gridY+i*cellH);ctx.lineTo(gridX+cellW*3,gridY+i*cellH);ctx.stroke();
    }

    const sysGrid=sysName==='hado'?HD_GRID:LT_GRID;
    const lxt=sysName==='hado'?LXT_HD:LXT_LT;
    const vd=vanTinh(sysGrid,zones.van,lxt);
    const td=phiTinh(sysGrid,zones.trung,lxt);
    const nd=phiNghich(sysGrid,zones.trung,lxt);

    for(let r=0;r<3;r++){
        for(let c=0;c<3;c++){
            const i=r*3+c,ci=CUNG[sysGrid[i].cung]||{col:'#666'};
            const xc=gridX+c*cellW+cellW/2,yc=gridY+r*cellH+cellH/2;
            
            ctx.fillStyle=ci.col;ctx.font='600 11px "Segoe UI",sans-serif';
            ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillText(sysGrid[i].cung,xc,yc-cellH*0.38);

            if(zones.cungSach && zones.cungSach.includes(sysGrid[i].cung)){
                drawCuoc(ctx, xc+cellW*0.345, yc-cellH*0.31, 12);
            }

            ctx.fillStyle='#444';ctx.font='bold 14px "Segoe UI",sans-serif';
            ctx.fillText(vd[i].star,xc,yc-cellH*0.18);

            const tX = xc - cellW*0.22, tY = yc + cellH*0.18;
            ctx.fillStyle='#1a6fb5';ctx.font='bold 24px "Segoe UI",sans-serif';
            ctx.fillText(td[i].star, tX, tY);

            const nX = xc + cellW*0.22, nY = yc + cellH*0.18;
            ctx.fillStyle='#c0392b';ctx.font='bold 24px "Segoe UI",sans-serif';
            ctx.fillText(nd[i].star, nX, nY);
        }
    }

    // ── Vòng 24 Sơn và Số phân độ ──
    for(let i=0; i<SON24.length; i++){
        let s = Object.assign({}, SON24[i]);
        s.name = getSysName(i, sysName);

        const er=toR(s.end);
        ctx.beginPath();ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=0.7;
        ctx.moveTo(cx+R_son_inner*Math.cos(er),cy+R_son_inner*Math.sin(er));
        ctx.lineTo(cx+(R_deg_text-5)*Math.cos(er),cy+(R_deg_text-5)*Math.sin(er));ctx.stroke();

        const mr=toR(s.deg);
        ctx.beginPath();ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=0.5;
        ctx.moveTo(cx+R_son_inner*Math.cos(mr),cy+R_son_inner*Math.sin(mr));
        ctx.lineTo(cx+(R_deg_text-5)*Math.cos(mr),cy+(R_deg_text-5)*Math.sin(mr));ctx.stroke();

        ctx.save();
        const R_son_center = (R_son_inner + R_son_outer)/2;
        ctx.translate(cx+R_son_center*Math.cos(mr),cy+R_son_center*Math.sin(mr));
        ctx.rotate(mr+Math.PI/2);
        ctx.fillStyle='#111';ctx.font='bold 14px "Segoe UI",sans-serif';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(s.name,0,0);
        ctx.restore();

        ctx.save();
        ctx.translate(cx+R_deg_text*Math.cos(mr),cy+R_deg_text*Math.sin(mr));
        ctx.rotate(mr+Math.PI/2);
        ctx.fillStyle='#333';ctx.font='bold 10px "Segoe UI",sans-serif';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(`${s.deg}°`,0,0);
        ctx.restore();

        ctx.save();
        ctx.translate(cx+R_deg_text*Math.cos(er),cy+R_deg_text*Math.sin(er));
        ctx.rotate(er+Math.PI/2);
        ctx.fillStyle='#666';ctx.font='500 9px "Segoe UI",sans-serif';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(`${s.end}°`,0,0);
        ctx.restore();
    }
    ctx.beginPath();ctx.arc(cx,cy,R_son_outer,0,2*Math.PI);ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=1;ctx.stroke();

    // ── Mũi Tên Chỉ Hướng ──
    if (facingDeg !== null && !isNaN(facingDeg) && facingDeg >= 0 && facingDeg <= 360) {
        const rad = toR(facingDeg);
        const radBack = toR(facingDeg + 180);
        const arrowLen = R_deg_text + 12; 
        
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(231, 76, 60, 0.9)'; 
        ctx.lineWidth = 1.2; 
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

    // ── Cập nhật Subtitle ──
    const se=document.getElementById(subId);
    if(se) {
        se.innerHTML=`
        <span class="row">Năm ${zones.can} ${zones.chi} · Vận ${zones.van} · Trung Cung: <b>${(SAO[zones.trung]||{}).name||zones.trung} (${zones.trung})</b></span>
        `;
    }
}

function buildDongTho(elId,zones,sysName){
    const el=document.getElementById(elId);if(!el)return;
    const head=cuocSvg(20)+' <b>Khu vực động thổ được</b> (không phạm Thái Tuế, Xung Thái Tuế, Tuế Phá, Tam Sát, Ngũ Hoàng, Nhị Hắc – cả thuận và nghịch): ';
    if(!zones.cungSach.length){
        el.innerHTML=head+'<b style="color:#c0392b">không có cung nào</b>, kể cả trung cung, đều phạm ít nhất một điều xấu trong năm này.';
        return;
    }
    el.innerHTML=head+zones.cungSach.map(c=> c==='Trung'
        ? '<b>Trung cung</b> – chính giữa (không có Ngũ Hoàng, Nhị Hắc nhập trung)'
        : `<b>${c}</b> – ${getDirectionName(c,sysName)} (${getCungIndices(c,sysName).map(i=>getSysName(i,sysName)).join(', ')})`
    ).join('; ')+'.';
}

function buildLegend(elId,zones){
    const el=document.getElementById(elId);if(!el)return;
    const its=[
        {l:'Thái Tuế: '+(zones.thaiTueSons?.join(' - ')||'—'),c:'rgba(46, 204, 113, 0.8)'},
        {l:'Xung Thái Tuế: '+(zones.xungSons?.join(' - ')||'—'),c:'rgba(231, 76, 60, 0.8)'},
        {l:'Tuế Phá: '+(zones.tuePhaSons?.join(' - ')||'—'),c:'rgba(149, 165, 166, 0.8)'},
        {l:'Tam Sát: '+(zones.tamSatSons?.join(' - ')||'—'),c:'rgba(230, 126, 34, 0.8)'},
        {l:'Ngũ Hoàng (Thuận): '+(zones.nguHoangSons?.join(' - ')||'—'),c:'rgba(241, 196, 15, 0.9)'},
        {l:'Nhị Hắc (Thuận): '+(zones.nhiHacSons?.join(' - ')||'—'),c:'rgba(160, 82, 45, 0.8)'},
        {l:'Ngũ Hoàng (Nghịch): '+(zones.nguHoangNghichSons?.join(' - ')||'—'),c:'rgba(255, 140, 0, 0.9)'},
        {l:'Nhị Hắc (Nghịch): '+(zones.nhiHacNghichSons?.join(' - ')||'—'),c:'rgba(139, 69, 19, 0.8)'},
        {l:'Tài Thần: '+(zones.taiThanSons?.join(' - ')||'—'),c:'rgba(52, 152, 219, 0.7)'},
        {l:'Hỷ Thần: '+(zones.hyThanSons?.join(' - ')||'—'),c:'rgba(255, 105, 180, 0.8)'},
    ];
    el.innerHTML=its.map(x=>`<div class="leg"><div class="swatch" style="background:${x.c}"></div><span><b>${x.l}</b></span></div>`).join('');
}

/* =========== MAIN =========== */
// Năm tính theo Lập Xuân (xấp xỉ 4/2): trước mốc này vẫn thuộc năm âm lịch trước
function nienYearNow(){const d=new Date();return (d.getMonth()===0||(d.getMonth()===1&&d.getDate()<4))?d.getFullYear()-1:d.getFullYear();}
let currentYear=nienYearNow();
let currentDegree=null;

function updateData() {
    const selYear=document.getElementById('hk_yearSelect');
    currentYear=parseInt(selYear.value)||currentYear;
    
    const degInput=document.getElementById('hk_degreeInput').value;
    if(degInput !== "") {
        currentDegree = parseFloat(degInput);
    } else {
        currentDegree = null;
    }
    
    refreshAll();
}

function refreshAll(){
    const y=currentYear;
    
    const zonesLV = computeZones(y, 'hado');
    const zonesCT = computeZones(y, 'lacthu');
    
    drawChart('hk_canvasLV','hado',zonesLV,y,'hk_subLV', currentDegree);
    drawChart('hk_canvasCT','lacthu',zonesCT,y,'hk_subCT', currentDegree);
    
    buildLegend('hk_legendLV',zonesLV);
    buildLegend('hk_legendCT',zonesCT);
    buildDongTho('hk_noteLV',zonesLV,'hado');
    buildDongTho('hk_noteCT',zonesCT,'lacthu');
    
    const sel=document.getElementById('hk_yearSelect');if(sel)sel.value=y;
}

function gotoToday(){
    currentYear=nienYearNow();
    document.getElementById('hk_degreeInput').value = "";
    currentDegree = null;
    refreshAll();
}

(function pop(){
    const sel=document.getElementById('hk_yearSelect');if(!sel)return;sel.innerHTML='';
    for(let y=1960;y<=2060;y++){const{can,chi}=getCanChi(y);const o=document.createElement('option');o.value=y;o.textContent=`${y} — ${can} ${chi}`;if(y===currentYear)o.selected=true;sel.appendChild(o)}sel.value=currentYear;
})();


return { updateData, refreshAll, gotoToday };
})();

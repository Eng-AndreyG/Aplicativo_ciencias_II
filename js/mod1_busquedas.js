/* =====================================================================
 * mod1_busquedas.js — MÓDULO 1
 *   1.1 Secuencial, Binaria, Transformación de claves, Cubetas dinámicas
 *   1.2 Funciones hash (decimal / binario) y colisiones
 *   1.3 Árbol digital, Residuos, Residuos múltiple, Huffman, Rejilla, 2D
 * ===================================================================== */
'use strict';

/* =====================================================================
 * 1.1  BÚSQUEDA SECUENCIAL Y BINARIA
 * ===================================================================== */
const ArrayView = {
    /** Dibuja un arreglo. st.cls(i), st.badges(i) → [[texto, clase]], st.ind = {i, text} */
    draw(container, arr, st = {}) {
        container.innerHTML = '';
        const row = h('div', { class: 'array-row' });
        arr.forEach((v, i) => {
            const badges = st.badges ? st.badges(i) : [];
            const cell = h('div', { class: 'array-cell ' + (st.cls ? st.cls(i) || '' : '') },
                badges && badges.length ? h('div', { class: 'pointer-badge-group' }, badges.map(([t, c]) => h('span', { class: 'pointer-badge ' + c, text: t }))) : null,
                h('span', { class: 'cell-index', text: '[' + (i + (st.base || 0)) + ']' }),
                h('span', { class: 'cell-value', text: v === null || v === undefined ? '—' : v }),
                st.ind && st.ind.i === i ? h('div', { class: 'cell-bottom-indicator' }, h('span', { class: 'indicator-arrow', text: '▲' }), h('span', { class: 'indicator-pill', html: st.ind.text })) : null);
            row.appendChild(cell);
        });
        container.appendChild(row);
    },
};

function randomSortedArray(n, max = 99) {
    const s = new Set();
    while (s.size < n) s.add(1 + Math.floor(Math.random() * max));
    return Array.from(s).sort((a, b) => a - b);
}

/* ---------- Búsqueda secuencial ---------- */
App.register('secuencial', (() => {
    const S = { arr: [3, 8, 12, 16, 21, 27, 33, 40, 48, 55], ordered: true };
    let ui = {};
    function base() { ArrayView.draw(ui.view, S.arr, {}); Formula.set(S.ordered ? 'si A[i] = k → éxito · si A[i] &gt; k → parada temprana' : 'si A[i] = k → éxito (recorre hasta n)'); }
    function readInputs() {
        S.arr = U.parseNums(ui.arr.value);
        S.ordered = ui.mode.value === 'ord';
        if (S.ordered) { S.arr.sort((a, b) => a - b); ui.arr.value = S.arr.join(', '); }
    }
    function run() {
        readInputs();
        const k = Number(ui.key.value);
        if (!S.arr.length || Number.isNaN(k)) { Status.set('Ingrese un arreglo y una clave válidos.', 'error'); return; }
        const arr = S.arr, frames = [], n = arr.length;
        let comps = 0;
        frames.push({ log: `Búsqueda secuencial ${S.ordered ? 'ORDENADA (con parada temprana)' : 'DESORDENADA'} de k = ${k} en un arreglo de n = ${n}.`, type: 'step', status: `Buscando <strong>${k}</strong>…` });
        for (let i = 0; i < n; i++) {
            comps++;
            const c = comps;
            const done = i;
            if (arr[i] === k) {
                frames.push({ draw: () => ArrayView.draw(ui.view, arr, { cls: j => j < done ? 'cell-discarded' : j === done ? 'cell-found' : '', ind: { i: done, text: `A[${done}] = k` } }), log: `Comparación ${c}: A[${i}] = ${arr[i]} = ${k} → ¡Encontrada!`, type: 'found', status: `<strong>Éxito:</strong> clave ${k} hallada en la posición ${i} con ${c} comparaciones.`, statusType: 'found' });
                return Sim.load(frames, { base });
            }
            if (S.ordered && arr[i] > k) {
                frames.push({ draw: () => ArrayView.draw(ui.view, arr, { cls: j => j < done ? 'cell-discarded' : j === done ? 'cell-collision' : 'cell-discarded', ind: { i: done, text: `${arr[done]} &gt; ${k}` } }), log: `Comparación ${c}: A[${i}] = ${arr[i]} &gt; ${k} → como el arreglo está ordenado, la clave no puede estar más adelante. PARADA TEMPRANA.`, type: 'notfound', status: `<strong>Fracaso:</strong> ${k} no existe. Parada temprana tras ${c} comparaciones (se evitaron ${n - c}).`, statusType: 'notfound' });
                return Sim.load(frames, { base });
            }
            frames.push({ draw: () => ArrayView.draw(ui.view, arr, { cls: j => j < done ? 'cell-discarded' : j === done ? 'cell-inspecting' : '', ind: { i: done, text: `A[${done}] ≠ k` } }), log: `Comparación ${c}: A[${i}] = ${arr[i]} ≠ ${k}${S.ordered ? ` y ${arr[i]} &lt; ${k} → continuar` : ' → continuar'}.`, type: 'compare' });
        }
        frames.push({ draw: () => ArrayView.draw(ui.view, arr, { cls: () => 'cell-discarded' }), log: `Se recorrieron las ${n} posiciones: la clave ${k} no existe.`, type: 'notfound', status: `<strong>Fracaso:</strong> ${k} no está en el arreglo (${comps} comparaciones = n).`, statusType: 'notfound' });
        Sim.load(frames, { base });
    }
    return {
        run,
        mount({ controls, stage, side }) {
            ui.arr = UI.text(S.arr.join(', '), { width: '300px' });
            ui.mode = UI.select([['ord', 'Ordenada (parada temprana)'], ['des', 'Desordenada']], S.ordered ? 'ord' : 'des', () => { readInputs(); base(); Sim.clear(); });
            ui.key = UI.num(27, { width: '80px' });
            controls.append(
                UI.field('Arreglo A:', ui.arr), UI.field('Tipo:', ui.mode), UI.field('Clave k:', ui.key),
                UI.btn('Buscar', run, 'btn-primary'),
                UI.btn('🎲 Aleatorio', () => { const a = randomSortedArray(10); if (ui.mode.value === 'des') a.sort(() => Math.random() - .5); ui.arr.value = a.join(', '); ui.key.value = a[Math.floor(Math.random() * a.length)]; readInputs(); base(); Sim.clear(); }),
                UI.btn('Preset clase', () => { ui.arr.value = '3, 8, 12, 16, 21, 27, 33, 40, 48, 55'; ui.key.value = 30; readInputs(); base(); Sim.clear(); }));
            ui.view = h('div');
            stage.appendChild(ui.view);
            side.appendChild(UI.card('Análisis', UI.kv([['Exitosa prom.', '(n + 1) / 2'], ['Fracaso desord.', 'n'], ['Fracaso ord.', '≈ n / 2 (parada temprana)']])));
            readInputs(); base();
        },
        reset() { readInputs(); base(); Log.clear(); },
    };
})());

/* ---------- Búsqueda binaria ---------- */
App.register('binaria', (() => {
    const S = { arr: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91] };
    let ui = {};
    function base() { ArrayView.draw(ui.view, S.arr, {}); Formula.set('Med = ⌊(Izq + Der) / 2⌋'); }
    function read() { S.arr = Array.from(new Set(U.parseNums(ui.arr.value))).sort((a, b) => a - b); ui.arr.value = S.arr.join(', '); }
    function run() {
        read();
        const k = Number(ui.key.value), arr = S.arr, frames = [];
        if (!arr.length || Number.isNaN(k)) { Status.set('Ingrese un arreglo y una clave válidos.', 'error'); return; }
        let izq = 0, der = arr.length - 1, it = 0;
        const discarded = new Set();
        frames.push({ log: `Búsqueda binaria de k = ${k}. Arreglo ordenado de n = ${arr.length}. Máximo ⌊log₂ ${arr.length}⌋ + 1 = ${Math.floor(U.log2(arr.length)) + 1} comparaciones.`, type: 'step' });
        while (izq <= der) {
            it++;
            const med = Math.floor((izq + der) / 2);
            const L = izq, R = der, M = med, D = new Set(discarded);
            const badges = i => { const b = []; if (i === L) b.push(['Izq', 'badge-left']); if (i === M) b.push(['Med', 'badge-mid']); if (i === R) b.push(['Der', 'badge-right']); return b; };
            if (arr[med] === k) {
                frames.push({ draw: () => ArrayView.draw(ui.view, arr, { cls: i => D.has(i) ? 'cell-discarded' : i === M ? 'cell-found' : 'cell-active', badges, ind: { i: M, text: `A[${M}] = ${k}` } }), formula: `Med = ⌊(${L} + ${R}) / 2⌋ = ${M}`, log: `Iteración ${it}: Izq=${L}, Der=${R}, Med=⌊(${L}+${R})/2⌋=${M}; A[${M}] = ${arr[M]} = k → ENCONTRADA.`, type: 'found', status: `<strong>Éxito:</strong> ${k} en la posición ${M} tras ${it} comparaciones.`, statusType: 'found' });
                return Sim.load(frames, { base });
            }
            const goRight = arr[med] < k;
            frames.push({ draw: () => ArrayView.draw(ui.view, arr, { cls: i => D.has(i) ? 'cell-discarded' : i === M ? 'cell-inspecting' : (i >= L && i <= R ? 'cell-active' : ''), badges, ind: { i: M, text: `A[${M}] = ${arr[M]}` } }), formula: `Med = ⌊(${L} + ${R}) / 2⌋ = ${M}`, log: `Iteración ${it}: Izq=${L}, Der=${R}, Med=${M}; A[${M}] = ${arr[M]} ${goRight ? '&lt;' : '&gt;'} ${k} → se descarta la mitad ${goRight ? 'IZQUIERDA [' + L + '..' + M + ']' : 'DERECHA [' + M + '..' + R + ']'}.`, type: 'compare' });
            if (goRight) { for (let i = izq; i <= med; i++) discarded.add(i); izq = med + 1; }
            else { for (let i = med; i <= der; i++) discarded.add(i); der = med - 1; }
            const D2 = new Set(discarded), L2 = izq, R2 = der;
            frames.push({ draw: () => ArrayView.draw(ui.view, arr, { cls: i => D2.has(i) ? 'cell-discarded' : 'cell-active', badges: i => { const b = []; if (i === L2) b.push(['Izq', 'badge-left']); if (i === R2) b.push(['Der', 'badge-right']); return b; } }), log: `Nuevo rango: Izq = ${L2}, Der = ${R2}.`, type: 'discard' });
        }
        frames.push({ draw: () => ArrayView.draw(ui.view, arr, { cls: () => 'cell-discarded' }), log: `Izq (${izq}) &gt; Der (${der}) → el rango quedó vacío. ${k} no existe.`, type: 'notfound', status: `<strong>Fracaso:</strong> ${k} no existe (${it} comparaciones).`, statusType: 'notfound' });
        Sim.load(frames, { base });
    }
    return {
        run,
        mount({ controls, stage, side }) {
            ui.arr = UI.text(S.arr.join(', '), { width: '300px' });
            ui.key = UI.num(23, { width: '80px' });
            controls.append(UI.field('Arreglo (se ordena):', ui.arr), UI.field('Clave k:', ui.key), UI.btn('Buscar', run, 'btn-primary'),
                UI.btn('🎲 Aleatorio', () => { const a = randomSortedArray(12); ui.arr.value = a.join(', '); ui.key.value = a[Math.floor(Math.random() * a.length)]; read(); base(); Sim.clear(); }));
            ui.view = h('div');
            stage.appendChild(ui.view);
            side.appendChild(UI.card('Análisis', UI.kv([['Mejor caso', '1'], ['Peor caso', '⌊log₂ n⌋ + 1'], ['Recurrencia', 'T(n) = T(n/2) + 1']])));
            read(); base();
        },
        reset() { read(); base(); Log.clear(); },
    };
})());

/* =====================================================================
 * 1.2  FUNCIONES HASH (decimal / binario) + COLISIONES
 *      Un solo laboratorio (HashLab) configurado distinto por cada tema.
 * ===================================================================== */
const HashFns = {
    digitsOf: n => String(Math.max(0, n)).length,
    bitsOf: n => Math.max(1, Math.max(0, n).toString(2).length),
    /** Ajusta un valor al rango [0, N-1] y suma la dirección base. Devuelve {addr, lines} */
    finish(val, N, baseAddr, lines, rep) {
        let v = val;
        if (v >= N) { lines.push(`${rep(v)} ≥ N=${N} → se aplica mod N: ${v} mod ${N} = ${v % N}`); v = v % N; }
        lines.push(`Dirección = ${v} + ${baseAddr} = <b>${v + baseAddr}</b>`);
        return { addr: v + baseAddr, lines };
    },
    /** Calcula H(k) según la configuración. cfg: {fn, rep, N, base, pos, b} */
    compute(k, cfg) {
        const { N, rep } = cfg, B = cfg.base;
        const L = [];
        const isBin = rep === 'bin';
        const R = v => isBin ? `${U.bin(v)}₂ (${v})` : String(v);
        if (cfg.fn === 'mod') {
            L.push(isBin ? `k = ${k} = ${U.bin(k)}₂ ; N = ${N} = ${U.bin(N)}₂` : `k = ${k} ; N = ${N}`);
            const r = k % N;
            L.push(`k mod N = ${isBin ? U.bin(k) + '₂ mod ' + U.bin(N) + '₂ = ' + U.bin(r) + '₂ (' + r + ')' : k + ' mod ' + N + ' = ' + r}`);
            L.push(`Dirección = ${r} + ${B} = <b>${r + B}</b>`);
            return { addr: r + B, lines: L, formula: `H(k) = (k mod N) + ${B}` };
        }
        if (cfg.fn === 'cuadrado') {
            const sq = k * k;
            if (!isBin) {
                const d = HashFns.digitsOf(N - 1), s = String(sq);
                const start = Math.max(0, Math.floor((s.length - d) / 2));
                const mid = s.substr(start, d) || '0';
                L.push(`k² = ${k}² = ${sq} (${s.length} dígitos)`);
                L.push(`Se toman ${d} dígito(s) centrales (N−1 = ${N - 1} tiene ${d}): ${s.slice(0, start)}<b>[${mid}]</b>${s.slice(start + d)}`);
                return Object.assign(HashFns.finish(Number(mid), N, B, L, R), { formula: `H(k) = díg_cent(k²) + ${B}` });
            }
            const d = HashFns.bitsOf(N - 1), s = sq.toString(2);
            const start = Math.max(0, Math.floor((s.length - d) / 2));
            const mid = s.substr(start, d) || '0';
            L.push(`k = ${k} = ${U.bin(k)}₂ → k² = ${sq} = ${s}₂ (${s.length} bits)`);
            L.push(`Se toman ${d} bit(s) centrales (N−1 = ${U.bin(N - 1)}₂): ${s.slice(0, start)}<b>[${mid}]</b>${s.slice(start + d)} = ${parseInt(mid, 2)}`);
            return Object.assign(HashFns.finish(parseInt(mid, 2), N, B, L, R), { formula: `H(k) = bits_cent(k²) + ${B}` });
        }
        if (cfg.fn === 'trunc') {
            const s = isBin ? k.toString(2) : String(k);
            const pos = (cfg.pos || []).filter(p => p >= 1 && p <= s.length);
            if (!pos.length) { L.push(`Ninguna de las posiciones elegidas existe en ${s}; se usa la última cifra.`); pos.push(s.length); }
            const taken = pos.map(p => s[p - 1]).join('');
            const marked = s.split('').map((c, i) => pos.includes(i + 1) ? `<b>[${c}]</b>` : c).join('');
            L.push(`k = ${k}${isBin ? ' = ' + s + '₂' : ''} ; posiciones {${pos.join(', ')}} → ${marked}`);
            const val = isBin ? parseInt(taken, 2) : Number(taken);
            L.push(`Dígitos tomados: ${taken}${isBin ? '₂ = ' + val : ''}`);
            return Object.assign(HashFns.finish(val, N, B, L, R), { formula: `H(k) = elegir_dígitos(k, {${pos.join(',')}}) + ${B}` });
        }
        if (cfg.fn === 'bases') {
            const b = cfg.b || 7, ds = String(k).split('').map(Number);
            const n = ds.length;
            const terms = ds.map((d, i) => `${d}·${b}${U.sup(n - 1 - i)}`).join(' + ');
            const val = ds.reduce((acc, d) => acc * b + d, 0);
            L.push(`k = ${k} interpretada en base ${b}: ${terms} = ${val}`);
            if (!isBin) {
                const d = HashFns.digitsOf(N - 1), s = String(val);
                const tail = s.slice(-d);
                L.push(`Se toman los ${d} dígito(s) menos significativos de ${s.slice(0, -d)}<b>[${tail}]</b> → ${Number(tail)}`);
                return Object.assign(HashFns.finish(Number(tail), N, B, L, R), { formula: `H(k) = díg_menos_sig(k₍${b}₎) + ${B}` });
            }
            const d = HashFns.bitsOf(N - 1), s = val.toString(2), tail = s.slice(-d);
            L.push(`${val} = ${s}₂ → ${d} bits menos significativos: ${s.slice(0, -d)}<b>[${tail}]</b> = ${parseInt(tail, 2)}`);
            return Object.assign(HashFns.finish(parseInt(tail, 2), N, B, L, R), { formula: `H(k) = bits_menos_sig(k₍${b}₎) + ${B}` });
        }
        throw new Error('Función hash desconocida');
    },
};

/** Fábrica del laboratorio hash. defaults: {fn, rep, coll, N, ...} */
function makeHashLab(defaults) {
    const C = Object.assign({ fn: 'mod', rep: 'dec', coll: 'lineal', N: 10, base: 1, pos: [2, 3], b: 7, sub: 3, op: 'insert' }, defaults);
    let T = null; // estructura
    let ui = {};
    const presetKeys = defaults.preset || [25, 43, 56, 35, 54, 13, 80, 104, 55, 66];

    function emptyTable() {
        if (C.coll === 'encadenamiento') return { slots: U.range(C.N).map(() => []) };
        if (C.coll === 'anidados') return { slots: U.range(C.N).map(() => U.range(C.sub).map(() => null)) };
        return { slots: U.range(C.N).map(() => null) }; // null vacío | {k, del}
    }
    const clone = t => ({ slots: t.slots.map(s => Array.isArray(s) ? s.map(x => (x && typeof x === 'object') ? Object.assign({}, x) : x) : (s && typeof s === 'object' ? Object.assign({}, s) : s)) });
    const idx = addr => addr - C.base;
    const count = t => C.coll === 'encadenamiento' ? U.sum(t.slots.map(l => l.length)) : C.coll === 'anidados' ? U.sum(t.slots.map(s => s.filter(x => x !== null).length)) : t.slots.filter(s => s && !s.del).length;

    function readCfg() {
        C.fn = ui.fn.value; C.rep = ui.rep.value; C.coll = ui.coll.value;
        C.N = Math.max(2, Math.min(60, Number(ui.N.value) || 10)); ui.N.value = C.N;
        C.base = Number(ui.base.value);
        C.pos = U.parseNums(ui.pos.value).map(Math.round);
        C.b = Math.max(2, Number(ui.b.value) || 7);
        C.sub = Math.max(1, Math.min(8, Number(ui.sub.value) || 3));
        ui.posW.style.display = C.fn === 'trunc' ? '' : 'none';
        ui.bW.style.display = C.fn === 'bases' ? '' : 'none';
        ui.subW.style.display = C.coll === 'anidados' ? '' : 'none';
    }
    function rebuild() { readCfg(); T = emptyTable(); Sim.clear(); draw(T, {}); updateFormula(); Log.clear(); Status.set('Estructura vacía creada con N = ' + C.N + ' direcciones (' + C.base + ' … ' + (C.N - 1 + C.base) + ').'); }
    function updateFormula() { Formula.set(HashFns.compute(1, C).formula + (C.coll === 'lineal' ? ' · colisión: D′ = D + i' : C.coll === 'cuadratica' ? ' · colisión: D′ = D + i²' : C.coll === 'anidados' ? ` · colisión: sub-arreglo de ${C.sub}` : C.coll === 'encadenamiento' ? ' · colisión: lista enlazada' : '')); }

    /** Dibuja la tabla. hl: {addr, sub, cls} */
    function draw(t, hl) {
        ui.view.innerHTML = '';
        const wrap = h('div', { class: 'hash-table' });
        t.slots.forEach((s, i) => {
            const addr = i + C.base;
            const row = h('div', { class: 'hash-row' }, h('span', { class: 'hash-addr', text: (C.rep === 'bin' ? U.bin(addr, HashFns.bitsOf(C.N - 1 + C.base)) + ' ' : '') + '[' + addr + ']' }));
            const isHl = hl.addr === addr;
            if (C.coll === 'encadenamiento') {
                const head = h('div', { class: 'hash-slot ' + (s.length ? '' : 'empty') + (isHl && hl.sub === undefined ? ' ' + hl.cls : ''), text: s.length ? '•' : 'nil' });
                row.appendChild(head);
                s.forEach((k, j) => {
                    row.appendChild(h('span', { class: 'chain-arrow', text: '→' }));
                    row.appendChild(h('div', { class: 'chain-node' }, h('div', { class: 'hash-slot ' + (isHl && hl.sub === j ? hl.cls : ''), text: k }), h('div', { class: 'chain-ptr', text: j === s.length - 1 ? '∅' : '•' })));
                });
            } else if (C.coll === 'anidados') {
                row.appendChild(h('div', { class: 'hash-sub' }, s.map((k, j) => h('div', { class: 'hash-slot ' + (k === null ? 'empty ' : '') + (j > 0 ? 'overflow ' : '') + (isHl && (hl.sub === j || hl.sub === undefined) ? hl.cls : ''), text: k === null ? '—' : k }))));
            } else {
                const cls = s === null ? 'empty' : s.del ? 'deleted' : '';
                row.appendChild(h('div', { class: 'hash-slot ' + cls + ' ' + (isHl ? hl.cls : ''), text: s === null ? '—' : s.k }));
            }
            wrap.appendChild(row);
        });
        const n = count(t);
        ui.view.appendChild(h('div', { class: 'stage-row' }, wrap,
            h('div', { class: 'stage-col', style: { maxWidth: '420px' } },
                UI.card('Estado', UI.kv([['N (direcciones)', C.N], ['Claves almacenadas n', n], ['Factor de carga α = n/N', U.fmt(n / C.N, 3)], ['Método de colisión', ui.coll.selectedOptions[0].text]])),
                hl.calc ? UI.card('Cálculo de H(k)', h('div', { class: 'calc-box', html: hl.calc.join('\n') })) : null)));
    }

    /** Genera los frames de una operación sobre la clave k (modifica T al final). */
    function opFrames(k, op, frames) {
        const t = clone(T);
        const hc = HashFns.compute(k, C);
        const D = hc.addr;
        const verb = op === 'insert' ? 'Insertar' : op === 'search' ? 'Buscar' : 'Eliminar';
        const snap = () => clone(t);
        frames.push({ draw: (s => () => draw(s, { addr: D, cls: 'inspecting', calc: hc.lines }))(snap()), log: `${verb} k = ${k}: ${hc.lines.join(' · ').replace(/<\/?b>/g, '')}`, type: 'step', status: `${verb} <strong>${k}</strong> → H(${k}) = <strong>${D}</strong>`, formula: hc.formula });
        const push = (st, hl, log, type, status, statusType) => frames.push({ draw: (s => () => draw(s, Object.assign({ calc: hc.lines }, hl)))(st), log, type, status, statusType });

        if (C.coll === 'encadenamiento') {
            const list = t.slots[idx(D)];
            const pos = list.indexOf(k);
            if (op === 'insert') {
                if (pos >= 0) { push(snap(), { addr: D, sub: pos, cls: 'found' }, `${k} ya existe en la lista de [${D}] → no se inserta.`, 'warn'); return t; }
                if (list.length) push(snap(), { addr: D, cls: 'collision' }, `COLISIÓN en [${D}] (lista con ${list.length} nodo(s)) → se agrega un nodo al final de la lista.`, 'discard');
                list.push(k);
                push(snap(), { addr: D, sub: list.length - 1, cls: 'found' }, `${k} insertada en la lista de [${D}] (posición ${list.length}). α = ${U.fmt(count(t) / C.N, 3)}.`, 'found', `<strong>${k}</strong> insertada en [${D}].`, 'found');
                return t;
            }
            for (let j = 0; j < list.length; j++) {
                if (list[j] === k) {
                    push(snap(), { addr: D, sub: j, cls: 'found' }, `Nodo ${j + 1} de la lista [${D}]: ${list[j]} = ${k} → encontrada (${j + 1} comparación(es)).`, 'found', op === 'search' ? `<strong>Éxito:</strong> ${k} en la lista de [${D}] (${j + 1} comparaciones).` : null, 'found');
                    if (op === 'delete') { list.splice(j, 1); push(snap(), { addr: D, cls: 'inspecting' }, `Se desenlaza el nodo con ${k}; el anterior apunta al siguiente.`, 'found', `<strong>${k}</strong> eliminada de [${D}].`, 'found'); }
                    return t;
                }
                push(snap(), { addr: D, sub: j, cls: 'inspecting' }, `Nodo ${j + 1} de la lista [${D}]: ${list[j]} ≠ ${k} → siguiente.`, 'compare');
            }
            push(snap(), { addr: D, cls: 'collision' }, `Fin de la lista de [${D}]: ${k} no existe.`, 'notfound', `<strong>Fracaso:</strong> ${k} no existe.`, 'notfound');
            return t;
        }

        if (C.coll === 'anidados') {
            const arr = t.slots[idx(D)];
            if (op === 'insert') {
                if (arr.includes(k)) { push(snap(), { addr: D, sub: arr.indexOf(k), cls: 'found' }, `${k} ya existe en [${D}].`, 'warn'); return t; }
                for (let j = 0; j < C.sub; j++) {
                    if (arr[j] === null) {
                        if (j > 0) push(snap(), { addr: D, sub: j - 1, cls: 'collision' }, `COLISIÓN en [${D}] → se usa la posición ${j + 1} del sub-arreglo.`, 'discard');
                        arr[j] = k;
                        push(snap(), { addr: D, sub: j, cls: 'found' }, `${k} almacenada en [${D}][${j + 1}].`, 'found', `<strong>${k}</strong> insertada en [${D}][${j + 1}].`, 'found');
                        return t;
                    }
                }
                push(snap(), { addr: D, cls: 'collision' }, `DESBORDAMIENTO: el sub-arreglo de [${D}] (tamaño ${C.sub}) está lleno. No es posible insertar ${k}.`, 'error', `<strong>Desbordamiento</strong> en [${D}]: el arreglo anidado está lleno.`, 'error');
                return t;
            }
            for (let j = 0; j < C.sub; j++) {
                if (arr[j] === null) break;
                if (arr[j] === k) {
                    push(snap(), { addr: D, sub: j, cls: 'found' }, `[${D}][${j + 1}] = ${k} → encontrada.`, 'found', op === 'search' ? `<strong>Éxito:</strong> ${k} en [${D}][${j + 1}].` : null, 'found');
                    if (op === 'delete') {
                        arr.splice(j, 1); arr.push(null);
                        push(snap(), { addr: D, cls: 'inspecting' }, `Se elimina ${k} y se corren a la izquierda los elementos siguientes del sub-arreglo.`, 'found', `<strong>${k}</strong> eliminada.`, 'found');
                    }
                    return t;
                }
                push(snap(), { addr: D, sub: j, cls: 'inspecting' }, `[${D}][${j + 1}] = ${arr[j]} ≠ ${k}.`, 'compare');
            }
            push(snap(), { addr: D, cls: 'collision' }, `${k} no existe en [${D}].`, 'notfound', `<strong>Fracaso:</strong> ${k} no existe.`, 'notfound');
            return t;
        }

        // Reasignación (lineal / cuadrática) o sin solución
        const probe = i => ((idx(D) + (C.coll === 'cuadratica' ? i * i : i)) % C.N + C.N) % C.N;
        if (op === 'insert') {
            let firstDel = -1;
            for (let i = 0; i < C.N; i++) {
                const p = probe(i), s = t.slots[p], A = p + C.base;
                if (s && !s.del && s.k === k) { push(snap(), { addr: A, cls: 'found' }, `${k} ya existe en [${A}].`, 'warn'); return t; }
                if (s === null || s.del) {
                    const target = s === null && firstDel >= 0 ? firstDel : p;
                    t.slots[target] = { k };
                    push(snap(), { addr: target + C.base, cls: 'found' }, `${i ? `Intento ${i}: D′ = ${C.coll === 'cuadratica' ? `D + ${i}² = ${idx(D) + i * i} mod ${C.N} → ` : `D + ${i} → `}` : ''}[${target + C.base}] ${s && s.del ? '(borrada lógicamente, se reutiliza)' : 'vacía'} → se almacena ${k}.`, 'found', `<strong>${k}</strong> insertada en [${target + C.base}]${i ? ` tras ${i} reasignación(es)` : ''}.`, 'found');
                    return t;
                }
                if (C.coll === 'ninguna') { push(snap(), { addr: A, cls: 'collision' }, `COLISIÓN en [${A}] (ocupada por ${s.k}) y no hay método de solución configurado.`, 'error', `<strong>Colisión</strong> en [${A}] sin resolver.`, 'error'); return t; }
                push(snap(), { addr: A, cls: 'collision' }, `${i === 0 ? 'COLISIÓN' : 'Intento ' + i + ':'} [${A}] ocupada por ${s.k} → ${C.coll === 'cuadratica' ? `siguiente: D + ${(i + 1)}² = ${idx(D)} + ${(i + 1) * (i + 1)}` : 'siguiente: D + ' + (i + 1)}.`, 'discard');
            }
            push(snap(), {}, `Se probaron ${C.N} direcciones sin hallar espacio${C.coll === 'cuadratica' ? ' (la prueba cuadrática no recorre todas las celdas)' : ''}. No se pudo insertar ${k}.`, 'error', `<strong>Estructura sin espacio alcanzable</strong> para ${k}.`, 'error');
            return t;
        }
        for (let i = 0; i < C.N; i++) {
            const p = probe(i), s = t.slots[p], A = p + C.base;
            if (s === null) { push(snap(), { addr: A, cls: 'collision' }, `[${A}] vacía → la clave ${k} no existe (se detiene la búsqueda).`, 'notfound', `<strong>Fracaso:</strong> ${k} no existe (${i + 1} accesos).`, 'notfound'); return t; }
            if (!s.del && s.k === k) {
                push(snap(), { addr: A, cls: 'found' }, `[${A}] = ${k} → encontrada en ${i + 1} acceso(s).`, 'found', op === 'search' ? `<strong>Éxito:</strong> ${k} en [${A}] (${i + 1} accesos).` : null, 'found');
                if (op === 'delete') { t.slots[p] = { k, del: true }; push(snap(), { addr: A, cls: 'inspecting' }, `Borrado LÓGICO de ${k} en [${A}] (marca de eliminado para no romper las cadenas de reasignación).`, 'found', `<strong>${k}</strong> eliminada de [${A}].`, 'found'); }
                return t;
            }
            if (C.coll === 'ninguna') { push(snap(), { addr: A, cls: 'collision' }, `[${A}] contiene ${s.k} ≠ ${k} y no hay reasignación → no existe.`, 'notfound', `<strong>Fracaso:</strong> ${k} no existe.`, 'notfound'); return t; }
            push(snap(), { addr: A, cls: 'inspecting' }, `[${A}] ${s.del ? 'borrada lógicamente' : '= ' + s.k + ' ≠ ' + k} → siguiente dirección.`, 'compare');
        }
        push(snap(), {}, `Se recorrieron ${C.N} direcciones: ${k} no existe.`, 'notfound', `<strong>Fracaso:</strong> ${k} no existe.`, 'notfound');
        return t;
    }

    function run() {
        readCfg();
        if (!T || T.slots.length !== C.N) T = emptyTable();
        const keys = U.parseNums(ui.keys.value).map(Math.round).filter(x => x >= 0);
        if (!keys.length) { Status.set('Ingrese al menos una clave (entero ≥ 0).', 'error'); return; }
        const op = ui.op.value, frames = [];
        const start = clone(T);
        keys.forEach(k => { T = opFrames(k, op, frames); });
        const n = count(T);
        frames.push({ draw: (s => () => draw(s, {}))(clone(T)), log: `Resumen: n = ${n}, N = ${C.N}, α = ${U.fmt(n / C.N, 3)}.`, type: 'info' });
        Sim.load(frames, { base: () => draw(start, {}) });
    }

    return {
        run,
        mount({ controls, stage, side }) {
            ui.fn = UI.select([['mod', 'Módulo (división)'], ['cuadrado', 'Centro del cuadrado'], ['trunc', 'Truncamiento'], ['bases', 'Conversión de bases']], C.fn, rebuild);
            ui.rep = UI.select([['dec', 'Decimal'], ['bin', 'Binario']], C.rep, rebuild);
            ui.coll = UI.select([['lineal', 'Reasignación lineal'], ['cuadratica', 'Reasignación cuadrática'], ['anidados', 'Arreglos anidados'], ['encadenamiento', 'Encadenamiento'], ['ninguna', 'Ninguno (solo detectar)']], C.coll, rebuild);
            ui.N = UI.num(C.N, { min: 2, max: 60, width: '70px' }); ui.N.addEventListener('change', rebuild);
            ui.base = UI.select([['1', '1 (H(k)+1)'], ['0', '0']], String(C.base), rebuild);
            ui.pos = UI.text(C.pos.join(','), { width: '80px' }); ui.pos.addEventListener('change', rebuild);
            ui.b = UI.num(C.b, { min: 2, max: 36, width: '60px' }); ui.b.addEventListener('change', rebuild);
            ui.sub = UI.num(C.sub, { min: 1, max: 8, width: '60px' }); ui.sub.addEventListener('change', rebuild);
            ui.posW = UI.field('Posiciones:', ui.pos); ui.bW = UI.field('Base b:', ui.b); ui.subW = UI.field('Tamaño sub-arreglo:', ui.sub);
            ui.op = UI.select([['insert', 'Insertar'], ['search', 'Buscar'], ['delete', 'Eliminar']], 'insert');
            ui.keys = UI.text(presetKeys.join(', '), { width: '230px', placeholder: 'claves separadas por coma' });
            controls.append(
                h('div', { class: 'ctrl-row' }, UI.field('Función:', ui.fn), UI.field('Representación:', ui.rep), UI.field('N:', ui.N), UI.field('Dir. base:', ui.base), ui.posW, ui.bW),
                h('div', { class: 'ctrl-row' }, UI.field('Colisiones:', ui.coll), ui.subW, UI.sep(), UI.field('Operación:', ui.op), UI.field('Clave(s):', ui.keys), UI.btn('Ejecutar', run, 'btn-primary'),
                    UI.btn('Vaciar', rebuild), UI.btn('Preset clase', () => { ui.keys.value = presetKeys.join(', '); ui.op.value = 'insert'; rebuild(); })));
            ui.view = h('div');
            stage.appendChild(ui.view);
            side.appendChild(UI.card('Comparación de funciones', UI.table(['Función', 'Costo H(k)'], [['Módulo', 'O(1)'], ['Cuadrado', 'O(1) (1 multiplicación)'], ['Truncamiento', 'O(d)'], ['Conv. bases', 'O(d)']])));
            side.appendChild(UI.card('Colisiones (α = n/N)', UI.table(['Método', 'Éxito prom.', 'Fracaso prom.'], [['Lineal', '½(1 + 1/(1−α))', '½(1 + 1/(1−α)²)'], ['Cuadrática', '≈ 1 − ln(1−α) − α/2', '≈ 1/(1−α) − α − ln(1−α)'], ['Encadenamiento', '1 + α/2', 'α'], ['Anidados', 'O(s)', 'O(s)']])));
            rebuild();
        },
        reset() { draw(T, {}); Log.clear(); },
    };
}
App.register('transformacion', makeHashLab({ fn: 'mod', coll: 'lineal', N: 10, op: 'search', preset: [25, 43, 56, 35, 54, 13, 80, 104] }));
App.register('hash-modulo', makeHashLab({ fn: 'mod', coll: 'lineal', N: 11, preset: [45, 13, 34, 67, 23, 74, 99, 20] }));
App.register('hash-cuadrado', makeHashLab({ fn: 'cuadrado', coll: 'lineal', N: 100, preset: [7259, 9359, 3638, 4567, 1234] }));
App.register('hash-truncamiento', makeHashLab({ fn: 'trunc', coll: 'lineal', N: 100, pos: [1, 3], preset: [7259, 9359, 3638, 4567, 1234] }));
App.register('hash-bases', makeHashLab({ fn: 'bases', coll: 'lineal', N: 100, b: 7, preset: [7259, 9359, 3638, 4567, 1234] }));
App.register('col-reasignacion', makeHashLab({ fn: 'mod', coll: 'lineal', N: 10, preset: [25, 43, 56, 35, 54, 13, 80, 104, 55] }));
App.register('col-anidados', makeHashLab({ fn: 'mod', coll: 'anidados', N: 7, sub: 3, preset: [25, 43, 56, 35, 54, 13, 80, 104, 55, 18] }));
App.register('col-encadenamiento', makeHashLab({ fn: 'mod', coll: 'encadenamiento', N: 7, preset: [25, 43, 56, 35, 54, 13, 80, 104, 55, 18] }));

/* =====================================================================
 * 1.1  ESTRUCTURAS DINÁMICAS POR CUBETAS
 * ===================================================================== */
const Buckets = {
    /** Secuencia de tamaños alcanzables (total: n0,2n0,4n0… / parcial: n0,1.5n0,2n0,3n0,4n0…). */
    sizes(n0, mode, maxCap, R) {
        const out = [n0];
        let L = n0;
        while (out[out.length - 1] * R < maxCap) {
            if (mode === 'parcial') { out.push(L + Math.ceil(L / 2)); out.push(2 * L); }
            else out.push(2 * L);
            L = 2 * L;
        }
        return out;
    },
    /** Valida la configuración. Devuelve lista de inconsistencias {title, html}. */
    validate(n0, R, dexp, dred, mode) {
        const errs = [];
        if (!(dexp > 0 && dexp <= 1)) errs.push({ title: 'Densidad de expansión inválida', html: 'Debe estar entre 0% y 100%.' });
        if (!(dred >= 0 && dred < 1)) errs.push({ title: 'Densidad de reducción inválida', html: 'Debe estar entre 0% y 100%.' });
        if (dred >= dexp) errs.push({ title: 'Umbrales contradictorios', html: `La densidad de reducción (${Math.round(dred * 100)}%) debe ser MENOR que la de expansión (${Math.round(dexp * 100)}%); de lo contrario la estructura se expandiría y reduciría indefinidamente.` });
        if (errs.length) return errs;
        const sizes = Buckets.sizes(n0, mode, Math.max(400, n0 * R * 16), R);
        for (let i = 0; i < sizes.length; i++) {
            const n = sizes[i], C = n * R;
            const kExp = Math.ceil(dexp * C - 1e-9);
            if (kExp >= C) {
                errs.push({ title: 'Inconsistencia teórica: la estructura tendría que llenarse al 100%', html: `Con ${n} cubeta(s) × ${R} registro(s) = <b>${C}</b> espacios, alcanzar DO ≥ ${Math.round(dexp * 100)}% exige ⌈${dexp} × ${C}⌉ = <b>${kExp}</b> registros, es decir ${kExp}/${C} = 100%. Una estructura dinámica NUNCA puede llenarse al 100%: <b>se rechaza el procedimiento</b>. Disminuya la densidad de expansión o aumente cubetas/registros.` });
                break;
            }
            if (i + 1 < sizes.length) {
                const C2 = sizes[i + 1] * R;
                if (kExp / C2 <= dred + 1e-12) errs.push({ title: 'Inconsistencia: expansión seguida de reducción inmediata', html: `Al expandir de ${n} a ${sizes[i + 1]} cubetas con ${kExp} registros la densidad queda en ${kExp}/${C2} = ${U.fmt(100 * kExp / C2, 2)}% ≤ ${Math.round(dred * 100)}% (umbral de reducción): la estructura se reduciría de inmediato.` });
            }
            if (i > 0) {
                const kRed = Math.floor(dred * C + 1e-9);
                const C0 = sizes[i - 1] * R;
                if (kRed / C0 >= dexp - 1e-12) errs.push({ title: 'Inconsistencia: reducción seguida de expansión inmediata', html: `Al reducir de ${n} a ${sizes[i - 1]} cubetas con ${kRed} registros la densidad sería ${kRed}/${C0} = ${U.fmt(100 * kRed / C0, 2)}% ≥ ${Math.round(dexp * 100)}%: se expandiría de inmediato.` });
            }
            if (errs.length) break;
        }
        return errs;
    },
};

App.register('cubetas', (() => {
    const C = { n0: 2, R: 2, dexp: 0.75, dred: 0.25, mexp: 'total', mred: 'total' };
    let st = null, ui = {};
    const preset = [23, 45, 12, 37, 18, 26, 41, 9, 50, 33];

    const cap = s => s.n * C.R;
    const total = s => U.sum(s.b.map(b => b.main.length + b.over.length));
    const cloneS = s => ({ n: s.n, sizeIdx: s.sizeIdx, b: s.b.map(b => ({ main: b.main.slice(), over: b.over.slice() })), order: s.order.slice() });
    const sizesFor = mode => Buckets.sizes(C.n0, mode, 1e5, C.R);

    function readCfg() {
        C.n0 = Math.max(1, Number(ui.n0.value) || 2); C.R = Math.max(1, Number(ui.R.value) || 2);
        C.dexp = Number(ui.dexp.value) / 100; C.dred = Number(ui.dred.value) / 100;
        C.mexp = ui.mexp.value; C.mred = ui.mred.value;
    }
    function newStruct(n) { return { n, sizeIdx: 0, b: U.range(n).map(() => ({ main: [], over: [] })), order: [] }; }
    function create() {
        readCfg();
        Sim.clear(); Log.clear();
        ui.alerts.innerHTML = '';
        const errs = Buckets.validate(C.n0, C.R, C.dexp, C.dred, C.mexp);
        if (C.mred !== C.mexp) errs.push(...Buckets.validate(C.n0, C.R, C.dexp, C.dred, C.mred).filter(e => !errs.some(x => x.title === e.title)));
        if (errs.length) {
            errs.forEach(e => ui.alerts.appendChild(UI.alert('inconsistency', e.title, e.html)));
            errs.forEach(e => Log.add('INCONSISTENCIA: ' + e.title + ' — ' + e.html.replace(/<[^>]+>/g, ''), 'error'));
            Status.set('<strong>Procedimiento rechazado</strong>: la configuración es teóricamente inconsistente.', 'error');
            st = null; ui.view.innerHTML = '';
            ui.run.disabled = true;
            return false;
        }
        ui.run.disabled = false;
        st = newStruct(C.n0);
        ui.alerts.appendChild(UI.alert('ok', 'Configuración consistente', `Con ${C.n0}×${C.R} = ${C.n0 * C.R} espacios, la expansión ocurre al llegar a ${Math.ceil(C.dexp * C.n0 * C.R - 1e-9)} registros (DO ≥ ${Math.round(C.dexp * 100)}%), antes de llenarse al 100%.`));
        draw(st, {});
        Status.set('Estructura creada. Inserte o elimine claves.');
        return true;
    }
    function hashOf(k, n) { return k % n; }
    function place(s, k, log) {
        const a = hashOf(k, s.n), b = s.b[a];
        if (b.main.length < C.R) { b.main.push(k); if (log) log(`h(${k}) = ${k} mod ${s.n} = ${a} → cubeta ${a}, registro ${b.main.length}.`, 'info'); return { a, over: false }; }
        b.over.push(k); if (log) log(`h(${k}) = ${k} mod ${s.n} = ${a} → cubeta ${a} LLENA → COLISIÓN: va al área de colisiones (cuenta en la densidad).`, 'discard');
        return { a, over: true };
    }
    function redistribute(s, newN, frames, why) {
        const keys = s.order.slice();
        const ns = newStruct(newN); ns.order = keys.slice(); ns.sizeIdx = s.sizeIdx;
        frames.push({ draw: (x => () => draw(x, { flash: true }))(cloneS(ns)), log: `${why}: ${s.n} → ${newN} cubetas. Se redistribuyen las ${keys.length} claves con h(k) = k mod ${newN}.`, type: 'step' });
        keys.forEach(k => {
            const r = place(ns, k, null);
            const snap = cloneS(ns);
            frames.push({ draw: () => draw(snap, { active: r.a, hlKey: k }), log: `  h(${k}) = ${k} mod ${newN} = ${r.a}${r.over ? ' → colisión (área de colisiones)' : ''}.`, type: r.over ? 'discard' : 'compare' });
        });
        return ns;
    }
    function density(s) { return total(s) / cap(s); }

    function insert(k, frames) {
        if (st.order.includes(k)) { frames.push({ log: `${k} ya existe; no se inserta.`, type: 'warn' }); return; }
        const logs = [];
        const r = place(st, k, (m, t) => logs.push([m, t]));
        st.order.push(k);
        const s1 = cloneS(st), d = density(st);
        frames.push({ draw: () => draw(s1, { active: r.a, hlKey: k }), logs: [[`INSERTAR ${k}`, 'step'], ...logs, [`DO = ${total(s1)} / (${s1.n}×${C.R}) = ${total(s1)}/${cap(s1)} = ${U.fmt(d * 100, 2)}% ${d >= C.dexp ? '≥' : '&lt;'} ${Math.round(C.dexp * 100)}% (expansión)`, d >= C.dexp ? 'warn' : 'info']], status: `Insertada <strong>${k}</strong>. DO = ${U.fmt(d * 100, 2)}%`, formula: `DO = registros / (cubetas × R) = ${total(s1)} / ${cap(s1)}` });
        if (total(st) >= cap(st)) {
            frames.push({ draw: () => ui.alerts.appendChild(UI.alert('inconsistency', 'Inconsistencia: estructura llena al 100%', 'La estructura alcanzó el 100% de ocupación. Esto no debe ocurrir en una estructura dinámica.')), log: 'INCONSISTENCIA: la estructura llegó al 100%.', type: 'error' });
        }
        let guard = 0;
        while (density(st) >= C.dexp - 1e-12 && guard++ < 6) {
            const sizes = sizesFor(C.mexp);
            let i = sizes.indexOf(st.n);
            if (i < 0) i = sizes.findIndex(x => x > st.n) - 1;
            const newN = sizes[i + 1];
            st = redistribute(st, newN, frames, `EXPANSIÓN ${C.mexp.toUpperCase()} (DO ≥ ${Math.round(C.dexp * 100)}%)`);
            const s2 = cloneS(st), d2 = density(st);
            frames.push({ draw: () => draw(s2, {}), log: `Nueva DO = ${total(s2)}/${cap(s2)} = ${U.fmt(d2 * 100, 2)}%.`, type: 'found', status: `Expansión ${C.mexp}: ahora ${s2.n} cubetas, DO = ${U.fmt(d2 * 100, 2)}%`, statusType: 'found' });
        }
    }
    function remove(k, frames) {
        const a = hashOf(k, st.n), b = st.b[a];
        let where = b.main.indexOf(k), inOver = false;
        if (where < 0) { where = b.over.indexOf(k); inOver = where >= 0; }
        const s0 = cloneS(st);
        frames.push({ draw: () => draw(s0, { active: a, hlKey: k, del: true }), log: `ELIMINAR ${k}: h(${k}) = ${k} mod ${st.n} = ${a} → se revisa la cubeta ${a}${b.over.length ? ' y su área de colisiones' : ''}.`, type: 'step' });
        if (where < 0) { frames.push({ log: `${k} no existe en la estructura.`, type: 'notfound', status: `<strong>${k}</strong> no existe.`, statusType: 'notfound' }); return; }
        if (inOver) b.over.splice(where, 1);
        else {
            b.main.splice(where, 1);
            if (b.over.length) { const up = b.over.shift(); b.main.push(up); frames.push({ log: `Se sube ${up} del área de colisiones a la cubeta ${a}.`, type: 'info' }); }
        }
        st.order = st.order.filter(x => x !== k);
        const s1 = cloneS(st), d = density(st);
        frames.push({ draw: () => draw(s1, { active: a }), log: `DO = ${total(s1)}/${cap(s1)} = ${U.fmt(d * 100, 2)}% ${d <= C.dred ? '≤' : '&gt;'} ${Math.round(C.dred * 100)}% (reducción)`, type: d <= C.dred ? 'warn' : 'info', status: `Eliminada <strong>${k}</strong>. DO = ${U.fmt(d * 100, 2)}%`, formula: `DO = ${total(s1)} / ${cap(s1)}` });
        let guard = 0;
        while (density(st) <= C.dred + 1e-12 && st.n > C.n0 && guard++ < 6) {
            const sizes = sizesFor(C.mred);
            let i = sizes.indexOf(st.n);
            if (i < 0) i = sizes.findIndex(x => x > st.n);
            const newN = Math.max(C.n0, sizes[Math.max(0, i - 1)]);
            if (newN >= st.n) break;
            st = redistribute(st, newN, frames, `REDUCCIÓN ${C.mred.toUpperCase()} (DO ≤ ${Math.round(C.dred * 100)}%)`);
            const s2 = cloneS(st), d2 = density(st);
            frames.push({ draw: () => draw(s2, {}), log: `Nueva DO = ${total(s2)}/${cap(s2)} = ${U.fmt(d2 * 100, 2)}%.`, type: 'found', status: `Reducción ${C.mred}: ahora ${s2.n} cubetas, DO = ${U.fmt(d2 * 100, 2)}%`, statusType: 'found' });
        }
        if (density(st) <= C.dred && st.n === C.n0) frames.push({ log: `DO ≤ ${Math.round(C.dred * 100)}% pero ya se está en el tamaño inicial (${C.n0} cubetas): no se reduce más.`, type: 'info' });
    }
    function run() {
        if (!st && !create()) return;
        const keys = U.parseNums(ui.keys.value).map(Math.round).filter(x => x >= 0);
        if (!keys.length) { Status.set('Ingrese claves.', 'error'); return; }
        const op = ui.op.value, frames = [], start = cloneS(st);
        keys.forEach(k => (op === 'insert' ? insert : remove)(k, frames));
        Sim.load(frames, { base: () => draw(start, {}) });
    }
    function draw(s, o) {
        ui.view.innerHTML = '';
        const d = density(s);
        const bk = h('div', { class: 'buckets' }, s.b.map((b, i) => h('div', { class: 'bucket' + (o.active === i ? ' active' : '') },
            h('div', { class: 'bucket-title', text: `Cubeta ${i}` }),
            U.range(C.R).map(j => { const k = b.main[j]; return h('div', { class: 'slot' + (k !== undefined ? ' filled' : '') + (k !== undefined && k === o.hlKey ? (o.del ? ' del' : ' hl') : ''), text: k !== undefined ? k : '' }); }),
            b.over.length ? h('div', { class: 'overflow-area' }, h('div', { class: 'hint', text: 'Colisiones' }), b.over.map(k => h('div', { class: 'slot' + (k === o.hlKey ? (o.del ? ' del' : ' hl') : ''), text: k }))) : null)));
        const coll = U.sum(s.b.map(b => b.over.length));
        const bar = h('div', { class: 'density-bar' }, h('div', { class: 'density-fill', style: { width: Math.min(100, d * 100) + '%' } }),
            h('div', { class: 'density-mark exp', style: { left: C.dexp * 100 + '%' }, title: 'Expansión' }), h('div', { class: 'density-mark red', style: { left: C.dred * 100 + '%' }, title: 'Reducción' }));
        ui.view.append(
            UI.kv([['Cubetas × R', `${s.n} × ${C.R} = ${cap(s)} espacios`], ['Registros (incl. colisiones)', total(s)], ['Colisiones', coll], ['Densidad DO', `${U.fmt(d * 100, 2)}%  (expande ≥ ${Math.round(C.dexp * 100)}% · reduce ≤ ${Math.round(C.dred * 100)}%)`], ['Orden de inserción', s.order.join(', ') || '—']]),
            bar, h('div', { class: 'legend' }, h('span', null, h('i', { style: { borderColor: '#C62828' } }), 'umbral de expansión'), h('span', null, h('i', { style: { borderColor: '#1565C0' } }), 'umbral de reducción')), bk);
    }
    return {
        run,
        mount({ controls, stage, side }) {
            ui.n0 = UI.num(C.n0, { min: 1, width: '60px' }); ui.R = UI.num(C.R, { min: 1, width: '60px' });
            ui.dexp = UI.num(75, { min: 1, max: 100, width: '64px' }); ui.dred = UI.num(25, { min: 0, max: 99, width: '64px' });
            ui.mexp = UI.select([['total', 'Total (×2)'], ['parcial', 'Parcial (+50%)']], 'total');
            ui.mred = UI.select([['total', 'Total (÷2)'], ['parcial', 'Parcial']], 'total');
            ui.op = UI.select([['insert', 'Insertar'], ['delete', 'Eliminar']], 'insert');
            ui.keys = UI.text(preset.join(', '), { width: '220px' });
            ui.run = UI.btn('Ejecutar', run, 'btn-primary');
            controls.append(
                h('div', { class: 'ctrl-row' }, UI.field('Cubetas iniciales:', ui.n0), UI.field('Registros/cubeta R:', ui.R), UI.field('DO expansión %:', ui.dexp), UI.field('DO reducción %:', ui.dred), UI.field('Expansión:', ui.mexp), UI.field('Reducción:', ui.mred), UI.btn('Crear / Validar', create, 'btn-secondary')),
                h('div', { class: 'ctrl-row' }, UI.field('Operación:', ui.op), UI.field('Claves:', ui.keys), ui.run,
                    UI.btn('Preset válido (2×2, 75%/25%)', () => { ui.n0.value = 2; ui.R.value = 2; ui.dexp.value = 75; ui.dred.value = 25; ui.keys.value = preset.join(', '); ui.op.value = 'insert'; create(); }),
                    UI.btn('Preset inconsistente (2×2, 80%)', () => { ui.n0.value = 2; ui.R.value = 2; ui.dexp.value = 80; ui.dred.value = 25; create(); }, 'btn-danger')));
            ui.alerts = h('div', { class: 'stage-col' });
            ui.view = h('div', { class: 'stage-col' });
            stage.append(ui.alerts, ui.view);
            side.appendChild(UI.card('Reglas', h('div', { class: 'hint', html: '• DO = (registros en cubetas + colisiones) / (cubetas × R).<br>• Al insertar: si DO ≥ DO<sub>exp</sub> → expansión y redistribución.<br>• Al eliminar: si DO ≤ DO<sub>red</sub> → reducción (nunca por debajo del tamaño inicial).<br>• Si alcanzar DO<sub>exp</sub> exige llenar el 100% → <b>inconsistencia</b>.' })));
            create();
        },
        reset() { if (st) draw(st, {}); Log.clear(); },
    };
})());

/* =====================================================================
 * 1.3  ÁRBOLES DIGITALES (5 bits), RESIDUOS Y RESIDUOS MÚLTIPLE
 * ===================================================================== */
const Letters = {
    code: ch => U.bin(ch.charCodeAt(0) - 64, 5),
    /** Extrae claves (letras A-Z). Una sola palabra se separa en letras. */
    parse(str) {
        const toks = String(str).toUpperCase().split(/[\s,;]+/).filter(Boolean);
        const out = [];
        toks.forEach(t => t.split('').forEach(c => { if (c >= 'A' && c <= 'Z') out.push(c); }));
        return out;
    },
    freq(list) { const f = {}; list.forEach(c => f[c] = (f[c] || 0) + 1); return f; },
    table(container, keys, depthOf, title) {
        const f = Letters.freq(keys);
        const uniq = Object.keys(f).sort((a, b) => keys.indexOf(a) - keys.indexOf(b));
        let tot = 0;
        const rows = uniq.map(c => { const L = depthOf(c); tot += L * f[c]; return [c, Letters.code(c), L, f[c], L * f[c]]; });
        rows.push([{ html: '<b>Total</b>', colspan: 4 }, `<b>Σ Lᵢ·fᵢ = ${tot}</b>`]);
        container.appendChild(UI.card(title || 'Tabla de bits', UI.table(['Clave', 'Código (5 bits)', 'Lᵢ (bits usados)', 'fᵢ', 'Lᵢ × fᵢ'], rows.map(r => r.length === 2 ? r : r))));
        return tot;
    },
};
/** Fábrica para los tres árboles por bits. kind: 'digital' | 'residuos' | 'multiple' */
function makeBitTree(kind) {
    let ui = {}, root = null, keys = [], mBits = 2, nid = 0;
    const preset = 'C A S O F E L I Z';
    const node = o => Object.assign({ id: ++nid }, o);
    const cloneTree = n => n ? Object.assign({}, n, { kids: n.kids ? n.kids.map(cloneTree) : undefined, left: n.left !== undefined ? cloneTree(n.left) : undefined, right: n.right !== undefined ? cloneTree(n.right) : undefined }) : null;
    const codeOf = c => { let s = Letters.code(c); if (kind === 'multiple') while (s.length % mBits) s += '0'; return s; };
    const groups = s => { const g = []; for (let i = 0; i < s.length; i += (kind === 'multiple' ? mBits : 1)) g.push(s.substr(i, kind === 'multiple' ? mBits : 1)); return g; };
    const fanout = () => kind === 'multiple' ? (1 << mBits) : 2;

    function drawTree(r, hl = {}) {
        ui.tree.innerHTML = '';
        if (kind === 'digital') {
            TreeView.render(ui.tree, r, {
                kids: n => [n.left, n.right], label: n => n.key, sub: n => Letters.code(n.key),
                cls: n => hl.path && hl.path.includes(n.id) ? (n.id === hl.cur ? (hl.found ? 'found' : 'inspecting') : 'visited') : '',
                edgeLabel: (p, i) => String(i), edgeCls: (p, c) => hl.path && hl.path.includes(c.id) ? 'active' : '', spacing: 58,
            });
        } else {
            TreeView.render(ui.tree, r, {
                kids: n => n.kids || [], label: n => n.key ? n.key : '()', shape: n => n.key ? 'rect' : 'circle',
                sub: n => n.key ? codeOf(n.key) : '', rFn: n => n.key ? 20 : 12,
                cls: n => (n.key ? 'leaf ' : 'internal ') + (hl.path && hl.path.includes(n.id) ? (n.id === hl.cur ? (hl.found ? 'found' : 'inspecting') : 'visited') : ''),
                edgeLabel: (p, i) => kind === 'multiple' ? U.bin(i, mBits) : String(i), edgeCls: (p, c) => hl.path && hl.path.includes(c.id) ? 'active' : '', spacing: kind === 'multiple' ? 64 : 58,
            });
        }
    }
    function drawTable() {
        ui.table.innerHTML = '';
        if (!keys.length) return;
        const depth = {};
        (function rec(n, d) {
            if (!n) return;
            if (kind === 'digital') { depth[n.key] = d; rec(n.left, d + 1); rec(n.right, d + 1); }
            else { if (n.key) depth[n.key] = d * (kind === 'multiple' ? mBits : 1); (n.kids || []).forEach(c => rec(c, d + 1)); }
        })(root, 0);
        Letters.table(ui.table, keys, c => depth[c] || 0, kind === 'multiple' ? `Tabla de bits (m = ${mBits}: cada nivel consume ${mBits} bits)` : 'Tabla de bits');
    }
    /** Inserta en el árbol (mutando) y agrega frames */
    function insert(c, frames) {
        const code = codeOf(c), g = groups(code);
        if (kind === 'digital') {
            if (!root) { root = node({ key: c, left: null, right: null }); const t = cloneTree(root), id = root.id; frames.push({ draw: () => drawTree(t, { path: [id], cur: id, found: true }), log: `${c} = ${code}: árbol vacío → ${c} es la RAÍZ (0 bits usados).`, type: 'found' }); return; }
            let n = root; const path = [n.id];
            for (let i = 0; i < 5; i++) {
                if (n.key === c) { frames.push({ log: `${c} ya existe (frecuencia +1).`, type: 'warn' }); return; }
                const bit = code[i], dir = bit === '0' ? 'left' : 'right';
                const t = cloneTree(root), p = path.slice(), cur = n.id;
                frames.push({ draw: () => drawTree(t, { path: p, cur }), log: `Nivel ${i}: nodo ${n.key} ocupado → bit ${i + 1} de ${code.slice(0, i)}[${bit}]${code.slice(i + 1)} = ${bit} → ${bit === '0' ? 'IZQUIERDA' : 'DERECHA'}.`, type: 'compare' });
                if (!n[dir]) {
                    n[dir] = node({ key: c, left: null, right: null }); path.push(n[dir].id);
                    const t2 = cloneTree(root), p2 = path.slice(), id = n[dir].id;
                    frames.push({ draw: () => drawTree(t2, { path: p2, cur: id, found: true }), log: `Espacio libre → ${c} se almacena en el nivel ${i + 1} (${i + 1} bits usados).`, type: 'found' });
                    return;
                }
                n = n[dir]; path.push(n.id);
            }
            return;
        }
        // Residuos / residuos múltiple: claves solo en hojas, raíz interna
        if (!root) root = node({ kids: U.range(fanout()).map(() => null) });
        let n = root; const path = [n.id];
        for (let lvl = 0; lvl < g.length; lvl++) {
            const b = parseInt(g[lvl], 2);
            const t = cloneTree(root), p = path.slice(), cur = n.id;
            frames.push({ draw: () => drawTree(t, { path: p, cur }), log: `Nivel ${lvl}: nodo interno () → ${kind === 'multiple' ? 'grupo' : 'bit'} ${lvl + 1} de ${code} = ${g[lvl]} → rama ${g[lvl]}.`, type: 'compare' });
            const child = n.kids[b];
            if (!child) {
                n.kids[b] = node({ key: c }); path.push(n.kids[b].id);
                const t2 = cloneTree(root), p2 = path.slice(), id = n.kids[b].id;
                frames.push({ draw: () => drawTree(t2, { path: p2, cur: id, found: true }), log: `Rama vacía → hoja ${c} en profundidad ${lvl + 1} (${(lvl + 1) * (kind === 'multiple' ? mBits : 1)} bits).`, type: 'found' });
                return;
            }
            if (child.key) {
                if (child.key === c) { frames.push({ log: `${c} ya existe (frecuencia +1).`, type: 'warn' }); return; }
                // colisión en hoja: dividir
                const other = child.key, og = groups(codeOf(other));
                const t3 = cloneTree(root), p3 = path.concat(child.id), id3 = child.id;
                frames.push({ draw: () => drawTree(t3, { path: p3, cur: id3 }), log: `COLISIÓN con la hoja ${other} (${codeOf(other)}) → se divide creando nodos internos vacíos () hasta que los ${kind === 'multiple' ? 'grupos' : 'bits'} difieran.`, type: 'discard' });
                let parent = n, slot = b, l = lvl + 1;
                while (l < g.length && og[l] === g[l]) {
                    const inner = node({ kids: U.range(fanout()).map(() => null) });
                    parent.kids[slot] = inner; path.push(inner.id);
                    const tt = cloneTree(root), pp = path.slice();
                    frames.push({ draw: () => drawTree(tt, { path: pp, cur: inner.id }), log: `Nivel ${l}: ambos tienen ${g[l]} → nuevo nodo interno vacío ().`, type: 'info' });
                    parent = inner; slot = parseInt(g[l], 2); l++;
                }
                const inner = node({ kids: U.range(fanout()).map(() => null) });
                parent.kids[slot] = inner; path.push(inner.id);
                inner.kids[parseInt(og[l], 2)] = node({ key: other });
                inner.kids[parseInt(g[l], 2)] = node({ key: c });
                const tf = cloneTree(root), pf = path.slice(), idf = inner.kids[parseInt(g[l], 2)].id;
                frames.push({ draw: () => drawTree(tf, { path: pf.concat(idf), cur: idf, found: true }), log: `Nivel ${l}: ${other} → ${og[l]}, ${c} → ${g[l]}. Ambas quedan en hojas a profundidad ${l + 1}.`, type: 'found' });
                return;
            }
            n = child; path.push(n.id);
        }
    }
    function searchFrames(c, frames) {
        const code = codeOf(c), g = groups(code);
        let n = root; const path = [];
        if (kind === 'digital') {
            for (let i = 0; n; i++) {
                path.push(n.id);
                const t = cloneTree(root), p = path.slice(), cur = n.id;
                if (n.key === c) { frames.push({ draw: () => drawTree(t, { path: p, cur, found: true }), log: `Nodo ${n.key} = ${c} → ENCONTRADA (${i} bits, ${i + 1} comparaciones).`, type: 'found', status: `<strong>${c}</strong> encontrada.`, statusType: 'found' }); return; }
                const bit = code[i];
                frames.push({ draw: () => drawTree(t, { path: p, cur }), log: `Nodo ${n.key} ≠ ${c} → bit ${i + 1} = ${bit} → ${bit === '0' ? 'izquierda' : 'derecha'}.`, type: 'compare' });
                n = bit === '0' ? n.left : n.right;
            }
        } else {
            for (let i = 0; n; i++) {
                path.push(n.id);
                const t = cloneTree(root), p = path.slice(), cur = n.id;
                if (n.key) { const ok = n.key === c; frames.push({ draw: () => drawTree(t, { path: p, cur, found: ok }), log: `Hoja ${n.key} ${ok ? '=' : '≠'} ${c} → ${ok ? 'ENCONTRADA' : 'no existe'}.`, type: ok ? 'found' : 'notfound', status: ok ? `<strong>${c}</strong> encontrada.` : `<strong>${c}</strong> no existe.`, statusType: ok ? 'found' : 'notfound' }); return; }
                frames.push({ draw: () => drawTree(t, { path: p, cur }), log: `Nodo interno → rama ${g[i]}.`, type: 'compare' });
                n = n.kids[parseInt(g[i], 2)];
            }
        }
        frames.push({ log: `Puntero nulo: ${c} no existe.`, type: 'notfound', status: `<strong>${c}</strong> no existe.`, statusType: 'notfound' });
    }
    function build() {
        if (kind === 'multiple') mBits = Number(ui.m.value);
        root = null; nid = 0;
        keys = Letters.parse(ui.keys.value);
        const uniq = []; keys.forEach(c => { if (!uniq.includes(c)) uniq.push(c); });
        const frames = [];
        frames.push({ log: `Claves: ${keys.join(' ')} → ${uniq.length} distintas. Conversión A=00001 … Z=11010${kind === 'multiple' ? ` (se rellenan con 0 hasta múltiplo de m=${mBits})` : ''}.`, type: 'step' });
        uniq.forEach(c => { frames.push({ log: `INSERTAR ${c} = ${codeOf(c)}`, type: 'step', status: `Insertando <strong>${c}</strong> = ${codeOf(c)}` }); insert(c, frames); });
        const finalT = cloneTree(root);
        frames.push({ draw: () => { drawTree(finalT); drawTable(); }, log: 'Árbol terminado. Se calcula la tabla de bits Σ(Lᵢ × fᵢ).', type: 'found', status: 'Construcción terminada.', statusType: 'found' });
        Sim.load(frames, { base: () => { drawTree(null); ui.table.innerHTML = ''; } });
    }
    function search() {
        const c = Letters.parse(ui.q.value)[0];
        if (!root || !c) { Status.set('Construya el árbol e ingrese una letra.', 'error'); return; }
        const frames = [];
        frames.push({ log: `BUSCAR ${c} = ${codeOf(c)}`, type: 'step' });
        searchFrames(c, frames);
        const t = cloneTree(root);
        Sim.load(frames, { base: () => drawTree(t) });
    }
    return {
        run: build,
        mount({ controls, stage, side }) {
            ui.keys = UI.text(preset, { width: '240px' });
            ui.q = UI.text('L', { width: '50px' });
            controls.append(UI.field('Claves (letras):', ui.keys));
            if (kind === 'multiple') { ui.m = UI.select([['1', 'm = 1 (2 ramas)'], ['2', 'm = 2 (4 ramas)'], ['3', 'm = 3 (8 ramas)']], '2'); controls.append(UI.field('Bits por nivel:', ui.m)); }
            controls.append(UI.btn('Construir', build, 'btn-primary'), UI.field('Buscar:', ui.q), UI.btn('Buscar', search), UI.btn('Preset clase', () => { ui.keys.value = preset; build(); }));
            ui.tree = h('div', { class: 'table-wrap' }); ui.table = h('div');
            stage.append(ui.tree, ui.table);
            side.appendChild(UI.card('Código de 5 bits', UI.table(['Letra', 'Código'], 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => [c, Letters.code(c)]), { cls: 'compact' })));
            drawTree(null);
        },
        reset() { drawTree(root); drawTable(); Log.clear(); },
    };
}
App.register('digital', makeBitTree('digital'));
App.register('residuos', makeBitTree('residuos'));
App.register('residuos-multiple', makeBitTree('multiple'));

/* =====================================================================
 * 1.3  HUFFMAN Y FUENTES REDUCIDAS
 * ===================================================================== */
const Huffman = {
    /** Calcula frecuencias, fuentes reducidas, árbol y códigos. */
    build(text) {
        const freq = {};
        for (const ch of text) freq[ch] = (freq[ch] || 0) + 1;
        const total = text.length;
        let nid = 0;
        let list = Object.keys(freq).map(s => ({ id: ++nid, sym: s, f: freq[s] }));
        list.sort((a, b) => b.f - a.f || text.indexOf(a.sym) - text.indexOf(b.sym));
        const sources = [list.slice()];
        const merges = [];
        while (list.length > 1) {
            const b = list.pop(), a = list.pop(); // a ≥ b (penúltimo y último)
            const nn = { id: ++nid, f: a.f + b.f, left: a, right: b };
            // se inserta "lo más arriba posible": antes del primer elemento con f ≤ suma
            let pos = list.findIndex(x => x.f <= nn.f);
            if (pos < 0) pos = list.length;
            list.splice(pos, 0, nn);
            merges.push({ a, b, nn, pos });
            sources.push(list.slice());
        }
        const root = list[0] || null;
        const codes = {};
        if (root && !root.left) codes[root.sym] = '0';
        (function rec(n, c) { if (!n) return; if (!n.left) { if (c) codes[n.sym] = c; return; } rec(n.left, c + '0'); rec(n.right, c + '1'); })(root, '');
        return { freq, total, sources, merges, root, codes };
    },
};
App.register('huffman', (() => {
    let ui = {}, R = null;
    const preset = 'ABRACADABRA';
    const symName = s => s === ' ' ? '␣' : s;
    const label = n => n.sym !== undefined ? symName(n.sym) : String(n.f);
    function drawSources(step) {
        ui.src.innerHTML = '';
        const { sources, merges, total } = R;
        const cols = sources.slice(0, step + 1);
        const maxLen = sources[0].length;
        const rows = U.range(maxLen).map(i => cols.map((col, j) => {
            const n = col[i];
            if (!n) return '';
            const isMerged = j < merges.length && j < step && (col.length - 2 <= i);
            const isNew = j > 0 && merges[j - 1].nn === n;
            const txt = `${n.sym !== undefined ? symName(n.sym) + ': ' : ''}${n.f}/${total} = ${U.fmt(n.f / total, 3)}`;
            return { html: txt, cls: isNew ? 'cell-hl' : isMerged ? 'cell-updated' : '' };
        }));
        const t = UI.table(cols.map((_, j) => `S${U.sub(j)}`), rows, { cls: 'matrix-table' });
        ui.src.appendChild(UI.card('Fuentes reducidas (se combinan las dos menores; la suma se ubica lo más arriba posible)', t));
    }
    function drawTree(highlightIds) {
        TreeView.render(ui.tree, R.root, {
            kids: n => n.left ? [n.left, n.right] : [], label, sub: n => n.sym !== undefined ? R.codes[n.sym] : `${n.f}`, shape: n => n.sym !== undefined ? 'rect' : 'circle',
            edgeLabel: (p, i) => String(i), cls: n => highlightIds && highlightIds.has(n.id) ? 'inspecting' : (n.sym !== undefined ? 'leaf' : ''), spacing: 56,
        });
    }
    function drawTable() {
        ui.table.innerHTML = '';
        const syms = R.sources[0].map(n => n.sym);
        let sumFL = 0, Lbar = 0, H = 0;
        const rows = syms.map(s => {
            const f = R.freq[s], p = f / R.total, c = R.codes[s], L = c.length;
            sumFL += f * L; Lbar += p * L; H += -p * U.log2(p);
            return [symName(s), f, U.fmt(p, 4), `<span class="mono">${c}</span>`, L, f * L, U.fmt(p * L, 4)];
        });
        rows.push(['<b>Total</b>', R.total, '1', '', '', `<b>${sumFL}</b>`, `<b>${U.fmt(Lbar, 4)}</b>`]);
        const fixed = Math.max(1, Math.ceil(U.log2(syms.length)));
        ui.table.append(UI.card('Tabla resumen', UI.table(['Símbolo', 'fᵢ', 'pᵢ', 'Código', 'Lᵢ', 'fᵢ·Lᵢ', 'pᵢ·Lᵢ'], rows)),
            UI.card('Métricas', UI.kv([['Longitud promedio L̄ = Σ pᵢLᵢ', U.fmt(Lbar, 4) + ' bits/símbolo'], ['Bits totales Σ fᵢLᵢ', sumFL + ' bits'], ['Código fijo (⌈log₂ ' + syms.length + '⌉ = ' + fixed + ' bits)', fixed * R.total + ' bits'], ['Ahorro', U.fmt(100 * (1 - sumFL / (fixed * R.total || 1)), 2) + '%'], ['Entropía H', U.fmt(H, 4) + ' bits/símbolo'], ['Eficiencia H / L̄', U.fmt(100 * H / (Lbar || 1), 2) + '%']])));
    }
    function run() {
        const text = ui.text.value;
        if (!text.length) { Status.set('Ingrese un texto.', 'error'); return; }
        R = Huffman.build(text);
        const frames = [];
        const fl = Object.keys(R.freq).map(s => `${symName(s)}:${R.freq[s]}`).join(', ');
        frames.push({ draw: () => { drawSources(0); ui.tree.innerHTML = ''; ui.table.innerHTML = ''; }, log: `Texto de ${R.total} símbolos. Frecuencias: ${fl}. S₀ ordenada de mayor a menor probabilidad.`, type: 'step', status: 'Fuente original S₀.' });
        R.merges.forEach((m, j) => {
            frames.push({ draw: () => drawSources(j + 1), log: `S${U.sub(j)} → S${U.sub(j + 1)}: se combinan ${label(m.a)} (${m.a.f}) + ${label(m.b)} (${m.b.f}) = ${m.nn.f}, ubicada en la posición ${m.pos + 1}.`, type: 'compare', status: `Reducción ${j + 1} de ${R.merges.length}` });
        });
        const ids = new Set();
        frames.push({ draw: () => { drawTree(ids); }, log: 'Se construye el árbol desde la última fuente reducida hacia atrás: 0 a la izquierda, 1 a la derecha.', type: 'step' });
        frames.push({ draw: () => { drawTree(); drawTable(); }, log: 'Códigos asignados recorriendo el árbol desde la raíz.', type: 'found', status: 'Código de Huffman generado.', statusType: 'found' });
        Sim.load(frames, { base: () => { ui.src.innerHTML = ''; ui.tree.innerHTML = ''; ui.table.innerHTML = ''; } });
    }
    return {
        run,
        mount({ controls, stage }) {
            ui.text = UI.text(preset, { width: '320px' });
            controls.append(UI.field('Texto:', ui.text), UI.btn('Generar', run, 'btn-primary'),
                UI.btn('Preset: ABRACADABRA', () => { ui.text.value = 'ABRACADABRA'; run(); }), UI.btn('Preset: frase', () => { ui.text.value = 'CIENCIAS DE LA COMPUTACION'; run(); }));
            ui.src = h('div', { class: 'table-wrap' }); ui.tree = h('div', { class: 'table-wrap' }); ui.table = h('div', { class: 'split-2' });
            stage.append(ui.src, ui.tree, ui.table);
        },
        reset() { if (R) { drawSources(R.sources.length - 1); drawTree(); drawTable(); } Log.clear(); },
    };
})());

/* =====================================================================
 * 1.3  MÉTODO DE LA REJILLA (GRID FILE 2D)
 * ===================================================================== */
App.register('rejilla', (() => {
    let ui = {}, G = null;
    const preset = '(10,15) (25,70) (40,40) (55,20) (70,85) (85,60) (30,30) (60,65) (15,90) (90,10) (45,55) (75,35)';
    const parsePts = str => { const nums = U.parseNums(String(str).replace(/[()]/g, ' ')); const p = []; for (let i = 0; i + 1 < nums.length; i += 2) p.push({ x: nums[i], y: nums[i + 1], id: p.length + 1 }); return p; };
    const cellOf = (scale, v) => { for (let i = 0; i < scale.length - 1; i++) if (v >= scale[i] && (v < scale[i + 1] || (i === scale.length - 2 && v <= scale[i + 1]))) return i; return -1; };
    function build() {
        const cx = Math.max(1, Number(ui.cx.value) || 3), cy = Math.max(1, Number(ui.cy.value) || 3), capB = Math.max(1, Number(ui.cap.value) || 2);
        const X = U.range(cx + 1).map(i => Math.round(i * 100 / cx)), Y = U.range(cy + 1).map(i => Math.round(i * 100 / cy));
        G = { X, Y, cap: capB, pts: [], frames: [] };
        const X0 = X.slice(), Y0 = Y.slice();
        const pts = parsePts(ui.pts.value).filter(p => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100);
        const frames = [];
        frames.push({ draw: snapDraw({}), log: `Rejilla inicial: escalas X = {${X.join(', ')}}, Y = {${Y.join(', ')}} → directorio ${cx}×${cy}. Capacidad de cubeta = ${capB}.`, type: 'step' });
        let axis = 0;
        pts.forEach(p => {
            G.pts.push(p);
            let i = cellOf(G.X, p.x), j = cellOf(G.Y, p.y);
            frames.push({ draw: snapDraw({ hlPt: p.id, cell: [i, j] }), log: `Insertar P${p.id}(${p.x},${p.y}): escala X → columna ${i} [${G.X[i]},${G.X[i + 1]}) ; escala Y → fila ${j} [${G.Y[j]},${G.Y[j + 1]}) → directorio[${i}][${j}].`, type: 'compare' });
            let inCell = G.pts.filter(q => cellOf(G.X, q.x) === i && cellOf(G.Y, q.y) === j);
            let guard = 0;
            while (inCell.length > G.cap && guard++ < 6) {
                const useX = axis % 2 === 0; axis++;
                if (useX) { const m = Math.round((G.X[i] + G.X[i + 1]) / 2); if (m === G.X[i] || m === G.X[i + 1]) break; G.X.splice(i + 1, 0, m); frames.push({ draw: snapDraw({ cell: [i, j] }), log: `Desbordamiento de la cubeta (${inCell.length} &gt; ${G.cap}) → se divide la escala X en x = ${m}. El directorio crece a ${G.X.length - 1}×${G.Y.length - 1}.`, type: 'warn' }); }
                else { const m = Math.round((G.Y[j] + G.Y[j + 1]) / 2); if (m === G.Y[j] || m === G.Y[j + 1]) break; G.Y.splice(j + 1, 0, m); frames.push({ draw: snapDraw({ cell: [i, j] }), log: `Desbordamiento de la cubeta (${inCell.length} &gt; ${G.cap}) → se divide la escala Y en y = ${m}. El directorio crece a ${G.X.length - 1}×${G.Y.length - 1}.`, type: 'warn' }); }
                i = cellOf(G.X, p.x); j = cellOf(G.Y, p.y);
                inCell = G.pts.filter(q => cellOf(G.X, q.x) === i && cellOf(G.Y, q.y) === j);
            }
        });
        frames.push({ draw: snapDraw({}), log: `Rejilla final: X = {${G.X.join(', ')}}, Y = {${G.Y.join(', ')}}.`, type: 'found', status: 'Rejilla construida.', statusType: 'found' });
        Sim.load(frames, { base: () => draw({ X: X0, Y: Y0, pts: [], cap: capB }, {}) });
    }
    function snapDraw(o) {
        const s = { X: G.X.slice(), Y: G.Y.slice(), pts: G.pts.slice(), cap: G.cap };
        return () => draw(s, o);
    }
    function draw(s, o) {
        ui.view.innerHTML = '';
        const W = 360, P = 30, sc = v => P + v * (W - 2 * P) / 100, scY = v => W - P - v * (W - 2 * P) / 100;
        const svg = sv('svg', { width: W, height: W, viewBox: `0 0 ${W} ${W}` });
        if (o.range) { const [x1, y1, x2, y2] = o.range; svg.appendChild(sv('rect', { x: sc(x1), y: scY(y2), width: sc(x2) - sc(x1), height: scY(y1) - scY(y2), fill: 'rgba(21,101,192,.10)', stroke: '#1565C0', 'stroke-dasharray': '5 3' })); }
        if (o.cell) { const [i, j] = o.cell; if (i >= 0 && j >= 0) svg.appendChild(sv('rect', { x: sc(s.X[i]), y: scY(s.Y[j + 1]), width: sc(s.X[i + 1]) - sc(s.X[i]), height: scY(s.Y[j]) - scY(s.Y[j + 1]), fill: 'rgba(255,185,148,.35)' })); }
        (o.cells || []).forEach(([i, j]) => svg.appendChild(sv('rect', { x: sc(s.X[i]), y: scY(s.Y[j + 1]), width: sc(s.X[i + 1]) - sc(s.X[i]), height: scY(s.Y[j]) - scY(s.Y[j + 1]), fill: 'rgba(255,185,148,.28)' })));
        s.X.forEach(x => svg.appendChild(sv('line', { x1: sc(x), y1: scY(0), x2: sc(x), y2: scY(100), stroke: '#D96332', 'stroke-width': 1.3 })));
        s.Y.forEach(y => svg.appendChild(sv('line', { x1: sc(0), y1: scY(y), x2: sc(100), y2: scY(y), stroke: '#D96332', 'stroke-width': 1.3 })));
        s.X.forEach(x => svg.appendChild(sv('text', { x: sc(x), y: W - 10, 'font-size': 10, 'text-anchor': 'middle', fill: '#6C5549' }, x)));
        s.Y.forEach(y => svg.appendChild(sv('text', { x: 12, y: scY(y) + 3, 'font-size': 10, 'text-anchor': 'middle', fill: '#6C5549' }, y)));
        s.pts.forEach(p => {
            const hl = o.hlPt === p.id || (o.found || []).includes(p.id);
            svg.appendChild(sv('circle', { cx: sc(p.x), cy: scY(p.y), r: hl ? 7 : 5, fill: hl ? '#2E7D32' : '#2E1E17' }));
            svg.appendChild(sv('text', { x: sc(p.x) + 7, y: scY(p.y) - 6, 'font-size': 10, 'font-weight': 700, fill: '#6C5549' }, 'P' + p.id));
        });
        const nx = s.X.length - 1, ny = s.Y.length - 1;
        let bid = 0;
        const dir = U.range(ny).map(jj => { const j = ny - 1 - jj; return U.range(nx).map(i => { const inC = s.pts.filter(p => cellOf(s.X, p.x) === i && cellOf(s.Y, p.y) === j); return { i, j, pts: inC }; }); });
        const M = dir.map(r => r.map(c => c.pts.length ? `B${++bid}: {${c.pts.map(p => 'P' + p.id).join(',')}}` : 'nil'));
        const hlCells = new Set((o.cells || []).concat(o.cell ? [o.cell] : []).map(c => c.join(',')));
        ui.view.append(h('div', { class: 'stage-row' }, h('div', { class: 'grid2d-wrap' }, svg),
            h('div', { class: 'stage-col' }, UI.matrix(M, U.range(ny).map(jj => `y${ny - 1 - jj} [${s.Y[ny - 1 - jj]},${s.Y[ny - jj]})`), U.range(nx).map(i => `x${i} [${s.X[i]},${s.X[i + 1]})`), { caption: `Directorio ${nx}×${ny} (celda → cubeta)`, fmt: x => x, cellCls: (r, c) => hlCells.has(`${c},${ny - 1 - r}`) ? 'cell-updated' : '' }),
                UI.kv([['Escala X', '{' + s.X.join(', ') + '}'], ['Escala Y', '{' + s.Y.join(', ') + '}'], ['Puntos', s.pts.length]]))));
    }
    function query() {
        if (!G) build();
        const q = U.parseNums(ui.q.value.replace(/[()]/g, ' '));
        const frames = [];
        if (ui.qt.value === 'exacta') {
            if (q.length < 2) return Status.set('Consulta exacta: ingrese (x, y).', 'error');
            const [x, y] = q, i = cellOf(G.X, x), j = cellOf(G.Y, y);
            if (i < 0 || j < 0) return Status.set('Punto fuera del dominio [0,100]².', 'error');
            const found = G.pts.filter(p => p.x === x && p.y === y).map(p => p.id);
            const inCell = G.pts.filter(p => cellOf(G.X, p.x) === i && cellOf(G.Y, p.y) === j);
            frames.push({ draw: snapDraw({ cell: [i, j] }), log: `Consulta exacta (${x},${y}): búsqueda en escala X → columna ${i}; en escala Y → fila ${j}. 1 acceso al directorio.`, type: 'compare' });
            frames.push({ draw: snapDraw({ cell: [i, j], found }), log: `Se lee la cubeta de la celda [${i}][${j}] (1 acceso a disco) con ${inCell.length} punto(s): ${found.length ? 'ENCONTRADO P' + found[0] : 'no existe'}.`, type: found.length ? 'found' : 'notfound', status: found.length ? `<strong>Encontrado</strong> P${found[0]} con 2 accesos.` : '<strong>No existe</strong> el punto.', statusType: found.length ? 'found' : 'notfound' });
        } else {
            if (q.length < 4) return Status.set('Consulta por rango: ingrese x1, y1, x2, y2.', 'error');
            const [x1, y1, x2, y2] = [Math.min(q[0], q[2]), Math.min(q[1], q[3]), Math.max(q[0], q[2]), Math.max(q[1], q[3])];
            const i1 = Math.max(0, cellOf(G.X, x1)), i2 = cellOf(G.X, x2) < 0 ? G.X.length - 2 : cellOf(G.X, x2);
            const j1 = Math.max(0, cellOf(G.Y, y1)), j2 = cellOf(G.Y, y2) < 0 ? G.Y.length - 2 : cellOf(G.Y, y2);
            const cells = []; for (let i = i1; i <= i2; i++) for (let j = j1; j <= j2; j++) cells.push([i, j]);
            const found = G.pts.filter(p => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2).map(p => p.id);
            const nonEmpty = cells.filter(([i, j]) => G.pts.some(p => cellOf(G.X, p.x) === i && cellOf(G.Y, p.y) === j)).length;
            frames.push({ draw: snapDraw({ range: [x1, y1, x2, y2] }), log: `Consulta por rango [${x1},${x2}] × [${y1},${y2}].`, type: 'step' });
            frames.push({ draw: snapDraw({ range: [x1, y1, x2, y2], cells }), log: `Celdas que intersecan el rango: columnas ${i1}..${i2}, filas ${j1}..${j2} → ${cells.length} celdas (${nonEmpty} con cubeta).`, type: 'compare' });
            frames.push({ draw: snapDraw({ range: [x1, y1, x2, y2], cells, found }), log: `Puntos dentro del rango: ${found.length ? found.map(i => 'P' + i).join(', ') : 'ninguno'}. Accesos a cubetas: ${nonEmpty}.`, type: found.length ? 'found' : 'notfound', status: `Rango: <strong>${found.length}</strong> punto(s) encontrados.`, statusType: found.length ? 'found' : 'notfound' });
        }
        const s = snapDraw({});
        Sim.load(frames, { base: s });
    }
    return {
        run: build,
        mount({ controls, stage }) {
            ui.pts = UI.text(preset, { width: '420px' });
            ui.cx = UI.num(2, { min: 1, width: '55px' }); ui.cy = UI.num(2, { min: 1, width: '55px' }); ui.cap = UI.num(2, { min: 1, width: '55px' });
            ui.qt = UI.select([['exacta', 'Exacta (x, y)'], ['rango', 'Rango x1,y1,x2,y2']], 'exacta');
            ui.q = UI.text('(40,40)', { width: '140px' });
            controls.append(h('div', { class: 'ctrl-row' }, UI.field('Puntos:', ui.pts), UI.field('Columnas:', ui.cx), UI.field('Filas:', ui.cy), UI.field('Cap. cubeta:', ui.cap), UI.btn('Construir', build, 'btn-primary')),
                h('div', { class: 'ctrl-row' }, UI.field('Consulta:', ui.qt), ui.q, UI.btn('Consultar', query), UI.btn('Ej. rango', () => { ui.qt.value = 'rango'; ui.q.value = '20, 20, 60, 70'; query(); })));
            ui.view = h('div');
            stage.appendChild(ui.view);
            build();
        },
        reset() { if (G) draw({ X: G.X, Y: G.Y, pts: G.pts, cap: G.cap }, {}); Log.clear(); },
    };
})());

/* =====================================================================
 * 1.3  ÁRBOLES 2D (k-d tree)
 * ===================================================================== */
App.register('arbol-2d', (() => {
    let ui = {}, root = null, nid = 0, pts = [];
    const preset = '(40,60) (20,30) (70,20) (10,80) (30,10) (60,75) (85,50) (50,40)';
    const parsePts = str => { const n = U.parseNums(String(str).replace(/[()]/g, ' ')); const p = []; for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]); return p; };
    const clone = n => n ? { id: n.id, p: n.p, d: n.d, left: clone(n.left), right: clone(n.right) } : null;
    function draw(r, o = {}) {
        ui.view.innerHTML = '';
        const treeBox = h('div', { class: 'table-wrap', style: { flex: 1, minWidth: '300px' } });
        TreeView.render(treeBox, r, {
            inorder: true, label: n => `${n.p[0]},${n.p[1]}`, sub: n => n.d === 0 ? 'X' : 'Y', spacing: 66, r: 24,
            cls: n => o.path && o.path.includes(n.id) ? (n.id === o.cur ? (o.found ? 'found' : 'inspecting') : 'visited') : '',
            edgeLabel: (p, i) => i === 0 ? '<' : '≥', edgeCls: (p, c) => o.path && o.path.includes(c.id) ? 'active' : '',
        });
        const W = 340, P = 20, sx = v => P + v * (W - 2 * P) / 100, sy = v => W - P - v * (W - 2 * P) / 100;
        const svg = sv('svg', { width: W, height: W, viewBox: `0 0 ${W} ${W}` });
        svg.appendChild(sv('rect', { x: sx(0), y: sy(100), width: sx(100) - sx(0), height: sy(0) - sy(100), fill: '#FFF', stroke: '#F0DEC8' }));
        (function rec(n, x0, x1, y0, y1) {
            if (!n) return;
            const [x, y] = n.p;
            if (n.d === 0) { svg.appendChild(sv('line', { x1: sx(x), y1: sy(y0), x2: sx(x), y2: sy(y1), stroke: '#D96332', 'stroke-width': 2 })); rec(n.left, x0, x, y0, y1); rec(n.right, x, x1, y0, y1); }
            else { svg.appendChild(sv('line', { x1: sx(x0), y1: sy(y), x2: sx(x1), y2: sy(y), stroke: '#1565C0', 'stroke-width': 2 })); rec(n.left, x0, x1, y0, y); rec(n.right, x0, x1, y, y1); }
            const hl = o.path && o.path.includes(n.id);
            svg.appendChild(sv('circle', { cx: sx(x), cy: sy(y), r: hl ? 6 : 4.5, fill: hl ? '#D96332' : '#2E1E17' }));
            svg.appendChild(sv('text', { x: sx(x) + 6, y: sy(y) - 6, 'font-size': 10, fill: '#6C5549', 'font-weight': 700 }, `(${x},${y})`));
        })(r, 0, 100, 0, 100);
        if (o.q) svg.appendChild(sv('circle', { cx: sx(o.q[0]), cy: sy(o.q[1]), r: 8, fill: 'none', stroke: '#2E7D32', 'stroke-width': 2.5, 'stroke-dasharray': '3 2' }));
        ui.view.append(h('div', { class: 'stage-row' }, treeBox, h('div', { class: 'grid2d-wrap' }, svg)),
            h('div', { class: 'legend' }, h('span', null, h('i', { style: { borderColor: '#D96332' } }), 'corte por X (nivel par)'), h('span', null, h('i', { style: { borderColor: '#1565C0' } }), 'corte por Y (nivel impar)')));
    }
    function insertFrames(p, frames) {
        if (!root) { root = { id: ++nid, p, d: 0, left: null, right: null }; const t = clone(root); frames.push({ draw: () => draw(t, { path: [t.id], cur: t.id, found: true }), log: `(${p}) es la raíz (nivel 0, discrimina por X).`, type: 'found' }); return; }
        let n = root; const path = [];
        let lvl = 0;
        for (;;) {
            path.push(n.id);
            if (n.p[0] === p[0] && n.p[1] === p[1]) { frames.push({ log: `(${p}) ya existe.`, type: 'warn' }); return; }
            const ax = n.d, cmp = p[ax] < n.p[ax];
            const t = clone(root), pp = path.slice(), cur = n.id;
            frames.push({ draw: () => draw(t, { path: pp, cur }), log: `Nivel ${lvl} (${ax === 0 ? 'X' : 'Y'}): ${ax === 0 ? 'x' : 'y'} = ${p[ax]} ${cmp ? '&lt;' : '≥'} ${n.p[ax]} de (${n.p}) → ${cmp ? 'IZQUIERDA' : 'DERECHA'}.`, type: 'compare' });
            const dir = cmp ? 'left' : 'right';
            lvl++;
            if (!n[dir]) { n[dir] = { id: ++nid, p, d: lvl % 2, left: null, right: null }; const t2 = clone(root), id = n[dir].id; frames.push({ draw: () => draw(t2, { path: pp.concat(id), cur: id, found: true }), log: `Se inserta (${p}) en el nivel ${lvl} (discrimina por ${lvl % 2 === 0 ? 'X' : 'Y'}).`, type: 'found' }); return; }
            n = n[dir];
        }
    }
    function build() {
        root = null; nid = 0; pts = parsePts(ui.pts.value);
        const frames = [];
        frames.push({ log: `Se insertan ${pts.length} puntos alternando ejes: X en niveles pares, Y en impares.`, type: 'step' });
        pts.forEach(p => { frames.push({ log: `INSERTAR (${p})`, type: 'step', status: `Insertando <strong>(${p})</strong>` }); insertFrames(p, frames); });
        const t = clone(root);
        frames.push({ draw: () => draw(t), log: 'Árbol 2D construido.', type: 'found', status: 'Árbol 2D construido.', statusType: 'found' });
        Sim.load(frames, { base: () => draw(null) });
    }
    function search() {
        const q = U.parseNums(ui.q.value.replace(/[()]/g, ' '));
        if (q.length < 2 || !root) return Status.set('Construya el árbol e ingrese un punto (x, y).', 'error');
        const frames = [], t = clone(root);
        let n = root; const path = []; let lvl = 0;
        while (n) {
            path.push(n.id);
            const pp = path.slice(), cur = n.id;
            if (n.p[0] === q[0] && n.p[1] === q[1]) { frames.push({ draw: () => draw(t, { path: pp, cur, found: true, q }), log: `(${n.p}) = (${q}) → ENCONTRADO en el nivel ${lvl}.`, type: 'found', status: `<strong>Encontrado</strong> con ${path.length} comparaciones.`, statusType: 'found' }); return Sim.load(frames, { base: () => draw(t) }); }
            const ax = n.d, cmp = q[ax] < n.p[ax];
            frames.push({ draw: () => draw(t, { path: pp, cur, q }), log: `Nivel ${lvl} (${ax === 0 ? 'X' : 'Y'}): ${q[ax]} ${cmp ? '&lt;' : '≥'} ${n.p[ax]} → ${cmp ? 'izquierda' : 'derecha'}.`, type: 'compare' });
            n = cmp ? n.left : n.right; lvl++;
        }
        frames.push({ log: `Puntero nulo: (${q}) no existe.`, type: 'notfound', status: `<strong>(${q})</strong> no existe.`, statusType: 'notfound' });
        Sim.load(frames, { base: () => draw(t) });
    }
    return {
        run: build,
        mount({ controls, stage }) {
            ui.pts = UI.text(preset, { width: '380px' }); ui.q = UI.text('(60,75)', { width: '90px' });
            controls.append(UI.field('Puntos:', ui.pts), UI.btn('Construir', build, 'btn-primary'), UI.field('Buscar:', ui.q), UI.btn('Buscar', search), UI.btn('Preset clase', () => { ui.pts.value = preset; build(); }));
            ui.view = h('div'); stage.appendChild(ui.view); draw(null);
        },
        reset() { draw(root); Log.clear(); },
    };
})());

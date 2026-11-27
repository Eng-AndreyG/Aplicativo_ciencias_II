/* =====================================================================
 * core.js — Núcleo de la plataforma
 *   · Utilidades DOM/SVG y matemáticas
 *   · Registro de ejecución (logs), banner de estado y fórmula
 *   · Reproductor de simulación (Siguiente Paso / Automático / Reiniciar)
 *   · Catálogo de temas (metadatos + complejidades) y navegación
 * ===================================================================== */
'use strict';

/* ---------------------------------------------------------------------
 * 1. Utilidades DOM
 * ------------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const SVGNS = 'http://www.w3.org/2000/svg';

/** Crea un elemento HTML. props: class, style, html, text, on<Evento>, y atributos. */
function h(tag, props, ...children) {
    const el = document.createElement(tag);
    applyProps(el, props);
    appendChildren(el, children);
    return el;
}
/** Crea un elemento SVG. */
function sv(tag, props, ...children) {
    const el = document.createElementNS(SVGNS, tag);
    applyProps(el, props, true);
    appendChildren(el, children);
    return el;
}
function applyProps(el, props, isSvg) {
    if (!props) return;
    for (const [k, v] of Object.entries(props)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') el.setAttribute('class', v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (!isSvg && (k === 'value' || k === 'checked' || k === 'selected' || k === 'disabled')) el[k] = v;
        else el.setAttribute(k, v === true ? '' : v);
    }
}
function appendChildren(el, children) {
    for (const c of children.flat(Infinity)) {
        if (c === null || c === undefined || c === false) continue;
        el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
}
function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* ---------------------------------------------------------------------
 * 2. Utilidades matemáticas y de notación
 * ------------------------------------------------------------------- */
const U = {
    INF: Infinity,
    range: (n, start = 0) => Array.from({ length: n }, (_, i) => i + start),
    sum: arr => arr.reduce((a, b) => a + b, 0),
    clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
    /** Formatea números mostrando ∞. */
    fmt(x, dec = 4) {
        if (x === Infinity) return '∞';
        if (x === -Infinity) return '−∞';
        if (typeof x !== 'number') return String(x);
        return Number.isInteger(x) ? String(x) : String(+x.toFixed(dec));
    },
    /** Binario con ancho fijo. */
    bin: (n, w = 0) => n.toString(2).padStart(w, '0'),
    /** Parsea lista de números "1, 2 3;4". */
    parseNums(str) {
        return String(str).split(/[\s,;]+/).filter(Boolean).map(Number).filter(x => !Number.isNaN(x));
    },
    parseTokens: str => String(str).split(/[\s,;]+/).filter(Boolean),
    /** Todas las combinaciones de k elementos de arr. */
    combinations(arr, k) {
        const res = [], cur = [];
        (function rec(start) {
            if (cur.length === k) { res.push(cur.slice()); return; }
            for (let i = start; i <= arr.length - (k - cur.length); i++) { cur.push(arr[i]); rec(i + 1); cur.pop(); }
        })(0);
        return res;
    },
    /** Número de bits encendidos. */
    popcount(x) { let c = 0; while (x) { x &= x - 1; c++; } return c; },
    /** Índices de bits encendidos de una máscara. */
    maskToIdx(mask, n) { const r = []; for (let i = 0; i < n; i++) if (mask & (1 << i)) r.push(i); return r; },
    /** Superíndices y subíndices Unicode. */
    sup(n) { const m = '⁰¹²³⁴⁵⁶⁷⁸⁹'; return String(n).split('').map(c => (c >= '0' && c <= '9') ? m[c] : (c === '-' ? '⁻' : c)).join(''); },
    sub(n) { const m = '₀₁₂₃₄₅₆₇₈₉'; return String(n).split('').map(c => (c >= '0' && c <= '9') ? m[c] : c).join(''); },
    /** Barra superior (notación de pesos repetidos): nivel 1 → 2̄, nivel 2 → 2̿ */
    overline(str, level = 1) {
        if (level <= 0) return String(str);
        const mark = level === 1 ? '̄' : '̿';
        let s = String(str).split('').map(c => c + mark).join('');
        if (level > 2) s += U.sup(level);
        return s;
    },
    setKey: arr => arr.slice().sort().join(','),
    gcd: (a, b) => (b ? U.gcd(b, a % b) : Math.abs(a)),
    log2: x => Math.log(x) / Math.LN2,
    /** Conjunto en notación { a, b, c } */
    setStr: arr => '{ ' + arr.join(', ') + ' }',
    deepClone: o => JSON.parse(JSON.stringify(o)),
};

/* ---------------------------------------------------------------------
 * 3. Componentes de interfaz reutilizables
 * ------------------------------------------------------------------- */
const UI = {
    btn(text, onClick, cls = 'btn-secondary', title) {
        return h('button', { class: cls, onclick: onClick, title, html: text });
    },
    field(label, control, extraCls = '') {
        return h('label', { class: 'input-wrapper ' + extraCls }, h('span', { class: 'input-label', html: label }), control);
    },
    num(value, opts = {}) {
        return h('input', { type: 'number', class: 'input-data', value, min: opts.min, max: opts.max, step: opts.step, style: opts.width ? { width: opts.width } : null, title: opts.title });
    },
    text(value, opts = {}) {
        return h('input', { type: 'text', class: 'input-data', value, placeholder: opts.placeholder || '', style: { width: opts.width || '220px' } });
    },
    select(options, value, onChange) {
        const s = h('select', { class: 'input-select' },
            options.map(o => {
                const [v, t] = Array.isArray(o) ? o : [o, o];
                return h('option', { value: v, selected: String(v) === String(value) }, t);
            }));
        if (onChange) s.addEventListener('change', () => onChange(s.value));
        return s;
    },
    check(label, checked, onChange) {
        const c = h('input', { type: 'checkbox', checked });
        if (onChange) c.addEventListener('change', () => onChange(c.checked));
        return h('label', { class: 'check-wrapper' }, c, h('span', { html: label }));
    },
    sep: () => h('span', { class: 'ctrl-sep' }),
    /** Caja de alerta. type: info | warn | error | ok | inconsistency */
    alert(type, title, html) {
        const icons = { info: 'i', warn: '!', error: '✖', ok: '✔', inconsistency: '✖' };
        return h('div', { class: 'alert alert-' + type },
            h('div', { class: 'alert-icon', text: icons[type] || 'i' }),
            h('div', { class: 'alert-body' }, h('strong', { html: title }), h('div', { html: html || '' })));
    },
    /** Tabla genérica. rows: array de arrays (celdas: string | {html, cls}) */
    table(headers, rows, opts = {}) {
        const t = h('table', { class: 'data-table ' + (opts.cls || '') });
        if (headers) t.appendChild(h('thead', null, h('tr', null, headers.map(x => h('th', { html: String(x) })))));
        const tb = h('tbody');
        rows.forEach((r, i) => {
            const tr = h('tr', { class: opts.rowCls ? opts.rowCls(i) : null });
            r.forEach(c => {
                if (c && typeof c === 'object' && !(c instanceof Node)) tr.appendChild(h('td', { class: c.cls, html: String(c.html), title: c.title, colspan: c.colspan }));
                else if (c instanceof Node) tr.appendChild(h('td', null, c));
                else tr.appendChild(h('td', { html: c === undefined ? '' : String(c) }));
            });
            tb.appendChild(tr);
        });
        t.appendChild(tb);
        return opts.wrap === false ? t : h('div', { class: 'table-wrap' }, t);
    },
    /** Matriz con encabezados de fila y columna. cellCls(i,j) → clase CSS opcional. */
    matrix(M, rowLabels, colLabels, opts = {}) {
        const fmt = opts.fmt || (x => U.fmt(x));
        const t = h('table', { class: 'matrix-table ' + (opts.cls || '') });
        t.appendChild(h('thead', null, h('tr', null, h('th', { class: 'corner', html: opts.corner || '' }), colLabels.map((c, j) => h('th', { html: String(c), class: opts.colCls ? opts.colCls(j) : null })))));
        const tb = h('tbody');
        M.forEach((row, i) => {
            tb.appendChild(h('tr', null, h('th', { html: String(rowLabels[i]), class: opts.rowCls ? opts.rowCls(i) : null }),
                row.map((x, j) => h('td', { class: opts.cellCls ? opts.cellCls(i, j, x) : null, html: fmt(x, i, j), title: opts.title ? opts.title(i, j, x) : null }))));
        });
        t.appendChild(tb);
        return h('div', { class: 'table-wrap' }, opts.caption ? h('div', { class: 'matrix-caption', html: opts.caption }) : null, t);
    },
    /** Pestañas. tabs: [{id, label, render(container)}] */
    tabs(tabs, active, onChange) {
        const wrap = h('div', { class: 'tabs' });
        const bar = h('div', { class: 'tab-bar' });
        const body = h('div', { class: 'tab-body' });
        const show = id => {
            $$('.tab-btn', bar).forEach(b => b.classList.toggle('active', b.dataset.id === id));
            body.innerHTML = '';
            const tab = tabs.find(t => t.id === id);
            if (tab) tab.render(body);
            if (onChange) onChange(id);
        };
        tabs.forEach(t => bar.appendChild(h('button', { class: 'tab-btn', 'data-id': t.id, html: t.label, onclick: () => show(t.id) })));
        wrap.append(bar, body);
        wrap.show = show;
        setTimeout(() => show(active || tabs[0].id), 0);
        return wrap;
    },
    card(title, ...content) {
        return h('div', { class: 'card' }, title ? h('div', { class: 'card-title', html: title }) : null, ...content);
    },
    kv(pairs) {
        return h('div', { class: 'kv-grid' }, pairs.map(([k, v]) => [h('span', { class: 'kv-k', html: k }), h('span', { class: 'kv-v', html: String(v) })]));
    },
    chips(items, onClick, activeIdx) {
        return h('div', { class: 'chip-list' }, items.map((it, i) =>
            h('button', { class: 'chip' + (i === activeIdx ? ' active' : ''), html: it, onclick: e => { $$('.chip', e.target.parentNode).forEach(c => c.classList.remove('active')); e.currentTarget.classList.add('active'); onClick && onClick(i); } })));
    },
};

/* ---------------------------------------------------------------------
 * 3b. TreeView — renderizador SVG genérico de árboles (binarios y m-arios)
 *   o.kids(n)      → arreglo de hijos (puede contener null para posiciones vacías)
 *   o.label(n)     → texto del nodo        o.sub(n) → texto secundario
 *   o.cls(n)       → clases CSS del nodo   o.edgeCls(p, c) → clase de la arista
 *   o.edgeLabel(p, i, c) → etiqueta de la rama i   o.inorder → layout por inorden (BST)
 *   o.shape(n)     → 'circle' | 'rect'     o.top(n) → texto sobre el nodo (ej. FE)
 * ------------------------------------------------------------------- */
const TreeView = {
    render(container, root, o = {}) {
        container.innerHTML = '';
        if (!root) { container.appendChild(h('div', { class: 'muted', text: o.empty || 'Árbol vacío.' })); return null; }
        const kids = o.kids || (n => [n.left, n.right]);
        const pos = new Map();
        let col = 0, maxD = 0;
        if (o.inorder) {
            (function rec(n, d) {
                if (!n) return;
                const [l, r] = kids(n);
                rec(l, d + 1); pos.set(n, { x: col++, d }); rec(r, d + 1);
                maxD = Math.max(maxD, d);
            })(root, 0);
        } else {
            (function rec(n, d) {
                maxD = Math.max(maxD, d);
                const ks = kids(n).filter(Boolean);
                if (!ks.length) { pos.set(n, { x: col++, d }); return; }
                ks.forEach(k => rec(k, d + 1));
                const xs = ks.map(k => pos.get(k).x);
                pos.set(n, { x: (Math.min(...xs) + Math.max(...xs)) / 2, d });
            })(root, 0);
        }
        const sp = o.spacing || 54, lh = o.levelH || 74, r = o.r || 20, padX = o.padX || 40, padY = 34;
        const W = Math.max(col - 1, 0) * sp + padX * 2, H = maxD * lh + padY * 2 + (o.extraH || 10);
        const svg = sv('svg', { class: 'tree-svg', width: Math.max(W, 200), height: H, viewBox: `0 0 ${Math.max(W, 200)} ${H}` });
        const off = W < 200 ? (200 - W) / 2 : 0;
        const P = n => { const p = pos.get(n); return [off + padX + p.x * sp, padY + p.d * lh]; };
        const gE = sv('g'), gN = sv('g');
        pos.forEach((_, n) => {
            const [x1, y1] = P(n);
            kids(n).forEach((c, i) => {
                if (!c) return;
                const [x2, y2] = P(c);
                gE.appendChild(sv('line', { class: 'tree-edge ' + (o.edgeCls ? o.edgeCls(n, c, i) || '' : ''), x1, y1, x2, y2 }));
                if (o.edgeLabel) {
                    const lb = o.edgeLabel(n, i, c);
                    if (lb !== null && lb !== undefined && lb !== '') {
                        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                        gE.appendChild(sv('text', { class: 'tree-edge-label', x: mx + (x2 < x1 ? -10 : x2 > x1 ? 6 : 6), y: my - 2, 'text-anchor': x2 < x1 ? 'end' : 'start' }, lb));
                    }
                }
            });
        });
        pos.forEach((_, n) => {
            const [x, y] = P(n);
            const shape = o.shape ? o.shape(n) : 'circle';
            const label = o.label ? o.label(n) : n.key;
            const g = sv('g', { class: 'tree-node ' + (o.cls ? o.cls(n) || '' : '') });
            if (shape === 'rect') {
                const w = Math.max(34, String(label).length * 8.5 + 14);
                g.appendChild(sv('rect', { x: x - w / 2, y: y - 15, width: w, height: 30, rx: 6 }));
            } else g.appendChild(sv('circle', { cx: x, cy: y, r: o.rFn ? o.rFn(n) : r }));
            g.appendChild(sv('text', { x, y }, label));
            if (o.sub) { const s = o.sub(n); if (s !== null && s !== undefined && s !== '') g.appendChild(sv('text', { class: 'sub', x, y: y + r + 11 }, s)); }
            if (o.top) { const t = o.top(n); if (t) g.appendChild(sv('text', { class: 'fe' + (t.bad ? ' bad' : ''), x: x + r + 4, y: y - r + 2, 'text-anchor': 'start' }, t.text)); }
            gN.appendChild(g);
        });
        svg.append(gE, gN);
        container.appendChild(svg);
        return svg;
    },
};

/* ---------------------------------------------------------------------
 * 4. Registro de ejecución, estado y fórmula
 * ------------------------------------------------------------------- */
const Log = {
    count: 0,
    clear() { $('#execution-logs').innerHTML = ''; Log.count = 0; },
    /** type: info | step | compare | discard | found | notfound | warn | error */
    add(msg, type = 'info') {
        const ul = $('#execution-logs');
        Log.count++;
        ul.appendChild(h('li', { class: 'log-' + type }, h('span', { class: 'log-prefix', text: String(Log.count).padStart(2, '0') + ' ›' }), h('span', { html: msg })));
        ul.scrollTop = ul.scrollHeight;
    },
};
const Status = {
    /** type: '' | found | notfound | warn | error */
    set(html, type = '') {
        const b = $('#sim-status-banner');
        b.className = 'sim-status-banner' + (type ? ' status-' + type : '');
        b.innerHTML = html;
    },
};
const Formula = {
    set(html) { $('#formula-box').style.display = 'flex'; $('#formula-expression').innerHTML = html; },
    hide() { $('#formula-box').style.display = 'none'; },
};

/* ---------------------------------------------------------------------
 * 5. Reproductor de simulación
 *    Un algoritmo calcula su traza COMPLETA sobre los datos actuales y la
 *    entrega como lista de "frames" {log, type, status, statusType, formula, draw}.
 *    El reproductor solo la recorre: los resultados nunca están quemados.
 * ------------------------------------------------------------------- */
const Sim = {
    frames: [], idx: -1, timer: null, base: null, onDone: null,
    speed() { return 2100 - Number($('#sim-speed').value); },
    /** Carga una traza. opts.base: dibuja el estado inicial; opts.auto: inicia automático. */
    load(frames, opts = {}) {
        Sim.stop();
        Sim.frames = frames || [];
        Sim.idx = -1;
        Sim.base = opts.base || null;
        Sim.onDone = opts.onDone || null;
        if (opts.clearLog !== false) Log.clear();
        if (Sim.base) Sim.base();
        Sim.updateCounter();
        if (opts.auto) Sim.toggleAuto();
        else if (opts.firstStep !== false && Sim.frames.length) Sim.next();
    },
    hasNext() { return Sim.idx < Sim.frames.length - 1; },
    next() {
        if (!Sim.frames.length) {
            const impl = App.impl();
            if (impl && impl.run) { impl.run(); return; }
            Status.set('No hay una simulación cargada para este tema. Use los controles del módulo.', 'warn');
            return;
        }
        if (!Sim.hasNext()) { Sim.stop(); Status.set('La simulación ha terminado. Pulse <strong>Reiniciar</strong> para verla de nuevo.', ''); return; }
        Sim.idx++;
        Sim.apply(Sim.frames[Sim.idx]);
        Sim.updateCounter();
        if (!Sim.hasNext()) { Sim.stop(); if (Sim.onDone) Sim.onDone(); }
    },
    apply(f) {
        if (!f) return;
        if (f.draw) {
            try { f.draw(); } catch (e) { console.error(e); Log.add('Error de dibujo: ' + esc(e.message), 'error'); }
        }
        if (f.log) Log.add(f.log, f.type || 'info');
        if (f.logs) f.logs.forEach(([m, t]) => Log.add(m, t || 'info'));
        if (f.status) Status.set(f.status, f.statusType || '');
        if (f.formula) Formula.set(f.formula);
    },
    toggleAuto() {
        if (Sim.timer) { Sim.stop(); return; }
        if (!Sim.frames.length) { Sim.next(); if (!Sim.frames.length) return; }
        if (!Sim.hasNext()) { Sim.rewind(); }
        $('#auto-text').textContent = 'Pausar';
        $('#auto-icon').innerHTML = '&#10074;&#10074;';
        $('#btn-auto').classList.add('running');
        const tick = () => {
            if (!Sim.hasNext()) { Sim.stop(); return; }
            Sim.next();
            Sim.timer = setTimeout(tick, Sim.speed());
        };
        Sim.timer = setTimeout(tick, 50);
    },
    stop() {
        if (Sim.timer) clearTimeout(Sim.timer);
        Sim.timer = null;
        const t = $('#auto-text');
        if (t) { t.textContent = 'Automático'; $('#auto-icon').innerHTML = '&#9658;&#9658;'; $('#btn-auto').classList.remove('running'); }
    },
    rewind() {
        Sim.stop();
        Sim.idx = -1;
        Log.clear();
        if (Sim.base) Sim.base();
        Sim.updateCounter();
    },
    reset() {
        const impl = App.impl();
        if (Sim.frames.length) { Sim.rewind(); Status.set('Simulación reiniciada. Pulse <strong>Siguiente Paso</strong> o <strong>Automático</strong>.'); }
        else if (impl && impl.reset) impl.reset();
        else App.open(App.currentId);
    },
    clear() { Sim.stop(); Sim.frames = []; Sim.idx = -1; Sim.base = null; Sim.updateCounter(); },
    updateCounter() {
        const c = $('#step-counter');
        if (c) c.textContent = `Paso ${Math.max(0, Sim.idx + 1)} / ${Sim.frames.length}`;
    },
};

/* ---------------------------------------------------------------------
 * 6. Catálogo de temas (metadatos y complejidades) — 4 módulos del syllabus
 * ------------------------------------------------------------------- */
const CATALOG = [
    {
        id: 'm1', title: 'Módulo 1: Búsquedas, Hashing y Estructuras Digitales',
        short: 'Búsquedas secuencial/binaria, transformación de claves, cubetas dinámicas, funciones hash (decimal y binario), colisiones, árboles digitales, residuos, Huffman, rejilla y árboles 2D.',
        groups: [
            {
                title: '1.1 Búsquedas Internas y Externas', items: [
                    { id: 'secuencial', title: 'Búsqueda Secuencial', badge: 'Secuencial', time: 'O(n)', space: 'O(1)', desc: 'Recorre el arreglo posición por posición. En un arreglo ordenado se aplica parada temprana: si A[i] > k la clave no existe y se detiene sin recorrer el resto.', notes: ['Mejor caso: 1 comparación', 'Promedio (exitosa): (n+1)/2', 'Peor caso: n comparaciones'] },
                    { id: 'binaria', title: 'Búsqueda Binaria', badge: 'Izq · Med · Der', time: 'O(log₂ n)', space: 'O(1)', desc: 'Sobre un arreglo ordenado calcula Med = ⌊(Izq+Der)/2⌋ y descarta la mitad donde la clave no puede estar.', notes: ['Requiere arreglo ordenado', 'Máx. comparaciones: ⌊log₂ n⌋ + 1'] },
                    { id: 'transformacion', title: 'Búsqueda por Transformación de Claves', badge: 'H(k) → dirección', time: 'O(1) prom. · O(n) peor', space: 'O(N)', desc: 'Calcula la dirección de la clave mediante una función hash y accede directamente a esa posición; si hay colisión aplica el método de solución elegido.', notes: ['El costo depende del factor de carga α = n/N', 'Funciones: módulo, cuadrado, truncamiento, conversión de bases'] },
                    { id: 'cubetas', title: 'Estructuras Dinámicas por Cubetas', badge: 'Expansión / Reducción', time: 'O(1) prom. · O(n) al redistribuir', space: 'O(N·R)', desc: 'Cubetas con R registros. Densidad de ocupación DO = registros ocupados / (cubetas × R), incluyendo las colisiones. Si DO ≥ umbral de expansión se expande (total o parcial); si al eliminar DO ≤ umbral de reducción se reduce. Una estructura dinámica nunca puede llenarse al 100%.', notes: ['Expansión total: N → 2N', 'Expansión parcial: N → N + N/2 (ej. 2→3→4→6→8)', 'Las colisiones cuentan en la densidad'] },
                ]
            },
            {
                title: '1.2 Funciones Hash y Colisiones', items: [
                    { id: 'hash-modulo', title: 'Hash: Módulo (División)', badge: 'H(k) = (k mod N) + 1', time: 'O(1)', space: 'O(N)', desc: 'La dirección es el residuo de dividir la clave entre el tamaño de la estructura (preferiblemente primo), desplazado a la dirección base.', notes: ['Se recomienda N primo', 'Disponible en decimal y en binario'] },
                    { id: 'hash-cuadrado', title: 'Hash: Centro del Cuadrado', badge: 'H(k) = díg. centrales(k²) + 1', time: 'O(1)', space: 'O(N)', desc: 'Eleva la clave al cuadrado y toma los dígitos (o bits) centrales. La cantidad de dígitos tomados depende del tamaño de la estructura.', notes: ['Decimal: dígitos centrales de k²', 'Binario: bits centrales de k² en base 2'] },
                    { id: 'hash-truncamiento', title: 'Hash: Truncamiento', badge: 'H(k) = elegir dígitos(k) + 1', time: 'O(1)', space: 'O(N)', desc: 'Toma dígitos (o bits) en posiciones configurables de la clave y los une para formar la dirección.', notes: ['Las posiciones se cuentan de izquierda a derecha desde 1'] },
                    { id: 'hash-bases', title: 'Hash: Conversión de Bases', badge: 'H(k) = díg. menos sig.(k₍b₎) + 1', time: 'O(d)', space: 'O(N)', desc: 'Interpreta los dígitos de la clave como si estuvieran en base b, convierte a decimal y toma los dígitos menos significativos.', notes: ['k = d₁d₂…dₙ → Σ dᵢ·b^(n−i)'] },
                    { id: 'col-reasignacion', title: 'Colisiones: Reasignación (Lineal / Cuadrática)', badge: 'Prueba lineal / cuadrática', time: 'O(1) prom. · O(N) peor', space: 'O(N)', desc: 'Ante colisión busca otra dirección dentro de la misma estructura: lineal D+1, D+2,… o cuadrática D+1², D+2², … (circular).', notes: ['Lineal genera agrupamiento primario', 'Cuadrática puede no visitar todas las celdas'] },
                    { id: 'col-anidados', title: 'Colisiones: Arreglos Anidados', badge: 'Sub-arreglos por cubeta', time: 'O(s)', space: 'O(N·s)', desc: 'Cada dirección tiene un sub-arreglo de tamaño fijo s donde se guardan las claves que colisionan. Si el sub-arreglo se llena, se produce desbordamiento.', notes: ['Desperdicia memoria si hay pocas colisiones'] },
                    { id: 'col-encadenamiento', title: 'Colisiones: Encadenamiento', badge: 'Listas enlazadas · α', time: 'O(1 + α)', space: 'O(N + n)', desc: 'Cada dirección apunta a una lista enlazada con las claves que colisionaron. El factor de carga α = n/N indica la longitud promedio de las listas.', notes: ['α puede ser mayor que 1'] },
                ]
            },
            {
                title: '1.3 Otras Búsquedas y Compresión', items: [
                    { id: 'digital', title: 'Árbol de Búsqueda Digital', badge: '5 bits · claves en nodos', time: 'O(b) (b = bits)', space: 'O(n)', desc: 'Cada letra se convierte a 5 bits (A=00001 … Z=11010). La primera clave es la raíz; las siguientes descienden por el bit i del nivel i (0 izquierda, 1 derecha) hasta encontrar un espacio libre. Las claves quedan en nodos internos.', notes: ['Bits usados por clave = nivel de inserción', 'Total = Σ(Lᵢ × fᵢ)'] },
                    { id: 'residuos', title: 'Árbol por Residuos (Trie 1 bit)', badge: 'Claves solo en hojas', time: 'O(b)', space: 'O(n·b)', desc: 'Las claves se almacenan únicamente en las hojas. Ante una colisión se crean nodos internos vacíos () hasta que los bits de las claves difieren.', notes: ['Profundidad máx. = número de bits'] },
                    { id: 'residuos-multiple', title: 'Árbol por Residuos Múltiple', badge: 'm bits por nivel', time: 'O(b/m)', space: 'O(n·2^m)', desc: 'Agrupa m bits por nivel: cada nodo interno tiene 2^m ramas (para m=2: 00, 01, 10, 11). Reduce la altura a costa de más punteros.', notes: ['m = 2 → 4 ramas por nodo'] },
                    { id: 'huffman', title: 'Árbol de Huffman y Fuentes Reducidas', badge: 'Código óptimo', time: 'O(n log n)', space: 'O(n)', desc: 'Calcula frecuencias y probabilidades, genera la secuencia de fuentes reducidas S₀, S₁, … combinando las dos menores probabilidades, y construye el árbol (0 izquierda, 1 derecha).', notes: ['Longitud promedio L̄ = Σ pᵢ·Lᵢ', 'Bits totales = Σ fᵢ·Lᵢ'] },
                    { id: 'rejilla', title: 'Método de la Rejilla (Grid File)', badge: 'Directorio 2D', time: 'O(1) exacta · O(celdas) rango', space: 'O(n + celdas)', desc: 'Divide el espacio (x, y) con escalas lineales en celdas; un directorio matricial asocia cada celda a una cubeta. Soporta consulta exacta y por rango.', notes: [] },
                    { id: 'arbol-2d', title: 'Árboles 2D (k-d Tree)', badge: 'X en niveles pares · Y en impares', time: 'O(log n) prom. · O(n) peor', space: 'O(n)', desc: 'Árbol binario de puntos que alterna el eje discriminante: nivel par compara X, nivel impar compara Y. Particiona el plano en rectángulos.', notes: [] },
                ]
            },
        ]
    },
    {
        id: 'm2', title: 'Módulo 2: Árboles Jerárquicos, Índices y Disco',
        short: 'Árboles BST y AVL con rotaciones reales, índices primario (denso/disperso), secundario, multinivel y calculadora de accesos a disco.',
        groups: [
            {
                title: '2.1 Árboles de Búsqueda', items: [
                    { id: 'bst', title: 'Árbol Binario de Búsqueda (BST)', badge: 'Inserción · Búsqueda · Eliminación', time: 'O(h): O(log n) prom. · O(n) peor', space: 'O(n)', desc: 'Para todo nodo: claves menores a la izquierda y mayores a la derecha. Incluye inserción, búsqueda, eliminación (hoja, un hijo, dos hijos) y recorridos.', notes: ['Inorden produce las claves ordenadas'] },
                    { id: 'avl', title: 'Árbol AVL', badge: 'FE = h(der) − h(izq)', time: 'O(log n) garantizado', space: 'O(n)', desc: 'Árbol balanceado: en todo nodo |FE| ≤ 1. Tras cada inserción se recalculan los factores y si alguno vale ±2 se aplica rotación simple (II, DD) o doble (ID, DI).', notes: ['II: rotación simple a derecha', 'DD: rotación simple a izquierda', 'ID / DI: rotaciones dobles'] },
                ]
            },
            {
                title: '2.2 Índices y Accesos a Disco', items: [
                    { id: 'idx-primario', title: 'Índice Primario (Disperso / Denso)', badge: 'Campo clave ordenado', time: 'O(log₂ bᵢ) + 1 accesos', space: 'O(b) ó O(r)', desc: 'Archivo ordenado por el campo clave dividido en bloques. Índice disperso: una entrada por bloque (clave ancla). Índice denso: una entrada por registro.', notes: [] },
                    { id: 'idx-secundario', title: 'Índice Secundario', badge: 'Denso · campo no ordenado', time: 'O(log₂ bₛ) + 1 accesos', space: 'O(r)', desc: 'Índice denso sobre un campo por el cual el archivo NO está ordenado: una entrada (valor, puntero) por cada registro.', notes: [] },
                    { id: 'idx-multinivel', title: 'Índice Multinivel (Árbol B / B+)', badge: 'fan-out fo', time: 'O(log_fo r) accesos', space: 'O(r)', desc: 'Se construye un índice del índice hasta que el nivel superior cabe en un bloque. Cada búsqueda lee un bloque por nivel + el bloque de datos.', notes: ['t = ⌈log_fo(b₁)⌉ niveles'] },
                    { id: 'io-calc', title: 'Calculadora de Accesos a Disco (I/O)', badge: 'bfr · b · bᵢ · bₛ', time: 'O(1)', space: 'O(1)', desc: 'Calcula factor de bloqueo, bloques de datos y de índice, y compara los accesos a disco: sin índice (secuencial / binaria), índice primario, secundario y multinivel.', notes: ['bfr = ⌊B / R⌋', 'b = ⌈N / bfr⌉', 'bfrᵢ = ⌊B / (V+P)⌋'] },
                ]
            },
        ]
    },
    {
        id: 'm3', title: 'Módulo 3: Grafos — Fundamentos, Operaciones, Expansión y Caminos',
        short: 'Editor interactivo de G = (S, A), incidencia, grado, articulación, isomorfismo, Euler y Hamilton, operaciones y productos, centro y mediana, árboles de expansión, Bellman, Dijkstra y Floyd.',
        groups: [
            {
                title: '3.1 Definiciones y Recorridos', items: [
                    { id: 'g-fundamentos', title: 'Inspector de G = (S, A)', badge: 'Incidencia · grado · corte', time: 'O(|S| + |A|)', space: 'O(|S| + |A|)', desc: 'Inspecciona incidencia, grado/valencia (entrada y salida si es dirigido), adyacencias, vértices aislados, inaccesibles y terminales, vértices de articulación, aristas puente, conjuntos separadores e isomorfismo.', notes: ['Σ grados = 2|A|', 'Articulación y puentes por DFS (Tarjan)'] },
                    { id: 'g-euler', title: 'Circuito de Euler y Camino Hamiltoniano', badge: 'Euler · Hamilton', time: 'Euler O(|A|) · Hamilton O(n!)', space: 'O(|S| + |A|)', desc: 'Euler: G conexo con todos los grados pares (circuito) o exactamente 2 impares (camino). Hamilton: búsqueda exhaustiva por backtracking de un camino/circuito que visite cada vértice una vez.', notes: [] },
                ]
            },
            {
                title: '3.2 Operaciones y Productos', items: [
                    { id: 'g-operaciones', title: 'Operaciones entre Grafos', badge: '∪ · ∩ · + · ⊕ · fusión', time: 'O(|S| + |A|)', space: 'O(|S| + |A|)', desc: 'Unión, intersección, suma, suma de anillo (diferencia simétrica de aristas), inserción/eliminación de vértices y aristas, fusión de vértices y contracción de aristas.', notes: [] },
                    { id: 'g-productos', title: 'Productos de Grafos', badge: '□ · ⊗ · G₁[G₂]', time: 'O((n₁n₂)²)', space: 'O(n₁n₂ + m)', desc: 'Cartesiano, tensorial y composición. El resultado se dibuja como una sola estructura con vértices (u, v) en cuadrícula.', notes: ['|A(G₁□G₂)| = n₁m₂ + n₂m₁', '|A(G₁⊗G₂)| = 2m₁m₂', '|A(G₁[G₂])| = n₁m₂ + n₂²m₁', 'Columnas = G₁, filas = G₂ (formato del taller)'] },
                ]
            },
            {
                title: '3.3 Otros Conceptos (Floyd)', items: [
                    { id: 'g-centro', title: 'Distancia, Excentricidad, Centro, Radio, Diámetro, Mediana', badge: 'Matriz de distancias', time: 'O(n³)', space: 'O(n²)', desc: 'Con la matriz de distancias mínimas (Floyd) calcula la distancia total de cada vértice, la excentricidad e(v), centro/bicentro, radio, diámetro y mediana.', notes: ['Radio = mín e(v)', 'Diámetro = máx e(v)', 'Mediana = mín Σ d(v,u)'] },
                ]
            },
            {
                title: '3.4 Árboles de Expansión', items: [
                    { id: 'g-expansion', title: 'Árbol de Expansión (Prim · Kruskal · Máxima)', badge: 'T = (S_T, A_T) · T̄', time: 'Prim O(n²) · Kruskal O(m log m)', space: 'O(n + m)', desc: 'Construye el árbol de expansión mínimo (o máximo) y muestra simultáneamente T con sus ramas (rango n − 1) y su complemento T̄ con sus cuerdas (nulidad m − n + 1). Calcula la distancia entre árboles y el árbol de expansión central.', notes: ['d(T₁,T₂) = |A_T₁ − A_T₂|'] },
                ]
            },
            {
                title: '3.5 Caminos Mínimos', items: [
                    { id: 'g-bellman', title: 'Función Ordinal + Bellman', badge: 'λⱼ = mín{λᵢ + d(i, j)}', time: 'O(n + m)', space: 'O(n)', desc: 'Paso 1: función ordinal vértice a vértice con un contador i (inicia en 0, 1 o a): primero un vértice sin predecesores; si no hay, uno cuyos predecesores ya estén todos etiquetados (empates: de izquierda a derecha, de arriba hacia abajo). Si existe un ciclo dirigido el grafo no se puede etiquetar y Bellman NO se aplica (inconsistencia). Paso 2: λ₀ = 0 y λⱼ = mín{λᵢ + d(i, j)} en orden ordinal; reconstruye todas las rutas mínimas en reversa.', notes: ['Solo grafos dirigidos sin ciclos (Bellman no retrocede)', 'Bellman y Dijkstra deben dar el mismo resultado'] },
                    { id: 'g-dijkstra', title: 'Dijkstra (etiquetas [d, n])', badge: 'Temporal · Permanente · Rechazada', time: 'O(n²)', space: 'O(n)', desc: 'Sin matrices, con etiquetas [d, n] (distancia, vértice predecesor). La etiqueta inicial [0, −] es temporal; en cada iteración la temporal de menor valor se vuelve permanente y desde ella se etiquetan los vecinos. Si un vértice tiene dos temporales se deja la menor y la otra se rechaza (punteada). Reporta todas las rutas de costo mínimo.', notes: ['Pesos no negativos', 'Admite ciclos dirigidos (puede avanzar y retroceder)'] },
                    { id: 'g-floyd', title: 'Floyd-Warshall', badge: 'D⁽⁰⁾ … D⁽ⁿ⁾', time: 'Θ(n³)', space: 'O(n²)', desc: 'Condición de clase: si d(i,j) + d(j,k) < d(i,k) se reemplaza d(i,k). j queda fijo mientras i y k varían de 1 a n (n² comparaciones por matriz, n³ en total: 64 para 4 vértices). Muestra la matriz inicial y las n matrices siguientes, fila a fila, con las celdas que cambian.', notes: ['Sin ponderación explícita cada arista vale 1', 'Propuesta de clase: cuando i = j la fila no cambia'] },
                ]
            },
        ]
    },
    {
        id: 'm4', title: 'Módulo 4: Cortes, Matrices, Coloreado, Independencia, Dominación, Matching y Envolventes',
        short: 'Circuitos y conjuntos de corte fundamentales, las 7 matrices + matriz camino, coloreado y polinomio cromático, conjuntos independientes y dominantes, pareamientos y envolventes.',
        groups: [
            {
                title: '4.1 Circuitos y Cortes', items: [
                    { id: 'g-cortes', title: 'Circuitos Fundamentales y Conjuntos de Corte', badge: 'Cuerdas · Ramas', time: 'O(2^(m−n+1)) todos', space: 'O(m)', desc: 'A partir de T: todos los circuitos, circuitos fundamentales (1 cuerda + ramas), todos los conjuntos de corte, cortes fundamentales (1 rama + cuerdas), conectividad de vértices/aristas y separabilidad.', notes: ['#circuitos fund. = nulidad', '#cortes fund. = rango'] },
                ]
            },
            {
                title: '4.2 Representación', items: [
                    { id: 'g-matrices', title: 'Matrices y Estructura de Adyacencia', badge: '7 matrices + camino', time: 'O(n·m) – O(n³)', space: 'O(n² + nm)', desc: 'Incidencia, adyacencia de vértices, adyacencia de aristas, circuitos, circuitos fundamentales, conjuntos de corte, cortes fundamentales, matriz camino y lista de adyacencia, con relaciones entre matrices.', notes: ['Dirigido: +1 sale, −1 entra, 0 no incide'] },
                ]
            },
            {
                title: '4.3 Coloreado', items: [
                    { id: 'g-coloreado', title: 'Coloreado, X(G), X′(G) y Polinomio Cromático', badge: 'Backtracking exacto', time: 'O(kⁿ) exacto', space: 'O(n)', desc: 'Coloreado óptimo de vértices y aristas, número e índice cromático, particionamiento cromático y polinomio cromático por detección del tipo o deleción-contracción.', notes: ['X(G) ≤ Δ(G) + 1', 'Δ ≤ X′(G) ≤ Δ + 1 (Vizing)'] },
                ]
            },
            {
                title: '4.4 Independencia y Dominación', items: [
                    { id: 'g-indep', title: 'Conjuntos Independientes y Dominantes', badge: 'Vista con pestañas', time: 'O(2ⁿ · n²)', space: 'O(2ⁿ)', desc: 'Enumera TODOS los conjuntos independientes de vértices y de aristas y todos los conjuntos dominantes del grafo, con filtros (máximos, maximales, mínimos, minimales, conexos, totales, independientes).', notes: ['α(G): número de independencia', 'γ(G): número de dominación'] },
                ]
            },
            {
                title: '4.5 Pareamientos y Envolventes', items: [
                    { id: 'g-matching', title: 'Pareamientos (Matching)', badge: 'Caminos M-aumentados', time: 'O(n·m) aumentos', space: 'O(n + m)', desc: 'Valida que G sea simple. Busca caminos M-alternados y M-aumentados y los invierte paso a paso. Clasifica el pareamiento en máximo, maximal, perfecto y óptimo.', notes: ['Teorema de Berge: M es máximo ⇔ no existe camino M-aumentado'] },
                    { id: 'g-envolventes', title: 'Envolventes (Cubrimientos)', badge: 'τ(G) · ρ(G) · Gallai', time: 'O(2ⁿ) exacto', space: 'O(n)', desc: 'Cubrimiento mínimo de vértices τ(G) y de aristas ρ(G), verificando los teoremas de Gallai α + τ = |S| y α′ + ρ = |S|.', notes: [] },
                ]
            },
        ]
    },
];

/* ---------------------------------------------------------------------
 * 7. Aplicación: registro de implementaciones y navegación
 * ------------------------------------------------------------------- */
const App = {
    impls: {},
    currentId: null,
    meta: {},
    /** Registra la implementación de un tema: {mount(ctx), run?(), reset?(), unmount?()} */
    register(id, impl) { App.impls[id] = impl; },
    impl(id = App.currentId) { return App.impls[id]; },
    init() {
        CATALOG.forEach((m, mi) => m.groups.forEach(g => g.items.forEach(it => { App.meta[it.id] = Object.assign({ module: m, moduleIdx: mi }, it); })));
        App.buildSidebar();
        App.buildCards();
        $('#btn-back').addEventListener('click', () => App.home());
        $('#btn-step').addEventListener('click', () => Sim.next());
        $('#btn-auto').addEventListener('click', () => Sim.toggleAuto());
        $('#btn-reset').addEventListener('click', () => Sim.reset());
        $('#btn-clear-logs').addEventListener('click', () => Log.clear());
        $('#menu-search').addEventListener('input', e => App.filterMenu(e.target.value));
        window.addEventListener('hashchange', () => App.fromHash());
        App.fromHash();
    },
    fromHash() {
        const id = decodeURIComponent(location.hash.replace(/^#/, ''));
        if (id && App.meta[id]) { if (id !== App.currentId) App.open(id, false); }
        else if (!id) App.home(false);
    },
    buildSidebar() {
        const nav = $('#sidebar-nav');
        nav.innerHTML = '';
        CATALOG.forEach((m, mi) => {
            const panel = h('div', { class: 'panel' }, m.groups.map(g =>
                h('div', { class: 'subgroup' }, h('h4', { text: g.title }),
                    h('ul', null, g.items.map(it => h('li', null, h('a', { href: '#' + it.id, 'data-id': it.id, text: it.title })))))));
            const acc = h('button', { class: 'accordion', text: m.title });
            acc.addEventListener('click', () => App.toggleAccordion(mi));
            nav.appendChild(h('div', { class: 'nav-module' }, acc, panel));
        });
    },
    toggleAccordion(mi, forceOpen) {
        const mods = $$('.nav-module');
        const acc = $('.accordion', mods[mi]), panel = $('.panel', mods[mi]);
        const open = forceOpen === undefined ? panel.style.display !== 'block' : forceOpen;
        panel.style.display = open ? 'block' : 'none';
        acc.classList.toggle('active', open);
    },
    filterMenu(q) {
        q = q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        $$('.nav-module').forEach((mod, mi) => {
            let any = false;
            $$('li', mod).forEach(li => {
                const t = li.textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
                const ok = !q || t.includes(q);
                li.style.display = ok ? '' : 'none';
                any = any || ok;
            });
            $$('.subgroup', mod).forEach(sg => { sg.style.display = $$('li', sg).some(li => li.style.display !== 'none') ? '' : 'none'; });
            if (q) App.toggleAccordion(mi, any);
        });
    },
    buildCards() {
        const grid = $('#module-cards');
        CATALOG.forEach((m, mi) => {
            const first = m.groups[0].items[0].id;
            const count = m.groups.reduce((a, g) => a + g.items.length, 0);
            grid.appendChild(h('div', { class: 'module-card', onclick: () => { App.toggleAccordion(mi, true); location.hash = first; } },
                h('h3', { text: m.title }),
                h('p', { text: m.short }),
                h('div', { class: 'card-topics' }, m.groups.map(g => h('span', { text: g.title }))),
                h('span', { class: 'card-link', html: `${count} temas · Explorar módulo &rarr;` })));
        });
    },
    home(updateHash = true) {
        App.unmountCurrent();
        App.currentId = null;
        $$('.view').forEach(v => v.classList.remove('active'));
        $('#welcome-view').classList.add('active');
        $$('.sidebar-nav a').forEach(a => a.classList.remove('active'));
        if (updateHash && location.hash) history.pushState(null, '', location.pathname);
    },
    unmountCurrent() {
        const prev = App.impl();
        if (prev && prev.unmount) { try { prev.unmount(); } catch (e) { console.error(e); } }
        Sim.clear();
    },
    /** Abre un tema: pinta metadatos y monta su implementación. */
    open(id, updateHash = true) {
        const meta = App.meta[id];
        if (!meta) return;
        if (updateHash && location.hash !== '#' + id) { location.hash = id; return; }
        App.unmountCurrent();
        App.currentId = id;
        $$('.view').forEach(v => v.classList.remove('active'));
        $('#algorithm-view').classList.add('active');
        $$('.sidebar-nav a').forEach(a => a.classList.toggle('active', a.dataset.id === id));
        App.toggleAccordion(meta.moduleIdx, true);
        $('#current-algorithm-title').textContent = meta.title;
        $('#current-module-chip').textContent = meta.module.title.split(':')[0];
        $('#algo-badge').textContent = meta.badge;
        $('#time-complexity').textContent = meta.time;
        $('#space-complexity').textContent = meta.space;
        $('#algorithm-description').textContent = meta.desc;
        $('#algorithm-notes').innerHTML = (meta.notes || []).map(n => `<li>${esc(n)}</li>`).join('');
        $('#side-extra').innerHTML = '';
        $('#module-controls').innerHTML = '';
        $('#stage').innerHTML = '';
        $('#stage').className = 'stage';
        Formula.hide();
        Log.clear();
        App.showPlayer(true);
        Status.set('Configure los datos y pulse <strong>Siguiente Paso</strong> o <strong>Automático</strong>.');
        const impl = App.impls[id];
        if (!impl) {
            $('#stage').appendChild(UI.alert('warn', 'Tema sin implementación', 'Este tema aún no tiene un módulo JavaScript cargado.'));
            return;
        }
        try {
            impl.mount({ controls: $('#module-controls'), stage: $('#stage'), side: $('#side-extra'), meta });
        } catch (e) {
            console.error(e);
            $('#stage').appendChild(UI.alert('error', 'Error al montar el tema', esc(e.stack || e.message)));
        }
        $('.main-content').scrollTop = 0;
    },
    /** Muestra u oculta el reproductor global (los temas puramente de cálculo lo ocultan). */
    showPlayer(show) { $('#sim-player').style.display = show ? 'flex' : 'none'; },
};

document.addEventListener('DOMContentLoaded', () => App.init());

/* =====================================================================
 * mod4_grafos_avanzados.js — MÓDULO 4
 *   4.1 Circuitos, circuitos fundamentales, conjuntos de corte, conectividad
 *   4.2 Las 7 matrices + matriz camino + lista de adyacencia + relaciones
 *   4.3 Coloreado de vértices/aristas, X(G), X′(G), clases, polinomio cromático
 *   4.4 Conjuntos independientes (vértices / aristas) y dominantes (pestañas)
 *   4.5 Pareamientos (caminos M-aumentados) y envolventes (Gallai)
 * ===================================================================== */
'use strict';

/* =====================================================================
 * Utilidades compartidas
 * ===================================================================== */
const M4 = {
    MAXN: 16,
    /** Selector de árbol de expansión T: Kruskal, BFS o cualquiera de los enumerados. */
    treePicker(getG, onPick) {
        const sel = UI.select([], '');
        let trees = [];
        const refresh = () => {
            const g = getG();
            const cur = sel.value;
            trees = [{ name: g.weighted ? 'T mínimo (Kruskal)' : 'T por Kruskal', ids: GA.kruskalIds(g) }, { name: 'T por BFS', ids: g.n ? GA.components(g).flatMap(c => GA.bfsTree(g, c[0])) : [] }];
            const all = GA.spanningTrees(g, 200);
            all.trees.forEach((t, i) => trees.push({ name: `T${U.sub(i + 1)} = ${GUI.edgeSet(g, t)}`, ids: t }));
            sel.innerHTML = '';
            trees.forEach((t, i) => sel.appendChild(h('option', { value: i }, t.name)));
            if (cur && +cur < trees.length) sel.value = cur;
        };
        sel.addEventListener('change', () => onPick(trees[+sel.value].ids));
        return { el: sel, refresh, get: () => (trees[+sel.value] || trees[0] || { ids: [] }).ids };
    },
    /** Recorre un circuito (ids de aristas) y devuelve la secuencia de vértices y de aristas. */
    walkCircuit(g, edgeIds, startEdge) {
        const es = edgeIds.map(id => g.edge(id));
        if (es.length === 1) return { verts: [es[0].u, es[0].u], edges: [es[0].id] };
        const first = startEdge ? g.edge(startEdge) : es[0];
        const verts = [first.u, first.v], used = new Set([first.id]), order = [first.id];
        let cur = first.v;
        while (order.length < es.length) {
            const nx = es.find(e => !used.has(e.id) && (e.u === cur || e.v === cur));
            if (!nx) break;
            used.add(nx.id); order.push(nx.id);
            cur = g.other(nx, cur); verts.push(cur);
        }
        return { verts, edges: order };
    },
    /** Orientación en sentido HORARIO (según las posiciones dibujadas). */
    clockwise(g, walk) {
        const pts = walk.verts.slice(0, -1).map(id => g.node(id));
        let A = 0;
        for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; A += p.x * q.y - q.x * p.y; }
        // en coordenadas de pantalla (y hacia abajo) un área positiva es sentido horario
        if (A >= 0) return walk;
        return { verts: walk.verts.slice().reverse(), edges: walk.edges.slice().reverse() };
    },
    /** Fila orientada de un circuito: +1 si la arista coincide con el recorrido, −1 si es contraria. */
    circuitRow(g, walk) {
        const row = {};
        walk.edges.forEach((id, i) => { const e = g.edge(id), a = walk.verts[i], b = walk.verts[i + 1]; row[id] = e.u === e.v ? 1 : (e.u === a && e.v === b ? 1 : -1); });
        return row;
    },
    rank(M, mod2) {
        const A = M.map(r => r.slice()); let rk = 0;
        const rows = A.length, cols = rows ? A[0].length : 0;
        for (let c = 0; c < cols && rk < rows; c++) {
            let p = -1;
            for (let r = rk; r < rows; r++) if (mod2 ? (A[r][c] % 2 !== 0) : Math.abs(A[r][c]) > 1e-9) { p = r; break; }
            if (p < 0) continue;
            [A[rk], A[p]] = [A[p], A[rk]];
            for (let r = 0; r < rows; r++) {
                if (r === rk) continue;
                if (mod2) { if (A[r][c] % 2 !== 0) A[r] = A[r].map((x, j) => (x + A[rk][j]) % 2); }
                else { const f = A[r][c] / A[rk][c]; if (Math.abs(f) > 1e-12) A[r] = A[r].map((x, j) => x - f * A[rk][j]); }
            }
            rk++;
        }
        return rk;
    },
    mul(A, BT) { return A.map(r => BT.map(c => r.reduce((s, x, j) => s + x * c[j], 0))); },
    isZero(M, mod2) { return M.every(r => r.every(x => mod2 ? Math.abs(x) % 2 === 0 : Math.abs(x) < 1e-9)); },
    tooBig(g, stage, n = M4.MAXN) {
        if (g.n > n) { stage.appendChild(UI.alert('warn', 'Grafo demasiado grande', `La enumeración exhaustiva está limitada a ${n} vértices.`)); return true; }
        return false;
    },
    fmtSign: x => (x > 0 ? (x === 1 ? '1' : String(x)) : x < 0 ? '−' + Math.abs(x) : '0'),
    signCls: (x) => x > 0 ? 'cell-one' : x < 0 ? 'cell-neg' : '',
};

/* =====================================================================
 * 4.1  CIRCUITOS FUNDAMENTALES Y CONJUNTOS DE CORTE
 * ===================================================================== */
App.register('g-cortes', (() => {
    let ed, ui = {}, picker;
    function vertexConnectivity(g) {
        const ids = g.ids(), n = ids.length;
        if (n <= 1) return { k: 0, sets: [] };
        if (GA.components(g).length > 1) return { k: 0, sets: [] };
        for (let s = 1; s <= n - 2; s++) {
            const sets = U.combinations(ids, s).filter(X => GA.components(g, { nodes: ids.filter(i => !X.includes(i)) }).length > 1);
            if (sets.length) return { k: s, sets };
        }
        return { k: n - 1, sets: [], complete: true };
    }
    function render() {
        const g = ed.getGraph();
        ui.body.innerHTML = '';
        if (g.directed) ui.body.appendChild(UI.alert('info', 'Grafo dirigido', 'Circuitos y cortes se calculan sobre el grafo no dirigido subyacente (la orientación se usa en el módulo de matrices).'));
        if (M4.tooBig(g, ui.body)) return;
        const T = picker.get(), Ts = new Set(T);
        const k = GA.components(g).length;
        const chords = g.edges.filter(e => !Ts.has(e.id)).map(e => e.id);
        const fc = GA.fundamentalCircuits(g, T), fcs = GA.fundamentalCutsets(g, T);
        const ac = GA.allCircuits(g, T), acs = GA.allCutsets(g);
        const baseOv = () => { const ov = { edgeCls: {}, nodeCls: {} }; g.edges.forEach(e => ov.edgeCls[e.id] = Ts.has(e.id) ? 'c-tree' : 'c-chord'); return ov; };
        ed.setOverlay(baseOv());
        ui.body.appendChild(UI.kv([['Ramas de T', GUI.edgeSet(g, T)], ['Cuerdas (T̄)', GUI.edgeSet(g, chords)], ['Rango r = n − k', `${g.n} − ${k} = ${g.n - k}`], ['Nulidad μ = m − n + k', `${g.m} − ${g.n} + ${k} = ${g.m - g.n + k}`]]));
        const list = (items, fmt, ov) => h('div', { class: 'set-list' }, items.map((it, i) => h('div', { class: 'set-item', onclick: e => { $$('.set-item', e.currentTarget.parentNode).forEach(x => x.classList.remove('active')); e.currentTarget.classList.add('active'); ed.setOverlay(ov(it)); Log.add(fmt(it, i).replace(/<[^>]+>/g, ''), 'info'); } }, h('span', { html: fmt(it, i) }))));
        const tabs = UI.tabs([
            { id: 'circ', label: `Circuitos (${ac.circuits.length})`, render: c => { c.appendChild(h('div', { class: 'hint', text: 'Todos los circuitos, obtenidos como combinaciones (suma de anillo) de circuitos fundamentales que forman un único ciclo.' })); c.appendChild(list(ac.circuits, (cc, i) => `C${U.sub(i + 1)} = ${GUI.edgeSet(g, cc)}  (longitud ${cc.length})`, cc => { const ov = { edgeCls: {} }; g.edges.forEach(e => ov.edgeCls[e.id] = 'c-dim'); cc.forEach(id => ov.edgeCls[id] = 'c-path'); return ov; })); } },
            { id: 'fcirc', label: `Circuitos fundamentales (${fc.length})`, render: c => { c.appendChild(h('div', { class: 'hint', html: 'Cada uno = <b>1 cuerda</b> (punteada) + el camino de ramas de T entre sus extremos. Su número es la nulidad.' })); c.appendChild(list(fc, (f, i) => `C<sub>f${i + 1}</sub> (cuerda ${g.edge(f.chord).name}) = ${GUI.edgeSet(g, f.edges)}`, f => { const ov = { edgeCls: {} }; g.edges.forEach(e => ov.edgeCls[e.id] = 'c-dim'); f.edges.forEach(id => ov.edgeCls[id] = 'c-tree'); ov.edgeCls[f.chord] = 'c-hl c-dashed'; return ov; })); } },
            { id: 'cut', label: `Conjuntos de corte (${acs.cutsets.length})`, render: c => { c.appendChild(h('div', { class: 'hint', text: 'Conjuntos minimales de aristas cuya eliminación aumenta el número de componentes (ambos lados quedan conexos).' })); c.appendChild(list(acs.cutsets, (cs, i) => `K${U.sub(i + 1)} = ${GUI.edgeSet(g, cs.edges)}  ·  separa ${GUI.setLabels(g, cs.side)}`, cs => { const ov = { edgeCls: {}, nodeCls: {} }; cs.edges.forEach(id => ov.edgeCls[id] = 'c-bad c-dashed'); cs.side.forEach(v => ov.nodeCls[v] = 'c-blue'); return ov; })); } },
            { id: 'fcut', label: `Cortes fundamentales (${fcs.length})`, render: c => { c.appendChild(h('div', { class: 'hint', html: 'Cada uno = <b>1 rama</b> de T + las cuerdas que cruzan la partición que produce al quitarla. Su número es el rango.' })); c.appendChild(list(fcs, (f, i) => `K<sub>f${i + 1}</sub> (rama ${g.edge(f.branch).name}) = ${GUI.edgeSet(g, f.edges)}`, f => { const ov = { edgeCls: {}, nodeCls: {} }; g.edges.forEach(e => ov.edgeCls[e.id] = 'c-dim'); f.edges.forEach(id => ov.edgeCls[id] = 'c-bad'); ov.edgeCls[f.branch] = 'c-tree'; f.side.forEach(v => ov.nodeCls[v] = 'c-blue'); return ov; })); } },
            { id: 'conn', label: 'Conectividad y separabilidad', render: c => {
                const vc = vertexConnectivity(g);
                const lam = k > 1 ? 0 : (acs.cutsets.length ? Math.min(...acs.cutsets.map(x => x.edges.length)) : 0);
                const delta = GA.minDegree(g);
                const { ap } = GA.articulationAndBridges(g);
                c.appendChild(UI.kv([
                    ['Conectividad de vértices κ(G)', `${vc.k}${vc.complete ? ' (grafo completo: n − 1)' : ''}${vc.sets.length ? ' · conjuntos: ' + vc.sets.slice(0, 8).map(s => GUI.setLabels(g, s)).join(' ') : ''}`],
                    ['Conectividad de aristas λ(G)', `${lam} (tamaño del menor conjunto de corte)`],
                    ['Grado mínimo δ(G)', delta],
                    ['Desigualdad de Whitney κ ≤ λ ≤ δ', `${vc.k} ≤ ${lam} ≤ ${delta} ${vc.k <= lam && lam <= delta ? '✔' : '✘'}`],
                    ['¿Separable?', ap.length ? `Sí: vértices de corte ${GUI.setLabels(g, ap)}` : 'No (no tiene vértices de corte)'],
                    ['Relación circuito–corte', 'Todo circuito y todo conjunto de corte tienen un número PAR de aristas en común.'],
                ]));
                c.appendChild(UI.btn('Resaltar vértices de corte', () => { const ov = baseOv(); ap.forEach(v => ov.nodeCls[v] = 'c-bad'); ed.setOverlay(ov); }, 'btn-small'));
            } },
        ], 'fcirc');
        ui.body.appendChild(tabs);
        if (ac.truncated) ui.body.prepend(UI.alert('warn', 'Nulidad grande', 'Más de 16 cuerdas: se muestran solo los circuitos fundamentales.'));
    }
    function run() {
        const g = ed.getGraph(), T = picker.get(), Ts = new Set(T);
        const frames = [];
        const fc = GA.fundamentalCircuits(g, T), fcs = GA.fundamentalCutsets(g, T);
        frames.push({ draw: () => { const ov = { edgeCls: {} }; g.edges.forEach(e => ov.edgeCls[e.id] = Ts.has(e.id) ? 'c-tree' : 'c-chord'); ed.setOverlay(ov); }, log: `Árbol T: ramas ${GUI.edgeSet(g, T)}; cuerdas ${GUI.edgeSet(g, g.edges.filter(e => !Ts.has(e.id)).map(e => e.id))}.`, type: 'step' });
        fc.forEach((f, i) => frames.push({ draw: () => { const ov = { edgeCls: {} }; g.edges.forEach(e => ov.edgeCls[e.id] = 'c-dim'); f.edges.forEach(id => ov.edgeCls[id] = 'c-tree'); ov.edgeCls[f.chord] = 'c-hl c-dashed'; ed.setOverlay(ov); }, log: `Circuito fundamental ${i + 1}: cuerda ${g.edge(f.chord).name} + camino en T ⇒ ${GUI.edgeSet(g, f.edges)}`, type: 'compare' }));
        fcs.forEach((f, i) => frames.push({ draw: () => { const ov = { edgeCls: {}, nodeCls: {} }; g.edges.forEach(e => ov.edgeCls[e.id] = 'c-dim'); f.edges.forEach(id => ov.edgeCls[id] = 'c-bad'); ov.edgeCls[f.branch] = 'c-tree'; f.side.forEach(v => ov.nodeCls[v] = 'c-blue'); ed.setOverlay(ov); }, log: `Corte fundamental ${i + 1}: al quitar la rama ${g.edge(f.branch).name}, T se parte en ${GUI.setLabels(g, f.side)} y el resto ⇒ ${GUI.edgeSet(g, f.edges)}`, type: 'compare' }));
        frames.push({ log: `${fc.length} circuitos fundamentales (= nulidad) y ${fcs.length} cortes fundamentales (= rango).`, type: 'found', status: `Nulidad ${fc.length} · Rango ${fcs.length}`, statusType: 'found' });
        Sim.load(frames, { base: render });
    }
    return {
        run,
        mount({ controls, stage }) {
            const top = h('div'); stage.appendChild(top);
            picker = M4.treePicker(() => ed.getGraph(), () => render());
            ed = new GraphEditor(top, { preset: 'clase-basico', presets: ['clase-basico', 'k4', 'articulacion', 'cubo', 'mst-pequeno', 'petersen'], onChange: () => { picker.refresh(); render(); } });
            controls.append(UI.field('Árbol de expansión T:', picker.el), UI.btn('Recorrer paso a paso', run, 'btn-primary'));
            ui.body = h('div', { class: 'stage-col' }); stage.appendChild(ui.body);
            stage.appendChild(h('div', { class: 'legend' }, h('span', null, h('i', { style: { borderColor: '#2E7D32' } }), 'rama'), h('span', null, h('i', { style: { borderColor: '#9E9E9E', borderTopStyle: 'dashed' } }), 'cuerda'), h('span', null, h('i', { style: { borderColor: '#C62828' } }), 'arista del corte')));
            picker.refresh(); render();
        },
        reset() { render(); Log.clear(); },
    };
})());

/* =====================================================================
 * 4.2  MATRICES Y ESTRUCTURA DE ADYACENCIA
 * ===================================================================== */
const Matrices = {
    build(g, T, edgeAdjMode) {
        const V = g.nodes, E = g.edges, dir = g.directed;
        const vi = {}; V.forEach((n, i) => vi[n.id] = i);
        const Ts = new Set(T);
        // 1. Incidencia
        const A = V.map(n => E.map(e => { if (e.u === e.v) return e.u === n.id ? (dir ? 0 : 1) : 0; if (!dir) return (e.u === n.id || e.v === n.id) ? 1 : 0; return e.u === n.id ? 1 : e.v === n.id ? -1 : 0; }));
        // 2. Adyacencia de vértices
        const X = V.map(a => V.map(b => E.filter(e => (e.u === a.id && e.v === b.id) || (!dir && e.v === a.id && e.u === b.id && e.u !== e.v)).length));
        // 3. Adyacencia de aristas
        const EA = E.map(ei => E.map(ej => {
            if (ei.id === ej.id) return 0;
            const shared = [ei.u, ei.v].filter(x => x === ej.u || x === ej.v);
            if (!shared.length) return 0;
            if (edgeAdjMode !== 'dir' || !dir) return 1;
            const v = shared[0];
            return ei.u === v ? 1 : -1;
        }));
        // 4. Circuitos (todos), orientados en sentido horario
        const ac = GA.allCircuits(g, T).circuits;
        const B = ac.map(c => { const w = M4.clockwise(g, M4.walkCircuit(g, c)); const row = M4.circuitRow(g, w); return E.map(e => (row[e.id] === undefined ? 0 : (dir ? row[e.id] : 1))); });
        // 5. Circuitos fundamentales: orientación de la cuerda; columnas = cuerdas primero, luego ramas
        const chords = E.filter(e => !Ts.has(e.id)), branches = E.filter(e => Ts.has(e.id));
        const colOrder = chords.concat(branches);
        const fc = GA.fundamentalCircuits(g, T);
        const Bf = fc.map(f => { const w = M4.walkCircuit(g, f.edges, f.chord); const row = M4.circuitRow(g, w); return colOrder.map(e => (row[e.id] === undefined ? 0 : (dir ? row[e.id] : 1))); });
        // 6. Conjuntos de corte, orientados del lado que contiene al primer vértice hacia el otro
        const cs = GA.allCutsets(g).cutsets;
        const C = cs.map(c => { const S = new Set(c.side); return E.map(e => !c.edges.includes(e.id) ? 0 : (!dir ? 1 : (S.has(e.u) ? 1 : -1))); });
        // 7. Cortes fundamentales: orientación de la rama
        const fcs = GA.fundamentalCutsets(g, T);
        const Cf = fcs.map(f => { const S = new Set(f.side); const be = g.edge(f.branch); const sgn = S.has(be.u) ? 1 : -1; return colOrder.map(e => !f.edges.includes(e.id) ? 0 : (!dir ? 1 : (S.has(e.u) ? sgn : -sgn))); });
        // 8. Matriz camino (alcanzabilidad, Warshall booleano)
        const P = X.map(r => r.map(x => (x > 0 ? 1 : 0)));
        const n = V.length;
        for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (P[i][k] && P[k][j]) P[i][j] = 1;
        return { V, E, A, X, EA, B, ac, Bf, fc, C, cs, Cf, fcs, P, chords, branches, colOrder };
    },
    /** Caminos simples entre x e y (matriz de caminos de Deo). */
    simplePaths(g, x, y, limit = 60) {
        const res = [], used = new Set(), vis = new Set([x]);
        const rec = v => {
            if (res.length >= limit) return;
            if (v === y) { res.push(Array.from(used)); return; }
            g.edges.forEach(e => {
                if (used.has(e.id) || e.u === e.v) return;
                let w = null; if (e.u === v) w = e.v; else if (!g.directed && e.v === v) w = e.u;
                if (w === null || vis.has(w)) return;
                used.add(e.id); vis.add(w); rec(w); used.delete(e.id); vis.delete(w);
            });
        };
        rec(x);
        return res;
    },
};
App.register('g-matrices', (() => {
    let ed, ui = {}, picker, active = 'inc';
    function render() {
        const g = ed.getGraph();
        ui.body.innerHTML = '';
        if (!g.n) return;
        if (M4.tooBig(g, ui.body)) return;
        const T = picker.get();
        const R = Matrices.build(g, T, ui.eam.value);
        const dir = g.directed;
        const VL = R.V.map(n => n.label), EL = R.E.map(e => e.name), CO = R.colOrder.map(e => e.name);
        const mat = (M, rows, cols, caption, extra = {}) => M.length ? UI.matrix(M, rows, cols, Object.assign({ caption, fmt: M4.fmtSign, cellCls: (i, j, x) => M4.signCls(x) }, extra)) : h('div', { class: 'muted', text: 'Matriz vacía (no hay filas).' });
        const hlEdges = ids => { const ov = { edgeCls: {} }; g.edges.forEach(e => ov.edgeCls[e.id] = 'c-dim'); ids.forEach(id => ov.edgeCls[id] = 'c-path'); ed.setOverlay(ov); };
        const rowClick = (wrap, fn) => { $$('tbody tr', wrap).forEach((tr, i) => { tr.style.cursor = 'pointer'; tr.addEventListener('click', () => fn(i)); }); return wrap; };
        const mod2 = !dir;
        const bAt = M4.mul(R.B, R.A), bCt = M4.mul(R.B, R.C);
        const k = GA.components(g).length, deg = R.V.map(n => g.degree(n.id));
        const AAt = M4.mul(R.A, R.A);
        const nu = R.chords.length;
        const BfIdentity = R.Bf.every((r, i) => r.slice(0, nu).every((x, j) => (i === j ? Math.abs(x) === 1 : x === 0)));
        const CfIdentity = R.Cf.every((r, i) => r.slice(nu).every((x, j) => (i === j ? Math.abs(x) === 1 : x === 0)));
        const Bt = R.Bf.map(r => r.slice(nu)), Cc = R.Cf.map(r => r.slice(0, nu));
        const CcEqBtT = Cc.every((r, i) => r.every((x, j) => dir ? x === -(Bt[j] ? Bt[j][i] : 0) : x === (Bt[j] ? Bt[j][i] : 0)));
        const tabs = [
            { id: 'inc', label: '1. Incidencia', render: c => { c.appendChild(mat(R.A, VL, EL, `A(G) — ${dir ? '+1 sale, −1 entra, 0 no incide' : '1 incide, 0 no incide'}`)); c.appendChild(h('div', { class: 'hint', text: dir ? 'Cada columna suma 0 (una salida y una entrada).' : 'Cada columna tiene exactamente dos 1; cada fila suma el grado del vértice.' })); } },
            { id: 'adj', label: '2. Adyacencia de vértices', render: c => c.appendChild(mat(R.X, VL, VL, `X(G) — ${dir ? 'xᵢⱼ = nº de aristas de vᵢ a vⱼ' : 'xᵢⱼ = nº de aristas entre vᵢ y vⱼ (simétrica)'}`)) },
            { id: 'eadj', label: '3. Adyacencia de aristas', render: c => { c.appendChild(mat(R.EA, EL, EL, ui.eam.value === 'dir' && dir ? 'Respecto al vértice compartido: +1 si eᵢ sale de él, −1 si eᵢ entra' : '1 si eᵢ y eⱼ comparten un vértice')); } },
            { id: 'circ', label: `4. Circuitos (${R.B.length})`, render: c => { c.appendChild(rowClick(mat(R.B, R.ac.map((_, i) => 'C' + U.sub(i + 1)), EL, `B(G) — ${dir ? 'recorrido en sentido HORARIO: +1 si la arista va en el sentido del recorrido, −1 si va en contra' : '1 si la arista pertenece al circuito'}`), i => hlEdges(R.ac[i]))); c.appendChild(h('div', { class: 'hint', text: 'Clic en una fila para resaltar el circuito.' })); } },
            { id: 'fcirc', label: '5. Circuitos fundamentales', render: c => { c.appendChild(rowClick(mat(R.Bf, R.fc.map(f => 'Cf(' + g.edge(f.chord).name + ')'), CO, `B_f = [ I_μ | B_t ] — columnas: cuerdas (${nu}) | ramas${dir ? ' · orientación de la cuerda' : ''}`, { colCls: j => j < nu ? 'th-pivot' : null }), i => hlEdges(R.fc[i].edges))); } },
            { id: 'cut', label: `6. Conjuntos de corte (${R.C.length})`, render: c => { c.appendChild(rowClick(mat(R.C, R.cs.map((_, i) => 'K' + U.sub(i + 1)), EL, `C(G) — ${dir ? 'orientado del lado que contiene al primer vértice: +1 sale de ese lado, −1 entra' : '1 si la arista pertenece al corte'}`), i => hlEdges(R.cs[i].edges))); } },
            { id: 'fcut', label: '7. Cortes fundamentales', render: c => { c.appendChild(rowClick(mat(R.Cf, R.fcs.map(f => 'Kf(' + g.edge(f.branch).name + ')'), CO, `C_f = [ C_c | I_r ] — columnas: cuerdas | ramas (${R.branches.length})${dir ? ' · orientación de la rama' : ''}`, { colCls: j => j >= nu ? 'th-pivot' : null }), i => hlEdges(R.fcs[i].edges))); } },
            { id: 'path', label: '8. Matriz camino', render: c => {
                c.appendChild(mat(R.P, VL, VL, 'P(G) — pᵢⱼ = 1 si existe un camino de vᵢ a vⱼ (P = X ∨ X² ∨ … ∨ Xⁿ, Warshall)', { cellCls: (i, j, x) => x ? 'cell-hl' : '' }));
                const sx = GUI.vertexSelect(g), sy = GUI.vertexSelect(g, g.nodes[g.n - 1] ? g.nodes[g.n - 1].label : undefined), out = h('div');
                const go = () => { const ps = Matrices.simplePaths(g, g.idOf(sx.value), g.idOf(sy.value)); out.innerHTML = ''; out.appendChild(ps.length ? rowClick(mat(ps.map(p => R.E.map(e => p.includes(e.id) ? 1 : 0)), ps.map((_, i) => 'P' + U.sub(i + 1)), EL, `Matriz de caminos P(${sx.value}, ${sy.value}): filas = caminos simples, columnas = aristas`), i => hlEdges(ps[i])) : h('div', { class: 'muted', text: 'No hay caminos.' })); };
                c.appendChild(h('div', { class: 'filter-bar' }, UI.field('Caminos entre', sx), UI.field('y', sy), UI.btn('Calcular P(x, y)', go, 'btn-small')));
                c.appendChild(out);
            } },
            { id: 'list', label: 'Lista de adyacencia', render: c => {
                c.appendChild(h('div', { class: 'hint', text: 'Representación en memoria: arreglo de cabeceras (vértices) con listas enlazadas de sucesores.' }));
                c.appendChild(h('div', { class: 'adj-list' }, g.nodes.map(n => h('div', { class: 'adj-row' }, h('span', { class: 'adj-head', text: n.label }), g.adj(n.id).length ? g.adj(n.id).map(({ to, e }) => [h('span', { class: 'adj-arrow', text: '→' }), h('span', { class: 'adj-cell' }, h('span', { text: g.label(to) + (g.weighted ? ` (${e.w})` : '') }), h('em', { text: '•' }))]) : null, h('span', { class: 'adj-arrow', text: '→ ∅' })))));
                c.appendChild(h('div', { class: 'hint', html: `Memoria: ${g.n} cabeceras + ${dir ? g.m : 2 * g.m - g.edges.filter(e => e.u === e.v).length} nodos ⇒ O(|S| + |A|), frente a O(|S|²) de la matriz de adyacencia.` }));
            } },
            { id: 'rel', label: 'Relaciones', render: c => {
                const ok = b => b ? '<span class="pill ok">✔ se cumple</span>' : '<span class="pill bad">✘ no se cumple</span>';
                const rows = [
                    ['rango(A) = n − k', `${M4.rank(R.A, mod2)} = ${g.n} − ${k}`, ok(M4.rank(R.A, mod2) === g.n - k)],
                    ['rango(B) = m − n + k (nulidad)', `${M4.rank(R.B, mod2)} = ${g.m - g.n + k}`, ok(M4.rank(R.B, mod2) === g.m - g.n + k)],
                    ['rango(C) = n − k (rango)', `${M4.rank(R.C, mod2)} = ${g.n - k}`, ok(M4.rank(R.C, mod2) === g.n - k)],
                    [`B · Aᵀ = 0 ${mod2 ? '(mód 2)' : ''}`, 'circuitos vs. incidencia', ok(M4.isZero(bAt, mod2))],
                    [`B · Cᵀ = 0 ${mod2 ? '(mód 2)' : ''}`, 'todo circuito y todo corte comparten un nº par de aristas', ok(M4.isZero(bCt, mod2))],
                    ['B_f = [ I_μ | B_t ]', 'identidad en las columnas de cuerdas', ok(BfIdentity)],
                    ['C_f = [ C_c | I_r ]', 'identidad en las columnas de ramas', ok(CfIdentity)],
                    [dir ? 'C_c = −B_tᵀ' : 'C_c = B_tᵀ (mód 2)', 'cortes fundamentales a partir de los circuitos fundamentales', ok(CcEqBtT)],
                    [dir ? 'diag(A·Aᵀ) = g⁺ + g⁻' : 'diag(A·Aᵀ) = grados', AAt.map((r, i) => r[i]).join(', '), ok(AAt.every((r, i) => r[i] === (dir ? g.inDeg(R.V[i].id) + g.outDeg(R.V[i].id) : deg[i]) || g.edges.some(e => e.u === e.v)))],
                ];
                c.appendChild(UI.table(['Relación', 'Valor', 'Verificación'], rows.map(r => [{ html: r[0], cls: 'left' }, { html: r[1], cls: 'left' }, r[2]])));
                c.appendChild(h('div', { class: 'hint', text: 'De la matriz de incidencia se puede reconstruir G completo; de B_f se obtiene C_f (y viceversa) sin volver al dibujo.' }));
            } },
        ];
        const t = UI.tabs(tabs, active, id => { active = id; });
        ui.body.appendChild(t);
    }
    function run() {
        const g = ed.getGraph();
        if (!g.n) return;
        const T = picker.get(), R = Matrices.build(g, T, ui.eam.value);
        const frames = [];
        frames.push({ draw: () => { active = 'inc'; render(); }, log: `Matriz de incidencia ${g.n}×${g.m}: ${R.V.map((n, i) => `${n.label}: [${R.A[i].map(M4.fmtSign).join(' ')}]`).join(' · ')}`, type: 'step' });
        R.E.forEach((e, j) => frames.push({ draw: () => { const ov = { edgeCls: { [e.id]: 'c-hl' }, nodeCls: { [e.u]: 'c-current', [e.v]: 'c-current' } }; ed.setOverlay(ov); }, log: `Columna ${e.name} (${g.edgeStr(e)}): ${g.directed ? `+1 en ${g.label(e.u)} (sale), −1 en ${g.label(e.v)} (entra)` : `1 en ${g.label(e.u)} y en ${g.label(e.v)}`}.`, type: 'compare' }));
        const names = { adj: '2. Matriz de adyacencia de vértices X(G)', eadj: '3. Matriz de adyacencia de aristas', circ: `4. Matriz de circuitos B(G): ${R.B.length} circuitos`, fcirc: `5. Matriz de circuitos fundamentales B_f: ${R.Bf.length} filas (= nulidad)`, cut: `6. Matriz de conjuntos de corte C(G): ${R.C.length} cortes`, fcut: `7. Matriz de cortes fundamentales C_f: ${R.Cf.length} filas (= rango)`, path: '8. Matriz camino P(G) (alcanzabilidad)', list: 'Lista de adyacencia en memoria', rel: 'Relaciones entre matrices (rangos, B·Aᵀ, B·Cᵀ, B_f, C_f)' };
        Object.keys(names).forEach(id => frames.push({ draw: () => { active = id; ed.clearOverlay(); render(); }, log: names[id], type: 'step' }));
        Sim.load(frames, { base: () => { active = 'inc'; render(); } });
    }
    return {
        run,
        mount({ controls, stage }) {
            const top = h('div'); stage.appendChild(top);
            picker = M4.treePicker(() => ed.getGraph(), () => render());
            ui.dir = UI.select([['u', 'No dirigido (0, 1)'], ['d', 'Dirigido (+1 sale, −1 entra)']], 'u', v => { ed.getGraph().directed = v === 'd'; ed.setGraph(ed.getGraph(), true); });
            ui.eam = UI.select([['simple', 'Adyacencia de aristas: simple'], ['dir', 'Adyacencia de aristas: dirigida']], 'simple', () => render());
            controls.append(UI.field('Modo:', ui.dir), ui.eam, UI.field('Árbol T:', picker.el), UI.btn('Recorrer paso a paso', run, 'btn-primary'));
            ed = new GraphEditor(top, { preset: 'clase-basico', presets: ['clase-basico', 'k4', 'dirigido', 'mst-pequeno', 'articulacion'], allowDirected: false, height: 340, showNames: true, onChange: g => { ui.dir.value = g.directed ? 'd' : 'u'; picker.refresh(); render(); } });
            ui.body = h('div', { class: 'stage-col' }); stage.appendChild(ui.body);
            picker.refresh(); render();
        },
        reset() { render(); Log.clear(); },
    };
})());

/* =====================================================================
 * 4.3  COLOREADO
 * ===================================================================== */
const Poly = {
    trim: p => { const q = p.slice(); while (q.length > 1 && q[q.length - 1] === 0) q.pop(); return q; },
    add: (a, b) => Poly.trim(U.range(Math.max(a.length, b.length)).map(i => (a[i] || 0) + (b[i] || 0))),
    sub: (a, b) => Poly.trim(U.range(Math.max(a.length, b.length)).map(i => (a[i] || 0) - (b[i] || 0))),
    mul(a, b) { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => r[i + j] += x * y)); return Poly.trim(r); },
    pow(a, n) { let r = [1]; for (let i = 0; i < n; i++) r = Poly.mul(r, a); return r; },
    falling(n) { let r = [1]; for (let i = 0; i < n; i++) r = Poly.mul(r, [-i, 1]); return r; },
    evalAt: (p, k) => p.reduce((s, c, i) => s + c * Math.pow(k, i), 0),
    str(p) {
        const terms = [];
        for (let i = p.length - 1; i >= 0; i--) {
            const c = p[i]; if (!c) continue;
            const abs = Math.abs(c), sign = c < 0 ? ' − ' : ' + ';
            const body = i === 0 ? String(abs) : (abs === 1 ? '' : abs) + 'k' + (i > 1 ? U.sup(i) : '');
            terms.push(terms.length ? sign + body : (c < 0 ? '−' : '') + body);
        }
        return terms.join('') || '0';
    },
};
const Coloring = {
    /** Grafo simple subyacente como {ids, nb: [Set]} */
    simple(g) { const ids = g.ids(), ix = {}; ids.forEach((id, i) => ix[id] = i); const nb = ids.map(() => new Set()); g.edges.forEach(e => { if (e.u !== e.v) { nb[ix[e.u]].add(ix[e.v]); nb[ix[e.v]].add(ix[e.u]); } }); return { ids, ix, nb }; },
    /** Intenta colorear con k colores (backtracking). trace opcional. */
    tryK(nb, k, trace, maxTrace = 300) {
        const n = nb.length, col = new Array(n).fill(-1);
        const order = U.range(n).sort((a, b) => nb[b].size - nb[a].size);
        const rec = p => {
            if (p === n) return true;
            const v = order[p];
            for (let c = 0; c < k; c++) {
                if ([...nb[v]].some(w => col[w] === c)) { if (trace && trace.length < maxTrace) trace.push({ v, c, ok: false, col: col.slice() }); continue; }
                col[v] = c;
                if (trace && trace.length < maxTrace) trace.push({ v, c, ok: true, col: col.slice() });
                if (rec(p + 1)) return true;
                col[v] = -1;
                if (trace && trace.length < maxTrace) trace.push({ v, back: true, col: col.slice() });
            }
            return false;
        };
        return rec(0) ? col : null;
    },
    chromatic(nb) {
        if (!nb.length) return { k: 0, col: [] };
        for (let k = 1; k <= nb.length; k++) { const c = Coloring.tryK(nb, k); if (c) return { k, col: c }; }
    },
    maxClique(nb) { let best = 0; const n = nb.length; const rec = (cand, size) => { if (!cand.length) { best = Math.max(best, size); return; } if (size + cand.length <= best) return; const v = cand[0]; rec(cand.filter(w => nb[v].has(w)), size + 1); rec(cand.slice(1), size); }; rec(U.range(n), 0); return best; },
    /** Polinomio cromático por deleción-contracción con memo y atajos. edges: [[a,b]] sobre vértices 0..n−1 */
    polyDC(n, edges, memo = {}, depth = 0, log = null) {
        const E = Array.from(new Set(edges.map(([a, b]) => (a < b ? a + '-' + b : b + '-' + a)))).map(s => s.split('-').map(Number)).filter(([a, b]) => a !== b);
        const key = n + '|' + E.map(e => e.join('-')).sort().join(',');
        if (memo[key]) return memo[key];
        let res;
        if (!E.length) res = Poly.pow([0, 1], n);
        else {
            const m = E.length;
            const deg = U.range(n).map(i => E.filter(e => e[0] === i || e[1] === i).length);
            const g2 = new Graph(); U.range(n).forEach(i => g2.addNode(String(i))); E.forEach(([a, b]) => g2.addEdge(a + 1, b + 1));
            const comps = GA.components(g2);
            if (comps.length > 1 && comps.some(c => c.length < n)) {
                res = [1];
                comps.forEach(c => { const map = {}; c.forEach((id, i) => map[id - 1] = i); res = Poly.mul(res, Coloring.polyDC(c.length, E.filter(([a]) => map[a] !== undefined).map(([a, b]) => [map[a], map[b]]), memo, depth + 1)); });
            } else if (m === n - 1) res = Poly.mul([0, 1], Poly.pow([-1, 1], n - 1));
            else if (m === n * (n - 1) / 2) res = Poly.falling(n);
            else if (m === n && deg.every(d => d === 2)) res = Poly.add(Poly.pow([-1, 1], n), Poly.mul([n % 2 ? -1 : 1], [-1, 1]));
            else {
                const [a, b] = E[0];
                const del = E.slice(1);
                const con = E.slice(1).map(([x, y]) => [x === b ? a : x, y === b ? a : y]).map(([x, y]) => [x > b ? x - 1 : x, y > b ? y - 1 : y]);
                if (log && depth === 0) log.push(`Deleción-contracción sobre la arista (${a},${b}): P(G) = P(G − e) − P(G / e)`);
                res = Poly.sub(Coloring.polyDC(n, del, memo, depth + 1), Coloring.polyDC(n - 1, con, memo, depth + 1));
            }
        }
        memo[key] = res;
        return res;
    },
    /** Número de particiones de S en j conjuntos independientes (verificación exacta). */
    partitions(nb) {
        const n = nb.length, full = (1 << n) - 1;
        const nbm = nb.map(s => [...s].reduce((m, w) => m | (1 << w), 0));
        const indep = new Uint8Array(1 << n);
        for (let m = 0; m <= full; m++) { let ok = 1; for (let i = 0; i < n && ok; i++) if ((m & (1 << i)) && (nbm[i] & m)) ok = 0; indep[m] = ok; }
        const f = U.range(n + 1).map(() => new Float64Array(1 << n));
        f[0][0] = 1;
        for (let m = 1; m <= full; m++) {
            const low = m & -m, rest = m ^ low;
            for (let s = rest; ; s = (s - 1) & rest) {
                const S = s | low;
                if (indep[S]) for (let j = 1; j <= n; j++) f[j][m] += f[j - 1][m ^ S];
                if (s === 0) break;
            }
        }
        return U.range(n + 1).map(j => f[j][full]);
    },
};
App.register('g-coloreado', (() => {
    let ed, ui = {}, active = 'v';
    const nameOf = (g, ids) => ids.map(i => g.label(i));
    function classify(g) {
        if (!g.m) return { type: 'nulo', formula: 'P(k) = kⁿ' };
        if (GA.isComplete(g)) return { type: 'completo K' + U.sub(g.n), formula: 'P(k) = k!/(k−n)! = k(k−1)…(k−n+1)' };
        if (GA.isTree(g)) return { type: 'árbol (o lineal)', formula: 'P(k) = k(k−1)ⁿ⁻¹' };
        if (GA.isCycleGraph(g)) return { type: `cíclico C${U.sub(g.n)} ${g.n % 2 ? 'impar' : 'par'}`, formula: `P(k) = (k−1)ⁿ ${g.n % 2 ? '−' : '+'} (k−1)` };
        if (GA.components(g).length > 1) return { type: 'no conexo', formula: 'P(G) = Π P(Gᵢ) (producto de componentes)' };
        return { type: 'general', formula: 'P(G) = P(G − e) − P(G / e) (deleción-contracción)' };
    }
    function render() {
        const g = ed.getGraph();
        ui.body.innerHTML = '';
        if (!g.n) return;
        if (M4.tooBig(g, ui.body, 14)) return;
        const loops = g.edges.filter(e => e.u === e.v);
        if (loops.length) { ui.body.appendChild(UI.alert('inconsistency', 'Grafo con lazos', 'Un vértice con lazo es adyacente a sí mismo: ningún coloreado propio existe (P(k) = 0).')); return; }
        const S = Coloring.simple(g), nb = S.nb;
        const vc = Coloring.chromatic(nb);
        const Delta = GA.maxDegree(g), omega = Coloring.maxClique(nb), bip = GA.bipartite(g), comps = GA.components(g);
        // aristas
        const L = g.edges.map(e => new Set(g.edges.filter(f => f.id !== e.id && (f.u === e.u || f.u === e.v || f.v === e.u || f.v === e.v)).map(f => g.edges.indexOf(f))));
        const ec = g.m ? Coloring.chromatic(L) : { k: 0, col: [] };
        const memo = {}, dcLog = [];
        const poly = Coloring.polyDC(g.n, g.edges.map(e => [S.ix[e.u], S.ix[e.v]]), memo, 0, dcLog);
        const parts = Coloring.partitions(nb);
        let polyCheck = [0];
        parts.forEach((a, j) => { if (a) polyCheck = Poly.add(polyCheck, Poly.mul([a], Poly.falling(j))); });
        const nPart = parts[vc.k] || 0;
        const cls = classify(g);
        const vOverlay = col => { const ov = { nodeFill: {}, nodeAnn: {} }; S.ids.forEach((id, i) => { if (col[i] >= 0) { ov.nodeFill[id] = PALETTE[col[i] % PALETTE.length]; ov.nodeAnn[id] = [{ text: 'c' + (col[i] + 1), cls: 'ann-peach' }]; } }); return ov; };
        const prop = (txt, ok) => [{ html: txt, cls: 'left' }, ok ? '<span class="pill ok">✔</span>' : '<span class="pill bad">✘</span>'];
        const tabs = [
            { id: 'v', label: 'Vértices · X(G)', render: c => {
                ed.setOverlay(vOverlay(vc.col));
                c.append(h('div', { class: 'big-number', text: `X(G) = ${vc.k}` }),
                    UI.table(['Propiedad', '✔'], [
                        prop(`X(G) ≤ |S| : ${vc.k} ≤ ${g.n}`, vc.k <= g.n),
                        prop(`X(G) ≤ Δ(G) + 1 : ${vc.k} ≤ ${Delta + 1}`, vc.k <= Delta + 1),
                        prop(`X(G) ≥ ω(G) (clique máxima) : ${vc.k} ≥ ${omega}`, vc.k >= omega),
                        prop(`X(G) = 1 ⇔ G es nulo (sin aristas): ${g.m === 0 ? 'nulo' : 'no nulo'}`, (vc.k === 1) === (g.m === 0)),
                        prop(`X(G) = 2 ⇔ G bipartito con aristas: ${bip.ok ? 'bipartito' : 'no bipartito'}`, (vc.k === 2) === (bip.ok && g.m > 0)),
                        prop(`X(G) = máx X(Gᵢ) sobre las ${comps.length} componentes conexas`, vc.k === Math.max(...comps.map(cp => Coloring.chromatic(Coloring.simple(GA.induced(g, cp)).nb).k))),
                        GA.isComplete(g) ? prop(`Completo Kₙ ⇒ X = n = ${g.n}`, vc.k === g.n) : null,
                        GA.isCycleGraph(g) ? prop(`Cíclico Cₙ: n ${g.n % 2 ? 'impar ⇒ X = 3' : 'par ⇒ X = 2'}`, vc.k === (g.n % 2 ? 3 : 2)) : null,
                        GA.isTree(g) && g.n > 1 ? prop('Árbol con n ≥ 2 ⇒ X = 2', vc.k === 2) : null,
                    ].filter(Boolean)));
            } },
            { id: 'e', label: "Aristas · X′(G)", render: c => {
                const ov = { edgeColor: {}, edgeText: {} };
                g.edges.forEach((e, i) => { ov.edgeColor[e.id] = PALETTE[ec.col[i] % PALETTE.length]; ov.edgeText[e.id] = 'c' + (ec.col[i] + 1); });
                ed.setOverlay(ov);
                const simple = GA.isSimple(g).simple;
                c.append(h('div', { class: 'big-number', text: `X′(G) = ${ec.k}` }),
                    UI.table(['Propiedad', '✔'], [
                        prop(`X′(G) ≥ Δ(G) : ${ec.k} ≥ ${Delta}`, ec.k >= Delta),
                        simple ? prop(`Vizing (simple): X′(G) ≤ Δ(G) + 1 = ${Delta + 1} → clase ${ec.k === Delta ? '1' : '2'}`, ec.k <= Delta + 1) : null,
                        bip.ok ? prop(`Bipartito (König) ⇒ X′ = Δ = ${Delta}`, ec.k === Delta) : null,
                        GA.isComplete(g) ? prop(`Completo K${U.sub(g.n)}: n ${g.n % 2 ? 'impar ⇒ X′ = n' : 'par ⇒ X′ = n − 1'}`, ec.k === (g.n % 2 ? g.n : g.n - 1)) : null,
                        GA.isCycleGraph(g) ? prop(`Cíclico C${U.sub(g.n)}: ${g.n % 2 ? 'impar ⇒ X′ = 3' : 'par ⇒ X′ = 2'}`, ec.k === (g.n % 2 ? 3 : 2)) : null,
                    ].filter(Boolean)),
                    h('div', { class: 'hint', text: 'Se calcula coloreando de forma exacta el grafo de líneas L(G) (aristas adyacentes ⇒ colores distintos).' }));
            } },
            { id: 'p', label: 'Clases cromáticas', render: c => {
                ed.setOverlay(vOverlay(vc.col));
                const classes = U.range(vc.k).map(k => S.ids.filter((_, i) => vc.col[i] === k));
                c.append(h('div', { html: `Particionamiento cromático de S en <b>${vc.k}</b> conjuntos independientes (G es <b>${vc.k}-partito</b>${vc.k === 2 ? ' = bipartito' : ''}):` }),
                    h('div', { class: 'stage-col' }, classes.map((cl, k) => h('div', null, h('span', { class: 'color-swatch', style: { background: PALETTE[k % PALETTE.length] } }), h('b', { text: `V${U.sub(k + 1)} = ` }), h('span', { class: 'mono', text: U.setStr(nameOf(g, cl)) })))),
                    UI.kv([['Particiones cromáticas distintas', `${nPart}  (= P(X) / X! = ${Poly.evalAt(poly, vc.k)} / ${vc.k}!)`], ['¿Únicamente coloreable?', nPart === 1 ? 'SÍ: existe una sola partición en X(G) clases' : 'NO: hay varias particiones distintas']]));
            } },
            { id: 'poly', label: 'Polinomio cromático', render: c => {
                ed.setOverlay(vOverlay(vc.col));
                const ok = Poly.str(poly) === Poly.str(polyCheck);
                c.append(UI.kv([['Tipo detectado', cls.type], ['Fórmula aplicada', cls.formula]]),
                    h('div', { class: 'poly', text: 'P(k) = ' + Poly.str(poly) }),
                    dcLog.length ? h('div', { class: 'hint', text: dcLog[0] + ` (subproblemas resueltos: ${Object.keys(memo).length})` }) : null,
                    UI.table(['k'].concat(U.range(g.n + 2)), [['P(k)'].concat(U.range(g.n + 2).map(k => Poly.evalAt(poly, k)))]),
                    UI.kv([['X(G) = menor k con P(k) &gt; 0', U.range(g.n + 2).find(k => Poly.evalAt(poly, k) > 0)], ['Verificación por particiones Σ aⱼ·k⁽ʲ⁾', ok ? '✔ coincide' : '✘ difiere'], ['Grado = |S|, coef. de kⁿ⁻¹ = −|A|', `${poly.length - 1} = ${g.n}; ${poly[poly.length - 2] || 0} = −${g.m}`], ['Grafo únicamente coloreable', nPart === 1 ? 'Sí (P(X) = X!)' : 'No']]));
            } },
        ];
        ui.body.appendChild(UI.tabs(tabs, active, id => active = id));
        return { vc, nb, S };
    }
    function run() {
        const g = ed.getGraph();
        const r = render(); if (!r) return;
        const { vc, nb, S } = r;
        const frames = [];
        for (let k = 1; k < vc.k; k++) frames.push({ log: `¿Se puede colorear con k = ${k}? El backtracking agota todas las opciones → NO.`, type: 'discard' });
        const trace = [];
        Coloring.tryK(nb, vc.k, trace);
        frames.push({ draw: () => ed.clearOverlay(), log: `Intento con k = ${vc.k} colores (orden por grado descendente):`, type: 'step' });
        trace.forEach(t => frames.push({
            draw: () => { const ov = { nodeFill: {}, nodeCls: { [S.ids[t.v]]: t.ok === false ? 'c-bad' : 'c-current' } }; t.col.forEach((c, i) => { if (c >= 0) ov.nodeFill[S.ids[i]] = PALETTE[c % PALETTE.length]; }); ed.setOverlay(ov); },
            log: t.back ? `Retroceder: ${g.label(S.ids[t.v])} pierde su color.` : t.ok ? `${g.label(S.ids[t.v])} ← color ${t.c + 1}` : `${g.label(S.ids[t.v])}: color ${t.c + 1} lo usa un vecino ✘`, type: t.back ? 'discard' : t.ok ? 'compare' : 'warn',
        }));
        frames.push({ draw: () => { active = 'v'; render(); }, log: `Coloreado óptimo encontrado: X(G) = ${vc.k}.`, type: 'found', status: `<strong>X(G) = ${vc.k}</strong>`, statusType: 'found' });
        Sim.load(frames, { base: () => ed.clearOverlay() });
    }
    return {
        run,
        mount({ controls, stage }) {
            controls.append(UI.btn('Colorear paso a paso (backtracking)', run, 'btn-primary'));
            const top = h('div'); stage.appendChild(top);
            ed = new GraphEditor(top, { preset: 'petersen', presets: ['petersen', 'c5', 'c6', 'k4', 'k5', 'k33', 'arbol', 'bipartito', 'cubo', 'clase-basico'], forceDirected: false, forceWeighted: false, onChange: render });
            ui.body = h('div', { class: 'stage-col' }); stage.appendChild(ui.body);
            render();
        },
        reset() { render(); Log.clear(); },
    };
})());

/* =====================================================================
 * 4.4  CONJUNTOS INDEPENDIENTES Y DOMINANTES (vista unificada)
 * ===================================================================== */
const SetEnum = {
    /** Todos los subconjuntos no vacíos con propiedades. */
    vertexSets(g) {
        const { ids, nb } = GA.nbMasks(g), n = ids.length, full = (1 << n) - 1;
        const closed = nb.map((m, i) => m | (1 << i));
        const indep = [], dom = [];
        const isIndep = m => { for (let i = 0; i < n; i++) if ((m & (1 << i)) && (nb[i] & m)) return false; return true; };
        const domOf = m => { let d = 0; for (let i = 0; i < n; i++) if (m & (1 << i)) d |= closed[i]; return d; };
        const totalOf = m => { let d = 0; for (let i = 0; i < n; i++) if (m & (1 << i)) d |= nb[i]; return d; };
        const connected = m => { if (!m) return false; const start = m & -m; let seen = start, frontier = start; while (frontier) { let nx = 0; for (let i = 0; i < n; i++) if (frontier & (1 << i)) nx |= nb[i] & m; nx &= ~seen; seen |= nx; frontier = nx; } return seen === m; };
        for (let m = 1; m <= full; m++) {
            const I = isIndep(m);
            if (I) {
                let maximal = true; for (let i = 0; i < n && maximal; i++) if (!(m & (1 << i)) && !(nb[i] & m)) maximal = false;
                indep.push({ m, size: U.popcount(m), maximal });
            }
            if (domOf(m) === full) {
                let minimal = true; for (let i = 0; i < n && minimal; i++) if ((m & (1 << i)) && domOf(m & ~(1 << i)) === full) minimal = false;
                dom.push({ m, size: U.popcount(m), minimal, connected: connected(m), total: totalOf(m) === full, independent: I });
            }
        }
        const alpha = Math.max(0, ...indep.map(s => s.size));
        const gamma = dom.length ? Math.min(...dom.map(s => s.size)) : 0;
        indep.forEach(s => s.maximum = s.size === alpha);
        dom.forEach(s => s.minimum = s.size === gamma);
        return { ids, n, nb, closed, indep, dom, alpha, gamma };
    },
    /** Todos los conjuntos independientes de aristas (pareamientos), no vacíos. */
    edgeSets(g, limit = 20000) {
        const E = g.edges.filter(e => e.u !== e.v);
        const res = [], cur = [], used = new Set();
        let truncated = false;
        const rec = i => {
            if (res.length >= limit) { truncated = true; return; }
            if (i === E.length) { if (cur.length) res.push(cur.slice()); return; }
            const e = E[i];
            if (!used.has(e.u) && !used.has(e.v)) { cur.push(e.id); used.add(e.u); used.add(e.v); rec(i + 1); cur.pop(); used.delete(e.u); used.delete(e.v); }
            rec(i + 1);
        };
        rec(0);
        const isMaximal = s => { const vs = new Set(); s.forEach(id => { const e = g.edge(id); vs.add(e.u); vs.add(e.v); }); return !E.some(e => !s.includes(e.id) && !vs.has(e.u) && !vs.has(e.v)); };
        const nu = Math.max(0, ...res.map(s => s.length));
        return { sets: res.map(s => ({ s, size: s.length, maximal: isMaximal(s), maximum: s.length === nu })), nu, truncated };
    },
};
App.register('g-indep', (() => {
    let ed, ui = {}, tab = 'iv';
    function render() {
        const g = ed.getGraph();
        ui.body.innerHTML = '';
        if (!g.n) return;
        if (M4.tooBig(g, ui.body)) return;
        const V = SetEnum.vertexSets(g), Es = SetEnum.edgeSets(g);
        const lbl = m => U.setStr(U.maskToIdx(m, V.n).map(i => g.label(V.ids[i])));
        const tag = (t, c) => h('span', { class: 'pill ' + c, text: t });
        const listBox = (items, fmt, tags, onPick) => {
            const box = h('div', { class: 'set-list' });
            const shown = items.slice(0, 600);
            shown.forEach(it => box.appendChild(h('div', { class: 'set-item', onclick: e => { $$('.set-item', box).forEach(x => x.classList.remove('active')); e.currentTarget.classList.add('active'); onPick(it); } }, h('span', { html: fmt(it) }), h('span', { class: 'tags' }, tags(it)))));
            if (items.length > shown.length) box.appendChild(h('div', { class: 'muted', text: `… ${items.length - shown.length} más (use los filtros).` }));
            if (!items.length) box.appendChild(h('div', { class: 'muted', text: 'Ningún conjunto cumple el filtro.' }));
            return box;
        };
        const filtered = (items, filter, holder, build) => { holder.innerHTML = ''; holder.appendChild(build(items.filter(filter))); };
        const filterBar = (opts, cb) => { const bar = h('div', { class: 'filter-bar' }, h('span', { class: 'input-label', text: 'Filtro:' })); opts.forEach(([t, f], i) => bar.appendChild(h('button', { class: 'btn-small' + (i === 0 ? ' active' : ''), text: t, onclick: e => { $$('.btn-small', bar).forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); cb(f); } }))); return bar; };
        const tabs = [
            { id: 'iv', label: 'Independientes de vértices', render: c => {
                const pick = s => { const ov = { nodeCls: {} }; U.maskToIdx(s.m, V.n).forEach(i => ov.nodeCls[V.ids[i]] = 'c-perm'); ed.setOverlay(ov); Log.add(`Independiente ${lbl(s.m)}${s.maximum ? ' (máximo)' : s.maximal ? ' (maximal)' : ''}`, 'info'); };
                const holder = h('div');
                const build = items => listBox(items.sort((a, b) => b.size - a.size), s => lbl(s.m), s => [s.maximum ? tag('máximo', 'ok') : null, s.maximal ? tag('maximal', 'blue') : null, tag('|I|=' + s.size, '')], pick);
                c.append(UI.kv([['Número de independencia α(G)', `<b>${V.alpha}</b>`], ['Conjuntos independientes (no vacíos)', V.indep.length], ['Maximales', V.indep.filter(s => s.maximal).length], ['Máximos', V.indep.filter(s => s.maximum).length]]),
                    filterBar([['Todos', () => true], ['Maximales', s => s.maximal], ['Máximos', s => s.maximum]], f => filtered(V.indep, f, holder, build)), holder);
                filtered(V.indep, () => true, holder, build);
            } },
            { id: 'ie', label: 'Independientes de aristas', render: c => {
                const pick = s => { const ov = { edgeCls: {}, nodeCls: {} }; s.s.forEach(id => { ov.edgeCls[id] = 'c-match'; const e = g.edge(id); ov.nodeCls[e.u] = 'c-sat'; ov.nodeCls[e.v] = 'c-sat'; }); ed.setOverlay(ov); };
                const holder = h('div');
                const build = items => listBox(items.sort((a, b) => b.size - a.size), s => GUI.edgeSet(g, s.s) + ' = ' + U.setStr(s.s.map(id => g.edgeStr(g.edge(id)))), s => [s.maximum ? tag('máximo', 'ok') : null, s.maximal ? tag('maximal', 'blue') : null], pick);
                c.append(UI.kv([["Número de independencia de aristas α′(G)", `<b>${Es.nu}</b>`], ['Conjuntos independientes de aristas', Es.sets.length + (Es.truncated ? '+' : '')], ['Maximales', Es.sets.filter(s => s.maximal).length], ['Máximos', Es.sets.filter(s => s.maximum).length]]),
                    filterBar([['Todos', () => true], ['Maximales', s => s.maximal], ['Máximos', s => s.maximum]], f => filtered(Es.sets, f, holder, build)), holder);
                filtered(Es.sets, () => true, holder, build);
            } },
            { id: 'dom', label: 'Conjuntos dominantes', render: c => {
                const detail = h('div');
                const pick = s => {
                    const ov = { nodeCls: {}, nodeAnn: {} }; const idx = U.maskToIdx(s.m, V.n);
                    V.ids.forEach(id => ov.nodeCls[id] = 'c-blue');
                    idx.forEach(i => { ov.nodeCls[V.ids[i]] = 'c-src'; });
                    ed.setOverlay(ov);
                    detail.innerHTML = '';
                    detail.appendChild(UI.card(`Dominación de ${lbl(s.m)}`, UI.table(['Elemento', 'Domina N[v] (él y sus vecinos)'], idx.map(i => [g.label(V.ids[i]), lbl(V.closed[i])]))));
                    Log.add(`Dominante ${lbl(s.m)}: ` + idx.map(i => `${g.label(V.ids[i])}→${lbl(V.closed[i])}`).join('; '), 'info');
                };
                const holder = h('div');
                const build = items => listBox(items.sort((a, b) => a.size - b.size), s => lbl(s.m), s => [s.minimum ? tag('mínimo', 'ok') : null, s.minimal ? tag('minimal', 'blue') : null, s.connected ? tag('conexo', 'peach') : null, s.total ? tag('total', 'peach') : null, s.independent ? tag('independiente', '') : null], pick);
                const gc = V.dom.filter(s => s.connected), gt = V.dom.filter(s => s.total), gi = V.dom.filter(s => s.independent);
                c.append(UI.kv([['Número de dominación γ(G)', `<b>${V.gamma}</b>`], ['Conjuntos dominantes', V.dom.length], ['Minimales', V.dom.filter(s => s.minimal).length], ['γ conexo / γ total / γ independiente', `${gc.length ? Math.min(...gc.map(s => s.size)) : '—'} / ${gt.length ? Math.min(...gt.map(s => s.size)) : '— (hay vértices aislados)'} / ${gi.length ? Math.min(...gi.map(s => s.size)) : '—'}`]]),
                    filterBar([['Todos', () => true], ['Mínimos', s => s.minimum], ['Minimales', s => s.minimal], ['Conexos', s => s.connected], ['Totales', s => s.total], ['Independientes', s => s.independent]], f => filtered(V.dom, f, holder, build)),
                    h('div', { class: 'split-2' }, holder, detail));
                filtered(V.dom, () => true, holder, build);
            } },
        ];
        ui.body.appendChild(UI.tabs(tabs, tab, id => { tab = id; ed.clearOverlay(); }));
        return V;
    }
    function run() {
        const g = ed.getGraph();
        const V = render(); if (!V) return;
        const frames = [];
        const maxI = V.indep.filter(s => s.maximum), minD = V.dom.filter(s => s.minimum);
        frames.push({ log: `Se examinan los 2ⁿ − 1 = ${(1 << V.n) - 1} subconjuntos de S.`, type: 'step' });
        const lbl = m => U.setStr(U.maskToIdx(m, V.n).map(i => g.label(V.ids[i])));
        maxI.slice(0, 15).forEach(s => frames.push({ draw: () => { const ov = { nodeCls: {} }; U.maskToIdx(s.m, V.n).forEach(i => ov.nodeCls[V.ids[i]] = 'c-perm'); ed.setOverlay(ov); }, log: `Independiente máximo: ${lbl(s.m)} (|I| = α = ${V.alpha})`, type: 'found' }));
        minD.slice(0, 15).forEach(s => frames.push({ draw: () => { const ov = { nodeCls: {} }; V.ids.forEach(id => ov.nodeCls[id] = 'c-blue'); U.maskToIdx(s.m, V.n).forEach(i => ov.nodeCls[V.ids[i]] = 'c-src'); ed.setOverlay(ov); }, log: `Dominante mínimo: ${lbl(s.m)} (|D| = γ = ${V.gamma})`, type: 'found' }));
        frames.push({ log: `α(G) = ${V.alpha}, γ(G) = ${V.gamma}. Se cumple γ ≤ α: ${V.gamma <= V.alpha ? '✔' : '✘'} (todo independiente maximal es dominante).`, type: 'found', status: `α(G) = <strong>${V.alpha}</strong> · γ(G) = <strong>${V.gamma}</strong>`, statusType: 'found' });
        Sim.load(frames, { base: () => ed.clearOverlay() });
    }
    return {
        run,
        mount({ controls, stage }) {
            controls.append(UI.btn('Resumen paso a paso', run, 'btn-primary'));
            const top = h('div'); stage.appendChild(top);
            ed = new GraphEditor(top, { preset: 'clase-basico', presets: ['clase-basico', 'c5', 'c6', 'petersen', 'arbol', 'k33', 'cubo', 'bipartito'], forceDirected: false, forceWeighted: false, onChange: render });
            ui.body = h('div', { class: 'stage-col' }); stage.appendChild(ui.body);
            stage.appendChild(h('div', { class: 'legend' }, h('span', null, h('b', { style: { borderColor: '#2E7D32', background: '#E8F5E9' } }), 'en el conjunto independiente'), h('span', null, h('b', { style: { borderColor: '#A84218', background: '#D96332' } }), 'en el dominante'), h('span', null, h('b', { style: { borderColor: '#1565C0', background: '#E3F2FD' } }), 'dominado')));
            render();
        },
        reset() { ed.clearOverlay(); Log.clear(); },
    };
})());

/* =====================================================================
 * 4.5  PAREAMIENTOS (MATCHING)
 * ===================================================================== */
const Matching = {
    /** Busca un camino M-aumentado (DFS exhaustivo sobre caminos alternados simples). */
    augmenting(g, M, explored) {
        const mate = {};
        M.forEach(id => { const e = g.edge(id); mate[e.u] = { v: e.v, e: id }; mate[e.v] = { v: e.u, e: id }; });
        const free = g.ids().filter(v => !mate[v]);
        for (const s of free) {
            const pathV = [s], pathE = [], inP = new Set([s]);
            const dfs = x => {
                for (const e of g.edges) {
                    if (e.u === e.v || M.includes(e.id)) continue;
                    let y = null; if (e.u === x) y = e.v; else if (e.v === x) y = e.u; if (y === null || inP.has(y)) continue;
                    if (!mate[y]) { pathV.push(y); pathE.push(e.id); return true; }
                    const z = mate[y].v; if (inP.has(z)) continue;
                    pathV.push(y, z); pathE.push(e.id, mate[y].e); inP.add(y); inP.add(z);
                    if (explored && explored.length < 6) explored.push({ v: pathV.slice(), e: pathE.slice() });
                    if (dfs(z)) return true;
                    pathV.splice(-2); pathE.splice(-2); inP.delete(y); inP.delete(z);
                }
                return false;
            };
            if (dfs(s)) return { verts: pathV, edges: pathE };
        }
        return null;
    },
    saturated(g, M) { const s = new Set(); M.forEach(id => { const e = g.edge(id); s.add(e.u); s.add(e.v); }); return s; },
    isMaximal(g, M) { const s = Matching.saturated(g, M); return !g.edges.some(e => e.u !== e.v && !M.includes(e.id) && !s.has(e.u) && !s.has(e.v)); },
};
App.register('g-matching', (() => {
    let ed, ui = {};
    const ovFor = (g, M, extra = {}) => { const sat = Matching.saturated(g, M); const ov = { edgeCls: {}, nodeCls: {} }; g.ids().forEach(v => ov.nodeCls[v] = sat.has(v) ? 'c-sat' : 'c-free'); M.forEach(id => ov.edgeCls[id] = 'c-match'); (extra.aug || []).forEach(id => ov.edgeCls[id] = 'c-aug'); return ov; };
    function validate(g) {
        ui.alerts.innerHTML = '';
        const s = GA.isSimple(g);
        if (!s.simple) {
            const ov = { edgeCls: {}, nodeCls: {} };
            s.loops.forEach(e => ov.edgeCls[e.id] = 'c-bad'); s.multi.forEach(([a, b]) => { ov.edgeCls[a.id] = 'c-bad'; ov.edgeCls[b.id] = 'c-bad'; });
            ed.setOverlay(ov);
            ui.alerts.appendChild(UI.alert('inconsistency', 'El grafo NO es simple: no se puede aplicar pareamiento', `Se encontraron ${s.loops.length} lazo(s) ${s.loops.map(e => e.name).join(', ')} y ${s.multi.length} arista(s) múltiple(s) ${s.multi.map(([a, b]) => a.name + '∥' + b.name).join(', ')}. Elimínelos para continuar.`));
            Status.set('<strong>Pareamiento rechazado:</strong> G debe ser simple.', 'error');
            return false;
        }
        if (g.directed) { ui.alerts.appendChild(UI.alert('warn', 'Grafo dirigido', 'Los pareamientos se calculan sobre el grafo no dirigido subyacente.')); }
        return true;
    }
    function classifyPanel(g, M, all) {
        const nu = Math.max(0, ...all.map(s => s.length));
        const sat = Matching.saturated(g, M);
        const maximal = Matching.isMaximal(g, M), maximum = M.length === nu, perfect = maximum && maximal && sat.size === g.n;
        let optimal = null;
        if (g.weighted) {
            const maxs = all.filter(s => s.length === nu);
            const wsum = s => U.sum(s.map(id => g.w(g.edge(id))));
            const best = ui.opt.value === 'max' ? Math.max(...maxs.map(wsum)) : Math.min(...maxs.map(wsum));
            optimal = { best, sets: maxs.filter(s => wsum(s) === best), mine: wsum(M) };
        }
        ui.cls.innerHTML = '';
        ui.cls.appendChild(UI.card('Clasificación del pareamiento M', UI.kv([
            ['M', GUI.edgeSet(g, M) + ' = ' + U.setStr(M.map(id => g.edgeStr(g.edge(id))))],
            ['Número de matching ν(G)', `<b>${nu}</b>`],
            ['Saturados / Libres', `${GUI.setLabels(g, Array.from(sat))} / ${GUI.setLabels(g, g.ids().filter(v => !sat.has(v)))}`],
            ['¿Maximal (inextensible)?', maximal ? 'Sí: no se puede agregar ninguna arista' : 'No'],
            ['¿Máximo?', maximum ? `Sí: |M| = ν = ${nu}` : `No: |M| = ${M.length} &lt; ${nu}`],
            ['¿Perfecto?', perfect ? 'Sí: máximo, maximal y satura todos los vértices' : `No${sat.size !== g.n ? ` (quedan ${g.n - sat.size} libres)` : ''}`],
            ['¿Óptimo?', optimal ? `${optimal.mine === optimal.best && maximum ? 'Sí' : 'No'} — peso ${ui.opt.value === 'max' ? 'máximo' : 'mínimo'} entre los máximos = ${U.fmt(optimal.best)} (M pesa ${U.fmt(optimal.mine)}): ${optimal.sets.map(s => GUI.edgeSet(g, s)).join(' ')}` : 'Requiere un grafo ponderado (marque “Ponderado”).'],
        ])));
    }
    function run() {
        const g = ed.getGraph();
        if (!validate(g)) return;
        const all = SetEnum.edgeSets(g).sets.map(s => s.s).concat([[]]);
        let M = [];
        if (ui.init.value === 'greedy') { const sat = new Set(); g.edges.forEach(e => { if (!sat.has(e.u) && !sat.has(e.v)) { M.push(e.id); sat.add(e.u); sat.add(e.v); } }); }
        const frames = [];
        const M0 = M.slice();
        frames.push({ draw: () => ed.setOverlay(ovFor(g, M0)), log: `Pareamiento inicial M = ${GUI.edgeSet(g, M0) || '∅'} (${ui.init.value === 'greedy' ? 'voraz' : 'vacío'}). Libres: ${GUI.setLabels(g, g.ids().filter(v => !Matching.saturated(g, M0).has(v)))}`, type: 'step' });
        let it = 0;
        for (;;) {
            const explored = [];
            const P = Matching.augmenting(g, M, explored);
            const Mc = M.slice();
            explored.slice(0, 3).forEach(x => frames.push({ draw: () => ed.setOverlay(ovFor(g, Mc, { aug: x.e })), log: `Camino M-alternado explorado: ${x.v.map(v => g.label(v)).join(' – ')} (alterna arista ∉ M / ∈ M).`, type: 'compare' }));
            if (!P) {
                frames.push({ draw: () => ed.setOverlay(ovFor(g, Mc)), log: 'No existe ningún camino M-aumentado ⇒ por el teorema de Berge, M es MÁXIMO.', type: 'found' });
                break;
            }
            it++;
            frames.push({ draw: () => ed.setOverlay(ovFor(g, Mc, { aug: P.edges })), log: `Iteración ${it}: camino M-AUMENTADO ${P.verts.map(v => g.label(v)).join(' – ')}: empieza y termina en vértices libres (${g.label(P.verts[0])}, ${g.label(P.verts[P.verts.length - 1])}).`, type: 'warn' });
            M = M.filter(id => !P.edges.includes(id)).concat(P.edges.filter(id => !M.includes(id)));
            const M2 = M.slice();
            frames.push({ draw: () => ed.setOverlay(ovFor(g, M2)), log: `Inversión M ← M ⊕ P: las aristas del camino que estaban en M salen y las demás entran. |M| = ${M2.length}.`, type: 'found' });
        }
        const Mf = M.slice();
        frames.push({ draw: () => { ed.setOverlay(ovFor(g, Mf)); classifyPanel(g, Mf, all); }, log: `Resultado: M = ${GUI.edgeSet(g, Mf)} con |M| = ${Mf.length}.`, type: 'found', status: `Pareamiento máximo: |M| = <strong>${Mf.length}</strong>${Mf.length * 2 === g.n ? ' (perfecto)' : ''}`, statusType: 'found' });
        Sim.load(frames, { base: () => { ed.clearOverlay(); ui.cls.innerHTML = ''; } });
    }
    function listAll() {
        const g = ed.getGraph();
        if (!validate(g)) return;
        const E = SetEnum.edgeSets(g), all = E.sets.map(s => s.s);
        ui.list.innerHTML = '';
        ui.list.appendChild(UI.card(`Todos los pareamientos (${E.sets.length}) — clic para clasificar`, h('div', { class: 'set-list' }, E.sets.sort((a, b) => b.size - a.size).slice(0, 500).map(s => {
            const sat = Matching.saturated(g, s.s);
            return h('div', { class: 'set-item', onclick: ev => { $$('.set-item', ev.currentTarget.parentNode).forEach(x => x.classList.remove('active')); ev.currentTarget.classList.add('active'); ed.setOverlay(ovFor(g, s.s)); classifyPanel(g, s.s, all); } },
                h('span', { text: GUI.edgeSet(g, s.s) }), h('span', { class: 'tags' }, s.maximum ? h('span', { class: 'pill ok', text: 'máximo' }) : null, s.maximal ? h('span', { class: 'pill blue', text: 'maximal' }) : null, sat.size === g.n ? h('span', { class: 'pill peach', text: 'perfecto' }) : null));
        }))));
    }
    return {
        run,
        mount({ controls, stage }) {
            ui.init = UI.select([['empty', 'M inicial vacío'], ['greedy', 'M inicial voraz (maximal)']], 'greedy');
            ui.opt = UI.select([['max', 'Óptimo = peso máximo'], ['min', 'Óptimo = peso mínimo']], 'max');
            controls.append(UI.field('Inicio:', ui.init), ui.opt, UI.btn('Caminos M-aumentados', run, 'btn-primary'), UI.btn('Ver todos los pareamientos', listAll));
            const top = h('div'); stage.appendChild(top);
            ed = new GraphEditor(top, { preset: 'matching', presets: ['matching', 'bipartito', 'k33', 'petersen', 'c5', 'cubo', 'no-simple', 'mst-pequeno'], forceDirected: false, onChange: () => { ui.list.innerHTML = ''; ui.cls.innerHTML = ''; validate(ed.getGraph()); } });
            ui.alerts = h('div'); ui.cls = h('div'); ui.list = h('div');
            stage.append(ui.alerts, h('div', { class: 'legend' }, h('span', null, h('i', { style: { borderColor: '#6A1B9A' } }), 'arista de M'), h('span', null, h('i', { style: { borderColor: '#F9A825', borderTopStyle: 'dashed' } }), 'camino alternado / aumentado'), h('span', null, h('b', { style: { borderColor: '#6A1B9A', background: '#EDE7F6' } }), 'saturado'), h('span', null, h('b', { style: { borderColor: '#9E9E9E', borderStyle: 'dashed' } }), 'libre')), h('div', { class: 'split-2' }, ui.cls, ui.list));
            validate(ed.getGraph());
        },
        reset() { ed.clearOverlay(); Log.clear(); },
    };
})());

/* =====================================================================
 * 4.5  ENVOLVENTES (CUBRIMIENTOS) Y GALLAI
 * ===================================================================== */
App.register('g-envolventes', (() => {
    let ed, ui = {};
    function compute(g) {
        const V = SetEnum.vertexSets(g), Es = SetEnum.edgeSets(g);
        const n = V.n, full = (1 << n) - 1;
        const tau = n - V.alpha;
        const vcovers = V.indep.filter(s => s.maximum).map(s => full & ~s.m);
        const isolated = g.ids().filter(v => g.degree(v) === 0 || g.edges.every(e => (e.u !== v && e.v !== v) || e.u === e.v));
        let rho = null, ecovers = [];
        if (!isolated.length) {
            rho = n - Es.nu;
            const E = g.edges.filter(e => e.u !== e.v).map(e => e.id);
            const combos = E.length <= 22 ? U.combinations(E, rho) : [];
            ecovers = combos.filter(c => { const s = new Set(); c.forEach(id => { const e = g.edge(id); s.add(e.u); s.add(e.v); }); return s.size === n; }).slice(0, 400);
        }
        return { V, Es, tau, vcovers, rho, ecovers, isolated, n };
    }
    function render() {
        const g = ed.getGraph();
        ui.body.innerHTML = '';
        if (!g.n) return;
        if (M4.tooBig(g, ui.body)) return;
        const R = compute(g);
        const lbl = m => U.setStr(U.maskToIdx(m, R.n).map(i => g.label(R.V.ids[i])));
        ui.body.append(
            UI.card('Teoremas de Gallai', UI.table(['Relación', 'Valores', '✔'], [
                ['α(G) + τ(G) = |S|', `${R.V.alpha} + ${R.tau} = ${R.n}`, R.V.alpha + R.tau === R.n ? '<span class="pill ok">✔</span>' : '<span class="pill bad">✘</span>'],
                ["α′(G) + ρ(G) = |S|", R.rho === null ? `no aplica: hay vértices aislados ${GUI.setLabels(g, R.isolated)} (no existe cubrimiento de aristas)` : `${R.Es.nu} + ${R.rho} = ${R.n}`, R.rho === null ? '—' : (R.Es.nu + R.rho === R.n ? '<span class="pill ok">✔</span>' : '<span class="pill bad">✘</span>')],
            ].map(r => [{ html: r[0], cls: 'left' }, { html: r[1], cls: 'left' }, r[2]]))),
            h('div', { class: 'split-2' },
                UI.card(`Cubrimientos mínimos de VÉRTICES · τ(G) = ${R.tau}`, h('div', { class: 'hint', text: 'Conjunto de vértices que toca todas las aristas (complemento de un independiente máximo).' }),
                    UI.chips(R.vcovers.map(lbl), i => { const ov = { nodeCls: {}, edgeCls: {} }; U.maskToIdx(R.vcovers[i], R.n).forEach(k => ov.nodeCls[R.V.ids[k]] = 'c-src'); g.edges.forEach(e => ov.edgeCls[e.id] = 'c-consider'); ed.setOverlay(ov); Log.add(`Cubrimiento de vértices ${lbl(R.vcovers[i])}: cada arista tiene un extremo en él.`, 'info'); })),
                UI.card(`Cubrimientos mínimos de ARISTAS · ρ(G) = ${R.rho === null ? '—' : R.rho}`, h('div', { class: 'hint', text: 'Conjunto de aristas que toca todos los vértices.' }),
                    R.rho === null ? UI.alert('warn', 'No existe', 'Un vértice aislado no puede ser cubierto por ninguna arista.') :
                        UI.chips(R.ecovers.map(c => GUI.edgeSet(g, c)), i => { const ov = { nodeCls: {}, edgeCls: {} }; R.ecovers[i].forEach(id => ov.edgeCls[id] = 'c-match'); g.ids().forEach(v => ov.nodeCls[v] = 'c-sat'); ed.setOverlay(ov); Log.add(`Cubrimiento de aristas ${GUI.edgeSet(g, R.ecovers[i])}.`, 'info'); }))));
        return R;
    }
    function run() {
        const g = ed.getGraph(), R = render(); if (!R) return;
        const frames = [];
        const lbl = m => U.setStr(U.maskToIdx(m, R.n).map(i => g.label(R.V.ids[i])));
        const I = R.V.indep.find(s => s.maximum);
        frames.push({ draw: () => { const ov = { nodeCls: {} }; U.maskToIdx(I.m, R.n).forEach(i => ov.nodeCls[R.V.ids[i]] = 'c-perm'); ed.setOverlay(ov); }, log: `Independiente máximo I = ${lbl(I.m)} ⇒ α = ${R.V.alpha}.`, type: 'compare' });
        const C = R.vcovers[0];
        frames.push({ draw: () => { const ov = { nodeCls: {} }; U.maskToIdx(C, R.n).forEach(i => ov.nodeCls[R.V.ids[i]] = 'c-src'); ed.setOverlay(ov); }, log: `Su complemento S − I = ${lbl(C)} es un cubrimiento mínimo de vértices ⇒ τ = ${R.tau}. α + τ = ${R.V.alpha + R.tau} = |S|.`, type: 'found' });
        if (R.rho !== null) {
            const Mx = R.Es.sets.find(s => s.maximum);
            frames.push({ draw: () => { const ov = { edgeCls: {} }; (Mx ? Mx.s : []).forEach(id => ov.edgeCls[id] = 'c-match'); ed.setOverlay(ov); }, log: `Pareamiento máximo ${Mx ? GUI.edgeSet(g, Mx.s) : '∅'} ⇒ α′ = ${R.Es.nu}.`, type: 'compare' });
            const Ec = R.ecovers[0];
            if (Ec) frames.push({ draw: () => { const ov = { edgeCls: {} }; Ec.forEach(id => ov.edgeCls[id] = 'c-match'); ed.setOverlay(ov); }, log: `Agregando una arista por cada vértice libre se obtiene un cubrimiento mínimo de aristas ${GUI.edgeSet(g, Ec)} ⇒ ρ = ${R.rho}. α′ + ρ = ${R.Es.nu + R.rho} = |S|.`, type: 'found' });
        } else frames.push({ log: 'Hay vértices aislados: no existe cubrimiento de aristas.', type: 'warn' });
        frames.push({ log: 'Teoremas de Gallai verificados.', type: 'found', status: `τ(G) = <strong>${R.tau}</strong> · ρ(G) = <strong>${R.rho === null ? '—' : R.rho}</strong>`, statusType: 'found' });
        Sim.load(frames, { base: () => ed.clearOverlay() });
    }
    return {
        run,
        mount({ controls, stage }) {
            controls.append(UI.btn('Calcular paso a paso', run, 'btn-primary'));
            const top = h('div'); stage.appendChild(top);
            ed = new GraphEditor(top, { preset: 'matching', presets: ['matching', 'clase-basico', 'petersen', 'k33', 'c5', 'arbol', 'cubo'], forceDirected: false, forceWeighted: false, onChange: render });
            ui.body = h('div', { class: 'stage-col' }); stage.appendChild(ui.body);
            render();
        },
        reset() { ed.clearOverlay(); Log.clear(); },
    };
})());

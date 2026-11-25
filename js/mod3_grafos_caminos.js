/* =====================================================================
 * mod3_grafos_caminos.js — MÓDULO 3
 *   3.1 Inspector de G = (S, A), recorridos, Euler y Hamilton
 *   3.2 Operaciones y productos entre grafos
 *   3.3 Distancia, excentricidad, centro, radio, diámetro, mediana (Floyd)
 *   3.4 Árboles de expansión (Prim, Kruskal, máxima), T y T̄, distancia y árbol central
 *   3.5 Función ordinal + Bellman, Dijkstra [d, n], Floyd-Warshall
 * ===================================================================== */
'use strict';

/* ---------- utilidades de interfaz para grafos ---------- */
const GUI = {
    /** Select de vértices por etiqueta. */
    vertexSelect(g, value, extra) {
        const opts = (extra || []).concat(g.nodes.map(n => [n.label, n.label]));
        return UI.select(opts, value !== undefined ? value : (g.nodes[0] ? g.nodes[0].label : ''));
    },
    refresh(sel, g, extra) {
        const cur = sel.value;
        sel.innerHTML = '';
        (extra || []).concat(g.nodes.map(n => [n.label, n.label])).forEach(([v, t]) => sel.appendChild(h('option', { value: v, selected: v === cur }, t)));
        if (![...sel.options].some(o => o.value === cur) && sel.options.length) sel.value = sel.options[0].value;
    },
    setLabels: (g, ids) => U.setStr(ids.map(i => g.label(i))),
    edgeSet: (g, ids) => U.setStr(ids.map(i => g.edge(i).name)),
    /** Overlay que resalta un conjunto de aristas y sus vértices. */
    edgesOverlay(ids, cls = 'c-hl', dimOthers = false, g = null) {
        const ov = { edgeCls: {}, nodeCls: {} };
        ids.forEach(id => ov.edgeCls[id] = cls);
        if (dimOthers && g) g.edges.forEach(e => { if (!ids.includes(e.id)) ov.edgeCls[e.id] = 'c-dim'; });
        return ov;
    },
    /** Todas las rutas desde dst hacia src siguiendo conjuntos de predecesores (reconstrucción en reversa). */
    allRoutes(predMap, src, dst, limit = 50) {
        const routes = [];
        const rec = (v, acc) => {
            if (routes.length >= limit) return;
            if (v === src) { routes.push(acc.slice().reverse()); return; }
            (predMap[v] || []).forEach(p => { acc.push(p); rec(p.from, acc); acc.pop(); });
        };
        rec(dst, []);
        return routes; // cada ruta: lista de {from, e} en orden origen→destino
    },
};

/* =====================================================================
 * 3.1  INSPECTOR DE G = (S, A)
 * ===================================================================== */
App.register('g-fundamentos', (() => {
    let ed, ed2, ui = {};
    function minimalSeparators(g) {
        const { ids } = GA.nbMasks(g);
        const n = ids.length;
        if (n > 14) return { list: [], truncated: true };
        const base = GA.components(g).length;
        const seps = [];
        for (let mask = 1; mask < (1 << n); mask++) {
            const X = U.maskToIdx(mask, n).map(i => ids[i]);
            if (X.length > n - 2) continue;
            if (seps.some(s => s.mask && (s.mask & mask) === s.mask)) continue;
            const rest = ids.filter(i => !X.includes(i));
            if (GA.components(g, { nodes: rest }).length > base) seps.push({ mask, X });
        }
        return { list: seps.map(s => s.X), truncated: false };
    }
    function analyze() {
        const g = ed.getGraph();
        ui.global.innerHTML = '';
        if (!g.n) { ui.global.appendChild(UI.alert('info', 'Grafo vacío', 'Agregue vértices con la herramienta “＋ Vértice”.')); return; }
        const degs = g.ids().map(i => g.degree(i));
        const iso = g.ids().filter(i => g.degree(i) === 0);
        const term = g.ids().filter(i => g.degree(i) === 1);
        const inacc = g.directed ? g.ids().filter(i => g.inDeg(i) === 0) : [];
        const { ap, bridges } = GA.articulationAndBridges(g);
        const comps = GA.components(g);
        const simple = GA.isSimple(g);
        const seps = minimalSeparators(g);
        ui.global.append(
            UI.card('Propiedades globales de G = (S, A)', UI.kv([
                ['S', GUI.setLabels(g, g.ids())],
                ['A', U.setStr(g.edges.map(e => `${e.name}=${g.label(e.u)}${g.directed ? '→' : ''}${g.label(e.v)}`))],
                ['|S|, |A|', `${g.n}, ${g.m}`],
                ['Σ grados = 2|A|', `${U.sum(degs)} = 2·${g.m} ${U.sum(degs) === 2 * g.m ? '✔' : '✘'}`],
                g.directed ? ['Σ g⁺ = Σ g⁻ = |A|', `${U.sum(g.ids().map(i => g.outDeg(i)))} = ${U.sum(g.ids().map(i => g.inDeg(i)))} = ${g.m}`] : ['Δ(G), δ(G)', `${GA.maxDegree(g)}, ${GA.minDegree(g)}`],
                ['Componentes conexas', `${comps.length}: ${comps.map(c => GUI.setLabels(g, c)).join(' ')}`],
                ['¿Conexo?', comps.length === 1 ? 'Sí' : 'No'],
                ['¿Simple?', simple.simple ? 'Sí' : `No (${simple.loops.length} lazo(s), ${simple.multi.length} arista(s) múltiple(s))`],
                ['Vértices aislados (grado 0)', iso.length ? GUI.setLabels(g, iso) : '∅'],
                ['Vértices terminales (grado 1)', term.length ? GUI.setLabels(g, term) : '∅'],
                g.directed ? ['Inaccesibles (g⁻ = 0)', inacc.length ? GUI.setLabels(g, inacc) : '∅'] : ['¿Árbol?', GA.isTree(g) ? 'Sí' : 'No'],
                ['Vértices de articulación (corte)', ap.length ? GUI.setLabels(g, ap) : '∅ (no separable)'],
                ['Aristas puente', bridges.length ? GUI.edgeSet(g, bridges) : '∅'],
                ['Conjuntos separadores minimales', seps.truncated ? 'n &gt; 14: no se enumeran' : (seps.list.length ? seps.list.map(s => GUI.setLabels(g, s)).join(' ') : '∅')],
            ])),
            h('div', { class: 'filter-bar' }, h('span', { class: 'input-label', text: 'Resaltar:' }),
                UI.btn('Articulaciones', () => { const ov = { nodeCls: {} }; ap.forEach(i => ov.nodeCls[i] = 'c-bad'); ed.setOverlay(ov); }, 'btn-small'),
                UI.btn('Puentes', () => ed.setOverlay(GUI.edgesOverlay(bridges, 'c-bad')), 'btn-small'),
                UI.btn('Aislados/terminales', () => { const ov = { nodeCls: {} }; iso.forEach(i => ov.nodeCls[i] = 'c-bad'); term.forEach(i => ov.nodeCls[i] = 'c-blue'); ed.setOverlay(ov); }, 'btn-small'),
                g.directed ? UI.btn('Inaccesibles', () => { const ov = { nodeCls: {} }; inacc.forEach(i => ov.nodeCls[i] = 'c-bad'); ed.setOverlay(ov); }, 'btn-small') : null,
                UI.btn('Grados', () => { const ov = { nodeAnn: {} }; g.ids().forEach(i => ov.nodeAnn[i] = [{ text: g.directed ? `g⁺${g.outDeg(i)} g⁻${g.inDeg(i)}` : `g=${g.degree(i)}`, cls: 'ann-peach' }]); ed.setOverlay(ov); }, 'btn-small'),
                UI.btn('Limpiar', () => ed.clearOverlay(), 'btn-small')),
            seps.list.length ? UI.card('Separadores (clic para resaltar)', UI.chips(seps.list.map(s => GUI.setLabels(g, s)), i => { const ov = { nodeCls: {} }; seps.list[i].forEach(x => ov.nodeCls[x] = 'c-bad'); ed.setOverlay(ov); })) : null);
        GUI.refresh(ui.start, g);
        showSel(null);
    }
    function showSel(sel) {
        const g = ed.getGraph();
        ui.sel.innerHTML = '';
        if (!sel) { ui.sel.appendChild(h('div', { class: 'muted', text: 'Haga clic en un vértice o arista (modo “Mover/Sel.”) para ver su incidencia y adyacencias.' })); return; }
        if (sel.type === 'node') {
            const id = sel.id, inc = g.incident(id);
            const reach = GA.reach(g, id);
            const notReach = g.ids().filter(i => !reach.has(i));
            ui.sel.appendChild(UI.card(`Vértice ${g.label(id)}`, UI.kv([
                [g.directed ? 'Grado (valencia) g⁺ / g⁻' : 'Grado (valencia)', g.directed ? `g⁺ = ${g.outDeg(id)} (salida), g⁻ = ${g.inDeg(id)} (entrada), total ${g.degree(id)}` : g.degree(id)],
                ['Aristas incidentes', inc.length ? U.setStr(inc.map(e => e.name)) : '∅'],
                ['Vértices adyacentes', g.neighbors(id).length ? GUI.setLabels(g, g.neighbors(id)) : '∅ (aislado)'],
                g.directed ? ['Sucesores / Predecesores', `${GUI.setLabels(g, g.adj(id).map(a => a.to))} / ${GUI.setLabels(g, g.preds(id).map(p => p.from))}`] : null,
                ['No alcanzables desde él', notReach.length ? GUI.setLabels(g, notReach) : '∅'],
            ].filter(Boolean))));
            const ov = { nodeCls: { [id]: 'c-current' }, edgeCls: {} };
            inc.forEach(e => ov.edgeCls[e.id] = 'c-hl'); g.neighbors(id).forEach(v => ov.nodeCls[v] = 'c-hl'); notReach.forEach(v => ov.nodeCls[v] = 'c-dim');
            ed.overlay = ov; ed.render();
        } else {
            const e = g.edge(sel.id);
            const adjE = g.edges.filter(x => x.id !== e.id && (x.u === e.u || x.v === e.u || x.u === e.v || x.v === e.v));
            const { bridges } = GA.articulationAndBridges(g);
            ui.sel.appendChild(UI.card(`Arista ${e.name}`, UI.kv([
                ['Incide en', `${g.label(e.u)} y ${g.label(e.v)}${e.u === e.v ? ' (lazo)' : ''}`],
                g.directed ? ['Dirección', `sale de ${g.label(e.u)}, entra a ${g.label(e.v)}`] : null,
                ['Peso', g.weighted ? e.w : '1 (implícito)'],
                ['Aristas adyacentes', adjE.length ? U.setStr(adjE.map(x => x.name)) : '∅'],
                ['¿Puente?', bridges.includes(e.id) ? 'Sí: su eliminación desconecta' : 'No'],
            ].filter(Boolean))));
            const ov = { edgeCls: { [e.id]: 'c-bad' } };
            adjE.forEach(x => ov.edgeCls[x.id] = 'c-hl');
            ed.overlay = ov; ed.render();
        }
    }
    function run() {
        const g = ed.getGraph(), s = g.idOf(ui.start.value);
        if (s === undefined) return Status.set('Seleccione un vértice inicial.', 'error');
        const kind = ui.trav.value, frames = [], order = [], seen = new Set([s]), treeE = [];
        frames.push({ draw: () => ed.setOverlay({ nodeCls: { [s]: 'c-src' } }), log: `Recorrido ${kind === 'bfs' ? 'en ANCHURA (BFS, cola)' : 'en PROFUNDIDAD (DFS, pila)'} desde ${g.label(s)}.`, type: 'step' });
        const snap = cur => { const v = order.slice(), t = treeE.slice(); return () => { const ov = { nodeCls: {}, edgeCls: {}, nodeAnn: {} }; v.forEach((x, i) => { ov.nodeCls[x] = 'c-perm'; ov.nodeAnn[x] = [{ text: '#' + (i + 1), cls: 'ann-green' }]; }); ov.nodeCls[cur] = 'c-current'; t.forEach(e => ov.edgeCls[e] = 'c-tree'); ed.setOverlay(ov); }; };
        if (kind === 'bfs') {
            const q = [s];
            while (q.length) {
                const x = q.shift(); order.push(x);
                const nb = [];
                g.adj(x).forEach(({ to, e }) => { if (!seen.has(to)) { seen.add(to); q.push(to); treeE.push(e.id); nb.push(to); } });
                frames.push({ draw: snap(x), log: `Visitar ${g.label(x)} → encola ${nb.length ? GUI.setLabels(g, nb) : '∅'} · Cola = [${q.map(i => g.label(i)).join(', ')}]`, type: 'compare' });
            }
        } else {
            const visit = (x, pe) => {
                seen.add(x); order.push(x); if (pe) treeE.push(pe);
                frames.push({ draw: snap(x), log: `Visitar ${g.label(x)}${pe ? ' (por ' + g.edge(pe).name + ')' : ''}.`, type: 'compare' });
                g.adj(x).forEach(({ to, e }) => { if (!seen.has(to)) visit(to, e.id); });
            };
            visit(s, null);
        }
        const unreached = g.ids().filter(i => !seen.has(i));
        frames.push({ draw: snap(order[order.length - 1]), log: `Orden de visita: ${order.map(i => g.label(i)).join(', ')}.${unreached.length ? ' No alcanzados: ' + GUI.setLabels(g, unreached) : ''}`, type: 'found', status: `Recorrido completo: ${order.length} de ${g.n} vértices visitados.`, statusType: 'found' });
        Sim.load(frames, { base: () => ed.clearOverlay() });
    }
    function checkIso() {
        const r = GA.isomorphism(ed.getGraph(), ed2.getGraph());
        ui.iso.innerHTML = '';
        if (r.iso) {
            const g1 = ed.getGraph(), g2 = ed2.getGraph();
            ui.iso.appendChild(UI.alert('ok', 'G₁ ≅ G₂: son isomorfos', 'Biyección que conserva adyacencias: ' + Object.entries(r.map).map(([a, b]) => `${g1.label(+a)} ↦ ${g2.label(b)}`).join(', ')));
            const ov1 = { nodeFill: {} }, ov2 = { nodeFill: {} };
            Object.entries(r.map).forEach(([a, b], i) => { ov1.nodeFill[+a] = PALETTE[i % PALETTE.length]; ov2.nodeFill[b] = PALETTE[i % PALETTE.length]; });
            ed.setOverlay(ov1); ed2.setOverlay(ov2);
        } else ui.iso.appendChild(UI.alert('error', 'No son isomorfos', r.reason));
        Log.add('Isomorfismo: ' + (r.iso ? 'SÍ' : 'NO — ' + r.reason), r.iso ? 'found' : 'notfound');
    }
    return {
        run,
        mount({ controls, stage }) {
            ui.trav = UI.select([['bfs', 'BFS (anchura)'], ['dfs', 'DFS (profundidad)']], 'bfs');
            ui.start = UI.select([], '');
            controls.append(UI.field('Recorrido:', ui.trav), UI.field('Desde:', ui.start), UI.btn('Recorrer', run, 'btn-primary'));
            const top = h('div'); stage.appendChild(top);
            ed = new GraphEditor(top, { title: 'G = (S, A)', preset: 'articulacion', presets: ['articulacion', 'clase-basico', 'dirigido', 'arbol', 'k4', 'petersen', 'no-simple'], onChange: analyze, onSelect: showSel });
            ui.sel = h('div'); ui.global = h('div', { class: 'stage-col' });
            stage.append(h('div', { class: 'split-2' }, ui.global, ui.sel));
            const isoBox = h('div', { class: 'card' }, h('div', { class: 'card-title', text: 'Isomorfismo: compare G₁ (arriba) con G₂' }));
            stage.appendChild(isoBox);
            ed2 = new GraphEditor(isoBox, { title: 'G₂ = (S₂, A₂)', preset: 'c6', presets: ['c6', 'k33', 'cubo', 'petersen', 'k4', 'articulacion'], height: 300 });
            ui.iso = h('div');
            isoBox.append(h('div', { class: 'filter-bar' }, UI.btn('Verificar G₁ ≅ G₂', checkIso, 'btn-primary'), UI.btn('Ejemplo isomorfo (K₃,₃ vs C₆+diag.)', () => {
                ed.setGraph(GraphPresets.get('k33'), true);
                ed2.setGraph(Graph.from({ nodes: [['1'], ['2'], ['3'], ['4'], ['5'], ['6']].map((n, i) => [n[0], 400 + 130 * Math.cos(-Math.PI / 2 + i * Math.PI / 3), 150 + 130 * Math.sin(-Math.PI / 2 + i * Math.PI / 3)]), edges: [['1', '2'], ['2', '3'], ['3', '4'], ['4', '5'], ['5', '6'], ['6', '1'], ['1', '4'], ['2', '5'], ['3', '6']] }));
                checkIso();
            })), ui.iso);
            analyze();
        },
        reset() { ed.clearOverlay(); Log.clear(); },
    };
})());

/* =====================================================================
 * 3.1  EULER Y HAMILTON
 * ===================================================================== */
App.register('g-euler', (() => {
    let ed, ui = {};
    const circled = i => (i <= 20 ? String.fromCharCode(0x2460 + i - 1) : '(' + i + ')');
    function eulerCheck(g) {
        const active = g.ids().filter(i => g.degree(i) > 0);
        const conn = active.length === 0 || GA.components(g, { nodes: active }).length === 1;
        if (!g.directed) {
            const odd = g.ids().filter(i => g.degree(i) % 2 === 1);
            return { conn, odd, type: !conn ? null : odd.length === 0 ? 'circuito' : odd.length === 2 ? 'camino' : null, start: odd.length === 2 ? odd[0] : (active[0] !== undefined ? active[0] : g.ids()[0]) };
        }
        const plus = g.ids().filter(i => g.outDeg(i) - g.inDeg(i) === 1), minus = g.ids().filter(i => g.inDeg(i) - g.outDeg(i) === 1);
        const bad = g.ids().filter(i => Math.abs(g.outDeg(i) - g.inDeg(i)) > 1);
        const type = !conn || bad.length ? null : (plus.length === 0 && minus.length === 0) ? 'circuito' : (plus.length === 1 && minus.length === 1) ? 'camino' : null;
        return { conn, plus, minus, bad, type, start: plus.length === 1 ? plus[0] : (active[0] !== undefined ? active[0] : g.ids()[0]) };
    }
    function runEuler(g, frames) {
        const c = eulerCheck(g);
        if (!g.directed) frames.push({ log: `Grados: ${g.nodes.map(n => `${n.label}:${g.degree(n.id)}`).join(', ')}. Impares: ${c.odd.length ? GUI.setLabels(g, c.odd) : '∅'}. ${c.conn ? 'Conexo (vértices no aislados)' : 'NO conexo'}.`, type: 'step' });
        else frames.push({ log: `g⁺/g⁻: ${g.nodes.map(n => `${n.label}:${g.outDeg(n.id)}/${g.inDeg(n.id)}`).join(', ')}. ${c.conn ? 'Débilmente conexo' : 'NO conexo'}.`, type: 'step' });
        if (!c.type) {
            const why = !c.conn ? 'las aristas no están en una sola componente conexa' : g.directed ? 'no se cumple g⁺ = g⁻ (salvo un origen con +1 y un destino con −1)' : `hay ${c.odd.length} vértices de grado impar (se requieren 0 ó 2)`;
            const ov = { nodeCls: {} }; (c.odd || c.bad || []).forEach(i => ov.nodeCls[i] = 'c-bad');
            frames.push({ draw: () => ed.setOverlay(ov), log: `NO existe circuito ni camino de Euler: ${why}.`, type: 'notfound', status: `<strong>No euleriano:</strong> ${why}.`, statusType: 'notfound' });
            return;
        }
        frames.push({ log: `Existe ${c.type.toUpperCase()} de Euler. Se traza con ${g.directed ? 'Hierholzer' : 'Fleury (no cruzar un puente salvo que sea la única opción)'} desde ${g.label(c.start)}.`, type: 'found' });
        const used = [], seq = [c.start];
        const snap = cur => { const u = used.slice(); return () => { const ov = { edgeCls: {}, edgeText: {}, nodeCls: { [cur]: 'c-current', [c.start]: 'c-src' } }; u.forEach((id, i) => { ov.edgeCls[id] = 'c-path'; ov.edgeText[id] = circled(i + 1); }); ed.setOverlay(ov); }; };
        if (!g.directed) {
            const rem = new Set(g.edges.map(e => e.id));
            let u = c.start;
            const reachCount = (start, set) => { const seen = new Set([start]), st = [start]; while (st.length) { const x = st.pop(); g.edges.forEach(e => { if (!set.has(e.id)) return; let y = null; if (e.u === x) y = e.v; else if (e.v === x) y = e.u; if (y !== null && !seen.has(y)) { seen.add(y); st.push(y); } }); } return seen.size; };
            while (rem.size) {
                const cand = g.edges.filter(e => rem.has(e.id) && (e.u === u || e.v === u));
                let pick = cand[0], note = cand.length === 1 ? 'única arista disponible' : 'todas son puente: se toma la primera';
                if (cand.length > 1) {
                    const avoided = [];
                    for (const e of cand) {
                        const before = reachCount(u, rem); rem.delete(e.id);
                        const after = reachCount(g.other(e, u), rem); rem.add(e.id);
                        if (e.u === e.v || after === before) { pick = e; note = (avoided.length ? avoided.join(', ') + (avoided.length > 1 ? ' son puentes → se evitan; ' : ' es puente → se evita; ') : '') + `${e.name} no es puente en el grafo restante`; break; }
                        avoided.push(e.name);
                    }
                }
                rem.delete(pick.id); used.push(pick.id);
                u = g.other(pick, u); seq.push(u);
                frames.push({ draw: snap(u), log: `Paso ${used.length}: ${pick.name} → ${g.label(u)} (${note}).`, type: 'compare' });
            }
        } else {
            const rem = new Set(g.edges.map(e => e.id));
            const stack = [{ v: c.start, e: null }], circ = [];
            while (stack.length) {
                const top = stack[stack.length - 1];
                const e = g.edges.find(x => rem.has(x.id) && x.u === top.v);
                if (e) { rem.delete(e.id); stack.push({ v: e.v, e: e.id }); }
                else { circ.push(stack.pop()); }
            }
            circ.reverse();
            circ.forEach((s, i) => { if (!s.e) return; used.push(s.e); seq.push(s.v); frames.push({ draw: snap(s.v), log: `Paso ${used.length}: ${g.edge(s.e).name} → ${g.label(s.v)}.`, type: 'compare' }); });
        }
        frames.push({ draw: snap(seq[seq.length - 1]), log: `${c.type === 'circuito' ? 'Circuito' : 'Camino'} de Euler: ${seq.map(i => g.label(i)).join(' → ')}`, type: 'found', status: `<strong>${c.type === 'circuito' ? 'Circuito' : 'Camino'} de Euler</strong> con ${used.length} aristas: ${seq.map(i => g.label(i)).join(' → ')}`, statusType: 'found' });
    }
    function runHamilton(g, frames, circuit) {
        const ids = g.ids(), n = ids.length;
        if (!n) return;
        const adj = (a, b) => g.edges.some(e => (e.u === a && e.v === b) || (!g.directed && e.u === b && e.v === a));
        const edgeOf = (a, b) => g.edges.find(e => (e.u === a && e.v === b) || (!g.directed && e.u === b && e.v === a));
        const startSel = g.idOf(ui.start.value);
        const starts = circuit ? [startSel !== undefined ? startSel : ids[0]] : (ui.start.value === '*' ? ids : [startSel]);
        const sols = []; let steps = 0; const MAXF = 250;
        const snap = (path, cls) => { const p = path.slice(); return () => { const ov = { nodeCls: {}, edgeCls: {}, nodeAnn: {} }; p.forEach((v, i) => { ov.nodeCls[v] = i === p.length - 1 ? cls || 'c-current' : 'c-perm'; ov.nodeAnn[v] = [{ text: String(i + 1), cls: 'ann-green' }]; if (i) ov.edgeCls[edgeOf(p[i - 1], v).id] = 'c-path'; }); ed.setOverlay(ov); }; };
        frames.push({ log: `Búsqueda exhaustiva (backtracking) de ${circuit ? 'circuitos' : 'caminos'} hamiltonianos: cada vértice exactamente una vez.`, type: 'step' });
        const path = [], inP = new Set();
        const rec = () => {
            if (sols.length >= 30) return;
            const last = path[path.length - 1];
            if (path.length === n) {
                if (!circuit || adj(last, path[0])) {
                    const sol = path.slice(); if (circuit) sol.push(path[0]);
                    sols.push(sol);
                    const snSol = snap(path);
                    if (steps++ < MAXF) frames.push({ draw: () => { snSol(); if (circuit) { const ov = ed.overlay; ov.edgeCls[edgeOf(last, sol[0]).id] = 'c-path'; ed.render(); } }, log: `✔ Solución ${sols.length}: ${sol.map(i => g.label(i)).join(' → ')}`, type: 'found' });
                } else if (steps++ < MAXF) frames.push({ draw: snap(path, 'c-bad'), log: `Se visitaron todos pero ${g.label(last)} no es adyacente a ${g.label(path[0])}: no cierra → retroceder.`, type: 'discard' });
                return;
            }
            for (const v of ids) {
                if (inP.has(v) || !adj(last, v)) continue;
                path.push(v); inP.add(v);
                if (steps++ < MAXF) frames.push({ draw: snap(path), log: `Avanzar a ${g.label(v)}: [${path.map(i => g.label(i)).join(', ')}]`, type: 'compare' });
                rec();
                path.pop(); inP.delete(v);
                if (sols.length >= 30) return;
                if (steps++ < MAXF) frames.push({ draw: snap(path), log: `Retroceder desde ${g.label(v)}.`, type: 'discard' });
            }
        };
        starts.forEach(s => { if (s === undefined) return; path.length = 0; inP.clear(); path.push(s); inP.add(s); rec(); });
        if (steps > MAXF) frames.push({ log: `… (${steps - MAXF} pasos adicionales de backtracking no se muestran).`, type: 'info' });
        if (sols.length) {
            const first = sols[0];
            frames.push({ draw: () => { const ov = { nodeCls: {}, edgeCls: {} }; for (let i = 1; i < first.length; i++) ov.edgeCls[edgeOf(first[i - 1], first[i]).id] = 'c-path'; first.forEach(v => ov.nodeCls[v] = 'c-perm'); ed.setOverlay(ov); showSols(g, sols, edgeOf); }, log: `Se encontraron ${sols.length}${sols.length >= 30 ? '+' : ''} ${circuit ? 'circuito(s)' : 'camino(s)'} hamiltoniano(s).`, type: 'found', status: `<strong>Hamiltoniano:</strong> ${first.map(i => g.label(i)).join(' → ')}`, statusType: 'found' });
        } else frames.push({ draw: () => showSols(g, [], edgeOf), log: `No existe ${circuit ? 'circuito' : 'camino'} hamiltoniano.`, type: 'notfound', status: `<strong>No existe</strong> ${circuit ? 'circuito' : 'camino'} hamiltoniano.`, statusType: 'notfound' });
    }
    function showSols(g, sols, edgeOf) {
        ui.sols.innerHTML = '';
        if (!sols.length) return;
        ui.sols.appendChild(UI.card('Soluciones (clic para resaltar)', UI.chips(sols.map(s => s.map(i => g.label(i)).join('→')), k => {
            const s = sols[k], ov = { nodeCls: {}, edgeCls: {} };
            for (let i = 1; i < s.length; i++) ov.edgeCls[edgeOf(s[i - 1], s[i]).id] = 'c-path';
            s.forEach(v => ov.nodeCls[v] = 'c-perm'); ed.setOverlay(ov);
        })));
    }
    function run() {
        const g = ed.getGraph(), frames = [];
        ui.sols.innerHTML = '';
        if (!g.n) return Status.set('Dibuje un grafo.', 'error');
        if (ui.kind.value === 'euler') runEuler(g, frames);
        else runHamilton(g, frames, ui.kind.value === 'ham-c');
        Sim.load(frames, { base: () => ed.clearOverlay() });
    }
    return {
        run,
        mount({ controls, stage }) {
            ui.kind = UI.select([['euler', 'Circuito / camino de Euler'], ['ham-c', 'Circuito hamiltoniano'], ['ham-p', 'Camino hamiltoniano']], 'euler');
            ui.start = UI.select([], '');
            controls.append(UI.field('Problema:', ui.kind), UI.field('Inicio (Hamilton):', ui.start), UI.btn('Ejecutar', run, 'btn-primary'));
            const top = h('div'); stage.appendChild(top);
            ed = new GraphEditor(top, { preset: 'euler', presets: ['euler', 'clase-basico', 'k4', 'k5', 'c5', 'petersen', 'cubo', 'dirigido', 'k33'], onChange: g => GUI.refresh(ui.start, g, [['*', 'Cualquiera']]) });
            GUI.refresh(ui.start, ed.getGraph(), [['*', 'Cualquiera']]);
            ui.sols = h('div'); stage.appendChild(ui.sols);
        },
        reset() { ed.clearOverlay(); Log.clear(); },
    };
})());

/* =====================================================================
 * 3.2  OPERACIONES ENTRE GRAFOS
 * ===================================================================== */
const GraphOps = {
    key(g, e) { const a = g.label(e.u), b = g.label(e.v); return g.directed ? `${a}>${b}` : [a, b].sort().join('|'); },
    pos(g1, g2, label) { const n = g1.nodes.find(x => x.label === label) || g2.nodes.find(x => x.label === label); return n ? [n.x, n.y] : [400, 190]; },
    /** Combina según el modo: 'union' | 'inter' | 'ring' | 'sum'. Devuelve {g, origin: {edgeId: '1'|'2'|'12'|'+'}} */
    combine(g1, g2, mode) {
        const r = new Graph({ directed: g1.directed, weighted: g1.weighted || g2.weighted });
        const L1 = g1.nodes.map(n => n.label), L2 = g2.nodes.map(n => n.label);
        const S = mode === 'inter' ? L1.filter(l => L2.includes(l)) : Array.from(new Set(L1.concat(L2)));
        S.forEach(l => { const [x, y] = GraphOps.pos(g1, g2, l); r.addNode(l, x, y); });
        const E1 = {}, E2 = {};
        g1.edges.forEach(e => { E1[GraphOps.key(g1, e)] = E1[GraphOps.key(g1, e)] || e; });
        g2.edges.forEach(e => { E2[GraphOps.key(g2, e)] = E2[GraphOps.key(g2, e)] || e; });
        const origin = {};
        const add = (g, e, o) => { const id = r.addEdge(r.idOf(g.label(e.u)), r.idOf(g.label(e.v)), e.w, e.name); origin[id] = o; };
        Object.keys(E1).forEach(k => { const inB = k in E2; if (mode === 'inter' && !inB) return; if (mode === 'ring' && inB) return; add(g1, E1[k], inB ? '12' : '1'); });
        if (mode !== 'inter') Object.keys(E2).forEach(k => { if (k in E1) return; add(g2, E2[k], '2'); });
        if (mode === 'sum') L1.forEach(a => L2.forEach(b => { const id = r.addEdge(r.idOf(a), r.idOf(b), 1, `s${a}${b}`); origin[id] = '+'; }));
        return { g: r, origin };
    },
    fuse(g, la, lb, removeEdgeId) {
        const r = g.clone();
        const a = r.idOf(la), b = r.idOf(lb);
        if (removeEdgeId !== undefined) r.removeEdge(removeEdgeId);
        const na = r.node(a), nb = r.node(b);
        const nid = r.addNode(la + lb, (na.x + nb.x) / 2, (na.y + nb.y) / 2);
        r.edges.forEach(e => { if (e.u === a || e.u === b) e.u = nid; if (e.v === a || e.v === b) e.v = nid; });
        r.nodes = r.nodes.filter(n => n.id !== a && n.id !== b);
        return r;
    },
};
App.register('g-operaciones', (() => {
    let e1, e2, er, ui = {};
    const ops = [['union', 'Unión G₁ ∪ G₂'], ['inter', 'Intersección G₁ ∩ G₂'], ['sum', 'Suma G₁ + G₂'], ['ring', 'Suma de anillo G₁ ⊕ G₂'], ['addv', 'Insertar vértice en G₁'], ['adde', 'Insertar arista en G₁'], ['delv', 'Eliminar vértice de G₁'], ['dele', 'Eliminar arista de G₁'], ['fuse', 'Fusión de vértices (G₁)'], ['contract', 'Contracción de arista (G₁)']];
    function updParams() {
        const op = ui.op.value;
        ui.pu.parentNode.style.display = ['addv', 'adde', 'delv', 'dele', 'fuse', 'contract'].includes(op) ? '' : 'none';
        ui.pv.parentNode.style.display = ['adde', 'dele', 'fuse', 'contract'].includes(op) ? '' : 'none';
    }
    function run() {
        const g1 = e1.getGraph(), g2 = e2.getGraph(), op = ui.op.value, frames = [];
        const u = ui.pu.value.trim(), v = ui.pv.value.trim();
        let R = null, origin = {};
        const name = ops.find(o => o[0] === op)[1];
        frames.push({ log: `Operación: ${name}. G₁: ${g1.setStr()} ; G₂: ${g2.setStr()}`, type: 'step' });
        const fail = msg => { frames.push({ draw: () => { er.setGraph(new Graph()); ui.res.innerHTML = ''; ui.res.appendChild(UI.alert('inconsistency', 'Operación no válida', msg)); }, log: msg, type: 'error', status: msg, statusType: 'error' }); Sim.load(frames, { base: () => er.setGraph(new Graph()) }); };
        if (['union', 'inter', 'ring', 'sum'].includes(op)) {
            if (g1.directed !== g2.directed) return fail('G₁ y G₂ deben ser ambos dirigidos o ambos no dirigidos.');
            if (op === 'sum') { const common = g1.nodes.map(n => n.label).filter(l => g2.idOf(l) !== undefined); if (common.length) return fail(`La suma G₁ + G₂ exige S₁ ∩ S₂ = ∅, pero comparten ${U.setStr(common)}. Renombre los vértices.`); }
            const c = GraphOps.combine(g1, g2, op); R = c.g; origin = c.origin;
            const desc = { union: 'S = S₁ ∪ S₂, A = A₁ ∪ A₂', inter: 'S = S₁ ∩ S₂, A = A₁ ∩ A₂', ring: 'S = S₁ ∪ S₂, A = (A₁ ∪ A₂) − (A₁ ∩ A₂)', sum: 'S = S₁ ∪ S₂, A = A₁ ∪ A₂ ∪ {(x, y) : x ∈ S₁, y ∈ S₂}' }[op];
            frames.push({ log: `Definición: ${desc}.`, type: 'info', formula: desc });
        } else {
            R = g1.clone();
            if (op === 'addv') { if (!u) return fail('Indique el nombre del vértice.'); if (R.idOf(u) !== undefined) return fail(`El vértice ${u} ya existe.`); R.addNode(u, 400, 40); frames.push({ log: `Se agrega el vértice aislado ${u}: S = S₁ ∪ {${u}}.`, type: 'info' }); }
            else if (op === 'adde') { if (R.idOf(u) === undefined || R.idOf(v) === undefined) return fail('Ambos extremos deben existir en G₁.'); R.addEdge(R.idOf(u), R.idOf(v), Number(ui.pw.value) || 1); frames.push({ log: `Se agrega la arista ${u}–${v}.`, type: 'info' }); }
            else if (op === 'delv') { const id = R.idOf(u); if (id === undefined) return fail(`${u} no existe en G₁.`); const inc = R.incident(id); R.removeNode(id); frames.push({ log: `G₁ − ${u}: se elimina el vértice y sus ${inc.length} aristas incidentes ${U.setStr(inc.map(e => e.name))}.`, type: 'info' }); }
            else if (op === 'dele') { const e = R.edges.find(x => (R.label(x.u) === u && R.label(x.v) === v) || (!R.directed && R.label(x.u) === v && R.label(x.v) === u)); if (!e) return fail(`No existe arista ${u}–${v} en G₁.`); R.removeEdge(e.id); frames.push({ log: `G₁ − ${e.name}: se elimina solo la arista; los vértices permanecen.`, type: 'info' }); }
            else if (op === 'fuse') { if (R.idOf(u) === undefined || R.idOf(v) === undefined || u === v) return fail('Indique dos vértices distintos de G₁.'); R = GraphOps.fuse(R, u, v); frames.push({ log: `Fusión de ${u} y ${v} en el vértice ${u + v}: todas las aristas incidentes a ${u} o ${v} pasan a incidir en ${u + v} (las aristas ${u}–${v} se vuelven lazos; vecinos comunes generan aristas paralelas).`, type: 'info' }); }
            else if (op === 'contract') { const e = R.edges.find(x => (R.label(x.u) === u && R.label(x.v) === v) || (R.label(x.u) === v && R.label(x.v) === u)); if (!e) return fail(`No existe arista ${u}–${v} para contraer.`); R = GraphOps.fuse(R, u, v, e.id); frames.push({ log: `Contracción de ${e.name}: se elimina la arista y se fusionan sus extremos en ${u + v}.`, type: 'info' }); }
        }
        const res = R;
        const ov = { edgeCls: {} };
        Object.entries(origin).forEach(([id, o]) => ov.edgeCls[id] = o === '12' ? 'c-tree' : o === '1' ? 'c-consider' : o === '2' ? 'c-hl' : 'c-dashed');
        frames.push({ draw: () => { er.setGraph(res.clone()); const ov2 = { nodeCls: {} }; res.nodes.forEach(n => ov2.nodeCls[n.id] = 'c-hl'); er.setOverlay(ov2); }, log: `Vértices del resultado: ${res.setStr()}`, type: 'compare' });
        frames.push({ draw: () => { er.setGraph(res.clone()); er.setOverlay(ov); ui.res.innerHTML = ''; ui.res.appendChild(UI.kv([['S', res.setStr().slice(4)], ['A', U.setStr(res.edges.map(e => `${e.name}:${res.label(e.u)}${res.directed ? '→' : '–'}${res.label(e.v)}`))], ['|S|, |A|', `${res.n}, ${res.m}`]])); }, log: `Aristas del resultado (${res.m}): ${U.setStr(res.edges.map(e => res.edgeStr(e)))}`, type: 'found', status: `Resultado: |S| = ${res.n}, |A| = ${res.m}.`, statusType: 'found' });
        Sim.load(frames, { base: () => { er.setGraph(new Graph()); ui.res.innerHTML = ''; } });
    }
    return {
        run,
        mount({ controls, stage }) {
            ui.op = UI.select(ops, 'union', updParams);
            ui.pu = UI.text('a', { width: '60px' }); ui.pv = UI.text('b', { width: '60px' }); ui.pw = UI.num(1, { width: '60px' });
            controls.append(UI.field('Operación:', ui.op), UI.field('u:', ui.pu), UI.field('v:', ui.pv), UI.btn('Ejecutar', run, 'btn-primary'));
            const c1 = h('div'), c2 = h('div'); stage.append(c1, c2);
            e1 = new GraphEditor(c1, { title: 'G₁ = (S₁, A₁)', preset: 'clase-basico', presets: ['clase-basico', 'k3', 'p3', 'c5', 'k4'], height: 340, allowWeighted: false });
            e2 = new GraphEditor(c2, { title: 'G₂ = (S₂, A₂)', preset: 'g2-ops', presets: ['g2-ops', 'k3', 'k2', 'p3', 'c5'], height: 340, allowWeighted: false });
            const c3 = h('div'); stage.appendChild(c3);
            er = new GraphEditor(c3, { title: 'Resultado', editable: false, height: 340 });
            stage.appendChild(h('div', { class: 'legend' }, h('span', null, h('i', { style: { borderColor: '#2E7D32' } }), 'en A₁ y A₂'), h('span', null, h('i', { style: { borderColor: '#1565C0' } }), 'solo en A₁'), h('span', null, h('i', { style: { borderColor: '#D96332' } }), 'solo en A₂'), h('span', null, h('i', { style: { borderColor: '#BFA594', borderTopStyle: 'dashed' } }), 'agregada por la suma')));
            ui.res = h('div'); stage.appendChild(ui.res);
            updParams();
        },
        reset() { er.setGraph(new Graph()); Log.clear(); },
    };
})());

/* =====================================================================
 * 3.2  PRODUCTOS DE GRAFOS
 * ===================================================================== */
const GraphProducts = {
    adj(g, a, b) { return a !== b && g.edges.some(e => (e.u === a && e.v === b) || (e.u === b && e.v === a)); },
    /** Devuelve {g, evals: [{a, b, cond, ok}]} con vértices (u, v) en cuadrícula. */
    build(g1, g2, kind) {
        const r = new Graph();
        const A = g1.ids(), B = g2.ids();
        const W = 800, H = 380, cols = B.length, rows = A.length;
        const dx = Math.min(150, (W - 120) / Math.max(1, cols - 1)), dy = Math.min(110, (H - 70) / Math.max(1, rows - 1));
        const ox = (W - dx * (cols - 1)) / 2, oy = (H - dy * (rows - 1)) / 2;
        const id = {};
        A.forEach((u, i) => B.forEach((v, j) => { id[u + ',' + v] = r.addNode(`(${g1.label(u)},${g2.label(v)})`, ox + j * dx, oy + i * dy); }));
        const P = []; A.forEach(u => B.forEach(v => P.push([u, v])));
        const evals = [];
        for (let x = 0; x < P.length; x++) for (let y = x + 1; y < P.length; y++) {
            const [u1, v1] = P[x], [u2, v2] = P[y];
            const au = GraphProducts.adj(g1, u1, u2), av = GraphProducts.adj(g2, v1, v2);
            const L = (g, a) => g.label(a);
            let ok = false, cond = '';
            if (kind === 'cart') { ok = (u1 === u2 && av) || (v1 === v2 && au); cond = u1 === u2 ? `u₁ = u₂ = ${L(g1, u1)} y ${L(g2, v1)}~${L(g2, v2)} en G₂? ${av ? 'sí' : 'no'}` : v1 === v2 ? `v₁ = v₂ = ${L(g2, v1)} y ${L(g1, u1)}~${L(g1, u2)} en G₁? ${au ? 'sí' : 'no'}` : 'difieren en ambas coordenadas'; }
            else if (kind === 'tens') { ok = au && av; cond = `${L(g1, u1)}~${L(g1, u2)} en G₁? ${au ? 'sí' : 'no'} · ${L(g2, v1)}~${L(g2, v2)} en G₂? ${av ? 'sí' : 'no'}`; }
            else { ok = au || (u1 === u2 && av); cond = au ? `${L(g1, u1)}~${L(g1, u2)} en G₁ (cualquier v)` : u1 === u2 ? `u₁ = u₂ y ${L(g2, v1)}~${L(g2, v2)} en G₂? ${av ? 'sí' : 'no'}` : `${L(g1, u1)} ≁ ${L(g1, u2)} y u₁ ≠ u₂`; }
            let eid = null;
            if (ok) eid = r.addEdge(id[u1 + ',' + v1], id[u2 + ',' + v2]);
            evals.push({ a: r.label(id[u1 + ',' + v1]), b: r.label(id[u2 + ',' + v2]), cond, ok, eid, na: id[u1 + ',' + v1], nb: id[u2 + ',' + v2] });
        }
        return { g: r, evals };
    },
};
App.register('g-productos', (() => {
    let e1, e2, er, ui = {};
    const defs = { cart: ['Cartesiano G₁ □ G₂', '(u₁,v₁) ~ (u₂,v₂) ⇔ [u₁ = u₂ ∧ v₁ ~ v₂] ∨ [v₁ = v₂ ∧ u₁ ~ u₂]', (n1, m1, n2, m2) => n1 * m2 + n2 * m1, 'n₁m₂ + n₂m₁'], tens: ['Tensorial G₁ × G₂', '(u₁,v₁) ~ (u₂,v₂) ⇔ u₁ ~ u₂ ∧ v₁ ~ v₂', (n1, m1, n2, m2) => 2 * m1 * m2, '2·m₁·m₂'], comp: ['Composición G₁[G₂]', '(u₁,v₁) ~ (u₂,v₂) ⇔ u₁ ~ u₂ ∨ [u₁ = u₂ ∧ v₁ ~ v₂]', (n1, m1, n2, m2) => n1 * m2 + n2 * n2 * m1, 'n₁m₂ + n₂²m₁'] };
    function run() {
        const g1 = e1.getGraph(), g2 = e2.getGraph(), kind = ui.kind.value;
        const s1 = GA.isSimple(g1), s2 = GA.isSimple(g2);
        if (!s1.simple || !s2.simple) return Status.set('Los productos se definen aquí sobre grafos simples: elimine lazos y aristas múltiples.', 'error');
        if (g1.n * g2.n > 36) return Status.set('El producto tendría más de 36 vértices; use grafos más pequeños para visualizarlo.', 'error');
        const [name, rule, fml, fmlTxt] = defs[kind];
        const { g, evals } = GraphProducts.build(g1, g2, kind);
        const frames = [];
        const empty = g.clone(); empty.edges = [];
        frames.push({ draw: () => er.setGraph(empty.clone()), log: `${name}: S = S₁ × S₂ = ${g1.n}·${g2.n} = ${g.n} vértices (u, v) en cuadrícula (filas: G₁, columnas: G₂). Regla: ${rule}`, type: 'step', formula: rule });
        const cur = empty.clone();
        evals.forEach(ev => {
            if (!ev.ok) return;
            cur.addEdge(ev.na, ev.nb);
            const snap = cur.clone(), last = snap.edges[snap.edges.length - 1].id;
            frames.push({ draw: () => { er.setGraph(snap); er.setOverlay({ edgeCls: { [last]: 'c-hl' }, nodeCls: { [ev.na]: 'c-current', [ev.nb]: 'c-current' } }); }, log: `${ev.a} ~ ${ev.b}: ${ev.cond} → ARISTA`, type: 'compare' });
        });
        const rejected = evals.filter(e => !e.ok).length;
        const expect = fml(g1.n, g1.m, g2.n, g2.m);
        frames.push({ draw: () => { er.setGraph(g.clone()); ui.table.innerHTML = ''; ui.table.appendChild(UI.table(['Par', 'Condición evaluada', '¿Arista?'], evals.map(e => [`${e.a} – ${e.b}`, { html: e.cond, cls: 'left' }, e.ok ? '✔' : '—']), { rowCls: i => evals[i].ok ? 'row-found' : '' })); },
            log: `Pares evaluados: ${evals.length}; aristas: ${g.m}; descartados: ${rejected}. Verificación |A| = ${fmlTxt} = ${expect} ${expect === g.m ? '✔' : '✘'}`, type: 'found', status: `<strong>${name}</strong>: |S| = ${g.n}, |A| = ${g.m} (fórmula ${fmlTxt} = ${expect}).`, statusType: 'found' });
        Sim.load(frames, { base: () => { er.setGraph(new Graph()); ui.table.innerHTML = ''; } });
    }
    return {
        run,
        mount({ controls, stage }) {
            ui.kind = UI.select([['cart', 'Cartesiano G₁ □ G₂'], ['tens', 'Tensorial G₁ × G₂'], ['comp', 'Composición G₁[G₂]']], 'cart');
            controls.append(UI.field('Producto:', ui.kind), UI.btn('Calcular', run, 'btn-primary'));
            const c1 = h('div'), c2 = h('div'); stage.append(c1, c2);
            e1 = new GraphEditor(c1, { title: 'G₁', preset: 'p3', presets: ['p3', 'k2', 'k3', 'c5'], height: 330, forceDirected: false, forceWeighted: false });
            e2 = new GraphEditor(c2, { title: 'G₂', preset: 'k2', presets: ['k2', 'p3', 'k3'], height: 330, forceDirected: false, forceWeighted: false });
            const c3 = h('div'); stage.appendChild(c3);
            er = new GraphEditor(c3, { title: 'Producto (estructura unificada)', editable: false, height: 380 });
            ui.table = h('div', { style: { maxHeight: '320px', overflowY: 'auto' } }); stage.appendChild(ui.table);
        },
        reset() { er.setGraph(new Graph()); Log.clear(); },
    };
})());

/* =====================================================================
 * 3.3  DISTANCIA, EXCENTRICIDAD, CENTRO, RADIO, DIÁMETRO, MEDIANA
 * ===================================================================== */
App.register('g-centro', (() => {
    let ed, sub, ui = {}, R = null;
    function compute() {
        const g = ed.getGraph();
        if (!g.n) return null;
        const F = GA.floyd(g, ui.w.checked && g.weighted);
        const n = F.ids.length;
        const sumD = F.D.map(r => U.sum(r));
        const ecc = F.D.map(r => Math.max(...r));
        const finite = ecc.filter(x => x < Infinity);
        const radius = Math.min(...ecc), diameter = Math.max(...ecc);
        const center = F.ids.filter((_, i) => ecc[i] === radius);
        const minSum = Math.min(...sumD);
        const median = F.ids.filter((_, i) => sumD[i] === minSum);
        return { g, F, n, sumD, ecc, radius, diameter, center, median, connected: finite.length === n };
    }
    function render(focus) {
        R = compute();
        ui.out.innerHTML = '';
        if (!R) return;
        const { g, F, sumD, ecc, radius, diameter, center, median } = R;
        const L = F.ids.map(i => g.label(i));
        const isBic = center.length === 2 && GraphProducts.adj(g, center[0], center[1]);
        const hlRows = new Set(), hlCells = new Set();
        let hlIds = [], hlEdges = [];
        if (focus === 'center' || focus === 'radius') { center.forEach(c => hlRows.add(F.ix[c])); hlIds = center.slice(); }
        if (focus === 'median') { median.forEach(c => hlRows.add(F.ix[c])); hlIds = median.slice(); }
        if (focus === 'radius' || focus === 'diameter') {
            const val = focus === 'radius' ? radius : diameter;
            const i = focus === 'radius' ? F.ix[center[0]] : ecc.indexOf(diameter);
            const j = F.D[i].indexOf(val);
            hlCells.add(i + ',' + j);
            const p = F.path(i, j);
            if (p) { hlIds = Array.from(new Set(hlIds.concat(p))); for (let k = 1; k < p.length; k++) { const e = g.edges.find(e => (e.u === p[k - 1] && e.v === p[k]) || (!g.directed && e.u === p[k] && e.v === p[k - 1])); if (e) hlEdges.push(e.id); } }
        }
        const M = F.D.map((r, i) => r.concat([sumD[i], ecc[i]]));
        ui.out.appendChild(UI.matrix(M, L, L.concat(['Σ d(v)', 'e(v)']), {
            caption: `Matriz de distancias mínimas (Floyd${ui.w.checked && g.weighted ? ', con pesos' : ', aristas = 1'})`,
            cellCls: (i, j) => { if (hlCells.has(i + ',' + j)) return 'cell-updated'; if (j === R.n && focus === 'median' && sumD[i] === Math.min(...sumD)) return 'cell-hl'; if (j === R.n + 1 && (focus === 'ecc' || focus === 'center' || focus === 'radius') && ecc[i] === radius) return 'cell-hl'; if (j === R.n + 1 && focus === 'diameter' && ecc[i] === diameter) return 'cell-bad'; if (j === R.n && focus === 'dist') return 'cell-pivot'; if (j === R.n + 1 && focus === 'ecc') return 'cell-pivot'; if (hlRows.has(i) && j < R.n) return 'cell-compare'; return i === j ? 'cell-diag' : ''; },
            rowCls: i => hlRows.has(i) ? 'th-hl' : null,
        }));
        ui.out.appendChild(UI.kv([
            ['Distancia de vértice Σ d(v)', L.map((l, i) => `${l}:${U.fmt(sumD[i])}`).join(', ')],
            ['Excentricidad e(v) = máx d(v,u)', L.map((l, i) => `${l}:${U.fmt(ecc[i])}`).join(', ')],
            ['Radio r(G) = mín e(v)', U.fmt(radius)],
            ['Diámetro d(G) = máx e(v)', U.fmt(diameter)],
            [isBic ? 'Bicentro' : 'Centro', `${GUI.setLabels(g, center)}${isBic ? ' (dos vértices adyacentes)' : ''}`],
            ['Mediana (mín Σ d)', GUI.setLabels(g, median)],
        ]));
        if (!R.connected) ui.out.prepend(UI.alert('warn', 'Grafo no conexo', 'Existen distancias ∞: la excentricidad de todos los vértices es ∞ y el centro no está definido de forma útil.'));
        const ov = { nodeCls: {}, edgeCls: {}, nodeAnn: {} };
        F.ids.forEach((id, i) => ov.nodeAnn[id] = [{ text: focus === 'dist' || focus === 'median' ? `Σ=${U.fmt(sumD[i])}` : `e=${U.fmt(ecc[i])}`, cls: 'ann-peach' }]);
        hlIds.forEach(i => ov.nodeCls[i] = 'c-perm'); hlEdges.forEach(e => ov.edgeCls[e] = 'c-path');
        if (focus === 'center' || focus === 'radius') center.forEach(i => ov.nodeCls[i] = 'c-src');
        if (focus === 'median') median.forEach(i => ov.nodeCls[i] = 'c-src');
        ed.overlay = ov; ed.render();
        if (hlIds.length) sub.setGraph(GA.induced(g, hlIds)); else sub.setGraph(new Graph());
        return { center, median, radius, diameter };
    }
    function run() {
        const frames = [], r = compute();
        if (!r) return Status.set('Dibuje un grafo.', 'error');
        const { g, F } = r, L = F.ids.map(i => g.label(i));
        frames.push({ draw: () => render(null), log: 'Floyd calcula la matriz de distancias mínimas D.', type: 'step' });
        frames.push({ draw: () => render('dist'), log: `Distancia de vértice Σ d(v): ${L.map((l, i) => l + '=' + U.fmt(r.sumD[i])).join(', ')}`, type: 'compare' });
        frames.push({ draw: () => render('ecc'), log: `Excentricidad e(v) (máximo de cada fila): ${L.map((l, i) => l + '=' + U.fmt(r.ecc[i])).join(', ')}`, type: 'compare' });
        frames.push({ draw: () => render('radius'), log: `Radio = mín e(v) = ${U.fmt(r.radius)}.`, type: 'compare' });
        frames.push({ draw: () => render('diameter'), log: `Diámetro = máx e(v) = ${U.fmt(r.diameter)} (se resalta un camino diametral).`, type: 'compare' });
        frames.push({ draw: () => render('center'), log: `Centro = vértices con e(v) = radio: ${GUI.setLabels(g, r.center)}.`, type: 'found' });
        frames.push({ draw: () => render('median'), log: `Mediana = vértices con Σ d(v) mínima: ${GUI.setLabels(g, r.median)}.`, type: 'found', status: `Centro ${GUI.setLabels(g, r.center)}, radio ${U.fmt(r.radius)}, diámetro ${U.fmt(r.diameter)}, mediana ${GUI.setLabels(g, r.median)}.`, statusType: 'found' });
        Sim.load(frames, { base: () => render(null) });
    }
    return {
        run,
        mount({ controls, stage }) {
            ui.w = h('input', { type: 'checkbox' });
            controls.append(h('label', { class: 'check-wrapper' }, ui.w, h('span', { text: 'Usar pesos (si es ponderado)' })), UI.btn('Calcular paso a paso', run, 'btn-primary'));
            [['dist', 'Distancia Σ'], ['ecc', 'Excentricidad'], ['center', 'Centro / Bicentro'], ['radius', 'Radio'], ['diameter', 'Diámetro'], ['median', 'Mediana']].forEach(([k, t]) => controls.append(UI.btn(t, () => render(k), 'btn-small')));
            ui.w.addEventListener('change', () => render(null));
            const top = h('div'); stage.appendChild(top);
            ed = new GraphEditor(top, { preset: 'fig12', presets: ['fig12', 'arbol', 'clase-basico', 'petersen', 'mst', 'c6'], onChange: () => render(null) });
            ui.out = h('div', { class: 'stage-col' });
            const sc = h('div');
            stage.append(h('div', { class: 'split-2' }, ui.out, sc));
            sub = new GraphEditor(sc, { title: 'Subgrafo inducido por la selección', editable: false, height: 280 });
            render(null);
        },
        reset() { render(null); Log.clear(); },
    };
})());

/* =====================================================================
 * 3.4  ÁRBOLES DE EXPANSIÓN: Prim, Kruskal, Máxima, T y T̄, distancia y central
 * ===================================================================== */
App.register('g-expansion', (() => {
    let ed, eT, eC, ui = {}, T = null, all = null;
    function showTandComplement(g, Tids) {
        const Ts = new Set(Tids);
        const gT = g.clone(); gT.edges = gT.edges.filter(e => Ts.has(e.id));
        const gC = g.clone(); gC.edges = gC.edges.filter(e => !Ts.has(e.id));
        eT.setGraph(gT); eC.setGraph(gC);
        const ovC = { edgeCls: {} }; gC.edges.forEach(e => ovC.edgeCls[e.id] = 'c-chord'); eC.setOverlay(ovC);
        const ovT = { edgeCls: {} }; gT.edges.forEach(e => ovT.edgeCls[e.id] = 'c-tree'); eT.setOverlay(ovT);
        const k = GA.components(g).length;
        const wl = GA.weightLabels(g);
        ui.sum.innerHTML = '';
        ui.sum.appendChild(UI.kv([
            ['Ramas de T (A_T)', U.setStr(Tids.map(id => GA.edgeDesc(g, g.edge(id), wl)))],
            ['Cuerdas de T̄', U.setStr(gC.edges.map(e => GA.edgeDesc(g, g.edge(e.id), wl)))],
            [`Rango = n − ${k === 1 ? '1' : 'k'}`, `${g.n} − ${k} = <b>${g.n - k}</b> ramas`],
            [`Nulidad = m − n + ${k === 1 ? '1' : 'k'}`, `${g.m} − ${g.n} + ${k} = <b>${g.m - g.n + k}</b> cuerdas`],
            ['Peso total w(T)', U.fmt(U.sum(Tids.map(id => g.w(g.edge(id)))))],
            k > 1 ? ['Nota', `G tiene ${k} componentes: se obtiene un BOSQUE de expansión.`] : null,
        ].filter(Boolean)));
    }
    function run() {
        const g = ed.getGraph();
        if (g.directed) return Status.set('Los árboles de expansión se trabajan sobre grafos no dirigidos. Desmarque “Dirigido”.', 'error');
        if (!g.n) return Status.set('Dibuje un grafo.', 'error');
        const alg = ui.alg.value, max = alg === 'kruskal-max' || alg === 'prim-max';
        const wl = GA.weightLabels(g), D = e => GA.edgeDesc(g, e, wl);
        const frames = [], tree = [];
        const snap = (extra = {}) => { const t = tree.slice(); return () => { const ov = { edgeCls: {}, nodeCls: {} }; g.edges.forEach(e => ov.edgeCls[e.id] = 'c-chord'); t.forEach(id => ov.edgeCls[id] = 'c-tree'); (extra.consider || []).forEach(id => ov.edgeCls[id] = 'c-consider'); if (extra.pick) ov.edgeCls[extra.pick] = 'c-hl'; if (extra.reject) ov.edgeCls[extra.reject] = 'c-bad'; (extra.nodes || []).forEach(id => ov.nodeCls[id] = 'c-perm'); ed.setOverlay(ov); }; };
        if (alg.startsWith('kruskal')) {
            const E = g.edges.filter(e => e.u !== e.v).slice().sort((a, b) => max ? g.w(b) - g.w(a) : g.w(a) - g.w(b));
            frames.push({ draw: snap(), log: `Kruskal ${max ? '(MÁXIMO)' : '(MÍNIMO)'}: aristas ordenadas ${max ? 'descendentemente' : 'ascendentemente'}: ${E.map(D).join(', ')}`, type: 'step' });
            const uf = GA.uf(g.ids());
            for (const e of E) {
                if (tree.length === g.n - GA.components(g).length) break;
                const sets = uf.sets().map(s => GUI.setLabels(g, s)).join(' ');
                if (uf.union(e.u, e.v)) { tree.push(e.id); frames.push({ draw: snap({ pick: e.id }), log: `${D(e)}: ${g.label(e.u)} y ${g.label(e.v)} en conjuntos distintos (${sets}) → ACEPTADA como rama.`, type: 'found' }); }
                else frames.push({ draw: snap({ reject: e.id }), log: `${D(e)}: ${g.label(e.u)} y ${g.label(e.v)} ya están en el mismo conjunto → formaría ciclo → RECHAZADA (cuerda).`, type: 'discard' });
            }
        } else {
            const s = g.idOf(ui.start.value);
            const inT = new Set([s]);
            frames.push({ draw: snap({ nodes: [s] }), log: `Prim ${max ? '(MÁXIMO)' : '(MÍNIMO)'} desde ${g.label(s)}.`, type: 'step' });
            const comps = GA.components(g);
            const reachable = new Set(comps.find(c => c.includes(s)));
            while (inT.size < reachable.size) {
                const cand = g.edges.filter(e => inT.has(e.u) !== inT.has(e.v));
                if (!cand.length) break;
                const best = max ? Math.max(...cand.map(e => g.w(e))) : Math.min(...cand.map(e => g.w(e)));
                const ties = cand.filter(e => g.w(e) === best);
                const pick = ties[0];
                const nodes = Array.from(inT);
                frames.push({ draw: snap({ consider: cand.map(e => e.id), nodes }), log: `Aristas que salen de ${GUI.setLabels(g, nodes)}: ${cand.map(D).join(', ')} → ${max ? 'máxima' : 'mínima'} = ${wl[pick.id]}${ties.length > 1 ? ` (EMPATE entre ${ties.map(e => e.name).join(', ')}: se toma ${pick.name})` : ''}.`, type: 'compare' });
                tree.push(pick.id); inT.add(inT.has(pick.u) ? pick.v : pick.u);
                frames.push({ draw: snap({ pick: pick.id, nodes: Array.from(inT) }), log: `Se agrega ${D(pick)} y el vértice ${g.label(inT.has(pick.u) && nodes.includes(pick.u) ? pick.v : pick.u)}.`, type: 'found' });
            }
            if (reachable.size < g.n) frames.push({ log: 'G no es conexo: Prim solo expande la componente del vértice inicial.', type: 'warn' });
        }
        T = tree.slice();
        frames.push({ draw: () => { snap()(); showTandComplement(g, T); }, log: `T = (S_T, A_T) con ${T.length} ramas, peso ${U.fmt(U.sum(T.map(id => g.w(g.edge(id)))))}. T̄ contiene ${g.m - T.length} cuerdas.`, type: 'found', status: `Árbol de expansión ${max ? 'MÁXIMO' : 'MÍNIMO'}: w(T) = <strong>${U.fmt(U.sum(T.map(id => g.w(g.edge(id)))))}</strong>`, statusType: 'found' });
        Sim.load(frames, { base: () => ed.clearOverlay() });
    }
    function enumerate() {
        const g = ed.getGraph();
        ui.dist.innerHTML = '';
        if (g.directed) return;
        const r = GA.spanningTrees(g, 2000);
        all = r.trees;
        if (!all.length) { ui.dist.appendChild(h('div', { class: 'muted', text: 'No hay árboles de expansión.' })); return; }
        const name = i => `T${U.sub(i + 1)}`;
        const wt = t => U.sum(t.map(id => g.w(g.edge(id))));
        const dist = (a, b) => { const B = new Set(b); return a.filter(x => !B.has(x)).length; };
        let central = [], best = Infinity, maxd = [];
        if (all.length <= 1500) {
            maxd = all.map(t => Math.max(...all.map(o => dist(t, o))));
            best = Math.min(...maxd);
            central = all.map((_, i) => i).filter(i => maxd[i] === best);
        }
        const opts = all.map((t, i) => [i, `${name(i)} (w=${U.fmt(wt(t))})`]);
        const s1 = UI.select(opts, 0), s2 = UI.select(opts, Math.min(1, all.length - 1));
        const out = h('div');
        const cmp = () => {
            const a = all[+s1.value], b = all[+s2.value], d = dist(a, b);
            out.innerHTML = '';
            out.appendChild(UI.kv([[`A_T₁ − A_T₂`, GUI.edgeSet(g, a.filter(x => !b.includes(x))) || '∅'], [`A_T₂ − A_T₁`, GUI.edgeSet(g, b.filter(x => !a.includes(x))) || '∅'], ['d(T₁, T₂)', `<b>${d}</b> (aristas de T₁ que no están en T₂)`]]));
            const ov = { edgeCls: {} };
            g.edges.forEach(e => ov.edgeCls[e.id] = 'c-dim');
            a.forEach(id => ov.edgeCls[id] = b.includes(id) ? 'c-tree' : 'c-consider');
            b.forEach(id => { if (!a.includes(id)) ov.edgeCls[id] = 'c-hl'; });
            ed.setOverlay(ov);
            Log.add(`d(${s1.selectedOptions[0].text.split(' ')[0]}, ${s2.selectedOptions[0].text.split(' ')[0]}) = ${d}`, 'found');
        };
        s1.addEventListener('change', cmp); s2.addEventListener('change', cmp);
        ui.dist.append(
            UI.kv([['Árboles de expansión', `${all.length}${r.truncated ? '+ (truncado)' : ''}`]]),
            h('div', { class: 'filter-bar' }, UI.field('T₁:', s1), UI.field('T₂:', s2), UI.btn('Comparar', cmp, 'btn-small')),
            h('div', { class: 'legend' }, h('span', null, h('i', { style: { borderColor: '#2E7D32' } }), 'en ambos'), h('span', null, h('i', { style: { borderColor: '#1565C0' } }), 'solo T₁'), h('span', null, h('i', { style: { borderColor: '#D96332' } }), 'solo T₂')),
            out,
            central.length ? UI.card('Árbol de expansión central', h('div', { html: `Minimiza máx d(T₀, T) sobre todos los T. máx d = <b>${best}</b>. Central(es): ${central.map(i => name(i)).join(', ')}` }),
                UI.chips(central.map(i => `${name(i)}: ${GUI.edgeSet(g, all[i])}`), k => { const ov = { edgeCls: {} }; g.edges.forEach(e => ov.edgeCls[e.id] = 'c-chord'); all[central[k]].forEach(id => ov.edgeCls[id] = 'c-tree'); ed.setOverlay(ov); showTandComplement(g, all[central[k]]); })) : UI.alert('info', 'Demasiados árboles', 'Más de 1500 árboles: el árbol central no se calcula exhaustivamente.'));
    }
    function changed(g) { GUI.refresh(ui.start, g); T = null; eT.setGraph(new Graph()); eC.setGraph(new Graph()); ui.sum.innerHTML = ''; enumerate(); }
    return {
        run,
        mount({ controls, stage }) {
            ui.alg = UI.select([['prim', 'Prim (mínimo, desde vértices)'], ['kruskal', 'Kruskal (mínimo, desde aristas)'], ['kruskal-max', 'Expansión MÁXIMA (Kruskal)'], ['prim-max', 'Expansión MÁXIMA (Prim)']], 'kruskal');
            ui.start = UI.select([], '');
            controls.append(UI.field('Algoritmo:', ui.alg), UI.field('Inicio (Prim):', ui.start), UI.btn('Construir T', run, 'btn-primary'));
            const top = h('div'); stage.appendChild(top);
            ed = new GraphEditor(top, { preset: 'mst', presets: ['mst', 'mst-pequeno', 'clase-basico', 'k4', 'petersen'], forceDirected: false, onChange: changed });
            const row = h('div', { class: 'split-2' }); stage.appendChild(row);
            const a = h('div'), b = h('div'); row.append(a, b);
            eT = new GraphEditor(a, { title: 'T = (S_T, A_T) — ramas', editable: false, height: 280 });
            eC = new GraphEditor(b, { title: 'T̄ — cuerdas (complemento)', editable: false, height: 280 });
            ui.sum = h('div'); stage.appendChild(ui.sum);
            ui.dist = h('div', { class: 'card' }); stage.appendChild(h('div', { class: 'section-title', text: 'Distancia entre árboles de expansión y árbol central' })); stage.appendChild(ui.dist);
            GUI.refresh(ui.start, ed.getGraph());
            enumerate();
        },
        reset() { ed.clearOverlay(); Log.clear(); },
    };
})());

/* =====================================================================
 * 3.5  FUNCIÓN ORDINAL + BELLMAN
 * ===================================================================== */
const Ordinal = {
    /** Devuelve {levels: [[ids]], ok, cycle, remaining} */
    compute(g) {
        const rem = new Set(g.ids()), levels = [];
        while (rem.size) {
            const lvl = Array.from(rem).filter(v => !g.edges.some(e => e.v === v && rem.has(e.u) && e.u !== v));
            const selfLoop = Array.from(rem).filter(v => g.edges.some(e => e.u === v && e.v === v));
            if (!lvl.length || selfLoop.length) {
                const cyc = selfLoop.length ? [selfLoop[0], selfLoop[0]] : GA.findDirectedCycle(g, Array.from(rem));
                return { levels, ok: false, cycle: cyc, remaining: Array.from(rem) };
            }
            levels.push(lvl); lvl.forEach(v => rem.delete(v));
        }
        return { levels, ok: true };
    },
    /** Bellman sobre el orden ordinal. Devuelve {lambda, pred, evals} */
    bellman(g, levels, src) {
        const order = levels.flat();
        const lambda = {}, pred = {}, evals = [];
        order.forEach(v => { lambda[v] = Infinity; pred[v] = []; });
        lambda[src] = 0;
        order.forEach(j => {
            if (j === src) { evals.push({ j, terms: [], val: 0, src: true }); return; }
            const P = g.preds(j);
            const terms = P.map(({ from, e }) => ({ from, e, val: lambda[from] + g.w(e) }));
            const val = terms.length ? Math.min(...terms.map(t => t.val)) : Infinity;
            lambda[j] = val;
            pred[j] = val < Infinity ? terms.filter(t => t.val === val).map(t => ({ from: t.from, e: t.e })) : [];
            evals.push({ j, terms, val });
        });
        return { lambda, pred, evals };
    },
};
App.register('g-bellman', (() => {
    let ed, ui = {};
    function run() {
        const g = ed.getGraph();
        ui.alerts.innerHTML = ''; ui.routes.innerHTML = '';
        if (!g.directed) { ui.alerts.appendChild(UI.alert('inconsistency', 'Bellman requiere un grafo DIRIGIDO', 'La función ordinal se define sobre las flechas entrada/salida. Marque “Dirigido”.')); return Status.set('El grafo debe ser dirigido.', 'error'); }
        const src = g.idOf(ui.src.value), dst = g.idOf(ui.dst.value);
        const frames = [];
        const ord = Ordinal.compute(g);
        const ann = {};
        frames.push({ draw: () => ed.clearOverlay(), log: 'FASE 1 — Función ordinal: en cada nivel se toman los vértices sin predecesores entre los restantes.', type: 'step', formula: 'O(v) = k ⇔ v no tiene predecesores en S − (N₀ ∪ … ∪ Nₖ₋₁)' });
        ord.levels.forEach((lvl, k) => {
            lvl.forEach(v => ann[v] = [{ text: `O=${k}`, cls: 'ann-peach' }]);
            const a = JSON.parse(JSON.stringify(ann));
            frames.push({ draw: () => { const ov = { nodeAnn: a, nodeCls: {} }; lvl.forEach(v => ov.nodeCls[v] = 'c-hl'); ed.setOverlay(ov); }, log: `Nivel N${U.sub(k)} = ${GUI.setLabels(g, lvl)} (sin predecesores restantes).`, type: 'compare' });
        });
        if (!ord.ok) {
            const cyc = ord.cycle || [];
            const cycEdges = [];
            for (let i = 1; i < cyc.length; i++) { const e = g.edges.find(e => e.u === cyc[i - 1] && e.v === cyc[i]); if (e) cycEdges.push(e.id); }
            const a = JSON.parse(JSON.stringify(ann));
            const msg = `Los vértices ${GUI.setLabels(g, ord.remaining)} siempre tienen un predecesor: existe el CICLO DIRIGIDO ${cyc.map(i => g.label(i)).join(' → ')}. La función ordinal no puede completarse y por tanto Bellman NO es aplicable (no se ejecuta parcialmente).`;
            frames.push({
                draw: () => { const ov = { nodeAnn: a, nodeCls: {}, edgeCls: {} }; ord.remaining.forEach(v => ov.nodeCls[v] = 'c-dim'); cyc.forEach(v => ov.nodeCls[v] = 'c-bad'); cycEdges.forEach(e => ov.edgeCls[e] = 'c-bad'); ed.setOverlay(ov); ui.alerts.innerHTML = ''; ui.alerts.appendChild(UI.alert('inconsistency', 'Inconsistencia: el grafo contiene un ciclo dirigido', msg)); },
                log: 'ERROR: ' + msg, type: 'error', status: '<strong>Bellman no aplica:</strong> el grafo tiene un ciclo dirigido. Use Dijkstra.', statusType: 'error',
            });
            return Sim.load(frames, { base: () => { ed.clearOverlay(); ui.alerts.innerHTML = ''; } });
        }
        frames.push({ log: `Función ordinal completa: ${ord.levels.map((l, k) => `N${U.sub(k)}=${GUI.setLabels(g, l)}`).join(' · ')}. El grafo es acíclico.`, type: 'found' });
        const B = Ordinal.bellman(g, ord.levels, src);
        const wl = GA.weightLabels(g);
        const lam = {};
        frames.push({ log: `FASE 2 — Bellman desde ${g.label(src)}: λ${g.label(src)} = 0; luego en orden ordinal λⱼ = mín{λᵢ + d(i, j)} sobre los predecesores i.`, type: 'step', formula: 'λⱼ = mín { λᵢ + d(i, j) : i ∈ P(j) }' });
        B.evals.forEach(ev => {
            lam[ev.j] = ev.val;
            const lc = Object.assign({}, lam);
            let msg;
            if (ev.src) msg = `λ${g.label(ev.j)} = 0 (origen).`;
            else if (!ev.terms.length) msg = `λ${g.label(ev.j)}: no tiene predecesores → ∞.`;
            else msg = `λ${g.label(ev.j)} = mín{ ${ev.terms.map(t => `λ${g.label(t.from)} + d(${g.label(t.from)},${g.label(ev.j)}) = ${U.fmt(B.lambda[t.from] === undefined ? Infinity : lc[t.from])} + ${wl[t.e.id]} = ${U.fmt(t.val)}`).join(' ; ')} } = ${U.fmt(ev.val)}${ev.val < Infinity && ev.terms.filter(t => t.val === ev.val).length > 1 ? '  (EMPATE: varios predecesores óptimos)' : ''}`;
            const preds = B.pred[ev.j].map(p => p.e.id);
            frames.push({ draw: () => { const ov = { nodeAnn: {}, nodeCls: { [src]: 'c-src', [ev.j]: 'c-current' }, edgeCls: {} }; g.ids().forEach(v => { ov.nodeAnn[v] = [].concat(lc[v] !== undefined ? [{ text: `λ=${U.fmt(lc[v])}`, cls: 'ann-green' }] : [], ann[v]); }); ev.terms.forEach(t => ov.edgeCls[t.e.id] = 'c-consider'); preds.forEach(e => ov.edgeCls[e] = 'c-hl'); ed.setOverlay(ov); }, log: msg, type: 'compare' });
        });
        // reconstrucción en reversa
        const routes = B.lambda[dst] < Infinity ? GUI.allRoutes(B.pred, src, dst) : [];
        const showRoutes = (sel) => {
            const ov = { nodeAnn: {}, nodeCls: { [src]: 'c-src', [dst]: 'c-dst' }, edgeCls: {} };
            g.ids().forEach(v => ov.nodeAnn[v] = [{ text: `λ=${U.fmt(B.lambda[v])}`, cls: 'ann-green' }]);
            routes.forEach((r, i) => { if (sel !== undefined && sel !== i) return; r.forEach(p => ov.edgeCls[p.e.id] = sel !== undefined || i === 0 ? 'c-path' : (ov.edgeCls[p.e.id] || 'c-path2')); });
            ed.setOverlay(ov);
        };
        const rtxt = r => [src].concat(r.map(p => p.e.v)).map(i => g.label(i)).join(' → ');
        const rev = r => [dst].concat(r.slice().reverse().map(p => p.from)).map(i => g.label(i)).join(' ← ');
        if (!routes.length) frames.push({ draw: () => showRoutes(), log: `λ${g.label(dst)} = ∞: ${g.label(dst)} no es alcanzable desde ${g.label(src)}.`, type: 'notfound', status: `No existe ruta de ${g.label(src)} a ${g.label(dst)}.`, statusType: 'notfound' });
        else {
            routes.forEach((r, i) => frames.push({ draw: () => showRoutes(i), log: `Ruta ${i + 1} (reconstruida en reversa): ${rev(r)}`, type: 'found' }));
            frames.push({ draw: () => { showRoutes(); ui.routes.innerHTML = ''; ui.routes.appendChild(UI.card(`${routes.length} ruta(s) mínima(s) de costo ${U.fmt(B.lambda[dst])} (clic para resaltar)`, UI.chips(routes.map(rtxt), i => showRoutes(i)))); ui.routes.appendChild(UI.table(['Vértice', 'Nivel ordinal', 'λⱼ', 'Predecesor(es) óptimo(s)'], ord.levels.flatMap((l, k) => l.map(v => [g.label(v), k, U.fmt(B.lambda[v]), B.pred[v].map(p => g.label(p.from)).join(', ') || '—'])))); },
                log: `Distancia mínima ${g.label(src)} → ${g.label(dst)} = ${U.fmt(B.lambda[dst])} con ${routes.length} ruta(s) óptima(s).`, type: 'found', status: `<strong>λ${g.label(dst)} = ${U.fmt(B.lambda[dst])}</strong> · ${routes.length} ruta(s) mínima(s).`, statusType: 'found' });
        }
        Sim.load(frames, { base: () => { ed.clearOverlay(); ui.alerts.innerHTML = ''; ui.routes.innerHTML = ''; } });
    }
    return {
        run,
        mount({ controls, stage }) {
            ui.src = UI.select([], ''); ui.dst = UI.select([], '');
            controls.append(UI.field('Origen:', ui.src), UI.field('Destino:', ui.dst), UI.btn('Ejecutar Ordinal + Bellman', run, 'btn-primary'));
            const top = h('div'); stage.appendChild(top);
            const refresh = g => { GUI.refresh(ui.src, g); GUI.refresh(ui.dst, g); if (ui.dst.selectedIndex === 0 && ui.dst.options.length > 1) ui.dst.selectedIndex = ui.dst.options.length - 1; };
            ed = new GraphEditor(top, { preset: 'bellman-clase', presets: ['bellman-clase', 'bellman-8', 'bellman-ciclo'], forceDirected: true, forceWeighted: true, onChange: refresh });
            refresh(ed.getGraph());
            ui.alerts = h('div'); ui.routes = h('div', { class: 'stage-col' });
            stage.append(ui.alerts, ui.routes);
        },
        reset() { ed.clearOverlay(); Log.clear(); },
    };
})());

/* =====================================================================
 * 3.5  DIJKSTRA — etiquetas [d, n] sobre el grafo (sin matrices)
 * ===================================================================== */
const Dijkstra = {
    /** Traza completa. Devuelve {steps, dist, pred, negative} */
    run(g, src, showRejected = true) {
        if (g.edges.some(e => g.w(e) < 0)) return { negative: true };
        const L = {}; g.ids().forEach(v => L[v] = []);
        const perm = new Set([src]);
        L[src].push({ d: 0, p: null, state: 'perm' });
        const dist = { [src]: 0 };
        const steps = [];
        const snapL = () => JSON.parse(JSON.stringify(L));
        steps.push({ L: snapL(), perm: [src], cur: src, msg: `Etiqueta del origen ${g.label(src)}: [0, −] PERMANENTE.`, type: 'step' });
        let last = src;
        for (;;) {
            const msgs = [];
            g.adj(last).forEach(({ to: j, e }) => {
                if (perm.has(j) || j === last) { if (j !== last) msgs.push(`${g.label(j)} ya es permanente: se ignora ${e.name}.`); return; }
                const cand = dist[last] + g.w(e);
                const T = L[j].filter(x => x.state === 'temp');
                const lab = `[${U.fmt(cand)}, ${g.label(last)}]`;
                if (!T.length) { L[j].push({ d: cand, p: last, state: 'temp' }); msgs.push(`${g.label(j)}: ${U.fmt(dist[last])} + ${U.fmt(g.w(e))} = ${U.fmt(cand)} → etiqueta temporal ${lab}.`); }
                else if (cand < T[0].d) { T.forEach(x => x.state = 'rejected'); L[j].push({ d: cand, p: last, state: 'temp' }); msgs.push(`${g.label(j)}: ${U.fmt(cand)} &lt; ${U.fmt(T[0].d)} → se RECHAZA [${U.fmt(T[0].d)}, ${T.map(x => g.label(x.p)).join('/')}] y queda ${lab}.`); }
                else if (cand === T[0].d) { L[j].push({ d: cand, p: last, state: 'temp' }); msgs.push(`${g.label(j)}: ${U.fmt(cand)} = ${U.fmt(T[0].d)} → EMPATE, se agrega ${lab} (ruta alternativa).`); }
                else { if (showRejected) L[j].push({ d: cand, p: last, state: 'rejected' }); msgs.push(`${g.label(j)}: ${U.fmt(cand)} &gt; ${U.fmt(T[0].d)} → ${lab} se rechaza.`); }
            });
            steps.push({ L: snapL(), perm: Array.from(perm), cur: last, scan: true, msg: `Desde el permanente ${g.label(last)} (d=${U.fmt(dist[last])}): ${msgs.join(' ') || 'sin vecinos nuevos.'}`, type: 'compare' });
            let best = Infinity, cands = [];
            g.ids().forEach(v => { if (perm.has(v)) return; L[v].forEach(x => { if (x.state !== 'temp') return; if (x.d < best) { best = x.d; cands = [v]; } else if (x.d === best && !cands.includes(v)) cands.push(v); }); });
            if (best === Infinity) break;
            const v = cands[0];
            perm.add(v); dist[v] = best;
            L[v].forEach(x => { if (x.state === 'temp') x.state = x.d === best ? 'perm' : 'rejected'; });
            const nP = L[v].filter(x => x.state === 'perm').length;
            steps.push({ L: snapL(), perm: Array.from(perm), cur: v, msg: `Menor etiqueta temporal: ${g.label(v)} con d = ${U.fmt(best)}${cands.length > 1 ? ` (empate con ${cands.slice(1).map(x => g.label(x)).join(', ')}; se toma ${g.label(v)})` : ''} → PERMANENTE${nP > 1 ? ` con ${nP} predecesores óptimos` : ''}.`, type: 'found' });
            last = v;
        }
        const pred = {};
        g.ids().forEach(v => { pred[v] = L[v].filter(x => x.state === 'perm' && x.p !== null).map(x => ({ from: x.p, e: g.edges.find(e => (e.u === x.p && e.v === v && g.w(e) === dist[v] - dist[x.p]) || (!g.directed && e.v === x.p && e.u === v && g.w(e) === dist[v] - dist[x.p])) })); });
        return { steps, dist, pred, L };
    },
};
App.register('g-dijkstra', (() => {
    let ed, ui = {};
    function overlayFor(g, st, extra = {}) {
        const ov = { djLabels: {}, nodeCls: {}, edgeCls: {} };
        g.ids().forEach(v => { ov.djLabels[v] = (st.L[v] || []).map(x => ({ text: `[${U.fmt(x.d)}, ${x.p === null ? '−' : g.label(x.p)}]`, state: x.state })); });
        st.perm.forEach(v => ov.nodeCls[v] = 'c-perm');
        if (st.cur !== undefined) ov.nodeCls[st.cur] = 'c-current';
        if (st.scan) g.adj(st.cur).forEach(({ e }) => ov.edgeCls[e.id] = 'c-consider');
        return Object.assign(ov, extra);
    }
    function run() {
        const g = ed.getGraph();
        ui.routes.innerHTML = ''; ui.alerts.innerHTML = '';
        const src = g.idOf(ui.src.value), dst = g.idOf(ui.dst.value);
        if (src === undefined) return Status.set('Seleccione el origen.', 'error');
        const R = Dijkstra.run(g, src, ui.rej.checked);
        if (R.negative) { ui.alerts.appendChild(UI.alert('inconsistency', 'Dijkstra no admite pesos negativos', 'Hay aristas con peso negativo: una etiqueta permanente podría mejorar después. Use Bellman (si es acíclico) o Floyd.')); return Status.set('Pesos negativos: Dijkstra no aplica.', 'error'); }
        const frames = R.steps.map(st => ({ draw: () => ed.setOverlay(overlayFor(g, st)), log: st.msg, type: st.type }));
        const finalSt = R.steps[R.steps.length - 1];
        const unreachable = g.ids().filter(v => R.dist[v] === undefined);
        if (unreachable.length) frames.push({ log: `No hay más etiquetas temporales. No alcanzables: ${GUI.setLabels(g, unreachable)} (d = ∞).`, type: 'warn' });
        const targets = dst !== undefined ? [dst] : g.ids().filter(v => v !== src);
        const routes = [];
        targets.forEach(t => { if (R.dist[t] !== undefined) GUI.allRoutes(R.pred, src, t).forEach(r => routes.push({ t, r })); });
        const show = sel => {
            const ov = overlayFor(g, { L: finalSt.L, perm: finalSt.perm });
            routes.forEach((x, i) => { if (sel !== undefined && i !== sel) return; x.r.forEach(p => { if (p.e) ov.edgeCls[p.e.id] = 'c-path'; }); });
            ov.nodeCls[src] = 'c-src'; if (dst !== undefined) ov.nodeCls[dst] = 'c-dst';
            ed.setOverlay(ov);
        };
        const txt = x => [src].concat(x.r.map(p => g.other(p.e, p.from))).map(v => g.label(v)).join(' → ');
        routes.forEach((x, i) => frames.push({ draw: () => show(i), log: `Ruta mínima a ${g.label(x.t)} (d=${U.fmt(R.dist[x.t])}), reconstruida en reversa por los predecesores: ${txt(x)}`, type: 'found' }));
        const dTxt = dst !== undefined ? (R.dist[dst] !== undefined ? `d(${g.label(src)}, ${g.label(dst)}) = <strong>${U.fmt(R.dist[dst])}</strong> · ${routes.length} ruta(s) mínima(s)` : `${g.label(dst)} no es alcanzable`) : 'Árbol de caminos mínimos desde ' + g.label(src);
        frames.push({ draw: () => { show(); ui.routes.innerHTML = ''; if (routes.length) ui.routes.appendChild(UI.card('Rutas mínimas (clic para resaltar)', UI.chips(routes.map(x => `${txt(x)} (${U.fmt(R.dist[x.t])})`), i => show(i)))); ui.routes.appendChild(UI.table(['Vértice', 'd', 'Etiqueta(s) permanente(s)'], g.nodes.map(n => [n.label, U.fmt(R.dist[n.id] === undefined ? Infinity : R.dist[n.id]), (finalSt.L[n.id] || []).filter(x => x.state === 'perm').map(x => `[${U.fmt(x.d)}, ${x.p === null ? '−' : g.label(x.p)}]`).join(' ') || '—']))); }, log: 'Fin del algoritmo de Dijkstra.', type: 'found', status: dTxt, statusType: dst === undefined || R.dist[dst] !== undefined ? 'found' : 'notfound' });
        Sim.load(frames, { base: () => { ed.clearOverlay(); ui.routes.innerHTML = ''; } });
    }
    return {
        run,
        mount({ controls, stage }) {
            ui.src = UI.select([], ''); ui.dst = UI.select([], '');
            ui.rej = h('input', { type: 'checkbox', checked: true });
            controls.append(UI.field('Origen:', ui.src), UI.field('Destino:', ui.dst), h('label', { class: 'check-wrapper' }, ui.rej, h('span', { text: 'Mostrar candidatas rechazadas' })), UI.btn('Ejecutar Dijkstra', run, 'btn-primary'));
            const top = h('div'); stage.appendChild(top);
            const refresh = g => { GUI.refresh(ui.src, g); GUI.refresh(ui.dst, g, [['*', '(todos)']]); if (ui.dst.value === '*' && ui.dst.options.length > 1) ui.dst.selectedIndex = ui.dst.options.length - 1; };
            ed = new GraphEditor(top, { preset: 'dijkstra', presets: ['dijkstra', 'dijkstra-dirigido', 'mst', 'bellman-ciclo', 'floyd'], forceWeighted: true, height: 420, onChange: refresh });
            refresh(ed.getGraph());
            stage.appendChild(h('div', { class: 'legend' },
                h('span', { html: '<svg width="56" height="20"><rect x="1" y="1" width="54" height="18" rx="4" fill="#FFFDF6" stroke="#CFB8A6" stroke-dasharray="2 2"/><text x="6" y="14" font-size="11" fill="#1565C0" font-family="monospace" font-weight="800">[d, n]</text></svg> temporal' }),
                h('span', { html: '<svg width="56" height="20"><rect x="1" y="1" width="54" height="18" rx="4" fill="#E8F5E9" stroke="#2E7D32" stroke-width="2"/><text x="6" y="14" font-size="11" fill="#2E7D32" font-family="monospace" font-weight="800">[d, n]</text></svg> permanente' }),
                h('span', { html: '<svg width="56" height="20"><text x="6" y="14" font-size="11" fill="#A3928A" font-family="monospace" font-weight="800">[d, n]</text><line x1="3" y1="10" x2="53" y2="10" stroke="#C62828" stroke-width="1.8" stroke-dasharray="3 2.5"/></svg> rechazada' })));
            ui.alerts = h('div'); ui.routes = h('div', { class: 'stage-col' });
            stage.append(ui.alerts, ui.routes);
        },
        reset() { ed.clearOverlay(); Log.clear(); },
    };
})());

/* =====================================================================
 * 3.5  FLOYD-WARSHALL — matrices D⁽⁰⁾ … D⁽ⁿ⁾
 * ===================================================================== */
const Floyd = {
    /** Traza: [{j, D, R, updates, skipped, compared}] usando la condición d(i,j) + d(j,k) < d(i,k). */
    trace(g, optimize) {
        const ids = g.ids(), n = ids.length, ix = {}; ids.forEach((id, i) => ix[id] = i);
        const D = U.range(n).map(i => U.range(n).map(k => (i === k ? 0 : Infinity)));
        const R = U.range(n).map(i => U.range(n).map(k => (i === k ? '−' : '−')));
        g.edges.forEach(e => { const a = ix[e.u], b = ix[e.v]; if (a === b) return; if (g.w(e) < D[a][b]) { D[a][b] = g.w(e); R[a][b] = g.label(e.v); } if (!g.directed && g.w(e) < D[b][a]) { D[b][a] = g.w(e); R[b][a] = g.label(e.u); } });
        // R[i][k] = siguiente vértice desde i hacia k
        const steps = [{ j: -1, D: D.map(r => r.slice()), R: R.map(r => r.slice()), updates: [], skipped: [], compared: 0 }];
        for (let j = 0; j < n; j++) {
            const updates = [], skipped = []; let compared = 0;
            const prev = D.map(r => r.slice());
            for (let i = 0; i < n; i++) {
                for (let k = 0; k < n; k++) {
                    if (optimize && (i === j || k === j || i === k || prev[i][j] === Infinity || prev[j][k] === Infinity)) { skipped.push([i, k]); continue; }
                    compared++;
                    if (prev[i][j] + prev[j][k] < D[i][k]) { updates.push({ i, k, old: D[i][k], a: prev[i][j], b: prev[j][k] }); D[i][k] = prev[i][j] + prev[j][k]; R[i][k] = R[i][j]; }
                }
            }
            steps.push({ j, D: D.map(r => r.slice()), R: R.map(r => r.slice()), updates, skipped, compared });
        }
        return { ids, ix, steps, n };
    },
};
App.register('g-floyd', (() => {
    let ed, ui = {}, last = null;
    function drawStep(g, T, s) {
        const st = T.steps[s], L = T.ids.map(i => g.label(i));
        const up = new Set(st.updates.map(u => u.i + ',' + u.k)), sk = new Set(st.skipped.map(([i, k]) => i + ',' + k));
        ui.mat.innerHTML = '';
        const prevSt = s > 0 ? T.steps[s - 1] : null;
        const row = h('div', { class: 'stage-row' });
        if (prevSt) row.appendChild(UI.matrix(prevSt.D, L, L, { caption: `D⁽${U.sup(s - 1)}⁾ (anterior)`, cellCls: (i, k) => i === k ? 'cell-diag' : (st.j === i || st.j === k) ? 'cell-pivot' : '' }));
        row.appendChild(UI.matrix(st.D, L, L, {
            caption: `D⁽${U.sup(s)}⁾${st.j >= 0 ? ` — intermedio j = ${L[st.j]}` : ' — matriz inicial (∞ sin arista directa, 0 en la diagonal)'}`,
            cellCls: (i, k) => up.has(i + ',' + k) ? 'cell-updated' : sk.has(i + ',' + k) && ui.opt.checked && st.j >= 0 && i !== k ? 'cell-skip' : i === k ? 'cell-diag' : (st.j === i || st.j === k) ? 'cell-pivot' : '',
            colCls: k => k === st.j ? 'th-pivot' : null, rowCls: i => i === st.j ? 'th-pivot' : null,
        }));
        row.appendChild(UI.matrix(st.R, L, L, { caption: `Rutas R⁽${U.sup(s)}⁾ (siguiente vértice)`, fmt: x => x, cellCls: (i, k) => up.has(i + ',' + k) ? 'cell-updated' : '' }));
        ui.mat.appendChild(row);
        const n = T.n;
        if (st.j >= 0) ui.mat.appendChild(h('div', { class: 'hint', html: `Comparaciones realizadas: <b>${st.compared}</b> de ${n * n}${ui.opt.checked ? ` · omitidas por la optimización (i = j, k = j, i = k o ∞ en fila/columna j): <b>${st.skipped.length}</b>` : ''} · celdas actualizadas: <b>${st.updates.length}</b>` }));
    }
    function run() {
        const g = ed.getGraph();
        if (!g.n) return Status.set('Dibuje un grafo.', 'error');
        const T = Floyd.trace(g, ui.opt.checked);
        last = { g, T };
        const L = T.ids.map(i => g.label(i));
        const frames = [];
        frames.push({ draw: () => { drawStep(g, T, 0); ed.clearOverlay(); }, log: `D⁽⁰⁾: pesos de las aristas directas, ∞ si no hay arista, 0 en la diagonal.`, type: 'step', formula: 'si d(i,j) + d(j,k) &lt; d(i,k) → d(i,k) ← d(i,j) + d(j,k)' });
        for (let s = 1; s < T.steps.length; s++) {
            const st = T.steps[s], j = st.j;
            const logs = [[`D⁽${U.sup(s)}⁾ — vértice intermedio j = ${L[j]}: ${st.updates.length} actualización(es)${ui.opt.checked ? `, ${st.skipped.length} casos omitidos` : ''}.`, 'step']];
            st.updates.slice(0, 40).forEach(u => logs.push([`d(${L[u.i]},${L[j]}) + d(${L[j]},${L[u.k]}) = ${U.fmt(u.a)} + ${U.fmt(u.b)} = ${U.fmt(u.a + u.b)} &lt; d(${L[u.i]},${L[u.k]}) = ${U.fmt(u.old)} → actualizar`, 'compare']));
            if (st.updates.length > 40) logs.push([`… y ${st.updates.length - 40} más.`, 'info']);
            frames.push({ draw: () => { drawStep(g, T, s); ed.setOverlay({ nodeCls: { [T.ids[j]]: 'c-current' } }); }, logs });
        }
        const Dn = T.steps[T.steps.length - 1].D;
        const neg = U.range(T.n).filter(i => Dn[i][i] < 0);
        const totalCmp = U.sum(T.steps.map(s => s.compared));
        frames.push({ draw: () => { drawStep(g, T, T.steps.length - 1); if (neg.length) { ui.mat.prepend(UI.alert('inconsistency', 'Ciclo de peso negativo', `d(v,v) &lt; 0 para ${neg.map(i => L[i]).join(', ')}: las distancias mínimas no están definidas.`)); } },
            log: `D⁽${U.sup(T.n)}⁾ es la matriz de distancias mínimas. Comparaciones totales: ${totalCmp}${ui.opt.checked ? ` (sin optimización serían ${T.n ** 3})` : ''}.`, type: neg.length ? 'error' : 'found', status: neg.length ? 'Hay un ciclo negativo.' : `Floyd terminado: ${T.n} matrices calculadas. Consulte rutas abajo.`, statusType: neg.length ? 'error' : 'found' });
        Sim.load(frames, { base: () => { drawStep(g, T, 0); ed.clearOverlay(); } });
        GUI.refresh(ui.qa, g); GUI.refresh(ui.qb, g);
    }
    function query() {
        if (!last) run();
        const { g, T } = last;
        const a = T.ix[g.idOf(ui.qa.value)], b = T.ix[g.idOf(ui.qb.value)];
        const st = T.steps[T.steps.length - 1];
        if (a === undefined || b === undefined) return;
        if (st.D[a][b] === Infinity) { Log.add(`No hay camino de ${ui.qa.value} a ${ui.qb.value}.`, 'notfound'); return; }
        const path = [a]; let x = a, guard = 0;
        while (x !== b && guard++ < T.n + 2) { const nx = st.R[x][b]; x = T.ix[g.idOf(nx)]; path.push(x); }
        const ids = path.map(i => T.ids[i]);
        const ov = { nodeCls: {}, edgeCls: {} };
        ids.forEach(v => ov.nodeCls[v] = 'c-perm'); ov.nodeCls[ids[0]] = 'c-src'; ov.nodeCls[ids[ids.length - 1]] = 'c-dst';
        for (let i = 1; i < ids.length; i++) { const e = g.edges.filter(e => (e.u === ids[i - 1] && e.v === ids[i]) || (!g.directed && e.v === ids[i - 1] && e.u === ids[i])).sort((p, q) => g.w(p) - g.w(q))[0]; if (e) ov.edgeCls[e.id] = 'c-path'; }
        ed.setOverlay(ov);
        Log.add(`Camino mínimo ${ui.qa.value} → ${ui.qb.value}: ${ids.map(i => g.label(i)).join(' → ')} (d = ${U.fmt(st.D[a][b])})`, 'found');
    }
    return {
        run,
        mount({ controls, stage }) {
            ui.opt = h('input', { type: 'checkbox', checked: true });
            ui.qa = UI.select([], ''); ui.qb = UI.select([], '');
            controls.append(h('label', { class: 'check-wrapper' }, ui.opt, h('span', { text: 'Optimización (omitir i = j / k = j / ∞)' })), UI.btn('Ejecutar Floyd', run, 'btn-primary'), UI.sep(), UI.field('Camino de', ui.qa), UI.field('a', ui.qb), UI.btn('Mostrar', query));
            const top = h('div'); stage.appendChild(top);
            ed = new GraphEditor(top, { preset: 'floyd', presets: ['floyd', 'dijkstra', 'dijkstra-dirigido', 'bellman-clase', 'mst'], forceWeighted: true, height: 340, onChange: g => { last = null; GUI.refresh(ui.qa, g); GUI.refresh(ui.qb, g); } });
            GUI.refresh(ui.qa, ed.getGraph()); GUI.refresh(ui.qb, ed.getGraph());
            ui.mat = h('div', { class: 'stage-col' }); stage.appendChild(ui.mat);
        },
        reset() { ed.clearOverlay(); Log.clear(); },
    };
})());

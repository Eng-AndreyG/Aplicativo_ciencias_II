/* =====================================================================
 * graph_engine.js — Motor de grafos
 *   · Graph: modelo G = (S, A) (dirigido/no dirigido, ponderado/no ponderado,
 *            admite lazos y aristas múltiples para poder detectarlos)
 *   · GA:    algoritmos base (componentes, ciclos dirigidos, articulación,
 *            puentes, Floyd, árboles de expansión, circuitos, cortes,
 *            isomorfismo, bipartición…)
 *   · GraphEditor: lienzo SVG interactivo reutilizable con presets
 *   · GraphPresets: ejemplos de clase
 * ===================================================================== */
'use strict';

/* =====================================================================
 * 1. MODELO
 * ===================================================================== */
class Graph {
    constructor(o = {}) {
        this.directed = !!o.directed;
        this.weighted = !!o.weighted;
        this.nodes = [];   // {id, label, x, y}
        this.edges = [];   // {id, u, v, w, name}
        this._nid = 0;
        this._eid = 0;
    }
    /** spec: {directed, weighted, nodes: [[label, x, y]], edges: [[uLabel, vLabel, w?, name?]]} */
    static from(spec) {
        const g = new Graph(spec);
        spec.nodes.forEach(([l, x, y]) => g.addNode(String(l), x, y));
        spec.edges.forEach(([a, b, w, name]) => g.addEdge(g.idOf(String(a)), g.idOf(String(b)), w === undefined ? 1 : w, name));
        if (spec.nodes.some(n => n[1] === undefined)) GA.layoutCircle(g);
        return g;
    }
    clone() {
        const g = new Graph(this);
        g.nodes = this.nodes.map(n => Object.assign({}, n));
        g.edges = this.edges.map(e => Object.assign({}, e));
        g._nid = this._nid; g._eid = this._eid;
        return g;
    }
    toJSON() { return { directed: this.directed, weighted: this.weighted, nodes: this.nodes.map(n => [n.label, Math.round(n.x), Math.round(n.y)]), edges: this.edges.map(e => [this.label(e.u), this.label(e.v), e.w, e.name]) }; }
    get n() { return this.nodes.length; }
    get m() { return this.edges.length; }
    ids() { return this.nodes.map(n => n.id); }
    node(id) { return this.nodes.find(n => n.id === id); }
    idOf(label) { const n = this.nodes.find(x => x.label === label); return n ? n.id : undefined; }
    label(id) { const n = this.node(id); return n ? n.label : '?'; }
    edge(id) { return this.edges.find(e => e.id === id); }
    w(e) { return this.weighted ? e.w : 1; }
    other(e, id) { return e.u === id ? e.v : e.u; }
    incident(id) { return this.edges.filter(e => e.u === id || e.v === id); }
    nextLabel() {
        const labels = new Set(this.nodes.map(n => n.label));
        const numeric = this.nodes.length && this.nodes.every(n => /^\d+$/.test(n.label));
        if (numeric) { let i = 0; while (labels.has(String(i))) i++; return String(i); }
        const A = 'abcdefghijklmnopqrstuvwxyz';
        for (let r = 0; ; r++) for (const c of A) { const l = r ? c + r : c; if (!labels.has(l)) return l; }
    }
    nextEdgeName() { const used = new Set(this.edges.map(e => e.name)); let i = 1; while (used.has('e' + i)) i++; return 'e' + i; }
    addNode(label, x = 100, y = 100) { const id = ++this._nid; this.nodes.push({ id, label: label === undefined ? this.nextLabel() : String(label), x, y }); return id; }
    addEdge(u, v, w = 1, name) { if (u === undefined || v === undefined) throw new Error('Vértice inexistente'); const id = ++this._eid; this.edges.push({ id, u, v, w: Number(w), name: name || this.nextEdgeName() }); return id; }
    removeNode(id) { this.nodes = this.nodes.filter(n => n.id !== id); this.edges = this.edges.filter(e => e.u !== id && e.v !== id); }
    removeEdge(id) { this.edges = this.edges.filter(e => e.id !== id); }
    /** Grado (lazo cuenta 2). */
    degree(id) { return this.edges.reduce((a, e) => a + (e.u === id ? 1 : 0) + (e.v === id ? 1 : 0), 0); }
    outDeg(id) { return this.edges.filter(e => e.u === id).length; }
    inDeg(id) { return this.edges.filter(e => e.v === id).length; }
    /** Vecinos según dirección (no dirigido: ambos sentidos). Devuelve [{to, e}]. */
    adj(id) {
        const r = [];
        this.edges.forEach(e => {
            if (e.u === id) r.push({ to: e.v, e });
            else if (!this.directed && e.v === id) r.push({ to: e.u, e });
        });
        return r;
    }
    /** Vecinos ignorando dirección (sin repetidos, sin sí mismo). */
    neighbors(id) { const s = new Set(); this.edges.forEach(e => { if (e.u === id && e.v !== id) s.add(e.v); if (e.v === id && e.u !== id) s.add(e.u); }); return Array.from(s); }
    preds(id) { return this.edges.filter(e => e.v === id).map(e => ({ from: e.u, e })); }
    edgeStr(e) { return `${this.label(e.u)}${this.directed ? '→' : '–'}${this.label(e.v)}`; }
    setStr() { return 'S = { ' + this.nodes.map(n => n.label).join(', ') + ' }'; }
}

/* =====================================================================
 * 2. ALGORITMOS BASE
 * ===================================================================== */
const GA = {
    layoutCircle(g, cx = 400, cy = 190, r) {
        const n = g.n; r = r || Math.min(150, 40 + n * 14);
        g.nodes.forEach((nd, i) => { const a = -Math.PI / 2 + 2 * Math.PI * i / Math.max(1, n); nd.x = cx + r * Math.cos(a); nd.y = cy + r * Math.sin(a); });
        return g;
    },
    /** Etiquetas de peso con barra superior para pesos repetidos (2, 2̄, 2̿…). */
    weightLabels(g) {
        const seen = {}, out = {};
        g.edges.forEach(e => { const k = String(e.w); const c = seen[k] || 0; seen[k] = c + 1; out[e.id] = U.overline(U.fmt(e.w), c); });
        return out;
    },
    /** Descripción de una arista para logs: e3(a–b, 2̄) */
    edgeDesc(g, e, wl) { wl = wl || GA.weightLabels(g); return `${e.name}(${g.edgeStr(e)}${g.weighted ? ', ' + wl[e.id] : ''})`; },
    isSimple(g) {
        const loops = g.edges.filter(e => e.u === e.v);
        const seen = {}, multi = [];
        g.edges.forEach(e => { if (e.u === e.v) return; const k = g.directed ? `${e.u}>${e.v}` : [e.u, e.v].sort((a, b) => a - b).join('-'); if (seen[k]) multi.push([seen[k], e]); else seen[k] = e; });
        return { simple: !loops.length && !multi.length, loops, multi };
    },
    /** Componentes conexas (débiles si es dirigido). edgeFilter opcional. */
    components(g, opts = {}) {
        const ids = (opts.nodes || g.ids());
        const allowed = new Set(ids);
        const ef = opts.edgeFilter || (() => true);
        const adj = {}; ids.forEach(i => adj[i] = []);
        g.edges.forEach(e => { if (!ef(e) || !allowed.has(e.u) || !allowed.has(e.v)) return; adj[e.u].push(e.v); adj[e.v].push(e.u); });
        const seen = new Set(), comps = [];
        ids.forEach(s => {
            if (seen.has(s)) return;
            const comp = [], st = [s]; seen.add(s);
            while (st.length) { const x = st.pop(); comp.push(x); adj[x].forEach(y => { if (!seen.has(y)) { seen.add(y); st.push(y); } }); }
            comps.push(comp);
        });
        return comps;
    },
    isConnected(g, opts) { return GA.components(g, opts).length <= 1; },
    /** Alcanzables desde s respetando dirección. */
    reach(g, s) { const seen = new Set([s]), st = [s]; while (st.length) { const x = st.pop(); g.adj(x).forEach(({ to }) => { if (!seen.has(to)) { seen.add(to); st.push(to); } }); } return seen; },
    bfsTree(g, s) {
        const seen = new Set([s]), q = [s], tree = [];
        while (q.length) { const x = q.shift(); g.edges.forEach(e => { if (e.u === e.v) return; let y = null; if (e.u === x) y = e.v; else if (e.v === x) y = e.u; if (y !== null && !seen.has(y)) { seen.add(y); q.push(y); tree.push(e.id); } }); }
        return tree;
    },
    /** Ciclo dirigido (lista de ids de vértices, cerrado) o null. Restringible a un subconjunto. */
    findDirectedCycle(g, subset) {
        const ids = subset || g.ids();
        const allow = new Set(ids);
        const color = {}, parent = {};
        ids.forEach(i => color[i] = 0);
        let cyc = null;
        const dfs = u => {
            color[u] = 1;
            for (const e of g.edges) {
                if (e.u !== u || !allow.has(e.v)) continue;
                const v = e.v;
                if (color[v] === 1) { const c = [v]; let x = u; while (x !== v) { c.push(x); x = parent[x]; } c.push(v); cyc = c.reverse(); return true; }
                if (color[v] === 0) { parent[v] = u; if (dfs(v)) return true; }
            }
            color[u] = 2; return false;
        };
        for (const i of ids) if (color[i] === 0 && dfs(i)) break;
        return cyc;
    },
    /** Vértices de articulación y puentes (grafo no dirigido subyacente, Tarjan). */
    articulationAndBridges(g) {
        const disc = {}, low = {}, ap = new Set(), bridges = [];
        let t = 0;
        const dfs = (u, pe) => {
            disc[u] = low[u] = ++t; let ch = 0;
            g.edges.forEach(e => {
                if (e.u === e.v) return;
                let v = null; if (e.u === u) v = e.v; else if (e.v === u) v = e.u; if (v === null) return;
                if (e.id === pe) return;
                if (disc[v] === undefined) {
                    ch++; dfs(v, e.id); low[u] = Math.min(low[u], low[v]);
                    if (pe !== null && low[v] >= disc[u]) ap.add(u);
                    if (low[v] > disc[u]) bridges.push(e.id);
                } else low[u] = Math.min(low[u], disc[v]);
            });
            if (pe === null && ch > 1) ap.add(u);
        };
        g.ids().forEach(i => { if (disc[i] === undefined) dfs(i, null); });
        return { ap: Array.from(ap), bridges };
    },
    /** Matriz de distancias (Floyd). useWeights=false → cada arista vale 1. */
    floyd(g, useWeights = true) {
        const ids = g.ids(), n = ids.length, ix = {}; ids.forEach((id, i) => ix[id] = i);
        const D = U.range(n).map(i => U.range(n).map(j => i === j ? 0 : Infinity));
        const NX = U.range(n).map(i => U.range(n).map(j => (i === j ? i : -1)));
        g.edges.forEach(e => {
            const a = ix[e.u], b = ix[e.v], w = useWeights ? g.w(e) : 1;
            if (a === b) return;
            if (w < D[a][b]) { D[a][b] = w; NX[a][b] = b; }
            if (!g.directed && w < D[b][a]) { D[b][a] = w; NX[b][a] = a; }
        });
        for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
            if (D[i][k] + D[k][j] < D[i][j]) { D[i][j] = D[i][k] + D[k][j]; NX[i][j] = NX[i][k]; }
        const path = (i, j) => { if (NX[i][j] < 0) return null; const p = [i]; let x = i, guard = 0; while (x !== j && guard++ < n + 2) { x = NX[x][j]; p.push(x); } return p.map(k => ids[k]); };
        return { ids, ix, D, path };
    },
    /** Union-Find */
    uf(ids) {
        const p = {}; ids.forEach(i => p[i] = i);
        const find = x => (p[x] === x ? x : (p[x] = find(p[x])));
        return { find, union: (a, b) => { const ra = find(a), rb = find(b); if (ra === rb) return false; p[ra] = rb; return true; }, sets: () => { const s = {}; ids.forEach(i => { const r = find(i); (s[r] = s[r] || []).push(i); }); return Object.values(s); } };
    },
    /** Todos los árboles (bosques) de expansión como arreglos de ids de aristas. */
    spanningTrees(g, limit = 3000) {
        const k = GA.components(g).length, need = g.n - k;
        const E = g.edges.filter(e => e.u !== e.v);
        const res = []; const cur = [];
        let truncated = false;
        const rec = (start, uf) => {
            if (res.length >= limit) { truncated = true; return; }
            if (cur.length === need) { res.push(cur.slice()); return; }
            for (let i = start; i <= E.length - (need - cur.length); i++) {
                const e = E[i];
                const snap = JSON.stringify(uf.p);
                if (uf.find(e.u) === uf.find(e.v)) continue;
                uf.union(e.u, e.v); cur.push(e.id);
                rec(i + 1, uf);
                cur.pop(); uf.restore(snap);
                if (truncated) return;
            }
        };
        const mk = () => { const p = {}; g.ids().forEach(i => p[i] = i); const o = { p }; o.find = x => (o.p[x] === x ? x : o.find(o.p[x])); o.union = (a, b) => { o.p[o.find(a)] = o.find(b); }; o.restore = s => { o.p = JSON.parse(s); }; return o; };
        rec(0, mk());
        return { trees: res, truncated };
    },
    kruskalIds(g, max = false) {
        const E = g.edges.filter(e => e.u !== e.v).slice().sort((a, b) => max ? g.w(b) - g.w(a) : g.w(a) - g.w(b));
        const uf = GA.uf(g.ids()); const T = [];
        E.forEach(e => { if (uf.union(e.u, e.v)) T.push(e.id); });
        return T;
    },
    /** Camino en el árbol T entre a y b (lista de ids de aristas). */
    treePath(g, T, a, b) {
        const Ts = new Set(T), prev = {}; const seen = new Set([a]); const q = [a];
        while (q.length) { const x = q.shift(); if (x === b) break; g.edges.forEach(e => { if (!Ts.has(e.id)) return; let y = null; if (e.u === x) y = e.v; else if (e.v === x) y = e.u; if (y !== null && !seen.has(y)) { seen.add(y); prev[y] = { x, e: e.id }; q.push(y); } }); }
        if (!seen.has(b)) return null;
        const p = []; let x = b; while (x !== a) { p.push(prev[x].e); x = prev[x].x; } return p.reverse();
    },
    /** Circuitos fundamentales respecto a T: [{chord, edges:[ids]}] */
    fundamentalCircuits(g, T) {
        const Ts = new Set(T);
        return g.edges.filter(e => !Ts.has(e.id)).map(c => ({ chord: c.id, edges: c.u === c.v ? [c.id] : [c.id].concat(GA.treePath(g, T, c.v, c.u) || []) }));
    },
    /** ¿El conjunto de aristas forma un único circuito? */
    isCircuit(g, edgeIds) {
        if (!edgeIds.length) return false;
        const es = edgeIds.map(id => g.edge(id));
        if (es.length === 1) return es[0].u === es[0].v;
        const deg = {};
        es.forEach(e => { deg[e.u] = (deg[e.u] || 0) + 1; deg[e.v] = (deg[e.v] || 0) + 1; });
        if (Object.values(deg).some(d => d !== 2)) return false;
        const vs = Object.keys(deg).map(Number);
        return GA.components(g, { nodes: vs, edgeFilter: e => edgeIds.includes(e.id) }).length === 1;
    },
    /** Todos los circuitos (espacio de ciclos: combinaciones XOR de circuitos fundamentales). */
    allCircuits(g, T) {
        const F = GA.fundamentalCircuits(g, T);
        const nu = F.length;
        if (nu > 16) return { circuits: F.map(f => f.edges), truncated: true };
        const res = [];
        for (let mask = 1; mask < (1 << nu); mask++) {
            const cnt = {};
            for (let i = 0; i < nu; i++) if (mask & (1 << i)) F[i].edges.forEach(id => cnt[id] = (cnt[id] || 0) + 1);
            const es = Object.keys(cnt).filter(id => cnt[id] % 2 === 1).map(Number);
            if (GA.isCircuit(g, es)) res.push(es);
        }
        const order = {}; g.edges.forEach((e, i) => order[e.id] = i);
        res.forEach(c => c.sort((a, b) => order[a] - order[b]));
        res.sort((a, b) => a.length - b.length);
        return { circuits: res, truncated: false };
    },
    /** Todos los conjuntos de corte (mínimos): biparticiones con ambos lados conexos. [{edges, side}] */
    allCutsets(g) {
        const res = [];
        const comps = GA.components(g);
        for (const comp of comps) {
            if (comp.length < 2) continue;
            if (comp.length > 16) return { cutsets: res, truncated: true };
            const rest = comp.slice(1), first = comp[0];
            for (let mask = 0; mask < (1 << rest.length) - 1 + 1; mask++) {
                const A = [first].concat(rest.filter((_, i) => mask & (1 << i)));
                if (A.length === comp.length) continue;
                const As = new Set(A), B = comp.filter(x => !As.has(x));
                if (!GA.isConnected(g, { nodes: A }) || !GA.isConnected(g, { nodes: B })) continue;
                const edges = g.edges.filter(e => As.has(e.u) !== As.has(e.v) && (As.has(e.u) || As.has(e.v)) && comp.includes(e.u) && comp.includes(e.v)).map(e => e.id);
                if (edges.length) res.push({ edges, side: A });
            }
        }
        res.sort((a, b) => a.edges.length - b.edges.length);
        return { cutsets: res, truncated: false };
    },
    /** Conjuntos de corte fundamentales respecto a T: [{branch, edges, side}] */
    fundamentalCutsets(g, T) {
        return T.map(b => {
            const rest = T.filter(x => x !== b);
            const be = g.edge(b);
            const comp = GA.components(g, { edgeFilter: e => rest.includes(e.id) });
            const side = comp.find(c => c.includes(be.u));
            const S = new Set(side);
            const edges = g.edges.filter(e => S.has(e.u) !== S.has(e.v) && GA.components(g).some(c => c.includes(e.u) && c.includes(be.u))).map(e => e.id);
            return { branch: b, edges, side };
        });
    },
    /** Bipartición o ciclo impar. */
    bipartite(g) {
        const col = {};
        for (const s of g.ids()) {
            if (col[s] !== undefined) continue;
            col[s] = 0; const q = [s];
            while (q.length) {
                const x = q.shift();
                for (const y of g.neighbors(x)) {
                    if (col[y] === undefined) { col[y] = 1 - col[x]; q.push(y); }
                    else if (col[y] === col[x]) return { ok: false };
                }
            }
        }
        if (g.edges.some(e => e.u === e.v)) return { ok: false };
        return { ok: true, A: g.ids().filter(i => col[i] === 0), B: g.ids().filter(i => col[i] === 1) };
    },
    maxDegree(g) { return g.n ? Math.max(...g.ids().map(i => g.degree(i))) : 0; },
    minDegree(g) { return g.n ? Math.min(...g.ids().map(i => g.degree(i))) : 0; },
    isTree(g) { return g.n > 0 && GA.isConnected(g) && g.m === g.n - 1 && GA.isSimple(g).simple; },
    isComplete(g) { const s = GA.isSimple(g); return s.simple && g.ids().every(i => g.neighbors(i).length === g.n - 1); },
    isCycleGraph(g) { return g.n >= 3 && g.m === g.n && GA.isConnected(g) && g.ids().every(i => g.degree(i) === 2) && GA.isSimple(g).simple; },
    /** Isomorfismo por backtracking con invariantes. Devuelve {iso, reason, map}. */
    isomorphism(g1, g2) {
        if (g1.n !== g2.n) return { iso: false, reason: `|S₁| = ${g1.n} ≠ |S₂| = ${g2.n}` };
        if (g1.m !== g2.m) return { iso: false, reason: `|A₁| = ${g1.m} ≠ |A₂| = ${g2.m}` };
        if (g1.directed !== g2.directed) return { iso: false, reason: 'Uno es dirigido y el otro no.' };
        const seq = g => g.ids().map(i => g.directed ? `${g.inDeg(i)}/${g.outDeg(i)}` : String(g.degree(i))).sort().join(',');
        if (seq(g1) !== seq(g2)) return { iso: false, reason: `Secuencias de grados distintas: [${seq(g1)}] vs [${seq(g2)}]` };
        const cnt = (g, a, b) => g.edges.filter(e => (e.u === a && e.v === b) || (!g.directed && e.u === b && e.v === a)).length;
        const A = g1.ids(), B = g2.ids(), map = {}, used = new Set();
        const sig = (g, i) => g.directed ? `${g.inDeg(i)}/${g.outDeg(i)}` : String(g.degree(i));
        const rec = k => {
            if (k === A.length) return true;
            const a = A[k];
            for (const b of B) {
                if (used.has(b) || sig(g1, a) !== sig(g2, b)) continue;
                let ok = cnt(g1, a, a) === cnt(g2, b, b);
                for (let j = 0; ok && j < k; j++) { const a2 = A[j], b2 = map[a2]; if (cnt(g1, a, a2) !== cnt(g2, b, b2) || cnt(g1, a2, a) !== cnt(g2, b2, b)) ok = false; }
                if (!ok) continue;
                map[a] = b; used.add(b);
                if (rec(k + 1)) return true;
                delete map[a]; used.delete(b);
            }
            return false;
        };
        if (rec(0)) return { iso: true, map };
        return { iso: false, reason: 'Mismas invariantes (n, m, grados) pero ninguna biyección conserva las adyacencias.' };
    },
    /** Subgrafo inducido por un conjunto de vértices. */
    induced(g, ids) { const s = new Set(ids); const h2 = g.clone(); h2.nodes = h2.nodes.filter(n => s.has(n.id)); h2.edges = h2.edges.filter(e => s.has(e.u) && s.has(e.v)); return h2; },
    /** Máscaras de adyacencia (no dirigido subyacente, sin lazos) para enumeraciones por bits. */
    nbMasks(g) { const ids = g.ids(), ix = {}; ids.forEach((id, i) => ix[id] = i); const nb = ids.map(() => 0); g.edges.forEach(e => { if (e.u === e.v) return; nb[ix[e.u]] |= 1 << ix[e.v]; nb[ix[e.v]] |= 1 << ix[e.u]; }); return { ids, ix, nb }; },
};

/* =====================================================================
 * 3. PRESETS DE CLASE
 * ===================================================================== */
const GraphPresets = {
    list: {
        'clase-basico': () => Graph.from({ nodes: [['a', 160, 90], ['b', 360, 60], ['c', 560, 90], ['d', 160, 280], ['e', 360, 310], ['f', 560, 280], ['g', 700, 190]], edges: [['a', 'b'], ['b', 'c'], ['a', 'd'], ['b', 'e'], ['d', 'e'], ['c', 'f'], ['e', 'f'], ['c', 'g'], ['f', 'g']] }),
        'articulacion': () => Graph.from({ nodes: [['1', 120, 100], ['2', 120, 280], ['3', 270, 190], ['4', 430, 190], ['5', 580, 100], ['6', 580, 280], ['7', 720, 190], ['8', 430, 330]], edges: [['1', '2'], ['1', '3'], ['2', '3'], ['3', '4'], ['4', '5'], ['4', '6'], ['5', '6'], ['5', '7'], ['4', '8']] }),
        /* Figura 12 de las notas de clase (sesión de centro/mediana): 4–5:1, 2–4:2, 4–3:8, 2–3:10, 3–5:2, 3–1:4, 2–1:5.
           Resultado de clase: Σd = 22, 15, 14, 13, 12; e(v) = 7, 5, 5, 7, 6; bicentro {2,3}; radio 5; diámetro 7; mediana {5}. */
        'fig12': () => Graph.from({ weighted: true, nodes: [['1', 130, 200], ['2', 330, 70], ['3', 330, 320], ['4', 560, 110], ['5', 600, 300]], edges: [['4', '5', 1], ['2', '4', 2], ['4', '3', 8], ['2', '3', 10], ['3', '5', 2], ['3', '1', 4], ['2', '1', 5]] }),
        'centro-8': () => Graph.from({ nodes: [['a', 110, 190],['b', 240, 80], ['c', 240, 300], ['d', 400, 190], ['e', 560, 80], ['f', 560, 300], ['g', 700, 190], ['h', 400, 340]], edges: [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'], ['d', 'e'], ['d', 'f'], ['e', 'g'], ['f', 'g'], ['c', 'h'], ['h', 'f']] }),
        'arbol': () => Graph.from({ nodes: [['a', 400, 50], ['b', 250, 140], ['c', 550, 140], ['d', 160, 240], ['e', 330, 240], ['f', 480, 240], ['g', 630, 240], ['h', 100, 330], ['i', 690, 330]], edges: [['a', 'b'], ['a', 'c'], ['b', 'd'], ['b', 'e'], ['c', 'f'], ['c', 'g'], ['d', 'h'], ['g', 'i']] }),
        'euler': () => Graph.from({ nodes: [['a', 150, 80], ['b', 400, 60], ['c', 650, 80], ['d', 150, 300], ['e', 400, 320], ['f', 650, 300]], edges: [['a', 'b'], ['b', 'c'], ['c', 'f'], ['f', 'e'], ['e', 'd'], ['d', 'a'], ['b', 'd'], ['d', 'f'], ['f', 'b']] }),
        'k4': () => GA.layoutCircle(Graph.from({ nodes: [['1'], ['2'], ['3'], ['4']], edges: [['1', '2'], ['1', '3'], ['1', '4'], ['2', '3'], ['2', '4'], ['3', '4']] })),
        'k5': () => GA.layoutCircle(Graph.from({ nodes: [['1'], ['2'], ['3'], ['4'], ['5']], edges: [['1', '2'], ['1', '3'], ['1', '4'], ['1', '5'], ['2', '3'], ['2', '4'], ['2', '5'], ['3', '4'], ['3', '5'], ['4', '5']] })),
        'c5': () => GA.layoutCircle(Graph.from({ nodes: [['a'], ['b'], ['c'], ['d'], ['e']], edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'a']] })),
        'c6': () => GA.layoutCircle(Graph.from({ nodes: [['a'], ['b'], ['c'], ['d'], ['e'], ['f']], edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'f'], ['f', 'a']] })),
        'k33': () => Graph.from({ nodes: [['a', 200, 80], ['b', 400, 80], ['c', 600, 80], ['1', 200, 300], ['2', 400, 300], ['3', 600, 300]], edges: [['a', '1'], ['a', '2'], ['a', '3'], ['b', '1'], ['b', '2'], ['b', '3'], ['c', '1'], ['c', '2'], ['c', '3']] }),
        'petersen': () => { const o = U.range(5).map(i => { const a = -Math.PI / 2 + 2 * Math.PI * i / 5; return [String(i + 1), 400 + 160 * Math.cos(a), 195 + 160 * Math.sin(a)]; }); const inn = U.range(5).map(i => { const a = -Math.PI / 2 + 2 * Math.PI * i / 5; return [String(i + 6), 400 + 75 * Math.cos(a), 195 + 75 * Math.sin(a)]; }); return Graph.from({ nodes: o.concat(inn), edges: [['1', '2'], ['2', '3'], ['3', '4'], ['4', '5'], ['5', '1'], ['1', '6'], ['2', '7'], ['3', '8'], ['4', '9'], ['5', '10'], ['6', '8'], ['8', '10'], ['10', '7'], ['7', '9'], ['9', '6']] }); },
        'cubo': () => Graph.from({ nodes: [['000', 200, 280], ['001', 420, 280], ['010', 200, 90], ['011', 420, 90], ['100', 330, 330], ['101', 560, 330], ['110', 330, 150], ['111', 560, 150]], edges: [['000', '001'], ['000', '010'], ['000', '100'], ['001', '011'], ['001', '101'], ['010', '011'], ['010', '110'], ['011', '111'], ['100', '101'], ['100', '110'], ['101', '111'], ['110', '111']] }),
        'mst': () => Graph.from({ weighted: true, nodes: [['a', 120, 190], ['b', 280, 70], ['c', 280, 310], ['d', 460, 190], ['e', 620, 70], ['f', 620, 310], ['g', 740, 190]], edges: [['a', 'b', 4], ['a', 'c', 2], ['b', 'c', 3], ['b', 'd', 2], ['c', 'd', 5], ['b', 'e', 6], ['d', 'e', 3], ['d', 'f', 4], ['c', 'f', 7], ['e', 'g', 2], ['f', 'g', 3], ['e', 'f', 5]] }),
        'mst-pequeno': () => Graph.from({ weighted: true, nodes: [['a', 180, 90], ['b', 520, 90], ['c', 180, 300], ['d', 520, 300], ['e', 680, 195]], edges: [['a', 'b', 2], ['a', 'c', 3], ['b', 'c', 2], ['b', 'd', 1], ['c', 'd', 3], ['d', 'e', 4], ['b', 'e', 5]] }),
        /* Grafo del tablero (clase de función ordinal, Bellman y Dijkstra): vértices ya etiquetados 0..5 por la función ordinal.
           0→1:2, 0→2:4, 0→3:5, 1→3:1, 1→5:7, 2→4:6, 3→4:1, 4→5:1. Resultado de clase: λ = 0, 2, 4, 3, 4, 5; ruta 0→1→3→4→5 (costo 5). */
        'bellman-clase': () => Graph.from({ directed: true, weighted: true, nodes: [['0', 90, 200], ['1', 270, 80], ['2', 270, 320], ['3', 430, 200], ['4', 590, 320], ['5', 720, 140]], edges: [['0', '1', 2], ['0', '2', 4], ['0', '3', 5], ['1', '3', 1], ['1', '5', 7], ['2', '4', 6], ['3', '4', 1], ['4', '5', 1]] }),
        /* Mismo dibujo SIN etiquetar (letras): para aplicar la función ordinal como en el tablero. */
        'bellman-sin-etiquetar': () => Graph.from({ directed: true, weighted: true, nodes: [['p', 90, 200], ['q', 270, 80], ['r', 270, 320], ['s', 430, 200], ['t', 590, 320], ['u', 720, 140]], edges: [['p', 'q', 2], ['p', 'r', 4], ['p', 's', 5], ['q', 's', 1], ['q', 'u', 7], ['r', 't', 6], ['s', 't', 1], ['t', 'u', 1]] }),
        'bellman-rutas': () => Graph.from({ directed: true, weighted: true, nodes: [['0', 90, 190], ['1', 250, 80], ['2', 250, 300], ['3', 430, 190], ['4', 590, 300], ['5', 720, 160]], edges: [['0', '1', 1], ['0', '2', 3], ['1', '2', 2], ['1', '3', 4], ['2', '3', 2], ['2', '4', 5], ['3', '4', 1], ['3', '5', 3], ['4', '5', 1]] }),
        'bellman-8': () => Graph.from({ directed: true, weighted: true, nodes: [['1', 80, 190], ['2', 220, 80], ['3', 220, 300], ['4', 380, 60], ['5', 380, 190], ['6', 380, 320], ['7', 560, 140], ['8', 720, 230]], edges: [['1', '2', 3], ['1', '3', 2], ['2', '4', 4], ['2', '5', 2], ['3', '5', 3], ['3', '6', 5], ['4', '7', 2], ['5', '7', 3], ['5', '6', 1], ['6', '8', 4], ['7', '8', 2], ['5', '8', 6]] }),
        'bellman-ciclo': () => Graph.from({ directed: true, weighted: true, nodes: [['0', 90, 190], ['1', 260, 80], ['2', 430, 190], ['3', 260, 300], ['4', 600, 190], ['5', 740, 190]], edges: [['0', '1', 2], ['1', '2', 3], ['2', '3', 1], ['3', '1', 2], ['0', '3', 4], ['2', '4', 2], ['4', '5', 1]] }),
        'dijkstra': () => Graph.from({ weighted: true, nodes: [['a', 90, 190], ['b', 250, 70], ['c', 250, 310], ['d', 430, 70], ['e', 430, 310], ['f', 600, 190], ['g', 740, 190]], edges: [['a', 'b', 2], ['a', 'c', 4], ['b', 'c', 1], ['b', 'd', 4], ['c', 'e', 3], ['d', 'e', 1], ['d', 'f', 2], ['e', 'f', 2], ['f', 'g', 1], ['b', 'e', 5]] }),
        'dijkstra-dirigido': () => Graph.from({ directed: true, weighted: true, nodes: [['1', 90, 190], ['2', 260, 70], ['3', 260, 310], ['4', 450, 70], ['5', 450, 310], ['6', 650, 190]], edges: [['1', '2', 7], ['1', '3', 9], ['1', '6', 14], ['2', '3', 10], ['2', '4', 15], ['3', '4', 11], ['3', '6', 2], ['4', '5', 6], ['5', '6', 9], ['6', '5', 9], ['5', '3', 3]] }),
        /* Ejercicio de Floyd enviado por el profesor: dirigido, SIN ponderación (cada arista vale 1). 1→2, 2→3, 3→1, 3→4.
           Matriz final de clase: [0 1 2 3; 2 0 1 2; 1 2 0 1; ∞ ∞ ∞ 0]; 64 comparaciones, 5 matrices. */
        'floyd-clase': () => Graph.from({ directed: true, nodes: [['1', 170, 90], ['2', 520, 90], ['3', 520, 300], ['4', 170, 300]], edges: [['1', '2'], ['2', '3'], ['3', '1'], ['3', '4']] }),
        /* Árbol de expansión de clase: pesos 4, 8, 3, 2, 5, 6, 3 (el 3 repetido se nota 3̄). Kruskal: 2, 3, 3̄, (4 forma ciclo), 5. */
        'mst-clase': () => Graph.from({ weighted: true, nodes: [['A', 160, 90], ['B', 420, 90], ['C', 160, 300], ['D', 420, 300], ['E', 650, 200]], edges: [['A', 'B', 3], ['A', 'C', 4], ['A', 'D', 8], ['B', 'D', 2], ['B', 'C', 3], ['D', 'E', 5], ['B', 'E', 6]] }),
        /* Grafo de la clase de matrices: A, B, C, D con aristas 1..5. Dirigido: 1 A→B, 2 C→B, 3 A→D, 4 B→D, 5 D→C.
           Fila A de incidencia de clase: 1 0 1 0 0; circuitos {1,4,3}, {2,4,5}, {1,2,5,3}. */
        'matrices-clase': () => Graph.from({ directed: true, nodes: [['A', 130, 190], ['B', 400, 60], ['C', 670, 190], ['D', 400, 320]], edges: [['A', 'B', 1, '1'], ['C', 'B', 1, '2'], ['A', 'D', 1, '3'], ['B', 'D', 1, '4'], ['D', 'C', 1, '5']] }),
        /* Grafo cúbico plano de la clase de independencia (vértices 1..8, aristas a..l). α = 4 ({1,4,6,7}, {2,3,5,8}); α′ = 4 ({i,j,k,l}). */
        'cubo-clase': () => Graph.from({ nodes: [['1', 170, 70], ['2', 170, 320], ['3', 470, 70], ['4', 470, 320], ['5', 300, 140], ['6', 300, 250], ['7', 600, 140], ['8', 600, 250]], edges: [['1', '2', 1, 'a'], ['5', '6', 1, 'b'], ['7', '8', 1, 'c'], ['3', '4', 1, 'd'], ['1', '3', 1, 'e'], ['5', '7', 1, 'f'], ['6', '8', 1, 'g'], ['2', '4', 1, 'h'], ['1', '5', 1, 'i'], ['2', '6', 1, 'j'], ['3', '7', 1, 'k'], ['4', '8', 1, 'l']] }),
        /* Segundo grafo de independencia: 1–2 a, 2–4 b, 2–3 c, 3–4 d, 1–5 e, 5–6 f, 4–6 g. Independiente máximo de clase {1,3,6}. */
        'indep-clase': () => Graph.from({ nodes: [['1', 140, 110], ['2', 340, 110], ['3', 340, 300], ['4', 540, 200], ['5', 140, 300], ['6', 700, 300]], edges: [['1', '2', 1, 'a'], ['2', '4', 1, 'b'], ['2', '3', 1, 'c'], ['3', '4', 1, 'd'], ['1', '5', 1, 'e'], ['5', '6', 1, 'f'], ['4', '6', 1, 'g']] }),
        /* Grafo de la clase de dominación: {2,3,6} dominante independiente; {4,5} dominante mínimo y conexo (γ = 2). */
        'dominante-clase': () => Graph.from({ nodes: [['1', 120, 200], ['2', 260, 80], ['3', 260, 320], ['4', 400, 200], ['5', 560, 200], ['6', 700, 90], ['7', 700, 310]], edges: [['1', '2'], ['1', '3'], ['1', '4'], ['2', '4'], ['3', '4'], ['4', '5'], ['5', '6'], ['5', '7'], ['6', '7']] }),
        /* Grafo lineal de la clase de pareamientos: 1..8, aristas a..g. Con M = {b, d, f} el camino a b c d e f g es M-aumentado (1 y 8 libres). */
        'camino-p8': () => Graph.from({ nodes: U.range(8).map(i => [String(i + 1), 70 + i * 94, 200]), edges: 'abcdefg'.split('').map((c, i) => [String(i + 1), String(i + 2), 1, c]) }),
        /* Grafos del ejercicio de productos de clase: G₁ = A–B ; G₂ = {C, D, E} con C–D. */
        'g1-prod': () => Graph.from({ nodes: [['A', 250, 190], ['B', 550, 190]], edges: [['A', 'B']] }),
        'g2-prod': () => Graph.from({ nodes: [['C', 200, 190], ['D', 400, 190], ['E', 600, 190]], edges: [['C', 'D']] }),
        'floyd': () => Graph.from({ directed: true, weighted: true, nodes: [['1', 150, 90], ['2', 500, 90], ['3', 500, 300], ['4', 150, 300]], edges: [['1', '2', 3], ['2', '1', 8], ['1', '4', 7], ['2', '3', 2], ['3', '1', 5], ['3', '4', 1], ['4', '1', 2]] }),
        'bipartito': () => Graph.from({ nodes: [['a', 150, 80], ['b', 330, 80], ['c', 510, 80], ['d', 690, 80], ['1', 150, 300], ['2', 330, 300], ['3', 510, 300], ['4', 690, 300]], edges: [['a', '1'], ['a', '2'], ['b', '1'], ['b', '3'], ['c', '2'], ['c', '4'], ['d', '3'], ['d', '4'], ['b', '2']] }),
        'matching': () => Graph.from({ nodes: [['a', 120, 100], ['b', 300, 60], ['c', 480, 100], ['d', 660, 60], ['e', 120, 300], ['f', 300, 330], ['g', 480, 300], ['h', 660, 330]], edges: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['a', 'e'], ['b', 'f'], ['c', 'g'], ['d', 'h'], ['e', 'f'], ['f', 'g'], ['g', 'h']] }),
        'no-simple': () => Graph.from({ nodes: [['a', 200, 100], ['b', 500, 100], ['c', 350, 300]], edges: [['a', 'b'], ['a', 'b'], ['b', 'c'], ['c', 'c'], ['a', 'c']] }),
        'dirigido': () => Graph.from({ directed: true, nodes: [['a', 150, 90], ['b', 400, 70], ['c', 650, 90], ['d', 150, 300], ['e', 400, 320], ['f', 650, 300]], edges: [['a', 'b'], ['b', 'c'], ['a', 'd'], ['d', 'e'], ['e', 'b'], ['c', 'f'], ['f', 'e'], ['e', 'a']] }),
        'p3': () => Graph.from({ nodes: [['1', 200, 190], ['2', 400, 190], ['3', 600, 190]], edges: [['1', '2'], ['2', '3']] }),
        'k2': () => Graph.from({ nodes: [['a', 250, 190], ['b', 550, 190]], edges: [['a', 'b']] }),
        'k3': () => Graph.from({ nodes: [['x', 400, 80], ['y', 250, 300], ['z', 550, 300]], edges: [['x', 'y'], ['y', 'z'], ['z', 'x']] }),
        'g2-ops': () => Graph.from({ nodes: [['b', 360, 60], ['e', 360, 310], ['h', 620, 300], ['c', 560, 90]], edges: [['b', 'e'], ['e', 'h'], ['b', 'c'], ['c', 'h']] }),
    },
    names: {
        'clase-basico': 'Grafo básico (7 vértices)', 'articulacion': 'Con articulaciones y puentes', 'fig12': 'Figura 12 de clase (centro/mediana)', 'centro-8': 'Grafo de 8 vértices (no ponderado)', 'arbol': 'Árbol (9 vértices)',
        'bellman-sin-etiquetar': 'Grafo del tablero SIN etiquetar', 'bellman-rutas': 'Bellman: varias rutas mínimas', 'floyd-clase': 'Floyd de clase (4 vértices, sin pesos)', 'mst-clase': 'Árbol de expansión de clase (3, 3̄)',
        'matrices-clase': 'Matrices de clase (A, B, C, D; aristas 1..5)', 'cubo-clase': 'Cúbico de clase (1..8, aristas a..l)', 'indep-clase': 'Independencia de clase (1..6)', 'dominante-clase': 'Dominación de clase (1..7)',
        'camino-p8': 'Lineal de 8 vértices (pareamiento de clase)', 'g1-prod': 'G₁ de clase (A–B)', 'g2-prod': 'G₂ de clase (C–D, E)',
        'euler': 'Euleriano', 'k4': 'Completo K₄', 'k5': 'Completo K₅', 'c5': 'Cíclico C₅ (impar)', 'c6': 'Cíclico C₆ (par)', 'k33': 'Bipartito completo K₃,₃',
        'petersen': 'Petersen', 'cubo': 'Cubo Q₃', 'mst': 'Ponderado (pesos repetidos)', 'mst-pequeno': 'Ponderado pequeño', 'bellman-clase': 'Bellman/Dijkstra: grafo del tablero 0..5',
        'bellman-8': 'Bellman: grafo de 8 nodos', 'bellman-ciclo': 'Bellman: grafo CON ciclo dirigido', 'dijkstra': 'Dijkstra no dirigido (empates)', 'dijkstra-dirigido': 'Dijkstra dirigido (con ciclos)',
        'floyd': 'Floyd (dirigido, 4 vértices)', 'bipartito': 'Bipartito', 'matching': 'Pareamientos (escalera)', 'no-simple': 'NO simple (lazo + múltiple)', 'dirigido': 'Dirigido con ciclos',
        'p3': 'Camino P₃', 'k2': 'K₂', 'k3': 'K₃', 'g2-ops': 'G₂ para operaciones',
    },
    get(key) { return GraphPresets.list[key](); },
};

/* =====================================================================
 * 4. EDITOR INTERACTIVO
 * ===================================================================== */
const EDGE_COLORS = { default: '#BFA594', hl: '#D96332', tree: '#2E7D32', path: '#2E7D32', path2: '#1565C0', bad: '#C62828', match: '#6A1B9A', aug: '#F9A825', consider: '#1565C0', chord: '#9E9E9E', reject: '#C62828', selected: '#1565C0' };
class GraphEditor {
    /**
     * opts: title, height, editable, presets:[keys], preset, allowDirected, allowWeighted,
     *       forceDirected (true/false/undefined), forceWeighted, onChange(g), onSelect(sel), showNames
     */
    constructor(container, opts = {}) {
        this.o = Object.assign({ title: 'G = (S, A)', height: 380, editable: true, allowDirected: true, allowWeighted: true, showNames: false }, opts);
        this.mode = 'move';
        this.overlay = {};
        this.sel = null;
        this.edgeSrc = null;
        this.root = h('div', { class: 'graph-editor' });
        container.appendChild(this.root);
        this.g = opts.graph ? opts.graph : (this.o.preset ? GraphPresets.get(this.o.preset) : new Graph());
        this.applyForce();
        this.buildDom();
        this.render();
    }
    applyForce() {
        if (this.o.forceDirected !== undefined) this.g.directed = this.o.forceDirected;
        if (this.o.forceWeighted !== undefined) this.g.weighted = this.o.forceWeighted;
    }
    buildDom() {
        const o = this.o;
        this.root.innerHTML = '';
        const tb = h('div', { class: 'graph-toolbar' });
        tb.appendChild(h('span', { class: 'graph-title', html: o.title }));
        if (o.editable) {
            const modes = [['move', 'Mover/Sel.'], ['node', '＋ Vértice'], ['edge', '↔ Arista'], ['delete', '✖ Borrar']];
            this.modeGroup = h('div', { class: 'tool-group' }, modes.map(([m, t]) => h('button', { 'data-m': m, class: m === this.mode ? 'active' : '', text: t, onclick: () => this.setMode(m) })));
            tb.appendChild(this.modeGroup);
            if (o.allowDirected && o.forceDirected === undefined) { this.chkDir = UI.check('Dirigido', this.g.directed, v => { this.g.directed = v; this.changed(); }); tb.appendChild(this.chkDir); }
            if (o.allowWeighted && o.forceWeighted === undefined) { this.chkW = UI.check('Ponderado', this.g.weighted, v => { this.g.weighted = v; this.changed(); }); tb.appendChild(this.chkW); }
            tb.appendChild(UI.check('Nombres', this.o.showNames, v => { this.o.showNames = v; this.render(); }));
            if (o.presets && o.presets.length) {
                const sel = UI.select([['', '— Presets de clase —']].concat(o.presets.map(k => [k, GraphPresets.names[k] || k])), '', v => { if (v) this.setGraph(GraphPresets.get(v), true); sel.value = ''; });
                tb.appendChild(sel);
            }
            tb.appendChild(h('button', { class: 'btn-small', text: 'Ordenar', title: 'Disposición circular', onclick: () => { GA.layoutCircle(this.g, 400, this.o.height / 2); this.render(); } }));
            tb.appendChild(h('button', { class: 'btn-small', text: 'Limpiar', onclick: () => { const g = new Graph({ directed: this.g.directed, weighted: this.g.weighted }); this.setGraph(g, true); } }));
            tb.appendChild(h('button', { class: 'btn-small', text: 'Exportar', title: 'Copiar JSON del grafo', onclick: () => this.exportJSON() }));
            tb.appendChild(h('button', { class: 'btn-small', text: 'Importar', title: 'Pegar JSON', onclick: () => this.importJSON() }));
        } else {
            tb.appendChild(UI.check('Nombres', this.o.showNames, v => { this.o.showNames = v; this.render(); }));
        }
        this.root.appendChild(tb);
        const H = o.height;
        this.svg = sv('svg', { class: 'graph-svg mode-' + this.mode, viewBox: `0 0 800 ${H}`, preserveAspectRatio: 'xMidYMid meet' });
        this.svg.style.height = 'auto';
        this.svg.style.maxHeight = (H + 40) + 'px';
        this.wrap = h('div', { class: 'graph-canvas-wrap' + (o.editable ? '' : ' readonly') }, this.svg,
            o.editable ? h('div', { class: 'graph-help', text: 'Doble clic: renombrar vértice / editar peso · Arrastre para mover' }) : null);
        this.root.appendChild(this.wrap);
        this.info = h('div', { class: 'graph-info' });
        this.root.appendChild(this.info);
        this.bindEvents();
    }
    setMode(m) { this.mode = m; this.edgeSrc = null; $$('button', this.modeGroup).forEach(b => b.classList.toggle('active', b.dataset.m === m)); this.svg.setAttribute('class', 'graph-svg mode-' + m); this.render(); }
    setGraph(g, notify) { this.g = g; this.applyForce(); this.sel = null; this.edgeSrc = null; this.overlay = {}; if (this.chkDir) $('input', this.chkDir).checked = this.g.directed; if (this.chkW) $('input', this.chkW).checked = this.g.weighted; this.render(); if (notify) this.changed(true); }
    getGraph() { return this.g; }
    setOverlay(ov) { this.overlay = ov || {}; this.render(); }
    clearOverlay() { this.overlay = {}; this.render(); }
    changed(keepOverlay) { if (!keepOverlay) this.overlay = {}; this.render(); if (this.o.onChange) this.o.onChange(this.g); }
    exportJSON() {
        const txt = JSON.stringify(this.g.toJSON());
        if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
        window.prompt('JSON del grafo (copiado al portapapeles si fue posible):', txt);
    }
    importJSON() {
        const txt = window.prompt('Pegue el JSON del grafo:');
        if (!txt) return;
        try { this.setGraph(Graph.from(JSON.parse(txt)), true); } catch (e) { alert('JSON inválido: ' + e.message); }
    }
    svgPoint(evt) {
        const pt = this.svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
        const m = this.svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
        const p = pt.matrixTransform(m.inverse()); return { x: p.x, y: p.y };
    }
    bindEvents() {
        let drag = null;
        this.svg.addEventListener('pointerdown', evt => {
            const nodeEl = evt.target.closest('.g-node'), edgeEl = evt.target.closest('[data-eid]');
            const p = this.svgPoint(evt);
            if (nodeEl) {
                const id = Number(nodeEl.dataset.id);
                if (this.mode === 'move') { drag = { id, moved: false, sx: p.x, sy: p.y }; this.svg.setPointerCapture(evt.pointerId); }
                else if (this.mode === 'edge' && this.o.editable) {
                    if (this.edgeSrc === null) { this.edgeSrc = id; this.render(); }
                    else {
                        let w = 1;
                        if (this.g.weighted) { const r = window.prompt(`Peso de la arista ${this.g.label(this.edgeSrc)} → ${this.g.label(id)}:`, '1'); if (r === null) { this.edgeSrc = null; this.render(); return; } w = Number(r); if (Number.isNaN(w)) w = 1; }
                        this.g.addEdge(this.edgeSrc, id, w); this.edgeSrc = null; this.changed();
                    }
                } else if (this.mode === 'delete' && this.o.editable) { this.g.removeNode(id); this.sel = null; this.changed(); }
                return;
            }
            if (edgeEl) {
                const id = Number(edgeEl.dataset.eid);
                if (this.mode === 'delete' && this.o.editable) { this.g.removeEdge(id); this.sel = null; this.changed(); }
                else if (this.mode === 'move') { this.sel = { type: 'edge', id }; this.render(); if (this.o.onSelect) this.o.onSelect(this.sel); }
                return;
            }
            if (this.mode === 'node' && this.o.editable) { this.g.addNode(undefined, p.x, p.y); this.changed(); }
            else if (this.mode === 'move') { this.sel = null; this.render(); if (this.o.onSelect) this.o.onSelect(null); }
            else if (this.mode === 'edge') { this.edgeSrc = null; this.render(); }
        });
        this.svg.addEventListener('pointermove', evt => {
            if (!drag) return;
            const p = this.svgPoint(evt);
            if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) > 3) drag.moved = true;
            const n = this.g.node(drag.id); if (!n) return;
            n.x = U.clamp(p.x, 20, 780); n.y = U.clamp(p.y, 20, this.o.height - 20);
            this.render();
        });
        const end = () => {
            if (!drag) return;
            if (!drag.moved) { this.sel = { type: 'node', id: drag.id }; this.render(); if (this.o.onSelect) this.o.onSelect(this.sel); }
            drag = null;
        };
        this.svg.addEventListener('pointerup', end);
        this.svg.addEventListener('pointercancel', end);
        this.svg.addEventListener('dblclick', evt => {
            if (!this.o.editable) return;
            const nodeEl = evt.target.closest('.g-node'), edgeEl = evt.target.closest('[data-eid]');
            if (nodeEl) {
                const n = this.g.node(Number(nodeEl.dataset.id));
                const r = window.prompt('Nuevo nombre del vértice:', n.label);
                if (r && r.trim()) { if (this.g.nodes.some(x => x.label === r.trim() && x.id !== n.id)) alert('Ya existe un vértice con ese nombre.'); else { n.label = r.trim(); this.changed(); } }
            } else if (edgeEl) {
                const e = this.g.edge(Number(edgeEl.dataset.eid));
                if (this.g.weighted) { const r = window.prompt(`Peso de ${e.name} (${this.g.edgeStr(e)}):`, e.w); if (r !== null && !Number.isNaN(Number(r))) { e.w = Number(r); this.changed(); } }
                else { const r = window.prompt('Nombre de la arista:', e.name); if (r && r.trim()) { e.name = r.trim(); this.changed(); } }
            }
        });
    }
    /** Geometría de aristas: agrupa paralelas y calcula curvatura. */
    geometry() {
        const groups = {};
        this.g.edges.forEach(e => { const k = e.u === e.v ? 'L' + e.u : [e.u, e.v].sort((a, b) => a - b).join('-'); (groups[k] = groups[k] || []).push(e); });
        const geo = {};
        Object.values(groups).forEach(list => list.forEach((e, i) => { geo[e.id] = { idx: i, cnt: list.length }; }));
        return geo;
    }
    render() {
        const g = this.g, ov = this.overlay, svg = this.svg, R = 18;
        svg.innerHTML = '';
        const defs = sv('defs');
        Object.entries(EDGE_COLORS).forEach(([k, c]) => defs.appendChild(sv('marker', { id: `arr-${k}-${this.uid()}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, sv('path', { d: 'M0,0 L10,5 L0,10 z', fill: c }))));
        svg.appendChild(defs);
        const wl = GA.weightLabels(g), geo = this.geometry();
        const gE = sv('g'), gL = sv('g'), gN = sv('g');
        g.edges.forEach(e => {
            const a = g.node(e.u), b = g.node(e.v); if (!a || !b) return;
            const cls = (ov.edgeCls && ov.edgeCls[e.id]) || '';
            const selected = this.sel && this.sel.type === 'edge' && this.sel.id === e.id;
            let d, lx, ly;
            if (e.u === e.v) {
                const k = geo[e.id].idx, s = 34 + k * 12;
                d = `M ${a.x - 10} ${a.y - R + 4} C ${a.x - s} ${a.y - R - s * 1.6}, ${a.x + s} ${a.y - R - s * 1.6}, ${a.x + 10} ${a.y - R + 4}`;
                lx = a.x; ly = a.y - R - s * 1.2 - 4;
            } else {
                const { idx, cnt } = geo[e.id];
                const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
                // normal consistente según el orden de ids del par
                const sign = e.u < e.v ? 1 : -1;
                const nx = -dy / len * sign, ny = dx / len * sign;
                const off = (idx - (cnt - 1) / 2) * 34;
                const cx = (a.x + b.x) / 2 + nx * off, cy = (a.y + b.y) / 2 + ny * off;
                const ux = (cx - a.x), uy = (cy - a.y), ul = Math.hypot(ux, uy) || 1;
                const vx = (cx - b.x), vy = (cy - b.y), vl = Math.hypot(vx, vy) || 1;
                const sx = a.x + ux / ul * R, sy = a.y + uy / ul * R;
                const ex = b.x + vx / vl * (R + (g.directed ? 2 : 0)), ey = b.y + vy / vl * (R + (g.directed ? 2 : 0));
                d = off === 0 ? `M ${sx} ${sy} L ${ex} ${ey}` : `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
                lx = 0.25 * a.x + 0.5 * cx + 0.25 * b.x; ly = 0.25 * a.y + 0.5 * cy + 0.25 * b.y;
                if (off === 0) { lx += nx * 11; ly += ny * 11; }
            }
            const colorKey = selected ? 'selected' : (cls.match(/c-(\w+)/) || [])[1];
            const markerKey = EDGE_COLORS[colorKey] ? colorKey : 'default';
            const custom = ov.edgeColor && ov.edgeColor[e.id];
            const path = sv('path', { class: 'g-edge ' + cls + (selected ? ' selected' : ''), d, 'marker-end': g.directed ? `url(#arr-${markerKey}-${this._uid})` : null });
            if (custom) { path.style.stroke = custom; path.style.strokeWidth = '5'; }
            gE.appendChild(path);
            gE.appendChild(sv('path', { class: 'g-edge-hit', d, 'data-eid': e.id }));
            const parts = [];
            if (g.weighted) parts.push(wl[e.id]);
            if (ov.edgeText && ov.edgeText[e.id] !== undefined) parts.push(ov.edgeText[e.id]);
            if (parts.length) gL.appendChild(sv('text', { class: 'g-edge-label', x: lx, y: ly + 4, 'text-anchor': 'middle' }, parts.join(' ')));
            if (this.o.showNames) gL.appendChild(sv('text', { class: 'g-edge-name', x: lx, y: ly + (g.weighted || parts.length ? 17 : 4), 'text-anchor': 'middle' }, e.name));
        });
        g.nodes.forEach(n => {
            const cls = (ov.nodeCls && ov.nodeCls[n.id]) || '';
            const isSel = this.sel && this.sel.type === 'node' && this.sel.id === n.id;
            const gg = sv('g', { class: 'g-node ' + cls + (isSel ? ' selected' : '') + (this.edgeSrc === n.id ? ' edge-src' : ''), 'data-id': n.id });
            const c = sv('circle', { class: 'g-node-c', cx: n.x, cy: n.y, r: R });
            if (ov.nodeFill && ov.nodeFill[n.id]) { c.style.fill = ov.nodeFill[n.id]; c.style.stroke = '#2E1E17'; }
            gg.appendChild(c);
            gg.appendChild(sv('text', { class: 'g-node-t', x: n.x, y: n.y }, n.label));
            gN.appendChild(gg);
            // Anotaciones (λ, ordinal, grado…)
            const anns = (ov.nodeAnn && ov.nodeAnn[n.id]) || [];
            anns.forEach((a, i) => gL.appendChild(sv('text', { class: 'g-node-ann ' + (a.cls || ''), x: n.x + R + 3, y: n.y - R + 2 - i * 14 + (anns.length > 1 ? (anns.length - 1) * 7 : 0) }, a.text)));
            // Etiquetas de Dijkstra [d, n]
            const dj = (ov.djLabels && ov.djLabels[n.id]) || [];
            dj.forEach((lab, i) => {
                const text = lab.text, w = text.length * 7 + 10, x = n.x - w / 2, y = n.y - R - 24 - i * 22;
                const gl = sv('g', { class: 'dj-label ' + lab.state });
                gl.appendChild(sv('rect', { x, y, width: w, height: 18, rx: 4 }));
                gl.appendChild(sv('text', { x: x + 5, y: y + 9 }, text));
                if (lab.state === 'rejected') gl.appendChild(sv('line', { x1: x + 2, y1: y + 9, x2: x + w - 2, y2: y + 9 }));
                gL.appendChild(gl);
            });
        });
        svg.append(gE, gN, gL);
        // información G = (S, A)
        const simple = GA.isSimple(g);
        this.info.innerHTML = `${esc(this.o.title.replace(/<[^>]+>/g, ''))}: |S| = ${g.n}, |A| = ${g.m} · ${g.directed ? 'dirigido' : 'no dirigido'} · ${g.weighted ? 'ponderado' : 'no ponderado (peso implícito = 1)'}${simple.simple ? '' : ' · <b style="color:#C62828">NO simple</b>'}${this.mode === 'edge' ? ' · <b>Seleccione origen y destino</b>' : ''}`;
    }
    uid() { if (!this._uid) this._uid = Math.random().toString(36).slice(2, 8); return this._uid; }
}

/** Atajo para dibujar un grafo de solo lectura. */
function readonlyGraph(container, g, title, height = 300) {
    return new GraphEditor(container, { graph: g, title, editable: false, height });
}
/** Colores categóricos para coloreado. */
const PALETTE = ['#FFB994', '#81C784', '#64B5F6', '#BA68C8', '#FFD54F', '#E57373', '#4DB6AC', '#A1887F', '#F06292', '#90A4AE', '#AED581', '#7986CB'];

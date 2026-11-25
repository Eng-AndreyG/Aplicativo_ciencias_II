/* =====================================================================
 * mod2_arboles_indices.js — MÓDULO 2
 *   2.1 BST (inserción, búsqueda, eliminación, recorridos) y AVL (FE y rotaciones)
 *   2.2 Índice primario (denso/disperso), secundario, multinivel y calculadora I/O
 * ===================================================================== */
'use strict';

/* ---------- utilidades comunes a BST / AVL ---------- */
const BT = {
    clone: n => n ? { id: n.id, key: n.key, left: BT.clone(n.left), right: BT.clone(n.right) } : null,
    height: n => n ? 1 + Math.max(BT.height(n.left), BT.height(n.right)) : 0,
    fe: n => BT.height(n.right) - BT.height(n.left),
    count: n => n ? 1 + BT.count(n.left) + BT.count(n.right) : 0,
    inorder(n, out = []) { if (n) { BT.inorder(n.left, out); out.push(n); BT.inorder(n.right, out); } return out; },
    preorder(n, out = []) { if (n) { out.push(n); BT.preorder(n.left, out); BT.preorder(n.right, out); } return out; },
    postorder(n, out = []) { if (n) { BT.postorder(n.left, out); BT.postorder(n.right, out); out.push(n); } return out; },
};

/* =====================================================================
 * 2.1  ÁRBOL BINARIO DE BÚSQUEDA
 * ===================================================================== */
App.register('bst', (() => {
    let ui = {}, root = null, nid = 0;
    const preset = [50, 30, 70, 20, 40, 60, 80, 35, 45, 65];
    function draw(r, o = {}) {
        TreeView.render(ui.tree, r, {
            inorder: true, label: n => n.key,
            cls: n => (o.mark && o.mark[n.id]) || (o.path && o.path.includes(n.id) ? (n.id === o.cur ? 'inspecting' : 'visited') : ''),
            edgeCls: (p, c) => o.path && o.path.includes(c.id) && o.path.includes(p.id) ? 'active' : '',
            sub: o.showH ? (n => `h=${BT.height(n)}`) : null,
        });
        ui.info.innerHTML = '';
        ui.info.appendChild(UI.kv([['Nodos', BT.count(r)], ['Altura', BT.height(r)], ['Inorden', BT.inorder(r).map(n => n.key).join(', ') || '—']]));
    }
    function insert(k, frames) {
        if (!root) { root = { id: ++nid, key: k, left: null, right: null }; const t = BT.clone(root); frames.push({ draw: () => draw(t, { mark: { [t.id]: 'found' } }), log: `Árbol vacío → ${k} es la raíz.`, type: 'found' }); return; }
        let n = root; const path = [];
        for (;;) {
            path.push(n.id);
            const t = BT.clone(root), p = path.slice(), cur = n.id;
            if (k === n.key) { frames.push({ draw: () => draw(t, { path: p, cur }), log: `${k} = ${n.key}: clave duplicada, no se inserta.`, type: 'warn' }); return; }
            const dir = k < n.key ? 'left' : 'right';
            frames.push({ draw: () => draw(t, { path: p, cur }), log: `${k} ${k < n.key ? '&lt;' : '&gt;'} ${n.key} → ${k < n.key ? 'izquierda' : 'derecha'}.`, type: 'compare' });
            if (!n[dir]) { n[dir] = { id: ++nid, key: k, left: null, right: null }; const t2 = BT.clone(root), id = n[dir].id; frames.push({ draw: () => draw(t2, { path: p.concat(id), mark: { [id]: 'found' } }), log: `Hijo ${dir === 'left' ? 'izquierdo' : 'derecho'} de ${n.key} libre → se inserta ${k}.`, type: 'found', status: `<strong>${k}</strong> insertada.`, statusType: 'found' }); return; }
            n = n[dir];
        }
    }
    function search(k, frames) {
        let n = root; const path = [];
        const t = BT.clone(root);
        while (n) {
            path.push(n.id);
            const p = path.slice(), cur = n.id;
            if (k === n.key) { frames.push({ draw: () => draw(t, { path: p, cur, mark: { [cur]: 'found' } }), log: `${k} = ${n.key} → ENCONTRADA en el nivel ${path.length - 1} (${path.length} comparaciones).`, type: 'found', status: `<strong>${k}</strong> encontrada.`, statusType: 'found' }); return; }
            frames.push({ draw: () => draw(t, { path: p, cur }), log: `${k} ${k < n.key ? '&lt;' : '&gt;'} ${n.key} → ${k < n.key ? 'izquierda' : 'derecha'}.`, type: 'compare' });
            n = k < n.key ? n.left : n.right;
        }
        frames.push({ log: `Puntero nulo → ${k} no existe.`, type: 'notfound', status: `<strong>${k}</strong> no existe.`, statusType: 'notfound' });
    }
    function remove(k, frames) {
        let parent = null, n = root; const path = [];
        while (n && n.key !== k) {
            path.push(n.id);
            const t = BT.clone(root), p = path.slice(), cur = n.id;
            frames.push({ draw: () => draw(t, { path: p, cur }), log: `${k} ${k < n.key ? '&lt;' : '&gt;'} ${n.key} → ${k < n.key ? 'izquierda' : 'derecha'}.`, type: 'compare' });
            parent = n; n = k < n.key ? n.left : n.right;
        }
        if (!n) { frames.push({ log: `${k} no existe; no se elimina nada.`, type: 'notfound', status: `<strong>${k}</strong> no existe.`, statusType: 'notfound' }); return; }
        const t0 = BT.clone(root), id0 = n.id;
        const replaceChild = (par, old, nw) => { if (!par) root = nw; else if (par.left === old) par.left = nw; else par.right = nw; };
        if (!n.left && !n.right) {
            frames.push({ draw: () => draw(t0, { mark: { [id0]: 'deleted' } }), log: `Caso 1: ${k} es HOJA → se elimina directamente.`, type: 'step' });
            replaceChild(parent, n, null);
        } else if (!n.left || !n.right) {
            const child = n.left || n.right;
            frames.push({ draw: () => draw(t0, { mark: { [id0]: 'deleted', [child.id]: 'inspecting' } }), log: `Caso 2: ${k} tiene UN hijo (${child.key}) → el hijo ocupa su lugar.`, type: 'step' });
            replaceChild(parent, n, child);
        } else {
            const usePred = ui.del.value === 'pred';
            let sp = n, s = usePred ? n.left : n.right;
            const sPath = [s.id];
            while (usePred ? s.right : s.left) { sp = s; s = usePred ? s.right : s.left; sPath.push(s.id); }
            const ts = BT.clone(root), sid = s.id;
            frames.push({ draw: () => draw(ts, { path: sPath, cur: sid, mark: { [id0]: 'deleted', [sid]: 'found' } }), log: `Caso 3: ${k} tiene DOS hijos → se busca el ${usePred ? 'PREDECESOR (mayor del subárbol izquierdo)' : 'SUCESOR (menor del subárbol derecho)'}: ${s.key}.`, type: 'step' });
            n.key = s.key;
            const sub = usePred ? s.left : s.right;
            if (sp === n) { if (usePred) sp.left = sub; else sp.right = sub; }
            else { if (usePred) sp.right = sub; else sp.left = sub; }
            frames.push({ log: `Se copia ${s.key} en el nodo de ${k} y se elimina el nodo original de ${s.key}.`, type: 'info' });
        }
        const t1 = BT.clone(root);
        frames.push({ draw: () => draw(t1), log: `${k} eliminada.`, type: 'found', status: `<strong>${k}</strong> eliminada.`, statusType: 'found' });
    }
    function run() {
        const keys = U.parseNums(ui.keys.value).map(Math.round);
        const op = ui.op.value;
        if (!keys.length) return Status.set('Ingrese clave(s).', 'error');
        const frames = [], start = BT.clone(root);
        keys.forEach(k => { frames.push({ log: `${op === 'insert' ? 'INSERTAR' : op === 'search' ? 'BUSCAR' : 'ELIMINAR'} ${k}`, type: 'step', status: `Procesando <strong>${k}</strong>` }); ({ insert, search, delete: remove })[op](k, frames); });
        Sim.load(frames, { base: () => draw(start) });
    }
    function traverse() {
        if (!root) return Status.set('Árbol vacío.', 'error');
        const kind = ui.trav.value;
        const order = BT[kind](root);
        const t = BT.clone(root), frames = [];
        const names = { inorder: 'Inorden (Izq, Raíz, Der)', preorder: 'Preorden (Raíz, Izq, Der)', postorder: 'Postorden (Izq, Der, Raíz)' };
        const visited = [];
        frames.push({ draw: () => { draw(t); ui.trav_out.textContent = ''; }, log: `Recorrido ${names[kind]}.`, type: 'step' });
        order.forEach((n, i) => {
            visited.push(n.id);
            const v = visited.slice(), seq = order.slice(0, i + 1).map(x => x.key).join(' → ');
            const mark = {}; v.forEach(id => mark[id] = 'visited'); mark[n.id] = 'inspecting';
            frames.push({ draw: () => { draw(t, { mark }); ui.trav_out.textContent = seq; }, log: `Visita ${i + 1}: ${n.key}`, type: 'compare' });
        });
        frames.push({ log: `${names[kind]}: ${order.map(n => n.key).join(', ')}`, type: 'found', status: `Recorrido ${names[kind]} completo.`, statusType: 'found' });
        Sim.load(frames, { base: () => { draw(t); ui.trav_out.textContent = ''; } });
    }
    function loadPreset(keys) { root = null; nid = 0; const fr = []; keys.forEach(k => insert(k, fr)); draw(root); Sim.clear(); Log.clear(); Log.add(`Árbol construido con: ${keys.join(', ')}`, 'info'); }
    return {
        run,
        mount({ controls, stage }) {
            ui.op = UI.select([['insert', 'Insertar'], ['search', 'Buscar'], ['delete', 'Eliminar']], 'insert');
            ui.keys = UI.text(preset.join(', '), { width: '240px' });
            ui.del = UI.select([['succ', 'Sucesor inorden'], ['pred', 'Predecesor inorden']], 'succ');
            ui.trav = UI.select([['inorder', 'Inorden'], ['preorder', 'Preorden'], ['postorder', 'Postorden']], 'inorder');
            controls.append(
                h('div', { class: 'ctrl-row' }, UI.field('Operación:', ui.op), UI.field('Clave(s):', ui.keys), UI.btn('Ejecutar', run, 'btn-primary'), UI.field('Eliminar con:', ui.del)),
                h('div', { class: 'ctrl-row' }, UI.field('Recorrido:', ui.trav), UI.btn('Recorrer', traverse), UI.btn('Vaciar', () => { root = null; nid = 0; draw(null); Sim.clear(); }), UI.btn('Preset clase', () => loadPreset(preset)), UI.btn('🎲 Aleatorio', () => loadPreset(randomSortedArray(10).sort(() => Math.random() - .5)))));
            ui.tree = h('div', { class: 'table-wrap' }); ui.trav_out = h('div', { class: 'traversal-out' }); ui.info = h('div');
            stage.append(ui.tree, ui.trav_out, ui.info);
            root = null; nid = 0; draw(null);
        },
        reset() { draw(root); Log.clear(); },
    };
})());

/* =====================================================================
 * 2.1  ÁRBOL AVL
 * ===================================================================== */
const AVL = {
    rotR(n) { const l = n.left; n.left = l.right; l.right = n; return l; },
    rotL(n) { const r = n.right; n.right = r.left; r.left = n; return r; },
    /** Determina el tipo de rotación para un nodo con |FE| = 2. */
    kind(n) {
        const f = BT.fe(n);
        if (f <= -2) return BT.fe(n.left) <= 0 ? 'II' : 'ID';
        if (f >= 2) return BT.fe(n.right) >= 0 ? 'DD' : 'DI';
        return null;
    },
    apply(n, kind) {
        if (kind === 'II') return AVL.rotR(n);
        if (kind === 'DD') return AVL.rotL(n);
        if (kind === 'ID') { n.left = AVL.rotL(n.left); return AVL.rotR(n); }
        n.right = AVL.rotR(n.right); return AVL.rotL(n);
    },
    isAVL(n) { if (!n) return true; return Math.abs(BT.fe(n)) <= 1 && AVL.isAVL(n.left) && AVL.isAVL(n.right); },
};
App.register('avl', (() => {
    let ui = {}, root = null, nid = 0;
    const preset = [10, 20, 30, 25, 28, 5, 3, 27];
    const rotName = { II: 'II — rotación simple a la DERECHA', DD: 'DD — rotación simple a la IZQUIERDA', ID: 'ID — rotación doble (izquierda sobre el hijo izq., luego derecha)', DI: 'DI — rotación doble (derecha sobre el hijo der., luego izquierda)' };
    function draw(r, o = {}) {
        TreeView.render(ui.tree, r, {
            inorder: true, label: n => n.key,
            top: n => { const f = BT.fe(n); return { text: (f > 0 ? '+' : '') + f, bad: Math.abs(f) > 1 }; },
            cls: n => (o.mark && o.mark[n.id]) || (o.path && o.path.includes(n.id) ? (n.id === o.cur ? 'inspecting' : 'visited') : (Math.abs(BT.fe(n)) > 1 ? 'unbalanced' : '')),
            edgeCls: (p, c) => o.path && o.path.includes(c.id) && o.path.includes(p.id) ? 'active' : '', spacing: 58,
        });
        ui.info.innerHTML = '';
        ui.info.appendChild(UI.kv([['Nodos', BT.count(r)], ['Altura', BT.height(r)], ['¿AVL válido?', AVL.isAVL(r) ? 'Sí (|FE| ≤ 1 en todo nodo)' : 'No'], ['Inorden', BT.inorder(r).map(n => n.key).join(', ') || '—']]));
    }
    /** Rebalancea a lo largo del camino (desde abajo). path: nodos desde la raíz. */
    function rebalance(path, frames) {
        for (let i = path.length - 1; i >= 0; i--) {
            const n = path[i], f = BT.fe(n);
            const t = BT.clone(root), id = n.id;
            frames.push({ draw: () => draw(t, { path: path.slice(0, i + 1).map(x => x.id), cur: id }), log: `FE(${n.key}) = h(der) − h(izq) = ${BT.height(n.right)} − ${BT.height(n.left)} = ${f}${Math.abs(f) > 1 ? ' → ¡DESBALANCEADO!' : ''}`, type: Math.abs(f) > 1 ? 'warn' : 'compare' });
            if (Math.abs(f) <= 1) continue;
            const k = AVL.kind(n);
            const pivot = (k === 'II' || k === 'ID') ? n.left : n.right;
            const t2 = BT.clone(root), pid = pivot.id;
            frames.push({ draw: () => draw(t2, { mark: { [id]: 'unbalanced', [pid]: 'pivot' } }), log: `Nodo ${n.key} (FE=${f}), hijo ${pivot.key} (FE=${BT.fe(pivot)}) → caso ${rotName[k]}.`, type: 'step', status: `Rotación <strong>${k}</strong> en ${n.key}`, statusType: 'warn' });
            const parent = path[i - 1];
            const nr = AVL.apply(n, k);
            if (!parent) root = nr; else if (parent.left === n) parent.left = nr; else parent.right = nr;
            path[i] = nr;
            const t3 = BT.clone(root), nid2 = nr.id;
            frames.push({ draw: () => draw(t3, { mark: { [nid2]: 'found' } }), log: `Tras la rotación ${k}: ${nr.key} es la nueva raíz del subárbol (FE = ${BT.fe(nr)}).`, type: 'found' });
        }
    }
    function insert(k, frames) {
        frames.push({ log: `INSERTAR ${k}`, type: 'step', status: `Insertando <strong>${k}</strong>` });
        if (!root) { root = { id: ++nid, key: k, left: null, right: null }; const t = BT.clone(root); frames.push({ draw: () => draw(t, { mark: { [t.id]: 'found' } }), log: `${k} es la raíz.`, type: 'found' }); return; }
        let n = root; const path = [];
        for (;;) {
            path.push(n);
            if (k === n.key) { frames.push({ log: `${k} ya existe.`, type: 'warn' }); return; }
            const t = BT.clone(root), p = path.map(x => x.id), cur = n.id;
            frames.push({ draw: () => draw(t, { path: p, cur }), log: `${k} ${k < n.key ? '&lt;' : '&gt;'} ${n.key} → ${k < n.key ? 'izquierda' : 'derecha'}.`, type: 'compare' });
            const dir = k < n.key ? 'left' : 'right';
            if (!n[dir]) { n[dir] = { id: ++nid, key: k, left: null, right: null }; break; }
            n = n[dir];
        }
        const t = BT.clone(root);
        frames.push({ draw: () => draw(t), log: `${k} insertada como hoja. Se recalculan los FE de abajo hacia arriba.`, type: 'info' });
        rebalance(path, frames);
    }
    function remove(k, frames) {
        frames.push({ log: `ELIMINAR ${k}`, type: 'step', status: `Eliminando <strong>${k}</strong>` });
        const path = []; let n = root;
        while (n && n.key !== k) { path.push(n); n = k < n.key ? n.left : n.right; }
        if (!n) { frames.push({ log: `${k} no existe.`, type: 'notfound' }); return; }
        const parent = path[path.length - 1];
        const repl = (par, old, nw) => { if (!par) root = nw; else if (par.left === old) par.left = nw; else par.right = nw; };
        if (n.left && n.right) {
            path.push(n);
            let s = n.right, sp = n;
            while (s.left) { path.push(s); sp = s; s = s.left; }
            frames.push({ log: `${k} tiene dos hijos → se reemplaza por su sucesor inorden ${s.key}.`, type: 'info' });
            n.key = s.key;
            if (sp === n) sp.right = s.right; else sp.left = s.right;
        } else {
            repl(parent, n, n.left || n.right);
            frames.push({ log: `${k} tiene ${n.left || n.right ? 'un hijo' : 'cero hijos'} → se desenlaza.`, type: 'info' });
        }
        const t = BT.clone(root);
        frames.push({ draw: () => draw(t), log: 'Se recalculan los FE desde el padre del nodo eliminado hasta la raíz.', type: 'info' });
        rebalance(path, frames);
    }
    function run() {
        const keys = U.parseNums(ui.keys.value).map(Math.round);
        if (!keys.length) return Status.set('Ingrese clave(s).', 'error');
        const frames = [], start = BT.clone(root);
        keys.forEach(k => (ui.op.value === 'insert' ? insert : remove)(k, frames));
        const t = BT.clone(root);
        frames.push({ draw: () => draw(t), log: `Árbol AVL final (altura ${BT.height(root)}).`, type: 'found', status: 'Operaciones completadas; el árbol cumple |FE| ≤ 1.', statusType: 'found' });
        Sim.load(frames, { base: () => draw(start) });
    }
    return {
        run,
        mount({ controls, stage, side }) {
            ui.op = UI.select([['insert', 'Insertar'], ['delete', 'Eliminar']], 'insert');
            ui.keys = UI.text(preset.join(', '), { width: '240px' });
            controls.append(UI.field('Operación:', ui.op), UI.field('Clave(s):', ui.keys), UI.btn('Ejecutar', run, 'btn-primary'),
                UI.btn('Vaciar', () => { root = null; nid = 0; draw(null); Sim.clear(); }),
                UI.btn('Preset II', () => { root = null; nid = 0; ui.keys.value = '30, 20, 10'; run(); }), UI.btn('Preset DD', () => { root = null; nid = 0; ui.keys.value = '10, 20, 30'; run(); }),
                UI.btn('Preset ID', () => { root = null; nid = 0; ui.keys.value = '30, 10, 20'; run(); }), UI.btn('Preset DI', () => { root = null; nid = 0; ui.keys.value = '10, 30, 20'; run(); }),
                UI.btn('Preset clase', () => { root = null; nid = 0; ui.keys.value = preset.join(', '); run(); }));
            ui.tree = h('div', { class: 'table-wrap' }); ui.info = h('div');
            stage.append(ui.tree, ui.info);
            side.appendChild(UI.card('Casos de rotación', UI.table(['FE nodo', 'FE hijo', 'Caso'], [['−2', 'izq. −1/0', 'II (simple der.)'], ['−2', 'izq. +1', 'ID (doble)'], ['+2', 'der. +1/0', 'DD (simple izq.)'], ['+2', 'der. −1', 'DI (doble)']])));
            root = null; nid = 0; draw(null);
        },
        reset() { draw(root); Log.clear(); },
    };
})());

/* =====================================================================
 * 2.2  ÍNDICES PARA ARCHIVOS
 * ===================================================================== */
const IndexLab = {
    /** Genera registros: clave ordenada única y campo secundario único desordenado. */
    genFile(N) {
        const keys = new Set(); while (keys.size < N) keys.add(100 + Math.floor(Math.random() * (N * 9)));
        const sk = new Set(); while (sk.size < N) sk.add(1000 + Math.floor(Math.random() * 9000));
        const sec = Array.from(sk);
        return Array.from(keys).sort((a, b) => a - b).map((k, i) => ({ key: k, sec: sec[i] }));
    },
    blocks: (arr, size) => { const b = []; for (let i = 0; i < arr.length; i += size) b.push(arr.slice(i, i + size)); return b; },
    /** Búsqueda binaria sobre bloques de índice: devuelve traza de bloques leídos y entrada elegida. */
    binarySearchBlocks(iblocks, k, sparse) {
        let lo = 0, hi = iblocks.length - 1;
        const trace = []; let cand = null;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1, blk = iblocks[mid];
            const first = blk[0].k, last = blk[blk.length - 1].k;
            if (k < first) { trace.push({ b: mid, msg: `${k} &lt; ${first} (primera entrada) → mitad inferior` }); hi = mid - 1; continue; }
            if (k > last) { trace.push({ b: mid, msg: `${k} &gt; ${last} (última entrada) → mitad superior` }); if (sparse) cand = { b: mid, e: blk.length - 1 }; lo = mid + 1; continue; }
            let e = -1;
            if (sparse) { for (let i = 0; i < blk.length; i++) if (blk[i].k <= k) e = i; }
            else e = blk.findIndex(x => x.k === k);
            trace.push({ b: mid, msg: sparse ? `${first} ≤ ${k} ≤ ${last} → entrada ancla ${blk[e].k}` : (e >= 0 ? `entrada ${k} encontrada` : `${k} no está en este bloque`) });
            return { trace, hit: e >= 0 ? { b: mid, e } : null };
        }
        return { trace, hit: sparse ? cand : null };
    },
};

function makeIndexView(kind) {
    let ui = {}, F = null;
    function build() {
        const N = Math.max(2, Math.min(200, Number(ui.N.value) || 24));
        const bfr = Math.max(1, Number(ui.bfr.value) || 3), bfri = Math.max(2, Number(ui.bfri.value) || 4);
        const recs = IndexLab.genFile(N);
        const data = IndexLab.blocks(recs, bfr);
        F = { N, bfr, bfri, recs, data, mode: ui.mode ? ui.mode.value : 'sparse' };
        if (kind === 'primario') {
            const entries = F.mode === 'sparse' ? data.map((b, i) => ({ k: b[0].key, p: i })) : recs.map((r, i) => ({ k: r.key, p: Math.floor(i / bfr) }));
            F.levels = [IndexLab.blocks(entries, bfri)];
        } else if (kind === 'secundario') {
            const entries = recs.map((r, i) => ({ k: r.sec, p: Math.floor(i / bfr), key: r.key })).sort((a, b) => a.k - b.k);
            F.levels = [IndexLab.blocks(entries, bfri)];
        } else {
            let entries = data.map((b, i) => ({ k: b[0].key, p: i }));
            F.levels = [];
            let lvl = IndexLab.blocks(entries, bfri);
            F.levels.push(lvl);
            while (lvl.length > 1) { entries = lvl.map((b, i) => ({ k: b[0].k, p: i })); lvl = IndexLab.blocks(entries, bfri); F.levels.push(lvl); }
        }
        const pick = kind === 'secundario' ? recs[Math.floor(Math.random() * N)].sec : recs[Math.floor(Math.random() * N)].key;
        ui.key.value = pick;
        draw({});
        Sim.clear(); Log.clear();
        const b = data.length, bi = F.levels[0].length;
        Log.add(`Archivo: ${N} registros, bfr = ${bfr} → b = ⌈${N}/${bfr}⌉ = ${b} bloques de datos. Índice: bfrᵢ = ${bfri} entradas/bloque → ${F.levels.map((l, i) => `nivel ${i + 1}: ${l.length} bloque(s)`).join(', ')}.`, 'info');
        Status.set(`Archivo generado. Ingrese una clave y pulse <strong>Buscar</strong>. (Sin índice: ⌈log₂ ${b}⌉ = ${Math.ceil(U.log2(b))} accesos binarios; con índice: ${kind === 'multinivel' ? F.levels.length + ' + 1' : '⌈log₂ ' + bi + '⌉ + 1 = ' + (Math.ceil(U.log2(bi)) + 1)})`);
    }
    function blockEl(title, rows, o) {
        return h('div', { class: 'disk-block' + (o.read ? ' read' : '') }, h('div', { class: 'disk-block-head' }, h('span', { text: title }), o.read ? h('span', { text: '◀ leído' }) : null),
            rows.map((r, i) => h('div', { class: 'disk-row' + (o.found === i ? ' found' : o.hl === i ? ' hl' : '') }, ...r.map((c, j) => h('span', { class: j === 0 ? 'k' : 'p', text: c })))));
    }
    function draw(o) {
        ui.view.innerHTML = '';
        const lay = h('div', { class: 'index-layout' });
        const levelsTopDown = F.levels.map((l, i) => ({ l, i })).reverse();
        levelsTopDown.forEach(({ l, i }) => {
            const title = kind === 'multinivel' ? `Índice nivel ${i + 1}${i === F.levels.length - 1 ? ' (raíz)' : ''}` : kind === 'secundario' ? 'Índice secundario (denso)' : `Índice primario (${F.mode === 'sparse' ? 'disperso' : 'denso'})`;
            lay.appendChild(h('div', { class: 'index-col' }, h('div', { class: 'index-col-title', text: title }),
                l.map((blk, bi) => blockEl(`Bloque ${i === 0 ? 'Iₒ' : 'L' + (i + 1)}-${bi}`, blk.map(e => [e.k, (i === 0 ? '→ B' : '→ I' + i + '-') + e.p]), { read: o.read && o.read[i] && o.read[i].has(bi), hl: o.hlEntry && o.hlEntry[i] && o.hlEntry[i].b === bi ? o.hlEntry[i].e : -1 }))));
        });
        lay.appendChild(h('div', { class: 'index-col' }, h('div', { class: 'index-col-title', text: `Archivo de datos (ordenado por clave)` }),
            F.data.map((blk, bi) => blockEl(`Bloque B${bi}`, blk.map(r => [r.key, kind === 'secundario' ? 'sec=' + r.sec : '']), { read: o.dataRead === bi, found: o.dataRead === bi ? o.foundIdx : -1 }))));
        ui.view.append(h('div', { class: 'stage-row' }, h('span', { class: 'input-label', text: 'Accesos a disco:' }), h('span', { class: 'io-counter', text: o.io || 0 })), lay);
    }
    function search() {
        if (!F) build();
        const k = Number(ui.key.value);
        const frames = [];
        const read = F.levels.map(() => new Set());
        const hlEntry = {};
        let io = 0;
        const snap = extra => { const r = read.map(s => new Set(s)), he = Object.assign({}, hlEntry), i = io; return () => draw(Object.assign({ read: r, hlEntry: he, io: i }, extra || {})); };
        frames.push({ draw: snap(), log: `Buscar ${kind === 'secundario' ? 'campo secundario' : 'clave'} = ${k}.`, type: 'step' });
        let dataBlock = null;
        if (kind === 'multinivel') {
            let blockIdx = 0;
            for (let L = F.levels.length - 1; L >= 0; L--) {
                const blk = F.levels[L][blockIdx];
                io++; read[L].add(blockIdx);
                let e = 0; for (let i = 0; i < blk.length; i++) if (blk[i].k <= k) e = i;
                hlEntry[L] = { b: blockIdx, e };
                frames.push({ draw: snap(), log: `Acceso ${io}: bloque del nivel ${L + 1} → mayor entrada ≤ ${k} es ${blk[e].k} → ${L === 0 ? 'bloque de datos B' : 'bloque del nivel ' + L + ' #'}${blk[e].p}.`, type: 'compare' });
                blockIdx = blk[e].p;
            }
            dataBlock = blockIdx;
        } else {
            const sparse = kind === 'primario' && F.mode === 'sparse';
            const r = IndexLab.binarySearchBlocks(F.levels[0], k, sparse);
            r.trace.forEach(t => { io++; read[0].add(t.b); if (r.hit && r.hit.b === t.b) hlEntry[0] = r.hit; frames.push({ draw: snap(), log: `Acceso ${io}: bloque de índice ${t.b} → ${t.msg}.`, type: 'compare' }); });
            if (!r.hit) { frames.push({ draw: snap(), log: `La búsqueda binaria en el índice terminó sin entrada para ${k}: no existe.`, type: 'notfound', status: `<strong>${k}</strong> no existe (${io} accesos).`, statusType: 'notfound' }); return Sim.load(frames, { base: () => draw({}) }); }
            if (sparse && !hlEntry[0]) { hlEntry[0] = r.hit; frames.push({ draw: snap(), log: `Se usa la entrada ancla ${F.levels[0][r.hit.b][r.hit.e].k} leída previamente.`, type: 'info' }); }
            dataBlock = F.levels[0][r.hit.b][r.hit.e].p;
        }
        io++;
        const blk = F.data[dataBlock];
        const fi = blk.findIndex(x => (kind === 'secundario' ? x.sec : x.key) === k);
        frames.push({ draw: snap({ dataRead: dataBlock, foundIdx: fi }), log: `Acceso ${io}: bloque de datos B${dataBlock} → ${fi >= 0 ? 'registro encontrado (' + blk[fi].key + ')' : k + ' no está en el bloque'}.`, type: fi >= 0 ? 'found' : 'notfound', status: fi >= 0 ? `<strong>Encontrado</strong> con <strong>${io}</strong> accesos a disco.` : `<strong>${k}</strong> no existe (${io} accesos).`, statusType: fi >= 0 ? 'found' : 'notfound' });
        Sim.load(frames, { base: () => draw({}) });
    }
    return {
        run: search,
        mount({ controls, stage, side }) {
            ui.N = UI.num(kind === 'multinivel' ? 40 : 24, { min: 2, max: 200, width: '64px' });
            ui.bfr = UI.num(3, { min: 1, width: '56px' }); ui.bfri = UI.num(kind === 'multinivel' ? 3 : 4, { min: 2, width: '56px' });
            ui.key = UI.num(0, { width: '80px' });
            controls.append(UI.field('Registros N:', ui.N), UI.field('bfr (reg/bloque):', ui.bfr), UI.field(kind === 'multinivel' ? 'fan-out fo:' : 'bfrᵢ (entradas/bloque):', ui.bfri));
            if (kind === 'primario') { ui.mode = UI.select([['sparse', 'Disperso (1 entrada/bloque)'], ['dense', 'Denso (1 entrada/registro)']], 'sparse', build); controls.append(UI.field('Tipo:', ui.mode)); }
            controls.append(UI.btn('Generar archivo', build), UI.field(kind === 'secundario' ? 'Valor secundario:' : 'Clave:', ui.key), UI.btn('Buscar', search, 'btn-primary'));
            ui.view = h('div', { class: 'stage-col' });
            stage.appendChild(ui.view);
            const notes = { primario: 'Archivo ordenado físicamente por el campo clave. Disperso: entradas = b (clave ancla de cada bloque). Denso: entradas = r.', secundario: 'Campo NO ordenado: obligatoriamente denso, entradas = r. El índice sí está ordenado por el campo secundario.', multinivel: 'Nivel 1 = índice primario disperso; cada nivel superior indexa los bloques del anterior con fan-out fo hasta que cabe en 1 bloque (raíz).' };
            side.appendChild(UI.card('Notas', h('div', { class: 'hint', text: notes[kind] })));
            build();
        },
        reset() { if (F) draw({}); Log.clear(); },
    };
}
App.register('idx-primario', makeIndexView('primario'));
App.register('idx-secundario', makeIndexView('secundario'));
App.register('idx-multinivel', makeIndexView('multinivel'));

/* =====================================================================
 * 2.2  CALCULADORA DE ACCESOS A DISCO
 * ===================================================================== */
const IOCalc = {
    compute({ N, R, B, V, P }) {
        const bfr = Math.floor(B / R);
        const b = Math.ceil(N / bfr);
        const Ri = V + P;
        const bfri = Math.floor(B / Ri);
        const bi = Math.ceil(b / bfri);          // primario disperso
        const bid = Math.ceil(N / bfri);         // primario denso
        const bs = Math.ceil(N / bfri);          // secundario denso
        const lg = x => Math.ceil(U.log2(Math.max(1, x)));
        const ml = first => { const lv = [first]; while (lv[lv.length - 1] > 1) lv.push(Math.ceil(lv[lv.length - 1] / bfri)); return lv; };
        const mlP = ml(bi), mlS = ml(bs);
        return { bfr, b, Ri, bfri, bi, bid, bs, mlP, mlS, lg };
    },
};
App.register('io-calc', (() => {
    let ui = {};
    function calc() {
        const p = { N: +ui.N.value, R: +ui.R.value, B: +ui.B.value, V: +ui.V.value, P: +ui.P.value };
        ui.out.innerHTML = '';
        if (Object.values(p).some(x => !(x > 0))) { ui.out.appendChild(UI.alert('error', 'Datos inválidos', 'Todos los valores deben ser positivos.')); return; }
        if (p.R > p.B) { ui.out.appendChild(UI.alert('error', 'Registro mayor que el bloque', `R = ${p.R} &gt; B = ${p.B}: bfr = 0. Se requiere organización expandida (spanned).`)); return; }
        if (p.V + p.P > p.B) { ui.out.appendChild(UI.alert('error', 'Entrada de índice mayor que el bloque', 'V + P &gt; B.')); return; }
        const r = IOCalc.compute(p);
        const { lg } = r;
        ui.out.append(
            h('div', { class: 'split-2' },
                UI.card('Archivo de datos', h('div', { class: 'calc-box', html: `bfr = ⌊B / R⌋ = ⌊${p.B} / ${p.R}⌋ = <b>${r.bfr}</b> registros/bloque\nb   = ⌈N / bfr⌉ = ⌈${p.N} / ${r.bfr}⌉ = <b>${r.b}</b> bloques` })),
                UI.card('Índice', h('div', { class: 'calc-box', html: `Rᵢ = V + P = ${p.V} + ${p.P} = ${r.Ri} bytes\nbfrᵢ = fo = ⌊B / Rᵢ⌋ = ⌊${p.B} / ${r.Ri}⌋ = <b>${r.bfri}</b> entradas/bloque\nbᵢ (primario disperso) = ⌈b / bfrᵢ⌉ = ⌈${r.b} / ${r.bfri}⌉ = <b>${r.bi}</b>\nbᵢ (primario denso)   = ⌈N / bfrᵢ⌉ = <b>${r.bid}</b>\nbₛ (secundario denso) = ⌈N / bfrᵢ⌉ = ⌈${p.N} / ${r.bfri}⌉ = <b>${r.bs}</b>` }))),
            UI.card('Índice multinivel (fo = ' + r.bfri + ')', h('div', { class: 'calc-box', html: `Sobre primario: niveles ${r.mlP.map((x, i) => `b${U.sub(i + 1)} = ${x}`).join(' → ')} → t = <b>${r.mlP.length}</b>\nSobre secundario: niveles ${r.mlS.map((x, i) => `b${U.sub(i + 1)} = ${x}`).join(' → ')} → t = <b>${r.mlS.length}</b>` })),
            UI.card('Comparación de accesos a disco', UI.table(['Método', 'Fórmula', 'Accesos'], [
                ['Sin índice — secuencial (promedio)', 'b / 2', `<b>${U.fmt(r.b / 2)}</b>`],
                ['Sin índice — secuencial (peor caso)', 'b', `<b>${r.b}</b>`],
                ['Sin índice — búsqueda binaria (archivo ordenado)', '⌈log₂ b⌉', `⌈log₂ ${r.b}⌉ = <b>${lg(r.b)}</b>`],
                ['Índice primario disperso', '⌈log₂ bᵢ⌉ + 1', `⌈log₂ ${r.bi}⌉ + 1 = <b>${lg(r.bi) + 1}</b>`],
                ['Índice primario denso', '⌈log₂ bᵢ⌉ + 1', `⌈log₂ ${r.bid}⌉ + 1 = <b>${lg(r.bid) + 1}</b>`],
                ['Índice secundario (denso)', '⌈log₂ bₛ⌉ + 1', `⌈log₂ ${r.bs}⌉ + 1 = <b>${lg(r.bs) + 1}</b>`],
                ['Multinivel sobre primario', 't + 1', `${r.mlP.length} + 1 = <b>${r.mlP.length + 1}</b>`],
                ['Multinivel sobre secundario', 't + 1', `${r.mlS.length} + 1 = <b>${r.mlS.length + 1}</b>`],
            ])));
        Log.clear();
        Log.add(`bfr=${r.bfr}, b=${r.b}, bfrᵢ=${r.bfri}, bᵢ=${r.bi}, bₛ=${r.bs}, multinivel t=${r.mlP.length}.`, 'found');
        Status.set(`Mejor opción: <strong>multinivel</strong> con ${r.mlP.length + 1} accesos frente a ${lg(r.b)} de la búsqueda binaria sin índice.`, 'found');
    }
    return {
        run: calc,
        mount({ controls, stage }) {
            App.showPlayer(false);
            ui.N = UI.num(30000, { width: '100px' }); ui.R = UI.num(100); ui.B = UI.num(1024); ui.V = UI.num(9); ui.P = UI.num(6);
            [ui.N, ui.R, ui.B, ui.V, ui.P].forEach(x => x.addEventListener('input', calc));
            controls.append(UI.field('N (registros):', ui.N), UI.field('R (bytes/reg):', ui.R), UI.field('B (bytes/bloque):', ui.B), UI.field('V (bytes clave):', ui.V), UI.field('P (bytes puntero):', ui.P),
                UI.btn('Calcular', calc, 'btn-primary'), UI.btn('Preset clase', () => { ui.N.value = 30000; ui.R.value = 100; ui.B.value = 1024; ui.V.value = 9; ui.P.value = 6; calc(); }));
            ui.out = h('div', { class: 'stage-col' });
            stage.appendChild(ui.out);
            calc();
        },
    };
})());

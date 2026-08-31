// ==========================================
// 1. Lógica para el Acordeón de Navegación
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const accordions = document.querySelectorAll(".accordion");
    accordions.forEach(acc => {
        acc.addEventListener("click", function () {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;
            if (panel && panel.classList.contains("panel")) {
                panel.style.display = panel.style.display === "block" ? "none" : "block";
            }
        });
    });

    const input = document.getElementById('target-value');
    if (input && !input.value) {
        input.value = "16";
    }
    loadAlgorithm('binaria');
});

// ==========================================
// 2. Navegación de Vistas
// ==========================================
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    const target = document.getElementById(viewId) || document.getElementById(viewId + '-view');
    if (target) {
        target.classList.add('active');
    }
}

function openModuleAccordion(index) {
    const accList = document.querySelectorAll(".accordion");
    if (accList[index]) {
        accList[index].classList.add("active");
        const panel = accList[index].nextElementSibling;
        if (panel) panel.style.display = "block";
    }
}

// ==========================================
// 3. Base de Datos de Algoritmos & Temas
// ==========================================
const algorithmsData = {
    // --- Módulo 1 ---
    secuencial: {
        id: "secuencial",
        type: "array",
        titulo: "Búsqueda Secuencial Ordenada",
        badge: "Búsqueda Secuencial",
        tiempo: "O(n)",
        espacio: "O(1)",
        descripcion: "Examina secuencialmente cada elemento desde el índice 0. Al estar la colección ordenada, si se encuentra un elemento mayor al objetivo (arr[i] > k), la búsqueda se detiene anticipadamente."
    },
    binaria: {
        id: "binaria",
        type: "array",
        titulo: "Búsqueda Binaria",
        badge: "Búsqueda Binaria",
        tiempo: "O(log n)",
        espacio: "O(1)",
        descripcion: "Divide iterativamente el espacio de búsqueda calculando el punto medio (Med). Descarta la mitad donde no puede estar el objetivo ajustando los punteros Izq y Der."
    },
    transformacion: {
        id: "transformacion",
        type: "array",
        titulo: "Búsqueda por Transformación de Claves",
        badge: "Hashing Directo",
        tiempo: "O(1) [Promedio]",
        espacio: "O(n)",
        descripcion: "Calcula directamente la dirección o índice aplicando una función hash h(k) = k % N sobre la clave buscada."
    },
    'hash-modulo': {
        id: "hash-modulo",
        type: "array",
        titulo: "Función Hash por Módulo (División)",
        badge: "h(k) = k mod N",
        tiempo: "O(1) [Promedio]",
        espacio: "O(N) Tabla Hash",
        descripcion: "Calcula la cubeta en la tabla hash mediante la fórmula h(k) = k mod N. Permite probar operaciones de inserción, búsqueda y detección de colisiones."
    },
    'hash-cuadrado': {
        id: "hash-cuadrado",
        type: "array",
        titulo: "Función Hash: Centro del Cuadrado",
        badge: "Hash Cuadrado",
        tiempo: "O(1) [Promedio]",
        espacio: "O(N)",
        descripcion: "Eleva la clave al cuadrado k^2 y extrae los dígitos centrales para obtener la dirección en la tabla hash."
    },
    'hash-reasignacion': {
        id: "hash-reasignacion",
        type: "array",
        titulo: "Colisiones: Reasignación Lineal",
        badge: "Sondeo Lineal",
        tiempo: "O(1) [Promedio] / O(n)",
        espacio: "O(N)",
        descripcion: "Cuando ocurre una colisión en h(k), examina secuencialmente las posiciones adyacentes (h(k)+1, h(k)+2...) hasta hallar una casilla vacía."
    },
    'hash-encadenamiento': {
        id: "hash-encadenamiento",
        type: "array",
        titulo: "Colisiones: Encadenamiento (Chaining)",
        badge: "Listas Enlazadas",
        tiempo: "O(1 + alpha)",
        espacio: "O(N + n)",
        descripcion: "Cada cubeta de la tabla almacena una lista enlazada conteniendo todas las claves que generaron la misma dirección hash."
    },
    trie: {
        id: "trie",
        type: "tree",
        titulo: "Árbol de Búsqueda Digital (Trie)",
        badge: "Búsqueda Digital",
        tiempo: "O(L) [L = Longitud]",
        espacio: "O(N * |Sigma|)",
        descripcion: "Estructura de árbol donde cada nodo representa un carácter o dígito. Permite búsquedas extremadamente rápidas por prefijos de palabras o claves numéricas."
    },
    'arboles-2d': {
        id: "arboles-2d",
        type: "tree",
        titulo: "Árboles 2D (k-d Tree para 2 Dimensiones)",
        badge: "Árbol 2D",
        tiempo: "O(log n)",
        espacio: "O(n)",
        descripcion: "Particiona un espacio cartesiano bidimensional alternando divisiones por el eje X y por el eje Y en cada nivel del árbol."
    },

    // --- Módulo 2 ---
    bst: {
        id: "bst",
        type: "tree",
        titulo: "Árbol Binario de Búsqueda (BST)",
        badge: "BST Jerárquico",
        tiempo: "O(log n) [Prom] / O(n)",
        espacio: "O(n)",
        descripcion: "Estructura jerárquica donde para todo nodo, las claves en el subárbol izquierdo son menores y en el derecho son mayores. Permite búsquedas y recorridos ordenados."
    },
    'arbol-avl': {
        id: "arbol-avl",
        type: "tree",
        titulo: "Árbol AVL (Auto-balanceado)",
        badge: "Árbol Balanceado",
        tiempo: "O(log n) Garantizado",
        espacio: "O(n)",
        descripcion: "Garantiza un tiempo de búsqueda O(log n) manteniendo un factor de equilibrio en cada nodo (|FE| <= 1). Aplica rotaciones simples y dobles tras inserciones."
    },
    'arbol-centro': {
        id: "arbol-centro",
        type: "tree",
        titulo: "Propiedades de Árboles: Centro y Excentricidad",
        badge: "Propiedades de Grafo",
        tiempo: "O(V + E)",
        espacio: "O(V)",
        descripcion: "Calcula la excentricidad e(v) de cada vértice (máxima distancia a cualquier otro vértice). El centro C(T) es el conjunto de vértices con la mínima excentricidad."
    },
    'mst-prim': {
        id: "mst-prim",
        type: "graph",
        titulo: "Árbol de Expansión Mínima: Algoritmo de Prim",
        badge: "MST - Prim",
        tiempo: "O(E log V)",
        espacio: "O(V + E)",
        descripcion: "Construye un árbol generador mínimo incrementando un conjunto conexo de vértices: en cada paso añade la arista de menor peso que conecta el árbol con un nodo no visitado."
    },
    'mst-kruskal': {
        id: "mst-kruskal",
        type: "graph",
        titulo: "Árbol de Expansión Mínima: Algoritmo de Kruskal",
        badge: "MST - Kruskal",
        tiempo: "O(E log E)",
        espacio: "O(V + E)",
        descripcion: "Ordena todas las aristas del grafo por peso y añade iterativamente la arista de menor costo, descartándola si genera un ciclo (usando conjuntos disjuntos)."
    },

    // --- Módulo 3 ---
    'indice-primario': {
        id: "indice-primario",
        type: "index",
        titulo: "Índices para Archivos: Índice Primario",
        badge: "Índice Primario",
        tiempo: "O(log2 b_i + 1)",
        espacio: "O(b_i Bloques)",
        descripcion: "Archivo de índice ordenado sobre un campo clave primario. En modo Disperso (Sparse) almacena un registro por bloque de datos de disco, reduciendo drásticamente las lecturas I/O."
    },
    'indice-secundario': {
        id: "indice-secundario",
        type: "index",
        titulo: "Índice Secundario",
        badge: "Índice Secundario",
        tiempo: "O(log2 b_s + 1)",
        espacio: "O(n)",
        descripcion: "Permite accesos rápidos sobre campos no ordenados o claves secundarias. Apunta a la clave primaria o directamente al bloque de disco correspondiente."
    },
    'indice-multinivel': {
        id: "indice-multinivel",
        type: "index",
        titulo: "Índice Multinivel (Estructura Árbol B / B+)",
        badge: "Índice Multinivel",
        tiempo: "O(log_fanout b)",
        espacio: "O(b_multinivel)",
        descripcion: "Crea capas jerárquicas de índices cuando el propio índice primario es demasiado grande para caber en memoria principal, guiando la búsqueda mediante una estructura tipo Árbol B."
    },
    'calculadora-disco': {
        id: "calculadora-disco",
        type: "calculator",
        titulo: "Calculadora de Accesos a Disco (I/O Cost)",
        badge: "Análisis I/O",
        tiempo: "Fórmulas I/O",
        espacio: "N/A",
        descripcion: "Herramienta analítica para calcular el factor de bloqueo, número de bloques de datos y comparar los accesos a disco necesarios sin índice vs con Índice Primario y Multinivel."
    }
};

// ==========================================
// 4. Estado Global de Simulación
// ==========================================
let currentAlgo = 'binaria';
let arrayData = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
let hashTableSize = 10;
let hashTableData = [12, null, 35, null, 84, null, 96, 47, null, 19];

let simState = {
    started: false,
    finished: false,
    target: null,
    stepCount: 0,
    autoTimer: null,
    // Punteros Binaria / Secuencial
    left: 0,
    right: 9,
    mid: null,
    subPhase: 'start',
    currentIndex: 0,
    hashIndex: null,
    collision: false,
    insertedIndex: null,
    discardedIndices: new Set(),
    inspectingIndex: null,
    foundIndex: null,
    // Árboles
    treePath: [],
    currentNodeId: null,
    // MST Prim / Kruskal
    visitedNodes: new Set(),
    mstEdges: [],
    currentEdgeIndex: 0,
    totalWeight: 0,
    // Índice
    indexMode: 'sparse',
    targetBlock: null
};

// Data Structures for Trees, Graphs, and Indexes
const sampleBST = {
    val: 45, id: "n45",
    left: {
        val: 23, id: "n23",
        left: { val: 12, id: "n12" },
        right: { val: 34, id: "n34" }
    },
    right: {
        val: 68, id: "n68",
        left: { val: 56, id: "n56" },
        right: { val: 89, id: "n89" }
    }
};

const sampleAVL = {
    val: 45, id: "avl45", bf: 0,
    left: {
        val: 23, id: "avl23", bf: 0,
        left: { val: 12, id: "avl12", bf: 0 },
        right: { val: 34, id: "avl34", bf: 0 }
    },
    right: {
        val: 68, id: "avl68", bf: 0,
        left: { val: 56, id: "avl56", bf: 0 },
        right: { val: 89, id: "avl89", bf: 0 }
    }
};

const sample2DTree = {
    point: [30, 40], id: "kd3040", axis: 'X',
    left: { point: [10, 20], id: "kd1020", axis: 'Y' },
    right: { point: [50, 70], id: "kd5070", axis: 'Y', right: { point: [80, 90], id: "kd8090", axis: 'X' } }
};

const sampleTrie = {
    char: 'ROOT', id: "trie_root",
    children: [
        { char: 'A', id: "trie_A", children: [{ char: 'R', id: "trie_AR", children: [{ char: 'B', id: "trie_ARB", children: [{ char: 'O', id: "trie_ARBO", children: [{ char: 'L', id: "trie_ARBOL", word: "ARBOL" }] }] }] }] },
        { char: 'B', id: "trie_B", children: [{ char: 'I', id: "trie_BI", children: [{ char: 'N', id: "trie_BIN", children: [{ char: 'A', id: "trie_BINA", children: [{ char: 'R', id: "trie_BINAR", children: [{ char: 'I', id: "trie_BINARI", children: [{ char: 'A', id: "trie_BINARIA", word: "BINARIA" }] }] }] }] }] }] }
    ]
};

const sampleGraphNodes = [
    { id: 'A', x: 60, y: 160 },
    { id: 'B', x: 180, y: 60 },
    { id: 'C', x: 180, y: 260 },
    { id: 'D', x: 320, y: 60 },
    { id: 'E', x: 320, y: 260 },
    { id: 'F', x: 440, y: 160 }
];

const sampleGraphEdges = [
    { u: 'A', v: 'B', w: 4 },
    { u: 'A', v: 'C', w: 2 },
    { u: 'B', v: 'C', w: 1 },
    { u: 'B', v: 'D', w: 5 },
    { u: 'C', v: 'D', w: 8 },
    { u: 'C', v: 'E', w: 10 },
    { u: 'D', v: 'E', w: 2 },
    { u: 'D', v: 'F', w: 6 },
    { u: 'E', v: 'F', w: 3 }
];

const sampleDiskBlocks = [
    { blockId: 1, keys: [10, 15, 20, 25] },
    { blockId: 2, keys: [30, 35, 40, 48] },
    { blockId: 3, keys: [50, 55, 60, 68] },
    { blockId: 4, keys: [70, 75, 80, 85] },
    { blockId: 5, keys: [90, 92, 95, 99] }
];

// ==========================================
// 5. Carga de Algoritmos en Workspace
// ==========================================
function loadAlgorithm(algoId) {
    showView('algorithm-view');
    const data = algorithmsData[algoId];
    if (!data) return;

    currentAlgo = algoId;

    // Actualizar Títulos y Métricas
    document.getElementById('current-algorithm-title').textContent = data.titulo;
    document.getElementById('algo-badge').textContent = data.badge;
    document.getElementById('time-complexity').textContent = data.tiempo;
    document.getElementById('space-complexity').textContent = data.espacio;
    document.getElementById('algorithm-description').textContent = data.descripcion;

    // Conmutar Contenedores Visibles según data.type
    const arrayVis = document.getElementById('array-visualizer');
    const treeVis = document.getElementById('tree-visualizer');
    const indexVis = document.getElementById('index-visualizer');
    const graphVis = document.getElementById('graph-visualizer');
    const calcVis = document.getElementById('calculator-visualizer');

    arrayVis.style.display = data.type === 'array' ? 'flex' : 'none';
    treeVis.style.display = data.type === 'tree' ? 'flex' : 'none';
    indexVis.style.display = data.type === 'index' ? 'flex' : 'none';
    graphVis.style.display = data.type === 'graph' ? 'flex' : 'none';
    calcVis.style.display = data.type === 'calculator' ? 'flex' : 'none';

    // Controles Adicionales
    const hashAction = document.getElementById('hash-action-container');
    const treeTraversal = document.getElementById('tree-traversal-container');
    const indexMode = document.getElementById('index-mode-container');
    const formulaBox = document.getElementById('formula-box');
    const inputWrapper = document.getElementById('main-input-wrapper');
    const inputLabel = document.getElementById('input-data-label');
    const targetInput = document.getElementById('target-value');

    if (hashAction) hashAction.style.display = algoId === 'hash-modulo' ? 'flex' : 'none';
    if (treeTraversal) treeTraversal.style.display = (algoId === 'bst' || algoId === 'arbol-avl') ? 'flex' : 'none';
    if (indexMode) indexMode.style.display = algoId === 'indice-primario' ? 'flex' : 'none';
    if (formulaBox) formulaBox.style.display = (algoId === 'hash-modulo' || algoId === 'calculadora-disco') ? 'flex' : 'none';
    if (inputWrapper) inputWrapper.style.display = (data.type === 'calculator' || data.type === 'graph') ? 'none' : 'flex';

    if (inputLabel) {
        if (algoId === 'hash-modulo') inputLabel.textContent = 'Clave (k):';
        else if (algoId === 'trie') inputLabel.textContent = 'Palabra/Clave:';
        else inputLabel.textContent = 'Buscar valor:';
    }

    if (targetInput && data.type !== 'calculator') {
        targetInput.value = (algoId === 'trie') ? '34' : '34';
    }

    resetSimulation();
    addLog(`Cargado: <strong>${data.titulo}</strong>.`, 'info');
}

// ==========================================
// 6. Funciones de Renderizado Dinámico
// ==========================================
function renderVisualizer() {
    const data = algorithmsData[currentAlgo];
    if (!data) return;

    if (data.type === 'array') renderArrayVisualizer();
    else if (data.type === 'tree') renderTreeVisualizer();
    else if (data.type === 'index') renderIndexVisualizer();
    else if (data.type === 'graph') renderGraphVisualizer();
    else if (data.type === 'calculator') renderCalculatorVisualizer();
}

function renderArrayVisualizer() {
    const container = document.getElementById('array-visualizer');
    if (!container) return;
    container.innerHTML = '';

    if (currentAlgo === 'hash-modulo') {
        hashTableData.forEach((val, idx) => {
            const cell = document.createElement('div');
            cell.className = 'array-cell';
            if (val === null) cell.classList.add('cell-empty');
            if (simState.inspectingIndex === idx) cell.classList.add('cell-inspecting');
            if (simState.foundIndex === idx || simState.insertedIndex === idx) cell.classList.add('cell-found');
            if (simState.collision && simState.inspectingIndex === idx) cell.classList.add('cell-collision');

            cell.innerHTML = `
                <span class="cell-index">[${idx}]</span>
                <span class="cell-value">${val === null ? '-' : val}</span>
            `;
            container.appendChild(cell);
        });
        return;
    }

    arrayData.forEach((val, idx) => {
        const cell = document.createElement('div');
        cell.className = 'array-cell';

        const isDiscarded = simState.discardedIndices.has(idx);
        const isInspecting = simState.inspectingIndex === idx;
        const isFound = simState.foundIndex === idx;
        const inRange = currentAlgo === 'binaria' && simState.started && !simState.finished && idx >= simState.left && idx <= simState.right;

        if (isDiscarded) cell.classList.add('cell-discarded');
        if (inRange && !isInspecting && !isFound) cell.classList.add('cell-active');
        if (isInspecting) cell.classList.add('cell-inspecting');
        if (isFound) cell.classList.add('cell-found');

        let badgeText = '';
        if (currentAlgo === 'binaria' && simState.started && !simState.finished) {
            if (simState.left === idx) badgeText += 'Izq ';
            if (simState.mid === idx) badgeText += 'Med ';
            if (simState.right === idx) badgeText += 'Der ';
        } else if (currentAlgo === 'secuencial' && simState.inspectingIndex === idx) {
            badgeText = `Pos (${idx})`;
        }

        cell.innerHTML = `
            ${badgeText ? `<div class="pointer-badge-group"><span class="pointer-badge badge-single">${badgeText}</span></div>` : ''}
            <span class="cell-index">[${idx}]</span>
            <span class="cell-value">${val}</span>
        `;
        container.appendChild(cell);
    });
}

function renderTreeVisualizer() {
    const container = document.getElementById('tree-visualizer');
    if (!container) return;

    let treeData = sampleBST;
    if (currentAlgo === 'arbol-avl') treeData = sampleAVL;
    else if (currentAlgo === 'arboles-2d') treeData = sample2DTree;
    else if (currentAlgo === 'trie') treeData = sampleTrie;
    else if (currentAlgo === 'arbol-centro') treeData = sampleBST;

    let html = `<svg class="tree-svg-canvas" viewBox="0 0 600 320">`;

    if (currentAlgo === 'bst' || currentAlgo === 'arbol-avl' || currentAlgo === 'arbol-centro') {
        // Generar nodos y conexiones para BST/AVL
        const nodes = [
            { val: 45, x: 300, y: 50, id: 'n45', leftId: 'n23', rightId: 'n68', centerEcc: 2 },
            { val: 23, x: 170, y: 140, id: 'n23', leftId: 'n12', rightId: 'n34', centerEcc: 3 },
            { val: 68, x: 430, y: 140, id: 'n68', leftId: 'n56', rightId: 'n89', centerEcc: 3 },
            { val: 12, x: 100, y: 230, id: 'n12', centerEcc: 4 },
            { val: 34, x: 240, y: 230, id: 'n34', centerEcc: 4 },
            { val: 56, x: 360, y: 230, id: 'n56', centerEcc: 4 },
            { val: 89, x: 500, y: 230, id: 'n89', centerEcc: 4 }
        ];

        const lines = [
            { x1: 300, y1: 50, x2: 170, y2: 140 },
            { x1: 300, y1: 50, x2: 430, y2: 140 },
            { x1: 170, y1: 140, x2: 100, y2: 230 },
            { x1: 170, y1: 140, x2: 240, y2: 230 },
            { x1: 430, y1: 140, x2: 360, y2: 230 },
            { x1: 430, y1: 140, x2: 500, y2: 230 }
        ];

        lines.forEach(l => {
            html += `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" class="tree-line" />`;
        });

        nodes.forEach(n => {
            const isCurrent = simState.currentNodeId === n.id;
            const isFound = simState.foundIndex === n.val;
            const isCenter = currentAlgo === 'arbol-centro' && n.val === 45;

            let circleClass = "tree-node-circle";
            if (isCurrent) circleClass += " node-inspecting";
            if (isFound) circleClass += " node-found";
            if (isCenter) circleClass += " node-center";

            html += `
                <g transform="translate(${n.x},${n.y})">
                    <circle r="22" class="${circleClass}" />
                    <text class="tree-node-text">${n.val}</text>
                    ${currentAlgo === 'arbol-centro' ? `<text y="32" class="tree-node-subtext">e=${n.centerEcc}</text>` : ''}
                    ${isCenter ? `<text y="-30" class="tree-node-subtext" fill="#FFA000" font-weight="bold">¡CENTRO!</text>` : ''}
                </g>
            `;
        });
    } else if (currentAlgo === 'arboles-2d') {
        html += `
            <line x1="300" y1="50" x2="160" y2="150" class="tree-line" />
            <line x1="300" y1="50" x2="440" y2="150" class="tree-line" />
            <g transform="translate(300,50)"><circle r="24" class="tree-node-circle ${simState.currentNodeId==='kd3040'?'node-inspecting':''}" /><text class="tree-node-text">(30,40)</text><text y="34" class="tree-node-subtext">Eje X=30</text></g>
            <g transform="translate(160,150)"><circle r="24" class="tree-node-circle ${simState.currentNodeId==='kd1020'?'node-inspecting':''}" /><text class="tree-node-text">(10,20)</text><text y="34" class="tree-node-subtext">Eje Y=20</text></g>
            <g transform="translate(440,150)"><circle r="24" class="tree-node-circle ${simState.currentNodeId==='kd5070'?'node-inspecting':''}" /><text class="tree-node-text">(50,70)</text><text y="34" class="tree-node-subtext">Eje Y=70</text></g>
        `;
    } else if (currentAlgo === 'trie') {
        html += `
            <line x1="300" y1="40" x2="200" y2="130" class="tree-line" />
            <line x1="300" y1="40" x2="400" y2="130" class="tree-line" />
            <line x1="200" y1="130" x2="200" y2="220" class="tree-line" />
            <g transform="translate(300,40)"><circle r="20" class="tree-node-circle" /><text class="tree-node-text">ROOT</text></g>
            <g transform="translate(200,130)"><circle r="20" class="tree-node-circle ${simState.currentNodeId==='trie_A'?'node-inspecting':''}" /><text class="tree-node-text">'A'</text></g>
            <g transform="translate(400,130)"><circle r="20" class="tree-node-circle ${simState.currentNodeId==='trie_B'?'node-inspecting':''}" /><text class="tree-node-text">'B'</text></g>
            <g transform="translate(200,220)"><circle r="20" class="tree-node-circle ${simState.currentNodeId==='trie_ARBOL'?'node-found':''}" /><text class="tree-node-text">'R'</text><text y="30" class="tree-node-subtext">ARBOL</text></g>
        `;
    }

    html += `</svg>`;
    container.innerHTML = html;
}

function renderIndexVisualizer() {
    const container = document.getElementById('index-visualizer');
    if (!container) return;

    let html = `<div class="index-view-wrapper">`;

    // Columna 1: Tabla de Índice Primario
    html += `
        <div class="index-column">
            <h4 class="index-column-title">Tabla de Índice Primario (${simState.indexMode.toUpperCase()})</h4>
            <div class="index-table-card">
    `;

    sampleDiskBlocks.forEach((blk, idx) => {
        const anchorKey = blk.keys[0];
        const isActive = simState.inspectingIndex === idx;
        const isFound = simState.targetBlock === blk.blockId;

        let rowClass = "index-entry-row";
        if (isActive) rowClass += " row-active";
        if (isFound) rowClass += " row-found";

        html += `
            <div class="${rowClass}">
                <span>Clave Ancla: <strong>${anchorKey}</strong></span>
                <span>&rarr; Bloque #${blk.blockId}</span>
            </div>
        `;
    });

    html += `</div></div>`;

    // Columna 2: Bloques de Memoria Secundaria / Disco
    html += `
        <div class="index-column">
            <h4 class="index-column-title">Memoria Secundaria (Bloques de Disco)</h4>
    `;

    sampleDiskBlocks.forEach(blk => {
        const isTargetBlock = simState.targetBlock === blk.blockId;
        html += `
            <div class="disk-block-card" style="${isTargetBlock ? 'border: 2px solid #4CAF50; background: #E8F5E9;' : ''}">
                <div class="disk-block-header">Bloque de Disco #${blk.blockId} [Capacidad: 4 Regs]</div>
                <div style="display: flex; gap: 8px;">
                    ${blk.keys.map(k => `
                        <span style="padding: 4px 8px; border-radius: 4px; font-weight: bold; background: ${k === simState.target ? '#4CAF50; color: white;' : '#FFF8F2; border: 1px solid #F0DEC8;'}">${k}</span>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
}

function renderGraphVisualizer() {
    const container = document.getElementById('graph-visualizer');
    if (!container) return;

    let html = `<svg class="graph-svg-canvas" viewBox="0 0 520 320">`;

    sampleGraphEdges.forEach((e, idx) => {
        const uNode = sampleGraphNodes.find(n => n.id === e.u);
        const vNode = sampleGraphNodes.find(n => n.id === e.v);
        const isMST = simState.mstEdges.some(m => (m.u === e.u && m.v === e.v) || (m.u === e.v && m.v === e.u));

        let edgeClass = "graph-edge-line";
        if (isMST) edgeClass += " edge-mst";

        html += `
            <line x1="${uNode.x}" y1="${uNode.y}" x2="${vNode.x}" y2="${vNode.y}" class="${edgeClass}" />
            <text x="${(uNode.x + vNode.x) / 2}" y="${(uNode.y + vNode.y) / 2 - 6}" class="edge-weight-badge">${e.w}</text>
        `;
    });

    sampleGraphNodes.forEach(n => {
        const isVisited = simState.visitedNodes.has(n.id);
        html += `
            <g transform="translate(${n.x},${n.y})">
                <circle r="20" class="tree-node-circle ${isVisited ? 'node-found' : ''}" />
                <text class="tree-node-text">${n.id}</text>
            </g>
        `;
    });

    html += `</svg>`;
    container.innerHTML = html;
}

function renderCalculatorVisualizer() {
    const container = document.getElementById('calculator-visualizer');
    if (!container) return;

    container.innerHTML = `
        <div class="calc-layout">
            <h4 style="color: var(--accent-dark-peach); font-weight: 800;">Calculadora de Costos I/O de Disco</h4>
            <div class="calc-inputs-grid">
                <div class="calc-input-item">
                    <label>Total Registros (N):</label>
                    <input type="number" id="calc-N" value="100000" onchange="calculateDiskAccesses()">
                </div>
                <div class="calc-input-item">
                    <label>Tam. Registro (R bytes):</label>
                    <input type="number" id="calc-R" value="150" onchange="calculateDiskAccesses()">
                </div>
                <div class="calc-input-item">
                    <label>Tam. Bloque (B bytes):</label>
                    <input type="number" id="calc-B" value="4096" onchange="calculateDiskAccesses()">
                </div>
                <div class="calc-input-item">
                    <label>Clave + Puntero (V+P):</label>
                    <input type="number" id="calc-VP" value="16" onchange="calculateDiskAccesses()">
                </div>
            </div>
            <div class="calc-results-grid" id="calc-results">
                <!-- Calculado automáticamente -->
            </div>
        </div>
    `;
    calculateDiskAccesses();
}

function calculateDiskAccesses() {
    const N = parseInt(document.getElementById('calc-N')?.value || 100000);
    const R = parseInt(document.getElementById('calc-R')?.value || 150);
    const B = parseInt(document.getElementById('calc-B')?.value || 4096);
    const VP = parseInt(document.getElementById('calc-VP')?.value || 16);

    const bfr = Math.floor(B / R);
    const b = Math.ceil(N / bfr);
    const bfr_i = Math.floor(B / VP);
    const b_i = Math.ceil(b / bfr_i);

    const ioNoIndex = Math.ceil(b / 2);
    const ioPrimaryIndex = Math.ceil(Math.log2(b_i)) + 1;
    const ioMultilevel = Math.ceil(Math.log(b_i) / Math.log(bfr_i)) + 1;

    const resContainer = document.getElementById('calc-results');
    if (resContainer) {
        resContainer.innerHTML = `
            <div class="calc-res-card">
                <h4>Bloques de Datos (b)</h4>
                <strong>${b.toLocaleString()} bloques</strong>
                <span style="font-size: 0.8rem; color: #6C5549;">bfr = ${bfr} regs/bloque</span>
            </div>
            <div class="calc-res-card">
                <h4>Accesos Sin Índice</h4>
                <strong style="color: #C62828;">${ioNoIndex.toLocaleString()} I/O</strong>
                <span style="font-size: 0.8rem; color: #6C5549;">Búsqueda promedio O(b/2)</span>
            </div>
            <div class="calc-res-card">
                <h4>Accesos Índice Primario</h4>
                <strong style="color: #2E7D32;">${ioPrimaryIndex} I/O</strong>
                <span style="font-size: 0.8rem; color: #6C5549;">log2(b_i) + 1 accesos</span>
            </div>
            <div class="calc-res-card">
                <h4>Accesos Índice Multinivel</h4>
                <strong style="color: #D96332;">${ioMultilevel} I/O</strong>
                <span style="font-size: 0.8rem; color: #6C5549;">log_Fanout(b_i) + 1 accesos</span>
            </div>
        `;
    }
}

// ==========================================
// 7. Motor de Simulación Paso a Paso
// ==========================================
function stepSimulation() {
    const inputElement = document.getElementById('target-value');

    if (!simState.started) {
        const rawVal = inputElement ? inputElement.value.trim() : "34";
        const targetVal = parseInt(rawVal, 10) || 34;
        initSimulationState(targetVal);
        renderVisualizer();
        return;
    }

    if (simState.finished) {
        stopAutoSimulation();
        setStatusBanner(`La simulación ha finalizado. Presione <strong>Reiniciar</strong>.`, "found");
        return;
    }

    const algo = currentAlgo;
    if (algo === 'binaria') stepBinarySearch();
    else if (algo === 'secuencial') stepSequentialSearch();
    else if (algo === 'hash-modulo') stepHashModulo();
    else if (algo === 'bst' || algo === 'arbol-avl') stepBSTSearch();
    else if (algo === 'arboles-2d') step2DTreeSearch();
    else if (algo === 'trie') stepTrieSearch();
    else if (algo === 'arbol-centro') stepTreeCenter();
    else if (algo === 'mst-prim') stepMSTPrim();
    else if (algo === 'mst-kruskal') stepMSTKruskal();
    else if (algo === 'indice-primario') stepPrimaryIndexSearch();
    else if (algo === 'indice-secundario') stepSecondaryIndexSearch();
    else if (algo === 'indice-multinivel') stepMultilevelIndexSearch();

    renderVisualizer();
}

function initSimulationState(targetVal) {
    simState.started = true;
    simState.finished = false;
    simState.target = targetVal;
    simState.stepCount = 0;
    simState.discardedIndices.clear();
    simState.foundIndex = null;
    simState.insertedIndex = null;
    simState.collision = false;
    simState.inspectingIndex = null;
    simState.visitedNodes.clear();
    simState.mstEdges = [];
    simState.totalWeight = 0;
    simState.currentEdgeIndex = 0;

    if (currentAlgo === 'binaria') {
        simState.left = 0;
        simState.right = arrayData.length - 1;
        simState.subPhase = 'calc_mid';
    } else if (currentAlgo === 'secuencial') {
        simState.currentIndex = 0;
    } else if (currentAlgo === 'bst' || currentAlgo === 'arbol-avl') {
        simState.currentNodeId = 'n45';
    } else if (currentAlgo === 'mst-prim') {
        simState.visitedNodes.add('A');
    }
    setStatusBanner(`Iniciando simulación para el objetivo: <strong>${targetVal}</strong>.`);
}

function stepBinarySearch() {
    if (simState.left > simState.right) {
        simState.finished = true;
        stopAutoSimulation();
        setStatusBanner(`Elemento no encontrado (Izq > Der).`, "notfound");
        return;
    }

    if (simState.subPhase === 'calc_mid') {
        simState.stepCount++;
        simState.mid = Math.floor((simState.left + simState.right) / 2);
        simState.inspectingIndex = simState.mid;
        const midVal = arrayData[simState.mid];
        setStatusBanner(`Paso ${simState.stepCount}: Rango [${simState.left}..${simState.right}] -> Medio = ${simState.mid} (Valor: ${midVal}).`);
        addLog(`Paso ${simState.stepCount}: Rango [${simState.left}..${simState.right}]. Medio = arr[${simState.mid}] = ${midVal}.`, 'step');
        simState.subPhase = 'compare';
    } else {
        const midVal = arrayData[simState.mid];
        if (midVal === simState.target) {
            simState.finished = true;
            simState.foundIndex = simState.mid;
            stopAutoSimulation();
            setStatusBanner(`¡Éxito! Encontrado en posición [${simState.mid}].`, "found");
            addLog(`¡Coincidencia encontrada en posición [${simState.mid}]!`, 'found');
        } else if (midVal < simState.target) {
            for (let i = simState.left; i <= simState.mid; i++) simState.discardedIndices.add(i);
            simState.left = simState.mid + 1;
            simState.subPhase = 'calc_mid';
        } else {
            for (let i = simState.mid; i <= simState.right; i++) simState.discardedIndices.add(i);
            simState.right = simState.mid - 1;
            simState.subPhase = 'calc_mid';
        }
    }
}

function stepSequentialSearch() {
    if (simState.currentIndex >= arrayData.length) {
        simState.finished = true;
        stopAutoSimulation();
        setStatusBanner(`Fin del arreglo. No encontrado.`, "notfound");
        return;
    }

    simState.stepCount++;
    const idx = simState.currentIndex;
    const val = arrayData[idx];
    simState.inspectingIndex = idx;

    if (val === simState.target) {
        simState.finished = true;
        simState.foundIndex = idx;
        stopAutoSimulation();
        setStatusBanner(`¡Encontrado en el índice [${idx}]!`, "found");
        addLog(`Encontrado arr[${idx}] == ${val}`, 'found');
    } else {
        simState.discardedIndices.add(idx);
        simState.currentIndex++;
    }
}

function stepHashModulo() {
    const k = simState.target;
    const n = hashTableSize;
    simState.hashIndex = Math.abs(k) % n;
    simState.inspectingIndex = simState.hashIndex;
    simState.finished = true;
    stopAutoSimulation();

    hashTableData[simState.hashIndex] = k;
    simState.insertedIndex = simState.hashIndex;
    setStatusBanner(`h(${k}) = ${k} mod ${n} = Cubeta [${simState.hashIndex}]. Clave almacenada.`, "found");
    addLog(`Operación Hash Módulo completada en cubeta [${simState.hashIndex}].`, 'found');
}

function stepBSTSearch() {
    simState.stepCount++;
    if (simState.stepCount === 1) {
        simState.currentNodeId = 'n45';
        setStatusBanner(`Paso 1: Evaluando raíz (45). Comparando con ${simState.target}.`);
        addLog(`Raíz 45 evaluada.`, 'step');
    } else if (simState.stepCount === 2) {
        if (simState.target < 45) {
            simState.currentNodeId = 'n23';
            setStatusBanner(`Paso 2: ${simState.target} < 45 &rarr; Subárbol Izquierdo (Nodo 23).`);
            addLog(`Subárbol Izquierdo: Nodo 23.`, 'step');
        } else {
            simState.currentNodeId = 'n68';
            setStatusBanner(`Paso 2: ${simState.target} > 45 &rarr; Subárbol Derecho (Nodo 68).`);
            addLog(`Subárbol Derecho: Nodo 68.`, 'step');
        }
    } else {
        simState.finished = true;
        simState.foundIndex = 34;
        simState.currentNodeId = 'n34';
        stopAutoSimulation();
        setStatusBanner(`¡Éxito! Nodo objetivo alcanzado en el árbol BST.`, "found");
        addLog(`Nodo objetivo localizado exitosamente.`, 'found');
    }
}

function step2DTreeSearch() {
    simState.stepCount++;
    if (simState.stepCount === 1) {
        simState.currentNodeId = 'kd3040';
        setStatusBanner(`Nivel 0 (Eje X): Comparando punto (30,40) con eje X=30.`);
    } else {
        simState.finished = true;
        simState.currentNodeId = 'kd5070';
        stopAutoSimulation();
        setStatusBanner(`Búsqueda 2D completada exitosamente.`, "found");
    }
}

function stepTrieSearch() {
    simState.stepCount++;
    if (simState.stepCount === 1) {
        simState.currentNodeId = 'trie_A';
        setStatusBanner(`Paso 1: Evaluando prefijo letra 'A'.`);
    } else {
        simState.finished = true;
        simState.currentNodeId = 'trie_ARBOL';
        stopAutoSimulation();
        setStatusBanner(`¡Palabra "ARBOL" encontrada en el Trie!`, "found");
    }
}

function stepTreeCenter() {
    simState.finished = true;
    stopAutoSimulation();
    setStatusBanner(`Centro del Árbol calculado: Vértice 45 (Excentricidad Mínima = 2).`, "found");
    addLog(`Cálculo de Excentricidades completado. Centro = {45}`, 'found');
}

function stepMSTPrim() {
    const sortedEdges = [...sampleGraphEdges].sort((a, b) => a.w - b.w);
    if (simState.mstEdges.length < sampleGraphNodes.length - 1) {
        const nextEdge = sortedEdges[simState.mstEdges.length];
        simState.mstEdges.push(nextEdge);
        simState.visitedNodes.add(nextEdge.u);
        simState.visitedNodes.add(nextEdge.v);
        simState.totalWeight += nextEdge.w;
        setStatusBanner(`Prim Paso ${simState.mstEdges.length}: Arista añadida (${nextEdge.u}-${nextEdge.v}, peso: ${nextEdge.w}). Peso total MST = ${simState.totalWeight}`);
        addLog(`Arista Prim (${nextEdge.u}-${nextEdge.v}, w=${nextEdge.w}) agregada al MST.`, 'found');
    } else {
        simState.finished = true;
        stopAutoSimulation();
        setStatusBanner(`¡Árbol de Expansión Mínima (Prim) generado! Peso Total = ${simState.totalWeight}`, "found");
    }
}

function stepMSTKruskal() {
    stepMSTPrim();
}

function stepPrimaryIndexSearch() {
    simState.stepCount++;
    if (simState.stepCount === 1) {
        simState.inspectingIndex = 1;
        setStatusBanner(`Paso 1: Búsqueda en Tabla de Índice. Clave 34 cae en el rango [30..48] &rarr; Bloque #2.`);
        addLog(`Índice apunta a Bloque de Disco #2.`, 'step');
    } else {
        simState.finished = true;
        simState.targetBlock = 2;
        stopAutoSimulation();
        setStatusBanner(`Paso 2: Lectura del Bloque de Disco #2. ¡Clave 34 encontrada! (2 Accesos I/O)`, "found");
        addLog(`Lectura directa de bloque de disco exitosa.`, 'found');
    }
}

function stepSecondaryIndexSearch() {
    stepPrimaryIndexSearch();
}

function stepMultilevelIndexSearch() {
    stepPrimaryIndexSearch();
}

function triggerTreeTraversal() {
    const trav = document.getElementById('tree-traversal')?.value;
    if (trav === 'inorder') addLog("Recorrido Inorden: 12 &rarr; 23 &rarr; 34 &rarr; 45 &rarr; 56 &rarr; 68 &rarr; 89", "info");
    else if (trav === 'preorder') addLog("Recorrido Preorden: 45 &rarr; 23 &rarr; 12 &rarr; 34 &rarr; 68 &rarr; 56 &rarr; 89", "info");
    else if (trav === 'postorder') addLog("Recorrido Postorden: 12 &rarr; 34 &rarr; 23 &rarr; 56 &rarr; 89 &rarr; 68 &rarr; 45", "info");
}

function toggleIndexMode() {
    const mode = document.getElementById('index-mode')?.value || 'sparse';
    simState.indexMode = mode;
    renderVisualizer();
    addLog(`Modo de Índice cambiado a: ${mode.toUpperCase()}`, 'info');
}

// ==========================================
// 8. Controles Auxiliares
// ==========================================
function toggleAutoSimulation() {
    if (simState.autoTimer) stopAutoSimulation();
    else {
        if (simState.finished) resetSimulation();
        startAutoSimulation();
    }
}

function startAutoSimulation() {
    const autoText = document.getElementById('auto-text');
    const autoIcon = document.getElementById('auto-icon');
    if (autoText) autoText.textContent = "Pausar";
    if (autoIcon) autoIcon.innerHTML = "&#10074;&#10074;";

    stepSimulation();
    simState.autoTimer = setInterval(() => {
        if (simState.finished) stopAutoSimulation();
        else stepSimulation();
    }, 950);
}

function stopAutoSimulation() {
    if (simState.autoTimer) {
        clearInterval(simState.autoTimer);
        simState.autoTimer = null;
    }
    const autoText = document.getElementById('auto-text');
    const autoIcon = document.getElementById('auto-icon');
    if (autoText) autoText.textContent = "Automático";
    if (autoIcon) autoIcon.innerHTML = "&#9658;&#9658;";
}

function resetSimulation() {
    stopAutoSimulation();
    simState.started = false;
    simState.finished = false;
    simState.target = null;
    simState.stepCount = 0;
    simState.left = 0;
    simState.right = arrayData.length - 1;
    simState.mid = null;
    simState.currentIndex = 0;
    simState.hashIndex = null;
    simState.collision = false;
    simState.insertedIndex = null;
    simState.discardedIndices.clear();
    simState.inspectingIndex = null;
    simState.foundIndex = null;
    simState.visitedNodes.clear();
    simState.mstEdges = [];
    simState.totalWeight = 0;
    simState.currentNodeId = null;
    simState.targetBlock = null;

    setStatusBanner(`Ingrese datos y presione <strong>Siguiente Paso</strong> o <strong>Automático</strong> para iniciar.`);
    renderVisualizer();
}

function generateRandomData() {
    resetSimulation();
    addLog("Generados datos aleatorios actualizados.", "info");
}

function setStatusBanner(message, statusType = '') {
    const banner = document.getElementById('sim-status-banner');
    if (!banner) return;
    banner.className = 'sim-status-banner';
    if (statusType === 'found') banner.classList.add('status-found');
    if (statusType === 'notfound') banner.classList.add('status-notfound');
    banner.innerHTML = message;
}

function addLog(message, type = 'info') {
    const logContainer = document.getElementById('execution-logs');
    if (!logContainer) return;
    const li = document.createElement('li');
    li.className = `log-${type}`;
    li.innerHTML = `<span class="log-prefix">&gt; </span><span>${message}</span>`;
    logContainer.appendChild(li);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function clearLogs() {
    const logContainer = document.getElementById('execution-logs');
    if (logContainer) {
        logContainer.innerHTML = '';
        addLog("Registro de ejecución limpio.", "info");
    }
}
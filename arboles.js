// ==========================================
// LÓGICA DE ÁRBOLES DIGITALES, TRIES Y HUFFMAN
// ==========================================

let treeRoot = null;
let huffmanBuildData = null;

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function resetTreeState() {
    treeRoot = null;
    huffmanBuildData = null;
    renderTreeVisualizer();
    renderHuffmanTables();
}

function resetTreeState() {
    treeRoot = null;
    renderTreeVisualizer();
}

function insertIntoTree(val) {
    if (!val) return;
    const strVal = String(val).toLowerCase();

    // 1. LÓGICA PARA ÁRBOL DE HUFFMAN
    if (currentAlgo === 'huffman') {
        huffmanBuildData = buildHuffmanTree(strVal);
        treeRoot = huffmanBuildData.root;

        setStatusBanner(
            `Árbol de Huffman generado para <strong>"${escapeHtml(val)}"</strong> en ${huffmanBuildData.steps.length} paso(s).`,
            "found"
        );
        addLog(
            `Huffman generado para "${escapeHtml(val)}" (${huffmanBuildData.initialNodes.length} símbolos únicos, ${huffmanBuildData.steps.length} iteraciones). Tablas paso a paso disponibles debajo del árbol.`,
            'info'
        );
    }
    // 2. LÓGICA PARA ÁRBOL DIGITAL (Búsqueda Binaria / BST)
    else if (currentAlgo === 'arbol-digital') {
        let numVal = isNaN(val) ? val : parseInt(val, 10);
        treeRoot = insertBST(treeRoot, numVal);
        setStatusBanner(`Nodo <strong>"${val}"</strong> insertado en el Árbol.`, "found");
        addLog(`Nodo "${val}" enraizado (menores a la izquierda, mayores a la derecha).`, 'info');
    }
    // 3. LÓGICA PARA TRIES (Residuos y Múltiples)
    else {
        if (!treeRoot) treeRoot = { text: "Raíz", isEnd: false, children: {}, inspecting: false, found: false };
        let curr = treeRoot;
        for (let i = 0; i < strVal.length; i++) {
            let char = strVal[i];
            if (!curr.children[char]) curr.children[char] = { text: char, isEnd: false, children: {}, inspecting: false, found: false };
            curr = curr.children[char];
        }
        curr.isEnd = true;
        curr.fullWord = strVal;

        setStatusBanner(`La palabra <strong>"${val}"</strong> ha sido agregada al Trie.`, "found");
        addLog(`Palabra "${val}" estructurada nodo por nodo.`, 'info');
    }
    
    renderTreeVisualizer();
    
    renderHuffmanTables();
}



function buildHuffmanTree(text) {
    const freq = {};
    for (const char of text) {
        freq[char] = (freq[char] || 0) + 1;
    }

    const initialNodes = Object.keys(freq)
        .map(char => {
            const disp = char === ' ' ? 'SPC' : char.toUpperCase();
            return {
                text: disp,
                nodeId: disp,
                realChar: char,
                weight: freq[char],
                isEnd: true,
                children: {},
                inspecting: false,
                found: false
            };
        })
        .sort((a, b) => a.weight - b.weight || a.text.localeCompare(b.text));

    const snapshotQueue = arr => arr.map(n => ({
        id: n.nodeId,
        weight: n.weight,
        isLeaf: n.isEnd
    }));

    const steps = [];
    let root = null;

    if (initialNodes.length === 1) {
        const onlyNode = initialNodes[0];
        root = {
            text: '•',
            nodeId: 'N1',
            weight: onlyNode.weight,
            isEnd: false,
            children: { '0': onlyNode },
            inspecting: false,
            found: false
        };
        steps.push({
            step: 1,
            queueBefore: snapshotQueue([onlyNode]),
            left: { id: onlyNode.nodeId, weight: onlyNode.weight },
            right: null,
            parent: { id: 'N1', weight: root.weight },
            queueAfter: snapshotQueue([root])
        });
    } else {
        const queue = [...initialNodes];
        let stepNum = 1;

        while (queue.length > 1) {
            queue.sort((a, b) => a.weight - b.weight);
            const queueBefore = snapshotQueue(queue);

            const left = queue.shift();
            const right = queue.shift();
            const nodeId = `N${stepNum}`;

            const parent = {
                text: '•',
                nodeId,
                weight: left.weight + right.weight,
                isEnd: false,
                children: { '0': left, '1': right },
                inspecting: false,
                found: false
            };

            queue.push(parent);
            queue.sort((a, b) => a.weight - b.weight);
            const queueAfter = snapshotQueue(queue);

            steps.push({
                step: stepNum,
                queueBefore,
                left: { id: left.nodeId, weight: left.weight },
                right: { id: right.nodeId, weight: right.weight },
                parent: { id: parent.nodeId, weight: parent.weight },
                queueAfter
            });

            stepNum++;
        }
        root = queue[0];
    }

    const codes = extractHuffmanCodes(root);
    return {
        root,
        originalText: text,
        totalChars: text.length,
        initialNodes,
        steps,
        codes
    };
}

function extractHuffmanCodes(root) {
    const codes = {};
    if (!root) return codes;

    function traverse(node, path) {
        if (!node) return;
        if (node.isEnd) {
            codes[node.realChar] = {
                label: node.text,
                weight: node.weight,
                code: path || '0'
            };
            return;
        }
        if (node.children['0']) traverse(node.children['0'], path + '0');
        if (node.children['1']) traverse(node.children['1'], path + '1');
    }

    traverse(root, '');
    return codes;
}

function renderHuffmanTables() {
    const wrapper = document.getElementById('tree-wrapper');
    if (!wrapper) return;

    let panel = document.getElementById('huffman-steps-container');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'huffman-steps-container';
        panel.className = 'huffman-steps-container';
        wrapper.appendChild(panel);
    }

    if (currentAlgo !== 'huffman' || !huffmanBuildData) {
        panel.style.display = 'none';
        panel.innerHTML = '';
        return;
    }

    const { initialNodes, steps, codes, totalChars, originalText } = huffmanBuildData;

    const formatQueuePills = (queue, highlightFirstTwo = false) => {
        return queue.map((item, idx) => {
            let pillClass = 'queue-pill';
            if (highlightFirstTwo && idx === 0) pillClass += ' pill-left';
            else if (highlightFirstTwo && idx === 1) pillClass += ' pill-right';
            else if (!item.isLeaf) pillClass += ' pill-internal';
            return `<span class="${pillClass}">${escapeHtml(item.id)}<em>(${item.weight})</em></span>`;
        }).join(' ');
    };

    // 1. Tabla de frecuencias iniciales (ordenadas ascendentemente)
    const freqRows = initialNodes.map(node => {
        const prob = ((node.weight / totalChars) * 100).toFixed(1);
        return `
            <tr>
                <td><strong>${escapeHtml(node.text)}</strong></td>
                <td>${node.weight}</td>
                <td>${node.weight}/${totalChars} (${prob}%)</td>
            </tr>`;
    }).join('');

    // 2. Tabla paso a paso de combinaciones
    const stepRows = steps.map(s => {
        const mergeDesc = s.right
            ? `<span class="queue-pill pill-left">${escapeHtml(s.left.id)}<em>(${s.left.weight})</em> [0]</span> + <span class="queue-pill pill-right">${escapeHtml(s.right.id)}<em>(${s.right.weight})</em> [1]</span>`
            : `<span class="queue-pill pill-left">${escapeHtml(s.left.id)}<em>(${s.left.weight})</em> [0]</span> (único símbolo)`;

        return `
            <tr>
                <td><strong>Paso ${s.step}</strong></td>
                <td class="queue-cell">${formatQueuePills(s.queueBefore, true)}</td>
                <td class="merge-cell">${mergeDesc}</td>
                <td><span class="queue-pill pill-created">${escapeHtml(s.parent.id)}<em>(${s.parent.weight})</em></span></td>
                <td class="queue-cell">${formatQueuePills(s.queueAfter, false)}</td>
            </tr>`;
    }).join('');

    // 3. Tabla final de códigos y métricas de bits
    let totalHuffmanBits = 0;
    const sortedChars = Object.keys(codes).sort(
        (a, b) => codes[b].weight - codes[a].weight || codes[a].code.length - codes[b].code.length
    );

    const codeRows = sortedChars.map(c => {
        const info = codes[c];
        const bitsForChar = info.weight * info.code.length;
        totalHuffmanBits += bitsForChar;
        return `
            <tr>
                <td><strong>${escapeHtml(info.label)}</strong></td>
                <td>${info.weight}</td>
                <td><code class="huffman-code-badge">${info.code}</code></td>
                <td>${info.code.length}</td>
                <td>${bitsForChar}</td>
            </tr>`;
    }).join('');

    const encodedBits = Array.from(originalText).map(c => codes[c].code).join(' ');
    const asciiBits = totalChars * 8;
    const savingPct = asciiBits > 0 ? (((asciiBits - totalHuffmanBits) / asciiBits) * 100).toFixed(1) : '0.0';

    panel.style.display = 'flex';
    panel.innerHTML = `
        <div class="huffman-table-card">
            <h4>1. Tabla de Frecuencias Iniciales (Orden Ascendente)</h4>
            <div class="huffman-table-scroll">
                <table class="huffman-table">
                    <thead>
                        <tr>
                            <th>Símbolo</th>
                            <th>Frecuencia</th>
                            <th>Probabilidad</th>
                        </tr>
                    </thead>
                    <tbody>${freqRows}</tbody>
                    <tfoot>
                        <tr>
                            <td><strong>Total</strong></td>
                            <td><strong>${totalChars}</strong></td>
                            <td><strong>100%</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <div class="huffman-table-card">
            <h4>2. Construcción del Árbol Paso a Paso</h4>
            <div class="huffman-table-scroll">
                <table class="huffman-table">
                    <thead>
                        <tr>
                            <th>Iteración</th>
                            <th>Cola Ordenada (Antes)</th>
                            <th>Menores Combinados (0 / 1)</th>
                            <th>Nuevo Nodo</th>
                            <th>Cola Resultante (Ordenada)</th>
                        </tr>
                    </thead>
                    <tbody>${stepRows}</tbody>
                </table>
            </div>
        </div>

        <div class="huffman-table-card">
            <h4>3. Códigos Binarios Generados</h4>
            <div class="huffman-table-scroll">
                <table class="huffman-table">
                    <thead>
                        <tr>
                            <th>Símbolo</th>
                            <th>Frecuencia</th>
                            <th>Código Huffman</th>
                            <th>Long. (bits)</th>
                            <th>Total (f × L)</th>
                        </tr>
                    </thead>
                    <tbody>${codeRows}</tbody>
                    <tfoot>
                        <tr>
                            <td><strong>Total</strong></td>
                            <td><strong>${totalChars}</strong></td>
                            <td colspan="2"><strong>ASCII (8 bits): ${asciiBits} bits (Ahorro: ${savingPct}%)</strong></td>
                            <td><strong>${totalHuffmanBits} bits</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="huffman-encoded-preview">
                <span>Cadena codificada:</span>
                <code>${encodedBits}</code>
            </div>
        </div>
    `;
}

function findHuffmanPath(node, targetChar, currentPath = "") {
    if (node.isEnd) return (node.realChar === targetChar || node.text.toLowerCase() === targetChar) ? currentPath : null;
    for (let key in node.children) {
        let res = findHuffmanPath(node.children[key], targetChar, currentPath + key);
        if (res) return res;
    }
    return null;
}

function insertBST(node, val) {
    if (!node) return { text: val, isEnd: true, children: {}, inspecting: false, found: false };
    let isLess = typeof val === 'number' && typeof node.text === 'number' ? val < node.text : String(val).localeCompare(String(node.text)) < 0;
    let key = isLess ? 'izq' : 'der';
    node.children[key] = insertBST(node.children[key], val);
    return node;
}

function clearTreeFlags(node) {
    if (!node) return;
    node.inspecting = false;
    node.found = false;
    for (let key in node.children) clearTreeFlags(node.children[key]);
}

function stepTreeSearch() {
    if (!treeRoot) {
        setStatusBanner("El árbol está vacío. Inserta datos primero.", "notfound");
        return;
    }

    const action = document.getElementById('operation-action').value;

    if (simState.stepCount === 0) {
        simState.stepCount++;
        simState.searchPath = String(simState.target).toLowerCase();
        
        if (currentAlgo === 'huffman') {
            let charToSearch = simState.searchPath.charAt(0);
            let path = findHuffmanPath(treeRoot, charToSearch);
            if (!path) {
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`El carácter <strong>"${charToSearch}"</strong> no existe en Huffman.`, "notfound");
                return;
            }
            simState.huffmanPath = path;
            simState.pathIndex = 0;
            simState.targetChar = charToSearch;
        } else if (currentAlgo === 'arbol-digital') {
            simState.bstTarget = isNaN(simState.target) ? simState.target : parseInt(simState.target, 10);
        } else {
            simState.pathIndex = 0;
        }

        simState.currentTreeNode = treeRoot;
        clearTreeFlags(treeRoot);
        simState.currentTreeNode.inspecting = true;
        
        setStatusBanner(`Paso 1: Iniciando operación en la Raíz.`);
        addLog(`Iniciando evaluación en Raíz.`, 'step');
        renderTreeVisualizer();
        return;
    }

    if (currentAlgo === 'huffman') {
        let nextEdge = simState.huffmanPath[simState.pathIndex];
        simState.currentTreeNode.inspecting = false;
        simState.currentTreeNode = simState.currentTreeNode.children[nextEdge];
        simState.currentTreeNode.inspecting = true;
        simState.pathIndex++;
        simState.stepCount++;

        if (simState.pathIndex === simState.huffmanPath.length) {
            simState.currentTreeNode.found = true;
            simState.finished = true;
            stopAutoSimulation();
            
            if (action === 'delete') {
                setStatusBanner(`¡Encontrado! Código: <strong>${simState.huffmanPath}</strong> (Nota: Huffman es estático, la eliminación estructural no aplica).`, "found");
            } else {
                setStatusBanner(`¡Éxito! Carácter <strong>"${simState.targetChar}"</strong> encontrado. Binario: <strong>${simState.huffmanPath}</strong>`, "found");
                addLog(`Código de Huffman verificado.`, 'found');
            }
        } else {
            setStatusBanner(`Avanzando por la rama <strong>${nextEdge}</strong>...`);
            addLog(`Tomando camino de bits ${nextEdge}.`, 'compare');
        }
    } 
    else if (currentAlgo === 'arbol-digital') {
        let val = simState.bstTarget;
        let currVal = simState.currentTreeNode.text;
        
        if (currVal === val) {
            simState.finished = true;
            stopAutoSimulation();
            
            if (action === 'delete') {
                treeRoot = deleteBSTNode(treeRoot, val);
                setStatusBanner(`¡Éxito! Nodo <strong>"${val}"</strong> ELIMINADO de la estructura.`, "found");
                addLog(`Eliminación Ejecutada: El árbol balanceó las ramas huérfanas.`, 'found');
            } else {
                simState.currentTreeNode.found = true;
                setStatusBanner(`¡Éxito! Nodo <strong>"${val}"</strong> encontrado.`, "found");
                addLog(`Coincidencia exacta.`, 'found');
            }
        } else {
            let isLess = typeof val === 'number' && typeof currVal === 'number' ? val < currVal : String(val).localeCompare(String(currVal)) < 0;
            let nextEdge = isLess ? 'izq' : 'der';
            
            if (simState.currentTreeNode.children[nextEdge]) {
                simState.currentTreeNode.inspecting = false;
                simState.currentTreeNode = simState.currentTreeNode.children[nextEdge];
                simState.currentTreeNode.inspecting = true;
                simState.stepCount++;
                setStatusBanner(`El valor es ${isLess ? 'menor' : 'mayor'}. Avanzando a la rama <strong>${isLess ? 'Izquierda' : 'Derecha'}</strong>...`);
                addLog(`Tomando rama ${isLess ? 'izquierda' : 'derecha'}.`, 'compare');
            } else {
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`El nodo <strong>"${val}"</strong> NO existe.`, "notfound");
                addLog(`Rama vacía alcanzada.`, 'notfound');
            }
        }
    } 
    else {
        let charToFind = simState.searchPath[simState.pathIndex];
        if (simState.currentTreeNode.children && simState.currentTreeNode.children[charToFind]) {
            simState.currentTreeNode.inspecting = false;
            simState.currentTreeNode = simState.currentTreeNode.children[charToFind];
            simState.currentTreeNode.inspecting = true;
            simState.pathIndex++;
            simState.stepCount++;
            
            if (simState.pathIndex === simState.searchPath.length) {
                simState.finished = true;
                stopAutoSimulation();
                if (simState.currentTreeNode.isEnd) {
                    if (action === 'delete') {
                        simState.currentTreeNode.isEnd = false; // Eliminación lógica en Tries
                        simState.currentTreeNode.fullWord = null;
                        setStatusBanner(`¡Éxito! Palabra <strong>"${simState.target}"</strong> ELIMINADA del Trie.`, "found");
                        addLog(`Eliminación lógica: La ruta sigue existiendo pero ya no marca fin de palabra.`, 'found');
                    } else {
                        simState.currentTreeNode.found = true;
                        setStatusBanner(`¡Éxito! Palabra <strong>"${simState.target}"</strong> encontrada.`, "found");
                        addLog(`Camino completo validado.`, 'found');
                    }
                } else {
                    setStatusBanner(`El prefijo <strong>"${simState.target}"</strong> existe, pero no es una palabra válida.`, "notfound");
                }
            } else {
                setStatusBanner(`Residuo <strong>"${charToFind}"</strong> validado. Bajando al nivel ${simState.pathIndex}...`);
                addLog(`Avanzando por la rama "${charToFind}"...`, 'compare');
            }
        } else {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`El residuo <strong>"${charToFind}"</strong> NO se encuentra.`, "notfound");
            addLog(`No hay una rama hija con la letra "${charToFind}".`, 'notfound');
        }
    }
    
    renderTreeVisualizer();
}
// Algoritmo recursivo de Eliminación Real para BST (corregido para limpiar claves nulas)
function deleteBSTNode(node, val) {
    if (!node) return null;

    const cmp = (typeof val === 'number' && typeof node.text === 'number')
        ? val - node.text
        : String(val).localeCompare(String(node.text));

    if (cmp < 0) {
        const updated = deleteBSTNode(node.children['izq'], val);
        if (updated) node.children['izq'] = updated;
        else delete node.children['izq'];
        return node;
    } else if (cmp > 0) {
        const updated = deleteBSTNode(node.children['der'], val);
        if (updated) node.children['der'] = updated;
        else delete node.children['der'];
        return node;
    } else {
        if (!node.children['izq']) return node.children['der'] || null;
        if (!node.children['der']) return node.children['izq'] || null;

        let minNode = node.children['der'];
        while (minNode.children['izq']) minNode = minNode.children['izq'];
        node.text = minNode.text;

        const updated = deleteBSTNode(node.children['der'], minNode.text);
        if (updated) node.children['der'] = updated;
        else delete node.children['der'];
        return node;
    }
}
// ==========================================
// RENDERIZADO VISUAL CON RAMAS REALES (SVG)
// ==========================================

function isBinaryTreeAlgo() {
    return currentAlgo === 'arbol-digital' || currentAlgo === 'huffman';
}

function getValidChildKeys(node) {
    if (!node || !node.children) return [];
    return Object.keys(node.children).filter(
        key => node.children[key] !== null && node.children[key] !== undefined
    );
}

function getMaxLabelLength(node) {
    if (!node) return 1;
    let maxLen = String(node.text ?? '').length;
    if (node.fullWord && node.isEnd && currentAlgo.startsWith('trie')) {
        maxLen = Math.max(maxLen, node.fullWord.length);
    }
    for (const key of getValidChildKeys(node)) {
        maxLen = Math.max(maxLen, getMaxLabelLength(node.children[key]));
    }
    return maxLen;
}

function renderTreeVisualizer() {
    const container = document.getElementById('tree-visualizer');
    if (!container) return;

    if (!treeRoot) {
        container.innerHTML = '<div style="color:#A8958A; padding:20px; font-weight: 600;">El Árbol está vacío. Agrega datos usando el panel "Insertar".</div>';
        return;
    }

    const nodes = [];
    const edges = [];
    const paddingX = 52;
    const paddingY = 44;
    const levelHeight = 96;
    const maxLen = getMaxLabelLength(treeRoot);

    if (isBinaryTreeAlgo()) {
        // Recorrido in-order: garantiza izq siempre a la izquierda y der siempre a la derecha
        const colStep = Math.max(60, Math.min(115, maxLen * 11 + 28));
        let col = 0;

        function layoutBinary(node, depth) {
            if (!node) return;
            const leftKey = currentAlgo === 'huffman' ? '0' : 'izq';
            const rightKey = currentAlgo === 'huffman' ? '1' : 'der';
            const leftChild = node.children ? node.children[leftKey] : null;
            const rightChild = node.children ? node.children[rightKey] : null;

            if (leftChild) layoutBinary(leftChild, depth + 1);

            node._x = paddingX + col * colStep;
            node._y = paddingY + depth * levelHeight;
            col++;
            nodes.push(node);

            if (rightChild) layoutBinary(rightChild, depth + 1);

            if (leftChild) {
                edges.push({
                    from: node,
                    to: leftChild,
                    label: leftKey === 'izq' ? 'L' : '0',
                    side: 'left'
                });
            }
            if (rightChild) {
                edges.push({
                    from: node,
                    to: rightChild,
                    label: rightKey === 'der' ? 'R' : '1',
                    side: 'right'
                });
            }
        }

        layoutBinary(treeRoot, 0);
    } else {
        // Layout post-order para Tries (árboles n-arios)
        const colStep = Math.max(76, Math.min(130, maxLen * 10 + 36));
        let leafCol = 0;

        function layoutNary(node, depth) {
            const keys = getValidChildKeys(node).sort((a, b) => a.localeCompare(b));
            if (keys.length === 0) {
                node._x = paddingX + leafCol * colStep;
                leafCol++;
            } else {
                keys.forEach(key => layoutNary(node.children[key], depth + 1));
                const firstChild = node.children[keys[0]];
                const lastChild = node.children[keys[keys.length - 1]];
                node._x = (firstChild._x + lastChild._x) / 2;
            }

            node._y = paddingY + depth * levelHeight;
            nodes.push(node);

            keys.forEach(key => {
                edges.push({
                    from: node,
                    to: node.children[key],
                    label: key,
                    side: 'nary'
                });
            });
        }

        layoutNary(treeRoot, 0);
    }

    let maxX = 0;
    let maxY = 0;
    nodes.forEach(n => {
        if (n._x > maxX) maxX = n._x;
        if (n._y > maxY) maxY = n._y;
    });

    const rawWidth = maxX + paddingX;
    const stageWidth = Math.max(rawWidth, 280);
    const stageHeight = maxY + paddingY + 18;
    const offsetX = (stageWidth - rawWidth) / 2;

    // 1. Generar líneas diagonales en SVG y etiquetas de arista
    let svgLines = '';
    let edgeLabelsHtml = '';

    edges.forEach(edge => {
        const x1 = edge.from._x + offsetX;
        const y1 = edge.from._y;
        const x2 = edge.to._x + offsetX;
        const y2 = edge.to._y;

        let edgeClass = 'tree-edge';
        if (edge.to.found) edgeClass += ' edge-found';
        else if (edge.to.inspecting) edgeClass += ' edge-active';

        svgLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${edgeClass}" />`;

        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const sideClass = edge.side === 'left' ? 'label-left' : (edge.side === 'right' ? 'label-right' : '');

        edgeLabelsHtml += `<span class="edge-label ${sideClass}" style="left:${mx}px; top:${my}px;">${edge.label}</span>`;
    });

    // 2. Generar nodos posicionados en sus coordenadas exactas
    let nodesHtml = '';
    nodes.forEach(node => {
        let classes = 'tree-node';
        if (node.inspecting) classes += ' node-active';
        if (node.found) classes += ' node-found';

        let display = node.text === 'Raíz' ? '&#9672;' : node.text;

        if (currentAlgo === 'huffman') {
            if (!node.isEnd && node.weight !== undefined) {
                const tag = node.nodeId ? `${node.nodeId}` : '•';
                display = `<span class="huffman-weight">${tag}</span><span class="node-badge">f:${node.weight}</span>`;
            } else if (node.isEnd && node.weight !== undefined) {
                display = `${escapeHtml(node.text)}<span class="node-badge">f:${node.weight}</span>`;
            }
        }

        const x = node._x + offsetX;
        const y = node._y;
        nodesHtml += `<div class="${classes}" style="left:${x}px; top:${y}px;">${display}</div>`;
    });

    container.innerHTML = `
        <div class="tree-stage" style="width:${stageWidth}px; height:${stageHeight}px;">
            <svg class="tree-svg" width="${stageWidth}" height="${stageHeight}">
                ${svgLines}
            </svg>
            ${edgeLabelsHtml}
            ${nodesHtml}
        </div>
    `;
}
// ==========================================
// LÓGICA DE ÁRBOLES DIGITALES, TRIES Y HUFFMAN
// ==========================================

let treeRoot = null;

function resetTreeState() {
    treeRoot = null;
    renderTreeVisualizer();
}

function insertIntoTree(val) {
    if (!val) return;
    const strVal = String(val).toLowerCase();

    // 1. LÓGICA PARA ÁRBOL DE HUFFMAN
    if (currentAlgo === 'huffman') {
        treeRoot = buildHuffmanTree(strVal);
        setStatusBanner(`Árbol de Huffman generado para la cadena <strong>"${val}"</strong>.`, "found");
        addLog(`Frecuencias calculadas. Árbol binario óptimo generado para "${val}".`, 'info');
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
        if (!treeRoot) {
            treeRoot = { text: "Raíz", isEnd: false, children: {}, inspecting: false, found: false };
        }
        let curr = treeRoot;
        for (let i = 0; i < strVal.length; i++) {
            let char = strVal[i];
            if (!curr.children[char]) {
                curr.children[char] = { text: char, isEnd: false, children: {}, inspecting: false, found: false };
            }
            curr = curr.children[char];
        }
        curr.isEnd = true;
        curr.fullWord = strVal;

        setStatusBanner(`La palabra <strong>"${val}"</strong> ha sido agregada al Trie.`, "found");
        addLog(`Para ver ramificaciones, inserta palabras con prefijos comunes (ej: "pro" y "pan").`, 'info');
    }
    
    renderTreeVisualizer();
}

// Generador del Árbol de Huffman
function buildHuffmanTree(text) {
    let freq = {};
    for(let char of text) {
        freq[char] = (freq[char] || 0) + 1;
    }
    
    let nodes = Object.keys(freq).map(char => ({
        text: char === ' ' ? 'SPC' : char,
        realChar: char,
        weight: freq[char],
        isEnd: true,
        children: {},
        inspecting: false,
        found: false
    }));

    if (nodes.length === 1) {
        return { text: nodes[0].weight.toString(), isEnd: false, children: { '0': nodes[0] } };
    }

    while(nodes.length > 1) {
        nodes.sort((a, b) => a.weight - b.weight);
        let left = nodes.shift();
        let right = nodes.shift();
        
        let parent = {
            text: (left.weight + right.weight).toString(),
            weight: left.weight + right.weight,
            isEnd: false,
            children: { '0': left, '1': right },
            inspecting: false,
            found: false
        };
        nodes.push(parent);
    }
    return nodes[0];
}

// Encontrar la ruta binaria en Huffman para una letra específica
function findHuffmanPath(node, targetChar, currentPath = "") {
    if (node.isEnd) {
        return (node.realChar === targetChar || node.text === targetChar) ? currentPath : null;
    }
    for (let key in node.children) {
        let res = findHuffmanPath(node.children[key], targetChar, currentPath + key);
        if (res) return res;
    }
    return null;
}

// Generador de Árbol de Búsqueda Binaria
function insertBST(node, val) {
    if (!node) {
        return { text: val, isEnd: true, children: {}, inspecting: false, found: false };
    }
    
    let isLess = typeof val === 'number' && typeof node.text === 'number' 
        ? val < node.text 
        : String(val).localeCompare(String(node.text)) < 0;
        
    let key = isLess ? 'izq' : 'der';
    node.children[key] = insertBST(node.children[key], val);
    return node;
}

// Limpieza de banderas de animación
function clearTreeFlags(node) {
    if (!node) return;
    node.inspecting = false;
    node.found = false;
    for (let key in node.children) {
        clearTreeFlags(node.children[key]);
    }
}

// Recorrido Paso a Paso Dinámico para Todos los Árboles
function stepTreeSearch() {
    if (!treeRoot) {
        setStatusBanner("El árbol está vacío. Inserta datos primero.", "notfound");
        return;
    }

    if (simState.stepCount === 0) {
        simState.stepCount++;
        simState.searchPath = String(simState.target).toLowerCase();
        
        // Preparación específica según el algoritmo
        if (currentAlgo === 'huffman') {
            let charToSearch = simState.searchPath.charAt(0); // Busca la letra
            let path = findHuffmanPath(treeRoot, charToSearch);
            if (!path) {
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`El carácter <strong>"${charToSearch}"</strong> no existe en el árbol de Huffman.`, "notfound");
                return;
            }
            simState.huffmanPath = path; // Guarda la ruta, ej: "010"
            simState.pathIndex = 0;
            simState.targetChar = charToSearch;
        } else if (currentAlgo === 'arbol-digital') {
            simState.bstTarget = isNaN(simState.target) ? simState.target : parseInt(simState.target, 10);
        } else {
            simState.pathIndex = 0; // Tries
        }

        simState.currentTreeNode = treeRoot;
        clearTreeFlags(treeRoot);
        simState.currentTreeNode.inspecting = true;
        
        setStatusBanner(`Paso 1: Iniciando búsqueda en la Raíz.`);
        addLog(`Búsqueda iniciada. Evaluando Raíz.`, 'step');
        renderTreeVisualizer();
        return;
    }

    // 1. Ejecución de paso en Huffman
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
            setStatusBanner(`¡Éxito! Carácter <strong>"${simState.targetChar}"</strong> encontrado. Código Binario: <strong>${simState.huffmanPath}</strong>`, "found");
            addLog(`Código de Huffman para "${simState.targetChar}" es ${simState.huffmanPath}.`, 'found');
        } else {
            setStatusBanner(`Avanzando por la rama <strong>${nextEdge}</strong>...`);
            addLog(`Tomando camino bit ${nextEdge}.`, 'compare');
        }
    } 
    // 2. Ejecución de paso en Árbol Digital (BST)
    else if (currentAlgo === 'arbol-digital') {
        let val = simState.bstTarget;
        let currVal = simState.currentTreeNode.text;
        
        if (currVal === val) {
            simState.currentTreeNode.found = true;
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`¡Éxito! Nodo <strong>"${val}"</strong> encontrado en el árbol.`, "found");
            addLog(`Coincidencia exacta encontrada en el Árbol Digital.`, 'found');
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
                setStatusBanner(`El nodo <strong>"${val}"</strong> NO existe en el árbol.`, "notfound");
                addLog(`Se llegó a una rama vacía sin encontrar el valor.`, 'notfound');
            }
        }
    } 
    // 3. Ejecución de paso en Tries
    else {
        let charToFind = simState.searchPath[simState.pathIndex];
        if (simState.currentTreeNode.children && simState.currentTreeNode.children[charToFind]) {
            simState.currentTreeNode.inspecting = false;
            simState.currentTreeNode = simState.currentTreeNode.children[charToFind];
            simState.currentTreeNode.inspecting = true;
            simState.pathIndex++;
            simState.stepCount++;
            
            if (simState.pathIndex === simState.searchPath.length) {
                if (simState.currentTreeNode.isEnd) {
                    simState.currentTreeNode.found = true;
                    simState.finished = true;
                    stopAutoSimulation();
                    setStatusBanner(`¡Éxito! Palabra <strong>"${simState.target}"</strong> encontrada en el Trie.`, "found");
                    addLog(`Búsqueda Finalizada: Camino completo validado.`, 'found');
                } else {
                    simState.finished = true;
                    stopAutoSimulation();
                    setStatusBanner(`El prefijo <strong>"${simState.target}"</strong> existe, pero no es una palabra válida.`, "notfound");
                }
            } else {
                setStatusBanner(`Residuo <strong>"${charToFind}"</strong> encontrado. Bajando al nivel ${simState.pathIndex}...`);
                addLog(`Coincidencia en nodo "${charToFind}". Avanzando por la rama...`, 'compare');
            }
        } else {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`El residuo <strong>"${charToFind}"</strong> NO se encuentra. Búsqueda interrumpida.`, "notfound");
            addLog(`Fallo de Búsqueda: No hay una rama hija con la letra "${charToFind}".`, 'notfound');
        }
    }
    
    renderTreeVisualizer();
}

// ==========================================
// RENDERIZADO HTML RECURSIVO DEL ÁRBOL
// ==========================================
function renderTreeVisualizer() {
    const container = document.getElementById('tree-visualizer');
    if (!container) return;
    
    if (!treeRoot) {
        container.innerHTML = '<div style="color:#A8958A; padding:20px; font-weight: 600;">El Árbol está vacío. Agrega datos usando el panel "Insertar".</div>';
        return;
    }

    container.innerHTML = `<div class="tree">${buildTreeHTML(treeRoot)}</div>`;
}

function buildTreeHTML(node) {
    let classes = "tree-node";
    if (node.inspecting) classes += " node-active";
    if (node.found) classes += " node-found";

    let display = node.text === "Raíz" ? "&#9672;" : node.text; 
    if (node.fullWord && node.isEnd && currentAlgo.startsWith('trie')) {
        display += `<span class="node-badge">${node.fullWord}</span>`;
    }

    let html = `<ul><li><div class="${classes}">${display}</div>`;
    
    const childKeys = Object.keys(node.children);
    // Ordenar claves para que Izquierda ('0', 'izq') siempre quede antes que Derecha ('1', 'der')
    childKeys.sort((a,b) => {
        if(a==='izq' || a==='0') return -1;
        if(b==='izq' || b==='0') return 1;
        return a.localeCompare(b);
    });

    if (childKeys.length > 0) {
        html += `<ul>`;
        for (let key of childKeys) {
            html += buildTreeHTMLInner(node.children[key], key);
        }
        html += `</ul>`;
    }
    
    html += `</li></ul>`;
    return html;
}

function buildTreeHTMLInner(node, edgeKey) {
    let classes = "tree-node";
    if (node.inspecting) classes += " node-active";
    if (node.found) classes += " node-found";

    let display = node.text;
    if (node.fullWord && node.isEnd && currentAlgo.startsWith('trie')) {
        display += `<span class="node-badge">${node.fullWord}</span>`;
    }

    // Traducción visual de los caminos
    let labelDisplay = edgeKey;
    if(edgeKey === 'izq') labelDisplay = 'L';
    if(edgeKey === 'der') labelDisplay = 'R';

    // Etiqueta de la rama conectora (El CSS la dibuja sobre la línea)
    let edgeHtml = `<span class="edge-label">${labelDisplay}</span>`;

    let html = `<li>${edgeHtml}<div class="${classes}">${display}</div>`;
    
    const childKeys = Object.keys(node.children);
    childKeys.sort((a,b) => {
        if(a==='izq' || a==='0') return -1;
        if(b==='izq' || b==='0') return 1;
        return a.localeCompare(b);
    });

    if (childKeys.length > 0) {
        html += `<ul>`;
        for (let key of childKeys) {
            html += buildTreeHTMLInner(node.children[key], key);
        }
        html += `</ul>`;
    }
    html += `</li>`;
    return html;
}
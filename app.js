// ==========================================
// 1. Lógica para la barra lateral y vistas
// ==========================================
document.querySelectorAll(".accordion").forEach(acc => {
    acc.addEventListener("click", function () {
        this.classList.toggle("active");
        const panel = this.nextElementSibling;
        if (panel && panel.classList.contains("panel")) {
            panel.style.display = panel.style.display === "block" ? "none" : "block";
        }
    });
});

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    const target = document.getElementById(viewId) || document.getElementById(viewId + '-view');
    if (target) target.classList.add('active');
}

// ==========================================
// 2. Base de Datos Local de Algoritmos
// ==========================================
const algorithmsData = {
    secuencial: { titulo: "Búsqueda Secuencial (Lineal)", badge: "Búsqueda Secuencial", tiempo: "O(n)", espacio: "O(1)", descripcion: "Examina secuencialmente cada elemento del arreglo." },
    binaria: { titulo: "Búsqueda Binaria", badge: "Búsqueda Binaria", tiempo: "O(log n)", espacio: "O(1)", descripcion: "Requiere que la colección esté previamente ordenada." },
    'hash-modulo': { titulo: "Función Hash por Módulo", badge: "Hash Módulo", tiempo: "O(1) [Promedio]", espacio: "O(N)", descripcion: "Calcula el índice mediante la fórmula h(k) = k mod N." },
    'hash-cuadrado': { titulo: "Función Hash por Cuadrado (Centro)", badge: "Hash Cuadrado", tiempo: "O(1) [Promedio]", espacio: "O(N)", descripcion: "Eleva la clave al cuadrado k^2 y extrae los dígitos centrales." },
    'hash-plegamiento': { titulo: "Función Hash por Plegamiento", badge: "Hash Plegamiento", tiempo: "O(1) [Promedio]", espacio: "O(N)", descripcion: "Divide la clave en partes de igual longitud, las suma y aplica módulo N." },
    'hash-truncamiento': { titulo: "Función Hash por Truncamiento", badge: "Hash Truncamiento", tiempo: "O(1) [Promedio]", espacio: "O(N)", descripcion: "Extrae únicamente dígitos en posiciones específicas de la clave y aplica módulo N." }
};

// ==========================================
// 3. Estado Global de la Simulación
// ==========================================
let currentAlgo = 'binaria';
let arrayData = [];
let hashTableSize = 10;
let hashTableData = new Array(hashTableSize).fill(null);

let simState = {
    started: false, finished: false, target: null, stepCount: 0, autoTimer: null,
    left: 0, right: 9, mid: null, subPhase: 'calc_mid', currentIndex: 0,
    hashIndex: null, originalHash: null, probeCount: 0, collision: false,
    insertedIndex: null, discardedIndices: new Set(), inspectingIndex: null, foundIndex: null,
    isInserting: false 
};

// ==========================================
// 4. Carga de Algoritmo en el Workspace
// ==========================================
function loadAlgorithm(algoId) {
    showView('algorithm-view');
    const data = algorithmsData[algoId];
    if (!data) return;

    currentAlgo = algoId;

    document.getElementById('current-algorithm-title').textContent = data.titulo;
    document.getElementById('algo-badge').textContent = data.badge;
    document.getElementById('time-complexity').textContent = data.tiempo;
    document.getElementById('space-complexity').textContent = data.espacio;
    document.getElementById('algorithm-description').textContent = data.descripcion;

    const hashActionContainer = document.getElementById('hash-action-container');
    const colStrategyContainer = document.getElementById('collision-strategy-container');
    const arraySizeContainer = document.getElementById('array-size-container');
    const arrayInsertContainer = document.getElementById('array-insert-container');
    const formulaBox = document.getElementById('formula-box');
    const inputLabel = document.getElementById('input-data-label');
    const btnStepText = document.getElementById('btn-step-text');
    const targetInput = document.getElementById('target-value');
    const btnRandom = document.getElementById('btn-random');
    const sizeLabel = document.getElementById('size-label');

    if (algoId.startsWith('hash')) {
        if (hashActionContainer) hashActionContainer.style.display = 'flex';
        if (colStrategyContainer) colStrategyContainer.style.display = 'flex'; 
        if (arraySizeContainer) arraySizeContainer.style.display = 'flex'; 
        if (sizeLabel) sizeLabel.textContent = 'Tamaño Tabla:';
        
        if (arrayInsertContainer) arrayInsertContainer.style.display = 'none'; 
        if (btnRandom) btnRandom.style.display = 'none'; 
        
        if (formulaBox) formulaBox.style.display = 'flex';
        if (inputLabel) inputLabel.textContent = 'Clave (k):';
        if (btnStepText) btnStepText.textContent = 'Siguiente Paso';
        
        const exprElement = document.getElementById('formula-expression');
        if (exprElement) {
            if (algoId === 'hash-modulo') exprElement.innerHTML = `h(k) = k mod ${hashTableSize}`;
            else if (algoId === 'hash-cuadrado') exprElement.innerHTML = `h(k) = centro(k<sup>2</sup>)`;
            else if (algoId === 'hash-plegamiento') exprElement.innerHTML = `h(k) = suma_partes(k) mod ${hashTableSize}`;
            else if (algoId === 'hash-truncamiento') exprElement.innerHTML = `h(k) = truncar(k) mod ${hashTableSize}`;
        }
        if (targetInput) targetInput.value = ''; 
    } else {
        if (hashActionContainer) hashActionContainer.style.display = 'none';
        if (colStrategyContainer) colStrategyContainer.style.display = 'none'; 
        if (arraySizeContainer) arraySizeContainer.style.display = 'flex'; 
        if (sizeLabel) sizeLabel.textContent = 'Tamaño:';
        if (arrayInsertContainer) arrayInsertContainer.style.display = 'flex'; 
        if (btnRandom) btnRandom.style.display = 'inline-flex';
        
        if (formulaBox) formulaBox.style.display = 'none';
        if (inputLabel) inputLabel.textContent = 'Buscar valor:';
        if (btnStepText) btnStepText.textContent = 'Siguiente Paso';
        if (targetInput) targetInput.value = ''; 
    }

    arrayData = [];
    hashTableData = new Array(hashTableSize).fill(null);
    const logContainer = document.getElementById('execution-logs');
    if (logContainer) logContainer.innerHTML = '';

    resetSimulation();
    addLog(`Algoritmo cargado: <strong>${data.titulo}</strong>.`, 'info');
}

// ==========================================
// 5. Renderizado Visual Unificado
// ==========================================
function renderArrayVisualizer() {
    const container = document.getElementById('array-visualizer');
    if (!container) return;
    container.innerHTML = '';

    const isHash = currentAlgo.startsWith('hash');
    const dataArr = isHash ? hashTableData : arrayData;
    const n = dataArr.length;

    let indicesToShow = new Set();

    if (n <= 12) {
        for (let i = 0; i < n; i++) indicesToShow.add(i);
    } else {
        for (let i = 0; i < 3; i++) indicesToShow.add(i);
        for (let i = n - 3; i < n; i++) indicesToShow.add(i);

        let activeIdxs = [];
        if (currentAlgo === 'binaria' && simState.started) {
            activeIdxs.push(simState.left, simState.mid, simState.right);
        } else if (currentAlgo === 'secuencial' && simState.started) {
            activeIdxs.push(simState.currentIndex);
        } else if (isHash && simState.started) {
            activeIdxs.push(simState.hashIndex, simState.insertedIndex, simState.foundIndex);
        }
        if (simState.inspectingIndex !== null) activeIdxs.push(simState.inspectingIndex);

        activeIdxs.forEach(idx => {
            if (idx !== null && idx >= 0 && idx < n) {
                indicesToShow.add(idx - 1);
                indicesToShow.add(idx);
                indicesToShow.add(idx + 1);
            }
        });
        indicesToShow = new Set(Array.from(indicesToShow).filter(i => i >= 0 && i < n));
    }

    const sortedIndices = Array.from(indicesToShow).sort((a, b) => a - b);
    let lastIdx = -1;

    sortedIndices.forEach(idx => {
        if (idx - lastIdx > 1 && lastIdx !== -1) {
            const ellipsis = document.createElement('div');
            ellipsis.className = 'array-ellipsis';
            ellipsis.innerHTML = '&middot;&middot;&middot;';
            container.appendChild(ellipsis);
        }
        lastIdx = idx;

        const val = dataArr[idx];
        const cell = document.createElement('div');
        cell.className = 'array-cell';
        cell.id = `cell-${idx}`;

        const isEmpty = val === null;
        const isInspecting = simState.inspectingIndex === idx;
        const isFound = simState.foundIndex === idx;
        const isInserted = simState.insertedIndex === idx;
        const isCollision = isHash ? (simState.collision && simState.inspectingIndex === idx) : false;
        const isDiscarded = !isHash && simState.discardedIndices.has(idx);
        const inActiveRange = currentAlgo === 'binaria' && simState.started && !simState.finished 
                              && idx >= simState.left && idx <= simState.right;

        if (isEmpty) cell.classList.add('cell-empty');
        if (isDiscarded) cell.classList.add('cell-discarded');
        if (inActiveRange && !isInspecting && !isFound && !isEmpty) cell.classList.add('cell-active');
        if (isInspecting && !isCollision) cell.classList.add('cell-inspecting');
        if (isFound || (isHash && isInserted)) cell.classList.add('cell-found');
        if (isCollision) cell.classList.add('cell-collision');

        const badges = [];
        if (isHash) {
            if (isCollision) badges.push({ type: 'collision', label: `Colisión (${idx})` });
            else if (isFound) badges.push({ type: 'mid', label: `Hallado (${idx})` });
            else if (isInserted) badges.push({ type: 'mid', label: `Insertado (${idx})` });
            else if (isInspecting) badges.push({ type: 'single', label: `Hash (${idx})` });
        } else {
            if (currentAlgo === 'binaria' && simState.started && !simState.finished) {
                if (simState.left === idx) badges.push({ type: 'left', label: `Izq (${idx})` });
                if (simState.mid === idx) badges.push({ type: 'mid', label: `Med (${idx})` });
                if (simState.right === idx) badges.push({ type: 'right', label: `Der (${idx})` });
            } else if (currentAlgo === 'secuencial' && simState.started && !simState.finished) {
                if (simState.currentIndex === idx) badges.push({ type: 'single', label: `Pos (${idx})` });
            }
            if (simState.isInserting && simState.inspectingIndex === idx) {
                badges.push({ type: 'single', label: `Moviendo` });
            }
        }

        if (badges.length > 0) {
            const badgeGroup = document.createElement('div');
            badgeGroup.className = 'pointer-badge-group';
            badges.forEach(b => {
                const badge = document.createElement('span');
                badge.className = `pointer-badge badge-${b.type}`;
                badge.textContent = b.label;
                badgeGroup.appendChild(badge);
            });
            cell.appendChild(badgeGroup);
        }

        const indexSpan = document.createElement('span');
        indexSpan.className = 'cell-index';
        indexSpan.textContent = `[${idx}]`;
        cell.appendChild(indexSpan);

        const valueSpan = document.createElement('span');
        valueSpan.className = 'cell-value';
        valueSpan.textContent = isEmpty ? '-' : val;
        cell.appendChild(valueSpan);

        if (isInspecting || isFound || (isHash && isInserted) || isCollision) {
            const bottomIndicator = document.createElement('div');
            bottomIndicator.className = 'cell-bottom-indicator';
            if (isFound || (isHash && isInserted)) bottomIndicator.classList.add('indicator-found');
            const arrowGlyph = document.createElement('span');
            arrowGlyph.className = 'indicator-arrow';
            arrowGlyph.innerHTML = '&#9650;'; 
            const pill = document.createElement('span');
            pill.className = 'indicator-pill';
            if (isHash) {
                if (isCollision) pill.innerHTML = `<strong>Colisión</strong> Cubeta [${idx}] = ${val}`;
                else if (isFound) pill.innerHTML = `<strong>¡Encontrado!</strong> [${idx}] = ${val}`;
                else if (isInserted) pill.innerHTML = `<strong>¡Insertado!</strong> h(k) -> [${idx}]`;
                else pill.innerHTML = `Calculado: <strong>[${idx}]</strong>`;
            } else {
                if (isFound) pill.innerHTML = `<strong>¡Encontrado!</strong> arr[${idx}] = ${val}`;
                else pill.innerHTML = `Pos: <strong>${idx}</strong> | Val: <strong>${val === null ? '-' : val}</strong>`;
            }
            bottomIndicator.appendChild(arrowGlyph);
            bottomIndicator.appendChild(pill);
            cell.appendChild(bottomIndicator);
        }
        container.appendChild(cell);
    });
}

// ==========================================
// 6. Controlador Principal de Simulación
// ==========================================
function stepSimulation() {
    const inputElement = document.getElementById('target-value');
    if (!inputElement) return;

    if (simState.finished) {
        stopAutoSimulation();
        simState.started = false;
        simState.finished = false;
        simState.stepCount = 0;
        
        simState.hashIndex = null;
        simState.originalHash = null;
        simState.probeCount = 0;
        simState.collision = false;
        simState.insertedIndex = null;
        simState.inspectingIndex = null;
        simState.foundIndex = null;
        simState.discardedIndices.clear();
    }

    if (!simState.started) {
        const rawVal = inputElement.value.trim();
        if (rawVal === '') {
            setStatusBanner("Por favor ingresa un número en el campo de texto.", "notfound");
            return;
        }

        const targetVal = parseInt(rawVal, 10);
        if (isNaN(targetVal)) {
            setStatusBanner("El valor ingresado no es un número válido.", "notfound");
            return;
        }

        initSimulationState(targetVal);

        if (currentAlgo === 'binaria') stepBinarySearch();
        else if (currentAlgo === 'secuencial') stepSequentialSearch();
        else if (currentAlgo === 'hash-modulo') stepHashModulo();
        else if (currentAlgo === 'hash-cuadrado') stepHashCuadrado();
        else if (currentAlgo === 'hash-plegamiento') stepHashPlegamiento();
        else if (currentAlgo === 'hash-truncamiento') stepHashTruncamiento();

        renderArrayVisualizer();
        return;
    }

    if (currentAlgo === 'binaria') stepBinarySearch();
    else if (currentAlgo === 'secuencial') stepSequentialSearch();
    else if (currentAlgo === 'hash-modulo') stepHashModulo();
    else if (currentAlgo === 'hash-cuadrado') stepHashCuadrado();
    else if (currentAlgo === 'hash-plegamiento') stepHashPlegamiento();
    else if (currentAlgo === 'hash-truncamiento') stepHashTruncamiento();

    renderArrayVisualizer();
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

    if (currentAlgo === 'binaria') {
        simState.left = 0;
        simState.right = arrayData.length - 1;
        simState.mid = null;
        simState.subPhase = 'calc_mid';
        setStatusBanner(`Iniciando Búsqueda Binaria para el valor <strong>${targetVal}</strong>.`);
        addLog(`Iniciando búsqueda binaria de <strong>${targetVal}</strong>.`, 'step');
    } else if (currentAlgo === 'secuencial') {
        simState.currentIndex = 0;
        setStatusBanner(`Iniciando Búsqueda Secuencial para el valor <strong>${targetVal}</strong> desde la posición 0.`);
        addLog(`Iniciando búsqueda secuencial de <strong>${targetVal}</strong>.`, 'step');
    } else if (currentAlgo.startsWith('hash')) { 
        simState.hashIndex = null;
        simState.subPhase = 'calc_hash';
        const actionSelect = document.getElementById('hash-action');
        const action = actionSelect ? actionSelect.value : 'insert';
        const actionText = action === 'insert' ? 'Insertar' : (action === 'search' ? 'Buscar' : 'Eliminar');
        
        let algoName = 'Módulo';
        let formulaText = `h(${targetVal}) = ${targetVal} mod ${hashTableSize}`;
        
        if (currentAlgo === 'hash-cuadrado') {
            algoName = 'Centro del Cuadrado';
            formulaText = `h(${targetVal}) = centro(${targetVal}²)`;
        } else if (currentAlgo === 'hash-plegamiento') {
            algoName = 'Plegamiento';
            formulaText = `h(${targetVal}) = suma_partes(${targetVal}) mod ${hashTableSize}`;
        } else if (currentAlgo === 'hash-truncamiento') {
            algoName = 'Truncamiento';
            formulaText = `h(${targetVal}) = truncar(${targetVal}) mod ${hashTableSize}`;
        }
        
        setStatusBanner(`Iniciando operación Hash (<strong>${actionText}</strong>) para la clave <strong>${targetVal}</strong>. Aplicando ${formulaText}.`);
        addLog(`Operación Hash ${algoName} [<strong>${actionText}</strong>]: Clave k = ${targetVal}.`, 'step');
    }
}

// ==========================================
// 7. Funciones de Interfaz y Auxiliares
// ==========================================
function setControlsDisabled(disabled) {
    const controls = document.querySelectorAll('.sim-controls button, .sim-controls input, .sim-controls select');
    controls.forEach(ctrl => ctrl.disabled = disabled);
}

function createEmptyArray() {
    if (simState.isInserting) return;
    const sizeInput = document.getElementById('array-size-input');
    const size = parseInt(sizeInput.value, 10);
    
    if (isNaN(size) || size <= 0) {
        setStatusBanner("Por favor ingresa un tamaño numérico mayor a 0.", "notfound");
        return;
    }

    if (currentAlgo.startsWith('hash')) {
        hashTableSize = size;
        hashTableData = new Array(hashTableSize).fill(null);
        resetSimulation();
        addLog(`Se creó una Tabla Hash con ${size} cubetas vacías.`, 'info');
    } else {
        arrayData = new Array(size).fill(null);
        resetSimulation();
        addLog(`Se reservó en memoria una estructura de ${size} posiciones vacías.`, 'info');
    }
}

function insertSingleData() {
    if (simState.isInserting) return;
    if (arrayData.length === 0) {
        setStatusBanner("Primero crea la estructura indicando el tamaño.", "notfound");
        return;
    }

    const inputElement = document.getElementById('array-insert-input');
    const val = parseInt(inputElement.value, 10);

    if (isNaN(val)) {
        setStatusBanner("Ingresa un valor numérico para insertar.", "notfound");
        return;
    }

    const firstEmptyIdx = arrayData.indexOf(null);
    if (firstEmptyIdx === -1) {
        setStatusBanner("La estructura ya está llena (Overflow).", "notfound");
        return;
    }

    arrayData[firstEmptyIdx] = val;
    inputElement.value = '';
    
    const targetInput = document.getElementById('target-value');
    if (targetInput) targetInput.value = val;

    simState.isInserting = true;
    setControlsDisabled(true);

    let currIdx = firstEmptyIdx;
    simState.inspectingIndex = currIdx;
    renderArrayVisualizer();
    setStatusBanner(`Insertando ${val}... Ordenando estructura paso a paso.`);

    const insertInterval = setInterval(() => {
        if (currIdx > 0 && arrayData[currIdx - 1] !== null && arrayData[currIdx] < arrayData[currIdx - 1]) {
            const temp = arrayData[currIdx];
            arrayData[currIdx] = arrayData[currIdx - 1];
            arrayData[currIdx - 1] = temp;
            currIdx--;
            simState.inspectingIndex = currIdx;
            renderArrayVisualizer();
        } else {
            clearInterval(insertInterval);
            finishInsertion(val, currIdx, "ordenado correctamente");
        }
    }, 600);
}

function finishInsertion(val, idx, msg) {
    simState.isInserting = false;
    simState.inspectingIndex = null;
    setControlsDisabled(false);
    resetSimulation();
    setStatusBanner(`Dato ${val} ${msg}. Listo para buscar.`, "found");
    addLog(`Dato ${val} asignado a la posición [${idx}].`, 'info');
}

function generateRandomArray() {
    if (simState.isInserting) return;
    stopAutoSimulation();
    const set = new Set();
    while (set.size < 25) set.add(Math.floor(Math.random() * 95) + 2);
    arrayData = Array.from(set).sort((a, b) => a - b);
    
    const input = document.getElementById('target-value');
    if (input) input.value = arrayData[Math.floor(Math.random() * arrayData.length)];
    resetSimulation();
    addLog(`Nuevo arreglo aleatorio generado: [${arrayData.length} elementos].`, 'info');
}

function toggleAutoSimulation() {
    if (simState.isInserting) return;
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
    simState.started = false; simState.finished = false; simState.target = null;
    simState.stepCount = 0; simState.left = 0; 
    
    let lastFilled = -1;
    for(let i = arrayData.length - 1; i >= 0; i--) {
        if(arrayData[i] !== null) { lastFilled = i; break; }
    }
    simState.right = lastFilled >= 0 ? lastFilled : (arrayData.length > 0 ? arrayData.length - 1 : 0);
    
    simState.mid = null; simState.currentIndex = 0; simState.hashIndex = null;
    simState.originalHash = null; simState.probeCount = 0; simState.collision = false;
    simState.insertedIndex = null; simState.discardedIndices.clear();
    simState.inspectingIndex = null; simState.foundIndex = null;

    if (currentAlgo.startsWith('hash')) {
        const exprElement = document.getElementById('formula-expression');
        if (exprElement) {
            if (currentAlgo === 'hash-modulo') exprElement.innerHTML = `h(k) = k mod ${hashTableSize}`;
            else if (currentAlgo === 'hash-cuadrado') exprElement.innerHTML = `h(k) = centro(k<sup>2</sup>)`;
            else if (currentAlgo === 'hash-plegamiento') exprElement.innerHTML = `h(k) = suma_partes(k) mod ${hashTableSize}`;
            else if (currentAlgo === 'hash-truncamiento') exprElement.innerHTML = `h(k) = truncar(k) mod ${hashTableSize}`;
        }
        setStatusBanner(`Seleccione la <strong>Operación</strong>, ingrese la clave y presione <strong>Siguiente Paso</strong>.`);
    } else {
        setStatusBanner(`Ingrese un valor a buscar y presione <strong>Siguiente Paso</strong> o <strong>Automático</strong>.`);
    }
    renderArrayVisualizer();
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
    
    const prefix = document.createElement('span');
    prefix.className = 'log-prefix';
    prefix.textContent = '> ';

    const textSpan = document.createElement('span');
    textSpan.innerHTML = message;

    li.appendChild(prefix);
    li.appendChild(textSpan);
    logContainer.appendChild(li);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function clearLogs() {
    const logContainer = document.getElementById('execution-logs');
    if (logContainer) {
        logContainer.innerHTML = '';
        addLog("Registro de ejecución limpio. Listo para nueva simulación.", "info");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('target-value');
    if (input) input.value = ""; 
    renderArrayVisualizer();
});
// ==========================================
// 1. Lógica para el acordeón de la barra lateral
// ==========================================
const accordions = document.querySelectorAll(".accordion");

accordions.forEach(acc => {
    acc.addEventListener("click", function () {
        this.classList.toggle("active");
        const panel = this.nextElementSibling;
        if (panel && panel.classList.contains("panel")) {
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
            }
        }
    });
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
// 3. Base de Datos Local de Algoritmos
// ==========================================
const algorithmsData = {
    secuencial: {
        id: "secuencial",
        titulo: "Búsqueda Secuencial (Lineal)",
        badge: "Búsqueda Secuencial",
        tiempo: "O(n)",
        espacio: "O(1)",
        descripcion: "Examina secuencialmente cada elemento del arreglo desde el índice 0 hasta encontrar el valor objetivo o recorrer toda la estructura. No requiere que el arreglo esté ordenado."
    },
    binaria: {
        id: "binaria",
        titulo: "Búsqueda Binaria",
        badge: "Búsqueda Binaria",
        tiempo: "O(log n)",
        espacio: "O(1)",
        descripcion: "Requiere que la colección esté previamente ordenada. Divide iterativamente el espacio de búsqueda calculando el punto medio (Med). Descarta la mitad donde no puede estar el elemento ajustando los punteros Izq y Der."
    },
    transformacion: {
        id: "transformacion",
        titulo: "Búsqueda por Transformación de Claves (Hashing)",
        badge: "Hashing Directo",
        tiempo: "O(1) [Promedio] / O(n) [Peor]",
        espacio: "O(n)",
        descripcion: "Calcula directamente la dirección de memoria o índice aplicando una función hash h(k) = k % N sobre la clave buscada, logrando acceso inmediato en tiempo constante."
    },
    'hash-modulo': {
        id: "hash-modulo",
        titulo: "Función Hash por Módulo (Division Method)",
        badge: "Hash Módulo: h(k) = k mod N",
        tiempo: "O(1) [Promedio] / O(n) [Peor]",
        espacio: "O(N) Tabla Hash",
        descripcion: "Calcula directamente la cubeta o índice en la tabla mediante la fórmula h(k) = k mod N, donde N es el tamaño de la tabla (usualmente un número primo). Permite la inserción, búsqueda, eliminación y detección interactiva de colisiones."
    },
    'hash-cuadrado': {
        id: "hash-cuadrado",
        titulo: "Función Hash por Cuadrado (Centro del Cuadrado)",
        badge: "Hash Cuadrado",
        tiempo: "O(1) [Promedio]",
        espacio: "O(N)",
        descripcion: "Eleva la clave al cuadrado k^2 y extrae los dígitos centrales para determinar el índice de la tabla hash."
    },
    'hash-reasignacion': {
        id: "hash-reasignacion",
        titulo: "Manejo de Colisiones: Reasignación (Open Addressing)",
        badge: "Reasignación Lineal",
        tiempo: "O(1) [Promedio] / O(n) [Peor]",
        espacio: "O(N)",
        descripcion: "Resuelve colisiones buscando secuencialmente la siguiente posición libre en la tabla hash mediante sondeo lineal."
    },
    'hash-encadenamiento': {
        id: "hash-encadenamiento",
        titulo: "Manejo de Colisiones: Encadenamiento (Chaining)",
        badge: "Encadenamiento",
        tiempo: "O(1 + alpha)",
        espacio: "O(N + n)",
        descripcion: "Mantiene una lista enlazada en cada cubeta de la tabla hash para almacenar múltiples claves que colisionan en la misma dirección."
    },
    'arboles-2d': {
        id: "arboles-2d",
        titulo: "Búsqueda en Árboles 2D e Índices",
        badge: "Índices & Árboles",
        tiempo: "O(log n)",
        espacio: "O(n)",
        descripcion: "Estructuras de búsqueda jerárquicas e índices primarios/secundarios para acelerar el acceso a datos ordenados."
    }
};

// ==========================================
// 4. Estado Global de la Simulación
// ==========================================
let currentAlgo = 'binaria';
let arrayData = [];

// Tabla Hash para Función Hash Módulo (N = 10)
let hashTableSize = 10;
let hashTableData = new Array(hashTableSize).fill(null);

let simState = {
    started: false,
    finished: false,
    target: null,
    stepCount: 0,
    autoTimer: null,
    // Punteros Binaria
    left: 0,
    right: 9,
    mid: null,
    subPhase: 'calc_mid', // 'calc_mid' -> 'compare' | para hash: 'calc_hash' -> 'execute_action'
    // Puntero Secuencial
    currentIndex: 0,
    // Puntero Hashing
    hashIndex: null,
    collision: false,
    insertedIndex: null,
    // Celdas descartadas y resultado
    discardedIndices: new Set(),
    inspectingIndex: null,
    foundIndex: null,
    hashIndex: null,
    originalHash: null, // NUEVO: Para recordar el índice base en el sondeo lineal
    probeCount: 0,      // NUEVO: Contador de saltos en colisión
    collision: false,
};


// ==========================================
// 5. Carga de Algoritmo en el Workspace
// ==========================================
function loadAlgorithm(algoId) {
    showView('algorithm-view');

    const data = algorithmsData[algoId];
    if (!data) return;

    currentAlgo = algoId;

    // Actualizar Encabezados y Complejidades
    const titleElement = document.getElementById('current-algorithm-title');
    const badgeElement = document.getElementById('algo-badge');
    const timeElement = document.getElementById('time-complexity');
    const spaceElement = document.getElementById('space-complexity');
    const descElement = document.getElementById('algorithm-description');

    if (titleElement) titleElement.textContent = data.titulo;
    if (badgeElement) badgeElement.textContent = data.badge;
    if (timeElement) timeElement.textContent = data.tiempo;
    if (spaceElement) spaceElement.textContent = data.espacio;
    if (descElement) descElement.textContent = data.descripcion;

    // UI adaptada para Hash Módulo y Estrategias
    const hashActionContainer = document.getElementById('hash-action-container');
    const colStrategyContainer = document.getElementById('collision-strategy-container');
    const formulaBox = document.getElementById('formula-box');
    const inputLabel = document.getElementById('input-data-label');
    const btnStepText = document.getElementById('btn-step-text');
    const targetInput = document.getElementById('target-value');

    // Mostrar menú de colisiones solo si es un algoritmo Hash
    if (algoId.startsWith('hash')) {
        if (hashActionContainer) hashActionContainer.style.display = 'flex';
        if (colStrategyContainer) colStrategyContainer.style.display = 'flex'; 
        if (formulaBox) formulaBox.style.display = 'flex';
        if (inputLabel) inputLabel.textContent = 'Clave (k):';
        if (btnStepText) btnStepText.textContent = 'Siguiente Paso';
        
        const formulaExpr = document.getElementById('formula-expression');
        if (formulaExpr) formulaExpr.textContent = `h(k) = k mod ${hashTableSize}`;
        
        // --- CAMBIO AQUÍ ---
        if (targetInput) targetInput.value = ''; 
    } else {
        if (hashActionContainer) hashActionContainer.style.display = 'none';
        if (colStrategyContainer) colStrategyContainer.style.display = 'none'; 
        if (formulaBox) formulaBox.style.display = 'none';
        if (inputLabel) inputLabel.textContent = 'Buscar valor:';
        if (btnStepText) btnStepText.textContent = 'Siguiente Paso';
        
        // --- CAMBIO AQUÍ ---
        if (targetInput) targetInput.value = ''; 
    }

    resetSimulation();
    addLog(`Algoritmo cargado: <strong>${data.titulo}</strong>.`, 'info');
}

// ==========================================
// 6. Renderizado del Arreglo y Punteros
// ==========================================
function renderArrayVisualizer() {
    const container = document.getElementById('array-visualizer');
    if (!container) return;

    container.innerHTML = '';

    if (currentAlgo === 'hash-modulo') {
        hashTableData.forEach((val, idx) => {
            const cell = document.createElement('div');
            cell.className = 'array-cell';
            cell.id = `cell-${idx}`;

            const isEmpty = val === null;
            const isInspecting = simState.inspectingIndex === idx;
            const isFound = simState.foundIndex === idx;
            const isInserted = simState.insertedIndex === idx;
            const isCollision = simState.collision && simState.inspectingIndex === idx;

            if (isEmpty) cell.classList.add('cell-empty');
            if (isInspecting && !isCollision) cell.classList.add('cell-inspecting');
            if (isFound || isInserted) cell.classList.add('cell-found');
            if (isCollision) cell.classList.add('cell-collision');

            const badges = [];
            if (isCollision) {
                badges.push({ type: 'collision', label: `Colisión (${idx})` });
            } else if (isFound) {
                badges.push({ type: 'mid', label: `Hallado (${idx})` });
            } else if (isInserted) {
                badges.push({ type: 'mid', label: `Insertado (${idx})` });
            } else if (isInspecting) {
                badges.push({ type: 'single', label: `Hash (${idx})` });
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

            if (isInspecting || isFound || isInserted || isCollision) {
                const bottomIndicator = document.createElement('div');
                bottomIndicator.className = 'cell-bottom-indicator';
                if (isFound || isInserted) bottomIndicator.classList.add('indicator-found');

                const arrowGlyph = document.createElement('span');
                arrowGlyph.className = 'indicator-arrow';
                arrowGlyph.innerHTML = '&#9650;';

                const pill = document.createElement('span');
                pill.className = 'indicator-pill';

                if (isCollision) {
                    pill.innerHTML = `<strong>Colisión</strong> Cubeta [${idx}] = ${val}`;
                } else if (isFound) {
                    pill.innerHTML = `<strong>¡Encontrado!</strong> [${idx}] = ${val}`;
                } else if (isInserted) {
                    pill.innerHTML = `<strong>¡Insertado!</strong> h(k) -> [${idx}]`;
                } else {
                    pill.innerHTML = `Calculado: <strong>[${idx}]</strong>`;
                }

                bottomIndicator.appendChild(arrowGlyph);
                bottomIndicator.appendChild(pill);
                cell.appendChild(bottomIndicator);
            }

            container.appendChild(cell);
        });
        return;
    }

    arrayData.forEach((val, idx) => {
        const cell = document.createElement('div');
        cell.className = 'array-cell';
        cell.id = `cell-${idx}`;

        // Determinar estados de la celda
        const isDiscarded = simState.discardedIndices.has(idx);
        const isInspecting = simState.inspectingIndex === idx;
        const isFound = simState.foundIndex === idx;
        const inActiveRange = currentAlgo === 'binaria' && simState.started && !simState.finished 
                              && idx >= simState.left && idx <= simState.right;

        if (isDiscarded) cell.classList.add('cell-discarded');
        if (inActiveRange && !isInspecting && !isFound) cell.classList.add('cell-active');
        if (isInspecting) cell.classList.add('cell-inspecting');
        if (isFound) cell.classList.add('cell-found');

        // Punteros superiores (Izq, Med, Der) - Sencillos y limpios
        const badges = [];
        if (currentAlgo === 'binaria' && simState.started && !simState.finished) {
            if (simState.left === idx) badges.push({ type: 'left', label: `Izq (${idx})` });
            if (simState.mid === idx) badges.push({ type: 'mid', label: `Med (${idx})` });
            if (simState.right === idx) badges.push({ type: 'right', label: `Der (${idx})` });
        } else if (currentAlgo === 'secuencial' && simState.started && !simState.finished) {
            if (simState.currentIndex === idx) {
                badges.push({ type: 'single', label: `Pos (${idx})` });
            }
        } else if (currentAlgo === 'transformacion' && simState.started && !simState.finished) {
            if (simState.hashIndex === idx) {
                badges.push({ type: 'single', label: `Hash (${idx})` });
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

        // Índice superior de la celda
        const indexSpan = document.createElement('span');
        indexSpan.className = 'cell-index';
        indexSpan.textContent = `[${idx}]`;
        cell.appendChild(indexSpan);

        // Valor dentro de la celda
        const valueSpan = document.createElement('span');
        valueSpan.className = 'cell-value';
        valueSpan.textContent = val;
        cell.appendChild(valueSpan);

        // Flecha Inferior Dinámica: apunta a la celda observada en este momento
        if (isInspecting || isFound) {
            const bottomIndicator = document.createElement('div');
            bottomIndicator.className = 'cell-bottom-indicator';
            if (isFound) bottomIndicator.classList.add('indicator-found');

            const arrowGlyph = document.createElement('span');
            arrowGlyph.className = 'indicator-arrow';
            arrowGlyph.innerHTML = '&#9650;'; // Flecha hacia arriba

            const pill = document.createElement('span');
            pill.className = 'indicator-pill';
            
            if (isFound) {
                pill.innerHTML = `<strong>¡Encontrado!</strong> arr[${idx}] = ${val}`;
            } else {
                pill.innerHTML = `Pos: <strong>${idx}</strong> | Val: <strong>${val}</strong>`;
            }

            bottomIndicator.appendChild(arrowGlyph);
            bottomIndicator.appendChild(pill);
            cell.appendChild(bottomIndicator);
        }

        container.appendChild(cell);
    });
}

// ==========================================
// 7. Motor de Simulación Paso a Paso
// ==========================================
function stepSimulation() {
    const inputElement = document.getElementById('target-value');
    if (!inputElement) return;

    // NUEVO: Si la operación anterior ya terminó, reiniciamos el estado internamente
    // para permitir ingresar el siguiente dato sin tener que presionar "Reiniciar".
    if (simState.finished) {
        stopAutoSimulation();
        simState.started = false;
        simState.finished = false;
        simState.stepCount = 0;
        
        // Limpiamos solo los punteros visuales, NO los datos almacenados
        simState.hashIndex = null;
        simState.originalHash = null;
        simState.probeCount = 0;
        simState.collision = false;
        simState.insertedIndex = null;
        simState.inspectingIndex = null;
        simState.foundIndex = null;
        simState.discardedIndices.clear();
    }

    // Si no ha iniciado (o si se acaba de reiniciar internamente), inicializamos la operación
    if (!simState.started) {
        const rawVal = inputElement.value.trim();
        if (rawVal === '') {
            setStatusBanner("Por favor ingresa un número en el campo de texto.", "notfound");
            addLog("Error: Debe ingresar un valor numérico.", "notfound");
            return;
        }

        const targetVal = parseInt(rawVal, 10);
        if (isNaN(targetVal)) {
            setStatusBanner("El valor ingresado no es un número válido.", "notfound");
            return;
        }

        initSimulationState(targetVal);
        renderArrayVisualizer();
        return;
    }

    // Ejecutar un paso según el algoritmo actual
    if (currentAlgo === 'binaria') {
        stepBinarySearch();
    } else if (currentAlgo === 'secuencial') {
        stepSequentialSearch();
    } else if (currentAlgo === 'transformacion') {
        stepHashSearch();
    } else if (currentAlgo === 'hash-modulo') {
        stepHashModulo();
    }

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
        setStatusBanner(`Iniciando Búsqueda Binaria para el valor <strong>${targetVal}</strong>. Rango inicial: [0..${arrayData.length - 1}].`);
        addLog(`Iniciando búsqueda binaria de <strong>${targetVal}</strong> en arreglo de ${arrayData.length} elementos.`, 'step');
    } else if (currentAlgo === 'secuencial') {
        simState.currentIndex = 0;
        setStatusBanner(`Iniciando Búsqueda Secuencial para el valor <strong>${targetVal}</strong> desde la posición 0.`);
        addLog(`Iniciando búsqueda secuencial de <strong>${targetVal}</strong> desde el índice 0.`, 'step');
    } else if (currentAlgo === 'transformacion') {
        simState.hashIndex = null;
        simState.subPhase = 'calc_hash';
        setStatusBanner(`Iniciando Hashing para el valor <strong>${targetVal}</strong>. Aplicando función h(k) = k % ${arrayData.length}.`);
        addLog(`Función hash seleccionada: h(k) = k % ${arrayData.length}.`, 'step');
    } else if (currentAlgo === 'hash-modulo') {
        simState.hashIndex = null;
        simState.subPhase = 'calc_hash';
        const actionSelect = document.getElementById('hash-action');
        const action = actionSelect ? actionSelect.value : 'insert';
        const actionText = action === 'insert' ? 'Insertar' : (action === 'search' ? 'Buscar' : 'Eliminar');
        setStatusBanner(`Iniciando operación Hash (<strong>${actionText}</strong>) para la clave <strong>${targetVal}</strong>. Aplicando h(${targetVal}) = ${targetVal} mod ${hashTableSize}.`);
        addLog(`Operación Hash Módulo [<strong>${actionText}</strong>]: Clave k = ${targetVal}, N = ${hashTableSize}.`, 'step');
    }
}

// ------------------------------------------
// Lógica de Búsqueda Binaria Paso a Paso
// ------------------------------------------
function stepBinarySearch() {
    // Verificar si el rango es inválido (no encontrado)
    if (simState.left > simState.right) {
        simState.finished = true;
        simState.inspectingIndex = null;
        stopAutoSimulation();
        setStatusBanner(`Elemento <strong>${simState.target}</strong> NO se encuentra en el arreglo (Izq > Der).`, "notfound");
        addLog(`Búsqueda finalizada: Elemento ${simState.target} no existe en el arreglo tras ${simState.stepCount} comparaciones.`, 'notfound');
        return;
    }

    if (simState.subPhase === 'calc_mid') {
        // Fase 1: Calcular punto medio y posicionar punteros y flecha inferior
        simState.stepCount++;
        simState.mid = Math.floor((simState.left + simState.right) / 2);
        simState.inspectingIndex = simState.mid;

        const midVal = arrayData[simState.mid];
        setStatusBanner(`Paso ${simState.stepCount}: Rango [${simState.left}..${simState.right}] -> <strong>Medio = ${simState.mid}</strong> (Valor: <strong>${midVal}</strong>). Evaluando posición.`);
        addLog(`Paso ${simState.stepCount}: Rango [${simState.left}..${simState.right}]. Punto medio calculado en índice ${simState.mid} (arr[${simState.mid}] = ${midVal}).`, 'step');

        simState.subPhase = 'compare';
    } else if (simState.subPhase === 'compare') {
        // Fase 2: Comparar y decidir siguiente paso
        const midVal = arrayData[simState.mid];

        if (midVal === simState.target) {
            // ¡Encontrado!
            simState.finished = true;
            simState.foundIndex = simState.mid;
            simState.inspectingIndex = simState.mid;
            stopAutoSimulation();

            setStatusBanner(`¡Éxito! Elemento <strong>${simState.target}</strong> encontrado en la posición <strong>[${simState.mid}]</strong> en ${simState.stepCount} pasos.`, "found");
            addLog(`¡Coincidencia encontrada! arr[${simState.mid}] == ${simState.target}. Búsqueda exitosa.`, 'found');
        } else if (midVal < simState.target) {
            // Valor objetivo es mayor -> descartar mitad izquierda [left..mid]
            for (let i = simState.left; i <= simState.mid; i++) {
                simState.discardedIndices.add(i);
            }
            addLog(`arr[${simState.mid}] (${midVal}) < ${simState.target}. El objetivo es mayor: se descarta [${simState.left}..${simState.mid}]. Nuevo Izq = ${simState.mid + 1}.`, 'discard');
            simState.left = simState.mid + 1;
            simState.subPhase = 'calc_mid';

            if (simState.left > simState.right) {
                simState.finished = true;
                simState.inspectingIndex = null;
                stopAutoSimulation();
                setStatusBanner(`Elemento <strong>${simState.target}</strong> no encontrado. El rango de búsqueda se ha agotado.`, "notfound");
                addLog(`Fin de búsqueda: Rango agotado (Izq=${simState.left} > Der=${simState.right}). Elemento no encontrado.`, 'notfound');
            } else {
                setStatusBanner(`Valor arr[${simState.mid}] (${midVal}) < ${simState.target}. Descartada mitad izquierda. Nuevo rango [${simState.left}..${simState.right}].`);
            }
        } else {
            // Valor objetivo es menor -> descartar mitad derecha [mid..right]
            for (let i = simState.mid; i <= simState.right; i++) {
                simState.discardedIndices.add(i);
            }
            addLog(`arr[${simState.mid}] (${midVal}) > ${simState.target}. El objetivo es menor: se descarta [${simState.mid}..${simState.right}]. Nuevo Der = ${simState.mid - 1}.`, 'discard');
            simState.right = simState.mid - 1;
            simState.subPhase = 'calc_mid';

            if (simState.left > simState.right) {
                simState.finished = true;
                simState.inspectingIndex = null;
                stopAutoSimulation();
                setStatusBanner(`Elemento <strong>${simState.target}</strong> no encontrado. El rango de búsqueda se ha agotado.`, "notfound");
                addLog(`Fin de búsqueda: Rango agotado (Izq=${simState.left} > Der=${simState.right}). Elemento no encontrado.`, 'notfound');
            } else {
                setStatusBanner(`Valor arr[${simState.mid}] (${midVal}) > ${simState.target}. Descartada mitad derecha. Nuevo rango [${simState.left}..${simState.right}].`);
            }
        }
    }
}

// ------------------------------------------
// Lógica de Búsqueda Secuencial Paso a Paso
// ------------------------------------------
function stepSequentialSearch() {
    if (simState.currentIndex >= arrayData.length) {
        simState.finished = true;
        simState.inspectingIndex = null;
        stopAutoSimulation();
        setStatusBanner(`Fin del arreglo. Elemento <strong>${simState.target}</strong> no encontrado.`, "notfound");
        addLog(`Búsqueda finalizada: Se examinaron los ${arrayData.length} elementos sin encontrar el objetivo.`, 'notfound');
        return;
    }

    simState.stepCount++;
    const idx = simState.currentIndex;
    const val = arrayData[idx];
    simState.inspectingIndex = idx;

    if (val === simState.target) {
        // Encontrado
        simState.finished = true;
        simState.foundIndex = idx;
        stopAutoSimulation();
        setStatusBanner(`¡Éxito! Elemento <strong>${simState.target}</strong> encontrado en el índice <strong>[${idx}]</strong> en ${simState.stepCount} pasos.`, "found");
        addLog(`Paso ${simState.stepCount}: arr[${idx}] = ${val} == ${simState.target}. ¡Elemento encontrado!`, 'found');
    } else {
        // No coincide, descartar y avanzar
        simState.discardedIndices.add(idx);
        setStatusBanner(`Paso ${simState.stepCount}: Inspeccionando arr[${idx}] = <strong>${val}</strong>. ¿${val} == ${simState.target}? No coincide. Avanzando...`);
        addLog(`Paso ${simState.stepCount}: Evaluando arr[${idx}] = ${val}. No coincide con ${simState.target}.`, 'compare');
        simState.currentIndex++;

        if (simState.currentIndex >= arrayData.length) {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`Fin del arreglo. Elemento <strong>${simState.target}</strong> no encontrado.`, "notfound");
            addLog(`Se recorrió todo el arreglo sin encontrar el valor ${simState.target}.`, 'notfound');
        }
    }
}

// ------------------------------------------
// Lógica de Transformación de Claves (Hashing)
// ------------------------------------------
function stepHashSearch() {
    if (simState.subPhase === 'calc_hash') {
        simState.stepCount = 1;
        const n = arrayData.length;
        simState.hashIndex = Math.abs(simState.target) % n;
        simState.inspectingIndex = simState.hashIndex;

        setStatusBanner(`Paso 1: Calculando dirección hash: h(${simState.target}) = ${simState.target} % ${n} = <strong>Posición [${simState.hashIndex}]</strong>.`);
        addLog(`Cálculo hash: h(${simState.target}) = ${simState.target} % ${n} = ${simState.hashIndex}. Accediendo directamente al índice ${simState.hashIndex}.`, 'step');

        simState.subPhase = 'check_bucket';
    } else if (simState.subPhase === 'check_bucket') {
        const val = arrayData[simState.hashIndex];
        simState.finished = true;
        stopAutoSimulation();

        if (val === simState.target) {
            simState.foundIndex = simState.hashIndex;
            setStatusBanner(`¡Éxito O(1)! Clave encontrada directamente en la cubeta/índice <strong>[${simState.hashIndex}]</strong>.`, "found");
            addLog(`¡Coincidencia directa! arr[${simState.hashIndex}] == ${simState.target}. Tiempo de búsqueda: O(1).`, 'found');
        } else {
            arrayData.forEach((_, i) => {
                if (i !== simState.hashIndex) simState.discardedIndices.add(i);
            });
            setStatusBanner(`En la cubeta [${simState.hashIndex}] se encuentra el valor <strong>${val}</strong> (No coincide con ${simState.target}). Requiere manejo de colisión o no existe.`, "notfound");
            addLog(`Inspección en bucket [${simState.hashIndex}]: contiene ${val} (esperado ${simState.target}). Colisión detectada o clave no presente.`, 'notfound');
        }
    }
}

// ------------------------------------------
// Lógica de Función Hash por Módulo Paso a Paso
// ------------------------------------------
function stepHashModulo() {
    const actionSelect = document.getElementById('hash-action');
    const strategySelect = document.getElementById('collision-strategy');
    
    const action = actionSelect ? actionSelect.value : 'insert';
    const strategy = strategySelect ? strategySelect.value : 'detener';
    const k = simState.target;
    const n = hashTableSize;

    if (simState.subPhase === 'calc_hash') {
        simState.stepCount = 1;
        simState.originalHash = Math.abs(k) % n;
        simState.hashIndex = simState.originalHash;
        simState.inspectingIndex = simState.hashIndex;
        simState.probeCount = 0;

        const exprElement = document.getElementById('formula-expression');
        if (exprElement) exprElement.textContent = `h(${k}) = ${k} mod ${n} = ${simState.hashIndex}`;

        setStatusBanner(`Paso 1: h(<strong>${k}</strong>) = <strong>Cubeta [${simState.hashIndex}]</strong>.`);
        addLog(`Paso 1: Direccionando a cubeta [${simState.hashIndex}].`, 'step');
        simState.subPhase = 'execute_action';

    } else if (simState.subPhase === 'execute_action' || simState.subPhase === 'resolve_linear') {
        
        // Si estamos en sondeo lineal, calculamos el nuevo índice
        if (simState.subPhase === 'resolve_linear') {
            simState.hashIndex = (simState.originalHash + simState.probeCount) % n;
            simState.inspectingIndex = simState.hashIndex;
            simState.collision = false; // Reiniciamos visualmente para la nueva celda
        }

        const hIdx = simState.hashIndex;
        const currentVal = hashTableData[hIdx];

        // Prevención de ciclo infinito en sondeo lineal
        if (simState.probeCount >= n) {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`<strong>Tabla Llena:</strong> No hay espacios disponibles para la clave ${k}.`, "notfound");
            addLog(`Error: Tabla hash llena tras ${simState.probeCount} intentos.`, 'notfound');
            return;
        }

        // Lógica de validación
        const isEmpty = currentVal === null;
        // Para encadenamiento, verificamos si la clave ya está en el string/array simulado
        const isMatch = currentVal === k || (typeof currentVal === 'string' && currentVal.includes(k.toString()));

        if (action === 'insert') {
            if (isEmpty || isMatch) {
                hashTableData[hIdx] = k;
                simState.insertedIndex = hIdx;
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`¡Éxito! Clave <strong>${k}</strong> insertada en <strong>[${hIdx}]</strong>.`, "found");
                addLog(`Inserción exitosa en [${hIdx}].`, 'found');
            } else {
                handleCollision(hIdx, currentVal, strategy, k, action);
            }
        } else if (action === 'search') {
            if (isMatch) {
                simState.foundIndex = hIdx;
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`¡Éxito! Clave <strong>${k}</strong> encontrada en <strong>[${hIdx}]</strong>.`, "found");
                addLog(`Clave encontrada en [${hIdx}].`, 'found');
            } else if (isEmpty && strategy !== 'encadenamiento') {
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`Celda vacía. La clave <strong>${k}</strong> no existe en la tabla.`, "notfound");
            } else {
                handleCollision(hIdx, currentVal, strategy, k, action);
            }
        } else if (action === 'delete') {
            if (isMatch) {
                hashTableData[hIdx] = null;
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`¡Éxito! Clave <strong>${k}</strong> eliminada.`, "found");
                addLog(`Clave eliminada de [${hIdx}].`, 'found');
            } else {
                handleCollision(hIdx, currentVal, strategy, k, action);
            }
        }
    }
}

function handleCollision(hIdx, currentVal, strategy, k, action) {
    simState.collision = true;
    
    if (strategy === 'detener') {
        simState.finished = true;
        stopAutoSimulation();
        setStatusBanner(`<strong>¡COLISIÓN!</strong> [${hIdx}] contiene <strong>${currentVal}</strong>. Simulación detenida.`, "notfound");
        addLog(`Colisión en [${hIdx}]. Operación abortada por configuración.`, 'notfound');
    } 
    else if (strategy === 'lineal') {
        simState.probeCount++;
        simState.subPhase = 'resolve_linear';
        setStatusBanner(`Colisión en [${hIdx}]. Aplicando Sondeo Lineal (Intento ${simState.probeCount})... Avanzando al siguiente paso.`);
        addLog(`Colisión detectada. Calculando siguiente índice libre...`, 'compare');
    }
    else if (strategy === 'encadenamiento') {
        if (action === 'insert') {
            // Simulamos encadenamiento convirtiendo el valor en un string concatenado
            hashTableData[hIdx] = currentVal + " ➝ " + k;
            simState.insertedIndex = hIdx;
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`Encadenamiento: Clave <strong>${k}</strong> enlazada en la cubeta <strong>[${hIdx}]</strong>.`, "found");
            addLog(`Clave ${k} encadenada al nodo existente en [${hIdx}].`, 'found');
        } else {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`La clave <strong>${k}</strong> no se encontró en la lista enlazada de [${hIdx}].`, "notfound");
        }
    }
}

// ==========================================
// 8. Controles Automáticos y Auxiliares
// ==========================================
function toggleAutoSimulation() {
    if (simState.autoTimer) {
        stopAutoSimulation();
    } else {
        if (simState.finished) {
            resetSimulation();
        }
        startAutoSimulation();
    }
}

function startAutoSimulation() {
    const autoText = document.getElementById('auto-text');
    const autoIcon = document.getElementById('auto-icon');
    if (autoText) autoText.textContent = "Pausar";
    if (autoIcon) autoIcon.innerHTML = "&#10074;&#10074;";

    stepSimulation(); // Primer paso inmediato
    simState.autoTimer = setInterval(() => {
        if (simState.finished) {
            stopAutoSimulation();
        } else {
            stepSimulation();
        }
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
    
    // Limpieza de variables Hash
    simState.hashIndex = null;
    simState.originalHash = null;
    simState.probeCount = 0;
    simState.collision = false;
    simState.insertedIndex = null;
    simState.discardedIndices.clear();
    simState.inspectingIndex = null;
    simState.foundIndex = null;

    if (currentAlgo.startsWith('hash')) {
        const exprElement = document.getElementById('formula-expression');
        if (exprElement) exprElement.textContent = `h(k) = k mod ${hashTableSize}`;
        
        // --- CAMBIO AQUÍ: Actualizado el texto del banner ---
        setStatusBanner(`Ingrese una clave k y presione <strong>Siguiente Paso</strong> para iniciar la operación.`);
    } else {
        setStatusBanner(`Ingrese un valor a buscar y presione <strong>Siguiente Paso</strong> o <strong>Automático</strong> para iniciar.`);
    }

    renderArrayVisualizer();
}

function generateRandomArray() {
    stopAutoSimulation();

    // Generar 10 números aleatorios ordenados
    const set = new Set();
    while (set.size < 10) {
        set.add(Math.floor(Math.random() * 95) + 2);
    }
    arrayData = Array.from(set).sort((a, b) => a - b);

    // Sugerir un valor presente en el input
    const randomPick = arrayData[Math.floor(Math.random() * arrayData.length)];
    const input = document.getElementById('target-value');
    if (input) input.value = randomPick;

    resetSimulation();
    addLog(`Nuevo arreglo generado: [${arrayData.join(', ')}].`, 'info');
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

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('target-value');
    // --- CAMBIO AQUÍ: Lo dejamos vacío ---
    if (input) {
        input.value = ""; 
    }
    renderArrayVisualizer();
});
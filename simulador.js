// ==========================================
// 1. Motor Principal de Simulación
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

    if (currentAlgo === 'binaria') stepBinarySearch();
    else if (currentAlgo === 'secuencial') stepSequentialSearch();
    else if (currentAlgo === 'transformacion') stepHashSearch();
    else if (currentAlgo === 'hash-modulo') stepHashModulo();
    else if (currentAlgo === 'hash-cuadrado') stepHashCuadrado();

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
    } else if (currentAlgo === 'transformacion') {
        simState.hashIndex = null;
        simState.subPhase = 'calc_hash';
        setStatusBanner(`Iniciando Hashing para el valor <strong>${targetVal}</strong>. h(k) = k % ${arrayData.length}.`);
        addLog(`Función hash: h(k) = k % ${arrayData.length}.`, 'step');
    } else if (currentAlgo.startsWith('hash')) { 
        simState.hashIndex = null;
        simState.subPhase = 'calc_hash';
        const actionSelect = document.getElementById('hash-action');
        const action = actionSelect ? actionSelect.value : 'insert';
        const actionText = action === 'insert' ? 'Insertar' : (action === 'search' ? 'Buscar' : 'Eliminar');
        
        const isModulo = currentAlgo === 'hash-modulo';
        const algoName = isModulo ? 'Módulo' : 'Centro del Cuadrado';
        const formulaText = isModulo ? `h(${targetVal}) = ${targetVal} mod ${hashTableSize}` : `h(${targetVal}) = centro(${targetVal}²)`;
        
        setStatusBanner(`Iniciando operación Hash (<strong>${actionText}</strong>) para la clave <strong>${targetVal}</strong>. Aplicando ${formulaText}.`);
        addLog(`Operación Hash ${algoName} [<strong>${actionText}</strong>]: Clave k = ${targetVal}.`, 'step');
    }
}

// ==========================================
// 2. Lógicas Individuales de los Algoritmos
// ==========================================
function stepBinarySearch() {
    if (simState.left > simState.right) {
        simState.finished = true;
        simState.inspectingIndex = null;
        stopAutoSimulation();
        setStatusBanner(`Elemento <strong>${simState.target}</strong> NO encontrado (Izq > Der).`, "notfound");
        addLog(`Búsqueda finalizada: Elemento ${simState.target} no existe.`, 'notfound');
        return;
    }

    if (simState.subPhase === 'calc_mid') {
        simState.stepCount++;
        simState.mid = Math.floor((simState.left + simState.right) / 2);
        simState.inspectingIndex = simState.mid;
        const midVal = arrayData[simState.mid];
        
        if (midVal === null) {
            setStatusBanner(`Paso ${simState.stepCount}: Medio = ${simState.mid} (Espacio Vacío).`);
            addLog(`Paso ${simState.stepCount}: Punto medio cayó en celda vacía. Avanzando a la izquierda.`, 'discard');
            for (let i = simState.mid; i <= simState.right; i++) simState.discardedIndices.add(i);
            simState.right = simState.mid - 1;
            return;
        }

        setStatusBanner(`Paso ${simState.stepCount}: Medio = ${simState.mid} (Valor: <strong>${midVal}</strong>).`);
        addLog(`Paso ${simState.stepCount}: Punto medio en índice ${simState.mid}.`, 'step');
        simState.subPhase = 'compare';
    } else if (simState.subPhase === 'compare') {
        const midVal = arrayData[simState.mid];
        if (midVal === simState.target) {
            simState.finished = true;
            simState.foundIndex = simState.mid;
            stopAutoSimulation();
            setStatusBanner(`¡Éxito! Elemento <strong>${simState.target}</strong> en posición <strong>[${simState.mid}]</strong>.`, "found");
            addLog(`¡Coincidencia encontrada en [${simState.mid}]!`, 'found');
        } else if (midVal < simState.target) {
            for (let i = simState.left; i <= simState.mid; i++) simState.discardedIndices.add(i);
            simState.left = simState.mid + 1;
            simState.subPhase = 'calc_mid';
            setStatusBanner(`Valor < ${simState.target}. Descartada mitad izquierda.`);
            addLog(`El objetivo es mayor: nuevo Izq = ${simState.left}.`, 'discard');
        } else {
            for (let i = simState.mid; i <= simState.right; i++) simState.discardedIndices.add(i);
            simState.right = simState.mid - 1;
            simState.subPhase = 'calc_mid';
            setStatusBanner(`Valor > ${simState.target}. Descartada mitad derecha.`);
            addLog(`El objetivo es menor: nuevo Der = ${simState.right}.`, 'discard');
        }
    }
}

function stepSequentialSearch() {
    if (simState.currentIndex >= arrayData.length) {
        simState.finished = true;
        stopAutoSimulation();
        setStatusBanner(`Fin del arreglo. Elemento <strong>${simState.target}</strong> no encontrado.`, "notfound");
        addLog(`Búsqueda finalizada sin éxito.`, 'notfound');
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
        setStatusBanner(`¡Éxito! Elemento <strong>${simState.target}</strong> en índice <strong>[${idx}]</strong>.`, "found");
        addLog(`¡Elemento encontrado en [${idx}]!`, 'found');
    } else {
        simState.discardedIndices.add(idx);
        const valLabel = val === null ? "Vacío" : val;
        setStatusBanner(`Paso ${simState.stepCount}: ¿${valLabel} == ${simState.target}? No coincide. Avanzando...`);
        addLog(`Evaluando arr[${idx}] = ${valLabel}. No coincide.`, 'compare');
        simState.currentIndex++;
    }
}

function stepHashSearch() {
    if (simState.subPhase === 'calc_hash') {
        simState.stepCount = 1;
        const n = arrayData.length;
        simState.hashIndex = Math.abs(simState.target) % n;
        simState.inspectingIndex = simState.hashIndex;

        setStatusBanner(`Paso 1: Calculando dirección hash: h(${simState.target}) = ${simState.target} % ${n} = <strong>Posición [${simState.hashIndex}]</strong>.`);
        addLog(`Cálculo hash: h(${simState.target}) = ${simState.target} % ${n} = ${simState.hashIndex}. Accediendo al índice ${simState.hashIndex}.`, 'step');
        simState.subPhase = 'check_bucket';
    } else if (simState.subPhase === 'check_bucket') {
        const val = arrayData[simState.hashIndex];
        simState.finished = true;
        stopAutoSimulation();

        if (val === simState.target) {
            simState.foundIndex = simState.hashIndex;
            setStatusBanner(`¡Éxito O(1)! Clave encontrada directamente en <strong>[${simState.hashIndex}]</strong>.`, "found");
            addLog(`¡Coincidencia directa! arr[${simState.hashIndex}] == ${simState.target}.`, 'found');
        } else {
            arrayData.forEach((_, i) => { if (i !== simState.hashIndex) simState.discardedIndices.add(i); });
            setStatusBanner(`En la cubeta [${simState.hashIndex}] se encuentra <strong>${val}</strong> (No coincide).`, "notfound");
            addLog(`Colisión detectada o clave no presente en [${simState.hashIndex}].`, 'notfound');
        }
    }
}

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
        if (exprElement) exprElement.innerHTML = `h(${k}) = ${k} mod ${n} = <strong>${simState.hashIndex}</strong>`;

        setStatusBanner(`Paso 1: h(<strong>${k}</strong>) = <strong>Cubeta [${simState.hashIndex}]</strong>.`);
        addLog(`Paso 1: Direccionando a cubeta [${simState.hashIndex}].`, 'step');
        simState.subPhase = 'execute_action';

    } else if (simState.subPhase === 'execute_action' || simState.subPhase === 'resolve_linear') {
        if (simState.subPhase === 'resolve_linear') {
            simState.hashIndex = (simState.originalHash + simState.probeCount) % n;
            simState.inspectingIndex = simState.hashIndex;
            simState.collision = false;
        }

        const hIdx = simState.hashIndex;
        const currentVal = hashTableData[hIdx];

        if (simState.probeCount >= n) {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`<strong>Tabla Llena:</strong> No hay espacios disponibles.`, "notfound");
            addLog(`Error: Tabla hash llena tras ${simState.probeCount} intentos.`, 'notfound');
            return;
        }

        const isEmpty = currentVal === null;
        const isMatch = currentVal === k || (typeof currentVal === 'string' && currentVal.includes(k.toString()));

        if (action === 'insert') {
            if (isEmpty || isMatch) {
                hashTableData[hIdx] = k;
                simState.insertedIndex = hIdx;
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`¡Éxito! Clave <strong>${k}</strong> insertada en <strong>[${hIdx}]</strong>.`, "found");
                addLog(`Inserción exitosa en [${hIdx}].`, 'found');
            } else handleCollision(hIdx, currentVal, strategy, k, action);
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
                setStatusBanner(`Celda vacía. La clave no existe.`, "notfound");
            } else handleCollision(hIdx, currentVal, strategy, k, action);
        } else if (action === 'delete') {
            if (isMatch) {
                hashTableData[hIdx] = null;
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`¡Éxito! Clave eliminada.`, "found");
            } else handleCollision(hIdx, currentVal, strategy, k, action);
        }
    }
}

function stepHashCuadrado() {
    const actionSelect = document.getElementById('hash-action');
    const strategySelect = document.getElementById('collision-strategy');
    const action = actionSelect ? actionSelect.value : 'insert';
    const strategy = strategySelect ? strategySelect.value : 'detener';
    const k = simState.target;
    const n = hashTableSize;

    if (simState.subPhase === 'calc_hash') {
        simState.stepCount = 1;
        const kSquared = k * k;
        const sqStr = kSquared.toString();
        const midIdx = Math.floor(sqStr.length / 2);
        const midChar = sqStr.charAt(midIdx); 
        
        simState.originalHash = parseInt(midChar, 10) % n; 
        simState.hashIndex = simState.originalHash;
        simState.inspectingIndex = simState.hashIndex;
        simState.probeCount = 0;

        const exprElement = document.getElementById('formula-expression');
        if (exprElement) {
            exprElement.innerHTML = `h(${k}) &rarr; ${k}<sup>2</sup> = ${kSquared} &rarr; centro(${kSquared}) = <strong>${simState.hashIndex}</strong>`;
        }

        setStatusBanner(`Paso 1: h(<strong>${k}</strong>) = <strong>Cubeta [${simState.hashIndex}]</strong>.`);
        addLog(`Paso 1: Cálculo Cuadrado -> ${k}^2 = ${kSquared}. Dígito central = ${simState.hashIndex}.`, 'step');
        simState.subPhase = 'execute_action';

    } else if (simState.subPhase === 'execute_action' || simState.subPhase === 'resolve_linear') {
        if (simState.subPhase === 'resolve_linear') {
            simState.hashIndex = (simState.originalHash + simState.probeCount) % n;
            simState.inspectingIndex = simState.hashIndex;
            simState.collision = false; 
        }

        const hIdx = simState.hashIndex;
        const currentVal = hashTableData[hIdx];

        if (simState.probeCount >= n) {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`<strong>Tabla Llena:</strong> No hay espacios disponibles.`, "notfound");
            return;
        }

        const isEmpty = currentVal === null;
        const isMatch = currentVal === k || (typeof currentVal === 'string' && currentVal.includes(k.toString()));

        if (action === 'insert') {
            if (isEmpty || isMatch) {
                hashTableData[hIdx] = k;
                simState.insertedIndex = hIdx;
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`¡Éxito! Clave insertada en <strong>[${hIdx}]</strong>.`, "found");
            } else handleCollision(hIdx, currentVal, strategy, k, action);
        } else if (action === 'search') {
            if (isMatch) {
                simState.foundIndex = hIdx;
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`¡Éxito! Clave encontrada en <strong>[${hIdx}]</strong>.`, "found");
            } else if (isEmpty && strategy !== 'encadenamiento') {
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`Celda vacía. La clave no existe.`, "notfound");
            } else handleCollision(hIdx, currentVal, strategy, k, action);
        } else if (action === 'delete') {
            if (isMatch) {
                hashTableData[hIdx] = null;
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`¡Éxito! Clave eliminada.`, "found");
            } else handleCollision(hIdx, currentVal, strategy, k, action);
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
    } else if (strategy === 'lineal') {
        simState.probeCount++;
        simState.subPhase = 'resolve_linear';
        setStatusBanner(`Colisión en [${hIdx}]. Aplicando Sondeo Lineal (Intento ${simState.probeCount})... Avanzando.`);
        addLog(`Colisión detectada. Calculando siguiente índice libre...`, 'compare');
    } else if (strategy === 'encadenamiento') {
        if (action === 'insert') {
            hashTableData[hIdx] = currentVal + " ➝ " + k;
            simState.insertedIndex = hIdx;
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`Encadenamiento: Clave enlazada en la cubeta <strong>[${hIdx}]</strong>.`, "found");
            addLog(`Clave ${k} encadenada en [${hIdx}].`, 'found');
        } else {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`La clave no se encontró en la lista enlazada de [${hIdx}].`, "notfound");
        }
    }
}
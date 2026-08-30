// ==========================================
// LÓGICA DE FUNCIONES HASH Y COLISIONES
// ==========================================

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
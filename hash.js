// ==========================================
// LÓGICA DE FUNCIONES HASH Y COLISIONES
// ==========================================

function getHashConfig() {
    const actionSelect = document.getElementById('operation-action');
    const strategySelect = document.getElementById('collision-strategy');
    return {
        action: actionSelect ? actionSelect.value : 'search',
        strategy: strategySelect ? strategySelect.value : 'detener',
        k: simState.target,
        n: hashTableSize
    };
}

function getNextHashIndex(originalHash, probeCount, k, n, strategy) {
    if (strategy === 'cuadratica') {
        return (originalHash + Math.pow(probeCount, 2)) % n;
    } else if (strategy === 'doble') {
        let h2 = 1 + (Math.abs(k) % (n > 1 ? n - 1 : 1));
        return (originalHash + (probeCount * h2)) % n;
    } else {
        return (originalHash + probeCount) % n;
    }
}

// MOTOR SILENCIOSO DE REORGANIZACIÓN TRAS ELIMINAR
function reorganizeHashTable(strategy, n) {
    if (['lineal', 'cuadratica', 'doble'].includes(strategy)) {
        let oldData = [...hashTableData];
        hashTableData = new Array(n).fill(null);
        let reorderedCount = 0;
        
        for (let i = 0; i < oldData.length; i++) {
            let val = oldData[i];
            if (val !== null) {
                silentInsert(val, n, strategy);
                reorderedCount++;
            }
        }
        if (reorderedCount > 0) {
            addLog(`Se revalidó y reorganizó la estructura Hash (${reorderedCount} elementos reubicados) para mantener la integridad de los caminos de búsqueda.`, 'info');
        }
    }
}

function silentInsert(val, n, strategy) {
    let k = parseInt(val, 10);
    let origHash = 0;
    
    if (currentAlgo === 'hash-modulo') origHash = Math.abs(k) % n;
    else if (currentAlgo === 'hash-cuadrado') {
        const sqStr = (k * k).toString();
        origHash = parseInt(sqStr.charAt(Math.floor(sqStr.length / 2)), 10) % n;
    } else if (currentAlgo === 'hash-plegamiento') {
        const strK = Math.abs(k).toString();
        let sum = 0;
        for(let i=0; i<strK.length; i+=2) sum += parseInt(strK.substring(i, i+2), 10);
        origHash = sum % n;
    } else if (currentAlgo === 'hash-truncamiento') {
        const strK = Math.abs(k).toString();
        let trunc = "";
        for(let i=0; i<strK.length; i+=2) trunc += strK[i];
        origHash = (parseInt(trunc, 10) || 0) % n;
    }

    let probeCount = 0;
    let targetIdx = origHash;
    while (probeCount < n) {
        targetIdx = getNextHashIndex(origHash, probeCount, k, n, strategy);
        if (hashTableData[targetIdx] === null) {
            hashTableData[targetIdx] = val;
            return;
        }
        probeCount++;
    }
}

function stepHashModulo() {
    const conf = getHashConfig();

    if (simState.subPhase === 'calc_hash') {
        simState.stepCount = 1;
        simState.originalHash = Math.abs(conf.k) % conf.n;
        simState.hashIndex = simState.originalHash;
        simState.inspectingIndex = simState.hashIndex;
        simState.probeCount = 0;

        const exprElement = document.getElementById('formula-expression');
        if (exprElement) exprElement.innerHTML = `h(${conf.k}) = ${conf.k} mod ${conf.n} = <strong>${simState.hashIndex}</strong>`;

        setStatusBanner(`Paso 1: h(<strong>${conf.k}</strong>) = <strong>Posición [${simState.hashIndex}]</strong>.`);
        addLog(`Paso 1: Direccionando a la posición [${simState.hashIndex}].`, 'step');
        simState.subPhase = 'execute_action';

    } else if (simState.subPhase === 'execute_action' || simState.subPhase === 'resolve_collision') {
        if (simState.subPhase === 'resolve_collision') {
            simState.hashIndex = getNextHashIndex(simState.originalHash, simState.probeCount, conf.k, conf.n, conf.strategy);
            simState.inspectingIndex = simState.hashIndex;
            simState.collision = false;
        }
        executeHashLogic(conf);
    }
}

function stepHashCuadrado() {
    const conf = getHashConfig();

    if (simState.subPhase === 'calc_hash') {
        simState.stepCount = 1;
        const kSquared = conf.k * conf.k;
        const sqStr = kSquared.toString();
        const midIdx = Math.floor(sqStr.length / 2);
        const midChar = sqStr.charAt(midIdx); 
        
        simState.originalHash = parseInt(midChar, 10) % conf.n; 
        simState.hashIndex = simState.originalHash;
        simState.inspectingIndex = simState.hashIndex;
        simState.probeCount = 0;

        const exprElement = document.getElementById('formula-expression');
        if (exprElement) {
            exprElement.innerHTML = `h(${conf.k}) &rarr; ${conf.k}<sup>2</sup> = ${kSquared} &rarr; centro(${kSquared}) = <strong>${simState.hashIndex}</strong>`;
        }

        setStatusBanner(`Paso 1: h(<strong>${conf.k}</strong>) = <strong>Posición [${simState.hashIndex}]</strong>.`);
        addLog(`Paso 1: Cálculo Cuadrado -> ${conf.k}^2 = ${kSquared}. Dígito central = ${simState.hashIndex}.`, 'step');
        simState.subPhase = 'execute_action';

    } else if (simState.subPhase === 'execute_action' || simState.subPhase === 'resolve_collision') {
        if (simState.subPhase === 'resolve_collision') {
            simState.hashIndex = getNextHashIndex(simState.originalHash, simState.probeCount, conf.k, conf.n, conf.strategy);
            simState.inspectingIndex = simState.hashIndex;
            simState.collision = false; 
        }
        executeHashLogic(conf);
    }
}

function stepHashPlegamiento() {
    const conf = getHashConfig();

    if (simState.subPhase === 'calc_hash') {
        simState.stepCount = 1;
        const strK = Math.abs(conf.k).toString();
        let sum = 0; let parts = [];
        for(let i=0; i<strK.length; i+=2) {
            let part = strK.substring(i, i+2);
            sum += parseInt(part, 10);
            parts.push(part);
        }
        
        simState.originalHash = sum % conf.n;
        simState.hashIndex = simState.originalHash;
        simState.inspectingIndex = simState.hashIndex;
        simState.probeCount = 0;

        const exprElement = document.getElementById('formula-expression');
        if (exprElement) {
            exprElement.innerHTML = `h(${conf.k}) &rarr; ${parts.join(' + ')} = ${sum} &rarr; ${sum} mod ${conf.n} = <strong>${simState.hashIndex}</strong>`;
        }

        setStatusBanner(`Paso 1: h(<strong>${conf.k}</strong>) = <strong>Posición [${simState.hashIndex}]</strong>.`);
        addLog(`Paso 1: Cálculo Plegamiento -> Suma(${parts.join(', ')}) = ${sum}. Índice = ${simState.hashIndex}.`, 'step');
        simState.subPhase = 'execute_action';

    } else if (simState.subPhase === 'execute_action' || simState.subPhase === 'resolve_collision') {
        if (simState.subPhase === 'resolve_collision') {
            simState.hashIndex = getNextHashIndex(simState.originalHash, simState.probeCount, conf.k, conf.n, conf.strategy);
            simState.inspectingIndex = simState.hashIndex;
            simState.collision = false; 
        }
        executeHashLogic(conf);
    }
}

function stepHashTruncamiento() {
    const conf = getHashConfig();

    if (simState.subPhase === 'calc_hash') {
        simState.stepCount = 1;
        const strK = Math.abs(conf.k).toString();
        let trunc = "";
        for(let i=0; i<strK.length; i+=2) { trunc += strK[i]; }
        const valTrunc = parseInt(trunc, 10) || 0;
        
        simState.originalHash = valTrunc % conf.n;
        simState.hashIndex = simState.originalHash;
        simState.inspectingIndex = simState.hashIndex;
        simState.probeCount = 0;

        const exprElement = document.getElementById('formula-expression');
        if (exprElement) {
            exprElement.innerHTML = `h(${conf.k}) &rarr; extrae_impares(${strK}) &rarr; ${valTrunc} mod ${conf.n} = <strong>${simState.hashIndex}</strong>`;
        }

        setStatusBanner(`Paso 1: h(<strong>${conf.k}</strong>) = <strong>Posición [${simState.hashIndex}]</strong>.`);
        addLog(`Paso 1: Cálculo Truncamiento -> Extraer dígitos = ${valTrunc}. Índice = ${simState.hashIndex}.`, 'step');
        simState.subPhase = 'execute_action';

    } else if (simState.subPhase === 'execute_action' || simState.subPhase === 'resolve_collision') {
        if (simState.subPhase === 'resolve_collision') {
            simState.hashIndex = getNextHashIndex(simState.originalHash, simState.probeCount, conf.k, conf.n, conf.strategy);
            simState.inspectingIndex = simState.hashIndex;
            simState.collision = false; 
        }
        executeHashLogic(conf);
    }
}

function executeHashLogic(conf) {
    const hIdx = simState.hashIndex;
    const currentVal = hashTableData[hIdx];

    if (simState.probeCount >= conf.n) {
        simState.finished = true;
        stopAutoSimulation();
        setStatusBanner(`<strong>Límite Alcanzado:</strong> No se encontraron espacios libres tras ${conf.n} saltos.`, "notfound");
        addLog(`Error: Estructura llena o ciclo infinito detectado. Abortando.`, 'notfound');
        return;
    }

    const isEmpty = currentVal === null;
    let isMatch = false;
    
    if (!isEmpty) {
        if (currentVal === conf.k) {
            isMatch = true;
        } else if (typeof currentVal === 'string') {
            let parts = currentVal.replace(/[\[\]]/g, '').split(/ ➝ |, /);
            isMatch = parts.includes(String(conf.k));
        }
    }

    if (conf.action === 'insert') {
        if (isEmpty || isMatch) {
            hashTableData[hIdx] = conf.k;
            simState.insertedIndex = hIdx;
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`¡Éxito! Clave <strong>${conf.k}</strong> insertada en <strong>[${hIdx}]</strong>.`, "found");
            addLog(`Inserción exitosa en la posición [${hIdx}].`, 'found');
        } else {
            handleCollision(hIdx, currentVal, conf.strategy, conf.k, conf.action);
        }
    } else if (conf.action === 'search') {
        if (isMatch) {
            simState.foundIndex = hIdx;
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`¡Éxito! Clave <strong>${conf.k}</strong> encontrada en <strong>[${hIdx}]</strong>.`, "found");
            addLog(`Clave encontrada en [${hIdx}].`, 'found');
        } else if (isEmpty && conf.strategy !== 'encadenamiento' && conf.strategy !== 'anidados') {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`Posición vacía. La clave no existe en la estructura.`, "notfound");
        } else {
            handleCollision(hIdx, currentVal, conf.strategy, conf.k, conf.action);
        }
    } else if (conf.action === 'delete') {
        if (isMatch) {
            if (typeof currentVal === 'string' && (conf.strategy === 'encadenamiento' || conf.strategy === 'anidados')) {
                let parts = [];
                if (conf.strategy === 'encadenamiento') {
                    parts = currentVal.split(' ➝ ').filter(p => p !== String(conf.k));
                    hashTableData[hIdx] = parts.length > 0 ? parts.join(' ➝ ') : null;
                } else if (conf.strategy === 'anidados') {
                    parts = currentVal.replace(/[\[\]]/g, '').split(', ').filter(p => p !== String(conf.k));
                    hashTableData[hIdx] = parts.length > 0 ? (parts.length === 1 ? parts[0] : `[${parts.join(', ')}]`) : null;
                }
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`¡Éxito! Clave eliminada del sistema.`, "found");
                addLog(`Operación completada: Clave extraída de la lista anidada en [${hIdx}].`, 'found');
            } else {
                hashTableData[hIdx] = null;
                simState.finished = true;
                stopAutoSimulation();
                setStatusBanner(`¡Éxito! Clave eliminada de la estructura.`, "found");
                addLog(`Operación completada: Clave eliminada del índice [${hIdx}].`, 'found');
                
                // Disparo de reorganización global para arreglar caminos rotos
                reorganizeHashTable(conf.strategy, conf.n);
            }
        } else {
            handleCollision(hIdx, currentVal, conf.strategy, conf.k, conf.action);
        }
    }
}

function handleCollision(hIdx, currentVal, strategy, k, action) {
    simState.collision = true;
    
    if (strategy === 'detener') {
        simState.finished = true;
        stopAutoSimulation();
        setStatusBanner(`<strong>¡COLISIÓN!</strong> [${hIdx}] contiene datos. Simulación detenida.`, "notfound");
        addLog(`Colisión en la posición [${hIdx}]. Operación abortada por configuración.`, 'notfound');
        
    } else if (strategy === 'lineal' || strategy === 'cuadratica' || strategy === 'doble') {
        simState.probeCount++;
        simState.subPhase = 'resolve_collision';
        
        let stratName = strategy === 'lineal' ? 'Sondeo Lineal' : (strategy === 'cuadratica' ? 'Sondeo Cuadrático' : 'Doble Hash');
        setStatusBanner(`Colisión en [${hIdx}]. Aplicando ${stratName} (Intento ${simState.probeCount})...`);
        addLog(`Colisión detectada. Calculando salto por ${stratName}...`, 'compare');
        
    } else if (strategy === 'encadenamiento') {
        if (action === 'insert') {
            hashTableData[hIdx] = currentVal + " ➝ " + k;
            simState.insertedIndex = hIdx;
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`Listas Enlazadas: Clave anidada exitosamente en la posición <strong>[${hIdx}]</strong>.`, "found");
            addLog(`Clave ${k} enlazada secuencialmente en [${hIdx}].`, 'found');
        } else {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`La clave no se encontró dentro de la lista enlazada en [${hIdx}].`, "notfound");
        }
        
    } else if (strategy === 'anidados') {
        if (action === 'insert') {
            let valStr = String(currentVal);
            if (valStr.startsWith('[') && valStr.endsWith(']')) {
                hashTableData[hIdx] = valStr.substring(0, valStr.length - 1) + `, ${k}]`;
            } else {
                hashTableData[hIdx] = `[${currentVal}, ${k}]`;
            }
            simState.insertedIndex = hIdx;
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`Arreglos Anidados: Clave agregada a la posición <strong>[${hIdx}]</strong>.`, "found");
            addLog(`Clave ${k} almacenada en el arreglo interno de [${hIdx}].`, 'found');
        } else {
            simState.finished = true;
            stopAutoSimulation();
            setStatusBanner(`La clave no se encontró dentro del Arreglo Anidado en [${hIdx}].`, "notfound");
        }
    }
}
// ==========================================
// LÓGICA DE BÚSQUEDAS INTERNAS
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

    if (val === null) {
        simState.finished = true;
        stopAutoSimulation();
        setStatusBanner(`Espacio vacío alcanzado. Elemento <strong>${simState.target}</strong> no existe en la estructura.`, "notfound");
        addLog(`Fin de los datos: Se alcanzó una celda vacía sin encontrar ${simState.target}.`, 'notfound');
        return;
    }

    if (val === simState.target) {
        simState.finished = true;
        simState.foundIndex = idx;
        stopAutoSimulation();
        setStatusBanner(`¡Éxito! Elemento <strong>${simState.target}</strong> en índice <strong>[${idx}]</strong>.`, "found");
        addLog(`¡Elemento encontrado en [${idx}]!`, 'found');
        
    } else if (val > simState.target) {
        simState.finished = true;
        stopAutoSimulation();
        simState.discardedIndices.add(idx);
        setStatusBanner(`Valor <strong>${val}</strong> es mayor que ${simState.target}. Búsqueda detenida (estructura ordenada).`, "notfound");
        addLog(`Parada óptima: ${val} > ${simState.target}. Al estar ordenado, no puede estar más adelante.`, 'notfound');
        
    } else {
        simState.discardedIndices.add(idx);
        setStatusBanner(`Paso ${simState.stepCount}: ¿${val} == ${simState.target}? Es menor. Avanzando...`);
        addLog(`Evaluando arr[${idx}] = ${val}. Es menor que ${simState.target}, continuamos.`, 'compare');
        simState.currentIndex++;
    }
}
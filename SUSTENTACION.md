# Lista de verificación para la sustentación

Abra `index.html` directamente en el navegador (no requiere servidor). Cada tema se puede abrir también por URL, p. ej. `index.html#g-dijkstra`.
En todos los temas: **Siguiente Paso** avanza la traza, **Automático** la reproduce, **Reiniciar** la rebobina, y el **Registro de Ejecución** muestra cada decisión del algoritmo.

## Módulo 1 — Búsquedas, hashing y estructuras digitales

| # | Tema | Prueba | Resultado esperado |
|---|------|--------|--------------------|
| 1 | Búsqueda secuencial | Preset clase, buscar `30` en modo *Ordenada* | Parada temprana en `33 > 30`, “se evitaron … comparaciones” |
| 2 | Búsqueda secuencial | Cambiar a *Desordenada*, buscar `30` | Recorre las n posiciones |
| 3 | Búsqueda binaria | Buscar `23` | Punteros Izq/Med/Der y mitades descartadas en gris |
| 4 | Cubetas | **Preset inconsistente (2×2, 80%)** | Alerta roja: ⌈0,8·4⌉ = 4 = 100 % → **procedimiento rechazado** |
| 5 | Cubetas | Preset válido → Ejecutar | Colisiones en el área de colisiones cuentan en la DO; expansión 2→4→8 al llegar al 75 % |
| 6 | Cubetas | Operación *Eliminar* con `23, 45, 12, 37, 18, 26, 41` | Reducción al bajar la DO a ≤ 25 % (nunca por debajo de 2 cubetas) |
| 7 | Cubetas | Expansión *Parcial* | Secuencia 2→3→4→6→8 |
| 8 | Hash cuadrado | `7259`, N=100, Decimal | k² = 52693081 → centro `93` → dirección 94 |
| 9 | Hash cuadrado | Cambiar a *Binario*, N=16 | Bits centrales de k² en base 2 |
| 10 | Truncamiento | Posiciones `1,3`, clave 7259 | Toma `7` y `5` → 75 + 1 = 76 |
| 11 | Conversión de bases | b = 7, clave 7259 | 7·7³+2·7²+5·7+9 = 2543 → `43` → 44 |
| 12 | Reasignación | Preset clase con lineal y luego cuadrática | D+1, D+2… vs D+1², D+2²… |
| 13 | Encadenamiento | Preset clase | Listas enlazadas, α = n/N > 1 posible |
| 14 | Árbol digital | Preset `C A S O F E L I Z` | Claves en nodos internos, tabla Σ(Lᵢ·fᵢ) |
| 15 | Residuos | Mismo preset | Claves solo en hojas, nodos vacíos `()` al dividir |
| 16 | Residuos múltiple | m = 2 | 4 ramas `00 01 10 11` |
| 17 | Huffman | `ABRACADABRA` | Fuentes reducidas S₀…S₄, A=`1` y el resto con 3 bits, 23 bits en total |
| 18 | Rejilla | Consulta exacta `(40,40)` y *Ej. rango* | 2 accesos; celdas del rango resaltadas |
| 19 | Árbol 2D | Buscar `(60,75)` | Alterna X (niveles pares) / Y (niveles impares) |

## Módulo 2 — Árboles e índices

| # | Tema | Prueba | Resultado esperado |
|---|------|--------|--------------------|
| 20 | BST | Preset clase → *Eliminar* `30` | Caso 3 (dos hijos) con sucesor inorden `35` |
| 21 | BST | Recorrer Inorden / Preorden / Postorden | Secuencia animada; inorden queda ordenado |
| 22 | AVL | Presets II, DD, ID, DI | FE = h(der) − h(izq) sobre cada nodo; rotación correcta en el log |
| 23 | AVL | Preset clase `10,20,30,25,28,5,3,27` | Varias rotaciones; “¿AVL válido? Sí” al final |
| 24 | Índice primario | Disperso vs. Denso, buscar la clave sugerida | Bloques de índice leídos + 1 bloque de datos |
| 25 | Índice multinivel | fo = 3, N = 40 | Un acceso por nivel + datos |
| 26 | Calculadora I/O | Preset clase (30000, 100, 1024, 9, 6) | bfr=10, b=3000, bfrᵢ=68, bᵢ=45 → 7 accesos; secundario bₛ=442 → 10; binaria 12 |

## Módulo 3 — Grafos

Los presets marcados «de clase» reproducen los ejemplos de `Transcripciones.txt`.

| # | Tema | Prueba | Resultado esperado |
|---|------|--------|--------------------|
| 27 | Inspector | Preset *Con articulaciones* → clic en vértices/aristas | Grado, incidencia, adyacencias, articulaciones {3,4,5}, puentes, separadores |
| 28 | Isomorfismo | Botón *Ejemplo isomorfo* | K₃,₃ ≅ C₆ con diagonales; biyección coloreada |
| 29 | Euler | Preset *Euleriano* | Fleury evita puentes; circuito numerado ①②… |
| 30 | Euler | Preset K₄ | “4 vértices de grado impar” → no euleriano |
| 31 | Hamilton | Preset Petersen, circuito | No existe circuito hamiltoniano (backtracking completo) |
| 32 | Operaciones | Suma con vértices comunes | Alerta: la suma exige S₁ ∩ S₂ = ∅ |
| 33 | Productos | G₁ = A–B y G₂ = {C–D, E} (presets de clase): □, ⊗, G₁[G₂] | 5, 2 y 11 aristas (n₁m₂+n₂m₁, 2m₁m₂, n₁m₂+n₂²m₁); columnas = G₁, filas = G₂; ⊗: (A,C)–(B,D) y (A,D)–(B,C) |
| 34 | Centro | **Figura 12 de clase** (con pesos) → botones | Σd = 22, 15, 14, 13, 12; e(v) = 7, 5, 5, 7, 6; **bicentro {2, 3}**, radio 5, diámetro 7, mediana {5} |
| 35 | Expansión | **Árbol de expansión de clase**, Kruskal | Ramas 2, 3, 3̄, 5 (el 4 forma ciclo); w(T) = 13; T y T̄ lado a lado, rango 4, nulidad 3 |
| 36 | Expansión | Comparar T₁ y T₂ | d(T₁,T₂) y árbol(es) de expansión central |
| 37 | Bellman | **Grafo del tablero 0..5**, contador en 0 | Ordinal 0,1,2,3,4,5 (empates: arriba antes que abajo); λ = 0, 2, 4, 3, 4, **λ₅ = 5**; ruta en reversa 5 ← 4 ← 3 ← 1 ← 0 |
| 38 | Bellman | Preset *Grafo del tablero SIN etiquetar*, contador en 1 | p=1, q=2, r=3, s=4, t=5, u=6 vértice a vértice (paso 1 / paso 2 en el registro) |
| 39 | Bellman | Preset *CON ciclo dirigido* | Etiqueta 0 y se detiene: ciclo 1→2→3→1 en rojo, **inconsistencia: Bellman no aplica** |
| 40 | Dijkstra | Grafo del tablero, 0 → 5 | [0, −] temporal → permanente; en 3 se rechaza [5, 0] (punteada) frente a [3, 1]; d = 5, igual que Bellman |
| 41 | Dijkstra | Preset dirigido con ciclos | Funciona con ciclos dirigidos |
| 42 | Floyd | **Floyd de clase** (4 vértices, sin pesos), *Sin optimización* | D⁽⁰⁾…D⁽⁴⁾ (5 matrices), 64 comparaciones fila a fila; final [0 1 2 3; 2 0 1 2; 1 2 0 1; ∞ ∞ ∞ 0] |
| 43 | Floyd | *Omitir fila i = j (propuesta de clase)* | 48 comparaciones, misma matriz final |

## Módulo 4 — Cortes, matrices, coloreado, independencia, matching

| # | Tema | Prueba | Resultado esperado |
|---|------|--------|--------------------|
| 44 | Cortes | K₄ | 16 árboles, 7 circuitos, 7 conjuntos de corte, 3 cortes fundamentales |
| 45 | Cortes | Pestaña *Conectividad* | κ ≤ λ ≤ δ (Whitney) y separabilidad |
| 46 | Matrices | **Matrices de clase** (dirigido) | Incidencia fila A = 1 0 1 0 0, fila B = −1 −1 0 1 0; adyacencia ±1 (A–B = 1, B–A = −1); aristas: 1–2 = −1, 1–3 = 1, 1–4 = «−1, 1» |
| 47 | Matrices | Pestaña *Circuitos* | 3 circuitos {1,4,3}, {2,4,5}, {1,2,5,3}; sentido horario: 1 sale, 4 sale, 3 entra |
| 48 | Matrices | Pestaña *Relaciones* y *Potencias Xᵏ* | Todas en ✔ (B·Aᵀ = 0, B·Cᵀ = 0, C_c = −B_tᵀ, rangos); X² cuenta recorridos de longitud 2 |
| 49 | Coloreado | Petersen | X = 3, X′ = 4, polinomio k¹⁰ − 15k⁹ + … − 704k, árbol de deleción-contracción |
| 50 | Coloreado | C₅ → pestaña *Polinomio* | Método del tablero k(k−1)³(k−2) = 24 en k = 3 → **alerta**: el exacto es (k−1)⁵ − (k−1) = 30 |
| 51 | Coloreado | K₄ / árbol | Método del tablero exacto (k(k−1)(k−2)(k−3); k(k−1)ⁿ⁻¹) |
| 52 | Independencia | **Cúbico de clase** / **Independencia de clase** / **Dominación de clase** | α = 4 ({1,4,6,7}, {2,3,5,8}), α′ = 4 ({i,j,k,l}); α = 3 ({1,3,6}); γ = 2 ({4,5}), {2,3,6} dominante independiente |
| 53 | Matching | Preset *NO simple* | Alerta: lazos y aristas múltiples → rechazado |
| 54 | Matching | **Lineal de 8 vértices**, M₀ = b, d, f | Camino M-aumentado 1…8 (a b c d e f g), inversión → M = {a, c, e, g}: máximo, maximal, perfecto y **óptimo** |
| 55 | Envolventes | Petersen | α + τ = 10 y α′ + ρ = 10 (Gallai) |

## Notas para el docente

- Ningún resultado está precalculado: todo se recalcula al editar el grafo o los datos (agregar, mover o borrar vértices y aristas; doble clic para renombrar o cambiar el peso).
- Los presets llamados “de clase” son ejemplos de referencia. Si en clase se usó un grafo distinto (por ejemplo la Figura 12), dibújelo en el editor o use **Importar** con su JSON.

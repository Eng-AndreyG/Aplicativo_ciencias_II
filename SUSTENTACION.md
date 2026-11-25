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

| # | Tema | Prueba | Resultado esperado |
|---|------|--------|--------------------|
| 27 | Inspector | Preset *Con articulaciones* → clic en vértices/aristas | Grado, incidencia, adyacencias, articulaciones {3,4,5}, puentes, separadores |
| 28 | Isomorfismo | Botón *Ejemplo isomorfo* | K₃,₃ ≅ C₆ con diagonales; biyección coloreada |
| 29 | Euler | Preset *Euleriano* | Fleury evita puentes; circuito numerado ①②… |
| 30 | Euler | Preset K₄ | “4 vértices de grado impar” → no euleriano |
| 31 | Hamilton | Preset Petersen, circuito | No existe circuito hamiltoniano (backtracking completo) |
| 32 | Operaciones | Suma con vértices comunes | Alerta: la suma exige S₁ ∩ S₂ = ∅ |
| 33 | Productos | P₃ □ K₂, P₃ × K₂, P₃[K₂] | 7, 4 y 11 aristas; coinciden con n₁m₂+n₂m₁, 2m₁m₂, n₁m₂+n₂²m₁ |
| 34 | Centro | Figura 12 → botones Centro/Radio/Diámetro/Mediana | Resaltado en la tabla de Floyd y subgrafo inducido |
| 35 | Expansión | Preset ponderado: Kruskal y Prim | Pesos repetidos `2, 2̄, 2̿`; T y T̄ lado a lado, rango y nulidad |
| 36 | Expansión | Comparar T₁ y T₂ | d(T₁,T₂) y árbol(es) de expansión central |
| 37 | Bellman | Preset *grafo de clase 0..5*, 0 → 5 | Niveles ordinales, λ₅ = 7, **3 rutas** reconstruidas en reversa |
| 38 | Bellman | Preset *CON ciclo dirigido* | Se detiene: ciclo 1→2→3→1 en rojo, **Bellman no aplica** |
| 39 | Dijkstra | Preset no dirigido, a → g | Etiquetas [d, n] temporales, permanentes (recuadro) y rechazadas (punteadas); 2 rutas de costo 9 |
| 40 | Dijkstra | Preset dirigido con ciclos | Funciona con ciclos dirigidos |
| 41 | Floyd | Preset 4 vértices, con y sin optimización | D⁽⁰⁾…D⁽⁴⁾, celdas actualizadas; 22 comparaciones frente a 64 |

## Módulo 4 — Cortes, matrices, coloreado, independencia, matching

| # | Tema | Prueba | Resultado esperado |
|---|------|--------|--------------------|
| 42 | Cortes | K₄ | 16 árboles, 7 circuitos, 7 conjuntos de corte, 3 cortes fundamentales |
| 43 | Cortes | Pestaña *Conectividad* | κ ≤ λ ≤ δ (Whitney) y separabilidad |
| 44 | Matrices | Modo *Dirigido* → pestaña *Relaciones* | Todas en ✔: B·Aᵀ = 0, B·Cᵀ = 0, C_c = −B_tᵀ, rangos |
| 45 | Matrices | Pestaña *Circuitos* en dirigido | ±1 según el sentido horario del dibujo (mueva un vértice y se recalcula) |
| 46 | Coloreado | Petersen | X = 3, X′ = 4, polinomio k¹⁰ − 15k⁹ + … − 704k |
| 47 | Coloreado | C₅ / C₆ / K₄ / árbol | Fórmula detectada: cíclico impar/par, completo, árbol |
| 48 | Independencia | Pestañas y filtros | α(G), α′(G), γ(G); detalle de qué domina cada vértice |
| 49 | Matching | Preset *NO simple* | Alerta: lazos y aristas múltiples → rechazado |
| 50 | Matching | Preset escalera, M inicial vacío | Caminos M-aumentados e inversión M ⊕ P hasta |M| = 4 (perfecto) |
| 51 | Envolventes | Petersen | α + τ = 10 y α′ + ρ = 10 (Gallai) |

## Notas para el docente

- Ningún resultado está precalculado: todo se recalcula al editar el grafo o los datos (agregar, mover o borrar vértices y aristas; doble clic para renombrar o cambiar el peso).
- Los presets llamados “de clase” son ejemplos de referencia. Si en clase se usó un grafo distinto (por ejemplo la Figura 12), dibújelo en el editor o use **Importar** con su JSON.

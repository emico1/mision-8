// Mision 8, simulador de la pagina

"use strict";

(function () {
  const $ = (id) => document.getElementById(id);

  // O(n)
  function escapar(s) {
    return String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  }

  // O(n)
  function limpiar(s) {
    return s.toUpperCase().replace(/\s+/g, "");
  }

  // Marca en verde las letras usadas como subsecuencia y en azul el tramo contiguo si tambien es subcadena.
  // O(|texto| |buscada|)
  function actualizarSubsecuencia() {
    const texto = limpiar($("ssTexto").value), buscada = limpiar($("ssBusca").value);
    const pos = LCS.posicionesSubsecuencia(buscada, texto);
    const inicio = buscada.length > 0 ? texto.indexOf(buscada) : -1;
    const marcadas = new Set(pos || []);
    $("ssLetters").innerHTML = [...texto].map((ch, i) => {
      let clase = "letter";
      if (inicio >= 0 && i >= inicio && i < inicio + buscada.length) clase += " run";
      else if (inicio < 0 && marcadas.has(i)) clase += " pick";
      return `<span class="${clase}">${escapar(ch)}</span>`;
    }).join("");
    if (buscada.length === 0 || texto.length === 0) {
      $("ssVerdict").innerHTML = "Escribe un texto y una candidata.";
      return;
    }
    const sub = pos !== null, cad = inicio >= 0;
    let explicacion;
    if (cad) explicacion = "Aparece completa y pegada, así que es subcadena, y toda subcadena también es subsecuencia.";
    else if (sub) explicacion = `Se toman las posiciones ${pos.map((p) => p + 1).join(", ")} saltando letras, el orden se respeta pero no es contigua.`;
    else explicacion = "Ni saltando letras se puede formar respetando el orden.";
    $("ssVerdict").innerHTML =
      `<b>${escapar(buscada)}</b> ${sub ? '<span class="si">sí es subsecuencia</span>' : '<span class="no">no es subsecuencia</span>'} y ` +
      `${cad ? '<span class="si">sí es subcadena</span>' : '<span class="no">no es subcadena</span>'} de <b>${escapar(texto)}</b>. ${explicacion}`;
  }

  $("ssTexto").addEventListener("input", actualizarSubsecuencia);
  $("ssBusca").addEventListener("input", actualizarSubsecuencia);
  $("ssPresets").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    $("ssTexto").value = b.dataset.t;
    $("ssBusca").value = b.dataset.b;
    actualizarSubsecuencia();
  });
  actualizarSubsecuencia();

  const estado = { x: "", y: "", c: null, orden: [], llenas: 0, timer: null, camino: null, celdaVista: null };
  const MAX = 30;

  // O(m n)
  function preparar() {
    detener();
    const x = limpiar($("inX").value), y = limpiar($("inY").value);
    if (x.length === 0 || y.length === 0) {
      $("demoError").textContent = "Las dos secuencias necesitan al menos un elemento.";
      return false;
    }
    if (x.length > MAX || y.length > MAX) {
      $("demoError").textContent = `Para que la tabla se lea bien, usa hasta ${MAX} elementos por secuencia.`;
      return false;
    }
    $("demoError").textContent = "";
    estado.x = x;
    estado.y = y;
    estado.c = LCS.tablaLCS(x, y);
    estado.orden = [];
    for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) estado.orden.push([i, j]);
    estado.llenas = 0;
    estado.camino = null;
    estado.celdaVista = null;
    construirRejilla();
    $("narration").className = "narration";
    $("narration").textContent =
      `La fila 0 y la columna 0 son los casos base, comparar contra un prefijo vacío da 0. ` +
      `Faltan ${estado.orden.length} celdas, se llenan por filas de izquierda a derecha.`;
    $("stats").innerHTML = "";
    return true;
  }

  // O(m n)
  function construirRejilla() {
    const { x, y } = estado;
    const g = $("grid");
    g.style.gridTemplateColumns = `repeat(${y.length + 2}, 32px)`;
    let html = `<div class="head"></div><div class="head"><span>∅<span class="idx">0</span></span></div>`;
    for (let j = 1; j <= y.length; j++) html += `<div class="head" data-col="${j}"><span>${escapar(y[j - 1])}<span class="idx">${j}</span></span></div>`;
    for (let i = 0; i <= x.length; i++) {
      html += i === 0
        ? `<div class="head"><span>∅<span class="idx">0</span></span></div>`
        : `<div class="head" data-row="${i}"><span>${escapar(x[i - 1])}<span class="idx">${i}</span></span></div>`;
      for (let j = 0; j <= y.length; j++) {
        html += `<button type="button" class="cell" data-i="${i}" data-j="${j}" aria-label="c[${i}][${j}]"></button>`;
      }
    }
    g.innerHTML = html;
    pintar();
  }

  // O(1)
  function celda(i, j) {
    return $("grid").querySelector(`.cell[data-i="${i}"][data-j="${j}"]`);
  }

  // O(1)
  function estaLlena(i, j) {
    if (i === 0 || j === 0) return true;
    const pos = (i - 1) * estado.y.length + (j - 1);
    return pos < estado.llenas;
  }

  // Colorea todas las celdas segun lo que ya se lleno.
  // O(m n)
  function pintar() {
    const { x, y, c } = estado;
    for (let i = 0; i <= x.length; i++) {
      for (let j = 0; j <= y.length; j++) {
        const el = celda(i, j);
        let clase = "cell";
        if (i === 0 || j === 0) clase += " base";
        else if (!estaLlena(i, j)) clase += " empty";
        else clase += x[i - 1] === y[j - 1] ? " match" : " diff";
        el.className = clase;
        el.textContent = estaLlena(i, j) ? c[i][j] : "·";
      }
    }
    if (estado.camino) for (const [i, j] of estado.camino) celda(i, j).classList.add("path");
  }

  // Resalta la celda, sus dependencias y las letras que compara.
  // O(m + n)
  function enfocar(i, j) {
    $("grid").querySelectorAll(".current, .dep").forEach((el) => el.classList.remove("current", "dep"));
    $("grid").querySelectorAll(".head.hi").forEach((el) => el.classList.remove("hi"));
    const info = LCS.explicarCelda(estado.c, estado.x, estado.y, i, j);
    celda(i, j).classList.add("current");
    for (const [a, b] of info.deps) celda(a, b).classList.add("dep");
    const fila = $("grid").querySelector(`.head[data-row="${i}"]`), col = $("grid").querySelector(`.head[data-col="${j}"]`);
    if (fila) fila.classList.add("hi");
    if (col) col.classList.add("hi");
    const prefijos = i > 0 && j > 0
      ? ` Esta celda resuelve la LCS de "${estado.x.slice(0, i)}" contra "${estado.y.slice(0, j)}".`
      : "";
    $("narration").className = "narration" + (info.tipo === "coincide" ? " match" : "");
    $("narration").textContent = info.texto + prefijos;
  }

  // O(m + n)
  function paso() {
    if (estado.llenas >= estado.orden.length) {
      detener();
      terminar();
      return;
    }
    estado.llenas++;
    const [i, j] = estado.orden[estado.llenas - 1];
    pintar();
    enfocar(i, j);
    if (estado.llenas === estado.orden.length) {
      detener();
      terminar();
    }
  }

  // O(m n)
  function terminar() {
    const { x, y, c } = estado;
    const m = x.length, n = y.length;
    const todas = LCS.todasLCS(x, y, 40);
    const total = LCS.contarLCS(x, y);
    $("stats").innerHTML =
      `Respuesta en la esquina, <b>c[${m}][${n}] = ${c[m][n]}</b>. Se llenaron ${m * n} celdas, cada una en tiempo constante. ` +
      `Hay <b>${total.toLocaleString("es-MX")}</b> LCS distinta${total === 1n ? "" : "s"}` +
      (c[m][n] > 0 ? `, <span class="lcs-list">${todas.map(escapar).join(", ")}${BigInt(todas.length) < total ? ", ..." : ""}</span>.` : ", la vacía.") +
      ` Presiona Reconstruir LCS para ver el camino.`;
  }

  // O(1)
  function detener() {
    if (estado.timer) clearInterval(estado.timer);
    estado.timer = null;
    $("play").textContent = "Animar llenado";
  }

  // O(m n)
  function llenarTodo() {
    detener();
    estado.llenas = estado.orden.length;
    pintar();
    const [i, j] = [estado.x.length, estado.y.length];
    enfocar(i, j);
    terminar();
  }

  // Recorre el camino desde la esquina y narra cada decision.
  // O(m + n)
  function reconstruirCamino() {
    detener();
    if (estado.llenas < estado.orden.length) llenarTodo();
    const { x, y, c } = estado;
    const r = LCS.reconstruir(c, x, y);
    estado.camino = [];
    let k = 0;
    const pasos = r.camino;
    const tomadas = [];
    estado.timer = setInterval(() => {
      if (k >= pasos.length) {
        clearInterval(estado.timer);
        estado.timer = null;
        $("narration").className = "narration match";
        $("narration").textContent =
          `Leyendo de abajo hacia arriba se tomaron ${tomadas.length ? tomadas.join(", ") : "ninguna letra"}. ` +
          `Al voltearlas queda la LCS "${r.lcs}" de longitud ${r.lcs.length}. Solo aportan letras los pasos en diagonal, ` +
          `donde las letras coinciden.`;
        return;
      }
      const [i, j] = pasos[k];
      estado.camino.push([i, j]);
      pintar();
      $("grid").querySelectorAll(".current, .dep").forEach((el) => el.classList.remove("current", "dep"));
      $("grid").querySelectorAll(".head.hi").forEach((el) => el.classList.remove("hi"));
      celda(i, j).classList.add("current");
      let texto;
      if (i === 0 || j === 0) texto = `Se llegó a c[${i}][${j}], un caso base, y se termina el recorrido.`;
      else if (x[i - 1] === y[j - 1]) {
        tomadas.push(x[i - 1]);
        texto = `En c[${i}][${j}] coinciden ${x[i - 1]} y ${y[j - 1]}, esa letra es parte de la LCS y se sube en diagonal.`;
      } else if (c[i - 1][j] >= c[i][j - 1]) {
        texto = `En c[${i}][${j}] no coinciden ${x[i - 1]} y ${y[j - 1]}. El valor ${c[i][j]} vino de arriba, se descarta ${x[i - 1]}.`;
      } else {
        texto = `En c[${i}][${j}] no coinciden ${x[i - 1]} y ${y[j - 1]}. El valor ${c[i][j]} vino de la izquierda, se descarta ${y[j - 1]}.`;
      }
      $("narration").className = "narration" + (i > 0 && j > 0 && x[i - 1] === y[j - 1] ? " match" : "");
      $("narration").textContent = texto;
      k++;
    }, 900 / Number($("speed").value));
  }

  $("play").addEventListener("click", () => {
    if (estado.timer) {
      detener();
      return;
    }
    if (estado.camino) preparar();
    if (estado.llenas >= estado.orden.length) preparar();
    $("play").textContent = "Pausa";
    estado.timer = setInterval(paso, 1400 / Number($("speed").value));
  });
  $("step").addEventListener("click", () => {
    detener();
    if (estado.camino) preparar();
    paso();
  });
  $("finish").addEventListener("click", llenarTodo);
  $("trace").addEventListener("click", reconstruirCamino);
  $("reset").addEventListener("click", preparar);
  $("speed").addEventListener("input", () => {
    if (estado.timer && !estado.camino) {
      clearInterval(estado.timer);
      estado.timer = setInterval(paso, 1400 / Number($("speed").value));
    }
  });
  $("grid").addEventListener("click", (e) => {
    const el = e.target.closest(".cell");
    if (!el) return;
    detener();
    const i = Number(el.dataset.i), j = Number(el.dataset.j);
    if (!estaLlena(i, j)) {
      $("narration").className = "narration";
      $("narration").textContent = `c[${i}][${j}] todavía no se llena. Para calcularla hacen falta las celdas de arriba, de la izquierda y la diagonal.`;
      return;
    }
    enfocar(i, j);
  });
  $("presets").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    $("presets").querySelectorAll("button").forEach((t) => t.classList.toggle("active", t === b));
    $("inX").value = b.dataset.x;
    $("inY").value = b.dataset.y;
    preparar();
  });
  $("inX").addEventListener("input", () => { $("presets").querySelectorAll("button").forEach((t) => t.classList.remove("active")); preparar(); });
  $("inY").addEventListener("input", () => { $("presets").querySelectorAll("button").forEach((t) => t.classList.remove("active")); preparar(); });
  preparar();

  $("diffA").value = [
    "int suma(const std::vector<int>& v) {",
    "    int s = 0;",
    "    for (int i = 0; i < v.size(); i++) {",
    "        s += v[i];",
    "    }",
    "    return s;",
    "}"
  ].join("\n");
  $("diffB").value = [
    "// Suma los elementos del vector",
    "long long suma(const std::vector<int>& v) {",
    "    long long s = 0;",
    "    for (int x : v) {",
    "        s += x;",
    "    }",
    "    return s;",
    "}"
  ].join("\n");

  // O(m n)
  function actualizarDiff() {
    const a = $("diffA").value.replace(/\r/g, "").split("\n");
    const b = $("diffB").value.replace(/\r/g, "").split("\n");
    if (a.length > 400 || b.length > 400) {
      $("diffStats").textContent = "Usa hasta 400 líneas por versión.";
      return;
    }
    const d = LCS.diffLineas(a, b);
    let iguales = 0, menos = 0, mas = 0;
    $("diffOut").innerHTML = d.map((l) => {
      if (l.tipo === " ") { iguales++; return `<div class="d-eq">  ${escapar(l.texto)}</div>`; }
      if (l.tipo === "-") { menos++; return `<div class="d-del">- ${escapar(l.texto)}</div>`; }
      mas++;
      return `<div class="d-add">+ ${escapar(l.texto)}</div>`;
    }).join("");
    $("diffStats").innerHTML =
      `La LCS tiene <b>${iguales}</b> líneas sin cambio. Se borran ${menos} y se agregan ${mas}, ` +
      `que es N + M - 2L = ${a.length} + ${b.length} - 2·${iguales} = <b>${a.length + b.length - 2 * iguales}</b> cambios.`;
  }
  $("diffA").addEventListener("input", actualizarDiff);
  $("diffB").addEventListener("input", actualizarDiff);
  actualizarDiff();
})();

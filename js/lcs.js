// Mision 8

"use strict";

// Funciona como modulo de Node y como script del navegador.
(function (raiz, fabrica) {
  const modulo = fabrica();
  if (typeof module !== "undefined" && module.exports) module.exports = modulo;
  else raiz.LCS = modulo;
})(typeof self !== "undefined" ? self : this, function () {
  // Llena c[i][j] = longitud de la LCS entre los primeros i elementos de x y los primeros j de y.
  // Sirve para cadenas y para arreglos de lineas.
  // O(m n)
  function tablaLCS(x, y) {
    const m = x.length, n = y.length;
    const c = [];
    for (let i = 0; i <= m; i++) c.push(new Int32Array(n + 1));
    for (let i = 1; i <= m; i++) {
      const ci = c[i], ca = c[i - 1], xi = x[i - 1];
      for (let j = 1; j <= n; j++) {
        if (xi === y[j - 1]) ci[j] = ca[j - 1] + 1;
        else ci[j] = ca[j] >= ci[j - 1] ? ca[j] : ci[j - 1];
      }
    }
    return c;
  }

  // Camina desde la esquina c[m][n] hacia c[0][0] y regresa la LCS y las celdas del camino.
  // O(m + n)
  function reconstruir(c, x, y) {
    let i = x.length, j = y.length;
    const letras = [], camino = [[i, j]];
    while (i > 0 && j > 0) {
      if (x[i - 1] === y[j - 1]) {
        letras.push(x[i - 1]);
        i--; j--;
      } else if (c[i - 1][j] >= c[i][j - 1]) {
        i--;
      } else {
        j--;
      }
      camino.push([i, j]);
    }
    letras.reverse();
    return { lcs: typeof x === "string" ? letras.join("") : letras, camino };
  }

  // Solo guarda la fila anterior y la actual.
  // O(m n) tiempo, O(min(m, n)) memoria
  function lcsDosFilas(x, y) {
    const a = x.length >= y.length ? x : y;
    const b = x.length >= y.length ? y : x;
    const n = b.length;
    let antes = new Int32Array(n + 1), ahora = new Int32Array(n + 1);
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) ahora[j] = antes[j - 1] + 1;
        else ahora[j] = antes[j] >= ahora[j - 1] ? antes[j] : ahora[j - 1];
      }
      const t = antes; antes = ahora; ahora = t;
    }
    return antes[n];
  }

  // Cuenta las LCS distintas sin listarlas, restando el caso doble para no contar dos veces.
  // O(m n)
  function contarLCS(x, y) {
    const c = tablaLCS(x, y);
    const m = x.length, n = y.length;
    const d = [];
    for (let i = 0; i <= m; i++) d.push(new Array(n + 1).fill(1n));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (x[i - 1] === y[j - 1]) {
          d[i][j] = d[i - 1][j - 1];
        } else {
          let v = 0n;
          const arriba = c[i - 1][j] === c[i][j], izq = c[i][j - 1] === c[i][j];
          if (arriba) v += d[i - 1][j];
          if (izq) v += d[i][j - 1];
          if (arriba && izq && c[i - 1][j - 1] === c[i][j]) v -= d[i - 1][j - 1];
          d[i][j] = v;
        }
      }
    }
    return d[m][n];
  }

  // Todas las LCS distintas, con limite porque pueden ser exponenciales.
  // O(m n * numero de LCS * longitud)
  function todasLCS(x, y, limite = 200) {
    const c = tablaLCS(x, y);
    const memo = new Map();
    function rec(i, j) {
      if (i === 0 || j === 0) return new Set([""]);
      const clave = i * (y.length + 1) + j;
      if (memo.has(clave)) return memo.get(clave);
      const r = new Set();
      if (x[i - 1] === y[j - 1]) {
        for (const s of rec(i - 1, j - 1)) { r.add(s + x[i - 1]); if (r.size >= limite) break; }
      } else {
        if (c[i - 1][j] === c[i][j]) for (const s of rec(i - 1, j)) { r.add(s); if (r.size >= limite) break; }
        if (c[i][j - 1] === c[i][j] && r.size < limite) for (const s of rec(i, j - 1)) { r.add(s); if (r.size >= limite) break; }
      }
      memo.set(clave, r);
      return r;
    }
    return [...rec(x.length, y.length)].sort();
  }

  // O(|t|)
  function esSubsecuencia(s, t) {
    let k = 0;
    for (let i = 0; i < t.length && k < s.length; i++) if (t[i] === s[k]) k++;
    return k === s.length;
  }

  // Posiciones de s dentro de t si es subsecuencia (la primera forma que encuentra), o null.
  // O(|t|)
  function posicionesSubsecuencia(s, t) {
    const pos = [];
    let k = 0;
    for (let i = 0; i < t.length && k < s.length; i++) if (t[i] === s[k]) { pos.push(i); k++; }
    return k === s.length ? pos : null;
  }

  // Explica de donde sale c[i][j], es lo que narra el simulador en cada paso.
  // O(1)
  function explicarCelda(c, x, y, i, j) {
    if (i === 0 || j === 0) {
      return { tipo: "base", deps: [], texto: `c[${i}][${j}] = 0, uno de los prefijos esta vacio y no hay nada en comun.` };
    }
    const a = x[i - 1], b = y[j - 1];
    if (a === b) {
      return {
        tipo: "coincide",
        deps: [[i - 1, j - 1]],
        texto: `c[${i}][${j}] compara X${i} = ${a} con Y${j} = ${b}. Coinciden, asi que la letra ${a} se agrega a la mejor ` +
          `respuesta sin las dos letras, c[${i - 1}][${j - 1}] = ${c[i - 1][j - 1]}, y queda ${c[i - 1][j - 1]} + 1 = ${c[i][j]}.`
      };
    }
    const arriba = c[i - 1][j], izq = c[i][j - 1];
    let origen;
    if (arriba > izq) origen = `conviene quitar ${a} de X`;
    else if (izq > arriba) origen = `conviene quitar ${b} de Y`;
    else origen = "las dos opciones empatan";
    return {
      tipo: "difiere",
      deps: [[i - 1, j], [i, j - 1]],
      texto: `c[${i}][${j}] compara X${i} = ${a} con Y${j} = ${b}. No coinciden, al menos una de las dos letras sobra. ` +
        `Sin ${a} vale c[${i - 1}][${j}] = ${arriba}, sin ${b} vale c[${i}][${j - 1}] = ${izq}, ${origen} y queda max = ${c[i][j]}.`
    };
  }

  // Hirschberg (1975), solo la ultima fila con memoria lineal.
  // O(m n)
  function ultimaFila(x, y) {
    const n = y.length;
    let antes = new Int32Array(n + 1), ahora = new Int32Array(n + 1);
    for (let i = 1; i <= x.length; i++) {
      ahora[0] = 0;
      for (let j = 1; j <= n; j++) {
        if (x[i - 1] === y[j - 1]) ahora[j] = antes[j - 1] + 1;
        else ahora[j] = antes[j] >= ahora[j - 1] ? antes[j] : ahora[j - 1];
      }
      const t = antes; antes = ahora; ahora = t;
    }
    return antes;
  }

  // Parte x a la mitad y busca en y el corte que maximiza la suma, asi recupera la LCS con memoria lineal.
  // O(m n) tiempo, O(m + n) memoria
  function hirschberg(x, y) {
    if (x.length === 0 || y.length === 0) return "";
    if (x.length === 1) return y.indexOf(x[0]) >= 0 ? x : "";
    const mitad = x.length >> 1;
    const x1 = x.slice(0, mitad), x2 = x.slice(mitad);
    const izq = ultimaFila(x1, y);
    const der = ultimaFila([...x2].reverse().join(""), [...y].reverse().join(""));
    const n = y.length;
    let corte = 0, mejor = -1;
    for (let k = 0; k <= n; k++) {
      const v = izq[k] + der[n - k];
      if (v > mejor) { mejor = v; corte = k; }
    }
    return hirschberg(x1, y.slice(0, corte)) + hirschberg(x2, y.slice(corte));
  }

  // Las lineas de la LCS son las que no cambiaron, lo demas se borra (-) o se agrega (+).
  // O(m n)
  function diffLineas(a, b) {
    const c = tablaLCS(a, b);
    const r = [];
    let i = a.length, j = b.length;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { r.push({ tipo: " ", texto: a[i - 1] }); i--; j--; }
      else if (j > 0 && (i === 0 || c[i][j - 1] >= c[i - 1][j])) { r.push({ tipo: "+", texto: b[j - 1] }); j--; }
      else { r.push({ tipo: "-", texto: a[i - 1] }); i--; }
    }
    return r.reverse();
  }

  // Mismo formato de archivo que el programa en C++, dos lineas con X y Y.
  // O(tamano del texto)
  function leerPar(texto) {
    const lineas = texto.split(/\r?\n/).map((l) => l.replace(/#.*/, "").trim()).filter((l) => l.length > 0);
    if (lineas.length !== 2) return { error: `Se esperaban 2 secuencias y el archivo trae ${lineas.length}` };
    return { x: lineas[0], y: lineas[1] };
  }

  return {
    tablaLCS, reconstruir, lcsDosFilas, contarLCS, todasLCS, esSubsecuencia, posicionesSubsecuencia,
    explicarCelda, hirschberg, diffLineas, leerPar
  };
});

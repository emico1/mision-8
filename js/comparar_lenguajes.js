// Mision 8, compara C++ contra JavaScript con los mismos archivos

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const LCS = require("./lcs.js");

const raiz = path.join(__dirname, "..");
const binario = path.join(raiz, "cpp", process.platform === "win32" ? "lcs.exe" : "lcs");

// Generador congruencial con semilla, para que las cadenas sean siempre las mismas.
// O(1)
function crearAleatorio(semilla) {
  let s = BigInt(semilla);
  return function () {
    s = (s * 6364136223846793005n + 1442695040888963407n) & ((1n << 64n) - 1n);
    return Number(s >> 33n) / 2 ** 31;
  };
}

// O(n)
function adn(n, rand) {
  const a = "ACGT";
  let s = "";
  for (let i = 0; i < n; i++) s += a[Math.floor(rand() * 4)];
  return s;
}

// Corre el programa de C++ y saca la longitud, la LCS y el tiempo de su salida.
// O(m n)
function correrCpp(archivo) {
  let salida;
  try {
    salida = execFileSync(binario, [archivo], { encoding: "utf8", maxBuffer: 1 << 26 });
  } catch (e) {
    salida = e.stdout || "error";
  }
  const largo = /Longitud de la LCS\s+(\d+)/.exec(salida);
  const una = /Una LCS \(tabla\)\s+(\S+)/.exec(salida);
  const ms = /Tiempo tabla\s+([\d.]+)/.exec(salida);
  return {
    error: largo ? null : salida.trim(),
    largo: largo ? Number(largo[1]) : -1,
    lcs: una ? (una[1] === "(vacia)" ? "" : una[1]) : null,
    ms: ms ? Number(ms[1]) : -1
  };
}

// O(m n)
function correrJs(texto) {
  const par = LCS.leerPar(texto);
  if (par.error) return { error: par.error };
  const t0 = process.hrtime.bigint();
  const c = LCS.tablaLCS(par.x, par.y);
  const r = LCS.reconstruir(c, par.x, par.y);
  const t1 = process.hrtime.bigint();
  return { error: null, largo: c[par.x.length][par.y.length], lcs: r.lcs, ms: Number(t1 - t0) / 1e6 };
}

// O(1)
function ms(v) {
  return v.toFixed(2);
}

function main() {
  if (!fs.existsSync(binario)) {
    console.log("Primero compila cpp/lcs.cpp");
    process.exit(1);
  }
  console.log("archivo,cpp_largo,js_largo,misma_lcs");
  const dir = path.join(raiz, "pruebas");
  let iguales = 0, total = 0;
  for (const nombre of fs.readdirSync(dir).filter((f) => /^prueba.*\.txt$/.test(f)).sort()) {
    const archivo = path.join(dir, nombre);
    const a = correrCpp(archivo), b = correrJs(fs.readFileSync(archivo, "utf8"));
    const ok = (a.error && b.error) || (a.largo === b.largo && a.lcs === b.lcs);
    total++;
    if (ok) iguales++;
    console.log(`${nombre},${a.error ? "error" : a.largo},${b.error ? "error" : b.largo},${ok ? "si" : "NO"}`);
  }
  console.log(`# ${iguales} de ${total} iguales`);

  console.log("\nn,cpp_ms,js_ms,veces");
  const rand = crearAleatorio(8);
  const tmp = path.join(os.tmpdir(), "mision8_par.txt");
  for (const n of [1000, 2000, 4000, 8000]) {
    const texto = adn(n, rand) + "\n" + adn(n, rand) + "\n";
    fs.writeFileSync(tmp, texto);
    let mejorC = Infinity, mejorJ = Infinity, largoC = -1, largoJ = -2;
    for (let k = 0; k < 3; k++) {
      const a = correrCpp(tmp), b = correrJs(texto);
      mejorC = Math.min(mejorC, a.ms);
      mejorJ = Math.min(mejorJ, b.ms);
      largoC = a.largo;
      largoJ = b.largo;
    }
    if (largoC !== largoJ) console.log(`# diferencia en n=${n}`);
    console.log(`${n},${ms(mejorC)},${ms(mejorJ)},${(mejorJ / mejorC).toFixed(2)}`);
  }
  fs.unlinkSync(tmp);
}

main();

// Mision 8, experimentos

#include <chrono>
#include <fstream>
#include <functional>
#include <iomanip>
#include <iostream>
#include <random>
#include <string>
#include <vector>

#include "lcs.hpp"

using Reloj = std::chrono::steady_clock;

// O(1)
double milisegundos(Reloj::time_point a, Reloj::time_point b) {
    return std::chrono::duration<double, std::milli>(b - a).count();
}

// O(n)
std::string aleatoria(int n, const std::string& alfabeto, std::mt19937_64& gen) {
    std::uniform_int_distribution<int> d(0, static_cast<int>(alfabeto.size()) - 1);
    std::string s(n, ' ');
    for (char& ch : s) ch = alfabeto[d(gen)];
    return s;
}

// Mejor de varias corridas para quitar ruido.
// O(veces * costo de f)
double medir(const std::function<void()>& f, int veces) {
    double mejor = 1e18;
    for (int k = 0; k < veces; k++) {
        auto a = Reloj::now();
        f();
        auto b = Reloj::now();
        mejor = std::min(mejor, milisegundos(a, b));
    }
    return mejor;
}

// Todas las versiones deben dar la misma longitud, y la LCS reconstruida debe ser subsecuencia de las dos.
// O(casos * 2^m n)
void validacion() {
    std::mt19937_64 gen(8);
    std::vector<std::string> alfabetos = {"AB", "ACGT", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"};
    int casos = 0, fallas = 0, fallasConteo = 0;
    for (const std::string& alf : alfabetos) {
        for (int k = 0; k < 7000; k++) {
            std::uniform_int_distribution<int> largo(0, 12);
            std::string x = aleatoria(largo(gen), alf, gen), y = aleatoria(largo(gen), alf, gen);
            Tabla c = tablaLCS(x, y);
            int v = c[x.size()][y.size()];
            std::uint64_t l1 = 0, l2 = 0;
            std::string una = reconstruir(c, x, y);
            std::string h = hirschberg(x, y);
            bool ok = lcsFuerzaBruta(x, y) == v && lcsRecursivo(x, y, static_cast<int>(x.size()), static_cast<int>(y.size()), l1) == v &&
                      lcsMemo(x, y, l2) == v && lcsDosFilas(x, y) == v && static_cast<int>(una.size()) == v &&
                      static_cast<int>(h.size()) == v && esSubsecuencia(una, x) && esSubsecuencia(una, y) &&
                      esSubsecuencia(h, x) && esSubsecuencia(h, y);
            std::set<std::string> todas = todasLCS(x, y);
            for (const std::string& s : todas)
                if (static_cast<int>(s.size()) != v || !esSubsecuencia(s, x) || !esSubsecuencia(s, y)) ok = false;
            if (todas.size() != contarLCS(x, y)) fallasConteo++;
            casos++;
            if (!ok) {
                fallas++;
                std::cout << "Falla con X=" << x << " Y=" << y << "\n";
            }
        }
    }
    std::cout << "casos," << casos << "\nfallas," << fallas << "\nfallas_conteo," << fallasConteo << "\n";
}

// Peor caso de la recursion sin memoria, ninguna letra coincide y en cada celda se abren dos ramas.
// O(2^(m+n))
void llamadas() {
    std::cout << "n,celdas_tabla,llamadas_memo,llamadas_sin_memoria,veces_mas\n";
    for (int n = 2; n <= 14; n++) {
        std::string x(n, 'A'), y(n, 'B');
        std::uint64_t sin = 0, con = 0;
        lcsRecursivo(x, y, n, n, sin);
        lcsMemo(x, y, con);
        std::cout << n << "," << (n + 1) * (n + 1) << "," << con << "," << sin << "," << std::fixed << std::setprecision(1)
                  << static_cast<double>(sin) / static_cast<double>(con) << "\n";
    }
}

// Cadenas de ADN chicas, aqui si se pueden correr las versiones exponenciales.
// O(2^n n) por tamano
void escalaChica() {
    std::mt19937_64 gen(80);
    std::cout << "n,fuerza_bruta_ms,recursion_sin_memoria_ms,memo_ms,tabla_ms\n";
    for (int n : {6, 8, 10, 12, 14, 16, 18, 20}) {
        std::string x = aleatoria(n, "ACGT", gen), y = aleatoria(n, "ACGT", gen);
        volatile int sumidero = 0;
        double fb = medir([&] { sumidero = lcsFuerzaBruta(x, y); }, 3);
        double rec = -1;
        if (n <= 16) {
            rec = medir([&] {
                std::uint64_t l = 0;
                sumidero = lcsRecursivo(x, y, n, n, l);
            }, 3);
        }
        double memo = medir([&] {
            std::uint64_t l = 0;
            sumidero = lcsMemo(x, y, l);
        }, 5);
        double tab = medir([&] { sumidero = tablaLCS(x, y)[n][n]; }, 5);
        std::cout << n << "," << std::fixed << std::setprecision(4) << fb << "," << rec << "," << memo << "," << tab << "\n";
    }
}

// Cadenas de ADN grandes, solo versiones polinomiales. La tabla completa se detiene en 8000 por memoria.
// O(n^2) por tamano
void escalaGrande() {
    std::mt19937_64 gen(800);
    std::cout << "n,tabla_ms,tabla_mb,dos_filas_ms,dos_filas_kb,hirschberg_ms,longitud\n";
    for (int n : {1000, 2000, 4000, 8000, 16000}) {
        std::string x = aleatoria(n, "ACGT", gen), y = aleatoria(n, "ACGT", gen);
        volatile int sumidero = 0;
        double tab = -1, mb = -1;
        if (n <= 8000) {
            tab = medir([&] {
                Tabla c = tablaLCS(x, y);
                sumidero = static_cast<int>(reconstruir(c, x, y).size());
            }, 3);
            mb = static_cast<double>(n + 1) * (n + 1) * sizeof(int) / (1024.0 * 1024.0);
        }
        int largo = 0;
        double dos = medir([&] { largo = lcsDosFilas(x, y); }, 3);
        double kb = 2.0 * (n + 1) * sizeof(int) / 1024.0;
        double hir = medir([&] { sumidero = static_cast<int>(hirschberg(x, y).size()); }, 3);
        std::cout << n << "," << std::fixed << std::setprecision(2) << tab << "," << mb << "," << dos << "," << kb << ","
                  << hir << "," << largo << "\n";
    }
}

// Cuantas LCS distintas hay. Con bloques AB CD EF... contra BA DC FE... cada bloque deja elegir una de dos letras,
// asi que hay 2^k LCS distintas aunque la longitud sea solo k.
// O(k^2) por k
void conteo() {
    std::mt19937_64 gen(88);
    std::cout << "familia,k,m,longitud,lcs_distintas\n";
    const std::string letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (int k = 1; k <= 13; k++) {
        std::string x, y;
        for (int t = 0; t < k; t++) {
            x += letras[2 * t];
            x += letras[2 * t + 1];
            y += letras[2 * t + 1];
            y += letras[2 * t];
        }
        std::cout << "bloques_invertidos," << k << "," << x.size() << "," << tablaLCS(x, y)[x.size()][y.size()] << ","
                  << contarLCS(x, y) << "\n";
    }
    for (int n : {10, 20, 40, 80, 160}) {
        std::string x = aleatoria(n, "ACGT", gen), y = aleatoria(n, "ACGT", gen);
        std::cout << "adn_aleatorio," << n << "," << n << "," << tablaLCS(x, y)[n][n] << "," << contarLCS(x, y) << "\n";
    }
}

// Proporcion LCS/n para cadenas aleatorias segun el tamano del alfabeto.
// O(n^2 * casos)
void proporcion() {
    std::mt19937_64 gen(888);
    std::cout << "alfabeto,n,casos,lcs_promedio,proporcion\n";
    std::vector<std::pair<std::string, std::string>> alfs = {{"binario", "AB"}, {"adn", "ACGT"}, {"letras", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"}};
    for (auto& [nombre, alf] : alfs) {
        for (int n : {100, 1000, 4000}) {
            int casos = n <= 1000 ? 20 : 5;
            double suma = 0;
            for (int c = 0; c < casos; c++) {
                std::string x = aleatoria(n, alf, gen), y = aleatoria(n, alf, gen);
                suma += lcsDosFilas(x, y);
            }
            double prom = suma / casos;
            std::cout << nombre << "," << n << "," << casos << "," << std::fixed << std::setprecision(1) << prom << ","
                      << std::setprecision(3) << prom / n << "\n";
        }
    }
}

int main(int argc, char** argv) {
    std::string modo = argc > 1 ? argv[1] : "";
    if (modo == "validacion") validacion();
    else if (modo == "llamadas") llamadas();
    else if (modo == "chica") escalaChica();
    else if (modo == "grande") escalaGrande();
    else if (modo == "conteo") conteo();
    else if (modo == "proporcion") proporcion();
    else std::cout << "Modos validacion, llamadas, chica, grande, conteo, proporcion\n";
    return 0;
}

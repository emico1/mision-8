// Mision 8, algoritmos de subsecuencia comun mas larga (LCS)

#pragma once

#include <algorithm>
#include <cstdint>
#include <map>
#include <set>
#include <string>
#include <utility>
#include <vector>

// Las funciones son plantillas para usar la misma PD con texto (std::string)
// y con archivos vistos como lista de lineas (std::vector<std::string>).

using Tabla = std::vector<std::vector<int>>;

// Llena c[i][j] = longitud de la LCS entre los primeros i elementos de x y los primeros j de y.
// Fila 0 y columna 0 son los casos base (prefijo vacio).
// O(m n)
template <typename S>
Tabla tablaLCS(const S& x, const S& y) {
    int m = static_cast<int>(x.size()), n = static_cast<int>(y.size());
    Tabla c(m + 1, std::vector<int>(n + 1, 0));
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (x[i - 1] == y[j - 1]) c[i][j] = c[i - 1][j - 1] + 1;
            else c[i][j] = std::max(c[i - 1][j], c[i][j - 1]);
        }
    }
    return c;
}

// Camina desde c[m][n] hacia c[0][0] siguiendo de donde salio cada valor.
// O(m + n)
template <typename S>
S reconstruir(const Tabla& c, const S& x, const S& y) {
    int i = static_cast<int>(x.size()), j = static_cast<int>(y.size());
    S r;
    while (i > 0 && j > 0) {
        if (x[i - 1] == y[j - 1]) {
            r.push_back(x[i - 1]);
            i--;
            j--;
        } else if (c[i - 1][j] >= c[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    std::reverse(r.begin(), r.end());
    return r;
}

// Recursion directa de la recurrencia, sin guardar nada. Cuenta llamadas para ver los subproblemas repetidos.
// O(2^(m+n)) en el peor caso
template <typename S>
int lcsRecursivo(const S& x, const S& y, int i, int j, std::uint64_t& llamadas) {
    llamadas++;
    if (i == 0 || j == 0) return 0;
    if (x[i - 1] == y[j - 1]) return lcsRecursivo(x, y, i - 1, j - 1, llamadas) + 1;
    return std::max(lcsRecursivo(x, y, i - 1, j, llamadas), lcsRecursivo(x, y, i, j - 1, llamadas));
}

// O(m n)
template <typename S>
int lcsMemoAux(const S& x, const S& y, int i, int j, Tabla& memo, std::uint64_t& llamadas) {
    llamadas++;
    if (i == 0 || j == 0) return 0;
    if (memo[i][j] >= 0) return memo[i][j];
    int r;
    if (x[i - 1] == y[j - 1]) r = lcsMemoAux(x, y, i - 1, j - 1, memo, llamadas) + 1;
    else r = std::max(lcsMemoAux(x, y, i - 1, j, memo, llamadas), lcsMemoAux(x, y, i, j - 1, memo, llamadas));
    memo[i][j] = r;
    return r;
}

// Misma recursion pero guardando cada c[i][j] la primera vez (de arriba hacia abajo).
// O(m n)
template <typename S>
int lcsMemo(const S& x, const S& y, std::uint64_t& llamadas) {
    Tabla memo(x.size() + 1, std::vector<int>(y.size() + 1, -1));
    return lcsMemoAux(x, y, static_cast<int>(x.size()), static_cast<int>(y.size()), memo, llamadas);
}

// Prueba todas las subsecuencias de la cadena corta y revisa si estan en la otra.
// O(2^m n)
template <typename S>
int lcsFuerzaBruta(const S& x, const S& y) {
    const S& corta = x.size() <= y.size() ? x : y;
    const S& larga = x.size() <= y.size() ? y : x;
    int m = static_cast<int>(corta.size());
    int mejor = 0;
    for (std::uint64_t mascara = 0; mascara < (1ULL << m); mascara++) {
        int tam = __builtin_popcountll(mascara);
        if (tam <= mejor) continue;
        int k = 0;
        int largo = static_cast<int>(larga.size());
        bool ok = true;
        for (int b = 0; b < m && ok; b++) {
            if (!(mascara >> b & 1ULL)) continue;
            while (k < largo && !(larga[k] == corta[b])) k++;
            if (k == largo) ok = false;
            else k++;
        }
        if (ok) mejor = tam;
    }
    return mejor;
}

// Solo guarda la fila anterior y la actual, porque c[i][j] nada mas mira la fila i-1 y la i.
// O(m n) tiempo, O(min(m, n)) memoria
template <typename S>
int lcsDosFilas(const S& x, const S& y) {
    const S& a = x.size() >= y.size() ? x : y;
    const S& b = x.size() >= y.size() ? y : x;
    int n = static_cast<int>(b.size());
    std::vector<int> antes(n + 1, 0), ahora(n + 1, 0);
    for (std::size_t i = 1; i <= a.size(); i++) {
        for (int j = 1; j <= n; j++) {
            if (a[i - 1] == b[j - 1]) ahora[j] = antes[j - 1] + 1;
            else ahora[j] = std::max(antes[j], ahora[j - 1]);
        }
        std::swap(antes, ahora);
    }
    return antes[n];
}

// Ultima fila de la tabla de x contra y con memoria lineal (Algoritmo B de Hirschberg).
// O(m n)
template <typename S>
std::vector<int> ultimaFila(const S& x, const S& y) {
    int n = static_cast<int>(y.size());
    std::vector<int> antes(n + 1, 0), ahora(n + 1, 0);
    for (std::size_t i = 1; i <= x.size(); i++) {
        ahora[0] = 0;
        for (int j = 1; j <= n; j++) {
            if (x[i - 1] == y[j - 1]) ahora[j] = antes[j - 1] + 1;
            else ahora[j] = std::max(antes[j], ahora[j - 1]);
        }
        std::swap(antes, ahora);
    }
    return antes;
}

// Hirschberg (1975), parte x a la mitad y busca en y el corte que maximiza la suma de las dos mitades.
// Recupera una LCS completa con memoria lineal.
// O(m n) tiempo, O(m + n) memoria
template <typename S>
S hirschberg(const S& x, const S& y) {
    if (x.empty() || y.empty()) return S();
    if (x.size() == 1) {
        for (const auto& e : y)
            if (e == x[0]) return x;
        return S();
    }
    std::size_t mitad = x.size() / 2;
    S x1(x.begin(), x.begin() + mitad), x2(x.begin() + mitad, x.end());
    std::vector<int> izq = ultimaFila(x1, y);
    S x2r(x2.rbegin(), x2.rend()), yr(y.rbegin(), y.rend());
    std::vector<int> der = ultimaFila(x2r, yr);
    int n = static_cast<int>(y.size());
    int corte = 0, mejor = -1;
    for (int k = 0; k <= n; k++) {
        int v = izq[k] + der[n - k];
        if (v > mejor) {
            mejor = v;
            corte = k;
        }
    }
    S y1(y.begin(), y.begin() + corte), y2(y.begin() + corte, y.end());
    S r = hirschberg(x1, y1);
    S r2 = hirschberg(x2, y2);
    r.insert(r.end(), r2.begin(), r2.end());
    return r;
}

// Todas las LCS distintas. Guarda por celda el conjunto ya calculado para no repetir caminos.
// Puede crecer exponencialmente, por eso tiene limite.
// O(m n * numero de LCS * longitud)
inline std::set<std::string> todasLCS(const Tabla& c, const std::string& x, const std::string& y, int i, int j,
                                      std::map<std::pair<int, int>, std::set<std::string>>& memo, std::size_t limite) {
    if (i == 0 || j == 0) return {""};
    auto it = memo.find({i, j});
    if (it != memo.end()) return it->second;
    std::set<std::string> r;
    if (x[i - 1] == y[j - 1]) {
        for (const std::string& s : todasLCS(c, x, y, i - 1, j - 1, memo, limite)) {
            r.insert(s + x[i - 1]);
            if (r.size() >= limite) break;
        }
    } else {
        if (c[i - 1][j] == c[i][j])
            for (const std::string& s : todasLCS(c, x, y, i - 1, j, memo, limite)) {
                r.insert(s);
                if (r.size() >= limite) break;
            }
        if (c[i][j - 1] == c[i][j] && r.size() < limite)
            for (const std::string& s : todasLCS(c, x, y, i, j - 1, memo, limite)) {
                r.insert(s);
                if (r.size() >= limite) break;
            }
    }
    memo[{i, j}] = r;
    return r;
}

// O(m n * numero de LCS * longitud)
inline std::set<std::string> todasLCS(const std::string& x, const std::string& y, std::size_t limite = 100000) {
    Tabla c = tablaLCS(x, y);
    std::map<std::pair<int, int>, std::set<std::string>> memo;
    return todasLCS(c, x, y, static_cast<int>(x.size()), static_cast<int>(y.size()), memo, limite);
}

// Cuenta las LCS distintas sin listarlas. Usa la PD clasica de conteo, restando el caso doble para no contar dos veces.
// O(m n)
inline unsigned long long contarLCS(const std::string& x, const std::string& y) {
    Tabla c = tablaLCS(x, y);
    int m = static_cast<int>(x.size()), n = static_cast<int>(y.size());
    std::vector<std::vector<unsigned long long>> d(m + 1, std::vector<unsigned long long>(n + 1, 1));
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (x[i - 1] == y[j - 1]) {
                d[i][j] = d[i - 1][j - 1];
            } else {
                unsigned long long v = 0;
                if (c[i - 1][j] == c[i][j]) v += d[i - 1][j];
                if (c[i][j - 1] == c[i][j]) v += d[i][j - 1];
                if (c[i - 1][j] == c[i][j] && c[i][j - 1] == c[i][j] && c[i - 1][j - 1] == c[i][j]) v -= d[i - 1][j - 1];
                d[i][j] = v;
            }
        }
    }
    return d[m][n];
}

// true si s se puede obtener de t borrando elementos sin reordenar.
// O(|t|)
template <typename S>
bool esSubsecuencia(const S& s, const S& t) {
    std::size_t k = 0;
    for (std::size_t i = 0; i < t.size() && k < s.size(); i++)
        if (t[i] == s[k]) k++;
    return k == s.size();
}

// true si s aparece contigua dentro de t.
// O(|s| |t|)
inline bool esSubcadena(const std::string& s, const std::string& t) {
    return t.find(s) != std::string::npos;
}

// Una linea del diff, ' ' se queda, '-' se borra del original, '+' se agrega en la version nueva.
struct LineaDiff {
    char tipo;
    std::string texto;
};

// Las lineas de la LCS son las que no cambiaron, todo lo demas se borra o se agrega.
// O(m n)
inline std::vector<LineaDiff> diffLineas(const std::vector<std::string>& a, const std::vector<std::string>& b) {
    Tabla c = tablaLCS(a, b);
    std::vector<LineaDiff> r;
    int i = static_cast<int>(a.size()), j = static_cast<int>(b.size());
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] == b[j - 1]) {
            r.push_back({' ', a[i - 1]});
            i--;
            j--;
        } else if (j > 0 && (i == 0 || c[i][j - 1] >= c[i - 1][j])) {
            r.push_back({'+', b[j - 1]});
            j--;
        } else {
            r.push_back({'-', a[i - 1]});
            i--;
        }
    }
    std::reverse(r.begin(), r.end());
    return r;
}

// Mision 8

#include <chrono>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#include "lcs.hpp"

// Lee las dos secuencias, una por linea. Ignora lineas vacias y lo que siga de un '#'.
// O(tamano del archivo)
bool leerPar(const std::string& nombre, std::string& x, std::string& y, std::string& error) {
    std::ifstream f(nombre);
    if (!f) {
        error = "No se pudo abrir el archivo";
        return false;
    }
    std::vector<std::string> lineas;
    std::string linea;
    while (std::getline(f, linea)) {
        std::size_t pos = linea.find('#');
        if (pos != std::string::npos) linea = linea.substr(0, pos);
        while (!linea.empty() && (linea.back() == '\r' || linea.back() == ' ' || linea.back() == '\t')) linea.pop_back();
        std::size_t ini = linea.find_first_not_of(" \t");
        if (ini == std::string::npos) continue;
        lineas.push_back(linea.substr(ini));
    }
    if (lineas.size() != 2) {
        error = "Se esperaban 2 secuencias y el archivo trae " + std::to_string(lineas.size());
        return false;
    }
    x = lineas[0];
    y = lineas[1];
    return true;
}

// O(lineas)
bool leerLineas(const std::string& nombre, std::vector<std::string>& v) {
    std::ifstream f(nombre);
    if (!f) return false;
    std::string linea;
    while (std::getline(f, linea)) {
        if (!linea.empty() && linea.back() == '\r') linea.pop_back();
        v.push_back(linea);
    }
    return true;
}

// Imprime la tabla con X en las filas y Y en las columnas, como en el pizarron.
// O(m n)
void imprimirTabla(const Tabla& c, const std::string& x, const std::string& y) {
    std::cout << "      ";
    std::cout << std::setw(3) << "-";
    for (char ch : y) std::cout << std::setw(3) << ch;
    std::cout << "\n";
    for (std::size_t i = 0; i < c.size(); i++) {
        std::cout << std::setw(3) << i << " " << (i == 0 ? '-' : x[i - 1]) << " ";
        for (int v : c[i]) std::cout << std::setw(3) << v;
        std::cout << "\n";
    }
}

// O(m n)
void modoPar(const std::string& x, const std::string& y) {
    using Reloj = std::chrono::steady_clock;
    std::cout << "X = " << x << "  (m = " << x.size() << ")\n";
    std::cout << "Y = " << y << "  (n = " << y.size() << ")\n\n";

    auto t0 = Reloj::now();
    Tabla c = tablaLCS(x, y);
    std::string una = reconstruir(c, x, y);
    auto t1 = Reloj::now();
    double ms = std::chrono::duration<double, std::milli>(t1 - t0).count();

    if (x.size() <= 20 && y.size() <= 20) {
        std::cout << "Tabla c[i][j]\n";
        imprimirTabla(c, x, y);
        std::cout << "\n";
    }

    std::cout << "Longitud de la LCS  " << c[x.size()][y.size()] << "\n";
    std::cout << "Una LCS (tabla)     " << (una.empty() ? "(vacia)" : una) << "\n";
    std::string h = hirschberg(x, y);
    std::cout << "Una LCS (Hirschberg) " << (h.empty() ? "(vacia)" : h) << "\n";
    std::cout << "Dos filas           " << lcsDosFilas(x, y) << "\n";
    if (x.size() * y.size() <= 4000000) std::cout << "LCS distintas       " << contarLCS(x, y) << "\n";

    if (x.size() + y.size() <= 60) {
        std::set<std::string> todas = todasLCS(x, y, 50);
        std::cout << "Lista (hasta 50)    ";
        int k = 0;
        for (const std::string& s : todas) std::cout << (k++ ? ", " : "") << (s.empty() ? "(vacia)" : s);
        std::cout << "\n";
    }
    if (std::min(x.size(), y.size()) <= 22) {
        std::cout << "Fuerza bruta        " << lcsFuerzaBruta(x, y) << "\n";
    }
    bool ok = esSubsecuencia(una, x) && esSubsecuencia(una, y) && static_cast<int>(una.size()) == c[x.size()][y.size()] &&
              h.size() == una.size() && esSubsecuencia(h, x) && esSubsecuencia(h, y);
    std::cout << "Verificacion        " << (ok ? "la LCS es subsecuencia de X y de Y" : "ERROR") << "\n";
    std::cout << std::fixed << std::setprecision(3) << "Tiempo tabla        " << ms << " ms\n";
}

// O(m n)
void modoDiff(const std::string& a, const std::string& b) {
    std::vector<std::string> va, vb;
    if (!leerLineas(a, va) || !leerLineas(b, vb)) {
        std::cout << "No se pudieron abrir los archivos\n";
        return;
    }
    std::vector<LineaDiff> d = diffLineas(va, vb);
    int iguales = 0, menos = 0, mas = 0;
    for (const LineaDiff& l : d) {
        std::cout << l.tipo << " " << l.texto << "\n";
        if (l.tipo == ' ') iguales++;
        else if (l.tipo == '-') menos++;
        else mas++;
    }
    std::cout << "\nLineas en la LCS (sin cambio) " << iguales << "\n";
    std::cout << "Borradas " << menos << ", agregadas " << mas << "\n";
    std::cout << "N + M - 2L = " << va.size() << " + " << vb.size() << " - 2*" << iguales << " = "
              << static_cast<int>(va.size() + vb.size()) - 2 * iguales << " cambios\n";
}

int main(int argc, char** argv) {
    if (argc == 4 && std::string(argv[1]) == "--diff") {
        modoDiff(argv[2], argv[3]);
        return 0;
    }
    if (argc == 3) {
        modoPar(argv[1], argv[2]);
        return 0;
    }
    if (argc != 2) {
        std::cout << "Uso\n"
                  << "  lcs archivo.txt          (dos lineas, X y Y)\n"
                  << "  lcs CADENA1 CADENA2\n"
                  << "  lcs --diff viejo.txt nuevo.txt\n";
        return 1;
    }
    std::string x, y, error;
    if (!leerPar(argv[1], x, y, error)) {
        std::cout << "Error, " << error << "\n";
        return 1;
    }
    modoPar(x, y);
    return 0;
}

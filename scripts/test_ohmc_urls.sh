#!/bin/bash

echo "🔍 Probando URLs del OHMC..."
echo "=========================="

# URLs basadas en el JSON proporcionado
echo ""
echo "📊 Probando URLs de ejemplo del JSON:"

# WRF - ejemplo del JSON
echo "🌡️ WRF (ejemplo del JSON):"
curl -I "https://yaku.ohmc.ar/public/wrf/img/CBA/2025_06/26_06/t2/t2-2025-06-26_06+09.png" 2>/dev/null | head -1

# FWI
echo "🔥 FWI:"
curl -I "https://yaku.ohmc.ar/public/FWI/FWI.png" 2>/dev/null | head -1

# Rutas caminera
echo "🛣️ Rutas caminera:"
curl -I "https://yaku.ohmc.ar/public/rutas_caminera/rafagas_rutas.gif" 2>/dev/null | head -1

# MedicionAire - ejemplo del JSON
echo "🌬️ MedicionAire (ejemplo del JSON):"
curl -I "https://yaku.ohmc.ar/public/MedicionAire/06/26/CH4_webvisualizer_v4.png" 2>/dev/null | head -1
curl -I "https://yaku.ohmc.ar/public/MedicionAire/06/26/CO2_webvisualizer_v4.png" 2>/dev/null | head -1

echo ""
echo "🔍 Probando algunas fechas anteriores para WRF:"

# Probar fechas anteriores
for day in 25 24 23 22; do
    url="https://yaku.ohmc.ar/public/wrf/img/CBA/2025_06/${day}_06/t2/t2-2025-06-${day}_06+00.png"
    echo "📅 2025-06-${day}:"
    curl -I "$url" 2>/dev/null | head -1
done

echo ""
echo "✅ Prueba de URLs completada"

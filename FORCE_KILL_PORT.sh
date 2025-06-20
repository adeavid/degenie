#!/bin/bash

echo "🔍 Buscando procesos en puerto 4000..."

# Opción 1: Buscar y mostrar procesos
echo "Procesos usando puerto 4000:"
lsof -i:4000

echo ""
echo "🔪 Terminando procesos en puerto 4000..."

# Opción 2: Terminar procesos de forma agresiva
sudo kill -9 $(lsof -ti:4000) 2>/dev/null

# Opción 3: También buscar por nombre node/nodemon
echo "🔪 Terminando procesos node/nodemon..."
pkill -f "node.*4000" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "ts-node.*complete-server" 2>/dev/null

echo ""
echo "✅ Verificando que el puerto esté libre..."
if lsof -i:4000 >/dev/null 2>&1; then
    echo "❌ Puerto 4000 aún en uso:"
    lsof -i:4000
else
    echo "✅ Puerto 4000 está libre!"
fi

echo ""
echo "🚀 Ahora puedes ejecutar: npm run dev:complete"
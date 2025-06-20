# 🔧 Solución: Puerto 4000 en Uso

El error `EADDRINUSE: address already in use :::4000` significa que ya hay un proceso usando el puerto 4000.

## 🚨 Ejecutar estos comandos para solucionarlo:

### 1. Encontrar el proceso que usa el puerto 4000:
```bash
lsof -ti:4000
```

### 2. Terminar el proceso (opción segura):
```bash
kill $(lsof -ti:4000)
```

### 3. Si no funciona, forzar terminación:
```bash
kill -9 $(lsof -ti:4000)
```

### 4. Verificar que el puerto esté libre:
```bash
lsof -ti:4000
```
(No debería retornar nada)

### 5. Reiniciar el servidor backend:
```bash
cd /Users/cash/Desktop/degenie/src/backend
npm run dev:complete
```

## 🎯 Resultado Esperado:

Después de liberar el puerto, deberías ver:
```
🚀 Server running on http://localhost:4000
💾 Database connected  
🔌 Replicate API ready
[nodemon] watching path(s): *.*
```

## 🚀 Si todo funciona:

1. **Mantén el backend corriendo** en esta terminal
2. **Abre una nueva terminal** para el frontend:
   ```bash
   cd /Users/cash/Desktop/degenie/src/frontend
   npm run dev
   ```
3. **Accede a**: http://localhost:3000

## 🎯 Verificación Final:

- ✅ Backend en puerto 4000 funcionando
- ✅ Frontend en puerto 3000 funcionando  
- ✅ Phantom wallet conectado
- ✅ Create token page debería funcionar sin errores

¡El sistema completo debería estar operativo! 🚀
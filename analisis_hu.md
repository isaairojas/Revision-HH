# Análisis HU ERB-45802 y ERB-45803

## ERB-45802 — Ventana principal de revisión

### Flujo principal
1. Logístico selecciona tarea de revisión → sistema bloquea pedido
2. Escaneo producto a producto (cámara/pistola láser)
3. Acepta etiqueta APYMSA 18 dígitos (estándar) o 7 dígitos (misceláneo)
4. NO muestra cantidad requerida durante escaneo, solo conteo actual
5. Al presionar "Aceptar" → compara conteo vs requerido
   - Sin diferencias → mensaje para iniciar facturación
   - Con diferencias → navega a ERB-45803

### Estructura etiqueta 18 dígitos
- Pos 1-7:  Producto (7 dígitos)
- Pos 8-13: Cantidad (6 dígitos)
- Pos 14-18: Peso (5 dígitos)

### Alertas auditivas
- Sonido 1: código inválido (no cumple formato 18 o 7 dígitos)
- Sonido 2: código válido pero NO pertenece al pedido

### Producto misceláneo (7 dígitos)
- Abre bottom sheet para ingresar cantidad manualmente

## ERB-45803 — Gestión de discrepancias

### Tipos de discrepancia (ordenados por prioridad visual)
1. FALTANTE (rojo) — conteo < requerido
   - Acción: seleccionar motivo
   - Motivos: Etiqueta errónea | Error de surtido | Merma | Otro
   - Registro en tabla de productos negados

2. PRODUCTO INCORRECTO (gris oscuro/morado) — código no pertenece al pedido
   - Acción: retirar físicamente + escanear código para confirmar retiro
   - Sin escaneo de confirmación no se puede resolver

3. SOBRANTE (ámbar) — conteo > requerido
   - Acción: solo presionar "Enterado" (informativo)

### Reglas clave
- Botón "Finalizar revisión" bloqueado hasta resolver TODAS las discrepancias
- Contador visible de discrepancias pendientes en tiempo real
- Cierre anticipado → advertencia → reinicia flujo completo desde ventana principal

## Escenarios de prueba para el Word de productos

### Pedido de prueba: P-123456
Artículos del pedido (6 partidas):

| # | Código | Descripción | Cant. Requerida | Escenario |
|---|--------|-------------|-----------------|-----------|
| 1 | 0486600 | FILTRO DE ACEITE | 3 | Revisión exacta (sin discrepancia) |
| 2 | 1365800 | BUJÍA NGK | 4 | Faltante (se escanean 2 de 4) |
| 3 | 1394001 | PASTILLA DE FRENO | 2 | Sobrante (se escanean 3 de 2) |
| 4 | 2389475 | AMORTIGUADOR | 1 | Producto incorrecto (se escanea código ajeno) |
| 5 | 2948576 | CORREA DISTRIBUCIÓN | 5 | Revisión exacta (sin discrepancia) |
| 6 | 3847561 | MISCELÁNEO TORNILLOS | 10 | Misceláneo (7 dígitos, cantidad manual) |

### Códigos de barras a generar (18 dígitos)
Formato: PPPPPPPCCCCCCPPPPP (7 producto + 6 cantidad + 5 peso)

Artículo 1 (0486600, cant 3, peso 00450):  048660000000300450
Artículo 2 (1365800, cant 4, peso 00120):  136580000000400120  (x2 etiquetas para simular faltante)
Artículo 3 (1394001, cant 3, peso 00800):  139400100000300800  (sobrante: cant escaneada > requerida)
Artículo 4 (2389475, cant 1, peso 02100):  238947500000102100
Artículo 5 (2948576, cant 5, peso 00350):  294857600000500350
Artículo 6 (3847561 — misceláneo 7 dígitos): 3847561

### Código ajeno al pedido (para escenario producto incorrecto)
Artículo ajeno (9999999, cant 1, peso 00100): 999999900000100100

### Código inválido (para escenario alerta sonido 1)
Código corto: 12345 (menos de 7 dígitos)

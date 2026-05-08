# Notas de Diseño - Prototipo Revisión de Órdenes

## Paleta de Colores
- Azul oscuro (header/botones activos): #1a3a8c / #0d2d7a
- Azul medio (tarjeta Tareas): #1e4db7
- Azul medio-claro (Consulta de tareas): #3a6bc9
- Azul claro (Descarga de mercancía): #5a87d8
- Azul muy claro (Evidencias de envíos): #7aa3e5
- Rojo (botón Salir / botón X): #e53935 / #d32f2f
- Verde (botón check): #2e7d32 / #388e3c
- Amarillo (badge pendientes): #f9a825
- Fondo general: blanco con bordes redondeados

## Pantalla 1: Menú
- Header: "Menú" en blanco sobre fondo azul oscuro
- 4 tarjetas de menú con gradiente de azul oscuro a claro:
  1. Tareas (azul más oscuro, ícono de persona con portapapeles)
  2. Consulta de tareas cargadas (azul medio, ícono de engranaje)
  3. Descarga de mercancía (azul claro, ícono de ojo/lupa)
  4. Evidencias de envíos (azul más claro, badge rojo "+5")
- Botón "Salir" rojo en la parte inferior

## Pantalla 2: Asignación de tareas (al hacer clic en "Tareas")
- Header: "← Menú" con ícono de portapapeles
- Título: "Asignación de tareas"
- Sección "Empleado" con ícono de persona
  - Campo: 9029 | JUAN ANTONIO GUERRERO MEDINA
- Sección "Tarea asignada" con ícono de checkbox
  - Campo: 9029 | JUAN ANTONIO GUERRERO MEDINA
  - Actividad: REVISAR PEDIDO CLIENTE (antes SURTIR → ahora REVISIÓN)
  - Fecha inicio: 31/08/2023
  - Hora inicio: 11:30 a.m.
  - DocumentoID: REVISAR PEDIDO CLIENTE
- Botones: X (rojo) y ✓ (verde)
- Al hacer clic en ✓ → abrir pantalla de Revisión de órdenes

## Pantalla 3: Revisión de órdenes (antes "Surtido de órdenes")
- Header: "← Menú" con ícono de 3 puntos
- Título: "Revisión de órdenes"
- Panel de avance: "Avance del pedido" | "Pedido 123456"
  - Completado: 0 ✓ verde
  - Negado: 0 ⊘ rojo
  - Parcial: 0 ◑ azul
  - Pendientes: 11 ⚠ amarillo
- Lista de artículos con código, ubicación y progreso "0 de N"
- Tooltip: "Esta ronda puede contener más de un pedido. Al finalizar este pedido, continuará con el siguiente."
- Barra inferior con ícono de teclado y campo de texto

## Interacciones
1. Clic en "Tareas" → Pantalla Asignación de tareas
2. Clic en ✓ (verde) en Asignación → Pantalla Revisión de órdenes
3. Clic en X (rojo) en Asignación → Volver al Menú
4. Clic en ← Menú → Volver al Menú
5. Tooltip en indicador de pedido (ícono de info o al hover en "Pedido 123456")

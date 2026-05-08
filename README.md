# Prototipo Interactivo — Revisión de Órdenes

Prototipo de interfaz móvil para el flujo de **Revisión de Órdenes**, desarrollado en HTML, CSS y JavaScript puro, sin dependencias externas. Diseñado para ser publicado directamente en **GitHub Pages**.

## Estructura del proyecto

```
revision-prototipo/
├── index.html   # Estructura de todas las pantallas y modales
├── styles.css   # Estilos completos (paleta, layout, componentes)
├── app.js       # Lógica de navegación e interacciones
└── README.md    # Este archivo
```

## Pantallas incluidas

| Pantalla | Descripción |
|---|---|
| Menú principal | Cuatro tarjetas de acceso con gradiente azul, badge de notificación y botón Salir |
| Asignación de tareas | Detalle del empleado, tarea asignada (Actividad: REVISAR PEDIDO CLIENTE), fecha y DocumentoID |
| Revisión de órdenes | Panel de avance del pedido, lista de artículos con progreso, barra de escaneo |
| Módulos placeholder | Consulta de tareas, Descarga de mercancía, Evidencias de envíos (en desarrollo) |

## Flujo de interacción

1. **Menú → Tareas** abre la pantalla de Asignación de tareas.
2. **Botón ✓ (verde)** en Asignación confirma y abre la Revisión de órdenes.
3. **Botón ✗ (rojo)** en Asignación cancela y regresa al Menú.
4. **Artículo en la lista** abre el modal de detalle con opciones: Negar, Parcial, Completar.
5. **Ícono de información (ⓘ)** junto a "Pedido 123456" muestra el tooltip explicativo sobre múltiples pedidos en ronda.
6. **← Menú** en cualquier sub-pantalla regresa al menú principal.

## Publicar en GitHub Pages

### Opción A — Repositorio nuevo

```bash
# 1. Crear repositorio en GitHub (privado o público)
gh repo create nombre-del-repo --public --source=. --push

# 2. En GitHub → Settings → Pages → Branch: main → / (root) → Save
```

### Opción B — Repositorio existente

```bash
git init
git add .
git commit -m "feat: prototipo inicial revisión de órdenes"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Luego en GitHub: **Settings → Pages → Branch: main → / (root) → Save**.

La URL pública quedará disponible en:
`https://TU_USUARIO.github.io/TU_REPO/`

## Notas de diseño

La paleta de colores replica fielmente la identidad visual de la aplicación original: azul oscuro `#0d2d7a` para encabezados y tarjeta principal, con gradiente progresivo hacia azules más claros en las tarjetas inferiores del menú. El rojo `#e53935` se utiliza para acciones de cancelación y el verde `#2e7d32` para confirmación, manteniendo coherencia con el sistema de diseño de referencia.

El tooltip de múltiples pedidos informa al usuario que la ronda puede contener más de un pedido, y que al finalizar la revisión del pedido actual el sistema continuará automáticamente con el siguiente, sin necesidad de regresar al menú.

/* ============================================================
   DATOS DEL PEDIDO DE PRUEBA
   ============================================================ */
const PEDIDO = {
  id: '123456',
  articulos: [
    { sku: '0486600', nombre: 'FILTRO DE ACEITE PREMIUM', cantPedido: 31, cantRevisada: 0, estado: 'pendiente', ubicacion: 'Planta Baja', pasillo: 'Pasillo 18', torre: 'Torre 4', nivel: 'Nivel 1', existencia: 120, esMiscelaneo: false },
    { sku: '1365800', nombre: 'BUJIA NGK ESTANDAR', cantPedido: 7, cantRevisada: 0, estado: 'pendiente', ubicacion: 'Planta Baja', pasillo: 'Pasillo 18', torre: 'Torre 5', nivel: 'Nivel 1', existencia: 45, esMiscelaneo: false },
    { sku: '1394001', nombre: 'CINTA AISLANTE AMARILLO 20 PIES PLASTICA IMPORTADO 20 U/L', cantPedido: 10, cantRevisada: 0, estado: 'pendiente', ubicacion: 'Planta Baja', pasillo: 'Pasillo 18', torre: 'Torre 5', nivel: 'Nivel 1', existencia: 100, esMiscelaneo: false },
    { sku: '2389475', nombre: 'PASTILLA DE FRENO TRASERA', cantPedido: 8, cantRevisada: 0, estado: 'pendiente', ubicacion: 'Planta Baja', pasillo: 'Pasillo 18', torre: 'Torre 4', nivel: 'Nivel 2', existencia: 60, esMiscelaneo: false },
    { sku: '9182736', nombre: 'ACEITE MOTOR 5W-30 SINTETICO', cantPedido: 9, cantRevisada: 0, estado: 'pendiente', ubicacion: 'Planta Baja', pasillo: 'Pasillo 18', torre: 'Torre 5', nivel: 'Nivel 1', existencia: 200, esMiscelaneo: false },
    { sku: '3847561', nombre: 'MISCELANEOS / VARIOS', cantPedido: 15, cantRevisada: 0, estado: 'pendiente', ubicacion: 'N/A', pasillo: 'N/A', torre: 'N/A', nivel: 'N/A', existencia: 999, esMiscelaneo: true }
  ]
};

// Productos ajenos escaneados (no pertenecen al pedido)
let productosAjenos = [];

let articuloActualIdx = -1;
let scanRevisionTimer = null;

// Conteo de discrepancias resueltas (se calcula dinámicamente)
let discResueltasCount = 0;
let totalDiscrepancias = 0;

/* ============================================================
   ESCANEO EN PANTALLA DE REVISIÓN (etiqueta 18 dígitos)
   Estructura: Producto(1-7) | Cantidad(8-13) | Peso(14-18)
   ============================================================ */
function debounceScanRevision(valor) {
  clearTimeout(scanRevisionTimer);
  scanRevisionTimer = setTimeout(() => procesarScanRevision(valor), 300);
}

function procesarScanRevision(valor) {
  const codigo = valor.trim();
  const input  = document.getElementById('scanner-revision');

  if (codigo.length < 7) return;

  const es18 = /^\d{18}$/.test(codigo);
  const es7  = /^\d{7}$/.test(codigo);

  if (!es18 && !es7) {
    showToast('error', 'Se produjo un error', 'Formato no reconocido. Se esperan 18 dígitos (etiqueta) o 7 dígitos (código).');
    if (input) { input.value = ''; }
    return;
  }

  const codigoProducto   = es18 ? codigo.substring(0, 7) : codigo;
  const cantidadEtiqueta = es18 ? (parseInt(codigo.substring(7, 13), 10) || 1) : 1;

  const art = PEDIDO.articulos.find(a => a.sku === codigoProducto);

  // Código ajeno al pedido
  if (!art) {
    // Registrar como producto ajeno
    const existeAjeno = productosAjenos.find(p => p.sku === codigoProducto);
    if (existeAjeno) {
      existeAjeno.cantidad += cantidadEtiqueta;
    } else {
      productosAjenos.push({ sku: codigoProducto, cantidad: cantidadEtiqueta, nombre: 'PRODUCTO AJENO AL PEDIDO' });
    }
    showToast('error', 'Se produjo un error', 'El código ' + codigoProducto + ' no corresponde a ningún artículo de este pedido.');
    if (input) { input.value = ''; }
    return;
  }

  // Artículo misceláneo: abrir modal de cantidad manual
  if (art.esMiscelaneo) {
    if (input) { input.value = ''; }
    abrirBsCantidad(codigoProducto);
    return;
  }

  // Sumar cantidad escaneada (sin tope — permite sobrante)
  art.cantRevisada += cantidadEtiqueta;
  if (art.cantRevisada > art.cantPedido) {
    art.estado = 'sobrante';
    const exceso = art.cantRevisada - art.cantPedido;
    showToast('warning', 'Sobrante detectado', 'Artículo ' + codigoProducto + ': ' + art.cantRevisada + ' escaneados, pedido requiere ' + art.cantPedido + ' (sobrante: +' + exceso + ').');
  } else if (art.cantRevisada === art.cantPedido) {
    art.estado = 'completo';
    showToast('success', 'Acción realizada', 'Artículo ' + codigoProducto + ' completado (' + art.cantRevisada + '/' + art.cantPedido + ').');
  } else {
    art.estado = 'parcial';
    showToast('warning', 'Alerta importante', 'Artículo ' + codigoProducto + ': ' + art.cantRevisada + ' de ' + art.cantPedido + ' revisados.');
  }

  if (input) { input.value = ''; setTimeout(() => input.focus(), 50); }
  renderTablaArticulos();
  actualizarStats();
}

/* ============================================================
   BOTTOM SHEET: CANTIDAD MISCELÁNEO (desde escaneo en lista)
   ============================================================ */
function abrirBsCantidad(sku) {
  document.getElementById('bs-codigo-val').textContent = sku;
  document.getElementById('bs-cantidad-input').value = '0';
  document.getElementById('bs-cantidad').classList.remove('hidden');
  setTimeout(() => document.getElementById('bs-cantidad-input').focus(), 100);
}
function cerrarBsCantidad(e) {
  if (!e || e.target === document.getElementById('bs-cantidad')) {
    document.getElementById('bs-cantidad').classList.add('hidden');
  }
}
function cerrarBsCantidadBtn() {
  document.getElementById('bs-cantidad').classList.add('hidden');
}
function confirmarCantidadMisc() {
  const sku = document.getElementById('bs-codigo-val').textContent;
  const val = parseInt(document.getElementById('bs-cantidad-input').value) || 0;
  const art = PEDIDO.articulos.find(a => a.sku === sku);
  if (art) {
    art.cantRevisada = val;
    art.estado = val >= art.cantPedido ? 'completo' : (val > 0 ? 'parcial' : 'pendiente');
    actualizarStats();
    renderTablaArticulos();
    showToast('success', 'Acción realizada', val + ' piezas registradas para ' + sku + '.');
  }
  cerrarBsCantidadBtn();
}

/* ============================================================
   NAVEGACION
   ============================================================ */
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
  if (screenId === 'screen-revision') {
    renderTablaArticulos();
    actualizarStats();
    setTimeout(() => { const inp = document.getElementById('scanner-revision'); if (inp) inp.focus(); }, 150);
  }
}

/* ============================================================
   RENDER TABLA DE ARTICULOS
   ============================================================ */
function renderTablaArticulos() {
  const tbody = document.getElementById('articulos-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  PEDIDO.articulos.forEach((art, idx) => {
    const tr = document.createElement('tr');
    tr.onclick = () => abrirDetalleProducto(idx);

    const tdImg = document.createElement('td');
    tdImg.innerHTML = '<div class="td-img-cell"><svg width="22" height="22" viewBox="0 0 24 24" fill="#c5cae9"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg></div>';

    const tdSku = document.createElement('td');
    tdSku.className = 'td-sku';
    const nombreCorto = art.nombre.length > 28 ? art.nombre.substring(0, 28) + '...' : art.nombre;
    tdSku.innerHTML = '<span class="sku-codigo">' + art.sku + '</span><span class="sku-nombre">' + nombreCorto + '</span>';

    const tdPed = document.createElement('td');
    tdPed.innerHTML = '<strong>' + art.cantPedido + '</strong>';

    const tdRev = document.createElement('td');
    let badgeClass = 'badge-rev';
    let badgeText = art.cantRevisada + ' de ' + art.cantPedido;
    if (art.estado === 'negado')   { badgeClass = 'badge-rev negado';   badgeText = 'Negado'; }
    else if (art.estado === 'completo') { badgeClass = 'badge-rev completo'; }
    else if (art.estado === 'sobrante') { badgeClass = 'badge-rev sobrante'; badgeText = art.cantRevisada + ' de ' + art.cantPedido + ' (+' + (art.cantRevisada - art.cantPedido) + ')'; }
    tdRev.innerHTML = '<span class="' + badgeClass + '">' + badgeText + '</span>';

    tr.appendChild(tdImg);
    tr.appendChild(tdSku);
    tr.appendChild(tdPed);
    tr.appendChild(tdRev);
    tbody.appendChild(tr);
  });
}

/* ============================================================
   ABRIR DETALLE DEL PRODUCTO
   ============================================================ */
function abrirDetalleProducto(idx) {
  const art = PEDIDO.articulos[idx];
  articuloActualIdx = idx;

  document.getElementById('det-codigo').textContent = art.sku;
  document.getElementById('det-nombre').textContent = art.nombre;

  const secSolicitado = document.getElementById('det-section-solicitado');
  const secCantidad   = document.getElementById('det-section-cantidad');
  const footerNormal  = document.getElementById('det-footer-normal');
  const footerMisc    = document.getElementById('det-footer-misc');

  if (art.esMiscelaneo) {
    secSolicitado.classList.add('hidden');
    secCantidad.classList.remove('hidden');
    document.getElementById('det-cantidad-val-btn').textContent = art.cantRevisada;
    footerNormal.classList.add('hidden');
    footerMisc.classList.remove('hidden');
  } else {
    secSolicitado.classList.remove('hidden');
    document.getElementById('det-solicitado-val').textContent = art.cantPedido;
    document.getElementById('det-btn-cantidad').textContent   = art.cantPedido;
    secCantidad.classList.add('hidden');
    footerNormal.classList.remove('hidden');
    footerMisc.classList.add('hidden');
  }

  goTo('screen-detalle');
}

/* ============================================================
   STEPPER (solo misceláneos)
   ============================================================ */
function stepperCambiar(delta) {
  const btn = document.getElementById('det-cantidad-val-btn');
  let val = parseInt(btn.textContent) || 0;
  val = Math.max(0, val + delta);
  btn.textContent = val;
  if (articuloActualIdx >= 0) {
    const art = PEDIDO.articulos[articuloActualIdx];
    art.cantRevisada = val;
    art.estado = val >= art.cantPedido ? 'completo' : (val > 0 ? 'parcial' : 'pendiente');
  }
}

/* ============================================================
   MODAL DE CANTIDAD MANUAL (misceláneos en detalle)
   ============================================================ */
function abrirModalCantidad() {
  const art = PEDIDO.articulos[articuloActualIdx];
  document.getElementById('modal-cant-codigo').textContent = 'Código: ' + art.sku;
  document.getElementById('modal-cant-input').value = art.cantRevisada || '';
  document.getElementById('modal-cantidad').classList.remove('hidden');
  setTimeout(() => {
    const inp = document.getElementById('modal-cant-input');
    inp.focus();
    inp.select();
  }, 80);
}
function cerrarModalCantidad(e) {
  if (!e || e.target === document.getElementById('modal-cantidad')) {
    document.getElementById('modal-cantidad').classList.add('hidden');
  }
}
function cerrarModalCantidadBtn() {
  document.getElementById('modal-cantidad').classList.add('hidden');
}
function confirmarModalCantidad() {
  const val = parseInt(document.getElementById('modal-cant-input').value) || 0;
  if (articuloActualIdx >= 0) {
    const art = PEDIDO.articulos[articuloActualIdx];
    art.cantRevisada = val;
    art.estado = val >= art.cantPedido ? 'completo' : (val > 0 ? 'parcial' : 'pendiente');
    document.getElementById('det-cantidad-val-btn').textContent = val;
  }
  cerrarModalCantidadBtn();
}

/* ============================================================
   GUARDAR Y REGRESAR (desde detalle)
   ============================================================ */
function guardarYRegresar() {
  if (articuloActualIdx >= 0) {
    const art = PEDIDO.articulos[articuloActualIdx];
    if (art.esMiscelaneo) {
      const val = parseInt(document.getElementById('det-cantidad-val-btn').textContent) || 0;
      art.cantRevisada = val;
      art.estado = val >= art.cantPedido ? 'completo' : (val > 0 ? 'parcial' : 'pendiente');
      showToast('success', 'Cantidad guardada', 'Se registraron ' + val + ' piezas revisadas para ' + art.sku + '.');
    } else {
      showToast('success', 'Acción realizada', 'Detalle consultado para ' + art.sku + '.');
    }
  }
  actualizarStats();
  renderTablaArticulos();
  goTo('screen-revision');
}

/* ============================================================
   ESTADISTICAS
   ============================================================ */
function actualizarStats() {
  let completado = 0, negado = 0, parcial = 0, pendiente = 0;
  PEDIDO.articulos.forEach(a => {
    if (a.estado === 'completo' || a.estado === 'sobrante') completado++;
    else if (a.estado === 'negado')  negado++;
    else if (a.estado === 'parcial') parcial++;
    else                             pendiente++;
  });
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('stat-completado', completado);
  setEl('stat-negado',     negado);
  setEl('stat-parcial',    parcial);
  setEl('stat-pendiente',  pendiente);
}

/* ============================================================
   BOTTOM SHEET: OPCIONES (3 puntos)
   ============================================================ */
function abrirOpcionesSheet() {
  document.getElementById('bs-opciones').classList.remove('hidden');
}
function cerrarOpcionesSheet(e) {
  if (!e || e.target === document.getElementById('bs-opciones')) {
    document.getElementById('bs-opciones').classList.add('hidden');
  }
}
function repetirAudio() {
  cerrarOpcionesSheet();
  showToast('warning', 'Repetir audio', 'Reproduciendo instrucciones de voz...');
}

/* ============================================================
   TOOLTIP
   ============================================================ */
function toggleTooltip() {
  const tt = document.getElementById('tooltip-pedido');
  if (tt) tt.classList.toggle('hidden');
}
document.addEventListener('click', function(e) {
  const tt = document.getElementById('tooltip-pedido');
  if (!tt) return;
  if (!e.target.closest('.pedido-id-container')) tt.classList.add('hidden');
});

/* ============================================================
   FINALIZAR REVISIÓN — lógica principal
   Evalúa si hay discrepancias y navega a la pantalla correcta
   ============================================================ */
function solicitarFinalizarRevision() {
  cerrarOpcionesSheet();

  // Verificar si hay artículos aún pendientes (sin escanear)
  const pendientes = PEDIDO.articulos.filter(a => a.estado === 'pendiente').length;
  if (pendientes > 0) {
    showToast('warning', 'Artículos pendientes', 'Aún hay ' + pendientes + ' artículo(s) sin revisar. Completa el escaneo o continúa si deseas cerrar con diferencias.');
    // Permitir continuar igualmente mostrando el modal de confirmación
    // El usuario puede optar por finalizar con pendientes (se registran como faltantes)
  }

  // Calcular discrepancias reales
  const discrepancias = calcularDiscrepancias();
  totalDiscrepancias = discrepancias.faltantes.length + discrepancias.sobrantes.length + discrepancias.ajenosRegistrados.length;

  if (totalDiscrepancias === 0) {
    // Sin discrepancias: mostrar modal de confirmación de facturación
    document.getElementById('modal-sin-disc').classList.remove('hidden');
  } else {
    // Con discrepancias: construir y navegar a la pantalla de discrepancias
    construirPantallaDiscrepancias(discrepancias);
    goTo('screen-discrepancias');
  }
}

/* ============================================================
   CALCULAR DISCREPANCIAS REALES basadas en el conteo
   ============================================================ */
function calcularDiscrepancias() {
  const faltantes  = [];
  const sobrantes  = [];

  PEDIDO.articulos.forEach(art => {
    const diff = art.cantRevisada - art.cantPedido;
    if (diff < 0) {
      faltantes.push({ ...art, diferencia: diff });
    } else if (diff > 0) {
      sobrantes.push({ ...art, diferencia: diff });
    }
  });

  return {
    faltantes,
    sobrantes,
    ajenosRegistrados: [...productosAjenos]
  };
}

/* ============================================================
   CONSTRUIR PANTALLA DE DISCREPANCIAS DINÁMICAMENTE
   ============================================================ */
function construirPantallaDiscrepancias(disc) {
  discResueltasCount = 0;
  totalDiscrepancias = disc.faltantes.length + disc.sobrantes.length + disc.ajenosRegistrados.length;

  // Actualizar contador del header
  const counter = document.getElementById('disc-counter-header');
  if (counter) { counter.textContent = totalDiscrepancias + ' pendientes'; counter.classList.remove('ok'); }

  // Info del pedido
  const infoEl = document.getElementById('disc-footer-info');
  if (infoEl) {
    infoEl.classList.remove('todo-ok');
    infoEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#e65100"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> ' + totalDiscrepancias + ' diferencia(s) por resolver';
  }
  const btnFin = document.getElementById('btn-finalizar');
  if (btnFin) { btnFin.disabled = true; btnFin.classList.remove('enabled'); }

  // --- FALTANTES ---
  const grupoFaltantes = document.getElementById('grupo-faltantes');
  const countFalt = document.getElementById('count-faltantes');
  if (grupoFaltantes) {
    if (disc.faltantes.length === 0) {
      grupoFaltantes.style.display = 'none';
    } else {
      grupoFaltantes.style.display = '';
      if (countFalt) countFalt.textContent = disc.faltantes.length;
      // Limpiar y reconstruir tarjetas de faltantes
      const existingCards = grupoFaltantes.querySelectorAll('.disc-tarjeta');
      existingCards.forEach(c => c.remove());
      disc.faltantes.forEach((art, i) => {
        if (i > 0) {
          const sep = document.createElement('hr');
          sep.className = 'disc-separador';
          grupoFaltantes.appendChild(sep);
        }
        const card = crearTarjetaFaltante(art);
        grupoFaltantes.appendChild(card);
      });
    }
  }

  // --- PRODUCTO INCORRECTO (ajenos) ---
  const grupoIncorrecto = document.getElementById('grupo-incorrecto');
  const countInc = document.getElementById('count-incorrecto');
  if (grupoIncorrecto) {
    if (disc.ajenosRegistrados.length === 0) {
      grupoIncorrecto.style.display = 'none';
    } else {
      grupoIncorrecto.style.display = '';
      if (countInc) countInc.textContent = disc.ajenosRegistrados.length;
      const existingCards = grupoIncorrecto.querySelectorAll('.disc-tarjeta');
      existingCards.forEach(c => c.remove());
      disc.ajenosRegistrados.forEach((prod, i) => {
        if (i > 0) {
          const sep = document.createElement('hr');
          sep.className = 'disc-separador';
          grupoIncorrecto.appendChild(sep);
        }
        const card = crearTarjetaAjeno(prod);
        grupoIncorrecto.appendChild(card);
      });
    }
  }

  // --- SOBRANTES ---
  const grupoSobrantes = document.getElementById('grupo-sobrantes');
  const countSob = document.getElementById('count-sobrantes');
  if (grupoSobrantes) {
    if (disc.sobrantes.length === 0) {
      grupoSobrantes.style.display = 'none';
    } else {
      grupoSobrantes.style.display = '';
      if (countSob) countSob.textContent = disc.sobrantes.length;
      const existingCards = grupoSobrantes.querySelectorAll('.disc-tarjeta');
      existingCards.forEach(c => c.remove());
      disc.sobrantes.forEach((art, i) => {
        if (i > 0) {
          const sep = document.createElement('hr');
          sep.className = 'disc-separador';
          grupoSobrantes.appendChild(sep);
        }
        const card = crearTarjetaSobrante(art);
        grupoSobrantes.appendChild(card);
      });
    }
  }
}

/* ============================================================
   CREAR TARJETA DE FALTANTE
   ============================================================ */
function crearTarjetaFaltante(art) {
  const id = 'disc-faltante-' + art.sku;
  const div = document.createElement('div');
  div.className = 'disc-tarjeta';
  div.id = id;
  div.innerHTML = `
    <div class="disc-tarjeta-top">
      <div class="disc-foto-producto">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="#c5cae9"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
      </div>
      <div class="disc-tarjeta-info">
        <span class="disc-codigo">${art.sku}</span>
        <span class="disc-nombre">${art.nombre}</span>
      </div>
      <div class="disc-cantidades">
        <div class="disc-cant-item"><span class="disc-cant-label">Solicitado</span><span class="disc-cant-val">${art.cantPedido}</span></div>
        <div class="disc-cant-item"><span class="disc-cant-label">Revisado</span><span class="disc-cant-val disc-val-bajo">${art.cantRevisada}</span></div>
        <div class="disc-cant-item"><span class="disc-cant-label">Diferencia</span><span class="disc-cant-val disc-val-diff">${art.diferencia}</span></div>
      </div>
    </div>
    <div class="disc-accion-faltante">
      <span class="disc-accion-label">Selecciona el motivo del faltante:</span>
      <div class="motivos-grid">
        <button class="btn-motivo" onclick="seleccionarMotivo(this,'${id}','falta')">Falta de inventario</button>
        <button class="btn-motivo btn-motivo-otro" onclick="seleccionarMotivoOtro(this,'${id}')">Otro</button>
      </div>
      <div class="motivo-nota-wrap hidden" id="nota-wrap-${id}">
        <textarea class="motivo-nota-input" id="nota-${id}" placeholder="Escribe una nota sobre el motivo..." rows="3"></textarea>
        <button class="btn-confirmar-nota" onclick="confirmarNota('${id}')">Confirmar nota</button>
      </div>
    </div>`;
  return div;
}

/* ============================================================
   CREAR TARJETA DE PRODUCTO AJENO (incorrecto)
   ============================================================ */
function crearTarjetaAjeno(prod) {
  const id = 'disc-ajeno-' + prod.sku;
  const div = document.createElement('div');
  div.className = 'disc-tarjeta';
  div.id = id;
  div.innerHTML = `
    <div class="disc-tarjeta-top">
      <div class="disc-foto-producto">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="#c5cae9"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
      </div>
      <div class="disc-tarjeta-info">
        <span class="disc-codigo">${prod.sku}</span>
        <span class="disc-nombre">${prod.nombre}</span>
      </div>
      <div class="disc-cantidades">
        <div class="disc-cant-item"><span class="disc-cant-label">Escaneado</span><span class="disc-cant-val disc-val-incorrecto">${prod.cantidad}</span></div>
      </div>
    </div>
    <div class="disc-accion-incorrecto">
      <div class="disc-instruccion-retiro">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#6a1b9a"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg>
        <span>Retira físicamente el producto y escanea su código para confirmar:</span>
      </div>
      <div class="retiro-scanner">
        <input type="text" class="scanner-retiro" id="scanner-retiro-${prod.sku}"
          placeholder="Escanear código de retiro..."
          oninput="confirmarRetiro(this,'${id}','${prod.sku}')"
        />
        <div class="retiro-estado" id="retiro-estado-${prod.sku}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#bdbdbd"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg>
        </div>
      </div>
    </div>`;
  return div;
}

/* ============================================================
   CREAR TARJETA DE SOBRANTE
   ============================================================ */
function crearTarjetaSobrante(art) {
  const id = 'disc-sobrante-' + art.sku;
  const div = document.createElement('div');
  div.className = 'disc-tarjeta';
  div.id = id;
  div.innerHTML = `
    <div class="disc-tarjeta-top">
      <div class="disc-foto-producto">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="#c5cae9"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
      </div>
      <div class="disc-tarjeta-info">
        <span class="disc-codigo">${art.sku}</span>
        <span class="disc-nombre">${art.nombre}</span>
      </div>
      <div class="disc-cantidades">
        <div class="disc-cant-item"><span class="disc-cant-label">Solicitado</span><span class="disc-cant-val">${art.cantPedido}</span></div>
        <div class="disc-cant-item"><span class="disc-cant-label">Revisado</span><span class="disc-cant-val disc-val-alto">${art.cantRevisada}</span></div>
        <div class="disc-cant-item"><span class="disc-cant-label">Diferencia</span><span class="disc-cant-val disc-val-diff-pos">+${art.diferencia}</span></div>
      </div>
    </div>
    <div class="disc-accion-sobrante">
      <div class="sobrante-info">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#f57f17"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        <span>Verificaste más piezas de las requeridas. Solo confirma que estás enterado.</span>
      </div>
      <button class="btn-enterado" onclick="resolverSobrante('${id}')">Enterado</button>
    </div>`;
  return div;
}

/* ============================================================
   RESOLUCIÓN DE DISCREPANCIAS
   ============================================================ */
function seleccionarMotivo(btn, tarjetaId, tipo) {
  const tarjeta = document.getElementById(tarjetaId);
  if (!tarjeta || tarjeta.dataset.resuelta === '1') return;
  tarjeta.querySelectorAll('.btn-motivo').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  // Ocultar el campo de nota si estaba visible
  const notaWrap = document.getElementById('nota-wrap-' + tarjetaId);
  if (notaWrap) notaWrap.classList.add('hidden');
  setTimeout(() => {
    tarjeta.dataset.resuelta = '1';
    const accion = tarjeta.querySelector('.disc-accion-faltante');
    if (accion) accion.innerHTML = '<div class="disc-resuelto"><svg width="18" height="18" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg> Motivo registrado: <strong>' + btn.textContent + '</strong></div>';
    discResueltasCount++;
    actualizarDiscFooter();
    showToast('success', 'Motivo registrado', 'Faltante resuelto con motivo: ' + btn.textContent);
  }, 400);
}

function seleccionarMotivoOtro(btn, tarjetaId) {
  const tarjeta = document.getElementById(tarjetaId);
  if (!tarjeta || tarjeta.dataset.resuelta === '1') return;
  tarjeta.querySelectorAll('.btn-motivo').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const notaWrap = document.getElementById('nota-wrap-' + tarjetaId);
  if (notaWrap) notaWrap.classList.remove('hidden');
  setTimeout(() => {
    const nota = document.getElementById('nota-' + tarjetaId);
    if (nota) nota.focus();
  }, 100);
}

function confirmarNota(tarjetaId) {
  const tarjeta = document.getElementById(tarjetaId);
  if (!tarjeta || tarjeta.dataset.resuelta === '1') return;
  const nota = document.getElementById('nota-' + tarjetaId);
  const texto = nota ? nota.value.trim() : '';
  if (!texto) {
    showToast('warning', 'Nota requerida', 'Por favor escribe una nota antes de confirmar.');
    return;
  }
  tarjeta.dataset.resuelta = '1';
  const accion = tarjeta.querySelector('.disc-accion-faltante');
  if (accion) accion.innerHTML = '<div class="disc-resuelto"><svg width="18" height="18" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg> Motivo: <strong>Otro</strong> — ' + texto + '</div>';
  discResueltasCount++;
  actualizarDiscFooter();
  showToast('success', 'Nota registrada', 'Faltante resuelto con nota.');
}

function confirmarRetiro(input, tarjetaId, codigo) {
  const tarjeta = document.getElementById(tarjetaId);
  if (!tarjeta || tarjeta.dataset.resuelta === '1') return;
  const val = input.value.trim();
  if (val.length >= 7) {
    tarjeta.dataset.resuelta = '1';
    const accion = tarjeta.querySelector('.disc-accion-incorrecto');
    if (accion) accion.innerHTML = '<div class="disc-resuelto"><svg width="18" height="18" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg> Retiro confirmado. Código: <strong>' + val + '</strong></div>';
    discResueltasCount++;
    actualizarDiscFooter();
    showToast('success', 'Retiro confirmado', 'Producto ' + codigo + ' retirado correctamente.');
  }
}

function resolverSobrante(tarjetaId) {
  const tarjeta = document.getElementById(tarjetaId);
  if (!tarjeta || tarjeta.dataset.resuelta === '1') return;
  tarjeta.dataset.resuelta = '1';
  const accion = tarjeta.querySelector('.disc-accion-sobrante');
  if (accion) accion.innerHTML = '<div class="disc-resuelto"><svg width="18" height="18" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg> Sobrante registrado. Operador notificado.</div>';
  discResueltasCount++;
  actualizarDiscFooter();
  showToast('warning', 'Sobrante registrado', 'El sobrante fue confirmado y registrado.');
}

function actualizarDiscFooter() {
  const pendientes = totalDiscrepancias - discResueltasCount;
  const info    = document.getElementById('disc-footer-info');
  const btn     = document.getElementById('btn-finalizar');
  const counter = document.getElementById('disc-counter-header');
  if (pendientes <= 0) {
    if (info) { info.classList.add('todo-ok'); info.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#2e7d32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg> Todas las diferencias resueltas'; }
    if (btn) { btn.disabled = false; btn.classList.add('enabled'); }
    if (counter) { counter.textContent = 'Todo resuelto'; counter.classList.add('ok'); }
  } else {
    if (info) info.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#e65100"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> ' + pendientes + ' diferencia(s) por resolver';
    if (counter) counter.textContent = pendientes + ' pendientes';
  }
}

/* ============================================================
   FINALIZAR RECEPCIÓN (desde discrepancias, todo resuelto)
   ============================================================ */
function finalizarRevision() {
  if (discResueltasCount < totalDiscrepancias) {
    showToast('error', 'Diferencias pendientes', 'Resuelve todas las diferencias antes de finalizar.');
    return;
  }
  // Actualizar resumen
  let completado = 0, negado = 0, parcial = 0;
  PEDIDO.articulos.forEach(a => {
    if (a.estado === 'completo')     completado++;
    else if (a.estado === 'negado')  negado++;
    else if (a.estado === 'parcial') parcial++;
  });
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('res-completados', completado);
  setEl('res-negados',     negado);
  setEl('res-sobrantes',   productosAjenos.length + PEDIDO.articulos.filter(a => a.cantRevisada > a.cantPedido).length);
  goTo('screen-resumen');
}

/* ============================================================
   MODAL: ADVERTENCIA CIERRE DISCREPANCIAS
   ============================================================ */
function intentarCerrarDiscrepancias() {
  // Siempre regresa a revisión sin reiniciar — el reinicio solo ocurre al volver al menú principal
  goTo('screen-revision');
}
function cerrarModalCierreDisc() {
  document.getElementById('modal-cierre-disc').classList.add('hidden');
}
function confirmarCierreDisc() {
  document.getElementById('modal-cierre-disc').classList.add('hidden');
  goTo('screen-revision');
}

/* ============================================================
   MODAL: SIN DISCREPANCIAS
   ============================================================ */
function cerrarModalSinDisc() {
  document.getElementById('modal-sin-disc').classList.add('hidden');
}
function confirmarSinDisc() {
  document.getElementById('modal-sin-disc').classList.add('hidden');
  // Actualizar resumen
  let completado = 0, negado = 0;
  PEDIDO.articulos.forEach(a => {
    if (a.estado === 'completo') completado++;
    else if (a.estado === 'negado') negado++;
  });
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('res-completados', completado);
  setEl('res-negados',     negado);
  setEl('res-sobrantes',   0);
  goTo('screen-resumen');
}

/* ============================================================
   TOASTS
   ============================================================ */
function showToast(type, title, msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = {
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
    error:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
  };
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<div class="toast-icon">' + (icons[type] || icons.success) + '</div><div class="toast-body"><span class="toast-title">' + title + '</span><span class="toast-msg">' + msg + '</span></div><button class="toast-close" onclick="this.parentElement.remove()">×</button>';
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4000);
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  goTo('screen-menu');
  actualizarStats();

  // Mantener foco en el campo de escaneo cuando está en pantalla de revisión
  const scanInput = document.getElementById('scanner-revision');
  if (scanInput) {
    scanInput.addEventListener('blur', () => {
      const screenRevision = document.getElementById('screen-revision');
      if (!screenRevision || !screenRevision.classList.contains('active')) return;
      const modalesAbiertos =
        !document.getElementById('bs-cantidad').classList.contains('hidden') ||
        !document.getElementById('modal-cantidad').classList.contains('hidden') ||
        !document.getElementById('bs-opciones').classList.contains('hidden') ||
        !document.getElementById('modal-sin-disc').classList.contains('hidden');
      if (!modalesAbiertos) {
        setTimeout(() => scanInput.focus(), 80);
      }
    });
  }
});

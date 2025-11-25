document.addEventListener("DOMContentLoaded", () => {
  const dni = window.location.pathname.split("/").pop();
  const mainContent = document.getElementById("mainContent");
  const mensajes = document.getElementById("mensajes");
  const excepcionModal = document.getElementById("excepcionModal");

  let alumnoData = null;

  init();

  async function init() {
    await checkAuth();
    await loadAlumnoData();
    setupEventListeners();
  }

  async function checkAuth() {
    try {
      const response = await fetch("/api/cursos");
      if (!response.ok) window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  }

  async function loadAlumnoData() {
    try {
      const response = await fetch(`/api/alumno/${dni}`);
      if (!response.ok) throw new Error("Alumno no encontrado");
      alumnoData = await response.json();

      // Depuración: ver qué datos llegan desde el backend
      console.log("Datos de alumno recibidos:", alumnoData);

      renderAlumnoProfile();
    } catch (error) {
      console.error(error);
      mostrarMensaje(error.message, "error");
      mainContent.innerHTML = `
        <div class="alumno-container">
          <h3>Error</h3>
          <p>${error.message}</p>
          <div class="acciones-container">
            <button onclick="window.history.back()" class="accion-btn primary">Volver</button>
          </div>
        </div>
      `;
    }
  }

  function renderAlumnoProfile() {
    if (!alumnoData) return;

    const asistencias = alumnoData.asistencias || 0;
    const faltas = alumnoData.faltas || 0;
    const faltasJustificadas = alumnoData.faltas_justificadas || 0;

    mainContent.innerHTML = `
      <div class="alumno-container">
        <h3>Información del Alumno</h3>
        <div class="info-perfil">
          <div><strong>Nombre:</strong> ${alumnoData.nombres} ${
      alumnoData.apellidos
    }</div>
          <div><strong>DNI:</strong> ${alumnoData.dni}</div>
          <div><strong>Curso:</strong> ${alumnoData.curso} - División ${
      alumnoData.division
    }</div>
          <div><strong>Último Estado:</strong> ${
            alumnoData.ultimo_estado || "Presente"
          }</div>
        </div>

        <div class="estadisticas-container">
          <div class="estadistica-card success">
            <div class="estadistica-numero">${alumnoData.asistencias || 0}</div>
            <div class="estadistica-label">Asistencias</div>
          </div>
          <div class="estadistica-card danger">
            <div class="estadistica-numero">${faltas}</div>
            <div class="estadistica-label">Faltas</div>
          </div>
          <div class="estadistica-card warning">
            <div class="estadistica-numero">${faltasJustificadas}</div>
            <div class="estadistica-label">Faltas Just.</div>
          </div>
        </div>

        <div class="acciones-container">
          <button id="verHistorialBtn" class="accion-btn warning">Ver Historial de Excepciones</button>
          <button id="agregarExcepcionBtn" class="accion-btn primary">Agregar Excepción</button>
          <button id="exportarReporteBtn" class="accion-btn success">Exportar Reporte</button>
        </div>
      </div>

      <div id="historialExcepciones" class="alumno-container excepciones-container" style="display:none;">
        <h3>Historial de Excepciones</h3>
        <div class="excepciones-lista">
          ${renderExcepciones()}
        </div>
      </div>
    `;

    document.getElementById("verHistorialBtn").addEventListener("click", () => {
      const div = document.getElementById("historialExcepciones");
      div.style.display = div.style.display === "none" ? "block" : "none";
    });
  }

  function renderExcepciones() {
    if (!alumnoData.excepciones || alumnoData.excepciones.length === 0) {
      return '<div class="excepcion-item">No hay excepciones registradas</div>';
    }

    return alumnoData.excepciones
      .map((ex) => {
        const fecha = ex.fecha
          ? new Date(ex.fecha).toLocaleDateString("es-AR")
          : "Sin fecha";
        const hora = ex.hora ? ` - ${ex.hora}` : "";
        return `
          <div class="excepcion-item">
            <div>${fecha}${hora} - <strong>${ex.tipoExcepcion}</strong></div>
            <div>Cantidad: ${ex.cantFalta || 1}</div>
          </div>
        `;
      })
      .join("");
  }

  function setupEventListeners() {
    const agregarExcepcionBtn = document.getElementById("agregarExcepcionBtn");
    if (agregarExcepcionBtn) {
      agregarExcepcionBtn.addEventListener("click", () => {
        excepcionModal.style.display = "block";
        document.getElementById("fechaExcepcion").value = new Date()
          .toISOString()
          .split("T")[0];
      });
    }

    const closeModal = document.getElementById("closeModal");
    const cancelarModal = document.getElementById("cancelarModal");
    const excepcionForm = document.getElementById("excepcionForm");

    if (closeModal)
      closeModal.addEventListener(
        "click",
        () => (excepcionModal.style.display = "none")
      );
    if (cancelarModal)
      cancelarModal.addEventListener(
        "click",
        () => (excepcionModal.style.display = "none")
      );
    window.addEventListener("click", (e) => {
      if (e.target === excepcionModal) excepcionModal.style.display = "none";
    });

    if (excepcionForm)
      excepcionForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await guardarExcepcion();
      });

    const exportarReporteBtn = document.getElementById("exportarReporteBtn");
    if (exportarReporteBtn)
      exportarReporteBtn.addEventListener("click", exportarPDF);
  }

  async function guardarExcepcion() {
    try {
      const tipoExcepcion = document.getElementById("tipoExcepcion").value;
      const fecha = document.getElementById("fechaExcepcion").value;
      const hora = document.getElementById("horaExcepcion").value;
      const cantFalta = Number.parseFloat(
        document.getElementById("cantidadFalta").value
      );

      if (!tipoExcepcion || !fecha)
        return mostrarMensaje("Complete todos los campos", "error");

      mostrarMensaje("Guardando excepción...", "info");

      const response = await fetch("/api/excepcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumnoDNI: Number.parseInt(dni),
          tipoExcepcion,
          fecha,
          hora: hora || null,
          cantFalta,
        }),
      });

      if (!response.ok) throw new Error("Error al guardar excepción");

      mostrarMensaje("Excepción guardada correctamente", "success");
      excepcionModal.style.display = "none";
      excepcionForm.reset();
      await loadAlumnoData();
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al guardar la excepción", "error");
    }
  }

  async function exportarPDF() {
    try {
      mostrarMensaje("Generando reporte PDF...", "info");
      const response = await fetch(`/api/alumno/${dni}/pdf`);
      if (!response.ok) throw new Error("Error al generar PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `reporte-${alumnoData.apellidos}-${alumnoData.nombres}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      mostrarMensaje("Reporte PDF generado correctamente", "success");
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error al generar PDF", "error");
    }
  }

  function mostrarMensaje(texto, tipo) {
    const div = document.createElement("div");
    div.className = `mensaje ${tipo}`;
    div.textContent = texto;
    mensajes.innerHTML = "";
    mensajes.appendChild(div);
    setTimeout(() => div.remove(), 5000);
  }
});

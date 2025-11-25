document.addEventListener("DOMContentLoaded", () => {
  // Obtener ID del curso de la URL
  const cursoID = window.location.pathname.split("/").pop();
  const fechaClase = document.getElementById("fechaClase");
  const tablaAsistencias = document.getElementById("tablaAsistencias");
  const mensajes = document.getElementById("mensajes");

  let cursoData = null;
  let alumnosData = [];
  let asistenciasActuales = {};

  // Inicializar
  init();

  async function init() {
    // Verificar autenticación
    await checkAuth();

    // Establecer fecha actual
    fechaClase.value = new Date().toISOString().split("T")[0];
    document.getElementById("fechaActual").textContent =
      new Date().toLocaleDateString("es-AR");

    // Cargar datos del curso
    await loadCursoData();

    // Cargar alumnos
    await loadAlumnos();

    // Event listeners
    setupEventListeners();
  }

  async function checkAuth() {
    try {
      const response = await fetch("/api/cursos");
      if (!response.ok) {
        window.location.href = "/login.html";
        return;
      }
    } catch (error) {
      window.location.href = "/login.html";
    }
  }

  async function loadCursoData() {
    try {
      const response = await fetch("/api/cursos");
      if (!response.ok) throw new Error("Error al cargar cursos");

      const cursos = await response.json();
      cursoData = cursos.find((c) => c.cursoID == cursoID);

      if (!cursoData) {
        mostrarMensaje("Curso no encontrado", "error");
        return;
      }

      // Actualizar UI con datos del curso
      document.getElementById("cursoNombre").textContent = cursoData.curso;
      document.getElementById(
        "cursoDivision"
      ).textContent = `División: ${cursoData.division}`;
      document.getElementById(
        "tituloContenido"
      ).textContent = `${cursoData.curso} - División ${cursoData.division}`;
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error al cargar datos del curso", "error");
    }
  }

  async function loadAlumnos() {
    try {
      const response = await fetch(`/api/curso/${cursoID}/alumnos`);
      if (!response.ok) throw new Error("Error al cargar alumnos");

      alumnosData = await response.json();
      renderTablaAsistencias();
      actualizarEstadisticas();
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error al cargar alumnos", "error");
      tablaAsistencias.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">Error al cargar alumnos</td></tr>';
    }
  }

  function renderTablaAsistencias() {
    if (alumnosData.length === 0) {
      tablaAsistencias.innerHTML =
        '<tr><td colspan="6" style="text-align: center;">No hay alumnos registrados en este curso</td></tr>';
      return;
    }

    tablaAsistencias.innerHTML = "";

    alumnosData.forEach((alumno) => {
      const row = document.createElement("tr");
      const estadoActual = asistenciasActuales[alumno.dni] || "Presente";
      const porcentajeAsistencia = calcularPorcentajeAsistencia(alumno);

      row.innerHTML = `
                <td>
                    <div class="alumno-nombre">${alumno.apellidos}, ${
        alumno.nombres
      }</div>
                </td>
                <td>
                    <div class="alumno-dni">${alumno.dni}</div>
                </td>
                <td>
                    <select data-dni="${alumno.dni}" class="estado-select">
                        <option value="Presente" ${
                          estadoActual === "Presente" ? "selected" : ""
                        }>Presente</option>
                        <option value="Ausente" ${
                          estadoActual === "Ausente" ? "selected" : ""
                        }>Ausente</option>
                        <option value="Tarde" ${
                          estadoActual === "Tarde" ? "selected" : ""
                        }>Tarde</option>
                        <option value="Retirado" ${
                          estadoActual === "Retirado" ? "selected" : ""
                        }>Retirado</option>
                        <option value="Falta justificada" ${
                          estadoActual === "Falta justificada" ? "selected" : ""
                        }>Falta justificada</option>
                    </select>
                </td>
                <td>${alumno.asistencias || 0}</td>
                <td>${porcentajeAsistencia}%</td>
                <td>
                    <button onclick="verPerfilAlumno(${
                      alumno.dni
                    })" style="background: var(--color-primario); color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                        Ver Perfil
                    </button>
                </td>
            `;

      tablaAsistencias.appendChild(row);
    });

    // Agregar event listeners a los selects
    document.querySelectorAll(".estado-select").forEach((select) => {
      select.addEventListener("change", (e) => {
        const dni = e.target.dataset.dni;
        const estado = e.target.value;
        asistenciasActuales[dni] = estado;
        actualizarEstadisticas();
      });
    });
  }

  function calcularPorcentajeAsistencia(alumno) {
  // El backend ya envía alumno.porcentaje calculado con historial y total de clases (lun-vie)
  const pctBase = Number(alumno.porcentaje) || 0;

  // Reflejar la selección actual en pantalla sin inflar definitivamente:
  const sumaHoy = (asistenciasActuales[alumno.dni] === "Presente") ? 1 : 0;
  const totalClases = Number(alumno.total_clases) || 0;
  const presentes = Number(alumno.presentes_historial) || 0;

  const pctRuntime = totalClases > 0
    ? Math.round(((presentes + sumaHoy) / totalClases) * 100)
    : 0;

  // Mostrar el mayor “coherente” sin pasar 100, pero la persistencia real la define el backend
  return Math.min(100, Math.max(0, pctRuntime));
}


  function actualizarEstadisticas() {
    const total = alumnosData.length;
    let presentes = 0,
      ausentes = 0,
      tardes = 0;

    Object.values(asistenciasActuales).forEach((estado) => {
      switch (estado) {
        case "Presente":
          presentes++;
          break;
        case "Ausente":
        case "Falta justificada":
          ausentes++;
          break;
        case "Tarde":
          tardes++;
          break;
          case "Retirado":
            ausentes++;
            break;
      }
    });

    // Si no hay asistencias marcadas, asumir todos presentes
    if (Object.keys(asistenciasActuales).length === 0) {
      presentes = total;
    }

    document.getElementById("totalAlumnos").textContent = total;
    document.getElementById("totalPresentes").textContent = presentes;
    document.getElementById("totalAusentes").textContent = ausentes;
    document.getElementById("totalTardes").textContent = tardes;
  }

  function setupEventListeners() {
    // Botones de acciones rápidas
    document
      .getElementById("marcarTodosPresentes")
      .addEventListener("click", () => {
        document.querySelectorAll(".estado-select").forEach((select) => {
          select.value = "Presente";
          asistenciasActuales[select.dataset.dni] = "Presente";
        });
        actualizarEstadisticas();
      });

    document
      .getElementById("marcarTodosAusentes")
      .addEventListener("click", () => {
        document.querySelectorAll(".estado-select").forEach((select) => {
          select.value = "Ausente";
          asistenciasActuales[select.dataset.dni] = "Ausente";
        });
        actualizarEstadisticas();
      });

    document
      .getElementById("limpiarAsistencias")
      .addEventListener("click", () => {
        document.querySelectorAll(".estado-select").forEach((select) => {
          select.value = "Presente";
        });
        asistenciasActuales = {};
        actualizarEstadisticas();
      });

    // Guardar asistencias
    document
      .getElementById("guardarAsistenciasBtn")
      .addEventListener("click", guardarAsistencias);

    // Guardar información de clase
    document
      .getElementById("guardarClaseBtn")
      .addEventListener("click", guardarClase);

    // Cargar fecha específica
    document.getElementById("cargarFechaBtn").addEventListener("click", () => {
      // Aquí se podría cargar asistencias de una fecha específica
      mostrarMensaje("Funcionalidad de historial en desarrollo", "info");
    });

    // Otros botones
    document.getElementById("verAlumnosBtn").addEventListener("click", () => {
      window.location.href = `/alumnos/${cursoID}`;
    });

    document.getElementById("exportarPDFBtn").addEventListener("click", async () => {
  try {
    mostrarMensaje("Generando PDF...", "info");

    const estadoClase = document.getElementById("estadoClase").value;
    const turno = document.getElementById("turnoClase").value;
    const comentarios = document.getElementById("comentarios").value;
    const fecha = fechaClase.value;

    const params = new URLSearchParams({ fecha, turno, estadoClase, comentarios });
    const response = await fetch(`/api/curso/${cursoID}/pdf?${params}`);

    if (!response.ok) {
      let msg = "Error al generar PDF";
      try {
        const j = await response.json();
        if (j?.error) msg = j.error;
      } catch {}
      throw new Error(msg);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `asistencias-${cursoData.curso}-${cursoData.division}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    mostrarMensaje("PDF generado y descargado correctamente", "success");
  } catch (error) {
    console.error("Error:", error);
    mostrarMensaje(error.message || "Error al generar PDF", "error");
  }
});

    document.getElementById("verHistorialBtn").addEventListener("click", () => {
      mostrarMensaje("Funcionalidad de historial en desarrollo", "info");
    });

    document.getElementById("buscarAlumnoBtn").addEventListener("click", () => {
      const dni = prompt("Ingrese el DNI del alumno:");
      if (dni) {
        window.location.href = `/alumno/${dni}`;
      }
    });
  }
  async function countClasesForCurso(cursoID, hastaFecha /* YYYY-MM-DD */) {
  // 1) Intento con historial (fechas distintas, solo lun-vie)
  const [h1] = await pool.query(`
    SELECT COUNT(DISTINCT fecha) AS total
    FROM asistencia_historial
    WHERE cursoID = ?
      AND fecha <= ?
      AND DAYOFWEEK(fecha) BETWEEN 2 AND 6  -- 2=Lun ... 6=Vie
  `, [cursoID, hastaFecha]);

  let total = Number(h1[0]?.total || 0);

  // 2) Si nadie marcó nunca (0), caigo a clase (si existiera):
  if (total === 0) {
    const [h2] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM clase
      WHERE cursoID = ?
        AND fecha <= ?
        AND DAYOFWEEK(fecha) BETWEEN 2 AND 6
    `, [cursoID, hastaFecha]);
    total = Number(h2[0]?.total || 0);
  }
  return total;
}

  async function guardarAsistencias() {
    try {
      mostrarMensaje("Guardando asistencias...", "info");

      const promises = Object.entries(asistenciasActuales).map(
        ([dni, estado]) => {
          return fetch("/api/asistencia", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              alumnoDNI: Number.parseInt(dni),
              tipoAsistencia: estado,
              curso: cursoID,
            }),
          });
        }
      );

      await Promise.all(promises);
      mostrarMensaje("Asistencias guardadas correctamente", "success");

      // Recargar datos para actualizar contadores
      await loadAlumnos();
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error al guardar asistencias", "error");
    }
  }

  async function guardarClase() {
    try {
      const estadoClase = document.getElementById("estadoClase").value;
      const fecha = fechaClase.value;
      const comentarios = document.getElementById("comentarios").value;

      mostrarMensaje("Guardando información de clase...", "info");

      const response = await fetch("/api/clase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha,
          cursoID,
          claseInfo: estadoClase,
          comentarios,
        }),
      });

      if (response.ok) {
        mostrarMensaje("Información de clase guardada", "success");
      } else {
        throw new Error("Error al guardar clase");
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarMensaje("Error al guardar información de clase", "error");
    }
  }

  function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.createElement("div");
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.textContent = texto;

    mensajes.innerHTML = "";
    mensajes.appendChild(mensajeDiv);

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      mensajeDiv.remove();
    }, 5000);
  }

  // Función global para ver perfil de alumno
  window.verPerfilAlumno = (dni) => {
    window.location.href = `/alumno/${dni}`;
  };
});

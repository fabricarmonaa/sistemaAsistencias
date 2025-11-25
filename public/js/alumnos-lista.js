document.addEventListener("DOMContentLoaded", () => {
  // Obtener ID del curso de la URL
  const cursoID = window.location.pathname.split("/").pop();
  console.log("Curso ID detectado:", cursoID);
  const alumnosContainer = document.getElementById("alumnosContainer");
  const buscarAlumno = document.getElementById("buscarAlumno");
  const tituloLista = document.getElementById("tituloLista");

  let alumnosData = [];
  let cursoData = null;

  // Inicializar
  init();

  async function init() {
    // Verificar autenticación
    await checkAuth();

    // Cargar datos del curso
    await loadCursoData();

    // Cargar alumnos
    await loadAlumnos();

    // Setup event listeners
    setupEventListeners();
  }

  async function checkAuth() {
    try {
      const response = await fetch("/api/cursos");
      if (!response.ok) {
        window.location.href = "/";
        return;
      }
    } catch (error) {
      window.location.href = "/";
    }
  }

  async function loadCursoData() {
    try {
      const response = await fetch("/api/cursos");
      if (!response.ok) throw new Error("Error al cargar cursos");

      const cursos = await response.json();
      cursoData = cursos.find((c) => c.cursoID == cursoID);

      if (cursoData) {
        tituloLista.textContent = `Alumnos de ${cursoData.curso} - División ${cursoData.division}`;
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function loadAlumnos() {
    try {
      const response = await fetch(`/api/curso/${cursoID}/alumnos`);
      if (!response.ok) throw new Error("Error al cargar alumnos");

      alumnosData = await response.json();
      console.log(alumnosData);
      renderAlumnos(alumnosData);
    } catch (error) {
      console.error("Error:", error);
      alumnosContainer.innerHTML =
        '<div class="no-alumnos">Error al cargar los alumnos</div>';
    }
  }

  function renderAlumnos(alumnos) {
    if (alumnos.length === 0) {
      alumnosContainer.innerHTML =
        '<div class="no-alumnos">No se encontraron alumnos</div>';
      return;
    }

    alumnosContainer.innerHTML = "";

    alumnos.forEach((alumno) => {
      const porcentajeAsistencia = calcularPorcentajeAsistencia(alumno);

      const alumnoElement = document.createElement("div");
      alumnoElement.className = "informacion-alumno";

      alumnoElement.innerHTML = `
      <h2>${alumno.apellidos}, ${alumno.nombres}</h2>
      <p><strong>DNI:</strong> ${alumno.dni}</p>
      
     <div class="alumno-stats">
  <div class="stat-item">
      <div class="stat-number">${alumno.asistencias || 0}</div>
      <div class="stat-label">Asistencias</div>
  </div>
  <div class="stat-item">
      <div class="stat-number">${porcentajeAsistencia}%</div>
      <div class="stat-label">% Asistencia</div>
  </div>
  <div class="stat-item">
      <div class="stat-number">${alumno.faltas || 0}</div>
      <div class="stat-label">Faltas</div>
  </div>
  <div class="stat-item">
      <div class="stat-number">${alumno.faltas_justificadas || 0}</div>
      <div class="stat-label">Justificadas</div>
  </div>
</div>

      
      <button class="botonVerPerfil" onclick="verPerfil(${alumno.dni})">
          Ver Perfil Completo
      </button>
    `;

      alumnosContainer.appendChild(alumnoElement);
    });
  }

  function calcularPorcentajeAsistencia(alumno) {
    const totalClases = 50; // Estimado para el año
    const asistencias = alumno.asistencias || 0;
    return Math.round((asistencias / totalClases) * 100);
  }

  function setupEventListeners() {
    buscarAlumno.addEventListener("input", (e) => {
      const busqueda = e.target.value.toLowerCase();
      const alumnosFiltrados = alumnosData.filter(
        (alumno) =>
          alumno.nombres.toLowerCase().includes(busqueda) ||
          alumno.apellidos.toLowerCase().includes(busqueda) ||
          alumno.dni.toString().includes(busqueda)
      );
      renderAlumnos(alumnosFiltrados);
    });
  }

  // Función global para ver perfil
  window.verPerfil = (dni) => {
    window.location.href = `/alumno/${dni}`;
  };
});

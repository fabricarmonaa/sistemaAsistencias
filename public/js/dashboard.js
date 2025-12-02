document.addEventListener("DOMContentLoaded", () => {
  const cursosContainer = document.getElementById("cursosContainer");
  const usuarioNombre = document.getElementById("usuarioNombre");
  const logoutBtn = document.getElementById("logoutBtn");
  const buscarCurso = document.getElementById("buscarCurso");

  let cursosData = [];
  let filtroActual = "todos";

  checkAuth();

  // Cargar información del usuario
  loadUserInfo();

  // Cargar cursos
  loadCursos();

  // Event listeners
  logoutBtn.addEventListener("click", logout);
  buscarCurso.addEventListener("input", filtrarCursos);

  // Filtros
  document
    .getElementById("filtroTodos")
    .addEventListener("click", () => setFiltro("todos"));
  document
    .getElementById("filtroBasico")
    .addEventListener("click", () => setFiltro("basico"));
  document
    .getElementById("filtroSuperior")
    .addEventListener("click", () => setFiltro("superior"));

  async function checkAuth() {
    try {
      const preceptor = JSON.parse(localStorage.getItem("preceptor") || "{}");
      if (!preceptor.usuario) {
        console.log("[v0] No user data in localStorage, redirecting to login");
        window.location.href = "/login.html";
        return;
      }

      const response = await fetch("/api/auth/check");
      if (!response.ok) {
        console.log(
          "[v0] Auth check failed, clearing localStorage and redirecting"
        );
        localStorage.removeItem("preceptor");
        window.location.href = "/login.html";
        return;
      }

      console.log("[v0] Auth check successful");
    } catch (error) {
      console.error("[v0] Auth check error:", error);
      localStorage.removeItem("preceptor");
      window.location.href = "/login.html";
    }
  }

  function loadUserInfo() {
    const preceptor = JSON.parse(localStorage.getItem("preceptor") || "{}");
    if (preceptor.usuario) {
      usuarioNombre.textContent = `Bienvenido, ${preceptor.usuario}`;
    }
  }

  async function loadCursos() {
    try {
      console.log("[v0] Loading courses...");
      const response = await fetch("/api/cursos");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      cursosData = await response.json();
      console.log("[v0] Courses loaded:", cursosData.length);
      renderCursos(cursosData);
    } catch (error) {
      console.error("[v0] Error loading courses:", error);
      cursosContainer.innerHTML =
        '<div class="no-cursos">Error al cargar los cursos. Intente recargar la página.</div>';
    }
  }

  function renderCursos(cursos) {
    cursosContainer.innerHTML = "";

    if (cursos.length === 0) {
      cursosContainer.innerHTML =
        '<div class="no-cursos">No se encontraron cursos que coincidan con los filtros.</div>';
      return;
    }

    cursos.forEach((curso) => {
      const cursoElement = document.createElement("div");
      cursoElement.className = "informacion";

      // Determinar el ciclo del curso
      const numeroCurso = Number.parseInt(curso.curso);
      const ciclo = numeroCurso <= 3 ? "Básico" : "Superior";

        cursoElement.innerHTML = `
            <h2>${curso.curso}</h2>
            <div class="informacion-curso">
              <p><strong>División:</strong> ${curso.division}</p>
              <p><strong>Ciclo:</strong> ${ciclo}</p>
              <p><strong>Código:</strong> ${curso.cursoID}</p>
            </div>
            <i class="fa-solid fa-book-open curso-icon" aria-hidden="true"></i>
            <button onclick="verCurso(${curso.cursoID})"><i class="fa-solid fa-eye"></i> Ver Asistencias</button>
          `;

      cursosContainer.appendChild(cursoElement);
    });
  }

  function setFiltro(filtro) {
    // Remover clase activa de todos los botones
    document.querySelectorAll(".filtro button").forEach((btn) => {
      btn.classList.remove("filtro-activo");
    });

    // Agregar clase activa al botón seleccionado
    const btnId =
      filtro === "todos"
        ? "filtroTodos"
        : filtro === "basico"
        ? "filtroBasico"
        : "filtroSuperior";
    document.getElementById(btnId).classList.add("filtro-activo");

    filtroActual = filtro;
    filtrarCursos();
  }

  function filtrarCursos() {
    const busqueda = buscarCurso.value.toLowerCase();
    let cursosFiltrados = cursosData;

    // Filtrar por ciclo
    if (filtroActual === "basico") {
      cursosFiltrados = cursosFiltrados.filter((curso) => {
        const numeroCurso = Number.parseInt(curso.curso);
        return numeroCurso <= 3;
      });
    } else if (filtroActual === "superior") {
      cursosFiltrados = cursosFiltrados.filter((curso) => {
        const numeroCurso = Number.parseInt(curso.curso);
        return numeroCurso > 3;
      });
    }

    // Filtrar por búsqueda
    if (busqueda) {
      cursosFiltrados = cursosFiltrados.filter((curso) => {
        const cursoStr = String(curso.curso).toLowerCase();
        const divisionStr = String(curso.division).toLowerCase();
        const turnoStr = (curso.turno || "").toLowerCase();

        return (
          cursoStr.includes(busqueda) ||
          divisionStr.includes(busqueda) ||
          turnoStr.includes(busqueda)
        );
      });
    }

    renderCursos(cursosFiltrados);
  }

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
      localStorage.removeItem("preceptor");
      window.location.href = "/login.html";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Forzar logout local
      localStorage.removeItem("preceptor");
      window.location.href = "/login.html";
    }
  }

  // Función global para navegar a curso
  window.verCurso = (cursoID) => {
    window.location.href = `/curso/${cursoID}`;
  };
});

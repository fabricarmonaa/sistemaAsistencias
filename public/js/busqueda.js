document.addEventListener("DOMContentLoaded", () => {
  const busquedaTexto = document.getElementById("busquedaTexto")
  const filtroCurso = document.getElementById("filtroCurso")
  const filtroEstado = document.getElementById("filtroEstado")
  const minAsistencia = document.getElementById("minAsistencia")
  const fechaDesde = document.getElementById("fechaDesde")
  const fechaHasta = document.getElementById("fechaHasta")
  const buscarBtn = document.getElementById("buscarBtn")
  const limpiarBtn = document.getElementById("limpiarBtn")
  const exportarResultadosBtn = document.getElementById("exportarResultadosBtn")
  const resultsContainer = document.getElementById("resultsContainer")
  const resultsCount = document.getElementById("resultsCount")

  let currentResults = []

  // Inicializar
  init()

  async function init() {
    // Verificar autenticación
    await checkAuth()

    // Cargar cursos para el filtro
    await loadCursos()

    // Cargar estadísticas generales
    await loadEstadisticas()

    // Setup event listeners
    setupEventListeners()
  }

  async function checkAuth() {
    try {
      const response = await fetch("/api/cursos")
      if (!response.ok) {
        window.location.href = "/"
        return
      }
    } catch (error) {
      window.location.href = "/"
    }
  }

  async function loadCursos() {
    try {
      const response = await fetch("/api/cursos")
      if (!response.ok) throw new Error("Error al cargar cursos")

      const cursos = await response.json()

      filtroCurso.innerHTML = '<option value="">Todos los cursos</option>'
      cursos.forEach((curso) => {
        const option = document.createElement("option")
        option.value = curso.cursoID
        option.textContent = `${curso.curso} - División ${curso.division}`
        filtroCurso.appendChild(option)
      })
    } catch (error) {
      console.error("Error:", error)
    }
  }

  async function loadEstadisticas() {
    try {
      const response = await fetch("/api/estadisticas")
      if (!response.ok) throw new Error("Error al cargar estadísticas")

      const stats = await response.json()

      document.getElementById("totalAlumnos").textContent = stats.totalAlumnos
      document.getElementById("totalCursos").textContent = stats.totalCursos
      document.getElementById("promedioAsistencia").textContent = `${stats.promedioAsistencia}%`
      document.getElementById("bajaAsistencia").textContent = stats.alumnosBajaAsistencia
    } catch (error) {
      console.error("Error:", error)
    }
  }

  function setupEventListeners() {
    buscarBtn.addEventListener("click", realizarBusqueda)

    limpiarBtn.addEventListener("click", () => {
      busquedaTexto.value = ""
      filtroCurso.value = ""
      filtroEstado.value = ""
      minAsistencia.value = ""
      fechaDesde.value = ""
      fechaHasta.value = ""
      currentResults = []
      renderResults([])
    })

    exportarResultadosBtn.addEventListener("click", exportarResultados)

    // Búsqueda en tiempo real
    busquedaTexto.addEventListener("input", debounce(realizarBusqueda, 500))
  }

  async function realizarBusqueda() {
    try {
      resultsContainer.innerHTML = '<div class="loading">Buscando...</div>'

      const params = new URLSearchParams()

      if (busquedaTexto.value.trim()) params.append("q", busquedaTexto.value.trim())
      if (filtroCurso.value) params.append("curso", filtroCurso.value)
      if (filtroEstado.value) params.append("estado", filtroEstado.value)
      if (minAsistencia.value) params.append("minAsistencia", minAsistencia.value)

      const response = await fetch(`/api/search/alumnos?${params}`)
      if (!response.ok) throw new Error("Error en la búsqueda")

      const results = await response.json()
      currentResults = results
      renderResults(results)
    } catch (error) {
      console.error("Error:", error)
      resultsContainer.innerHTML = '<div class="no-results">Error en la búsqueda. Intente nuevamente.</div>'
    }
  }

  function renderResults(results) {
    resultsCount.textContent = `${results.length} resultado${results.length !== 1 ? "s" : ""}`

    if (results.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">No se encontraron resultados</div>'
      return
    }

    resultsContainer.innerHTML = ""

    results.forEach((alumno) => {
      const resultCard = document.createElement("div")
      resultCard.className = "result-card"

      resultCard.innerHTML = `
                <div class="result-header">
                    <div>
                        <div class="result-name">${alumno.apellidos}, ${alumno.nombres}</div>
                        <div class="result-dni">DNI: ${alumno.dni}</div>
                    </div>
                    <div class="result-course">${alumno.curso} - ${alumno.division}</div>
                </div>

                <div class="result-stats">
                    <div class="result-stat">
                        <div class="result-stat-number">${alumno.asistencias}</div>
                        <div class="result-stat-label">Asistencias</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-number">${alumno.porcentajeAsistencia}%</div>
                        <div class="result-stat-label">% Asistencia</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-number">${alumno.excepciones}</div>
                        <div class="result-stat-label">Excepciones</div>
                    </div>
                </div>

                <div class="result-actions">
                    <button class="result-btn primary" onclick="verPerfil(${alumno.dni})">Ver Perfil</button>
                    <button class="result-btn secondary" onclick="verCurso(${alumno.cursoID})">Ver Curso</button>
                </div>
            `

      resultsContainer.appendChild(resultCard)
    })
  }

  async function exportarResultados() {
    if (currentResults.length === 0) {
      alert("No hay resultados para exportar")
      return
    }

    try {
      // Crear CSV con los resultados
      const headers = ["Apellidos", "Nombres", "DNI", "Curso", "División", "Asistencias", "% Asistencia", "Excepciones"]
      const csvContent = [
        headers.join(","),
        ...currentResults.map((alumno) =>
          [
            `"${alumno.apellidos}"`,
            `"${alumno.nombres}"`,
            alumno.dni,
            `"${alumno.curso}"`,
            `"${alumno.division}"`,
            alumno.asistencias,
            alumno.porcentajeAsistencia,
            alumno.excepciones,
          ].join(","),
        ),
      ].join("\n")

      // Descargar CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `busqueda-alumnos-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error:", error)
      alert("Error al exportar resultados")
    }
  }

  // Utility functions
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // Global functions
  window.verPerfil = (dni) => {
    window.location.href = `/alumno/${dni}`
  }

  window.verCurso = (cursoID) => {
    window.location.href = `/curso/${cursoID}`
  }
})

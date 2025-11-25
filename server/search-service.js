const { db } = require("./database")

class SearchService {
  // Búsqueda global de alumnos
  async searchAlumnos(query, filters = {}) {
    try {
      let sql = `
                SELECT a.*, c.curso, c.division,
                       COALESCE(ast.cantidad, 0) as asistencias,
                       COALESCE(ast.tipoAsistencia, 'Presente') as ultimo_estado
                FROM alumno a
                JOIN curso c ON a.cursoID = c.cursoID
                LEFT JOIN asistencia ast ON a.dni = ast.alumnoDNI
                WHERE 1=1
            `

      const params = []

      // Búsqueda por texto
      if (query && query.trim()) {
        sql += ` AND (
                    a.nombres LIKE ? OR 
                    a.apellidos LIKE ? OR 
                    a.dni LIKE ? OR
                    CONCAT(a.nombres, ' ', a.apellidos) LIKE ?
                )`
        const searchTerm = `%${query.trim()}%`
        params.push(searchTerm, searchTerm, searchTerm, searchTerm)
      }

      // Filtro por curso
      if (filters.cursoID) {
        sql += ` AND a.cursoID = ?`
        params.push(filters.cursoID)
      }

      // Filtro por estado de asistencia
      if (filters.estado) {
        sql += ` AND ast.tipoAsistencia = ?`
        params.push(filters.estado)
      }

      // Filtro por porcentaje de asistencia
      if (filters.minAsistencia) {
        sql += ` AND (COALESCE(ast.cantidad, 0) / 50.0 * 100) >= ?`
        params.push(filters.minAsistencia)
      }

      sql += ` ORDER BY a.apellidos, a.nombres LIMIT 50`

      const results = await db.executeQuery(sql, params)

      // Enriquecer resultados con estadísticas
      const enrichedResults = await Promise.all(
        results.map(async (alumno) => {
          const excepciones = await db.getExcepcionesByAlumno(alumno.dni)
          const porcentajeAsistencia = Math.round((alumno.asistencias / 50) * 100)

          return {
            ...alumno,
            excepciones: excepciones.length,
            porcentajeAsistencia,
            faltasJustificadas: excepciones.filter((e) => e.tipoExcepcion === "Inasistencia").length,
            llegadasTarde: excepciones.filter((e) => e.tipoExcepcion === "Llegada tarde").length,
          }
        }),
      )

      return enrichedResults
    } catch (error) {
      console.error("Error en búsqueda de alumnos:", error)
      throw error
    }
  }

  // Búsqueda de cursos
  async searchCursos(query) {
    try {
      let sql = `
                SELECT c.*, 
                       COUNT(a.dni) as total_alumnos,
                       AVG(COALESCE(ast.cantidad, 0)) as promedio_asistencias
                FROM curso c
                LEFT JOIN alumno a ON c.cursoID = a.cursoID
                LEFT JOIN asistencia ast ON a.dni = ast.alumnoDNI
                WHERE 1=1
            `

      const params = []

      if (query && query.trim()) {
        sql += ` AND (c.curso LIKE ? OR c.division LIKE ?)`
        const searchTerm = `%${query.trim()}%`
        params.push(searchTerm, searchTerm)
      }

      sql += ` GROUP BY c.cursoID ORDER BY c.curso, c.division`

      const results = await db.executeQuery(sql, params)
      return results
    } catch (error) {
      console.error("Error en búsqueda de cursos:", error)
      throw error
    }
  }

  // Estadísticas generales
  async getEstadisticasGenerales() {
    try {
      const stats = {}

      // Total de alumnos
      const totalAlumnos = await db.executeQuery("SELECT COUNT(*) as total FROM alumno")
      stats.totalAlumnos = totalAlumnos[0].total

      // Total de cursos
      const totalCursos = await db.executeQuery("SELECT COUNT(*) as total FROM curso")
      stats.totalCursos = totalCursos[0].total

      // Promedio de asistencia general
      const promedioAsistencia = await db.executeQuery(`
                SELECT AVG(COALESCE(cantidad, 0)) as promedio 
                FROM asistencia
            `)
      stats.promedioAsistencia = Math.round(promedioAsistencia[0].promedio || 0)

      // Alumnos con baja asistencia (menos del 85%)
      const bajaAsistencia = await db.executeQuery(`
                SELECT COUNT(*) as total 
                FROM asistencia 
                WHERE (cantidad / 50.0 * 100) < 85
            `)
      stats.alumnosBajaAsistencia = bajaAsistencia[0].total

      // Excepciones del mes actual
      const excepcionesMes = await db.executeQuery(`
                SELECT COUNT(*) as total 
                FROM excepcion 
                WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) 
                AND YEAR(fecha) = YEAR(CURRENT_DATE())
            `)
      stats.excepcionesMes = excepcionesMes[0].total

      return stats
    } catch (error) {
      console.error("Error obteniendo estadísticas generales:", error)
      throw error
    }
  }

  // Búsqueda avanzada con múltiples criterios
  async advancedSearch(criteria) {
    try {
      let sql = `
                SELECT DISTINCT a.*, c.curso, c.division,
                       COALESCE(ast.cantidad, 0) as asistencias,
                       COALESCE(ast.tipoAsistencia, 'Presente') as ultimo_estado
                FROM alumno a
                JOIN curso c ON a.cursoID = c.cursoID
                LEFT JOIN asistencia ast ON a.dni = ast.alumnoDNI
                LEFT JOIN excepcion e ON a.dni = e.alumnoDNI
                WHERE 1=1
            `

      const params = []

      // Criterios de búsqueda
      if (criteria.nombre) {
        sql += ` AND (a.nombres LIKE ? OR a.apellidos LIKE ?)`
        const nombre = `%${criteria.nombre}%`
        params.push(nombre, nombre)
      }

      if (criteria.dni) {
        sql += ` AND a.dni LIKE ?`
        params.push(`%${criteria.dni}%`)
      }

      if (criteria.curso) {
        sql += ` AND c.cursoID = ?`
        params.push(criteria.curso)
      }

      if (criteria.estadoAsistencia) {
        sql += ` AND ast.tipoAsistencia = ?`
        params.push(criteria.estadoAsistencia)
      }

      if (criteria.fechaDesde) {
        sql += ` AND e.fecha >= ?`
        params.push(criteria.fechaDesde)
      }

      if (criteria.fechaHasta) {
        sql += ` AND e.fecha <= ?`
        params.push(criteria.fechaHasta)
      }

      if (criteria.tipoExcepcion) {
        sql += ` AND e.tipoExcepcion = ?`
        params.push(criteria.tipoExcepcion)
      }

      sql += ` ORDER BY a.apellidos, a.nombres LIMIT 100`

      const results = await db.executeQuery(sql, params)
      return results
    } catch (error) {
      console.error("Error en búsqueda avanzada:", error)
      throw error
    }
  }
}

module.exports = new SearchService()

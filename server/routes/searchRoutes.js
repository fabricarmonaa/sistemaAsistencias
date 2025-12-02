const express = require("express");
const searchService = require("../search-service");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/api/search/alumnos", requireAuth, async (req, res) => {
  try {
    const { q, curso, estado, minAsistencia } = req.query;

    const filters = {};
    if (curso) filters.cursoID = curso;
    if (estado) filters.estado = estado;
    if (minAsistencia) filters.minAsistencia = Number.parseInt(minAsistencia);

    const results = await searchService.searchAlumnos(q, filters);
    return res.json(results);
  } catch (error) {
    console.error("Error en búsqueda de alumnos:", error);
    return res.status(500).json({ error: "Error en la búsqueda" });
  }
});

router.get("/api/search/cursos", requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    const results = await searchService.searchCursos(q);
    return res.json(results);
  } catch (error) {
    console.error("Error en búsqueda de cursos:", error);
    return res.status(500).json({ error: "Error en la búsqueda" });
  }
});

router.post("/api/search/advanced", requireAuth, async (req, res) => {
  try {
    const results = await searchService.advancedSearch(req.body);
    return res.json(results);
  } catch (error) {
    console.error("Error en búsqueda avanzada:", error);
    return res.status(500).json({ error: "Error en la búsqueda avanzada" });
  }
});

router.get("/api/estadisticas", requireAuth, async (_req, res) => {
  try {
    const stats = await searchService.getEstadisticasGenerales();
    return res.json(stats);
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
});

module.exports = router;

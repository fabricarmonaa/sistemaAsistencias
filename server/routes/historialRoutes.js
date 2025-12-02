const express = require("express");
const { db } = require("../database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/alumno/:dni/historial - historial individual
router.get("/api/alumno/:dni/historial", requireAuth, async (req, res) => {
  try {
    const { dni } = req.params;
    const { desde, hasta } = req.query;
    const data = await db.getHistorialByAlumno(dni, { desde, hasta });
    return res.json(data);
  } catch (error) {
    console.error("Error obteniendo historial del alumno:", error);
    return res.status(500).json({ error: "Error obteniendo historial del alumno" });
  }
});

// GET /api/curso/:id/historial - historial por curso
router.get("/api/curso/:id/historial", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.query;
    const data = await db.getHistorialByCurso(Number(id), { desde, hasta });
    return res.json(data);
  } catch (error) {
    console.error("Error obteniendo historial del curso:", error);
    return res.status(500).json({ error: "Error obteniendo historial del curso" });
  }
});

module.exports = router;

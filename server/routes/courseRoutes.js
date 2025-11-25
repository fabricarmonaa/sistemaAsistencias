const express = require("express");
const { db } = require("../database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/cursos - listado general de cursos
router.get("/api/cursos", requireAuth, async (_req, res) => {
  try {
    const cursos = await db.getAllCursos();
    return res.json(cursos);
  } catch (error) {
    console.error("Error obteniendo cursos:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error.message });
  }
});

// GET /api/curso/:id/alumnos - alumnos de un curso
router.get("/api/curso/:id/alumnos", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const alumnos = await db.getAlumnosByCurso(id);
    return res.json(alumnos);
  } catch (error) {
    console.error("Error obteniendo alumnos:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/alumno/:dni - ficha de alumno + excepciones
router.get("/api/alumno/:dni", requireAuth, async (req, res) => {
  try {
    const { dni } = req.params;
    const alumno = await db.getAlumnoByDNI(dni);

    if (!alumno) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    const excepciones = await db.getExcepcionesByAlumno(dni);
    alumno.excepciones = excepciones;

    return res.json(alumno);
  } catch (error) {
    console.error("Error obteniendo alumno:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;

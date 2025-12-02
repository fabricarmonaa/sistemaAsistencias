const express = require("express");
const { db } = require("../database");
const { requireAuth, assertAuth } = require("../middleware/auth");

const router = express.Router();

// PUT /api/asistencia - marca asistencia por alumno
router.put("/api/asistencia", assertAuth, async (req, res) => {
  try {
    const { alumnoDNI, tipoAsistencia, curso, comentario = null } = req.body;
    if (!alumnoDNI || !tipoAsistencia || !curso) {
      return res.status(400).json({ error: "Datos incompletos" });
    }
    const preceptorID = req.session.preceptor?.id || null;

    await db.updateAsistencia(alumnoDNI, tipoAsistencia, Number(curso), preceptorID, comentario);
    return res.json({ success: true, message: "Asistencia actualizada" });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message || "Error interno del servidor" });
  }
});

// POST /api/clase - registra clase/turno
router.post("/api/clase", assertAuth, async (req, res) => {
  try {
    const { fecha, cursoID, claseInfo } = req.body;

    if (!fecha || !cursoID || !claseInfo) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    await db.createClase(fecha, cursoID, claseInfo);
    return res.json({ success: true, message: "Clase guardada correctamente" });
  } catch (error) {
    console.error("Error creando clase:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/clase/:fecha/:cursoID - consulta de clases cargadas para un curso y fecha
router.get("/api/clase/:fecha/:cursoID", requireAuth, async (req, res) => {
  try {
    const { fecha, cursoID } = req.params;
    const clases = await db.getClasesByFecha(fecha, cursoID);
    return res.json(clases);
  } catch (error) {
    console.error("Error obteniendo clases:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/excepcion - carga excepciones justificadas
router.post("/api/excepcion", requireAuth, async (req, res) => {
  try {
    const { alumnoDNI, tipoExcepcion, fecha, hora, cantFalta } = req.body;

    if (!alumnoDNI || !tipoExcepcion || !fecha) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    await db.addExcepcion(alumnoDNI, tipoExcepcion, fecha, hora, cantFalta);
    return res.json({ success: true, message: "Excepción agregada correctamente" });
  } catch (error) {
    console.error("Error agregando excepción:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;

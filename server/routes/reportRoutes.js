const express = require("express");
const { DateTime } = require("luxon");
const { db } = require("../database");
const { requireAuth } = require("../middleware/auth");

// Recibe instancia de PDFGenerator para compartir recursos y cierre limpio
function createReportRoutes(pdfGenerator) {
  const router = express.Router();

  // GET /api/curso/:id/pdf - reporte diario por curso
  router.get("/api/curso/:id/pdf", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { fecha, turno, estadoClase, comentarios } = req.query;

      if (!fecha) {
        return res.status(400).json({ error: "Falta el parámetro 'fecha' (YYYY-MM-DD)." });
      }

      const dt = DateTime.fromISO(fecha, { zone: "America/Argentina/Buenos_Aires" });
      if (!dt.isValid) {
        return res.status(400).json({ error: "Formato de fecha inválido. Use YYYY-MM-DD." });
      }

      const alumnos = await db.getAlumnosByCurso(Number(id));
      const histo = await db.getHistorialByCurso(Number(id), { desde: fecha, hasta: fecha });

      const estadoDelDia = new Map();
      for (const h of histo) estadoDelDia.set(String(h.alumnoDNI), h.estado);

      const cursoHeader = {
        curso: alumnos?.[0]?.curso || `Curso ${id}`,
        division: alumnos?.[0]?.division || "",
      };

      const alumnosPDF = alumnos.map((a) => ({
        apellidos: a.apellidos,
        nombres: a.nombres,
        dni: a.dni,
        estado: estadoDelDia.get(String(a.dni)) || "—",
        asistencias: a.asistencias ?? 0,
        porcentaje: a.porcentaje ?? 0,
      }));

      const stats = alumnosPDF.reduce(
        (acc, a) => {
          acc.total++;
          if (a.estado === "Presente") acc.presentes++;
          else if (a.estado === "Tarde") acc.tardes++;
          else if (a.estado === "Retirado" || a.estado === "Ausente" || a.estado === "Falta justificada" || a.estado === "—")
            acc.ausentes++;
          return acc;
        },
        { total: 0, presentes: 0, ausentes: 0, tardes: 0 }
      );

      const pdfData = {
        curso: cursoHeader,
        fecha,
        turno: turno || "",
        estadoClase: estadoClase || "Hubo clase",
        preceptor: req.session?.preceptor?.usuario || "—",
        comentarios: comentarios || "",
        alumnos: alumnosPDF,
        estadisticas: stats,
      };

      const buffer = await pdfGenerator.generateAsistenciasPDF(pdfData);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="curso_${id}_${fecha}.pdf"`);
      return res.send(buffer);
    } catch (error) {
      console.error("Error PDF curso:", error);
      return res.status(500).json({ error: "Error al generar PDF" });
    }
  });

  // GET /api/alumno/:dni/pdf - reporte individual
  router.get("/api/alumno/:dni/pdf", requireAuth, async (req, res) => {
    try {
      const { dni } = req.params;
      const alumno = await db.getAlumnoByDNI(dni);
      if (!alumno) {
        return res.status(404).json({ error: "Alumno no encontrado" });
      }

      const excepciones = await db.getExcepcionesByAlumno(dni);
      const estadisticas = {
        asistencias: alumno.presentes_historial || 0,
        porcentaje: alumno.porcentaje,
        faltasJustificadas: excepciones.filter((e) => e.tipoExcepcion === "Inasistencia").length,
        llegadasTarde: excepciones.filter((e) => e.tipoExcepcion === "Llegada tarde").length,
      };

      const pdfData = { alumno, excepciones, estadisticas };
      const pdf = await pdfGenerator.generateAlumnoReportePDF(pdfData);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="reporte-${alumno.apellidos}-${alumno.nombres}.pdf"`
      );
      return res.send(pdf);
    } catch (error) {
      console.error("Error generando PDF de alumno:", error);
      return res.status(500).json({ error: "Error generando PDF" });
    }
  });

  return router;
}

module.exports = createReportRoutes;

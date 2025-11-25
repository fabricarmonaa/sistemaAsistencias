const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { db, initializeSchema } = require("./database");
const PDFGenerator = require("./pdf-generator");
const searchService = require("./search-service");
const { DateTime } = require("luxon");

const app = express();
const PORT = process.env.PORT || 3000;
const pdfGenerator = new PDFGenerator();

// Garantizar tablas clave al iniciar
initializeSchema().catch((err) => {
  console.error("No se pudo inicializar el esquema:", err);
  process.exit(1);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Configurar sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET || "sistema_asistencias_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // cambiar a true en producción con HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// Middleware para verificar autenticación
function requireAuth(req, res, next) {
  if (req.session && req.session.preceptor) {
    return next();
  } else {
    return res.status(401).json({ error: "No autorizado" });
  }
}

// Middleware explícito para rutas que solo aceptan PRECEPTORES autenticados
function assertAuth(req, res, next) {
  if (!req.session || !req.session.preceptor) {
    return res.status(401).json({ error: "No autorizado", code: "AUTH_REQUIRED" });
  }
  return next();
}

// Rutas de autenticación
app.post("/api/login", async (req, res) => {
  try {
    console.log("POST /api/login body:", req.body);
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      console.log("Faltan campos usuario o contraseña");
      return res.status(400).json({ error: "Usuario y contraseña requeridos" });
    }

    const preceptor = await db.getPreceptorByUsuario(usuario);
    console.log("preceptor de BD:", preceptor);

    if (!preceptor) {
      console.log("Preceptor no encontrado");
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const isHashed = preceptor.contrasena.startsWith("$2b$");
    const passwordMatch = isHashed
      ? await bcrypt.compare(contrasena, preceptor.contrasena)
      : contrasena === preceptor.contrasena;
    console.log("passwordMatch:", passwordMatch);

    if (!passwordMatch) {
      console.log("Contraseña incorrecta");
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    if (!isHashed) {
      const newHash = await bcrypt.hash(contrasena, 10);
      await db.updatePreceptorPassword(preceptor.id, newHash);
    }

    req.session.preceptor = {
      id: preceptor.id,
      usuario: preceptor.usuario,
      email: preceptor.email,
    };
    console.log("Sesión seteada:", req.session.preceptor);

    res.json({
      success: true,
      message: "Login exitoso",
      preceptor: req.session.preceptor,
    });
  } catch (error) {
    console.error("Error en /api/login:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error.message });
  }
});

// Registro de nuevos preceptores
app.post("/api/register", async (req, res) => {
  try {
    const { usuario, email, telefono = null, contrasena } = req.body;
    if (!usuario || !email || !contrasena) {
      return res.status(400).json({ error: "Usuario, email y contraseña son requeridos" });
    }

    const existenteUsuario = await db.getPreceptorByUsuario(usuario);
    if (existenteUsuario) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const existenteEmail = await db.getPreceptorByEmail(email);
    if (existenteEmail) {
      return res.status(400).json({ error: "Ya hay un preceptor con ese email" });
    }

    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    const nuevo = await db.createPreceptor({ usuario, email, telefono, contrasenaHash });

    req.session.preceptor = {
      id: nuevo.id,
      usuario: nuevo.usuario,
      email: nuevo.email,
    };

    res.status(201).json({ success: true, preceptor: req.session.preceptor });
  } catch (error) {
    console.error("Error en /api/register:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Cambio de contraseña autenticado
app.post("/api/password/change", assertAuth, async (req, res) => {
  try {
    const { actual, nueva } = req.body;
    if (!actual || !nueva) {
      return res.status(400).json({ error: "Contraseñas requeridas" });
    }

    const preceptor = await db.getPreceptorById(req.session.preceptor.id);
    if (!preceptor) return res.status(404).json({ error: "Preceptor no encontrado" });

    const match = await bcrypt.compare(actual, preceptor.contrasena);
    if (!match) return res.status(401).json({ error: "Contraseña actual incorrecta" });

    const hash = await bcrypt.hash(nueva, 10);
    await db.updatePreceptorPassword(preceptor.id, hash);

    res.json({ success: true, message: "Contraseña actualizada" });
  } catch (error) {
    console.error("Error en /api/password/change:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Solicitud de reseteo de contraseña
app.post("/api/password/forgot", async (req, res) => {
  try {
    const { usuario, email } = req.body;
    if (!usuario && !email) {
      return res.status(400).json({ error: "Debe enviar usuario o email" });
    }

    const preceptor = usuario
      ? await db.getPreceptorByUsuario(usuario)
      : await db.getPreceptorByEmail(email);

    if (!preceptor) return res.status(404).json({ error: "Preceptor no encontrado" });

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = DateTime.now().plus({ hours: 1 }).toJSDate();

    await db.saveResetToken(preceptor.id, tokenHash, expiresAt);

    res.json({ success: true, message: "Token generado", token, expiresAt });
  } catch (error) {
    console.error("Error en /api/password/forgot:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Reseteo con token
app.post("/api/password/reset", async (req, res) => {
  try {
    const { token, nueva } = req.body;
    if (!token || !nueva) return res.status(400).json({ error: "Datos incompletos" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const stored = await db.findResetToken(tokenHash);
    if (!stored) return res.status(400).json({ error: "Token inválido o vencido" });

    const preceptor = await db.getPreceptorById(stored.preceptorID);
    if (!preceptor) return res.status(404).json({ error: "Preceptor no encontrado" });

    const hash = await bcrypt.hash(nueva, 10);
    await db.updatePreceptorPassword(preceptor.id, hash);
    await db.deleteResetToken(stored.id);

    res.json({ success: true, message: "Contraseña restablecida" });
  } catch (error) {
    console.error("Error en /api/password/reset:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Error al cerrar sesión" });
    }
    res.json({ success: true, message: "Sesión cerrada" });
  });
});

// Correct auth check endpoint
app.get("/api/auth/check", (req, res) => {
  if (req.session && req.session.preceptor) {
    res.json({ authenticated: true, preceptor: req.session.preceptor });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Rutas de la API
app.get("/api/cursos", requireAuth, async (req, res) => {
  try {
    console.log("[v0] Attempting to fetch courses...");
    const cursos = await db.getAllCursos();
    console.log("[v0] Courses fetched successfully:", cursos.length);
    res.json(cursos);
  } catch (error) {
    console.error("[v0] Error obteniendo cursos:", error);
    console.error("[v0] Error details:", error.message);
    console.error("[v0] Error stack:", error.stack);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error.message });
  }
});

app.get("/api/curso/:id/alumnos", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const alumnos = await db.getAlumnosByCurso(id);
    res.json(alumnos);
  } catch (error) {
    console.error("Error obteniendo alumnos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/api/alumno/:dni", requireAuth, async (req, res) => {
  try {
    const { dni } = req.params;
    const alumno = await db.getAlumnoByDNI(dni);

    if (!alumno) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    // Obtener excepciones del alumno
    const excepciones = await db.getExcepcionesByAlumno(dni);
    alumno.excepciones = excepciones;

    res.json(alumno);
  } catch (error) {
    console.error("Error obteniendo alumno:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.put("/api/asistencia", assertAuth, async (req, res) => {
  try {
    const { alumnoDNI, tipoAsistencia, curso, comentario = null } = req.body;
    if (!alumnoDNI || !tipoAsistencia || !curso) {
      return res.status(400).json({ error: "Datos incompletos" });
    }
    const preceptorID = req.session.preceptor?.id || null;

    await db.updateAsistencia(alumnoDNI, tipoAsistencia, Number(curso), preceptorID, comentario);
    res.json({ success: true, message: "Asistencia actualizada" });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message || "Error interno del servidor" });
  }
});


app.post("/api/clase", assertAuth, async (req, res) => {
  try {
    const { fecha, cursoID, claseInfo, comentarios } = req.body;

    if (!fecha || !cursoID || !claseInfo) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    await db.createClase(fecha, cursoID, claseInfo);
    res.json({ success: true, message: "Clase guardada correctamente" });
  } catch (error) {
    console.error("Error creando clase:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/api/clase/:fecha/:cursoID", requireAuth, async (req, res) => {
  try {
    const { fecha, cursoID } = req.params;
    const clases = await db.getClasesByFecha(fecha, cursoID);
    res.json(clases);
  } catch (error) {
    console.error("Error obteniendo clases:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/api/curso/:id/pdf", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, turno, estadoClase, comentarios } = req.query;

    if (!fecha) return res.status(400).json({ error: "Falta el parámetro 'fecha' (YYYY-MM-DD)." });

    const dt = DateTime.fromISO(fecha, { zone: "America/Argentina/Buenos_Aires" });
    if (!dt.isValid) return res.status(400).json({ error: "Formato de fecha inválido. Use YYYY-MM-DD." });

    // Traer alumnos (ya vienen con porcentaje calculado por el back)
    const alumnos = await db.getAlumnosByCurso(Number(id));

    // Traer historial SOLO de esa fecha; si no hay, seguimos y ponemos estados por defecto
    const histo = await db.getHistorialByCurso(Number(id), { desde: fecha, hasta: fecha });

    // Map de estado del día por DNI
    const estadoDelDia = new Map();
    for (const h of histo) estadoDelDia.set(String(h.alumnoDNI), h.estado);

    // Armar dataset que espera el template (curso como objeto)
    const cursoHeader = {
      curso: alumnos?.[0]?.curso || `Curso ${id}`,
      division: alumnos?.[0]?.division || "",
    };

    // Lista para el PDF (si no hay historial, estado “—” por defecto)
    const alumnosPDF = alumnos.map(a => ({
      apellidos: a.apellidos,
      nombres: a.nombres,
      dni: a.dni,
      estado: estadoDelDia.get(String(a.dni)) || "—",
      asistencias: a.asistencias ?? 0,
      porcentaje: a.porcentaje ?? 0,
    }));

    // Totales para cuadrito de estadísticas del template
    const stats = alumnosPDF.reduce((acc, a) => {
      acc.total++;
      if (a.estado === "Presente") acc.presentes++;
      else if (a.estado === "Tarde") acc.tardes++;
      else if (a.estado === "Retirado" || a.estado === "Ausente" || a.estado === "Falta justificada" || a.estado === "—") acc.ausentes++;
      return acc;
    }, { total: 0, presentes: 0, ausentes: 0, tardes: 0 });

    const pdfData = {
      curso: cursoHeader,           // <— el template usa curso.curso y curso.division
      fecha,
      turno: turno || "",
      estadoClase: estadoClase || "Hubo clase",
      preceptor: req.session?.preceptor?.usuario || "—",
      comentarios: comentarios || "",
      alumnos: alumnosPDF,
      estadisticas: stats
    };

    const buffer = await pdfGenerator.generateAsistenciasPDF(pdfData);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="curso_${id}_${fecha}.pdf"`);
    return res.send(buffer);

  } catch (e) {
    console.error("Error PDF curso:", e);
    return res.status(500).json({ error: "Error al generar PDF" });
  }
});



// Historial por alumno
app.get("/api/alumno/:dni/historial", requireAuth, async (req, res) => {
  try {
    const { dni } = req.params;
    const { desde, hasta } = req.query;
    const data = await db.getHistorialByAlumno(dni, { desde, hasta });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Error obteniendo historial del alumno" });
  }
});

// Historial por curso
app.get("/api/curso/:id/historial", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.query;
    const data = await db.getHistorialByCurso(Number(id), { desde, hasta });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Error obteniendo historial del curso" });
  }
});

app.get("/api/alumno/:dni/pdf", requireAuth, async (req, res) => {
  try {
    const { dni } = req.params;

    // Obtener datos del alumno
    const alumno = await db.getAlumnoByDNI(dni);
    if (!alumno) {
      return res.status(404).json({ error: "Alumno no encontrado" });
    }

    // Obtener excepciones
    const excepciones = await db.getExcepcionesByAlumno(dni);

    // Calcular estadísticas
    const estadisticas = {
  asistencias: alumno.presentes_historial || 0,
  porcentaje: alumno.porcentaje,
      faltasJustificadas: excepciones.filter(
        (e) => e.tipoExcepcion === "Inasistencia"
      ).length,
      llegadasTarde: excepciones.filter(
        (e) => e.tipoExcepcion === "Llegada tarde"
      ).length,
    };

    const pdfData = {
      alumno,
      excepciones,
      estadisticas,
    };

    const pdf = await pdfGenerator.generateAlumnoReportePDF(pdfData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte-${alumno.apellidos}-${alumno.nombres}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("Error generando PDF de alumno:", error);
    res.status(500).json({ error: "Error generando PDF" });
  }
});

app.get("/api/search/alumnos", requireAuth, async (req, res) => {
  try {
    const { q, curso, estado, minAsistencia } = req.query;

    const filters = {};
    if (curso) filters.cursoID = curso;
    if (estado) filters.estado = estado;
    if (minAsistencia) filters.minAsistencia = Number.parseInt(minAsistencia);

    const results = await searchService.searchAlumnos(q, filters);
    res.json(results);
  } catch (error) {
    console.error("Error en búsqueda de alumnos:", error);
    res.status(500).json({ error: "Error en la búsqueda" });
  }
});

app.get("/api/search/cursos", requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    const results = await searchService.searchCursos(q);
    res.json(results);
  } catch (error) {
    console.error("Error en búsqueda de cursos:", error);
    res.status(500).json({ error: "Error en la búsqueda" });
  }
});

app.post("/api/search/advanced", requireAuth, async (req, res) => {
  try {
    const results = await searchService.advancedSearch(req.body);
    res.json(results);
  } catch (error) {
    console.error("Error en búsqueda avanzada:", error);
    res.status(500).json({ error: "Error en la búsqueda avanzada" });
  }
});

app.get("/api/estadisticas", requireAuth, async (req, res) => {
  try {
    const stats = await searchService.getEstadisticasGenerales();
    res.json(stats);
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
});

// New API endpoints for student exceptions and student list
app.post("/api/excepcion", requireAuth, async (req, res) => {
  try {
    const { alumnoDNI, tipoExcepcion, fecha, hora, cantFalta } = req.body;

    if (!alumnoDNI || !tipoExcepcion || !fecha) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    await db.addExcepcion(alumnoDNI, tipoExcepcion, fecha, hora, cantFalta);
    res.json({ success: true, message: "Excepción agregada correctamente" });
  } catch (error) {
    console.error("Error agregando excepción:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// HTML route handlers
app.get("/", (req, res) => {
  if (req.session && req.session.preceptor) {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  } else {
    res.sendFile(path.join(__dirname, "../public/login.html"));
  }
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/register.html"));
});

app.get("/forgot", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/forgot.html"));
});

app.get("/reset", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/reset.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/curso/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/curso.html"));
});

app.get("/alumno/:dni", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/alumno.html"));
});

app.get("/alumnos/:cursoID", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/alumnos.html"));
});

app.get("/busqueda", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/busqueda.html"));
});

// Cleanup on exit
process.on("SIGINT", async () => {
  console.log("Cerrando aplicación...");
  await pdfGenerator.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Cerrando aplicación...");
  await pdfGenerator.close();
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

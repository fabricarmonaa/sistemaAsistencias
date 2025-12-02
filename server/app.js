const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const { initializeSchema } = require("./database");
const PDFGenerator = require("./pdf-generator");
const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const historialRoutes = require("./routes/historialRoutes");
const createReportRoutes = require("./routes/reportRoutes");
const searchRoutes = require("./routes/searchRoutes");
const htmlRoutes = require("./routes/htmlRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const pdfGenerator = new PDFGenerator();

// Garantizar tablas clave al iniciar
initializeSchema().catch((err) => {
  console.error("No se pudo inicializar el esquema:", err);
  process.exit(1);
});

// Middleware base
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Configurar sesiones (ajustar secure=true en producción HTTPS)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "sistema_asistencias_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// Agrupar rutas por dominio para mantener el código organizado
app.use(authRoutes);
app.use(courseRoutes);
app.use(attendanceRoutes);
app.use(historialRoutes);
app.use(createReportRoutes(pdfGenerator));
app.use(searchRoutes);
app.use(htmlRoutes);

// Manejador de errores inesperados
app.use((err, _req, res, _next) => {
  console.error("Error no controlado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
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

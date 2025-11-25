const express = require("express");
const path = require("path");

const router = express.Router();

// Rutas de frontend estático
router.get("/", (req, res) => {
  if (req.session && req.session.preceptor) {
    return res.sendFile(path.join(__dirname, "../../public/index.html"));
  }
  return res.sendFile(path.join(__dirname, "../../public/login.html"));
});

router.get("/login.html", (_req, res) => {
  return res.sendFile(path.join(__dirname, "../../public/login.html"));
});

router.get("/register", (_req, res) => {
  return res.sendFile(path.join(__dirname, "../../public/register.html"));
});

router.get("/forgot", (_req, res) => {
  return res.sendFile(path.join(__dirname, "../../public/forgot.html"));
});

router.get("/reset", (_req, res) => {
  return res.sendFile(path.join(__dirname, "../../public/reset.html"));
});

router.get("/dashboard", (_req, res) => {
  return res.sendFile(path.join(__dirname, "../../public/index.html"));
});

router.get("/curso/:id", (_req, res) => {
  return res.sendFile(path.join(__dirname, "../../public/curso.html"));
});

router.get("/alumno/:dni", (_req, res) => {
  return res.sendFile(path.join(__dirname, "../../public/alumno.html"));
});

router.get("/alumnos/:cursoID", (_req, res) => {
  return res.sendFile(path.join(__dirname, "../../public/alumnos.html"));
});

router.get("/busqueda", (_req, res) => {
  return res.sendFile(path.join(__dirname, "../../public/busqueda.html"));
});

module.exports = router;

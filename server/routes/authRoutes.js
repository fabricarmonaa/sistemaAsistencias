const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { DateTime } = require("luxon");
const { db } = require("../database");
const { assertAuth } = require("../middleware/auth");

const router = express.Router();

// Helper: normaliza la sesión del preceptor para respuestas consistentes
function buildSessionPayload(preceptor) {
  return {
    id: preceptor.id,
    usuario: preceptor.usuario,
    email: preceptor.email,
  };
}

// POST /api/login
router.post("/api/login", async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    if (!usuario || !contrasena) {
      return res.status(400).json({ error: "Usuario y contraseña requeridos" });
    }

    const preceptor = await db.getPreceptorByUsuario(usuario);
    if (!preceptor) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const isHashed = preceptor.contrasena.startsWith("$2b$");
    const passwordMatch = isHashed
      ? await bcrypt.compare(contrasena, preceptor.contrasena)
      : contrasena === preceptor.contrasena;

    if (!passwordMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Migración silenciosa de contraseñas planas a hash bcrypt
    if (!isHashed) {
      const newHash = await bcrypt.hash(contrasena, 10);
      await db.updatePreceptorPassword(preceptor.id, newHash);
    }

    req.session.preceptor = buildSessionPayload(preceptor);
    return res.json({
      success: true,
      message: "Login exitoso",
      preceptor: req.session.preceptor,
    });
  } catch (error) {
    console.error("Error en /api/login:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error.message });
  }
});

// POST /api/register
router.post("/api/register", async (req, res) => {
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

    req.session.preceptor = buildSessionPayload(nuevo);
    return res.status(201).json({ success: true, preceptor: req.session.preceptor });
  } catch (error) {
    console.error("Error en /api/register:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/password/change
router.post("/api/password/change", assertAuth, async (req, res) => {
  try {
    const { actual, nueva } = req.body;
    if (!actual || !nueva) {
      return res.status(400).json({ error: "Contraseñas requeridas" });
    }

    const preceptor = await db.getPreceptorById(req.session.preceptor.id);
    if (!preceptor) {
      return res.status(404).json({ error: "Preceptor no encontrado" });
    }

    const match = await bcrypt.compare(actual, preceptor.contrasena);
    if (!match) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    const hash = await bcrypt.hash(nueva, 10);
    await db.updatePreceptorPassword(preceptor.id, hash);

    return res.json({ success: true, message: "Contraseña actualizada" });
  } catch (error) {
    console.error("Error en /api/password/change:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/password/forgot
router.post("/api/password/forgot", async (req, res) => {
  try {
    const { usuario, email } = req.body;
    if (!usuario && !email) {
      return res.status(400).json({ error: "Debe enviar usuario o email" });
    }

    const preceptor = usuario
      ? await db.getPreceptorByUsuario(usuario)
      : await db.getPreceptorByEmail(email);

    if (!preceptor) {
      return res.status(404).json({ error: "Preceptor no encontrado" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = DateTime.now().plus({ hours: 1 }).toJSDate();

    await db.saveResetToken(preceptor.id, tokenHash, expiresAt);

    // Se retorna el token para flujo demo; en producción se enviaría por email.
    return res.json({ success: true, message: "Token generado", token, expiresAt });
  } catch (error) {
    console.error("Error en /api/password/forgot:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/password/reset
router.post("/api/password/reset", async (req, res) => {
  try {
    const { token, nueva } = req.body;
    if (!token || !nueva) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const stored = await db.findResetToken(tokenHash);
    if (!stored) {
      return res.status(400).json({ error: "Token inválido o vencido" });
    }

    const preceptor = await db.getPreceptorById(stored.preceptorID);
    if (!preceptor) {
      return res.status(404).json({ error: "Preceptor no encontrado" });
    }

    const hash = await bcrypt.hash(nueva, 10);
    await db.updatePreceptorPassword(preceptor.id, hash);
    await db.deleteResetToken(stored.id);

    return res.json({ success: true, message: "Contraseña restablecida" });
  } catch (error) {
    console.error("Error en /api/password/reset:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/logout
router.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Error al cerrar sesión" });
    }
    return res.json({ success: true, message: "Sesión cerrada" });
  });
});

// GET /api/auth/check
router.get("/api/auth/check", (req, res) => {
  if (req.session && req.session.preceptor) {
    return res.json({ authenticated: true, preceptor: req.session.preceptor });
  }
  return res.status(401).json({ authenticated: false });
});

module.exports = router;

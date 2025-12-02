// Middlewares de autenticación y autorización centralizados.
// requireAuth: valida que exista sesión activa y responde 401 si no.
// assertAuth: equivalente explícito para rutas sensibles que solo admiten preceptores logueados.
function requireAuth(req, res, next) {
  if (req.session && req.session.preceptor) {
    return next();
  }
  return res.status(401).json({ error: "No autorizado" });
}

function assertAuth(req, res, next) {
  if (!req.session || !req.session.preceptor) {
    return res.status(401).json({ error: "No autorizado", code: "AUTH_REQUIRED" });
  }
  return next();
}

module.exports = { requireAuth, assertAuth };

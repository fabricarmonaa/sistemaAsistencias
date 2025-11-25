const mysql = require("mysql2/promise");
const { DateTime } = require("luxon");

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sistema_asistencias",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// Ejecutar cualquier consulta
async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error("Error en consulta SQL:", error);
    throw error;
  }
}

function hoyAR() {
  return DateTime.now().setZone("America/Argentina/Buenos_Aires");
}

function esDiaCursada(dt) {
  const dow = dt.weekday; // 1..7 (1=Lun)
  return dow >= 1 && dow <= 5;
}

async function ensureClase(cursoID, fecha /* YYYY-MM-DD */) {
  await pool.query(
    `
    INSERT INTO clase (cursoID, fecha)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE cursoID = cursoID
  `,
    [cursoID, fecha]
  );
}

async function upsertHistorialAsistencia({ alumnoDNI, cursoID, estado, preceptorID, fechaDT, comentario = null }) {
  const fecha = fechaDT.toISODate(); // YYYY-MM-DD
  const hora = fechaDT.toFormat("HH:mm"); // HH:mm (24h)

  await pool.query(
    `
    INSERT INTO asistencia_historial (alumnoDNI, cursoID, fecha, hora, estado, preceptorID, comentario)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE estado = VALUES(estado), hora = VALUES(hora), preceptorID = VALUES(preceptorID), comentario = VALUES(comentario)
  `,
    [alumnoDNI, cursoID, fecha, hora, estado, preceptorID, comentario]
  );
}

async function countClasesForCurso(cursoID, desdeFecha, hastaFecha) {
  const [h1] = await pool.query(
    `
    SELECT COUNT(DISTINCT fecha) AS total
    FROM asistencia_historial
    WHERE cursoID = ?
      AND fecha BETWEEN ? AND ?
      AND DAYOFWEEK(fecha) BETWEEN 2 AND 6
  `,
    [cursoID, desdeFecha, hastaFecha]
  );

  let total = Number(h1[0]?.total || 0);

  if (total === 0) {
    const [h2] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM clase
      WHERE cursoID = ?
        AND fecha BETWEEN ? AND ?
        AND DAYOFWEEK(fecha) BETWEEN 2 AND 6
    `,
      [cursoID, desdeFecha, hastaFecha]
    );
    total = Number(h2[0]?.total || 0);
  }
  return total;
}

async function countPresentesHistorial(alumnoDNI, cursoID, desdeFecha, hastaFecha) {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS presentes
    FROM asistencia_historial
    WHERE alumnoDNI = ? AND cursoID = ?
      AND fecha BETWEEN ? AND ?
      AND estado IN ('Presente', 'Tarde')
  `,
    [alumnoDNI, cursoID, desdeFecha, hastaFecha]
  );
  return Number(rows[0]?.presentes || 0);
}

const CORTE_ENV = process.env.ATTENDANCE_START || null;
async function getFechaCorte(cursoID) {
  if (CORTE_ENV) return CORTE_ENV; // ej. 2024-12-19

  const [[h1]] = await pool.query(
    `SELECT MIN(fecha) AS f FROM asistencia_historial WHERE cursoID=?`,
    [cursoID]
  );
  const [[h2]] = await pool.query(
    `SELECT MIN(fecha) AS f FROM clase WHERE cursoID=?`,
    [cursoID]
  );
  const f1 = h1?.f,
    f2 = h2?.f;
  const fallback = DateTime.now()
    .setZone("America/Argentina/Buenos_Aires")
    .set({ month: 3, day: 1 })
    .toISODate();
  return f1 && f2 ? (f1 < f2 ? f1 : f2) : f1 || f2 || fallback;
}

// === PRECEPTORES ===
async function getPreceptorByUsuario(usuario) {
  const query = "SELECT id, usuario, email, contrasena, telefono FROM preceptores WHERE usuario = ?";
  const results = await executeQuery(query, [usuario]);
  return results[0] || null;
}

async function getPreceptorByEmail(email) {
  const query = "SELECT id, usuario, email, contrasena, telefono FROM preceptores WHERE email = ?";
  const results = await executeQuery(query, [email]);
  return results[0] || null;
}

async function getPreceptorById(id) {
  const query = "SELECT id, usuario, email, contrasena, telefono FROM preceptores WHERE id = ?";
  const results = await executeQuery(query, [id]);
  return results[0] || null;
}

async function createPreceptor({ usuario, email, telefono = null, contrasenaHash }) {
  await executeQuery("INSERT INTO preceptores (usuario, contrasena, email, telefono) VALUES (?, ?, ?, ?)", [
    usuario,
    contrasenaHash,
    email,
    telefono,
  ]);
  return getPreceptorByUsuario(usuario);
}

async function updatePreceptorPassword(preceptorId, contrasenaHash) {
  await executeQuery("UPDATE preceptores SET contrasena = ? WHERE id = ?", [
    contrasenaHash,
    preceptorId,
  ]);
}

// === PASSWORD RESET TOKENS ===
async function ensurePasswordResetTable() {
  await pool.query(
    `
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      preceptorID INT NOT NULL,
      tokenHash VARCHAR(128) NOT NULL,
      expiresAt DATETIME NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_token_hash (tokenHash),
      INDEX idx_expiresAt (expiresAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `
  );
}

async function ensureHistorialTable() {
  await pool.query(
    `
    CREATE TABLE IF NOT EXISTS asistencia_historial (
      id INT AUTO_INCREMENT PRIMARY KEY,
      alumnoDNI INT NOT NULL,
      cursoID INT NOT NULL,
      fecha DATE NOT NULL,
      hora VARCHAR(5) NOT NULL,
      estado VARCHAR(30) NOT NULL,
      preceptorID INT NULL,
      comentario TEXT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_entry (alumnoDNI, cursoID, fecha),
      INDEX idx_curso_fecha (cursoID, fecha)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `
  );
}

async function saveResetToken(preceptorID, tokenHash, expiresAt) {
  await executeQuery("DELETE FROM password_reset_tokens WHERE preceptorID = ?", [preceptorID]);
  await executeQuery(
    "INSERT INTO password_reset_tokens (preceptorID, tokenHash, expiresAt) VALUES (?, ?, ?)",
    [preceptorID, tokenHash, expiresAt]
  );
}

async function findResetToken(tokenHash) {
  const now = hoyAR().toJSDate();
  const results = await executeQuery(
    "SELECT * FROM password_reset_tokens WHERE tokenHash = ? AND expiresAt > ? LIMIT 1",
    [tokenHash, now]
  );
  return results[0] || null;
}

async function deleteResetToken(id) {
  await executeQuery("DELETE FROM password_reset_tokens WHERE id = ?", [id]);
}

async function initializeSchema() {
  await ensureHistorialTable();
  await ensurePasswordResetTable();
}

// === CURSOS ===
async function getAllCursos() {
  const query = "SELECT * FROM curso ORDER BY curso, division";
  return await executeQuery(query);
}

async function getCursoById(cursoID) {
  const query = "SELECT * FROM curso WHERE cursoID = ?";
  const results = await executeQuery(query, [cursoID]);
  return results[0];
}

// === ALUMNOS ===
async function getAlumnosByCurso(cursoID) {
  const alumnos = await executeQuery(
    `
    SELECT
      a.*,
      c.curso,
      c.division,
      COALESCE(ast.asistencias, 0)          AS asistencias,
      COALESCE(ast.faltas, 0)               AS faltas,
      COALESCE(ast.faltas_justificadas, 0)  AS faltas_justificadas
    FROM alumno a
    JOIN curso c
      ON a.cursoID = c.cursoID
    LEFT JOIN asistencia ast
      ON a.dni = ast.alumnoDNI AND ast.curso = a.cursoID
    WHERE a.cursoID = ?
    ORDER BY a.apellidos, a.nombres
  `,
    [cursoID]
  );

  const hoy = hoyAR().toISODate();
  const desde = await getFechaCorte(cursoID);
  const totalClases = await countClasesForCurso(cursoID, desde, hoy);

  for (const a of alumnos) {
    const presentesHist = await countPresentesHistorial(a.dni, cursoID, desde, hoy);
    a.presentes_historial = presentesHist;
    a.total_clases = totalClases;
    const pct = totalClases > 0 ? Math.round((presentesHist / totalClases) * 100) : 0;
    a.porcentaje = Math.min(100, Math.max(0, pct));
  }

  return alumnos;
}

async function getAlumnoByDNI(dni) {
  const rows = await executeQuery(
    `
    SELECT
      a.*,
      c.curso,
      c.division,
      COALESCE(ast.asistencias, 0)          AS asistencias,
      COALESCE(ast.faltas, 0)               AS faltas,
      COALESCE(ast.faltas_justificadas, 0)  AS faltas_justificadas
    FROM alumno a
    JOIN curso c
      ON a.cursoID = c.cursoID
    LEFT JOIN asistencia ast
      ON a.dni = ast.alumnoDNI AND ast.curso = a.cursoID
    WHERE a.dni = ?
  `,
    [dni]
  );
  if (!rows.length) return null;
  const a = rows[0];

  const hoy = hoyAR().toISODate();
  const desde = await getFechaCorte(a.cursoID);
  const totalClases = await countClasesForCurso(a.cursoID, desde, hoy);
  const presentesHist = await countPresentesHistorial(a.dni, a.cursoID, desde, hoy);

  return {
    ...a,
    asistencias: Number(a.asistencias) || 0,
    faltas: Number(a.faltas) || 0,
    faltas_justificadas: Number(a.faltas_justificadas) || 0,
    total_clases: totalClases,
    presentes_historial: presentesHist,
    porcentaje: Math.min(100, totalClases > 0 ? Math.round((presentesHist / totalClases) * 100) : 0),
  };
}

// === ASISTENCIAS ===
async function updateAsistencia(alumnoDNI, tipoAsistencia, cursoID, preceptorID, comentario = null) {
  const ahora = hoyAR();
  if (!esDiaCursada(ahora)) {
    const err = new Error("Fuera del calendario escolar (solo lunes a viernes)");
    err.statusCode = 400;
    throw err;
  }

  const estadoHist = tipoAsistencia === "Retirado" ? "Retiro" : tipoAsistencia;

  await pool.query(
    `
    INSERT INTO asistencia (alumnoDNI, curso, asistencias, faltas, faltas_justificadas)
    VALUES (?, ?, 0, 0, 0)
    ON DUPLICATE KEY UPDATE alumnoDNI = alumnoDNI
  `,
    [alumnoDNI, cursoID]
  );

  await ensureClase(cursoID, ahora.toISODate());

  const [prevRows] = await pool.query(
    `
    SELECT estado FROM asistencia_historial
    WHERE alumnoDNI = ? AND cursoID = ? AND fecha = ?
    LIMIT 1
  `,
    [alumnoDNI, cursoID, ahora.toISODate()]
  );
  const estadoPrevio = prevRows[0]?.estado || null;

  await upsertHistorialAsistencia({
    alumnoDNI,
    cursoID,
    estado: estadoHist,
    preceptorID,
    fechaDT: ahora,
    comentario,
  });

  const delta = (est) => ({
    asistencias: est === "Presente" || est === "Tarde" || est === "Retiro" ? 1 : 0,
    faltas: est === "Ausente" ? 1 : 0,
    faltas_justificadas: est === "Falta justificada" ? 1 : 0,
  });

  if (!estadoPrevio) {
    const d = delta(tipoAsistencia);
    await pool.query(
      `
      UPDATE asistencia
      SET asistencias = asistencias + ?, faltas = faltas + ?, faltas_justificadas = faltas_justificadas + ?
      WHERE alumnoDNI = ? AND curso = ?
    `,
      [d.asistencias, d.faltas, d.faltas_justificadas, alumnoDNI, cursoID]
    );
  } else if (estadoPrevio !== estadoHist) {
    const dOld = delta(estadoPrevio);
    const dNew = delta(tipoAsistencia);
    await pool.query(
      `
      UPDATE asistencia
      SET asistencias = GREATEST(0, asistencias + ? - ?),
          faltas = GREATEST(0, faltas + ? - ?),
          faltas_justificadas = GREATEST(0, faltas_justificadas + ? - ?)
      WHERE alumnoDNI = ? AND curso = ?
    `,
      [
        dNew.asistencias,
        dOld.asistencias,
        dNew.faltas,
        dOld.faltas,
        dNew.faltas_justificadas,
        dOld.faltas_justificadas,
        alumnoDNI,
        cursoID,
      ]
    );
  }
}

// === CLASES ===
async function createClase(fecha, cursoID, claseInfo) {
  const query = "INSERT INTO clase (fecha, cursoID, claseInfo) VALUES (?, ?, ?)";
  return await executeQuery(query, [fecha, cursoID, claseInfo]);
}

async function getClasesByFecha(fecha, cursoID = null) {
  let query =
    "SELECT c.*, cur.curso, cur.division FROM clase c JOIN curso cur ON c.cursoID = cur.cursoID WHERE c.fecha = ?";
  const params = [fecha];

  if (cursoID) {
    query += " AND c.cursoID = ?";
    params.push(cursoID);
  }

  return await executeQuery(query, params);
}

// === EXCEPCIONES ===
async function addExcepcion(alumnoDNI, tipoExcepcion, fecha, hora = null, cantFalta = 1.0) {
  const query =
    "INSERT INTO excepcion (alumnoDNI, tipoExcepcion, fecha, hora, cantFalta) VALUES (?, ?, ?, ?, ?)";
  return await executeQuery(query, [alumnoDNI, tipoExcepcion, fecha, hora, cantFalta]);
}

async function getExcepcionesByAlumno(alumnoDNI) {
  const query = "SELECT * FROM excepcion WHERE alumnoDNI = ? ORDER BY fecha DESC";
  return await executeQuery(query, [alumnoDNI]);
}

// === HISTORIAL ===
async function getHistorialByAlumno(dni, { desde = null, hasta = null } = {}) {
  let sql = `
    SELECT h.*, c.curso, c.division, p.usuario AS preceptorUsuario
    FROM asistencia_historial h
    JOIN curso c ON c.cursoID = h.cursoID
    LEFT JOIN preceptores p ON p.id = h.preceptorID
    WHERE h.alumnoDNI = ?
  `;
  const params = [dni];
  if (desde) {
    sql += ` AND h.fecha >= ?`;
    params.push(desde);
  }
  if (hasta) {
    sql += ` AND h.fecha <= ?`;
    params.push(hasta);
  }
  sql += ` ORDER BY h.fecha DESC, h.hora DESC`;
  return await executeQuery(sql, params);
}

async function getHistorialByCurso(cursoID, { desde = null, hasta = null } = {}) {
  let sql = `
    SELECT h.*, a.apellidos, a.nombres, p.usuario AS preceptorUsuario
    FROM asistencia_historial h
    JOIN alumno a ON a.dni = h.alumnoDNI
    LEFT JOIN preceptores p ON p.id = h.preceptorID
    WHERE h.cursoID = ?
  `;
  const params = [cursoID];
  if (desde) {
    sql += ` AND h.fecha >= ?`;
    params.push(desde);
  }
  if (hasta) {
    sql += ` AND h.fecha <= ?`;
    params.push(hasta);
  }
  sql += ` ORDER BY h.fecha DESC, h.hora DESC, a.apellidos, a.nombres`;
  return await executeQuery(sql, params);
}

module.exports = {
  pool,
  executeQuery,
  initializeSchema,
  db: {
    // auth / preceptor
    getPreceptorByUsuario,
    getPreceptorByEmail,
    getPreceptorById,
    createPreceptor,
    updatePreceptorPassword,
    saveResetToken,
    findResetToken,
    deleteResetToken,

    // cursos
    getAllCursos,
    getCursoById,

    // alumnos
    getAlumnosByCurso,
    getAlumnoByDNI,

    // asistencias
    updateAsistencia,

    // clases / excepciones
    createClase,
    getClasesByFecha,
    addExcepcion,
    getExcepcionesByAlumno,

    // historial
    getHistorialByAlumno,
    getHistorialByCurso,

    // util
    countClasesForCurso,
  },
};

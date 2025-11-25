const mysql = require("mysql2/promise");
const { DateTime } = require("luxon"); // <--- FALTABA

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

// BASE DE DATOS FUNCIONES
const db = {
  // ✅ NUEVA FUNCIÓN CORRECTA
  async getPreceptorByUsuario(usuario) {
    const query =
      "SELECT id, usuario, email, contrasena FROM preceptores WHERE usuario = ?";
    const results = await executeQuery(query, [usuario]);
    return results[0] || null;
  },
  // Cursos
  async getAllCursos() {
    try {
      console.log("[v0] Getting all courses...");
      const query = "SELECT * FROM curso ORDER BY curso, division";
      const results = await executeQuery(query);
      console.log("[v0] Found courses:", results);
      return results;
    } catch (error) {
      console.error("[v0] Error in getAllCursos:", error);
      throw error;
    }
  },

  async getCursoById(cursoID) {
    const query = "SELECT * FROM curso WHERE cursoID = ?";
    const results = await executeQuery(query, [cursoID]);
    return results[0];
  },

  // Alumnos
  async  getAlumnosByCurso(cursoID) {
  const alumnos = await executeQuery(`
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
`, [cursoID]);


  const hoy = DateTime.now().setZone("America/Argentina/Buenos_Aires").toISODate();
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
},

async  getAlumnoByDNI(dni) {
  const rows = await executeQuery( ` SELECT 
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
`, [dni]);
  if (!rows.length) return null;
  const a = rows[0];

  const hoy = DateTime.now().setZone("America/Argentina/Buenos_Aires").toISODate();
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
},


  
  // Asistencias
  async updateAsistencia(alumnoDNI, tipoAsistencia, curso) {
    // Asegurar existencia del registro
    await pool.query(
      `
    INSERT INTO asistencia (alumnoDNI, curso, asistencias, faltas, faltas_justificadas)
    VALUES (?, ?, 0, 0, 0)
    ON DUPLICATE KEY UPDATE alumnoDNI = alumnoDNI
  `,
      [alumnoDNI, curso]
    );

    let query = "";
    if (
      tipoAsistencia === "Presente" ||
      tipoAsistencia === "Tarde" ||
      tipoAsistencia === "Retirado"
    ) {
      query = `UPDATE asistencia SET asistencias = asistencias + 1 WHERE alumnoDNI = ? AND curso = ?`;
    } else if (tipoAsistencia === "Ausente") {
      query = `UPDATE asistencia SET faltas = faltas + 1 WHERE alumnoDNI = ? AND curso = ?`;
    } else if (tipoAsistencia === "Falta justificada") {
      query = `UPDATE asistencia SET faltas_justificadas = faltas_justificadas + 1 WHERE alumnoDNI = ? AND curso = ?`;
    } else {
      throw new Error("Tipo de asistencia inválido");
    }

    await pool.query(query, [alumnoDNI, curso]);
  },

  // Clases
  async createClase(fecha, cursoID, claseInfo) {
    const query =
      "INSERT INTO clase (fecha, cursoID, claseInfo) VALUES (?, ?, ?)";
    return await executeQuery(query, [fecha, cursoID, claseInfo]);
  },

  async getClasesByFecha(fecha, cursoID = null) {
    let query =
      "SELECT c.*, cur.curso, cur.division FROM clase c JOIN curso cur ON c.cursoID = cur.cursoID WHERE c.fecha = ?";
    const params = [fecha];

    if (cursoID) {
      query += " AND c.cursoID = ?";
      params.push(cursoID);
    }

    return await executeQuery(query, params);
  },

  // Excepciones
  async addExcepcion(
    alumnoDNI,
    tipoExcepcion,
    fecha,
    hora = null,
    cantFalta = 1.0
  ) {
    const query =
      "INSERT INTO excepcion (alumnoDNI, tipoExcepcion, fecha, hora, cantFalta) VALUES (?, ?, ?, ?, ?)";
    return await executeQuery(query, [
      alumnoDNI,
      tipoExcepcion,
      fecha,
      hora,
      cantFalta,
    ]);
  },

  async getExcepcionesByAlumno(alumnoDNI) {
    const query =
      "SELECT * FROM excepcion WHERE alumnoDNI = ? ORDER BY fecha DESC";
    return await executeQuery(query, [alumnoDNI]);
  },
};

// === AGREGAR helpers arriba del archivo ===


function hoyAR() {
  return DateTime.now().setZone("America/Argentina/Buenos_Aires");
}
function esDiaCursada(dt) {
  const dow = dt.weekday; // 1..7 (1=Lun)
  return dow >= 1 && dow <= 5;
}



// === NUEVO: upsert de historial ===
async function upsertHistorialAsistencia({ alumnoDNI, cursoID, estado, preceptorID, fechaDT }) {
  const fecha = fechaDT.toISODate();         // YYYY-MM-DD
  const hora  = fechaDT.toFormat("HH:mm");   // HH:mm (24h)

  // Insertar si no existe; si existe, actualizar estado/hora/preceptor
  await pool.query(`
    INSERT INTO asistencia_historial (alumnoDNI, cursoID, fecha, hora, estado, preceptorID)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE estado = VALUES(estado), hora = VALUES(hora), preceptorID = VALUES(preceptorID)
  `, [alumnoDNI, cursoID, fecha, hora, estado, preceptorID]);
}

// === NUEVO: contar clases (solo lun-vie) hasta una fecha (incluida) ===
async function countClasesForCurso(cursoID, desdeFecha, hastaFecha) {
  // 1) Distinct fechas desde historial (lun-vie)
  const [h1] = await pool.query(`
    SELECT COUNT(DISTINCT fecha) AS total
    FROM asistencia_historial
    WHERE cursoID = ?
      AND fecha BETWEEN ? AND ?
      AND DAYOFWEEK(fecha) BETWEEN 2 AND 6
  `, [cursoID, desdeFecha, hastaFecha]);

  let total = Number(h1[0]?.total || 0);

  if (total === 0) {
    const [h2] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM clase
      WHERE cursoID = ?
        AND fecha BETWEEN ? AND ?
        AND DAYOFWEEK(fecha) BETWEEN 2 AND 6
    `, [cursoID, desdeFecha, hastaFecha]);
    total = Number(h2[0]?.total || 0);
  }
  return total;
}

async function countPresentesHistorial(alumnoDNI, cursoID, desdeFecha, hastaFecha) {
  const [rows] = await pool.query(`
    SELECT COUNT(*) AS presentes
    FROM asistencia_historial
    WHERE alumnoDNI = ? AND cursoID = ?
      AND fecha BETWEEN ? AND ?
      AND estado IN ('Presente') -- agregá 'Tarde','Retiro' si querés que sumen
  `, [alumnoDNI, cursoID, desdeFecha, hastaFecha]);
  return Number(rows[0]?.presentes || 0);
}



// === NUEVO: contar "presentes" por historial (definición: estado='Presente') ===
// Si querés considerar 'Tarde' y 'Retiro' como presentes, cambiá el IN(...)
async function countPresentesHistorial(alumnoDNI, cursoID) {
  const [rows] = await pool.query(`
    SELECT COUNT(*) AS presentes
    FROM asistencia_historial
    WHERE alumnoDNI = ? AND cursoID = ? AND estado IN ('Presente')
  `, [alumnoDNI, cursoID]);
  return Number(rows[0]?.presentes || 0);
}

// === MODIFICAR: getAlumnosByCurso -> que incluya porcentaje calculado sano ===
async function getAlumnosByCurso(cursoID) {
  // Traemos alumnos + (si existiera) sus contadores legados
  const alumnos = await executeQuery(`
    SELECT 
      a.*,
      COALESCE(ast.asistencias, 0)          AS asistencias,
      COALESCE(ast.faltas, 0)               AS faltas,
      COALESCE(ast.faltas_justificadas, 0)  AS faltas_justificadas
    FROM alumno a
    LEFT JOIN asistencia ast 
      ON a.dni = ast.alumnoDNI AND ast.curso = ?
    WHERE a.cursoID = ?
    ORDER BY a.apellidos, a.nombres
  `, [cursoID, cursoID]);

  const hoy = hoyAR().toISODate();
  const totalClases = await countClasesForCurso(cursoID, hoy);

  // Enriquecer cada alumno con presentesHist y porcentaje cap a 100
  for (const a of alumnos) {
    const presentesHist = await countPresentesHistorial(a.dni, cursoID);
    a.presentes_historial = presentesHist;
    a.total_clases = totalClases;
    const pct = totalClases > 0 ? Math.round((presentesHist / totalClases) * 100) : 0;
    a.porcentaje = Math.min(100, Math.max(0, pct));
  }
  return alumnos;
}
const CORTE_ENV = process.env.ATTENDANCE_START || null;

async function getFechaCorte(cursoID) {
  if (CORTE_ENV) return CORTE_ENV; // ej. 2024-12-19

  // Si no hay ENV, tomamos la primera fecha real (historial o clase)
  const [[h1]] = await pool.query(
    `SELECT MIN(fecha) AS f FROM asistencia_historial WHERE cursoID=?`, [cursoID]
  );
  const [[h2]] = await pool.query(
    `SELECT MIN(fecha) AS f FROM clase WHERE cursoID=?`, [cursoID]
  );
  const f1 = h1?.f, f2 = h2?.f;
  // fallback: si no hay datos, empezá el 1 de marzo del año actual (ejemplo razonable)
  const fallback = DateTime.now().setZone("America/Argentina/Buenos_Aires").set({month:3, day:1}).toISODate();
  return (f1 && f2) ? (f1 < f2 ? f1 : f2) : (f1 || f2 || fallback);
}

// === MODIFICAR: getAlumnoByDNI -> idem, con porcentaje sano ===
async function getAlumnoByDNI(dni) {
  const rows = await executeQuery(`
    SELECT 
      a.*, 
      c.curso, 
      c.division,
      COALESCE(ast.asistencias, 0)          AS asistencias,
      COALESCE(ast.faltas, 0)               AS faltas,
      COALESCE(ast.faltas_justificadas, 0)  AS faltas_justificadas
    FROM alumno a
    JOIN curso c ON a.cursoID = c.cursoID
    LEFT JOIN asistencia ast 
      ON a.dni = ast.alumnoDNI AND ast.curso = a.cursoID
    WHERE a.dni = ?
  `, [dni]);

  if (rows.length === 0) return null;
  const a = rows[0];
  const hoy = hoyAR().toISODate();
  const totalClases = await countClasesForCurso(a.cursoID, hoy);
  const presentesHist = await countPresentesHistorial(a.dni, a.cursoID);

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
async function ensureClase(cursoID, fecha /* YYYY-MM-DD */) {
  await pool.query(`
    INSERT INTO clase (cursoID, fecha)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE cursoID = cursoID
  `, [cursoID, fecha]);
}

// === MODIFICAR: updateAsistencia -> usar historial y mantener contadores sin inflar ===
// Reemplazá la función antigua por ésta:
async function updateAsistencia(alumnoDNI, tipoAsistencia, cursoID, preceptorID) {
  const ahora = hoyAR();
  if (!esDiaCursada(ahora)) {
    const err = new Error("Fuera del calendario escolar (solo lunes a viernes)");
    err.statusCode = 400;
    throw err;
  }

  // Normalizar etiqueta para historial
  const m = { "Retirado": "Retiro" };
  const estadoHist = m[tipoAsistencia] || tipoAsistencia;

  // Garantizar fila en 'asistencia' (legado)
  await pool.query(`
    INSERT INTO asistencia (alumnoDNI, curso, asistencias, faltas, faltas_justificadas)
    VALUES (?, ?, 0, 0, 0)
    ON DUPLICATE KEY UPDATE alumnoDNI = alumnoDNI
  `, [alumnoDNI, cursoID]);

  // Crear "clase" del día si no existe (evita totalClases=0)
  await ensureClase(cursoID, ahora.toISODate());

  // Estado previo del día
  const [prevRows] = await pool.query(`
    SELECT estado FROM asistencia_historial 
    WHERE alumnoDNI = ? AND cursoID = ? AND fecha = ?
    LIMIT 1
  `, [alumnoDNI, cursoID, ahora.toISODate()]);
  const estadoPrevio = prevRows[0]?.estado || null;

  // Upsert idempotente
  await upsertHistorialAsistencia({
    alumnoDNI,
    cursoID,
    estado: estadoHist,
    preceptorID,
    fechaDT: ahora
  });

  // Ajuste contadores "legado"
  const delta = (est) => ({
    asistencias: (est === 'Presente' || est === 'Tarde' || est === 'Retiro') ? 1 : 0,
    faltas: (est === 'Ausente') ? 1 : 0,
    faltas_justificadas: (est === 'Falta justificada') ? 1 : 0,
  });

  if (!estadoPrevio) {
    const d = delta(tipoAsistencia);
    await pool.query(`
      UPDATE asistencia 
      SET asistencias = asistencias + ?, faltas = faltas + ?, faltas_justificadas = faltas_justificadas + ?
      WHERE alumnoDNI = ? AND curso = ?
    `, [d.asistencias, d.faltas, d.faltas_justificadas, alumnoDNI, cursoID]);

  } else if (estadoPrevio !== estadoHist) {
    const dOld = delta(estadoPrevio);
    const dNew = delta(tipoAsistencia);
    await pool.query(`
      UPDATE asistencia 
      SET asistencias = GREATEST(0, asistencias + ? - ?),
          faltas = GREATEST(0, faltas + ? - ?),
          faltas_justificadas = GREATEST(0, faltas_justificadas + ? - ?)
      WHERE alumnoDNI = ? AND curso = ?
    `, [dNew.asistencias, dOld.asistencias,
        dNew.faltas, dOld.faltas,
        dNew.faltas_justificadas, dOld.faltas_justificadas,
        alumnoDNI, cursoID]);
  }
}


// === NUEVO: endpoints de historial (queries de DB) ===
async function getHistorialByAlumno(dni, { desde=null, hasta=null } = {}) {
  let sql = `
    SELECT h.*, c.curso, c.division, p.usuario AS preceptorUsuario
    FROM asistencia_historial h
    JOIN curso c ON c.cursoID = h.cursoID
    LEFT JOIN preceptores p ON p.id = h.preceptorID
    WHERE h.alumnoDNI = ?
  `;
  const params = [dni];
  if (desde) { sql += ` AND h.fecha >= ?`; params.push(desde); }
  if (hasta) { sql += ` AND h.fecha <= ?`; params.push(hasta); }
  sql += ` ORDER BY h.fecha DESC, h.hora DESC`;
  return await executeQuery(sql, params);
}

async function getHistorialByCurso(cursoID, { desde=null, hasta=null } = {}) {
  let sql = `
    SELECT h.*, a.apellidos, a.nombres, p.usuario AS preceptorUsuario
    FROM asistencia_historial h
    JOIN alumno a ON a.dni = h.alumnoDNI
    LEFT JOIN preceptores p ON p.id = h.preceptorID
    WHERE h.cursoID = ?
  `;
  const params = [cursoID];
  if (desde) { sql += ` AND h.fecha >= ?`; params.push(desde); }
  if (hasta) { sql += ` AND h.fecha <= ?`; params.push(hasta); }
  sql += ` ORDER BY h.fecha DESC, h.hora DESC, a.apellidos, a.nombres`;
  return await executeQuery(sql, params);
}

// Exportá también las funciones nuevas:
module.exports = {
  pool,
  executeQuery,
  db: {
    // auth / preceptor
    getPreceptorByUsuario: db.getPreceptorByUsuario,

    // cursos
    getAllCursos: db.getAllCursos,
    getCursoById: db.getCursoById,

    // alumnos (versiones con % sano)
    getAlumnosByCurso,
    getAlumnoByDNI,

    // asistencias
    updateAsistencia,

    // clases / excepciones
    createClase: db.createClase,
    getClasesByFecha: db.getClasesByFecha,
    addExcepcion: db.addExcepcion,
    getExcepcionesByAlumno: db.getExcepcionesByAlumno,

    // historial
    getHistorialByAlumno,
    getHistorialByCurso,

    // util
    countClasesForCurso,
  },
};


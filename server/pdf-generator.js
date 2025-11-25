const puppeteer = require("puppeteer");
const handlebars = require("handlebars")
const path = require("path")
const fs = require("fs").promises

// Template HTML para el PDF de asistencias
const asistenciaTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lista de Asistencias</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #009ee7;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #009ee7;
            margin-bottom: 10px;
        }
        .info-curso {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
        }
        .info-label {
            font-weight: bold;
        }
        .tabla-asistencias {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .tabla-asistencias th,
        .tabla-asistencias td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .tabla-asistencias th {
            background-color: #009ee7;
            color: white;
            font-weight: bold;
        }
        .tabla-asistencias tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .estadisticas {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        .estadistica {
            text-align: center;
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
        }
        .estadistica-numero {
            font-size: 2em;
            font-weight: bold;
            color: #009ee7;
        }
        .estadistica-label {
            font-size: 0.9em;
            color: #666;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 0.9em;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .presente { color: #28a745; font-weight: bold; }
        .ausente { color: #dc3545; font-weight: bold; }
        .tarde { color: #ffc107; font-weight: bold; }
        .retirado { color: #6c757d; font-weight: bold; }
        .justificada { color: #17a2b8; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Lista de Asistencias</h1>
        <h2>{{curso.curso}} - División {{curso.division}}</h2>
    </div>

    <div class="info-curso">
        <div class="info-item">
            <span class="info-label">Fecha:</span>
            <span>{{fecha}}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Turno:</span>
            <span>{{turno}}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Estado de Clase:</span>
            <span>{{estadoClase}}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Preceptor:</span>
            <span>{{preceptor}}</span>
        </div>
    </div>

    <table class="tabla-asistencias">
        <thead>
            <tr>
                <th>N°</th>
                <th>Apellido y Nombre</th>
                <th>DNI</th>
                <th>Estado</th>
                <th>Asistencias Totales</th>
                <th>% Asistencia</th>
            </tr>
        </thead>
        <tbody>
            {{#each alumnos}}
            <tr>
                <td>{{@index}}</td>
                <td>{{apellidos}}, {{nombres}}</td>
                <td>{{dni}}</td>
                <td class="{{estadoClass}}">{{estado}}</td>
                <td>{{asistencias}}</td>
                <td>{{porcentaje}}%</td>
            </tr>
            {{/each}}
        </tbody>
    </table>

    <div class="estadisticas">
        <div class="estadistica">
            <div class="estadistica-numero">{{estadisticas.total}}</div>
            <div class="estadistica-label">Total Alumnos</div>
        </div>
        <div class="estadistica">
            <div class="estadistica-numero">{{estadisticas.presentes}}</div>
            <div class="estadistica-label">Presentes</div>
        </div>
        <div class="estadistica">
            <div class="estadistica-numero">{{estadisticas.ausentes}}</div>
            <div class="estadistica-label">Ausentes</div>
        </div>
        <div class="estadistica">
            <div class="estadistica-numero">{{estadisticas.tardes}}</div>
            <div class="estadistica-label">Llegadas Tarde</div>
        </div>
    </div>

    {{#if comentarios}}
    <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
        <strong>Comentarios:</strong> {{comentarios}}
    </div>
    {{/if}}

    <div class="footer">
        <p>Generado el {{fechaGeneracion}} por Sistema de Asistencias</p>
        <p>Este documento es válido como registro oficial de asistencias</p>
    </div>
</body>
</html>
`

// Template para reporte individual de alumno
const alumnoReporteTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Alumno</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #009ee7;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #009ee7;
            margin-bottom: 10px;
        }
        .info-alumno {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
        }
        .estadisticas {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        .estadistica {
            text-align: center;
            background-color: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
        }
        .estadistica-numero {
            font-size: 2.5em;
            font-weight: bold;
            color: #009ee7;
        }
        .estadistica-label {
            font-size: 1em;
            color: #666;
            margin-top: 5px;
        }
        .excepciones {
            margin-top: 30px;
        }
        .excepciones h3 {
            color: #009ee7;
            margin-bottom: 15px;
        }
        .excepciones table {
            width: 100%;
            border-collapse: collapse;
        }
        .excepciones th,
        .excepciones td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        .excepciones th {
            background-color: #009ee7;
            color: white;
        }
        .excepciones tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 0.9em;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte Individual de Alumno</h1>
        <h2>{{alumno.nombres}} {{alumno.apellidos}}</h2>
    </div>

    <div class="info-alumno">
        <div>
            <div class="info-item">
                <span class="info-label">DNI:</span>
                <span>{{alumno.dni}}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Curso:</span>
                <span>{{alumno.curso}} - División {{alumno.division}}</span>
            </div>
        </div>
        <div>
            <div class="info-item">
                <span class="info-label">Estado Actual:</span>
                <span>{{alumno.ultimo_estado}}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Fecha del Reporte:</span>
                <span>{{fechaGeneracion}}</span>
            </div>
        </div>
    </div>

    <div class="estadisticas">
        <div class="estadistica">
            <div class="estadistica-numero">{{estadisticas.asistencias}}</div>
            <div class="estadistica-label">Asistencias</div>
        </div>
        <div class="estadistica">
            <div class="estadistica-numero">{{estadisticas.porcentaje}}%</div>
            <div class="estadistica-label">% Asistencia</div>
        </div>
        <div class="estadistica">
            <div class="estadistica-numero">{{estadisticas.faltasJustificadas}}</div>
            <div class="estadistica-label">Faltas Justificadas</div>
        </div>
        <div class="estadistica">
            <div class="estadistica-numero">{{estadisticas.llegadasTarde}}</div>
            <div class="estadistica-label">Llegadas Tarde</div>
        </div>
    </div>

    {{#if excepciones.length}}
    <div class="excepciones">
        <h3>Historial de Excepciones</h3>
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Hora</th>
                    <th>Cantidad</th>
                </tr>
            </thead>
            <tbody>
                {{#each excepciones}}
                <tr>
                    <td>{{fecha}}</td>
                    <td>{{tipoExcepcion}}</td>
                    <td>{{hora}}</td>
                    <td>{{cantFalta}}</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>
    {{/if}}

    <div class="footer">
        <p>Generado el {{fechaGeneracion}} por Sistema de Asistencias</p>
        <p>Este documento es válido como registro oficial</p>
    </div>
</body>
</html>
`
async function getExecPath() {
  try { return puppeteer.executablePath(); } catch { return null; }
}
class PDFGenerator {
  constructor() {
    this.browser = null
  }

  
  async init() {
    if (!this.browser) {
      const executablePath = await getExecPath(); // usa Chromium de puppeteer
      this.browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox","--disable-setuid-sandbox"],
        ...(executablePath ? { executablePath } : {})
      });
    }
  }

  async generateAsistenciasPDF(data) {
    await this.init()

    const template = handlebars.compile(asistenciaTemplate)

    // Procesar datos para el template
    const processedData = {
  ...data,
  alumnos: data.alumnos.map((alumno, index) => ({
    ...alumno,
    estadoClass: this.getEstadoClass(alumno.estado),
    // usar porcentaje que viene del back
    porcentaje: Number(alumno.porcentaje) || 0
  })),
  fechaGeneracion: new Date().toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
};


    const html = template(processedData)

    const page = await this.browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    })

    await page.close()
    return pdf
  }

  async generateAlumnoReportePDF(data) {
    await this.init()

    const template = handlebars.compile(alumnoReporteTemplate)

    // Procesar datos para el template
    const processedData = {
      ...data,
      excepciones: data.excepciones.map((exc) => ({
        ...exc,
        fecha: new Date(exc.fecha).toLocaleDateString("es-AR"),
        hora: exc.hora || "N/A",
      })),
      fechaGeneracion: new Date().toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    const html = template(processedData)

    const page = await this.browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    })

    await page.close()
    return pdf
  }

  getEstadoClass(estado) {
    const clases = {
      Presente: "presente",
      Ausente: "ausente",
      Tarde: "tarde",
      Retirado: "retirado",
      "Falta justificada": "justificada",
    }
    return clases[estado] || ""
  }

  calcularPorcentaje(asistencias, totalClases) {
  if (!totalClases || totalClases <= 0) return 0;
  return Math.min(100, Math.round((asistencias / totalClases) * 100));
}

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

module.exports = PDFGenerator

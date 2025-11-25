# Estado actual del proyecto

## Arquitectura general
- **Backend:** Servidor Express definido en `server/app.js` con middlewares de sesión (`express-session`), CORS, JSON y archivos estáticos. No hay separación por routers; todas las rutas API y vistas están en un único archivo.
- **Persistencia:** MySQL/MariaDB manejado desde `server/database.js` usando `mysql2/promise`. Existen funciones utilitarias para cursos, alumnos, asistencia, clases y excepciones.
- **Frontend:** Vistas estáticas en `/public` (HTML + CSS + JS). El flujo principal es login (`public/login.html`), dashboard de cursos (`public/index.html` + `public/js/dashboard.js`) y pantallas de detalle (`curso.html`, `alumnos.html`, `alumno.html`, `busqueda.html`). No hay SPA ni framework; se consumen las API por `fetch`.

## Rutas backend existentes
- **Autenticación:**
  - `POST /api/login` valida usuario/contraseña contra `preceptores` y guarda la sesión en `req.session.preceptor`.
  - `POST /api/logout` destruye la sesión.
  - `GET /api/auth/check` devuelve el usuario en sesión o 401.
  - Middleware `requireAuth` protege la mayoría de las rutas, pero no hay validación de rol ni refresh de token.
- **Cursos y alumnos:** `GET /api/cursos`, `GET /api/curso/:id/alumnos`, `GET /api/alumno/:dni`.
- **Asistencias:** `PUT /api/asistencia` actualiza contadores e inserta en historial; depende de la sesión para tomar `preceptorID`. No existe creación/edición por fecha o curso completa, ni estados/validaciones formales.
- **Clases:** `POST /api/clase` y `GET /api/clase/:fecha/:cursoID` para guardar/consultar clases puntuales.
- **Historial y reportes:** `GET /api/alumno/:dni/historial`, `GET /api/curso/:id/historial`, generación de PDF por alumno o curso, búsqueda avanzada y estadísticas básicas.
- **Excepciones:** `POST /api/excepcion` para registrar inasistencias/llegadas tarde justificadas.
- **Vistas:** Rutas HTML sirven los archivos estáticos, con redirección básica según sesión en `/` y `/dashboard`.

## Autenticación y autorización
- Implementación basada en sesiones. El middleware `requireAuth` solo verifica que exista `req.session.preceptor`; no hay tokens JWT ni expiraciones explícitas más allá de la cookie de sesión.
- No existe registro, cambio de contraseña, recuperación ni almacenamiento seguro de tokens de reseteo.
- La base `preceptores` almacena usuarios con contraseñas en texto plano en la mayoría de los registros de ejemplo.

## Modelo de datos actual
- Tablas principales según `sistema_asistencias.sql`: `alumno`, `curso`, `asistencia`, `asistencia_historial`, `clase`, `excepcion`, `preceptores`. Campos de `preceptores`: `usuario`, `contrasena`, `email`, `telefono` sin controles de unicidad ni rol.【F:sistema_asistencias.sql†L436-L499】
- La tabla `asistencia` maneja contadores agregados (asistencias, faltas, faltas_justificadas) y `asistencia_historial` almacena registros diarios pero carece de validaciones de estado/turno.

## Frontend actual
- **Login (`public/js/login.js`):** envía usuario/contraseña a `/api/login`, guarda el preceptor en `localStorage` y redirige al dashboard; no hay formulario de registro, recuperación ni cambio de contraseña.【F:public/js/login.js†L1-L59】
- **Dashboard (`public/js/dashboard.js`):** verifica autenticación consultando `/api/auth/check`, carga cursos y permite navegar a `/curso/:id`; incluye botón de logout que llama a `/api/logout`.【F:public/js/dashboard.js†L1-L118】
- Otras pantallas (`curso.js`, `alumno.js`, `alumnos-lista.js`, `busqueda.js`) gestionan listados y PDF pero no implementan flujos completos de asistencia por fecha ni edición.

## Brechas detectadas respecto al objetivo
- Falta un flujo completo de **registro**, **cambio de contraseña** y **recuperación/olvido de contraseña** con tokens y expiraciones.
- La autenticación no usa **tokens ni refresco**; solo sesión sin middleware de roles. No hay `requireAuth`/`assertAuth` reutilizable ni validación de rol de PRECEPTOR en cada operación.
- El módulo de **asistencias** carece de CRUD por curso/fecha, estados normalizados, comentarios por alumno y control de turno/doble turno. Solo existe actualización puntual (`PUT /api/asistencia`).
- No hay **historial detallado** ni filtros avanzados en frontend; tampoco edición de asistencia ya cargada ni resumen por curso/fecha con estados.
- El frontend no tiene pantallas de **registro**, **recuperación de contraseña**, **perfil/cambio de contraseña** ni gestión completa de asistencias con selección de fecha/curso/estado múltiple.
- Manejo de errores es heterogéneo; respuestas JSON no siguen formato consistente y los códigos 400/401/403/404 no están centralizados.

## Riesgos y coherencia
- Contraseñas en texto plano en la base y bcrypt aplicado solo en login para algunos usuarios.
- Falta validación de fechas/estados en `updateAsistencia`; el cálculo de totales puede ser inconsistente por duplicaciones y funciones duplicadas en `database.js`.
- No hay protección CSRF ni controles de sesión renovable; el frontend se basa en `localStorage` sin expiración real.

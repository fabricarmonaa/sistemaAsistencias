document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  const mensajeDiv = document.getElementById("mensaje")

  // Verificar si ya está logueado
  checkAuthStatus()

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const usuario = document.getElementById("usuario").value
    const contrasena = document.getElementById("contrasena").value

    if (!usuario || !contrasena) {
      mostrarMensaje("Por favor complete todos los campos", "error")
      return
    }

    try {
      mostrarMensaje("Iniciando sesión...", "info")

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario, contrasena }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        mostrarMensaje("Login exitoso. Redirigiendo...", "success")

        // Guardar información del usuario en localStorage
        localStorage.setItem("preceptor", JSON.stringify(data.preceptor))

        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1500)
      } else {
        mostrarMensaje(data.error || "Error en el login", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      mostrarMensaje("Error de conexión. Intente nuevamente.", "error")
    }
  })

  function mostrarMensaje(texto, tipo) {
    mensajeDiv.textContent = texto
    mensajeDiv.className = `mensaje ${tipo}`
    mensajeDiv.style.display = "block"

    // Ocultar mensaje después de 5 segundos si es de error
    if (tipo === "error") {
      setTimeout(() => {
        mensajeDiv.style.display = "none"
      }, 5000)
    }
  }

  async function checkAuthStatus() {
    try {
      const response = await fetch("/api/cursos")
      if (response.ok) {
        // Ya está autenticado, redirigir al dashboard
        window.location.href = "/dashboard"
      }
    } catch (error) {
      // No está autenticado, continuar en login
      console.log("Usuario no autenticado")
    }
  }
})

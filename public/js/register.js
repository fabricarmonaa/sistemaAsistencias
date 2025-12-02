document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const mensajeDiv = document.getElementById("mensaje");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usuario = document.getElementById("usuario").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const contrasena = document.getElementById("contrasena").value;

    if (contrasena.length < 8) {
      return mostrarMensaje("La contraseña debe tener al menos 8 caracteres", "error");
    }

    try {
      mostrarMensaje("Creando cuenta...", "info");
      const resp = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, email, telefono, contrasena }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Error al registrar");
      }

      localStorage.setItem("preceptor", JSON.stringify(data.preceptor));
      mostrarMensaje("Cuenta creada. Redirigiendo...", "success");
      setTimeout(() => (window.location.href = "/dashboard"), 1500);
    } catch (error) {
      mostrarMensaje(error.message, "error");
    }
  });

  function mostrarMensaje(texto, tipo) {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `mensaje ${tipo}`;
    mensajeDiv.style.display = "block";
  }
});

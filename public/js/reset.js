document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetForm");
  const mensajeDiv = document.getElementById("mensaje");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = document.getElementById("token").value.trim();
    const nueva = document.getElementById("nueva").value;

    if (nueva.length < 8) return mostrarMensaje("La contraseña debe tener al menos 8 caracteres", "error");

    try {
      mostrarMensaje("Actualizando...", "info");
      const resp = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nueva }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "No se pudo actualizar la contraseña");

      mostrarMensaje("Contraseña actualizada. Volviendo al login...", "success");
      setTimeout(() => (window.location.href = "/login.html"), 1500);
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

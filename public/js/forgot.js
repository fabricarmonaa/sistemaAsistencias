document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotForm");
  const mensajeDiv = document.getElementById("mensaje");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usuarioInput = document.getElementById("usuario").value.trim();
    if (!usuarioInput) return mostrarMensaje("Ingresá tu usuario o email", "error");

    const payload = usuarioInput.includes("@")
      ? { email: usuarioInput }
      : { usuario: usuarioInput };

    try {
      mostrarMensaje("Generando token...", "info");
      const resp = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "No se pudo generar el token");

      mostrarMensaje(`Token generado: ${data.token}\nVence: ${new Date(data.expiresAt).toLocaleString()}`, "success");
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

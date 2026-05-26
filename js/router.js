/* ═══════════════════════════════════════
   MiAula — router.js
   Enrutador de vistas
═══════════════════════════════════════ */

const Views = {
  /**
   * Renderiza la vista correspondiente al id dado.
   * @param {string} viewId
   */
  render(viewId) {
    switch (viewId) {
      case 'inicio':         ViewInicio.render();         break;
      case 'tareas':         ViewTareas.render();         break;
      case 'recursos':       ViewRecursos.render();       break;
      case 'calificaciones': ViewCalificaciones.render(); break;
      case 'mensajes':       ViewMensajes.render();       break;
      case 'alumnos':        ViewAlumnos.render();        break;
      case 'notas':          ViewNotas.render();          break;
      case 'perfil':         ViewPerfil.render();         break;
      default:
        console.warn(`[Router] Vista desconocida: "${viewId}"`);
    }
  },
};

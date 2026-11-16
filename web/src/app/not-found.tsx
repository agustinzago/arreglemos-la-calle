// Id inexistente u oculto (spec #1: "este reporte no está disponible"); también la usa /r/[id].
export default function ReportNotFound() {
  return (
    <main className="gone">
      <h1>Este reporte no está disponible</h1>
      <p className="muted">Puede que lo hayan sacado o que el link esté mal escrito.</p>
    </main>
  );
}

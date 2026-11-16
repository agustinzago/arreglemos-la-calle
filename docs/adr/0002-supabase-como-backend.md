# Backend en Supabase, no en AWS

Aunque el autor trabaja todos los días con AWS, el backend va en Supabase porque este proyecto es personal, sin fines de lucro y lo paga el autor. Supabase trae en un solo servicio barato lo que el MVP necesita: Postgres con PostGIS para buscar reportes cercanos y asignar municipios por polígono, auth anónima que después se puede vincular a Apple o Google, Storage para las fotos, Edge Functions para la llamada al modelo de IA, y el propio dashboard como panel del operador.

## Consequences

- La lógica de estados vive en funciones de Postgres, no en un servidor propio.
- Migrar después a AWS implica rehacer la auth anónima y el panel del operador.

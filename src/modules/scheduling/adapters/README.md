# Adaptadores de scheduling

Implementaciones de los puertos del módulo contra un motor concreto.

`PostgresWaitlistAdapter` reutiliza `SchedulingBookingsRepository` en vez de reescribir sus
consultas: el repositorio ya está probado, y la migración no busca cambiar cómo se consulta sino
quién decide la conexión y qué tipos cruzan la frontera. Lo que sí ocurre aquí y no ocurría antes
es el mapeo de entidad a modelo de lectura.

El adaptador no resuelve conexiones ni mide nada: pide una sesión al módulo y recibe un
`EntityManager` ya enrutado, instrumentado y con los errores normalizados.

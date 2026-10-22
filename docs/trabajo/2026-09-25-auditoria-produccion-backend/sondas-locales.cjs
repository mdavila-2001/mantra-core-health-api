// Sólo GET de sondas en el contenedor local existente. Sin datos de pacientes.
(async () => {
  for (const route of ['/health', '/readiness', '/health']) {
    const response = await fetch(`http://127.0.0.1:3000${route}`, { signal: AbortSignal.timeout(10000) });
    const body = await response.json();
    console.log(JSON.stringify({ route, status: response.status, cacheControl: response.headers.get('cache-control'),
      bodyStatus: body.status ?? body.details?.status, checks: body.checks ?? body.details?.checks,
      timestamp: body.timestamp }));
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });

import { bootstrapWorker } from './worker/bootstrap';
import { malwareScanEnvSchema } from './modules/common/malware-scan.env';
import { FilesWorkerModule } from './worker/jobs/files/files.worker-module';

// El esquema entra en la validación del arranque: un `CLAMD_PORT` que no es un
// puerto tiene que matar el proceso ahí, no dejar un worker dando vueltas sin
// escanear nada.
void bootstrapWorker(FilesWorkerModule, 'files', malwareScanEnvSchema);

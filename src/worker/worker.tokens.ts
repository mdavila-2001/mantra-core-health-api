export { type WorkerEnv } from './worker.env';

/** Token de inyección para el `WorkerEnv` cargado por `bootstrapWorker`. */
export const WORKER_ENV = Symbol('WORKER_ENV');

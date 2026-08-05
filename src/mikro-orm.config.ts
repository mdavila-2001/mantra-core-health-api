/**
 * Punto de entrada que resuelve la CLI de MikroORM.
 *
 * `package.json` declara este archivo en `mikro-orm.configPaths`, así que la
 * ruta no se puede mover sin romper `yarn orm ...`. La configuración real vive
 * en `src/orm/config/orm.config.ts`, junto al resto del núcleo de persistencia;
 * este archivo solo la reexporta para que la CLI la encuentre donde la espera.
 */
export { default } from './orm/config/orm.config';

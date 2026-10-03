# Complementos de los seeds de AloVida Dev

Estos scripts conservan las personas, pacientes, profesionales y aseguradoras de los seeds de `mantra-core-technologies/mantra-core-health-model`, rama `dev`. Completan sus accesos y campos de registro para la demostración de AloVida. No sustituyen esas personas por nombres genéricos.

Se utilizaron después de cargar `boot` y `mock` del modelo y los catálogos del API en la base aislada `alovida_dev`. El paquete inicial contiene 16 profesionales, 12 pacientes y 25 aseguradoras. Los complementos dependen de esos IDs y de esos tamaños; no son un migrador para una base que ya recibe altas reales. No se ejecutan como parte del arranque del API ni de CI.

## Preparación

El directorio de trabajo contiene `backend`, `frontend`, `modelo` y `runtime`. El modelo se monta de sólo lectura. `runtime/model-seed.env` es configuración privada compatible con `modelo/salud-db/load_seeds.py`: PostgreSQL debe apuntar a `alovida_dev`, MongoDB/OpenSearch/MinIO al mismo stack aislado y `DEMO_PASSWORD` a la contraseña de demostración. No se incluye este archivo en Git.

Desde ese directorio:

```sh
docker build -f backend/tools/alovida-dev/Dockerfile.seed -t alovida-dev-seed:local .
export ALOVIDA_DEV_ROOT="$PWD"
```

Se presupone el stack aislado levantado, la red Docker `alovida-dev`, los inicializadores de base, las etapas del seed-cli del API y la carga `boot`/`mock` del modelo ya ejecutados. Estos complementos no borran ni reconstruyen automáticamente el stack. La configuración de dominio, TLS y proxy pertenece al despliegue, no a las credenciales del modelo.

## Fases del complemento

1. Aplicar `01-conceptos-demo.sql` mediante `psql -v ON_ERROR_STOP=1` al PostgreSQL de Dev. Sustituye conceptos placeholder del paquete por los conceptos reales usados por el API y recupera los enlaces de las vitrinas médicas. El SQL comprueba el nombre de la base.
2. Preparar cuentas de aseguradoras desde el seeder del modelo:

   ```sh
   backend/tools/alovida-dev/run.sh python /jobs/completar-demo.py cuentas
   ```

3. Vincular las cuentas clínicas a sus personas originales:

   ```sh
   backend/tools/alovida-dev/run.sh python /jobs/cuentas-personas-demo.py
   ```

4. Completar campos requeridos por registro, documentos sintéticos y contactos institucionales:

   ```sh
   backend/tools/alovida-dev/run.sh python /jobs/completar-registros.py
   ```

5. Completar el inventario de accesos IAM existentes:

   ```sh
   backend/tools/alovida-dev/run.sh python /jobs/completar-todos-accesos.py
   ```

6. Auditar campos y relaciones:

   ```sh
   backend/tools/alovida-dev/run.sh python /jobs/auditar-registros.py
   backend/tools/alovida-dev/run.sh python /jobs/verificar-seeds.py
   ```

`completar-demo.py buscador` reindexa los documentos médicos del modelo cuyo `geo` original no era un punto válido, omitiendo ese campo opcional. `imagenes-demo.py` genera los recursos de demostración y es utilizado por el generador de documentos. Los PDFs dicen expresamente que son sintéticos y sin validez legal; las habilitaciones permanecen pendientes de verificación.

Los correos clínicos se derivan del nombre y apellido original con el formato solicitado `nombre.apellido@mail.com`. La contraseña de demostración utilizada en los accesos es `12345678`; no es una contraseña para otros entornos. Los scripts conservan identificadores y usan inserciones determinísticas para sus complementos. Su ejecución sobre los fixtures iniciales se comprobó dos veces sin duplicar usuarios ni credenciales.

## Archivos privados

`runtime/demo-access` se crea con permiso `700`; sus inventarios se escriben con permiso `600`. Contienen correos, CI y contraseñas de demostración, y permanecen fuera del repositorio. También quedan fuera los `.env`, dumps, imágenes generadas e inventarios exportados. La auditoría imprime conteos, no información clínica ni secretos de infraestructura.

## Evidencia y límites

En el despliegue revisado se comprobaron 68 usuarios, 80 credenciales (incluidos 12 accesos por CI), DTOs de 12 pacientes, 16 profesionales y 25 aseguradoras, y ausencia de relaciones huérfanas. Los operadores institucionales accedieron a su aseguradora por HTTPS. Es evidencia de la reconstrucción realizada, no una promesa de que esos conteos permanezcan iguales después de registros nuevos.

El empaquetado para este PR se verificó con análisis de sintaxis Python y `bash -n`; no se repitió el seed sobre el servidor que ya contiene altas posteriores. El código de dominio del modelo no cambió durante estas correcciones: estos archivos son complementos operativos de su conjunto de prueba.

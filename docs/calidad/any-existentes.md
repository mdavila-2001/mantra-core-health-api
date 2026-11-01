# `any` existentes en la API

Inventario al 2026-10-31 (`origin/dev` en `78dd3646`) de los usos de `any` que la regla
`@typescript-eslint/no-explicit-any` marca fuera de specs. La regla está en `error` para todo el
código (`eslint.config.mjs`); los archivos de esta lista son la única excepción, y **vence el
2027-01-15**.

## Cómo se obtuvo

La cifra de la auditoría (110) sale de un `git grep` de texto:

```bash
git grep -hE '(: any\b|as any\b|<any>)' -- 'src/**/*.ts' ':!*.spec.ts' | wc -l   # 110
```

Ese patrón cuenta dos menciones en comentarios (`src/common/auth/ws-jwt.guard.ts:90`,
`src/modules/procedures_perioperative/dto/periop.dto.ts:1835`) y no ve formas como `any[]` o
`Record<string, any>`. Esta lista sale de ESLint, que mira el AST: una configuración mínima con solo
la regla en `error`, sin comentarios en línea (`noInlineConfig: true`), sobre `src/**/*.ts` y
`test/**/*.testing.ts` excluyendo `**/*.spec.ts` y el catálogo generado del ORM:

```bash
eslint --no-cache -c <config mínima> -f json 'src/**/*.ts' 'test/**/*.testing.ts'
```

Resultado: **132 usos en 11 archivos**. Diez son `*.testing.ts` (dobles de prueba
compartidos por varias specs) y uno es código productivo con su excepción en línea.

| Archivo | Usos | Cómo se exceptúa |
|---|---:|---|
| `src/common/security/auth-throttler.guard.ts` | 1 | `// eslint-disable-next-line` en la línea anterior (firma heredada de `ThrottlerGuard`) |
| `src/common/seed/glossary-seed.testing.ts` | 16 | lista cerrada en `eslint.config.mjs` |
| `src/modules/accounting/services/accounting-scope.testing.ts` | 12 | lista cerrada en `eslint.config.mjs` |
| `src/modules/authz/services/authz-clinical-scope.testing.ts` | 4 | lista cerrada en `eslint.config.mjs` |
| `src/modules/consent/services/consent-scope.testing.ts` | 6 | lista cerrada en `eslint.config.mjs` |
| `src/modules/delegated_access/services/delegation-scope.testing.ts` | 7 | lista cerrada en `eslint.config.mjs` |
| `src/modules/delegated_access/services/prescription-shares.testing.ts` | 21 | lista cerrada en `eslint.config.mjs` |
| `src/modules/pharmacy_inventory/application/scope/pharmacy-inventory-scope.testing.ts` | 4 | lista cerrada en `eslint.config.mjs` |
| `src/modules/scheduling/application/bookings/payment-receipts.testing.ts` | 36 | lista cerrada en `eslint.config.mjs` |
| `src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts` | 17 | lista cerrada en `eslint.config.mjs` |
| `src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts` | 8 | lista cerrada en `eslint.config.mjs` |

Fuera de esos once archivos no hay ningún `any` en código que no sea spec.

## Qué queda fuera

- `**/*.spec.ts` y `test/**/*.ts`: la regla sigue apagada ahí (dobles parciales de dependencias grandes).
  Un `*.testing.ts` nuevo, aunque esté en `src/`, ya cae en la regla.

## Detalle: archivo:línea:columna

### `src/common/security/auth-throttler.guard.ts` (1)

```text
src/common/security/auth-throttler.guard.ts:55:53  protected override getTracker(req: Record<string, any>): Promise<string> {
```

### `src/common/seed/glossary-seed.testing.ts` (16)

```text
src/common/seed/glossary-seed.testing.ts:11:24  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/common/seed/glossary-seed.testing.ts:11:30  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/common/seed/glossary-seed.testing.ts:11:49  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/common/seed/glossary-seed.testing.ts:14:57  export type GlossarySeedStore = Map<string, Map<string, any>>;
src/common/seed/glossary-seed.testing.ts:43:47  const table = (entity: string): Map<string, any> => {
src/common/seed/glossary-seed.testing.ts:47:25  const matches = (row: any, where: Record<string, any>): boolean =>
src/common/seed/glossary-seed.testing.ts:47:52  const matches = (row: any, where: Record<string, any>): boolean =>
src/common/seed/glossary-seed.testing.ts:54:42  const created: { entity: string; data: any }[] = [];
src/common/seed/glossary-seed.testing.ts:55:42  const removed: { entity: string; data: any }[] = [];
src/common/seed/glossary-seed.testing.ts:60:27  find: mockFn((entity: any, where: any) =>
src/common/seed/glossary-seed.testing.ts:60:39  find: mockFn((entity: any, where: any) =>
src/common/seed/glossary-seed.testing.ts:65:29  create: mockFn((entity: any, data: any) => {
src/common/seed/glossary-seed.testing.ts:65:40  create: mockFn((entity: any, data: any) => {
src/common/seed/glossary-seed.testing.ts:70:26  remove: mockFn((row: any) => {
src/common/seed/glossary-seed.testing.ts:109:38  const service = new Service(orm as any, logger as any);
src/common/seed/glossary-seed.testing.ts:109:53  const service = new Service(orm as any, logger as any);
```

### `src/modules/accounting/services/accounting-scope.testing.ts` (12)

```text
src/modules/accounting/services/accounting-scope.testing.ts:8:24  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/accounting/services/accounting-scope.testing.ts:8:30  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/accounting/services/accounting-scope.testing.ts:8:49  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/accounting/services/accounting-scope.testing.ts:70:11  lookup: any;
src/modules/accounting/services/accounting-scope.testing.ts:71:17  accountsRepo: any;
src/modules/accounting/services/accounting-scope.testing.ts:72:15  fiscalRepo: any;
src/modules/accounting/services/accounting-scope.testing.ts:73:16  journalRepo: any;
src/modules/accounting/services/accounting-scope.testing.ts:74:20  controllingRepo: any;
src/modules/accounting/services/accounting-scope.testing.ts:75:18  subledgerRepo: any;
src/modules/accounting/services/accounting-scope.testing.ts:76:16  accrualRepo: any;
src/modules/accounting/services/accounting-scope.testing.ts:77:14  assetRepo: any;
src/modules/accounting/services/accounting-scope.testing.ts:78:18  liabilityRepo: any;
```

### `src/modules/authz/services/authz-clinical-scope.testing.ts` (4)

```text
src/modules/authz/services/authz-clinical-scope.testing.ts:12:24  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/authz/services/authz-clinical-scope.testing.ts:12:30  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/authz/services/authz-clinical-scope.testing.ts:12:49  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/authz/services/authz-clinical-scope.testing.ts:69:60  const scope = new AuthzClinicalScopeService(scopeRepo as any);
```

### `src/modules/consent/services/consent-scope.testing.ts` (6)

```text
src/modules/consent/services/consent-scope.testing.ts:9:24  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/consent/services/consent-scope.testing.ts:9:30  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/consent/services/consent-scope.testing.ts:9:49  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/consent/services/consent-scope.testing.ts:57:28  patientProfilesRepo as any,
src/modules/consent/services/consent-scope.testing.ts:58:21  purposesRepo as any,
src/modules/consent/services/consent-scope.testing.ts:59:23  legalBasesRepo as any,
```

### `src/modules/delegated_access/services/delegation-scope.testing.ts` (7)

```text
src/modules/delegated_access/services/delegation-scope.testing.ts:9:24  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/delegated_access/services/delegation-scope.testing.ts:9:30  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/delegated_access/services/delegation-scope.testing.ts:9:49  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/delegated_access/services/delegation-scope.testing.ts:38:13  setsRepo: any;
src/modules/delegated_access/services/delegation-scope.testing.ts:40:18  delegatesRepo: any;
src/modules/delegated_access/services/delegation-scope.testing.ts:42:23  orgAssignmentsRepo: any;
src/modules/delegated_access/services/delegation-scope.testing.ts:70:18  scopeRepo as any,
```

### `src/modules/delegated_access/services/prescription-shares.testing.ts` (21)

```text
src/modules/delegated_access/services/prescription-shares.testing.ts:10:31  export const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/delegated_access/services/prescription-shares.testing.ts:10:37  export const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/delegated_access/services/prescription-shares.testing.ts:10:56  export const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/delegated_access/services/prescription-shares.testing.ts:25:6  } as any;
src/modules/delegated_access/services/prescription-shares.testing.ts:30:6  } as any;
src/modules/delegated_access/services/prescription-shares.testing.ts:35:6  } as any;
src/modules/delegated_access/services/prescription-shares.testing.ts:40:6  } as any;
src/modules/delegated_access/services/prescription-shares.testing.ts:43:64  export function item(overrides: Record<string, unknown> = {}): any {
src/modules/delegated_access/services/prescription-shares.testing.ts:61:64  export function link(overrides: Record<string, unknown> = {}): any {
src/modules/delegated_access/services/prescription-shares.testing.ts:79:18  const created: any[] = [];
src/modules/delegated_access/services/prescription-shares.testing.ts:80:15  const uses: any[] = [];
src/modules/delegated_access/services/prescription-shares.testing.ts:81:24  const committedUses: any[] = [];
src/modules/delegated_access/services/prescription-shares.testing.ts:90:32  transactional: mockFn((cb: any) => cb(useTx)),
src/modules/delegated_access/services/prescription-shares.testing.ts:93:32  transactional: mockFn((cb: any) => cb(tx)),
src/modules/delegated_access/services/prescription-shares.testing.ts:97:41  create: mockFn((_em: unknown, data: any) => {
src/modules/delegated_access/services/prescription-shares.testing.ts:106:44  appendUse: mockFn((_em: unknown, data: any) => {
src/modules/delegated_access/services/prescription-shares.testing.ts:122:11  em as any,
src/modules/delegated_access/services/prescription-shares.testing.ts:123:13  repo as any,
src/modules/delegated_access/services/prescription-shares.testing.ts:124:27  prescriberIdentity as any,
src/modules/delegated_access/services/prescription-shares.testing.ts:125:15  logger as any,
src/modules/delegated_access/services/prescription-shares.testing.ts:130:66  export async function thrown(promise: Promise<unknown>): Promise<any> {
```

### `src/modules/pharmacy_inventory/application/scope/pharmacy-inventory-scope.testing.ts` (4)

```text
src/modules/pharmacy_inventory/application/scope/pharmacy-inventory-scope.testing.ts:92:24  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/pharmacy_inventory/application/scope/pharmacy-inventory-scope.testing.ts:92:30  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/pharmacy_inventory/application/scope/pharmacy-inventory-scope.testing.ts:92:49  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/pharmacy_inventory/application/scope/pharmacy-inventory-scope.testing.ts:184:59  const policy = new PharmacyInventoryScopePolicy(repo as any);
```

### `src/modules/scheduling/application/bookings/payment-receipts.testing.ts` (36)

```text
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:16:24  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:16:30  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:16:49  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:27:70  export const patient = { id: 'patient-user', roles: ['PATIENT'] } as any;
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:34:6  } as any;
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:41:6  } as any;
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:99:13  const tx: any = {
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:100:30  create: mockFn((_entity: any, data: any) => data),
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:100:41  create: mockFn((_entity: any, data: any) => data),
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:104:13  const em: any = {
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:105:32  transactional: mockFn((cb: any) => cb(tx)),
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:134:61  representsPatient: mockFn(async (_profile: string, who: any) =>
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:174:21  bookingsRepo as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:175:20  catalogRepo as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:176:23  representation as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:177:11  {} as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:180:21  bookingsRepo as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:181:21  receiptsRepo as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:183:23  representation as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:184:14  files as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:188:19  noticeRepo as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:189:16  notices as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:190:11  {} as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:191:15  logger as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:211:23  bookingsRepo as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:213:16  files as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:215:17  logger as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:219:23  receiptsRepo as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:225:16  files as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:229:23  bookingsRepo as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:231:18  history as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:235:24  catalogRepo as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:238:14  } as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:240:17  logger as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:246:17  logger as any,
src/modules/scheduling/application/bookings/payment-receipts.testing.ts:252:64  export function notTheirs(representation: { representsPatient: any }) {
```

### `src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts` (17)

```text
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:46:7  em: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:47:17  bookingsRepo: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:48:16  catalogRepo: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:49:16  historyRepo: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:50:21  appointmentsRepo: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:51:15  noticeRepo: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:52:12  notices: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:53:11  logger: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:54:17  affiliations: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:55:21  professionalTime: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:56:17  coverageRepo: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:57:13  waitlist: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:58:19  encountersRepo: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:59:18  claimReadRepo: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:60:19  representation: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:61:15  formOrigin: any;
src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts:62:18  serviceAgenda: any;
```

### `src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts` (8)

```text
src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts:25:7  em: any;
src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts:26:16  catalogRepo: any;
src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts:27:11  logger: any;
src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts:28:17  affiliations: any;
src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts:29:21  professionalTime: any;
src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts:30:15  noticeRepo: any;
src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts:31:12  notices: any;
src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts:37:19  cancelBooking?: any;
```

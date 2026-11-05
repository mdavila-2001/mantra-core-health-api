# Plantillas de presentación contable

El catálogo `/admin/accounting/report-templates` configura títulos, orden de columnas
y rótulos por tipo de usuario. Se guarda en `accounting.report_presentation_templates`,
declarado en el modelo v4.2.85. No ejecuta consultas ni contiene fórmulas, saldos o asientos.

Audiencias: `PATIENT`, `PRACTITIONER`, `HEALTH_FACILITY`, `LABORATORY`, `PHARMACY`, `INSURER`.
La audiencia clasifica la presentación y no concede acceso a los datos del reporte.
Los servicios contables siguen autorizando por práctica y actor.

| Operación | Resultado |
| --- | --- |
| `GET /admin/accounting/report-templates?userType=PRACTITIONER&limit=25` | Página `items`, `nextCursor`, `limit`; la siguiente usa `after=nextCursor`. |
| `GET /admin/accounting/report-templates/:id` | Definición y `rowVersion`. |
| `POST /admin/accounting/report-templates` | Crea una definición; código único por audiencia. |
| `PUT /admin/accounting/report-templates/:id` | Reemplaza presentación con `expectedRowVersion`; responde 409 si cambió. |
| `POST /admin/accounting/report-templates/:id/end` | Desactiva sin borrar. Repetir la desactivación conserva la versión. |

Sólo un `SUPERADMIN` global escribe. Para leer se exige `SUPERADMIN`, `SECURITY_ADMIN`,
`PLATFORM_ADMIN`, `ACCOUNTING_APPROVER` o `PRACTITIONER`, conforme al ámbito de su rol.
Las mutaciones llevan `@Audited` y quedan en `audit.audit_log`.

Ejemplo de creación:

```json
{
  "userType": "PRACTITIONER",
  "code": "BALANCE_RESUMIDO",
  "name": "Balance resumido",
  "reportKind": "TRIAL_BALANCE",
  "columns": [
    { "key": "code", "label": "Código" },
    { "key": "balance", "label": "Saldo" }
  ]
}
```

La edición envía `name`, `reportKind`, `columns`, `isActive`, `expectedRowVersion`.
El tipo de usuario y el código permanecen estables. Desactivar envía sólo
`expectedRowVersion`. Una edición posterior puede reactivar mediante `isActive: true`.

| Reporte | Columnas admitidas |
| --- | --- |
| `TRIAL_BALANCE` | `code`, `name`, `debit`, `credit`, `balance` |
| `GENERAL_LEDGER` | `transactionNumber`, `transactionDate`, `memo`, `debit`, `credit`, `runningBalance` |
| `INCOME_STATEMENT` | `code`, `name`, `amount` |

Se rechazan columnas desconocidas, repetidas y propiedades extra incluso dentro de
cada columna. No hay eliminación física en esta API.


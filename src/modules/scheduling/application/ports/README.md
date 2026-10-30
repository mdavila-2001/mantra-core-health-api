# Puertos de scheduling

Interfaz + token Nest (`*_PORT`) por cada dependencia de otro contexto o de un motor concreto. El
adaptador vive en `infrastructure/adapters/`; el caso de uso sólo conoce el token.

`UnitOfWork` nombra en un único archivo la transacción que cruza los puertos (hoy el `EntityManager`).

| Puerto | Contexto |
| --- | --- |
| `BookingHistoryPort` | audit |
| `PatientRepresentationPort` | profiles |
| `ClinicalAppointmentsPort`, `ClinicalEncountersPort` | clinical |
| `InsuranceReadPort` | insurance |
| `FormOriginPort` | forms |
| `PractitionerAffiliationsPort`, `PractitionerDirectoryPort` | profiles / practice |
| `TenantDirectoryPort` | directory / profiles |
| `WalkInPatientRegistryPort` | profiles / common |
| `AgendaNoticePort` | messaging |
| `BookingCompletedPort` | surveys (emite la encuesta al completarse la atención) |
| `PaymentReceiptFilesPort` | common (archivos de los comprobantes de pago) |
| `BookingBillingPort` | billing (FAC-01: la cuenta por cobrar de la cita y los pagos que recibe) |
| `WaitlistReadPort`, `WaitlistWritePort` | persistencia ([ADR-0023](../../../../../docs/adr/ADR-0023-puertos-persistencia-read-write.md)) |

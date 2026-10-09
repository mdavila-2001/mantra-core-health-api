# Adaptadores de scheduling

Cada clase implementa un puerto de `application/ports/` contra un contexto o motor concreto
(`audit`, `profiles`, `clinical`, `insurance`, `forms`, `practice`, `directory`, mensajería,
SupportAdmin, Postgres para la lista de espera). Son delgados: traducen y delegan, no deciden.

`walk-in-patient.ts` es el alta del paciente de mostrador que usa `ProfilesWalkInPatientAdapter`.

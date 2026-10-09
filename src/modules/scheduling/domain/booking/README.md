# domain/booking

Reglas puras de la cita (sin Nest ni MikroORM; lo verifica `domain/domain-purity.spec.ts`):
máquina de estados, grupos de estados, roles y actores, canales, estado de pago, ventana y cargo de
cancelación, admisión de retención, plan y congelado de servicios, lectura del historial, motivo
(`judgeReason`) y visibilidad del motivo. Devuelven veredictos; la excepción HTTP la lanza `application/`.

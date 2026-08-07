import {
  assertCapability,
  capabilitiesForEngine,
  ENGINE_CAPABILITIES,
  POSTGRES_CAPABILITIES,
} from './adapter-capabilities';
import { UnsupportedCapabilityError } from '../errors/persistence.errors';

describe('capacidades por motor', () => {
  it('PostgreSQL declara transacciones, bloqueo pesimista y RLS', () => {
    expect(POSTGRES_CAPABILITIES.transactions).toBe(true);
    expect(POSTGRES_CAPABILITIES.pessimisticLocking).toBe(true);
    expect(POSTGRES_CAPABILITIES.rowLevelSecurity).toBe(true);
  });

  it('PostgreSQL NO declara transacciones distribuidas', () => {
    // Existe `PREPARE TRANSACTION`, pero este backend no coordina 2PC.
    // Declararlo disponible invitaría a simular una atomicidad que no hay.
    expect(POSTGRES_CAPABILITIES.distributedTransactions).toBe(false);
  });

  it('PostgreSQL NO declara réplica: describe el despliegue, no el motor', () => {
    expect(POSTGRES_CAPABILITIES.readReplica).toBe(false);
  });

  it('MongoDB NO declara transacciones en este despliegue', () => {
    // Las transacciones de MongoDB exigen un replica set y aquí hay un nodo
    // suelto. Declararlas sería exactamente la falsa atomicidad que se evita.
    expect(ENGINE_CAPABILITIES.mongodb.transactions).toBe(false);
  });

  it('Redis no ofrece búsqueda de texto ni RLS', () => {
    expect(ENGINE_CAPABILITIES.redis.fullTextSearch).toBe(false);
    expect(ENGINE_CAPABILITIES.redis.rowLevelSecurity).toBe(false);
  });

  it('devuelve undefined para un motor no declarado', () => {
    expect(capabilitiesForEngine('cassandra')).toBeUndefined();
  });
});

describe('assertCapability', () => {
  const context = {
    connectionName: 'cache',
    engine: 'redis',
    requestedBy: 'scheduling.enroll',
  };

  it('no hace nada si la capacidad existe', () => {
    expect(() =>
      assertCapability(POSTGRES_CAPABILITIES, 'transactions', {
        ...context,
        engine: 'postgresql',
      }),
    ).not.toThrow();
  });

  it('aborta si el motor no la ofrece', () => {
    expect(() =>
      assertCapability(ENGINE_CAPABILITIES.redis, 'transactions', context),
    ).toThrow(UnsupportedCapabilityError);
  });

  it('el mensaje nombra la ruta culpable, no solo la capacidad', () => {
    // Un mensaje que solo dice «faltan transacciones» obliga a buscar quién las
    // pidió; nombrando la ruta, el arranque señala el fichero a corregir.
    expect(() =>
      assertCapability(ENGINE_CAPABILITIES.redis, 'transactions', context),
    ).toThrow(/scheduling\.enroll.*transactions.*redis.*cache/s);
  });
});

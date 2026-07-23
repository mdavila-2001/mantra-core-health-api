import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from '../mikro-orm.config';

/**
 * Raíz de persistencia. Registra la conexión MikroORM (Unit of Work + Identity Map)
 * y expone `EntityManager`/repositorios al resto de la aplicación. Global para que
 * cada módulo de dominio inyecte el EM sin reimportar la conexión.
 */
@Global()
@Module({
  imports: [MikroOrmModule.forRoot(mikroOrmConfig)],
  exports: [MikroOrmModule],
})
export class DatabaseModule {}

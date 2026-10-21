import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSourceIndex } from './ast.mjs';
import { createDtoReader } from './dto.mjs';
import { loadContract } from './openapi.mjs';

const DTO = `import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWidgetDto {
  @ApiProperty({ description: 'Identificador del widget' })
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  name?: string;

  @IsString()
  sinContrato: string;
}
`;

function lector() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-dto-'));
  fs.mkdirSync(path.join(root, 'src', 'modules', 'w', 'dto'), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, 'openapi'));
  fs.writeFileSync(
    path.join(root, 'src', 'modules', 'w', 'dto', 'w.dto.ts'),
    DTO,
  );
  fs.writeFileSync(
    path.join(root, 'openapi', 'openapi.json'),
    JSON.stringify({
      paths: {},
      components: {
        schemas: {
          CreateWidgetDto: {
            type: 'object',
            required: ['id'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Identificador del widget',
              },
              name: { type: 'string', maxLength: 10 },
            },
          },
        },
      },
    }),
  );
  const contract = loadContract(root);
  const index = buildSourceIndex(root);
  return createDtoReader({ contract, index });
}

const REF = { $ref: '#/components/schemas/CreateWidgetDto' };
const linea = (texto) =>
  DTO.split('\n').findIndex((l) => l.includes(texto)) + 1;

test('camposDeDto: decorador literal, restricciones derivadas, obligatoriedad y fuente', () => {
  const [id, name] = lector().camposDeDto(REF);

  assert.equal(id.campo, 'id');
  assert.equal(id.obligatorio, true);
  assert.equal(id.tipo, 'string');
  assert.deepEqual(id.decoradores, ['@IsUUID()']); // @ApiProperty no es una regla
  assert.deepEqual(id.restricciones, ['formato uuid']);
  assert.equal(id.descripcion, 'Identificador del widget');
  assert.equal(id.clase, 'CreateWidgetDto');
  assert.equal(id.fuente, `src/modules/w/dto/w.dto.ts:${linea('id: string')}`);

  assert.equal(name.obligatorio, false);
  assert.deepEqual(name.decoradores, [
    '@IsOptional()',
    '@IsString()',
    '@MaxLength(10)',
  ]);
  assert.deepEqual(name.restricciones, ['longitud máxima 10']);
  assert.equal(name.descripcion, null); // sin dato: no se inventa
});

test('payloadMinimo sólo incluye los campos obligatorios', () => {
  const minimo = lector().payloadMinimo(REF);
  assert.deepEqual(Object.keys(minimo), ['id']);
  assert.match(minimo.id, /^[0-9a-f-]{36}$/);
});

test('fieldRows conserva la forma de texto que usa el markdown', () => {
  const [id] = lector().fieldRows(REF);
  assert.equal(id.field, 'id');
  assert.equal(id.required, 'Sí');
  assert.equal(id.constraints, 'formato `uuid`');
});

test('un campo que el contrato no declara no aparece (el DTO del código no se mezcla)', () => {
  const campos = lector()
    .camposDeDto(REF)
    .map((campo) => campo.campo);
  assert.deepEqual(campos, ['id', 'name']);
});

// ---- alias de @ApiSchema, nombres repetidos entre módulos y herencia ----------

function repo(archivos, esquemas) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-dto2-'));
  for (const [ruta, texto] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(root, ruta)), { recursive: true });
    fs.writeFileSync(path.join(root, ruta), texto);
  }
  fs.mkdirSync(path.join(root, 'openapi'));
  fs.writeFileSync(
    path.join(root, 'openapi', 'openapi.json'),
    JSON.stringify({ paths: {}, components: { schemas: esquemas } }),
  );
  return { contract: loadContract(root), index: buildSourceIndex(root) };
}

const props = (...nombres) =>
  Object.fromEntries(nombres.map((nombre) => [nombre, { type: 'string' }]));
const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });

test('un DTO publicado con @ApiSchema({ name }) se encuentra por el nombre de su clase', () => {
  const { contract, index } = repo(
    {
      'src/modules/a/dto/a.dto.ts': `
@ApiSchema({ name: 'AAliasDto' })
export class AliasedDto {
  @IsString()
  y: string;
}`,
    },
    { AAliasDto: { type: 'object', properties: props('y') } },
  );
  const con = createDtoReader({ contract, index, resolverAlias: true });
  const sin = createDtoReader({ contract, index });
  assert.deepEqual(con.camposDeDto(ref('AAliasDto'))[0].decoradores, [
    '@IsString()',
  ]);
  assert.match(
    con.camposDeDto(ref('AAliasDto'))[0].fuente,
    /^src\/modules\/a\/dto\/a\.dto\.ts:\d+$/,
  );
  assert.equal(sin.camposDeDto(ref('AAliasDto'))[0].fuente, null);
});

test('dos clases con el mismo nombre: sin pista no se elige; con el módulo del controlador, sí', () => {
  const clase = (campo, decorador) => `
export class DupDto {
  @${decorador}
  ${campo}: string;
}`;
  const { contract, index } = repo(
    {
      'src/modules/a/dto/dup.dto.ts': clase('x', 'IsEmail()'),
      'src/modules/b/dto/dup.dto.ts': clase('x', 'IsUUID()'),
    },
    { DupDto: { type: 'object', properties: props('x') } },
  );
  const lector = createDtoReader({ contract, index, resolverAlias: true });
  assert.equal(lector.camposDeDto(ref('DupDto'))[0].fuente, null);
  const deB = lector.camposDeDto(ref('DupDto'), { modulo: 'b' })[0];
  assert.deepEqual(deB.decoradores, ['@IsUUID()']);
  assert.match(deB.fuente, /^src\/modules\/b\//);
});

test('herencia: extends, OmitType y PickType traen los decoradores de la base', () => {
  const { contract, index } = repo(
    {
      'src/modules/h/dto/base.dto.ts': `
export class BaseDto {
  @IsString()
  a: string;
  @IsEmail()
  secreto: string;
}
export class HijaDto extends BaseDto {
  @IsInt()
  propia: number;
}
export class SinSecretoDto extends OmitType(BaseDto, ['secreto'] as const) {}
export class SoloADto extends PickType(BaseDto, ['a'] as const) {}`,
    },
    {
      HijaDto: { type: 'object', properties: props('a', 'propia') },
      SinSecretoDto: { type: 'object', properties: props('a', 'secreto') },
      SoloADto: { type: 'object', properties: props('a', 'secreto') },
    },
  );
  const lector = createDtoReader({ contract, index, resolverAlias: true });
  const deco = (dto) =>
    Object.fromEntries(
      lector.camposDeDto(ref(dto)).map((c) => [c.campo, c.decoradores]),
    );
  assert.deepEqual(deco('HijaDto'), {
    a: ['@IsString()'],
    propia: ['@IsInt()'],
  });
  // lo omitido o no elegido no hereda decoradores: el campo queda sin regla visible
  assert.deepEqual(deco('SinSecretoDto'), { a: ['@IsString()'], secreto: [] });
  assert.deepEqual(deco('SoloADto'), { a: ['@IsString()'], secreto: [] });
});

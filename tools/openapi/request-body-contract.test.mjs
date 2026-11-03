// Pruebas de `request-body-contract.mjs` con una app Nest de verdad, mínima:
// dos módulos, dos DTO homónimos y un anidado con y sin `@ValidateNested`. No
// toca la base ni la app real, así que corre sin el stack.
//
//   node --test tools/openapi/request-body-contract.test.mjs
//
// Los decoradores se aplican a mano porque esto es `.mjs`, sin compilar: es
// lo mismo que emite `tsc` (`__decorate` + `design:paramtypes`).
import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Body, Controller, Module, Post } from '@nestjs/common';
import { ModulesContainer, NestFactory } from '@nestjs/core';
import {
  ApiProperty,
  ApiPropertyOptional,
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import {
  closeRequestBodies,
  collectBodyClasses,
  disambiguateHomonymSchemas,
  modulesOf,
} from './request-body-contract.mjs';

// `tsc` emite `design:type` por cada propiedad decorada; Swagger lo lee cuando
// `@ApiProperty` no dice el tipo. Acá todas son texto salvo que digan otra cosa.
function prop(cls, key, ...decorators) {
  Reflect.defineMetadata('design:type', String, cls.prototype, key);
  Reflect.decorate(decorators, cls.prototype, key, undefined);
}

function dto(name, fields) {
  const cls = { [name]: class {} }[name];
  for (const [key, decorators] of Object.entries(fields))
    prop(cls, key, ...decorators);
  return cls;
}

function controller(path, bodyClass) {
  const cls = class {
    create() {}
  };
  Object.defineProperty(cls, 'name', { value: `${path}Controller` });
  const descriptor = Object.getOwnPropertyDescriptor(cls.prototype, 'create');
  Reflect.decorate([Post()], cls.prototype, 'create', descriptor);
  Body()(cls.prototype, 'create', 0);
  Reflect.defineMetadata(
    'design:paramtypes',
    [bodyClass],
    cls.prototype,
    'create',
  );
  Reflect.decorate([Controller(path)], cls);
  return cls;
}

function module(name, controllers) {
  const cls = { [name]: class {} }[name];
  Reflect.decorate([Module({ controllers })], cls);
  return cls;
}

// forms y surveys tienen cada uno su `CreateAssignmentDto`, como en la API.
const ValidatedLine = dto('ValidatedLineDto', {
  note: [ApiProperty(), IsString()],
});
const LooseLine = dto('LooseLineDto', {
  anything: [ApiProperty(), IsString()],
});
const FormsAssignment = dto('CreateAssignmentDto', {
  fieldId: [ApiProperty(), IsUUID()],
  targetResourceConceptId: [ApiProperty(), IsUUID()],
});
const SurveysAssignment = dto('CreateAssignmentDto', {
  surveyVersionId: [ApiProperty(), IsUUID()],
  targetType: [ApiProperty(), IsString()],
  comment: [ApiPropertyOptional(), IsOptional(), IsString()],
  line: [ApiProperty({ type: () => ValidatedLine }), ValidateNested()],
  loose: [ApiProperty({ type: () => LooseLine })],
});

const FormsModule = module('FormsModule', [
  controller('forms/assignments', FormsAssignment),
]);
const SurveysModule = module('SurveysModule', [
  controller('surveys/assignments', SurveysAssignment),
]);
const AppModule = module('AppModule', []);
Reflect.defineMetadata('imports', [FormsModule, SurveysModule], AppModule);

async function generate({ fix }) {
  const app = await NestFactory.create(AppModule, { logger: false });
  const bodies = collectBodyClasses(modulesOf(app.get(ModulesContainer)));
  const renamed = fix ? disambiguateHomonymSchemas(bodies) : [];
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().build(),
  );
  const closed = fix ? closeRequestBodies(document, bodies) : 0;
  await app.close();
  const bodyOf = (path) =>
    document.paths[path].post.requestBody.content[
      'application/json'
    ].schema.$ref
      .split('/')
      .pop();
  return { document, renamed, closed, bodyOf, bodies };
}

test('sin el arreglo, Swagger documenta las dos rutas con el mismo esquema (el defecto)', async () => {
  // Sin renombrar, el segundo homónimo pisa al primero: el esquema que se
  // publica es uno solo y una de las dos rutas lleva el cuerpo ajeno.
  const { bodyOf, document } = await generate({ fix: false });
  assert.equal(bodyOf('/forms/assignments'), 'CreateAssignmentDto');
  assert.equal(bodyOf('/surveys/assignments'), 'CreateAssignmentDto');
  assert.equal(
    document.components.schemas.CreateAssignmentDto.additionalProperties,
    undefined,
  );
});

test('encuentra el DTO de @Body() de cada ruta con su módulo', async () => {
  const { bodies } = await generate({ fix: false });
  assert.equal(bodies.get(FormsAssignment), 'FormsModule');
  assert.equal(bodies.get(SurveysAssignment), 'SurveysModule');
});

test('los homónimos pasan a <Módulo><Clase> y cada ruta lleva su cuerpo', async () => {
  const { bodyOf, document, renamed } = await generate({ fix: true });
  assert.deepEqual(
    renamed.map((r) => r.to),
    ['FormsCreateAssignmentDto', 'SurveysCreateAssignmentDto'],
  );
  assert.equal(bodyOf('/forms/assignments'), 'FormsCreateAssignmentDto');
  assert.equal(bodyOf('/surveys/assignments'), 'SurveysCreateAssignmentDto');
  const surveys = document.components.schemas.SurveysCreateAssignmentDto;
  assert.deepEqual(Object.keys(surveys.properties).sort(), [
    'comment',
    'line',
    'loose',
    'surveyVersionId',
    'targetType',
  ]);
  assert.deepEqual(surveys.required.sort(), [
    'line',
    'loose',
    'surveyVersionId',
    'targetType',
  ]);
  assert.equal(document.components.schemas.CreateAssignmentDto, undefined);
});

test('cierra el cuerpo y sólo los anidados que @ValidateNested recorre', async () => {
  const { document, closed } = await generate({ fix: true });
  const { schemas } = document.components;
  assert.equal(schemas.FormsCreateAssignmentDto.additionalProperties, false);
  assert.equal(schemas.SurveysCreateAssignmentDto.additionalProperties, false);
  assert.equal(schemas.ValidatedLineDto.additionalProperties, false);
  // Sin @ValidateNested el whitelist no entra: el objeto acepta cualquier clave.
  assert.equal(schemas.LooseLineDto.additionalProperties, undefined);
  assert.equal(closed, 3);
});

// Dibujos Mermaid de los árboles de decisión, procesos y máquinas de estado.
// Las etiquetas se escapan: un `"` o un `<` en un mensaje de error rompería todo el diagrama.

export function etiqueta(texto, maximo = 80) {
  const una = String(texto ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/"/g, "'")
    .replace(/</g, '‹')
    .replace(/>/g, '›');
  return una.length > maximo ? `${una.slice(0, maximo - 1).trimEnd()}…` : una;
}

const RAMAS = ['entonces', 'sino', 'cuerpo', 'captura', 'finalmente', 'hijos'];

/** ¿El árbol decide algo (condición, error propio, iteración, intento) o sólo accede y escribe? */
export function esTrivial(nodos) {
  let decide = false;
  (function recorrer(lista) {
    for (const n of lista) {
      if (['SI', 'SEGUN', 'BUCLE', 'INTENTAR', 'ERROR'].includes(n.tipo))
        decide = true;
      for (const r of RAMAS) if (n[r]) recorrer(n[r]);
      for (const c of n.casos ?? []) recorrer(c.nodos);
    }
  })(nodos);
  return !decide;
}

export function contar(nodos) {
  let total = 0;
  (function recorrer(lista) {
    for (const n of lista) {
      total += 1;
      for (const r of RAMAS) if (n[r]) recorrer(n[r]);
      for (const c of n.casos ?? []) recorrer(c.nodos);
    }
  })(nodos);
  return total;
}

/**
 * Árbol de decisión → `flowchart TD`.
 * Los accesos se agrupan en un nodo; los efectos consecutivos, también.
 * Pasado `maxNodos` se corta con un nodo que lo dice: nada se omite en silencio.
 */
export function arbolAMermaid(nodos, { maxNodos = 70 } = {}) {
  const lineas = ['flowchart TD'];
  let contador = 0;
  let emitidos = 0;
  let cortado = false;
  const nuevo = (forma, texto, clase) => {
    contador += 1;
    emitidos += 1;
    const id = `n${contador}`;
    const l = etiqueta(texto, 110);
    const abre = {
      rect: ['[', ']'],
      rombo: ['{', '}'],
      estadio: ['([', '])'],
      cilindro: ['[(', ')]'],
      hexagono: ['{{', '}}'],
      circulo: ['((', '))'],
      bandera: ['>', ']'],
    }[forma];
    lineas.push(
      `  ${id}${abre[0]}"${l}"${abre[1]}${clase ? `:::${clase}` : ''}`,
    );
    return id;
  };
  const unir = (entradas, id) => {
    for (const e of entradas)
      lineas.push(
        `  ${e.de} -->${e.texto ? `|"${etiqueta(e.texto, 40)}"|` : ''} ${id}`,
      );
  };

  /** @returns {{de: string, texto?: string}[]} salidas abiertas */
  function emitir(lista, entradas) {
    let actuales = entradas;
    let i = 0;
    while (i < lista.length) {
      if (cortado) return actuales;
      if (emitidos >= maxNodos) {
        const id = nuevo(
          'rect',
          `… el resto del árbol (${contar(lista.slice(i))} nodos) está en el JSON del inventario`,
          'corte',
        );
        unir(actuales, id);
        cortado = true;
        return [{ de: id }];
      }
      const n = lista[i];
      if (n.tipo === 'ACCESO') {
        const grupo = [];
        while (i < lista.length && lista[i].tipo === 'ACCESO')
          grupo.push(lista[i++]);
        const id = nuevo(
          'hexagono',
          `Acceso: ${grupo.map((g) => `${g.corto ?? g.txt} (${g.falla.estado})`).join(' · ')}`,
          'acceso',
        );
        unir(actuales, id);
        actuales = [{ de: id }];
        continue;
      }
      if (n.tipo === 'EFECTO') {
        const grupo = [];
        while (i < lista.length && lista[i].tipo === 'EFECTO')
          grupo.push(lista[i++]);
        const texto = grupo.map((g) => `${g.detalle} ${g.tabla}`).join(' · ');
        const id = nuevo('cilindro', texto, 'efecto');
        unir(actuales, id);
        actuales = [{ de: id }];
        continue;
      }
      i += 1;
      if (n.tipo === 'ERROR') {
        const id = nuevo(
          'estadio',
          `${n.estado ?? '↩'} ${n.codigo ?? ''} ${n.mensaje ?? n.excepcion}`.trim(),
          'error',
        );
        unir(actuales, id);
        actuales = []; // la ejecución termina
      } else if (n.tipo === 'SI') {
        const id = nuevo('rombo', n.txt, 'decision');
        unir(actuales, id);
        const a = emitir(n.entonces, [{ de: id, texto: 'sí' }]);
        const b = n.sino.length
          ? emitir(n.sino, [{ de: id, texto: 'no' }])
          : [{ de: id, texto: 'no' }];
        actuales = [...a, ...b];
      } else if (n.tipo === 'SEGUN') {
        const id = nuevo('rombo', `según ${n.txt}`, 'decision');
        unir(actuales, id);
        actuales = n.casos.flatMap((c) =>
          emitir(c.nodos, [{ de: id, texto: c.valor }]),
        );
        if (!n.casos.some((c) => c.valor === 'por defecto'))
          actuales.push({ de: id, texto: 'otro' });
      } else if (n.tipo === 'BUCLE') {
        const id = nuevo('rect', `Repite: ${n.txt}`, 'bucle');
        unir(actuales, id);
        actuales = emitir(n.cuerpo, [{ de: id, texto: 'cada elemento' }]);
        actuales.push({ de: id, texto: 'al terminar' });
      } else if (n.tipo === 'INTENTAR') {
        const id = nuevo('rect', 'Intenta', 'intento');
        unir(actuales, id);
        const a = emitir(n.cuerpo, [{ de: id }]);
        const b = n.captura.length
          ? emitir(n.captura, [{ de: id, texto: 'si falla' }])
          : [];
        actuales = [...a, ...b];
        if (n.finalmente.length) actuales = emitir(n.finalmente, actuales);
      } else if (n.tipo === 'TRANSACCION') {
        const id = nuevo('rect', `Transacción: ${n.txt}`, 'transaccion');
        unir(actuales, id);
        actuales = emitir(n.hijos, [{ de: id }]);
      } else if (n.tipo === 'LLAMADA') {
        const id = nuevo('rect', `Llama a ${n.destino}`, 'llamada');
        unir(actuales, id);
        actuales = emitir(n.hijos, [{ de: id }]);
      } else if (n.tipo === 'EVENTO') {
        const id = nuevo(
          'bandera',
          `Evento ${n.evento ?? `~${n.expresion}`}`,
          'evento',
        );
        unir(actuales, id);
        actuales = [{ de: id }];
      } else if (n.tipo === 'TRABAJO') {
        const id = nuevo(
          'bandera',
          `Encola ${n.trabajo ?? `~${n.expresion}`}`,
          'evento',
        );
        unir(actuales, id);
        actuales = [{ de: id }];
      } else if (n.tipo === 'RESPUESTA') {
        const id = nuevo('circulo', `${n.estado} ${n.txt}`, 'ok');
        unir(actuales, id);
        actuales = [{ de: id }];
      }
    }
    return actuales;
  }
  const inicio = nuevo('circulo', 'Solicitud', 'inicio');
  emitir(nodos, [{ de: inicio }]);
  lineas.push(
    '  classDef acceso fill:#eef,stroke:#66a',
    '  classDef error fill:#fee,stroke:#c33',
    '  classDef ok fill:#efe,stroke:#3a3',
    '  classDef efecto fill:#ffd,stroke:#aa3',
    '  classDef decision fill:#fff,stroke:#555',
    '  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4',
  );
  return lineas.join('\n');
}

/** Máquina de estados → `stateDiagram-v2`. */
export function maquinaAMermaid(maquina) {
  const lineas = ['stateDiagram-v2'];
  for (const i of maquina.iniciales) lineas.push(`  [*] --> ${id(i)}`);
  for (const t of maquina.transiciones)
    lineas.push(`  ${id(t.de)} --> ${id(t.a)}`);
  for (const f of maquina.terminales) lineas.push(`  ${id(f)} --> [*]`);
  return lineas.join('\n');
}

/** Identificador seguro en Mermaid: sólo letras, números y guion bajo. */
export function id(texto) {
  return String(texto).replace(/[^A-Za-z0-9_]/g, '_');
}

---
name: kman
description: Orquestación y gestión de agentes especializados mediante la herramienta CLI kman (@unliftedq/kman). Permite gobernar roles acotados (orchestrator, frontend-developer, backend-hexagonal, qa-verifier, reviewer) con perfiles, contexto eficiente y aislamiento de permisos.
---

# KMAN — Orquestador de Agentes Especializados

`kman` es la herramienta CLI de gestión multi-agente de la casa (`@unliftedq/kman`), instalada globalmente vía npm. Permite evitar el antipatrón del "asistente omnisciente sobrecargado", dividiendo el trabajo en un equipo de agentes especializados, disciplinados y con contexto acotado.

## Instalación Obligatoria en Todas las Instancias

Todo entorno y estación de trabajo de AloVida debe tener `kman` instalado:

```bash
npm install -g @unliftedq/kman
kman --version
```

Diagnóstico del entorno:
```bash
kman doctor
```

## Filosofía Operativa en AloVida

1. **Aislamiento por Rol:** Cada agente tiene su perfil en `~/.kman/agents/<nombre>/` con su propio `soul.md`, configuración `agent.toml` y habilidades acotadas.
2. **Contexto Limpio:** Un agente de backend no carga tokens de CSS/UI; un agente de QA no carga configuraciones de build.
3. **Carriles en Paralelo:** `kman` permite orquestar tareas en segundo plano mediante su daemon (`kman daemon`), coordinando agentes en worktrees independientes sobre archivos disjuntos.

## Roster de Agentes Estándar

| Agente | Rol | Especialidad | Límite de Código |
|---|---|---|---|
| `orchestrator` | Supervisor y sincronizador | División de tareas, asignación de worktrees, verificación de gates | — |
| `fe-subatomic` | Desarrollador Front | Descomposición en componentes subatómicos, plantillas y CSS | ≤ 300 líneas |
| `be-hexagonal` | Desarrollador API | Arquitectura hexagonal (Ports & Adapters), DTOs atómicos | ≤ 300 líneas |
| `router-modular`| Infraestructura de Navegación | Partición de rutas lazy y mapas de navegación desacoplados | ≤ 300 líneas |
| `qa-gatekeeper` | Auditor de Calidad | Verificación de `check:max-lines`, types, tests y regresiones | — |

## Comandos Frecuentes

```bash
# Listar agentes activos
kman agent list

# Iniciar tarea en segundo plano con agente específico
kman run -a fe-subatomic "Modularizar practitioner-profile-edit en subcomponentes"

# Ver estado de tareas
kman task list
kman task logs <task-id>

# Sesión interactiva con un agente especializado
kman chat -a be-hexagonal
```

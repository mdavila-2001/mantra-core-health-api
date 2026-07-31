workspace "REDESA Health API" "Backend del ecosistema de salud REDESA (Mantra Core Technologies). Fuente de arquitectura oficial — debe coincidir con docs/architecture/*.md (Fase 10 del plan de documentación)." {

    model {
        patient = person "Paciente" "Consume la API para su propia información de salud y agenda."
        clinician = person "Profesional clínico" "Personal médico/asistencial sujeto al PDP clínico aditivo."
        adminStaff = person "Personal administrativo/financiero" "Operación de práctica, facturación, contabilidad."
        externalSystem = softwareSystem "Sistema externo" "Proveedor de pago, laboratorio, aseguradora u otro tercero." "External"

        redesa = softwareSystem "REDESA Health API" "Monolito modular NestJS: 60 módulos de dominio, 841 operaciones HTTP." {

            api = container "api" "NestJS 11 / Node 24 / TypeScript. Único punto de entrada HTTP. 191 controllers, 60 módulos." "NestJS/Express"

            workerMessaging = container "worker-messaging" "Drena el outbox transaccional: reclama, despacha, registra acuse." "NestJS ApplicationContext"
            workerBilling = container "worker-billing" "Dunning y facturación periódica." "NestJS ApplicationContext"
            workerOthers = container "otros 15 workers" "Un proceso por dominio: automation, consent, cross_store_consistency, delegated_access, health_context, identity_assurance, integrations, pharmacy_inventory, promotions, qa_lab, read_models, reporting, scheduling, tracking, workflow." "NestJS ApplicationContext"

            postgres = container "PostgreSQL" "Almacén transaccional primario. 1184 entidades, Row-Level Security por tenant." "PostgreSQL" "Database"
            mongo = container "MongoDB" "Documentos no relacionales (document_store)." "MongoDB" "Database"
            redis = container "Redis" "Estado efímero/caché (redis_runtime)." "Redis" "Database"
            opensearch = container "OpenSearch" "Búsqueda e indexación (search_platform)." "OpenSearch" "Database"
            minio = container "MinIO" "Almacenamiento de objetos S3-compatible (object_storage), incluye DICOM." "MinIO" "Database"

            # Componentes del dominio authz (C4 nivel 3 — hub de autorización)
            authzController = component "Authz Controllers" "7 controllers: políticas, roles, permisos, accesos clínicos." "NestJS Controller" "authz"
            authzPdp = component "AuthzPdpService" "Evaluación de decisión: rol + alcance clínico + rango de acción vs. nivel de grant." "NestJS Service" "authz"
            authzClinical = component "AuthzClinicalService" "Relación asistencial, representación legal, alcance." "NestJS Service" "authz"
            authzRepos = component "Authz Repositories" "14 repositories: Roles, Permissions, ClinicalAccessGrants, CareRelationships, ResourceScopeGrants, ..." "NestJS Repository" "authz"
        }

        patient -> api "HTTPS + JWT Bearer"
        clinician -> api "HTTPS + JWT Bearer"
        adminStaff -> api "HTTPS + JWT Bearer"
        externalSystem -> api "Webhooks entrantes (firma), llamadas salientes de integrations/payments"

        api -> postgres "MikroORM / SQL"
        api -> mongo "driver mongodb"
        api -> redis "ioredis"
        api -> opensearch "HTTP"
        api -> minio "S3 API"
        api -> postgres "INSERT outbox (mismo commit que el cambio de dominio)"

        workerMessaging -> api "HTTP interno /internal/queues, /internal/events (JWT de servicio)"
        workerBilling -> api "HTTP interno /internal/* (JWT de servicio)"
        workerOthers -> api "HTTP interno /internal/* (JWT de servicio)"

        api -> authzController "enruta"
        authzController -> authzPdp "evalúa decisión"
        authzController -> authzClinical "consulta alcance"
        authzPdp -> authzRepos "lee grants/relaciones"
        authzClinical -> authzRepos "lee relaciones asistenciales"
        authzRepos -> postgres "SQL (schema authz)"
    }

    views {
        systemContext redesa "SystemContext" "C4 nivel 1 — docs/architecture/system-context.md" {
            include *
            autoLayout
        }

        container redesa "Containers" "C4 nivel 2 — docs/architecture/containers.md" {
            include *
            autoLayout
        }

        component authzController "AuthzComponents" "C4 nivel 3 — docs/architecture/components.md" {
            include authzController authzPdp authzClinical authzRepos postgres
            autoLayout
        }

        styles {
            element "Person" {
                shape person
                background #08427b
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Database" {
                shape cylinder
            }
            element "authz" {
                background #e0234d
                color #ffffff
            }
        }
    }
}

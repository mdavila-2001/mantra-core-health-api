-- SALUD v4.0.1 · módulo 35 · schema messaging
-- Generado de diagram_35_messaging.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "messaging"."outbox_messages"
        ADD CONSTRAINT "fk_outbox_messages_domain_event_id" FOREIGN KEY ("domain_event_id")
        REFERENCES "messaging"."domain_events" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messaging"."event_deliveries"
        ADD CONSTRAINT "fk_event_deliveries_domain_event_id" FOREIGN KEY ("domain_event_id")
        REFERENCES "messaging"."domain_events" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messaging"."in_app_notifications"
        ADD CONSTRAINT "fk_in_app_notifications_notification_request_id" FOREIGN KEY ("notification_request_id")
        REFERENCES "messaging"."notification_requests" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messaging"."in_app_notifications"
        ADD CONSTRAINT "fk_in_app_notifications_notification_delivery_id" FOREIGN KEY ("notification_delivery_id")
        REFERENCES "messaging"."notification_deliveries" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messaging"."notification_requests"
        ADD CONSTRAINT "fk_notification_requests_domain_event_id" FOREIGN KEY ("domain_event_id")
        REFERENCES "messaging"."domain_events" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messaging"."notification_deliveries"
        ADD CONSTRAINT "fk_notification_deliveries_notification_request_id" FOREIGN KEY ("notification_request_id")
        REFERENCES "messaging"."notification_requests" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messaging"."notification_deliveries"
        ADD CONSTRAINT "fk_notification_deliveries_provider_channel_config_id" FOREIGN KEY ("provider_channel_config_id")
        REFERENCES "messaging"."provider_channel_configs" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messaging"."adapter_inbound_events"
        ADD CONSTRAINT "fk_adapter_inbound_events_provider_channel_config_id" FOREIGN KEY ("provider_channel_config_id")
        REFERENCES "messaging"."provider_channel_configs" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messaging"."delivery_reconciliation_runs"
        ADD CONSTRAINT "fk_delivery_reconciliation_runs_provider_channel_config_id" FOREIGN KEY ("provider_channel_config_id")
        REFERENCES "messaging"."provider_channel_configs" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "messaging"."delivery_tracking_events"
        ADD CONSTRAINT "fk_delivery_tracking_events_notification_request_id" FOREIGN KEY ("notification_request_id")
        REFERENCES "messaging"."notification_requests" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

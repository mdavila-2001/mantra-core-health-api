-- SALUD v4.0.1 · módulo 19 · schema community
-- Generado de diagram_19_community.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "community"."social_posts"
        ADD CONSTRAINT "fk_social_posts_author_public_profile_id" FOREIGN KEY ("author_public_profile_id")
        REFERENCES "community"."public_profiles" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."service_reviews"
        ADD CONSTRAINT "fk_service_reviews_target_public_profile_id" FOREIGN KEY ("target_public_profile_id")
        REFERENCES "community"."public_profiles" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."review_responses"
        ADD CONSTRAINT "fk_review_responses_responder_public_profile_id" FOREIGN KEY ("responder_public_profile_id")
        REFERENCES "community"."public_profiles" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."comments"
        ADD CONSTRAINT "fk_comments_parent_comment_id" FOREIGN KEY ("parent_comment_id")
        REFERENCES "community"."comments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."comments"
        ADD CONSTRAINT "fk_comments_root_comment_id" FOREIGN KEY ("root_comment_id")
        REFERENCES "community"."comments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."hashtags"
        ADD CONSTRAINT "fk_hashtags_topic_id" FOREIGN KEY ("topic_id")
        REFERENCES "community"."topics" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."topics"
        ADD CONSTRAINT "fk_topics_parent_topic_id" FOREIGN KEY ("parent_topic_id")
        REFERENCES "community"."topics" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."content_hashtags"
        ADD CONSTRAINT "fk_content_hashtags_hashtag_id" FOREIGN KEY ("hashtag_id")
        REFERENCES "community"."hashtags" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."groups"
        ADD CONSTRAINT "fk_groups_topic_id" FOREIGN KEY ("topic_id")
        REFERENCES "community"."topics" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."group_members"
        ADD CONSTRAINT "fk_group_members_group_id" FOREIGN KEY ("group_id")
        REFERENCES "community"."groups" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."post_shares"
        ADD CONSTRAINT "fk_post_shares_target_group_id" FOREIGN KEY ("target_group_id")
        REFERENCES "community"."groups" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."poll_options"
        ADD CONSTRAINT "fk_poll_options_poll_id" FOREIGN KEY ("poll_id")
        REFERENCES "community"."polls" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."poll_votes"
        ADD CONSTRAINT "fk_poll_votes_poll_id" FOREIGN KEY ("poll_id")
        REFERENCES "community"."polls" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."poll_votes"
        ADD CONSTRAINT "fk_poll_votes_poll_option_id" FOREIGN KEY ("poll_option_id")
        REFERENCES "community"."poll_options" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."conversations"
        ADD CONSTRAINT "fk_conversations_group_id" FOREIGN KEY ("group_id")
        REFERENCES "community"."groups" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."conversation_participants"
        ADD CONSTRAINT "fk_conversation_participants_conversation_id" FOREIGN KEY ("conversation_id")
        REFERENCES "community"."conversations" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."direct_messages"
        ADD CONSTRAINT "fk_direct_messages_conversation_id" FOREIGN KEY ("conversation_id")
        REFERENCES "community"."conversations" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."message_receipts"
        ADD CONSTRAINT "fk_message_receipts_direct_message_id" FOREIGN KEY ("direct_message_id")
        REFERENCES "community"."direct_messages" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."moderation_queue"
        ADD CONSTRAINT "fk_moderation_queue_content_report_id" FOREIGN KEY ("content_report_id")
        REFERENCES "community"."content_reports" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."moderation_decisions"
        ADD CONSTRAINT "fk_moderation_decisions_moderation_queue_id" FOREIGN KEY ("moderation_queue_id")
        REFERENCES "community"."moderation_queue" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."moderation_strikes"
        ADD CONSTRAINT "fk_moderation_strikes_moderation_decision_id" FOREIGN KEY ("moderation_decision_id")
        REFERENCES "community"."moderation_decisions" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "community"."moderation_appeals"
        ADD CONSTRAINT "fk_moderation_appeals_moderation_decision_id" FOREIGN KEY ("moderation_decision_id")
        REFERENCES "community"."moderation_decisions" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

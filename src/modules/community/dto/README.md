# DTOs — Community

Request DTOs (`class-validator` + `@nestjs/swagger`) y response DTOs (solo campos
seguros; las reviews nunca exponen `verified_encounter_id`). Los tipos/estados se
reciben como enums legibles y el servicio los mapea a `*_concept_id` vía los
records de `community.concepts.ts`.

- Request: `public-profile`, `post`, `comment`, `reaction`, `bookmark`, `follow`,
  `block`, `conversation` (crear/mensaje/leído), `report`, `moderation-decision`,
  `appeal`, `review`, `poll` (crear/voto), `group` (crear/unirse), `feed`.
- Response: `responses.dto.ts` (`IdResponseDto`, `PostResponseDto`,
  `CommentResponseDto`, `ReactionResponseDto`, `ModerationDecisionResponseDto`,
  `ReviewResponseDto`, etc.).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS talent_subject_trait_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL DEFAULT 'deanagent',
  source_record_type text NOT NULL CHECK (source_record_type IN ('scholar', 'student', 'academic_student')),
  source_record_id text NOT NULL CHECK (length(btrim(source_record_id)) > 0),
  entity_type text NOT NULL CHECK (entity_type IN ('student', 'expert')),
  affiliation_scope text NOT NULL CHECK (affiliation_scope IN ('internal', 'external', 'unknown')),
  student_stage text CHECK (student_stage IS NULL OR student_stage IN ('internal', 'applied', 'potential', 'unknown')),
  relationship_traits jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(relationship_traits) = 'array'),
  human_judgments jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(human_judgments) = 'array'),
  confirmed_by text NOT NULL CHECK (length(btrim(confirmed_by)) > 0),
  confirmed_at timestamptz NOT NULL,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_to > valid_from),
  CHECK (
    (entity_type = 'student' AND student_stage IS NOT NULL)
    OR (entity_type = 'expert' AND student_stage IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_talent_subject_current_traits
  ON talent_subject_trait_sets (source_system, source_record_type, source_record_id)
  WHERE valid_to IS NULL;

CREATE INDEX IF NOT EXISTS ix_talent_subject_traits_history
  ON talent_subject_trait_sets (source_system, source_record_type, source_record_id, valid_from DESC);

CREATE TABLE IF NOT EXISTS portrait_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trait_set_id uuid NOT NULL REFERENCES talent_subject_trait_sets(id),
  source_system text NOT NULL DEFAULT 'deanagent',
  source_record_type text NOT NULL CHECK (source_record_type IN ('scholar', 'student', 'academic_student')),
  source_record_id text NOT NULL,
  portrait_type text NOT NULL CHECK (portrait_type IN ('potential_student', 'external_expert')),
  rubric_version text NOT NULL,
  prompt_version text NOT NULL,
  prompt_hash text NOT NULL,
  model_provider text NOT NULL,
  model_name text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'insufficient', 'needs_review', 'failed')),
  idempotency_key text NOT NULL UNIQUE,
  trait_snapshot jsonb NOT NULL,
  input_snapshot jsonb,
  input_hash text,
  output_snapshot jsonb,
  output_hash text,
  core_conclusion text,
  weighted_score numeric(5,2) CHECK (weighted_score IS NULL OR weighted_score BETWEEN 0 AND 100),
  evidence_coverage numeric(6,5) CHECK (evidence_coverage IS NULL OR evidence_coverage BETWEEN 0 AND 1),
  recommendation_level text CHECK (recommendation_level IS NULL OR recommendation_level IN ('优先', '次优先', '待观察')),
  contact_available boolean,
  requested_by text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_by text,
  lease_expires_at timestamptz,
  error_code text,
  error_message text,
  queued_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_portrait_assessments_subject_history
  ON portrait_assessments (source_system, source_record_type, source_record_id, portrait_type, completed_at DESC NULLS LAST, created_at DESC);

CREATE INDEX IF NOT EXISTS ix_portrait_assessments_queue
  ON portrait_assessments (status, next_attempt_at, queued_at)
  WHERE status IN ('queued', 'running');

CREATE TABLE IF NOT EXISTS portrait_dimension_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES portrait_assessments(id) ON DELETE CASCADE,
  section_code text NOT NULL,
  dimension_code text NOT NULL,
  dimension_label text NOT NULL,
  display_order integer NOT NULL CHECK (display_order >= 0),
  weight numeric(6,5) CHECK (weight IS NULL OR weight BETWEEN 0 AND 1),
  evidence_state text NOT NULL CHECK (evidence_state IN ('positive', 'insufficient', 'negative')),
  review_state text NOT NULL DEFAULT 'clear' CHECK (review_state IN ('clear', 'conflict')),
  evaluation_method text NOT NULL CHECK (evaluation_method IN ('model_data', 'human_judgment', 'hybrid')),
  score numeric(5,2) CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  confidence numeric(6,5) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  conclusion text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(evidence) = 'array'),
  missing_inputs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(missing_inputs) = 'array'),
  conflict_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, section_code, dimension_code),
  CHECK (evidence_state <> 'insufficient' OR (score IS NULL AND confidence IS NULL)),
  CHECK (evaluation_method <> 'human_judgment' OR score IS NULL),
  CHECK (review_state <> 'conflict' OR conflict_reason IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS ix_portrait_dimensions_analysis
  ON portrait_dimension_results (dimension_code, score)
  WHERE score IS NOT NULL;

CREATE OR REPLACE VIEW latest_portrait_assessments AS
SELECT DISTINCT ON (source_system, source_record_type, source_record_id, portrait_type) *
FROM portrait_assessments
WHERE status IN ('completed', 'insufficient', 'needs_review')
ORDER BY source_system, source_record_type, source_record_id, portrait_type,
         completed_at DESC NULLS LAST, created_at DESC;

CREATE OR REPLACE VIEW current_portrait_dimensions AS
SELECT d.*
FROM portrait_dimension_results d
JOIN latest_portrait_assessments a ON a.id = d.assessment_id;

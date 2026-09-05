import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import pg from "pg";
import { runMigrations } from "../src/migrations.js";
import { PortraitRepository } from "../src/repository.js";

const connectionString = process.env.TEST_DATABASE_URL;

test("fresh migration creates constraints, indexes, views, and idempotent persistence", {
  skip: connectionString ? false : "TEST_DATABASE_URL is not configured",
}, async () => {
  const schema = `portrait_test_${randomUUID().replaceAll("-", "")}`;
  const database = new pg.Pool({ connectionString, max: 1 });
  try {
    await database.query(`CREATE SCHEMA ${schema}`);
    await database.query(`SET search_path TO ${schema}, public`);
    assert.deepEqual(await runMigrations(database), ["001_portrait_business_schema.sql"]);
    assert.deepEqual(await runMigrations(database), []);

    const objects = await database.query<{ name: string }>(
      `SELECT relname AS name FROM pg_class
       WHERE relnamespace = $1::regnamespace
         AND relname IN (
           'talent_subject_trait_sets', 'portrait_assessments', 'portrait_dimension_results',
           'latest_portrait_assessments', 'current_portrait_dimensions',
           'uq_talent_subject_current_traits', 'ix_portrait_assessments_queue',
           'ix_portrait_dimensions_analysis'
         )`,
      [schema],
    );
    assert.equal(new Set(objects.rows.map((row) => row.name)).size, 8);

    const repository = new PortraitRepository(database);
    const traits = await repository.replaceTraits("student", "student-1", {
      entity_type: "student",
      affiliation_scope: "external",
      student_stage: "potential",
      relationship_traits: [],
      human_judgments: [],
      confirmed_by: "integration-test",
      confirmed_at: "2026-09-05T00:00:00.000Z",
    });
    const args = {
      traits,
      portraitType: "potential_student" as const,
      rubricVersion: "v1.2",
      promptVersion: "v1.2",
      promptHash: "hash",
      modelProvider: "test",
      modelName: "test-model",
      idempotencyKey: "integration-key",
      requestedBy: "integration-test",
    };
    assert.equal((await repository.enqueueAssessment(args)).created, true);
    assert.equal((await repository.enqueueAssessment(args)).created, false);

    await assert.rejects(
      database.query(
        `INSERT INTO portrait_dimension_results (
           assessment_id, section_code, dimension_code, dimension_label, display_order,
           evidence_state, evaluation_method, score, confidence, conclusion
         ) VALUES (
           (SELECT id FROM portrait_assessments LIMIT 1), 'test', 'invalid', 'Invalid', 0,
           'insufficient', 'model_data', 0, NULL, 'Invalid zero score'
         )`,
      ),
    );
  } finally {
    await database.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await database.end();
  }
});

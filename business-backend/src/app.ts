import Fastify, { type FastifyInstance } from "fastify";
import { z, ZodError } from "zod";
import type { AppConfig } from "./config.js";
import { isModelConfigured } from "./config.js";
import { sourceRecordTypeSchema, traitWriteSchema } from "./domain.js";
import { AppError } from "./errors.js";
import { loadPromptDefinition } from "./prompts.js";
import type { PortraitRepository } from "./repository.js";
import { PROMPT_VERSION, RUBRIC_VERSION, routePortrait } from "./rubrics.js";
import { sanitizeForAnalysis } from "./utils.js";

const subjectParamsSchema = z.object({
  recordType: sourceRecordTypeSchema,
  recordId: z.string().trim().min(1).max(500),
});

const assessmentParamsSchema = z.object({ id: z.string().uuid() });
const enqueueBodySchema = z.object({
  source_record_type: sourceRecordTypeSchema,
  source_record_id: z.string().trim().min(1).max(500),
  requested_by: z.string().trim().min(1).max(200),
}).strict();

function assertRecordMatchesEntity(recordType: z.infer<typeof sourceRecordTypeSchema>, entityType: string): void {
  const compatible = recordType === "scholar" ? entityType === "expert" : entityType === "student";
  if (!compatible) {
    throw new AppError(
      "UNSUPPORTED_TRAIT_COMBINATION",
      `${recordType} records cannot be confirmed as ${entityType}`,
      false,
      422,
    );
  }
}

function portraitForTraits(recordType: z.infer<typeof sourceRecordTypeSchema>, traits: Parameters<typeof routePortrait>[0]) {
  assertRecordMatchesEntity(recordType, traits.entity_type);
  try {
    return routePortrait(traits);
  } catch {
    throw new AppError(
      "UNSUPPORTED_TRAIT_COMBINATION",
      "Only confirmed potential students and confirmed external experts can be assessed",
      false,
      422,
    );
  }
}

export type AppRepository = Pick<
  PortraitRepository,
  "ping" | "replaceTraits" | "getCurrentTraits" | "enqueueAssessment" | "getAssessment" | "getLatestAssessment"
>;

export function createApp(config: AppConfig, repository: AppRepository): FastifyInstance {
  const app = Fastify({
    logger: {
      redact: ["req.headers.authorization", "req.headers.x-api-key", "body.LLM_API_KEY"],
    },
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      void reply.status(422).send({
        error: { code: "VALIDATION_ERROR", message: "Request validation failed", details: error.issues },
      });
      return;
    }
    if (error instanceof AppError) {
      void reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
      return;
    }
    if (error instanceof Error && error.message === "IDEMPOTENCY_KEY_CONFLICT") {
      void reply.status(409).send({
        error: { code: "IDEMPOTENCY_KEY_CONFLICT", message: "Idempotency-Key is already used by another assessment" },
      });
      return;
    }
    const databaseError = error as Error & { code?: string; syscall?: string };
    if (databaseError.code === "ECONNREFUSED" || databaseError.code === "57P03" || databaseError.code === "42P01") {
      void reply.status(503).send({ error: { code: "DATABASE_UNAVAILABLE", message: "Portrait storage is unavailable. Start PostgreSQL and run the business migration." } });
      return;
    }
    app.log.error(error);
    void reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  });

  app.get("/health", async (_request, reply) => {
    try {
      await repository.ping();
      return { status: "ok", database: "ok", model_configured: isModelConfigured(config) };
    } catch {
      return reply.status(503).send({ status: "unavailable", database: "unavailable", model_configured: isModelConfigured(config) });
    }
  });

  app.put("/api/subjects/:recordType/:recordId/traits", async (request, reply) => {
    const params = subjectParamsSchema.parse(request.params);
    const parsed = traitWriteSchema.parse(request.body);
    const traits = traitWriteSchema.parse(sanitizeForAnalysis(parsed));
    assertRecordMatchesEntity(params.recordType, traits.entity_type);
    const result = await repository.replaceTraits(params.recordType, params.recordId, traits);
    return reply.status(200).send(result);
  });

  app.get("/api/subjects/:recordType/:recordId/traits", async (request) => {
    const params = subjectParamsSchema.parse(request.params);
    const traits = await repository.getCurrentTraits(params.recordType, params.recordId);
    if (!traits) throw new AppError("TRAITS_NOT_FOUND", "No current confirmed traits were found", false, 404);
    return traits;
  });

  app.post("/api/portrait-assessments", async (request, reply) => {
    if (!isModelConfigured(config)) {
      throw new AppError("MODEL_NOT_CONFIGURED", "The portrait model is not configured", false, 503);
    }
    const idempotencyKey = z.string().trim().min(1).max(500).parse(request.headers["idempotency-key"]);
    const body = enqueueBodySchema.parse(request.body);
    const traits = await repository.getCurrentTraits(body.source_record_type, body.source_record_id);
    if (!traits) throw new AppError("TRAITS_NOT_FOUND", "Confirmed traits are required before analysis", false, 422);
    const portraitType = portraitForTraits(body.source_record_type, traits);
    const prompt = await loadPromptDefinition(portraitType);
    const result = await repository.enqueueAssessment({
      traits,
      portraitType,
      rubricVersion: RUBRIC_VERSION,
      promptVersion: PROMPT_VERSION,
      promptHash: prompt.hash,
      modelProvider: config.llmProvider,
      modelName: config.llmModel!,
      idempotencyKey,
      requestedBy: body.requested_by,
    });
    return reply.status(202).send({
      id: String(result.assessment.id),
      status: String(result.assessment.status),
      created: result.created,
    });
  });

  app.get("/api/portrait-assessments/:id", async (request) => {
    const params = assessmentParamsSchema.parse(request.params);
    const assessment = await repository.getAssessment(params.id);
    if (!assessment) throw new AppError("ASSESSMENT_NOT_FOUND", "Assessment was not found", false, 404);
    return assessment;
  });

  app.get("/api/subjects/:recordType/:recordId/portraits/latest", async (request) => {
    const params = subjectParamsSchema.parse(request.params);
    const assessment = await repository.getLatestAssessment(params.recordType, params.recordId);
    if (!assessment) throw new AppError("ASSESSMENT_NOT_FOUND", "No terminal assessment was found", false, 404);
    return assessment;
  });

  return app;
}

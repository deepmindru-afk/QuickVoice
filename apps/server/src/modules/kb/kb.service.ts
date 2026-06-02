import { BadRequestError } from "../../common/errors/badRequest.js";
import { NotFoundError } from "../../common/errors/notFound.js";
import * as kbRepository from "./kb.repository.js";
import { kbQueue } from "../../queues/kb.queue.js";
import type { CreateKbArgs, ListKbArgs } from "./kb.schema.js";

export const createKnowledgeSources = async (args: CreateKbArgs) => {
  if (!args.agentId) {
    throw new BadRequestError("An agent must be selected — KB sources require an agent for vector storage");
  }
  const { rows, docs } = await kbRepository.createKnowledgeSources(args);

  await kbQueue.add("process", {
    kbIds: rows.map((r) => r.kbId),
    agentId: args.agentId,
    organizationId: args.organizationId,
    documents: docs.map((d, i) => ({
      kbId: rows[i]!.kbId,
      name: d.name,
      sourceType: rows[i]!.sourceType,
      url: d.url ?? null,
      s3Key: d.s3Key ?? null,
      originalFileName: args.documents[i]?.originalFileName ?? null,
    })),
  });

  return rows;
};

export const listKnowledgeSources = async (args: ListKbArgs) => {
  return kbRepository.listByOrg(args);
};

export const deleteKnowledgeSource = async (
  organizationId: string,
  kbId: string
) => {
  // TODO: add S3 object + Pinecone vector cleanup.
  const deleted = await kbRepository.deleteKnowledgeSource(kbId, organizationId);
  if (!deleted) {
    throw new NotFoundError("Knowledge source not found");
  }
  return deleted;
};

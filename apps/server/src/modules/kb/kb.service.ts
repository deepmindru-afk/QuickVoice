import { NotFoundError } from "../../common/errors/notFound.js";
import { inngest } from "../../config/inngest.js";
import * as kbRepository from "./kb.repository.js";
import type { CreateKbArgs, ListKbArgs } from "./kb.schema.js";

export const createKnowledgeSources = async (args: CreateKbArgs) => {
  const { rows, docs } = await kbRepository.createKnowledgeSources(args);

  await inngest.send({
    name: "kb/documents.created",
    data: {
      agentId: args.agentId,
      organizationId: args.organizationId,
      documents: docs,
    },
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
  const deleted = await kbRepository.deleteKnowledgeSource(
    kbId,
    organizationId
  );
  if (!deleted) {
    throw new NotFoundError("Knowledge source not found");
  }
  return deleted;
};

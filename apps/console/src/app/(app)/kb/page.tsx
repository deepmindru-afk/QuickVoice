"use client";

import { BookOpen } from "lucide-react";

import { PageHeader } from "@/src/components/common/PageHeader";
import { EmptyState } from "@/src/components/common/EmptyState";
import { UploadDialog } from "@/src/components/kb/UploadDialog";
import { KbTable } from "@/src/components/kb/KbTable";
import { useKbSources } from "@/src/hooks/queries/kb";
import { useAgents } from "@/src/hooks/queries/agents";

export default function KbPage() {
  const { data: sources = [], isLoading } = useKbSources();
  const { data: agents } = useAgents();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Knowledge base"
        description="Documents your agents can reference when RAG is enabled."
        actions={<UploadDialog />}
      />

      {!isLoading && sources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No documents yet"
          description="Upload a file or paste a URL to create a knowledge source, then attach it to an agent."
          action={<UploadDialog />}
        />
      ) : (
        <KbTable sources={sources} agents={agents} isLoading={isLoading} />
      )}
    </div>
  );
}

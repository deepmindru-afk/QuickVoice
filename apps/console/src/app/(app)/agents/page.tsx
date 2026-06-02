"use client";

import { Bot } from "lucide-react";
import { PageHeader } from "@/src/components/common/PageHeader";
import { EmptyState } from "@/src/components/common/EmptyState";
import { AgentsTable } from "@/src/components/agents/AgentsTable";
import { NewAgentDialog } from "@/src/components/agents/NewAgentDialog";
import { useAgents } from "@/src/hooks/queries/agents";

export default function AgentsPage() {
    const { data: agents = [], isLoading } = useAgents();

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Agents"
                description="Voice agents you can deploy to phone numbers."
                actions={<NewAgentDialog />}
            />

            {!isLoading && agents.length === 0 ? (
                <EmptyState
                    icon={Bot}
                    title="No agents yet"
                    description="Create your first voice agent and connect it to a phone number."
                    action={<NewAgentDialog />}
                />
            ) : (
                <AgentsTable agents={agents} isLoading={isLoading} />
            )}
        </div>
    );
}

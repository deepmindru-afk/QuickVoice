"use client";

import Link from "next/link";
import { authClient } from "@/src/lib/auth-client";
import { Building2, Plus, Users } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function Orgs() {
  const { data: organizations } = authClient.useListOrganizations(); 
  
  if (!organizations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your workspaces and team collaborations
          </p>
        </div>
        <Link href="/orgs/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Organization
          </Button>
        </Link>
      </div>

      {organizations.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No organizations yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create your first organization to start collaborating with your team.
          </p>
          <Link href="/orgs">
            <Button>Create your first organization</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/orgs/${org.id}?orgSlug=${org.slug}`}
              className="block group"
            >
              <div className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-all duration-200 group-hover:border-primary/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {org.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  @{org.slug}
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Members</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

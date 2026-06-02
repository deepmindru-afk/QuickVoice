"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Skeleton } from "@/src/components/ui/skeleton";
import { SOURCE_META, FALLBACK_META, StatusChip } from "@/src/components/kb/kb-utils";
import { useDeleteKb } from "@/src/hooks/queries/kb";
import type { Agent, KnowledgeSource } from "@/src/lib/api/types";
import { cn } from "@/src/lib/utils";

const PAGE_SIZE = 10;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SortableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <TableHead className={cn("whitespace-nowrap", className)}>
      <span className="inline-flex items-center gap-1.5">
        {children}
        <ArrowUpDown className="size-3 text-muted-foreground/50" />
      </span>
    </TableHead>
  );
}

function DeleteRow({ kbId, name }: { kbId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const del = useDeleteKb();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Row actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the document from any agents currently referencing it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { await del.mutateAsync(kbId); setOpen(false); }}
              disabled={del.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {del.isPending ? <><Loader2 className="animate-spin" /> Deleting…</> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface Props {
  sources: KnowledgeSource[];
  agents: Agent[] | undefined;
  isLoading: boolean;
}

export function KbTable({ sources, agents, isLoading }: Props) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const agentName = (id: string | null) =>
    agents?.find((a) => a.agentId === id)?.name ?? null;

  const totalPages = Math.max(1, Math.ceil(sources.length / PAGE_SIZE));
  const slice = sources.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allSelected = slice.length > 0 && slice.every((s) => selected.has(s.kbId));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(slice.map((s) => s.kbId)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b bg-muted/20 hover:bg-muted/20">
              <TableHead className="w-12 pl-4">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
              </TableHead>
              <TableHead className="w-12">Type</TableHead>
              <SortableHead>Name</SortableHead>
              <SortableHead className="w-32">Status</SortableHead>
              <SortableHead className="w-36">Agent</SortableHead>
              <SortableHead className="w-32">Uploaded</SortableHead>
              <SortableHead className="w-32">Indexed</SortableHead>
              <TableHead className="w-14 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((s) => {
              const { Icon, iconCls } = SOURCE_META[s.sourceType] ?? FALLBACK_META;
              const agent = agentName(s.agentId);
              return (
                <TableRow
                  key={s.kbId}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/10",
                    selected.has(s.kbId) && "bg-primary/5"
                  )}
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selected.has(s.kbId)}
                      onCheckedChange={() => toggleOne(s.kbId)}
                      aria-label="Select row"
                    />
                  </TableCell>

                  {/* type icon */}
                  <TableCell>
                    <div className={`flex size-8 items-center justify-center rounded border ${iconCls}`}>
                      <Icon className="size-4" />
                    </div>
                  </TableCell>

                  {/* name + filename */}
                  <TableCell>
                    <p className="max-w-[260px] truncate font-medium text-sm">{s.name}</p>
                    {s.originalFileName ? (
                      <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                        {s.originalFileName}
                      </p>
                    ) : null}
                  </TableCell>

                  <TableCell><StatusChip status={s.status} /></TableCell>

                  <TableCell className="text-sm">
                    {agent ? (
                      <span className="text-foreground/80">{agent}</span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {fmtDate(s.uploadedAt)}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {s.status === "ACTIVE" ? fmtDate(s.lastIndexedAt) : "—"}
                  </TableCell>

                  <TableCell className="pr-4 text-right">
                    <DeleteRow kbId={s.kbId} name={s.name} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* pagination bar */}
      <div className="flex items-center justify-between gap-2 px-1 text-sm text-muted-foreground">
        <span className="shrink-0">
          {selected.size} of {sources.length} row(s) selected.
        </span>
        <div className="flex items-center gap-4">
          <span className="whitespace-nowrap font-medium text-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-0.5">
            <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(1)} disabled={page <= 1} aria-label="First page">
              <ChevronsLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => setPage(totalPages)} disabled={page >= totalPages} aria-label="Last page">
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

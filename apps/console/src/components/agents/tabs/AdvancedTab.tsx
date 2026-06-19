"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import {
 Form,
 FormControl,
 FormDescription,
 FormField,
 FormItem,
 FormLabel,
} from "@/src/components/ui/form";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
 useAgentConfig,
 useSaveAgentConfig,
 useUpdateAgent,
} from "@/src/hooks/queries/agents";
import { mergeConfig } from "@/src/lib/agents/config-defaults";

const schema = z.object({
 use_rag: z.boolean(),
 preemptive_generation: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function AdvancedTab({ agentId }: { agentId: string }) {
 const { data: config, isLoading } = useAgentConfig(agentId);
 const save = useSaveAgentConfig(agentId);
 const update = useUpdateAgent(agentId);
 const [confirming, setConfirming] = useState(false);

 const form = useForm<FormValues>({
 resolver: zodResolver(schema),
 defaultValues: { use_rag: false, preemptive_generation: false },
 });

 useEffect(() => {
 if (!config) return;
 form.reset({
 use_rag: config.use_rag,
 preemptive_generation: config.preemptive_generation,
 });
 }, [config, form]);

 async function onSubmit(values: FormValues) {
 await save.mutateAsync(mergeConfig(config, values));
 }

 async function pauseAgent() {
 await update.mutateAsync({ isActive: false });
 toast.success("Agent paused");
 }

 async function resumeAgent() {
 await update.mutateAsync({ isActive: true });
 toast.success("Agent resumed");
 }

 return (
 <div className="space-y-8">
 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
 <section className="border bg-card p-6">
 <div className="mb-5 space-y-1">
 <h2 className="text-base font-semibold">Runtime features</h2>
 <p className="text-sm text-muted-foreground">
 Opt-in behaviors that affect latency and cost.
 </p>
 </div>
 <div className="space-y-3">
 <FormField
 control={form.control}
 name="use_rag"
 render={({ field }) => (
 <FormItem className="flex items-center justify-between border p-4">
 <div className="space-y-0.5">
 <FormLabel>Enable RAG</FormLabel>
 <FormDescription>
 Retrieve attached knowledge-base documents during the
 call.
 </FormDescription>
 </div>
 <FormControl>
 <Switch
 checked={field.value}
 onCheckedChange={field.onChange}
 />
 </FormControl>
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="preemptive_generation"
 render={({ field }) => (
 <FormItem className="flex items-center justify-between border p-4">
 <div className="space-y-0.5">
 <FormLabel>Preemptive generation</FormLabel>
 <FormDescription>
 Start generating the next response before the caller
 finishes speaking. Lower latency, higher cost.
 </FormDescription>
 </div>
 <FormControl>
 <Switch
 checked={field.value}
 onCheckedChange={field.onChange}
 />
 </FormControl>
 </FormItem>
 )}
 />
 </div>
 </section>

 <div className="flex items-center justify-end gap-3">
 <Button
 type="submit"
 disabled={save.isPending || isLoading || !form.formState.isDirty}
 >
 {save.isPending ? (
 <>
 <Loader2 className="animate-spin" /> Saving…
 </>
 ) : (
 <>
 <Save /> Save
 </>
 )}
 </Button>
 </div>
 </form>
 </Form>

 <section className="border border-destructive/30 bg-destructive/5 p-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="space-y-1">
 <h2 className="text-base font-semibold text-destructive">
 Danger zone
 </h2>
 <p className="text-sm text-muted-foreground">
 Pausing stops the agent from taking new calls. Active calls
 continue.
 </p>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" onClick={pauseAgent} disabled={update.isPending}>
 Pause agent
 </Button>
 <Button variant="outline" onClick={resumeAgent} disabled={update.isPending}>
 Resume agent
 </Button>
 <AlertDialog open={confirming} onOpenChange={setConfirming}>
 <AlertDialogTrigger asChild>
 <Button variant="destructive">
 <Trash2 /> Delete
 </Button>
 </AlertDialogTrigger>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Delete this agent?</AlertDialogTitle>
 <AlertDialogDescription>
 Delete is not yet supported via API. Pause the agent to
 stop it from taking calls.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Close</AlertDialogCancel>
 <AlertDialogAction disabled>Delete</AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </div>
 </div>
 </section>
 </div>
 );
}

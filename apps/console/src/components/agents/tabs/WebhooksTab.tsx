"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import { Label } from "@/src/components/ui/label";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/src/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import {
    useAgentConfig,
    useSaveAgentConfig,
} from "@/src/hooks/queries/agents";
import { mergeConfig } from "@/src/lib/agents/config-defaults";

const schema = z.object({
    initiation_enabled: z.boolean(),
    initiation_url: z.string().url().or(z.literal("")),
    initiation_method: z.enum(["GET", "POST"]),
    post_enabled: z.boolean(),
    post_url: z.string().url().or(z.literal("")),
    post_transcript: z.boolean(),
    post_audio: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function WebhooksTab({ agentId }: { agentId: string }) {
    const { data: config, isLoading } = useAgentConfig(agentId);
    const save = useSaveAgentConfig(agentId);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            initiation_enabled: false,
            initiation_url: "",
            initiation_method: "POST",
            post_enabled: false,
            post_url: "",
            post_transcript: true,
            post_audio: false,
        },
    });

    useEffect(() => {
        if (!config) return;
        const init = config.initiation_webhook;
        const post = config.post_call_webhook;
        form.reset({
            initiation_enabled: !!init,
            initiation_url: init?.webhook_url ?? "",
            initiation_method: (init?.method as "GET" | "POST") ?? "POST",
            post_enabled: !!post,
            post_url: post?.webhook_url ?? "",
            post_transcript: post?.transcript ?? true,
            post_audio: post?.audio_url ?? false,
        });
    }, [config, form]);

    async function onSubmit(v: FormValues) {
        const initiation_webhook = v.initiation_enabled
            ? { webhook_url: v.initiation_url, method: v.initiation_method }
            : null;
        const post_call_webhook = v.post_enabled
            ? {
                webhook_url: v.post_url,
                method: "POST" as const,
                transcript: v.post_transcript,
                audio_url: v.post_audio,
            }
            : null;
        await save.mutateAsync(
            mergeConfig(config, { initiation_webhook, post_call_webhook })
        );
    }

    const initiationOn = form.watch("initiation_enabled");
    const postOn = form.watch("post_enabled");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="border bg-card p-6">
                    <div className="mb-5 flex items-start justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold">Initiation webhook</h2>
                            <p className="text-sm text-muted-foreground">
                                Fetched at call start — use it to inject caller context into
                                the agent prompt and variables.
                            </p>
                        </div>
                        <FormField
                            control={form.control}
                            name="initiation_enabled"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-3">
                                    <Label className="text-xs">Enabled</Label>
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
                    <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                        <FormField
                            control={form.control}
                            name="initiation_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://api.yourapp.com/webhooks/initiation"
                                            disabled={!initiationOn}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="initiation_method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Method</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={!initiationOn}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="POST">POST</SelectItem>
                                            <SelectItem value="GET">GET</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>
                </section>

                <section className="border bg-card p-6">
                    <div className="mb-5 flex items-start justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold">Post-call webhook</h2>
                            <p className="text-sm text-muted-foreground">
                                Called after the call completes, with transcripts and optional
                                audio recording URL.
                            </p>
                        </div>
                        <FormField
                            control={form.control}
                            name="post_enabled"
                            render={({ field }) => (
                                <FormItem className="flex items-center gap-3">
                                    <Label className="text-xs">Enabled</Label>
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
                    <div className="space-y-5">
                        <FormField
                            control={form.control}
                            name="post_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="url"
                                            placeholder="https://api.yourapp.com/webhooks/post-call"
                                            disabled={!postOn}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="post_transcript"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between border p-4">
                                        <div className="space-y-0.5">
                                            <Label>Include transcript</Label>
                                            <FormDescription>
                                                Full transcript in payload.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={!postOn}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="post_audio"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between border p-4">
                                        <div className="space-y-0.5">
                                            <Label>Include audio URL</Label>
                                            <FormDescription>
                                                Signed URL to the recording.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={!postOn}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
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
                                <Save /> Save webhooks
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
    Form,
    FormControl,
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
import {
    COMMON_TIMEZONES,
    getDefaultSttModelForLanguage,
    getDefaultTtsModelForLanguage,
    getDefaultVoiceForTtsModel,
    getSttModelsForLanguage,
    getTtsModelsForLanguage,
    getVoicesForTtsModel,
    LANGUAGES,
    LLM_MODELS,
    normalizeLanguageCode,
} from "@/src/lib/data/voices";
import { mergeConfig } from "@/src/lib/agents/config-defaults";

const schema = z.object({
    voiceId: z.string().min(1),
    agent_language: z.string().min(2),
    llmModel: z.string().min(2),
    sttModel: z.string().min(1),
    ttsModel: z.string().min(1),
    timezone: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function VoiceTab({ agentId }: { agentId: string }) {
    const { data: config, isLoading } = useAgentConfig(agentId);
    const save = useSaveAgentConfig(agentId);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            voiceId: "aura-2-asteria-en",
            agent_language: "en",
            llmModel: "gpt-4o-mini",
            sttModel: "nova-3",
            ttsModel: "aura-2",
            timezone: "UTC",
        },
    });

    useEffect(() => {
        if (!config) return;
        form.reset({
            voiceId: config.voiceId,
            agent_language: normalizeLanguageCode(config.agent_language),
            llmModel: config.llmModel,
            sttModel: config.sttModel ?? "nova-3",
            ttsModel: config.ttsModel ?? "aura-2",
            timezone: config.timezone,
        });
    }, [config, form]);

    const selectedLanguage = useWatch({
        control: form.control,
        name: "agent_language",
    });
    const selectedTtsModel = useWatch({
        control: form.control,
        name: "ttsModel",
    });

    const availableSttModels = useMemo(
        () => getSttModelsForLanguage(selectedLanguage),
        [selectedLanguage]
    );
    const availableTtsModels = useMemo(
        () => getTtsModelsForLanguage(selectedLanguage),
        [selectedLanguage]
    );
    const availableVoices = useMemo(
        () => getVoicesForTtsModel(selectedTtsModel, selectedLanguage),
        [selectedLanguage, selectedTtsModel]
    );

    useEffect(() => {
        const selectedStt = form.getValues("sttModel");
        const selectedTts = form.getValues("ttsModel");

        if (!availableSttModels.some((model) => model.id === selectedStt)) {
            form.setValue("sttModel", getDefaultSttModelForLanguage(selectedLanguage), {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
        }

        if (!availableTtsModels.some((model) => model.id === selectedTts)) {
            form.setValue("ttsModel", getDefaultTtsModelForLanguage(selectedLanguage), {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            });
        }
    }, [availableSttModels, availableTtsModels, form, selectedLanguage]);

    useEffect(() => {
        const selectedVoice = form.getValues("voiceId");
        if (availableVoices.some((voice) => voice.id === selectedVoice)) return;

        form.setValue(
            "voiceId",
            getDefaultVoiceForTtsModel(selectedTtsModel, selectedLanguage),
            {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            }
        );
    }, [availableVoices, form, selectedLanguage, selectedTtsModel]);

    async function onSubmit(values: FormValues) {
        await save.mutateAsync(mergeConfig(config, values));
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <section className="border bg-card p-6">
                    <div className="mb-5 space-y-1">
                        <h2 className="text-base font-semibold">Locale</h2>
                        <p className="text-sm text-muted-foreground">
                            Choose the caller language before selecting speech models.
                        </p>
                    </div>
                    <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="agent_language"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>Language</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full min-w-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {LANGUAGES.map((language) => (
                                                <SelectItem key={language.code} value={language.code}>
                                                    {language.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="timezone"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>Timezone</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full min-w-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {COMMON_TIMEZONES.map((timezone) => (
                                                <SelectItem key={timezone} value={timezone}>
                                                    {timezone}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </section>

                <section className="border bg-card p-6">
                    <div className="mb-5 space-y-1">
                        <h2 className="text-base font-semibold">Conversation models</h2>
                        <p className="text-sm text-muted-foreground">
                            Pick transcription and reasoning models for the selected language.
                        </p>
                    </div>
                    <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="sttModel"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>STT</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full min-w-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableSttModels.map((model) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="llmModel"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>LLM</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full min-w-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {LLM_MODELS.map((model) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </section>

                <section className="border bg-card p-6">
                    <div className="mb-5 space-y-1">
                        <h2 className="text-base font-semibold">Speech output</h2>
                        <p className="text-sm text-muted-foreground">
                            Select a text-to-speech model and a compatible voice.
                        </p>
                    </div>
                    <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="ttsModel"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>TTS</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full min-w-0">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableTtsModels.map((model) => (
                                                <SelectItem key={model.id} value={model.id}>
                                                    {model.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="voiceId"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>Voice</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full min-w-0">
                                                <SelectValue placeholder="Select a voice" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availableVoices.map((voice) => (
                                                <SelectItem key={voice.id} value={voice.id}>
                                                    {voice.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
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
                                <Loader2 className="animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save /> Save changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Phone, PhoneCall, Search, Plus } from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/src/components/ui/form";
import { Skeleton } from "@/src/components/ui/skeleton";
import { EmptyState } from "@/src/components/common/EmptyState";
import {
    useBuyNumber,
    useNumberSearch,
} from "@/src/hooks/queries/numbers";
import type { NumberSearchParams } from "@/src/lib/api/resources/numbers";

const schema = z.object({
    provider: z.enum(["twilio", "telnyx"]),
    country: z
        .string()
        .length(2, "ISO-3166 alpha-2 country code")
        .toUpperCase(),
    areaCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function BuyNumberDrawer() {
    const [open, setOpen] = useState(false);
    const [searchParams, setSearchParams] =
        useState<NumberSearchParams | null>(null);
    const [buyingNumber, setBuyingNumber] = useState<string | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { provider: "twilio", country: "US", areaCode: "" },
    });

    const search = useNumberSearch(searchParams, !!searchParams);
    const buy = useBuyNumber();

    function onSubmit(values: FormValues) {
        setSearchParams({
            provider: values.provider,
            country: values.country,
            areaCode: values.areaCode || undefined,
            limit: 10,
        });
    }

    async function onBuy(phoneNumber: string) {
        if (!searchParams) return;
        setBuyingNumber(phoneNumber);
        try {
            await buy.mutateAsync({
                provider: searchParams.provider,
                phoneNumber,
            });
            setOpen(false);
            form.reset();
            setSearchParams(null);
        } finally {
            setBuyingNumber(null);
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus /> Buy number
                </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
                <SheetHeader className="border-b px-6 py-5">
                    <SheetTitle>Buy a phone number</SheetTitle>
                    <SheetDescription>
                        Search available numbers from your telephony provider and purchase
                        one for this organization.
                    </SheetDescription>
                </SheetHeader>

                <div className="border-b px-6 py-5">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_0.8fr_auto] lg:items-end"
                        >
                            <FormField
                                control={form.control}
                                name="provider"
                                render={({ field }) => (
                                    <FormItem className="min-w-0">
                                        <FormLabel>Provider</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="twilio">Twilio</SelectItem>
                                                <SelectItem value="telnyx">Telnyx</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="country"
                                render={({ field }) => (
                                    <FormItem className="min-w-0">
                                        <FormLabel>Country</FormLabel>
                                        <FormControl>
                                            <Input
                                                maxLength={2}
                                                placeholder="US"
                                                {...field}
                                                onChange={(event) =>
                                                    field.onChange(event.target.value.toUpperCase())
                                                }
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[11px]">
                                            ISO 3166-1 alpha-2, e.g. US, GB, IN
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="areaCode"
                                render={({ field }) => (
                                    <FormItem className="min-w-0">
                                        <FormLabel>Area code</FormLabel>
                                        <FormControl>
                                            <Input placeholder="415" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                disabled={search.isFetching}
                                className="w-full lg:w-auto"
                            >
                                {search.isFetching ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <Search />
                                )}
                                Search
                            </Button>
                        </form>
                    </Form>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {!searchParams ? (
                        <EmptyState
                            icon={Phone}
                            title="Search available numbers"
                            description="Pick a provider, country, and optional area code."
                            className="border-0"
                        />
                    ) : search.isFetching ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : search.isError ? (
                        <EmptyState
                            icon={Phone}
                            title="Search failed"
                            description="Check the provider and country, then try again."
                            className="border-0"
                        />
                    ) : !search.data?.length ? (
                        <EmptyState
                            icon={Phone}
                            title="No numbers found"
                            description="Try a different country or area code."
                            className="border-0"
                        />
                    ) : (
                        <div className="divide-y border bg-card">
                            {search.data.map((n) => (
                                <div
                                    key={n.phoneNumber}
                                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                                            <PhoneCall className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-mono text-sm font-semibold text-foreground">
                                                {n.phoneNumber}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {[n.locality, n.region, n.isoCountry]
                                                    .filter(Boolean)
                                                    .join(" · ")}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => onBuy(n.phoneNumber)}
                                        disabled={buy.isPending}
                                        className="w-full sm:w-auto"
                                    >
                                        {buyingNumber === n.phoneNumber ? (
                                            <><Loader2 className="animate-spin" /> Buying…</>
                                        ) : (
                                            "Buy"
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

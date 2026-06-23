"use client";

import { PageHeader } from "@/src/components/common/PageHeader";
import { BatchCallForm } from "@/src/components/outbound/BatchCallForm";
import { QuickCallForm } from "@/src/components/outbound/QuickCallForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";

export default function OutboundPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Outbound"
        description="Start quick calls or queue batch campaigns from assigned numbers."
      />
      <Tabs defaultValue="quick" className="w-full">
        <TabsList>
          <TabsTrigger value="quick">Quick call</TabsTrigger>
          <TabsTrigger value="batch">Batch calls</TabsTrigger>
        </TabsList>
        <TabsContent value="quick" className="mt-4">
          <QuickCallForm />
        </TabsContent>
        <TabsContent value="batch" className="mt-4">
          <BatchCallForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

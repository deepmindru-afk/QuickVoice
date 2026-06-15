"use client";

import { PageHeader } from "@/src/components/common/PageHeader";
import { QuickCallForm } from "@/src/components/outbound/QuickCallForm";

export default function OutboundPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Outbound"
        description="Start quick calls from assigned numbers."
      />
      <QuickCallForm />
    </div>
  );
}

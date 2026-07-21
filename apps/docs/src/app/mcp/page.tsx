import { McpClientAccordion } from "@/components/mcp/mcp-client-accordion";
import { McpConfigGenerator } from "@/components/mcp/mcp-config-generator";
import { McpFaq } from "@/components/mcp/mcp-faq";
import { McpFeatureGrid } from "@/components/mcp/mcp-feature-grid";
import { McpFooter } from "@/components/mcp/mcp-footer";
import { McpHero } from "@/components/mcp/mcp-hero";
import { McpLogoCloud } from "@/components/mcp/mcp-logo-cloud";
import { McpPageNav } from "@/components/mcp/mcp-page-nav";
import { McpSupportCta } from "@/components/mcp/mcp-support-cta";

export default function McpOverviewPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <McpPageNav />
      <McpHero />
      <McpLogoCloud />
      <McpFeatureGrid />
      <McpConfigGenerator />
      <McpClientAccordion />
      <McpFaq />
      <McpSupportCta />
      <McpFooter />
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { REGISTER_URL } from "@/lib/links";
import {
  Shield,
  Lock,
  CheckCircle,
  FileCheck,
  Eye,
  Server,
  Users,
  AlertTriangle,
  ClipboardCheck,
  ShieldCheck,
  KeyRound,
  ScrollText,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

export const metadata: Metadata = {
  title: "HIPAA Compliance — Secure AI Voice Agents",
  description:
    "QuickVoice is a HIPAA compliant AI voice agent platform with BAA, encryption, audit logging, and SOC 2 Type II certification.",
  alternates: {
    canonical: "https://quickvoice.co/compliance/hipaa",
  },
  openGraph: {
    title: "HIPAA Compliance — Secure AI Voice Agents",
    description:
      "QuickVoice is a HIPAA compliant AI voice agent platform with BAA, encryption, audit logging, and SOC 2 Type II certification.",
    type: "website",
    url: "https://quickvoice.co/compliance/hipaa",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HIPAA Compliance — Secure AI Voice Agents",
    description:
      "QuickVoice is a HIPAA compliant AI voice agent platform with BAA, encryption, audit logging, and SOC 2 Type II certification.",
    images: ["/og-image.png"],
  },
};

const faqItems = [
  {
    question: "Is QuickVoice HIPAA compliant?",
    answer:
      "Yes. QuickVoice is fully HIPAA compliant. We implement all required administrative, physical, and technical safeguards mandated by the HIPAA Security Rule. Our platform undergoes regular third-party audits, and we maintain SOC 2 Type II certification to independently verify our security controls.",
  },
  {
    question: "Does QuickVoice sign Business Associate Agreements (BAAs)?",
    answer:
      "Yes. We execute Business Associate Agreements with Scale and Enterprise healthcare customers and covered entities before any protected health information (PHI) is processed on our platform. Our BAA covers all HIPAA-required provisions including permitted uses and disclosures, safeguard obligations, breach notification procedures, and termination requirements.",
  },
  {
    question:
      "How does QuickVoice encrypt protected health information (PHI)?",
    answer:
      "We use AES-256 encryption for all data at rest and TLS 1.3 for all data in transit. Encryption keys are managed through a dedicated key management service with automatic key rotation. Voice recordings, transcriptions, and any PHI stored within our systems are encrypted at every layer of the stack, from application to database to backup storage.",
  },
  {
    question:
      "What happens if there is a data breach involving patient information?",
    answer:
      "QuickVoice maintains a comprehensive incident response plan that meets HIPAA Breach Notification Rule requirements. In the event of a confirmed breach involving unsecured PHI, we notify affected covered entities within 24 hours of discovery — well within the HIPAA-mandated 60-day window. Our security team conducts a full forensic investigation, implements containment measures, and provides a detailed incident report with remediation steps.",
  },
  {
    question: "Can QuickVoice integrate with our existing EHR/EMR systems?",
    answer:
      "Yes. QuickVoice offers secure, HIPAA-compliant integrations with leading EHR and EMR systems including Epic, Cerner, athenahealth, Allscripts, and NextGen. All integration endpoints use encrypted API connections, and data flows are logged in our audit system. We support HL7 FHIR standards for interoperability.",
  },
  {
    question: "How does QuickVoice handle voice recordings containing PHI?",
    answer:
      "Voice recordings are encrypted in transit and at rest using AES-256 encryption. Our platform supports automatic PHI redaction from transcriptions, configurable retention policies, and secure deletion workflows. Access to recordings is controlled by role-based permissions, and every access event is logged in our immutable audit trail. Customers can configure retention periods based on their compliance requirements.",
  },
  {
    question:
      "What certifications does QuickVoice hold beyond HIPAA compliance?",
    answer:
      "In addition to HIPAA compliance, QuickVoice maintains SOC 2 Type II certification, is aligned with ISO 27001 information security standards, and complies with GDPR, PCI DSS, and CCPA. These certifications and frameworks demonstrate our commitment to the highest standards of data security and privacy across all industries we serve.",
  },
  {
    question:
      "How are QuickVoice employees trained on HIPAA requirements?",
    answer:
      "All QuickVoice employees complete mandatory HIPAA privacy and security training during onboarding and annual refresher courses thereafter. Team members with access to PHI receive additional role-specific training. We conduct regular phishing simulations, security awareness exercises, and maintain strict acceptable use policies. Training completion and competency assessments are tracked and documented for audit purposes.",
  },
];

const technicalSafeguards = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description:
      "AES-256 encryption at rest and TLS 1.3 in transit for all PHI. Encryption keys are managed through a dedicated KMS with automatic rotation schedules.",
  },
  {
    icon: KeyRound,
    title: "Access Controls & Authentication",
    description:
      "Role-based access control (RBAC) with least-privilege principles, multi-factor authentication (MFA), single sign-on (SSO) via SAML 2.0, and automatic session timeouts.",
  },
  {
    icon: Eye,
    title: "Comprehensive Audit Logging",
    description:
      "Immutable, tamper-proof audit trails capture every access, modification, and deletion event involving PHI. Logs are retained for a minimum of six years and are available for compliance reviews.",
  },
  {
    icon: Server,
    title: "Infrastructure Security",
    description:
      "SOC 2 Type II certified data centers with physical access controls, redundant power and networking, intrusion detection systems, and 24/7 security monitoring.",
  },
  {
    icon: ShieldCheck,
    title: "Automatic PHI Redaction",
    description:
      "AI-powered redaction automatically identifies and removes PHI from call transcriptions and logs when configured, reducing the risk of unauthorized exposure.",
  },
  {
    icon: Shield,
    title: "Network Security & Segmentation",
    description:
      "Production environments are isolated in private VPCs with strict firewall rules, DDoS protection, Web Application Firewalls (WAF), and regular vulnerability scanning.",
  },
];

const administrativeSafeguards = [
  {
    icon: Users,
    title: "Workforce Training & Awareness",
    description:
      "Mandatory HIPAA training for all employees at onboarding and annually. Role-specific training for personnel with PHI access. Regular phishing simulations and security awareness exercises.",
  },
  {
    icon: AlertTriangle,
    title: "Incident Response Plan",
    description:
      "Documented incident response procedures with defined roles, escalation paths, and communication protocols. Breach notifications issued within 24 hours of discovery, exceeding HIPAA requirements.",
  },
  {
    icon: ClipboardCheck,
    title: "Risk Assessments",
    description:
      "Annual comprehensive risk assessments evaluating potential threats to PHI confidentiality, integrity, and availability. Third-party penetration testing and vulnerability assessments conducted quarterly.",
  },
  {
    icon: ScrollText,
    title: "Policies & Procedures",
    description:
      "Documented security policies covering data classification, acceptable use, access management, media disposal, and contingency planning. All policies are reviewed and updated annually.",
  },
  {
    icon: FileCheck,
    title: "Vendor Management",
    description:
      "All subprocessors and vendors with PHI access are evaluated for HIPAA compliance, bound by BAAs, and monitored through our vendor risk management program.",
  },
  {
    icon: CheckCircle,
    title: "Contingency Planning",
    description:
      "Business continuity and disaster recovery plans with defined RPO and RTO objectives. Regular backup testing, failover drills, and documented recovery procedures ensure data availability.",
  },
];

const certifications = [
  {
    name: "SOC 2 Type II",
    description:
      "Independent audit verifying our security, availability, and confidentiality controls over an extended observation period.",
  },
  {
    name: "ISO 27001 Aligned",
    description:
      "Information security management system aligned with international standards for systematic risk management.",
  },
  {
    name: "GDPR Compliant",
    description:
      "Full compliance with the EU General Data Protection Regulation, including data subject rights and cross-border transfer safeguards.",
  },
  {
    name: "PCI DSS",
    description:
      "Payment Card Industry Data Security Standard compliance for secure handling of payment information.",
  },
  {
    name: "CCPA Compliant",
    description:
      "Compliance with the California Consumer Privacy Act, including consumer data rights, transparency, and opt-out mechanisms.",
  },
];

export default function HipaaCompliancePage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://quickvoice.co",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Compliance",
        item: "https://quickvoice.co/compliance",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "HIPAA",
        item: "https://quickvoice.co/compliance/hipaa",
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden border-b border-border/40 bg-muted/30 py-20 sm:py-28">
        {/* decorative gradient */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 opacity-20"
        >
          <div className="h-[600px] w-[900px] rounded-full bg-gradient-to-br from-primary/40 to-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            HIPAA-Compliant AI Voice Agents —{" "}
            <span className="text-primary">Enterprise-Grade Security</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            QuickVoice safeguards protected health information at every layer.
            From encrypted voice calls to immutable audit trails, our platform
            is built from the ground up to meet and exceed HIPAA requirements so
            healthcare organizations can automate with confidence.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/company/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Request a BAA
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={REGISTER_URL}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* ── Commitment Section ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Our Commitment to Healthcare Data Security
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Healthcare organizations trust QuickVoice to handle their most
              sensitive data. We uphold that trust through rigorous security
              practices, transparent compliance programs, and a security-first
              engineering culture. Every feature we build, every integration we
              support, and every process we follow is designed with patient
              privacy at its core.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                value: "AES-256",
                label: "Encryption Standard",
                sub: "Data at rest & in transit",
              },
              {
                value: "99.99%",
                label: "Uptime SLA",
                sub: "Enterprise-grade availability",
              },
              {
                value: "< 24 hrs",
                label: "Breach Notification",
                sub: "Exceeds HIPAA 60-day rule",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-muted/30 p-8 text-center"
              >
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="mt-2 font-semibold">{stat.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technical Safeguards ── */}
      <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Technical Safeguards
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our platform implements comprehensive technical controls to
              protect the confidentiality, integrity, and availability of
              electronic protected health information (ePHI).
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {technicalSafeguards.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-background p-6 transition hover:shadow-md dark:hover:shadow-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Administrative Safeguards ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Administrative Safeguards
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Beyond technology, HIPAA compliance requires strong organizational
              practices. Our administrative controls ensure that people,
              processes, and policies work together to protect patient data.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {administrativeSafeguards.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-background p-6 transition hover:shadow-md dark:hover:shadow-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BAA Section ── */}
      <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Business Associate Agreement (BAA)
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                HIPAA requires that covered entities enter into a Business
                Associate Agreement with any vendor that creates, receives,
                maintains, or transmits protected health information on their
                behalf. QuickVoice provides a comprehensive BAA to Scale and
                Enterprise healthcare customers as part of our standard
                onboarding process.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Executed before any PHI is processed on our platform",
                  "Covers all HIPAA-required provisions and safeguard obligations",
                  "Includes breach notification procedures and timelines",
                  "Defines permitted uses, disclosures, and data handling responsibilities",
                  "Addresses subcontractor obligations and downstream BAA requirements",
                  "Reviewed annually and updated to reflect regulatory changes",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/company/contact"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  Request a BAA
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="w-full max-w-sm flex-shrink-0">
              <div className="rounded-2xl border border-border bg-background p-8 shadow-lg dark:shadow-primary/5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <FileCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-6 text-center text-xl font-semibold">
                  BAA Included
                </h3>
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  Available on Scale and Enterprise healthcare plans at no
                  additional cost. Contact our compliance team to get started.
                </p>
                <div className="mt-6 space-y-3 text-sm">
                  {[
                    "Standard turnaround: 1-2 business days",
                    "Custom terms available for enterprise",
                    "Covers all QuickVoice services and features",
                  ].map((line) => (
                    <div key={line} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span className="text-muted-foreground">{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Additional Certifications ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Additional Certifications & Frameworks
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              HIPAA compliance is one part of our broader security posture.
              QuickVoice adheres to multiple industry standards to provide
              comprehensive protection for all customers.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="rounded-xl border border-border bg-muted/30 p-6"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">{cert.name}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {cert.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="border-y border-border/40 bg-muted/20 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Common questions about QuickVoice&apos;s HIPAA compliance program
              and healthcare data security practices.
            </p>
          </div>

          <div className="mt-14 space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="group rounded-xl border border-border bg-background transition-shadow hover:shadow-sm [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-6">
                  <h3 className="text-left font-semibold">{item.question}</h3>
                  <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-6">
                  <p className="leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-2xl border border-border bg-muted/30 px-8 py-14 text-center sm:px-16 sm:py-20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Deploy HIPAA-Compliant AI Voice Agents?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Join hundreds of healthcare organizations that trust QuickVoice to
              automate patient communications securely. Get a BAA, dedicated
              compliance support, and enterprise-grade security out of the box.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href={REGISTER_URL}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/company/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-8 py-3.5 text-sm font-semibold transition hover:bg-muted"
              >
                Contact Sales
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              No credit card required. BAA available on Scale and Enterprise
              healthcare plans.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

type Customer = {
  name: string;
  image: string;
};

const upperRowCustomers: Customer[] = [
  { name: "CareVia", image: "/Customer_Logos/CareVia.webp" },
  { name: "Dr. George", image: "/Customer_Logos/Dr-George.webp" },
  { name: "Realty Bank", image: "/Customer_Logos/Realty-Bank.webp" },
  { name: "Genpact", image: "/Customer_Logos/Genpact.webp" },
  { name: "Victura Health", image: "/Customer_Logos/Victura-Health.webp" },
  { name: "WonDRX", image: "/Customer_Logos/WonDRX.webp" },
];

const lowerRowCustomers: Customer[] = [
  { name: "InCred Money", image: "/Customer_Logos/incredmoney-logo.webp" },
  { name: "The Grove Care Centers of America", image: "/Customer_Logos/The-Grove-Care-Centers-of-America.webp" },
  { name: "RevUpside", image: "/Customer_Logos/RevUpside.webp" },
  { name: "GemCaps", image: "/Customer_Logos/GemCaps-logo.webp" },
  { name: "Zenexa Technologies", image: "/Customer_Logos/Zenexa_Technologies.webp" },
  { name: "EagleRCM", image: "/Customer_Logos/EagleRCM.webp" },
];

const MARQUEE_REPEAT_COUNT = 4;

function CustomerPill({
  customer,
  tone,
  isDuplicate = false,
}: {
  customer: Customer;
  tone: "upper" | "lower";
  isDuplicate?: boolean;
}) {
  const isLower = tone === "lower";

  return (
    <li
      aria-hidden={isDuplicate ? "true" : undefined}
      className={`flex w-56 shrink-0 flex-col items-center gap-4 rounded-2xl border px-6 py-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:w-64 ${
        isLower
          ? "border-primary/20 bg-primary/[0.05] dark:border-primary/25 dark:bg-primary/[0.08]"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      }`}
    >
      <div
        className={`flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border ${
          isLower
            ? "border-primary/20 bg-white dark:bg-gray-950"
            : "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950"
        }`}
      >
        <img
          src={customer.image}
          alt={customer.name}
          className="h-full w-full object-contain p-4"
        />
      </div>
      <p className="w-full truncate text-center text-base font-medium tracking-tight text-gray-950 dark:text-gray-50">
        {customer.name}
      </p>
    </li>
  );
}

function CircularCustomerRow({
  customers,
  direction,
  tone,
  label,
}: {
  customers: Customer[];
  direction: "left" | "right";
  tone: "upper" | "lower";
  label: string;
}) {
  // Repeated copies of the full list, laid end-to-end, so the last pill of
  // one copy sits directly next to the first pill of the next copy — this
  // is what makes the strip read as one continuous, connected loop.
  const duplicateCustomers = Array.from({ length: MARQUEE_REPEAT_COUNT - 1 }).flatMap(
    (_, copyIndex) => customers.map((customer) => ({ customer, copyIndex })),
  );

  return (
    <div
      aria-label={label}
      className="overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
    >
      <ul className={`customer-circular-track customer-circular-${direction} flex w-max gap-5`}>
        {customers.map((customer) => (
          <CustomerPill key={`${tone}-${customer.name}`} customer={customer} tone={tone} />
        ))}
        {duplicateCustomers.map(({ customer, copyIndex }) => (
          <CustomerPill
            key={`${tone}-copy-${copyIndex}-${customer.name}`}
            customer={customer}
            isDuplicate
            tone={tone}
          />
        ))}
      </ul>
    </div>
  );
}

function UpperCustomerRow() {
  return (
    <div className="rounded-[2rem] border border-gray-200/70 bg-gray-50/70 py-2 dark:border-gray-800/70 dark:bg-gray-950/40">
      <CircularCustomerRow
        customers={upperRowCustomers}
        direction="right"
        label="Upper customer categories"
        tone="upper"
      />
    </div>
  );
}

function LowerCustomerRow() {
  return (
    <div className="rounded-[2rem] border border-primary/15 bg-primary/[0.025] py-2 dark:border-primary/20 dark:bg-primary/[0.05]">
      <CircularCustomerRow
        customers={lowerRowCustomers}
        direction="left"
        label="Lower customer categories"
        tone="lower"
      />
    </div>
  );
}

export function CustomersSection() {
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-28">
      <style>{`
        @keyframes customer-circular-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes customer-circular-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }

        .customer-circular-track {
          animation-duration: 46s;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        .customer-circular-left {
          animation-name: customer-circular-left;
        }

        .customer-circular-right {
          animation-name: customer-circular-right;
        }

        .customer-circular-track:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .customer-circular-track {
            animation: none;
            transform: translateX(0);
          }
        }
      `}</style>
      <div className="mx-auto max-w-screen-xl px-4 md:px-8">
        <div className="relative mx-auto mb-12 max-w-2xl text-center">
          <div className="relative z-10">
            <h2 className="text-3xl font-normal tracking-tighter text-foreground sm:text-4xl md:text-5xl">
              Our Customers
            </h2>
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 mx-auto h-44 max-w-xs blur-[118px]"
            style={{
              background:
                "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.2) 4.54%, rgba(var(--primary-rgb), 0.26) 34.2%, rgba(var(--primary-rgb), 0.1) 77.55%)",
            }}
          />
        </div>

        <div className="relative space-y-8">
          <UpperCustomerRow />
          <LowerCustomerRow />
        </div>
      </div>
    </section>
  );
}

export default CustomersSection;
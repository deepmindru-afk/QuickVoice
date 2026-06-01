"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import Logo1 from "../logo1";
import { DEMO_BOOKING_URL, LOGIN_URL, REGISTER_URL } from "@/lib/links";

interface NavItem {
  name: string;
  href: string;
  hasDropdown?: boolean;
  dropdownItems?: {
    name: string;
    href: string;
    description?: string;
    hasNestedDropdown?: boolean;
    nestedDropdownItems?: { name: string; href: string }[];
  }[];
}

const navItems: NavItem[] = [
  {
    name: "Solutions",
    href: "#",
    hasDropdown: true,
    dropdownItems: [
      {
        name: "Voice Agent Solutions",
        href: "/solutions",
        hasNestedDropdown: true,
        nestedDropdownItems: [
          { name: "Solutions Overview", href: "/solutions" },
          { name: "AI Receptionist", href: "/solutions/ai-receptionist" },
          {
            name: "AI Answering Service",
            href: "/solutions/ai-answering-service",
          },
        ],
      },
      {
        name: "Industries",
        href: "/industries",
        hasNestedDropdown: true,
        nestedDropdownItems: [
          { name: "Retail & E-comm", href: "/industries/e-commerce" },
          { name: "Healthcare", href: "/industries/healthcare" },
          {
            name: "Financial Services",
            href: "/industries/financial-services",
          },
          { name: "Real Estate", href: "/industries/real-estate" },
          { name: "Automotive", href: "/industries/automotive" },
          {
            name: "Travel & Hospitality",
            href: "/industries/travel-hospitality",
          },
          { name: "Education", href: "/industries/education" },
          { name: "SaaS", href: "/industries/saas" },
          { name: "Logistics", href: "/industries/logistics" },
          { name: "HR & Recruiting", href: "/industries/hr-recruiting" },
          {
            name: "Manufacturing & Engineering",
            href: "/industries/manufacturing-engineering",
          },
        ],
      },
      {
        name: "Use Cases",
        href: "/use-cases",
        hasNestedDropdown: true,
        nestedDropdownItems: [
          {
            name: "Customer Support Automation",
            href: "/use-cases/customer-support",
          },
          { name: "Sales/Lead Gen", href: "/use-cases/sales-lead-gen" },
          {
            name: "Appointment Scheduling",
            href: "/use-cases/appointment-scheduling",
          },
          {
            name: "Reminders & Collections",
            href: "/use-cases/reminders-collections",
          },
          {
            name: "Order Status & Returns",
            href: "/use-cases/order-status-returns",
          },
          {
            name: "Operations Automation",
            href: "/use-cases/operations-automation",
          },
        ],
      },
    ],
  },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
  {
    name: "Customers",
    href: "/case-studies",
    hasDropdown: false,
  },
  {
    name: "Company",
    href: "#",
    hasDropdown: true,
    dropdownItems: [
      { name: "About Us", href: "/company/about-us" },
      { name: "Contact Us", href: "/company/contact" },
      { name: "Careers", href: "/company/careers" },
    ],
  },
];
export default function Header1() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-black/80 backdrop-blur shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2"
            aria-label="QuickVoice - Home"
          >
            <Logo1 compactOnMobile />
          </Link>

          {/* Desktop Nav */}
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center space-x-8"
          >
            <ul className="flex items-center space-x-6">
              {navItems.map((item) => (
                <li
                  key={item.name}
                  className="relative"
                  onMouseEnter={() =>
                    item.hasDropdown && setActiveDropdown(item.name)
                  }
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className="flex items-center space-x-1 font-medium text-foreground hover:text-primary transition"
                  >
                    <span>{item.name}</span>
                    {item.hasDropdown && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          activeDropdown === item.name ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </Link>

                  {/* Dropdown */}
                  {item.hasDropdown && (
                    <AnimatePresence>
                      {activeDropdown === item.name && (
                        <motion.ul
                          className={`absolute top-full left-0 mt-2 w-80 rounded-xl border border-border bg-background shadow-xl z-40 ${
                            item.name === "Solutions"
                              ? "w-[600px] grid grid-cols-2 gap-6 p-6"
                              : "p-2"
                          }`}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {item.dropdownItems?.map((dropdown) => (
                            <li key={dropdown.name}>
                              {dropdown.nestedDropdownItems ? (
                                <div>
                                  <h3 className="font-semibold text-sm text-foreground mb-2">
                                    {dropdown.name}
                                  </h3>
                                  <ul className="space-y-1">
                                    {dropdown.nestedDropdownItems.map(
                                      (nested) => (
                                        <li key={nested.name}>
                                          <Link
                                            href={nested.href}
                                            className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                                          >
                                            {nested.name}
                                          </Link>
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              ) : (
                                <Link
                                  href={dropdown.href}
                                  className="block px-4 py-2 text-sm hover:bg-muted rounded-lg"
                                >
                                  {dropdown.name}
                                </Link>
                              )}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Side (Auth + CTA) */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href={LOGIN_URL}>Log in</Link>
              </Button>
              <Button asChild>
                <Link href={DEMO_BOOKING_URL}>Book a Demo</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={REGISTER_URL}>Get Started</Link>
              </Button>
            </div>
            <Link
              href={DEMO_BOOKING_URL}
              className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-white shadow-xs transition-all hover:bg-primary/90 sm:px-4 lg:hidden"
            >
              Book a Demo
            </Link>
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden rounded-lg p-2 hover:bg-muted transition"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            className="lg:hidden mx-4 mt-2 rounded-xl border border-border bg-background shadow-xl backdrop-blur p-4 space-y-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="space-y-1 max-h-[60vh] overflow-auto">
              {navItems.map((item) => (
                <li key={item.name}>
                  {item.hasDropdown ? (
                    <>
                      <button
                        className="flex w-full items-center justify-between px-2 py-2 rounded-lg font-medium hover:bg-muted transition-colors"
                        onClick={() =>
                          setOpenMobileDropdown(
                            openMobileDropdown === item.name ? null : item.name,
                          )
                        }
                      >
                        <span>{item.name}</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            openMobileDropdown === item.name ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {openMobileDropdown === item.name && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <ul className="ml-2 mt-1 space-y-1 border-l border-border pl-3">
                              {item.dropdownItems?.map((dropdown) => (
                                <li key={dropdown.name}>
                                  {dropdown.hasNestedDropdown ? (
                                    <>
                                      <Link
                                        href={dropdown.href}
                                        className="block px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg"
                                        onClick={() =>
                                          setIsMobileMenuOpen(false)
                                        }
                                      >
                                        {dropdown.name}
                                      </Link>
                                      <ul className="ml-3 space-y-0.5">
                                        {dropdown.nestedDropdownItems?.map(
                                          (nested) => (
                                            <li key={nested.name}>
                                              <Link
                                                href={nested.href}
                                                className="block px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                                onClick={() =>
                                                  setIsMobileMenuOpen(false)
                                                }
                                              >
                                                {nested.name}
                                              </Link>
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    </>
                                  ) : (
                                    <Link
                                      href={dropdown.href}
                                      className="block px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      {dropdown.name}
                                    </Link>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="block px-2 py-2 rounded-lg font-medium hover:bg-muted"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
              <Button variant="outline" asChild className="w-full">
                <Link href={LOGIN_URL} onClick={() => setIsMobileMenuOpen(false)}>
                  Log in
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link
                  href={DEMO_BOOKING_URL}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Book a Demo
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link
                  href={REGISTER_URL}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

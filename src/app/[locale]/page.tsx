"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import {
  RiUserSearchLine,
  RiFlashlightLine,
  RiHashtag,
  RiMoneyDollarCircleLine,
  RiSmartphoneLine,
  RiSearchEyeLine,
  RiPaletteLine,
  RiCameraLine,
  RiBrainLine,
  RiUserReceivedLine,
  RiRunLine,
  RiBuildingLine,
  RiPresentationLine,
  RiMusic2Line,
  RiFootballLine,
  RiCompassLine,
  RiMegaphoneLine,
  RiImageLine,
  RiShareLine,
  RiStarLine,
  RiArrowRightLine,
  RiCheckLine,
  RiDoubleQuotesL,
  RiMenuLine,
  RiCloseLine,
} from "@remixicon/react";
import { useState, useEffect } from "react";

/* ─── Animated counter ─── */
function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible, target]);

  return (
    <span
      ref={(el) => {
        if (!el) return;
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) setVisible(true);
          },
          { threshold: 0.5 }
        );
        observer.observe(el);
        return () => observer.disconnect();
      }}
    >
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─── Feature card icons mapping ─── */
const featureIcons = [
  RiSmartphoneLine,
  RiFlashlightLine,
  RiSearchEyeLine,
  RiBrainLine,
  RiPaletteLine,
] as const;

const featureKeys = ["simple", "instant", "search", "ai", "brand"] as const;

/* ─── Event type icons ─── */
const eventTypes = [
  { key: "marathon", icon: RiRunLine },
  { key: "corporate", icon: RiBuildingLine },
  { key: "conference", icon: RiPresentationLine },
  { key: "festival", icon: RiMusic2Line },
  { key: "sport", icon: RiFootballLine },
  { key: "tourism", icon: RiCompassLine },
] as const;

/* ─── How it works steps ─── */
const howSteps = [
  { key: "step1", icon: RiCameraLine },
  { key: "step2", icon: RiBrainLine },
  { key: "step3", icon: RiUserReceivedLine },
] as const;

/* ─── Monetization cards ─── */
const monetizeCards = [
  { key: "sponsors", icon: RiMegaphoneLine },
  { key: "sales", icon: RiImageLine },
  { key: "social", icon: RiShareLine },
] as const;

export default function LandingPage() {
  const t = useTranslations("landing");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: t("nav_features") },
    { href: "#how", label: t("nav_how") },
    { href: "#events", label: t("nav_events") },
    { href: "#monetization", label: t("nav_monetization") },
    { href: "#reviews", label: t("nav_reviews") },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ─── Header ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo-baspen.svg"
              alt="Baspen"
              width={110}
              height={28}
              className="h-6 w-auto brightness-0"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-text-secondary hover:text-text transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text transition-colors px-4 py-2"
            >
              {t("nav_login")}
            </Link>
            <Link
              href="/register?role=owner"
              className="text-sm font-medium bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-hover transition-colors"
            >
              {t("hero_cta_start")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 -mr-2 text-text cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <RiCloseLine size={24} /> : <RiMenuLine size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-border shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-text-secondary hover:text-text py-3 px-2 rounded-lg hover:bg-bg-secondary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-t border-border mt-2 pt-4 flex flex-col gap-3">
                <Link
                  href="/login"
                  className="text-center text-sm font-medium text-text-secondary py-2.5"
                >
                  {t("nav_login")}
                </Link>
                <Link
                  href="/register?role=owner"
                  className="text-center text-sm font-medium bg-primary text-white px-5 py-2.5 rounded-lg"
                >
                  {t("hero_cta_start")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32 overflow-hidden">
        {/* Background gradient decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/5 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6 animate-fade-in">
              <RiCameraLine size={16} />
              {t("hero_badge")}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[1.1] animate-fade-in-up">
              {t("hero_title")}
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-100">
              {t("hero_subtitle")}
            </p>

            {/* Feature pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in-up animation-delay-200">
              {(["face", "instant", "whitelabel", "widget"] as const).map(
                (key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 text-sm text-text-secondary bg-bg-secondary border border-border px-3 py-1.5 rounded-full"
                  >
                    <RiCheckLine size={14} className="text-success" />
                    {t(`hero_feature_${key}`)}
                  </span>
                )
              )}
            </div>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-300">
              <Link
                href="/register?role=owner"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-primary-hover transition-all hover:shadow-lg hover:shadow-primary/20 cursor-pointer"
              >
                {t("hero_cta_start")}
                <RiArrowRightLine size={18} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 bg-white text-text font-semibold text-base px-8 py-3.5 rounded-xl border border-border hover:bg-bg-secondary transition-colors cursor-pointer"
              >
                {t("hero_cta_demo")}
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in-up animation-delay-400">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-text">
                  <AnimatedNumber target={500} suffix="+" />
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  {t("hero_stat_events")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-text">
                  <AnimatedNumber target={2} suffix="M+" />
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  {t("hero_stat_photos")}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-text">
                  <AnimatedNumber target={100} suffix="K+" />
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  {t("hero_stat_participants")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-20 lg:py-32 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text tracking-tight">
              {t("features_title")}
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              {t("features_subtitle")}
            </p>
          </div>

          {/* Feature cards — top row of 3, bottom row of 2 centered */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <div
                  key={key}
                  className={`group bg-white rounded-2xl p-8 border border-border hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ${
                    i >= 3 ? "lg:col-span-1 lg:mx-auto lg:w-full" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text mb-2">
                    {t(`feature_${key}_title`)}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {t(`feature_${key}_desc`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How it Works ─── */}
      <section id="how" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text tracking-tight">
              {t("how_title")}
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              {t("how_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {howSteps.map(({ key, icon: Icon }, i) => (
              <div key={key} className="relative text-center">
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/30 to-primary/5" />
                )}

                {/* Step number + icon */}
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/5 mb-6">
                  <Icon size={36} className="text-primary" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white text-sm font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-text mb-3">
                  {t(`how_${key}_title`)}
                </h3>
                <p className="text-text-secondary leading-relaxed max-w-xs mx-auto">
                  {t(`how_${key}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Event Types ─── */}
      <section id="events" className="py-20 lg:py-32 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text tracking-tight">
              {t("events_title")}
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              {t("events_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {eventTypes.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="group bg-white rounded-2xl p-6 border border-border text-center hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-default"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                  <Icon size={28} className="text-primary" />
                </div>
                <span className="text-sm font-medium text-text">
                  {t(`event_type_${key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Monetization ─── */}
      <section id="monetization" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text tracking-tight">
              {t("monetize_title")}
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              {t("monetize_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {monetizeCards.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="group relative bg-white rounded-2xl p-8 border border-border hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
              >
                {/* Accent top border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                  <Icon size={28} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-3">
                  {t(`monetize_${key}_title`)}
                </h3>
                <p className="text-text-secondary leading-relaxed mb-6">
                  {t(`monetize_${key}_desc`)}
                </p>
                <Link
                  href="/register?role=owner"
                  className="inline-flex items-center gap-1.5 text-primary font-medium text-sm hover:gap-2.5 transition-all cursor-pointer"
                >
                  {t(`monetize_${key}_cta`)}
                  <RiArrowRightLine size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="reviews" className="py-20 lg:py-32 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text tracking-tight">
              {t("reviews_title")}
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              {t("reviews_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {([1, 2, 3] as const).map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl p-8 border border-border relative"
              >
                <RiDoubleQuotesL
                  size={40}
                  className="text-primary/10 absolute top-6 right-6"
                />
                {/* Stars */}
                <div className="flex gap-0.5 mb-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <RiStarLine
                      key={star}
                      size={18}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-text leading-relaxed mb-6">
                  &ldquo;{t(`review${n}_text`)}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {t(`review${n}_author`)
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-text text-sm">
                      {t(`review${n}_author`)}
                    </div>
                    <div className="text-text-secondary text-sm">
                      {t(`review${n}_role`)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-700" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            {t("final_cta_title")}
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            {t("final_cta_subtitle")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=owner"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors shadow-lg cursor-pointer"
            >
              {t("final_cta_button")}
              <RiArrowRightLine size={18} />
            </Link>
            <Link
              href="/register?role=photographer"
              className="inline-flex items-center justify-center bg-white/10 text-white border border-white/20 font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
            >
              {t("cta_photographer")}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16">
            {/* Logo + tagline */}
            <div className="md:col-span-2">
              <Image
                src="/logo-baspen.svg"
                alt="Baspen"
                width={110}
                height={28}
                className="h-6 w-auto brightness-0 invert"
              />
              <p className="mt-4 text-gray-400 text-sm leading-relaxed max-w-md">
                {t("footer_tagline")}
              </p>
            </div>

            {/* Product links */}
            <div>
              <h4 className="font-semibold text-sm text-white mb-4">
                {t("footer_product")}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t("footer_features")}
                  </a>
                </li>
                <li>
                  <a
                    href="#monetization"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t("footer_pricing")}
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t("footer_demo")}
                  </a>
                </li>
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="font-semibold text-sm text-white mb-4">
                {t("footer_company")}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t("footer_about")}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t("footer_contact")}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t("footer_privacy")}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {t("footer_terms")}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              {t("footer_copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

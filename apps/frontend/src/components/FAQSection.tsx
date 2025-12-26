"use client";

import type { FAQItem } from "@api-navigator/shared/pseo";
import { useState } from "react";
import { useTranslations } from "next-intl";

type FAQSectionProps = {
  items: FAQItem[];
  title?: string;
  className?: string;
};

export function FAQSection({ items, title, className = "" }: FAQSectionProps) {
  const t = useTranslations("faq");
  const displayTitle = title ?? t("defaultTitle");
  if (items.length === 0) return null;

  const grouped = groupByCategory(items);
  const categories = Object.keys(grouped).filter(
    (cat) => grouped[cat].length > 0,
  );

  return (
    <section className={`ui-surface mt-6 p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        {displayTitle}
      </h2>

      {categories.map((category) => (
        <div key={category} className="mt-6 first:mt-0">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-3">
            {getCategoryDisplayName(category, t)}
          </h3>
          <div className="space-y-3">
            {grouped[category].map((item, idx) => (
              <FAQItem key={idx} item={item} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function FAQItem({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details
      className="group ui-surface-muted rounded-lg p-4 cursor-pointer transition-all"
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
    >
      <summary className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-green)] flex items-center justify-between select-none">
        <span>{item.question}</span>
        <svg
          className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed pl-1">
        {item.answer}
      </div>
      {item.keywords && item.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.keywords.map((keyword, idx) => (
            <span
              key={idx}
              className="text-xs text-[var(--text-muted)] ui-chip"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </details>
  );
}

function groupByCategory(items: FAQItem[]): Record<string, FAQItem[]> {
  const grouped: Record<string, FAQItem[]> = {
    technical: [],
    security: [],
    support: [],
    pricing: [],
    general: [],
  };

  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  }

  return grouped;
}

function getCategoryDisplayName(
  category: string,
  t: (key: string) => string,
): string {
  const names: Record<string, string> = {
    technical: t("categoryTechnical"),
    security: t("categorySecurity"),
    support: t("categorySupport"),
    pricing: t("categoryPricing"),
    general: t("categoryGeneral"),
  };
  return (
    names[category] || category.charAt(0).toUpperCase() + category.slice(1)
  );
}

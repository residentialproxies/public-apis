import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import type { Locale } from "@/i18n/config";
import { generateHreflangUrls, toLocalizedUrl } from "@/lib/locales";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

type Props = {
  params: Promise<{ locale: string }>;
};

type PrivacyCopy = {
  title: string;
  subtitle: string;
  intro: string;
  breadcrumbLabel: string;
  backToHome: string;
  sections: Array<{ heading: string; body: string }>;
  contactHeading: string;
  contactBody: string;
  updatedLabel: string;
};

const LAST_UPDATED = "2026-02-07";

const COPY: Record<Locale, PrivacyCopy> = {
  en: {
    title: "Privacy Policy",
    subtitle: "How Public API handles data responsibly",
    intro:
      "This policy explains what data we process, why we process it, and how we protect it for users and API providers.",
    breadcrumbLabel: "Privacy navigation",
    backToHome: "Back to catalog",
    sections: [
      {
        heading: "1. Data we collect",
        body: "We collect basic usage and operational telemetry needed for reliability, security, abuse prevention, and product improvement.",
      },
      {
        heading: "2. How we use data",
        body: "Collected data is used to run search, monitor API health, improve accuracy of listings, and maintain service performance.",
      },
      {
        heading: "3. Retention and protection",
        body: "We retain data for the minimum practical period and apply access controls, transport encryption, and regular security hardening.",
      },
      {
        heading: "4. Third-party processors",
        body: "Infrastructure and analytics providers may process limited data strictly to deliver the service. We do not sell personal data.",
      },
      {
        heading: "5. Your rights",
        body: "You may request access, correction, or deletion of personal data where applicable law grants those rights.",
      },
    ],
    contactHeading: "Privacy contact",
    contactBody:
      "For privacy requests or data-related questions, contact info@public-api.org.",
    updatedLabel: "Last updated",
  },
  zh: {
    title: "隐私政策",
    subtitle: "Public API 如何负责任地处理数据",
    intro:
      "本政策说明我们处理哪些数据、处理目的，以及如何保护用户与 API 提供方信息。",
    breadcrumbLabel: "隐私导航",
    backToHome: "返回目录",
    sections: [
      {
        heading: "1. 我们收集的数据",
        body: "我们仅收集保障稳定性、安全性、防滥用和产品改进所需的基础使用与运维数据。",
      },
      {
        heading: "2. 数据使用目的",
        body: "数据用于搜索能力、API 健康监控、目录质量提升以及整体性能保障。",
      },
      {
        heading: "3. 保留与保护",
        body: "我们按最小必要原则保留数据，并实施访问控制、传输加密和定期安全加固。",
      },
      {
        heading: "4. 第三方处理",
        body: "云基础设施与分析服务商可能在必要范围内处理数据，仅用于服务交付。我们不出售个人数据。",
      },
      {
        heading: "5. 你的权利",
        body: "在适用法律范围内，你可以申请访问、更正或删除个人数据。",
      },
    ],
    contactHeading: "隐私联系",
    contactBody: "隐私或数据请求请联系：info@public-api.org。",
    updatedLabel: "最近更新",
  },
  ja: {
    title: "プライバシーポリシー",
    subtitle: "Public API のデータ取扱い方針",
    intro:
      "本ポリシーは、収集するデータ、利用目的、保護方法を利用者と API 提供者向けに説明します。",
    breadcrumbLabel: "プライバシーナビゲーション",
    backToHome: "カタログへ戻る",
    sections: [
      {
        heading: "1. 収集するデータ",
        body: "信頼性・セキュリティ・不正防止・品質改善に必要な最小限の利用データを収集します。",
      },
      {
        heading: "2. 利用目的",
        body: "検索、API ヘルス監視、一覧品質の向上、サービス性能維持のために使用します。",
      },
      {
        heading: "3. 保存と保護",
        body: "必要最小期間のみ保持し、アクセス制御・通信暗号化・定期的なセキュリティ強化を行います。",
      },
      {
        heading: "4. 第三者処理",
        body: "インフラ/分析プロバイダがサービス提供のために限定的に処理する場合があります。個人データは販売しません。",
      },
      {
        heading: "5. 利用者の権利",
        body: "適用法に基づき、個人データへのアクセス・訂正・削除を請求できます。",
      },
    ],
    contactHeading: "お問い合わせ",
    contactBody:
      "プライバシーに関するお問い合わせは info@public-api.org までご連絡ください。",
    updatedLabel: "最終更新",
  },
  es: {
    title: "Politica de Privacidad",
    subtitle: "Como Public API gestiona los datos",
    intro:
      "Esta politica explica que datos procesamos, por que los procesamos y como los protegemos.",
    breadcrumbLabel: "Navegacion de privacidad",
    backToHome: "Volver al catalogo",
    sections: [
      {
        heading: "1. Datos recopilados",
        body: "Recopilamos solo datos operativos necesarios para fiabilidad, seguridad, prevencion de abuso y mejora del producto.",
      },
      {
        heading: "2. Uso de los datos",
        body: "Usamos datos para busqueda, monitoreo de salud de APIs, mejora de calidad del directorio y rendimiento del servicio.",
      },
      {
        heading: "3. Retencion y proteccion",
        body: "Conservamos datos el minimo tiempo posible y aplicamos controles de acceso, cifrado en transito y hardening continuo.",
      },
      {
        heading: "4. Terceros",
        body: "Proveedores de infraestructura y analitica pueden procesar datos limitados para operar el servicio. No vendemos datos personales.",
      },
      {
        heading: "5. Derechos",
        body: "Puedes solicitar acceso, correccion o eliminacion de datos personales cuando la ley aplicable lo permita.",
      },
    ],
    contactHeading: "Contacto de privacidad",
    contactBody:
      "Para solicitudes de privacidad o datos, escribe a info@public-api.org.",
    updatedLabel: "Ultima actualizacion",
  },
  "pt-BR": {
    title: "Politica de Privacidade",
    subtitle: "Como o Public API trata dados com responsabilidade",
    intro:
      "Esta politica explica quais dados processamos, por que processamos e como protegemos usuarios e provedores de API.",
    breadcrumbLabel: "Navegacao de privacidade",
    backToHome: "Voltar ao catalogo",
    sections: [
      {
        heading: "1. Dados coletados",
        body: "Coletamos apenas telemetria basica necessaria para confiabilidade, seguranca, prevencao de abuso e melhoria do produto.",
      },
      {
        heading: "2. Como usamos os dados",
        body: "Os dados apoiam busca, monitoramento de saude das APIs, qualidade do catalogo e desempenho da plataforma.",
      },
      {
        heading: "3. Retencao e protecao",
        body: "Retemos dados pelo menor periodo pratico e aplicamos controles de acesso, criptografia em transito e reforco continuo de seguranca.",
      },
      {
        heading: "4. Processadores terceirizados",
        body: "Fornecedores de infraestrutura e analise podem processar dados limitados apenas para entregar o servico. Nao vendemos dados pessoais.",
      },
      {
        heading: "5. Seus direitos",
        body: "Quando a lei aplicavel permitir, voce pode solicitar acesso, correcao ou exclusao de dados pessoais.",
      },
    ],
    contactHeading: "Contato de privacidade",
    contactBody:
      "Para solicitacoes de privacidade e dados, fale com info@public-api.org.",
    updatedLabel: "Ultima atualizacao",
  },
  de: {
    title: "Datenschutzerklarung",
    subtitle: "Wie Public API Daten verantwortungsvoll verarbeitet",
    intro:
      "Diese Richtlinie beschreibt, welche Daten wir verarbeiten, warum wir sie verarbeiten und wie wir sie schutzen.",
    breadcrumbLabel: "Datenschutz-Navigation",
    backToHome: "Zuruck zum Katalog",
    sections: [
      {
        heading: "1. Erhobene Daten",
        body: "Wir erfassen nur grundlegende Nutzungs- und Betriebsdaten fur Zuverlassigkeit, Sicherheit, Missbrauchsschutz und Produktverbesserung.",
      },
      {
        heading: "2. Verwendungszwecke",
        body: "Die Daten dienen Suche, API-Health-Monitoring, Qualitatsverbesserung des Verzeichnisses und stabiler Serviceleistung.",
      },
      {
        heading: "3. Aufbewahrung und Schutz",
        body: "Wir speichern Daten nur so lange wie notwendig und nutzen Zugriffskontrollen, Transportverschlusselung und regelmaige Sicherheits-Hardening-Massnahmen.",
      },
      {
        heading: "4. Drittanbieter",
        body: "Infrastruktur- und Analyseanbieter konnen begrenzte Daten zur Diensterbringung verarbeiten. Wir verkaufen keine personenbezogenen Daten.",
      },
      {
        heading: "5. Ihre Rechte",
        body: "Soweit gesetzlich vorgesehen, konnen Sie Auskunft, Berichtigung oder Loschung personenbezogener Daten anfordern.",
      },
    ],
    contactHeading: "Datenschutzkontakt",
    contactBody:
      "Bei Datenschutzanfragen kontaktieren Sie bitte info@public-api.org.",
    updatedLabel: "Zuletzt aktualisiert",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = (locale as Locale) in COPY ? (locale as Locale) : "en";
  const content = COPY[typedLocale];
  const siteUrl = getSiteUrl();
  const localizedUrl = toLocalizedUrl(siteUrl, "/privacy", typedLocale);

  return {
    title: `${content.title} | ${SITE_NAME}`,
    description: content.subtitle,
    alternates: {
      canonical: localizedUrl,
      languages: generateHreflangUrls("/privacy", siteUrl),
    },
    openGraph: {
      title: `${content.title} | ${SITE_NAME}`,
      description: content.subtitle,
      url: localizedUrl,
      type: "website",
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = (locale as Locale) in COPY ? (locale as Locale) : "en";
  const content = COPY[typedLocale];
  const siteUrl = getSiteUrl();
  const localizedUrl = toLocalizedUrl(siteUrl, "/privacy", typedLocale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.title,
    description: content.subtitle,
    url: localizedUrl,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: siteUrl,
    },
    dateModified: LAST_UPDATED,
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      <nav aria-label={content.breadcrumbLabel}>
        <Link
          href="/"
          className="group flex items-center gap-2 font-mono text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-green)]"
        >
          <span className="text-[var(--accent-cyan)]">cd</span>
          <span className="text-[var(--text-muted)]">&gt;</span>
          <span>{content.backToHome}</span>
        </Link>
      </nav>

      <header className="terminal-surface-elevated p-6">
        <h1 className="font-mono text-2xl font-bold text-[var(--text-primary)]">
          <span className="text-[var(--accent-cyan)]">$</span> {content.title}
        </h1>
        <p className="mt-3 font-mono text-sm text-[var(--text-muted)]">
          <span className="text-[var(--accent-purple)]">//</span>{" "}
          {content.subtitle}
        </p>
      </header>

      <section className="terminal-surface p-6 space-y-4">
        <p className="font-mono text-sm text-[var(--text-secondary)]">
          {content.intro}
        </p>
        {content.sections.map((section) => (
          <article key={section.heading} className="space-y-2">
            <h2 className="font-mono text-sm font-semibold text-[var(--accent-green)]">
              {section.heading}
            </h2>
            <p className="font-mono text-sm text-[var(--text-secondary)]">
              {section.body}
            </p>
          </article>
        ))}
      </section>

      <section className="terminal-surface p-6 space-y-2">
        <h2 className="font-mono text-sm font-semibold text-[var(--accent-cyan)]">
          {content.contactHeading}
        </h2>
        <p className="font-mono text-sm text-[var(--text-secondary)]">
          {content.contactBody}
        </p>
        <p className="font-mono text-xs text-[var(--text-dim)]">
          {content.updatedLabel}: {LAST_UPDATED}
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}

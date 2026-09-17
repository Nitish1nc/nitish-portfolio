import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Compass,
  Cpu,
  ExternalLink,
  FileText,
  Inbox,
  Linkedin,
  Mail,
  PenLine,
  Server,
  Sparkles,
} from 'lucide-react';
import { artifacts, tagOrder, tagLabel, Artifact, ArtifactStatus } from './content';

// ==========================================
// DATA LAYER (static sections; artifacts live in content/)
// ==========================================
const siteData = {
  hero: {
    name: "Nitish Chauhan",
    titles: ["Content Strategist.", "AI Systems Builder.", "Technical Content Writer."],
    description: "I make complex B2B products make sense, and I build the AI capture and agent systems I wish content teams already had.",
    keywords: ["Content Strategy", "Technical Writing", "B2B SaaS", "Product Marketing", "SEO", "AI", "Systems Building", "Agent Middleware", "Self-hosted Infra", "Knowledge Management"]
  },
  expertise: [
    { skill: "Content Strategy", level: 95 },
    { skill: "Technical Writing", level: 90 },
    { skill: "B2B SaaS Product Marketing", level: 85 },
    { skill: "SEO & Keyword Research", level: 88 },
    { skill: "Information Architecture", level: 80 },
    { skill: "AI-assisted Workflows", level: 92 },
  ],
  thinkingLibrary: [
    { id: 1, category: "Psychology", title: "Behavioral Psychology in User Education" },
    { id: 2, category: "Business", title: "Business Thinking for Content Marketers" },
    { id: 3, category: "Decision Making", title: "Decision Science Frameworks" },
    { id: 4, category: "Marketing AI", title: "Marketing AI Integration Systems" },
  ],
  experience: [
    {
      id: 1,
      year: "2024 - Present",
      role: "Content Marketing Strategist",
      company: "Freelance",
      description: "Designing content systems for B2B SaaS while shipping personal AI infrastructure: agent runtime, cognitive capture, and a self-hosted ops surface.",
      tags: ["B2B SaaS", "SEO", "AI", "Product Marketing"]
    },
    {
      id: 2,
      year: "2022 - 2024",
      role: "Technical Content Writer",
      company: "Smartlead",
      description: "Operated growth and AI-heavy workflows for cold email / deliverability; translated complex product mechanics into accessible education and landing pages.",
      tags: ["Technical Documentation", "Growth", "B2B SaaS"]
    }
  ],
  writing: [
    { id: 1, title: "Your funnel isn't leaking. It's measuring the wrong thing.", date: "Draft", tag: "Content Strategy" },
    { id: 2, title: "Every AI product looks the same now. Here is the structural reason why.", date: "Draft", tag: "AI" },
    { id: 3, title: "Healthcare AI doesn't have a technology trust problem. It has a language problem.", date: "Draft", tag: "Technical Writing" },
    { id: 4, title: "Your executives don't have a visibility problem. They have a point-of-view problem.", date: "Draft", tag: "Content Strategy" },
  ],
  links: {
    linkedin: "https://www.linkedin.com/in/nitish-chauhan-403b36230/",
    email: "mailto:connect@nitishchauhan.com",
    labs: "https://labs.nitishchauhan.com/",
    writingHub: "https://library.nitishchauhan.com/",
    resume: "/nitish-chauhan-technical-writer-cv.pdf",
  },
};

// ==========================================
// UI PRIMITIVES
// ==========================================

const Section = ({ id, className = "", children }) => (
  <section id={id} className={`py-24 md:py-32 w-full max-w-5xl mx-auto px-6 md:px-12 ${className}`}>
    {children}
  </section>
);

const SectionHeading = ({ title, subtitle }) => (
  <div className="mb-12 md:mb-16">
    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-4">{title}</h2>
    {subtitle && <p className="text-lg text-slate-500 max-w-2xl">{subtitle}</p>}
  </div>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-slate-200 rounded-[16px] p-6 md:p-8 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ease-in-out ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 ${className}`}>
    {children}
  </span>
);

const STATUS_META: Record<ArtifactStatus, { label: string; badge: string; dot: string }> = {
  live: { label: "Live", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  prototype: { label: "Prototype", badge: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  "in-progress": { label: "In progress", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  planned: { label: "Planned", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
};

const StatusBadge = ({ status }: { status: ArtifactStatus }) => {
  const meta = STATUS_META[status] || STATUS_META.planned;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${meta.dot} ${status === 'live' ? 'animate-pulse' : ''}`}></span>
      {meta.label}
    </span>
  );
};

// ==========================================
// ARTIFACT REGISTRY
// ==========================================

const TAG_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "ai-systems": Cpu,
  content: PenLine,
  visuals: Compass,
  capture: Inbox,
  infra: Server,
};

const iconForTags = (tags: string[]) => TAG_ICONS[tags[0]] || Sparkles;

const ArtifactCard = ({ artifact, featured = false }: { artifact: Artifact; featured?: boolean }) => {
  const Icon = iconForTags(artifact.tags);
  const inner = (
    <>
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        {artifact.cover ? (
          <img
            src={artifact.cover}
            alt={`${artifact.title} preview`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-sky-100/60">
            <Icon className="h-10 w-10 text-slate-300" />
          </div>
        )}
      </div>
      <div className={featured ? "p-6 md:p-7" : "p-6"}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={artifact.status} />
          {artifact.tags.map((tag) => (
            <Badge key={tag}>{tagLabel(tag)}</Badge>
          ))}
        </div>
        <h3 className={`font-medium text-slate-900 mb-2 ${featured ? "text-2xl" : "text-xl"}`}>{artifact.title}</h3>
        <p className="text-slate-500 leading-relaxed">{artifact.oneLiner}</p>
        {featured && artifact.body && (
          <p className="mt-3 text-slate-600 leading-relaxed line-clamp-3">{artifact.body}</p>
        )}
        {artifact.url && (
          <span className="mt-4 inline-flex items-center text-sm font-medium text-slate-500 transition-colors group-hover:text-slate-900">
            Visit <ArrowUpRight className="ml-1 h-4 w-4" />
          </span>
        )}
      </div>
    </>
  );
  const shell =
    "group flex h-full flex-col overflow-hidden rounded-[16px] border border-slate-200 bg-white text-left transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]";
  return artifact.url ? (
    <a href={artifact.url} target="_blank" rel="noopener noreferrer" className={shell}>
      {inner}
    </a>
  ) : (
    <div className={shell}>{inner}</div>
  );
};

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-slate-900 bg-slate-900 text-white"
        : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
    }`}
  >
    {label}
  </button>
);

const Registry = () => {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const featured = artifacts.filter((a) => a.featured);
  const countFor = (tag: string | null) =>
    tag === null ? artifacts.length : artifacts.filter((a) => a.tags.includes(tag)).length;
  const gridItems = activeTag
    ? artifacts.filter((a) => a.tags.includes(activeTag))
    : artifacts.filter((a) => !a.featured);

  return (
    <Section id="work" className="bg-slate-50/50">
      <SectionHeading
        title="Selected Work"
        subtitle="Demonstrable pieces across content, AI systems, and self-hosted infra. Filter by what you came for."
      />

      {!activeTag && (
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {featured.map((artifact) => (
            <ArtifactCard key={artifact.slug} artifact={artifact} featured />
          ))}
        </div>
      )}

      <div className="mb-8 flex flex-wrap gap-2">
        <FilterChip label={`All (${countFor(null)})`} active={activeTag === null} onClick={() => setActiveTag(null)} />
        {tagOrder.map((tag) => (
          <FilterChip
            key={tag}
            label={`${tagLabel(tag)} (${countFor(tag)})`}
            active={activeTag === tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
          />
        ))}
      </div>

      {gridItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((artifact) => (
            <ArtifactCard key={artifact.slug} artifact={artifact} />
          ))}
        </div>
      ) : (
        <p className="text-slate-500">Nothing under this tag yet. Check back soon.</p>
      )}
    </Section>
  );
};

// ==========================================
// PAGE SECTIONS
// ==========================================

const Hero = () => (
  <section className="hero-shell relative w-full">
    <div className="min-h-[90vh] flex flex-col justify-center items-center text-center w-full max-w-5xl mx-auto px-6 md:px-12 py-20 md:py-24">
      <div className="mb-8 md:mb-10">
        <div className="relative mx-auto w-44 h-44 md:w-56 md:h-56">
          <div
            aria-hidden="true"
            className="absolute -inset-7 rounded-full bg-sky-200/40 blur-2xl"
          />
          <img
            src="/nitish-dp.webp"
            alt="Nitish Chauhan"
            width={224}
            height={224}
            className="hero-portrait relative w-full h-full rounded-full object-cover object-[center_18%]"
          />
        </div>
      </div>

      <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-slate-900 leading-[1.05] mb-5">
        {siteData.hero.name}
      </h1>

      <p className="text-xl md:text-2xl text-slate-500 font-medium leading-snug max-w-2xl mb-4">
        {siteData.hero.titles.join(" ")}
      </p>

      <p className="text-lg md:text-xl text-slate-600 max-w-xl mb-10 leading-relaxed">
        {siteData.hero.description}
      </p>

      <div className="flex flex-wrap gap-3 md:gap-4 items-center justify-center">
        <a
          href="#work"
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-full text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm shadow-slate-900/15"
        >
          View Work <ArrowRight className="ml-2 w-4 h-4" />
        </a>
        <a
          href={siteData.links.email}
          className="inline-flex items-center justify-center px-6 py-3 border border-slate-300/80 text-base font-medium rounded-full text-slate-800 bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
        >
          Get in touch <ArrowUpRight className="ml-2 w-4 h-4 text-slate-400" />
        </a>
      </div>

      <div className="sr-only">
        Keywords: {siteData.hero.keywords.join(", ")}
      </div>
    </div>
  </section>
);

const Expertise = () => (
  <Section id="expertise">
    <SectionHeading title="Expertise" subtitle="Core competencies mapped by depth of experience." />
    <div className="max-w-3xl space-y-8">
      {siteData.expertise.map((item, idx) => (
        <div key={idx} className="group">
          <div className="flex justify-between items-end mb-2">
            <span className="text-base font-medium text-slate-900">{item.skill}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-slate-800 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${item.level}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  </Section>
);

const ThinkingLibrary = () => (
  <Section id="thinking" className="bg-slate-50/50">
    <SectionHeading title="Thinking Frameworks" subtitle="A structured library of mental models across different disciplines." />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
      {siteData.thinkingLibrary.map((item) => (
        <Card key={item.id}>
          <div>
            <span className="text-sm font-medium text-slate-400 mb-1 block">{item.category}</span>
            <h3 className="text-lg font-medium text-slate-900">{item.title}</h3>
          </div>
        </Card>
      ))}
    </div>
  </Section>
);

const Experience = () => (
  <Section id="experience">
    <SectionHeading title="Professional Experience" subtitle="A brief history of roles and responsibilities." />
    <div className="space-y-12 max-w-3xl">
      {siteData.experience.map((exp) => (
        <div key={exp.id} className="relative pl-8 md:pl-0">
          <div className="md:hidden absolute left-0 top-2 bottom-0 w-px bg-slate-200"></div>
          <div className="md:hidden absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-slate-400"></div>

          <div className="md:grid md:grid-cols-4 md:gap-8 items-start">
            <div className="md:col-span-1 md:text-right md:pt-1 mb-2 md:mb-0">
              <span className="text-sm font-medium text-slate-400 font-mono tracking-tight">{exp.year}</span>
            </div>
            <div className="md:col-span-3 pb-8 md:pb-12 md:border-l md:border-slate-200 md:pl-8 relative group">
              <div className="hidden md:block absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-slate-200 group-hover:bg-slate-400 transition-colors"></div>

              <h3 className="text-xl font-medium text-slate-900">{exp.role}</h3>
              <p className="text-lg text-slate-500 mb-4">{exp.company}</p>
              <p className="text-slate-600 mb-6 leading-relaxed">{exp.description}</p>
              <div className="flex flex-wrap gap-2">
                {exp.tags.map(tag => <Badge key={tag} className="bg-slate-50">{tag}</Badge>)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </Section>
);

const Writing = () => (
  <Section id="writing" className="bg-slate-50/50">
    <SectionHeading title="Writing Library" subtitle="Recent essays, notes, and technical articles." />
    <div className="max-w-3xl flex flex-col space-y-4">
      {siteData.writing.map((post) => (
        <div key={post.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 -mx-4 rounded-xl">
          <div className="mb-2 md:mb-0">
            <h3 className="text-lg font-medium text-slate-900">{post.title}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-400 font-mono tracking-tight">{post.date}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-sm text-slate-500">{post.tag}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="pt-8">
        <a href={siteData.links.writingHub} className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          Browse the Library <ArrowRight className="ml-2 w-4 h-4" />
        </a>
      </div>
    </div>
  </Section>
);

const Contact = () => (
  <Section id="contact" className="border-t border-slate-100 text-center md:text-left py-32">
    <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-8">
      Let's build something meaningful.
    </h2>
    <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
      <a href={siteData.links.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center text-lg text-slate-600 hover:text-slate-900 transition-colors">
        <Linkedin className="w-5 h-5 mr-2" /> LinkedIn
      </a>
      <a href={siteData.links.email} className="flex items-center text-lg text-slate-600 hover:text-slate-900 transition-colors">
        <Mail className="w-5 h-5 mr-2" /> Email
      </a>
      <a href={siteData.links.labs} target="_blank" rel="noopener noreferrer" className="flex items-center text-lg text-slate-600 hover:text-slate-900 transition-colors">
        <BookOpen className="w-5 h-5 mr-2" /> NitishLabs
      </a>
      <a href={siteData.links.resume} target="_blank" rel="noopener noreferrer" className="flex items-center text-lg text-slate-600 hover:text-slate-900 transition-colors">
        <FileText className="w-5 h-5 mr-2" /> Resume
      </a>
      <a href={siteData.links.writingHub} target="_blank" rel="noopener noreferrer" className="flex items-center text-lg text-slate-600 hover:text-slate-900 transition-colors">
        <FileText className="w-5 h-5 mr-2" /> Library
      </a>
    </div>
  </Section>
);

// ==========================================
// MAIN APP LAYOUT
// ==========================================

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-sky-100">
      <main>
        <Hero />
        <Registry />
        <Expertise />
        <ThinkingLibrary />
        <Experience />
        <Writing />
        <Contact />
      </main>

      <footer className="py-8 text-center text-sm text-slate-400 border-t border-slate-50">
        <p>© {new Date().getFullYear()} Nitish Chauhan. Structured knowledge and clear thinking.</p>
      </footer>
    </div>
  );
}

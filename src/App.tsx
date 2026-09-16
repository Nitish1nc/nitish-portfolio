import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Mail, 
  Github, 
  Linkedin, 
  BookOpen, 
  FileText, 
  ExternalLink,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

// ==========================================
// DATA LAYER (Simulating JSON/Markdown API)
// ==========================================
const siteData = {
  hero: {
    name: "Nitish",
    titles: ["Content Strategist.", "Technical Content Writer.", "Research-driven Marketing Thinker."],
    description: "Helping companies explain complex products with clarity.",
    keywords: ["Content Strategy", "Technical Writing", "B2B SaaS", "Product Marketing", "SEO", "AI", "Knowledge Management"]
  },
  featuredWork: [
    {
      id: 1,
      title: "Framework Library",
      description: "A categorized collection of mental models for content strategy.",
      tags: ["Content Strategy", "Thought Leadership"],
      link: "#"
    },
    {
      id: 2,
      title: "Interview Playbooks",
      description: "Standardized operating procedures for extracting subject matter expertise.",
      tags: ["Product Education", "Knowledge Management"],
      link: "#"
    },
    {
      id: 3,
      title: "Excalidraw Thinking Maps",
      description: "Visual breakdowns of complex B2B SaaS architectures.",
      tags: ["Information Architecture", "Content Frameworks"],
      link: "#"
    }
  ],
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
      description: "Designing content systems, technical documentation, and SEO strategies for B2B SaaS companies.",
      tags: ["B2B SaaS", "SEO", "AI", "Product Marketing"]
    },
    {
      id: 2,
      year: "2022 - 2024",
      role: "Technical Content Writer",
      company: "TechCorp Inc.",
      description: "Translated complex engineering concepts into accessible product education and landing pages.",
      tags: ["Technical Documentation", "Landing Pages", "Blogs"]
    }
  ],
  experiments: [
    {
      id: 1,
      title: "Building an AI Research Workflow",
      status: "Active",
      description: "Designing a prompt engineering system for rapid market research.",
      tags: ["AI", "Prompt Engineering", "Research"]
    },
    {
      id: 2,
      title: "Nextcloud Knowledge Management",
      status: "Completed",
      description: "Setting up a self-hosted knowledge base for portfolio evolution.",
      tags: ["Knowledge Management", "Productivity"]
    },
    {
      id: 3,
      title: "Content Automation Engine",
      status: "Paused",
      description: "Exploring automated distribution using n8n and open-source models.",
      tags: ["Automation", "Workflow Design"]
    }
  ],
  writing: [
    { id: 1, title: "The Architecture of a Good Technical Tutorial", date: "Oct 12, 2024", tag: "Technical Writing" },
    { id: 2, title: "Why B2B SaaS Needs Less Marketing and More Education", date: "Sep 28, 2024", tag: "Content Strategy" },
    { id: 3, title: "SEO is Dead, Long Live Information Retrieval", date: "Sep 15, 2024", tag: "SEO" },
    { id: 4, title: "Mental Models for AI-Assisted Copywriting", date: "Aug 30, 2024", tag: "AI" },
  ]
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

const StatusBadge = ({ status }) => {
  const colors = {
    Active: "bg-emerald-100 text-emerald-700",
    Completed: "bg-blue-100 text-blue-700",
    Paused: "bg-amber-100 text-amber-700",
    Future: "bg-slate-100 text-slate-700"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.Future}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Active' ? 'bg-emerald-500 animate-pulse' : status === 'Completed' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
      {status}
    </span>
  );
};

// ==========================================
// PAGE SECTIONS
// ==========================================

const Hero = () => (
  <section className="min-h-[90vh] flex flex-col justify-center items-start w-full max-w-5xl mx-auto px-6 md:px-12 animate-in fade-in duration-1000">
    <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-slate-900 leading-tight mb-6">
      {siteData.hero.name}.<br />
      <span className="text-slate-400 block mt-2 text-4xl md:text-6xl">{siteData.hero.titles[0]}</span>
      <span className="text-slate-400 block mt-2 text-4xl md:text-6xl">{siteData.hero.titles[1]}</span>
    </h1>
    <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mb-12 font-light leading-relaxed">
      {siteData.hero.description}
    </p>
    
    <div className="flex flex-wrap gap-4 items-center">
      <a href="#featured" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-slate-900 hover:bg-slate-800 transition-colors">
        View Work <ArrowRight className="ml-2 w-4 h-4" />
      </a>
      <a href="#contact" className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 text-base font-medium rounded-full text-slate-700 bg-white hover:bg-slate-50 transition-colors">
        LinkedIn <ArrowUpRight className="ml-2 w-4 h-4 text-slate-400" />
      </a>
    </div>

    {/* Invisible ATS Keywords (Screen reader only or visually hidden to keep UI clean, but present in DOM) */}
    <div className="sr-only">
      Keywords: {siteData.hero.keywords.join(", ")}
    </div>
  </section>
);

const FeaturedWork = () => (
  <Section id="featured" className="bg-slate-50/50">
    <SectionHeading title="Selected Work" subtitle="Frameworks, playbooks, and architectural maps designed for clarity." />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {siteData.featuredWork.map((work) => (
        <Card key={work.id} className="group cursor-pointer flex flex-col h-full">
          <div className="h-40 w-full bg-slate-100 rounded-lg mb-6 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
            {work.id === 1 && <BookOpen className="w-10 h-10 text-slate-300" />}
            {work.id === 2 && <FileText className="w-10 h-10 text-slate-300" />}
            {work.id === 3 && <ExternalLink className="w-10 h-10 text-slate-300" />}
          </div>
          <h3 className="text-xl font-medium text-slate-900 mb-2">{work.title}</h3>
          <p className="text-slate-500 mb-6 flex-grow">{work.description}</p>
          <div className="flex flex-wrap gap-2 mt-auto">
            {work.tags.map(tag => <Badge key={tag}>{tag}</Badge>)}
          </div>
        </Card>
      ))}
    </div>
  </Section>
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
        <Card key={item.id} className="flex flex-col md:flex-row md:items-center justify-between cursor-pointer group hover:border-slate-300">
          <div>
            <span className="text-sm font-medium text-slate-400 mb-1 block">{item.category}</span>
            <h3 className="text-lg font-medium text-slate-900">{item.title}</h3>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors mt-4 md:mt-0 hidden md:block" />
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
          {/* Mobile Timeline Line */}
          <div className="md:hidden absolute left-0 top-2 bottom-0 w-px bg-slate-200"></div>
          <div className="md:hidden absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-slate-400"></div>
          
          <div className="md:grid md:grid-cols-4 md:gap-8 items-start">
            <div className="md:col-span-1 md:text-right md:pt-1 mb-2 md:mb-0">
              <span className="text-sm font-medium text-slate-400 font-mono tracking-tight">{exp.year}</span>
            </div>
            <div className="md:col-span-3 pb-8 md:pb-12 md:border-l md:border-slate-200 md:pl-8 relative group">
               {/* Desktop Timeline Dot */}
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

const Experiments = () => (
  <Section id="experiments" className="bg-slate-50/50">
    <SectionHeading title="Learning & Experiments" subtitle="Active research, side projects, and workflow optimizations." />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {siteData.experiments.map((exp) => (
        <Card key={exp.id} className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-medium text-slate-900 pr-4">{exp.title}</h3>
            <StatusBadge status={exp.status} />
          </div>
          <p className="text-slate-600 mb-6 flex-grow">{exp.description}</p>
          <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100">
             {exp.tags.map(tag => <Badge key={tag} className="bg-white border border-slate-100">{tag}</Badge>)}
          </div>
        </Card>
      ))}
    </div>
  </Section>
);

const Writing = () => (
  <Section id="writing">
    <SectionHeading title="Writing Library" subtitle="Recent essays, notes, and technical articles." />
    <div className="max-w-3xl flex flex-col space-y-4">
      {siteData.writing.map((post) => (
        <a key={post.id} href="#" className="group flex flex-col md:flex-row md:items-center justify-between p-4 -mx-4 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="mb-2 md:mb-0">
            <h3 className="text-lg font-medium text-slate-900 group-hover:text-slate-600 transition-colors">{post.title}</h3>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-sm text-slate-400 font-mono tracking-tight">{post.date}</span>
               <span className="w-1 h-1 rounded-full bg-slate-300"></span>
               <span className="text-sm text-slate-500">{post.tag}</span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors hidden md:block" />
        </a>
      ))}
      <div className="pt-8">
        <a href="#" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          View all writing <ArrowRight className="ml-2 w-4 h-4" />
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
      <a href="#" className="flex items-center text-lg text-slate-600 hover:text-slate-900 transition-colors">
        <Linkedin className="w-5 h-5 mr-2" /> LinkedIn
      </a>
      <a href="#" className="flex items-center text-lg text-slate-600 hover:text-slate-900 transition-colors">
        <Mail className="w-5 h-5 mr-2" /> Email
      </a>
      <a href="#" className="flex items-center text-lg text-slate-600 hover:text-slate-900 transition-colors">
        <Github className="w-5 h-5 mr-2" /> GitHub
      </a>
      <a href="#" className="flex items-center text-lg text-slate-600 hover:text-slate-900 transition-colors">
        <FileText className="w-5 h-5 mr-2" /> Resume
      </a>
    </div>
  </Section>
);

// ==========================================
// MAIN APP LAYOUT
// ==========================================

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-100">
      <main>
        <Hero />
        <FeaturedWork />
        <Expertise />
        <ThinkingLibrary />
        <Experience />
        <Experiments />
        <Writing />
        <Contact />
      </main>
      
      {/* Minimal Footer */}
      <footer className="py-8 text-center text-sm text-slate-400 border-t border-slate-50">
        <p>© {new Date().getFullYear()} Nitish. Structured knowledge and clear thinking.</p>
      </footer>
    </div>
  );
}
import { Link } from 'react-router-dom';
import {
  Landmark, CheckCircle2, ShieldCheck, Database, Network,
  Wallet, Sprout, Map, ScrollText, GraduationCap, Bot
} from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

const PILLARS = [
  {
    icon: Database,
    title: 'Curated Scheme Knowledge Base',
    subtitle: 'Structured Government Scheme Data',
    text: 'Scheme details — eligibility, benefits, and application steps — are compiled from official sources and stored in a structured database, rather than relying on a language model to recall facts from memory.',
    footnote: 'Sourced from official scheme portals such as MyScheme and departmental websites',
  },
  {
    icon: ShieldCheck,
    title: 'Retrieval-Augmented Generation (RAG)',
    subtitle: 'Grounded, Not Guessed',
    text: 'When you ask a question, the system retrieves the most relevant scheme records first, then asks the language model to answer using only that retrieved information — reducing the risk of the AI inventing details.',
    footnote: 'Semantic search via vector embeddings, not keyword matching',
  },
  {
    icon: Landmark,
    title: 'Built as a Final-Year Academic Project',
    subtitle: 'Transparent About What It Is',
    text: 'SchemeSaathi is a student-built demonstration of applying RAG and conversational AI to a real information-access problem — not an official government platform, and not a production-scale service.',
    footnote: 'Developed at Dronacharya Group of Institutions, Greater Noida',
  },
];

const PIPELINE = [
  {
    phase: 'PHASE 01',
    title: 'Citizen Query',
    text: 'A user describes their situation in natural language through the Chat Assistant, or fills in the structured Eligibility Form.',
    detail: 'Input: free text or form fields',
  },
  {
    phase: 'PHASE 02',
    title: 'Semantic Retrieval',
    text: 'The query is converted into a vector embedding and compared against scheme embeddings stored in the vector database to find the closest matches.',
    detail: 'Engine: ChromaDB vector search',
  },
  {
    phase: 'PHASE 03',
    title: 'Grounded Generation',
    text: 'The matched scheme records are passed to a language model, which is instructed to answer using only that retrieved data.',
    detail: 'Model: Groq-hosted LLM',
  },
  {
    phase: 'PHASE 04',
    title: 'Response with Sources',
    text: 'The generated answer is returned along with the actual scheme records it was based on, so the source is always visible and verifiable.',
    detail: 'Output: answer + linked scheme cards',
  },
];

const DATA_SOURCES = [
  { icon: Network, title: 'MyScheme (myscheme.gov.in)', tag: 'National Scheme Portal', text: 'Central government aggregator for scheme descriptions and eligibility criteria referenced during data collection.' },
  { icon: Wallet, title: 'Scheme Ministry Portals', tag: 'e.g. PM-KISAN, PMAY, PM-JAY', text: 'Individual scheme websites used to verify benefit amounts and application processes.' },
  { icon: Sprout, title: 'Department of Agriculture & Farmers Welfare', tag: 'Agricultural Schemes', text: 'Source for farmer-focused scheme details such as PM-KISAN and crop insurance programs.' },
  { icon: Map, title: 'State Government Portals', tag: 'State-Specific Schemes', text: 'Used where a scheme is state-administered rather than central.' },
  { icon: ScrollText, title: 'Government of India News & Circulars', tag: 'Policy Updates', text: 'Referenced to keep subsidy figures and scheme continuations current at time of writing.' },
];

function StatCard({ label, value, sub, tone = 'text-primary' }) {
  return (
    <div className="space-y-1">
      <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</div>
      <div className={`font-headline-xl text-headline-xl ${tone}`}>{value}</div>
      <p className="font-body-sm text-body-sm text-on-surface-variant">{sub}</p>
    </div>
  );
}

export default function About() {
  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <SiteHeader active="about" />

      <main className="w-full pt-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

          {/* Page header */}
          <section className="bg-surface-container-low rounded-xl p-6 md:p-8 mb-8">
            <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-4">
              <Landmark size={16} />
              <span>SchemeSaathi</span>
              <span>/</span>
              <span className="text-primary font-bold">About the Project</span>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-secondary font-label-md text-label-md uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                Final-Year B.Tech Project
              </div>
              <h1 className="font-headline-xl text-headline-xl text-primary max-w-3xl tracking-tight">
                Making Government Welfare Schemes Easier to Discover
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                India has hundreds of government welfare schemes, but finding the ones relevant to a specific person's
                situation usually means searching multiple portals and decoding formal eligibility language.
                SchemeSaathi is a Retrieval-Augmented Generation (RAG) assistant built to make that discovery process
                conversational and grounded in real scheme data.
              </p>
            </div>
          </section>

          {/* Honest scope stats */}
          <section className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-surface-container p-6 rounded-xl">
              <StatCard
                label="Project Stage"
                value="Prototype"
                sub="Actively being built and tested as a final-year submission"
              />
              <StatCard
                label="Approach"
                value="RAG-Based"
                sub="Vector search + grounded language model generation"
                tone="text-secondary"
              />
              <StatCard
                label="Access"
                value="Free"
                sub="No cost, no login required to use the assistant"
              />
            </div>
          </section>

          {/* Three pillars */}
          <section className="mb-12 space-y-6">
            <h2 className="font-headline-lg text-headline-lg text-primary">How SchemeSaathi Is Designed</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PILLARS.map((p, i) => (
                <article key={i} className="bg-surface-container-lowest p-6 rounded-xl flex flex-col justify-between shadow-sm space-y-4">
                  <div className="space-y-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-primary-container text-on-primary">
                      <p.icon size={16} />
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-primary">{p.title}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{p.text}</p>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded space-y-1">
                    <div className="font-label-sm text-label-sm text-primary font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-secondary" />
                      {p.subtitle}
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{p.footnote}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Pipeline */}
          <section className="mb-12 bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm space-y-8">
            <div className="space-y-2 max-w-2xl">
              <h2 className="font-headline-lg text-headline-lg text-primary">How a Query Gets Answered</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                The actual pipeline behind every response in the Chat Assistant and Eligibility Checker.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {PIPELINE.map((step, i) => (
                <div key={i} className="bg-surface-container-low p-4 rounded-lg space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="font-label-sm text-label-sm text-secondary font-bold">{step.phase}</div>
                    <h4 className="font-headline-sm text-headline-sm text-primary">{step.title}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{step.text}</p>
                  </div>
                  <div className="pt-2 font-label-sm text-label-sm text-on-surface-variant">{step.detail}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Data sources */}
          <section className="mb-12 space-y-4">
            <div className="space-y-1">
              <h2 className="font-headline-lg text-headline-lg text-primary">Where Scheme Data Comes From</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                SchemeSaathi does not maintain an official scheme registry. Scheme details were manually compiled from
                the following public sources during development.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DATA_SOURCES.map((src, i) => (
                <div key={i} className="p-4 bg-surface-container-lowest rounded-xl flex items-start gap-3 shadow-sm">
                  <div className="p-2 rounded bg-surface-container text-primary shrink-0">
                    <src.icon size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-label-lg text-label-lg text-primary">{src.title}</h4>
                    <span className="font-label-sm text-label-sm text-secondary block">{src.tag}</span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{src.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Academic context */}
          <section className="mb-12 bg-surface-container-lowest p-6 md:p-8 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap size={22} className="text-primary" />
              <h3 className="font-headline-sm text-headline-sm text-primary">Academic Context</h3>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              SchemeSaathi is being developed as a B.Tech final-year major project in Computer Science at Dronacharya
              Group of Institutions, Greater Noida (AKTU-affiliated), under faculty supervision. It explores the
              practical application of Retrieval-Augmented Generation, semantic search, and conversational AI to a
              real-world information-access problem: helping citizens navigate government welfare schemes without
              needing to know official terminology in advance.
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              As a student project, its scheme coverage is limited to a curated set of schemes rather than a
              comprehensive national database, and it should be treated as a working prototype rather than a
              production civic service.
            </p>
          </section>

          {/* CTA */}
          <section className="bg-primary text-on-primary rounded-xl p-6 md:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="font-headline-lg text-headline-lg text-on-primary">See It in Action</h2>
              <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">
                Try the Chat Assistant or the structured Eligibility Checker to see how the retrieval and generation pipeline responds to a real question.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              <Link
                className="w-full sm:w-auto inline-flex items-center justify-center font-label-lg text-label-lg bg-surface-container-lowest text-primary hover:bg-surface-container-low px-6 py-3 rounded font-bold transition-all shadow-sm"
                to="/eligibility"
              >
                Start Eligibility Check
              </Link>
              <Link
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-label-lg text-label-lg bg-primary-container text-on-primary hover:bg-primary-container/80 px-6 py-3 rounded font-bold transition-all"
                to="/chat"
              >
                <Bot size={18} />
                Consult the Assistant
              </Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

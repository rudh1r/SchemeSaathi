import { Link } from 'react-router-dom';
import {
  CheckCircle2, Bot, FileCheck, ChevronDown, Mic, Search,
  CheckSquare, Package, User
} from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

const TESTIMONIALS = [
  {
    name: '[Citizen Name]',
    role: '[Occupation, Location]',
    quote: '[Real citizen testimonial quote goes here — do not fabricate before you have one]',
    scheme: '[Scheme Name]',
    benefit: '[Benefit Amount]',
  },
  {
    name: '[Citizen Name]',
    role: '[Occupation, Location]',
    quote: '[Real citizen testimonial quote goes here — do not fabricate before you have one]',
    scheme: '[Scheme Name]',
    benefit: '[Benefit Amount]',
  },
  {
    name: '[Citizen Name]',
    role: '[Occupation, Location]',
    quote: '[Real citizen testimonial quote goes here — do not fabricate before you have one]',
    scheme: '[Scheme Name]',
    benefit: '[Benefit Amount]',
  },
];

function PlaceholderAvatar() {
  return (
    <div className="w-12 h-12 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0 text-on-surface-variant text-[10px] font-semibold">
      IMG
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <SiteHeader active="home" />

      <main className="w-full pt-28 bg-surface">
        <div className="flex flex-col w-full">

          <section className="relative w-full border-b border-outline-variant bg-surface-container-low/40 pt-10 pb-12">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col items-center text-center">
              <div className="max-w-4xl flex flex-col items-center gap-2 mb-4">
                <h1 className="font-headline-xl text-[34px] sm:text-[40px] text-primary tracking-tight leading-[1.2]">
                  Find the Government Schemes You Are Eligible For Instantly
                </h1>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-8 leading-normal">
                Describe your profile in plain Hindi or English, or complete a structured 2-minute eligibility check. Our civic engine cross-evaluates demographic, income, and state criteria against verified gazette guidelines.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-10">
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container border border-primary transition-all" to="/eligibility">
                  <CheckCircle2 size={18} />
                  <span>Check Your Eligibility</span>
                </Link>
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-surface-container-lowest text-primary font-label-lg text-label-lg font-semibold border border-outline-variant hover:bg-surface-container-low transition-all" to="/chat">
                  <Bot size={18} className="text-secondary" />
                  <span>Consult SchemeSaathi Assistant</span>
                </Link>
              </div>
            </div>
          </section>

          <section className="w-full py-12 bg-surface border-b border-outline-variant">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col gap-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-7 flex flex-col border border-outline-variant rounded bg-surface-container-lowest overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-primary text-on-primary border-b border-outline-variant">
                    <div className="flex items-center gap-2.5">
                      <span className="font-label-md text-label-md font-bold">SchemeSaathi Civic Discovery Assistant</span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col gap-4 bg-surface grow">
                    <div className="flex items-start justify-end gap-2.5 max-w-xl self-end">
                      <div className="p-3.5 rounded bg-surface-container-lowest border border-outline-variant text-on-surface">
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-outline-variant text-[11px] text-on-surface-variant">
                          <span>CITIZEN INQUIRY</span>
                          <span>[Sample Location] • Self-Declared</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface">
                          "[Example question a citizen might ask about their eligibility]"
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded border border-outline-variant bg-surface-container-low flex items-center justify-center shrink-0">
                        <User size={16} className="text-primary" />
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 max-w-xl self-start">
                      <div className="w-7 h-7 rounded bg-primary text-on-primary flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="flex flex-col gap-3 p-4 rounded bg-surface-container-lowest border border-outline-variant w-full">
                        <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={18} className="text-secondary" />
                            <span className="font-label-md text-label-md font-bold text-primary">Matching Schemes Identified</span>
                          </div>
                          <span className="border border-secondary-container bg-secondary-container px-2 py-0.5 rounded text-[11px] font-semibold text-on-secondary-container">
                            Live Results
                          </span>
                        </div>

                        <div className="border border-outline-variant rounded p-3 bg-surface-container-low/50">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-headline-sm text-[16px] font-bold text-primary block">[Scheme Name]</span>
                              <span className="font-label-sm text-[11px] text-on-surface-variant block">[Issuing Ministry/Department]</span>
                            </div>
                            <span className="border border-secondary text-secondary bg-white font-label-sm text-[11px] px-2 py-0.5 rounded font-bold whitespace-nowrap">
                              [Benefit Amount]
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-dashed border-outline-variant grid grid-cols-2 gap-2 text-[12px]">
                            <div><span className="text-on-surface-variant block">[Criteria Label]:</span> <span className="font-semibold text-primary">[Value]</span></div>
                            <div><span className="text-on-surface-variant block">[Criteria Label]:</span> <span className="font-semibold text-primary">[Value]</span></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-label-sm text-on-surface-variant">
                          <span>Source: [Official Source Reference]</span>
                          <Link className="font-label-md text-label-md text-secondary font-semibold hover:underline" to="/chat">
                            Continue in Citizen Assistant
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t border-outline-variant bg-surface-container-lowest flex items-center gap-2">
                    <Mic size={18} className="text-outline pl-1" />
                    <input
                      className="bg-surface-container-low border border-outline-variant rounded px-3 py-1.5 grow font-body-sm text-body-sm text-on-surface outline-none focus:border-primary"
                      readOnly
                      type="text"
                      value="Ask in your language..."
                      onChange={() => {}}
                    />
                    <Link to="/chat" className="px-3.5 py-1.5 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5">
                      <Search size={16} />
                      <span>Search</span>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between border border-outline-variant rounded bg-surface-container-lowest p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                      <div className="flex items-center gap-2">
                        <FileCheck size={22} className="text-primary" />
                        <div>
                          <span className="font-headline-sm text-headline-sm font-bold text-primary block leading-tight">Eligibility Passbook</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Structured Assessment</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-surface-container-high rounded h-1 overflow-hidden">
                      <div className="bg-primary h-full w-1/2"></div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold text-primary">State of Domicile</label>
                        <div className="flex items-center justify-between px-3 py-2 rounded border border-outline-variant bg-surface-container-low font-body-sm text-body-sm text-primary font-medium">
                          <span>[State]</span>
                          <ChevronDown size={18} className="text-outline" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold text-primary">Category</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="px-2 py-1.5 rounded border border-outline-variant bg-surface-container-low text-center font-label-sm text-label-sm font-semibold text-primary">[Category]</div>
                          <div className="px-2 py-1.5 rounded border border-secondary bg-secondary text-center font-label-sm text-label-sm font-semibold text-on-secondary">[Gender]</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold text-primary">Annual Family Income</label>
                        <div className="px-3 py-2 rounded border border-outline-variant bg-surface-container-low flex items-center justify-between">
                          <span className="font-body-sm text-body-sm font-semibold text-primary">[Amount]</span>
                          <span className="font-label-sm text-[11px] px-1.5 py-0.5 rounded border border-secondary text-secondary bg-white font-bold">[Threshold Tag]</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full py-12 bg-surface-container-low/40 border-b border-outline-variant">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col gap-8">
              <div className="flex flex-col items-center text-center gap-1.5">
                <h2 className="font-headline-xl text-headline-xl text-primary font-bold">How SchemeSaathi Unlocks Your Rights</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                  Designed for absolute transparency and administrative accuracy across every taluk, gram panchayat, and municipal body.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-2.5">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">Gazette Retrieval Engine</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Standardized Open Government Schemas</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Inquiries in regional dialects or voice descriptions are mapped directly into statutory gazette criteria without algorithmic guesswork.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                    <CheckSquare size={16} className="text-secondary" />
                    <span>Sourced from Data.gov.in &amp; MyScheme</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-2.5">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">Deterministic Criteria Matching</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Income, Land &amp; Category Evaluation</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Cross-evaluates land holding thresholds, urban/rural BPL income tiers, minority status, and reservation quotas via verified rule matrices.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                    <CheckSquare size={16} className="text-secondary" />
                    <span>Dynamic State &amp; District Thresholds</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-2.5">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">Document &amp; Application Checklist</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Step-by-Step Portal Navigation</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Clear requirements for Aadhaar, Domicile, and Caste Certificates with direct links to respective state grievance and CSC centers.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                    <CheckSquare size={16} className="text-secondary" />
                    <span>Includes CSC &amp; Panchayat Contacts</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full py-12 bg-surface border-b border-outline-variant">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col gap-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-outline-variant">
                <div className="flex flex-col gap-1">
                  <h2 className="font-headline-xl text-headline-xl text-primary font-bold">Real Impact for Real Citizens</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    [Placeholder — add real testimonials once collected]
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <PlaceholderAvatar />
                        <div>
                          <span className="font-headline-sm text-[16px] text-primary font-bold block leading-tight">{t.name}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">{t.role}</span>
                        </div>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface leading-normal border-y border-dashed border-outline-variant py-3 my-1">
                        "{t.quote}"
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-label-sm">
                      <span className="border border-outline-variant bg-surface-container-low px-2 py-0.5 rounded font-medium text-primary">{t.scheme}</span>
                      <span className="font-bold text-secondary">{t.benefit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="w-full py-12 bg-primary text-on-primary">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col gap-1.5 max-w-xl text-center md:text-left">
                <h2 className="font-headline-xl text-headline-xl font-bold">Unclaimed Welfare Is a Lost Opportunity.</h2>
                <p className="font-body-md text-body-md text-on-primary-container">
                  Many welfare schemes go unused simply due to awareness gaps. Confirm what you may be entitled to in minutes.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:bg-[#155734] border border-[#155734] transition-all" to="/eligibility">
                  <CheckCircle2 size={17} />
                  <span>Start Eligibility Audit</span>
                </Link>
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-transparent text-on-primary hover:bg-[#1f2d42] font-label-md text-label-md font-semibold border border-outline-variant transition-all" to="/schemes">
                  <Package size={17} />
                  <span>Explore Directory</span>
                </Link>
              </div>
            </div>
          </section>

          <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant p-2.5 md:hidden flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 pl-1">
              <CheckCircle2 size={20} className="text-secondary" />
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-bold text-primary leading-tight">Check Welfare</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">[N] Active Schemes</span>
              </div>
            </div>
            <Link className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold" to="/eligibility">
              <span>Check Eligibility</span>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

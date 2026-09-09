import { Link } from 'react-router-dom';
import {
  CheckCircle2, Bot, FileCheck, ChevronDown, Mic, Search,
  CheckSquare, Package, User
} from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { useLanguage } from '../context/LanguageContext';

function PlaceholderAvatar() {
  return (
    <div className="w-12 h-12 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0 text-on-surface-variant text-[10px] font-semibold">
      IMG
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();

  const testimonials = [
    { name: '[Citizen Name]', role: '[Occupation, Location]', quote: t('testimonials_subtitle'), scheme: '[Scheme Name]', benefit: '[Benefit Amount]' },
    { name: '[Citizen Name]', role: '[Occupation, Location]', quote: t('testimonials_subtitle'), scheme: '[Scheme Name]', benefit: '[Benefit Amount]' },
    { name: '[Citizen Name]', role: '[Occupation, Location]', quote: t('testimonials_subtitle'), scheme: '[Scheme Name]', benefit: '[Benefit Amount]' },
  ];

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <SiteHeader active="home" />

      <main className="w-full pt-28 bg-surface">
        <div className="flex flex-col w-full">

          <section className="relative w-full border-b border-outline-variant bg-surface-container-low/40 pt-10 pb-12">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col items-center text-center">
              <div className="max-w-4xl flex flex-col items-center gap-2 mb-4">
                <h1 className="font-headline-xl text-[34px] sm:text-[40px] text-primary tracking-tight leading-[1.2]">
                  {t('hero_title')}
                </h1>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-8 leading-normal">
                {t('hero_subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-10">
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container border border-primary transition-all" to="/eligibility">
                  <CheckCircle2 size={18} />
                  <span>{t('hero_cta_primary')}</span>
                </Link>
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-surface-container-lowest text-primary font-label-lg text-label-lg font-semibold border border-outline-variant hover:bg-surface-container-low transition-all" to="/chat">
                  <Bot size={18} className="text-secondary" />
                  <span>{t('hero_cta_secondary')}</span>
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
                      <span className="font-label-md text-label-md font-bold">{t('demo_assistant_title')}</span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col gap-4 bg-surface grow">
                    <div className="flex items-start justify-end gap-2.5 max-w-xl self-end">
                      <div className="p-3.5 rounded bg-surface-container-lowest border border-outline-variant text-on-surface">
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-outline-variant text-[11px] text-on-surface-variant">
                          <span>{t('demo_inquiry_label')}</span>
                          <span>{t('demo_sample_location')}</span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface">
                          "{t('demo_sample_question')}"
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
                            <span className="font-label-md text-label-md font-bold text-primary">{t('demo_matching_title')}</span>
                          </div>
                          <span className="border border-secondary-container bg-secondary-container px-2 py-0.5 rounded text-[11px] font-semibold text-on-secondary-container">
                            {t('demo_live_results')}
                          </span>
                        </div>

                        <div className="border border-outline-variant rounded p-3 bg-surface-container-low/50">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-headline-sm text-[16px] font-bold text-primary block">{t('demo_scheme_name')}</span>
                              <span className="font-label-sm text-[11px] text-on-surface-variant block">{t('demo_ministry')}</span>
                            </div>
                            <span className="border border-secondary text-secondary bg-white font-label-sm text-[11px] px-2 py-0.5 rounded font-bold whitespace-nowrap">
                              {t('demo_benefit')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-label-sm text-on-surface-variant">
                          <span>{t('demo_source')}</span>
                          <Link className="font-label-md text-label-md text-secondary font-semibold hover:underline" to="/chat">
                            {t('demo_continue')}
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
                      value={t('demo_ask_placeholder')}
                      onChange={() => {}}
                    />
                    <Link to="/chat" className="px-3.5 py-1.5 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5">
                      <Search size={16} />
                      <span>{t('demo_search_btn')}</span>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 flex flex-col justify-between border border-outline-variant rounded bg-surface-container-lowest p-5">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                      <div className="flex items-center gap-2">
                        <FileCheck size={22} className="text-primary" />
                        <div>
                          <span className="font-headline-sm text-headline-sm font-bold text-primary block leading-tight">{t('passbook_title')}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{t('passbook_subtitle')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-surface-container-high rounded h-1 overflow-hidden">
                      <div className="bg-primary h-full w-1/2"></div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold text-primary">{t('passbook_state_label')}</label>
                        <div className="flex items-center justify-between px-3 py-2 rounded border border-outline-variant bg-surface-container-low font-body-sm text-body-sm text-primary font-medium">
                          <span>[State]</span>
                          <ChevronDown size={18} className="text-outline" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold text-primary">{t('passbook_category_label')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="px-2 py-1.5 rounded border border-outline-variant bg-surface-container-low text-center font-label-sm text-label-sm font-semibold text-primary">[Category]</div>
                          <div className="px-2 py-1.5 rounded border border-secondary bg-secondary text-center font-label-sm text-label-sm font-semibold text-on-secondary">[Gender]</div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold text-primary">{t('passbook_income_label')}</label>
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
                <h2 className="font-headline-xl text-headline-xl text-primary font-bold">{t('pillars_title')}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                  {t('pillars_subtitle')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-2.5">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{t('pillar1_title')}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{t('pillar1_subtitle')}</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">{t('pillar1_text')}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                    <CheckSquare size={16} className="text-secondary" />
                    <span>{t('pillar1_footnote')}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-2.5">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{t('pillar2_title')}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{t('pillar2_subtitle')}</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">{t('pillar2_text')}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                    <CheckSquare size={16} className="text-secondary" />
                    <span>{t('pillar2_footnote')}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-2.5">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">{t('pillar3_title')}</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">{t('pillar3_subtitle')}</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">{t('pillar3_text')}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                    <CheckSquare size={16} className="text-secondary" />
                    <span>{t('pillar3_footnote')}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full py-12 bg-surface border-b border-outline-variant">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col gap-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-outline-variant">
                <div className="flex flex-col gap-1">
                  <h2 className="font-headline-xl text-headline-xl text-primary font-bold">{t('testimonials_title')}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {t('testimonials_subtitle')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((tItem, i) => (
                  <div key={i} className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <PlaceholderAvatar />
                        <div>
                          <span className="font-headline-sm text-[16px] text-primary font-bold block leading-tight">{tItem.name}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">{tItem.role}</span>
                        </div>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface leading-normal border-y border-dashed border-outline-variant py-3 my-1">
                        "{tItem.quote}"
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-label-sm">
                      <span className="border border-outline-variant bg-surface-container-low px-2 py-0.5 rounded font-medium text-primary">{tItem.scheme}</span>
                      <span className="font-bold text-secondary">{tItem.benefit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="w-full py-12 bg-primary text-on-primary">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col gap-1.5 max-w-xl text-center md:text-left">
                <h2 className="font-headline-xl text-headline-xl font-bold">{t('cta_title')}</h2>
                <p className="font-body-md text-body-md text-on-primary-container">
                  {t('cta_subtitle')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:bg-[#155734] border border-[#155734] transition-all" to="/eligibility">
                  <CheckCircle2 size={17} />
                  <span>{t('cta_primary_btn')}</span>
                </Link>
                <Link className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-transparent text-on-primary hover:bg-[#1f2d42] font-label-md text-label-md font-semibold border border-outline-variant transition-all" to="/schemes">
                  <Package size={17} />
                  <span>{t('cta_secondary_btn')}</span>
                </Link>
              </div>
            </div>
          </section>

          <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant p-2.5 md:hidden flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 pl-1">
              <CheckCircle2 size={20} className="text-secondary" />
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-bold text-primary leading-tight">{t('mobile_cta_title')}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">{t('mobile_cta_subtitle')}</span>
              </div>
            </div>
            <Link className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold" to="/eligibility">
              <span>{t('check_eligibility_btn')}</span>
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
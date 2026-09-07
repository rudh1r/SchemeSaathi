import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const placeholderLogo =
  "https://placehold.co/180x60/f5f5f2/132238?text=SchemeSaathi";

const farmerImage =
  "https://placehold.co/96x96/e8f5ed/132238?text=Farmer";

const studentImage =
  "https://placehold.co/96x96/e8f5ed/132238?text=Student";

const womenImage =
  "https://placehold.co/96x96/e8f5ed/132238?text=Women";

function Home() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("English");
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [demoQuery, setDemoQuery] = useState(
    '"I am an undergraduate student from a Scheduled Caste category in Bihar. Annual family income is ₹1.8 Lakhs. Are there central tuition assistance or hostel grants?"'
  );

  const goTo = (path) => {
    navigate(path);
    setMobileMenu(false);
  };

  const simulateDemo = (type) => {
    if (type === "farmer") {
      setDemoQuery(
        '"नमस्ते! मैं उत्तर प्रदेश के वाराणसी से एक छोटा किसान हूँ। मेरे पास 1.5 एकड़ जमीन है और सालाना आय 1.5 लाख है। क्या मुझे कोई सहायता मिल सकती है?"'
      );
    } else if (type === "student") {
      setDemoQuery(
        '"I am an undergraduate student from a Scheduled Caste category in Bihar. Annual family income is ₹1.8 Lakhs. Are there central tuition assistance or hostel grants?"'
      );
    } else if (type === "women") {
      setDemoQuery(
        '"आम्ही पुण्यात महिला बचत गट चालवतो. मसाले उद्योगासाठी मुद्रा कर्ज आणि सरकारी अनुदान कसे मिळेल?"'
      );
    } else if (type === "health") {
      setDemoQuery(
        '"My father is 68 years old and retired without a formal pension. How do we get covered under Ayushman Bharat (PM-JAY) for cardiac surgery?"'
      );
    }
  };

  return (
    <div
      className={`${
        darkMode ? "dark" : ""
      } bg-surface font-body-md text-on-surface antialiased min-h-screen border-t-[3px] border-[#d97706]`}
    >
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#ffffff] border-b border-outline-variant shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="h-20 max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-3">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <img
              alt="SchemeSaathi Logo"
              className="h-9 w-auto object-contain"
              src={placeholderLogo}
            />

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-semibold">
                  SchemeSaathi
                </span>

                <span className="hidden sm:inline-block border border-outline-variant bg-surface-container-low text-primary px-1.5 py-0.5 rounded text-[11px] font-semibold">
                  AI
                </span>
              </div>

              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Welfare Scheme Discovery
              </span>
            </div>
          </div>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden lg:flex items-center gap-1 border-x border-outline-variant px-3 py-1">
            <Link
              to="/"
              className="bg-primary text-on-primary font-semibold px-3 py-1.5 rounded text-label-md"
            >
              Home
            </Link>

            <Link
              to="/chat-assistant"
              className="text-on-surface-variant hover:text-primary px-3 py-1.5 font-label-md text-label-md transition-colors"
            >
              Chat Assistant
            </Link>

            <Link
              to="/eligibility-form"
              className="text-on-surface-variant hover:text-primary px-3 py-1.5 font-label-md text-label-md transition-colors"
            >
              Check Eligibility
            </Link>

            <Link
              to="/browse-schemes"
              className="text-on-surface-variant hover:text-primary px-3 py-1.5 font-label-md text-label-md transition-colors"
            >
              Browse Schemes
            </Link>

            <Link
              to="/about"
              className="text-on-surface-variant hover:text-primary px-3 py-1.5 font-label-md text-label-md transition-colors"
            >
              About
            </Link>
          </nav>

          {/* HEADER ACTIONS */}
          <div className="flex items-center gap-2.5">
            <div className="relative hidden sm:flex items-center border border-outline-variant bg-surface-container-low rounded p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setLanguage("English")}
                className={`px-2.5 py-0.5 rounded font-label-sm text-label-sm font-semibold ${
                  language === "English"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                English
              </button>

              <button
                type="button"
                onClick={() => setLanguage("हिन्दी")}
                className={`px-2.5 py-0.5 rounded font-label-sm text-label-sm font-medium ${
                  language === "हिन्दी"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-primary transition-colors"
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              aria-label="Toggle color mode"
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 rounded border border-outline-variant bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                light_mode
              </span>
            </button>

            <button
              onClick={() => goTo("/eligibility-form")}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded bg-secondary text-on-secondary hover:bg-[#155734] transition-all font-label-md text-label-md font-semibold shadow-none border border-[#155734]"
            >
              <span className="material-symbols-outlined text-[17px]">
                how_to_reg
              </span>
              <span>Check Eligibility</span>
            </button>

            <div className="w-8 h-8 rounded border border-outline-variant bg-surface-container-low flex items-center justify-center shrink-0 text-primary">
              <span className="material-symbols-outlined text-[18px]">
                account_circle
              </span>
            </div>

            <button
              aria-label="Open navigation menu"
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden w-8 h-8 rounded border border-outline-variant bg-surface-container-lowest flex items-center justify-center text-on-surface"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                menu
              </span>
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenu && (
          <div className="lg:hidden border-t border-outline-variant bg-white px-4 py-3">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => goTo("/")}
                className="text-left px-3 py-2 rounded bg-primary text-on-primary font-label-md"
              >
                Home
              </button>

              <button
                onClick={() => goTo("/chat-assistant")}
                className="text-left px-3 py-2 font-label-md text-on-surface-variant"
              >
                Chat Assistant
              </button>

              <button
                onClick={() => goTo("/eligibility-form")}
                className="text-left px-3 py-2 font-label-md text-on-surface-variant"
              >
                Check Eligibility
              </button>

              <button
                onClick={() => goTo("/browse-schemes")}
                className="text-left px-3 py-2 font-label-md text-on-surface-variant"
              >
                Browse Schemes
              </button>

              <button
                onClick={() => goTo("/about")}
                className="text-left px-3 py-2 font-label-md text-on-surface-variant"
              >
                About
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="w-full pt-20 bg-surface">
        <div className="flex flex-col w-full">

          {/* SEO METADATA */}
          <div aria-hidden="true" className="hidden" data-seo-container="">
            <span data-meta-title="">
              SchemeSaathi — AI Welfare Scheme Eligibility Copilot | भारत
              सरकार योजनाएं
            </span>

            <p data-meta-description="">
              Discover 500+ Indian central and state government welfare schemes
              you qualify for in seconds using AI and RAG search.
            </p>
          </div>

          {/* HERO SECTION */}
          <section className="relative w-full border-b border-outline-variant bg-surface-container-low/40 pt-10 pb-12">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col items-center text-center">

              <div className="max-w-4xl flex flex-col items-center gap-2 mb-4">
                <h1 className="font-headline-xl text-[34px] sm:text-[40px] text-primary tracking-tight leading-[1.2]">
                  Find the Government Schemes You Are Eligible For Instantly
                </h1>
              </div>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-8 leading-normal">
                Describe your profile in plain Hindi or English, or complete a
                structured 2-minute eligibility check. Our civic engine
                cross-evaluates demographic, income, and state criteria against
                verified gazette guidelines.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-10">
                <button
                  onClick={() => goTo("/eligibility-form")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container border border-primary transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    verified
                  </span>
                  <span>Check Your Eligibility</span>
                </button>

                <button
                  onClick={() => goTo("/chat-assistant")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-surface-container-lowest text-primary font-label-lg text-label-lg font-semibold border border-outline-variant hover:bg-surface-container-low transition-all"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    smart_toy
                  </span>
                  <span>Consult SchemeSaathi Assistant</span>
                </button>
              </div>
            </div>
          </section>

          {/* INTERACTIVE SHOWCASE */}
          <section className="w-full py-12 bg-surface border-b border-outline-variant">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col gap-8">

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

                {/* LEFT CHAT */}
                <div className="lg:col-span-7 flex flex-col border border-outline-variant rounded bg-surface-container-lowest overflow-hidden">

                  <div className="flex items-center justify-between px-4 py-2.5 bg-primary text-on-primary border-b border-outline-variant">
                    <div className="flex items-center gap-2.5">
                      <span className="font-label-md text-label-md font-bold">
                        SchemeSaathi Civic Discovery Assistant
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4 bg-surface grow">

                    {/* USER QUERY */}
                    <div className="flex items-start justify-end gap-2.5 max-w-xl self-end">
                      <div className="p-3.5 rounded bg-surface-container-lowest border border-outline-variant text-on-surface">
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-outline-variant text-[11px] text-on-surface-variant">
                          <span>CITIZEN INQUIRY</span>
                          <span>Varanasi, UP • Self-Declared</span>
                        </div>

                        <p
                          className="font-body-md text-body-md text-on-surface"
                          id="demo-user-query"
                        >
                          {demoQuery}
                        </p>
                      </div>

                      <div className="w-7 h-7 rounded border border-outline-variant bg-surface-container-low flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[16px]">
                          person
                        </span>
                      </div>
                    </div>

                    {/* ASSISTANT RESPONSE */}
                    <div className="flex items-start gap-2.5 max-w-xl self-start">
                      <div className="w-7 h-7 rounded bg-primary text-on-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px]">
                          assured_workload
                        </span>
                      </div>

                      <div className="flex flex-col gap-3 p-4 rounded bg-surface-container-lowest border border-outline-variant w-full">

                        <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-secondary text-[18px]">
                              verified
                            </span>

                            <span className="font-label-md text-label-md font-bold text-primary">
                              Matching Public Entitlements (2 Schemes Identified)
                            </span>
                          </div>

                          <span className="border border-secondary-container bg-secondary-container px-2 py-0.5 rounded text-[11px] font-semibold text-on-secondary-container">
                            100% Eligible
                          </span>
                        </div>

                        {/* SCHEME 1 */}
                        <div className="border border-outline-variant rounded p-3 bg-surface-container-low/50">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-headline-sm text-[16px] font-bold text-primary block">
                                PM Kisan Samman Nidhi
                              </span>

                              <span className="font-label-sm text-[11px] text-on-surface-variant block">
                                Ministry of Agriculture &amp; Farmers Welfare
                              </span>
                            </div>

                            <span className="border border-secondary text-secondary bg-[#ffffff] font-label-sm text-[11px] px-2 py-0.5 rounded font-bold whitespace-nowrap">
                              ₹6,000 / Year DBT
                            </span>
                          </div>

                          <div className="mt-2 pt-2 border-t border-dashed border-outline-variant grid grid-cols-2 gap-2 text-[12px]">
                            <div>
                              <span className="text-on-surface-variant block">
                                Land Ceiling:
                              </span>
                              <span className="font-semibold text-primary">
                                &lt; 2 Hectares
                              </span>
                            </div>

                            <div>
                              <span className="text-on-surface-variant block">
                                Mandatory Record:
                              </span>
                              <span className="font-semibold text-primary">
                                Aadhaar Linked Land Khatauni
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* SCHEME 2 */}
                        <div className="border border-outline-variant rounded p-3 bg-surface-container-low/50">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-headline-sm text-[16px] font-bold text-primary">
                                UP Kisan Durghatna Bima Yojana
                              </span>

                              <span className="font-label-sm text-[11px] text-on-surface-variant block">
                                Board of Revenue, Govt of Uttar Pradesh
                              </span>
                            </div>

                            <span className="border border-outline-variant bg-[#ffffff] font-label-sm text-[11px] px-2 py-0.5 rounded font-semibold text-primary whitespace-nowrap">
                              State Security Cover
                            </span>
                          </div>

                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 pt-2 border-t border-dashed border-outline-variant">
                            Accidental insurance coverage up to ₹5,00,000 for
                            registered agricultural account holders.
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-label-sm text-on-surface-variant">
                          <span>
                            Source: Gazette of India (DBT Mission Reference
                            2025)
                          </span>

                          <button
                            onClick={() => goTo("/chat-assistant")}
                            className="font-label-md text-label-md text-secondary font-semibold hover:underline"
                          >
                            Continue in Citizen Assistant
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SEARCH INPUT */}
                  <div className="p-3 border-t border-outline-variant bg-surface-container-lowest flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-[18px] pl-1">
                      mic
                    </span>

                    <input
                      className="bg-surface-container-low border border-outline-variant rounded px-3 py-1.5 grow font-body-sm text-body-sm text-on-surface outline-none focus:border-primary"
                      readOnly
                      type="text"
                      value="Ask in your language... (उदा. 'मेरी बेटी 10वीं में है, छात्रवृत्ति क्या है?')"
                    />

                    <button
                      onClick={() => goTo("/chat-assistant")}
                      className="px-3.5 py-1.5 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        search
                      </span>
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT ELIGIBILITY CARD */}
                <div className="lg:col-span-5 flex flex-col justify-between border border-outline-variant rounded bg-surface-container-lowest p-5">

                  <div className="flex flex-col gap-4">

                    <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[22px]">
                          fact_check
                        </span>

                        <div>
                          <span className="font-headline-sm text-headline-sm font-bold text-primary block leading-tight">
                            Eligibility Passbook
                          </span>

                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            Deterministic Demographic Assessment
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-surface-container-high rounded h-1 overflow-hidden">
                      <div className="bg-primary h-full w-1/2"></div>
                    </div>

                    <div className="flex flex-col gap-3">

                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold text-primary">
                          State of Domicile
                        </label>

                        <div className="flex items-center justify-between px-3 py-2 rounded border border-outline-variant bg-surface-container-low font-body-sm text-body-sm text-primary font-medium">
                          <span>Uttar Pradesh</span>

                          <span className="material-symbols-outlined text-[18px] text-outline">
                            expand_more
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold text-primary">
                          Social Category &amp; Gender
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="px-2 py-1.5 rounded border border-outline-variant bg-surface-container-low text-center font-label-sm text-label-sm font-semibold text-primary">
                            OBC / Non-Creamy
                          </div>

                          <div className="px-2 py-1.5 rounded border border-secondary bg-secondary text-center font-label-sm text-label-sm font-semibold text-on-secondary">
                            Female
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-label-sm text-label-sm font-bold text-primary">
                          Annual Gross Family Income
                        </label>

                        <div className="px-3 py-2 rounded border border-outline-variant bg-surface-container-low flex items-center justify-between">
                          <span className="font-body-sm text-body-sm font-semibold text-primary">
                            ₹ 1,20,000 / year
                          </span>

                          <span className="font-label-sm text-[11px] px-1.5 py-0.5 rounded border border-secondary text-secondary bg-[#ffffff] font-bold">
                            EWS Threshold
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ORIGINAL DUPLICATED SECTION RETAINED */}
                  <div className="mt-4 pt-4 border-t border-outline-variant flex flex-col gap-3">

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm font-bold text-primary">
                        State of Domicile
                      </label>

                      <div className="flex items-center justify-between px-3 py-2 rounded border border-outline-variant bg-surface-container-low font-body-sm text-body-sm text-primary font-medium">
                        <span>Uttar Pradesh</span>

                        <span className="material-symbols-outlined text-[18px] text-outline">
                          expand_more
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm font-bold text-primary">
                        Social Category &amp; Gender
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="px-2 py-1.5 rounded border border-outline-variant bg-surface-container-low text-center font-label-sm text-label-sm font-semibold text-primary">
                          OBC / Non-Creamy
                        </div>

                        <div className="px-2 py-1.5 rounded border border-secondary bg-secondary text-center font-label-sm text-label-sm font-semibold text-on-secondary">
                          Female
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-label-sm text-label-sm font-bold text-primary">
                        Annual Gross Family Income
                      </label>

                      <div className="px-3 py-2 rounded border border-outline-variant bg-surface-container-low flex items-center justify-between">
                        <span className="font-body-sm text-body-sm font-semibold text-primary">
                          ₹ 1,20,000 / year
                        </span>

                        <span className="font-label-sm text-[11px] px-1.5 py-0.5 rounded border border-secondary text-secondary bg-[#ffffff] font-bold">
                          EWS Threshold
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CORE ARCHITECTURAL PILLARS */}
          <section className="w-full py-12 bg-surface-container-low/40 border-b border-outline-variant">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col gap-8">

              <div className="flex flex-col items-center text-center gap-1.5">
                <h2 className="font-headline-xl text-headline-xl text-primary font-bold">
                  How SchemeSaathi Unlocks Your Rights
                </h2>

                <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                  Designed for absolute transparency and administrative
                  accuracy across every taluk, gram panchayat, and municipal
                  body.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* PILLAR 1 */}
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-2.5">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      Gazette Retrieval Engine
                    </span>

                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      Standardized Open Government Schemas
                    </span>

                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Inquiries in regional dialects or voice descriptions are
                      mapped directly into statutory gazette criteria without
                      algorithmic guesswork.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      check_box
                    </span>

                    <span>Sourced from Data.gov.in &amp; MyScheme</span>
                  </div>
                </div>

                {/* PILLAR 2 */}
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-2.5">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      Deterministic Criteria Matching
                    </span>

                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      Income, Land &amp; Category Evaluation
                    </span>

                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Cross-evaluates land holding thresholds, urban/rural BPL
                      income tiers, minority status, and reservation quotas via
                      verified rule matrices.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      check_box
                    </span>

                    <span>Dynamic State &amp; District Thresholds</span>
                  </div>
                </div>

                {/* PILLAR 3 */}
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-2.5">
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      Document &amp; Application Checklist
                    </span>

                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      Step-by-Step Portal Navigation
                    </span>

                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Clear requirements for Aadhaar, Domicile, and Caste
                      Certificates with direct links to respective state
                      grievance and CSC centers.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline-variant flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      check_box
                    </span>

                    <span>Includes CSC &amp; Panchayat Contacts</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* REAL IMPACT */}
          <section className="w-full py-12 bg-surface border-b border-outline-variant">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col gap-8">

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-outline-variant">
                <div className="flex flex-col gap-1">
                  <h2 className="font-headline-xl text-headline-xl text-primary font-bold">
                    Real Impact for Real Citizens
                  </h2>

                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Documented welfare disbursements and scheme activations
                    facilitated for citizens nationwide.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* CITIZEN 1 */}
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-3">

                    <div className="flex items-center gap-3">
                      <img
                        className="w-12 h-12 rounded object-cover border border-outline-variant"
                        alt="Farmer placeholder"
                        src={farmerImage}
                      />

                      <div>
                        <span className="font-headline-sm text-[16px] text-primary font-bold block leading-tight">
                          रामेश्वर यादव
                        </span>

                        <span className="font-label-sm text-label-sm text-on-surface-variant block">
                          Small Agriculturalist, Gorakhpur (UP)
                        </span>
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface leading-normal border-y border-dashed border-outline-variant py-3 my-1">
                      "पहले मुझे पता ही नहीं था कि सोलर पंप लगाने के लिए
                      'PM-KUSUM' में 60% सब्सिडी मिलती है। SchemeSaathi पर 2
                      मिनट में पात्रता देखकर मैंने ब्लॉक ऑफिस में कागजात जमा
                      किए और अब मेरा खेत सौर ऊर्जा से सिंचित है।"
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-label-sm">
                    <span className="border border-outline-variant bg-surface-container-low px-2 py-0.5 rounded font-medium text-primary">
                      PM-KUSUM Subsidy
                    </span>

                    <span className="font-bold text-secondary">
                      ₹85,000 Saved
                    </span>
                  </div>
                </div>

                {/* CITIZEN 2 */}
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-3">

                    <div className="flex items-center gap-3">
                      <img
                        className="w-12 h-12 rounded object-cover border border-outline-variant"
                        alt="Student placeholder"
                        src={studentImage}
                      />

                      <div>
                        <span className="font-headline-sm text-[16px] text-primary font-bold block leading-tight">
                          Priya Rathod
                        </span>

                        <span className="font-label-sm text-label-sm text-on-surface-variant block">
                          B.Tech Student, Bengaluru (KA)
                        </span>
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface leading-normal border-y border-dashed border-outline-variant py-3 my-1">
                      "Navigating the National Scholarship Portal was
                      intimidating with multiple departmental codes.
                      SchemeSaathi directly matched my family's income
                      certificate with AICTE Pragati for Girls. Tuition was
                      fully reimbursed."
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-label-sm">
                    <span className="border border-outline-variant bg-surface-container-low px-2 py-0.5 rounded font-medium text-primary">
                      AICTE Pragati Scheme
                    </span>

                    <span className="font-bold text-secondary">
                      ₹50,000 / Year
                    </span>
                  </div>
                </div>

                {/* CITIZEN 3 */}
                <div className="flex flex-col justify-between p-5 rounded border border-outline-variant bg-surface-container-lowest">
                  <div className="flex flex-col gap-3">

                    <div className="flex items-center gap-3">
                      <img
                        className="w-12 h-12 rounded object-cover border border-outline-variant"
                        alt="Women placeholder"
                        src={womenImage}
                      />

                      <div>
                        <span className="font-headline-sm text-[16px] text-primary font-bold block leading-tight">
                          सुनीता मीना
                        </span>

                        <span className="font-label-sm text-label-sm text-on-surface-variant block">
                          SHG Coordinator, Dausa (RJ)
                        </span>
                      </div>
                    </div>

                    <p className="font-body-sm text-body-sm text-on-surface leading-normal border-y border-dashed border-outline-variant py-3 my-1">
                      "हमारे स्वयं सहायता समूह (SHG) की 18 महिलाओं को सिलाई
                      मशीनों और लखपति दीदी योजना से जोड़ने में इस सहायता पोर्टल
                      ने पूरी मदद की। बैंक प्रक्रिया और ज़रूरी दस्तावेज़ तुरंत
                      स्पष्ट हो गए।"
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-label-sm">
                    <span className="border border-outline-variant bg-surface-container-low px-2 py-0.5 rounded font-medium text-primary">
                      Lakhpati Didi Initiative
                    </span>

                    <span className="font-bold text-secondary">
                      18 SHG Members Funded
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA BANNER */}
          <section className="w-full py-12 bg-primary text-on-primary">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">

              <div className="flex flex-col gap-1.5 max-w-xl text-center md:text-left">
                <h2 className="font-headline-xl text-headline-xl font-bold">
                  Unclaimed Welfare Is a Lost Opportunity.
                </h2>

                <p className="font-body-md text-body-md text-on-primary-container">
                  Millions of rupees in government welfare funds remain
                  unutilized annually due to awareness gaps. Confirm your
                  statutory entitlements in 120 seconds.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">

                <button
                  onClick={() => goTo("/eligibility-form")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-secondary text-on-secondary font-label-md text-label-md font-semibold hover:bg-[#155734] border border-[#155734] transition-all"
                >
                  <span className="material-symbols-outlined text-[17px]">
                    verified
                  </span>

                  <span>Start Eligibility Audit</span>
                </button>

                <button
                  onClick={() => goTo("/browse-schemes")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-transparent text-on-primary hover:bg-[#1f2d42] font-label-md text-label-md font-semibold border border-outline-variant transition-all"
                >
                  <span className="material-symbols-outlined text-[17px]">
                    inventory_2
                  </span>

                  <span>Explore Directory</span>
                </button>
              </div>
            </div>
          </section>

          {/* MOBILE STICKY CTA */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest border-t border-outline-variant p-2.5 md:hidden flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 pl-1">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                how_to_reg
              </span>

              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-bold text-primary leading-tight">
                  Check Welfare
                </span>

                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  500+ Active Schemes
                </span>
              </div>
            </div>

            <button
              onClick={() => goTo("/eligibility-form")}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-on-primary font-label-md text-label-md font-semibold"
            >
              Check Eligibility
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant mt-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

          {/* NOTICE */}
          <div className="border border-outline-variant bg-surface-container-low rounded p-4 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                policy
              </span>

              <div>
                <span className="font-label-sm text-label-sm font-bold text-primary block">
                  Civic &amp; Academic Notice
                </span>

                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  SchemeSaathi is an independent digital public infrastructure
                  discovery research project. Not an official agency of the
                  Government of India. Scheme data is compiled from verified
                  public gazettes and open portals (Data.gov.in &amp;
                  MyScheme.gov.in).
                </p>
              </div>
            </div>
          </div>

          {/* FOOTER GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6">

            <div className="md:col-span-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-[16px] font-bold text-primary">
                  SchemeSaathi
                </span>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                Empowering 1.4 Billion citizens with vernacular access to
                Central and State Government entitlements, eligibility criteria,
                and Direct Benefit Transfer (DBT) links.
              </p>
            </div>

            <div>
              <span className="font-label-md text-label-md font-bold text-primary mb-2 block">
                Quick Governance Links
              </span>

              <ul className="flex flex-col gap-1.5">
                <li className="font-body-sm text-body-sm">
                  <button
                    onClick={() => goTo("/privacy-policy")}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>

                <li className="font-body-sm text-body-sm">
                  <button
                    onClick={() => goTo("/terms-of-service")}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>

                <li className="font-body-sm text-body-sm">
                  <button
                    onClick={() => goTo("/open-data-attribution")}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Open Data Attribution
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <span className="font-label-md text-label-md font-bold text-primary mb-2 block">
                Developer &amp; Support
              </span>

              <ul className="flex flex-col gap-1.5">
                <li className="font-body-sm text-body-sm">
                  <button
                    onClick={() => goTo("/api-documentation")}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    API Documentation
                  </button>
                </li>

                <li className="font-body-sm text-body-sm">
                  <button
                    onClick={() => goTo("/feedback-grievance")}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Feedback &amp; Grievance
                  </button>
                </li>

                <li className="font-body-sm text-body-sm">
                  <button
                    onClick={() => goTo("/about")}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Project Repository
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* COPYRIGHT */}
          <div className="pt-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-2 font-label-md text-label-md text-on-surface-variant text-center sm:text-left">
            <span>
              © 2025 SchemeSaathi • Designed for Indian Citizen Empowerment •
              Schemes for 1.4B Citizens
            </span>

            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary inline-block"></span>
              Aligned with Data.gov.in &amp; MyScheme
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
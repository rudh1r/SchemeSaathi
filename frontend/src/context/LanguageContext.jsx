import { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    // Header
    nav_home: 'Home',
    nav_chat: 'Chat Assistant',
    nav_eligibility: 'Check Eligibility',
    nav_schemes: 'Browse Schemes',
    nav_about: 'About',
    check_eligibility_btn: 'Check Eligibility',
    login_hi: 'Hi',
    logout_btn: 'Logout',

    // Home - Hero
    hero_title: 'Find the Government Schemes You Are Eligible For Instantly',
    hero_subtitle: 'Describe your profile in plain Hindi or English, or complete a structured 2-minute eligibility check. Our civic engine cross-evaluates demographic, income, and state criteria against verified gazette guidelines.',
    hero_cta_primary: 'Check Your Eligibility',
    hero_cta_secondary: 'Consult SchemeSaathi Assistant',

    // Home - Demo panel
    demo_assistant_title: 'SchemeSaathi Civic Discovery Assistant',
    demo_inquiry_label: 'CITIZEN INQUIRY',
    demo_sample_location: '[Sample Location] • Self-Declared',
    demo_sample_question: "[Example question a citizen might ask about their eligibility]",
    demo_matching_title: 'Matching Schemes Identified',
    demo_live_results: 'Live Results',
    demo_scheme_name: '[Scheme Name]',
    demo_ministry: '[Issuing Ministry/Department]',
    demo_benefit: '[Benefit Amount]',
    demo_source: 'Source: [Official Source Reference]',
    demo_continue: 'Continue in Citizen Assistant',
    demo_ask_placeholder: 'Ask in your language...',
    demo_search_btn: 'Search',
    passbook_title: 'Eligibility Passbook',
    passbook_subtitle: 'Structured Assessment',
    passbook_state_label: 'State of Domicile',
    passbook_category_label: 'Category',
    passbook_income_label: 'Annual Family Income',

    // Home - Pillars
    pillars_title: 'How SchemeSaathi Unlocks Your Rights',
    pillars_subtitle: 'Designed for absolute transparency and administrative accuracy across every taluk, gram panchayat, and municipal body.',
    pillar1_title: 'Gazette Retrieval Engine',
    pillar1_subtitle: 'Standardized Open Government Schemas',
    pillar1_text: 'Inquiries in regional dialects or voice descriptions are mapped directly into statutory gazette criteria without algorithmic guesswork.',
    pillar1_footnote: 'Sourced from Data.gov.in & MyScheme',
    pillar2_title: 'Deterministic Criteria Matching',
    pillar2_subtitle: 'Income, Land & Category Evaluation',
    pillar2_text: 'Cross-evaluates land holding thresholds, urban/rural BPL income tiers, minority status, and reservation quotas via verified rule matrices.',
    pillar2_footnote: 'Dynamic State & District Thresholds',
    pillar3_title: 'Document & Application Checklist',
    pillar3_subtitle: 'Step-by-Step Portal Navigation',
    pillar3_text: 'Clear requirements for Aadhaar, Domicile, and Caste Certificates with direct links to respective state grievance and CSC centers.',
    pillar3_footnote: 'Includes CSC & Panchayat Contacts',

    // Home - Testimonials
    testimonials_title: 'Real Impact for Real Citizens',
    testimonials_subtitle: '[Placeholder — add real testimonials once collected]',

    // Home - CTA banner
    cta_title: 'Unclaimed Welfare Is a Lost Opportunity.',
    cta_subtitle: 'Many welfare schemes go unused simply due to awareness gaps. Confirm what you may be entitled to in minutes.',
    cta_primary_btn: 'Start Eligibility Audit',
    cta_secondary_btn: 'Explore Directory',
    mobile_cta_title: 'Check Welfare',
    mobile_cta_subtitle: '[N] Active Schemes',

    // Footer
    footer_notice_title: 'Civic & Academic Notice',
    footer_notice_text: 'SchemeSaathi is an academic final-year project — not an official Government of India platform. Scheme data is compiled from public gazettes and open portals for demonstration purposes.',
    footer_about_title: 'SchemeSaathi',
    footer_about_text: 'A RAG-based assistant helping citizens discover relevant government welfare schemes through natural-language conversation.',
    footer_quicklinks: 'Quick Links',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_project: 'Project',
    footer_about_link: 'About',
    footer_copyright: '© 2026 SchemeSaathi — Dronacharya Group of Institutions',

    // Chat
    chat_banner: 'Answers are grounded only in the verified scheme database — nothing is invented.',
    chat_placeholder: "Ask in English (e.g. 'How do I apply for Kisan Credit Card?')",
    chat_ask_btn: 'Ask',
    chat_intro: "Hello! Describe your situation — occupation, income, land, location, or specific needs — and I'll find welfare schemes you may be eligible for, grounded in verified scheme data.",
    chat_thinking: 'Searching the scheme knowledge base and generating a grounded answer…',
    chat_disclaimer: 'This is an academic assistance tool. Always confirm details on the official scheme portal before applying.',
    chat_try_label: 'Try:',
    prompt1: "I'm a farmer with 1.5 acres, what schemes can I get?",
    prompt2: 'Schemes for a below-poverty-line household needing a house',
    prompt3: 'Health coverage for a senior citizen',
    prompt4: 'Support for a traditional artisan or craftsperson',

    // Eligibility Form
    elig_title: 'Welfare Eligibility Directory',
    elig_subtitle: 'Fill in your details below. This builds a description of your situation and checks it against the same scheme database and AI used by the Chat Assistant — no separate scoring system, no fabricated match percentages.',
    elig_state_label: 'Domicile State',
    elig_area_label: 'Area',
    elig_rural: 'Rural',
    elig_urban: 'Urban',
    elig_age_label: 'Age',
    elig_gender_label: 'Gender',
    elig_male: 'Male',
    elig_female: 'Female',
    elig_other: 'Other',
    elig_category_label: 'Social Category',
    elig_income_label: 'Annual Household Income',
    elig_occupation_label: 'Primary Occupation',
    elig_land_label: 'Agricultural Land',
    elig_land_question: 'Do you own farm land?',
    elig_land_placeholder: 'Approx. acres',
    elig_submit_btn: 'Check My Eligibility',
    elig_submit_loading: 'Checking eligibility…',

    // Browse Schemes
    browse_title: 'Welfare Scheme Directory',
    browse_subtitle: 'Browse all schemes currently in the SchemeSaathi database. For a personalized recommendation, use the Chat Assistant instead.',
    browse_search_placeholder: 'Search by scheme title or keyword (e.g. PM-KISAN, Ayushman, Pension)',
    browse_loading: 'Loading schemes…',
    browse_no_results: 'No schemes match your search.',
    browse_select_prompt: 'Select a scheme to view details',
    browse_overview_tab: 'Overview',
    browse_eligibility_tab: 'Eligibility',
    browse_description_label: 'Description',
    browse_benefit_label: 'Benefit',
    browse_how_to_apply: 'How to apply:',
    browse_portal_btn: 'Proceed to Official Government Portal',
    browse_not_sure_title: 'Not sure which scheme fits you?',
    browse_not_sure_text: 'Describe your situation to the AI assistant for a personalized match instead of browsing manually.',
    browse_consult_btn: 'Consult SchemeSaathi AI',
  },
  hi: {
    // Header
    nav_home: 'होम',
    nav_chat: 'चैट सहायक',
    nav_eligibility: 'पात्रता जांचें',
    nav_schemes: 'योजनाएं देखें',
    nav_about: 'हमारे बारे में',
    check_eligibility_btn: 'पात्रता जांचें',
    login_hi: 'नमस्ते',
    logout_btn: 'लॉग आउट',

    // Home - Hero
    hero_title: 'तुरंत जानें आप किन सरकारी योजनाओं के लिए पात्र हैं',
    hero_subtitle: 'अपनी स्थिति हिंदी या अंग्रेज़ी में बताएं, या 2 मिनट में संरचित पात्रता जांच पूरी करें। हमारा सिस्टम आपकी जानकारी को सत्यापित सरकारी दिशानिर्देशों से मिलाकर जांचता है।',
    hero_cta_primary: 'अपनी पात्रता जांचें',
    hero_cta_secondary: 'SchemeSaathi सहायक से पूछें',

    // Home - Demo panel
    demo_assistant_title: 'SchemeSaathi सिविक डिस्कवरी असिस्टेंट',
    demo_inquiry_label: 'नागरिक प्रश्न',
    demo_sample_location: '[नमूना स्थान] • स्वयं-घोषित',
    demo_sample_question: '[उदाहरण प्रश्न जो एक नागरिक अपनी पात्रता के बारे में पूछ सकता है]',
    demo_matching_title: 'मिलती-जुलती योजनाएं मिलीं',
    demo_live_results: 'लाइव परिणाम',
    demo_scheme_name: '[योजना का नाम]',
    demo_ministry: '[जारीकर्ता मंत्रालय/विभाग]',
    demo_benefit: '[लाभ राशि]',
    demo_source: 'स्रोत: [आधिकारिक स्रोत संदर्भ]',
    demo_continue: 'नागरिक सहायक में जारी रखें',
    demo_ask_placeholder: 'अपनी भाषा में पूछें...',
    demo_search_btn: 'खोजें',
    passbook_title: 'पात्रता पासबुक',
    passbook_subtitle: 'संरचित मूल्यांकन',
    passbook_state_label: 'निवास राज्य',
    passbook_category_label: 'श्रेणी',
    passbook_income_label: 'वार्षिक पारिवारिक आय',

    // Home - Pillars
    pillars_title: 'SchemeSaathi आपके अधिकार कैसे सुनिश्चित करता है',
    pillars_subtitle: 'हर तालुका, ग्राम पंचायत और नगर निकाय में पूर्ण पारदर्शिता और प्रशासनिक सटीकता के लिए डिज़ाइन किया गया।',
    pillar1_title: 'गजट पुनर्प्राप्ति इंजन',
    pillar1_subtitle: 'मानकीकृत खुली सरकारी योजनाएं',
    pillar1_text: 'क्षेत्रीय बोलियों या आवाज़ विवरण में प्रश्नों को बिना अनुमान के सीधे सांविधिक गजट मानदंडों से जोड़ा जाता है।',
    pillar1_footnote: 'Data.gov.in और MyScheme से स्रोत',
    pillar2_title: 'निश्चित मानदंड मिलान',
    pillar2_subtitle: 'आय, भूमि और श्रेणी मूल्यांकन',
    pillar2_text: 'भूमि सीमा, शहरी/ग्रामीण BPL आय स्तर, अल्पसंख्यक स्थिति, और आरक्षण कोटा का सत्यापित नियम मैट्रिक्स से मूल्यांकन करता है।',
    pillar2_footnote: 'गतिशील राज्य और जिला सीमाएं',
    pillar3_title: 'दस्तावेज़ और आवेदन चेकलिस्ट',
    pillar3_subtitle: 'चरण-दर-चरण पोर्टल नेविगेशन',
    pillar3_text: 'आधार, निवास और जाति प्रमाण पत्र की स्पष्ट आवश्यकताएं संबंधित राज्य शिकायत और CSC केंद्रों के सीधे लिंक के साथ।',
    pillar3_footnote: 'CSC और पंचायत संपर्क शामिल',

    // Home - Testimonials
    testimonials_title: 'वास्तविक नागरिकों के लिए वास्तविक प्रभाव',
    testimonials_subtitle: '[प्लेसहोल्डर — एकत्र होने पर वास्तविक प्रशंसापत्र जोड़ें]',

    // Home - CTA banner
    cta_title: 'अनदेखा कल्याण एक खोया हुआ अवसर है।',
    cta_subtitle: 'जागरूकता की कमी के कारण कई कल्याण योजनाएं अनुपयोगी रह जाती हैं। मिनटों में जानें आप किसके हकदार हैं।',
    cta_primary_btn: 'पात्रता जांच शुरू करें',
    cta_secondary_btn: 'निर्देशिका देखें',
    mobile_cta_title: 'कल्याण जांचें',
    mobile_cta_subtitle: '[N] सक्रिय योजनाएं',

    // Footer
    footer_notice_title: 'नागरिक एवं शैक्षणिक सूचना',
    footer_notice_text: 'SchemeSaathi एक शैक्षणिक अंतिम-वर्ष परियोजना है — भारत सरकार का आधिकारिक प्लेटफ़ॉर्म नहीं। योजना डेटा प्रदर्शन उद्देश्यों के लिए सार्वजनिक गजट और खुले पोर्टलों से संकलित है।',
    footer_about_title: 'SchemeSaathi',
    footer_about_text: 'एक RAG-आधारित सहायक जो नागरिकों को प्राकृतिक भाषा वार्तालाप के माध्यम से प्रासंगिक सरकारी कल्याण योजनाएं खोजने में मदद करता है।',
    footer_quicklinks: 'त्वरित लिंक',
    footer_privacy: 'गोपनीयता नीति',
    footer_terms: 'सेवा की शर्तें',
    footer_project: 'परियोजना',
    footer_about_link: 'हमारे बारे में',
    footer_copyright: '© 2026 SchemeSaathi — द्रोणाचार्य ग्रुप ऑफ इंस्टीट्यूशंस',

    // Chat
    chat_banner: 'उत्तर केवल सत्यापित योजना डेटाबेस पर आधारित हैं — कुछ भी गढ़ा नहीं गया है।',
    chat_placeholder: "अंग्रेज़ी में पूछें (जैसे 'किसान क्रेडिट कार्ड के लिए आवेदन कैसे करें?')",
    chat_ask_btn: 'पूछें',
    chat_intro: 'नमस्ते! अपनी स्थिति बताएं — व्यवसाय, आय, भूमि, स्थान, या विशेष आवश्यकताएं — और मैं आपके लिए उपयुक्त सरकारी योजनाएं खोजूंगा, जो सत्यापित डेटा पर आधारित होंगी।',
    chat_thinking: 'योजना ज्ञान आधार खोजा जा रहा है और उत्तर तैयार किया जा रहा है…',
    chat_disclaimer: 'यह एक शैक्षणिक सहायता उपकरण है। आवेदन करने से पहले हमेशा आधिकारिक योजना पोर्टल पर विवरण की पुष्टि करें।',
    chat_try_label: 'आज़माएं:',
    prompt1: 'मैं 1.5 एकड़ भूमि वाला किसान हूं, मुझे कौन सी योजनाएं मिल सकती हैं?',
    prompt2: 'गरीबी रेखा से नीचे के परिवार के लिए मकान योजनाएं',
    prompt3: 'वरिष्ठ नागरिक के लिए स्वास्थ्य कवरेज',
    prompt4: 'पारंपरिक कारीगर के लिए सहायता',

    // Eligibility Form
    elig_title: 'कल्याण पात्रता निर्देशिका',
    elig_subtitle: 'नीचे अपना विवरण भरें। यह आपकी स्थिति का विवरण तैयार करता है और इसे चैट सहायक द्वारा उपयोग किए जाने वाले उसी योजना डेटाबेस और AI से जांचता है — कोई अलग स्कोरिंग सिस्टम नहीं, कोई बनावटी मिलान प्रतिशत नहीं।',
    elig_state_label: 'निवास राज्य',
    elig_area_label: 'क्षेत्र',
    elig_rural: 'ग्रामीण',
    elig_urban: 'शहरी',
    elig_age_label: 'आयु',
    elig_gender_label: 'लिंग',
    elig_male: 'पुरुष',
    elig_female: 'महिला',
    elig_other: 'अन्य',
    elig_category_label: 'सामाजिक श्रेणी',
    elig_income_label: 'वार्षिक पारिवारिक आय',
    elig_occupation_label: 'मुख्य व्यवसाय',
    elig_land_label: 'कृषि भूमि',
    elig_land_question: 'क्या आपके पास खेती की ज़मीन है?',
    elig_land_placeholder: 'लगभग एकड़',
    elig_submit_btn: 'मेरी पात्रता जांचें',
    elig_submit_loading: 'पात्रता जांची जा रही है…',

    // Browse Schemes
    browse_title: 'कल्याण योजना निर्देशिका',
    browse_subtitle: 'SchemeSaathi डेटाबेस में वर्तमान में मौजूद सभी योजनाएं देखें। व्यक्तिगत सिफारिश के लिए चैट सहायक का उपयोग करें।',
    browse_search_placeholder: 'योजना का नाम या कीवर्ड खोजें (जैसे PM-KISAN, आयुष्मान, पेंशन)',
    browse_loading: 'योजनाएं लोड हो रही हैं…',
    browse_no_results: 'आपकी खोज से कोई योजना मेल नहीं खाती।',
    browse_select_prompt: 'विवरण देखने के लिए एक योजना चुनें',
    browse_overview_tab: 'अवलोकन',
    browse_eligibility_tab: 'पात्रता',
    browse_description_label: 'विवरण',
    browse_benefit_label: 'लाभ',
    browse_how_to_apply: 'आवेदन कैसे करें:',
    browse_portal_btn: 'आधिकारिक सरकारी पोर्टल पर जाएं',
    browse_not_sure_title: 'निश्चित नहीं कि कौन सी योजना आपके लिए उपयुक्त है?',
    browse_not_sure_text: 'मैन्युअल रूप से ब्राउज़ करने के बजाय व्यक्तिगत मिलान के लिए AI सहायक को अपनी स्थिति बताएं।',
    browse_consult_btn: 'SchemeSaathi AI से पूछें',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('schemesaathi_lang') || 'en');

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('schemesaathi_lang', lang);
  };

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
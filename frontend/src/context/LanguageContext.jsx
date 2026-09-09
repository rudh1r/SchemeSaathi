import { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    nav_home: 'Home',
    nav_chat: 'Chat Assistant',
    nav_eligibility: 'Check Eligibility',
    nav_schemes: 'Browse Schemes',
    nav_about: 'About',
    check_eligibility_btn: 'Check Eligibility',
    hero_title: 'Find the Government Schemes You Are Eligible For Instantly',
    hero_subtitle: 'Describe your profile in plain Hindi or English, or complete a structured 2-minute eligibility check. Our civic engine cross-evaluates demographic, income, and state criteria against verified gazette guidelines.',
    hero_cta_primary: 'Check Your Eligibility',
    hero_cta_secondary: 'Consult SchemeSaathi Assistant',
    chat_placeholder: "Ask in English (e.g. 'How do I apply for Kisan Credit Card?')",
    chat_ask_btn: 'Ask',
    chat_intro: "Hello! Describe your situation — occupation, income, land, location, or specific needs — and I'll find welfare schemes you may be eligible for, grounded in verified scheme data.",
    login_hi: 'Hi',
    logout_btn: 'Logout',
  },
  hi: {
    nav_home: 'होम',
    nav_chat: 'चैट सहायक',
    nav_eligibility: 'पात्रता जांचें',
    nav_schemes: 'योजनाएं देखें',
    nav_about: 'हमारे बारे में',
    check_eligibility_btn: 'पात्रता जांचें',
    hero_title: 'तुरंत जानें आप किन सरकारी योजनाओं के लिए पात्र हैं',
    hero_subtitle: 'अपनी स्थिति हिंदी या अंग्रेज़ी में बताएं, या 2 मिनट में संरचित पात्रता जांच पूरी करें। हमारा सिस्टम आपकी जानकारी को सत्यापित सरकारी दिशानिर्देशों से मिलाकर जांचता है।',
    hero_cta_primary: 'अपनी पात्रता जांचें',
    hero_cta_secondary: 'SchemeSaathi सहायक से पूछें',
    chat_placeholder: "अंग्रेज़ी या हिंदी में पूछें (जैसे 'किसान क्रेडिट कार्ड के लिए आवेदन कैसे करें?')",
    chat_ask_btn: 'पूछें',
    chat_intro: 'नमस्ते! अपनी स्थिति बताएं — व्यवसाय, आय, भूमि, स्थान, या विशेष आवश्यकताएं — और मैं आपके लिए उपयुक्त सरकारी योजनाएं खोजूंगा, जो सत्यापित डेटा पर आधारित होंगी।',
    login_hi: 'नमस्ते',
    logout_btn: 'लॉग आउट',
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
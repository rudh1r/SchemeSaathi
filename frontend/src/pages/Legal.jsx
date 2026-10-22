import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { useLanguage } from '../context/LanguageContext';

const COPY = {
  privacy: {
    en: {
      title: 'Privacy Notice',
      updated: 'Last updated: October 2026',
      intro:
        'SchemeSaathi is an academic project. This notice explains what the app stores, why it stores it, and the choices you have. It is written in plain language rather than legal boilerplate.',
      sections: [
        {
          heading: 'What we collect',
          body: 'If you create an account we store your name, email address and a securely hashed password. If you save a profile we store the attributes you enter (for example age, state, income band and category). If you use the assistant we store the question and answer so it can appear in your history. We do not collect Aadhaar numbers, bank details or documents.',
        },
        {
          heading: 'How we use it',
          body: 'Your profile is used only to evaluate scheme eligibility and to answer your questions. Saved history lets you revisit previous results. We do not sell data, run advertising, or share your information with third parties.',
        },
        {
          heading: 'Local storage',
          body: 'A login token, your language and theme preference, and an unsaved profile draft are kept in your browser. Clearing site data removes them. Signing out removes the token.',
        },
        {
          heading: 'Retention and deletion',
          body: 'History entries and bookmarks can be deleted from the My Activity page. To delete your account and all associated records, contact the project maintainer. Because this is a teaching project, data may be reset during development.',
        },
        {
          heading: 'Your choices',
          body: 'You can use the assistant and the eligibility check without an account. In that case no profile or history is saved on the server. You can decline to answer any question; the app will mark the result as “Insufficient Information” instead of guessing.',
        },
      ],
    },
    hi: {
      title: 'गोपनीयता सूचना',
      updated: 'अंतिम अद्यतन: अक्टूबर 2026',
      intro:
        'SchemeSaathi एक शैक्षणिक परियोजना है। यह सूचना बताती है कि ऐप क्या संग्रहीत करता है, क्यों करता है और आपके क्या विकल्प हैं।',
      sections: [
        {
          heading: 'हम क्या एकत्र करते हैं',
          body: 'यदि आप खाता बनाते हैं तो हम आपका नाम, ईमेल और सुरक्षित रूप से हैश किया गया पासवर्ड संग्रहीत करते हैं। यदि आप प्रोफ़ाइल सहेजते हैं तो हम आपके द्वारा दर्ज जानकारी (जैसे आयु, राज्य, आय वर्ग और श्रेणी) संग्रहीत करते हैं। सहायक का उपयोग करने पर प्रश्न और उत्तर इतिहास में दिखाने के लिए सहेजे जाते हैं। हम आधार संख्या, बैंक विवरण या दस्तावेज़ एकत्र नहीं करते।',
        },
        {
          heading: 'हम इसका उपयोग कैसे करते हैं',
          body: 'आपकी प्रोफ़ाइल केवल योजना पात्रता जांचने और आपके प्रश्नों का उत्तर देने के लिए उपयोग की जाती है। सहेजा गया इतिहास आपको पिछले परिणाम देखने देता है। हम डेटा नहीं बेचते, विज्ञापन नहीं चलाते और आपकी जानकारी तीसरे पक्ष के साथ साझा नहीं करते।',
        },
        {
          heading: 'स्थानीय स्टोरेज',
          body: 'लॉगिन टोकन, भाषा और थीम प्राथमिकता तथा असहेजी गई प्रोफ़ाइल आपके ब्राउज़र में रहती है। साइट डेटा साफ़ करने पर ये हट जाती हैं। लॉग आउट करने पर टोकन हट जाता है।',
        },
        {
          heading: 'अवधि और विलोपन',
          body: 'इतिहास और बुकमार्क “मेरी गतिविधि” पृष्ठ से हटाए जा सकते हैं। खाता और उससे जुड़े सभी रिकॉर्ड हटाने के लिए परियोजना अनुरक्षक से संपर्क करें। चूंकि यह एक शिक्षण परियोजना है, विकास के दौरान डेटा रीसेट हो सकता है।',
        },
        {
          heading: 'आपके विकल्प',
          body: 'आप बिना खाता बनाए सहायक और पात्रता जांच का उपयोग कर सकते हैं। उस स्थिति में सर्वर पर कोई प्रोफ़ाइल या इतिहास सहेजा नहीं जाता। आप किसी भी प्रश्न का उत्तर न देने का विकल्प चुन सकते हैं; ऐप अनुमान लगाने के बजाय परिणाम को “अपर्याप्त जानकारी” बताएगा।',
        },
      ],
    },
  },
  terms: {
    en: {
      title: 'Terms of Use',
      updated: 'Last updated: October 2026',
      intro:
        'SchemeSaathi helps you discover government welfare schemes. It is an informational tool, not a government portal, and it does not grant or deny any benefit.',
      sections: [
        {
          heading: 'Informational purpose only',
          body: 'Eligibility results are generated from a rules engine built on published scheme guidelines. A result of “Eligible” means your declared attributes match the stored criteria; it is not an approval, sanction or guarantee of payment. A result of “Not eligible” reflects the stored rules and may change if the rules or your circumstances change.',
        },
        {
          heading: 'Always verify with the official source',
          body: 'Scheme amounts, deadlines and conditions are updated by departments from time to time. Before applying, confirm the details on the official scheme portal or with your local office. Each result links to its source record where available.',
        },
        {
          heading: 'Your responsibilities',
          body: 'Provide accurate information. Do not use the service to impersonate another person or to submit false claims. Do not attempt to disrupt the service, scrape it at scale, or bypass authentication.',
        },
        {
          heading: 'No warranty',
          body: 'The service is provided “as is” for academic and demonstration purposes. The maintainers do not guarantee uninterrupted availability or freedom from errors, and are not liable for decisions made solely on the basis of the output.',
        },
        {
          heading: 'Changes',
          body: 'These terms and the underlying scheme data may be updated as the project evolves. Continued use after an update means you accept the revised terms.',
        },
      ],
    },
    hi: {
      title: 'उपयोग की शर्तें',
      updated: 'अंतिम अद्यतन: अक्टूबर 2026',
      intro:
        'SchemeSaathi सरकारी कल्याण योजनाओं को खोजने में मदद करता है। यह एक सूचनात्मक उपकरण है, सरकारी पोर्टल नहीं, और यह किसी लाभ को स्वीकृत या अस्वीकृत नहीं करता।',
      sections: [
        {
          heading: 'केवल सूचनात्मक उद्देश्य',
          body: 'पात्रता परिणाम प्रकाशित योजना दिशानिर्देशों पर बने नियम-इंजन से तैयार होते हैं। “पात्र” का अर्थ है कि आपकी घोषित जानकारी संग्रहीत मानदंडों से मेल खाती है; यह स्वीकृति, मंजूरी या भुगतान की गारंटी नहीं है। “अपात्र” परिणाम संग्रहीत नियमों को दर्शाता है और नियम या परिस्थिति बदलने पर बदल सकता है।',
        },
        {
          heading: 'आधिकारिक स्रोत से पुष्टि करें',
          body: 'योजना की राशि, समय-सीमा और शर्तें विभागों द्वारा समय-समय पर बदली जाती हैं। आवेदन से पहले आधिकारिक योजना पोर्टल या स्थानीय कार्यालय पर विवरण की पुष्टि करें। जहां उपलब्ध हो, प्रत्येक परिणाम अपने स्रोत से जुड़ा होता है।',
        },
        {
          heading: 'आपकी जिम्मेदारियां',
          body: 'सही जानकारी दें। किसी अन्य व्यक्ति का रूप धारण करने या झूठे दावे करने के लिए सेवा का उपयोग न करें। सेवा को बाधित करने, बड़े पैमाने पर स्क्रैप करने या प्रमाणीकरण को बायपास करने का प्रयास न करें।',
        },
        {
          heading: 'कोई वारंटी नहीं',
          body: 'यह सेवा शैक्षणिक और प्रदर्शन उद्देश्यों के लिए “जैसी है” प्रदान की जाती है। अनुरक्षक निर्बाध उपलब्धता या त्रुटि-रहितता की गारंटी नहीं देते और केवल आउटपुट के आधार पर लिए गए निर्णयों के लिए उत्तरदायी नहीं हैं।',
        },
        {
          heading: 'परिवर्तन',
          body: 'परियोजना के विकास के साथ ये शर्तें और योजना डेटा अपडेट हो सकते हैं। अपडेट के बाद सेवा का उपयोग जारी रखने का अर्थ है कि आप संशोधित शर्तें स्वीकार करते हैं।',
        },
      ],
    },
  },
};

export default function Legal({ type = 'privacy' }) {
  const { language } = useLanguage();
  const doc = COPY[type]?.[language] || COPY[type]?.en;
  const other = type === 'privacy' ? 'terms' : 'privacy';
  const otherLabel = language === 'hi'
    ? (other === 'privacy' ? 'गोपनीयता सूचना' : 'उपयोग की शर्तें')
    : (other === 'privacy' ? 'Privacy Notice' : 'Terms of Use');

  return (
    <div className="min-h-screen bg-parchment">
      <SiteHeader />
      <main className="pt-28 max-w-3xl mx-auto px-6 pb-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-secondary font-label-md text-label-md font-semibold hover:underline mb-5">
          <ArrowLeft size={16} />
          <span>{language === 'hi' ? 'होम पर वापस' : 'Back to home'}</span>
        </Link>

        <div className="flex items-start gap-3 mb-6">
          <ShieldCheck size={28} className="text-secondary shrink-0 mt-0.5" />
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary">{doc.title}</h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{doc.updated}</p>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-6">{doc.intro}</p>

        <div className="flex flex-col gap-5">
          {doc.sections.map((section, index) => (
            <section key={section.heading} className="rounded border border-outline-variant bg-surface-container-lowest p-5">
              <h2 className="font-headline-sm text-[17px] font-bold text-primary mb-1.5">
                {index + 1}. {section.heading}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded border border-outline-variant bg-surface-container-low p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {language === 'hi' ? 'संबंधित दस्तावेज़ पढ़ें:' : 'Read the related document:'}
          </p>
          <Link to={`/${other}`} className="font-label-md text-label-md font-semibold text-secondary hover:underline">
            {otherLabel}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

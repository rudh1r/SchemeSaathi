/**
 * Turn a scheme record into a practical application checklist.
 *
 * The source data has no structured "documents" field, so this module is
 * explicit about what it is doing: it derives a *preparation aid* from the
 * scheme's own eligibility and application text, plus documents that are
 * commonly requested for that category. It is never presented as an official
 * document list; the official portal remains authoritative.
 */

const COMMON_DOCUMENTS = [
  { id: 'aadhaar', label: 'Aadhaar card', why: 'Identity and direct-benefit transfer', category: 'identity' },
  { id: 'bank', label: 'Bank account passbook (Aadhaar-linked)', why: 'Benefit or loan disbursement', category: 'banking' },
  { id: 'photo', label: 'Recent passport-size photograph', why: 'Application form', category: 'identity' },
];

const CONDITIONAL_DOCUMENTS = [
  { id: 'income', label: 'Income certificate / income proof', why: 'Income eligibility', test: /income|bpl|poverty|salary|tax|economically weaker/i },
  { id: 'residence', label: 'Domicile / residence proof', why: 'State or district eligibility', test: /domicile|resident|state|district|local|permanent address/i },
  { id: 'caste', label: 'Caste / community certificate', why: 'Social-category eligibility', test: /caste|scheduled caste|scheduled tribe|\bsc\b|\bst\b|obc|community/i },
  { id: 'minority', label: 'Minority community certificate / self-declaration', why: 'Minority eligibility', test: /minority|muslim|christian|sikh|buddhist|jain|parsi/i },
  { id: 'land', label: 'Land records / khatauni / ownership proof', why: 'Farmer or landholding eligibility', test: /land|farmer|agricultur|kisan|acre|plot|cultivat/i },
  { id: 'student', label: 'Bonafide / current enrolment certificate', why: 'Student eligibility', test: /student|school|college|scholarship|education|class|course|diploma|degree/i },
  { id: 'marksheet', label: 'Latest marksheet / percentage certificate', why: 'Academic eligibility', test: /marks|percentage|percentile|class 12|class 10|10th|12th|exam/i },
  { id: 'fee', label: 'Fee receipt / admission proof', why: 'Education expense verification', test: /fee|admission|tuition/i },
  { id: 'business', label: 'Business plan / project report', why: 'Enterprise or loan appraisal', test: /business|enterprise|project|loan|udyam|gst|shop|self.employ/i },
  { id: 'vendor', label: 'Certificate of vending / ULB survey ID', why: 'Street-vendor eligibility', test: /street vendor|vending|hawker|urban local body|ulb/i },
  { id: 'disability', label: 'Disability certificate / UDID', why: 'Disability eligibility', test: /disab|divyang|handicap|udid/i },
  { id: 'maternity', label: 'MCP card / pregnancy or delivery record', why: 'Maternity eligibility', test: /pregnan|delivery|maternity|janani/i },
  { id: 'ration', label: 'Ration card', why: 'Food-security or household eligibility', test: /\bration\b|food security|antyodaya|\bpds\b/i },
  { id: 'startup', label: 'DPIIT recognition certificate', why: 'Startup eligibility', test: /startup|dpiit/i },
  { id: 'housing', label: 'Property / house ownership or rental documents', why: 'Housing eligibility', test: /housing|awas|home|house|rooftop/i },
  { id: 'solar', label: 'Electricity bill / rooftop ownership proof', why: 'Solar-installation eligibility', test: /solar|rooftop|electricity|pm.surya|kusum/i },
  { id: 'pension', label: 'Age proof / pension status declaration', why: 'Pension eligibility', test: /pension|old age|retirement/i },
  { id: 'artisan', label: 'Artisan / trade certificate or work photographs', why: 'Artisan-trade verification', test: /artisan|craft|carpenter|blacksmith|potter|weaver|barber|cobbler|goldsmith|tailor/i },
];

function schemeText(scheme) {
  const eligibility = scheme?.eligibility && typeof scheme.eligibility === 'object'
    ? Object.values(scheme.eligibility).join(' ')
    : '';
  return [
    scheme?.scheme_name,
    scheme?.description,
    scheme?.benefits,
    scheme?.application_process,
    eligibility,
    scheme?.category,
    scheme?.state,
    scheme?.level,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function splitSteps(applicationProcess) {
  const text = String(applicationProcess || '').trim();
  if (!text) return [];
  const parts = text
    .split(/(?:;\s*|\.\s+)/)
    .map((part) => part.replace(/^\d+[.)]\s*/, '').trim())
    .filter((part) => part.length > 12 && !/^(apply|visit|contact)$/i.test(part));
  return parts.slice(0, 6);
}

export function deriveChecklist(scheme) {
  const text = schemeText(scheme);
  const documents = new Map();
  for (const document of COMMON_DOCUMENTS) documents.set(document.id, document);
  for (const document of CONDITIONAL_DOCUMENTS) {
    if (document.test.test(text)) {
      documents.set(document.id, {
        id: document.id,
        label: document.label,
        why: document.why,
        category: document.category,
      });
    }
  }

  const steps = splitSteps(scheme?.application_process);
  if (steps.length === 0) {
    steps.push('Open the official portal or visit the nearest Common Service Centre (CSC).');
    steps.push('Fill the application and upload the documents listed on the portal.');
  }
  steps.push('Submit the application and save the acknowledgement / application number.');
  steps.push('Track the status on the official portal and respond to any queries.');

  return {
    documents: [...documents.values()],
    steps,
    source_url: scheme?.source_url || '',
    disclaimer: 'This checklist is a preparation aid derived from the scheme text, not an official document list. Confirm the final requirements on the official portal.',
  };
}

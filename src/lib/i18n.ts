// Simple i18n implementation for BNFX
// Supports: English, Hindi, Tamil, Telugu, Malayalam, Kannada

export type Locale = 'en' | 'hi' | 'ta' | 'te' | 'ml' | 'kn'

export const locales: { code: Locale; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
]

type TranslationKeys = {
  // Navigation
  'nav.home': string
  'nav.plans': string
  'nav.about': string
  'nav.login': string
  'nav.register': string
  // Hero
  'hero.title': string
  'hero.subtitle': string
  'hero.cta': string
  // Dashboard
  'dashboard.welcome': string
  'dashboard.overview': string
  'dashboard.deposit': string
  'dashboard.withdraw': string
  'dashboard.earnings': string
  'dashboard.team': string
  'dashboard.security': string
  // Common
  'common.loading': string
  'common.submit': string
  'common.cancel': string
  'common.save': string
  'common.delete': string
  'common.confirm': string
  'common.success': string
  'common.error': string
  'common.amount': string
  'common.status': string
  // Auth
  'auth.login': string
  'auth.register': string
  'auth.email': string
  'auth.password': string
  'auth.name': string
  'auth.referralCode': string
  'auth.forgotPassword': string
}

const translations: Record<Locale, TranslationKeys> = {
  en: {
    'nav.home': 'Home',
    'nav.plans': 'Plans',
    'nav.about': 'About',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'hero.title': 'Enable Your USDC Auto-Earning Mode',
    'hero.subtitle': 'Automated crypto investment platform with daily returns up to 15%. AI-powered trading for consistent profits.',
    'hero.cta': 'Start Earning Now',
    'dashboard.welcome': 'Welcome back',
    'dashboard.overview': 'Dashboard',
    'dashboard.deposit': 'Deposit',
    'dashboard.withdraw': 'Withdraw',
    'dashboard.earnings': 'Earnings',
    'dashboard.team': 'Team',
    'dashboard.security': 'Security',
    'common.loading': 'Loading...',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.amount': 'Amount',
    'common.status': 'Status',
    'auth.login': 'Login',
    'auth.register': 'Create Account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.referralCode': 'Referral Code (Optional)',
    'auth.forgotPassword': 'Forgot Password?',
  },
  hi: {
    'nav.home': 'होम',
    'nav.plans': 'प्लान',
    'nav.about': 'हमारे बारे में',
    'nav.login': 'लॉगिन',
    'nav.register': 'रजिस्टर',
    'hero.title': 'अपना USDC ऑटो-अर्निंग मोड चालू करें',
    'hero.subtitle': 'AI-संचालित ट्रेडिंग के साथ स्वचालित क्रिप्टो निवेश प्लेटफॉर्म। दैनिक 15% तक रिटर्न।',
    'hero.cta': 'अभी कमाना शुरू करें',
    'dashboard.welcome': 'वापसी पर स्वागत है',
    'dashboard.overview': 'डैशबोर्ड',
    'dashboard.deposit': 'जमा करें',
    'dashboard.withdraw': 'निकासी',
    'dashboard.earnings': 'कमाई',
    'dashboard.team': 'टीम',
    'dashboard.security': 'सुरक्षा',
    'common.loading': 'लोड हो रहा है...',
    'common.submit': 'जमा करें',
    'common.cancel': 'रद्द करें',
    'common.save': 'सहेजें',
    'common.delete': 'हटाएं',
    'common.confirm': 'पुष्टि करें',
    'common.success': 'सफल',
    'common.error': 'त्रुटि',
    'common.amount': 'राशि',
    'common.status': 'स्थिति',
    'auth.login': 'लॉगिन',
    'auth.register': 'खाता बनाएं',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.name': 'पूरा नाम',
    'auth.referralCode': 'रेफरल कोड (वैकल्पिक)',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
  },
  ta: {
    'nav.home': 'முகப்பு',
    'nav.plans': 'திட்டங்கள்',
    'nav.about': 'எங்களைப் பற்றி',
    'nav.login': 'உள்நுழைய',
    'nav.register': 'பதிவு',
    'hero.title': 'உங்கள் USDC தானியங்கி வருமான பயன்முறையை இயக்கவும்',
    'hero.subtitle': 'AI இயக்கும் வர்த்தகத்துடன் தானியங்கி கிரிப்டோ முதலீட்டு தளம். தினசரி 15% வரை வருமானம்.',
    'hero.cta': 'இப்போது சம்பாதிக்கத் தொடங்குங்கள்',
    'dashboard.welcome': 'மீண்டும் வரவேற்கிறோம்',
    'dashboard.overview': 'டாஷ்போர்டு',
    'dashboard.deposit': 'டெபாசிட்',
    'dashboard.withdraw': 'திரும்பப் பெறுதல்',
    'dashboard.earnings': 'வருமானம்',
    'dashboard.team': 'குழு',
    'dashboard.security': 'பாதுகாப்பு',
    'common.loading': 'ஏற்றுகிறது...',
    'common.submit': 'சமர்ப்பிக்கவும்',
    'common.cancel': 'ரத்து செய்',
    'common.save': 'சேமி',
    'common.delete': 'நீக்கு',
    'common.confirm': 'உறுதிப்படுத்து',
    'common.success': 'வெற்றி',
    'common.error': 'பிழை',
    'common.amount': 'தொகை',
    'common.status': 'நிலை',
    'auth.login': 'உள்நுழைய',
    'auth.register': 'கணக்கை உருவாக்கு',
    'auth.email': 'மின்னஞ்சல்',
    'auth.password': 'கடவுச்சொல்',
    'auth.name': 'முழு பெயர்',
    'auth.referralCode': 'பரிந்துரை குறியீடு (விருப்பம்)',
    'auth.forgotPassword': 'கடவுச்சொல் மறந்துவிட்டதா?',
  },
  te: {
    'nav.home': 'హోమ్',
    'nav.plans': 'ప్లాన్లు',
    'nav.about': 'మా గురించి',
    'nav.login': 'లాగిన్',
    'nav.register': 'రిజిస్టర్',
    'hero.title': 'మీ USDC ఆటో-ఆర్నింగ్ మోడ్‌ను ఎనేబుల్ చేయండి',
    'hero.subtitle': 'AI-ఆధారిత ట్రేడింగ్‌తో ఆటోమేటెడ్ క్రిప్టో ఇన్వెస్ట్‌మెంట్ ప్లాట్‌ఫారమ్. రోజువారీ 15% వరకు రిటర్న్‌లు.',
    'hero.cta': 'ఇప్పుడు సంపాదించడం ప్రారంభించండి',
    'dashboard.welcome': 'తిరిగి స్వాగతం',
    'dashboard.overview': 'డాష్‌బోర్డ్',
    'dashboard.deposit': 'డిపాజిట్',
    'dashboard.withdraw': 'ఉపసంహరణ',
    'dashboard.earnings': 'ఆదాయాలు',
    'dashboard.team': 'టీమ్',
    'dashboard.security': 'భద్రత',
    'common.loading': 'లోడ్ అవుతోంది...',
    'common.submit': 'సమర్పించు',
    'common.cancel': 'రద్దు',
    'common.save': 'సేవ్',
    'common.delete': 'తొలగించు',
    'common.confirm': 'నిర్ధారించు',
    'common.success': 'విజయం',
    'common.error': 'లోపం',
    'common.amount': 'మొత్తం',
    'common.status': 'స్థితి',
    'auth.login': 'లాగిన్',
    'auth.register': 'ఖాతా సృష్టించు',
    'auth.email': 'ఇమెయిల్',
    'auth.password': 'పాస్‌వర్డ్',
    'auth.name': 'పూర్తి పేరు',
    'auth.referralCode': 'రిఫరల్ కోడ్ (ఐచ్ఛికం)',
    'auth.forgotPassword': 'పాస్‌వర్డ్ మర్చిపోయారా?',
  },
  ml: {
    'nav.home': 'ഹോം',
    'nav.plans': 'പ്ലാനുകൾ',
    'nav.about': 'ഞങ്ങളെ കുറിച്ച്',
    'nav.login': 'ലോഗിൻ',
    'nav.register': 'രജിസ്റ്റർ',
    'hero.title': 'നിങ്ങളുടെ USDC ഓട്ടോ-ഏർണിംഗ് മോഡ് പ്രവർത്തനക്ഷമമാക്കുക',
    'hero.subtitle': 'AI-പവർഡ് ട്രേഡിംഗ് ഉള്ള ഓട്ടോമേറ്റഡ് ക്രിപ്‌റ്റോ ഇൻവെസ്റ്റ്‌മെന്റ് പ്ലാറ്റ്‌ഫോം. ദൈനംദിന 15% വരെ റിട്ടേൺ.',
    'hero.cta': 'ഇപ്പോൾ സമ്പാദിക്കാൻ തുടങ്ങുക',
    'dashboard.welcome': 'തിരികെ സ്വാഗതം',
    'dashboard.overview': 'ഡാഷ്‌ബോർഡ്',
    'dashboard.deposit': 'നിക്ഷേപം',
    'dashboard.withdraw': 'പിൻവലിക്കൽ',
    'dashboard.earnings': 'വരുമാനം',
    'dashboard.team': 'ടീം',
    'dashboard.security': 'സുരക്ഷ',
    'common.loading': 'ലോഡ് ചെയ്യുന്നു...',
    'common.submit': 'സമർപ്പിക്കുക',
    'common.cancel': 'റദ്ദാക്കുക',
    'common.save': 'സേവ്',
    'common.delete': 'ഇല്ലാതാക്കുക',
    'common.confirm': 'സ്ഥിരീകരിക്കുക',
    'common.success': 'വിജയം',
    'common.error': 'പിശക്',
    'common.amount': 'തുക',
    'common.status': 'നില',
    'auth.login': 'ലോഗിൻ',
    'auth.register': 'അക്കൗണ്ട് സൃഷ്ടിക്കുക',
    'auth.email': 'ഇമെയിൽ',
    'auth.password': 'പാസ്‌വേഡ്',
    'auth.name': 'മുഴുവൻ പേര്',
    'auth.referralCode': 'റഫറൽ കോഡ് (ഓപ്ഷണൽ)',
    'auth.forgotPassword': 'പാസ്‌വേഡ് മറന്നോ?',
  },
  kn: {
    'nav.home': 'ಮುಖಪುಟ',
    'nav.plans': 'ಯೋಜನೆಗಳು',
    'nav.about': 'ನಮ್ಮ ಬಗ್ಗೆ',
    'nav.login': 'ಲಾಗಿನ್',
    'nav.register': 'ನೋಂದಣಿ',
    'hero.title': 'ನಿಮ್ಮ USDC ಆಟೋ-ಅರ್ನಿಂಗ್ ಮೋಡ್ ಅನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ',
    'hero.subtitle': 'AI-ಚಾಲಿತ ಟ್ರೇಡಿಂಗ್‌ನೊಂದಿಗೆ ಸ್ವಯಂಚಾಲಿತ ಕ್ರಿಪ್ಟೋ ಹೂಡಿಕೆ ವೇದಿಕೆ. ದೈನಂದಿನ 15% ವರೆಗೆ ಆದಾಯ.',
    'hero.cta': 'ಈಗ ಗಳಿಸಲು ಪ್ರಾರಂಭಿಸಿ',
    'dashboard.welcome': 'ಮರಳಿ ಸ್ವಾಗತ',
    'dashboard.overview': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'dashboard.deposit': 'ಠೇವಣಿ',
    'dashboard.withdraw': 'ಹಿಂಪಡೆಯುವಿಕೆ',
    'dashboard.earnings': 'ಗಳಿಕೆ',
    'dashboard.team': 'ತಂಡ',
    'dashboard.security': 'ಭದ್ರತೆ',
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'common.submit': 'ಸಲ್ಲಿಸಿ',
    'common.cancel': 'ರದ್ದುಮಾಡಿ',
    'common.save': 'ಉಳಿಸಿ',
    'common.delete': 'ಅಳಿಸಿ',
    'common.confirm': 'ದೃಢೀಕರಿಸಿ',
    'common.success': 'ಯಶಸ್ಸು',
    'common.error': 'ದೋಷ',
    'common.amount': 'ಮೊತ್ತ',
    'common.status': 'ಸ್ಥಿತಿ',
    'auth.login': 'ಲಾಗಿನ್',
    'auth.register': 'ಖಾತೆ ರಚಿಸಿ',
    'auth.email': 'ಇಮೇಲ್',
    'auth.password': 'ಪಾಸ್‌ವರ್ಡ್',
    'auth.name': 'ಪೂರ್ಣ ಹೆಸರು',
    'auth.referralCode': 'ರೆಫರಲ್ ಕೋಡ್ (ಐಚ್ಛಿಕ)',
    'auth.forgotPassword': 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?',
  },
}

// Get current locale from localStorage or default to 'en'
export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('bnfx_locale') as Locale) || 'en'
}

// Set locale
export function setLocale(locale: Locale) {
  if (typeof window === 'undefined') return
  localStorage.setItem('bnfx_locale', locale)
  window.dispatchEvent(new Event('locale-changed'))
}

// Translation function
export function t(key: keyof TranslationKeys, locale?: Locale): string {
  const currentLocale = locale || getLocale()
  return translations[currentLocale]?.[key] || translations.en[key] || key
}

// Hook-friendly translation getter
export function getTranslations(locale?: Locale) {
  const currentLocale = locale || getLocale()
  return translations[currentLocale] || translations.en
}

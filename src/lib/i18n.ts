// BNFX i18n - Multi-language with Geo-IP auto-detection
// Supports: English, Arabic, French, Spanish, Portuguese, Russian, Turkish, Hindi, Indonesian, Chinese

export type Locale = 'en' | 'ar' | 'fr' | 'es' | 'pt' | 'ru' | 'tr' | 'hi' | 'id' | 'zh'

export const locales: { code: Locale; name: string; nativeName: string; dir: 'ltr' | 'rtl'; flag: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', flag: '🇸🇦' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr', flag: '🇷🇺' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr', flag: '🇹🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', flag: '🇮🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', dir: 'ltr', flag: '🇮🇩' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr', flag: '🇨🇳' },
]

// Country to locale mapping for geo-IP detection
const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  // Arabic-speaking (GCC + MENA)
  SA: 'ar', AE: 'ar', QA: 'ar', BH: 'ar', KW: 'ar', OM: 'ar',
  EG: 'ar', JO: 'ar', LB: 'ar', IQ: 'ar', LY: 'ar', MA: 'ar', TN: 'ar', DZ: 'ar',
  // French-speaking
  FR: 'fr', BE: 'fr', CH: 'fr', CA: 'fr', SN: 'fr', CI: 'fr', CM: 'fr', CD: 'fr',
  // Spanish-speaking
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', CL: 'es', VE: 'es', EC: 'es',
  // Portuguese-speaking
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt',
  // Russian-speaking
  RU: 'ru', UA: 'ru', BY: 'ru', KZ: 'ru', UZ: 'ru',
  // Turkish
  TR: 'tr', AZ: 'tr',
  // Hindi
  IN: 'hi',
  // Indonesian
  ID: 'id', MY: 'id',
  // Chinese
  CN: 'zh', TW: 'zh', HK: 'zh', SG: 'zh',
}

type TranslationKeys = {
  'nav.home': string
  'nav.plans': string
  'nav.about': string
  'nav.login': string
  'nav.register': string
  'hero.title': string
  'hero.subtitle': string
  'hero.cta': string
  'hero.ctaSecondary': string
  'dashboard.welcome': string
  'dashboard.overview': string
  'dashboard.deposit': string
  'dashboard.withdraw': string
  'dashboard.earnings': string
  'dashboard.team': string
  'dashboard.security': string
  'dashboard.invest': string
  'common.loading': string
  'common.submit': string
  'common.cancel': string
  'common.save': string
  'common.confirm': string
  'common.success': string
  'common.error': string
  'common.amount': string
  'common.status': string
  'auth.login': string
  'auth.register': string
  'auth.email': string
  'auth.password': string
  'auth.name': string
  'auth.referralCode': string
  'auth.forgotPassword': string
  'plans.title': string
  'plans.subtitle': string
  'plans.invest': string
  'plans.daily': string
  'footer.rights': string
  'footer.powered': string
}

const translations: Record<Locale, TranslationKeys> = {
  en: {
    'nav.home': 'Home', 'nav.plans': 'Plans', 'nav.about': 'About', 'nav.login': 'Login', 'nav.register': 'Register',
    'hero.title': 'The Future of Crypto Investing', 'hero.subtitle': 'AI-powered trading algorithms delivering consistent daily returns. Join thousands of investors earning passively.', 'hero.cta': 'Start Earning Now', 'hero.ctaSecondary': 'View Plans',
    'dashboard.welcome': 'Welcome back', 'dashboard.overview': 'Dashboard', 'dashboard.deposit': 'Deposit', 'dashboard.withdraw': 'Withdraw', 'dashboard.earnings': 'Earnings', 'dashboard.team': 'Team', 'dashboard.security': 'Security', 'dashboard.invest': 'Invest',
    'common.loading': 'Loading...', 'common.submit': 'Submit', 'common.cancel': 'Cancel', 'common.save': 'Save', 'common.confirm': 'Confirm', 'common.success': 'Success', 'common.error': 'Error', 'common.amount': 'Amount', 'common.status': 'Status',
    'auth.login': 'Login', 'auth.register': 'Create Account', 'auth.email': 'Email', 'auth.password': 'Password', 'auth.name': 'Full Name', 'auth.referralCode': 'Referral Code (Optional)', 'auth.forgotPassword': 'Forgot Password?',
    'plans.title': 'Investment Plans', 'plans.subtitle': 'Choose a plan that fits your goals', 'plans.invest': 'Invest Now', 'plans.daily': 'Daily Return',
    'footer.rights': 'All rights reserved.', 'footer.powered': 'Powered by BNFX Protocol',
  },
  ar: {
    'nav.home': 'الرئيسية', 'nav.plans': 'الخطط', 'nav.about': 'حول', 'nav.login': 'تسجيل الدخول', 'nav.register': 'إنشاء حساب',
    'hero.title': 'مستقبل الاستثمار في العملات الرقمية', 'hero.subtitle': 'خوارزميات تداول مدعومة بالذكاء الاصطناعي تقدم عوائد يومية ثابتة. انضم إلى آلاف المستثمرين.', 'hero.cta': 'ابدأ الربح الآن', 'hero.ctaSecondary': 'عرض الخطط',
    'dashboard.welcome': 'مرحباً بعودتك', 'dashboard.overview': 'لوحة التحكم', 'dashboard.deposit': 'إيداع', 'dashboard.withdraw': 'سحب', 'dashboard.earnings': 'الأرباح', 'dashboard.team': 'الفريق', 'dashboard.security': 'الأمان', 'dashboard.invest': 'استثمار',
    'common.loading': 'جاري التحميل...', 'common.submit': 'إرسال', 'common.cancel': 'إلغاء', 'common.save': 'حفظ', 'common.confirm': 'تأكيد', 'common.success': 'نجاح', 'common.error': 'خطأ', 'common.amount': 'المبلغ', 'common.status': 'الحالة',
    'auth.login': 'تسجيل الدخول', 'auth.register': 'إنشاء حساب', 'auth.email': 'البريد الإلكتروني', 'auth.password': 'كلمة المرور', 'auth.name': 'الاسم الكامل', 'auth.referralCode': 'رمز الإحالة (اختياري)', 'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'plans.title': 'خطط الاستثمار', 'plans.subtitle': 'اختر الخطة المناسبة لأهدافك', 'plans.invest': 'استثمر الآن', 'plans.daily': 'العائد اليومي',
    'footer.rights': 'جميع الحقوق محفوظة.', 'footer.powered': 'مدعوم من بروتوكول BNFX',
  },
  fr: {
    'nav.home': 'Accueil', 'nav.plans': 'Plans', 'nav.about': 'À propos', 'nav.login': 'Connexion', 'nav.register': "S'inscrire",
    'hero.title': "L'avenir de l'investissement crypto", 'hero.subtitle': "Algorithmes de trading IA offrant des rendements quotidiens constants. Rejoignez des milliers d'investisseurs.", 'hero.cta': 'Commencer à gagner', 'hero.ctaSecondary': 'Voir les plans',
    'dashboard.welcome': 'Bon retour', 'dashboard.overview': 'Tableau de bord', 'dashboard.deposit': 'Dépôt', 'dashboard.withdraw': 'Retrait', 'dashboard.earnings': 'Gains', 'dashboard.team': 'Équipe', 'dashboard.security': 'Sécurité', 'dashboard.invest': 'Investir',
    'common.loading': 'Chargement...', 'common.submit': 'Soumettre', 'common.cancel': 'Annuler', 'common.save': 'Enregistrer', 'common.confirm': 'Confirmer', 'common.success': 'Succès', 'common.error': 'Erreur', 'common.amount': 'Montant', 'common.status': 'Statut',
    'auth.login': 'Connexion', 'auth.register': 'Créer un compte', 'auth.email': 'Email', 'auth.password': 'Mot de passe', 'auth.name': 'Nom complet', 'auth.referralCode': 'Code parrainage (Optionnel)', 'auth.forgotPassword': 'Mot de passe oublié ?',
    'plans.title': "Plans d'investissement", 'plans.subtitle': 'Choisissez un plan adapté à vos objectifs', 'plans.invest': 'Investir maintenant', 'plans.daily': 'Rendement quotidien',
    'footer.rights': 'Tous droits réservés.', 'footer.powered': 'Propulsé par BNFX Protocol',
  },
  es: {
    'nav.home': 'Inicio', 'nav.plans': 'Planes', 'nav.about': 'Acerca de', 'nav.login': 'Iniciar sesión', 'nav.register': 'Registrarse',
    'hero.title': 'El futuro de la inversión cripto', 'hero.subtitle': 'Algoritmos de trading con IA que ofrecen rendimientos diarios consistentes. Únete a miles de inversores.', 'hero.cta': 'Empieza a ganar', 'hero.ctaSecondary': 'Ver planes',
    'dashboard.welcome': 'Bienvenido de vuelta', 'dashboard.overview': 'Panel', 'dashboard.deposit': 'Depositar', 'dashboard.withdraw': 'Retirar', 'dashboard.earnings': 'Ganancias', 'dashboard.team': 'Equipo', 'dashboard.security': 'Seguridad', 'dashboard.invest': 'Invertir',
    'common.loading': 'Cargando...', 'common.submit': 'Enviar', 'common.cancel': 'Cancelar', 'common.save': 'Guardar', 'common.confirm': 'Confirmar', 'common.success': 'Éxito', 'common.error': 'Error', 'common.amount': 'Monto', 'common.status': 'Estado',
    'auth.login': 'Iniciar sesión', 'auth.register': 'Crear cuenta', 'auth.email': 'Correo', 'auth.password': 'Contraseña', 'auth.name': 'Nombre completo', 'auth.referralCode': 'Código de referido (Opcional)', 'auth.forgotPassword': '¿Olvidaste tu contraseña?',
    'plans.title': 'Planes de inversión', 'plans.subtitle': 'Elige un plan que se adapte a tus metas', 'plans.invest': 'Invertir ahora', 'plans.daily': 'Rendimiento diario',
    'footer.rights': 'Todos los derechos reservados.', 'footer.powered': 'Impulsado por BNFX Protocol',
  },
  pt: {
    'nav.home': 'Início', 'nav.plans': 'Planos', 'nav.about': 'Sobre', 'nav.login': 'Entrar', 'nav.register': 'Cadastrar',
    'hero.title': 'O futuro do investimento cripto', 'hero.subtitle': 'Algoritmos de trading com IA entregando retornos diários consistentes. Junte-se a milhares de investidores.', 'hero.cta': 'Comece a ganhar', 'hero.ctaSecondary': 'Ver planos',
    'dashboard.welcome': 'Bem-vindo de volta', 'dashboard.overview': 'Painel', 'dashboard.deposit': 'Depósito', 'dashboard.withdraw': 'Saque', 'dashboard.earnings': 'Ganhos', 'dashboard.team': 'Equipe', 'dashboard.security': 'Segurança', 'dashboard.invest': 'Investir',
    'common.loading': 'Carregando...', 'common.submit': 'Enviar', 'common.cancel': 'Cancelar', 'common.save': 'Salvar', 'common.confirm': 'Confirmar', 'common.success': 'Sucesso', 'common.error': 'Erro', 'common.amount': 'Valor', 'common.status': 'Status',
    'auth.login': 'Entrar', 'auth.register': 'Criar conta', 'auth.email': 'Email', 'auth.password': 'Senha', 'auth.name': 'Nome completo', 'auth.referralCode': 'Código de indicação (Opcional)', 'auth.forgotPassword': 'Esqueceu a senha?',
    'plans.title': 'Planos de investimento', 'plans.subtitle': 'Escolha um plano que se adapte aos seus objetivos', 'plans.invest': 'Investir agora', 'plans.daily': 'Retorno diário',
    'footer.rights': 'Todos os direitos reservados.', 'footer.powered': 'Desenvolvido por BNFX Protocol',
  },
  ru: {
    'nav.home': 'Главная', 'nav.plans': 'Планы', 'nav.about': 'О нас', 'nav.login': 'Войти', 'nav.register': 'Регистрация',
    'hero.title': 'Будущее крипто-инвестиций', 'hero.subtitle': 'Алгоритмы торговли на базе ИИ, обеспечивающие стабильный ежедневный доход. Присоединяйтесь к тысячам инвесторов.', 'hero.cta': 'Начать зарабатывать', 'hero.ctaSecondary': 'Смотреть планы',
    'dashboard.welcome': 'С возвращением', 'dashboard.overview': 'Панель', 'dashboard.deposit': 'Депозит', 'dashboard.withdraw': 'Вывод', 'dashboard.earnings': 'Доходы', 'dashboard.team': 'Команда', 'dashboard.security': 'Безопасность', 'dashboard.invest': 'Инвестировать',
    'common.loading': 'Загрузка...', 'common.submit': 'Отправить', 'common.cancel': 'Отмена', 'common.save': 'Сохранить', 'common.confirm': 'Подтвердить', 'common.success': 'Успех', 'common.error': 'Ошибка', 'common.amount': 'Сумма', 'common.status': 'Статус',
    'auth.login': 'Войти', 'auth.register': 'Создать аккаунт', 'auth.email': 'Email', 'auth.password': 'Пароль', 'auth.name': 'Полное имя', 'auth.referralCode': 'Реферальный код (Необязательно)', 'auth.forgotPassword': 'Забыли пароль?',
    'plans.title': 'Инвестиционные планы', 'plans.subtitle': 'Выберите план, подходящий вашим целям', 'plans.invest': 'Инвестировать', 'plans.daily': 'Дневной доход',
    'footer.rights': 'Все права защищены.', 'footer.powered': 'Работает на BNFX Protocol',
  },
  tr: {
    'nav.home': 'Ana Sayfa', 'nav.plans': 'Planlar', 'nav.about': 'Hakkında', 'nav.login': 'Giriş', 'nav.register': 'Kayıt Ol',
    'hero.title': 'Kripto Yatırımın Geleceği', 'hero.subtitle': 'Yapay zeka destekli ticaret algoritmaları ile tutarlı günlük getiriler. Binlerce yatırımcıya katılın.', 'hero.cta': 'Kazanmaya Başla', 'hero.ctaSecondary': 'Planları Gör',
    'dashboard.welcome': 'Tekrar hoş geldiniz', 'dashboard.overview': 'Panel', 'dashboard.deposit': 'Yatırım', 'dashboard.withdraw': 'Çekim', 'dashboard.earnings': 'Kazançlar', 'dashboard.team': 'Takım', 'dashboard.security': 'Güvenlik', 'dashboard.invest': 'Yatır',
    'common.loading': 'Yükleniyor...', 'common.submit': 'Gönder', 'common.cancel': 'İptal', 'common.save': 'Kaydet', 'common.confirm': 'Onayla', 'common.success': 'Başarılı', 'common.error': 'Hata', 'common.amount': 'Tutar', 'common.status': 'Durum',
    'auth.login': 'Giriş Yap', 'auth.register': 'Hesap Oluştur', 'auth.email': 'E-posta', 'auth.password': 'Şifre', 'auth.name': 'Ad Soyad', 'auth.referralCode': 'Referans Kodu (İsteğe bağlı)', 'auth.forgotPassword': 'Şifremi unuttum?',
    'plans.title': 'Yatırım Planları', 'plans.subtitle': 'Hedeflerinize uygun bir plan seçin', 'plans.invest': 'Şimdi Yatır', 'plans.daily': 'Günlük Getiri',
    'footer.rights': 'Tüm hakları saklıdır.', 'footer.powered': 'BNFX Protocol ile çalışır',
  },
  hi: {
    'nav.home': 'होम', 'nav.plans': 'प्लान', 'nav.about': 'हमारे बारे में', 'nav.login': 'लॉगिन', 'nav.register': 'रजिस्टर',
    'hero.title': 'क्रिप्टो निवेश का भविष्य', 'hero.subtitle': 'AI-संचालित ट्रेडिंग एल्गोरिदम जो लगातार दैनिक रिटर्न देते हैं। हजारों निवेशकों से जुड़ें।', 'hero.cta': 'अभी कमाना शुरू करें', 'hero.ctaSecondary': 'प्लान देखें',
    'dashboard.welcome': 'वापसी पर स्वागत', 'dashboard.overview': 'डैशबोर्ड', 'dashboard.deposit': 'जमा', 'dashboard.withdraw': 'निकासी', 'dashboard.earnings': 'कमाई', 'dashboard.team': 'टीम', 'dashboard.security': 'सुरक्षा', 'dashboard.invest': 'निवेश',
    'common.loading': 'लोड हो रहा है...', 'common.submit': 'जमा करें', 'common.cancel': 'रद्द', 'common.save': 'सहेजें', 'common.confirm': 'पुष्टि', 'common.success': 'सफल', 'common.error': 'त्रुटि', 'common.amount': 'राशि', 'common.status': 'स्थिति',
    'auth.login': 'लॉगिन', 'auth.register': 'खाता बनाएं', 'auth.email': 'ईमेल', 'auth.password': 'पासवर्ड', 'auth.name': 'पूरा नाम', 'auth.referralCode': 'रेफरल कोड (वैकल्पिक)', 'auth.forgotPassword': 'पासवर्ड भूल गए?',
    'plans.title': 'निवेश योजनाएं', 'plans.subtitle': 'अपने लक्ष्यों के अनुसार योजना चुनें', 'plans.invest': 'अभी निवेश करें', 'plans.daily': 'दैनिक रिटर्न',
    'footer.rights': 'सर्वाधिकार सुरक्षित।', 'footer.powered': 'BNFX प्रोटोकॉल द्वारा संचालित',
  },
  id: {
    'nav.home': 'Beranda', 'nav.plans': 'Paket', 'nav.about': 'Tentang', 'nav.login': 'Masuk', 'nav.register': 'Daftar',
    'hero.title': 'Masa Depan Investasi Kripto', 'hero.subtitle': 'Algoritma trading bertenaga AI yang memberikan pengembalian harian konsisten. Bergabunglah dengan ribuan investor.', 'hero.cta': 'Mulai Menghasilkan', 'hero.ctaSecondary': 'Lihat Paket',
    'dashboard.welcome': 'Selamat datang kembali', 'dashboard.overview': 'Dasbor', 'dashboard.deposit': 'Deposit', 'dashboard.withdraw': 'Penarikan', 'dashboard.earnings': 'Penghasilan', 'dashboard.team': 'Tim', 'dashboard.security': 'Keamanan', 'dashboard.invest': 'Investasi',
    'common.loading': 'Memuat...', 'common.submit': 'Kirim', 'common.cancel': 'Batal', 'common.save': 'Simpan', 'common.confirm': 'Konfirmasi', 'common.success': 'Berhasil', 'common.error': 'Kesalahan', 'common.amount': 'Jumlah', 'common.status': 'Status',
    'auth.login': 'Masuk', 'auth.register': 'Buat Akun', 'auth.email': 'Email', 'auth.password': 'Kata Sandi', 'auth.name': 'Nama Lengkap', 'auth.referralCode': 'Kode Referral (Opsional)', 'auth.forgotPassword': 'Lupa kata sandi?',
    'plans.title': 'Paket Investasi', 'plans.subtitle': 'Pilih paket yang sesuai dengan tujuan Anda', 'plans.invest': 'Investasi Sekarang', 'plans.daily': 'Pengembalian Harian',
    'footer.rights': 'Hak cipta dilindungi.', 'footer.powered': 'Didukung oleh BNFX Protocol',
  },
  zh: {
    'nav.home': '首页', 'nav.plans': '计划', 'nav.about': '关于', 'nav.login': '登录', 'nav.register': '注册',
    'hero.title': '加密投资的未来', 'hero.subtitle': 'AI驱动的交易算法，提供稳定的每日回报。加入数千名投资者的行列。', 'hero.cta': '立即开始赚钱', 'hero.ctaSecondary': '查看计划',
    'dashboard.welcome': '欢迎回来', 'dashboard.overview': '仪表板', 'dashboard.deposit': '存款', 'dashboard.withdraw': '提款', 'dashboard.earnings': '收益', 'dashboard.team': '团队', 'dashboard.security': '安全', 'dashboard.invest': '投资',
    'common.loading': '加载中...', 'common.submit': '提交', 'common.cancel': '取消', 'common.save': '保存', 'common.confirm': '确认', 'common.success': '成功', 'common.error': '错误', 'common.amount': '金额', 'common.status': '状态',
    'auth.login': '登录', 'auth.register': '创建账户', 'auth.email': '邮箱', 'auth.password': '密码', 'auth.name': '全名', 'auth.referralCode': '推荐码（可选）', 'auth.forgotPassword': '忘记密码？',
    'plans.title': '投资计划', 'plans.subtitle': '选择适合您目标的计划', 'plans.invest': '立即投资', 'plans.daily': '每日回报',
    'footer.rights': '版权所有。', 'footer.powered': '由 BNFX Protocol 提供支持',
  },
}

// ─── Geo-IP Auto-Detection ─────────────────────────────────────────

export async function detectLocaleFromGeoIP(): Promise<Locale> {
  try {
    // Use a free geo-IP service to detect country
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const data = await res.json()
      const country = data.country_code?.toUpperCase()
      if (country && COUNTRY_LOCALE_MAP[country]) {
        return COUNTRY_LOCALE_MAP[country]
      }
    }
  } catch {
    // Fallback silently
  }
  return 'en'
}

// ─── Locale Management ─────────────────────────────────────────────

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('bnfx_locale') as Locale) || 'en'
}

export function setLocale(locale: Locale) {
  if (typeof window === 'undefined') return
  localStorage.setItem('bnfx_locale', locale)
  // Set document direction for RTL languages
  const localeInfo = locales.find(l => l.code === locale)
  if (localeInfo) {
    document.documentElement.dir = localeInfo.dir
    document.documentElement.lang = locale
  }
  window.dispatchEvent(new Event('locale-changed'))
}

export function t(key: keyof TranslationKeys, locale?: Locale): string {
  const currentLocale = locale || getLocale()
  return translations[currentLocale]?.[key] || translations.en[key] || key
}

export function getTranslations(locale?: Locale) {
  const currentLocale = locale || getLocale()
  return translations[currentLocale] || translations.en
}

export function isRTL(locale?: Locale): boolean {
  const l = locale || getLocale()
  return locales.find(loc => loc.code === l)?.dir === 'rtl'
}

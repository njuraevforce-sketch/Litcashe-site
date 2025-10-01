// Advanced i18n with 14 languages support
window.LC_I18N = (function(){
  const dict = {
    "ru": {
      // Бренд и навигация
      "brand.name": "Litcash",
      "nav.home": "Главная",
      "nav.dashboard": "Личный кабинет",
      "nav.deposit": "Пополнение",
      "nav.withdraw": "Вывод",
      "nav.faq": "FAQ",
      "nav.settings": "Настройки",
      "nav.login": "Вход",
      "nav.register": "Регистрация",
      
      // Языки
      "lang.russian": "Русский",
      "lang.english": "English",
      "lang.chinese": "中文",
      "lang.spanish": "Español",
      "lang.french": "Français",
      "lang.german": "Deutsch",
      "lang.portuguese": "Português",
      "lang.arabic": "العربية",
      "lang.japanese": "日本語",
      "lang.korean": "한국어",
      "lang.turkish": "Türkçe",
      "lang.italian": "Italiano",
      "lang.hindi": "हिन्दी",
      "lang.polish": "Polski",
      
      // Hero секция
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "Заряжайся и побеждай! LITCASH-заработок, которому доверяют!",
      "hero.start": "Начать",
      "hero.more": "Подробнее",
      "hero.activeUsers": "Активные пользователи",
      "hero.payouts": "Выплаты",
      "hero.apr": "Потенциальный APR",
      
      // Шаги работы
      "steps.activation": "Активация",
      "steps.activationDesc": "Пополняешь от 29 USDT (TRC20) — аккаунт становится активным.",
      "steps.views": "Просмотры",
      "steps.viewsDesc": "Смотри короткие ролики. Каждые 5 просмотров дают до 5% к балансу.",
      "steps.referrals": "Рефералы",
      "steps.referralsDesc": "Создай команду инвесторов — ты получаешь 13% / 5% / 1%.",
      
      // Видео
      "video.preview": "Превью",
      
      // Футер
      "footer.copyright": "© 2025 Litcash. Все права защищены."
    },
    "en": {
      "brand.name": "Litcash",
      "nav.home": "Home",
      "nav.dashboard": "Dashboard",
      "nav.deposit": "Deposit",
      "nav.withdraw": "Withdraw",
      "nav.faq": "FAQ",
      "nav.settings": "Settings",
      "nav.login": "Login",
      "nav.register": "Register",
      
      "lang.russian": "Russian",
      "lang.english": "English",
      "lang.chinese": "Chinese",
      "lang.spanish": "Spanish",
      "lang.french": "French",
      "lang.german": "German",
      "lang.portuguese": "Portuguese",
      "lang.arabic": "Arabic",
      "lang.japanese": "Japanese",
      "lang.korean": "Korean",
      "lang.turkish": "Turkish",
      "lang.italian": "Italian",
      "lang.hindi": "Hindi",
      "lang.polish": "Polish",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "Charge up and win! LITCASH - earnings you can trust!",
      "hero.start": "Get Started",
      "hero.more": "Learn More",
      "hero.activeUsers": "Active Users",
      "hero.payouts": "Payouts",
      "hero.apr": "Potential APR",
      
      "steps.activation": "Activation",
      "steps.activationDesc": "Deposit from 29 USDT (TRC20) - account becomes active.",
      "steps.views": "Views",
      "steps.viewsDesc": "Watch short videos. Every 5 views give up to 5% to your balance.",
      "steps.referrals": "Referrals",
      "steps.referralsDesc": "Build a team of investors - you get 13% / 5% / 1%.",
      
      "video.preview": "Preview",
      
      "footer.copyright": "© 2025 Litcash. All rights reserved."
    },
    "cn": {
      "brand.name": "Litcash",
      "nav.home": "首页",
      "nav.dashboard": "个人中心",
      "nav.deposit": "充值",
      "nav.withdraw": "提现",
      "nav.faq": "常见问题",
      "nav.settings": "设置",
      "nav.login": "登录",
      "nav.register": "注册",
      
      "lang.russian": "俄语",
      "lang.english": "英语",
      "lang.chinese": "中文",
      "lang.spanish": "西班牙语",
      "lang.french": "法语",
      "lang.german": "德语",
      "lang.portuguese": "葡萄牙语",
      "lang.arabic": "阿拉伯语",
      "lang.japanese": "日语",
      "lang.korean": "韩语",
      "lang.turkish": "土耳其语",
      "lang.italian": "意大利语",
      "lang.hindi": "印地语",
      "lang.polish": "波兰语",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "充电并获胜！LITCASH - 值得信赖的收入！",
      "hero.start": "开始",
      "hero.more": "了解更多",
      "hero.activeUsers": "活跃用户",
      "hero.payouts": "支付",
      "hero.apr": "潜在年利率",
      
      "steps.activation": "激活",
      "steps.activationDesc": "从29 USDT (TRC20) 充值 - 账户变为活跃状态。",
      "steps.views": "观看",
      "steps.viewsDesc": "观看短视频。每5次观看可为您的余额增加高达5%。",
      "steps.referrals": "推荐",
      "steps.referralsDesc": "建立投资者团队 - 您将获得13% / 5% / 1%。",
      
      "video.preview": "预览",
      
      "footer.copyright": "© 2025 Litcash。保留所有权利。"
    },
    "es": {
      "brand.name": "Litcash",
      "nav.home": "Inicio",
      "nav.dashboard": "Panel",
      "nav.deposit": "Depósito",
      "nav.withdraw": "Retiro",
      "nav.faq": "FAQ",
      "nav.settings": "Configuración",
      "nav.login": "Iniciar sesión",
      "nav.register": "Registrarse",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "¡Carga y gana! LITCASH - ganancias en las que puedes confiar!",
      "hero.start": "Comenzar",
      "hero.more": "Más información",
      "hero.activeUsers": "Usuarios activos",
      "hero.payouts": "Pagos",
      "hero.apr": "APR potencial",
      
      "steps.activation": "Activación",
      "steps.activationDesc": "Deposita desde 29 USDT (TRC20) - la cuenta se activa.",
      "steps.views": "Vistas",
      "steps.viewsDesc": "Mira videos cortos. Cada 5 vistas dan hasta 5% a tu saldo.",
      "steps.referrals": "Referidos",
      "steps.referralsDesc": "Construye un equipo de inversores - obtienes 13% / 5% / 1%.",
      
      "video.preview": "Vista previa",
      
      "footer.copyright": "© 2025 Litcash. Todos los derechos reservados."
    },
    "fr": {
      "brand.name": "Litcash",
      "nav.home": "Accueil",
      "nav.dashboard": "Tableau de bord",
      "nav.deposit": "Dépôt",
      "nav.withdraw": "Retrait",
      "nav.faq": "FAQ",
      "nav.settings": "Paramètres",
      "nav.login": "Connexion",
      "nav.register": "S'inscrire",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "Chargez et gagnez ! LITCASH - des revenus fiables !",
      "hero.start": "Commencer",
      "hero.more": "En savoir plus",
      "hero.activeUsers": "Utilisateurs actifs",
      "hero.payouts": "Paiements",
      "hero.apr": "APR potentiel",
      
      "steps.activation": "Activation",
      "steps.activationDesc": "Déposez à partir de 29 USDT (TRC20) - le compte devient actif.",
      "steps.views": "Vues",
      "steps.viewsDesc": "Regardez de courtes vidéos. Toutes les 5 vues donnent jusqu'à 5% à votre solde.",
      "steps.referrals": "Parrainage",
      "steps.referralsDesc": "Construisez une équipe d'investisseurs - vous obtenez 13% / 5% / 1%.",
      
      "video.preview": "Aperçu",
      
      "footer.copyright": "© 2025 Litcash. Tous droits réservés."
    },
    "de": {
      "brand.name": "Litcash",
      "nav.home": "Startseite",
      "nav.dashboard": "Dashboard",
      "nav.deposit": "Einzahlung",
      "nav.withdraw": "Auszahlung",
      "nav.faq": "FAQ",
      "nav.settings": "Einstellungen",
      "nav.login": "Anmelden",
      "nav.register": "Registrieren",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "Aufladen und gewinnen! LITCASH - verdienen Sie vertrauensvoll!",
      "hero.start": "Starten",
      "hero.more": "Mehr erfahren",
      "hero.activeUsers": "Aktive Benutzer",
      "hero.payouts": "Auszahlungen",
      "hero.apr": "Potenzielle APR",
      
      "steps.activation": "Aktivierung",
      "steps.activationDesc": "Einzahlung ab 29 USDT (TRC20) - Konto wird aktiv.",
      "steps.views": "Ansichten",
      "steps.viewsDesc": "Sehen Sie kurze Videos. Alle 5 Ansichten geben bis zu 5% auf Ihr Guthaben.",
      "steps.referrals": "Empfehlungen",
      "steps.referralsDesc": "Bauen Sie ein Team von Investoren auf - Sie erhalten 13% / 5% / 1%.",
      
      "video.preview": "Vorschau",
      
      "footer.copyright": "© 2025 Litcash. Alle Rechte vorbehalten."
    },
    "pt": {
      "brand.name": "Litcash",
      "nav.home": "Início",
      "nav.dashboard": "Painel",
      "nav.deposit": "Depósito",
      "nav.withdraw": "Saque",
      "nav.faq": "FAQ",
      "nav.settings": "Configurações",
      "nav.login": "Entrar",
      "nav.register": "Registrar",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "Carregue e ganhe! LITCASH - ganhos confiáveis!",
      "hero.start": "Começar",
      "hero.more": "Saiba mais",
      "hero.activeUsers": "Usuários ativos",
      "hero.payouts": "Pagamentos",
      "hero.apr": "APR potencial",
      
      "steps.activation": "Ativação",
      "steps.activationDesc": "Deposite a partir de 29 USDT (TRC20) - a conta fica ativa.",
      "steps.views": "Visualizações",
      "steps.viewsDesc": "Assista a vídeos curtos. A cada 5 visualizações, você ganha até 5% no seu saldo.",
      "steps.referrals": "Indicações",
      "steps.referralsDesc": "Construa uma equipe de investidores - você ganha 13% / 5% / 1%.",
      
      "video.preview": "Prévia",
      
      "footer.copyright": "© 2025 Litcash. Todos os direitos reservados."
    },
    "ar": {
      "brand.name": "Litcash",
      "nav.home": "الرئيسية",
      "nav.dashboard": "لوحة التحكم",
      "nav.deposit": "إيداع",
      "nav.withdraw": "سحب",
      "nav.faq": "الأسئلة الشائعة",
      "nav.settings": "الإعدادات",
      "nav.login": "تسجيل الدخول",
      "nav.register": "تسجيل",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "اشحن واربح! LITCASH - أرباح يمكنك الوثوق بها!",
      "hero.start": "ابدأ",
      "hero.more": "اعرف المزيد",
      "hero.activeUsers": "المستخدمون النشطون",
      "hero.payouts": "المدفوعات",
      "hero.apr": "نسبة العائد السنوية المحتملة",
      
      "steps.activation": "التفعيل",
      "steps.activationDesc": "قم بالإيداع بدءًا من 29 USDT (TRC20) - يصبح الحساب نشطًا.",
      "steps.views": "المشاهدات",
      "steps.viewsDesc": "شاهد مقاطع فيديو قصيرة. كل 5 مشاهدات تعطي حتى 5% لرصيدك.",
      "steps.referrals": "الإحالات",
      "steps.referralsDesc": "ابنِ فريقًا من المستثمرين - تحصل على 13% / 5% / 1%.",
      
      "video.preview": "معاينة",
      
      "footer.copyright": "© 2025 Litcash. جميع الحقوق محفوظة."
    },
    "ja": {
      "brand.name": "Litcash",
      "nav.home": "ホーム",
      "nav.dashboard": "ダッシュボード",
      "nav.deposit": "入金",
      "nav.withdraw": "出金",
      "nav.faq": "FAQ",
      "nav.settings": "設定",
      "nav.login": "ログイン",
      "nav.register": "登録",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "充電して勝利！LITCASH - 信頼できる収入！",
      "hero.start": "始める",
      "hero.more": "詳細",
      "hero.activeUsers": "アクティブユーザー",
      "hero.payouts": "支払い",
      "hero.apr": "潜在APR",
      
      "steps.activation": "アクティベーション",
      "steps.activationDesc": "29 USDT (TRC20) から入金 - アカウントがアクティブになります。",
      "steps.views": "ビュー",
      "steps.viewsDesc": "短い動画を見る。5回の視聴ごとに残高の最大5%が付与されます。",
      "steps.referrals": "紹介",
      "steps.referralsDesc": "投資家のチームを構築 - 13% / 5% / 1% を獲得。",
      
      "video.preview": "プレビュー",
      
      "footer.copyright": "© 2025 Litcash. 無断複写・転載を禁じます。"
    },
    "ko": {
      "brand.name": "Litcash",
      "nav.home": "홈",
      "nav.dashboard": "대시보드",
      "nav.deposit": "입금",
      "nav.withdraw": "출금",
      "nav.faq": "FAQ",
      "nav.settings": "설정",
      "nav.login": "로그인",
      "nav.register": "등록",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "충전하고 승리하세요! LITCASH - 신뢰할 수 있는 수입!",
      "hero.start": "시작하기",
      "hero.more": "자세히 알아보기",
      "hero.activeUsers": "활성 사용자",
      "hero.payouts": "지급액",
      "hero.apr": "잠재적 APR",
      
      "steps.activation": "활성화",
      "steps.activationDesc": "29 USDT (TRC20) 이상 입금 - 계정이 활성화됩니다.",
      "steps.views": "조회수",
      "steps.viewsDesc": "짧은 동영상을 시청하세요. 5회 시청마다 최대 5%의 잔고가 적립됩니다.",
      "steps.referrals": "추천",
      "steps.referralsDesc": "투자자 팀 구축 - 13% / 5% / 1%를 받습니다.",
      
      "video.preview": "미리보기",
      
      "footer.copyright": "© 2025 Litcash. All rights reserved."
    },
    "tr": {
      "brand.name": "Litcash",
      "nav.home": "Ana Sayfa",
      "nav.dashboard": "Kontrol Paneli",
      "nav.deposit": "Yatırma",
      "nav.withdraw": "Çekme",
      "nav.faq": "SSS",
      "nav.settings": "Ayarlar",
      "nav.login": "Giriş",
      "nav.register": "Kayıt",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "Şarj ol ve kazan! LITCASH - güvenilir kazançlar!",
      "hero.start": "Başla",
      "hero.more": "Daha Fazla Bilgi",
      "hero.activeUsers": "Aktif Kullanıcılar",
      "hero.payouts": "Ödemeler",
      "hero.apr": "Potansiyel APR",
      
      "steps.activation": "Aktivasyon",
      "steps.activationDesc": "29 USDT (TRC20) üzeri yatırın - hesap aktif olur.",
      "steps.views": "Görüntülemeler",
      "steps.viewsDesc": "Kısa videolar izleyin. Her 5 görüntüleme bakiyenize %5'e kadar ekler.",
      "steps.referrals": "Referanslar",
      "steps.referralsDesc": "Yatırımcılardan oluşan bir ekip kurun - %13 / %5 / %1 kazanın.",
      
      "video.preview": "Önizleme",
      
      "footer.copyright": "© 2025 Litcash. Tüm hakları saklıdır."
    },
    "it": {
      "brand.name": "Litcash",
      "nav.home": "Home",
      "nav.dashboard": "Dashboard",
      "nav.deposit": "Deposito",
      "nav.withdraw": "Prelievo",
      "nav.faq": "FAQ",
      "nav.settings": "Impostazioni",
      "nav.login": "Accedi",
      "nav.register": "Registrati",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "Carica e vinci! LITCASH - guadagni affidabili!",
      "hero.start": "Inizia",
      "hero.more": "Scopri di più",
      "hero.activeUsers": "Utenti attivi",
      "hero.payouts": "Pagamenti",
      "hero.apr": "APR potenziale",
      
      "steps.activation": "Attivazione",
      "steps.activationDesc": "Deposita da 29 USDT (TRC20) - l'account diventa attivo.",
      "steps.views": "Visualizzazioni",
      "steps.viewsDesc": "Guarda video brevi. Ogni 5 visualizzazioni danno fino al 5% sul saldo.",
      "steps.referrals": "Referral",
      "steps.referralsDesc": "Costruisci una squadra di investitori - ottieni 13% / 5% / 1%.",
      
      "video.preview": "Anteprima",
      
      "footer.copyright": "© 2025 Litcash. Tutti i diritti riservati."
    },
    "hi": {
      "brand.name": "Litcash",
      "nav.home": "होम",
      "nav.dashboard": "डैशबोर्ड",
      "nav.deposit": "जमा",
      "nav.withdraw": "निकासी",
      "nav.faq": "सामान्य प्रश्न",
      "nav.settings": "सेटिंग्स",
      "nav.login": "लॉग इन",
      "nav.register": "रजिस्टर",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "चार्ज करें और जीतें! LITCASH - भरोसेमंद कमाई!",
      "hero.start": "शुरू करें",
      "hero.more": "अधिक जानें",
      "hero.activeUsers": "सक्रिय उपयोगकर्ता",
      "hero.payouts": "भुगतान",
      "hero.apr": "संभावित APR",
      
      "steps.activation": "एक्टिवेशन",
      "steps.activationDesc": "29 USDT (TRC20) से जमा करें - खाता सक्रिय हो जाता है।",
      "steps.views": "व्यूज",
      "steps.viewsDesc": "छोटे वीडियो देखें। हर 5 व्यूज आपके बैलेंस में 5% तक जोड़ते हैं।",
      "steps.referrals": "रेफरल",
      "steps.referralsDesc": "निवेशकों की एक टीम बनाएं - आपको 13% / 5% / 1% मिलता है।",
      
      "video.preview": "पूर्वावलोकन",
      
      "footer.copyright": "© 2025 Litcash. सर्वाधिकार सुरक्षित।"
    },
    "pl": {
      "brand.name": "Litcash",
      "nav.home": "Strona główna",
      "nav.dashboard": "Panel",
      "nav.deposit": "Wpłata",
      "nav.withdraw": "Wypłata",
      "nav.faq": "FAQ",
      "nav.settings": "Ustawienia",
      "nav.login": "Zaloguj",
      "nav.register": "Zarejestruj",
      
      "hero.badge": "USDT • TRC20 • 13%/5%/1%",
      "hero.title": "Naładuj i wygrywaj! LITCASH - zarobki, którym możesz zaufać!",
      "hero.start": "Rozpocznij",
      "hero.more": "Dowiedz się więcej",
      "hero.activeUsers": "Aktywni użytkownicy",
      "hero.payouts": "Wypłaty",
      "hero.apr": "Potencjalne APR",
      
      "steps.activation": "Aktywacja",
      "steps.activationDesc": "Wpłać od 29 USDT (TRC20) - konto staje się aktywne.",
      "steps.views": "Wyświetlenia",
      "steps.viewsDesc": "Oglądaj krótkie filmy. Co 5 wyświetleń daje do 5% do salda.",
      "steps.referrals": "Polecenia",
      "steps.referralsDesc": "Zbuduj zespół inwestorów - otrzymujesz 13% / 5% / 1%.",
      
      "video.preview": "Podgląd",
      
      "footer.copyright": "© 2025 Litcash. Wszelkie prawa zastrzeżone."
    }
  };

  return {
    // Get translation for key
    t(key){ 
      const L = (localStorage.getItem('lc_lang') || 'ru');
      return (dict[L] && dict[L][key]) || dict['ru'][key] || key; 
    },
    
    // Apply translations to DOM
    apply(root = document){
      const L = (localStorage.getItem('lc_lang') || 'ru');
      
      // Update data-i18n elements
      root.querySelectorAll('[data-i18n]').forEach(el => {
        const k = el.getAttribute('data-i18n'); 
        const v = (dict[L] && dict[L][k]) || dict['ru'][k] || k; 
        if(v != null) el.textContent = v;
      });
      
      // Update data-i18n-attr elements
      root.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const spec = el.getAttribute('data-i18n-attr');
        spec.split(',').forEach(pair => {
          const [attr, k] = pair.split(':').map(s => s.trim());
          const v = (dict[L] && dict[L][k]) || dict['ru'][k] || k; 
          if(attr && v != null) el.setAttribute(attr, v);
        });
      });
      
      // Update HTML lang attribute
      document.documentElement.setAttribute('lang', L);
    },
    
    // Set language and apply
    set(lang){ 
      localStorage.setItem('lc_lang', lang); 
      this.apply(); 
    },
    
    // Get current language
    getLang(){ 
      return localStorage.getItem('lc_lang') || 'ru'; 
    }
  };
})();

// Auto-apply translations when DOM is ready
if (document.readyState !== 'loading') {
  LC_I18N.apply();
} else {
  document.addEventListener('DOMContentLoaded', function() {
    LC_I18N.apply();
  });
}

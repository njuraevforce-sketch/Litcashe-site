// Advanced i18n with 14 languages support
window.LC_I18N = (function(){
  const dict = {
    "ru": {
      // Бренд и навигация
      "brand_name": "Litcash",
      "nav_home": "Главная",
      "nav_dashboard": "Личный кабинет",
      "nav_deposit": "Пополнение",
      "nav_withdraw": "Вывод",
      "nav_faq": "FAQ",
      "nav_settings": "Настройки",
      "nav_login": "Вход",
      "nav_register": "Регистрация",
      
      // Hero секция
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "Заряжайся и побеждай! LITCASH-заработок, которому доверяют!",
      "hero_start": "Начать",
      "hero_more": "Подробнее",
      "hero_activeUsers": "Активные пользователи",
      "hero_payouts": "Выплаты",
      "hero_apr": "Потенциальный APR",
      
      // Шаги работы
      "steps_activation": "Активация",
      "steps_activationDesc": "Пополняешь от 29 USDT (TRC20) — аккаунт становится активным.",
      "steps_views": "Просмотры",
      "steps_viewsDesc": "Смотри короткие ролики. Каждые 5 просмотров дают до 5% к балансу.",
      "steps_referrals": "Рефералы",
      "steps_referralsDesc": "Создай команду инвесторов — ты получаешь 13% / 5% / 1%.",
      
      // Видео
      "video_preview": "Превью",
      
      // Футер
      "footer_copyright": "© 2025 Litcash. Все права защищены."
    },
    "en": {
      "brand_name": "Litcash",
      "nav_home": "Home",
      "nav_dashboard": "Dashboard",
      "nav_deposit": "Deposit",
      "nav_withdraw": "Withdraw",
      "nav_faq": "FAQ",
      "nav_settings": "Settings",
      "nav_login": "Login",
      "nav_register": "Register",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "Charge up and win! LITCASH - earnings you can trust!",
      "hero_start": "Get Started",
      "hero_more": "Learn More",
      "hero_activeUsers": "Active Users",
      "hero_payouts": "Payouts",
      "hero_apr": "Potential APR",
      
      "steps_activation": "Activation",
      "steps_activationDesc": "Deposit from 29 USDT (TRC20) - account becomes active.",
      "steps_views": "Views",
      "steps_viewsDesc": "Watch short videos. Every 5 views give up to 5% to your balance.",
      "steps_referrals": "Referrals",
      "steps_referralsDesc": "Build a team of investors - you get 13% / 5% / 1%.",
      
      "video_preview": "Preview",
      
      "footer_copyright": "© 2025 Litcash. All rights reserved."
    },
    "cn": {
      "brand_name": "Litcash",
      "nav_home": "首页",
      "nav_dashboard": "个人中心",
      "nav_deposit": "充值",
      "nav_withdraw": "提现",
      "nav_faq": "常见问题",
      "nav_settings": "设置",
      "nav_login": "登录",
      "nav_register": "注册",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "充电并获胜！LITCASH - 值得信赖的收入！",
      "hero_start": "开始",
      "hero_more": "了解更多",
      "hero_activeUsers": "活跃用户",
      "hero_payouts": "支付",
      "hero_apr": "潜在年利率",
      
      "steps_activation": "激活",
      "steps_activationDesc": "从29 USDT (TRC20) 充值 - 账户变为活跃状态。",
      "steps_views": "观看",
      "steps_viewsDesc": "观看短视频。每5次观看可为您的余额增加高达5%。",
      "steps_referrals": "推荐",
      "steps_referralsDesc": "建立投资者团队 - 您将获得13% / 5% / 1%。",
      
      "video_preview": "预览",
      
      "footer_copyright": "© 2025 Litcash。保留所有权利。"
    },
    "es": {
      "brand_name": "Litcash",
      "nav_home": "Inicio",
      "nav_dashboard": "Panel",
      "nav_deposit": "Depósito",
      "nav_withdraw": "Retiro",
      "nav_faq": "FAQ",
      "nav_settings": "Configuración",
      "nav_login": "Iniciar sesión",
      "nav_register": "Registrarse",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "¡Carga y gana! LITCASH - ganancias en las que puedes confiar!",
      "hero_start": "Comenzar",
      "hero_more": "Más información",
      "hero_activeUsers": "Usuarios activos",
      "hero_payouts": "Pagos",
      "hero_apr": "APR potencial",
      
      "steps_activation": "Activación",
      "steps_activationDesc": "Deposita desde 29 USDT (TRC20) - la cuenta se activa.",
      "steps_views": "Vistas",
      "steps_viewsDesc": "Mira videos cortos. Cada 5 vistas dan hasta 5% a tu saldo.",
      "steps_referrals": "Referidos",
      "steps_referralsDesc": "Construye un equipo de inversores - obtienes 13% / 5% / 1%.",
      
      "video_preview": "Vista previa",
      
      "footer_copyright": "© 2025 Litcash. Todos los derechos reservados."
    },
    "fr": {
      "brand_name": "Litcash",
      "nav_home": "Accueil",
      "nav_dashboard": "Tableau de bord",
      "nav_deposit": "Dépôt",
      "nav_withdraw": "Retrait",
      "nav_faq": "FAQ",
      "nav_settings": "Paramètres",
      "nav_login": "Connexion",
      "nav_register": "S'inscrire",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "Chargez et gagnez ! LITCASH - des revenus fiables !",
      "hero_start": "Commencer",
      "hero_more": "En savoir plus",
      "hero_activeUsers": "Utilisateurs actifs",
      "hero_payouts": "Paiements",
      "hero_apr": "APR potentiel",
      
      "steps_activation": "Activation",
      "steps_activationDesc": "Déposez à partir de 29 USDT (TRC20) - le compte devient actif.",
      "steps_views": "Vues",
      "steps_viewsDesc": "Regardez de courtes vidéos. Toutes les 5 vues donnent jusqu'à 5% à votre solde.",
      "steps_referrals": "Parrainage",
      "steps_referralsDesc": "Construisez une équipe d'investisseurs - vous obtenez 13% / 5% / 1%.",
      
      "video_preview": "Aperçu",
      
      "footer_copyright": "© 2025 Litcash. Tous droits réservés."
    },
    "de": {
      "brand_name": "Litcash",
      "nav_home": "Startseite",
      "nav_dashboard": "Dashboard",
      "nav_deposit": "Einzahlung",
      "nav_withdraw": "Auszahlung",
      "nav_faq": "FAQ",
      "nav_settings": "Einstellungen",
      "nav_login": "Anmelden",
      "nav_register": "Registrieren",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "Aufladen und gewinnen! LITCASH - verdienen Sie vertrauensvoll!",
      "hero_start": "Starten",
      "hero_more": "Mehr erfahren",
      "hero_activeUsers": "Aktive Benutzer",
      "hero_payouts": "Auszahlungen",
      "hero_apr": "Potenzielle APR",
      
      "steps_activation": "Aktivierung",
      "steps_activationDesc": "Einzahlung ab 29 USDT (TRC20) - Konto wird aktiv.",
      "steps_views": "Ansichten",
      "steps_viewsDesc": "Sehen Sie kurze Videos. Alle 5 Ansichten geben bis zu 5% auf Ihr Guthaben.",
      "steps_referrals": "Empfehlungen",
      "steps_referralsDesc": "Bauen Sie ein Team von Investoren auf - Sie erhalten 13% / 5% / 1%.",
      
      "video_preview": "Vorschau",
      
      "footer_copyright": "© 2025 Litcash. Alle Rechte vorbehalten."
    },
    "pt": {
      "brand_name": "Litcash",
      "nav_home": "Início",
      "nav_dashboard": "Painel",
      "nav_deposit": "Depósito",
      "nav_withdraw": "Saque",
      "nav_faq": "FAQ",
      "nav_settings": "Configurações",
      "nav_login": "Entrar",
      "nav_register": "Registrar",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "Carregue e ganhe! LITCASH - ganhos confiáveis!",
      "hero_start": "Começar",
      "hero_more": "Saiba mais",
      "hero_activeUsers": "Usuários ativos",
      "hero_payouts": "Pagamentos",
      "hero_apr": "APR potencial",
      
      "steps_activation": "Ativação",
      "steps_activationDesc": "Deposite a partir de 29 USDT (TRC20) - a conta fica ativa.",
      "steps_views": "Visualizações",
      "steps_viewsDesc": "Assista a vídeos curtos. A cada 5 visualizações, você ganha até 5% no seu saldo.",
      "steps_referrals": "Indicações",
      "steps_referralsDesc": "Construa uma equipe de investidores - você ganha 13% / 5% / 1%.",
      
      "video_preview": "Prévia",
      
      "footer_copyright": "© 2025 Litcash. Todos os direitos reservados."
    },
    "ar": {
      "brand_name": "Litcash",
      "nav_home": "الرئيسية",
      "nav_dashboard": "لوحة التحكم",
      "nav_deposit": "إيداع",
      "nav_withdraw": "سحب",
      "nav_faq": "الأسئلة الشائعة",
      "nav_settings": "الإعدادات",
      "nav_login": "تسجيل الدخول",
      "nav_register": "تسجيل",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "اشحن واربح! LITCASH - أرباح يمكنك الوثوق بها!",
      "hero_start": "ابدأ",
      "hero_more": "اعرف المزيد",
      "hero_activeUsers": "المستخدمون النشطون",
      "hero_payouts": "المدفوعات",
      "hero_apr": "نسبة العائد السنوية المحتملة",
      
      "steps_activation": "التفعيل",
      "steps_activationDesc": "قم بالإيداع بدءًا من 29 USDT (TRC20) - يصبح الحساب نشطًا.",
      "steps_views": "المشاهدات",
      "steps_viewsDesc": "شاهد مقاطع فيديو قصيرة. كل 5 مشاهدات تعطي حتى 5% لرصيدك.",
      "steps_referrals": "الإحالات",
      "steps_referralsDesc": "ابنِ فريقًا من المستثمرين - تحصل على 13% / 5% / 1%.",
      
      "video_preview": "معاينة",
      
      "footer_copyright": "© 2025 Litcash. جميع الحقوق محفوظة."
    },
    "ja": {
      "brand_name": "Litcash",
      "nav_home": "ホーム",
      "nav_dashboard": "ダッシュボード",
      "nav_deposit": "入金",
      "nav_withdraw": "出金",
      "nav_faq": "FAQ",
      "nav_settings": "設定",
      "nav_login": "ログイン",
      "nav_register": "登録",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "充電して勝利！LITCASH - 信頼できる収入！",
      "hero_start": "始める",
      "hero_more": "詳細",
      "hero_activeUsers": "アクティブユーザー",
      "hero_payouts": "支払い",
      "hero_apr": "潜在APR",
      
      "steps_activation": "アクティベーション",
      "steps_activationDesc": "29 USDT (TRC20) から入金 - アカウントがアクティブになります。",
      "steps_views": "ビュー",
      "steps_viewsDesc": "短い動画を見る。5回の視聴ごとに残高の最大5%が付与されます。",
      "steps_referrals": "紹介",
      "steps_referralsDesc": "投資家のチームを構築 - 13% / 5% / 1% を獲得。",
      
      "video_preview": "プレビュー",
      
      "footer_copyright": "© 2025 Litcash. 無断複写・転載を禁じます。"
    },
    "ko": {
      "brand_name": "Litcash",
      "nav_home": "홈",
      "nav_dashboard": "대시보드",
      "nav_deposit": "입금",
      "nav_withdraw": "출금",
      "nav_faq": "FAQ",
      "nav_settings": "설정",
      "nav_login": "로그인",
      "nav_register": "등록",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "충전하고 승리하세요! LITCASH - 신뢰할 수 있는 수입!",
      "hero_start": "시작하기",
      "hero_more": "자세히 알아보기",
      "hero_activeUsers": "활성 사용자",
      "hero_payouts": "지급액",
      "hero_apr": "잠재적 APR",
      
      "steps_activation": "활성화",
      "steps_activationDesc": "29 USDT (TRC20) 이상 입금 - 계정이 활성화됩니다.",
      "steps_views": "조회수",
      "steps_viewsDesc": "짧은 동영상을 시청하세요. 5회 시청마다 최대 5%의 잔고가 적립됩니다.",
      "steps_referrals": "추천",
      "steps_referralsDesc": "투자자 팀 구축 - 13% / 5% / 1%를 받습니다.",
      
      "video_preview": "미리보기",
      
      "footer_copyright": "© 2025 Litcash. All rights reserved."
    },
    "tr": {
      "brand_name": "Litcash",
      "nav_home": "Ana Sayfa",
      "nav_dashboard": "Kontrol Paneli",
      "nav_deposit": "Yatırma",
      "nav_withdraw": "Çekme",
      "nav_faq": "SSS",
      "nav_settings": "Ayarlar",
      "nav_login": "Giriş",
      "nav_register": "Kayıt",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "Şarj ol ve kazan! LITCASH - güvenilir kazançlar!",
      "hero_start": "Başla",
      "hero_more": "Daha Fazla Bilgi",
      "hero_activeUsers": "Aktif Kullanıcılar",
      "hero_payouts": "Ödemeler",
      "hero_apr": "Potansiyel APR",
      
      "steps_activation": "Aktivasyon",
      "steps_activationDesc": "29 USDT (TRC20) üzeri yatırın - hesap aktif olur.",
      "steps_views": "Görüntülemeler",
      "steps_viewsDesc": "Kısa videolar izleyin. Her 5 görüntüleme bakiyenize %5'e kadar ekler.",
      "steps_referrals": "Referanslar",
      "steps_referralsDesc": "Yatırımcılardan oluşan bir ekip kurun - %13 / %5 / %1 kazanın.",
      
      "video_preview": "Önizleme",
      
      "footer_copyright": "© 2025 Litcash. Tüm hakları saklıdır."
    },
    "it": {
      "brand_name": "Litcash",
      "nav_home": "Home",
      "nav_dashboard": "Dashboard",
      "nav_deposit": "Deposito",
      "nav_withdraw": "Prelievo",
      "nav_faq": "FAQ",
      "nav_settings": "Impostazioni",
      "nav_login": "Accedi",
      "nav_register": "Registrati",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "Carica e vinci! LITCASH - guadagni affidabili!",
      "hero_start": "Inizia",
      "hero_more": "Scopri di più",
      "hero_activeUsers": "Utenti attivi",
      "hero_payouts": "Pagamenti",
      "hero_apr": "APR potenziale",
      
      "steps_activation": "Attivazione",
      "steps_activationDesc": "Deposita da 29 USDT (TRC20) - l'account diventa attivo.",
      "steps_views": "Visualizzazioni",
      "steps_viewsDesc": "Guarda video brevi. Ogni 5 visualizzazioni danno fino al 5% sul saldo.",
      "steps_referrals": "Referral",
      "steps_referralsDesc": "Costruisci una squadra di investitori - ottieni 13% / 5% / 1%.",
      
      "video_preview": "Anteprima",
      
      "footer_copyright": "© 2025 Litcash. Tutti i diritti riservati."
    },
    "hi": {
      "brand_name": "Litcash",
      "nav_home": "होम",
      "nav_dashboard": "डैशबोर्ड",
      "nav_deposit": "जमा",
      "nav_withdraw": "निकासी",
      "nav_faq": "सामान्य प्रश्न",
      "nav_settings": "सेटिंग्स",
      "nav_login": "लॉग इन",
      "nav_register": "रजिस्टर",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "चार्ज करें और जीतें! LITCASH - भरोसेमंद कमाई!",
      "hero_start": "शुरू करें",
      "hero_more": "अधिक जानें",
      "hero_activeUsers": "सक्रिय उपयोगकर्ता",
      "hero_payouts": "भुगतान",
      "hero_apr": "संभावित APR",
      
      "steps_activation": "एक्टिवेशन",
      "steps_activationDesc": "29 USDT (TRC20) से जमा करें - खाता सक्रिय हो जाता है।",
      "steps_views": "व्यूज",
      "steps_viewsDesc": "छोटे वीडियो देखें। हर 5 व्यूज आपके बैलेंस में 5% तक जोड़ते हैं।",
      "steps_referrals": "रेफरल",
      "steps_referralsDesc": "निवेशकों की एक टीम बनाएं - आपको 13% / 5% / 1% मिलता है।",
      
      "video_preview": "पूर्वावलोकन",
      
      "footer_copyright": "© 2025 Litcash. सर्वाधिकार सुरक्षित।"
    },
    "pl": {
      "brand_name": "Litcash",
      "nav_home": "Strona główna",
      "nav_dashboard": "Panel",
      "nav_deposit": "Wpłata",
      "nav_withdraw": "Wypłata",
      "nav_faq": "FAQ",
      "nav_settings": "Ustawienia",
      "nav_login": "Zaloguj",
      "nav_register": "Zarejestruj",
      
      "hero_badge": "USDT • TRC20 • 13%/5%/1%",
      "hero_title": "Naładuj i wygrywaj! LITCASH - zarobki, którym możesz zaufać!",
      "hero_start": "Rozpocznij",
      "hero_more": "Dowiedz się więcej",
      "hero_activeUsers": "Aktywni użytkownicy",
      "hero_payouts": "Wypłaty",
      "hero_apr": "Potencjalne APR",
      
      "steps_activation": "Aktywacja",
      "steps_activationDesc": "Wpłać od 29 USDT (TRC20) - konto staje się aktywne.",
      "steps_views": "Wyświetlenia",
      "steps_viewsDesc": "Oglądaj krótkie filmy. Co 5 wyświetleń daje do 5% do salda.",
      "steps_referrals": "Polecenia",
      "steps_referralsDesc": "Zbuduj zespół inwestorów - otrzymujesz 13% / 5% / 1%.",
      
      "video_preview": "Podgląd",
      
      "footer_copyright": "© 2025 Litcash. Wszelkie prawa zastrzeżone."
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

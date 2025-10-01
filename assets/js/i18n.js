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
      "nav_logout": "Выйти",
      
      // Заголовки страниц
      "page_title_dashboard": "Кабинет — Litcash",
      
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
      "video_not_supported": "Ваш браузер не поддерживает видео тег.",
      "video_limit_reached": "Лимит просмотров исчерпан",
      
      // Дашборд - статистика
      "dashboard_balance": "Баланс",
      "dashboard_views": "Просмотры",
      "dashboard_level": "Уровень",
      "dashboard_rate": "Ставка",
      "dashboard_capital": "Капитал (расч.)",
      "dashboard_referrals": "Рефералы",
      "dashboard_per_view": "+$0.00 за просмотр",
      
      // Дашборд - видео блок
      "dashboard_video_view": "Просмотр видео",
      "dashboard_progress": "Прогресс: 0%",
      "dashboard_earn_by_view": "🎬 Заработать за просмотр",
      "dashboard_deposit": "💳 Пополнить",
      
      // Дашборд - реферальная система
      "dashboard_referral_panel": "Реферальная панель",
      "dashboard_copy": "📋 Копировать",
      "dashboard_gen1": "1 поколение",
      "dashboard_gen2": "2 поколение",
      "dashboard_gen3": "3 поколение",
      "dashboard_generation": "Поколение",
      "dashboard_email": "Email",
      "dashboard_date": "Дата",
      "dashboard_source": "Источник",
      
      // Дашборд - информационная таблица
      "dashboard_info_table": "Информационная таблица",
      "dashboard_indicator": "Показатель",
      "dashboard_value": "Значение",
      "dashboard_comment": "Комментарий",
      "dashboard_levels_list": "Starter / Advanced / Pro Elite / Titanium",
      "dashboard_percentage": "Процент",
      "dashboard_percentage_desc": "Начисляется от базового капитала уровня",
      "dashboard_base": "База уровня",
      "dashboard_base_desc": "min(капитал, потолок уровня)",
      "dashboard_per_view_desc": "5 просмотров = полный дневной %",
      "dashboard_daily_reward": "За 5 просмотров (сегодня)",
      "dashboard_daily_reward_desc": "Сумма за сутки по уровню",
      "dashboard_next_level_goal": "Цель следующего уровня",
      
      // Дашборд - реферальный доход
      "dashboard_referral_income": "Реферальный доход",
      "dashboard_amount": "Сумма",
      "dashboard_gen1_with_percent": "1-е поколение (13%)",
      "dashboard_gen2_with_percent": "2-е поколение (5%)",
      "dashboard_gen3_with_percent": "3-е поколение (1%)",
      "dashboard_total": "Итого",
      "dashboard_recent_referral_earnings": "Последние реферальные начисления",
      
      // Общие
      "no_data": "Нет данных",
      
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
      "nav_logout": "Logout",
      
      "page_title_dashboard": "Dashboard — Litcash",
      
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
      "video_not_supported": "Your browser does not support the video tag.",
      "video_limit_reached": "View limit reached",
      
      "dashboard_balance": "Balance",
      "dashboard_views": "Views",
      "dashboard_level": "Level",
      "dashboard_rate": "Rate",
      "dashboard_capital": "Capital (est.)",
      "dashboard_referrals": "Referrals",
      "dashboard_per_view": "+$0.00 per view",
      
      "dashboard_video_view": "Video Viewing",
      "dashboard_progress": "Progress: 0%",
      "dashboard_earn_by_view": "🎬 Earn by Viewing",
      "dashboard_deposit": "💳 Deposit",
      
      "dashboard_referral_panel": "Referral Panel",
      "dashboard_copy": "📋 Copy",
      "dashboard_gen1": "1st Generation",
      "dashboard_gen2": "2nd Generation",
      "dashboard_gen3": "3rd Generation",
      "dashboard_generation": "Generation",
      "dashboard_email": "Email",
      "dashboard_date": "Date",
      "dashboard_source": "Source",
      
      "dashboard_info_table": "Information Table",
      "dashboard_indicator": "Indicator",
      "dashboard_value": "Value",
      "dashboard_comment": "Comment",
      "dashboard_levels_list": "Starter / Advanced / Pro Elite / Titanium",
      "dashboard_percentage": "Percentage",
      "dashboard_percentage_desc": "Accrued from the base capital of the level",
      "dashboard_base": "Level Base",
      "dashboard_base_desc": "min(capital, level ceiling)",
      "dashboard_per_view_desc": "5 views = full daily %",
      "dashboard_daily_reward": "For 5 Views (Today)",
      "dashboard_daily_reward_desc": "Amount per day by level",
      "dashboard_next_level_goal": "Next Level Goal",
      
      "dashboard_referral_income": "Referral Income",
      "dashboard_amount": "Amount",
      "dashboard_gen1_with_percent": "1st Generation (13%)",
      "dashboard_gen2_with_percent": "2nd Generation (5%)",
      "dashboard_gen3_with_percent": "3rd Generation (1%)",
      "dashboard_total": "Total",
      "dashboard_recent_referral_earnings": "Recent Referral Earnings",
      
      "no_data": "No data",
      
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
      "nav_logout": "退出",
      
      "page_title_dashboard": "个人中心 — Litcash",
      
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
      "video_not_supported": "您的浏览器不支持视频标签。",
      "video_limit_reached": "观看次数已达上限",
      
      "dashboard_balance": "余额",
      "dashboard_views": "观看次数",
      "dashboard_level": "等级",
      "dashboard_rate": "利率",
      "dashboard_capital": "资本(估算)",
      "dashboard_referrals": "推荐",
      "dashboard_per_view": "+$0.00 每次观看",
      
      "dashboard_video_view": "视频观看",
      "dashboard_progress": "进度: 0%",
      "dashboard_earn_by_view": "🎬 通过观看赚钱",
      "dashboard_deposit": "💳 充值",
      
      "dashboard_referral_panel": "推荐面板",
      "dashboard_copy": "📋 复制",
      "dashboard_gen1": "第一代",
      "dashboard_gen2": "第二代",
      "dashboard_gen3": "第三代",
      "dashboard_generation": "代",
      "dashboard_email": "邮箱",
      "dashboard_date": "日期",
      "dashboard_source": "来源",
      
      "dashboard_info_table": "信息表格",
      "dashboard_indicator": "指标",
      "dashboard_value": "数值",
      "dashboard_comment": "说明",
      "dashboard_levels_list": "初级 / 高级 / 专业精英 / 钛金",
      "dashboard_percentage": "百分比",
      "dashboard_percentage_desc": "根据等级基础资本计算",
      "dashboard_base": "等级基础",
      "dashboard_base_desc": "最小值(资本, 等级上限)",
      "dashboard_per_view_desc": "5次观看 = 完整日百分比",
      "dashboard_daily_reward": "5次观看(今日)",
      "dashboard_daily_reward_desc": "按等级计算的每日金额",
      "dashboard_next_level_goal": "下一等级目标",
      
      "dashboard_referral_income": "推荐收入",
      "dashboard_amount": "金额",
      "dashboard_gen1_with_percent": "第一代 (13%)",
      "dashboard_gen2_with_percent": "第二代 (5%)",
      "dashboard_gen3_with_percent": "第三代 (1%)",
      "dashboard_total": "总计",
      "dashboard_recent_referral_earnings": "最近推荐收入",
      
      "no_data": "无数据",
      
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
      "nav_logout": "Cerrar sesión",
      
      "page_title_dashboard": "Panel — Litcash",
      
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
      "video_not_supported": "Tu navegador no soporta la etiqueta de video.",
      "video_limit_reached": "Límite de vistas alcanzado",
      
      "dashboard_balance": "Saldo",
      "dashboard_views": "Vistas",
      "dashboard_level": "Nivel",
      "dashboard_rate": "Tasa",
      "dashboard_capital": "Capital (est.)",
      "dashboard_referrals": "Referidos",
      "dashboard_per_view": "+$0.00 por vista",
      
      "dashboard_video_view": "Visualización de Video",
      "dashboard_progress": "Progreso: 0%",
      "dashboard_earn_by_view": "🎬 Ganar por Ver",
      "dashboard_deposit": "💳 Depositar",
      
      "dashboard_referral_panel": "Panel de Referidos",
      "dashboard_copy": "📋 Copiar",
      "dashboard_gen1": "1ra Generación",
      "dashboard_gen2": "2da Generación",
      "dashboard_gen3": "3ra Generación",
      "dashboard_generation": "Generación",
      "dashboard_email": "Email",
      "dashboard_date": "Fecha",
      "dashboard_source": "Fuente",
      
      "dashboard_info_table": "Tabla de Información",
      "dashboard_indicator": "Indicador",
      "dashboard_value": "Valor",
      "dashboard_comment": "Comentario",
      "dashboard_levels_list": "Principiante / Avanzado / Élite Pro / Titanio",
      "dashboard_percentage": "Porcentaje",
      "dashboard_percentage_desc": "Devengado del capital base del nivel",
      "dashboard_base": "Base del Nivel",
      "dashboard_base_desc": "min(capital, tope del nivel)",
      "dashboard_per_view_desc": "5 vistas = % diario completo",
      "dashboard_daily_reward": "Por 5 Vistas (Hoy)",
      "dashboard_daily_reward_desc": "Cantidad por día por nivel",
      "dashboard_next_level_goal": "Objetivo del Siguiente Nivel",
      
      "dashboard_referral_income": "Ingreso por Referidos",
      "dashboard_amount": "Cantidad",
      "dashboard_gen1_with_percent": "1ra Generación (13%)",
      "dashboard_gen2_with_percent": "2da Generación (5%)",
      "dashboard_gen3_with_percent": "3ra Generación (1%)",
      "dashboard_total": "Total",
      "dashboard_recent_referral_earnings": "Ganancias Recientes por Referidos",
      
      "no_data": "Sin datos",
      
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
      "nav_logout": "Déconnexion",
      
      "page_title_dashboard": "Tableau de bord — Litcash",
      
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
      "video_not_supported": "Votre navigateur ne supporte pas la balise vidéo.",
      "video_limit_reached": "Limite de vues atteinte",
      
      "dashboard_balance": "Solde",
      "dashboard_views": "Vues",
      "dashboard_level": "Niveau",
      "dashboard_rate": "Taux",
      "dashboard_capital": "Capital (est.)",
      "dashboard_referrals": "Parrainages",
      "dashboard_per_view": "+$0.00 par vue",
      
      "dashboard_video_view": "Visionnage Vidéo",
      "dashboard_progress": "Progression: 0%",
      "dashboard_earn_by_view": "🎬 Gagner en Regardant",
      "dashboard_deposit": "💳 Déposer",
      
      "dashboard_referral_panel": "Panel de Parrainage",
      "dashboard_copy": "📋 Copier",
      "dashboard_gen1": "1ère Génération",
      "dashboard_gen2": "2ème Génération",
      "dashboard_gen3": "3ème Génération",
      "dashboard_generation": "Génération",
      "dashboard_email": "Email",
      "dashboard_date": "Date",
      "dashboard_source": "Source",
      
      "dashboard_info_table": "Tableau d'Information",
      "dashboard_indicator": "Indicateur",
      "dashboard_value": "Valeur",
      "dashboard_comment": "Commentaire",
      "dashboard_levels_list": "Débutant / Avancé / Élite Pro / Titane",
      "dashboard_percentage": "Pourcentage",
      "dashboard_percentage_desc": "Calculé sur le capital de base du niveau",
      "dashboard_base": "Base du Niveau",
      "dashboard_base_desc": "min(capital, plafond du niveau)",
      "dashboard_per_view_desc": "5 vues = % journalier complet",
      "dashboard_daily_reward": "Pour 5 Vues (Aujourd'hui)",
      "dashboard_daily_reward_desc": "Montant par jour par niveau",
      "dashboard_next_level_goal": "Objectif du Niveau Suivant",
      
      "dashboard_referral_income": "Revenu de Parrainage",
      "dashboard_amount": "Montant",
      "dashboard_gen1_with_percent": "1ère Génération (13%)",
      "dashboard_gen2_with_percent": "2ème Génération (5%)",
      "dashboard_gen3_with_percent": "3ème Génération (1%)",
      "dashboard_total": "Total",
      "dashboard_recent_referral_earnings": "Gains Récents de Parrainage",
      
      "no_data": "Aucune donnée",
      
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
      "nav_logout": "Abmelden",
      
      "page_title_dashboard": "Dashboard — Litcash",
      
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
      "video_not_supported": "Ihr Browser unterstützt das Video-Tag nicht.",
      "video_limit_reached": "Ansichtslimit erreicht",
      
      "dashboard_balance": "Guthaben",
      "dashboard_views": "Ansichten",
      "dashboard_level": "Level",
      "dashboard_rate": "Satz",
      "dashboard_capital": "Kapital (geschätzt)",
      "dashboard_referrals": "Empfehlungen",
      "dashboard_per_view": "+$0.00 pro Ansicht",
      
      "dashboard_video_view": "Video-Anzeige",
      "dashboard_progress": "Fortschritt: 0%",
      "dashboard_earn_by_view": "🎬 Durch Ansehen verdienen",
      "dashboard_deposit": "💳 Einzahlen",
      
      "dashboard_referral_panel": "Empfehlungs-Panel",
      "dashboard_copy": "📋 Kopieren",
      "dashboard_gen1": "1. Generation",
      "dashboard_gen2": "2. Generation",
      "dashboard_gen3": "3. Generation",
      "dashboard_generation": "Generation",
      "dashboard_email": "E-Mail",
      "dashboard_date": "Datum",
      "dashboard_source": "Quelle",
      
      "dashboard_info_table": "Informationstabelle",
      "dashboard_indicator": "Indikator",
      "dashboard_value": "Wert",
      "dashboard_comment": "Kommentar",
      "dashboard_levels_list": "Starter / Fortgeschritten / Pro Elite / Titanium",
      "dashboard_percentage": "Prozentsatz",
      "dashboard_percentage_desc": "Berechnet vom Grundkapital des Levels",
      "dashboard_base": "Level-Basis",
      "dashboard_base_desc": "min(Kapital, Level-Obergrenze)",
      "dashboard_per_view_desc": "5 Ansichten = voller Tagesprozentsatz",
      "dashboard_daily_reward": "Für 5 Ansichten (Heute)",
      "dashboard_daily_reward_desc": "Betrag pro Tag nach Level",
      "dashboard_next_level_goal": "Nächstes Level-Ziel",
      
      "dashboard_referral_income": "Empfehlungseinkommen",
      "dashboard_amount": "Betrag",
      "dashboard_gen1_with_percent": "1. Generation (13%)",
      "dashboard_gen2_with_percent": "2. Generation (5%)",
      "dashboard_gen3_with_percent": "3. Generation (1%)",
      "dashboard_total": "Gesamt",
      "dashboard_recent_referral_earnings": "Aktuelle Empfehlungseinnahmen",
      
      "no_data": "Keine Daten",
      
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
      "nav_logout": "Sair",
      
      "page_title_dashboard": "Painel — Litcash",
      
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
      "video_not_supported": "Seu navegador não suporta a tag de vídeo.",
      "video_limit_reached": "Limite de visualizações atingido",
      
      "dashboard_balance": "Saldo",
      "dashboard_views": "Visualizações",
      "dashboard_level": "Nível",
      "dashboard_rate": "Taxa",
      "dashboard_capital": "Capital (est.)",
      "dashboard_referrals": "Indicações",
      "dashboard_per_view": "+$0.00 por visualização",
      
      "dashboard_video_view": "Visualização de Vídeo",
      "dashboard_progress": "Progresso: 0%",
      "dashboard_earn_by_view": "🎬 Ganhar por Visualizar",
      "dashboard_deposit": "💳 Depositar",
      
      "dashboard_referral_panel": "Painel de Indicações",
      "dashboard_copy": "📋 Copiar",
      "dashboard_gen1": "1ª Geração",
      "dashboard_gen2": "2ª Geração",
      "dashboard_gen3": "3ª Geração",
      "dashboard_generation": "Geração",
      "dashboard_email": "Email",
      "dashboard_date": "Data",
      "dashboard_source": "Fonte",
      
      "dashboard_info_table": "Tabela de Informações",
      "dashboard_indicator": "Indicador",
      "dashboard_value": "Valor",
      "dashboard_comment": "Comentário",
      "dashboard_levels_list": "Iniciante / Avançado / Pro Elite / Titânio",
      "dashboard_percentage": "Porcentagem",
      "dashboard_percentage_desc": "Acumulado do capital base do nível",
      "dashboard_base": "Base do Nível",
      "dashboard_base_desc": "min(capital, teto do nível)",
      "dashboard_per_view_desc": "5 visualizações = % diário completo",
      "dashboard_daily_reward": "Por 5 Visualizações (Hoje)",
      "dashboard_daily_reward_desc": "Valor por dia por nível",
      "dashboard_next_level_goal": "Objetivo do Próximo Nível",
      
      "dashboard_referral_income": "Renda de Indicações",
      "dashboard_amount": "Quantidade",
      "dashboard_gen1_with_percent": "1ª Geração (13%)",
      "dashboard_gen2_with_percent": "2ª Geração (5%)",
      "dashboard_gen3_with_percent": "3ª Geração (1%)",
      "dashboard_total": "Total",
      "dashboard_recent_referral_earnings": "Ganhos Recentes de Indicações",
      
      "no_data": "Sem dados",
      
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
      "nav_logout": "تسجيل الخروج",
      
      "page_title_dashboard": "لوحة التحكم — Litcash",
      
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
      "video_not_supported": "متصفحك لا يدعم علامة الفيديو.",
      "video_limit_reached": "تم الوصول إلى حد المشاهدة",
      
      "dashboard_balance": "الرصيد",
      "dashboard_views": "المشاهدات",
      "dashboard_level": "المستوى",
      "dashboard_rate": "المعدل",
      "dashboard_capital": "رأس المال (تقديري)",
      "dashboard_referrals": "الإحالات",
      "dashboard_per_view": "+$0.00 للمشاهدة",
      
      "dashboard_video_view": "مشاهدة الفيديو",
      "dashboard_progress": "التقدم: 0%",
      "dashboard_earn_by_view": "🎬 اربح بالمشاهدة",
      "dashboard_deposit": "💳 إيداع",
      
      "dashboard_referral_panel": "لوحة الإحالات",
      "dashboard_copy": "📋 نسخ",
      "dashboard_gen1": "الجيل الأول",
      "dashboard_gen2": "الجيل الثاني",
      "dashboard_gen3": "الجيل الثالث",
      "dashboard_generation": "الجيل",
      "dashboard_email": "البريد الإلكتروني",
      "dashboard_date": "التاريخ",
      "dashboard_source": "المصدر",
      
      "dashboard_info_table": "جدول المعلومات",
      "dashboard_indicator": "المؤشر",
      "dashboard_value": "القيمة",
      "dashboard_comment": "تعليق",
      "dashboard_levels_list": "مبتدئ / متقدم / النخبة المحترفة / التيتانيوم",
      "dashboard_percentage": "النسبة المئوية",
      "dashboard_percentage_desc": "مستحق من رأس المال الأساسي للمستوى",
      "dashboard_base": "أساس المستوى",
      "dashboard_base_desc": "الحد الأدنى (رأس المال، سقف المستوى)",
      "dashboard_per_view_desc": "5 مشاهدات = النسبة المئوية اليومية الكاملة",
      "dashboard_daily_reward": "لمدة 5 مشاهدات (اليوم)",
      "dashboard_daily_reward_desc": "المبلغ اليومي حسب المستوى",
      "dashboard_next_level_goal": "هدف المستوى التالي",
      
      "dashboard_referral_income": "دخل الإحالات",
      "dashboard_amount": "المبلغ",
      "dashboard_gen1_with_percent": "الجيل الأول (13%)",
      "dashboard_gen2_with_percent": "الجيل الثاني (5%)",
      "dashboard_gen3_with_percent": "الجيل الثالث (1%)",
      "dashboard_total": "المجموع",
      "dashboard_recent_referral_earnings": "أرباح الإحالات الأخيرة",
      
      "no_data": "لا توجد بيانات",
      
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
      "nav_logout": "ログアウト",
      
      "page_title_dashboard": "ダッシュボード — Litcash",
      
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
      "video_not_supported": "お使いのブラウザはビデオタグをサポートしていません。",
      "video_limit_reached": "視聴制限に達しました",
      
      "dashboard_balance": "残高",
      "dashboard_views": "視聴回数",
      "dashboard_level": "レベル",
      "dashboard_rate": "レート",
      "dashboard_capital": "資本(推定)",
      "dashboard_referrals": "紹介",
      "dashboard_per_view": "+$0.00 視聴ごと",
      
      "dashboard_video_view": "動画視聴",
      "dashboard_progress": "進捗: 0%",
      "dashboard_earn_by_view": "🎬 視聴で稼ぐ",
      "dashboard_deposit": "💳 入金",
      
      "dashboard_referral_panel": "紹介パネル",
      "dashboard_copy": "📋 コピー",
      "dashboard_gen1": "第1世代",
      "dashboard_gen2": "第2世代",
      "dashboard_gen3": "第3世代",
      "dashboard_generation": "世代",
      "dashboard_email": "メール",
      "dashboard_date": "日付",
      "dashboard_source": "ソース",
      
      "dashboard_info_table": "情報テーブル",
      "dashboard_indicator": "指標",
      "dashboard_value": "値",
      "dashboard_comment": "コメント",
      "dashboard_levels_list": "スターター / アドバンスド / プロエリート / チタニウム",
      "dashboard_percentage": "パーセンテージ",
      "dashboard_percentage_desc": "レベルの基本資本から発生",
      "dashboard_base": "レベルベース",
      "dashboard_base_desc": "最小(資本, レベル上限)",
      "dashboard_per_view_desc": "5回の視聴 = 1日分の%",
      "dashboard_daily_reward": "5回の視聴(本日)",
      "dashboard_daily_reward_desc": "レベル別の1日あたりの金額",
      "dashboard_next_level_goal": "次のレベルの目標",
      
      "dashboard_referral_income": "紹介収入",
      "dashboard_amount": "金額",
      "dashboard_gen1_with_percent": "第1世代 (13%)",
      "dashboard_gen2_with_percent": "第2世代 (5%)",
      "dashboard_gen3_with_percent": "第3世代 (1%)",
      "dashboard_total": "合計",
      "dashboard_recent_referral_earnings": "最近の紹介収入",
      
      "no_data": "データなし",
      
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
      "nav_logout": "로그아웃",
      
      "page_title_dashboard": "대시보드 — Litcash",
      
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
      "video_not_supported": "브라우저가 비디오 태그를 지원하지 않습니다.",
      "video_limit_reached": "시청 한도 도달",
      
      "dashboard_balance": "잔액",
      "dashboard_views": "조회수",
      "dashboard_level": "레벨",
      "dashboard_rate": "비율",
      "dashboard_capital": "자본(추정)",
      "dashboard_referrals": "추천",
      "dashboard_per_view": "+$0.00 시청당",
      
      "dashboard_video_view": "비디오 시청",
      "dashboard_progress": "진행률: 0%",
      "dashboard_earn_by_view": "🎬 시청으로 수익 창출",
      "dashboard_deposit": "💳 입금",
      
      "dashboard_referral_panel": "추천 패널",
      "dashboard_copy": "📋 복사",
      "dashboard_gen1": "1세대",
      "dashboard_gen2": "2세대",
      "dashboard_gen3": "3세대",
      "dashboard_generation": "세대",
      "dashboard_email": "이메일",
      "dashboard_date": "날짜",
      "dashboard_source": "소스",
      
      "dashboard_info_table": "정보 테이블",
      "dashboard_indicator": "지표",
      "dashboard_value": "값",
      "dashboard_comment": "설명",
      "dashboard_levels_list": "스타터 / 어드밴스드 / 프로 엘리트 / 티타늄",
      "dashboard_percentage": "백분율",
      "dashboard_percentage_desc": "레벨의 기본 자본에서 발생",
      "dashboard_base": "레벨 기준",
      "dashboard_base_desc": "최소(자본, 레벨 상한선)",
      "dashboard_per_view_desc": "5회 시청 = 전체 일일 %",
      "dashboard_daily_reward": "5회 시청(오늘)",
      "dashboard_daily_reward_desc": "레벨별 일일 금액",
      "dashboard_next_level_goal": "다음 레벨 목표",
      
      "dashboard_referral_income": "추천 수입",
      "dashboard_amount": "금액",
      "dashboard_gen1_with_percent": "1세대 (13%)",
      "dashboard_gen2_with_percent": "2세대 (5%)",
      "dashboard_gen3_with_percent": "3세대 (1%)",
      "dashboard_total": "총계",
      "dashboard_recent_referral_earnings": "최근 추천 수익",
      
      "no_data": "데이터 없음",
      
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
      "nav_logout": "Çıkış",
      
      "page_title_dashboard": "Kontrol Paneli — Litcash",
      
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
      "video_not_supported": "Tarayıcınız video etiketini desteklemiyor.",
      "video_limit_reached": "Görüntüleme limitine ulaşıldı",
      
      "dashboard_balance": "Bakiye",
      "dashboard_views": "Görüntülemeler",
      "dashboard_level": "Seviye",
      "dashboard_rate": "Oran",
      "dashboard_capital": "Sermaye (tahmini)",
      "dashboard_referrals": "Referanslar",
      "dashboard_per_view": "+$0.00 görüntüleme başına",
      
      "dashboard_video_view": "Video İzleme",
      "dashboard_progress": "İlerleme: 0%",
      "dashboard_earn_by_view": "🎬 İzleyerek Kazan",
      "dashboard_deposit": "💳 Yatır",
      
      "dashboard_referral_panel": "Referans Paneli",
      "dashboard_copy": "📋 Kopyala",
      "dashboard_gen1": "1. Nesil",
      "dashboard_gen2": "2. Nesil",
      "dashboard_gen3": "3. Nesil",
      "dashboard_generation": "Nesil",
      "dashboard_email": "E-posta",
      "dashboard_date": "Tarih",
      "dashboard_source": "Kaynak",
      
      "dashboard_info_table": "Bilgi Tablosu",
      "dashboard_indicator": "Gösterge",
      "dashboard_value": "Değer",
      "dashboard_comment": "Yorum",
      "dashboard_levels_list": "Başlangıç / Gelişmiş / Pro Elite / Titanyum",
      "dashboard_percentage": "Yüzde",
      "dashboard_percentage_desc": "Seviyenin temel sermayesinden tahakkuk eder",
      "dashboard_base": "Seviye Tabanı",
      "dashboard_base_desc": "min(sermaye, seviye tavanı)",
      "dashboard_per_view_desc": "5 görüntüleme = tam günlük %",
      "dashboard_daily_reward": "5 Görüntüleme İçin (Bugün)",
      "dashboard_daily_reward_desc": "Seviyeye göre günlük miktar",
      "dashboard_next_level_goal": "Sonraki Seviye Hedefi",
      
      "dashboard_referral_income": "Referans Geliri",
      "dashboard_amount": "Miktar",
      "dashboard_gen1_with_percent": "1. Nesil (%13)",
      "dashboard_gen2_with_percent": "2. Nesil (%5)",
      "dashboard_gen3_with_percent": "3. Nesil (%1)",
      "dashboard_total": "Toplam",
      "dashboard_recent_referral_earnings": "Son Referans Kazançları",
      
      "no_data": "Veri yok",
      
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
      "nav_logout": "Esci",
      
      "page_title_dashboard": "Dashboard — Litcash",
      
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
      "video_not_supported": "Il tuo browser non supporta il tag video.",
      "video_limit_reached": "Limite di visualizzazioni raggiunto",
      
      "dashboard_balance": "Saldo",
      "dashboard_views": "Visualizzazioni",
      "dashboard_level": "Livello",
      "dashboard_rate": "Tasso",
      "dashboard_capital": "Capitale (stimato)",
      "dashboard_referrals": "Referral",
      "dashboard_per_view": "+$0.00 per visualizzazione",
      
      "dashboard_video_view": "Visualizzazione Video",
      "dashboard_progress": "Progresso: 0%",
      "dashboard_earn_by_view": "🎬 Guadagna Guardando",
      "dashboard_deposit": "💳 Deposita",
      
      "dashboard_referral_panel": "Pannello Referral",
      "dashboard_copy": "📋 Copia",
      "dashboard_gen1": "1a Generazione",
      "dashboard_gen2": "2a Generazione",
      "dashboard_gen3": "3a Generazione",
      "dashboard_generation": "Generazione",
      "dashboard_email": "Email",
      "dashboard_date": "Data",
      "dashboard_source": "Fonte",
      
      "dashboard_info_table": "Tabella Informazioni",
      "dashboard_indicator": "Indicatore",
      "dashboard_value": "Valore",
      "dashboard_comment": "Commento",
      "dashboard_levels_list": "Starter / Avanzato / Pro Elite / Titanio",
      "dashboard_percentage": "Percentuale",
      "dashboard_percentage_desc": "Maturato dal capitale base del livello",
      "dashboard_base": "Base Livello",
      "dashboard_base_desc": "min(capitale, limite livello)",
      "dashboard_per_view_desc": "5 visualizzazioni = % giornaliero completo",
      "dashboard_daily_reward": "Per 5 Visualizzazioni (Oggi)",
      "dashboard_daily_reward_desc": "Importo giornaliero per livello",
      "dashboard_next_level_goal": "Obiettivo Livello Successivo",
      
      "dashboard_referral_income": "Reddito da Referral",
      "dashboard_amount": "Importo",
      "dashboard_gen1_with_percent": "1a Generazione (13%)",
      "dashboard_gen2_with_percent": "2a Generazione (5%)",
      "dashboard_gen3_with_percent": "3a Generazione (1%)",
      "dashboard_total": "Totale",
      "dashboard_recent_referral_earnings": "Guadagni Recenti da Referral",
      
      "no_data": "Nessun dato",
      
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
      "nav_logout": "लॉग आउट",
      
      "page_title_dashboard": "डैशबोर्ड — Litcash",
      
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
      "video_not_supported": "आपका ब्राउज़र वीडियो टैग का समर्थन नहीं करता है।",
      "video_limit_reached": "देखने की सीमा पूरी हुई",
      
      "dashboard_balance": "बैलेंस",
      "dashboard_views": "व्यूज",
      "dashboard_level": "स्तर",
      "dashboard_rate": "दर",
      "dashboard_capital": "पूंजी (अनुमानित)",
      "dashboard_referrals": "रेफरल",
      "dashboard_per_view": "+$0.00 प्रति व्यू",
      
      "dashboard_video_view": "वीडियो देखना",
      "dashboard_progress": "प्रगति: 0%",
      "dashboard_earn_by_view": "🎬 देखकर कमाएं",
      "dashboard_deposit": "💳 जमा करें",
      
      "dashboard_referral_panel": "रेफरल पैनल",
      "dashboard_copy": "📋 कॉपी करें",
      "dashboard_gen1": "पहली पीढ़ी",
      "dashboard_gen2": "दूसरी पीढ़ी",
      "dashboard_gen3": "तीसरी पीढ़ी",
      "dashboard_generation": "पीढ़ी",
      "dashboard_email": "ईमेल",
      "dashboard_date": "तारीख",
      "dashboard_source": "स्रोत",
      
      "dashboard_info_table": "सूचना तालिका",
      "dashboard_indicator": "संकेतक",
      "dashboard_value": "मान",
      "dashboard_comment": "टिप्पणी",
      "dashboard_levels_list": "स्टार्टर / एडवांस्ड / प्रो एलिट / टाइटेनियम",
      "dashboard_percentage": "प्रतिशत",
      "dashboard_percentage_desc": "स्तर की आधार पूंजी से अर्जित",
      "dashboard_base": "स्तर आधार",
      "dashboard_base_desc": "न्यूनतम(पूंजी, स्तर सीमा)",
      "dashboard_per_view_desc": "5 व्यूज = पूर्ण दैनिक %",
      "dashboard_daily_reward": "5 व्यूज के लिए (आज)",
      "dashboard_daily_reward_desc": "स्तर के अनुसार प्रतिदिन राशि",
      "dashboard_next_level_goal": "अगले स्तर का लक्ष्य",
      
      "dashboard_referral_income": "रेफरल आय",
      "dashboard_amount": "राशि",
      "dashboard_gen1_with_percent": "पहली पीढ़ी (13%)",
      "dashboard_gen2_with_percent": "दूसरी पीढ़ी (5%)",
      "dashboard_gen3_with_percent": "तीसरी पीढ़ी (1%)",
      "dashboard_total": "कुल",
      "dashboard_recent_referral_earnings": "हालिया रेफरल कमाई",
      
      "no_data": "कोई डेटा नहीं",
      
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
      "nav_logout": "Wyloguj",
      
      "page_title_dashboard": "Panel — Litcash",
      
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
      "video_not_supported": "Twoja przeglądarka nie obsługuje znacznika wideo.",
      "video_limit_reached": "Osiągnięto limit wyświetleń",
      
      "dashboard_balance": "Saldo",
      "dashboard_views": "Wyświetlenia",
      "dashboard_level": "Poziom",
      "dashboard_rate": "Stawka",
      "dashboard_capital": "Kapitał (szac.)",
      "dashboard_referrals": "Polecenia",
      "dashboard_per_view": "+$0.00 za wyświetlenie",
      
      "dashboard_video_view": "Oglądanie Wideo",
      "dashboard_progress": "Postęp: 0%",
      "dashboard_earn_by_view": "🎬 Zarabiaj przez Oglądanie",
      "dashboard_deposit": "💳 Wpłać",
      
      "dashboard_referral_panel": "Panel Poleceń",
      "dashboard_copy": "📋 Kopiuj",
      "dashboard_gen1": "1. Generacja",
      "dashboard_gen2": "2. Generacja",
      "dashboard_gen3": "3. Generacja",
      "dashboard_generation": "Generacja",
      "dashboard_email": "Email",
      "dashboard_date": "Data",
      "dashboard_source": "Źródło",
      
      "dashboard_info_table": "Tabela Informacyjna",
      "dashboard_indicator": "Wskaźnik",
      "dashboard_value": "Wartość",
      "dashboard_comment": "Komentarz",
      "dashboard_levels_list": "Początkujący / Zaawansowany / Pro Elite / Tytanowy",
      "dashboard_percentage": "Procent",
      "dashboard_percentage_desc": "Naliczany od kapitału bazowego poziomu",
      "dashboard_base": "Baza Poziomu",
      "dashboard_base_desc": "min(kapitał, sufit poziomu)",
      "dashboard_per_view_desc": "5 wyświetleń = pełny dzienny %",
      "dashboard_daily_reward": "Za 5 Wyświetleń (Dziś)",
      "dashboard_daily_reward_desc": "Kwota dzienna według poziomu",
      "dashboard_next_level_goal": "Cel Następnego Poziomu",
      
      "dashboard_referral_income": "Dochód z Poleceń",
      "dashboard_amount": "Kwota",
      "dashboard_gen1_with_percent": "1. Generacja (13%)",
      "dashboard_gen2_with_percent": "2. Generacja (5%)",
      "dashboard_gen3_with_percent": "3. Generacja (1%)",
      "dashboard_total": "Razem",
      "dashboard_recent_referral_earnings": "Ostatnie Dochody z Poleceń",
      
      "no_data": "Brak danych",
      
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

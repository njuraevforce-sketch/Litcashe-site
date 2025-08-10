
(function(){
  function getLang(){
    try{
      var url = new URL(window.location.href);
      var p = url.searchParams.get('lang');
      if(p){ localStorage.setItem('lang', p); return p; }
      var s = localStorage.getItem('lang');
      return s || 'ru';
    }catch(e){ return 'ru'; }
  }
  var L = getLang();

  try{
    var html = document.documentElement;
    html.setAttribute('lang', L);
    if(L==='ar'){ html.setAttribute('dir','rtl'); document.body.classList.add('rtl'); }
    else { html.setAttribute('dir','ltr'); document.body.classList.remove('rtl'); }
  }catch(e){}

  var T = {}; // lang -> {ruText -> translated}
  function D(lang, ru, tr){
    (T[lang]||(T[lang]={}))[ru]=tr;
  }

  // === EN ===
  D('en',"Главная","Home");
  D('en',"Личный кабинет","Dashboard");
  D('en',"Пополнение","Deposit");
  D('en',"Вывод","Withdraw");
  D('en',"FAQ","FAQ");
  D('en',"Настройки","Settings");
  D('en',"Вход","Login");
  D('en',"Регистрация","Register");
  D('en',"Выйти","Logout");
  D('en',"Зарабатывай USDT за просмотр коротких видео","Earn USDT for watching short videos");
  D('en',"Активируй аккаунт пополнением от 29 USDT и начинай зарабатывать. Реферальные уровни: 13% / 5% / 1%.","Activate your account with a 29 USDT deposit and start earning. Referral levels: 13% / 5% / 1%.");
  D('en',"Начать","Start");
  D('en',"Подробнее","Learn more");
  D('en',"1. Активация","1. Activation");
  D('en',"Пополняешь от 29 USDT (TRC20) — аккаунт становится активным.","Deposit from 29 USDT (TRC20) — your account becomes active.");
  D('en',"2. Просмотры","2. Views");
  D('en',"Каждые 5 просмотров дают +1% к базе дохода.","Every 5 views add +1% to the base income.");
  D('en',"3. Рефералы","3. Referrals");
  D('en',"13% / 5% / 1% от дохода рефералов по уровням.","13% / 5% / 1% of your referrals’ income by levels.");
  D('en',"Email + пароль (позже подключим Supabase Auth).","Email + password (Supabase Auth coming soon).");
  D('en',"Email","Email");
  D('en',"Пароль","Password");
  D('en',"Войти","Login");
  D('en',"Нет аккаунта?","No account?");
  D('en',"Создайте его за минуту и начните зарабатывать.","Create it in a minute and start earning.");
  D('en',"Регистрация","Register");
  D('en',"После регистрации активируйте аккаунт пополнением от 29 USDT.","After registration, activate your account with a 29 USDT deposit.");
  D('en',"ID реферера (если есть)","Referrer ID (optional)");
  D('en',"Создать аккаунт","Create account");
  D('en',"Есть аккаунт?","Already have an account?");
  D('en',"Войдите, чтобы продолжить.","Sign in to continue.");
  D('en',"Мой кабинет","My dashboard");
  D('en',"Баланс","Balance");
  D('en',"Просмотров","Views");
  D('en',"Прогресс до 1%","Progress to 1%");
  D('en',"Старт","Start");
  D('en',"Ваша реферальная ссылка","Your referral link");
  D('en',"Копировать","Copy");
  D('en',"Начисления: 13% / 5% / 1% от дохода ваших уровней (без бонуса за регистрацию).","Accruals: 13% / 5% / 1% of your levels’ income (no signup bonus).");
  D('en',"Доход","Earnings");
  D('en',"Обновляется при каждом полном проценте (каждые 5 просмотров).","Updates on each full percent (every 5 views).");
  D('en',"Реферальная сеть","Referral network");
  D('en',"Пользователь","User");
  D('en',"Уровень","Level");
  D('en',"Статус","Status");
  D('en',"Заработок для меня","Earnings for me");
  D('en',"Активен","Active");
  D('en',"Неактивен","Inactive");
  D('en',"Пополнение USDT (TRC20)","Deposit USDT (TRC20)");
  D('en',"Минимум 29 USDT для активации аккаунта. Отправьте на адрес ниже, затем укажите TXID.","Minimum 29 USDT to activate the account. Send to the address below, then enter the TXID.");
  D('en',"Адрес для пополнения (TRC20)","Deposit address (TRC20)");
  D('en',"Сумма, USDT","Amount, USDT");
  D('en',"TXID","TXID");
  D('en',"Подтвердить пополнение","Confirm deposit");
  D('en',"После интеграции платёжного шлюза подтверждение будет автоматически.","After gateway integration, confirmation will be automatic.");
  D('en',"Статус операций","Operation status");
  D('en',"Дата","Date");
  D('en',"Сумма","Amount");
  D('en',"В обработке","Pending");
  D('en',"Выплачено","Paid");
  D('en',"Вывод USDT (TRC20)","Withdraw USDT (TRC20)");
  D('en',"Минимальная сумма — 10 USDT. Комиссия — 1 USDT.","Minimum amount — 10 USDT. Fee — 1 USDT.");
  D('en',"Ваш TRC20-кошелёк","Your TRC20 wallet");
  D('en',"Сумма к выводу, USDT","Withdraw amount, USDT");
  D('en',"Отправить заявку","Submit request");
  D('en',"TRC20-кошелёк","TRC20 wallet");
  D('en',"Сохранить","Save");
  D('en',"Безопасность","Security");
  D('en',"Старый пароль","Old password");
  D('en',"Новый пароль","New password");
  D('en',"Подтверждение нового пароля","Confirm new password");
  D('en',"Сменить пароль","Change password");
  D('en',"Как активировать аккаунт?","How to activate the account?");
  D('en',"Сделать пополнение ≥ 29 USDT (TRC20) на указанный адрес.","Make a deposit ≥ 29 USDT (TRC20) to the specified address.");
  D('en',"Когда начисляются проценты?","When are percentages accrued?");
  D('en',"Каждые 5 просмотров дают +1% к базе. Начисления видны в кабинете.","Every 5 views add +1% to the base. Accruals are visible in the dashboard.");
  D('en',"Как работает реферальная система?","How does the referral system work?");
  D('en',"13% / 5% / 1% от дохода рефералов по 3 уровням. За приглашение бонус не начисляется.","13% / 5% / 1% of referrals’ income across 3 levels. No bonus for invites.");
  D('en',"Как вывести средства?","How to withdraw funds?");
  D('en',"Создайте заявку на странице «Вывод». Минимум 10 USDT. Комиссия — 1 USDT.","Submit a request on the “Withdraw” page. Minimum 10 USDT. Fee — 1 USDT.");
  D('en',"Support:","Support:");
  D('en',"All rights reserved","All rights reserved");

  // === UZ ===
  function DU(ru,tr){ D('uz',ru,tr); }
  DU("Главная","Bosh sahifa"); DU("Личный кабинет","Kabinet"); DU("Пополнение","To‘ldirish"); DU("Вывод","Chiqarib olish"); DU("FAQ","FAQ"); DU("Настройки","Sozlamalar"); DU("Вход","Kirish"); DU("Регистрация","Ro‘yxatdan o‘tish"); DU("Выйти","Chiqish");
  DU("Зарабатывай USDT за просмотр коротких видео","Qisqa videolarni ko‘rib USDT toping");
  DU("Активируй аккаунт пополнением от 29 USDT и начинай зарабатывать. Реферальные уровни: 13% / 5% / 1%.","29 USDT to‘lov bilan akkauntni faollashtiring va daromad oling. Referal darajalari: 13% / 5% / 1%.");
  DU("Начать","Boshlash"); DU("Подробнее","Batafsil");
  DU("1. Активация","1. Faollashtirish"); DU("Пополняешь от 29 USDT (TRC20) — аккаунт становится активным.","29 USDT (TRC20) yuborsangiz — akkaunt faollashadi.");
  DU("2. Просмотры","2. Ko‘rishlar"); DU("Каждые 5 просмотров дают +1% к базе дохода.","Har 5 ta ko‘rish bazaga +1% qo‘shadi.");
  DU("3. Рефералы","3. Referallar"); DU("13% / 5% / 1% от дохода рефералов по уровням.","Referal daromadidan 13% / 5% / 1%.");
  DU("Email + пароль (позже подключим Supabase Auth).","Email va parol (Supabase Auth tez orada).");
  DU("Email","Email"); DU("Пароль","Parol"); DU("Войти","Kirish");
  DU("Нет аккаунта?","Akkauntingiz yo‘qmi?"); DU("Создайте его за минуту и начните зарабатывать.","Bir daqiqada ro‘yxatdan o‘ting va daromad oling.");
  DU("Регистрация","Ro‘yxatdan o‘tish");
  DU("После регистрации активируйте аккаунт пополнением от 29 USDT.","Ro‘yxatdan so‘ng 29 USDT to‘lov bilan faollashtiring.");
  DU("ID реферера (если есть)","Referer ID (ixtiyoriy)"); DU("Создать аккаунт","Akkaunt yaratish"); DU("Есть аккаунт?","Akkaunt bormi?"); DU("Войдите, чтобы продолжить.","Davom etish uchun kiring.");
  DU("Мой кабинет","Kabinetim"); DU("Баланс","Balans"); DU("Просмотров","Ko‘rishlar"); DU("Прогресс до 1%","1% gacha progress"); DU("Старт","Start");
  DU("Ваша реферальная ссылка","Sizning referal havolangiz"); DU("Копировать","Nusxalash");
  DU("Начисления: 13% / 5% / 1% от дохода ваших уровней (без бонуса за регистрацию).","Hisob-kitob: darajalardan 13% / 5% / 1% (ro‘yxatdan o‘tish bonusi yo‘q).");
  DU("Доход","Daromad"); DU("Обновляется при каждом полном проценте (каждые 5 просмотров).","Har 5 ta ko‘rishda yangilanadi.");
  DU("Реферальная сеть","Referal tarmog‘i"); DU("Пользователь","Foydalanuvchi"); DU("Уровень","Daraja"); DU("Статус","Holat"); DU("Заработок для меня","Menga daromad");
  DU("Активен","Faol"); DU("Неактивен","Nofaol");
  DU("Пополнение USDT (TRC20)","USDT (TRC20) to‘ldirish");
  DU("Минимум 29 USDT для активации аккаунта. Отправьте на адрес ниже, затем укажите TXID.","Kamida 29 USDT — faollashtirish. Quyidagi manzilga yuboring, so‘ng TXID kiriting.");
  DU("Адрес для пополнения (TRC20)","To‘ldirish manzili (TRC20)"); DU("Сумма, USDT","Miqdor, USDT"); DU("TXID","TXID");
  DU("Подтвердить пополнение","To‘lovni tasdiqlash"); DU("После интеграции платёжного шлюза подтверждение будет автоматически.","Gateway ulanganidan so‘ng avtomatik tasdiqlanadi.");
  DU("Статус операций","Operatsiyalar holati"); DU("Дата","Sana"); DU("Сумма","Summa"); DU("В обработке","Ko‘rib chiqilmoqda"); DU("Выплачено","To‘langan");
  DU("Вывод USDT (TRC20)","USDT (TRC20) yechib olish");
  DU("Минимальная сумма — 10 USDT. Комиссия — 1 USDT.","Minimal — 10 USDT. Komissiya — 1 USDT.");
  DU("Ваш TRC20-кошелёк","TRC20 hamyoningiz"); DU("Сумма к выводу, USDT","Yechib olish summasi, USDT"); DU("Отправить заявку","Ariza yuborish");
  DU("TRC20-кошелёк","TRC20 hamyon"); DU("Сохранить","Saqlash"); DU("Безопасность","Xavfsizlik");
  DU("Старый пароль","Eski parol"); DU("Новый пароль","Yangi parol"); DU("Подтверждение нового пароля","Yangi parol tasdiqlash"); DU("Сменить пароль","Parolni almashtirish");
  DU("Как активировать аккаунт?","Akkauntni qanday faollashtirish?");
  DU("Сделать пополнение ≥ 29 USDT (TRC20) на указанный адрес.","Ko‘rsatilgan manzilga ≥ 29 USDT (TRC20) yuboring.");
  DU("Когда начисляются проценты?","Foizlar qachon qo‘shiladi?");
  DU("Каждые 5 просмотров дают +1% к базе. Начисления видны в кабинете.","Har 5 ta ko‘rishda bazaga +1%. Kabinetda ko‘rinadi.");
  DU("Как работает реферальная система?","Referal tizimi qanday ishlaydi?");
  DU("13% / 5% / 1% от дохода рефералов по 3 уровням. За приглашение бонус не начисляется.","3 daraja bo‘yicha 13% / 5% / 1%. Taklif uchun bonus yo‘q.");
  DU("Как вывести средства?","Pulni qanday yechib olish?");
  DU("Создайте заявку на странице «Вывод». Минимум 10 USDT. Комиссия — 1 USDT.","«Chiqarib olish» sahifasida ariza yarating. Min. 10 USDT. Komissiya — 1 USDT.");
  D('uz',"Support:","Qo‘llab-quvvatlash:"); D('uz',"All rights reserved","Barcha huquqlar himoyalangan");

  // === TR ===
  function DT(ru,tr){ D('tr',ru,tr); }
  DT("Главная","Ana sayfa"); DT("Личный кабинет","Panel"); DT("Пополнение","Yatırma"); DT("Вывод","Çekim"); DT("FAQ","SSS"); DT("Настройки","Ayarlar"); DT("Вход","Giriş"); DT("Регистрация","Kayıt ol"); DT("Выйти","Çıkış");
  DT("Зарабатывай USDT за просмотр коротких видео","Kısa videolar izleyerek USDT kazanın");
  DT("Активируй аккаунт пополнением от 29 USDT и начинай зарабатывать. Реферальные уровни: 13% / 5% / 1%.","29 USDT yatırarak hesabı etkinleştirin ve kazanmaya başlayın. Seviyeler: 13% / 5% / 1%.");
  DT("Начать","Başla"); DT("Подробнее","Daha fazla bilgi");
  DT("1. Активация","1. Aktivasyon"); DT("Пополняешь от 29 USDT (TRC20) — аккаунт становится активным.","29 USDT (TRC20) yatırınca hesap etkinleşir.");
  DT("2. Просмотры","2. Görüntüleme"); DT("Каждые 5 просмотров дают +1% к базе дохода.","Her 5 izleme baz gelire +%1 ekler.");
  DT("3. Рефералы","3. Yönlendirmeler"); DT("13% / 5% / 1% от дохода рефералов по уровням.","Seviyelere göre %13 / %5 / %1.");
  DT("Email + пароль (позже подключим Supabase Auth).","E-posta + şifre (yakında Supabase Auth).");
  DT("Email","E-posta"); DT("Пароль","Şifre"); DT("Войти","Giriş yap");
  DT("Нет аккаунта?","Hesabınız yok mu?"); DT("Создайте его за минуту и начните зарабатывать.","Bir dakikada oluşturun ve kazanmaya başlayın.");
  DT("Регистрация","Kayıt ol");
  DT("После регистрации активируйте аккаунт пополнением от 29 USDT.","Kayıttan sonra 29 USDT yatırarak etkinleştirin.");
  DT("ID реферера (если есть)","Yönlendiren ID (opsiyonel)"); DT("Создать аккаунт","Hesap oluştur"); DT("Есть аккаунт?","Zaten hesabınız var mı?"); DT("Войдите, чтобы продолжить.","Devam etmek için giriş yapın.");
  DT("Мой кабинет","Panelim"); DT("Баланс","Bakiye"); DT("Просмотров","Görüntüleme"); DT("Прогресс до 1%","%%1’e ilerleme"); DT("Старт","Başlat");
  DT("Ваша реферальная ссылка","Yönlendirme bağlantınız"); DT("Копировать","Kopyala");
  DT("Начисления: 13% / 5% / 1% от дохода ваших уровней (без бонуса за регистрацию).","Tahakkuk: seviyelerden %13 / %5 / %1 (kayıt bonusu yok).");
  DT("Доход","Kazanç"); DT("Обновляется при каждом полном проценте (каждые 5 просмотров).","Her %1’de (her 5 izleme) güncellenir.");
  DT("Реферальная сеть","Yönlendirme ağı"); DT("Пользователь","Kullanıcı"); DT("Уровень","Seviye"); DT("Статус","Durum"); DT("Заработок для меня","Bana kazanç");
  DT("Активен","Aktif"); DT("Неактивен","Pasif");
  DT("Пополнение USDT (TRC20)","USDT (TRC20) Yatırma");
  DT("Минимум 29 USDT для активации аккаунта. Отправьте на адрес ниже, затем укажите TXID.","Minimum 29 USDT — etkinleştirme için. Aşağıdaki adrese gönderin, sonra TXID girin.");
  DT("Адрес для пополнения (TRC20)","Yatırma adresi (TRC20)"); DT("Сумма, USDT","Tutar, USDT"); DT("TXID","TXID");
  DT("Подтвердить пополнение","Yatırmayı onayla"); DT("После интеграции платёжного шлюза подтверждение будет автоматически.","Ağ geçidi sonrası onay otomatik olacaktır.");
  DT("Статус операций","İşlem durumu"); DT("Дата","Tarih"); DT("Сумма","Tutar"); DT("В обработке","Beklemede"); DT("Выплачено","Ödendi");
  DT("Вывод USDT (TRC20)","USDT (TRC20) Çekim");
  DT("Минимальная сумма — 10 USDT. Комиссия — 1 USDT.","Minimum 10 USDT. Komisyon 1 USDT.");
  DT("Ваш TRC20-кошелёк","TRC20 cüzdanınız"); DT("Сумма к выводу, USDT","Çekim tutarı, USDT"); DT("Отправить заявку","Talep gönder");
  DT("TRC20-кошелёк","TRC20 cüzdan"); DT("Сохранить","Kaydet"); DT("Безопасность","Güvenlik");
  DT("Старый пароль","Eski şifre"); DT("Новый пароль","Yeni şifre"); DT("Подтверждение нового пароля","Yeni şifreyi doğrula"); DT("Сменить пароль","Şifre değiştir");
  DT("Как активировать аккаунт?","Hesap nasıl etkinleştirilir?");
  DT("Сделать пополнение ≥ 29 USDT (TRC20) на указанный адрес.","Belirtilen adrese ≥ 29 USDT (TRC20) yatırın.");
  DT("Когда начисляются проценты?","Yüzdeler ne zaman eklenir?");
  DT("Каждые 5 просмотров дают +1% к базе. Начисления видны в кабинете.","Her 5 izleme baz gelire +%1 ekler. Panelde görünür.");
  DT("Как работает реферальная система?","Yönlendirme sistemi nasıl çalışır?");
  DT("13% / 5% / 1% от дохода рефералов по 3 уровням. За приглашение бонус не начисляется.","3 seviyede %13 / %5 / %1. Davet için bonus yok.");
  DT("Как вывести средства?","Para nasıl çekilir?");
  DT("Создайте заявку на странице «Вывод». Минимум 10 USDT. Комиссия — 1 USDT.","“Çekim” sayfasında talep oluşturun. Minimum 10 USDT. Komisyon 1 USDT.");
  D('tr',"Support:","Destek:"); D('tr',"All rights reserved","Tüm hakları saklıdır");

  // === AR ===
  function DA(ru,tr){ D('ar',ru,tr); }
  DA("Главная","الرئيسية"); DA("Личный кабинет","لوحة التحكم"); DA("Пополнение","الإيداع"); DA("Вывод","السحب"); DA("FAQ","الأسئلة الشائعة"); DA("Настройки","الإعدادات"); DA("Вход","تسجيل الدخول"); DA("Регистрация","التسجيل"); DA("Выйти","تسجيل الخروج");
  DA("Зарабатывай USDT за просмотр коротких видео","اكسب USDT مقابل مشاهدة مقاطع الفيديو القصيرة");
  DA("Активируй аккаунт пополнением от 29 USDT и начинай зарабатывать. Реферальные уровни: 13% / 5% / 1%.","فعّل الحساب بإيداع 29 USDT وابدأ الربح. مستويات الإحالة: 13% / 5% / 1%.");
  DA("Начать","ابدأ"); DA("Подробнее","المزيد");
  DA("1. Активация","1. التفعيل"); DA("Пополняешь от 29 USDT (TRC20) — аккаунт становится активным.","بإيداع 29 USDT (TRC20) يصبح الحساب مُفعّلاً.");
  DA("2. Просмотры","2. المشاهدات"); DA("Каждые 5 просмотров дают +1% к базе дохода.","كل 5 مشاهدات تضيف ‎%1 إلى الدخل الأساسي.");
  DA("3. Рефералы","3. الإحالات"); DA("13% / 5% / 1% от дохода рефералов по уровням.","13% / 5% / 1% من دخل الإحالات حسب المستويات.");
  DA("Email + пароль (позже подключим Supabase Auth).","البريد وكلمة المرور (سيضاف Supabase Auth لاحقًا).");
  DA("Email","البريد الإلكتروني"); DA("Пароль","كلمة المرور"); DA("Войти","تسجيل الدخول");
  DA("Нет аккаунта?","لا تملك حسابًا؟"); DA("Создайте его за минуту и начните зарабатывать.","أنشئه في دقيقة وابدأ الربح.");
  DA("Регистрация","التسجيل");
  DA("После регистрации активируйте аккаунт пополнением от 29 USDT.","بعد التسجيل فعِّل الحساب بإيداع 29 USDT.");
  DA("ID реферера (если есть)","معرّف المُحيل (اختياري)"); DA("Создать аккаунт","إنشاء حساب"); DA("Есть аккаунт?","لديك حساب؟"); DA("Войдите, чтобы продолжить.","سجّل الدخول للمتابعة.");
  DA("Мой кабинет","لوحة حسابي"); DA("Баланс","الرصيد"); DA("Просмотров","المشاهدات"); DA("Прогресс до 1%","التقدم حتى ‎%1"); DA("Старт","ابدأ");
  DA("Ваша реферальная ссылка","رابط الإحالة الخاص بك"); DA("Копировать","نسخ");
  DA("Начисления: 13% / 5% / 1% от дохода ваших уровней (без бонуса за регистрацию).","الاستحقاق: ‎%13 / ‎%5 / ‎%1 من دخل المستويات (لا مكافأة تسجيل).");
  DA("Доход","الدخل"); DA("Обновляется при каждом полном проценте (каждые 5 просмотров).","يتحدث عند كل ‎%1 كامل (كل 5 مشاهدات).");
  DA("Реферальная сеть","شبكة الإحالة"); DA("Пользователь","المستخدم"); DA("Уровень","المستوى"); DA("Статус","الحالة"); DA("Заработок для меня","ربحي");
  DA("Активен","نشط"); DA("Неактивен","غير نشط");
  DA("Пополнение USDT (TRC20)","إيداع USDT ‏(TRC20)");
  DA("Минимум 29 USDT для активации аккаунта. Отправьте на адрес ниже, затем укажите TXID.","الحد الأدنى 29 USDT لتفعيل الحساب. أرسل إلى العنوان أدناه ثم أدخل TXID.");
  DA("Адрес для пополнения (TRC20)","عنوان الإيداع (TRC20)"); DA("Сумма, USDT","المبلغ، USDT"); DA("TXID","TXID");
  DA("Подтвердить пополнение","تأكيد الإيداع"); DA("После интеграции платёжного шлюза подтверждение будет автоматически.","بعد دمج بوابة الدفع سيكون التأكيد تلقائيًا.");
  DA("Статус операций","حالة العمليات"); DA("Дата","التاريخ"); DA("Сумма","المبلغ"); DA("В обработке","قيد المعالجة"); DA("Выплачено","مدفوع");
  DA("Вывод USDT (TRC20)","سحب USDT ‏(TRC20)");
  DA("Минимальная сумма — 10 USDT. Комиссия — 1 USDT.","الحد الأدنى 10 USDT. العمولة 1 USDT.");
  DA("Ваш TRC20-кошелёк","محفظة TRC20 الخاصة بك"); DA("Сумма к выводу, USDT","مبلغ السحب، USDT"); DA("Отправить заявку","إرسال الطلب");
  DA("TRC20-кошелёк","محفظة TRC20"); DA("Сохранить","حفظ"); DA("Безопасность","الأمان");
  DA("Старый пароль","كلمة المرور القديمة"); DA("Новый пароль","كلمة المرور الجديدة"); DA("Подтверждение нового пароля","تأكيد كلمة المرور الجديدة"); DA("Сменить пароль","تغيير كلمة المرور");
  DA("Как активировать аккаунт?","كيف أفعّل الحساب؟");
  DA("Сделать пополнение ≥ 29 USDT (TRC20) на указанный адрес.","قم بإيداع ≥ 29 USDT (TRC20) إلى العنوان المحدد.");
  DA("Когда начисляются проценты?","متى تُضاف النِسب؟");
  DA("Каждые 5 просмотров дают +1% к базе. Начисления видны в кабинете.","كل 5 مشاهدات تضيف ‎%1 إلى الأساس. يظهر في اللوحة.");
  DA("Как работает реферальная система?","كيف تعمل الإحالة؟");
  DA("13% / 5% / 1% от дохода рефералов по 3 уровням. За приглашение бонус не начисляется.","‎%13 / ‎%5 / ‎%1 عبر 3 مستويات. لا مكافأة للدعوة.");
  DA("Как вывести средства?","كيف أسحب الأموال؟");
  DA("Создайте заявку на странице «Вывод». Минимум 10 USDT. Комиссия — 1 USDT.","أنشئ طلبًا في صفحة «السحب». الحد الأدنى 10 USDT. العمولة 1 USDT.");
  D('ar',"Support:","الدعم:"); D('ar',"All rights reserved","جميع الحقوق محفوظة");

  var P = { // placeholders
    en: {"Email":"Email","Пароль":"Password","Старый пароль":"Old password","Новый пароль":"New password","Подтверждение нового пароля":"Confirm new password","ID реферера (если есть)":"Referrer ID (optional)","Ваш TRC20-кошелёк":"Your TRC20 wallet","Сумма к выводу, USDT":"Withdraw amount, USDT"},
    uz: {"Email":"Email","Пароль":"Parol","Старый пароль":"Eski parol","Новый пароль":"Yangi parol","Подтверждение нового пароля":"Yangi parol tasdiqlash","ID реферера (если есть)":"Referer ID (ixtiyoriy)","Ваш TRC20-кошелёк":"TRC20 hamyoningiz","Сумма к выводу, USDT":"Yechish summasi, USDT"},
    tr: {"Email":"E-posta","Пароль":"Şifre","Старый пароль":"Eski şifre","Новый пароль":"Yeni şifre","Подтверждение нового пароля":"Yeni şifreyi doğrula","ID реферера (если есть)":"Yönlendiren ID (opsiyonel)","Ваш TRC20-кошелёк":"TRC20 cüzdanınız","Сумма к выводу, USDT":"Çekim tutarı, USDT"},
    ar: {"Email":"البريد الإلكتروني","Пароль":"كلمة المرور","Старый пароль":"كلمة المرور القديمة","Новый пароль":"كلمة المرور الجديدة","Подтверждение нового пароля":"تأكيد كلمة المرور الجديدة","ID реферера (если есть)":"معرّف المُحيل (اختياري)","Ваш TRC20-кошелёк":"محفظة TRC20 الخاصة بك","Сумма к выводу, USDT":"مبلغ السحب، USDT"}
  };

  function normalize(s){ return (s||'').replace(/\s+/g,' ').trim(); }

  function translateNode(node, dict){
    if(node.nodeType===3){
      var txt = normalize(node.nodeValue);
      if(txt && dict[txt]) node.nodeValue = node.nodeValue.replace(txt, dict[txt]);
      return;
    }
    if(node.nodeType!==1) return;
    var tn = node.tagName;
    if(tn==='SCRIPT' || tn==='STYLE' || tn==='NOSCRIPT') return;
    if(node.hasAttribute && node.hasAttribute('placeholder')){
      var ph = normalize(node.getAttribute('placeholder'));
      var pset = P[L]||{};
      if(pset[ph]) node.setAttribute('placeholder', pset[ph]);
    }
    for(var i=0;i<node.childNodes.length;i++){ translateNode(node.childNodes[i], dict); }
  }

  function apply(){ if(L==='ru') return; var dict = T[L]||{}; translateNode(document.body, dict); }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', apply); } else { apply(); }
  try{
    var mo = new MutationObserver(function(){ apply(); });
    mo.observe(document.body, {childList:true, subtree:true});
  }catch(e){}

  try{ var sel=document.getElementById('langSelect'); if(sel){ sel.value=L; sel.addEventListener('change', function(){
    localStorage.setItem('lang', this.value);
    var u=new URL(window.location.href); u.searchParams.set('lang', this.value); window.location.href = u.toString();
  }); } }catch(e){}
})();

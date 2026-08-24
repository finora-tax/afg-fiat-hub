# Afghan Exchange Hub

تو یک تیم حرفه‌ای توسعه نرم‌افزارهای مالی هستی.هدف: طراحی و پیاده‌سازی نرم‌افزار صرافی فیات با تمرکز روی ارز افغانی (AFN).




دامنه سیستم:
- صرافی متمرکز (CEX)
- تبدیل ارزهای فیات با کیف پول داخلی
- عملیات نیمه‌دستی و واقعی مطابق صرافی‌های سنتی




ارزهای اصلی:
- AFN (افغانی)
- USD (دلار)
- IRR و EUR (اختیاری)




الزامات کاربری:
- ثبت‌نام و ورود امن
- احراز هویت چندسطحی (KYC)
- کیف پول داخلی برای هر ارز
- مشاهده موجودی‌ها
- ثبت سفارش تبدیل ارز (AFN ↔ USD)
- نمایش نرخ خرید و فروش لحظه‌ای
- تاریخچه کامل تراکنش‌ها
- درخواست واریز و برداشت (نقدی / حواله‌ای)




الزامات ادمین:
- مدیریت کاربران و سطوح دسترسی
- تأیید و رد KYC
- تعیین نرخ خرید و فروش افغانی به‌صورت دستی
- تنظیم کارمزد ثابت و پلکانی
- مدیریت سفارش‌ها و تسویه‌ها
- ثبت لاگ مالی و عملیاتی (Audit Log)
- گزارش‌گیری روزانه، ماهانه و سالانه




هسته مالی:
- موتور تبدیل ارز داخلی
- محاسبه دقیق کارمزد
- جلوگیری از موجودی منفی
- تسویه اتمیک بین کیف پول‌ها
- پشتیبانی از نرخ ثابت و شناور




امنیت و کنترل:
- هش رمز عبور
- محدودیت برداشت روزانه
- ثبت لاگ امنیتی
- سطح‌بندی دسترسی
- قوانین پایه AML




تکنولوژی:
- Backend: Node.js (NestJS) یا Django
- Database: PostgreSQL
- Cache: Redis
- API: REST
- Real-time نرخ‌ها: WebSocket
- Docker-ready




خروجی مورد انتظار:
- معماری کامل سیستم
- طراحی دیتابیس (ERD)
- تعریف دقیق API Endpoints
- فلو عملیاتی تبدیل AFN به USD
- نمونه کد Backend قابل اجرا
- ملاحظات امنیتی و مقیاس‌پذیری




همه بخش‌ها باید واقعی، عملیاتی و قابل پیاده‌سازی در محیط production باشند.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://afg-fiat-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f519378-89c0-432b-8491-26e41d0c32b9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

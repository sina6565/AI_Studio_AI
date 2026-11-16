# نقشهٔ بخش‌های محصول و محل کد

این سند محل واقعی کدهای وب، موبایل و بک‌اند را در مخزن ثبت می‌کند.

## اپلیکیشن وب

**پوشهٔ اجرایی:** `frontend/`

- نقطهٔ ورود و مسیریابی: `frontend/src/App.tsx`
- صفحهٔ معرفی و جهان سینمایی: `frontend/src/pages/UniverseLanding.tsx`
- صحنه و اجزای سه‌بعدی معرفی: `frontend/src/components/universe/`
- پیش‌خرید: `frontend/src/pages/PreOrder.tsx`
- سازندهٔ وب‌سایت: `frontend/src/pages/WebsiteBuilder.tsx`
- استودیو، داشبورد، پروژه‌ها و کارها: `frontend/src/pages/`

صفحهٔ معرفی و بخش‌های اصلی محصول در همین اپلیکیشن وب قرار دارند؛ دو اپلیکیشن جداگانه برای سایت سینمایی و محصول وب در ریشهٔ مخزن وجود ندارد.

## اپلیکیشن موبایل

**پوشهٔ اجرایی:** `mobile/`

- نقطهٔ ورود و Navigation: `mobile/src/App.tsx`
- صفحهٔ خوش‌آمدگویی: `mobile/src/screens/WelcomeScreen.tsx`
- احراز هویت: `mobile/src/screens/AuthScreen.tsx`
- داشبورد: `mobile/src/screens/DashboardScreen.tsx`
- استودیو: `mobile/src/screens/StudioScreen.tsx`
- پروژه‌ها و کارها: فایل‌های متناظر در `mobile/src/screens/`

صفحه‌های معرفی، ورود و امکانات محصول در یک اپلیکیشن React Native قرار دارند؛ دو اپلیکیشن مستقل با نام‌های Mobile Product و Mobile Brand در مخزن تعریف نشده‌اند.

## بک‌اند و اجرای کارها

**پوشهٔ اجرایی:** `backend/`

- API و راه‌اندازی سرور: `backend/src/`
- Orchestrator: `backend/src/orchestrator/`
- سازندهٔ وب‌سایت: `backend/src/website/`
- منطق بازی: `backend/src/game/`
- اتصال Unreal Engine 5: `backend/src/game3d/`
- Providerها و اتصال Agnes: بخش‌های مربوط در `backend/src/`

## وابستگی‌ها و packageها

سه package اجرایی پروژه در این مسیرها تعریف شده‌اند:

- `frontend/package.json`
- `backend/package.json`
- `mobile/package.json`

در `apps/*` و `packages/*`، package مستقل با `package.json` ثبت نشده است. نام‌هایی مانند `shared-ui`، `shared-api` و `shared-types` در حال حاضر package قابل نصب یا import نیستند.

## قواعد تغییر ساختار

- مسیرهای فعلی `frontend/`، `backend/` و `mobile/` را بدون انتقال واقعی کد و اصلاح همهٔ importها، تنظیمات، اسکریپت‌ها و CI حذف یا جابه‌جا نکنید.
- هیچ مسیر یا packageای را مستقل و قابل اجرا معرفی نکنید مگر اینکه manifest و ورودی اجرایی آن در مخزن وجود داشته باشد.
- تغییرات مربوط به Orchestrator، Agnes و Provider Registry باید رفتار فعلی و سازگاری چندارائه‌دهنده‌ای را حفظ کنند.
- هر تغییر ساختاری باید با build و تست‌های همان بخش بررسی شود.

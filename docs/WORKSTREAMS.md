# معماری کارکردی و انتشار اولیه

این مخزن در حال عبور از مدل تک‌اپلیکیشن به مدل چند workstream مستقل است:

## 1) Product Workstream
بخش اصلی محصول برای کاربران واقعی:
- داشبورد
- استودیو
- Jobs
- Projects
- Auth
- API integration
- state management
- workflows کسب‌وکار

مسیر پیشنهادی:
- `apps/product-web/`

## 2) Cinematic Workstream
تجربهٔ عمومی و برندینگ برای معرفی محصول و جذب مشتری:
- Landing page سینمایی
- Universe landing
- Hero scene / motion / 3D sections
- Preorder
- Brand storytelling
- User acquisition experience

مسیر پیشنهادی:
- `apps/cinematic-site/`

## 3) Mobile Product Workstream
اپ موبایل واقعی و عملکردی:
- auth flow
- dashboard
- studio mobile
- jobs/projects

مسیر پیشنهادی:
- `apps/mobile-product/`

## 4) Mobile Brand Workstream
تجربهٔ سینمایی و برند��نگ در موبایل:
- intro cinematic
- promo screens
- onboarding/teaser
- presentation brand

مسیر پیشنهادی:
- `apps/mobile-brand/`

## 5) Shared Layer
بخش‌های اشتراکی:
- design system
- translations
- shared API layer
- shared types
- common UI primitives

مسیر پیشنهادی:
- `packages/`

## اولویت اجرایی
1. رفع موانع وابستگی‌ها و lockfile
2. تفکیک workstream‌ها
3. هاردنینگ امنیتی و env
4. آماده‌سازی publish اولیه
5. انتشار رسمی و بازرسی پس از deploy

## نتیجهٔ انتظار‌دار
- کد محصول از تجربهٔ برندینگ جدا شود
- تیم‌ها مستقل روی بخش‌های خود کار کنند
- اجرای publish اولیه پایدارتر و حرفه‌ای‌تر باشد

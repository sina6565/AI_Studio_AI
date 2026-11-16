# Apps

کدهای اجرایی وب و موبایل پروژه در حال حاضر در پوشه‌های ریشه قرار دارند:

- `frontend/` — اپلیکیشن وب React و Vite
- `mobile/` — اپلیکیشن React Native

پوشه‌های زیر در `apps/` قرار دارند:

- `product-web/`
- `cinematic-site/`
- `mobile-product/`
- `mobile-brand/`

در هر چهار مسیر، فایل معرفی وجود دارد؛ اما `package.json` مستقل برای هیچ‌کدام ثبت نشده است. ورودی اجرا و اسکریپت build آن‌ها نیز در این مسیرها تعریف نشده است.

صفحهٔ سینمایی وب در `frontend/src/pages/UniverseLanding.tsx` و اجزای صحنه در `frontend/src/components/universe/` قرار دارند. صفحه‌ها و مسیرهای اپلیکیشن موبایل در `mobile/src/` قرار دارند.

برای اجرا و توسعه، از package و دستورهای همان پوشه‌های `frontend/` و `mobile/` استفاده کنید.
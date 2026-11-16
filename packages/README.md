# Packages

در حال حاضر package مستقل و قابل نصب در این پوشه ثبت نشده است.

نام‌هایی مانند `shared-ui`، `shared-api`، `shared-i18n`، `shared-types` و `design-system` در این مخزن package اجرایی محسوب نمی‌شوند؛ برای هیچ‌کدام manifest مستقل و ورودی build ثبت نشده است.

وابستگی‌ها و دستورهای نصب و build فعلی در این پروژه از فایل‌های زیر خوانده می‌شوند:

- `frontend/package.json`
- `backend/package.json`
- `mobile/package.json`

تا زمانی که packageای با manifest، ورودی، وابستگی و اسکریپت‌های معتبر اضافه نشده، کد اجرایی نباید از مسیرهای فرضی داخل `packages/` import شود.
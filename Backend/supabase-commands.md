# تشغيل أوامر Supabase بدون تثبيت CLI عالمي

استخدم **npx** أمام كل أمر (لأن `supabase` غير مدعوم كتثبيت عام عبر npm):

```powershell
cd "D:\App\v.2-ok run\SupabaseApp\Backend"
```

### 1) تسجيل الدخول (مرة واحدة)
```powershell
npx supabase login
```
يفتح المتصفح لتسجيل الدخول.

### 2) ربط المشروع (مرة واحدة)
```powershell
npx supabase link --project-ref rtxleteymcqmtzrozckh
```

### 3) تطبيق الترحيلات على قاعدة البيانات
```powershell
npx supabase db push
```

### 4) نشر دالة hse-api
```powershell
npx supabase functions deploy hse-api
```

---

**بديل:** تثبيت CLI عبر Scoop (إن كان مثبتاً):
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```
بعدها يمكنك استخدام `supabase` مباشرة بدون `npx`.

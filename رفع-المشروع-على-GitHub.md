# رفع المشروع على GitHub

تم تهيئة المشروع كـ Git وجاهز للرفع.

## الخطوات

### 1. إنشاء مستودع جديد على GitHub

1. ادخل إلى [github.com/new](https://github.com/new)
2. اختر اسم المستودع (مثلاً: `SupabaseApp` أو `hse-management-system`)
3. اختر **Public**
4. **لا** تضف README أو .gitignore أو رخصة (المشروع يحتوي عليها مسبقاً)
5. اضغط **Create repository**

### 2. ربط المشروع ورفعه

من مجلد المشروع نفّذ (استبدل `YOUR_USERNAME` و `REPO_NAME` باسمك واسم المستودع):

```powershell
cd "d:\Apps\2026\SupabaseApp"

# إضافة المستودع البعيد
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# رفع الفرع main
git push -u origin main
```

**مثال:** إذا كان المستودع `https://github.com/yasser/SupabaseApp`:

```powershell
git remote add origin https://github.com/yasser/SupabaseApp.git
git push -u origin main
```

### 3. المصادقة

- إذا طُلب منك تسجيل الدخول، استخدم **GitHub username** و **Personal Access Token** (كلمة المرور لا تعمل).
- لإنشاء Token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (مع صلاحية `repo`).

---

بعد الرفع، يمكنك ربط المشروع بـ Vercel أو Netlify من خلال ربط المستودع في لوحة التحكم.

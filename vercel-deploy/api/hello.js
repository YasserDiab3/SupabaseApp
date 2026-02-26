// نموذج لـ Vercel Serverless Function (الخلفية)
// يُستدعى على: GET /api/hello
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    message: 'مرحباً من واجهة الخلفية (Vercel API)',
    timestamp: new Date().toISOString(),
  });
}

// src/services/email.service.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || '"DevLearn" <noreply@devlearn.vn>';

const baseTemplate = (body: string) => `
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/>
<style>
  body{font-family:'Segoe UI',sans-serif;background:#0a0a0f;margin:0;padding:0;}
  .wrap{max-width:560px;margin:32px auto;background:#16161f;border:1px solid #2a2a3d;border-radius:14px;overflow:hidden;}
  .header{background:linear-gradient(135deg,#00d4ff,#7c3aed);padding:28px 32px;}
  .header h1{margin:0;color:#000;font-size:22px;font-weight:700;}
  .body{padding:28px 32px;color:#e2e8f0;font-size:15px;line-height:1.7;}
  .btn{display:inline-block;margin-top:20px;padding:12px 28px;background:#00d4ff;color:#000;border-radius:9px;text-decoration:none;font-weight:700;}
  .footer{padding:16px 32px;font-size:12px;color:#64748b;border-top:1px solid #1e1e2e;}
</style>
</head><body>
<div class="wrap">
  <div class="header"><h1>⌨ DevLearn</h1></div>
  <div class="body">${body}</div>
  <div class="footer">© ${new Date().getFullYear()} DevLearn · Nền tảng học lập trình</div>
</div>
</body></html>`;

export async function sendWelcomeEmail(email: string, name: string) {
  await transporter.sendMail({
    from: FROM, to: email,
    subject: '🎉 Chào mừng bạn đến với DevLearn!',
    html: baseTemplate(`
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Chào mừng bạn đến với <strong>DevLearn</strong> — nền tảng học lập trình cho cộng đồng Việt Nam!</p>
      <p>Bạn đã sẵn sàng để bắt đầu hành trình code của mình chưa? Khám phá các khóa học từ Python, React đến Cloud ngay hôm nay.</p>
      <a href="${process.env.FRONTEND_URL}/courses" class="btn">Khám phá khóa học →</a>
    `),
  });
}

export async function sendPurchaseConfirmEmail(email: string, name: string, order: any) {
  const items = order.items?.map((i: any) => `<li>${i.course?.title || 'Khóa học'}</li>`).join('') || '';
  await transporter.sendMail({
    from: FROM, to: email,
    subject: '✅ Xác nhận thanh toán thành công — DevLearn',
    html: baseTemplate(`
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Thanh toán của bạn đã được xác nhận thành công! 🎉</p>
      <p><strong>Mã đơn hàng:</strong> <code>${order.id}</code></p>
      <p><strong>Khóa học đã mua:</strong></p>
      <ul>${items}</ul>
      <p><strong>Tổng thanh toán:</strong> ${order.totalAmount?.toLocaleString('vi-VN')}đ</p>
      <p>Bạn có thể bắt đầu học ngay bây giờ!</p>
      <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Vào học ngay →</a>
    `),
  });
}

export async function sendCertificateEmail(email: string, name: string, courseName: string, certCode: string) {
  await transporter.sendMail({
    from: FROM, to: email,
    subject: `🏆 Chứng chỉ hoàn thành: ${courseName}`,
    html: baseTemplate(`
      <p>Xin chào <strong>${name}</strong>,</p>
      <p>Chúc mừng! Bạn đã hoàn thành xuất sắc khóa học <strong>${courseName}</strong>.</p>
      <p><strong>Mã chứng chỉ:</strong> <code>${certCode}</code></p>
      <p>Hãy chia sẻ thành tích này với mọi người!</p>
      <a href="${process.env.FRONTEND_URL}/certificate/${certCode}" class="btn">Xem chứng chỉ →</a>
    `),
  });
}

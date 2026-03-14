import nodemailer from "nodemailer";

// ✅ Create transporter INSIDE functions (not at module level)
// This ensures env vars are already loaded when transporter is created
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendResetEmail = async (toEmail, resetURL) => {
  const transporter = createTransporter(); // ✅ created fresh each time

  const mailOptions = {
    from: `"Tomato 🍅" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: auto; background: #FFFDF9; border: 1px solid #EDE8DF; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444, #f97316); padding: 32px 36px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: white;"></div>
            <span style="font-size: 24px; font-weight: 900; color: white;">Tomato</span>
          </div>
          <h1 style="color: white; font-size: 24px; font-weight: 900; margin: 20px 0 6px;">Password Reset</h1>
          <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0;">You requested a password reset.</p>
        </div>
        <div style="padding: 32px 36px;">
          <p style="font-size: 15px; color: #4A3F34; line-height: 1.7; margin: 0 0 24px;">
            Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.
          </p>
          <a href="${resetURL}"
            style="display: block; text-align: center; background: #ef4444; color: white; font-size: 15px; font-weight: 700; padding: 14px 24px; border-radius: 12px; text-decoration: none;">
            Reset Password 🔐
          </a>
          <p style="margin-top: 20px; font-size: 13px; color: #9C9088;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        <div style="padding: 20px 36px; border-top: 1px solid #EDE8DF; text-align: center;">
          <p style="font-size: 12px; color: #9C9088; margin: 0;">
            © Tomato — <a href="${process.env.FRONTEND_URL}" style="color: #ef4444; text-decoration: none;">tomato.app</a>
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendWelcomeEmail = async (toEmail, name) => {
  const transporter = createTransporter(); // ✅ created fresh each time

  const mailOptions = {
    from: `"Tomato 🍅" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Welcome to Tomato! 🎉",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: auto; background: #FFFDF9; border: 1px solid #EDE8DF; border-radius: 16px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ef4444, #f97316); padding: 32px 36px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: white; opacity: 0.9;"></div>
            <span style="font-size: 24px; font-weight: 900; color: white; letter-spacing: -0.5px;">Tomato</span>
          </div>
          <h1 style="color: white; font-size: 26px; font-weight: 900; margin: 20px 0 6px;">
            Welcome, ${name}! 🎉
          </h1>
          <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0;">
            Your account has been created successfully.
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 36px;">
          <p style="font-size: 15px; color: #4A3F34; line-height: 1.7; margin: 0 0 24px;">
            Hi <strong>${name}</strong>, we're thrilled to have you on board! 
            Here's what you can do on Tomato:
          </p>

          <!-- Features -->
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px;">
            ${[
              ["🚀", "30-min delivery", "Lightning fast to your door"],
              ["🍽️", "200+ restaurants", "Curated local favourites"],
              ["💳", "Secure payments", "Razorpay powered checkout"],
              ["⭐", "Top-rated picks", "Loved by thousands"],
            ]
              .map(
                ([icon, title, sub]) => `
              <div style="display: flex; align-items: center; gap: 14px; background: white; border: 1px solid #EDE8DF; border-radius: 12px; padding: 12px 16px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: #FFF0F0; border: 1px solid #FECACA; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
                  ${icon}
                </div>
                <div>
                  <p style="margin: 0; font-size: 13px; font-weight: 700; color: #1A1208;">${title}</p>
                  <p style="margin: 2px 0 0; font-size: 12px; color: #9C9088;">${sub}</p>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>

         <!-- CTA Button -->
          <a href="${process.env.FRONTEND_URL}" style="display:block;text-align:center;background:#ef4444;color:white;font-size:15px;font-weight:700;padding:14px 24px;border-radius:12px;text-decoration:none;box-shadow:0 4px 12px rgba(239,68,68,0.3);">Start Ordering 🍕</a>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 36px; border-top: 1px solid #EDE8DF; text-align: center;">
          <p style="font-size: 12px; color: #9C9088; margin: 0;">
            You're receiving this because you created an account at
            <a href="${process.env.FRONTEND_URL}" style="color: #ef4444; text-decoration: none; font-weight: 600;">Tomato</a>.
          </p>
        </div>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

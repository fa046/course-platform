import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'SmartSkillify <noreply@smartskillify.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.smartskillify.com';

// ─────────────────────────────────────────────
// 1. ENROLLMENT CONFIRMATION
// Sent when: free course enrolled OR Paddle webhook fires
// ─────────────────────────────────────────────
export async function sendEnrollmentConfirmation({
  to,
  studentName,
  courseTitle,
  courseSlug,
}: {
  to: string;
  studentName: string;
  courseTitle: string;
  courseSlug: string;
}) {
  const learnUrl = `${APP_URL}/learn/${courseSlug}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `You're enrolled in ${courseTitle} 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:#2E4057;padding:32px 40px;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">SmartSkillify</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#2E4057;font-size:22px;">You're in, ${studentName}! 🎉</h2>
                    <p style="margin:0 0 12px;color:#444;font-size:16px;line-height:1.6;">
                      You've successfully enrolled in <strong>${courseTitle}</strong>. Your learning journey starts now.
                    </p>
                    <p style="margin:0 0 32px;color:#444;font-size:16px;line-height:1.6;">
                      Click below to go straight to your course.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#048A81;border-radius:8px;">
                          <a href="${learnUrl}"
                             style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">
                            Start Learning →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #eee;margin:0;"></td></tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;">
                    <p style="margin:0;color:#999;font-size:13px;line-height:1.6;">
                      You're receiving this because you enrolled on SmartSkillify.<br>
                      <a href="${APP_URL}" style="color:#048A81;text-decoration:none;">smartskillify.com</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
}


// ─────────────────────────────────────────────
// 2. LOCAL PAYMENT RECEIVED (pending review)
// Sent when: student submits JazzCash/Easypaisa/bank proof
// ─────────────────────────────────────────────
export async function sendLocalPaymentReceived({
  to,
  studentName,
  courseTitle,
  paymentMethod,
  amount,
}: {
  to: string;
  studentName: string;
  courseTitle: string;
  paymentMethod: string;
  amount: number;
}) {
  const methodLabel =
    paymentMethod === 'jazzcash' ? 'JazzCash' :
    paymentMethod === 'easypaisa' ? 'Easypaisa' :
    'Bank Transfer';

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payment received — we're reviewing your enrollment`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:#2E4057;padding:32px 40px;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">SmartSkillify</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="margin:0 0 16px;color:#2E4057;font-size:22px;">Payment received, ${studentName} ✅</h2>
                    <p style="margin:0 0 24px;color:#444;font-size:16px;line-height:1.6;">
                      We've received your payment details for <strong>${courseTitle}</strong> and your enrollment is currently under review.
                    </p>

                    <!-- Payment summary box -->
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;margin-bottom:24px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color:#666;font-size:14px;padding-bottom:8px;">Course</td>
                              <td style="color:#2E4057;font-size:14px;font-weight:600;text-align:right;padding-bottom:8px;">${courseTitle}</td>
                            </tr>
                            <tr>
                              <td style="color:#666;font-size:14px;padding-bottom:8px;">Amount</td>
                              <td style="color:#2E4057;font-size:14px;font-weight:600;text-align:right;padding-bottom:8px;">PKR ${amount.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td style="color:#666;font-size:14px;">Payment Method</td>
                              <td style="color:#2E4057;font-size:14px;font-weight:600;text-align:right;">${methodLabel}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 12px;color:#444;font-size:16px;line-height:1.6;">
                      Our team will verify your payment within <strong>24 hours</strong>. Once approved, you'll receive another email with access to your course.
                    </p>
                    <p style="margin:0;color:#444;font-size:16px;line-height:1.6;">
                      If you have any questions, just reply to this email.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #eee;margin:0;"></td></tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;">
                    <p style="margin:0;color:#999;font-size:13px;line-height:1.6;">
                      You're receiving this because you submitted a payment on SmartSkillify.<br>
                      <a href="${APP_URL}" style="color:#048A81;text-decoration:none;">smartskillify.com</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
}


// ─────────────────────────────────────────────
// 3. COURSE COMPLETION
// Sent when: all lessons in a course are completed (100%)
// ─────────────────────────────────────────────
export async function sendCourseCompletion({
  to,
  studentName,
  courseTitle,
  courseSlug,
}: {
  to: string;
  studentName: string;
  courseTitle: string;
  courseSlug: string;
}) {
  const certificateUrl = `${APP_URL}/certificate/${courseSlug}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `You completed ${courseTitle} 🏆`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:#2E4057;padding:32px 40px;text-align:center;">
                    <h1 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:700;">SmartSkillify</h1>
                    <p style="margin:0;color:#a8c5da;font-size:14px;">Certificate of Completion</p>
                  </td>
                </tr>

                <!-- Trophy -->
                <tr>
                  <td style="padding:40px 40px 24px;text-align:center;">
                    <div style="font-size:64px;line-height:1;">🏆</div>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:0 40px 40px;text-align:center;">
                    <h2 style="margin:0 0 16px;color:#2E4057;font-size:26px;">Congratulations, ${studentName}!</h2>
                    <p style="margin:0 0 8px;color:#444;font-size:16px;line-height:1.6;">
                      You've successfully completed
                    </p>
                    <p style="margin:0 0 32px;color:#2E4057;font-size:20px;font-weight:700;">
                      ${courseTitle}
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="background:#048A81;border-radius:8px;">
                          <a href="${certificateUrl}"
                             style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">
                            View Your Certificate →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:32px 0 0;color:#666;font-size:14px;line-height:1.6;">
                      Share your achievement and keep building on what you've learned.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #eee;margin:0;"></td></tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 40px;text-align:center;">
                    <p style="margin:0;color:#999;font-size:13px;line-height:1.6;">
                      You're receiving this because you completed a course on SmartSkillify.<br>
                      <a href="${APP_URL}" style="color:#048A81;text-decoration:none;">smartskillify.com</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
}
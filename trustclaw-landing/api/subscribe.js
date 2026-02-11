// Vercel serverless function for TrustClaw email waitlist
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    
    // Simple email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Log to Vercel (visible in dashboard logs)
    console.log(`🎉 NEW TRUSTCLAW SIGNUP: ${email} at ${new Date().toISOString()}`);

    // Send confirmation email to user
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrustClaw <onboarding@resend.dev>',
        to: [email],
        subject: '🔒 Welcome to TrustClaw - You\'re on the list!',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #06080c; color: #e8ecf4;">
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 32px;">🔒</span>
              <h1 style="font-family: monospace; font-size: 28px; margin: 16px 0 0; color: #00e87b;">TrustClaw</h1>
              <p style="color: #6b7a94; margin-top: 8px;">The safe side of OpenClaw</p>
            </div>
            
            <div style="background: #0f1420; border: 1px solid #1a2235; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <h2 style="font-size: 24px; margin: 0 0 16px; color: #e8ecf4;">You're on the list! 🎉</h2>
              <p style="color: #6b7a94; line-height: 1.6; margin: 0;">
                Thanks for joining the TrustClaw waitlist. You'll be among the first to get access when we launch.
              </p>
            </div>
            
            <div style="background: #0f1420; border: 1px solid #1a2235; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
              <h3 style="font-size: 16px; margin: 0 0 16px; color: #00e87b;">What's coming:</h3>
              <ul style="color: #6b7a94; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Security-verified OpenClaw skills</li>
                <li>Publisher verification & staking</li>
                <li>$TCLAW token for the skill economy</li>
                <li>Community trust & reputation system</li>
              </ul>
            </div>
            
            <div style="text-align: center; padding-top: 24px; border-top: 1px solid #1a2235;">
              <p style="color: #3a4560; font-size: 12px; margin: 0;">
                TrustClaw · by Miyamoto Labs<br>
                <a href="https://trustclaw-landing.vercel.app" style="color: #00e87b;">trustclaw-landing.vercel.app</a>
              </p>
            </div>
          </div>
        `,
      }),
    });

    // Send notification to admin (separate email, more reliable than BCC)
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrustClaw Alerts <onboarding@resend.dev>',
        to: ['trustclawsecurity@proton.me'],
        subject: `🚀 New TrustClaw signup: ${email}`,
        html: `
          <div style="font-family: monospace; padding: 20px; background: #0f1420; color: #e8ecf4;">
            <h2 style="color: #00e87b; margin: 0 0 16px;">New Waitlist Signup!</h2>
            <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0 0; color: #6b7a94;"><strong>Time:</strong> ${new Date().toISOString()}</p>
          </div>
        `,
      }),
    });

    return res.status(200).json({ success: true, message: "You're on the list!" });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

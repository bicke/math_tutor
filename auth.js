export default function handler(req, res) {
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
    const { password } = req.body;
    
    // 環境変数からパスワードを取得
    const correctPassword = process.env.SITE_PASSWORD || 'bicke316';
    
    if (password === correctPassword) {
      // 認証成功
      return res.status(200).json({ 
        success: true, 
        message: 'Authentication successful',
        token: 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      });
    } else {
      // 認証失敗
      return res.status(401).json({ 
        success: false, 
        message: 'パスワードが正しくありません' 
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
}

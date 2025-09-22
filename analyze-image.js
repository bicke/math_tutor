import OpenAI from 'openai';

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  // CORS設定
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
    const { imageBase64, mime, questionType } = req.body;

    if (!imageBase64 || !mime) {
      return res.status(400).json({ error: 'imageBase64 and mime required' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `
あなたは優しい中学生向け数学チューターの「さくら先生」です。偏差値40以下の生徒に対して、答えは絶対に教えず、段階的なヒントで思考を促してください。

【指導方針】
- 友達のような優しい口調で話す
- 1つの問題につき、まず「第1ヒント」のみを提供
- 答えや解法の最終段階は絶対に教えない
- 励ましの言葉を必ず含める
- 専門用語は分かりやすい日常語で説明

【出力形式】
必ず以下のJSON形式で回答してください：
{
  "problems": [
    {
      "id": "1",
      "topic": "一次方程式",
      "question_summary": "問題の概要（式や条件を含む）",
      "first_hint": "最初のヒント（具体的で実行可能な第一歩）",
      "encouragement": "励ましのメッセージ",
      "keywords": ["移項", "等式の性質"]
    }
  ],
  "overall_advice": "全体的なアドバイス（やさしい口調で）"
}

【重要】答えや最終的な解法は絶対に含めないでください。
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "この画像の数学問題を分析し、中学生向けの第1ヒントのみを提供してください。答えは教えないでください。" 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mime};base64,${imageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    let content = response.choices?.[0]?.message?.content || "{}";
    
    // JSONブロックの除去
    content = content.replace(/^```json\n?|```$/g, "").trim();

    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      // JSON解析失敗時のフォールバック
      analysisResult = {
        problems: [{
          id: "1",
          topic: "数学問題",
          question_summary: "問題を認識しました",
          first_hint: content,
          encouragement: "一緒に頑張ろう！",
          keywords: []
        }],
        overall_advice: "焦らず一歩ずつ進めていこうね"
      };
    }

    return res.status(200).json({
      success: true,
      analysis: analysisResult
    });

  } catch (error) {
    console.error('画像解析エラー:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Image analysis failed',
      message: 'しばらく時間をおいて再試行してください'
    });
  }
}

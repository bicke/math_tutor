import OpenAI from 'openai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const { unit, difficulty, problemType, examPrep } = req.body;

    const systemPrompt = `
あなたは「さくら先生」として、指導要領準拠の数学問題を作成してください。

【問題作成要件】
単元: ${unit}
難易度: ${difficulty}
問題形式: ${problemType}
入試対応: ${examPrep ? 'あり' : 'なし'}

【作成ルール】
1. 偏差値40レベルの生徒が挑戦できる適切な難易度
2. 段階的ヒントで思考を促し、答えは直接教えない
3. 励ましの言葉を必ず含める
4. 指導要領の学習目標に明確に対応

【出力形式】
{
  "problems": [
    {
      "id": "問題ID",
      "unit": "${unit}",
      "question": "問題文",
      "problem_type": "${problemType}",
      "difficulty_level": ${difficulty},
      "hints": [
        {
          "level": 1,
          "text": "第1ヒント",
          "timing": "immediate"
        },
        {
          "level": 2,
          "text": "第2ヒント", 
          "timing": "after_30_seconds"
        }
      ],
      "solution_steps": ["解法手順1", "解法手順2"],
      "correct_answer": "正解",
      "curriculum_alignment": "指導要領対応箇所",
      "exam_relevance": "入試出題頻度",
      "estimated_time": 5,
      "encouragement": "励ましメッセージ"
    }
  ],
  "teacher_comment": "さくら先生からのコメント"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `${unit}の${difficulty}レベルの問題を1問作成してください。` 
        }
      ],
      max_tokens: 1500,
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    let content = response.choices?.[0]?.message?.content || "{}";
    const problems = JSON.parse(content);

    return res.status(200).json({
      success: true,
      problems: problems,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('問題生成エラー:', error);
    return res.status(500).json({
      success: false,
      error: 'Problem generation failed'
    });
  }
}

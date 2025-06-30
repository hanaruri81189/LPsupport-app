// Vercel Serverless Functions (Node.js)
// Node.js 18以降では組み込みのfetchが利用可能です。

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { concept } = request.body;

  if (!concept) {
    return response.status(400).json({ error: 'Concept is required' });
  }

  // Vercelの環境変数からAPIキーを取得
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
  const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const prompt = `あなたは女性向けのブランドコンサルタントです。以下のコンセプトに基づいて、デザイン提案、キャッチコピー提案、ボディコピーをJSON形式で生成してください。JSON形式のオブジェクトのみを出力し、それ以外のテキストや説明は一切含めないでください。また、JSON内の文字列はすべて適切にエスケープしてください（例: ダブルクォーテーションは \"、改行は \n）。\n\nコンセプト: ${concept}\n\n出力形式:\n{\n  "design_proposal": "[デザインに関する具体的な提案]",\n  "catchphrase_proposals": "[キャッチコピー1]", "[キャッチコピー2]", "[キャッチコピー3]"],\n  "body_copy": "[詳細なボディコピー]"\n}`;

    const geminiResponse = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API Error:', errorData);
      return response.status(geminiResponse.status).json({ 
        error: 'Failed to get response from Gemini API', 
        details: errorData 
      });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates[0].content.parts[0].text;

    // Geminiからの応答がMarkdownコードブロック形式の場合を考慮してパース
    let parsedData;
    try {
        const jsonString = responseText.replace(/^```json\n|\\n```$/g, '');
        parsedData = JSON.parse(jsonString);
    } catch (jsonError) {
        console.error('JSON parsing error from Gemini response:', jsonError);
        console.error('Raw Gemini response text:', responseText);
        // パースに失敗した場合でも、生のテキストをボディコピーとして返すなどのフォールバックも検討可能
        return response.status(500).json({ 
            error: 'Failed to parse Gemini response JSON', 
            rawResponse: responseText 
        });
    }

    response.status(200).json(parsedData);

  } catch (error) {
    console.error('Serverless function error:', error);
    response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
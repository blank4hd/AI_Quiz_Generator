import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  content: string;
  type: 'generate' | 'add' | 'regenerate';
  options: {
    count?: number;
    difficulty?: string;
    topic?: string;
    existingQuestion?: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, type, options }: GenerateRequest = await req.json();
    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY not configured');
    }

    console.log(`Processing ${type} request with ${options.count || 1} questions`);

    let systemPrompt = `You are an expert quiz creator. Generate high-quality quiz questions based on the provided content.

Return ONLY a valid JSON array with this exact structure (no additional text):
[
  {
    "type": "mcq",
    "stem": "Question text here?",
    "options": [
      {"id": "opt1", "text": "Option A", "isCorrect": false},
      {"id": "opt2", "text": "Option B", "isCorrect": true},
      {"id": "opt3", "text": "Option C", "isCorrect": false},
      {"id": "opt4", "text": "Option D", "isCorrect": false}
    ],
    "explanation": "Why the correct answer is correct and others are wrong.",
    "difficulty": "medium",
    "sourceReference": "Reference to source material"
  }
]

Rules:
- type must be "mcq", "true-false", or "short-answer"
- For MCQ: provide 4 options, exactly one isCorrect: true
- For true-false: provide 2 options (True/False)
- For short-answer: provide empty options array
- difficulty must be "easy", "medium", or "hard"
- Each question must have a clear explanation
- Questions should test understanding, not just memorization`;

    let userPrompt = '';

    if (type === 'generate') {
      userPrompt = `Generate ${options.count || 5} diverse quiz questions from this content:\n\n${content}\n\nMix question types and difficulties.`;
    } else if (type === 'add') {
      userPrompt = `Generate ${options.count || 3} quiz questions about "${options.topic}" based on this content:\n\n${content}\n\nFocus specifically on the topic: ${options.topic}`;
    } else if (type === 'regenerate') {
      userPrompt = `Generate 1 new quiz question to replace this one:\n\nOriginal question: ${JSON.stringify(options.existingQuestion)}\n\nSource content:\n${content}\n\nCreate a different question about the same topic.`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI is processing too many requests. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response structure:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'AI returned an invalid response. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!generatedText.trim()) {
      console.error('Empty response from Gemini');
      return new Response(
        JSON.stringify({ error: 'AI returned an empty response. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract JSON from response (sometimes wrapped in markdown)
    let jsonText = generatedText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
    }

    let questions;
    try {
      questions = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini:', jsonText);
      return new Response(
        JSON.stringify({ 
          error: 'AI returned invalid JSON. Please try again.',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('Questions is not an array or is empty:', questions);
      return new Response(
        JSON.stringify({ error: 'AI did not generate any questions. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add unique IDs to questions and options
    const questionsWithIds = questions.map((q: any) => ({
      ...q,
      id: crypto.randomUUID(),
      options: q.options.map((opt: any, idx: number) => ({
        ...opt,
        id: opt.id || `opt${idx + 1}`
      }))
    }));

    console.log(`Successfully generated ${questionsWithIds.length} questions`);

    return new Response(
      JSON.stringify({ questions: questionsWithIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in gemini-generate function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate questions'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

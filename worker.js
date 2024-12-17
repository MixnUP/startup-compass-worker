export default {
    async fetch(request, env) {
      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Content-Type': 'application/json'
      };
  
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      // Only POST method
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
          status: 405, 
          headers: corsHeaders 
        });
      }
  
      try {
        // Parse input
        const params = await request.json();
  
        // Generate report 
        const report = await generateBusinessReport(env, params);
  
        // Return successful response
        return new Response(JSON.stringify(report), { 
          headers: corsHeaders 
        });
  
      } catch (error) {
        // Handle errors
        return new Response(JSON.stringify({ 
          error: 'Invalid request',
          details: error instanceof Error ? error.message : 'Unknown error'
        }), { 
          status: 400, 
          headers: corsHeaders 
        });
      }
    }
  };
  
  async function generateBusinessReport(env, params) {
    // Basic calculations
    const revenueGrowth = calculateRevenueGrowth(params.currentAnnualRevenue, params.targetAnnualRevenue);
    const profitMarginImprovement = calculateProfitMarginImprovement(params.currentProfitMargin, params.targetProfitMargin);
  
    // Fallback recommendations if AI is not available
    let aiGeneratedReport = "No AI insights available";
  
    // Check if AI is configured and available
    if (env.AI && typeof env.AI.run === 'function') {
      try {
        // Prepare AI prompt
        const aiPrompt = `
          Generate strategic business recommendations based on these metrics:
          - Current Annual Revenue: $${params.currentAnnualRevenue}
          - Target Annual Revenue: $${params.targetAnnualRevenue}
          - Current Profit Margin: ${(params.currentProfitMargin * 100).toFixed(2)}%
          - Target Profit Margin: ${(params.targetProfitMargin * 100).toFixed(2)}%
          - Revenue Growth Projection: ${revenueGrowth.toFixed(2)}%
          - Profit Margin Improvement: ${profitMarginImprovement.toFixed(2)} percentage points
  
          Provide:
          1. Detailed strategic recommendations
          2. Potential risks to consider
          3. Actionable insights for achieving these goals
        `;
  
        // Use Cloudflare Worker AI to generate recommendations
        const aiResponse = await env.AI.run(
          '@cf/meta/llama-2-7b-chat-int8',
          { messages: [{ role: 'user', content: aiPrompt }] }
        );
  
        aiGeneratedReport = aiResponse.response || "AI generated no specific insights";
      } catch (aiError) {
        console.error("AI generation error:", aiError);
        aiGeneratedReport = "Error generating AI insights: " + aiError.message;
      }
    }
  
    return {
      revenueGrowth,
      profitMarginImprovement,
      aiGeneratedReport,
      recommendations: [
        'Explore new market opportunities',
        'Optimize operational costs'
      ],
      risks: [
        'Market volatility',
        'Competitive landscape changes'
      ],
      rawParams: params
    };
  }
  
  function calculateRevenueGrowth(current, target) {
    return ((target - current) / current) * 100;
  }
  
  function calculateProfitMarginImprovement(current, target) {
    return (target - current) * 100;
  }
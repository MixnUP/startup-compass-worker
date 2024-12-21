export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type', // Add this line
      'Content-Type': 'application/json'
    };
    
    // Modify the OPTIONS handler to include these headers
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        headers: corsHeaders 
      });
    }

    // Parse URL to determine routing
    const url = new URL(request.url);

    // Route to comprehensive business analysis for specific path
    if (url.pathname === '/business-analysis' && request.method === 'POST') {
      return this.comprehensiveBusinessAnalysis(request, env);
    }

    // Route to business insights generation for specific path
    if (url.pathname === '/business-insights' && request.method === 'POST') {
      return this.generateBusinessInsights(request, env);
    }

    // Existing GET method logic
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    try {
      // Parse URL parameters
      const params = {
        current_revenue: url.searchParams.get('current_revenue'),
        previous_revenue: url.searchParams.get('previous_revenue'),
        total_expenses: url.searchParams.get('total_expenses'),
        customer_base: url.searchParams.get('customer_base'),
        months: url.searchParams.get('months') || '12',
        industry: url.searchParams.get('industry')
      };

      // Validate that all required parameters are present
      const requiredParams = [
        'current_revenue', 
        'previous_revenue', 
        'total_expenses', 
        'customer_base', 
        'industry'
      ];

      const missingParams = requiredParams.filter(param => 
        params[param] === null || params[param] === ''
      );

      if (missingParams.length > 0) {
        return new Response(JSON.stringify({ 
          error: 'Missing required parameters', 
          missing_params: missingParams 
        }), { 
          status: 400, 
          headers: corsHeaders 
        });
      }

      // Construct external API URL with exact parameters
      const externalApiUrl = new URL('https://startup-compass-api.onrender.com/trends/business-assessment');
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          externalApiUrl.searchParams.append(key, value);
        }
      });

      // Debugging: Log the external API URL
      console.log('External API URL:', externalApiUrl.toString());

      // Fetch data from external API
      const externalApiResponse = await fetch(externalApiUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!externalApiResponse.ok) {
        // Log the error response
        const errorText = await externalApiResponse.text();
        console.error('External API Error:', errorText);
        throw new Error(`Failed to fetch external API data: ${errorText}`);
      }

      const externalData = await externalApiResponse.json();

      // Generate report with external data and AI insights
      const report = await generateBusinessReport(env, {
        insights: {
          ...params,
          ...externalData
        }
      });

      // Return successful response
      return new Response(JSON.stringify(report), { 
        headers: corsHeaders 
      });

    } catch (error) {
      // Enhanced error logging
      console.error('Request processing error:', error);

      // Handle errors
      return new Response(JSON.stringify({ 
        error: 'Request processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },

  async comprehensiveBusinessAnalysis(request, env) {
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
  
    // Ensure POST method
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405, 
        headers: corsHeaders 
      });
    }
  
    try {
      // Parse request body
      const requestBody = await request.json();
  
      // Validate required parameters
      const requiredParams = [
        'businessName', 
        'industry', 
        'businessScale', 
        'location', 
        'currentAnnualRevenue', 
        'targetAnnualRevenue', 
        'currentProfitMargin', 
        'targetProfitMargin', 
        'businessGoals', 
        'keyChallenges'
      ];
  
      const missingParams = requiredParams.filter(param => 
        !requestBody[param] || requestBody[param] === ''
      );
  
      if (missingParams.length > 0) {
        return new Response(JSON.stringify({ 
          error: 'Missing required parameters', 
          missing_params: missingParams 
        }), { 
          status: 400, 
          headers: corsHeaders 
        });
      }
  
      // Prepare a more concise AI prompt
      const aiPrompt = `
        Provide a strategic business analysis for ${requestBody.businessName}, a ${requestBody.businessScale} ${requestBody.industry} business in ${requestBody.location}.

        Business Context:
        - Current Annual Revenue: $${Number(requestBody.currentAnnualRevenue).toLocaleString()}
        - Target Annual Revenue: $${Number(requestBody.targetAnnualRevenue).toLocaleString()}
        - Current Profit Margin: ${(requestBody.currentProfitMargin * 100).toFixed(2)}%
        - Target Profit Margin: ${(requestBody.targetProfitMargin * 100).toFixed(2)}%

        Business Goals: ${requestBody.businessGoals}
        Key Challenges: ${requestBody.keyChallenges}

        Analysis Focus:
        1. Identify 2-3 key strategic growth opportunities
        2. Suggest practical strategies to address main challenges
        3. Provide concise recommendations for business improvement

        Deliver insights that are actionable and directly relevant to the business's current situation.
      `;
  
      // Generate comprehensive analysis using AI
      let comprehensiveAnalysis = {
        growth_opportunities: [],
        strategic_recommendations: []
      };

      if (env.AI && typeof env.AI.run === 'function') {
        try {
          // First AI call - Growth Opportunities
          const growthPrompt = `
            Identify strategic growth opportunities for ${requestBody.businessName}, 
            a ${requestBody.businessScale} ${requestBody.industry} business.

            Business Context:
            - Current Annual Revenue: $${Number(requestBody.currentAnnualRevenue).toLocaleString()}
            - Target Annual Revenue: $${Number(requestBody.targetAnnualRevenue).toLocaleString()}

            Business Goals: ${requestBody.businessGoals}

            Focus:
            1. Identify 2-3 most promising growth opportunities
            2. Explain potential impact on business performance
            3. Provide brief rationale for each opportunity
          `;

          const growthResponse = await env.AI.run(
            '@cf/meta/llama-2-7b-chat-int8',
            { messages: [{ role: 'user', content: growthPrompt }] }
          );

          // Second AI call - Strategic Recommendations
          const recommendationPrompt = `
            Provide strategic recommendations for ${requestBody.businessName}

            Key Challenges: ${requestBody.keyChallenges}
            Current Profit Margin: ${(requestBody.currentProfitMargin * 100).toFixed(2)}%
            Target Profit Margin: ${(requestBody.targetProfitMargin * 100).toFixed(2)}%

            Focus:
            1. Suggest practical strategies to address main challenges
            2. Recommend ways to improve business performance
            3. Provide actionable, concise insights
          `;

          const recommendationResponse = await env.AI.run(
            '@cf/meta/llama-2-7b-chat-int8',
            { messages: [{ role: 'user', content: recommendationPrompt }] }
          );

          // Process growth opportunities
          if (growthResponse.response) {
            comprehensiveAnalysis.growth_opportunities = growthResponse.response.split('\n')
              .filter(insight => insight.trim() !== '')
              .map(insight => insight.replace(/^\d+\.\s*/, '').trim());
          }

          // Process strategic recommendations
          if (recommendationResponse.response) {
            comprehensiveAnalysis.strategic_recommendations = recommendationResponse.response.split('\n')
              .filter(insight => insight.trim() !== '')
              .map(insight => insight.replace(/^\d+\.\s*/, '').trim());
          }

        } catch (aiError) {
          console.error("AI generation error:", aiError);
        }
      }
  
      // Prepare more concise response
      const analysisResponse = {
        business_name: requestBody.businessName,
        key_metrics: {
          current_annual_revenue: Number(requestBody.currentAnnualRevenue),
          target_annual_revenue: Number(requestBody.targetAnnualRevenue),
          current_profit_margin: Number(requestBody.currentProfitMargin),
          target_profit_margin: Number(requestBody.targetProfitMargin)
        },
        strategic_insights: comprehensiveAnalysis
      };
  
      // Return successful response
      return new Response(JSON.stringify(analysisResponse), { 
        headers: corsHeaders 
      });
  
    } catch (error) {
      console.error('Comprehensive Business Analysis Error:', error);
  
      return new Response(JSON.stringify({ 
        error: 'Request processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  },

  async generateBusinessReport(env, params) {
    // Log the entire params object for debugging
    console.log('Params received in generateBusinessReport:', JSON.stringify(params, null, 2));

    // Extract insights data from the external API response
    const insightsData = params.business_metrics?.insights || params.insights;

    // Log the insights data
    console.log('Insights data:', JSON.stringify(insightsData, null, 2));

    // Prepare AI-generated additional insights
    let aiGeneratedInsights = [];

    // Check if insights data is valid
    if (!insightsData || typeof insightsData !== 'object') {
      console.error('Invalid or missing insights data');
      return {
        business_metrics: {},
        ai_insights: [],
        message: "Failed to process business assessment: Invalid insights data"
      };
    }

    // Merge insights from different possible locations
    const mergedInsights = {
      average_revenue_per_month: insightsData.average_revenue_per_month || 
        (params.business_metrics?.current_revenue ? 
          Number(params.business_metrics.current_revenue) / 
          (Number(params.business_metrics.months) || 12) : null),
      current_revenue: insightsData.current_revenue || params.business_metrics?.current_revenue,
      previous_revenue: insightsData.previous_revenue || params.business_metrics?.previous_revenue,
      customer_base: insightsData.customer_base || params.business_metrics?.customer_base,
      growth_rate: insightsData.growth_rate || 
        (insightsData.current_revenue && insightsData.previous_revenue ? 
          ((Number(insightsData.current_revenue) - Number(insightsData.previous_revenue)) / 
          Number(insightsData.previous_revenue) * 100) : null),
      profit_margin: insightsData.profit_margin || 
        (insightsData.current_revenue && insightsData.total_expenses ? 
          ((Number(insightsData.current_revenue) - Number(insightsData.total_expenses)) / 
          Number(insightsData.current_revenue) * 100) : null),
      total_expenses: insightsData.total_expenses || params.business_metrics?.total_expenses,
      months: params.business_metrics?.months || 12
    };

    // Explicitly calculate average revenue per month
    if (mergedInsights.current_revenue && mergedInsights.months) {
      mergedInsights.average_revenue_per_month = 
        Number(mergedInsights.current_revenue) / Number(mergedInsights.months);
    }

    // Log the merged insights
    console.log('Merged Insights:', JSON.stringify(mergedInsights, null, 2));

    // Check if AI is configured and available
    if (env.AI && typeof env.AI.run === 'function') {
      try {
        // Prepare AI prompt for additional insights using the merged data
        const aiPrompt = `
          Provide strategic business insights for a business with the following metrics:
          - Average Monthly Revenue: $${Number(mergedInsights.average_revenue_per_month || 0).toFixed(2)}
          - Current Revenue: $${Number(mergedInsights.current_revenue || 0).toFixed(2)}
          - Previous Revenue: $${Number(mergedInsights.previous_revenue || 0).toFixed(2)}
          - Customer Base: ${Number(mergedInsights.customer_base || 0)}
          - Growth Rate: ${Number(mergedInsights.growth_rate || 0).toFixed(2)}%
          - Profit Margin: ${Number(mergedInsights.profit_margin || 0).toFixed(2)}%
          - Total Expenses: $${Number(mergedInsights.total_expenses || 0).toFixed(2)}

          Generate concise and actionable insights:
          1. Innovative growth strategies
          2. Potential risks and mitigation approaches
          3. Recommendations for scaling the business
          4. Emerging market opportunities
          5. Cost optimization suggestions
        `;

        // Generate additional insights using AI
        const aiResponse = await env.AI.run(
          '@cf/meta/llama-2-7b-chat-int8',
          { 
            messages: [{ role: 'user', content: aiPrompt }],
            max_tokens: 10000,  // Increased token limit
            temperature: 0.9   // Increased temperature for more creative responses
          }
        );

        // Process AI-generated insights
        if (aiResponse.response) {
          aiGeneratedInsights = aiResponse.response.split('\n')
            .filter(insight => insight.trim() !== '')
            .map(insight => insight.replace(/^\d+\.\s*/, '').trim());
          
          // Log AI insights for debugging
          console.log('Generated AI Insights:', aiGeneratedInsights);
        } else {
          console.error('No response from AI');
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError);
      }
    }

    return {
      business_metrics: {
        average_revenue_per_month: Number(mergedInsights.average_revenue_per_month || 0),
        current_revenue: Number(mergedInsights.current_revenue || 0),
        previous_revenue: Number(mergedInsights.previous_revenue || 0),
        customer_base: Number(mergedInsights.customer_base || 0),
        growth_rate: Number(mergedInsights.growth_rate || 0),
        profit_margin: Number(mergedInsights.profit_margin || 0),
        total_expenses: Number(mergedInsights.total_expenses || 0)
      },
      ai_insights: aiGeneratedInsights,
      message: "Business assessment completed with AI-enhanced strategic insights"
    };
  },

  async generateBusinessInsights(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
  
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
  
    try {
      // Parse the incoming request body
      const requestBody = await request.json();
      
      // Flexible parameter mapping with fallbacks
      const revenue = Number(requestBody.current_revenue || requestBody.revenue);
      const previousRevenue = Number(requestBody.previous_revenue || requestBody.previousRevenue);
      const totalExpenses = Number(requestBody.total_expenses || requestBody.totalExpenses);
      const customerBase = Number(requestBody.customer_base || requestBody.customerBase);
      const months = Number(requestBody.months || 12);
      const industry = requestBody.industry;
  
      // Validate input data with more comprehensive checks
      const missingParams = [];
      const invalidParams = [];
  
      // Check for missing parameters
      if (!revenue) missingParams.push('current_revenue');
      if (!previousRevenue) missingParams.push('previous_revenue');
      if (!totalExpenses) missingParams.push('total_expenses');
      if (!customerBase) missingParams.push('customer_base');
      if (!industry) missingParams.push('industry');
  
      // Validate numeric inputs
      if (isNaN(revenue) || revenue < 0) invalidParams.push('current_revenue');
      if (isNaN(previousRevenue) || previousRevenue <= 0) invalidParams.push('previous_revenue');
      if (isNaN(totalExpenses) || totalExpenses < 0) invalidParams.push('total_expenses');
      if (isNaN(customerBase) || customerBase < 0) invalidParams.push('customer_base');
  
      // Return error if any required parameters are missing or invalid
      if (missingParams.length > 0 || invalidParams.length > 0) {
        return new Response(JSON.stringify({
          error: 'Invalid input parameters',
          missing_params: missingParams,
          invalid_params: invalidParams
        }), { 
          status: 400, 
          headers: corsHeaders 
        });
      }
  
      // Calculate key business metrics
      const revenueGrowth = ((revenue - previousRevenue) / previousRevenue) * 100;
      const profitMargin = ((revenue - totalExpenses) / revenue) * 100;
      const customerGrowthRate = (customerBase / months) * 12; // Annualized growth rate
  
      // Use Cloudflare AI to generate insights with enhanced error handling
      let growthOpportunities = "No growth opportunities could be generated at this time.";
      let strategicRecommendations = "No strategic recommendations could be generated at this time.";
      
      try {
        // First AI call - Growth Opportunities
        const growthPrompt = `
          Identify 3 key growth opportunities for a ${industry} business:
          - Current Revenue: $${revenue.toLocaleString()}
          - Customer Base: ${customerBase}
          - Growth Rate: ${revenueGrowth.toFixed(2)}%

          Provide:
          - Specific, actionable growth strategies
          - Potential business impact
        `;

        // Second AI call - Strategic Recommendations
        const recommendationsPrompt = `
          Strategic recommendations for a ${industry} business:
          - Monthly Revenue: $${revenue.toLocaleString()}
          - Expenses: $${totalExpenses.toLocaleString()}
          - Profit Margin: ${profitMargin.toFixed(2)}%

          Focus on:
          - Top 3 ways to improve financial performance
          - Concise, practical business improvement steps
        `;

        // Generate growth opportunities
        const growthResponse = await env.AI.run(
          '@cf/meta/llama-2-7b-chat-int8', 
          { 
            messages: [{ role: 'user', content: growthPrompt }],
            max_tokens: 3000,
            temperature: 0.7
          }
        );

        // Generate strategic recommendations
        const recommendationsResponse = await env.AI.run(
          '@cf/meta/llama-2-7b-chat-int8', 
          { 
            messages: [{ role: 'user', content: recommendationsPrompt }],
            max_tokens: 3000,
            temperature: 0.7
          }
        );

        // Process growth opportunities
        growthOpportunities = growthResponse?.response?.trim() 
          || "Unable to generate growth opportunities at this time.";

        // Process strategic recommendations
        strategicRecommendations = recommendationsResponse?.response?.trim() 
          || "Unable to generate strategic recommendations at this time.";

      } catch (aiError) {
        console.error('AI Insight Generation Error:', aiError);
        growthOpportunities = "AI service encountered an error while generating growth opportunities.";
        strategicRecommendations = "AI service encountered an error while generating strategic recommendations.";
      }

      // Prepare the response with AI insights and calculated metrics
      const businessInsights = {
        metrics: {
          revenueGrowth,
          profitMargin,
          customerGrowthRate
        },
        growthOpportunities: growthOpportunities,
        strategicRecommendations: strategicRecommendations
      };
  
      return new Response(JSON.stringify(businessInsights), {
        headers: corsHeaders
      });
  
    } catch (error) {
      console.error('Business Insights Generation Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Business insights generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { 
        status: 500, 
        headers: corsHeaders 
      });
    }
  }
};

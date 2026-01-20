import { config } from "dotenv";

// Load environment variables
config();

async function testTogetherAI() {
  const apiKey = process.env.TOGETHER_API_KEY;
  const model = process.env.TOGETHER_AI_MODEL || "Qwen/Qwen2.5-72B-Instruct-Turbo";
  
  if (!apiKey) {
    console.error("❌ TOGETHER_API_KEY not found in .env file");
    process.exit(1);
  }
  
  console.log("Testing Together AI API...\n");
  console.log(`API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`Model: ${model}\n`);
  
  try {
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: "Say 'Hello, API is working!' and nothing else."
          }
        ],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}\n`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:");
      console.error(errorText);
      
      if (response.status === 503) {
        console.error("\n⚠️  Service Unavailable (503)");
        console.error("The Together AI API is temporarily down or overloaded.");
        console.error("This is usually temporary. Suggestions:");
        console.error("  1. Wait a few minutes and try again");
        console.error("  2. Check Together AI status: https://status.together.ai/");
        console.error("  3. Try a different model if available");
      } else if (response.status === 401) {
        console.error("\n⚠️  Unauthorized (401)");
        console.error("Your API key may be invalid or expired.");
        console.error("Please check your TOGETHER_API_KEY in the .env file.");
      } else if (response.status === 429) {
        console.error("\n⚠️  Rate Limited (429)");
        console.error("You've exceeded the API rate limit.");
        console.error("Wait a bit before trying again.");
      }
      
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      console.log("✅ API Response:");
      console.log(data.choices[0].message.content);
      console.log("\n✅ Together AI API is working correctly!");
      console.log(`\nTokens used: ${data.usage?.total_tokens || 'unknown'}`);
    } else {
      console.error("❌ Unexpected response format:", data);
    }
    
  } catch (error) {
    console.error("❌ Network or request error:", error);
    console.error("\nPossible causes:");
    console.error("  - No internet connection");
    console.error("  - Firewall blocking the request");
    console.error("  - DNS resolution issues");
    process.exit(1);
  }
}

testTogetherAI();

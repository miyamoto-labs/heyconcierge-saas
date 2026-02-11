/**
 * Test Claude integration without WhatsApp
 * Tests the AI concierge responses with mock property data
 */

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Mock property data for testing
const mockProperty = {
  name: "Tromsø Northern Lights Cabin",
  address: "Strandveien 123, Tromsø, Norway",
  property_type: "Cabin",
  config: {
    wifi_password: "NorthernLights2024",
    checkin_instructions: "Key is under the mat by the front door. Check-in after 3 PM.",
    local_tips: "Best pizza at Peppes Pizza downtown. Northern lights viewing from the backyard is incredible in winter. Grocery store 5 min walk.",
    house_rules: "No smoking indoors. Quiet hours after 10 PM. Please remove shoes inside."
  }
};

function buildPropertyContext(property) {
  const { config } = property;
  return `
Property: ${property.name}
Location: ${property.address}
Type: ${property.property_type}

WiFi Password: ${config.wifi_password}

Check-in Instructions:
${config.checkin_instructions}

Local Tips:
${config.local_tips}

House Rules:
${config.house_rules}
  `.trim();
}

async function testClaude(guestMessage) {
  const context = buildPropertyContext(mockProperty);
  const systemPrompt = `You are a helpful, friendly AI concierge for ${mockProperty.name}. 

Your job is to assist guests with:
- Check-in/check-out procedures
- WiFi passwords and access codes
- Local recommendations (restaurants, attractions, tips)
- House rules and amenities
- General property questions

Be warm, professional, and helpful. If you don't have information, politely say so and suggest they contact the property owner.

Here's the property information you have access to:

${context}

Respond in the same language as the guest's message. Keep responses concise (2-3 sentences unless more detail is needed).`;

  console.log('\n' + '='.repeat(60));
  console.log(`📩 Guest: ${guestMessage}`);
  console.log('='.repeat(60));

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: guestMessage
        }
      ]
    });

    const response = message.content[0].text;
    console.log(`\n🤖 HeyConcierge: ${response}\n`);
    return response;
  } catch (error) {
    console.error('❌ Claude API error:', error.message);
    throw error;
  }
}

// Test various guest questions
async function runTests() {
  console.log('\n🧪 Testing HeyConcierge AI Responses...\n');

  const testQuestions = [
    "What's the WiFi password?",
    "What time can we check in?",
    "Where can we get good pizza?",
    "Can we smoke inside?",
    "Is there a grocery store nearby?",
    "How do we get the key?",
    "Hva er WiFi-passordet?", // Norwegian
    "¿Cuál es la contraseña del WiFi?", // Spanish
  ];

  for (const question of testQuestions) {
    await testClaude(question);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit friendly
  }

  console.log('✅ All tests complete!\n');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}

module.exports = { testClaude, mockProperty };

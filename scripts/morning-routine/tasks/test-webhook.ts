import { ENV } from '../config/env';

async function testWebhook() {
  console.log('🧪 Testing Make.com Webhook Connection...');
  
  if (!ENV.MAKE_WEBHOOK) {
    console.error('❌ Error: MAKE_WEBHOOK is not defined in .dev.vars');
    process.exit(1);
  }

  if (!ENV.MAKE_WEBHOOK_API) {
    console.error('❌ Error: MAKE_WEBHOOK_API is not defined in .dev.vars');
    process.exit(1);
  }

  const payload = {
    collection: 'cats',
    board_name: 'Cat Coloring Pages',
    rss_url: 'https://paperpause.app/animals/cats/index.xml'
  };

  console.log(`🔗 Endpoint: ${ENV.MAKE_WEBHOOK}`);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(ENV.MAKE_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-make-apikey': ENV.MAKE_WEBHOOK_API
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('✅ Webhook call successful!');
      const text = await response.text();
      console.log('📄 Response:', text);
    } else {
      console.error(`❌ Webhook call failed with status: ${response.status}`);
      const text = await response.text();
      console.log('📄 Error Response:', text);
    }
  } catch (error) {
    console.error('❌ Network error during webhook call:', error);
  }
}

testWebhook();

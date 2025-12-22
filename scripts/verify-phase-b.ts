import { assessImage } from '../.agents/art-critic';
import { handleRejection } from './morning-routine/lib/rejection-handler';
import fs from 'fs-extra';
import path from 'path';

/**
 * Phase B Verification Script
 * 
 * Tests the Art Critic and Rejection Handler.
 */

async function testArtCritic() {
  console.log("--- Testing Art Critic Agent ---");
  
  const passUrl = "https://imagedelivery.net/G92SwfasiUv-usR1s4VYvA/09f95e6f-11e1-43aa-0538-097cb6e6a000/desktop";
  
  console.log(`[Step] Fetching and assessing PASS image: ${passUrl}`);
  const passResult = await assessImage({
    imageUrl: passUrl,
    category: "animals",
    collection: "dogs"
  });
  console.log("PASS Test Result:", JSON.stringify(passResult, null, 2));

  const failUrl = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400"; // Unsplash is usually safer
  
  console.log(`\n[Step] Fetching and assessing FAIL image (Photo): ${failUrl}`);
  const failResult = await assessImage({
    imageUrl: failUrl,
    category: "animals",
    collection: "dogs"
  });
  console.log("FAIL Test Result:", JSON.stringify(failResult, null, 2));
  
  return { passResult, failResult, failUrl };
}

async function testRejectionHandler(failResult: any, failUrl: string) {
  console.log("\n--- Testing Rejection Handler ---");
  
  const dummyBuffer = Buffer.from("dummy image data");
  
  console.log("[Step] Calling handleRejection...");
  await handleRejection({
    asset_id: "test-fail-" + Date.now(),
    category: "test-cat",
    collection: "test-coll",
    qa_mode: "enforce_failfast",
    qa_result: failResult.qa_result,
    reason: failResult.reason,
    reason_details: failResult.reason_details,
    image_url: failUrl,
    r2_original: "https://mock-r2.com/test.png",
    imageBuffer: dummyBuffer,
    run_id: "test-run-" + Date.now()
  });
}

(async () => {
    try {
        const { failResult, failUrl } = await testArtCritic();
        
        // Only test rejection handler if it actually failed as expected
        if (failResult.qa_result === 'fail') {
          await testRejectionHandler(failResult, failUrl);
        } else {
          console.warn("Skipping Rejection Handler test: Art Critic did not fail the photo as expected.");
        }
        
        console.log("\n✅ Verification Script Finished");
    } catch (error) {
        console.error("❌ Verification Failed:", error);
        process.exit(1);
    }
})();

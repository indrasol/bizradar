import { rfpUsageApi } from '@/api/rfpUsage';

/**
 * Helper functions to test RFP usage limits in the browser console
 */

/**
 * Get the current RFP usage status
 */
export async function testGetUsageStatus() {
  try {
    console.log('📊 Testing getUsageStatus()...');
    const status = await rfpUsageApi.getUsageStatus();
    console.log('📊 Usage status:', status);
    return status;
  } catch (error) {
    console.error('❌ Error getting usage status:', error);
    return null;
  }
}

/**
 * Check if a user can generate a report for a specific opportunity
 */
export async function testCheckOpportunity(opportunityId: number) {
  try {
    console.log(`📊 Testing checkOpportunity(${opportunityId})...`);
    const result = await rfpUsageApi.checkOpportunity(opportunityId);
    console.log('📊 Opportunity check result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error checking opportunity:', error);
    return null;
  }
}

/**
 * Record usage for a specific opportunity
 */
export async function testRecordUsage(opportunityId: number) {
  try {
    console.log(`📊 Testing recordUsage(${opportunityId})...`);
    const result = await rfpUsageApi.recordUsage(opportunityId);
    console.log('📊 Record usage result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error recording usage:', error);
    return null;
  }
}

/**
 * Run a full test flow
 */
export async function runFullTest(opportunityId: number) {
  console.group('🧪 Running full RFP usage test flow');
  
  // Step 1: Get initial usage status
  console.group('Step 1: Get initial usage status');
  const initialStatus = await testGetUsageStatus();
  console.groupEnd();
  
  // Step 2: Check opportunity
  console.group(`Step 2: Check opportunity ${opportunityId}`);
  const checkResult = await testCheckOpportunity(opportunityId);
  console.groupEnd();
  
  // Step 3: Record usage if possible
  console.group(`Step 3: Record usage for opportunity ${opportunityId}`);
  if (checkResult?.can_generate) {
    const recordResult = await testRecordUsage(opportunityId);
    console.log('Record result:', recordResult);
  } else {
    console.log('Cannot record usage - limit reached or existing report');
  }
  console.groupEnd();
  
  // Step 4: Get updated status
  console.group('Step 4: Get updated usage status');
  const updatedStatus = await testGetUsageStatus();
  console.groupEnd();
  
  // Step 5: Check opportunity again
  console.group(`Step 5: Check opportunity ${opportunityId} again`);
  const recheckResult = await testCheckOpportunity(opportunityId);
  console.groupEnd();
  
  console.groupEnd();
  
  return {
    initialStatus,
    checkResult,
    updatedStatus,
    recheckResult
  };
}

/**
 * Run these tests in the browser console:
 * 
 * 1. Import the test functions:
 *    import { testGetUsageStatus, testCheckOpportunity, testRecordUsage, runFullTest } from '@/utils/__tests__/rfpUsageTest';
 * 
 * 2. Run individual tests:
 *    testGetUsageStatus();
 *    testCheckOpportunity(12345);
 *    testRecordUsage(12345);
 * 
 * 3. Or run the full test flow:
 *    runFullTest(12345);
 */

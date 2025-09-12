// src/tests/api.test.ts
import { API_ENDPOINTS, SUPABASE_TABLES } from '@/config/apiEndpoints';
import { apiClient } from '@/lib/api';
import { subscriptionApi } from '@/api/subscription';
import { paymentApi } from '@/api/payment';
import { notificationsApi } from '@/api/notifications';
import { supportApi } from '@/api/support';
import { getApiUrl } from '@/config/env';

// This file is for manual testing and verification of the centralized API structure
// It's not meant to be run as an automated test but as a reference for how the APIs are structured

async function testEndpoints() {
  console.log('API Base URL:', getApiUrl());
  
  console.log('\nAPI_ENDPOINTS:');
  console.log(API_ENDPOINTS);
  
  console.log('\nSTRIPE price IDs are resolved via API:');
  
  console.log('\nSUPABASE_TABLES:');
  console.log(SUPABASE_TABLES);
  
  console.log('\nAPI Client Methods:');
  console.log('- get()');
  console.log('- post()');
  console.log('- put()');
  console.log('- delete()');
  console.log('- getAuthHeaders()');
  console.log('- handleResponse()');
  
  console.log('\nSubscription API Methods:');
  console.log(Object.keys(subscriptionApi).join('\n- '));
  
  console.log('\nPayment API Methods:');
  console.log(Object.keys(paymentApi).join('\n- '));
  
  console.log('\nNotifications API Methods:');
  console.log(Object.keys(notificationsApi).join('\n- '));
  
  console.log('\nSupport API Methods:');
  console.log(Object.keys(supportApi).join('\n- '));
}

// Example of how to use the apiClient
async function exampleApiClientUsage() {
  try {
    // Example GET request
    const getResult = await apiClient.get(`${getApiUrl()}/example-endpoint?param=value`);
    console.log('GET result:', getResult);
    
    // Example POST request
    const postResult = await apiClient.post(`${getApiUrl()}/example-endpoint`, {
      key1: 'value1',
      key2: 'value2'
    });
    console.log('POST result:', postResult);
    
    // Example using API_ENDPOINTS
    const endpointResult = await apiClient.get(API_ENDPOINTS.SUBSCRIPTION_STATUS);
    console.log('Endpoint result:', endpointResult);
    
  } catch (error) {
    console.error('API client usage error:', error);
  }
}

// Usage of subscriptionApi as an example
async function exampleSubscriptionApiUsage() {
  try {
    const currentSubscription = await subscriptionApi.getCurrentSubscription();
    console.log('Current subscription:', currentSubscription);
    
    const plans = await subscriptionApi.getAvailablePlans();
    console.log('Available plans:', plans);
  } catch (error) {
    console.error('Subscription API usage error:', error);
  }
}

// Run tests or examples when needed
// testEndpoints();
// exampleApiClientUsage();
// exampleSubscriptionApiUsage();

export { testEndpoints, exampleApiClientUsage, exampleSubscriptionApiUsage };

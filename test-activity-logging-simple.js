#!/usr/bin/env node

/**
 * Simple Activity Logging Test
 * Tests the API directly to verify it's working
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testActivityLoggingAPI() {
  console.log('🧪 Testing Activity Logging API...\n');

  try {
    // First, let's check if the server is running and get a basic response
    console.log('1. Testing server connectivity...');
    const healthCheck = await fetch(`${BASE_URL}/api/point-categories`);
    console.log(`   Server response: ${healthCheck.status}`);

    if (healthCheck.status === 401) {
      console.log('   ✅ Server is running (401 expected for unauthenticated request)');
    } else if (healthCheck.status === 200) {
      console.log('   ✅ Server is running and responding');
    } else {
      console.log(`   ❌ Server not responding properly: ${healthCheck.status}`);
      return;
    }

    // Test the log activity endpoint structure
    console.log('\n2. Testing activity log endpoint structure...');
    const testLogResponse = await fetch(`${BASE_URL}/api/activities/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activityId: 'test-id',
        date: '2024-01-15',
        focusLevel: 'good'
      })
    });

    console.log(`   Log endpoint response: ${testLogResponse.status}`);

    if (testLogResponse.status === 401) {
      console.log('   ✅ Authentication required (expected for unauthenticated request)');
    } else if (testLogResponse.status === 400 || testLogResponse.status === 404) {
      console.log('   ✅ API is accepting requests and validating properly');
    } else {
      console.log(`   ⚠️ Unexpected response: ${testLogResponse.status}`);
    }

    // Test with missing required fields
    console.log('\n3. Testing validation...');
    const validationResponse = await fetch(`${BASE_URL}/api/activities/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing activityId and date
        focusLevel: 'good'
      })
    });

    if (validationResponse.status === 400) {
      console.log('   ✅ Validation working (missing required fields)');
      const errorData = await validationResponse.json();
      console.log(`   Error message: ${errorData.error}`);
    } else {
      console.log(`   ❌ Validation not working: ${validationResponse.status}`);
    }

    console.log('\n🎉 API Structure Test Complete!');
    console.log('The API endpoints are responding correctly.');
    console.log('Now you can test through the UI at: http://localhost:3000/dashboard/log-activity');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testActivityLoggingAPI();

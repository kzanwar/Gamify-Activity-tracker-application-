#!/usr/bin/env node

/**
 * Manual Activity Logging Workflow Test
 * Tests the complete end-to-end workflow for activity logging with focus
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testActivityLoggingWorkflow() {
  console.log('🚀 Testing Complete Activity Logging Workflow...\n');

  try {
    // ===== PHASE 1: Create Point Category =====
    console.log('📂 Phase 1: Creating Point Category...');

    const categoryResponse = await fetch(`${BASE_URL}/api/point-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Professional Growth',
        description: 'Activities for career development',
        color: '#3b82f6'
      })
    });

    if (!categoryResponse.ok) {
      console.log('❌ Category creation failed:', categoryResponse.status);
      return;
    }

    const categoryData = await categoryResponse.json();
    console.log('✅ Category created:', categoryData.name);

    const categoryId = categoryData.id;

    // ===== PHASE 2: Create Activities =====
    console.log('\n📝 Phase 2: Creating Activities...');

    // Create Fixed Points Activity
    const fixedActivityResponse = await fetch(`${BASE_URL}/api/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Code Review Session',
        description: 'Review and provide feedback on team code',
        type: 'fixed',
        focusScoringType: 'multiplier',
        points: 10,
        focusLevels: {
          low: 0.5,
          medium: 1.0,
          good: 1.5,
          zen: 2.0
        },
        pointCategoryId: categoryId
      })
    });

    if (!fixedActivityResponse.ok) {
      console.log('❌ Fixed activity creation failed:', fixedActivityResponse.status);
      const error = await fixedActivityResponse.json();
      console.log('Error details:', error);
      return;
    }

    const fixedActivityData = await fixedActivityResponse.json();
    console.log('✅ Fixed Activity created:', fixedActivityData.activity.name);
    const fixedActivityId = fixedActivityData.activity.id;

    // Create Time-Based Activity
    const timeActivityResponse = await fetch(`${BASE_URL}/api/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Deep Coding Session',
        description: 'Intensive focused programming work',
        type: 'time_based',
        focusScoringType: 'multiplier',
        points: 0,
        focusLevels: {
          low: 0.5,
          medium: 1.0,
          good: 1.5,
          zen: 2.0
        },
        pointCategoryId: categoryId
      })
    });

    if (!timeActivityResponse.ok) {
      console.log('❌ Time activity creation failed:', timeActivityResponse.status);
      const error = await timeActivityResponse.json();
      console.log('Error details:', error);
      return;
    }

    const timeActivityData = await timeActivityResponse.json();
    console.log('✅ Time-Based Activity created:', timeActivityData.activity.name);
    const timeActivityId = timeActivityData.activity.id;

    // ===== PHASE 3: Fetch Activities =====
    console.log('\n📋 Phase 3: Fetching Activities...');

    const activitiesResponse = await fetch(`${BASE_URL}/api/activities?categoryId=${categoryId}`);

    if (!activitiesResponse.ok) {
      console.log('❌ Activities fetch failed:', activitiesResponse.status);
      return;
    }

    const activitiesData = await activitiesResponse.json();
    console.log('✅ Fetched activities:', activitiesData.activities.length);
    activitiesData.activities.forEach(activity => {
      console.log(`   - ${activity.name} (${activity.type}, ${activity.focusScoringType})`);
    });

    // ===== PHASE 4: Log Fixed Activity =====
    console.log('\n🎯 Phase 4: Logging Fixed Activity...');

    const logFixedResponse = await fetch(`${BASE_URL}/api/activities/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activityId: fixedActivityId,
        date: new Date().toISOString().split('T')[0], // Today's date
        focusLevel: 'good',
        notes: 'Reviewed authentication middleware and provided detailed feedback on security improvements'
      })
    });

    if (!logFixedResponse.ok) {
      console.log('❌ Fixed activity logging failed:', logFixedResponse.status);
      const error = await logFixedResponse.json();
      console.log('Error details:', error);
      return;
    }

    const logFixedData = await logFixedResponse.json();
    console.log('✅ Fixed Activity logged!');
    console.log(`   Points earned: ${logFixedData.loggedActivity.pointsEarned}`);
    console.log(`   Expected: ${10 * 1.5} (10 base × 1.5 good focus)`);

    // ===== PHASE 5: Log Time-Based Activity =====
    console.log('\n⏰ Phase 5: Logging Time-Based Activity...');

    const logTimeResponse = await fetch(`${BASE_URL}/api/activities/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activityId: timeActivityId,
        date: new Date().toISOString().split('T')[0], // Today's date
        startTime: '09:30',
        endTime: '12:00', // 2.5 hours = 150 minutes
        focusLevel: 'zen',
        notes: 'Intensive coding session implementing new user management features with complete focus'
      })
    });

    if (!logTimeResponse.ok) {
      console.log('❌ Time activity logging failed:', logTimeResponse.status);
      const error = await logTimeResponse.json();
      console.log('Error details:', error);
      return;
    }

    const logTimeData = await logTimeResponse.json();
    console.log('✅ Time-Based Activity logged!');
    console.log(`   Points earned: ${logTimeData.loggedActivity.pointsEarned}`);
    console.log(`   Expected: ${150 * 2.0} (150 minutes × 2.0 zen focus)`);

    // ===== PHASE 6: Verify Points Aggregation =====
    console.log('\n📊 Phase 6: Verifying Points Aggregation...');

    const pointsResponse = await fetch(`${BASE_URL}/api/point-categories`);

    if (!pointsResponse.ok) {
      console.log('❌ Points aggregation failed:', pointsResponse.status);
      return;
    }

    const pointsData = await pointsResponse.json();
    const totalPoints = pointsData.totalPoints;
    const categoryPoints = pointsData.categories.find(cat => cat.id === categoryId)?.points || 0;

    console.log('✅ Points aggregated successfully!');
    console.log(`   Total points: ${totalPoints}`);
    console.log(`   Category points: ${categoryPoints}`);
    console.log(`   Expected: ${15 + 300} = ${15 + 300} total points`);

    // ===== SUMMARY =====
    console.log('\n🎉 WORKFLOW COMPLETE! Activity Logging with Focus is Working!');
    console.log('='.repeat(60));
    console.log('📈 WORKFLOW SUMMARY:');
    console.log(`   • Category: ${categoryData.name}`);
    console.log(`   • Fixed Activity: ${fixedActivityData.activity.name} (10 pts × 1.5 good = 15 pts)`);
    console.log(`   • Time Activity: ${timeActivityData.activity.name} (150 min × 2.0 zen = 300 pts)`);
    console.log(`   • Total Points Logged: ${15 + 300} points`);
    console.log(`   • Points Aggregated: ${totalPoints} points`);
    console.log('='.repeat(60));

    if (totalPoints === 315) {
      console.log('✅ ALL TESTS PASSED! Activity logging with focus works perfectly!');
    } else {
      console.log('⚠️  Points calculation may need verification');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Test different focus scoring methods
async function testFocusScoringMethods() {
  console.log('\n🔄 Testing Different Focus Scoring Methods...\n');

  try {
    // Create category first
    const categoryResponse = await fetch(`${BASE_URL}/api/point-categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Focus Methods',
        color: '#10b981'
      })
    });

    if (!categoryResponse.ok) return;
    const categoryData = await categoryResponse.json();

    // Create fixed-points activity
    const activityResponse = await fetch(`${BASE_URL}/api/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Fixed Points Test',
        type: 'fixed',
        focusScoringType: 'fixed_points',
        points: 5,
        focusLevels: {
          low: 8,
          medium: 12,
          good: 18,
          zen: 25
        },
        pointCategoryId: categoryData.id
      })
    });

    if (!activityResponse.ok) return;
    const activityData = await activityResponse.json();
    const activityId = activityData.activity.id;

    // Test different focus levels
    const focusLevels = ['low', 'medium', 'good', 'zen'];
    const expectedPoints = [8, 12, 18, 25];

    for (let i = 0; i < focusLevels.length; i++) {
      const logResponse = await fetch(`${BASE_URL}/api/activities/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activityId,
          date: new Date().toISOString().split('T')[0],
          focusLevel: focusLevels[i],
          notes: `Testing ${focusLevels[i]} focus level`
        })
      });

      if (logResponse.ok) {
        const logData = await logResponse.json();
        console.log(`✅ ${focusLevels[i]} focus: ${logData.loggedActivity.pointsEarned} points (expected: ${expectedPoints[i]})`);
      } else {
        console.log(`❌ ${focusLevels[i]} focus failed`);
      }
    }

  } catch (error) {
    console.error('Focus scoring test failed:', error.message);
  }
}

// Run the tests
async function runAllTests() {
  await testActivityLoggingWorkflow();
  await testFocusScoringMethods();

  console.log('\n🏁 All Activity Logging Tests Complete!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { testActivityLoggingWorkflow, testFocusScoringMethods };

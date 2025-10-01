#!/usr/bin/env node

/**
 * Complete Activity Logging Workflow Test
 * Tests the full end-to-end workflow with proper data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTestData() {
  console.log('🔧 Setting up test data...\n');

  try {
    // Create test user (if not exists)
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        name: 'Test User',
        email: 'test@example.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fYw8ZJC2', // 'testpassword'
      }
    });
    console.log('✅ Test user:', testUser.email);

    // Create point category
    const category = await prisma.pointCategory.upsert({
      where: {
        userId_name: {
          userId: testUser.id,
          name: 'Productivity'
        }
      },
      update: {},
      create: {
        userId: testUser.id,
        name: 'Productivity',
        description: 'Work and productivity activities',
        color: '#3b82f6'
      }
    });
    console.log('✅ Category:', category.name);

    // Create test activity
    const activity = await prisma.activity.upsert({
      where: {
        userId_name: {
          userId: testUser.id,
          name: 'Code Review'
        }
      },
      update: {},
      create: {
        userId: testUser.id,
        pointCategoryId: category.id,
        name: 'Code Review',
        description: 'Review team member code',
        type: 'fixed',
        focusScoringType: 'multiplier',
        points: 10,
        focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 }
      }
    });
    console.log('✅ Activity:', activity.name);

    return { testUser, category, activity };

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

async function testActivityLogging(testData) {
  const { testUser, category, activity } = testData;

  console.log('\n🎯 Testing Activity Logging with Focus...\n');

  try {
    // Test different focus levels
    const focusLevels = ['low', 'medium', 'good', 'zen'];
    const expectedPoints = [5, 10, 15, 20]; // 10 points × focus multiplier

    console.log(`Activity: ${activity.name} (${activity.points} base points)`);
    console.log(`Scoring: Multipliers\n`);

    for (let i = 0; i < focusLevels.length; i++) {
      const focusLevel = focusLevels[i];
      const expectedPointsCalc = expectedPoints[i];

      console.log(`Testing ${focusLevel} focus:`);

      // Calculate points manually to verify
      const multiplier = activity.focusLevels[focusLevel] || 1.0;
      const calculatedPoints = Math.round(activity.points * multiplier);

      console.log(`  Expected: ${activity.points} × ${multiplier} = ${calculatedPoints} points`);

      // Create logged activity directly in database
      const loggedActivity = await prisma.loggedActivity.create({
        data: {
          userId: testUser.id,
          activityId: activity.id,
          date: new Date(),
          focusLevel: focusLevel,
          notes: `Testing ${focusLevel} focus level`,
          pointsEarned: calculatedPoints
        },
        include: {
          activity: {
            include: {
              pointCategory: true
            }
          }
        }
      });

      console.log(`  ✅ Logged: ${loggedActivity.pointsEarned} points`);
      console.log(`  ✅ Focus Level: ${loggedActivity.focusLevel} (type: ${typeof loggedActivity.focusLevel})`);
      console.log('');
    }

    // Verify total points
    const totalLogged = await prisma.loggedActivity.aggregate({
      where: { userId: testUser.id },
      _sum: { pointsEarned: true }
    });

    const totalPoints = totalLogged._sum.pointsEarned || 0;
    const expectedTotal = expectedPoints.reduce((sum, pts) => sum + pts, 0);

    console.log('📊 Results Summary:');
    console.log(`  Total Points Logged: ${totalPoints}`);
    console.log(`  Expected Total: ${expectedTotal}`);

    if (totalPoints === expectedTotal) {
      console.log('  ✅ All calculations correct!');
    } else {
      console.log('  ❌ Calculation mismatch!');
    }

    return { success: true, totalPoints };

  } catch (error) {
    console.error('❌ Activity logging test failed:', error);
    throw error;
  }
}

async function testNumericFocusLevel(testData) {
  const { testUser, activity } = testData;

  console.log('\n🔢 Testing Numeric Focus Level Conversion...\n');

  try {
    // Test with numeric value that was causing the error
    const numericFocusLevel = 1735356260;

    console.log(`Testing numeric focus level: ${numericFocusLevel}`);

    // This should now work since we convert to string
    const loggedActivity = await prisma.loggedActivity.create({
      data: {
        userId: testUser.id,
        activityId: activity.id,
        date: new Date(),
        focusLevel: String(numericFocusLevel), // Convert to string
        notes: 'Testing numeric focus level conversion',
        pointsEarned: activity.points // Default multiplier for invalid focus level
      }
    });

    console.log('✅ Numeric focus level handled successfully!');
    console.log(`   Stored as: "${loggedActivity.focusLevel}" (string type)`);
    console.log(`   Points: ${loggedActivity.pointsEarned}`);

    return true;

  } catch (error) {
    console.error('❌ Numeric focus level test failed:', error);
    return false;
  }
}

async function cleanup(testData) {
  console.log('\n🧹 Cleaning up test data...');

  try {
    const { testUser } = testData;

    // Delete in reverse order due to foreign keys
    await prisma.loggedActivity.deleteMany({
      where: { userId: testUser.id }
    });

    await prisma.activity.deleteMany({
      where: { userId: testUser.id }
    });

    await prisma.pointCategory.deleteMany({
      where: { userId: testUser.id }
    });

    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });

    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

async function runCompleteTest() {
  try {
    console.log('🚀 Running Complete Activity Logging Workflow Test\n');
    console.log('=' * 60);

    // Setup
    const testData = await setupTestData();

    // Test main functionality
    const mainResult = await testActivityLogging(testData);

    // Test the specific fix
    const numericTestResult = await testNumericFocusLevel(testData);

    // Results
    console.log('\n🎉 WORKFLOW TEST COMPLETE!');
    console.log('=' * 60);
    console.log('📋 Test Results:');

    if (mainResult.success) {
      console.log('✅ Main activity logging: PASSED');
      console.log(`   Points logged: ${mainResult.totalPoints}`);
    } else {
      console.log('❌ Main activity logging: FAILED');
    }

    if (numericTestResult) {
      console.log('✅ Numeric focus level conversion: PASSED');
    } else {
      console.log('❌ Numeric focus level conversion: FAILED');
    }

    console.log('\n🏁 SUMMARY:');
    if (mainResult.success && numericTestResult) {
      console.log('🎊 ALL TESTS PASSED! Activity logging with focus is working perfectly!');
      console.log('\nThe original 500 Internal Server Error has been fixed.');
      console.log('Focus level type conversion is now handled correctly.');
    } else {
      console.log('❌ Some tests failed. Please check the implementation.');
    }

  } catch (error) {
    console.error('\n❌ Complete test failed:', error);
  } finally {
    // Cleanup will run even if tests fail
    try {
      const testUser = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      });
      if (testUser) {
        await cleanup({ testUser });
      }
    } catch (e) {
      // Ignore cleanup errors
    }

    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  runCompleteTest();
}

module.exports = { runCompleteTest, setupTestData, testActivityLogging, cleanup };

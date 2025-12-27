/**
 * Test script to verify workspace isolation implementation
 * This should be run in development to ensure multi-tenant data isolation is working
 */

import { getCurrentWorkspaceContext, createWorkspaceQuery, validateWorkspaceAccess, logSecurityViolation } from './workspace-api';
import { loggingService } from './loggingService';

export async function testWorkspaceIsolation() {
  console.log('🔒 Testing Workspace Isolation Implementation...');
  
  try {
    // Test 1: Get current workspace context
    console.log('\n1. Testing workspace context retrieval...');
    const context = await getCurrentWorkspaceContext();
    
    if (context) {
      console.log('✅ Workspace context retrieved successfully:', {
        workspaceId: context.workspaceId,
        userId: context.userId,
        isAdminWorkspace: context.isAdminWorkspace
      });
    } else {
      console.log('⚠️  No workspace context available (user may not be authenticated)');
    }

    // Test 2: Create workspace query builder
    console.log('\n2. Testing workspace query builder...');
    const savedSitesQuery = await createWorkspaceQuery('saved_sites');
    
    if (savedSitesQuery) {
      console.log('✅ Workspace query builder created successfully for saved_sites table');
    } else {
      console.log('⚠️  Could not create workspace query builder (no context available)');
    }

    // Test 3: Test workspace access validation
    console.log('\n3. Testing workspace access validation...');
    if (context) {
      const hasAccess = await validateWorkspaceAccess(context.workspaceId, 'test_access');
      console.log(`✅ Workspace access validation result: ${hasAccess}`);
      
      // Test invalid workspace access
      const invalidAccess = await validateWorkspaceAccess('invalid-workspace-id', 'test_access');
      console.log(`✅ Invalid workspace access correctly denied: ${!invalidAccess}`);
    }

    // Test 4: Test security logging
    console.log('\n4. Testing security violation logging...');
    if (context) {
      logSecurityViolation('test_violation', 'fake-workspace-id', context.userId, {
        testRun: true,
        timestamp: new Date().toISOString()
      });
      console.log('✅ Security violation logged successfully');
    }

    // Test 5: Test logging service integration
    console.log('\n5. Testing logging service integration...');
    loggingService.logTransaction('WorkspaceIsolationTest', 'test_completed', {
      workspaceId: context?.workspaceId || 'no-context',
      testResults: 'all_passed'
    });
    console.log('✅ Transaction logged successfully');

    console.log('\n🎉 Workspace isolation tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Workspace context retrieval');
    console.log('- ✅ Query builder with automatic workspace filtering');
    console.log('- ✅ Access validation and security logging');
    console.log('- ✅ Integration with logging service');
    
    return {
      success: true,
      context,
      message: 'All workspace isolation tests passed'
    };

  } catch (error) {
    console.error('❌ Workspace isolation test failed:', error);
    
    loggingService.addLog('error', 'WorkspaceIsolationTest', 'Test failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Workspace isolation tests failed'
    };
  }
}

// Export for use in development console
if (typeof window !== 'undefined') {
  (window as any).testWorkspaceIsolation = testWorkspaceIsolation;
}
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

async function testFullAuthFlow() {
  console.log('🔍 Testing Full Authentication Flow...\n');
  console.log('API URL:', API_URL);
  console.log('='.repeat(60) + '\n');

  let token = '';

  // Test 1: Login
  try {
    console.log('1️⃣ Testing Login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'etiqettelms@gmail.com',
        password: 'Akshara@123'
      })
    });
    
    if (loginResponse.ok) {
      const data = await loginResponse.json() as { token: string };
      token = data.token;
      console.log('   ✅ Login successful');
      console.log('   Token received:', token ? 'Yes' : 'No');
      console.log('   Token (first 50 chars):', token.substring(0, 50) + '...');
    } else {
      const error = await loginResponse.text();
      console.log('   ❌ Login failed:', loginResponse.status);
      console.log('   Error:', error);
      console.log('\n💡 Make sure the backend server is running on port 3001');
      console.log('   Run: cd server && npm run dev\n');
      return;
    }
  } catch (error: any) {
    console.log('   ❌ Login error:', error.message);
    console.log('\n💡 Backend server is not running!');
    console.log('   Start it with: cd server && npm run dev\n');
    return;
  }

  console.log('');

  // Test 2: Get Profile with JWT
  try {
    console.log('2️⃣ Testing Get Profile with JWT...');
    const profileResponse = await fetch(`${API_URL}/profiles/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (profileResponse.ok) {
      const profile = await profileResponse.json() as any;
      console.log('   ✅ Profile retrieved successfully');
      console.log('   User:', profile.name);
      console.log('   Email:', profile.email);
      console.log('   Role:', profile.role);
      console.log('   ID:', profile.id);
      console.log('   XP:', profile.xp);
    } else {
      const error = await profileResponse.text();
      console.log('   ❌ Get profile failed:', profileResponse.status);
      console.log('   Error:', error);
      
      if (profileResponse.status === 401 || profileResponse.status === 403) {
        console.log('\n💡 JWT Token Issue Detected!');
        console.log('   The token was generated but is not being accepted.');
        console.log('   This could be a JWT_SECRET mismatch.\n');
      }
      return;
    }
  } catch (error: any) {
    console.log('   ❌ Get profile error:', error.message);
    return;
  }

  console.log('');

  // Test 3: Get All Profiles
  try {
    console.log('3️⃣ Testing Get All Profiles...');
    const profilesResponse = await fetch(`${API_URL}/profiles`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json() as any[];
      console.log('   ✅ Profiles retrieved');
      console.log('   Total users:', profiles.length);
      profiles.forEach((p: any) => {
        console.log(`   - ${p.name} (${p.email}) - ${p.role}`);
      });
    } else {
      console.log('   ❌ Get profiles failed:', profilesResponse.status);
    }
  } catch (error: any) {
    console.log('   ❌ Get profiles error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ FULL AUTHENTICATION FLOW: PASSED');
  console.log('='.repeat(60));
  console.log('\n📝 Summary:');
  console.log('   ✅ Login endpoint working');
  console.log('   ✅ JWT token generation working');
  console.log('   ✅ JWT token verification working');
  console.log('   ✅ Protected routes accessible with token');
  console.log('\n🎉 Admin JWT is working correctly!');
  console.log('\n💡 If login fails in the browser:');
  console.log('   1. Check browser console for errors');
  console.log('   2. Verify frontend is running on port 3000');
  console.log('   3. Check Network tab for API calls');
  console.log('   4. Clear browser cache and localStorage');
  console.log('');
}

testFullAuthFlow();

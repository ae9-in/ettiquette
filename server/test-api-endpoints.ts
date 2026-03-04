import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
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
      const data = await loginResponse.json();
      token = data.token;
      console.log('   ✅ Login successful');
      console.log('   Token received:', token ? 'Yes' : 'No');
    } else {
      console.log('   ❌ Login failed:', loginResponse.status);
      const error = await loginResponse.text();
      console.log('   Error:', error);
    }
  } catch (error: any) {
    console.log('   ❌ Login error:', error.message);
  }

  console.log('');

  // Test 2: Get Profile
  try {
    console.log('2️⃣ Testing Get Profile...');
    const profileResponse = await fetch(`${API_URL}/profiles/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      console.log('   ✅ Profile retrieved');
      console.log('   User:', profile.name, `(${profile.role})`);
      console.log('   Email:', profile.email);
      console.log('   XP:', profile.xp);
    } else {
      console.log('   ❌ Get profile failed:', profileResponse.status);
    }
  } catch (error: any) {
    console.log('   ❌ Get profile error:', error.message);
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
      const profiles = await profilesResponse.json();
      console.log('   ✅ Profiles retrieved');
      console.log('   Total users:', profiles.length);
    } else {
      console.log('   ❌ Get profiles failed:', profilesResponse.status);
    }
  } catch (error: any) {
    console.log('   ❌ Get profiles error:', error.message);
  }

  console.log('');

  // Test 4: Update XP
  try {
    console.log('4️⃣ Testing Update XP...');
    const xpResponse = await fetch(`${API_URL}/xp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ xp: 100 })
    });
    
    if (xpResponse.ok) {
      const result = await xpResponse.json();
      console.log('   ✅ XP updated');
      console.log('   New XP:', result.xp);
    } else {
      console.log('   ❌ Update XP failed:', xpResponse.status);
    }
  } catch (error: any) {
    console.log('   ❌ Update XP error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ API Testing Complete!\n');
}

testEndpoints();

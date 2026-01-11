#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class GCCMedicalAPITester:
    def __init__(self, base_url="https://gcc-medical-launch.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.user_data = None
        self.admin_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()

    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None, 
                 use_admin: bool = False) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add auth token if available
        token = self.admin_token if use_admin and self.admin_token else self.token
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200] if response.text else 'No response'
                })

            try:
                return success, response.json() if response.text else {}
            except:
                return success, {'raw_response': response.text}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                'test': name,
                'error': str(e)
            })
            return False, {}

    def test_seed_data(self):
        """Test seeding initial data"""
        self.log("🌱 Testing seed data endpoint...")
        success, response = self.run_test(
            "Seed Data",
            "POST",
            "seed",
            200
        )
        return success

    def test_user_registration(self):
        """Test user registration"""
        test_user = {
            "email": "testuser@example.com",
            "password": "Test123!",
            "name": "Test User"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            self.log(f"✅ User registered with ID: {self.user_data.get('user_id')}")
        
        return success

    def test_user_login(self):
        """Test user login with provided credentials"""
        login_data = {
            "email": "testuser@example.com",
            "password": "Test123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            self.log(f"✅ User logged in: {self.user_data.get('name')}")
        
        return success

    def test_admin_login(self):
        """Test admin login"""
        admin_login = {
            "email": "admin@gccmedical.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_login
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_data = response['user']
            self.log(f"✅ Admin logged in: {self.admin_data.get('name')}")
        
        return success

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_modules(self):
        """Test getting course modules"""
        success, response = self.run_test(
            "Get Modules",
            "GET",
            "modules",
            200
        )
        
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} modules")
        
        return success

    def test_get_progress(self):
        """Test getting user progress"""
        success, response = self.run_test(
            "Get User Progress",
            "GET",
            "progress",
            200
        )
        
        if success and 'stats' in response:
            stats = response['stats']
            self.log(f"✅ Progress: {stats.get('completed_modules', 0)}/{stats.get('total_modules', 0)} modules")
        
        return success

    def test_market_matrix_tool(self):
        """Test GCC Market Selection Matrix tool"""
        matrix_input = {
            "specialty": "General Practice",
            "capital_available": 300000,
            "timeline_months": 12,
            "risk_tolerance": "medium",
            "language_skills": ["English"],
            "practice_type": "clinic"
        }
        
        success, response = self.run_test(
            "Market Matrix Tool",
            "POST",
            "tools/market-matrix",
            200,
            data=matrix_input
        )
        
        if success and 'results' in response:
            results = response['results']
            self.log(f"✅ Market analysis returned {len(results)} countries")
            if response.get('recommendation'):
                rec = response['recommendation']
                self.log(f"✅ Top recommendation: {rec.get('country_name')} (Score: {rec.get('total_score')})")
        
        return success

    def test_financial_calculator(self):
        """Test Financial Calculator tool"""
        financial_input = {
            "practice_type": "clinic",
            "country": "uae",
            "staff_count": 5,
            "monthly_patients": 200,
            "average_revenue_per_visit": 200
        }
        
        success, response = self.run_test(
            "Financial Calculator",
            "POST",
            "tools/financial-calculator",
            200,
            data=financial_input
        )
        
        if success and 'startup_costs' in response:
            startup = response['startup_costs']
            monthly_revenue = response.get('monthly_revenue', 0)
            self.log(f"✅ Startup costs: ${startup.get('total', 0):,}")
            self.log(f"✅ Monthly revenue: ${monthly_revenue:,}")
        
        return success

    def test_ai_chatbot(self):
        """Test AI Chatbot functionality"""
        chat_message = {
            "message": "What are the key requirements for opening a medical practice in Dubai?"
        }
        
        success, response = self.run_test(
            "AI Chatbot",
            "POST",
            "chat",
            200,
            data=chat_message
        )
        
        if success and 'response' in response:
            ai_response = response['response']
            self.log(f"✅ AI responded with {len(ai_response)} characters")
            if response.get('session_id'):
                self.log(f"✅ Session ID: {response['session_id'][:12]}...")
        
        return success

    def test_admin_stats(self):
        """Test admin statistics endpoint"""
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200,
            use_admin=True
        )
        
        if success and 'users' in response:
            users = response['users']
            content = response.get('content', {})
            self.log(f"✅ Platform stats - Users: {users.get('total', 0)}, Modules: {content.get('total_modules', 0)}")
        
        return success

    def test_module_creation(self):
        """Test creating a new module (admin only)"""
        new_module = {
            "week_number": 13,
            "title": "Test Module - Advanced Practice Management",
            "description": "Test module for API validation",
            "duration_minutes": 30,
            "order": 1,
            "is_published": False,
            "resources": [],
            "content": "This is a test module created during API testing."
        }
        
        success, response = self.run_test(
            "Create Module",
            "POST",
            "modules",
            200,
            data=new_module,
            use_admin=True
        )
        
        if success and 'module_id' in response:
            module_id = response['module_id']
            self.log(f"✅ Created module: {module_id}")
            return success, module_id
        
        return success, None

    def test_update_progress(self):
        """Test updating module progress"""
        # First get a module to update progress for
        success, modules = self.run_test("Get Modules for Progress", "GET", "modules", 200)
        
        if not success or not modules:
            return False
        
        # Use first available module
        module = modules[0]
        module_id = module.get('module_id')
        
        if not module_id:
            return False
        
        progress_update = {
            "module_id": module_id,
            "completed": True,
            "video_progress": 100.0
        }
        
        success, response = self.run_test(
            "Update Progress",
            "POST",
            "progress",
            200,
            data=progress_update
        )
        
        if success and 'progress_id' in response:
            self.log(f"✅ Updated progress for module: {module_id}")
        
        return success

    def run_all_tests(self):
        """Run comprehensive test suite"""
        self.log("🚀 Starting GCC Medical Practice Launch API Tests")
        self.log("=" * 60)
        
        # Test sequence
        test_results = {}
        
        # 1. Seed data
        test_results['seed'] = self.test_seed_data()
        
        # 2. Authentication tests
        test_results['registration'] = self.test_user_registration()
        test_results['login'] = self.test_user_login()
        test_results['admin_login'] = self.test_admin_login()
        test_results['current_user'] = self.test_get_current_user()
        
        # 3. Core functionality
        test_results['modules'] = self.test_get_modules()
        test_results['progress'] = self.test_get_progress()
        test_results['update_progress'] = self.test_update_progress()
        
        # 4. Interactive tools
        test_results['market_matrix'] = self.test_market_matrix_tool()
        test_results['financial_calc'] = self.test_financial_calculator()
        
        # 5. AI features
        test_results['chatbot'] = self.test_ai_chatbot()
        
        # 6. Admin features
        test_results['admin_stats'] = self.test_admin_stats()
        success, module_id = self.test_module_creation()
        test_results['create_module'] = success
        
        # Print summary
        self.log("=" * 60)
        self.log(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            self.log("❌ Failed Tests:")
            for failure in self.failed_tests:
                self.log(f"  - {failure.get('test', 'Unknown')}: {failure.get('error', failure.get('response', 'Unknown error'))}")
        
        return self.tests_passed == self.tests_run, test_results

def main():
    """Main test execution"""
    tester = GCCMedicalAPITester()
    
    try:
        success, results = tester.run_all_tests()
        
        # Save detailed results
        test_report = {
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': round((tester.tests_passed / tester.tests_run * 100), 2) if tester.tests_run > 0 else 0,
            'test_results': results,
            'failed_tests': tester.failed_tests,
            'base_url': tester.base_url
        }
        
        with open('/app/backend_test_results.json', 'w') as f:
            json.dump(test_report, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
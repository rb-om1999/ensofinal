import requests
import sys
import base64
import json
from datetime import datetime
from pathlib import Path

class EnsoTradeAPITester:
    def __init__(self, base_url="https://chart-whisperer-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    details += f", Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}"
                except:
                    details += ", Response: Non-JSON"
            else:
                details += f", Expected: {expected_status}"
                try:
                    error_detail = response.json()
                    details += f", Error: {error_detail.get('detail', 'Unknown error')}"
                except:
                    details += f", Raw response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout (30s)")
            return False, {}
        except requests.exceptions.ConnectionError:
            self.log_test(name, False, "Connection error - server may be down")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_image_base64(self):
        """Create a simple test image in base64 format"""
        # Create a minimal PNG image (1x1 pixel)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x12IDATx\x9cc```bPPP\x00\x02\xac\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        return base64.b64encode(png_data).decode('utf-8')

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_chart_analysis_valid(self):
        """Test chart analysis with valid data"""
        test_image = self.create_test_image_base64()
        
        analysis_data = {
            "imageBase64": test_image,
            "symbol": "BTCUSDT",
            "timeframe": "1H",
            "tradingStyle": "Day Trading"
        }
        
        success, response = self.run_test(
            "Chart Analysis - Valid Data",
            "POST",
            "analyze",
            200,
            data=analysis_data
        )
        
        if success and response:
            # Check if response has expected fields
            expected_fields = ['signals', 'movement', 'action', 'confidence', 'summary']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                self.log_test(
                    "Chart Analysis Response Structure",
                    False,
                    f"Missing fields: {missing_fields}"
                )
            else:
                self.log_test(
                    "Chart Analysis Response Structure",
                    True,
                    "All expected fields present"
                )
        
        return success, response

    def test_chart_analysis_missing_fields(self):
        """Test chart analysis with missing required fields"""
        # Test missing imageBase64
        success1, _ = self.run_test(
            "Chart Analysis - Missing Image",
            "POST",
            "analyze",
            422,  # Validation error
            data={"symbol": "BTCUSDT", "timeframe": "1H"}
        )
        
        # Test missing symbol
        test_image = self.create_test_image_base64()
        success2, _ = self.run_test(
            "Chart Analysis - Missing Symbol",
            "POST",
            "analyze",
            422,  # Validation error
            data={"imageBase64": test_image, "timeframe": "1H"}
        )
        
        # Test missing timeframe
        success3, _ = self.run_test(
            "Chart Analysis - Missing Timeframe",
            "POST",
            "analyze",
            422,  # Validation error
            data={"imageBase64": test_image, "symbol": "BTCUSDT"}
        )
        
        return success1 and success2 and success3

    def test_chart_analysis_optional_fields(self):
        """Test chart analysis without optional trading style"""
        test_image = self.create_test_image_base64()
        
        analysis_data = {
            "imageBase64": test_image,
            "symbol": "EURUSD",
            "timeframe": "4H"
            # No tradingStyle - should still work
        }
        
        return self.run_test(
            "Chart Analysis - Without Trading Style",
            "POST",
            "analyze",
            200,
            data=analysis_data
        )

    def test_get_analyses(self):
        """Test getting recent analyses"""
        return self.run_test(
            "Get Recent Analyses",
            "GET",
            "analyses",
            200
        )

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test creating status check
        status_data = {"client_name": "test_client"}
        success1, response = self.run_test(
            "Create Status Check",
            "POST",
            "status",
            200,
            data=status_data
        )
        
        # Test getting status checks
        success2, _ = self.run_test(
            "Get Status Checks",
            "GET",
            "status",
            200
        )
        
        return success1 and success2

    def test_invalid_endpoints(self):
        """Test invalid endpoints return 404"""
        success, _ = self.run_test(
            "Invalid Endpoint",
            "GET",
            "nonexistent",
            404
        )
        return success

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting EnsoTrade Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)

        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test chart analysis functionality
        self.test_chart_analysis_valid()
        self.test_chart_analysis_missing_fields()
        self.test_chart_analysis_optional_fields()
        
        # Test other endpoints
        self.test_get_analyses()
        self.test_status_endpoints()
        
        # Test error handling
        self.test_invalid_endpoints()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check details above.")
            failed_tests = [test for test in self.test_results if not test['success']]
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
            return 1

def main():
    tester = EnsoTradeAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
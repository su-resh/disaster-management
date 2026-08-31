import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _isRequestingOTP = false;
  bool _isVerifyingOTP = false;
  String _errorMessage = '';
  String _successMessage = '';
  bool _showOTPField = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _requestOTP() async {
    setState(() {
      _isRequestingOTP = true;
      _errorMessage = '';
      _successMessage = '';
    });
    
    try {
      final response = await Supabase.instance.client.auth.signInWithOtp(
        phone: _phoneController.text,
      );
      
      if (response.error == null) {
        setState(() {
          _showOTPField = true;
          _successMessage = 'OTP sent to your phone';
        });
      } else {
        setState(() {
          _errorMessage = response.error?.message ?? 'Failed to send OTP';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() => _isRequestingOTP = false);
    }
  }

  Future<void> _verifyOTP() async {
    setState(() {
      _isVerifyingOTP = true;
      _errorMessage = '';
    });
    
    try {
      final response = await Supabase.instance.client.auth.verifyOtp(
        phone: _phoneController.text,
        token: _otpController.text,
        type: OtpType.sms,
      );
      
      if (response.error == null) {
        // OTP verification successful - user is now signed in
        // The AuthWrapper in main.dart will detect the session change and redirect to home
      } else {
        setState(() {
          _errorMessage = response.error?.message ?? 'Failed to verify OTP';
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() => _isVerifyingOTP = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                const Text(
                  'Disaster Response',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _showOTPField ? 'Verify OTP' : 'Login with Phone',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 20,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 32),
                if (_successMessage.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      border: Border.all(color: Colors.green.shade200),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _successMessage,
                      style: TextStyle(color: Colors.green.shade700),
                    ),
                  ),
                if (_errorMessage.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      border: Border.all(color: Colors.red.shade200),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _errorMessage,
                      style: TextStyle(color: Colors.red.shade700),
                    ),
                  ),
                const SizedBox(height: 24),
                if (!_showOTPField) ...[
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Phone Number',
                      prefixText: '+977 ',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _isRequestingOTP ? null : _requestOTP,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: _isRequestingOTP
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Send OTP'),
                  ),
                ] else ...[
                  TextField(
                    controller: _otpController,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    decoration: const InputDecoration(
                      labelText: 'OTP Code',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _isVerifyingOTP ? null : _verifyOTP,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: _isVerifyingOTP
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Verify OTP'),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _showOTPField = false;
                        _phoneController.clear();
                        _otpController.clear();
                        _errorMessage = '';
                        _successMessage = '';
                      });
                    },
                    child: const Text('Back to Enter Phone'),
                  ),
                ],
                const SizedBox(height: 24),
                const Text(
                  'Don\'t have an account? Contact system administrator to create one.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
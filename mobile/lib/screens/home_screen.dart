import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'report_emergency_screen.dart';
import 'my_reports_screen.dart';
import 'my_availability_screen.dart';
import 'my_assignments_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'User not logged in';
        });
        return;
      }

      final data = await Supabase.instance.client
          .from('profiles')
          .select('full_name, phone, role')
          .eq('id', user.id)
          .single();

      setState(() {
        _userData = data;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _refreshUserData() async {
    await _loadUserData();
  }

  @override
  Widget build(BuildContext context) {
    final isResponder = _userData?['role'] == 'responder';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Disaster Response'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshUserData,
            tooltip: 'Refresh',
          ),
          IconButton(
            icon: const Icon(Icons.list),
            tooltip: 'My Reports',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const MyReportsScreen(),
                ),
              );
            },
          ),
          if (isResponder)
            IconButton(
              icon: const Icon(Icons.assignment),
              tooltip: 'My Assignments',
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => const MyAssignmentsScreen(),
                  ),
                );
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Error: $_errorMessage',
                        style: const TextStyle(color: Colors.red),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _refreshUserData,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _userData == null
                  ? const Center(child: Text('No user data available'))
                  : Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.person,
                            size: 80,
                            color: Colors.blue,
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'Logged in as ${_userData!['full_name'] ?? _userData!['phone']}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Role: ${_userData!['role']}',
                            style: const TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                            ),
                          ),
                          if (isResponder) ...[
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) => const MyAvailabilityScreen(),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.toggle_on),
                              label: const Text('My Availability'),
                            ),
                            const SizedBox(height: 12),
                            OutlinedButton.icon(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) => const MyAssignmentsScreen(),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.assignment),
                              label: const Text('My Assignments'),
                            ),
                          ],
                        ],
                      ),
                    ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => const ReportEmergencyScreen(),
            ),
          );
        },
        tooltip: 'Report Emergency',
        child: const Icon(Icons.add_circle_outline),
      ),
    );
  }
}
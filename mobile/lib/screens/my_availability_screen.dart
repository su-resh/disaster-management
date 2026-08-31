import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MyAvailabilityScreen extends StatefulWidget {
  const MyAvailabilityScreen({super.key});

  @override
  State<MyAvailabilityScreen> createState() => _MyAvailabilityScreenState();
}

class _MyAvailabilityScreenState extends State<MyAvailabilityScreen> {
  Map<String, dynamic>? _responderData;
  bool _isLoading = true;
  String _errorMessage = '';
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadResponderData();
  }

  Future<void> _loadResponderData() async {
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
          .from('responders')
          .select('id, status, skills, vehicle_type, equipment_notes, last_status_update')
          .eq('id', user.id)
          .maybeSingle();

      setState(() {
        _responderData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  Future<void> _toggleAvailability() async {
    if (_responderData == null) return;

    final currentStatus = _responderData!['status'] as String;
    final newStatus = currentStatus == 'AVAILABLE' ? 'OFFLINE' : 'AVAILABLE';

    setState(() {
      _isSubmitting = true;
      _errorMessage = '';
    });

    try {
      await Supabase.instance.client
          .from('responders')
          .update({
            'status': newStatus,
            'last_status_update': DateTime.now().toIso8601String(),
          })
          .eq('id', _responderData!['id']);

      setState(() {
        _responderData!['status'] = newStatus;
        _responderData!['last_status_update'] = DateTime.now().toIso8601String();
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    if (_responderData == null) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = '';
    });

    try {
      await Supabase.instance.client
          .from('responders')
          .update({
            'status': newStatus,
            'last_status_update': DateTime.now().toIso8601String(),
          })
          .eq('id', _responderData!['id']);

      setState(() {
        _responderData!['status'] = newStatus;
        _responderData!['last_status_update'] = DateTime.now().toIso8601String();
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  bool get _canToggle {
    if (_responderData == null) return false;
    final status = _responderData!['status'] as String;
    return status == 'AVAILABLE' || status == 'OFFLINE';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Availability'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty && _responderData == null
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
                        onPressed: _loadResponderData,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _responderData == null
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text(
                          'You are not registered as a responder.\n\n'
                          'Contact an admin to be added as a responder.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 16),
                        ),
                      ),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildStatusCard(),
                          const SizedBox(height: 24),
                          _buildInfoCard(),
                          if (_errorMessage.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 16),
                              child: Text(
                                _errorMessage,
                                style: const TextStyle(color: Colors.red),
                              ),
                            ),
                        ],
                      ),
                    ),
    );
  }

  Widget _buildStatusCard() {
    final status = _responderData!['status'] as String;
    final statusColor = _getStatusColor(status);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Icon(
              _getStatusIcon(status),
              size: 48,
              color: statusColor,
            ),
            const SizedBox(height: 12),
            Text(
              status,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: statusColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Last updated: ${_formatDateTime(_responderData!['last_status_update'])}',
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            const SizedBox(height: 20),
            if (_canToggle)
              ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _toggleAvailability,
                icon: Icon(status == 'AVAILABLE' ? Icons.pause_circle : Icons.play_circle),
                label: Text(status == 'AVAILABLE' ? 'Go Offline' : 'Go Available'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Status is managed through assignments. Complete or reject your current assignment to change status.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.orange[800]),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    final skills = _responderData!['skills'] as List<dynamic>?;
    final vehicleType = _responderData!['vehicle_type'] as String?;
    final equipmentNotes = _responderData!['equipment_notes'] as String?;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'My Details',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (skills != null && skills.isNotEmpty) ...[
              const Text(
                'Skills',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: skills.map<Widget>((skill) {
                  return Chip(
                    label: Text(skill.toString()),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
            ],
            if (vehicleType != null && vehicleType.isNotEmpty) ...[
              const Text(
                'Vehicle Type',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(vehicleType),
              const SizedBox(height: 12),
            ],
            if (equipmentNotes != null && equipmentNotes.isNotEmpty) ...[
              const Text(
                'Equipment Notes',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(equipmentNotes),
            ],
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'AVAILABLE':
        return Colors.green;
      case 'ASSIGNED':
        return Colors.blue;
      case 'ON_WAY':
        return Colors.orange;
      case 'ON_TASK':
        return Colors.deepOrange;
      case 'OFFLINE':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'AVAILABLE':
        return Icons.check_circle;
      case 'ASSIGNED':
        return Icons.assignment;
      case 'ON_WAY':
        return Icons.directions_car;
      case 'ON_TASK':
        return Icons.build;
      case 'OFFLINE':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

  String _formatDateTime(dynamic timestamp) {
    if (timestamp == null) return 'Never';
    final dt = DateTime.parse(timestamp.toString());
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

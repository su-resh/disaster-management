import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MyAssignmentsScreen extends StatefulWidget {
  const MyAssignmentsScreen({super.key});

  @override
  State<MyAssignmentsScreen> createState() => _MyAssignmentsScreenState();
}

class _MyAssignmentsScreenState extends State<MyAssignmentsScreen> {
  List<Map<String, dynamic>> _assignments = [];
  bool _isLoading = true;
  String _errorMessage = '';
  RealtimeChannel? _subscription;

  @override
  void initState() {
    super.initState();
    _loadAssignments();
    _subscribeToAssignments();
  }

  @override
  void dispose() {
    _subscription?.unsubscribe();
    super.dispose();
  }

  void _subscribeToAssignments() {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    _subscription = Supabase.instance.client
        .channel('assignments-${user.id}')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'assignments',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'responder_id',
            value: user.id,
          ),
          callback: (payload) {
            _loadAssignments();
          },
        )
        .subscribe();
  }

  Future<void> _loadAssignments() async {
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

      final List<dynamic> data = await Supabase.instance.client
          .from('assignments')
          .select('''
            id,
            status,
            assigned_at,
            responded_at,
            completed_at,
            rejection_reason,
            emergency_requests!inner(
              id,
              status,
              location_text,
              people_count,
              severity_levels!inner(name, color_hint),
              disaster_types!inner(name)
            )
          ''')
          .eq('responder_id', user.id)
          .order('assigned_at', ascending: false);

      setState(() {
        _assignments = List<Map<String, dynamic>>.from(data);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  Future<void> _acceptAssignment(String assignmentId) async {
    try {
      await Supabase.instance.client
          .from('assignments')
          .update({
            'status': 'ACCEPTED',
            'responded_at': DateTime.now().toIso8601String(),
          })
          .eq('id', assignmentId);

      await Supabase.instance.client
          .from('responders')
          .update({
            'status': 'ASSIGNED',
            'last_status_update': DateTime.now().toIso8601String(),
          })
          .eq('id', Supabase.instance.client.auth.currentUser!.id);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Assignment accepted')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _rejectAssignment(String assignmentId, String reason) async {
    try {
      await Supabase.instance.client
          .from('assignments')
          .update({
            'status': 'REJECTED',
            'rejection_reason': reason,
            'responded_at': DateTime.now().toIso8601String(),
          })
          .eq('id', assignmentId);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Assignment rejected')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _progressStatus(String assignmentId, String currentStatus) async {
    final statusFlow = {
      'ACCEPTED': 'ON_WAY',
      'ON_WAY': 'ON_TASK',
      'ON_TASK': 'COMPLETED',
    };

    final responderStatusMap = {
      'ACCEPTED': 'ASSIGNED',
      'ON_WAY': 'ON_WAY',
      'ON_TASK': 'ON_TASK',
      'COMPLETED': 'AVAILABLE',
    };

    final newStatus = statusFlow[currentStatus];
    final newResponderStatus = responderStatusMap[newStatus];

    if (newStatus == null || newResponderStatus == null) return;

    try {
      final updateData = <String, dynamic>{
        'status': newStatus,
      };

      if (newStatus == 'COMPLETED') {
        updateData['completed_at'] = DateTime.now().toIso8601String();
      }

      await Supabase.instance.client
          .from('assignments')
          .update(updateData)
          .eq('id', assignmentId);

      await Supabase.instance.client
          .from('responders')
          .update({
            'status': newResponderStatus,
            'last_status_update': DateTime.now().toIso8601String(),
          })
          .eq('id', Supabase.instance.client.auth.currentUser!.id);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Status updated to $newStatus')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  void _showRejectDialog(String assignmentId) {
    String selectedReason = 'wrong_skill_match';
    final otherController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Reject Assignment'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Please select a reason:'),
              const SizedBox(height: 12),
              DropdownButton<String>(
                value: selectedReason,
                isExpanded: true,
                items: const [
                  DropdownMenuItem(value: 'wrong_skill_match', child: Text('Wrong skill match')),
                  DropdownMenuItem(value: 'unavailable', child: Text('Unavailable')),
                  DropdownMenuItem(value: 'too_far', child: Text('Too far')),
                  DropdownMenuItem(value: 'other', child: Text('Other')),
                ],
                onChanged: (value) {
                  setDialogState(() {
                    selectedReason = value!;
                  });
                },
              ),
              if (selectedReason == 'other') ...[
                const SizedBox(height: 12),
                TextField(
                  controller: otherController,
                  decoration: const InputDecoration(
                    labelText: 'Please specify',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final reason = selectedReason == 'other'
                    ? otherController.text.trim()
                    : selectedReason;
                Navigator.of(context).pop();
                if (selectedReason != 'other' || reason.isNotEmpty) {
                  _rejectAssignment(assignmentId, reason);
                }
              },
              child: const Text('Reject'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Assignments'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty && _assignments.isEmpty
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
                        onPressed: _loadAssignments,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _assignments.isEmpty
                  ? const Center(
                      child: Text(
                        'No assignments yet.\n\nNew assignments will appear here in real-time.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 16),
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadAssignments,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _assignments.length,
                        itemBuilder: (context, index) {
                          final assignment = _assignments[index];
                          return _buildAssignmentCard(assignment);
                        },
                      ),
                    ),
    );
  }

  Widget _buildAssignmentCard(Map<String, dynamic> assignment) {
    final emergency = assignment['emergency_requests'] as Map<String, dynamic>?;
    if (emergency == null) return const SizedBox.shrink();

    final severity = emergency['severity_levels'] as Map<String, dynamic>?;
    final disasterType = emergency['disaster_types'] as Map<String, dynamic>?;
    final assignmentStatus = assignment['status'] as String;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _getSeverityColor(severity?['name']),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    disasterType?['name'] ?? 'Unknown',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                _buildStatusBadge(assignmentStatus),
              ],
            ),
            const SizedBox(height: 12),
            _buildInfoRow('Severity', severity?['name'] ?? 'Unknown'),
            _buildInfoRow('People Affected', '${emergency['people_count'] ?? 0}'),
            _buildInfoRow('Location', emergency['location_text'] ?? 'Unknown'),
            _buildInfoRow('Assigned At', _formatDateTime(assignment['assigned_at'])),
            const SizedBox(height: 16),
            _buildActionButtons(assignment),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final color = _getAssignmentStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildActionButtons(Map<String, dynamic> assignment) {
    final status = assignment['status'] as String;
    final assignmentId = assignment['id'] as String;

    switch (status) {
      case 'ASSIGNED':
        return Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _acceptAssignment(assignmentId),
                icon: const Icon(Icons.check),
                label: const Text('Accept'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _showRejectDialog(assignmentId),
                icon: const Icon(Icons.close),
                label: const Text('Reject'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                ),
              ),
            ),
          ],
        );
      case 'ACCEPTED':
        return ElevatedButton.icon(
          onPressed: () => _progressStatus(assignmentId, status),
          icon: const Icon(Icons.directions_car),
          label: const Text('Mark On My Way'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.orange,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 44),
          ),
        );
      case 'ON_WAY':
        return ElevatedButton.icon(
          onPressed: () => _progressStatus(assignmentId, status),
          icon: const Icon(Icons.build),
          label: const Text('Mark On Task'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.deepOrange,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 44),
          ),
        );
      case 'ON_TASK':
        return ElevatedButton.icon(
          onPressed: () => _progressStatus(assignmentId, status),
          icon: const Icon(Icons.check_circle),
          label: const Text('Mark Completed'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 44),
          ),
        );
      case 'COMPLETED':
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.green[50],
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle, color: Colors.green),
              SizedBox(width: 8),
              Text('Completed', style: TextStyle(color: Colors.green)),
            ],
          ),
        );
      case 'REJECTED':
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.red[50],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.cancel, color: Colors.red, size: 20),
                  SizedBox(width: 8),
                  Text('Rejected', style: TextStyle(color: Colors.red)),
                ],
              ),
              if (assignment['rejection_reason'] != null) ...[
                const SizedBox(height: 4),
                Text(
                  'Reason: ${_formatRejectionReason(assignment['rejection_reason'])}',
                  style: TextStyle(color: Colors.red[700], fontSize: 13),
                ),
              ],
            ],
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }

  Color _getSeverityColor(String? severity) {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return Colors.red;
      case 'high':
        return Colors.orange;
      case 'medium':
        return Colors.yellow;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Color _getAssignmentStatusColor(String status) {
    switch (status) {
      case 'ASSIGNED':
        return Colors.blue;
      case 'ACCEPTED':
        return Colors.lightBlue;
      case 'REJECTED':
        return Colors.red;
      case 'ON_WAY':
        return Colors.orange;
      case 'ON_TASK':
        return Colors.deepOrange;
      case 'COMPLETED':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _formatRejectionReason(String reason) {
    switch (reason) {
      case 'wrong_skill_match':
        return 'Wrong skill match';
      case 'unavailable':
        return 'Unavailable';
      case 'too_far':
        return 'Too far';
      default:
        return reason;
    }
  }

  String _formatDateTime(dynamic timestamp) {
    if (timestamp == null) return 'Unknown';
    final dt = DateTime.parse(timestamp.toString());
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

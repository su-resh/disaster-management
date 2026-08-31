import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import 'report_detail_screen.dart';

class MyReportsScreen extends StatefulWidget {
  const MyReportsScreen({super.key});

  @override
  State<MyReportsScreen> createState() => _MyReportsScreenState();
}

class _MyReportsScreenState extends State<MyReportsScreen> {
  List<Map<String, dynamic>> _reports = [];
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
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
          .from('emergency_requests')
          .select('''
            id,
            status,
            created_at,
            disaster_types!inner(name),
            severity_levels!inner(name)
          ''')
          .eq('created_by', user.id)
          .order('created_at', ascending: false);

      setState(() {
        _reports = List<Map<String, dynamic>>.from(data);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  Future<void> _refreshReports() async {
    await _loadReports();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Reports'),
      ),
body: _isLoading
           ? const Center(child: CircularProgressIndicator())
           : _errorMessage.isNotEmpty
               ? Center(
                   child: Text(_errorMessage,
                       style: const TextStyle(color: Colors.red)),
                 )
               : _reports.isEmpty
                   ? const Center(
                       child: Text('No reports found'),
                     )
                   : RefreshIndicator(
                       onRefresh: _refreshReports,
                       child: ListView.builder(
                         itemCount: _reports.length,
                         itemBuilder: (context, index) {
                           final report = _reports[index];
                           final disasterTypeName =
                               report['disaster_types']?['name'] ?? 'Unknown';
                           final severityName =
                               report['severity_levels']?['name'] ?? 'Unknown';
                           final createdAt =
                               DateTime.parse(report['created_at']);
                           final formattedDate =
                               DateFormat.yMMMd().add_jm().format(createdAt);

                           return Card(
                             margin: const EdgeInsets.symmetric(
                                 horizontal: 16, vertical: 8),
                             child: ListTile(
                               leading: Column(
                                 mainAxisAlignment:
                                     MainAxisAlignment.center,
                                 children: [
                                   Icon(Icons.priority_high,
                                       color: _getSeverityColor(
                                           severityName)),
                                 ],
                               ),
                               title: Text(
                                 'Disaster: $disasterTypeName',
                                 style: const TextStyle(
                                     fontWeight: FontWeight.bold),
                               ),
                               subtitle: Column(
                                 crossAxisAlignment:
                                     CrossAxisAlignment.start,
                                 children: [
                                   Text('Severity: $severityName'),
                                   Text('Status: ${report['status']}'),
                                   Text('Date: $formattedDate'),
                                 ],
                               ),
                               onTap: () {
                                 // Navigate to detail screen
                                 Navigator.of(context).push(
                                   MaterialPageRoute(
                                     builder: (context) =>
                                         ReportDetailScreen(
                                           reportId: report['id']),
                                   ),
                                 );
                               },
                             ),
                           );
                         },
                       ),
                     ),
    );
  }

  Color _getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
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
}
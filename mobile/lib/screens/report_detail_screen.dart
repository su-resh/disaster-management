import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';

class ReportDetailScreen extends StatefulWidget {
  final String reportId;

  const ReportDetailScreen({super.key, required this.reportId});

  @override
  State<ReportDetailScreen> createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  Map<String, dynamic>? _report;
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final Map<String, dynamic> data = await Supabase.instance.client
          .from('emergency_requests')
          .select('''
            id,
            created_at,
            updated_at,
            status,
            emergency_type,
            severity_id,
            severity_levels!inner(name, rank),
            disaster_type_id,
            disaster_types!inner(name),
            people_count,
            injured_count,
            description,
            latitude,
            longitude,
            location_text,
            contact_phone,
            special_needs,
            photo_url,
            rejected_reason,
            verified_by,
            verified_at,
            profiles!emergency_requests_created_by_fkey!inner(full_name, phone)
          ''')
          .eq('id', widget.reportId)
          .single();

      if (!mounted) return;
      setState(() {
        _report = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Details'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _report == null
              ? Center(
                  child: Text(_errorMessage),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Basic Info Card
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Emergency Report',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge,
                              ),
                              const Divider(),
                              _buildDetailRow(
                                  'Disaster Type',
                                  _report!['disaster_types']['name']),
                              _buildDetailRow(
                                  'Severity',
                                  _report!['severity_levels']['name']),
                              _buildDetailRow(
                                  'Emergency Type',
                                  _report!['emergency_type']),
                              _buildDetailRow(
                                  'Status',
                                  _report!['status'],
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: _getStatusColor(
                                        _report!['status']),
                                  )),
                              _buildDetailRow(
                                  'Date Reported',
                                  DateFormat.yMMMd()
                                      .add_jm()
                                      .format(DateTime.parse(
                                          _report!['created_at']))),
                              if (_report!['updated_at'] !=
                                  _report!['created_at'])
                                _buildDetailRow(
                                    'Last Updated',
                                    DateFormat.yMMMd()
                                        .add_jm()
                                        .format(DateTime.parse(
                                            _report!['updated_at']))),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Details Card
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Details',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge,
                              ),
                              const Divider(),
                              _buildDetailRow(
                                  'People Affected',
                                  '${_report!['people_count']}'),
                              _buildDetailRow(
                                  'Injured People',
                                  '${_report!['injured_count']}'),
                              _buildDetailRow(
                                  'Description',
                                  _report!['description'],
                                  maxLines: 5),
                              _buildDetailRow(
                                  'Location Description',
                                  _report!['location_text']),
                              _buildDetailRow(
                                  'GPS Coordinates',
                                  'Latitude: ${_report!['latitude'].toStringAsFixed(6)}, Longitude: ${_report!['longitude'].toStringAsFixed(6)}'),
                              _buildDetailRow(
                                  'Contact Phone',
                                  _report!['contact_phone']),
                              if (_report!['special_needs'] != null &&
                                  _report!['special_needs'].isNotEmpty)
                                _buildDetailRow(
                                    'Special Needs',
                                    _report!['special_needs']),
                              if (_report!['photo_url'] != null &&
                                  _report!['photo_url'].isNotEmpty)
                                _buildDetailRow(
                                    'Photo URL',
                                    _report!['photo_url']),
                              if (_report!['rejected_reason'] != null &&
                                  _report!['rejected_reason'].isNotEmpty)
                                _buildDetailRow(
                                    'Rejected Reason',
                                    _report!['rejected_reason']),
                              if (_report!['verified_by'] != null)
                                _buildDetailRow(
                                    'Verified By',
                                    '${_report!['profiles']['full_name'] ?? _report!['profiles']['phone']}'),
                              if (_report!['verified_at'] != null)
                                _buildDetailRow(
                                    'Verified At',
                                    DateFormat.yMMMd()
                                        .add_jm()
                                        .format(DateTime.parse(
                                            _report!['verified_at']))),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _buildDetailRow(String label, dynamic value,
      {int maxLines = 1, TextStyle? style}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(
              value.toString(),
              style: style,
              maxLines: maxLines,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'new':
        return Colors.blue;
      case 'verified':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'assigned':
        return Colors.orange;
      case 'responder_on_way':
        return Colors.orange.shade700;
      case 'rescuing':
        return Colors.orange;
      case 'rescued':
        return Colors.green;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }
}
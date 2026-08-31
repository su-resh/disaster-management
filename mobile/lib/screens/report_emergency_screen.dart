import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:geolocator/geolocator.dart';

class ReportEmergencyScreen extends StatefulWidget {
  const ReportEmergencyScreen({super.key});

  @override
  State<ReportEmergencyScreen> createState() => _ReportEmergencyScreenState();
}

class _ReportEmergencyScreenState extends State<ReportEmergencyScreen> {
  final _formKey = GlobalKey<FormState>();
  List<Map<String, dynamic>> _disasterTypes = [];
  List<Map<String, dynamic>> _severityLevels = [];
  String? _selectedDisasterTypeId;
  String? _selectedSeverityId;
  final TextEditingController _emergencyTypeController = TextEditingController();
  final TextEditingController _peopleCountController = TextEditingController();
  final TextEditingController _injuredCountController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _locationTextController = TextEditingController();
  final TextEditingController _contactPhoneController = TextEditingController();
  final TextEditingController _specialNeedsController = TextEditingController();

  Position? _currentPosition;
  bool _isLoading = true;
  bool _isLoadingLocation = true;
  String _errorMessage = '';
  bool _isSubmitting = false;
  Map<String, dynamic>? _userProfile;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    setState(() {
      _isLoading = true;
      _isLoadingLocation = true;
    });

    try {
      // Fetch lookup tables
      final List<dynamic> disasterTypes = await Supabase.instance.client
          .from('disaster_types')
          .select('id, name')
          .eq('is_active', true);

      final List<dynamic> severityLevels = await Supabase.instance.client
          .from('severity_levels')
          .select('id, name');

      // Fetch user profile to get phone number
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        if (!mounted) return;
        setState(() {
          _errorMessage = 'User not logged in';
          _isLoading = false;
          _isLoadingLocation = false;
        });
        return;
      }

      final Map<String, dynamic> profile = await Supabase.instance.client
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single();

      // supabase-dart v2 throws on error; reaching here means all fetches succeeded.
      if (!mounted) return;
      setState(() {
        _disasterTypes = List<Map<String, dynamic>>.from(disasterTypes);
        _severityLevels = List<Map<String, dynamic>>.from(severityLevels);
        _userProfile = profile;
        _contactPhoneController.text = _userProfile!['phone'] ?? '';
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
        _isLoadingLocation = false;
      });
    }

    // Get current location
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    try {
      bool serviceEnabled;
      LocationPermission permission;

      // Test if location services are enabled.
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _isLoadingLocation = false;
          _errorMessage = 'Location services are disabled.';
        });
        return;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _isLoadingLocation = false;
            _errorMessage = 'Location permissions are denied';
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _isLoadingLocation = false;
          _errorMessage = 'Location permissions are permanently denied';
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);
      setState(() {
        _currentPosition = position;
        _isLoadingLocation = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingLocation = false;
        _errorMessage = 'Failed to get location: $e';
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = '';
    });

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        throw Exception('User not logged in');
      }

      // Validate that we have a location
      if (_currentPosition == null) {
        throw Exception('Location not available');
      }

      // Validate selections
      if (_selectedDisasterTypeId == null) {
        throw Exception('Please select a disaster type');
      }
      if (_selectedSeverityId == null) {
        throw Exception('Please select a severity level');
      }

      await Supabase.instance.client
          .from('emergency_requests')
          .insert({
        'created_by': user.id,
        'disaster_type_id': _selectedDisasterTypeId,
        'emergency_type': _emergencyTypeController.text.trim(),
        'status': 'NEW',
        'severity_id': _selectedSeverityId,
        'people_count': int.parse(_peopleCountController.text),
        'injured_count': _injuredCountController.text.isEmpty
            ? 0
            : int.parse(_injuredCountController.text),
        'description': _descriptionController.text.trim(),
        'latitude': _currentPosition!.latitude,
        'longitude': _currentPosition!.longitude,
        'location_text': _locationTextController.text.trim(),
        'contact_phone': _contactPhoneController.text.trim(),
        'special_needs': _specialNeedsController.text.trim(),
        // photo_url, rejected_reason, verified_by, verified_at are null by default
      });

      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
      });

      // Show success message and clear form
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Emergency report submitted successfully')),
      );

      // Optionally, navigate to my reports or clear the form
      _formKey.currentState!.reset();
      setState(() {
        _emergencyTypeController.clear();
        _peopleCountController.clear();
        _injuredCountController.text = '0';
        _descriptionController.clear();
        _locationTextController.clear();
        _specialNeedsController.clear();
        _contactPhoneController.text = _userProfile!['phone'] ?? '';
        _selectedDisasterTypeId = null;
        _selectedSeverityId = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _errorMessage = e.toString();
      });
    }
  }

  @override
  void dispose() {
    _emergencyTypeController.dispose();
    _peopleCountController.dispose();
    _injuredCountController.dispose();
    _descriptionController.dispose();
    _locationTextController.dispose();
    _contactPhoneController.dispose();
    _specialNeedsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Emergency'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Disaster Type Dropdown
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        labelText: 'Disaster Type',
                        border: OutlineInputBorder(),
                      ),
                      value: _selectedDisasterTypeId,
                      items: _disasterTypes.map((type) {
                        return DropdownMenuItem<String>(
                          value: type['id'].toString(),
                          child: Text(type['name']),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedDisasterTypeId = value;
                        });
                      },
                      validator: (value) =>
                          value == null ? 'Please select a disaster type' : null,
                    ),
                    const SizedBox(height: 16),
                    // Severity Dropdown
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(
                        labelText: 'Severity',
                        border: OutlineInputBorder(),
                      ),
                      value: _selectedSeverityId,
                      items: _severityLevels.map((level) {
                        return DropdownMenuItem<String>(
                          value: level['id'].toString(),
                          child: Text(level['name']),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedSeverityId = value;
                        });
                      },
                      validator: (value) =>
                          value == null ? 'Please select a severity level' : null,
                    ),
                    const SizedBox(height: 16),
                    // Emergency Type
                    TextFormField(
                      controller: _emergencyTypeController,
                      decoration: const InputDecoration(
                        labelText: 'Emergency Type (e.g., flood, fire, etc.)',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) =>
                          value == null || value.isEmpty
                              ? 'Please enter emergency type'
                              : null,
                    ),
                    const SizedBox(height: 16),
                    // People Count
                    TextFormField(
                      controller: _peopleCountController,
                      decoration: const InputDecoration(
                        labelText: 'Number of People Affected',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter number of people';
                        }
                        if (int.tryParse(value) == null) {
                          return 'Please enter a valid number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    // Injured Count
                    TextFormField(
                      controller: _injuredCountController,
                      decoration: const InputDecoration(
                        labelText: 'Number of Injured People (optional)',
                        border: OutlineInputBorder(),
                        hintText: 'Default is 0',
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) return null;
                        if (int.tryParse(value) == null) {
                          return 'Please enter a valid number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    // Description
                    TextFormField(
                      controller: _descriptionController,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                      validator: (value) =>
                          value == null || value.isEmpty
                              ? 'Please enter a description'
                              : null,
                    ),
                    const SizedBox(height: 16),
                    // Location Section
                    const Text(
                      'Location',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    // Current GPS coordinates
                    _isLoadingLocation
                        ? const CircularProgressIndicator()
                        : _currentPosition == null
                            ? Text(
                                'Location not available',
                                style: TextStyle(color: Colors.red),
                              )
                            : Text(
                                'Current Location: Latitude: ${_currentPosition!.latitude.toStringAsFixed(6)}, Longitude: ${_currentPosition!.longitude.toStringAsFixed(6)}',
                              ),
                    const SizedBox(height: 8),
                    // Location Text Field
                    TextFormField(
                      controller: _locationTextController,
                      decoration: const InputDecoration(
                        labelText: 'Location Description (landmark-based)',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) =>
                          value == null || value.isEmpty
                              ? 'Please enter location description'
                              : null,
                    ),
                    const SizedBox(height: 16),
                    // Contact Phone
                    TextFormField(
                      controller: _contactPhoneController,
                      decoration: const InputDecoration(
                        labelText: 'Contact Phone Number',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.phone,
                      validator: (value) =>
                          value == null || value.isEmpty
                              ? 'Please enter contact phone number'
                              : null,
                    ),
                    const SizedBox(height: 16),
                    // Special Needs
                    TextFormField(
                      controller: _specialNeedsController,
                      decoration: const InputDecoration(
                        labelText: 'Special Needs (optional)',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 24),
                    // Submit Button
                    ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitForm,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                          : const Text('Submit Emergency Report'),
                    ),
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
            ),
    );
  }
}
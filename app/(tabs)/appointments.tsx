import { useCRM } from '@/contexts/CRMContext';
import { useNotificationBadges } from '@/contexts/NotificationBadgeContext';
import { useFocusEffect } from '@react-navigation/native';
import Colors from '@/constants/colors';
import { Plus, Calendar as CalendarIcon, Clock, User, Edit2, ChevronDown, Search, X } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import type { Appointment } from '@/types';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import type { AppointmentType } from '@/types';

export default function AppointmentsScreen() {
  const { appointments, clients, properties, addAppointment, updateAppointment, deleteAppointment, isLoading } = useCRM();
  const { clearAppointmentsBadge } = useNotificationBadges();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [newAppointment, setNewAppointment] = useState({
    title: '',
    type: 'meeting' as AppointmentType,
    clientId: '',
    propertyId: '',
    date: '',
    time: '',
    notes: '',
    completed: false,
  });

  const [clientSearchModalVisible, setClientSearchModalVisible] = useState(false);
  const [propertySearchModalVisible, setPropertySearchModalVisible] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const count = appointments.filter(a => {
        const apptDate = new Date(a.date);
        return apptDate >= now && !a.completed;
      }).length;
      clearAppointmentsBadge(count);
    }, [clearAppointmentsBadge, appointments])
  );

  const groupedAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppts = appointments.filter(a => {
      const apptDate = new Date(a.date);
      return apptDate.getTime() === today.getTime();
    });

    const upcomingAppts = appointments.filter(a => {
      const apptDate = new Date(a.date);
      return apptDate > today;
    });

    const pastAppts = appointments.filter(a => {
      const apptDate = new Date(a.date);
      return apptDate < today || a.completed;
    });

    return { todayAppts, upcomingAppts, pastAppts };
  }, [appointments]);

  const handleOpenEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setNewAppointment({
      title: appointment.title,
      type: appointment.type,
      clientId: appointment.clientId,
      propertyId: appointment.propertyId || '',
      date: appointment.date,
      time: appointment.time,
      notes: appointment.notes,
      completed: appointment.completed,
    });
    setModalVisible(true);
  };

  const handleAddAppointment = async () => {
    console.log('handleAddAppointment called', { newAppointment, editingAppointment });
    
    if (!newAppointment.title) {
      console.log('Missing title');
      alert('Please enter a title');
      return;
    }
    
    if (!newAppointment.clientId) {
      console.log('Missing clientId');
      alert('Please select a client');
      return;
    }
    
    if (!newAppointment.date) {
      console.log('Missing date');
      alert('Please select a date');
      return;
    }

    if (!newAppointment.time) {
      console.log('Missing time');
      alert('Please select a time');
      return;
    }

    const appointmentData = {
      ...newAppointment,
      propertyId: newAppointment.propertyId || undefined,
    };

    try {
      console.log('Attempting to save appointment:', appointmentData);
      
      if (editingAppointment) {
        console.log('Updating existing appointment');
        await updateAppointment(editingAppointment.id, appointmentData);
        console.log('Updated successfully');
      } else {
        console.log('Adding new appointment');
        await addAppointment(appointmentData);
        console.log('Added successfully');
      }

      setModalVisible(false);
      setTimeout(() => {
        setNewAppointment({
          title: '',
          type: 'meeting',
          clientId: '',
          propertyId: '',
          date: '',
          time: '',
          notes: '',
          completed: false,
        });
        setEditingAppointment(null);
      }, 300);
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert(`Failed to save appointment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setEditingAppointment(null);
      setNewAppointment({
        title: '',
        type: 'meeting',
        clientId: '',
        propertyId: '',
        date: '',
        time: '',
        notes: '',
        completed: false,
      });
      setClientSearchQuery('');
      setPropertySearchQuery('');
      setDatePickerVisible(false);
      setTimePickerVisible(false);
      setClientSearchModalVisible(false);
      setPropertySearchModalVisible(false);
    }, 300);
  };

  const handleDeleteAppointment = async () => {
    if (editingAppointment) {
      await deleteAppointment(editingAppointment.id);
      handleCloseModal();
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    await updateAppointment(id, { completed: !completed });
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getPropertyTitle = (propertyId?: string) => {
    if (!propertyId) return null;
    const property = properties.find(p => p.id === propertyId);
    return property?.title || null;
  };

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const query = clientSearchQuery.toLowerCase();
    return clients.filter(client => 
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.includes(query)
    );
  }, [clients, clientSearchQuery]);

  const filteredProperties = useMemo(() => {
    if (!propertySearchQuery.trim()) return properties;
    const query = propertySearchQuery.toLowerCase();
    return properties.filter(property => 
      property.title.toLowerCase().includes(query) ||
      property.location.toLowerCase().includes(query) ||
      property.type.toLowerCase().includes(query)
    );
  }, [properties, propertySearchQuery]);

  const handleSelectClient = (clientId: string) => {
    setNewAppointment({ ...newAppointment, clientId });
    setClientSearchModalVisible(false);
    setClientSearchQuery('');
  };

  const handleSelectProperty = (propertyId: string) => {
    setNewAppointment({ ...newAppointment, propertyId });
    setPropertySearchModalVisible(false);
    setPropertySearchQuery('');
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const handleConfirmDate = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    setNewAppointment({ ...newAppointment, date: dateStr });
    setDatePickerVisible(false);
  };

  const handleConfirmTime = () => {
    const timeStr = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    setNewAppointment({ ...newAppointment, time: timeStr });
    setTimePickerVisible(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const renderAppointment = (appointment: typeof appointments[0]) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentTitleRow}>
          <Text style={[
            styles.appointmentTitle,
            appointment.completed && styles.appointmentTitleCompleted
          ]}>
            {appointment.title}
          </Text>
          {appointment.completed && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.typeChip}>
          <Text style={styles.typeChipText}>{appointment.type}</Text>
        </View>
      </View>

      <View style={styles.appointmentInfo}>
        <View style={styles.infoRow}>
          <User size={16} color={Colors.textSecondary} />
          <Text style={styles.infoText}>{getClientName(appointment.clientId)}</Text>
        </View>
        {appointment.propertyId && getPropertyTitle(appointment.propertyId) && (
          <View style={styles.infoRow}>
            <CalendarIcon size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{getPropertyTitle(appointment.propertyId)}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Clock size={16} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
          </Text>
        </View>
      </View>
      {appointment.notes && (
        <Text style={styles.appointmentNotes}>{appointment.notes}</Text>
      )}
      <View style={styles.appointmentActions}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleToggleComplete(appointment.id, appointment.completed)}
        >
          <Text style={styles.completeButtonText}>
            {appointment.completed ? 'Mark Incomplete' : 'Mark Complete'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleOpenEdit(appointment)}
        >
          <Edit2 size={16} color={Colors.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.listContainer}>
        {groupedAppointments.todayAppts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today</Text>
            {groupedAppointments.todayAppts.map(renderAppointment)}
          </View>
        )}

        {groupedAppointments.upcomingAppts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {groupedAppointments.upcomingAppts.map(renderAppointment)}
          </View>
        )}

        {groupedAppointments.pastAppts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past</Text>
            {groupedAppointments.pastAppts.map(renderAppointment)}
          </View>
        )}

        {appointments.length === 0 && (
          <View style={styles.emptyState}>
            <CalendarIcon size={48} color={Colors.textLight} />
            <Text style={styles.emptyStateText}>No appointments scheduled</Text>
            <Text style={styles.emptyStateSubtext}>Tap + to create your first appointment</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWrapper}>
            <ScrollView 
              style={styles.modalScrollView}
              onScroll={(event) => {
                const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                setIsAtBottom(isBottom);
              }}
              scrollEventThrottle={16}
            >
              <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingAppointment ? 'Edit Appointment' : 'New Appointment'}</Text>

              <View style={styles.typePicker}>
                <Text style={styles.typePickerLabel}>Type</Text>
                <View style={styles.typeChipsRow}>
                  {(['viewing', 'meeting', 'call'] as AppointmentType[]).map((type, index) => (
                    <TouchableOpacity
                      key={`type-${index}`}
                      style={[
                        styles.typeChipModal,
                        newAppointment.type === type && styles.typeChipModalSelected,
                      ]}
                      onPress={() => setNewAppointment({ ...newAppointment, type })}
                    >
                      <Text
                        style={[
                          styles.typeChipModalText,
                          newAppointment.type === type && styles.typeChipModalTextSelected,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter appointment title"
                  value={newAppointment.title}
                  onChangeText={(text) => setNewAppointment({ ...newAppointment, title: text })}
                />
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Date *</Text>
                <TouchableOpacity
                  style={styles.searchableInput}
                  onPress={() => {
                    console.log('Date picker button pressed');
                    if (newAppointment.date) {
                      setSelectedDate(new Date(newAppointment.date));
                    } else {
                      setSelectedDate(new Date());
                    }
                    setDatePickerVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <CalendarIcon size={20} color={Colors.textSecondary} />
                  <Text style={[
                    styles.searchableInputText,
                    !newAppointment.date && styles.searchableInputPlaceholder,
                    { marginLeft: 8 }
                  ]}>
                    {newAppointment.date 
                      ? new Date(newAppointment.date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Time *</Text>
                <TouchableOpacity
                  style={styles.searchableInput}
                  onPress={() => {
                    console.log('Time picker button pressed');
                    if (newAppointment.time) {
                      const [hour, minute] = newAppointment.time.split(':').map(Number);
                      setSelectedHour(hour);
                      setSelectedMinute(minute);
                    } else {
                      setSelectedHour(9);
                      setSelectedMinute(0);
                    }
                    setTimePickerVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Clock size={20} color={Colors.textSecondary} />
                  <Text style={[
                    styles.searchableInputText,
                    !newAppointment.time && styles.searchableInputPlaceholder,
                    { marginLeft: 8 }
                  ]}>
                    {newAppointment.time || 'Select time'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Client *</Text>
                <TouchableOpacity
                  style={styles.searchableInput}
                  onPress={() => {
                    console.log('Client picker button pressed');
                    setClientSearchModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.searchableInputText,
                    !newAppointment.clientId && styles.searchableInputPlaceholder
                  ]}>
                    {newAppointment.clientId 
                      ? getClientName(newAppointment.clientId)
                      : 'Select a client'}
                  </Text>
                  <ChevronDown size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Property (Optional)</Text>
                <TouchableOpacity
                  style={styles.searchableInput}
                  onPress={() => {
                    console.log('Property picker button pressed');
                    setPropertySearchModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.searchableInputText,
                    !newAppointment.propertyId && styles.searchableInputPlaceholder
                  ]}>
                    {newAppointment.propertyId 
                      ? getPropertyTitle(newAppointment.propertyId)
                      : 'Select a property (optional)'}
                  </Text>
                  <ChevronDown size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add any additional notes"
                  value={newAppointment.notes}
                  multiline
                  numberOfLines={3}
                  onChangeText={(text) => setNewAppointment({ ...newAppointment, notes: text })}
                />
              </View>

              <View style={{ height: 120 }} />
              </View>
            </ScrollView>
            <View style={[styles.modalButtonsFixed, isAtBottom && styles.modalButtonsStatic]}>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                {editingAppointment && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={handleDeleteAppointment}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleAddAppointment}
                >
                  <Text style={styles.submitButtonText}>{editingAppointment ? 'Save' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={clientSearchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setClientSearchModalVisible(false)}
        presentationStyle="overFullScreen"
      >
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>Select Client</Text>
              <TouchableOpacity onPress={() => setClientSearchModalVisible(false)}>
                <Text style={styles.searchModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, email, or phone"
                value={clientSearchQuery}
                onChangeText={setClientSearchQuery}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.searchListItem,
                    newAppointment.clientId === item.id && styles.searchListItemSelected
                  ]}
                  onPress={() => handleSelectClient(item.id)}
                >
                  <View style={styles.searchListItemContent}>
                    <Text style={styles.searchListItemTitle}>{item.name}</Text>
                    <Text style={styles.searchListItemSubtitle}>
                      {item.email} • {item.phone}
                    </Text>
                  </View>
                  {newAppointment.clientId === item.id && (
                    <View style={styles.searchListItemCheck}>
                      <Text style={styles.searchListItemCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptySearchState}>
                  <Text style={styles.emptySearchText}>No clients found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={propertySearchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPropertySearchModalVisible(false)}
        presentationStyle="overFullScreen"
      >
        <View style={styles.searchModalOverlay}>
          <View style={styles.searchModalContent}>
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>Select Property</Text>
              <TouchableOpacity onPress={() => setPropertySearchModalVisible(false)}>
                <Text style={styles.searchModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title, location, or type"
                value={propertySearchQuery}
                onChangeText={setPropertySearchQuery}
                autoFocus
              />
            </View>
            <FlatList
              data={[{ id: '__none__', title: 'None', location: '', type: '' } as any, ...filteredProperties]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.searchListItem,
                    newAppointment.propertyId === item.id && styles.searchListItemSelected
                  ]}
                  onPress={() => handleSelectProperty(item.id === '__none__' ? '' : item.id)}
                >
                  {item.photos && item.photos.length > 0 && (
                    <Image
                      source={{ uri: item.photos[0] }}
                      style={styles.propertyThumbnail}
                    />
                  )}
                  <View style={styles.searchListItemContent}>
                    <Text style={styles.searchListItemTitle}>{item.title}</Text>
                    {item.location && (
                      <Text style={styles.searchListItemSubtitle}>
                        {item.location} • {item.type}
                      </Text>
                    )}
                  </View>
                  {newAppointment.propertyId === item.id && (
                    <View style={styles.searchListItemCheck}>
                      <Text style={styles.searchListItemCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptySearchState}>
                  <Text style={styles.emptySearchText}>No properties found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={datePickerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDatePickerVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity 
          style={styles.pickerModalOverlay}
          onPress={() => setDatePickerVisible(false)}
          activeOpacity={1}
        >
          <TouchableOpacity 
            style={styles.calendarModalContent}
            activeOpacity={1}
          >
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNavButton}>
                <Text style={styles.monthNavText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthYearText}>
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavButton}>
                <Text style={styles.monthNavText}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {(() => {
                const { firstDay, daysInMonth } = getDaysInMonth(selectedDate);
                const days = [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const calendarKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`;
                
                for (let i = 0; i < firstDay; i++) {
                  days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
                }
                
                for (let day = 1; day <= daysInMonth; day++) {
                  const isSelected = selectedDate.getDate() === day;
                  const dateToCheck = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
                  const isToday = dateToCheck.getTime() === today.getTime();
                  
                  days.push(
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.dayCell,
                        styles.dayButton,
                        isSelected && styles.daySelected,
                        isToday && !isSelected && styles.dayToday,
                      ]}
                      onPress={() => handleDateSelect(day)}
                    >
                      <Text style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isToday && !isSelected && styles.dayTextToday,
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                
                return days;
              })()}
            </View>

            <View style={styles.pickerModalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDatePickerVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleConfirmDate}
              >
                <Text style={styles.submitButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={timePickerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setTimePickerVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity 
          style={styles.pickerModalOverlay}
          onPress={() => setTimePickerVisible(false)}
          activeOpacity={1}
        >
          <TouchableOpacity 
            style={styles.timeModalContent}
            activeOpacity={1}
          >
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timePickerContainer}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Hour</Text>
                <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                    <TouchableOpacity
                      key={`hour-${hour}`}
                      style={[
                        styles.timeOption,
                        selectedHour === hour && styles.timeOptionSelected,
                      ]}
                      onPress={() => setSelectedHour(hour)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedHour === hour && styles.timeOptionTextSelected,
                      ]}>
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>Minute</Text>
                <ScrollView style={styles.timeScrollView} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <TouchableOpacity
                      key={`minute-${minute}`}
                      style={[
                        styles.timeOption,
                        selectedMinute === minute && styles.timeOptionSelected,
                      ]}
                      onPress={() => setSelectedMinute(minute)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedMinute === minute && styles.timeOptionTextSelected,
                      ]}>
                        {String(minute).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.pickerModalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setTimePickerVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleConfirmTime}
              >
                <Text style={styles.submitButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  completeButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  appointmentTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  completedBadge: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
    textTransform: 'capitalize',
  },
  appointmentInfo: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  appointmentNotes: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  modalContentWrapper: {
    height: '90%',
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  searchableInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
  },
  searchableInputText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  searchableInputPlaceholder: {
    color: Colors.textLight,
  },
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  searchModalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 20,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  searchModalClose: {
    fontSize: 28,
    color: Colors.textSecondary,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 12,
    paddingLeft: 12,
  },
  searchListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchListItemSelected: {
    backgroundColor: Colors.background,
  },
  searchListItemContent: {
    flex: 1,
  },
  searchListItemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  searchListItemSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  searchListItemCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchListItemCheckText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  emptySearchState: {
    padding: 40,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalButtonsFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButtonsStatic: {
    position: 'relative' as const,
    shadowOpacity: 0,
    elevation: 0,
    borderTopWidth: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  typePicker: {
    marginBottom: 16,
  },
  typePickerLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  typeChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChipModal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeChipModalSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipModalText: {
    fontSize: 14,
    color: Colors.text,
  },
  typeChipModalTextSelected: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 3,
  },
  calendarModalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  monthNavText: {
    fontSize: 28,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButton: {
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: Colors.primary,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 16,
    color: Colors.text,
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  pickerModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  timeModalContent: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    height: 200,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeColumnLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  timeScrollView: {
    maxHeight: 180,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: Colors.primary,
  },
  timeOptionText: {
    fontSize: 18,
    color: Colors.text,
  },
  timeOptionTextSelected: {
    color: '#fff',
    fontWeight: '700' as const,
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginHorizontal: 8,
  },
  propertyThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: Colors.background,
  },
});

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_BASE_URL = 'https://expense-tracker-h030.onrender.com';

interface Expense {
  id: number | string;
  amount: number;
  description: string;
  category: string;
  date: string;
}

const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data: Expense[] = await response.json();
      setExpenses(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const newExpense = {
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      date: new Date().toISOString(),
    };

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense),
      });
      if (!response.ok) throw new Error('Failed to add expense');
      const savedExpense: Expense = await response.json();
      setExpenses(prev => [savedExpense, ...prev]);
      setAmount('');
      setDescription('');
      setCategory('Food');
      setShowAddModal(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = (id: number | string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExpenseAPI(id),
        },
      ]
    );
  };

  const deleteExpenseAPI = async (id: number | string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete expense');
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredExpenses = () => {
    if (selectedFilter === 'All') return expenses;
    return expenses.filter(expense => expense.category === selectedFilter);
  };

  const getTotalAmount = () => {
    const filtered = getFilteredExpenses();
    return filtered.reduce((total, expense) => total + expense.amount, 0);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Food: '🍔',
      Transportation: '🚌',
      Entertainment: '🎬',
      Shopping: '🛍️',
      Bills: '🧾',
      Health: '💊',
      Other: '📦',
    };
    return icons[category] || '📦';
  };

  const renderExpenseItem: ListRenderItem<Expense> = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseHeader}>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseIcon}>{getCategoryIcon(item.category)}</Text>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseDescription}>{item.description}</Text>
            <Text style={styles.expenseCategory}>
              {item.category} • {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>-${item.amount.toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteExpense(item.id)}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFilterButton = (filterCategory: string) => (
    <TouchableOpacity
      key={filterCategory}
      style={[
        styles.filterButton,
        selectedFilter === filterCategory && styles.activeFilterButton,
      ]}
      onPress={() => setSelectedFilter(filterCategory)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filterCategory && styles.activeFilterButtonText,
        ]}
      >
        {filterCategory}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expense Tracker</Text>
        <Text style={styles.totalAmount}>Total: ${getTotalAmount().toFixed(2)}</Text>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {['All', ...categories].map(renderFilterButton)}
      </ScrollView>

      {/* Expenses List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6c5ce7" />
        </View>
      ) : (
        <FlatList<Expense>
          data={getFilteredExpenses()}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.expensesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add your first expense</Text>
            </View>
          }
        />
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Expense</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#999"
            />

            <Text style={styles.categoryLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.activeCategoryButton,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={styles.categoryIcon}>{getCategoryIcon(cat)}</Text>
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat && styles.activeCategoryButtonText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={addExpense}>
              <Text style={styles.saveButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    padding: 16,
    backgroundColor: '#6c5ce7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  totalAmount: { color: '#fff', fontSize: 18 },
  filterContainer: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f5f5f5' },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 10,
  },
  activeFilterButton: { backgroundColor: '#6c5ce7' },
  filterButtonText: { color: '#333', fontWeight: '600' },
  activeFilterButtonText: { color: '#fff' },
  expensesList: { paddingHorizontal: 16, paddingBottom: 100 },
  expenseItem: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseHeader: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  expenseInfo: { flexDirection: 'row', alignItems: 'center' },
  expenseIcon: { fontSize: 24, marginRight: 12 },
  expenseDetails: { maxWidth: '70%' },
  expenseDescription: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  expenseCategory: { color: '#666', fontSize: 14, marginTop: 4 },
  expenseRight: { flexDirection: 'row', alignItems: 'center' },
  expenseAmount: { fontWeight: 'bold', fontSize: 16, marginRight: 12, color: '#d63031' },
  deleteButton: {
    backgroundColor: '#d63031',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#6c5ce7',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  addButtonText: { color: '#fff', fontSize: 36, lineHeight: 36 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalCloseButton: { padding: 4 },
  modalCloseText: { fontSize: 24, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 16,
    fontSize: 16,
  },
  categoryLabel: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  categoryContainer: { marginTop: 10 },
  categoryButton: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCategoryButton: { backgroundColor: '#6c5ce7' },
  categoryIcon: { fontSize: 20, marginRight: 8 },
  categoryButtonText: { color: '#333', fontWeight: '600' },
  activeCategoryButtonText: { color: '#fff' },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#6c5ce7',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 6, fontStyle: 'italic' },
});

export default ExpenseTracker;

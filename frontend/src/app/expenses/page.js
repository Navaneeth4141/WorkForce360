'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout.js';
import API from '../../lib/api.js';
import { DollarSign, Tag, Plus, X, Search, Calendar, ChevronRight } from 'lucide-react';

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'categories'
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Add Expense Modal State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    categoryId: '', expenseName: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], description: ''
  });

  // Add Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const catRes = await API.get('/expenses/categories');
      setCategories(catRes.data);
      if (catRes.data.length > 0) {
        setExpenseForm(prev => ({ ...prev, categoryId: catRes.data[0].id }));
      }

      const expRes = await API.get(`/expenses?categoryId=${selectedCategoryId}&search=${search}`);
      setExpenses(expRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategoryId]);

  // Submit Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await API.post('/expenses', expenseForm);
      setMessage(`Expense "${expenseForm.expenseName}" logged successfully`);
      setExpenseModalOpen(false);
      setExpenseForm({
        categoryId: categories[0]?.id || '',
        expenseName: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        description: ''
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to log expense');
    }
  };

  // Submit Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await API.post('/expenses/categories', categoryForm);
      setMessage(`Expense category "${categoryForm.name}" created successfully`);
      setCategoryModalOpen(false);
      setCategoryForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create category');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Corporate Expenses</h2>
            <p className="text-sm text-slate-500 mt-0.5">Track utility expenditures, operational transportation costs, and general manual business outlays.</p>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1 text-sm font-semibold shrink-0">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeTab === 'expenses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Expenses Ledger
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-1.5 rounded-md transition-all ${
                activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Categories List
            </button>
          </div>
        </div>

        {/* Global Alert */}
        {message && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-800 text-xs font-semibold flex justify-between">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-emerald-500 hover:text-emerald-700">✕</button>
          </div>
        )}

        {/* TAB 1: EXPENSES LEDGER */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            
            {/* Filter and Add block */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by expense name or comments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full border border-slate-200 rounded pl-9 pr-4 py-2 text-xs bg-slate-50 focus:outline-none"
                  />
                </div>
                
                <div className="w-48">
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  if (categories.length === 0) {
                    alert('Please create at least one category first before logging an expense.');
                    return;
                  }
                  setExpenseForm(prev => ({ ...prev, categoryId: categories[0].id }));
                  setExpenseModalOpen(true);
                }}
                className="dashboard-btn-primary text-xs py-2 flex items-center shrink-0 w-full md:w-auto justify-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Log Expense
              </button>
            </div>

            {/* Expenses List Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-4">Expense Details</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Payment Date</th>
                      <th className="p-4">Comments</th>
                      <th className="p-4 text-right">Amount (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {loading ? (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-400">Loading expenses...</td></tr>
                    ) : expenses.length === 0 ? (
                      <tr><td colSpan={5} className="p-6 text-center text-slate-400 italic">No expenses found matching the search criteria.</td></tr>
                    ) : (
                      expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-800">{exp.expenseName}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              {exp.category.name}
                            </span>
                          </td>
                          <td className="p-4">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                          <td className="p-4 max-w-[200px] truncate">{exp.description || '-'}</td>
                          <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(exp.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CATEGORIES LIST */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-semibold">Expense Categories</h3>
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="dashboard-btn-primary text-xs py-1.5 flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
              </button>
            </div>

            {/* Categories list grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                <div className="col-span-4 text-center py-6 text-slate-400">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="col-span-4 text-center py-6 text-slate-400 italic bg-white border rounded-xl">No categories found.</div>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-50 text-blue-600">
                        <Tag className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs">{cat.name}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{cat.description || 'No description provided.'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal: Log Expense */}
        {expenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <form onSubmit={handleAddExpense} className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
                <h3 className="text-base font-bold flex items-center"><DollarSign className="w-5 h-5 mr-1" /> Log Business Expense</h3>
                <button type="button" onClick={() => setExpenseModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Category *</label>
                  <select
                    value={expenseForm.categoryId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs bg-slate-50 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Expense Reference/Name *</label>
                  <input
                    type="text"
                    required
                    value={expenseForm.expenseName}
                    placeholder="e.g. Office electricity bill"
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseName: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (Rs) *</label>
                    <input
                      type="number"
                      required
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={expenseForm.expenseDate}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                      className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Description / Comments</label>
                  <textarea
                    rows={2}
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 space-x-2">
                <button type="button" onClick={() => setExpenseModalOpen(false)} className="dashboard-btn-secondary text-xs">Cancel</button>
                <button type="submit" className="dashboard-btn-primary text-xs">Log Cost</button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Add Category */}
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <form onSubmit={handleAddCategory} className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
                <h3 className="text-base font-bold flex items-center"><Tag className="w-5 h-5 mr-2" /> Add Category</h3>
                <button type="button" onClick={() => setCategoryModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    placeholder="e.g. Refreshments"
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="block w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 space-x-2">
                <button type="button" onClick={() => setCategoryModalOpen(false)} className="dashboard-btn-secondary text-xs">Cancel</button>
                <button type="submit" className="dashboard-btn-primary text-xs">Save Category</button>
              </div>
            </form>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}

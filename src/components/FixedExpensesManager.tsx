// src/components/FixedExpensesManager.tsx
import { useState } from "react";

export const FixedExpensesManager = () => {
  const [expenses, setExpenses] = useState([
    { id: 1, name: "Mortgage / Rent", amount: 950, frequency: "monthly" },
    { id: 2, name: "Council Tax", amount: 150, frequency: "monthly" },
    { id: 3, name: "Utilities", amount: 180, frequency: "monthly" },
    { id: 4, name: "Car Insurance", amount: 85, frequency: "monthly" },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState(0);

  const monthlyTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const startEdit = (id) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      setNewName(expense.name);
      setNewAmount(expense.amount);
      setEditingId(id);
    }
  };

  const saveEdit = () => {
    setExpenses(expenses.map(e => 
      e.id === editingId 
        ? { ...e, name: newName, amount: newAmount }
        : e
    ));
    setEditingId(null);
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const editingExpense = expenses.find(e => e.id === editingId);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h2 style={{ marginBottom: '20px' }}>Fixed Expenses</h2>
      
      <div style={{ marginBottom: '20px' }}>
        {expenses.map(expense => (
          <div key={expense.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
            {editingId === expense.id ? (
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ marginRight: '10px', padding: '5px' }}
                  placeholder="Name"
                />
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  style={{ marginRight: '10px', padding: '5px' }}
                  placeholder="Amount"
                />
                <button onClick={saveEdit} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '4px' }}>
                  Save
                </button>
                <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', backgroundColor: 'gray', color: 'white', border: 'none', borderRadius: '4px' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <span>{expense.name}</span>
                <span style={{ marginLeft: '10px' }}>: £{expense.amount}</span>
                <button onClick={() => startEdit(expense.id)} style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: 'blue', color: 'white', border: 'none', borderRadius: '4px' }}>
                  Edit
                </button>
                <button onClick={() => deleteExpense(expense.id)} style={{ marginLeft: '5px', padding: '5px 10px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '4px' }}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'right', fontSize: '24px', fontWeight: 'bold', color: 'green' }}>
        Total: £{monthlyTotal}
      </div>
    </div>
  );
};

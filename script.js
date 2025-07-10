// Data storage
let transactions = [];
let editingId = null;

// Categories
const incomeCategories = [
  "Salary",
  "Freelance",
  "Investment",
  "Business",
  "Other",
];
const expenseCategories = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Healthcare",
  "Education",
  "Other",
];

// Initialize app
document.addEventListener("DOMContentLoaded", function () {
  loadFromStorage();
  setCurrentDate();
  updateSummary();
  renderTransactions();
  updateChart();
  populateFilterCategories();
});

// Set current date as default
function setCurrentDate() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("incomeDate").value = today;
  document.getElementById("expenseDate").value = today;
}

// Form submissions
document.getElementById("incomeForm").addEventListener("submit", function (e) {
  e.preventDefault();
  addTransaction("income");
});

document.getElementById("expenseForm").addEventListener("submit", function (e) {
  e.preventDefault();
  addTransaction("expense");
});

document.getElementById("editForm").addEventListener("submit", function (e) {
  e.preventDefault();
  updateTransaction();
});

// Add transaction
function addTransaction(type) {
  const date = document.getElementById(type + "Date").value;
  const description = document.getElementById(type + "Description").value;
  const category = document.getElementById(type + "Category").value;
  const amount = parseFloat(document.getElementById(type + "Amount").value);

  // Validation
  if (!date || !description || !category || !amount || amount <= 0) {
    showError(type + "Error", "Please fill in all fields with valid data");
    return;
  }

  // Create transaction object
  const transaction = {
    id: Date.now() + Math.random(),
    type: type,
    date: date,
    description: description,
    category: category,
    amount: amount,
  };

  // Add to transactions array
  transactions.push(transaction);

  // Update display
  updateSummary();
  renderTransactions();
  updateChart();
  populateFilterCategories();

  // Save to storage
  saveToStorage();

  // Clear form
  document.getElementById(type + "Form").reset();
  setCurrentDate();

  // Show success message
  showSuccess(type + "Success", "Transaction added successfully!");
}

// Update summary
function updateSummary() {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  document.getElementById("totalIncome").textContent = `₹${income.toFixed(2)}`;
  document.getElementById("totalExpense").textContent = `₹${expense.toFixed(
    2
  )}`;
  document.getElementById("netBalance").textContent = `₹${balance.toFixed(2)}`;

  // Update balance color
  const balanceEl = document.getElementById("netBalance");
  balanceEl.className = "amount " + (balance >= 0 ? "income" : "expense");
}

// Render transactions
function renderTransactions() {
  const container = document.getElementById("transactionsList");
  const typeFilter = document.getElementById("filterType").value;
  const categoryFilter = document.getElementById("filterCategory").value;

  let filteredTransactions = transactions;

  // Apply filters
  if (typeFilter !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.type === typeFilter
    );
  }

  if (categoryFilter !== "all") {
    filteredTransactions = filteredTransactions.filter(
      (t) => t.category === categoryFilter
    );
  }

  // Sort by date (newest first)
  filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filteredTransactions.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #666; padding: 20px;">No transactions found</p>';
    return;
  }

  container.innerHTML = filteredTransactions
    .map(
      (transaction) => `
                <div class="transaction-item ${transaction.type}">
                    <div class="transaction-header">
                        <div>
                            <strong>${transaction.description}</strong>
                            <div class="transaction-amount ${transaction.type}">
                                ${
                                  transaction.type === "income" ? "+" : "-"
                                }₹${transaction.amount.toFixed(2)}
                            </div>
                        </div>
                        <div class="transaction-actions">
                            <button class="btn-small btn-edit" onclick="editTransaction(${
                              transaction.id
                            })">Edit</button>
                            <button class="btn-small btn-delete" onclick="deleteTransaction(${
                              transaction.id
                            })">Delete</button>
                        </div>
                    </div>
                    <div class="transaction-details">
                        <span>📅 ${new Date(
                          transaction.date
                        ).toLocaleDateString()}</span>
                        <span>🏷️ ${transaction.category}</span>
                    </div>
                </div>
            `
    )
    .join("");
}

// Edit transaction
function editTransaction(id) {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) return;

  editingId = id;

  // Populate edit form
  document.getElementById("editDate").value = transaction.date;
  document.getElementById("editDescription").value = transaction.description;
  document.getElementById("editAmount").value = transaction.amount;

  // Populate category dropdown
  const editCategorySelect = document.getElementById("editCategory");
  editCategorySelect.innerHTML = "";
  const categories =
    transaction.type === "income" ? incomeCategories : expenseCategories;
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    option.selected = cat === transaction.category;
    editCategorySelect.appendChild(option);
  });

  // Show modal
  document.getElementById("editModal").style.display = "block";
}

// Update transaction
function updateTransaction() {
  const transaction = transactions.find((t) => t.id === editingId);
  if (!transaction) return;

  transaction.date = document.getElementById("editDate").value;
  transaction.description = document.getElementById("editDescription").value;
  transaction.category = document.getElementById("editCategory").value;
  transaction.amount = parseFloat(document.getElementById("editAmount").value);

  // Update display
  updateSummary();
  renderTransactions();
  updateChart();
  populateFilterCategories();

  // Save to storage
  saveToStorage();

  // Close modal
  closeEditModal();
}

// Close edit modal
function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
  editingId = null;
}

// Delete transaction
function deleteTransaction(id) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    transactions = transactions.filter((t) => t.id !== id);
    updateSummary();
    renderTransactions();
    updateChart();
    populateFilterCategories();
    saveToStorage();
  }
}

// Populate filter categories
function populateFilterCategories() {
  const categoryFilter = document.getElementById("filterCategory");
  const currentValue = categoryFilter.value;

  // Get unique categories from transactions
  const categories = [...new Set(transactions.map((t) => t.category))].sort();

  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore previous selection
  categoryFilter.value = currentValue;
}

// Filter event listeners
document
  .getElementById("filterType")
  .addEventListener("change", renderTransactions);
document
  .getElementById("filterCategory")
  .addEventListener("change", renderTransactions);

// Chart functionality
function updateChart() {
  const canvas = document.getElementById("expenseChart");
  const ctx = canvas.getContext("2d");

  // Get expense data by category
  const expensesByCategory = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      expensesByCategory[t.category] =
        (expensesByCategory[t.category] || 0) + t.amount;
    });

  const categories = Object.keys(expensesByCategory);
  const values = Object.values(expensesByCategory);

  if (categories.length === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#666";
    ctx.fillText(
      "No expense data to display",
      canvas.width / 2,
      canvas.height / 2
    );
    return;
  }

  // Simple pie chart
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 50;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const total = values.reduce((sum, val) => sum + val, 0);
  let currentAngle = 0;

  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#FF6384",
    "#C9CBCF",
  ];

  categories.forEach((category, index) => {
    const sliceAngle = (values[index] / total) * 2 * Math.PI;

    // Draw slice
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    // Draw label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
    const labelY = centerY + Math.sin(labelAngle) * (radius + 30);

    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(category, labelX, labelY);
    ctx.fillText(`₹${values[index].toFixed(0)}`, labelX, labelY + 15);

    currentAngle += sliceAngle;
  });
}

// Storage functions
function saveToStorage() {
  try {
    const data = JSON.stringify(transactions);
    // Using a global variable instead of localStorage
    window.expenseTrackerData = data;
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

function loadFromStorage() {
  try {
    const data = window.expenseTrackerData;
    if (data) {
      transactions = JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading data:", error);
    transactions = [];
  }
}

// Export/Import functions
function exportData() {
  const data = JSON.stringify(transactions, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expense-tracker-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        transactions = importedData;
        updateSummary();
        renderTransactions();
        updateChart();
        populateFilterCategories();
        saveToStorage();
        alert("Data imported successfully!");
      } else {
        alert("Invalid file format");
      }
    } catch (error) {
      alert("Error importing data: " + error.message);
    }
  };
  reader.readAsText(file);
}

// Utility functions
function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.style.display = "block";
  setTimeout(() => {
    errorEl.style.display = "none";
  }, 3000);
}

function showSuccess(elementId, message) {
  const successEl = document.getElementById(elementId);
  successEl.textContent = message;
  successEl.style.display = "block";
  setTimeout(() => {
    successEl.style.display = "none";
  }, 3000);
}

// Modal click outside to close
window.onclick = function (event) {
  const modal = document.getElementById("editModal");
  if (event.target === modal) {
    closeEditModal();
  }
};

// Resize chart on window resize
window.addEventListener("resize", function () {
  setTimeout(updateChart, 100);
});

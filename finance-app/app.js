const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('token');

if (!token) {
    alert('Please login to access transactions.');
    window.location.href = 'login.html';
}

// Logout functionality
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// Load Transactions
async function loadTransactions(filterCategory = 'all') {
    try {
        const response = await fetch(`${API_URL}/transactions`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const transactions = await response.json();
        const transactionsList = document.getElementById('transactionsList');
        transactionsList.innerHTML = '';

        let categorySummary = {};
        let totalSpent = 0;

        transactions.forEach(({ description, amount, category, date, _id }) => {
            if (filterCategory !== 'all' && category !== filterCategory) return;

            const li = document.createElement('li');
            li.innerHTML = `
                <span class="description">${description}</span>
                <span class="amount">$${amount}</span>
                <span class="category">${category}</span>
                <span class="date">${new Date(date).toLocaleDateString()}</span>
                <button class="delete-btn" data-id="${_id}">Delete</button>
            `;
            transactionsList.appendChild(li);

            // Update summary for categories
            if (!categorySummary[category]) {
                categorySummary[category] = 0;
            }
            categorySummary[category] += amount;

            totalSpent += amount;
        });

        // Update Category Summary
        const categorySummaryDiv = document.getElementById('categorySummary');
        categorySummaryDiv.innerHTML = '';
        for (let category in categorySummary) {
            const div = document.createElement('div');
            div.innerHTML = `${category}: $${categorySummary[category].toFixed(2)}`;
            categorySummaryDiv.appendChild(div);
        }

        // Update Total Spent
        const totalSpentDiv = document.getElementById('totalSpent');
        totalSpentDiv.innerHTML = `Total Spent: $${totalSpent.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Load transactions on page load
loadTransactions();

// Add Transaction
document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;

    try {
        const response = await fetch(`${API_URL}/add-transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ description, amount, category }),
        });

        if (response.ok) {
            alert('Transaction added!');
            loadTransactions(); // Refresh the transactions list
        } else {
            alert('Failed to add transaction.');
        }
    } catch (error) {
        alert('Error adding transaction: ' + error.message);
    }
});

// Delete Transaction
document.getElementById('transactionsList').addEventListener('click', async (e) => {
    if (e.target && e.target.classList.contains('delete-btn')) {
        const transactionId = e.target.getAttribute('data-id');

        try {
            const response = await fetch(`${API_URL}/delete-transaction/${transactionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                alert('Transaction deleted!');
                loadTransactions(); // Refresh the list after deletion
            } else {
                alert('Failed to delete transaction.');
            }
        } catch (error) {
            alert('Error deleting transaction: ' + error.message);
        }
    }
});

// Filter Transactions by Category
document.getElementById('categoryFilter').addEventListener('change', (e) => {
    const selectedCategory = e.target.value;
    loadTransactions(selectedCategory);
});

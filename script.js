let totalBalance = 0;

// Load existing transactions from local storage when the page loads
window.onload = function() {
    const storedTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
    storedTransactions.forEach(transaction => {
        addTransactionToTable(transaction.description, transaction.amount, transaction.dateTime, transaction.type);
    });
    // Recalculate total balance
    calculateTotalBalance(storedTransactions);
};

function addTransaction() {
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const transactionType = document.querySelector('input[name="transactionType"]:checked').value;

    if (!description || isNaN(amount)) {
        alert("Please enter a valid description and amount.");
        return;
    }

    const now = new Date();
    const dateTime = now.toLocaleString(); // Format date and time

    // Save transaction details
    const transaction = {
        description,
        amount,
        dateTime,
        type: transactionType
    };

    // Update local storage
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Add transaction to table
    addTransactionToTable(description, amount, dateTime, transactionType);
    calculateTotalBalance(transactions);

    // Clear inputs
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
}

function addTransactionToTable(description, amount, dateTime, type) {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${description}</td>
        <td>${amount.toFixed(2)}</td>
        <td>${dateTime}</td>
        <td><button onclick="removeTransaction(this)">Remove</button></td>
    `;

    if (type === 'income') {
        document.getElementById('income-body').appendChild(newRow);
    } else {
        document.getElementById('expense-body').appendChild(newRow);
    }
}

function removeTransaction(button) {
    const row = button.parentElement.parentElement; // Get the row of the button
    const description = row.cells[0].innerText; // Get the description from the row
    const amount = parseFloat(row.cells[1].innerText); // Get the amount from the row
    const dateTime = row.cells[2].innerText; // Get the date and time from the row
    const type = button.parentElement.previousElementSibling.innerText.includes('Income') ? 'income' : 'expense';

    // Load existing transactions from local storage
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Filter out the removed transaction
    const updatedTransactions = transactions.filter(transaction => {
        return !(transaction.description === description && transaction.amount === amount && transaction.dateTime === dateTime && transaction.type === type);
    });

    // Update local storage with the new list of transactions
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

    // Remove the row from the table
    row.remove();
    calculateTotalBalance(updatedTransactions);
}

function calculateTotalBalance(transactions) {
    totalBalance = transactions.reduce((acc, transaction) => {
        return transaction.type === 'income' ? acc + transaction.amount : acc - transaction.amount;
    }, 0);
    document.getElementById('total-balance').textContent = totalBalance.toFixed(2);
}

function toggleVisibility(containerId) {
    const incomeContainer = document.getElementById('income-container');
    const expenseContainer = document.getElementById('expense-container');

    if (containerId === 'income-container') {
        incomeContainer.style.display = incomeContainer.style.display === 'none' ? 'block' : 'none';
        expenseContainer.style.display = 'none';
    } else {
        expenseContainer.style.display = expenseContainer.style.display === 'none' ? 'block' : 'none';
        incomeContainer.style.display = 'none';
    }
}

async function generateWeeklyReport() {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Weekly Finance Report", 14, 20);
    
    // Add a line break
    doc.setFontSize(12);
    doc.text(`Total Balance: Rs.${totalBalance.toFixed(2)}`, 14, 30);
    
    // Add a horizontal line
    doc.line(14, 33, 196, 33);
    
    // Add headers for the table
    const headers = ["Type", "Description", "Amount (Rs.)", "Date & Time"];
    const startY = 40;
    const rowHeight = 10;
    const margin = 14;

    // Set font styles for headers
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");

    headers.forEach((header, index) => {
        doc.text(header, margin + index * 45, startY);
    });

    // Add horizontal line below headers
    doc.line(margin, startY + 2, 196 - margin, startY + 2);

    // Reset font for content
    doc.setFont("helvetica", "normal");
    
    let y = startY + rowHeight;

    // Loop through transactions and add to the PDF
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.forEach(transaction => {
        const transactionType = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
        doc.text(transactionType, margin, y);
        doc.text(transaction.description, margin + 45, y);
        doc.text(transaction.amount.toFixed(2), margin + 90, y);
        doc.text(transaction.dateTime, margin + 135, y);
        y += rowHeight;
    });

    // Add total balance at the end of the report
    doc.setFont("helvetica", "bold");
    doc.text(`Total Balance: Rs.${totalBalance.toFixed(2)}`, margin, y + 10);

    // Save the PDF
    doc.save("weekly_report.pdf");
}

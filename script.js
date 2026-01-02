// App State Management
let invoices = JSON.parse(localStorage.getItem("invoices")) || [];
let logs = JSON.parse(localStorage.getItem("logs")) || [];
let bizName = localStorage.getItem("bizName") || "RetailPro";
let currency = localStorage.getItem("currency") || "$";
let taxLabel = localStorage.getItem("taxLabel") || "GST";
let taxRate = parseFloat(localStorage.getItem("taxRate")) || 0;
let myChart;

// 1. View Switching
function showView(v) {
    document.querySelectorAll('.page-view').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    document.getElementById('view-' + v).style.display = 'block';
    document.getElementById('nav-' + v).classList.add('active');
}

// 2. Billing & Records
function renderDashboard() {
    const list = document.getElementById("invoiceList");
    const head = document.getElementById("tableHead");
    head.innerHTML = `<tr><th>Customer</th><th>Total Bill</th><th>Status</th><th>Actions</th></tr>`;
    
    let paidTotal = 0; let pendingTotal = 0;
    list.innerHTML = "";

    invoices.forEach((inv, i) => {
        const total = parseFloat(inv.amount) * (1 + (taxRate / 100));
        if(inv.status === 'Paid') paidTotal += total; else pendingTotal += total;

        list.innerHTML += `
            <tr>
                <td><strong>${inv.name}</strong><br><small>${inv.date}</small></td>
                <td>${currency}${total.toFixed(2)}</td>
                <td><span class="status-badge" style="background:${inv.status === 'Paid' ? '#10b981' : '#ef4444'}">${inv.status}</span></td>
                <td>
                    <i class="fas fa-check-double" onclick="markPaid(${i})" style="color:#4f46e5; cursor:pointer; margin-right:12px" title="Mark as Paid"></i>
                    <i class="fas fa-print" onclick="printInvoice(${i})" style="color:#10b981; cursor:pointer; margin-right:12px"></i>
                    <i class="fas fa-trash-alt" onclick="deleteInvoice(${i})" style="color:#ef4444; cursor:pointer"></i>
                </td>
            </tr>`;
    });

    document.getElementById("totalRevenue").innerText = `${currency}${paidTotal.toLocaleString()}`;
    document.getElementById("totalPending").innerText = `${currency}${pendingTotal.toLocaleString()}`;
    localStorage.setItem("invoices", JSON.stringify(invoices));
    updateChart();
}

function saveInvoice() {
    const name = document.getElementById("clientName").value;
    const amount = document.getElementById("amount").value;
    const status = document.getElementById("paymentStatus").value;
    
    if(!name || !amount) return alert("Missing entry details!");

    invoices.push({ 
        name, 
        amount: parseFloat(amount), 
        status, 
        date: new Date().toLocaleDateString(),
        fullDate: new Date().toISOString() // Used for Daily Report
    });

    addLog(`Transaction: ${name} (${status})`);
    document.getElementById("clientName").value = ""; 
    document.getElementById("amount").value = "";
    renderDashboard();
}

// 3. Daily Report Feature
function generateDailyReport() {
    const today = new Date().toLocaleDateString();
    const todaysSales = invoices.filter(inv => inv.date === today);
    
    let cash = 0; let udhaar = 0;
    todaysSales.forEach(inv => {
        const total = inv.amount * (1 + (taxRate / 100));
        if(inv.status === 'Paid') cash += total; else udhaar += total;
    });

    const reportWin = window.open('', '_blank');
    reportWin.document.write(`
        <body style="font-family:sans-serif; padding:40px; text-align:center;">
            <h1>Daily Sales Report</h1>
            <p>Date: ${today} | Store: ${bizName}</p>
            <hr>
            <div style="display:flex; justify-content:space-around; margin-top:30px;">
                <div style="color:green"><h2>Cash Collected</h2><h1>${currency}${cash.toFixed(2)}</h1></div>
                <div style="color:red"><h2>New Udhaar</h2><h1>${currency}${udhaar.toFixed(2)}</h1></div>
            </div>
            <p style="margin-top:40px;">Total Transactions Today: ${todaysSales.length}</p>
            <button onclick="window.print()" style="padding:10px 20px; background:#4f46e5; color:white; border:none; border-radius:5px; cursor:pointer;">Print Report</button>
        </body>
    `);
}

// 4. Utility Functions
function searchTable() {
    let filter = document.getElementById("searchInput").value.toLowerCase();
    let rows = document.getElementById("invoiceList").getElementsByTagName("tr");
    for (let row of rows) {
        row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
    }
}

function markPaid(i) {
    if(invoices[i].status === 'Paid') return alert("Already Paid!");
    invoices[i].status = 'Paid';
    addLog(`Payment received from ${invoices[i].name}`);
    renderDashboard();
}

function deleteInvoice(i) {
    if(confirm("Permanently delete this record?")) {
        invoices.splice(i, 1);
        renderDashboard();
    }
}

function printInvoice(i) {
    const inv = invoices[i];
    const total = inv.amount * (1 + (taxRate / 100));
    const win = window.open('', '_blank');
    win.document.write(`
        <body style="font-family:sans-serif; padding:30px;">
            <center><h2>${bizName}</h2><p>${localStorage.getItem("bizAddr") || ""}</p></center>
            <hr>
            <p><b>Customer:</b> ${inv.name}</p>
            <p><b>Date:</b> ${inv.date}</p>
            <table style="width:100%; border:1px solid #ddd; border-collapse:collapse; margin-top:20px;">
                <tr style="background:#f4f4f4;"><th>Description</th><th>Amount</th></tr>
                <tr><td style="padding:10px; border:1px solid #ddd;">General Items</td><td style="padding:10px; border:1px solid #ddd;">${currency}${inv.amount.toFixed(2)}</td></tr>
                <tr><td style="padding:10px; border:1px solid #ddd;">${taxLabel} (${taxRate}%)</td><td style="padding:10px; border:1px solid #ddd;">${currency}${(total-inv.amount).toFixed(2)}</td></tr>
                <tr style="font-weight:bold; font-size:1.2rem;"><td>Total Bill</td><td>${currency}${total.toFixed(2)}</td></tr>
            </table>
            <p style="margin-top:20px;">Status: <b>${inv.status}</b></p>
            <script>window.print();</script>
        </body>`);
}

function saveSettings() {
    localStorage.setItem("bizName", document.getElementById("setBizName").value);
    localStorage.setItem("bizAddr", document.getElementById("setBizAddr").value);
    localStorage.setItem("taxLabel", document.getElementById("setTaxLabel").value);
    localStorage.setItem("taxRate", document.getElementById("setTaxRate").value);
    localStorage.setItem("currency", document.getElementById("setCurrency").value);
    location.reload();
}

function addLog(msg) {
    logs.unshift({ msg, time: new Date().toLocaleTimeString() });
    localStorage.setItem("logs", JSON.stringify(logs));
    renderLogs();
}

function renderLogs() {
    document.getElementById("historyList").innerHTML = logs.map(l => `<li style="padding:10px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between"><span>${l.msg}</span><small style="color:#64748b">${l.time}</small></li>`).join('');
}

function updateChart() {
    const ctx = document.getElementById('invoiceChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: invoices.slice(-5).map(inv => inv.name),
            datasets: [{ label: 'Sale Amount', data: invoices.slice(-5).map(i => i.amount), borderColor: '#4f46e5', tension: 0.3, fill: true, backgroundColor: 'rgba(79, 70, 229, 0.05)' }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false }, y: { display: false } } }
    });
}

window.onload = () => {
    document.getElementById("setBizName").value = bizName;
    document.getElementById("setBizAddr").value = localStorage.getItem("bizAddr") || "";
    document.getElementById("setTaxLabel").value = taxLabel;
    document.getElementById("setTaxRate").value = taxRate;
    document.getElementById("setCurrency").value = currency;
    document.getElementById("navLogoText").innerText = bizName;
    renderDashboard(); renderLogs();
};
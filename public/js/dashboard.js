const orderTableBody = document.getElementById('orderTableBody');
const orderSearch = document.getElementById('orderSearch');
const totalCount = document.getElementById('totalCount');
const totalRevenue = document.getElementById('totalRevenue');
const pendingCount = document.getElementById('pendingCount');
const processingCount = document.getElementById('processingCount');
const completedCount = document.getElementById('completedCount');
const refreshBtn = document.getElementById('refreshBtn');
const connectionStatus = document.getElementById('connectionStatus');

let orders = [];
let productsList = [];

// Tab switching
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(tab + 'Tab');
    if (targetTab) targetTab.classList.add('active');
    
    // If called from the main nav buttons
    const navBtn = document.querySelector(`.tab-btn[onclick*="'${tab}'"]`);
    if (navBtn) navBtn.classList.add('active');
    
    if (tab === 'orders') fetchOrders();
    if (tab === 'config') {
        const activeSubBtn = document.querySelector('.sub-tab-btn.active');
        const activeSub = activeSubBtn ? activeSubBtn.getAttribute('onclick').match(/'([^']+)'/)[1] : 'menu';
        switchSubTab(activeSub);
    }
}

function switchSubTab(subTab) {
    document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('sub_' + subTab + 'Tab').classList.add('active');
    // Find the button and add active class
    document.querySelectorAll('.sub-tab-btn').forEach(b => {
        if (b.getAttribute('onclick').includes(subTab)) b.classList.add('active');
    });

    if (subTab === 'menu') fetchProducts();
    if (subTab === 'settings') populateSettingsForm();
    if (subTab === 'reports') fetchReports();
}

// +++++ SETTINGS & STORE STATUS +++++
let currentSettings = {};

async function fetchSettings() {
    try {
        const res = await fetch('/api/settings');
        const { data } = await res.json();
        currentSettings = data;
        updateStatusUI();
    } catch (e) {
        console.error(e);
    }
}

function updateStatusUI() {
    const btn = document.getElementById('storeStatusBtn');
    if (btn) {
        const isOpen = currentSettings.is_open !== false; // Default to true if not set
        btn.innerText = isOpen ? 'BUKA' : 'TUTUP';
        btn.style.borderColor = isOpen ? 'var(--success)' : 'var(--danger)';
        btn.style.color = isOpen ? 'var(--success)' : 'var(--danger)';
    }
    
    // Update text title if store name is set
    const titleEl = document.getElementById('storeNameTitle');
    if (titleEl && currentSettings.store_name) {
        titleEl.innerText = currentSettings.store_name;
    }
    
    const subtitleEl = document.getElementById('storeSubtitleText');
    if (subtitleEl && currentSettings.store_subtitle) {
        subtitleEl.innerText = currentSettings.store_subtitle;
    } else if (subtitleEl) {
        subtitleEl.innerText = 'Monitoring pesanan masuk dari WhatsApp';
    }
}

async function populateSettingsForm() {
    await fetchSettings();
    document.getElementById('set_storeName').value = currentSettings.store_name || '';
    document.getElementById('set_storeSubtitle').value = currentSettings.store_subtitle || '';
    document.getElementById('set_botNumber').value = currentSettings.bot_number || '';
    document.getElementById('set_storeAddress').value = currentSettings.store_address || '';
    document.getElementById('set_storeMaps').value = currentSettings.store_maps || '';
    document.getElementById('set_botFooter').value = currentSettings.bot_footer || '';
}

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = {
        store_name: document.getElementById('set_storeName').value,
        store_subtitle: document.getElementById('set_storeSubtitle').value,
        bot_number: document.getElementById('set_botNumber').value,
        store_address: document.getElementById('set_storeAddress').value,
        store_maps: document.getElementById('set_storeMaps').value,
        bot_footer: document.getElementById('set_botFooter').value
    };

    try {
        for (const [key, value] of Object.entries(settings)) {
            await fetch(`/api/settings/${key}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value })
            });
        }
        alert('Pengaturan berhasil disimpan!');
        fetchSettings(); // Refresh UI
    } catch (e) {
        console.error(e);
        alert('Gagal menyimpan pengaturan');
    }
});

async function toggleStoreStatus() {
    const newValue = !(currentSettings.is_open !== false);
    try {
        const res = await fetch('/api/settings/is_open', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: newValue })
        });
        if (res.ok) {
            currentSettings.is_open = newValue;
            updateStatusUI();
        }
    } catch (e) {
        console.error(e);
    }
}

// Fetch initial data
async function fetchOrders() {
    try {
        const response = await fetch('/api/orders');
        if (response.status === 401) return window.location.href = '/login';
        const data = await response.json();
        orders = data.data;
        renderOrders(orders);
        updateStats(orders);
    } catch (error) {
        console.error('Failed to fetch orders:', error);
    }
}

function renderOrders(data) {
    orderTableBody.innerHTML = data.map(order => `
        <tr data-id="${order._id}">
            <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">#${order._id.slice(-6)}</td>
            <td style="font-weight: 600;">${order.customer}</td>
            <td style="max-width: 250px;">${order.items.map(item => `${item.name} x${item.qty}`).join(', ')}</td>
            <td style="font-weight: 700;">Rp ${order.total.toLocaleString()}</td>
            <td style="font-size: 0.85rem; color: var(--text-muted); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${order.address}</td>
            <td><span class="status-badge ${getStatusClass(order.status)}">${order.status}</span></td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    ${order.status === 'PENDING' ? `
                        <button class="action-btn" style="color: var(--primary);" onclick="updateOrderStatus('${order._id}', 'PROSES')"><i class="fas fa-spinner"></i> Proses</button>
                    ` : ''}
                    ${order.status !== 'COMPLETED' ? `
                        <button class="action-btn success" onclick="updateOrderStatus('${order._id}', 'COMPLETED')"><i class="fas fa-check"></i> Selesaikan</button>
                    ` : ''}
                    <button class="action-btn" style="color: var(--danger);" onclick="updateOrderStatus('${order._id}', 'CANCELLED')"><i class="fas fa-times"></i> Batalkan</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getStatusClass(status) {
    switch (status.toUpperCase()) {
        case 'PENDING': return 'status-pending';
        case 'PROSES': return 'status-proses';
        case 'COMPLETED': return 'status-completed';
        case 'CANCELLED': return 'status-cancelled';
        default: return '';
    }
}

function updateStats(data) {
    totalCount.innerText = data.length;
    
    const revenue = data
        .filter(o => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + o.total, 0);
    totalRevenue.innerText = `Rp ${revenue.toLocaleString()}`;
    
    pendingCount.innerText = data.filter(o => o.status === 'PENDING').length;
    processingCount.innerText = data.filter(o => o.status === 'PROSES').length;
    completedCount.innerText = data.filter(o => o.status === 'COMPLETED').length;
}

async function updateOrderStatus(id, status) {
    if (!confirm(`Yakin ingin mengubah status ke ${status}?`)) return;

    try {
        const response = await fetch(`/api/orders/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (response.status === 401) return window.location.href = '/login';

        if (response.ok) {
            fetchOrders(); // Refresh table
        } else {
            alert('Gagal update status');
        }
    } catch (error) {
        console.error('Update status error:', error);
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    } catch (e) {
        console.error(e);
    }
}

function exportOrders() {
    window.location.href = '/api/export/orders';
}

// Order Detail Modal Logic
orderTableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row || e.target.closest('button')) return;

    const id = row.dataset.id;
    const order = orders.find(o => o._id === id);
    if (!order) return;

    const modal = document.getElementById('orderModal');
    const content = document.getElementById('modalContent');
    const completeBtn = document.getElementById('completeBtn');
    const printBtn = document.getElementById('printBtn');

    content.innerHTML = `
        <div style="font-size: 1.1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
            <strong>Pelanggan:</strong> ${order.customer} <br>
            <strong>Tanggal:</strong> ${new Date(order.createdAt).toLocaleString('id-ID')}
        </div>
        <div style="margin-bottom: 1.5rem;">
            <strong>Item Pesanan:</strong>
            <ul style="margin-top: 0.5rem; list-style: none; padding: 0;">
                ${order.items.map(item => `
                    <li style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>${item.name} x${item.qty}</span>
                        <span>Rp ${(item.price * item.qty).toLocaleString()}</span>
                    </li>
                `).join('')}
            </ul>
            <div style="border-top: 1px dashed var(--glass-border); margin-top: 1rem; padding-top: 0.5rem; display: flex; justify-content: space-between; font-weight: 700;">
                <span>TOTAL</span>
                <span>Rp ${order.total.toLocaleString()}</span>
            </div>
        </div>
        <div>
            <strong>Alamat Pengiriman:</strong><br>
            <p style="color: var(--text-muted); margin-top: 0.25rem;">${order.address}</p>
        </div>
    `;

    // Setup buttons
    completeBtn.onclick = () => {
        updateOrderStatus(id, 'COMPLETED');
        closeModal();
    };
    completeBtn.style.display = order.status === 'COMPLETED' ? 'none' : 'block';

    printBtn.onclick = () => printReceipt(order);

    modal.style.display = 'flex';
});

function printReceipt(order) {
    const printWindow = window.open('', '', 'height=600,width=400');
    const storeName = currentSettings.store_name || 'Toko Kami';
    const storeAddr = currentSettings.store_address || '';

    printWindow.document.write(`
        <html>
        <head>
            <title>Struk - ${order._id.slice(-6)}</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; width: 300px; padding: 20px; font-size: 14px; }
                .text-center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .flex { display: flex; justify-content: space-between; }
                h2 { margin: 5px 0; }
                table { width: 100%; }
                .footer { font-size: 12px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <h2>${storeName}</h2>
                <div>${storeAddr}</div>
                <div class="divider"></div>
            </div>
            <div>Date: ${new Date().toLocaleString('id-ID')}</div>
            <div>ID: #${order._id.slice(-6)}</div>
            <div>Cust: ${order.customer}</div>
            <div class="divider"></div>
            <table>
                ${order.items.map(item => `
                    <tr>
                        <td>${item.name} x${item.qty}</td>
                        <td align="right">Rp ${(item.price * item.qty).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </table>
            <div class="divider"></div>
            <div class="flex">
                <strong>TOTAL</strong>
                <strong>Rp ${order.total.toLocaleString()}</strong>
            </div>
            <div class="divider"></div>
            <div class="footer text-center">
                Terima kasih atas pesanan Anda!<br>
                Powered by WA Order Bot
            </div>
            <script>window.print(); window.close();</script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Search orders
orderSearch.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const filtered = orders.filter(o => 
        o.customer.toLowerCase().includes(val) || 
        o.address.toLowerCase().includes(val) ||
        o.items.some(item => item.name.toLowerCase().includes(val))
    );
    renderOrders(filtered);
});

async function fetchReports() {
    try {
        const response = await fetch('/api/reports/sales');
        if (response.status === 401) return window.location.href = '/login';
        const { data } = await response.json();
        renderReports(data);
    } catch (error) {
        console.error('Failed to fetch reports:', error);
    }
}

function renderReports(data) {
    const reportTableBody = document.getElementById('reportTableBody');
    if (!reportTableBody) return;
    if (data.length === 0) {
        reportTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Belum ada data penjualan.</td></tr>';
        return;
    }
    
    reportTableBody.innerHTML = data.map(day => `
        <tr>
            <td style="font-weight: 500;">${day._id}</td>
            <td>${day.count} Pesanan</td>
            <td style="font-weight: 700; color: var(--success);">Rp ${day.total.toLocaleString()}</td>
        </tr>
    `).join('');
}

if (refreshBtn) refreshBtn.addEventListener('click', fetchOrders);

// Socket.io Real-time connection
if (typeof io !== 'undefined') {
    const socket = io();
    socket.on('new_order', (order) => {
        console.log('New order received via socket:', order);
        fetchOrders();
        
        // Optional visual highlight could be added here
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            connectionStatus.innerHTML = '<i class="fas fa-circle" style="font-size: 0.75rem; color: var(--success);"></i> Pesanan Baru!';
            setTimeout(() => {
                connectionStatus.innerHTML = '<i class="fas fa-circle" style="font-size: 0.75rem;"></i> Live System';
            }, 3000);
        }
    });
}

// +++++ PRODUCT MANAGEMENT +++++

const productsGrid = document.getElementById('productsGrid');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');

async function fetchProducts() {
    try {
        const response = await fetch('/api/products');
        if (response.status === 401) return window.location.href = '/login';
        const data = await response.json();
        productsList = data.data;
        renderProducts(productsList);
    } catch (error) {
        console.error('Failed to fetch products:', error);
    }
}

function renderProducts(data) {
    if (!productsGrid) return;
    productsGrid.innerHTML = data.map(p => `
        <div class="product-card">
            <div class="product-info">
                 <div style="font-size: 0.75rem; color: var(--primary); font-weight: 700; text-transform: uppercase; margin-bottom: 0.25rem;">${p.category || 'Lainnya'}</div>
                <h3>${p.name}</h3>
                <div class="product-price">Rp ${p.price.toLocaleString()}</div>
                <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">${p.description || 'Tidak ada deskripsi'}</p>
            </div>
            <div class="product-actions">
                <button class="action-btn" onclick="editProduct('${p._id}')"><i class="fas fa-edit"></i> Edit</button>
                <button class="action-btn" style="color: var(--danger);" onclick="deleteProduct('${p._id}')"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function openProductModal(id = null) {
    productModal.style.display = 'flex';
    if (!id) {
        document.getElementById('productModalTitle').innerText = 'Tambah Produk Baru';
        productForm.reset();
        document.getElementById('productId').value = '';
    }
}

function closeProductModal() {
    productModal.style.display = 'none';
}

function editProduct(id) {
    const p = productsList.find(item => item._id === id);
    if (!p) return;
    
    document.getElementById('productModalTitle').innerText = 'Edit Produk';
    document.getElementById('productId').value = p._id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodCategory').value = p.category || '';
    document.getElementById('prodDesc').value = p.description || '';
    
    productModal.style.display = 'flex';
}

async function deleteProduct(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    
    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (res.ok) fetchProducts();
    } catch (e) {
        console.error(e);
    }
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const data = {
        name: document.getElementById('prodName').value,
        price: document.getElementById('prodPrice').value,
        category: document.getElementById('prodCategory').value,
        description: document.getElementById('prodDesc').value
    };
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/products/${id}` : '/api/products';
    
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            closeProductModal();
            fetchProducts();
        }
    } catch (e) {
        console.error(e);
    }
});

// Initial Load
fetchOrders();
fetchSettings();

// Real-time update
setInterval(() => {
    if (document.getElementById('ordersTab').classList.contains('active')) {
        fetchOrders();
    }
}, 30000);

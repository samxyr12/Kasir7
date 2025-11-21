// Konfigurasi Lokasi
const lokasiKoordinat = {
    1: { latitude: -6.465556, longitude: 106.686828, nama: "Kantor Utama" },
    2: { latitude: -6.367006, longitude: 106.731574, nama: "Cabang A" },
    3: { latitude: -6.429668, longitude: 106.721050, nama: "Cabang B" }
};

// Konstanta Konfigurasi
const RADIUS_MAKSIMAL = 100; // Dalam meter
const LOKASI_STORAGE_KEY = 'lokasiVerifikasi';
const DURASI_VERIFIKASI = 10 * 60 * 1000; // 10 menit
const INAKTIVITAS_TIMEOUT = 10 * 60 * 1000; // 10 menit

// Referensi Elemen DOM
const lokasiModal = document.getElementById('lokasiModal');
const lokasiStatus = document.getElementById('lokasiStatus');
const cekLokasiBtn = document.getElementById('cekLokasiBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const lokasiSelect = document.getElementById('lokasiSelect');
const passwordContainer = document.getElementById('passwordContainer'); // Fixed from pinContainer
const passwordInput = document.getElementById('passwordInput'); // Fixed from pinInput
const sisaWaktuElem = document.getElementById('sisaWaktu');

// Variabel Global untuk Timer
let inaktivitasTimer = null;
let lokasiBerhasilTimer = null;

// Fungsi Haversine untuk menghitung jarak
function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radius bumi dalam meter
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // dalam meter
}

// Simpan Verifikasi Lokasi
function simpanLokasiVerifikasi(lokasi) {
    const verifikasiData = {
        lokasi: lokasi,
        waktuVerifikasi: Date.now()
    };
    localStorage.setItem(LOKASI_STORAGE_KEY, JSON.stringify(verifikasiData));
    mulaiTimerLokasi();
    mulaiPelacakInaktivitas();
}

// Cek Lokasi Tersimpan
function cekLokasiTersimpan() {
    const verifikasiData = JSON.parse(localStorage.getItem(LOKASI_STORAGE_KEY));
    
    if (verifikasiData) {
        const waktuBerlalu = Date.now() - verifikasiData.waktuVerifikasi;
        
        if (waktuBerlalu < DURASI_VERIFIKASI) {
            return verifikasiData.lokasi;
        } else {
            localStorage.removeItem(LOKASI_STORAGE_KEY);
            return null;
        }
    }
    
    return null;
}

function cekLogin() {
    const username = localStorage.getItem('username');
    if (!username) {
        Swal.fire({
            icon: 'warning',
            title: 'Akses Ditolak!',
            text: 'Anda belum login. Anda akan diarahkan ke halaman login dalam 3 detik.',
            timer: 3000, // Fixed typo: 30000 -> 3000 for 3 seconds
            showConfirmButton: false,
            background: '#fef7e6',
            color: '#d63333',
            iconColor: '#f39c12',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title',
                content: 'swal-custom-content'
            },
            showClass: {
                popup: 'animate__animated animate__fadeInDown animate__faster'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp animate__faster'
            }
        }).then(() => {
            window.location.href = 'login.html';
        });
    }
}

// Mulai Timer Lokasi
function mulaiTimerLokasi() {
    if (lokasiBerhasilTimer) {
        clearInterval(lokasiBerhasilTimer);
    }

    const waktuMulai = Date.now();

    lokasiBerhasilTimer = setInterval(() => {
        const sisaWaktu = DURASI_VERIFIKASI - (Date.now() - waktuMulai);
        
        if (sisaWaktu <= 0) {
            clearInterval(lokasiBerhasilTimer);
            localStorage.removeItem(LOKASI_STORAGE_KEY);
            if (lokasiModal) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Sesi Lokasi Berakhir',
                    text: 'Verifikasi lokasi telah berakhir. Silakan verifikasi ulang.',
                    confirmButtonText: 'OK'
                });
                lokasiModal.style.display = 'flex';
            }
            return;
        }

        const menitSisa = Math.floor(sisaWaktu / 60000);
        const detikSisa = Math.floor((sisaWaktu % 60000) / 1000);
        
        if (sisaWaktuElem) {
            sisaWaktuElem.textContent = `Sisa Waktu: ${menitSisa} menit ${detikSisa} detik`;
        }
    }, 1000);
}

// Mulai Pelacak Inaktivitas
function mulaiPelacakInaktivitas() {
    if (inaktivitasTimer) {
        clearTimeout(inaktivitasTimer);
    }

    inaktivitasTimer = setTimeout(() => {
        localStorage.removeItem(LOKASI_STORAGE_KEY);
        if (lokasiModal) {
            Swal.fire({
                icon: 'warning',
                title: 'Inaktivitas Terdeteksi',
                text: 'Anda tidak aktif selama 10 menit. Silakan verifikasi ulang.',
                confirmButtonText: 'OK'
            });
            lokasiModal.style.display = 'flex';
        }
    }, INAKTIVITAS_TIMEOUT);
}

// Reset Timer Inaktivitas
function resetInaktivitasTimer() {
    if (inaktivitasTimer) {
        clearTimeout(inaktivitasTimer);
    }
    mulaiPelacakInaktivitas();
}

// Toggle Tampilan Input Password
function togglePinInput() {
    const isUniversal = lokasiSelect?.value === "universal";
    if (passwordContainer) {
        passwordContainer.style.display = isUniversal ? 'block' : 'none';
    }
}

// Fungsi Cek Lokasi Utama
function cekLokasi() {
    // Cek lokasi tersimpan
    const lokasiTersimpan = cekLokasiTersimpan();
    if (lokasiTersimpan && lokasiSelect && lokasiModal) {
        lokasiSelect.value = lokasiTersimpan;
        lokasiModal.style.display = 'none';
        return;
    }

    if (loadingSpinner && lokasiStatus) {
        loadingSpinner.style.display = 'block';
        lokasiStatus.innerHTML = '';
    }

    const selectedLocation = lokasiSelect?.value;
    if (selectedLocation === "0") {
        if (loadingSpinner && lokasiStatus) {
            loadingSpinner.style.display = 'none';
            lokasiStatus.innerHTML = `<p style="color:#ef4444;">Silakan pilih lokasi terlebih dahulu.</p>`;
        }
        return;
    }

    // Cek Password untuk lokasi universal
    if (selectedLocation === "universal") {
        const enteredPassword = passwordInput?.value.trim();
        if (!enteredPassword) {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            Swal.fire({
                icon: 'error',
                title: 'Password Tidak Diisi',
                text: 'Silakan masukkan password akun Anda.',
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'void-popup',
                    confirmButton: 'void-danger-btn'
                }
            });
            return;
        }

        // Ambil username akun yang sedang login
        const currentUser = localStorage.getItem('username');
        const loggedIn = localStorage.getItem('loggedIn');

        if (loggedIn !== 'true' || !currentUser) {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            Swal.fire({
                icon: 'error',
                title: 'Tidak Ada Sesi Login',
                text: 'Silakan login terlebih dahulu.',
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'void-popup',
                    confirmButton: 'void-danger-btn'
                }
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }

        // Ambil daftar akun dari localStorage
        let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        const account = accounts.find(acc => acc.username === currentUser);

        if (!account) {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            Swal.fire({
                icon: 'error',
                title: 'Akun Tidak Ditemukan',
                text: 'Akun tidak ditemukan. Silakan login kembali.',
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'void-popup',
                    confirmButton: 'void-danger-btn'
                }
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }

        // Dekripsi password akun
        let decryptedPassword;
        try {
            decryptedPassword = CryptoJS.AES.decrypt(account.password, 'secret key 123').toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Error decrypting password:', error);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            Swal.fire({
                icon: 'error',
                title: 'Kesalahan Sistem',
                text: 'Terjadi kesalahan saat memverifikasi password.',
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'void-popup',
                    confirmButton: 'void-danger-btn'
                }
            });
            return;
        }

        // Verifikasi password
        if (enteredPassword === decryptedPassword) {
            if (loadingSpinner && lokasiModal) {
                loadingSpinner.style.display = 'none';
                lokasiModal.style.display = 'none';
            }
            simpanLokasiVerifikasi(selectedLocation);
            Swal.fire({
                icon: 'success',
                title: 'Verifikasi Berhasil',
                text: 'Password valid. Akses diberikan.',
                timer: 2000,
                customClass: {
                    popup: 'void-popup',
                    confirmButton: 'void-primary-btn'
                }
            });
            return;
        } else {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            Swal.fire({
                icon: 'error',
                title: 'Password Tidak Valid',
                text: 'Password yang Anda masukkan salah.',
                confirmButtonText: 'OK',
                customClass: {
                    popup: 'void-popup',
                    confirmButton: 'void-danger-btn'
                }
            });
            return;
        }
    }

    // Ambil Koordinat Lokasi Terpilih
    const { latitude, longitude } = lokasiKoordinat[selectedLocation];

    // Cek Geolokasi
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const jarakKeDkantor = hitungJarak(
                    latitude, 
                    longitude, 
                    position.coords.latitude, 
                    position.coords.longitude
                );

                if (loadingSpinner) loadingSpinner.style.display = 'none';

                if (jarakKeDkantor <= RADIUS_MAKSIMAL) {
                    if (lokasiModal) lokasiModal.style.display = 'none';
                    simpanLokasiVerifikasi(selectedLocation);
                    Swal.fire({
                        icon: 'success',
                        title: 'Lokasi Valid',
                        text: `Anda berada dalam radius ${jarakKeDkantor.toFixed(2)} meter`,
                        timer: 2000,
                        customClass: {
                            popup: 'void-popup',
                            confirmButton: 'void-primary-btn'
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lokasi Tidak Valid',
                        html: `
                            Anda berada di luar area lokasi yang dipilih. 
                            Jarak: ${jarakKeDkantor.toFixed(2)} meter 
                            (Maks: ${RADIUS_MAKSIMAL} meter)
                        `,
                        confirmButtonText: 'OK',
                        customClass: {
                            popup: 'void-popup',
                            confirmButton: 'void-danger-btn'
                        }
                    });
                    if (lokasiModal) lokasiModal.style.display = 'flex';
                }
            },
            function(error) {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                Swal.fire({
                    icon: 'warning',
                    title: 'Gagal Mendapatkan Lokasi',
                    text: 'Pastikan Anda memberikan izin akses lokasi.',
                    confirmButtonText: 'OK',
                    customClass: {
                        popup: 'void-popup',
                        confirmButton: 'void-danger-btn'
                    }
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        Swal.fire({
            icon: 'error',
            title: 'Geolokasi Tidak Didukung',
            text: 'Browser Anda tidak mendukung layanan geolokasi.',
            confirmButtonText: 'OK',
            customClass: {
                popup: 'void-popup',
                confirmButton: 'void-danger-btn'
            }
        });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    cekLogin();
    const lokasiTersimpan = cekLokasiTersimpan();
    if (lokasiTersimpan && lokasiSelect && lokasiModal) {
        lokasiSelect.value = lokasiTersimpan;
        lokasiModal.style.display = 'none';
    } else if (lokasiModal) {
        lokasiModal.style.display = 'flex';
    }

    if (cekLokasiBtn) {
        cekLokasiBtn.addEventListener('click', cekLokasi);
    }
    if (lokasiSelect) {
        lokasiSelect.addEventListener('change', togglePinInput);
    }
});

// Reset Timer saat Ada Aktivitas
document.addEventListener('mousemove', resetInaktivitasTimer);
document.addEventListener('keypress', resetInaktivitasTimer);
document.addEventListener('click', resetInaktivitasTimer);

// Global variable to store selected items
let selectedItems = new Set();

// Function to show the product list modal
function showProductList() {
    const modal = document.getElementById('productListModal');
    modal.style.display = 'block';
    loadProductList();
}

function loadProductList() {
    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    const stokOpnameData = JSON.parse(localStorage.getItem('stokOpname')) || [];
    
    // Get all items currently in pending stock opname
    const pendingSOItems = new Set();
    stokOpnameData.forEach(opname => {
        if (opname.status === 'pending') {
            opname.items.forEach(item => {
                pendingSOItems.add(item.kode);
            });
        }
    });

    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';

    barang.forEach(item => {
        const isInSO = pendingSOItems.has(item.kode);
        const row = document.createElement('tr');
        
        if (isInSO) {
            row.classList.add('in-so-process');
        }
        
        row.innerHTML = `
            <td>
                <input type="checkbox" 
                       class="product-checkbox" 
                       data-kode="${item.kode}" 
                       data-nama="${item.nama}"
                       ${isInSO ? 'disabled' : ''}
                       ${selectedItems.has(item.kode) ? 'checked' : ''}>
            </td>
            <td>${item.kode}</td>
            <td>${item.nama}</td>
            <td>${isInSO ? 'Dalam proses SO' : item.stok}</td>
        `;
        tbody.appendChild(row);
    });

    updateDeleteCart();
}

function updateDeleteCart() {
    const deleteCartItems = document.getElementById('deleteCartItems');
    const deleteButton = document.getElementById('deleteSelectedItems');
    deleteCartItems.innerHTML = '';

    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    const stokOpnameData = JSON.parse(localStorage.getItem('stokOpname')) || [];
    
    // Get all items currently in pending stock opname
    const pendingSOItems = new Set();
    stokOpnameData.forEach(opname => {
        if (opname.status === 'pending') {
            opname.items.forEach(item => {
                pendingSOItems.add(item.kode);
            });
        }
    });
    
    selectedItems.forEach(kodeBarang => {
        const item = barang.find(b => b.kode === kodeBarang);
        if (item) {
            const isInSO = pendingSOItems.has(item.kode);
            if (!isInSO) { // Only show items not in SO process
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <span>${item.kode} - ${item.nama}</span>
                    <button onclick="removeFromCart('${item.kode}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                deleteCartItems.appendChild(cartItem);
            }
        }
    });

    // Enable/disable delete button based on selection
    deleteButton.disabled = selectedItems.size === 0;
}

// Function to remove item from cart
function removeFromCart(kodeBarang) {
    selectedItems.delete(kodeBarang);
    updateDeleteCart();
    loadProductList(); // Refresh checkboxes
}

// Function to delete selected items
function deleteSelectedItems() {
    if (selectedItems.size === 0) return;

    Swal.fire({
        title: 'Konfirmasi Hapus',
        text: `Anda yakin ingin menghapus ${selectedItems.size} barang yang dipilih?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            let barang = JSON.parse(localStorage.getItem('barang')) || [];
            barang = barang.filter(item => !selectedItems.has(item.kode));
            localStorage.setItem('barang', JSON.stringify(barang));
            
            selectedItems.clear();
            loadProductList();
            loadBarang(); // Refresh main table
            
            Swal.fire(
                'Terhapus!',
                'Barang yang dipilih telah dihapus.',
                'success'
            );
        }
    });
}

// Function to filter products based on search
function filterProducts(searchTerm) {
    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    const stokOpnameData = JSON.parse(localStorage.getItem('stokOpname')) || [];
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';

    // Get all items currently in pending stock opname
    const pendingSOItems = new Set();
    stokOpnameData.forEach(opname => {
        if (opname.status === 'pending') {
            opname.items.forEach(item => {
                pendingSOItems.add(item.kode);
            });
        }
    });

    const searchTermLower = searchTerm.toLowerCase();
    
    const filteredBarang = barang.filter(item => 
        item.kode.toLowerCase().includes(searchTermLower) ||
        item.nama.toLowerCase().includes(searchTermLower)
    );

    filteredBarang.forEach(item => {
        const isInSO = pendingSOItems.has(item.kode);
        const row = document.createElement('tr');
        
        if (isInSO) {
            row.classList.add('in-so-process');
        }
        
        row.innerHTML = `
            <td>
                <input type="checkbox" 
                       class="product-checkbox" 
                       data-kode="${item.kode}" 
                       data-nama="${item.nama}"
                       ${isInSO ? 'disabled' : ''}
                       ${selectedItems.has(item.kode) ? 'checked' : ''}>
            </td>
            <td>${item.kode}</td>
            <td>${item.nama}</td>
            <td>${isInSO ? 'Dalam proses SO' : item.stok}</td>
        `;
        tbody.appendChild(row);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Show modal button
    const showProductListBtn = document.getElementById('showProductListBtn');
    showProductListBtn.addEventListener('click', showProductList);

    // Close modal
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', function() {
        document.getElementById('productListModal').style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('productListModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Search functionality
    const searchInput = document.getElementById('searchProduct');
    searchInput.addEventListener('input', function(e) {
        filterProducts(e.target.value);
    });

    // Delete selected items button
    const deleteBtn = document.getElementById('deleteSelectedItems');
    deleteBtn.addEventListener('click', deleteSelectedItems);

    // Handle checkbox changes
    document.getElementById('productTableBody').addEventListener('change', function(e) {
        if (e.target.classList.contains('product-checkbox')) {
            const kodeBarang = e.target.dataset.kode;
            
            if (e.target.checked) {
                selectedItems.add(kodeBarang);
            } else {
                selectedItems.delete(kodeBarang);
            }
            
            updateDeleteCart();
        }
    });
});



function cariBarang(query) {
    if (!query) {
        closeModal();
        return;
    }

    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    let hasilPencarian = barang.filter(item => {
        if (/^\d+$/.test(query)) {  // Jika input angka, cari di kode atau PLU
            return item.kode.includes(query) || (item.plu && item.plu.includes(query));
        } else {  // Jika input huruf, cari di nama atau kode
            return item.nama.toLowerCase().includes(query.toLowerCase()) || item.kode.toLowerCase().includes(query.toLowerCase());
        }
    });

    tampilkanHasilPencarian(hasilPencarian);
}

function tampilkanHasilPencarian(results) {
    const modal = document.getElementById('searchModal');
    const tbody = document.getElementById('searchResultsTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';  // Hapus hasil sebelumnya

    results.forEach(item => {
        const row = tbody.insertRow();
        row.insertCell(0).innerText = item.kodeToko || '';
        row.insertCell(1).innerText = item.kode || '';
        row.insertCell(2).innerText = item.plu || '';
        row.insertCell(3).innerText = item.nama || '';
        row.insertCell(4).innerText = formatRupiah(item.hargaBeli || 0);
        row.insertCell(5).innerText = formatRupiah(item.hargaJual || 0);

        // Check if the item is currently in stock opname
        const cekStok = JSON.parse(localStorage.getItem(`cekStok_${item.kode}`));
        const isInOpname = cekStok && cekStok.status === 'pending';

        // Display stock information or a placeholder if in stock opname
        row.insertCell(6).innerText = isInOpname ? 'Dalam proses SO' : (item.stok || 0);

        // Tambahkan tombol Edit di kolom terakhir
        const actionCell = row.insertCell(7);
        
        if (!isInOpname) {
            // Jika tidak dalam proses SO, tampilkan tombol Edit
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.innerText = 'Edit';
            editBtn.onclick = () => editBarang(item.kode);
            actionCell.appendChild(editBtn);
        } else {
            // Jika dalam proses SO, tampilkan pesan
            const messageSpan = document.createElement('span');
            messageSpan.className = 'text-muted';
            messageSpan.innerText = 'Tidak bisa edit (SO)';
            messageSpan.style.color = '#999';
            messageSpan.style.fontStyle = 'italic';
            actionCell.appendChild(messageSpan);
            
            // Tambahkan tooltip untuk informasi lebih lanjut
            messageSpan.title = 'Barang sedang dalam proses Stock Opname. Edit tidak diperbolehkan.';
        }
    });

    // Tampilkan modal jika ada hasil pencarian
    if (results.length > 0) {
        modal.style.display = 'block';
    } else {
        closeModal();
    }
}
function closeModal() {
    document.getElementById('searchModal').style.display = 'none';
}

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Tutup modal jika klik di luar modal
window.onclick = function(event) {
    const modal = document.getElementById('searchModal');
    if (event.target === modal) {
        closeModal();
    }
};


document.addEventListener('DOMContentLoaded', function() {
    // Elemen-elemen DOM
    const scanButton = document.getElementById('scanButton');
    const reader = document.getElementById('reader');
    const kodeBarangInput = document.getElementById('kodeBarang');
    
    // Variabel untuk scanner
    let html5QrCode = null;
    let isDetecting = false;
    let scanTimeout = null;
    
    // Inisialisasi audio di luar function agar bisa digunakan di mana saja
    let successSound = null;
    
    // Inisialisasi variabel untuk mengecek apakah user sudah berinteraksi
    let userInteracted = false;
    
    // Tambahkan event listener untuk mendeteksi interaksi user
    document.addEventListener('click', function() {
        userInteracted = true;
        // Pre-load audio setelah interaksi pertama
        if (!successSound) {
            successSound = new Audio('data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAFAAAGUACFhYWFhYWFhYWFhYWFhYWFhYWFvb29vb29vb29vb29vb29vb29vb3T09PT09PT09PT09PT09PT09PT0/////////////////////////////////8AAAA8TEFNRTMuOTlyAm4AAAAALgkAABRGJAKjQQAARgAABlBaPJzJAAAAAAAAAAAAAAAAAAAA//vAxAAAAoFXTlUFAAK8YCnM+gAAhIqZe28SHghCEIQhCEIQhCEAAAAAAAf/7f//+EIQT//5CEIQhCD/+QhCEIQhCEIQhCEIQhCEIP/CAAAhCv///wgAIQhC//9CEIQhCEIQhCEIQhCEIQhCEIQhAEIQhCEP/+oEIQhC/wbgIQ+AAAQh6hCEIQhCEIQgD/3WCEIQhD///wQhCEL//+EIQT//iHuKxyIUEoQFaIQhCEOc5znOc5znmn/IRRRRMU/yAQCAQCXkC7IdDuiERnOc5znOc5znOc5znOc5znOb//uc5znOc///znOc5znOc5zn9EIbk5znOc5znOc5znOc5znOc5znOc5z//pznOc5znOc5znOc5znOc////O5znOc5znOc0xBTUUzLjk5LjOqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
            successSound.load(); // Pre-load tanpa memainkan
        }
    });
    
    // Event listener untuk tombol scan
    scanButton.addEventListener('click', function() {
        // Tandai bahwa user telah berinteraksi
        userInteracted = true;
        
        // Load audio jika belum
        if (!successSound) {
            successSound = new Audio('data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAFAAAGUACFhYWFhYWFhYWFhYWFhYWFhYWFvb29vb29vb29vb29vb29vb29vb3T09PT09PT09PT09PT09PT09PT0/////////////////////////////////8AAAA8TEFNRTMuOTlyAm4AAAAALgkAABRGJAKjQQAARgAABlBaPJzJAAAAAAAAAAAAAAAAAAAA//vAxAAAAoFXTlUFAAK8YCnM+gAAhIqZe28SHghCEIQhCEIQhCEAAAAAAAf/7f//+EIQT//5CEIQhCD/+QhCEIQhCEIQhCEIQhCEIP/CAAAhCv///wgAIQhC//9CEIQhCEIQhCEIQhCEIQhCEIQhAEIQhCEP/+oEIQhC/wbgIQ+AAAQh6hCEIQhCEIQgD/3WCEIQhD///wQhCEL//+EIQT//iHuKxyIUEoQFaIQhCEOc5znOc5znmn/IRRRRMU/yAQCAQCXkC7IdDuiERnOc5znOc5znOc5znOc5znOb//uc5znOc///znOc5znOc5zn9EIbk5znOc5znOc5znOc5znOc5znOc5z//pznOc5znOc5znOc5znOc////O5znOc5znOc0xBTUUzLjk5LjOqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
            successSound.load();
        }
        
        // Toggle scanner aktif/nonaktif
        if (reader.style.display === 'none' || reader.style.display === '') {
            startScanner();
            scanButton.innerHTML = '<i class="fas fa-times"></i> Batal Scan';
            scanButton.classList.add('scanning');
        } else {
            stopScanner();
        }
    });
    
    // Fungsi untuk memulai scanner
    function startScanner() {
        reader.style.display = 'block';
        reader.classList.add('active-scanner', 'no-detection');
        
        // Konfigurasikan resolusi dan aspek ratio kamera
        const aspectRatio = window.innerWidth > window.innerHeight ? 1.777778 : 1.333333;
        const qrboxSize = Math.min(reader.clientWidth - 20, 350);
        
        html5QrCode = new Html5Qrcode("reader");
        
        const qrConfig = {
            fps: 10,
            aspectRatio: aspectRatio,
            qrbox: { width: qrboxSize, height: qrboxSize }
        };
        
        html5QrCode.start(
            { facingMode: "environment" },
            qrConfig,
            onScanSuccess,
            onScanProgress
        ).catch(function(err) {
            console.error("Gagal memulai scanner:", err);
            Swal.fire({
                title: 'Gagal Memulai Scanner',
                text: 'Pastikan kamera diizinkan dan coba lagi.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            stopScanner();
        });
    }
    
    // Handle successful scan with improved feedback
    function onScanSuccess(decodedText, decodedResult) {
        // Update input value
        kodeBarangInput.value = decodedText;
        
        // Generate PLU if that function exists
        if (typeof generatePLU === 'function') {
            generatePLU();
        }
        
        // Stop scanner
        stopScanner();
        
        // Visual feedback
        isDetecting = true;
        reader.classList.add('detecting');
        reader.classList.remove('no-detection');
        
        // Mainkan suara sukses hanya jika user sudah berinteraksi
        if (userInteracted && successSound) {
            // Gunakan Promise catch untuk menangani error
            successSound.play().catch(err => {
                console.log('Tidak dapat memutar suara:', err);
            });
        }
        
        // Show success alert with better formatting
        Swal.fire({
            title: 'Barcode Terdeteksi',
            html: `
                <div style="margin: 15px 0; text-align: center;">
                    <p style="margin-bottom: 8px; font-weight: 500;">Kode barcode:</p>
                    <div style="display: inline-block; background-color: #f5f5f5; padding: 10px 15px; border-radius: 8px; font-family: monospace; word-break: break-all;">
                        ${decodedText}
                    </div>
                </div>
            `,
            icon: 'success',
            confirmButtonText: 'OK',
            didOpen: () => {
                // Alternatif: mainkan suara saat alert terbuka (triggered oleh user interaction dengan alert)
                if (userInteracted && successSound) {
                    successSound.play().catch(err => {
                        console.log('Tidak dapat memutar suara di alert:', err);
                    });
                }
            }
        });

        // Reset detection state after delay
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(function () {
            isDetecting = false;
            reader.classList.remove('detecting');
            reader.classList.add('no-detection');
        }, 3000);
    }

    // Improved scanning feedback
    function onScanProgress(errorMessage, errorCode) {
        // Don't show errors during successful scan detection
        if (isDetecting) {
            return;
        }
        
        // Visual scanning feedback with alternating classes
        reader.classList.toggle('scanning-pulse');
        
        // Update detection status for UI feedback
        if (!isDetecting) {
            reader.classList.remove('detecting');
            reader.classList.add('no-detection');
        }
    }

    // Improved scanner stop function
    function stopScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                reader.style.display = 'none';
                reader.classList.remove('active-scanner', 'detecting', 'no-detection', 'scanning-pulse');
                isDetecting = false;
                
                // Reset button text
                scanButton.innerHTML = '<i class="fas fa-barcode"></i> Scan Barcode/QR';
                scanButton.classList.remove('scanning');
            }).catch((err) => {
                console.error('Gagal menghentikan scanner:', err);
            });
        }
    }

    // Enhanced detection animation
    function simulateDetection(status) {
        if (status === 'detected') {
            reader.classList.remove('no-detection');
            reader.classList.add('detecting');
        } else {
            reader.classList.remove('detecting');
            reader.classList.add('no-detection');
        }
    }

    // Check detection status periodically with less frequent interval
    setInterval(function () {
        if (!isDetecting) {
            simulateDetection('none');
        }
    }, 1000);

    // Handle window resize to adjust scanner box
    window.addEventListener('resize', () => {
        if (html5QrCode && reader.style.display !== 'none') {
            const newWidth = Math.min(reader.clientWidth - 20, 350);
            html5QrCode.applyVideoConstraints({
                aspectRatio: 1.777778,
                width: { ideal: newWidth }
            }).catch(err => console.log('Gagal mengupdate dimensi kamera'));
        }
    });
    
    // Handle visibility changes to pause/resume scanner
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && html5QrCode && reader.style.display !== 'none') {
            html5QrCode.pause();
        } else if (html5QrCode && reader.style.display !== 'none') {
            html5QrCode.resume();
        }
    });
});

function tambahTargetPenjualan() {
    // Ambil data barang dari localStorage
    let barang = JSON.parse(localStorage.getItem('barang')) || [];

    // Custom CSS untuk UI modern dan autocomplete
    const customStyles = `
        <style>
            :root {
                --primary-color: #1a73e8;
                --secondary-color: #34c759;
                --danger-color: #e63946;
                --background-light: #f8f9fa;
                --text-dark: #202124;
                --border-radius: 12px;
                --transition-speed: 0.3s;
            }

            .swal2-popup {
                border-radius: var(--border-radius) !important;
                background: linear-gradient(135deg, #ffffff 0%, #f1f3f5 100%) !important;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
                padding: 20px !important;
            }

            .swal2-title {
                color: var(--text-dark) !important;
                font-weight: 700 !important;
                font-size: 1.5rem !important;
                margin-bottom: 20px !important;
            }

            .target-penjualan-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                padding: 15px;
            }

            .form-group {
                position: relative;
                display: flex;
                flex-direction: column;
            }

            .form-label {
                margin-bottom: 8px;
                color: var(--text-dark);
                font-weight: 600;
                font-size: 0.9rem;
            }

            .form-control {
                height: 48px;
                border-radius: 8px;
                border: 1px solid #dadce0;
                padding: 0 15px;
                font-size: 0.95rem;
                transition: all var(--transition-speed) ease;
                background: white;
            }

            .form-control:focus {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
                outline: none;
            }

            .autocomplete-container {
                position: relative;
            }

            .autocomplete-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #dadce0;
                border-radius: 8px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                margin-top: 4px;
            }

            .autocomplete-item {
                padding: 10px 15px;
                cursor: pointer;
                font-size: 0.9rem;
                color: var(--text-dark);
                transition: background-color var(--transition-speed);
            }

            .autocomplete-item:hover {
                background-color: #f1f3f5;
            }

            .autocomplete-item span {
                display: block;
                font-size: 0.8rem;
                color: #5f6368;
            }

            .swal2-confirm {
                background-color: var(--primary-color) !important;
                border-radius: 8px !important;
                padding: 12px 24px !important;
                font-weight: 600 !important;
                transition: all var(--transition-speed) ease !important;
            }

            .swal2-confirm:hover {
                background-color: #1557b0 !important;
            }

            .swal2-cancel {
                background-color: var(--danger-color) !important;
                border-radius: 8px !important;
                padding: 12px 24px !important;
                font-weight: 600 !important;
            }

            @media (max-width: 600px) {
                .target-penjualan-container {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `;

    // HTML untuk form input dengan autocomplete
    Swal.fire({
        title: 'Tambah Target Penjualan',
        html: `
            ${customStyles}
            <div class="target-penjualan-container">
                <div class="form-group">
                    <label class="form-label">Tanggal Mulai</label>
                    <input id="tanggalMulai" type="date" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Tanggal Selesai</label>
                    <input id="tanggalSelesai" type="date" class="form-control" required>
                </div>
                <div class="form-group autocomplete-container">
                    <label class="form-label">Cari Barang (Kode/Nama/PLU)</label>
                    <input id="namaBarangTarget" class="form-control" 
                           placeholder="Ketik kode, nama, atau PLU barang" 
                           autocomplete="off">
                    <div id="autocompleteSuggestions" class="autocomplete-suggestions" style="display: none;"></div>
                    <input type="hidden" id="kodeBarang">
                    <input type="hidden" id="pluBarang">
                    <input type="hidden" id="hargaSatuan">
                </div>
                <div class="form-group">
                    <label class="form-label">Jumlah Target (Unit)</label>
                    <input id="jumlahTarget" type="number" class="form-control" 
                           placeholder="Masukkan jumlah target" 
                           min="1" required>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Simpan Target',
        cancelButtonText: 'Batal',
        width: '800px',
        didOpen: () => {
            const inputBarang = document.getElementById('namaBarangTarget');
            const suggestionsContainer = document.getElementById('autocompleteSuggestions');

            // Fungsi untuk menampilkan saran barang
            function showSuggestions(query) {
                if (!query) {
                    suggestionsContainer.style.display = 'none';
                    return;
                }

                // Pencarian fuzzy sederhana
                const suggestions = barang.filter(item => 
                    item.nama.toLowerCase().includes(query.toLowerCase()) ||
                    item.kode.toLowerCase().includes(query.toLowerCase()) ||
                    item.plu.toLowerCase().includes(query.toLowerCase())
                );

                if (suggestions.length === 0) {
                    suggestionsContainer.style.display = 'none';
                    return;
                }

                suggestionsContainer.innerHTML = suggestions.map(item => `
                    <div class="autocomplete-item" 
                         data-nama="${item.nama}" 
                         data-kode="${item.kode}" 
                         data-plu="${item.plu}" 
                         data-harga="${item.hargaJual}">
                        ${item.nama}
                        <span>Kode: ${item.kode} | PLU: ${item.plu} | Stok: ${item.stok}</span>
                    </div>
                `).join('');

                suggestionsContainer.style.display = 'block';

                // Event listener untuk memilih saran
                document.querySelectorAll('.autocomplete-item').forEach(item => {
                    item.addEventListener('click', () => {
                        inputBarang.value = item.dataset.nama;
                        document.getElementById('kodeBarang').value = item.dataset.kode;
                        document.getElementById('pluBarang').value = item.dataset.plu;
                        document.getElementById('hargaSatuan').value = item.dataset.harga;
                        suggestionsContainer.style.display = 'none';
                    });
                });
            }

            // Event listener untuk input pencarian
            inputBarang.addEventListener('input', () => {
                showSuggestions(inputBarang.value);
            });

            // Sembunyikan saran saat klik di luar
            document.addEventListener('click', (e) => {
                if (!inputBarang.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                    suggestionsContainer.style.display = 'none';
                }
            });
        },
        preConfirm: () => {
            const tanggalMulai = document.getElementById('tanggalMulai').value;
            const tanggalSelesai = document.getElementById('tanggalSelesai').value;
            const namaBarang = document.getElementById('namaBarangTarget').value;
            const kodeBarang = document.getElementById('kodeBarang').value;
            const pluBarang = document.getElementById('pluBarang').value;
            const hargaSatuan = parseFloat(document.getElementById('hargaSatuan').value);
            const jumlahTarget = parseInt(document.getElementById('jumlahTarget').value);

            // Validasi input
            if (!tanggalMulai) {
                Swal.showValidationMessage('Mohon pilih tanggal mulai');
                return false;
            }
            if (!tanggalSelesai) {
                Swal.showValidationMessage('Mohon pilih tanggal selesai');
                return false;
            }
            const mulai = new Date(tanggalMulai);
            const selesai = new Date(tanggalSelesai);
            if (selesai < mulai) {
                Swal.showValidationMessage('Tanggal selesai harus setelah tanggal mulai');
                return false;
            }
            if (!namaBarang || !kodeBarang || !pluBarang) {
                Swal.showValidationMessage('Mohon pilih barang yang valid');
                return false;
            }
            if (!jumlahTarget || jumlahTarget <= 0) {
                Swal.showValidationMessage('Jumlah target harus lebih dari 0');
                return false;
            }

            return { 
                tanggalMulai, 
                tanggalSelesai,
                namaBarang,
                kodeBarang,
                pluBarang,
                jumlahTarget,
                hargaSatuan
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Simpan target penjualan ke localStorage
            let targets = JSON.parse(localStorage.getItem('targetPenjualan')) || [];
            targets.push({
                tanggalMulai: result.value.tanggalMulai,
                tanggalSelesai: result.value.tanggalSelesai,
                namaBarang: result.value.namaBarang,
                kodeBarang: result.value.kodeBarang,
                pluBarang: result.value.pluBarang,
                jumlahTarget: result.value.jumlahTarget,
                hargaSatuan: result.value.hargaSatuan
            });
            localStorage.setItem('targetPenjualan', JSON.stringify(targets));

            // Tampilkan notifikasi sukses
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Target penjualan berhasil disimpan',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

function simpanTargetPenjualan(tanggalMulai, tanggalSelesai, namaBarang, jumlahTarget, kodeBarang, pluBarang, hargaSatuan) {
    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    let targets = JSON.parse(localStorage.getItem('targetPenjualan')) || [];
    
    // Cek apakah barang ada di dalam data barang
    const barangExist = barang.some(item => item.nama === namaBarang);
    
    if (!barangExist) {
        Swal.fire({
            icon: 'error',
            title: 'Barang Tidak Ditemukan',
            text: `Barang ${namaBarang} tidak ada dalam daftar.`,
            confirmButtonText: 'OK'
        });
        return;
    }

    // Tambahkan target baru dengan periode
    targets.push({ tanggalMulai, tanggalSelesai, namaBarang, jumlahTarget, kodeBarang, pluBarang, hargaSatuan });
    
    Swal.fire({
        icon: 'success',
        title: 'Target Ditambahkan',
        text: `Berhasil menambahkan target ${namaBarang} dari ${tanggalMulai} hingga ${tanggalSelesai}`,
        confirmButtonText: 'OK'
    });

    // Simpan ke localStorage
    localStorage.setItem('targetPenjualan', JSON.stringify(targets));
    
    // Refresh tampilan
    loadBarang();
}

function tampilkanDaftarTarget() {
    // Ambil data dari localStorage
    let targets = JSON.parse(localStorage.getItem('targetPenjualan')) || [];
    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];

    // Custom CSS untuk UI modern
    const customStyles = `
        <style>
            :root {
                --primary-color: #1a73e8;
                --secondary-color: #34c759;
                --danger-color: #e63946;
                --background-light: #f8f9fa;
                --text-dark: #202124;
                --border-radius: 12px;
                --transition-speed: 0.3s;
            }

            .target-table-container {
                padding: 20px;
                background: #fff;
                border-radius: var(--border-radius);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }

            .table th {
                padding: 15px;
                background: var(--primary-color);
                color: white;
                font-weight: 600;
                text-align: left;
                white-space: nowrap;
            }

            .table td {
                padding: 12px 15px;
                border-bottom: 1px solid #dadce0;
            }

            .table-hover tbody tr:hover {
                background-color: rgba(26, 115, 232, 0.05);
            }

            .month-header {
                background: #3c4043 !important;
                color: white !important;
                font-size: 1rem !important;
                font-weight: 700 !important;
                text-align: center !important;
                padding: 15px !important;
            }

            .btn-group {
                display: flex;
                gap: 8px;
                justify-content: center;
            }

            .btn-action {
                padding: 8px 12px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                transition: all var(--transition-speed) ease;
                font-size: 0.85rem;
            }

            .btn-edit {
                background-color: #fbbc05;
                color: var(--text-dark);
            }

            .btn-delete {
                background-color: var(--danger-color);
                color: white;
            }

            .total-row {
                background-color: #e8f0fe !important;
                font-weight: 600 !important;
            }

            .status-indicator {
                padding: 6px 10px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
                text-align: center;
            }

            .status-active {
                background-color: #34c759;
                color: white;
            }

            .status-ended {
                background-color: #5f6368;
                color: white;
            }

            .progress-bar {
                background: #dadce0;
                border-radius: 10px;
                height: 10px;
                overflow: hidden;
            }

            .progress-fill {
                background: var(--primary-color);
                height: 100%;
                transition: width var(--transition-speed);
            }

            .empty-state {
                text-align: center;
                padding: 40px;
            }

            .empty-state i {
                font-size: 48px;
                color: #5f6368;
                margin-bottom: 20px;
            }

            @media (max-width: 768px) {
                .table-responsive {
                    overflow-x: auto;
                }

                .btn-group {
                    flex-direction: column;
                    gap: 5px;
                }
            }
        </style>
    `;

    // Jika tidak ada target
    if (targets.length === 0) {
        Swal.fire({
            icon: 'info',
            title: '<span style="color: var(--text-dark)">Daftar Target Kosong</span>',
            html: `
                ${customStyles}
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Belum ada target penjualan yang dibuat.</p>
                    <button onclick="tambahTargetPenjualan()" class="btn-action" 
                            style="background-color: var(--primary-color); color: white; margin-top: 15px;">
                        <i class="fas fa-plus"></i> Tambah Target Baru
                    </button>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true
        });
        return;
    }

    // Kelompokkan target berdasarkan bulan dan tahun
    const targetTerkelompok = {};
    targets.forEach(target => {
        const tanggalMulai = new Date(target.tanggalMulai);
        const kunci = `${tanggalMulai.getFullYear()}-${tanggalMulai.getMonth() + 1}`;
        if (!targetTerkelompok[kunci]) {
            targetTerkelompok[kunci] = [];
        }
        targetTerkelompok[kunci].push(target);
    });

    // Buat HTML untuk tabel
    let htmlTabel = `
        ${customStyles}
        <div class="target-table-container">
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th><i class="fas fa-calendar"></i> Periode</th>
                            <th><i class="fas fa-barcode"></i> Kode/PLU</th>
                            <th><i class="fas fa-box"></i> Nama Barang</th>
                            <th><i class="fas fa-chart-line"></i> Target</th>
                            <th><i class="fas fa-shopping-cart"></i> Penjualan</th>
                            <th><i class="fas fa-percentage"></i> Pencapaian</th>
                            <th><i class="fas fa-clock"></i> Status</th>
                            <th><i class="fas fa-money-bill-wave"></i> Harga Satuan</th>
                            <th><i class="fas fa-calculator"></i> Total Nilai</th>
                            <th><i class="fas fa-tools"></i> Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    const today = new Date();
    const kunciTerurut = Object.keys(targetTerkelompok).sort().reverse();
    let totalSemuaTarget = 0;
    let totalSemuaPenjualan = 0;
    let totalSemuaNilai = 0;

    kunciTerurut.forEach(kunci => {
        const [tahun, bulan] = kunci.split('-');
        const namaBulan = new Date(tahun, bulan - 1).toLocaleString('id-ID', { month: 'long' });

        let totalBulanTarget = 0;
        let totalBulanPenjualan = 0;
        let totalBulanNilai = 0;

        // Header bulan
        htmlTabel += `
            <tr>
                <td colspan="10" class="month-header">
                    <i class="fas fa-calendar-alt"></i> ${namaBulan} ${tahun}
                </td>
            </tr>
        `;

        // Urutkan target dalam bulan
        const targetBulanIni = targetTerkelompok[kunci]
            .sort((a, b) => new Date(a.tanggalMulai) - new Date(b.tanggalMulai));

        targetBulanIni.forEach(target => {
            const barangInfo = barang.find(b => b.nama === target.namaBarang) || {};
            const hargaSatuan = target.hargaSatuan || barangInfo.hargaJual || 0;
            const nilaiTarget = target.jumlahTarget * hargaSatuan;

            // Hitung total penjualan dalam periode dari transaksi yang berhasil
            const penjualanPeriode = transaksi.filter(t => {
                const tanggalTransaksi = new Date(t.tanggal);
                const mulai = new Date(target.tanggalMulai);
                const selesai = new Date(target.tanggalSelesai);
                return t.namaBarang === target.namaBarang && 
                       tanggalTransaksi >= mulai && 
                       tanggalTransaksi <= selesai;
            }).reduce((sum, t) => sum + t.jumlah, 0);

            // Hitung persentase pencapaian
            const persentase = target.jumlahTarget > 0 
                ? Math.min((penjualanPeriode / target.jumlahTarget) * 100, 100).toFixed(1)
                : 0;

            // Tentukan status periode
            const selesai = new Date(target.tanggalSelesai);
            const status = selesai < today ? 'Berakhir' : 'Aktif';
            const statusClass = status === 'Aktif' ? 'status-active' : 'status-ended';

            totalBulanTarget += target.jumlahTarget;
            totalBulanPenjualan += penjualanPeriode;
            totalBulanNilai += nilaiTarget;
            totalSemuaTarget += target.jumlahTarget;
            totalSemuaPenjualan += penjualanPeriode;
            totalSemuaNilai += nilaiTarget;

            htmlTabel += `
                <tr>
                    <td>${formatTanggal(target.tanggalMulai)} - ${formatTanggal(target.tanggalSelesai)}</td>
                    <td>${barangInfo.kode || '-'} / ${barangInfo.plu || '-'}</td>
                    <td>${target.namaBarang}</td>
                    <td style="text-align: right;">${target.jumlahTarget.toLocaleString()} Unit</td>
                    <td style="text-align: right;">${penjualanPeriode.toLocaleString()} Unit</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${persentase}%"></div>
                        </div>
                        <span>${persentase}%</span>
                    </td>
                    <td><span class="status-indicator ${statusClass}">${status}</span></td>
                    <td style="text-align: right;">Rp ${formatRupiah(hargaSatuan)}</td>
                    <td style="text-align: right;">Rp ${formatRupiah(nilaiTarget)}</td>
                    <td>
                        <div class="btn-group">
                            <button onclick="editTarget('${target.tanggalMulai}', '${target.namaBarang}')" 
                                    class="btn-action btn-edit" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="hapusTarget('${target.tanggalMulai}', '${target.namaBarang}')" 
                                    class="btn-action btn-delete" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        // Total per bulan
        const persentaseBulan = totalBulanTarget > 0 
            ? ((totalBulanPenjualan / totalBulanTarget) * 100).toFixed(1) 
            : 0;

        htmlTabel += `
            <tr class="total-row">
                <td colspan="3" style="text-align: right;"><strong>Total ${namaBulan} ${tahun}:</strong></td>
                <td style="text-align: right;"><strong>${totalBulanTarget.toLocaleString()} Unit</strong></td>
                <td style="text-align: right;"><strong>${totalBulanPenjualan.toLocaleString()} Unit</strong></td>
                <td><strong>${persentaseBulan}%</strong></td>
                <td></td>
                <td></td>
                <td style="text-align: right;"><strong>Rp ${formatRupiah(totalBulanNilai)}</strong></td>
                <td></td>
            </tr>
        `;
    });

    // Total keseluruhan
    const persentaseTotal = totalSemuaTarget > 0 
        ? ((totalSemuaPenjualan / totalSemuaTarget) * 100).toFixed(1) 
        : 0;

    htmlTabel += `
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;">
                                <strong>TOTAL KESELURUHAN:</strong>
                            </td>
                            <td style="text-align: right;">
                                <strong>${totalSemuaTarget.toLocaleString()} Unit</strong>
                            </td>
                            <td style="text-align: right;">
                                <strong>${totalSemuaPenjualan.toLocaleString()} Unit</strong>
                            </td>
                            <td><strong>${persentaseTotal}%</strong></td>
                            <td></td>
                            <td></td>
                            <td style="text-align: right;">
                                <strong>Rp ${formatRupiah(totalSemuaNilai)}</strong>
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;

    // Tampilkan dengan SweetAlert
    Swal.fire({
        title: '<span style="color: var(--text-dark)"><i class="fas fa-list"></i> Daftar Target Penjualan</span>',
        html: htmlTabel,
        width: '95%',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
            popup: 'target-penjualan-popup'
        }
    });
}

// Fungsi helper untuk format tanggal
function formatTanggal(tanggal) {
    return new Date(tanggal).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Fungsi helper untuk format Rupiah
function formatRupiah(angka) {
    if (isNaN(angka) || angka === null || angka === undefined) {
        return '0';
    }
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Fungsi pendukung
function formatTanggal(tanggal) {
    return new Date(tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(angka);
}

function hapusTarget(tanggalMulai, namaBarang) {
    // Ambil data target penjualan dari localStorage
    let targets = JSON.parse(localStorage.getItem('targetPenjualan')) || [];
    
    // Konfirmasi penghapusan target
    Swal.fire({
        title: 'Hapus Target Penjualan',
        html: `
            <div style="text-align: center;">
                <i class="fas fa-exclamation-triangle" style="color: #e74c3c; font-size: 48px; margin-bottom: 20px;"></i>
                <p>Apakah Anda yakin ingin menghapus target penjualan untuk:</p>
                <strong style="color: #2c3e50;">${namaBarang}</strong>
                <p style="margin-top: 10px; color: #7f8c8d;">
                    Periode: ${formatTanggal(tanggalMulai)}
                </p>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: '<i class="fas fa-trash"></i> Ya, Hapus!',
        cancelButtonText: '<i class="fas fa-times"></i> Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            // Filter out the target to be deleted
            const targetsBaru = targets.filter(target => 
                !(target.tanggalMulai === tanggalMulai && target.namaBarang === namaBarang)
            );

            // Simpan kembali ke localStorage
            localStorage.setItem('targetPenjualan', JSON.stringify(targetsBaru));

            // Tampilkan pesan sukses
            Swal.fire({
                icon: 'success',
                title: 'Berhasil Dihapus!',
                text: `Target penjualan untuk ${namaBarang} telah dihapus.`,
                timer: 1500,
                showConfirmButton: false
            });

            // Refresh tampilan daftar target
            tampilkanDaftarTarget();
        }
    });
}

// Fungsi helper untuk format tanggal (jika belum ada)
function formatTanggal(tanggal) {
    return new Date(tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}



function editTarget(tanggalMulai, namaBarang) {
    // Ambil daftar target dan barang dari localStorage
    const targets = JSON.parse(localStorage.getItem('targetPenjualan')) || [];
    const barang = JSON.parse(localStorage.getItem('barang')) || [];

    // Temukan target spesifik
    const targetIndex = targets.findIndex(t => 
        t.tanggalMulai === tanggalMulai && t.namaBarang === namaBarang
    );

    if (targetIndex === -1) {
        Swal.fire({
            icon: 'error',
            title: 'Target Tidak Ditemukan',
            text: 'Maaf, target penjualan yang Anda pilih tidak dapat ditemukan.'
        });
        return;
    }

    const target = targets[targetIndex];
    const barangTerkait = barang.find(b => b.nama === namaBarang) || {};

    // Custom CSS untuk styling
    const customStyles = `
        <style>
            :root {
                --primary-color: #3498db;
                --secondary-color: #2ecc71;
                --danger-color: #e74c3c;
                --background-light: #f8f9fa;
                --text-dark: #2c3e50;
                --border-radius: 12px;
                --transition-speed: 0.3s;
            }

            .edit-target-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                background: linear-gradient(135deg, var(--background-light) 0%, #ffffff 100%);
                padding: 25px;
                border-radius: var(--border-radius);
                border: 1px solid rgba(44, 62, 80, 0.1);
            }

            .form-group {
                display: flex;
                flex-direction: column;
            }

            .custom-input, .custom-date {
                height: 50px;
                border-radius: 8px;
                border: 2px solid rgba(44, 62, 80, 0.1);
                padding: 0 15px;
                font-size: 15px;
                transition: all 0.3s ease;
            }

            .custom-date:focus, .custom-input:focus {
                border-color: var(--primary-color);
                outline: none;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            }

            .form-label {
                margin-bottom: 8px;
                font-weight: 600;
                color: var(--text-dark);
            }

            @media (max-width: 768px) {
                .edit-target-container {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `;

    Swal.fire({
        title: 'Edit Target Penjualan',
        html: `
            ${customStyles}
            <div class="edit-target-container">
                <div class="form-group">
                    <label class="form-label">Barang</label>
                    <input type="text" class="custom-input" 
                           value="${namaBarang}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Harga Satuan</label>
                    <input type="text" class="custom-input" 
                           value="Rp ${formatRupiah(target.hargaSatuan)}" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Tanggal Mulai</label>
                    <input type="date" id="editTanggalMulai" 
                           class="custom-date" 
                           value="${target.tanggalMulai}">
                </div>
                <div class="form-group">
                    <label class="form-label">Tanggal Selesai</label>
                    <input type="date" id="editTanggalSelesai" 
                           class="custom-date" 
                           value="${target.tanggalSelesai}">
                </div>
                <div class="form-group">
                    <label class="form-label">Jumlah Target</label>
                    <input type="number" id="editJumlahTarget" 
                           class="custom-input" 
                           value="${target.jumlahTarget}" 
                           min="1" 
                           placeholder="Masukkan Jumlah Target Baru">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Simpan Perubahan',
        cancelButtonText: 'Batal',
        didOpen: () => {
            const tanggalMulai = document.getElementById('editTanggalMulai');
            const tanggalSelesai = document.getElementById('editTanggalSelesai');

            // Validasi tanggal
            tanggalSelesai.addEventListener('change', () => {
                const mulai = new Date(tanggalMulai.value);
                const selesai = new Date(tanggalSelesai.value);

                if (selesai < mulai) {
                    Swal.showValidationMessage('Tanggal selesai harus setelah tanggal mulai');
                    tanggalSelesai.value = target.tanggalSelesai;
                }
            });
        },
        preConfirm: () => {
            const tanggalMulai = document.getElementById('editTanggalMulai').value;
            const tanggalSelesai = document.getElementById('editTanggalSelesai').value;
            const jumlahTarget = document.getElementById('editJumlahTarget').value;
            
            // Validasi input
            if (!tanggalMulai || !tanggalSelesai) {
                Swal.showValidationMessage('Mohon lengkapi tanggal');
                return false;
            }

            const mulai = new Date(tanggalMulai);
            const selesai = new Date(tanggalSelesai);

            if (selesai < mulai) {
                Swal.showValidationMessage('Tanggal selesai harus setelah tanggal mulai');
                return false;
            }

            if (!jumlahTarget || parseInt(jumlahTarget) <= 0) {
                Swal.showValidationMessage('Jumlah target harus lebih dari 0');
                return false;
            }

            return {
                tanggalMulai,
                tanggalSelesai,
                jumlahTarget: parseInt(jumlahTarget)
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Update target
            targets[targetIndex].tanggalMulai = result.value.tanggalMulai;
            targets[targetIndex].tanggalSelesai = result.value.tanggalSelesai;
            targets[targetIndex].jumlahTarget = result.value.jumlahTarget;
            
            // Simpan kembali ke localStorage
            localStorage.setItem('targetPenjualan', JSON.stringify(targets));

            Swal.fire({
                icon: 'success',
                title: 'Target Diperbarui',
                text: `Target penjualan untuk ${namaBarang} berhasil diubah`,
                timer: 1500,
                showConfirmButton: false
            });

            // Refresh tampilan daftar target
            tampilkanDaftarTarget();
        }
    });
}   





function tambahDiskon() {
    // Get product list for autocomplete
    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    const productList = barang.map(item => item.nama);

    Swal.fire({
        title: 'Tambah Diskon',
        width: '550px',
        padding: '25px',
        background: '#ffffff',
        html: `
            <style>
                .discount-modal {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding: 10px;
                }
                .discount-input {
                    background-color: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 14px 16px;
                    font-size: 15px;
                    transition: all 0.2s ease;
                    width: 100%;
                    color: #334155;
                }
                .discount-input:focus {
                    background-color: #fff;
                    border-color: #3b82f6;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
                }
                .discount-input::placeholder {
                    color: #94a3b8;
                }
                .discount-label {
                    display: block;
                    text-align: left;
                    margin-bottom: 6px;
                    font-weight: 500;
                    color: #1e293b;
                    font-size: 14px;
                }
                .input-group {
                    position: relative;
                }
                .input-icon {
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                    pointer-events: none;
                }
                .custom-icon-container {
                    background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
                    padding: 20px;
                    border-radius: 16px;
                    margin-bottom: 25px;
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
                }
                .custom-icon {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    width: 70px;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                }
                .custom-icon i {
                    font-size: 32px;
                    color: white;
                }
                .date-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                .discount-hint {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 4px;
                }
                .error-message {
                    color: #ef4444;
                    font-size: 12px;
                    margin-top: 4px;
                }
                .product-suggestions {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    margin-top: 4px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 1000;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .suggestion-item {
                    padding: 10px 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .suggestion-item:hover {
                    background: #f1f5f9;
                }
                .extra-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 4px;
                }
                .info-badge {
                    background: #e0f2fe;
                    color: #0369a1;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .preview-container {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 16px;
                    margin-top: 20px;
                }
                .preview-title {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 10px;
                }
                .preview-content {
                    display: grid;
                    gap: 8px;
                }
                .preview-item {
                    display: flex;
                    justify-content: space-between;
                    color: #334155;
                    font-size: 14px;
                }
            </style>
            <div class="discount-modal">
                <div class="custom-icon-container">
                    <div class="custom-icon">
                        <i class="fas fa-tags"></i>
                    </div>
                </div>
                
                <div class="input-group">
                    <label class="discount-label">Nama Barang</label>
                    <input 
                        id="namaBarangDiskon" 
                        class="discount-input" 
                        placeholder="Ketik untuk mencari barang..."
                        autocomplete="off"
                    >
                    <span class="input-icon">
                        <i class="fas fa-search"></i>
                    </span>
                    <div id="productSuggestions" class="product-suggestions" style="display: none;"></div>
                </div>
                
                <div class="input-group">
                    <label class="discount-label">Persentase Diskon</label>
                    <input 
                        id="persenDiskon" 
                        type="number" 
                        class="discount-input" 
                        placeholder="0-100"
                        min="0" 
                        max="100"
                        onchange="updatePreview()"
                        onkeyup="updatePreview()"
                    >
                    <span class="input-icon">
                        <i class="fas fa-percent"></i>
                    </span>
                    <div class="discount-hint">Masukkan nilai antara 0-100</div>
                </div>
                
                <div class="date-container">
                    <div class="input-group">
                        <label class="discount-label">Tanggal Mulai</label>
                        <input 
                            id="tanggalMulai" 
                            type="date" 
                            class="discount-input"
                            onchange="updatePreview()"
                        >
                    </div>
                    <div class="input-group">
                        <label class="discount-label">Tanggal Berakhir</label>
                        <input 
                            id="tanggalBerakhir" 
                            type="date" 
                            class="discount-input"
                            onchange="updatePreview()"
                        >
                    </div>
                </div>

                <div id="previewContainer" class="preview-container" style="display: none;">
                    <div class="preview-title">Preview Diskon</div>
                    <div class="preview-content">
                        <div class="preview-item">
                            <span>Harga Normal:</span>
                            <span id="previewHargaNormal">-</span>
                        </div>
                        <div class="preview-item">
                            <span>Potongan Diskon:</span>
                            <span id="previewPotongan">-</span>
                        </div>
                        <div class="preview-item" style="font-weight: 600; color: #059669;">
                            <span>Harga Setelah Diskon:</span>
                            <span id="previewHargaAkhir">-</span>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#ef4444',
        confirmButtonText: '<i class="fas fa-save mr-2"></i>Simpan Diskon',
        cancelButtonText: '<i class="fas fa-times mr-2"></i>Batal',
        customClass: {
            confirmButton: 'px-6 py-3',
            cancelButton: 'px-6 py-3',
        },
        showClass: {
            popup: 'animate__animated animate__fadeInDown animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp animate__faster'
        },
        didOpen: () => {
            // Initialize product search
            const input = document.getElementById('namaBarangDiskon');
            const suggestions = document.getElementById('productSuggestions');
            
            input.addEventListener('input', function() {
                const value = this.value.toLowerCase();
                if (value.length < 1) {
                    suggestions.style.display = 'none';
                    return;
                }
                
                const filtered = productList.filter(product => 
                    product.toLowerCase().includes(value)
                );
                
                if (filtered.length > 0) {
                    suggestions.innerHTML = filtered.map(product => `
                        <div class="suggestion-item" onclick="selectProduct('${product}')">
                            ${product}
                        </div>
                    `).join('');
                    suggestions.style.display = 'block';
                } else {
                    suggestions.innerHTML = `
                        <div class="suggestion-item">
                            Tidak ada barang yang cocok
                        </div>
                    `;
                    suggestions.style.display = 'block';
                }
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', function(e) {
                if (!input.contains(e.target) && !suggestions.contains(e.target)) {
                    suggestions.style.display = 'none';
                }
            });
        },
        preConfirm: () => {
            const namaBarang = document.getElementById('namaBarangDiskon').value.trim();
            const persenDiskon = parseFloat(document.getElementById('persenDiskon').value);
            const tanggalMulai = document.getElementById('tanggalMulai').value;
            const tanggalBerakhir = document.getElementById('tanggalBerakhir').value;

            if (!namaBarang) {
                Swal.showValidationMessage('⚠️ Nama barang tidak boleh kosong');
                return false;
            }

            if (!productList.includes(namaBarang)) {
                Swal.showValidationMessage('⚠️ Pilih barang dari daftar yang tersedia');
                return false;
            }

            if (isNaN(persenDiskon) || persenDiskon < 0 || persenDiskon > 100) {
                Swal.showValidationMessage('⚠️ Diskon harus antara 0-100%');
                return false;
            }

            if (!tanggalMulai) {
                Swal.showValidationMessage('⚠️ Tentukan tanggal mulai diskon');
                return false;
            }

            if (!tanggalBerakhir) {
                Swal.showValidationMessage('⚠️ Tentukan tanggal berakhir diskon');
                return false;
            }

            const mulai = new Date(tanggalMulai);
            const berakhir = new Date(tanggalBerakhir);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (mulai < today) {
                Swal.showValidationMessage('⚠️ Tanggal mulai tidak boleh kurang dari hari ini');
                return false;
            }

            if (mulai > berakhir) {
                Swal.showValidationMessage('⚠️ Tanggal mulai tidak boleh melebihi tanggal berakhir');
                return false;
            }

            return { 
                namaBarang, 
                persenDiskon, 
                tanggalMulai, 
                tanggalBerakhir 
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            simpanDiskon(
                result.value.namaBarang, 
                result.value.persenDiskon, 
                result.value.tanggalMulai, 
                result.value.tanggalBerakhir
            );
        }
    });
}

function selectProduct(product) {
    document.getElementById('namaBarangDiskon').value = product;
    document.getElementById('productSuggestions').style.display = 'none';
    updatePreview();
}

function updatePreview() {
    const namaBarang = document.getElementById('namaBarangDiskon').value.trim();
    const persenDiskonInput = document.getElementById('persenDiskon').value;
    const persenDiskon = persenDiskonInput === '' ? 0 : parseFloat(persenDiskonInput);
    
    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    const item = barang.find(item => item.nama === namaBarang);
    
    const previewContainer = document.getElementById('previewContainer');
    const previewHargaNormal = document.getElementById('previewHargaNormal');
    const previewPotongan = document.getElementById('previewPotongan');
    const previewHargaAkhir = document.getElementById('previewHargaAkhir');
    
    // Only show preview if we have both a valid item and a valid discount percentage
    if (item && !isNaN(persenDiskon) && persenDiskon >= 0 && persenDiskon <= 100) {
        const hargaNormal = parseFloat(item.hargaJual) || 0; // Use hargaJual instead of harga
        const potongan = Math.round((hargaNormal * persenDiskon) / 100); // Round to avoid floating point issues
        const hargaAkhir = hargaNormal - potongan;
        
        previewHargaNormal.textContent = formatRupiah(hargaNormal);
        previewPotongan.textContent = formatRupiah(potongan);
        previewHargaAkhir.textContent = formatRupiah(hargaAkhir);
        previewContainer.style.display = 'block';
    } else {
        // Hide preview if data is invalid
        previewContainer.style.display = 'none';
    }
}

// Helper function for proper currency formatting
function formatRupiah(amount) {
    // Ensure amount is a number and round it to avoid decimal issues
    amount = Math.round(Number(amount));
    if (isNaN(amount)) return 'Rp 0';
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}


function simpanDiskon(namaBarang, persenDiskon, tanggalMulai, tanggalBerakhir) {
    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    let diskon = JSON.parse(localStorage.getItem('diskon')) || [];

    // Find item and validate
    const item = barang.find(item => item.nama === namaBarang);
    if (!item) {
        Swal.fire({
            icon: 'error',
            title: 'Barang Tidak Ditemukan',
            text: 'Pastikan nama barang sudah sesuai dengan data yang tersedia.',
            confirmButtonColor: '#ef4444',
            showClass: {
                popup: 'animate__animated animate__fadeInDown animate__faster'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp animate__faster'
            }
        });
        return;
    }

    // Ensure discount is within valid range
    persenDiskon = Math.max(0, Math.min(parseFloat(persenDiskon), 100));

    // Calculate prices
    const hargaNormal = parseFloat(item.hargaJual);
    const potongan = Math.round((hargaNormal * persenDiskon) / 100);
    const hargaAkhir = hargaNormal - potongan;

    // Check for existing discount
    const existingDiskon = diskon.find(d => d.kode === item.kode);
    if (existingDiskon) {
        // Ask for confirmation to update existing discount
        Swal.fire({
            title: 'Diskon Sudah Ada',
            html: `
                <div style="text-align: left; padding: 10px;">
                    <p>Barang ini sudah memiliki diskon:</p>
                    <div style="
                        background: #f1f5f9;
                        border-radius: 8px;
                        padding: 12px;
                        margin: 10px 0;
                        font-size: 14px;
                    ">
                        <p><strong>Diskon Saat Ini:</strong> ${existingDiskon.persenDiskon}%</p>
                        <p><strong>Periode:</strong> ${formatTanggal(existingDiskon.tanggalMulai)} - ${formatTanggal(existingDiskon.tanggalBerakhir)}</p>
                        <p><strong>Harga Normal:</strong> ${formatRupiah(existingDiskon.hargaNormal)}</p>
                        <p><strong>Harga Setelah Diskon:</strong> ${formatRupiah(existingDiskon.hargaDiskon)}</p>
                    </div>
                    <p>Apakah Anda ingin memperbarui diskon ini?</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Perbarui',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            showClass: {
                popup: 'animate__animated animate__fadeInDown animate__faster'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp animate__faster'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Remove existing discount
                diskon = diskon.filter(d => d.kode !== item.kode);
                // Add new discount
                addNewDiscount();
            }
        });
    } else {
        addNewDiscount();
    }

    function addNewDiscount() {
        // Create new discount object
        const newDiskon = {
            kode: item.kode,
            nama: item.nama,
            persenDiskon: persenDiskon,
            tanggalMulai: tanggalMulai,
            tanggalBerakhir: tanggalBerakhir,
            hargaNormal: hargaNormal,
            hargaDiskon: hargaAkhir,
            potonganHarga: potongan,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        // Add to array and save
        diskon.push(newDiskon);
        localStorage.setItem('diskon', JSON.stringify(diskon));

        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Diskon Berhasil Ditambahkan!',
            html: `
                <div style="
                    background: #f0fdf4;
                    border: 1px solid #86efac;
                    border-radius: 12px;
                    padding: 16px;
                    margin-top: 20px;
                    text-align: left;
                ">
                    <div style="margin-bottom: 16px;">
                        <h3 style="
                            font-size: 16px;
                            color: #166534;
                            margin-bottom: 12px;
                            font-weight: 600;
                        ">Detail Diskon:</h3>
                        <p style="margin: 8px 0;"><strong>Barang:</strong> ${item.nama}</p>
                        <p style="margin: 8px 0;"><strong>Diskon:</strong> ${persenDiskon}%</p>
                        <p style="margin: 8px 0;"><strong>Periode:</strong> ${formatTanggal(tanggalMulai)} s/d ${formatTanggal(tanggalBerakhir)}</p>
                    </div>
                    <div style="
                        background: #ffffff;
                        border-radius: 8px;
                        padding: 12px;
                    ">
                        <p style="margin: 4px 0;"><strong>Harga Normal:</strong> ${formatRupiah(hargaNormal)}</p>
                        <p style="margin: 4px 0;"><strong>Potongan Harga:</strong> ${formatRupiah(potongan)}</p>
                        <p style="
                            margin: 8px 0 4px 0;
                            color: #059669;
                            font-size: 16px;
                            font-weight: 600;
                        "><strong>Harga Setelah Diskon:</strong> ${formatRupiah(hargaAkhir)}</p>
                    </div>
                </div>
            `,
            confirmButtonColor: '#22c55e',
            confirmButtonText: 'Selesai',
            showClass: {
                popup: 'animate__animated animate__fadeInDown animate__faster'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp animate__faster'
            }
        }).then(() => {
            // Refresh the discount list if it's visible
            if (document.querySelector('.discount-table-container')) {
                lihatDiskon();
            }
        });
    }
}

function updateDiskonKedaluwarsaCounter() {
        const diskonKedaluwarsa = JSON.parse(localStorage.getItem('diskonKedaluwarsa')) || [];
        const counterElement = document.getElementById('diskonKedaluwarsaCounter');
        
        if (diskonKedaluwarsa.length > 0) {
            counterElement.textContent = diskonKedaluwarsa.length;
            counterElement.style.display = 'inline-block';
        } else {
            counterElement.style.display = 'none';
        }
    }

    // Panggil fungsi saat halaman dimuat
    document.addEventListener('DOMContentLoaded', function() {
        // Jalankan hapus diskon kedaluwarsa
        const jumlahDiskonKedaluwarsa = hapusDiskonKedaluwarsa();
        
        // Update counter
        updateDiskonKedaluwarsaCounter();

        // Optional: Tambahkan event listener untuk memperbarui counter
        window.addEventListener('storage', function(event) {
            if (event.key === 'diskonKedaluwarsa') {
                updateDiskonKedaluwarsaCounter();
            }
        });
    });
    
function hapusDiskonKedaluwarsa() {
    // Ambil data diskon dari localStorage
    let diskon = JSON.parse(localStorage.getItem('diskon')) || [];
    
    // Ambil data diskon kedaluwarsa sebelumnya (jika ada)
    let diskonKedaluwarsa = JSON.parse(localStorage.getItem('diskonKedaluwarsa')) || [];
    
    // Tanggal hari ini
    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0); // Atur ke awal hari

    // Pisahkan diskon aktif dan kedaluwarsa
    const diskonAktif = [];
    const diskonBaru = [];

    diskon.forEach(item => {
        const tanggalBerakhir = new Date(item.tanggalBerakhir);
        tanggalBerakhir.setHours(23, 59, 59, 999); // Atur ke akhir hari

        if (tanggalBerakhir < hariIni) {
            // Tambahkan ke daftar diskon kedaluwarsa
            diskonBaru.push({
                ...item,
                tanggalKedaluwarsa: new Date().toISOString()
            });
        } else {
            // Tetap aktif
            diskonAktif.push(item);
        }
    });

    // Gabungkan diskon kedaluwarsa yang lama dengan yang baru
    const diskonKedaluwarsaUpdated = [...diskonKedaluwarsa, ...diskonBaru];

    // Batasi jumlah diskon kedaluwarsa (misalnya maks 100 entri)
    if (diskonKedaluwarsaUpdated.length > 100) {
        diskonKedaluwarsaUpdated.splice(0, diskonKedaluwarsaUpdated.length - 100);
    }

    // Simpan data
    localStorage.setItem('diskon', JSON.stringify(diskonAktif));
    localStorage.setItem('diskonKedaluwarsa', JSON.stringify(diskonKedaluwarsaUpdated));

    // Optional: Tampilkan notifikasi
    if (diskonBaru.length > 0) {
        Swal.fire({
            icon: 'info',
            title: 'Diskon Kedaluwarsa',
            html: `
                <p>Terdapat ${diskonBaru.length} diskon yang telah berakhir:</p>
                <ul>
                    ${diskonBaru.map(item => `
                        <li>
                            ${item.nama} 
                            (${item.persenDiskon}% - Berakhir ${formatTanggal(item.tanggalBerakhir)})
                        </li>
                    `).join('')}
                </ul>
            `,
            confirmButtonText: 'Tutup'
        });
    }

    return diskonBaru.length; // Kembalikan jumlah diskon yang dihapus
}

// Fungsi untuk menampilkan diskon kedaluwarsa
function lihatDiskonKedaluwarsa() {
    const diskonKedaluwarsa = JSON.parse(localStorage.getItem('diskonKedaluwarsa')) || [];
    
    if (diskonKedaluwarsa.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Diskon Kedaluwarsa',
            text: 'Tidak ada diskon kedaluwarsa.'
        });
        return;
    }

    Swal.fire({
        title: 'Riwayat Diskon Kedaluwarsa',
        width: '90%',
        html: `
            <style>
                .diskon-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .diskon-table th, .diskon-table td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                .diskon-table th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                .diskon-table tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
            </style>
            <table class="diskon-table">
                <thead>
                    <tr>
                        <th>Nama Barang</th>
                        <th>Diskon</th>
                        <th>Periode Awal</th>
                        <th>Periode Akhir</th>
                        <th>Tanggal Kedaluwarsa</th>
                        <th>Harga Normal</th>
                        <th>Harga Diskon</th>
                    </tr>
                </thead>
                <tbody>
                    ${diskonKedaluwarsa.map(item => `
                        <tr>
                            <td>${item.nama}</td>
                            <td>${item.persenDiskon}%</td>
                            <td>${formatTanggal(item.tanggalMulai)}</td>
                            <td>${formatTanggal(item.tanggalBerakhir)}</td>
                            <td>${formatTanggal(item.tanggalKedaluwarsa)}</td>
                            <td>${formatRupiah(item.hargaNormal)}</td>
                            <td>${formatRupiah(item.hargaDiskon)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `,
        showCloseButton: true,
        showConfirmButton: false
    });
}

// Panggil fungsi hapusDiskonKedaluwarsa saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    hapusDiskonKedaluwarsa();
});

// Tambahkan tombol atau menu untuk melihat diskon kedaluwarsa
function tambahTombolDiskonKedaluwarsa() {
    const container = document.createElement('div');
    container.innerHTML = `
        <button onclick="lihatDiskonKedaluwarsa()" class="btn btn-secondary">
            <i class="fas fa-history"></i> Riwayat Diskon Kedaluwarsa
        </button>
    `;
    // Misalnya tambahkan ke suatu kontainer di halaman Anda
    document.getElementById('diskonContainer').appendChild(container);
}


// Helper function to format dates
function formatTanggal(tanggal) {
    return new Date(tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Helper function for currency formatting
function formatRupiah(amount) {
    // Ensure amount is a number and round it
    amount = Math.round(Number(amount));
    if (isNaN(amount)) return 'Rp 0';
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
// Helper function for live search
function searchProducts(query) {
    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    if (!query) return [];
    
    const searchTerm = query.toLowerCase();
    return barang.filter(item => 
        item.nama.toLowerCase().includes(searchTerm) ||
        item.kode.toLowerCase().includes(searchTerm)
    ).slice(0, 5); // Limit to 5 results
}

// Helper function to set minimum date for date inputs
function setMinimumDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalMulai').min = today;
    document.getElementById('tanggalBerakhir').min = today;
}

// Initialize tooltips if needed
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}
            
 // Function to generate PLU from the last 4 digits of the kodeBarang
function generatePLU() {
    const kodeBarang = document.getElementById('kodeBarang').value;
    
    // Only proceed if the kodeBarang is 4 or more characters
    if (kodeBarang.length >= 4) {
        const plu = kodeBarang.slice(-4);  // Get the last 4 digits
        document.getElementById('pluBarang').value = plu;  // Set the PLU field
    } else {
        document.getElementById('pluBarang').value = '';  // Clear PLU if less than 4 characters
    }
}

// Add event listener for the 'Enter' key press on kodeBarang input
document.getElementById('kodeBarang').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        generatePLU();  // Trigger PLU generation when Enter is pressed
    }
});

function tambahBarang() {
    const kodeBarang = document.getElementById('kodeBarang').value;
    const pluBarang = document.getElementById('pluBarang').value;
    const namaBarang = document.getElementById('namaBarang').value;
    const hargaBeli = document.getElementById('hargaBeli').value;
    const hargaJual = document.getElementById('hargaJual').value;
    const stokBarang = document.getElementById('stokBarang').value;

    // Ambil username dari localStorage untuk mencari akun yang sedang login
    const username = localStorage.getItem('username');
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const currentAccount = accounts.find(account => account.username === username);
    const kodeToko = currentAccount ? currentAccount.kodeToko : ''; // Ambil kode toko dari akun yang login

    if (kodeBarang && pluBarang && namaBarang && hargaBeli && hargaJual && stokBarang) {
        let barang = JSON.parse(localStorage.getItem('barang')) || [];
        
        let existingItem = barang.find(item => item.kode === kodeBarang);
        if (existingItem) {
            alert('Kode barang sudah ada. Silakan masukkan kode yang berbeda.');
        } else {
            // Add the new item with the PLU field
            barang.push({
                kode: kodeBarang,
                plu: pluBarang, // Save PLU
                nama: namaBarang,
                hargaBeli: parseFloat(hargaBeli),
                hargaJual: parseFloat(hargaJual),
                stok: parseInt(stokBarang),
                kodeToko: kodeToko || null, // Simpan kode toko dari akun yang login, atau null jika tidak ada
                kategori: document.getElementById('kategoriBarang').value,
                terjual: 0
            });
            localStorage.setItem('barang', JSON.stringify(barang));

            // Clear input fields after adding
            document.getElementById('kodeBarang').value = '';
            document.getElementById('pluBarang').value = ''; // Clear PLU
            document.getElementById('namaBarang').value = '';
            document.getElementById('hargaBeli').value = '';
            document.getElementById('hargaJual').value = '';
            document.getElementById('stokBarang').value = '';
            document.getElementById('kategoriBarang').value = '';
        }
    } else {
        alert('Lengkapi data barang');
    }
}

document.addEventListener('DOMContentLoaded', loadBarang);

// Fungsi untuk menambahkan event listener ketika localStorage berubah
window.addEventListener('storage', function(event) {
    if (event.key === 'barang') {
        loadBarang(); // Panggil loadBarang saat ada perubahan di localStorage untuk kunci 'barang'
    }
});

// Function to create and show low stock popup
function showLowStockPopup(stokHampirHabis) {
    // Create popup HTML
    const popupHTML = `
        <div class="popup-overlay" id="lowStockPopup">
            <div class="popup-container">
                <div class="popup-header">
                    <div class="warning-icon">⚠️</div>
                    <h2>Stok Hampir Habis!</h2>
                    <button class="close-btn" onclick="closeLowStockPopup()">×</button>
                </div>
                <div class="popup-content">
                    <p class="popup-message">Berikut daftar barang yang stoknya 5 atau kurang:</p>
                    <div class="stock-list">
                        ${stokHampirHabis.map(item => `
                            <div class="stock-item">
                                <span class="item-name">${item}</span>
                                <span class="stock-badge">Stok Rendah</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="popup-footer">
                    <button class="popup-btn primary" onclick="closeLowStockPopup()">Mengerti</button>
                    <button class="popup-btn secondary" onclick="printLowStockReport()">Cetak Laporan</button>
                </div>
            </div>
        </div>
    `;

    // Add popup to body
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    // Show popup with animation
    setTimeout(() => {
        document.getElementById('lowStockPopup').classList.add('active');
    }, 100);
}

// Function to close popup
function closeLowStockPopup() {
    const popup = document.getElementById('lowStockPopup');
    if (popup) {
        popup.classList.remove('active');
        setTimeout(() => {
            popup.remove();
        }, 300);
    }
}

// Function to print low stock report
function printLowStockReport() {
    const popup = document.getElementById('lowStockPopup');
    const stockItems = popup.querySelectorAll('.stock-item .item-name');
    
    let reportContent = 'LAPORAN STOK HAMPIR HABIS\n';
    reportContent += '='.repeat(30) + '\n';
    reportContent += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`;
    
    stockItems.forEach((item, index) => {
        reportContent += `${index + 1}. ${item.textContent}\n`;
    });
    
    // Create and download report
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-stok-habis-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Modified loadBarang function
function loadBarang() {
    // Get the table element and verify it exists
    const tabelElement = document.getElementById('tabelBarang');
    if (!tabelElement) {
        console.error('Table element not found');
        return;
    }

    // Get or create tbody
    let tbody = tabelElement.getElementsByTagName('tbody')[0];
    if (!tbody) {
        tbody = document.createElement('tbody');
        tabelElement.appendChild(tbody);
    }

    // Get data from localStorage
    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    
    // Clear existing table content
    tbody.innerHTML = '';

    let stokHampirHabis = [];

    // Group items by category
    const kategoriKelompok = {};
    barang.forEach(item => {
        const kategori = item.kategori || 'Uncategorized';
        if (!kategoriKelompok[kategori]) {
            kategoriKelompok[kategori] = [];
        }
        kategoriKelompok[kategori].push(item);

        // Check for low stock
        if (item.stok <= 5) {
            stokHampirHabis.push(`${item.nama} (Stok: ${item.stok})`);
        }
    });

    // Define category order
    const urutanKategori = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'Uncategorized'];

    // Display items by category
    urutanKategori.forEach(kategori => {
        if (kategoriKelompok[kategori] && kategoriKelompok[kategori].length > 0) {
            try {
                // Add category header
                const headerRow = tbody.insertRow();
                const headerCell = headerRow.insertCell(0);
                headerCell.colSpan = 12;
                headerCell.innerHTML = `<strong>Kategori: ${kategori}</strong>`;
                headerCell.className = 'category-header';

                // Add items in this category
                kategoriKelompok[kategori].forEach(item => {
                    const row = tbody.insertRow();
                    
                    // Check if the item is under stock opname
                    const cekStok = JSON.parse(localStorage.getItem(`cekStok_${item.kode}`));
                    const isInOpname = cekStok && cekStok.status === 'pending';

                    // Create cells with safe value assignment
                    const cells = [
                        '',
                        item.kodeToko || '',
                        item.kode || '',
                        item.plu || '',
                        item.nama || '',
                        formatRupiah(item.hargaBeli || 0),
                        formatRupiah(item.hargaJual || 0),
                        isInOpname ? 'Sedang STOK' : (item.stok || 0),
                        item.terjual || 0,
                        formatRupiah((item.hargaJual - item.hargaBeli) * (item.terjual || 0)),
                        `${item.stok > 0 ? ((item.terjual || 0) / item.stok * 100).toFixed(2) : 0}%`
                    ];

                    // Insert cells with values
                    cells.forEach(cellValue => {
                        row.insertCell().innerText = cellValue;
                    });

                    // Add action buttons
                    const actionCell = row.insertCell();
                    
                    // Edit button
                    const editBtn = document.createElement('button');
                    editBtn.className = 'action-btn edit-btn';
                    editBtn.innerHTML = '<i class="fas fa-edit"></i>Edit';
                    editBtn.onclick = () => {
                        if (isInOpname) {
                            showNotification('error', 'Barang sedang dalam proses stok opname dan tidak dapat diedit');
                        } else {
                            editBarang(item.kode);
                        }
                    };
                    actionCell.appendChild(editBtn);

                    // Delete button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'action-btn hapus-btn';
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>Hapus';
                    deleteBtn.onclick = () => hapusBarang(item.kode);
                    actionCell.appendChild(deleteBtn);
                });
            } catch (error) {
                console.error(`Error processing category ${kategori}:`, error);
            }
        }
    });

    // Show low stock notification using custom popup
    if (stokHampirHabis.length > 0) {
        showLowStockPopup(stokHampirHabis);
    }
}

// CSS styles for the popup (add to your stylesheet)
const popupStyles = `
<style>
.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.popup-overlay.active {
    opacity: 1;
    visibility: visible;
}

.popup-container {
    background: white;
    border-radius: 15px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    transform: scale(0.8);
    transition: transform 0.3s ease;
}

.popup-overlay.active .popup-container {
    transform: scale(1);
}

.popup-header {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
    color: white;
    padding: 20px;
    text-align: center;
    position: relative;
}

.popup-header h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
}

.warning-icon {
    font-size: 48px;
    margin-bottom: 10px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

.close-btn {
    position: absolute;
    top: 15px;
    right: 20px;
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.3s ease;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.popup-content {
    padding: 25px;
    max-height: 400px;
    overflow-y: auto;
}

.popup-message {
    font-size: 16px;
    color: #333;
    margin-bottom: 20px;
    text-align: center;
}

.stock-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.stock-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #ff6b6b;
}

.item-name {
    font-weight: 500;
    color: #333;
}

.stock-badge {
    background: #ff6b6b;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.popup-footer {
    padding: 20px 25px;
    background: #f8f9fa;
    display: flex;
    gap: 10px;
    justify-content: center;
}

.popup-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.popup-btn.primary {
    background: #4CAF50;
    color: white;
}

.popup-btn.primary:hover {
    background: #45a049;
}

.popup-btn.secondary {
    background: #6c757d;
    color: white;
}

.popup-btn.secondary:hover {
    background: #5a6268;
}
</style>
`;




// Function to create Excel report for low stock items
function createExcelLowStockReport() {
    // Get all items from localStorage
    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    
    // Filter items with low stock (5 or less)
    const lowStockItems = barang.filter(item => item.stok <= 5);
    
    if (lowStockItems.length === 0) {
        alert('Tidak ada barang dengan stok rendah');
        return;
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = [
        // Header row
        [
            'No',
            'Kode Toko',
            'Kode Barang',
            'PLU',
            'Nama Barang',
            'Kategori',
            'Harga Beli',
            'Harga Jual',
            'Stok Saat Ini',
            'Terjual',
            'Status',
            'Tanggal Laporan'
        ]
    ];

    // Add data rows
    lowStockItems.forEach((item, index) => {
        let status = '';
        if (item.stok === 0) {
            status = 'HABIS';
        } else if (item.stok <= 2) {
            status = 'KRITIS';
        } else if (item.stok <= 5) {
            status = 'RENDAH';
        }

        excelData.push([
            index + 1,
            item.kodeToko || '',
            item.kode || '',
            item.plu || '',
            item.nama || '',
            item.kategori || 'Uncategorized',
            item.hargaBeli || 0,
            item.hargaJual || 0,
            item.stok || 0,
            item.terjual || 0,
            status,
            new Date().toLocaleDateString('id-ID')
        ]);
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    const columnWidths = [
        { wch: 5 },   // No
        { wch: 12 },  // Kode Toko
        { wch: 15 },  // Kode Barang
        { wch: 12 },  // PLU
        { wch: 30 },  // Nama Barang
        { wch: 12 },  // Kategori
        { wch: 15 },  // Harga Beli
        { wch: 15 },  // Harga Jual
        { wch: 12 },  // Stok
        { wch: 10 },  // Terjual
        { wch: 10 },  // Status
        { wch: 15 }   // Tanggal
    ];
    worksheet['!cols'] = columnWidths;

    // Style the header row
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center", vertical: "center" }
        };
    }

    // Style status cells with colors
    for (let row = 1; row <= lowStockItems.length; row++) {
        const statusCell = XLSX.utils.encode_cell({ r: row, c: 10 }); // Status column
        const stockCell = XLSX.utils.encode_cell({ r: row, c: 8 });   // Stock column
        
        if (worksheet[statusCell] && worksheet[stockCell]) {
            const stockValue = worksheet[stockCell].v;
            let fillColor = "";
            
            if (stockValue === 0) {
                fillColor = "FF6B6B"; // Red for out of stock
            } else if (stockValue <= 2) {
                fillColor = "FFA726"; // Orange for critical
            } else if (stockValue <= 5) {
                fillColor = "FFEB3B"; // Yellow for low
            }
            
            if (fillColor) {
                worksheet[statusCell].s = {
                    fill: { fgColor: { rgb: fillColor } },
                    font: { bold: true },
                    alignment: { horizontal: "center" }
                };
            }
        }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Rendah');

    // Create summary worksheet
    const summaryData = [
        ['RINGKASAN LAPORAN STOK RENDAH'],
        [''],
        ['Tanggal Laporan:', new Date().toLocaleDateString('id-ID')],
        ['Total Barang Stok Rendah:', lowStockItems.length],
        [''],
        ['Kategori Stok:'],
        ['- Habis (0):', lowStockItems.filter(item => item.stok === 0).length],
        ['- Kritis (1-2):', lowStockItems.filter(item => item.stok >= 1 && item.stok <= 2).length],
        ['- Rendah (3-5):', lowStockItems.filter(item => item.stok >= 3 && item.stok <= 5).length],
        [''],
        ['Kategori Barang:']
    ];

    // Add category breakdown
    const categoryBreakdown = {};
    lowStockItems.forEach(item => {
        const category = item.kategori || 'Uncategorized';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    Object.entries(categoryBreakdown).forEach(([category, count]) => {
        summaryData.push([`- ${category}:`, count]);
    });

    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style summary worksheet
    summaryWorksheet['A1'].s = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: "center" }
    };

    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Ringkasan');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Stok_Rendah_${timestamp}.xlsx`;

    // Write and download the file
    XLSX.writeFile(workbook, filename);
    
    // Show success notification
    showNotification('success', `Laporan Excel berhasil diunduh: ${filename}`);
}

// Function to create detailed Excel report with additional analysis
function createDetailedExcelReport() {
    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    const lowStockItems = barang.filter(item => item.stok <= 5);
    
    if (lowStockItems.length === 0) {
        alert('Tidak ada barang dengan stok rendah');
        return;
    }

    const workbook = XLSX.utils.book_new();

    // 1. Main Report Sheet
    const mainData = [
        ['LAPORAN STOK RENDAH - DETAIL'],
        [''],
        ['No', 'Kode Toko', 'Kode Barang', 'PLU', 'Nama Barang', 'Kategori', 'Harga Beli', 'Harga Jual', 'Stok', 'Terjual', 'Keuntungan', 'Status', 'Rekomendasi']
    ];

    lowStockItems.forEach((item, index) => {
        let status = item.stok === 0 ? 'HABIS' : item.stok <= 2 ? 'KRITIS' : 'RENDAH';
        let recommendation = '';
        
        if (item.stok === 0) {
            recommendation = 'SEGERA RESTOK';
        } else if (item.stok <= 2) {
            recommendation = 'RESTOK PRIORITAS';
        } else {
            recommendation = 'PERLU RESTOK';
        }

        const keuntungan = (item.hargaJual - item.hargaBeli) * (item.terjual || 0);

        mainData.push([
            index + 1,
            item.kodeToko || '',
            item.kode || '',
            item.plu || '',
            item.nama || '',
            item.kategori || 'Uncategorized',
            item.hargaBeli || 0,
            item.hargaJual || 0,
            item.stok || 0,
            item.terjual || 0,
            keuntungan,
            status,
            recommendation
        ]);
    });

    const mainSheet = XLSX.utils.aoa_to_sheet(mainData);
    mainSheet['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 30 }, 
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, 
        { wch: 15 }, { wch: 10 }, { wch: 20 }
    ];

    // 2. Analysis Sheet
    const analysisData = [
        ['ANALISIS STOK RENDAH'],
        [''],
        ['Metrik', 'Nilai'],
        ['Total Barang Stok Rendah', lowStockItems.length],
        ['Total Nilai Investasi Stok Rendah', lowStockItems.reduce((sum, item) => sum + (item.hargaBeli * item.stok), 0)],
        ['Potensi Kerugian (Stok Habis)', lowStockItems.filter(item => item.stok === 0).reduce((sum, item) => sum + (item.hargaJual * 10), 0)],
        [''],
        ['Kategori Prioritas Restok:'],
        ['1. Barang Habis', lowStockItems.filter(item => item.stok === 0).length],
        ['2. Barang Kritis (1-2)', lowStockItems.filter(item => item.stok >= 1 && item.stok <= 2).length],
        ['3. Barang Rendah (3-5)', lowStockItems.filter(item => item.stok >= 3 && item.stok <= 5).length]
    ];

    const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);

    // 3. Category Breakdown Sheet
    const categoryData = [['Kategori', 'Jumlah Barang', 'Persentase']];
    const categoryBreakdown = {};
    
    lowStockItems.forEach(item => {
        const category = item.kategori || 'Uncategorized';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    Object.entries(categoryBreakdown).forEach(([category, count]) => {
        const percentage = ((count / lowStockItems.length) * 100).toFixed(1);
        categoryData.push([category, count, `${percentage}%`]);
    });

    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);

    // Add all sheets to workbook
    XLSX.utils.book_append_sheet(workbook, mainSheet, 'Laporan Utama');
    XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analisis');
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Kategori');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Stok_Detail_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
    
    showNotification('success', `Laporan detail berhasil diunduh: ${filename}`);
}

// Updated function to replace the previous printLowStockReport
function printLowStockReport() {
    // Show options to user
    const choice = confirm('Pilih format laporan:\nOK = Excel Detail\nCancel = Excel Sederhana');
    
    if (choice) {
        createDetailedExcelReport();
    } else {
        createExcelLowStockReport();
    }
}

// Function to show notification (you may already have this)
function showNotification(type, message) {
    // Simple notification - you can replace with your existing notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        transition: opacity 0.3s ease;
    `;
    
    if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f44336';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add SheetJS library to your HTML head section
const scriptTag = document.createElement('script');
scriptTag.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
document.head.appendChild(scriptTag);


// Add styles to document head
document.head.insertAdjacentHTML('beforeend', popupStyles);
// Helper function for formatting currency
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}



function formatRupiah(angka) {
    // Menggunakan toFixed(0) untuk menghilangkan angka desimal
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
}
        
        function hapusBarang(index) {
            Swal.fire({
                title: 'Konfirmasi',
                text: 'Apakah Anda yakin ingin menghapus barang ini?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, hapus!',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    let barang = JSON.parse(localStorage.getItem('barang')) || [];
                    barang.splice(index, 1);
                    localStorage.setItem('barang', JSON.stringify(barang));
                    loadBarang();
                    Swal.fire('Berhasil', 'Barang berhasil dihapus', 'success');
                } else {
                    Swal.fire('Batal', 'Penghapusan dibatalkan', 'info');
                }
            });
        }

// Helper function for formatting numbers without separators
function formatNumber(amount) {
    return amount.toString().replace(/\./g, '').replace(/,/g, '');
}

function downloadExcel() {
    try {
        // Fetch all relevant data from localStorage
        const barangData = JSON.parse(localStorage.getItem('barang')) || [];
        const targetData = JSON.parse(localStorage.getItem('targetPenjualan')) || [];
        const diskonData = JSON.parse(localStorage.getItem('diskon')) || [];
        const diskonKedaluwarsaData = JSON.parse(localStorage.getItem('diskonKedaluwarsa')) || [];
        const stokOpnameData = JSON.parse(localStorage.getItem('stokOpname')) || [];

        // Get pending stock opname items
        const pendingOpnames = stokOpnameData.filter(op => op.status === 'pending');
        const pendingItems = new Set();
        
        pendingOpnames.forEach(opname => {
            opname.items.forEach(item => {
                pendingItems.add(item.kode);
            });
        });

        // Helper function to check if item is in pending stock opname
        function isInPendingStockOpname(kodeBarang) {
            return pendingItems.has(kodeBarang);
        }

        // Helper functions
        function formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }

        function formatRupiah(num) {
            return `Rp ${formatNumber(num)}`;
        }

        function formatTanggal(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        // Define category order
        const urutanKategori = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'Uncategorized'];

        // --- Sheet 1: Data Barang ---
        let barangSheetData = [
            ['Kategori', 'Kode Toko', 'Kode Barang', 'PLU', 'Nama Barang', 'Status Stock Opname', 
             'Stok', 'Harga Beli', 'Harga Jual', 'Total Terjual', 'Keuntungan', 'Persentase Terjual', 
             'Target Penjualan', 'Persentase Target', 'Diskon Aktif', 'Harga Setelah Diskon']
        ];

        // Group items by category
        const groupedData = {};
        urutanKategori.forEach(kategori => {
            groupedData[kategori] = barangData.filter(item => item.kategori === kategori);
        });

        // Process each category
        urutanKategori.forEach(kategori => {
            const items = groupedData[kategori];
            if (items && items.length > 0) {
                items.forEach(item => {
                    const isInPendingSO = isInPendingStockOpname(item.kode);
                    const hargaBeli = parseFloat(item.hargaBeli) || 0;
                    const hargaJual = parseFloat(item.hargaJual) || 0;
                    const totalTerjual = parseInt(item.terjual) || 0;
                    const keuntungan = (hargaJual - hargaBeli) * totalTerjual;

                    // Determine stock display
                    let stokDisplay, persentaseTerjual;
                    if (isInPendingSO) {
                        stokDisplay = 'Dalam Proses SO';
                        persentaseTerjual = '-';
                    } else {
                        const stok = parseInt(item.stok) || 0;
                        stokDisplay = stok;
                        persentaseTerjual = stok > 0 ? ((totalTerjual / stok) * 100).toFixed(2) : '0';
                    }

                    // Get target data
                    const target = targetData.find(t => t.namaBarang === item.nama);
                    const jumlahTarget = target ? target.jumlahTarget : 'Tidak Ada';
                    const persentaseTarget = target ? ((totalTerjual / target.jumlahTarget) * 100).toFixed(2) : '0';

                    // Get discount data
                    const diskon = diskonData.find(d => d.kode === item.kode);
                    const diskonAktif = diskon ? `${diskon.persenDiskon}%` : 'Tidak Ada';
                    const hargaSetelahDiskon = diskon ? diskon.hargaDiskon : hargaJual;

                    // SO status information
                    const soStatus = isInPendingSO ? 
                        `Dalam Proses SO` : 
                        'Tersedia';

                    barangSheetData.push([
                        kategori,
                        item.kodeToko || '',
                        item.kode || '',
                        item.plu || '',
                        item.nama || '',
                        soStatus,
                        stokDisplay,
                        formatNumber(hargaBeli),
                        formatNumber(hargaJual),
                        totalTerjual,
                        formatNumber(keuntungan),
                        persentaseTerjual,
                        jumlahTarget,
                        `${persentaseTarget}%`,
                        diskonAktif,
                        formatNumber(hargaSetelahDiskon)
                    ]);
                });
            }
        });

        // --- Sheet 2: Summary Barang ---
        let summarySheetData = [
            ['Kategori', 'Total Barang', 'Barang Tersedia', 'Barang Dalam SO', 
             'Total Stok Tersedia', 'Total Terjual', 'Total Keuntungan', 
             'Rata-rata Persentase Terjual', 'Total Target', 'Rata-rata Persentase Target']
        ];

        // Process summary by category
        urutanKategori.forEach(kategori => {
            const items = groupedData[kategori];
            if (items && items.length > 0) {
                const totalBarang = items.length;
                const barangTersedia = items.filter(item => !isInPendingStockOpname(item.kode)).length;
                const barangDalamSO = totalBarang - barangTersedia;
                
                // Only count available stock (not in SO)
                const totalStokTersedia = items.reduce((sum, item) => {
                    return sum + (isInPendingStockOpname(item.kode) ? 0 : (parseInt(item.stok) || 0));
                }, 0);
                
                const totalTerjual = items.reduce((sum, item) => sum + (parseInt(item.terjual) || 0), 0);
                const totalKeuntungan = items.reduce((sum, item) => {
                    const hargaBeli = parseFloat(item.hargaBeli) || 0;
                    const hargaJual = parseFloat(item.hargaJual) || 0;
                    return sum + ((hargaJual - hargaBeli) * (parseInt(item.terjual) || 0));
                }, 0);

                const avgPersentaseTerjual = totalStokTersedia > 0 
                    ? ((totalTerjual / totalStokTersedia) * 100).toFixed(2) 
                    : '0';

                const totalTarget = items.reduce((sum, item) => {
                    const target = targetData.find(t => t.namaBarang === item.nama);
                    return sum + (target ? parseInt(target.jumlahTarget) || 0 : 0);
                }, 0);

                const avgPersentaseTarget = totalTarget > 0 
                    ? ((totalTerjual / totalTarget) * 100).toFixed(2) 
                    : '0';

                summarySheetData.push([
                    kategori,
                    totalBarang,
                    barangTersedia,
                    barangDalamSO,
                    totalStokTersedia,
                    totalTerjual,
                    formatNumber(totalKeuntungan),
                    `${avgPersentaseTerjual}%`,
                    totalTarget,
                    `${avgPersentaseTarget}%`
                ]);
            }
        });

        // Add overall summary
        const overallBarang = barangData.length;
        const overallBarangTersedia = barangData.filter(item => !isInPendingStockOpname(item.kode)).length;
        const overallBarangDalamSO = overallBarang - overallBarangTersedia;
        
        const overallStokTersedia = barangData.reduce((sum, item) => {
            return sum + (isInPendingStockOpname(item.kode) ? 0 : (parseInt(item.stok) || 0));
        }, 0);
        
        const overallTerjual = barangData.reduce((sum, item) => sum + (parseInt(item.terjual) || 0), 0);
        const overallKeuntungan = barangData.reduce((sum, item) => {
            const hargaBeli = parseFloat(item.hargaBeli) || 0;
            const hargaJual = parseFloat(item.hargaJual) || 0;
            return sum + ((hargaJual - hargaBeli) * (parseInt(item.terjual) || 0));
        }, 0);
        
        const overallAvgPersentaseTerjual = overallStokTersedia > 0 
            ? ((overallTerjual / overallStokTersedia) * 100).toFixed(2) 
            : '0';
            
        const overallTarget = targetData.reduce((sum, target) => sum + (parseInt(target.jumlahTarget) || 0), 0);
        const overallAvgPersentaseTarget = overallTarget > 0 
            ? ((overallTerjual / overallTarget) * 100).toFixed(2) 
            : '0';

        summarySheetData.push([
            'TOTAL KESELURUHAN',
            overallBarang,
            overallBarangTersedia,
            overallBarangDalamSO,
            overallStokTersedia,
            overallTerjual,
            formatNumber(overallKeuntungan),
            `${overallAvgPersentaseTerjual}%`,
            overallTarget,
            `${overallAvgPersentaseTarget}%`
        ]);

        // --- Sheet 3: Target Penjualan ---
        let targetSheetData = [
            ['Nama Barang', 'Kode Barang', 'PLU', 'Tanggal Mulai', 'Tanggal Selesai', 
             'Jumlah Target', 'Harga Satuan', 'Total Nilai Target', 'Terjual', 
             'Persentase Pencapaian', 'Status Stock Opname']
        ];

        targetData.forEach(target => {
            const barang = barangData.find(b => b.nama === target.namaBarang);
            const terjual = barang ? (parseInt(barang.terjual) || 0) : 0;
            const totalNilai = (target.jumlahTarget || 0) * (target.hargaSatuan || 0);
            const persentasePencapaian = target.jumlahTarget > 0 
                ? ((terjual / target.jumlahTarget) * 100).toFixed(2) 
                : '0';

            const isPendingSO = barang ? isInPendingStockOpname(barang.kode) : false;
            const statusSO = isPendingSO ? 'Dalam Proses SO' : 'Normal';

            targetSheetData.push([
                target.namaBarang || '',
                target.kodeBarang || '',
                target.pluBarang || '',
                formatTanggal(target.tanggalMulai),
                formatTanggal(target.tanggalSelesai),
                target.jumlahTarget || 0,
                formatNumber(target.hargaSatuan || 0),
                formatNumber(totalNilai),
                terjual,
                `${persentasePencapaian}%`,
                statusSO
            ]);
        });

        // --- Sheet 4: Diskon ---
        let diskonSheetData = [
            ['Kode Barang', 'Nama Barang', 'Persentase Diskon', 'Tanggal Mulai', 
             'Tanggal Berakhir', 'Harga Normal', 'Potongan Harga', 'Harga Setelah Diskon', 
             'Status', 'Status Stock Opname']
        ];

        diskonData.forEach(diskon => {
            const isPendingSO = isInPendingStockOpname(diskon.kode);
            const statusSO = isPendingSO ? 'Dalam Proses SO' : 'Normal';

            diskonSheetData.push([
                diskon.kode || '',
                diskon.nama || '',
                `${diskon.persenDiskon}%`,
                formatTanggal(diskon.tanggalMulai),
                formatTanggal(diskon.tanggalBerakhir),
                formatNumber(diskon.hargaNormal || 0),
                formatNumber(diskon.potonganHarga || 0),
                formatNumber(diskon.hargaDiskon || 0),
                diskon.status || 'active',
                statusSO
            ]);
        });

        // --- Sheet 5: Diskon Kedaluwarsa ---
        let diskonKedaluwarsaSheetData = [
            ['Kode Barang', 'Nama Barang', 'Persentase Diskon', 'Tanggal Mulai', 
             'Tanggal Berakhir', 'Tanggal Kedaluwarsa', 'Harga Normal', 'Harga Setelah Diskon',
             'Status Stock Opname']
        ];

        diskonKedaluwarsaData.forEach(diskon => {
            const isPendingSO = isInPendingStockOpname(diskon.kode);
            const statusSO = isPendingSO ? 'Dalam Proses SO' : 'Normal';

            diskonKedaluwarsaSheetData.push([
                diskon.kode || '',
                diskon.nama || '',
                `${diskon.persenDiskon}%`,
                formatTanggal(diskon.tanggalMulai),
                formatTanggal(diskon.tanggalBerakhir),
                formatTanggal(diskon.tanggalKedaluwarsa),
                formatNumber(diskon.hargaNormal || 0),
                formatNumber(diskon.hargaDiskon || 0),
                statusSO
            ]);
        });

        // --- Sheet 6: Riwayat Stock Opname ---
        let riwayatStockOpnameSheetData = [
            ['No Opname', 'Tanggal', 'Petugas', 'Tipe Opname', 'Kategori', 'Status', 'Catatan', 
             'Kode Barang', 'PLU', 'Nama Barang', 'Kode Toko', 'Kategori Barang', 'Status SO',
             'Stok Sistem', 'Stok Aktual', 'Selisih', 'Selisih Rupiah', 'Harga Beli', 'Keterangan']
        ];

        stokOpnameData.forEach(opname => {
            const opnameDate = new Date(opname.tanggal).toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let kategoriText = 'Semua';
            if (opname.tipeOpname === 'category') {
                kategoriText = opname.kategori || 'Uncategorized';
            } else if (opname.tipeOpname === 'selected') {
                kategoriText = 'Tertentu';
            }

            let statusText = '';
            switch (opname.status) {
                case 'pending':
                    statusText = 'Pending';
                    break;
                case 'completed':
                    statusText = 'Selesai';
                    break;
                case 'adjusted':
                    statusText = 'Disesuaikan';
                    break;
            }

            opname.items.forEach(item => {
                const selisih = item.stokAktual !== null ? (item.stokAktual - item.stokSistem) : '-';
                const selisihRupiah = selisih !== '-' ? formatRupiah(selisih * (item.hargaBeli || 0)) : '-';
                
                // SO status column
                const soStatus = opname.status === 'pending' ? 'Dalam Proses' : 'Selesai';

                riwayatStockOpnameSheetData.push([
                    opname.noOpname || '',
                    opnameDate,
                    opname.petugas || '',
                    opname.tipeOpname || '',
                    kategoriText,
                    statusText,
                    opname.catatan || '',
                    item.kode || '',
                    item.plu || '',
                    item.nama || '',
                    item.kodeToko || '',
                    item.kategori || 'Uncategorized',
                    soStatus,
                    item.stokSistem || 0,
                    item.stokAktual !== null ? item.stokAktual : '-',
                    selisih,
                    selisihRupiah,
                    formatRupiah(item.hargaBeli || 0),
                    item.keterangan || ''
                ]);
            });
        });

        // --- Sheet 7: Summary Riwayat Stock Opname ---
        let summaryStockOpnameSheetData = [
            ['Kategori', 'Total Sesi Opname', 'Sesi Pending', 'Sesi Selesai', 'Total Barang Unik', 
             'Barang Dalam Proses SO', 'Total Selisih Stok', 'Total Selisih Rupiah', 
             'Selisih Positif', 'Selisih Negatif']
        ];

        // Group opname data by category
        const groupedOpnameData = {};
        urutanKategori.forEach(kategori => {
            groupedOpnameData[kategori] = [];
            stokOpnameData.forEach(opname => {
                opname.items.forEach(item => {
                    if ((item.kategori || 'Uncategorized') === kategori) {
                        groupedOpnameData[kategori].push({
                            noOpname: opname.noOpname,
                            status: opname.status,
                            item: item
                        });
                    }
                });
            });
        });

        // Process each category
        urutanKategori.forEach(kategori => {
            const opnameItems = groupedOpnameData[kategori];
            if (opnameItems && opnameItems.length > 0) {
                const uniqueSessions = [...new Set(opnameItems.map(op => op.noOpname))];
                const totalSesiOpname = uniqueSessions.length;
                const sesiPending = uniqueSessions.filter(noOpname => {
                    const opname = stokOpnameData.find(op => op.noOpname === noOpname);
                    return opname && opname.status === 'pending';
                }).length;
                const sesiSelesai = totalSesiOpname - sesiPending;
                
                const barangUnik = [...new Set(opnameItems.map(op => op.item.kode))].length;
                const barangDalamSO = opnameItems.filter(op => op.status === 'pending').length;
                
                const totalSelisihStok = opnameItems.reduce((sum, op) => {
                    if (op.status === 'completed' || op.status === 'adjusted') {
                        return sum + ((op.item.stokAktual || 0) - (op.item.stokSistem || 0));
                    }
                    return sum;
                }, 0);
                
                const totalSelisihRupiah = opnameItems.reduce((sum, op) => {
                    if (op.status === 'completed' || op.status === 'adjusted') {
                        return sum + (((op.item.stokAktual || 0) - (op.item.stokSistem || 0)) * (op.item.hargaBeli || 0));
                    }
                    return sum;
                }, 0);
                
                const selisihPositif = opnameItems.filter(op => 
                    (op.status === 'completed' || op.status === 'adjusted') && 
                    (op.item.stokAktual || 0) > (op.item.stokSistem || 0)
                ).length;
                
                const selisihNegatif = opnameItems.filter(op => 
                    (op.status === 'completed' || op.status === 'adjusted') && 
                    (op.item.stokAktual || 0) < (op.item.stokSistem || 0)
                ).length;

                summaryStockOpnameSheetData.push([
                    kategori,
                    totalSesiOpname,
                    sesiPending,
                    sesiSelesai,
                    barangUnik,
                    barangDalamSO,
                    totalSelisihStok,
                    formatRupiah(totalSelisihRupiah),
                    selisihPositif,
                    selisihNegatif
                ]);
            }
        });

        // Add overall summary
        const uniqueSessionsOverall = [...new Set(stokOpnameData.map(op => op.noOpname))];
        const totalSesiOpnameOverall = uniqueSessionsOverall.length;
        const sesiPendingOverall = stokOpnameData.filter(op => op.status === 'pending').length;
        const sesiSelesaiOverall = totalSesiOpnameOverall - sesiPendingOverall;
        
        const barangUnikOverall = [...new Set(
            stokOpnameData.flatMap(op => op.items.map(item => item.kode))
        )].length;
        const barangDalamSOOverall = stokOpnameData
            .filter(op => op.status === 'pending')
            .flatMap(op => op.items).length;
        
        const totalSelisihStokOverall = stokOpnameData.reduce((sum, op) => {
            if (op.status === 'completed' || op.status === 'adjusted') {
                return sum + op.items.reduce((itemSum, item) => 
                    itemSum + ((item.stokAktual || 0) - (item.stokSistem || 0)), 0);
            }
            return sum;
        }, 0);
        
        const totalSelisihRupiahOverall = stokOpnameData.reduce((sum, op) => {
            if (op.status === 'completed' || op.status === 'adjusted') {
                return sum + op.items.reduce((itemSum, item) => 
                    itemSum + (((item.stokAktual || 0) - (item.stokSistem || 0)) * (item.hargaBeli || 0)), 0);
            }
            return sum;
        }, 0);
        
        const selisihPositifOverall = stokOpnameData.reduce((sum, op) => {
            if (op.status === 'completed' || op.status === 'adjusted') {
                return sum + op.items.filter(item => 
                    (item.stokAktual || 0) > (item.stokSistem || 0)
                ).length;
            }
            return sum;
        }, 0);
        
        const selisihNegatifOverall = stokOpnameData.reduce((sum, op) => {
            if (op.status === 'completed' || op.status === 'adjusted') {
                return sum + op.items.filter(item => 
                    (item.stokAktual || 0) < (item.stokSistem || 0)
                ).length;
            }
            return sum;
        }, 0);

        summaryStockOpnameSheetData.push([
            'TOTAL KESELURUHAN',
            totalSesiOpnameOverall,
            sesiPendingOverall,
            sesiSelesaiOverall,
            barangUnikOverall,
            barangDalamSOOverall,
            totalSelisihStokOverall,
            formatRupiah(totalSelisihRupiahOverall),
            selisihPositifOverall,
            selisihNegatifOverall
        ]);

        // --- Sheet 8: Status Stock Opname Pending ---
        let statusPendingSheetData = [
            ['No Opname', 'Tanggal', 'Petugas', 'Tipe Opname', 'Kategori', 'Total Item', 
             'Item Sudah Dihitung', 'Item Belum Dihitung', 'Progress (%)', 'Catatan']
        ];

        pendingOpnames.forEach(opname => {
            const opnameDate = new Date(opname.tanggal).toLocaleString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let kategoriText = 'Semua';
            if (opname.tipeOpname === 'category') {
                kategoriText = opname.kategori || 'Uncategorized';
            } else if (opname.tipeOpname === 'selected') {
                kategoriText = 'Tertentu';
            }

            const totalItem = opname.items.length;
            const itemSudahDihitung = opname.items.filter(item => 
                item.stokAktual !== null && item.stokAktual !== undefined
            ).length;
            const itemBelumDihitung = totalItem - itemSudahDihitung;
            const progress = totalItem > 0 ? ((itemSudahDihitung / totalItem) * 100).toFixed(1) : 0;

            statusPendingSheetData.push([
                opname.noOpname || '',
                opnameDate,
                opname.petugas || '',
                opname.tipeOpname || '',
                kategoriText,
                totalItem,
                itemSudahDihitung,
                itemBelumDihitung,
                `${progress}%`,
                opname.catatan || ''
            ]);
        });

        // Function to create Excel workbook
        function createWorkbook() {
            const workbook = XLSX.utils.book_new();

            // Sheet 1: Data Barang
            const barangWorksheet = XLSX.utils.aoa_to_sheet(barangSheetData);
            barangWorksheet['!cols'] = [
                { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 30 },
                { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(workbook, barangWorksheet, 'Data Barang');

            // Sheet 2: Summary Barang
            const summaryWorksheet = XLSX.utils.aoa_to_sheet(summarySheetData);
            summaryWorksheet['!cols'] = [
                { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary Barang');

            // Sheet 3: Target Penjualan
            const targetWorksheet = XLSX.utils.aoa_to_sheet(targetSheetData);
            targetWorksheet['!cols'] = [
                { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
                { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(workbook, targetWorksheet, 'Target Penjualan');

            // Sheet 4: Diskon
            const diskonWorksheet = XLSX.utils.aoa_to_sheet(diskonSheetData);
            diskonWorksheet['!cols'] = [
                { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(workbook, diskonWorksheet, 'Diskon Aktif');

            // Sheet 5: Diskon Kedaluwarsa
            const diskonKedaluwarsaWorksheet = XLSX.utils.aoa_to_sheet(diskonKedaluwarsaSheetData);
            diskonKedaluwarsaWorksheet['!cols'] = [
                { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(workbook, diskonKedaluwarsaWorksheet, 'Diskon Kedaluwarsa');

            // Sheet 6: Riwayat Stock Opname
            const riwayatStockOpnameWorksheet = XLSX.utils.aoa_to_sheet(riwayatStockOpnameSheetData);
            riwayatStockOpnameWorksheet['!cols'] = [
                { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 30 },
                { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
                { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 50 }
            ];
            XLSX.utils.book_append_sheet(workbook, riwayatStockOpnameWorksheet, 'Riwayat Stock Opname');

            // Sheet 7: Summary Riwayat Stock Opname
            const summaryStockOpnameWorksheet = XLSX.utils.aoa_to_sheet(summaryStockOpnameSheetData);
            summaryStockOpnameWorksheet['!cols'] = [
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }
            ];
            XLSX.utils.book_append_sheet(workbook, summaryStockOpnameWorksheet, 'Summary Stock Opname');

            // Sheet 8: Status Stock Opname Pending
            const statusPendingWorksheet = XLSX.utils.aoa_to_sheet(statusPendingSheetData);
            statusPendingWorksheet['!cols'] = [
                { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 30 }
            ];
            XLSX.utils.book_append_sheet(workbook, statusPendingWorksheet, 'Status SO Pending');

            return workbook;
        }

        // Show confirmation dialog with summary
        Swal.fire({
            title: 'Konfirmasi Download',
            html: `
                <div style="text-align: left;">
                    <p>Data yang akan diekspor:</p>
                    <ul>
                        <li>Data Barang: ${barangData.length} item (${pendingItems.size} dalam proses SO)</li>
                        <li>Target Penjualan: ${targetData.length} target</li>
                        <li>Diskon Aktif: ${diskonData.length} diskon</li>
                        <li>Diskon Kedaluwarsa: ${diskonKedaluwarsaData.length} diskon</li>
                        <li>Riwayat Stock Opname: ${riwayatStockOpnameSheetData.length - 1} entri</li>
                        <li>Status SO Pending: ${pendingOpnames.length} sesi</li>
                    </ul>
                    <p><strong>Catatan:</strong> Stok barang dalam proses SO tidak ditampilkan nilainya</p>
                    <p>Pilih format download:</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'Batal',
            denyButtonText: 'ZIP',
            customClass: {
                popup: 'custom-swal-popup',
                content: 'custom-swal-content'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Direct Excel download
                const workbook = createWorkbook();
                const dateStr = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
                XLSX.writeFile(workbook, `laporan_inventori_${dateStr}.xlsx`);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'File Excel berhasil diunduh!',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else if (result.isDenied) {
                // ZIP download
                const workbook = createWorkbook();
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const dateStr = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
                
                // Create a JSZip instance
                const zip = new JSZip();
                const filename = `laporan_inventori_${dateStr}.xlsx`;
                
                // Add Excel file to ZIP
                zip.file(filename, excelBuffer, { binary: true });
                
                // Generate and trigger ZIP download
                zip.generateAsync({ type: 'blob' }).then(function(content) {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = `laporan_inventori_${dateStr}.zip`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'File ZIP berhasil diunduh!',
                        timer: 2000,
                        showConfirmButton: false
                    });
                });
            }
        });

    } catch (error) {
        console.error('Error in downloadExcel:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Terjadi kesalahan saat mengunduh data: ' + error.message,
            confirmButtonText: 'OK'
        });
    }
}
function uploadExcel() {
    const fileInput = document.getElementById('uploadExcel');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        Swal.fire('Error', 'Pilih file Excel terlebih dahulu', 'error');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            if (!workbook.SheetNames.length) {
                throw new Error('File Excel kosong');
            }

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (json.length < 2) {
                throw new Error('File Excel tidak memiliki data');
            }

            // Process data and show confirmation dialog
            processExcelData(json);

        } catch (error) {
            console.error('Error processing Excel file:', error);
            Swal.fire({
                title: 'Error',
                text: `Gagal memproses file Excel: ${error.message}`,
                icon: 'error'
            });
        }
    };

    reader.onerror = (error) => {
        console.error('Error reading file:', error);
        Swal.fire({
            title: 'Error',
            text: 'Gagal membaca file Excel',
            icon: 'error'
        });
    };

    reader.readAsArrayBuffer(file);
}

function processExcelData(json) {
    try {
        // Get existing data
        let existingData = JSON.parse(localStorage.getItem('barang')) || [];
        
        // Process new data from Excel
        const newItems = [];
        const updatedItems = [];
        const errors = [];

        // Skip header row
        for (let i = 1; i < json.length; i++) {
            const row = json[i];
            if (!row || row.length < 7) continue; // Ensure minimum required columns

            try {
                const item = {
                    kategori: row[0]?.toString() || 'Uncategorized',
                    kodeToko: row[1]?.toString().trim(),
                    kode: row[2]?.toString().trim(),
                    plu: row[3]?.toString().trim(),
                    nama: row[4]?.toString().trim(),
                    hargaBeli: parseFloat(row[5]) || 0,
                    hargaJual: parseFloat(row[6]) || 0,
                    stok: parseInt(row[7]) || 0,
                };

                // Validate required fields
                if (!item.kodeToko || !item.kode || !item.nama) {
                    errors.push(`Baris ${i + 1}: Data tidak lengkap (Kode Toko, Kode Barang, dan Nama harus diisi)`);
                    continue;
                }

                // Check if item exists based on both kode and kodeToko
                const existingItem = existingData.find(
                    existing => existing.kode === item.kode && existing.kodeToko === item.kodeToko
                );

                if (existingItem) {
                    // Compare values to check if update is needed
                    const hasChanges = (
                        existingItem.nama !== item.nama ||
                        existingItem.plu !== item.plu ||
                        existingItem.hargaBeli !== item.hargaBeli ||
                        existingItem.hargaJual !== item.hargaJual ||
                        existingItem.stok !== item.stok ||
                        existingItem.kategori !== item.kategori
                    );

                    if (hasChanges) {
                        // Preserve existing terjual value
                        item.terjual = existingItem.terjual || 0;
                        updatedItems.push(item);
                    }
                } else {
                    // New item
                    item.terjual = 0;
                    newItems.push(item);
                }

            } catch (error) {
                errors.push(`Baris ${i + 1}: ${error.message}`);
            }
        }

        // Show confirmation dialog with summary
        showUploadConfirmation(newItems, updatedItems, errors, existingData);

    } catch (error) {
        console.error('Error processing data:', error);
        Swal.fire({
            title: 'Error',
            text: `Gagal memproses data: ${error.message}`,
            icon: 'error'
        });
    }
}

function showUploadConfirmation(newItems, updatedItems, errors, existingData) {
    let message = '<div style="text-align: left; max-height: 300px; overflow-y: auto;">';
    
    if (newItems.length > 0) {
        message += `<p><strong>Items baru yang akan ditambahkan:</strong> ${newItems.length}</p>`;
        message += '<ul>';
        newItems.slice(0, 5).forEach(item => {
            message += `<li>${item.kodeToko} - ${item.kode} - ${item.nama}</li>`;
        });
        if (newItems.length > 5) message += '<li>...</li>';
        message += '</ul>';
    }

    if (updatedItems.length > 0) {
        message += `<p><strong>Items yang akan diupdate:</strong> ${updatedItems.length}</p>`;
        message += '<ul>';
        updatedItems.slice(0, 5).forEach(item => {
            message += `<li>${item.kodeToko} - ${item.kode} - ${item.nama}</li>`;
        });
        if (updatedItems.length > 5) message += '<li>...</li>';
        message += '</ul>';
    }

    if (errors.length > 0) {
        message += `<p><strong>Errors ditemukan:</strong> ${errors.length}</p>`;
        message += '<ul class="text-danger">';
        errors.slice(0, 5).forEach(error => {
            message += `<li>${error}</li>`;
        });
        if (errors.length > 5) message += '<li>...</li>';
        message += '</ul>';
    }

    message += '</div>';

    Swal.fire({
        title: 'Konfirmasi Upload Data',
        html: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Proses',
        cancelButtonText: 'Batal',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            return new Promise((resolve) => {
                try {
                    // Update existing records
                    updatedItems.forEach(updateItem => {
                        const index = existingData.findIndex(
                            item => item.kode === updateItem.kode && item.kodeToko === updateItem.kodeToko
                        );
                        if (index !== -1) {
                            existingData[index] = updateItem;
                        }
                    });

                    // Add new records
                    existingData = existingData.concat(newItems);

                    // Save to localStorage
                    localStorage.setItem('barang', JSON.stringify(existingData));
                    
                    resolve({
                        newCount: newItems.length,
                        updateCount: updatedItems.length,
                        errorCount: errors.length
                    });
                } catch (error) {
                    Swal.showValidationMessage(`Proses gagal: ${error.message}`);
                }
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Berhasil',
                html: `
                    <p>Proses upload selesai:</p>
                    <ul>
                        <li>Ditambahkan: ${result.value.newCount} items</li>
                        <li>Diupdate: ${result.value.updateCount} items</li>
                        <li>Error: ${result.value.errorCount} items</li>
                    </ul>
                `,
                icon: 'success'
            });
            loadBarang(); // Refresh table display
        }
    });
}

function categorizeBatchItems(items) {
    const kategoris = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];

    return items.map(item => {
        // Example categorization based on stock levels:
        if (item.stok > 50) {
            item.kategori = 'A1';
        } else if (item.stok > 20) {
            item.kategori = 'B1';
        } else {
            item.kategori = 'C1';
        }

        // You can add more complex rules to assign categories based on other properties if needed
        return item;
    });
}

function saveItems(items) {
    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    let updateCount = 0;
    let addCount = 0;

    items.forEach(item => {
        const existingIndex = barang.findIndex(b => b.kode === item.kode);

        if (existingIndex !== -1) {
            const existingItem = barang[existingIndex];

            // Check if any relevant data has changed
            const isUpdated = (
                existingItem.kodeToko !== item.kodeToko ||
                existingItem.nama !== item.nama ||
                parseFloat(existingItem.hargaBeli) !== parseFloat(item.hargaBeli) ||
                parseFloat(existingItem.hargaJual) !== parseFloat(item.hargaJual) ||
                parseInt(existingItem.stok) !== parseInt(item.stok) ||
                existingItem.kategori !== item.kategori
            );

            if (isUpdated) {
                barang[existingIndex] = {
                    ...existingItem,
                    ...item,
                    terjual: existingItem.terjual || 0 // Preserve the existing terjual value
                };
                updateCount++;
            }
        } else {
            // Add new item if it doesn't exist
            barang.push({
                ...item,
                terjual: 0
            });
            addCount++;
        }
    });

    // Save updated data back to localStorage
    localStorage.setItem('barang', JSON.stringify(barang));

    // Reload data to reflect the changes
    loadBarang();

    // Display success message
    Swal.fire({
        title: 'Berhasil',
        html: `
            Berhasil menambahkan ${addCount} barang baru<br>
            Berhasil memperbarui ${updateCount} barang
        `,
        icon: 'success'
    });
}







/**
 * Completely redesigned edit barang functionality
 * with improved UI and workflow
 */

// Edit barang function - opens modal with item data
function editBarang(kodeBarang) {
    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    const item = barang.find(item => item.kode === kodeBarang);
    
    if (!item) {
        showNotification('error', 'Barang tidak ditemukan');
        return;
    }
    
    // Cek apakah barang sedang dalam proses stok opname
    if (item.status === 'pending') {
        showNotification('error', 'Barang sedang dalam proses stok opname dan tidak dapat diedit');
        return;
    }
    
    // Create modal backdrop
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation style
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .form-row {
            margin-bottom: 16px;
        }
        .form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #333;
        }
        .form-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        .form-input:focus {
            border-color: #4CAF50;
            outline: none;
            box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
        }
        .form-input:disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
        }
        .btn {
            padding: 10px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.3s;
        }
        .btn-primary {
            background-color: #4CAF50;
            color: white;
        }
        .btn-primary:hover {
            background-color: #3e8e41;
        }
        .btn-secondary {
            background-color: #f44336;
            color: white;
        }
        .btn-secondary:hover {
            background-color: #d32f2f;
        }
        .readonly-field {
            background-color: #f9f9f9;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            color: #666;
        }
        .info-text {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
        }
    `;
    document.head.appendChild(styleElement);
    
    // Modal header
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
        padding: 16px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = 'Edit Data Barang';
    modalTitle.style.cssText = `
        margin: 0;
        color: #333;
        font-size: 18px;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    `;
    closeButton.onclick = () => document.body.removeChild(modalBackdrop);
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // Modal body with form
    const modalBody = document.createElement('div');
    modalBody.style.cssText = `
        padding: 16px;
    `;
    
    // Form content
    modalBody.innerHTML = `
        <div class="form-row">
            <label class="form-label">Kode Barang</label>
            <div class="readonly-field">${item.kode}</div>
        </div>
        
        <div class="form-row">
            <label class="form-label" for="edit-nama">Nama Barang</label>
            <input type="text" id="edit-nama" class="form-input" value="${item.nama}" />
        </div>
        
        <div class="form-row">
            <label class="form-label" for="edit-harga-beli">Harga Beli</label>
            <input type="number" id="edit-harga-beli" class="form-input" value="${item.hargaBeli}" />
        </div>
        
        <div class="form-row">
            <label class="form-label" for="edit-harga-jual">Harga Jual</label>
            <input type="number" id="edit-harga-jual" class="form-input" value="${item.hargaJual}" />
        </div>
        
        <div class="form-row">
            <label class="form-label">Stok Barang</label>
            <div class="readonly-field">${item.stok}</div>
            <p class="info-text">* Stok hanya dapat diubah melalui transaksi</p>
        </div>
        
        <div class="form-row">
            <label class="form-label" for="edit-kode-toko">Kode Toko</label>
            <input type="text" id="edit-kode-toko" class="form-input" value="${item.kodeToko}" />
        </div>
    `;
    
    // Modal footer with buttons
    const modalFooter = document.createElement('div');
    modalFooter.style.cssText = `
        padding: 16px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Batal';
    cancelButton.className = 'btn btn-secondary';
    cancelButton.onclick = () => document.body.removeChild(modalBackdrop);
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Simpan';
    saveButton.className = 'btn btn-primary';
    saveButton.onclick = () => {
        const namaBarang = document.getElementById('edit-nama').value;
        const hargaBeli = document.getElementById('edit-harga-beli').value;
        const hargaJual = document.getElementById('edit-harga-jual').value;
        const kodeToko = document.getElementById('edit-kode-toko').value;
        
        // Validation
        if (!namaBarang || !hargaBeli || !hargaJual || !kodeToko) {
            showFormError('Semua field harus diisi');
            return;
        }
        
        if (parseFloat(hargaJual) <= parseFloat(hargaBeli)) {
            showFormError('Harga jual harus lebih besar dari harga beli');
            return;
        }
        
        // Create updated data
        const updatedData = {
            nama: namaBarang,
            hargaBeli: parseFloat(hargaBeli),
            hargaJual: parseFloat(hargaJual),
            kodeToko: kodeToko
        };
        
        // Update the item
        if (saveBarangChanges(kodeBarang, updatedData)) {
            document.body.removeChild(modalBackdrop);
        }
    };
    
    modalFooter.appendChild(cancelButton);
    modalFooter.appendChild(saveButton);
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalBackdrop.appendChild(modalContent);
    
    // Show modal
    document.body.appendChild(modalBackdrop);
    
    // Function to show validation errors
    function showFormError(message) {
        // Remove any existing error message
        const existingError = document.getElementById('form-error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create and show new error message
        const errorDiv = document.createElement('div');
        errorDiv.id = 'form-error-message';
        errorDiv.style.cssText = `
            background-color: #ffebee;
            color: #d32f2f;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 14px;
        `;
        errorDiv.textContent = message;
        
        modalBody.insertBefore(errorDiv, modalBody.firstChild);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }
}

// Function to save changes to localStorage
function saveBarangChanges(kodeBarang, updatedData) {
    try {
        let barang = JSON.parse(localStorage.getItem('barang')) || [];
        const index = barang.findIndex(item => item.kode === kodeBarang);
        
        if (index === -1) {
            showNotification('error', 'Barang tidak ditemukan');
            return false;
        }
        
        // Update item while preserving the stock
        barang[index] = {
            ...barang[index],
            nama: updatedData.nama,
            hargaBeli: updatedData.hargaBeli,
            hargaJual: updatedData.hargaJual,
            kodeToko: updatedData.kodeToko
        };
        
        // Save to localStorage
        localStorage.setItem('barang', JSON.stringify(barang));
        
        // Show success notification
        showNotification('success', 'Data barang berhasil diperbarui');
        
        // Refresh the data display
        refreshDataDisplay();
        
        return true;
    } catch (error) {
        console.error('Error saving changes:', error);
        showNotification('error', 'Terjadi kesalahan saat menyimpan data');
        return false;
    }
}

// Function to display notifications
function showNotification(type, message) {
    // Remove any existing notification
    const existingNotification = document.getElementById('notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px;
        border-radius: 4px;
        color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
        max-width: 300px;
    `;
    
    // Style based on notification type
    if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f44336';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#ff9800';
    } else {
        notification.style.backgroundColor = '#2196F3';
    }
    
    notification.textContent = message;
    
    // Add animation
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(styleElement);
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Function to refresh data display
function refreshDataDisplay() {
    // Check if search function exists
    if (typeof cariBarang === 'function') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            cariBarang(searchInput.value);
        } else {
            // Fallback if search input not found
            displayBarang();
        }
    } else if (typeof displayBarang === 'function') {
        // Fallback to display function
        displayBarang();
    } else {
        // If neither function exists, reload the page
        window.location.reload();
    }
}

function lihatStokGrafis() {
    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    const targetPenjualan = JSON.parse(localStorage.getItem('targetPenjualan')) || [];
    const diskon = JSON.parse(localStorage.getItem('diskon')) || [];
    
    // Proses data untuk analisis mendalam
    const processedBarang = barang.map(item => {
        // Cari target penjualan untuk barang ini
        const target = targetPenjualan.find(t => t.namaBarang === item.nama);
        
        // Cari diskon untuk barang ini
        const diskonItem = diskon.find(d => d.nama === item.nama);
        
        // Hitung berbagai metrik
        const terjual = item.terjual || 0;
        const stok = item.stok || 0;
        const hargaBeli = item.hargaBeli || 0;
        const hargaJual = item.hargaJual || 0;
        
        const keuntunganPerItem = hargaJual - hargaBeli;
        const totalKeuntungan = keuntunganPerItem * terjual;
        const persentaseTerjual = stok > 0 ? (terjual / stok * 100) : 0;
        const targetPenjualanNilai = target ? target.jumlahTarget : 0;
        const persentaseTarget = targetPenjualanNilai > 0 ? (terjual / targetPenjualanNilai * 100) : 0;
        const diskonNilai = diskonItem ? diskonItem.persenDiskon : 0;
        
        return {
            ...item,
            keuntunganPerItem,
            totalKeuntungan,
            persentaseTerjual,
            targetPenjualan: targetPenjualanNilai,
            persentaseTarget,
            diskon: diskonNilai
        };
    });

    // Urutkan berdasarkan total keuntungan
    const sortedBarang = processedBarang.sort((a, b) => b.totalKeuntungan - a.totalKeuntungan);
    
    // Siapkan data untuk grafik
    const labels = sortedBarang.map(item => item.nama);
    const metrics = {
        stok: sortedBarang.map(item => item.stok),
        terjual: sortedBarang.map(item => item.terjual),
        keuntungan: sortedBarang.map(item => item.totalKeuntungan),
        persentaseTerjual: sortedBarang.map(item => item.persentaseTerjual),
        targetPenjualan: sortedBarang.map(item => item.targetPenjualan),
        persentaseTarget: sortedBarang.map(item => item.persentaseTarget),
        diskon: sortedBarang.map(item => item.diskon)
    };

    Swal.fire({
        title: 'Analisis Komprehensif Inventori',
        width: '95%',
        customClass: {
            popup: 'inventory-analysis-modal',
            title: 'inventory-analysis-title'
        },
        html: `
            <div class="inventory-analysis-container">
                <div class="chart-section">
                    <div class="chart-controls">
                        <select id="metricSelector" class="form-control">
                            <option value="stok">Stok</option>
                            <option value="terjual">Total Terjual</option>
                            <option value="keuntungan">Keuntungan</option>
                            <option value="persentaseTerjual">% Terjual</option>
                            <option value="targetPenjualan">Target Penjualan</option>
                            <option value="persentaseTarget">% Target</option>
                            <option value="diskon">Diskon</option>
                        </select>
                    </div>
                    <div class="chart-container">
                        <canvas id="inventoryChart" height="400"></canvas>
                    </div>
                </div>
                <div class="details-section">
                    <div id="barangDetailContainer" class="barang-detail-container">
                        <div class="default-message">
                            <i class="fas fa-chart-line"></i>
                            <p>Pilih metrik dan klik titik grafik untuk detail</p>
                        </div>
                    </div>
                </div>
            </div>
        `,
        didRender: () => {
            // Load Chart.js
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                let inventoryChart;

                function createChart(metricKey) {
                    const ctx = document.getElementById('inventoryChart').getContext('2d');
                    
                    // Hapus chart sebelumnya jika ada
                    if (inventoryChart) {
                        inventoryChart.destroy();
                    }

                    // Buat gradient
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(54, 162, 235, 0.6)');
                    gradient.addColorStop(1, 'rgba(54, 162, 235, 0.1)');

                    inventoryChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: metricKey.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); }),
                                data: metrics[metricKey],
                                borderColor: 'rgba(54, 162, 235, 1)',
                                backgroundColor: gradient,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 6,
                                pointHoverRadius: 10
                            }]
                        },
                        options: {
                            responsive: true,
                            interaction: {
                                mode: 'nearest',
                                intersect: false,
                            },
                            plugins: {
                                title: {
                                    display: true,
                                    text: `Analisis ${metricKey.replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); })}`,
                                    font: { size: 18 }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            let label = context.dataset.label || '';
                                            if (label) {
                                                label += ': ';
                                            }
                                            if (context.parsed.y !== null) {
                                                // Format khusus untuk beberapa metrik
                                                switch(metricKey) {
                                                    case 'keuntungan':
                                                        label += new Intl.NumberFormat('id-ID', { 
                                                            style: 'currency', 
                                                            currency: 'IDR',
                                                            minimumFractionDigits: 0,
                                                            maximumFractionDigits: 0
                                                        }).format(context.parsed.y);
                                                        break;
                                                    case 'persentaseTerjual':
                                                    case 'persentaseTarget':
                                                    case 'diskon':
                                                        label += context.parsed.y.toFixed(2) + '%';
                                                        break;
                                                    default:
                                                        label += context.parsed.y;
                                                }
                                            }
                                            return label;
                                        }
                                    }
                                }
                             },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Nilai Metrik'
                                    }
                                }
                            },
                            onClick: (event, activeElements) => {
                                if (activeElements.length > 0) {
                                    const index = activeElements[0].index;
                                    tampilkanDetailBarang(sortedBarang[index]);
                                }
                            }
                        }
                    });
                }

                // Inisialisasi grafik dengan metrik default
                createChart('stok');

                // Event listener untuk perubahan pemilihan metrik
                document.getElementById('metricSelector').addEventListener('change', (event) => {
                    createChart(event.target.value);
                });
            };
            document.body.appendChild(script);
        },
        showConfirmButton: false,
        showCloseButton: true
    });
}

// Fungsi tampilkanDetailBarang tetap sama seperti sebelumnya
function tampilkanDetailBarang(barang) {
    const detailContainer = document.getElementById('barangDetailContainer');
    
    // Hitung berbagai statistik
    const persentaseTerjual = barang.stok > 0 
        ? ((barang.terjual || 0) / barang.stok * 100).toFixed(2) 
        : '0';
    
    const keuntunganPerItem = barang.hargaJual - barang.hargaBeli;
    const totalKeuntungan = keuntunganPerItem * (barang.terjual || 0);

    // Analisis pergerakan stok
    const riwayatStok = JSON.parse(localStorage.getItem(`riwayatStok_${barang.kode}`)) || [];
    
    // Hitung perubahan stok terakhir
    const perubahanTerakhir = riwayatStok.length > 0 
        ? riwayatStok[riwayatStok.length - 1].perubahan 
        : 0;

    detailContainer.innerHTML = `
        <div class="barang-detail-advanced">
            <div class="header">
                <h2>${barang.nama}</h2>
                <span class="badge ${barang.stok <= 5 ? 'badge-danger' : 'badge-success'}">
                    ${barang.stok <= 5 ? 'Stok Rendah' : 'Stok Aman'}
                </span>
            </div>

            <div class="detail-grid">
                <div class="detail-card">
                    <div class="card-header">Informasi Dasar</div>
                    <div class="card-body">
                        <div class="detail-item">
                            <i class="fas fa-barcode"></i>
                            <span>Kode Barang: ${barang.kode}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-store"></i>
                            <span>Kode Toko: ${barang.kodeToko}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-card">
                    <div class="card-header">Statistik Stok</div>
                    <div class="card-body">
                        <div class="detail-item">
                            <i class="fas fa-box"></i>
                            <span>Stok Tersedia: ${barang.stok}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-shopping-cart"></i>
                            <span>Total Terjual: ${barang.terjual || 0}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-percentage"></i>
                            <span>Persentase Terjual: ${persentaseTerjual}%</span>
                        </div>
                    </div>
                </div>

                <div class="detail-card">
                    <div class="card-header">Harga dan Keuntungan</div>
                    <div class="card-body">
                        <div class="detail-item">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>Harga Beli: ${formatRupiah(barang.hargaBeli)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-money-bill-wave-alt"></i>
                            <span>Harga Jual: ${formatRupiah(barang.hargaJual)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-profit"></i>
                            <span>Keuntungan per Item: ${formatRupiah(keuntunganPerItem)}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-wallet"></i>
                            <span>Total Keuntungan: ${formatRupiah(totalKeuntungan)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="riwayat-stok" style="max-height: 200px; overflow-y: auto;">
                ${riwayatStok.length > 0 
                    ? riwayatStok.map(r => `
                        <div class="riwayat-item">
                            <strong>${new Date(r.tanggal).toLocaleString()}</strong>
                            <span>Perubahan: ${r.perubahan > 0 ? '+' : ''}${r.perubahan}</span>
                            <span>Alasan: ${r.alasan}</span>
                        </div>
                    `).join('') 
                    : 'Tidak ada riwayat perubahan'}
            </div>
        </div>
    `;
}

// Fungsi untuk mencatat perubahan stok
function catatRiwayatStok(kodeBarang, perubahan, alasan) {
    const riwayatKey = `riwayatStok_${kodeBarang}`;
    const riwayatStok = JSON.parse(localStorage.getItem(riwayatKey)) || [];
    
    riwayatStok.push({
        tanggal: new Date().toISOString(),
        perubahan: perubahan,
        alasan: alasan
    });

    // Batasi riwayat maksimal 50 entri
    if (riwayatStok.length > 50) {
        riwayatStok.shift();
    }

    localStorage.setItem(riwayatKey, JSON.stringify(riwayatStok));
}
        
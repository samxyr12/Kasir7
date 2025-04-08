// Konfigurasi Lokasi
const lokasiKoordinat = {
    1: { latitude: -6.465556, longitude: 106.686828, nama: "Kantor Utama" },
    2: { latitude: -6.367006, longitude: 106.731574, nama: "Cabang A" },
    3: { latitude: -6.429668, longitude: 106.721050, nama: "Cabang B" }
};

// Konstanta Konfigurasi
const RADIUS_MAKSIMAL = 100; // Dalam meter
const UNIVERSAL_PIN = "451661750";
const LOKASI_STORAGE_KEY = 'lokasiVerifikasi';
const DURASI_VERIFIKASI = 10 * 60 * 1000; // 10 menit
const INAKTIVITAS_TIMEOUT = 10 * 60 * 1000; // 10 menit

// Referensi Elemen DOM
const lokasiModal = document.getElementById('lokasiModal');
const lokasiStatus = document.getElementById('lokasiStatus');
const cekLokasiBtn = document.getElementById('cekLokasiBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const lokasiSelect = document.getElementById('lokasiSelect');
const pinContainer = document.getElementById('pinContainer');
const pinInput = document.getElementById('pinInput');
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
            Swal.fire({
                icon: 'warning',
                title: 'Sesi Lokasi Berakhir',
                text: 'Verifikasi lokasi telah berakhir. Silakan verifikasi ulang.',
                confirmButtonText: 'OK'
            });
            lokasiModal.style.display = 'flex';
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
        Swal.fire({
            icon: 'warning',
            title: 'Inaktivitas Terdeteksi',
            text: 'Anda tidak aktif selama 10 menit. Silakan verifikasi ulang.',
            confirmButtonText: 'OK'
        });
        lokasiModal.style.display = 'flex';
    }, INAKTIVITAS_TIMEOUT);
}

// Reset Timer Inaktivitas
function resetInaktivitasTimer() {
    if (inaktivitasTimer) {
        clearTimeout(inaktivitasTimer);
    }
    mulaiPelacakInaktivitas();
}

// Toggle Tampilan Input PIN
function togglePinInput() {
    const isUniversal = lokasiSelect.value === "universal";
    pinContainer.style.display = isUniversal ? 'block' : 'none';
}

// Fungsi Cek Lokasi Utama
function cekLokasi() {
    // Cek lokasi tersimpan
    const lokasiTersimpan = cekLokasiTersimpan();
    if (lokasiTersimpan) {
        lokasiSelect.value = lokasiTersimpan;
        lokasiModal.style.display = 'none';
        return;
    }

    loadingSpinner.style.display = 'block';
    lokasiStatus.innerHTML = '';

    const selectedLocation = lokasiSelect.value;
    if (selectedLocation === "0") {
        loadingSpinner.style.display = 'none';
        lokasiStatus.innerHTML = `<p style="color:red;">Silakan pilih lokasi terlebih dahulu.</p>`;
        return;
    }

    // Cek PIN Universal
    if (selectedLocation === "universal") {
        const enteredPin = pinInput.value.trim();
        if (enteredPin === UNIVERSAL_PIN) {
            loadingSpinner.style.display = 'none';
            lokasiModal.style.display = 'none';
            simpanLokasiVerifikasi(selectedLocation);
            Swal.fire({
                icon: 'success',
                title: 'Verifikasi Berhasil',
                text: 'PIN universal valid. Akses diberikan.',
                timer: 2000
            });
            return;
        } else {
            loadingSpinner.style.display = 'none';
            Swal.fire({
                icon: 'error',
                title: 'PIN Tidak Valid',
                text: 'PIN yang Anda masukkan salah.',
                confirmButtonText: 'OK'
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

                loadingSpinner.style.display = 'none';

                if (jarakKeDkantor <= RADIUS_MAKSIMAL) {
                    lokasiModal.style.display = 'none';
                    simpanLokasiVerifikasi(selectedLocation);
                    Swal.fire({
                        icon: 'success',
                        title: 'Lokasi Valid',
                        text: `Anda berada dalam radius ${jarakKeDkantor.toFixed(2)} meter`,
                        timer: 2000
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
                        confirmButtonText: 'OK'
                    });
                    lokasiModal.style.display = 'flex';
                }
            },
            function(error) {
                loadingSpinner.style.display = 'none';
                Swal.fire({
                    icon: 'warning',
                    title: 'Gagal Mendapatkan Lokasi',
                    text: 'Pastikan Anda memberikan izin akses lokasi.',
                    confirmButtonText: 'OK'
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        loadingSpinner.style.display = 'none';
        Swal.fire({
            icon: 'error',
            title: 'Geolokasi Tidak Didukung',
            text: 'Browser Anda tidak mendukung layanan geolokasi.',
            confirmButtonText: 'OK'
        });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const lokasiTersimpan = cekLokasiTersimpan();
    if (lokasiTersimpan) {
        lokasiSelect.value = lokasiTersimpan;
        lokasiModal.style.display = 'none';
    } else {
        lokasiModal.style.display = 'flex';
    }

    cekLokasiBtn.addEventListener('click', cekLokasi);
    lokasiSelect.addEventListener('change', togglePinInput);
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

// Function to load products into the table
function loadProductList() {
    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';

    barang.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" 
                       class="product-checkbox" 
                       data-kode="${item.kode}" 
                       data-nama="${item.nama}"
                       ${selectedItems.has(item.kode) ? 'checked' : ''}>
            </td>
            <td>${item.kode}</td>
            <td>${item.nama}</td>
            <td>${item.stok}</td>
        `;
        tbody.appendChild(row);
    });

    updateDeleteCart();
}

// Function to update the delete cart display
function updateDeleteCart() {
    const deleteCartItems = document.getElementById('deleteCartItems');
    const deleteButton = document.getElementById('deleteSelectedItems');
    deleteCartItems.innerHTML = '';

    const barang = JSON.parse(localStorage.getItem('barang')) || [];
    
    selectedItems.forEach(kodeBarang => {
        const item = barang.find(b => b.kode === kodeBarang);
        if (item) {
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
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';

    const searchTermLower = searchTerm.toLowerCase();
    
    const filteredBarang = barang.filter(item => 
        item.kode.toLowerCase().includes(searchTermLower) ||
        item.nama.toLowerCase().includes(searchTermLower)
    );

    filteredBarang.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" 
                       class="product-checkbox" 
                       data-kode="${item.kode}" 
                       data-nama="${item.nama}"
                       ${selectedItems.has(item.kode) ? 'checked' : ''}>
            </td>
            <td>${item.kode}</td>
            <td>${item.nama}</td>
            <td>${item.stok}</td>
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
        row.insertCell(6).innerText = isInOpname ? 'Dalam.proses SO' : (item.stok || 0);

        // Tambahkan tombol Edit di kolom terakhir
        const actionCell = row.insertCell(7);
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.innerText = 'Edit';
        editBtn.onclick = () => editBarang(item.kode);
        actionCell.appendChild(editBtn);
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
    // 1. Ambil data barang dari localStorage
    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    
    // 2. Buat opsi dropdown barang dengan informasi detail
    let barangOptions = barang.map(item => `
        <option value="${item.nama}" 
                data-kode="${item.kode}"
                data-harga="${item.hargaJual}" 
                data-stok="${item.stok}"
                data-plu="${item.plu}">
            ${item.nama} (PLU: ${item.plu}, Stok: ${item.stok})
        </option>
    `).join('');

    // 3. Definisi custom CSS untuk styling popup
    const customStyles = `
        <style>
            .swal2-popup {
                background: linear-gradient(135deg, #f6f8f9 0%, #e5ebee 100%) !important;
                border-radius: 20px !important;
                box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
            }

            .swal2-title {
                color: #2c3e50 !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
            }

            .target-penjualan-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                padding: 20px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
            }

            .form-control {
                background: white !important;
                border: 2px solid #e0e6ed !important;
                border-radius: 10px !important;
                padding: 12px 15px !important;
                transition: all 0.3s ease !important;
                font-size: 14px !important;
            }

            .form-control:focus {
                border-color: #4a90e2 !important;
                box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2) !important;
            }

            .form-label {
                margin-bottom: 8px;
                color: #34495e;
                font-weight: 600;
            }

            @media (max-width: 600px) {
                .target-penjualan-container {
                    grid-template-columns: 1fr;
                }
            }

            .swal2-actions {
                margin-top: 20px !important;
            }

            .swal2-confirm {
                background-color: #4a90e2 !important;
                border-radius: 10px !important;
                padding: 10px 20px !important;
                font-weight: 600 !important;
                transition: all 0.3s ease !important;
            }

            .swal2-confirm:hover {
                background-color: #357abd !important;
            }

            .swal2-cancel {
                background-color: #e74c3c !important;
                border-radius: 10px !important;
                padding: 10px 20px !important;
                font-weight: 600 !important;
                margin-right: 15px !important;
            }
        </style>
    `;

    // 4. Tampilkan Sweet Alert dengan form input
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
                <div class="form-group">
                    <label class="form-label">Pilih Barang</label>
                    <select id="namaBarangTarget" class="form-control" required>
                        <option value="">Pilih Barang</option>
                        ${barangOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Jumlah Target</label>
                    <input id="jumlahTarget" type="number" class="form-control" 
                           placeholder="Masukkan Jumlah Target" 
                           min="1" required>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Simpan Target',
        cancelButtonText: 'Batal',
        width: '800px',

        // 5. Validasi dan proses sebelum konfirmasi
        preConfirm: () => {
            const tanggalMulai = document.getElementById('tanggalMulai').value;
            const tanggalSelesai = document.getElementById('tanggalSelesai').value;
            const namaBarang = document.getElementById('namaBarangTarget').value;
            const jumlahTarget = parseInt(document.getElementById('jumlahTarget').value);
            const selectedOption = document.getElementById('namaBarangTarget').options[
                document.getElementById('namaBarangTarget').selectedIndex
            ];

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

            if (!namaBarang) {
                Swal.showValidationMessage('Mohon pilih barang');
                return false;
            }
            if (!jumlahTarget || jumlahTarget <= 0) {
                Swal.showValidationMessage('Jumlah target harus lebih dari 0');
                return false;
            }

            // 6. Kembalikan data yang valid
            return { 
                tanggalMulai, 
                tanggalSelesai,
                namaBarang,
                kodeBarang: selectedOption.dataset.kode,
                pluBarang: selectedOption.dataset.plu,
                jumlahTarget,
                hargaSatuan: parseFloat(selectedOption.dataset.harga)
            };
        }
    }).then((result) => {
        // 7. Proses setelah konfirmasi
        if (result.isConfirmed) {
            // Simpan target penjualan
            simpanTargetPenjualan(
                result.value.tanggalMulai,
                result.value.tanggalSelesai,
                result.value.namaBarang,
                result.value.jumlahTarget,
                result.value.kodeBarang,
                result.value.pluBarang,
                result.value.hargaSatuan
            );

            // Tampilkan notifikasi sukses
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: 'Target penjualan berhasil disimpan',
                timer: 1500,
                showConfirmButton: false
            }); }
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
    // Ambil data target penjualan dari localStorage
    let targets = JSON.parse(localStorage.getItem('targetPenjualan')) || [];
    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    
    // Custom CSS untuk tampilan
    const customStyles = `
        <style>
            .target-table-container {
                padding: 20px;
                background: #fff;
                border-radius: 8px;
            }
            
            .table {
                width: 100%;
                margin-bottom: 1rem;
                background-color: transparent;
                border-collapse: collapse;
            }
            
            .table th {
                padding: 15px;
                vertical-align: middle;
                background-color: #2c3e50;
                color: white;
                font-weight: 600;
                font-size: 14px;
                white-space: nowrap;
                text-align: center;
            }
            
            .table td {
                padding: 12px 15px;
                vertical-align: middle;
                font-size: 14px;
            }
            
            .table-hover tbody tr:hover {
                background-color: rgba(52, 152, 219, 0.1);
            }
            
            .month-header {
                background-color: #34495e !important;
                color: white !important;
                font-size: 16px !important;
                font-weight: bold !important;
                text-align: center !important;
                padding: 10px !important;
            }
            
            .btn-group {
                display: flex;
                gap: 5px;
                justify-content: center;
            }
            
            .btn-action {
                padding: 6px 12px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-edit {
                background-color: #f1c40f;
                color: white;
            }
            
            .btn-delete {
                background-color: #e74c3c;
                color: white;
            }
            
            .total-row {
                background-color: #2980b9 !important;
                color: white !important;
                font-weight: bold !important;
            }
            
            .total-row td {
                padding: 12px 15px !important;
            }
            
            .status-indicator {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
            }
            
            .target-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .empty-state {
                text-align: center;
                padding: 40px;
            }
            
            .empty-state i {
                font-size: 48px;
                color: #95a5a6;
                margin-bottom: 20px;
            }
            
            @media (max-width: 768px) {
                .table-responsive {
                    overflow-x: auto;
                }
                
                .btn-group {
                    flex-direction: column;
                }
            }
        </style>
    `;

    // Jika tidak ada target
    if (targets.length === 0) {
        Swal.fire({
            icon: 'info',
            title: '<span style="color: #2c3e50">Daftar Target Kosong</span>',
            html: `
                ${customStyles}
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Belum ada target penjualan yang dibuat.</p>
                    <button onclick="tambahTargetPenjualan()" class="btn-action" 
                            style="background-color: #3498db; color: white; margin-top: 15px;">
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
                            <th><i class="fas fa-money-bill-wave"></i> Harga Satuan</th>
                            <th><i class="fas fa-calculator"></i> Total Nilai</th>
                            <th><i class="fas fa-tools"></i> Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Urutkan kunci (tahun-bulan) dari terbaru
    const kunciTerurut = Object.keys(targetTerkelompok).sort().reverse();
    let totalSemuaTarget = 0;
    let totalSemuaNilai = 0;

    kunciTerurut.forEach(kunci => {
        const [tahun, bulan] = kunci.split('-');
        const namaBulan = new Date(tahun, bulan - 1).toLocaleString('id-ID', { month: 'long' });

        let totalBulanIni = 0;
        let totalNilaiBulanIni = 0;

        // Header bulan
        htmlTabel += `
            <tr>
                <td colspan="7" class="month-header">
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
            
            totalBulanIni += target.jumlahTarget;
            totalNilaiBulanIni += nilaiTarget;
            totalSemuaTarget += target.jumlahTarget;
            totalSemuaNilai += nilaiTarget;

            htmlTabel += `
                <tr>
                    <td style="text-align: center;"> ${formatTanggal(target.tanggalMulai)} - 
                        ${formatTanggal(target.tanggalSelesai)}
                    </td>
                    <td style="text-align: center;">
                        ${barangInfo.kode || '-'} / ${barangInfo.plu || '-'}
                    </td>
                    <td>${target.namaBarang}</td>
                    <td style="text-align: right;">${target.jumlahTarget.toLocaleString()} Unit</td>
                    <td style="text-align: right;">Rp ${formatRupiah(hargaSatuan)}</td>
                    <td style="text-align: right;">Rp ${formatRupiah(nilaiTarget)}</td>
                    <td style="text-align: center;">
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
        htmlTabel += `
            <tr style="background-color: #edf2f7;">
                <td colspan="3" style="text-align: right;"><strong>Total ${namaBulan} ${tahun}:</strong></td>
                <td style="text-align: right;"><strong>${totalBulanIni.toLocaleString()} Unit</strong></td>
                <td></td>
                <td style="text-align: right;"><strong>Rp ${formatRupiah(totalNilaiBulanIni)}</strong></td>
                <td></td>
            </tr>
        `;
    });

    // Total keseluruhan
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
        title: '<span style="color: #2c3e50"><i class="fas fa-list"></i> Daftar Target Penjualan</span>',
        html: htmlTabel,
        width: '95%',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
            popup: 'target-penjualan-popup',
            closeButton: 'custom-close-button'
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
        const kategori = item.kategori || 'Uncategorized'; // Fallback for items without category
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
                headerCell.colSpan = 12; // Adjusted to 12 to include PLU column
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
                        '', // Empty cell for category
                        item.kodeToko || '',
                        item.kode || '',
                        item.plu || '', // Display PLU
                        item.nama || '',
                        formatRupiah(item.hargaBeli || 0),
                        formatRupiah(item.hargaJual || 0),
                        isInOpname ? 'Sedang STOK' : (item.stok || 0), // Display 'Sedang STOK' if in opname
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

    // Show low stock notification if needed
    if (stokHampirHabis.length > 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Stok Hampir Habis',
            html: `
                <p>Berikut daftar barang yang stoknya 5 atau kurang:</p>
                <ul>${stokHampirHabis.map(item => `<li>${item}</li>`).join('')}</ul>
            `,
            confirmButtonText: 'OK'
        });
    }
}
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
        let worksheet_data = [
            ['Kategori', 'Kode Toko', 'Kode Barang', 'PLU', 'Nama Barang', 'Harga Beli', 
             'Harga Jual', 'Stok', 'Total Terjual', 'Keuntungan', 'Persentase Terjual', 
             'Target Penjualan', 'Persentase Target']
        ];

        const barangData = JSON.parse(localStorage.getItem('barang')) || [];
        const targetData = JSON.parse(localStorage.getItem('targetPenjualan')) || [];
        const urutanKategori = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'Uncategorized'];

        const groupedData = {};
        urutanKategori.forEach(kategori => {
            groupedData[kategori] = barangData.filter(item => item.kategori === kategori);
        });

        urutanKategori.forEach(kategori => {
            const items = groupedData[kategori];
            if (items && items.length > 0) {
                items.forEach(item => {
                    const hargaBeli = parseFloat(item.hargaBeli) || 0;
                    const hargaJual = parseFloat(item.hargaJual) || 0;
                    const stok = parseInt(item.stok) || 0;
                    const totalTerjual = parseInt(item.terjual) || 0;
                    const keuntungan = (hargaJual - hargaBeli) * totalTerjual;
                    const persentaseTerjual = stok > 0 ? ((totalTerjual / stok) * 100).toFixed(2) : '0';

                    const target = targetData.find(targetItem => targetItem.namaBarang === item.nama);
                    const jumlahTarget = target ? target.jumlahTarget : 'Tidak Ada';
                    const persentaseTarget = target ? ((totalTerjual / target.jumlahTarget) * 100).toFixed(2) : '0';

                    worksheet_data.push([
                        kategori,
                        item.kodeToko,
                        item.kode,
                        item.plu || '',
                        item.nama,
                        formatNumber(hargaBeli),
                        formatNumber(hargaJual),
                        stok,
                        totalTerjual,
                        formatNumber(keuntungan),
                        `${persentaseTerjual}%`,
                        jumlahTarget,
                        `${persentaseTarget}%`
                    ]);
                });
            }
        });

        // Function to create Excel workbook
        function createWorkbook() {
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);

            const colWidths = [
                { wch: 10 },  // Kategori
                { wch: 10 },  // Kode Toko
                { wch: 12 },  // Kode Barang
                { wch: 12 },  // PLU
                { wch: 30 },  // Nama Barang
                { wch: 15 },  // Harga Beli
                { wch: 15 },  // Harga Jual
                { wch: 8 },   // Stok
                { wch: 12 },  // Total Terjual
                { wch: 15 },  // Keuntungan
                { wch: 15 },  // Persentase Terjual
                { wch: 15 },  // Target Penjualan
                { wch: 15 }   // Persentase Target
            ];
            worksheet['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Barang');
            return workbook;
        }

        // Prompt user for download method
        Swal.fire({
            title: 'Pilih Metode Download',
            text: 'Pilih format file yang ingin Anda unduh',
            icon: 'question',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Excel',
            cancelButtonText: 'Batal',
            denyButtonText: 'ZIP'
        }).then((result) => {
            if (result.isConfirmed) {
                // Direct Excel download
                const workbook = createWorkbook();
                XLSX.writeFile(workbook, `data_barang_${new Date().toLocaleDateString()}.xlsx`);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil',
                    text: 'File Excel berhasil diunduh!',
                    timer: 2000
                });
            } else if (result.isDenied) {
                // ZIP download
                const workbook = createWorkbook();
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                
                // Create a JSZip instance
                const zip = new JSZip();
                const filename = `data_barang_${new Date().toLocaleDateString()}.xlsx`;
                
                // Add Excel file to ZIP
                zip.file(filename, excelBuffer, { binary: true });
                
                // Generate and trigger ZIP download
                zip.generateAsync({ type: 'blob' }).then(function(content) {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(content);
                    link.download = `data_barang_${new Date().toLocaleDateString()}.zip`;
                    link.click();
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'File ZIP berhasil diunduh!',
                        timer: 2000
                    });
                });
            }
        }).catch((error) => {
            console.error('Error in download process:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Terjadi kesalahan saat mengunduh data: ' + error.message
            });
        });

    } catch (error) {
        console.error('Error in downloadExcel:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Terjadi kesalahan saat mengunduh data: ' + error.message
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
        

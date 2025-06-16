




function checkLogin() {
    const loggedIn = localStorage.getItem('loggedIn');
    if (loggedIn !== 'true') {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('username');
    localStorage.setItem('loginAttempts', JSON.stringify({}));
    window.location.href = 'login.html';
}

window.onload = checkLogin;


let inactivityTimer;
let countdownInterval;
let lastActivityTime = Date.now();
let isPopupActive = false;

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 menit dalam milidetik

// Fungsi untuk memblokir akses API
function blockApiAccess() {
    window.originalFetch = window.fetch;
    window.fetch = async (...args) => {
        if (isPopupActive) {
            throw new Error('Akses API diblokir: Sesi tidak aktif, harap verifikasi password');
        }
        return window.originalFetch(...args);
    };
}

// Fungsi untuk membuka kembali akses API
function unblockApiAccess() {
    window.fetch = window.originalFetch;
}

// Fungsi untuk menyimpan informasi sesi ke localStorage
function saveSession() {
    localStorage.setItem('lastActivityTime', lastActivityTime.toString());
}

// Fungsi untuk menampilkan popup verifikasi password
function showVerificationPopup(username, onSuccess, onLogout) {
    isPopupActive = true;
    blockApiAccess();

    let accounts = [];
    try {
        const storedAccounts = localStorage.getItem('accounts');
        accounts = storedAccounts ? JSON.parse(storedAccounts) : [];
        if (!Array.isArray(accounts)) {
            console.warn('Data accounts bukan array, menginisialisasi sebagai array kosong');
            accounts = [];
        }
    } catch (error) {
        console.error('Gagal mem-parsing data accounts:', error);
        accounts = [];
    }

    Swal.fire({
        title: '',
        html: `
            <div style="text-align: center; padding: 10px;">
                <!-- Logo/Icon Section -->
                <div style="margin-bottom: 25px;">
                    <div style="background: linear-gradient(135deg, #4f46e5, #2563eb); border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);">
                        <i class="fas fa-user-shield" style="font-size: 32px; color: #ffffff;"></i>
                    </div>
                    <h2 style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0;">Sesi Kedaluwarsa</h2>
                </div>
                
                <!-- User Section -->
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center;">
                    <div style="background-color: #e0f2fe; border-radius: 50%; width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; margin-right: 15px; box-shadow: 0 2px 5px rgba(59, 130, 246, 0.2);">
                        <i class="fas fa-user" style="font-size: 20px; color: #0ea5e9;"></i>
                    </div>
                    <div style="text-align: left; flex-grow: 1;">
                        <p style="margin: 0; font-size: 13px; color: #64748b;">Pengguna</p>
                        <strong style="font-size: 16px; color: #0f172a;">${username}</strong>
                    </div>
                </div>
                
                <!-- Alert Section -->
                <div style="background-color: #fff7ed; border-radius: 12px; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 25px; text-align: left; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="display: flex; align-items: flex-start;">
                        <div style="background-color: #ffedd5; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 12px; color: #ea580c;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #9a3412;">Verifikasi Diperlukan</h3>
                            <p style="margin: 0; font-size: 13px; color: #9a3412; line-height: 1.5;">Sesi Anda telah kedaluwarsa karena tidak ada aktivitas. Masukkan password untuk melanjutkan akses.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Password Input -->
                <div style="margin-bottom: 10px; position: relative;">
                    <div style="position: relative;">
                        <i class="fas fa-lock" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
                        <input type="password" id="passwordInput" placeholder="Masukkan password" style="width: 100%; padding: 12px 15px 12px 45px; border-radius: 10px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-size: 14px; color: #0f172a; transition: all 0.3s ease; box-sizing: border-box;">
                    </div>
                    <p id="passwordError" style="color: #dc2626; font-size: 12px; margin: 5px 0 0 5px; text-align: left; display: none;"></p>
                </div>
            </div>
        `,
        width: '360px',
        padding: '20px',
        background: '#ffffff',
        backdrop: 'rgba(15, 23, 42, 0.7)',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-check-circle" style="margin-right: 8px;"></i>Verifikasi',
        cancelButtonText: '<i class="fas fa-sign-out-alt" style="margin-right: 8px;"></i>Logout',
        buttonsStyling: false,
        customClass: {
            confirmButton: 'btn-modern btn-primary',
            cancelButton: 'btn-modern btn-outline',
            popup: 'popup-modern'
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            // Fokus ke input password
            document.getElementById('passwordInput').focus();
            
            // Tambahkan event untuk tombol enter
            document.getElementById('passwordInput').addEventListener('keyup', function(event) {
                if (event.key === 'Enter') {
                    document.querySelector('.swal2-confirm').click();
                }
            });
            
            // Tambahkan efek focus pada input
            document.getElementById('passwordInput').addEventListener('focus', function() {
                this.style.borderColor = '#3b82f6';
                this.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)';
            });
            
            document.getElementById('passwordInput').addEventListener('blur', function() {
                this.style.borderColor = '#e2e8f0';
                this.style.boxShadow = 'none';
            });
        },
        preConfirm: () => {
            const password = document.getElementById('passwordInput').value;
            const account = accounts.find(acc => acc.username === username);
            const passwordError = document.getElementById('passwordError');
            
            // Reset error message
            passwordError.style.display = 'none';
            
            if (!password) {
                passwordError.textContent = 'Password harus diisi';
                passwordError.style.display = 'block';
                return false;
            }
            
            if (!account) {
                passwordError.textContent = 'Akun tidak ditemukan';
                passwordError.style.display = 'block';
                return false;
            }
            
            if (typeof CryptoJS !== 'undefined' && CryptoJS.AES) {
                try {
                    const decryptedPassword = CryptoJS.AES.decrypt(account.password, 'secret key 123').toString(CryptoJS.enc.Utf8);
                    if (decryptedPassword !== password) {
                        passwordError.textContent = 'Password salah';
                        passwordError.style.display = 'block';
                        return false;
                    }
                } catch (error) {
                    console.error('Gagal mendekripsi password:', error);
                    passwordError.textContent = 'Terjadi kesalahan saat memverifikasi password';
                    passwordError.style.display = 'block';
                    return false;
                }
            } else {
                console.warn('CryptoJS tidak tersedia, tidak dapat memverifikasi password');
                passwordError.textContent = 'Fitur enkripsi tidak tersedia, hubungi administrator';
                passwordError.style.display = 'block';
                return false;
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            isPopupActive = false;
            unblockApiAccess();
            lastActivityTime = Date.now(); // Perbarui waktu aktivitas
            saveSession(); // Simpan sesi
            onSuccess();
            
            // Notifikasi sukses
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });
            
            Toast.fire({
                icon: 'success',
                title: 'Sesi berhasil diperbarui',
                background: '#f0fdf4',
                iconColor: '#16a34a'
            });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            isPopupActive = false;
            unblockApiAccess();
            onLogout();
        }
    });
}

// Fungsi untuk memulai atau mereset timer ketidakaktifan
function startInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    lastActivityTime = Date.now();
    saveSession(); // Simpan waktu aktivitas terakhir

    inactivityTimer = setTimeout(() => {
        const username = localStorage.getItem('username') || 'Unknown User';
        showVerificationPopup(
            username,
            () => {
                startInactivityTimer(); // Lanjutkan timer setelah verifikasi berhasil
            },
            () => {
                logout(); // Panggil logout jika pengguna memilih logout
            }
        );
    }, SESSION_TIMEOUT);

    startCountdown();
}

// Fungsi untuk memulai countdown dan memperbarui indikator timer
function startCountdown() {
    let timerElement = document.getElementById('inactivityTimer');
    
    if (!timerElement) {
        timerElement = document.createElement('div');
        timerElement.id = 'inactivityTimer';
        timerElement.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px; /* Mengubah dari right ke left untuk memindahkan ke sebelah kiri */
            background-color: #ffffff;
            padding: 10px 15px;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            font-size: 14px;
            font-weight: 500;
            color: #1e293b;
            z-index: 1000;
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(timerElement);
    }

    countdownInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - lastActivityTime) / 1000);
        const remainingSeconds = 5 * 60 - elapsed;
        
        if (remainingSeconds >= 0) {
            updateTimerDisplay(remainingSeconds);
        } else {
            clearInterval(countdownInterval);
        }
    }, 1000);

    updateTimerDisplay(5 * 60);
}

// Fungsi untuk memperbarui tampilan timer
function updateTimerDisplay(seconds) {
    const timerElement = document.getElementById('inactivityTimer');
    if (timerElement) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerElement.innerHTML = `
            <i class="fas fa-clock" style="margin-right: 8px; color: ${seconds <= 10 ? '#b91c1c' : '#3b82f6'};"></i>
            Sesi berakhir: ${minutes}:${secs.toString().padStart(2, '0')}
        `;
        
        if (seconds <= 10) {
            timerElement.style.backgroundColor = '#fee2e2';
            timerElement.style.color = '#b91c1c';
            timerElement.style.transform = 'scale(1.05)';
        } else {
            timerElement.style.backgroundColor = '#ffffff';
            timerElement.style.color = '#1e293b';
            timerElement.style.transform = 'scale(1)';
        }
    }
}

// Fungsi untuk mereset timer saat ada aktivitas
function resetInactivityTimer() {
    if (!isPopupActive) {
        startInactivityTimer();
    }
}

// Fungsi untuk mencegah interaksi dengan halaman saat popup aktif
function blockPageInteraction() {
    const overlay = document.createElement('div');
    overlay.id = 'interactionBlocker';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
        display: none;
    `;
    document.body.appendChild(overlay);

    document.addEventListener('swal2-show', () => {
        overlay.style.display = 'block';
    });

    document.addEventListener('swal2-close', () => {
        overlay.style.display = 'none';
    });
}

// Tambahkan CSS tanpa mendeklarasikan ulang variabel style
function addCustomStyles() {
    let styleElement = document.getElementById('inactivityStyles');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'inactivityStyles';
        document.head.appendChild(styleElement);
    }
    styleElement.innerHTML = `
        /* Button Styles */
        .btn-modern {
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.3s ease;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin: 0 8px;
            border: none;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            border: none;
        }
        
        .btn-primary:hover {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
            transform: translateY(-1px);
        }
        
        .btn-outline {
            background: transparent;
            color: #64748b;
            border: 1px solid #e2e8f0;
        }
        
        .btn-outline:hover {
            background-color: #f8fafc;
            color: #334155;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
            transform: translateY(-1px);
        }
        
        /* Popup Styles */
        .popup-modern {
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow: hidden;
            border: none;
        }
        
        .swal2-title {
            font-size: 24px;
            color: #1e293b;
            font-weight: 700;
        }
        
        .swal2-html-container {
            margin: 0;
            padding: 0;
        }
        
        .swal2-actions {
            margin-top: 1.5rem;
        }
        
        /* Validation Message */
        .swal2-validation-message {
            background-color: #fef2f2;
            color: #b91c1c;
            border-radius: 8px;
            font-size: 13px;
            padding: 10px 15px;
        }
        
        /* Toast Notification */
        .swal2-toast {
            padding: 12px 20px !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
            border-radius: 10px !important;
        }
        
        /* Animation */
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
    `;
}

// Fungsi untuk memeriksa sesi saat halaman dimuat
function checkSession() {
    const username = localStorage.getItem('username');
    const storedLastActivityTime = localStorage.getItem('lastActivityTime');

    if (username && username !== 'Unknown User' && storedLastActivityTime) {
        const lastActivity = parseInt(storedLastActivityTime, 10);
        const currentTime = Date.now();
        const timeSinceLastActivity = currentTime - lastActivity;

        if (timeSinceLastActivity < SESSION_TIMEOUT) {
            // Sesi masih valid, lanjutkan tanpa meminta password
            lastActivityTime = lastActivity; // Gunakan waktu tersimpan
            startInactivityTimer();
        } else {
            // Sesi kedaluwarsa, minta verifikasi password
            showVerificationPopup(
                username,
                () => {
                    startInactivityTimer(); // Mulai timer setelah verifikasi berhasil
                },
                () => {
                    logout(); // Logout dan hapus sesi
                }
            );
        }
    } else {
        // Tidak ada sesi, mulai timer
        startInactivityTimer();
    }
}

// Tambahkan event listener dan inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
    });

    blockPageInteraction();
    addCustomStyles();
    checkSession(); // Periksa sesi saat halaman dimuat
});

function detailBarang(index) {
    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    const item = barang[index];

    Swal.fire({
        title: '<h2 style="color: #007BFF; font-weight: bold;">Detail Barang</h2>',
        html: `
            <p style="text-align: left; font-size: 20px;">
                <strong style="color: #333;">Kode:</strong> <span style="color: #ff0049;">${item.kode}</span>
            </p>
            <p style="text-align: left; font-size: 20px;">
                <strong style="color: #333;">Nama:</strong> <span style="color: #ff0049;">${item.nama}</span>
            </p>
            <p style="text-align: left; font-size: 20px;">
                <strong style="color: #333;">Harga Beli:</strong> <span style="color: #ff0049;">${formatRupiah(item.hargaBeli)}</span>
            </p>
            <p style="text-align: left; font-size: 20px;">
                <strong style="color: #333;">Harga Jual:</strong> <span style="color: #ff0049;">${formatRupiah(item.hargaJual)}</span>
            </p>
            <p style="text-align: left; font-size: 20px;">
                <strong style="color: #333;">Stok:</strong> <span style="color: #ff0049;">${item.stok}</span>
            </p>
            <p style="text-align: left; font-size: 20px;">
                <strong style="color: #333;">Kode Toko:</strong> <span style="color: #ff0049;">${item.kodeToko}</span>
            </p>
            <p style="text-align: left; font-size: 20px;">
                <strong style="color: #333;">Terjual:</strong> <span style="color: #ff0049;">${item.terjual}</span>
            </p>
            <p style="text-align: left; font-size: 20px;">
                <strong style="color: #333;">Keuntungan:</strong> <span style="color: #ff0049;">${formatRupiah(item.terjual * (item.hargaJual - item.hargaBeli))}</span>
            </p>
        `,
        icon: 'info',
        confirmButtonText: 'Tutup',
        customClass: {
            popup: 'swal2-custom-popup'
        }
    });
}


function editBarang(index) {
    Swal.fire({
        title: 'Masukkan PIN',
        input: 'password',
        inputLabel: 'PIN',
        inputPlaceholder: 'Masukkan PIN Anda',
        showCancelButton: true,
        confirmButtonText: 'Submit',
        cancelButtonText: 'Batal',
    }).then((result) => {
        if (result.isConfirmed && result.value === '451') {
            let barang = JSON.parse(localStorage.getItem('barang')) || [];
            const item = barang[index];

            Swal.fire({
                title: 'Kode Barang',
                input: 'text',
                inputValue: item.kode,
                inputLabel: 'Masukkan kode barang',
            }).then(({ value: kodeBarang }) => {
                if (kodeBarang) {
                    Swal.fire({
                        title: 'Nama Barang',
                        input: 'text',
                        inputValue: item.nama,
                        inputLabel: 'Masukkan nama barang',
                    }).then(({ value: namaBarang }) => {
                        if (namaBarang) {
                            Swal.fire({
                                title: 'Harga Beli',
                                input: 'number',
                                inputValue: item.hargaBeli,
                                inputLabel: 'Masukkan harga beli',
                            }).then(({ value: hargaBeli }) => {
                                if (hargaBeli) {
                                    Swal.fire({
                                        title: 'Harga Jual',
                                        input: 'number',
                                        inputValue: item.hargaJual,
                                        inputLabel: 'Masukkan harga jual',
                                    }).then(({ value: hargaJual }) => {
                                        if (hargaJual) {
                                            Swal.fire({
                                                title: 'Stok Barang',
                                                input: 'number',
                                                inputValue: item.stok,
                                                inputLabel: 'Masukkan stok barang',
                                            }).then(({ value: stokBarang }) => {
                                                if (stokBarang) {
                                                    Swal.fire({
                                                        title: 'Kode Toko',
                                                        input: 'text',
                                                        inputValue: item.kodeToko,
                                                        inputLabel: 'Masukkan kode toko',
                                                    }).then(({ value: kodeToko }) => {
                                                        if (kodeBarang && namaBarang && hargaBeli && hargaJual && stokBarang && kodeToko) {
                                                            barang[index] = {
                                                                kode: kodeBarang,
                                                                nama: namaBarang,
                                                                hargaBeli: parseFloat(hargaBeli),
                                                                hargaJual: parseFloat(hargaJual),
                                                                stok: parseInt(stokBarang),
                                                                kodeToko: kodeToko,
                                                                terjual: item.terjual
                                                            };
                                                            localStorage.setItem('barang', JSON.stringify(barang));
                                                            loadBarang();
                                                        } else {
                                                            Swal.fire('Error', 'Lengkapi data barang', 'error');
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } else {
            Swal.fire('Error', 'PIN salah', 'error');
        }
    });
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

let pendingTimer; // Timer for 10-minute timeout
let archivedItems = []; // Array to store pending items

// Load cart items from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    loadKeranjang(); // Load items in the cart
    checkPendingStatus(); // Check if Pending or Unpending button should be displayed
});

// Add items to the cart
function tambahKeKeranjang() {
    const kodeNamaBarang = document.getElementById('kodeNamaBarang').value;
    const jumlahBarang = document.getElementById('jumlahBarang').value;

    if (kodeNamaBarang !== '' && jumlahBarang) {
        if (!/^\d+$/.test(jumlahBarang)) {
            Swal.fire('Error', 'Jumlah barang harus berupa angka positif', 'error');
            return;
        }

        let barang = JSON.parse(localStorage.getItem('barang')) || [];
        let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
        let diskon = JSON.parse(localStorage.getItem('diskon')) || [];

        const item = barang.find(item => item.kode === kodeNamaBarang || item.nama === kodeNamaBarang);
        if (!item) {
            Swal.fire('Error', 'Barang tidak ditemukan', 'error');
            return;
        }

        const jumlahInt = parseInt(jumlahBarang);
        if (jumlahInt <= 0) {
            Swal.fire('Error', 'Jumlah barang tidak boleh kurang dari atau sama dengan nol', 'error');
            return;
        }

        if (item.stok < jumlahInt) {
            Swal.fire({
                icon: 'error',
                title: 'Stok Tidak Mencukupi!',
                text: `Stok yang tersedia hanya ${item.stok} barang.`,
                confirmButtonText: 'OK'
            });
            return;
        }

        let diskonItem = diskon.find(d => d.kode === item.kode);
        let hargaSetelahDiskon = item.hargaJual;
        let potongan = 0;

        if (diskonItem) {
            potongan = hargaSetelahDiskon * (diskonItem.persenDiskon / 100);
            hargaSetelahDiskon -= potongan;
        }

        const existingItem = keranjang.find(k => k.kode === item.kode);
        if (existingItem) {
            existingItem.jumlah += jumlahInt;
            existingItem.total = existingItem.jumlah * hargaSetelahDiskon;
            existingItem.potongan = diskonItem ? diskonItem.persenDiskon : 0;
        } else {
            keranjang.push({
                kode: item.kode,
                nama: item.nama,
                jumlah: jumlahInt,
                harga: item.hargaJual,
                total: hargaSetelahDiskon * jumlahInt,
                potongan: diskonItem ? diskonItem.persenDiskon : 0
            });
        }

        item.stok -= jumlahInt;
        item.terjual += jumlahInt;

        if (item.stok === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Stok Habis!',
                text: `Barang dengan kode ${item.kode} telah habis.`,
                confirmButtonText: 'OK'
            });
        }

        localStorage.setItem('barang', JSON.stringify(barang));
        localStorage.setItem('keranjang', JSON.stringify(keranjang));

        loadKeranjang();

        document.getElementById('kodeNamaBarang').value = '';
        document.getElementById('jumlahBarang').value = '';

        // Show Pending button if there are items in the cart
        if (keranjang.length > 0) {
            document.getElementById('pendingButton').style.display = 'inline';
        }

        // Reset the pending timer every time an item is added
        resetPendingTimer();
    } else {
        Swal.fire('Error', 'Lengkapi data transaksi', 'error');
    }
}

// Load items in the cart and display
function loadKeranjang() {
    let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    const tabelKeranjang = document.getElementById('tabelKeranjang');
    tabelKeranjang.innerHTML = '';
    let total = 0;

    keranjang.forEach((item, index) => {
        const row = tabelKeranjang.insertRow();
        row.insertCell(0).innerText = item.nama;
        row.insertCell(1).innerText = item.jumlah;
        row.insertCell(2).innerText = formatRupiah(item.harga);
        row.insertCell(3).innerText = item.potongan ? item.potongan + '%' : '0%';
        row.insertCell(4).innerText = formatRupiah(item.total);
        total += item.total;

        const aksiCell = row.insertCell(5);
        const voidBtn = document.createElement('button');
        voidBtn.classList.add('action-btn');
        voidBtn.innerHTML = '<i class="fas fa-ban"></i>';
        voidBtn.onclick = () => voidBarang(index);
        aksiCell.appendChild(voidBtn);
    });

    document.getElementById('totalKeranjang').innerText = formatRupiah(total);
}



function resetPendingTimer() {
    // Batalkan timer sebelumnya jika ada
    if (pendingTimer) {
        clearTimeout(pendingTimer);
    }

    // Mulai timer baru
    pendingTimer = setTimeout(() => {
        // Cek apakah masih ada item yang di-pending
        let archived = JSON.parse(localStorage.getItem('archivedItems')) || [];
        
        if (archived.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Waktu Pending Habis',
                text: '10 menit telah berlalu. Item pending akan dihapus.',
                confirmButtonText: 'OK'
            }).then(() => {
                // Hapus item yang di-pending
                localStorage.removeItem('archivedItems');
                
                // Update tampilan tombol
                document.getElementById('pendingButton').style.display = 'inline';
                document.getElementById('unpendingButton').style.display = 'none';
            });
        }
    }, 10 * 60 * 1000); // 10 menit
}

function startPendingTimer() {
    resetPendingTimer(); // Gunakan fungsi reset yang baru dibuat
}

function pendingItems() {
    let archived = JSON.parse(localStorage.getItem('archivedItems')) || [];
    if (archived.length > 0) {
        Swal.fire('Error', 'Tidak bisa melakukan pending lagi, karena ada pending yang aktif.', 'error');
        return;
    }

    let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    if (keranjang.length === 0) return;

    // Archive items and empty the cart
    localStorage.setItem('archivedItems', JSON.stringify(keranjang));
    localStorage.removeItem('keranjang');
    loadKeranjang();

    document.getElementById('pendingButton').style.display = 'none';
    document.getElementById('unpendingButton').style.display = 'inline';

    Swal.fire('Pending', 'Items in cart have been archived.', 'success');
    
    // Start the 10-minute warning timer
    startPendingTimer();
}

function unpendingItems() {
    let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];

    if (keranjang.length > 0) {
        Swal.fire('Error', 'Kosongkan keranjang sebelum mengembalikan pendingan.', 'error');
        return;
    }

    let archived = JSON.parse(localStorage.getItem('archivedItems')) || [];
    if (archived.length > 0) {
        localStorage.setItem('keranjang', JSON.stringify(archived));
        localStorage.removeItem('archivedItems');
        loadKeranjang();

        document.getElementById('pendingButton').style.display = 'inline';
        document.getElementById('unpendingButton').style.display = 'none';

        Swal.fire('Unpending', 'Pending items have been restored to the cart.', 'success');
        
        // Batalkan timer pending
        if (pendingTimer) {
            clearTimeout(pendingTimer);
        }
    }
}

// Tambahkan event listener untuk tombol
document.addEventListener('DOMContentLoaded', () => {
    const pendingButton = document.getElementById('pendingButton');
    const unpendingButton = document.getElementById('unpendingButton');

    if (pendingButton) {
        pendingButton.addEventListener('click', pendingItems);
    }

    if (unpendingButton) {
        unpendingButton.addEventListener('click', unpendingItems);
    }

    // Periksa status pending saat halaman dimuat
    checkPendingStatus();
});

function checkPendingStatus() {
    let archived = JSON.parse(localStorage.getItem('archivedItems')) || [];

    if (archived.length > 0) {
        document.getElementById('pendingButton').style.display = 'none';
        document.getElementById('unpendingButton').style.display = 'inline';
        
        // Mulai ulang timer jika masih ada item pending
        startPendingTimer();
    } else {
        let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
        if (keranjang.length > 0) {
            document.getElementById('pendingButton').style.display = 'inline';
        }
        document.getElementById('unpendingButton').style.display = 'none';
    }
}


// Start the 10-minute warning timer
function startPendingTimer() {
    pendingTimer = setTimeout(() => {
        // Show warning after 10 minutes
        Swal.fire({
            icon: 'warning',
            title: 'Warning',
            text: '10 menit telah berlalu tanpa transaksi. Harap selesaikan pembayaran.',
            confirmButtonText: 'OK'
        });
        document.getElementById('pendingButton').style.display = 'none';
    }, 10 * 60 * 1000); // 10 minutes
}

// Event listeners for Pending and Unpending buttons
document.getElementById('pendingButton').addEventListener('click', pendingItems);
document.getElementById('unpendingButton').addEventListener('click', unpendingItems);

// Initialize buttons (hidden by default)
document.getElementById('pendingButton').style.display = 'none';
document.getElementById('unpendingButton').style.display = 'none';

function hitungPoin(totalBelanja) {
    return Math.floor(totalBelanja * 0.03);
}

function muatDaftarMember() {
    const daftarMember = JSON.parse(localStorage.getItem('members')) || [];
    const memberContainer = document.getElementById('daftarMemberContainer');
    const searchStats = document.getElementById('searchStats');
    
    if (!memberContainer) return;

    memberContainer.innerHTML = '';
    
    if (daftarMember.length === 0) {
        memberContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>Tidak ada member yang terdaftar</p>
            </div>
        `;
        searchStats.textContent = 'Total Member: 0';
        return;
    }

    daftarMember.forEach(member => {
        const isVip = (member.totalTransaksi || 0) > 1000000;
        const memberElement = document.createElement('div');
        memberElement.className = 'member-card';
        memberElement.dataset.nama = member.nama.toLowerCase();
        memberElement.dataset.notelp = member.noTelp.toLowerCase();
        memberElement.dataset.type = isVip ? 'vip' : 'regular';
        
        memberElement.innerHTML = `
            <div class="member-info">
                <div class="member-name">
                    ${member.nama}
                    <span class="member-status ${isVip ? 'status-vip' : 'status-regular'}">
                        ${isVip ? 'VIP' : 'Regular'}
                    </span>
                </div>
                <div class="member-details">
                    <div class="detail-item">
                        <i class="fas fa-phone"></i>
                        ${member.noTelp}
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-coins text-yellow-500"></i>
                        <span class="poin-text">${member.poin || 0} poin</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-shopping-cart"></i>
                        ${formatRupiah(member.totalTransaksi || 0)}
                    </div>
                </div>
            </div>
            <div class="action-buttons">
                <span class="poin-info">Poin rate: 3%</span>
                <button onclick="pilihMember('${member.id}')" class="action-button">
                    <i class="fas fa-check"></i>
                    Pilih
                </button>
            </div>
        `;
        
        memberContainer.appendChild(memberElement);
    });

    searchStats.textContent = `Total Member: ${daftarMember.length}`;
}

function cariMember() {
    const inputCari = document.getElementById('inputCariMember').value.toLowerCase();
    const memberContainer = document.getElementById('daftarMemberContainer');
    const memberCards = memberContainer.getElementsByClassName('member-card');
    const searchStats = document.getElementById('searchStats');
    
    let visibleCount = 0;
    const activeFilter = document.querySelector('.filter-tags .active').textContent.toLowerCase();

    Array.from(memberCards).forEach(card => {
        const nama = card.dataset.nama;
        const noTelp = card.dataset.notelp;
        const type = card.dataset.type;
        
        const matchesSearch = nama.includes(inputCari) || noTelp.includes(inputCari);
        const matchesFilter = activeFilter === 'semua' || type === activeFilter;
        
        card.style.display = (matchesSearch && matchesFilter) ? 'flex' : 'none';
        
        if (matchesSearch && matchesFilter) visibleCount++;
    });

    updateSearchStats(visibleCount, memberCards.length, inputCari);
}

function filterMembers(filter) {
    const tags = document.querySelectorAll('.filter-tags .tag');
    tags.forEach(tag => tag.classList.remove('active'));
    event.target.classList.add('active');
    cariMember();
}

function updateSearchStats(visible, total, searchTerm) {
    const searchStats = document.getElementById('searchStats');
    if (searchTerm) {
        searchStats.textContent = `Ditemukan ${visible} dari ${total} member`;
    } else {
        searchStats.textContent = `Total Member: ${total}`;
    }

    const memberContainer = document.getElementById('daftarMemberContainer');
    const noResultsElement = memberContainer.querySelector('.empty-state');
    
    if (visible === 0) {
        if (!noResultsElement) {
            memberContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Tidak ada hasil untuk pencarian "${searchTerm}"</p>
                </div>
            `;
        }
    } else if (noResultsElement) {
        noResultsElement.remove();
    }
}

function pilihMember(memberId) {
    const members = JSON.parse(localStorage.getItem('members')) || [];
    const memberTerpilih = members.find(m => m.id === memberId);

    if (memberTerpilih) {
        localStorage.setItem('memberTransaksi', JSON.stringify(memberTerpilih));
        document.getElementById('popupMember').style.display = 'none';
        lanjutkanPembayaran(memberTerpilih);
    }
}

// Pastikan untuk memanggil fungsi muatDaftarMember saat halaman dimuat
document.addEventListener('DOMContentLoaded', muatDaftarMember);


function tutupPopupMember() {
    const popup = document.getElementById('popupMember'); // Ganti dengan ID yang sesuai
    if (popup) {
        popup.style.display = 'none'; // Menyembunyikan popup
    }
}

function lanjutkanPembayaran(member) {
    // Ambil data keranjang dari localStorage
    let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    let totalAkhir = keranjang.reduce((total, item) => total + item.total, 0);

    // Validasi elemen-elemen kunci
    const popupElement = document.getElementById('popup');
    const totalBayarElement = document.getElementById('totalBayar');
    const totalBayarQRISElement = document.getElementById('totalBayarQRIS');

    if (!popupElement || !totalBayarElement || !totalBayarQRISElement) {
        console.error('Elemen popup pembayaran tidak ditemukan');
        Swal.fire({
            icon: 'error',
            title: 'Kesalahan',
            text: 'Terjadi kesalahan dalam memuat popup pembayaran.',
            confirmButtonColor: '#ff6b6b',
        });
        return;
    }

    // Reset metode pembayaran
    const metodeCash = document.getElementById('metodeCash');
    const metodeQRIS = document.getElementById('metodeQRIS');
    if (metodeCash) metodeCash.style.display = 'none';
    if (metodeQRIS) metodeQRIS.style.display = 'none';

    // Tampilkan popup pembayaran
    popupElement.style.display = 'flex';

    // Validate total
    if (totalAkhir < 0) {
        console.error('Total cannot be negative:', totalAkhir);
        totalAkhir = 0;
    }

    // Set total bayar
    totalBayarElement.innerText = formatRupiah(totalAkhir, '', false);
    totalBayarQRISElement.innerText = formatRupiah(totalAkhir, '', false);

    // Reset input dan kembalian
    const nominalCashInput = document.getElementById('nominalCash');
    const kembalianElement = document.getElementById('kembalian');
    if (nominalCashInput) nominalCashInput.value = '';
    if (kembalianElement) kembalianElement.innerText = '0';

    // Tambahkan informasi member
    const popupContent = document.querySelector('.popup-content');
    if (popupContent) {
        // Hapus info member sebelumnya jika ada
        let existingInfoMember = document.getElementById('infoMember');
        if (existingInfoMember) {
            existingInfoMember.remove();
        }

        // Buat elemen info member baru
        const infoMemberElement = document.createElement('div');
        infoMemberElement.id = 'infoMember';
        infoMemberElement.style.cssText = 'margin-bottom: 10px; text-align: center;';

        if (member) {
            // Hitung poin berdasarkan final total
            const poinBaru = hitungPoin(totalAkhir);
            
            // Cek status member (VIP atau Regular)
            const isVip = (member.totalTransaksi || 0) > 1000000;
            const memberStatus = isVip ? 'VIP' : 'Regular';
            const statusColor = isVip ? '#ffd700' : '#64748b';
            
            infoMemberElement.innerHTML = `
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <div style="background-color: #ebf5ff; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <i class="fas fa-user" style="font-size: 20px; color: #3b82f6;"></i>
                        </div>
                        <div style="text-align: left;">
                            <strong style="font-size: 18px; color: #1e293b;">${member.nama}</strong>
                            <div style="display: inline-block; margin-left: 8px; background-color: ${statusColor}25; color: ${statusColor}; font-size: 12px; font-weight: bold; padding: 3px 10px; border-radius: 20px;">
                                ${memberStatus}
                            </div>
                            <div style="font-size: 14px; color: #64748b; margin-top: 5px;">ID: ${member.id} | No. Telp: ${member.noTelp}</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                        <div style="text-align: center; flex: 1;">
                            <div style="font-size: 12px; color: #64748b;">Poin Saat Ini</div>
                            <div style="font-size: 18px; font-weight: bold; color: #d97706;">${member.poin || 0}</div>
                        </div>
                        <div style="width: 1px; background-color: #e2e8f0;"></div>
                        <div style="text-align: center; flex: 1;">
                            <div style="font-size: 12px; color: #64748b;">Poin Baru</div>
                            <div style="font-size: 18px; font-weight: bold; color: #16a34a;">+${poinBaru}</div>
                        </div>
                        <div style="width: 1px; background-color: #e2e8f0;"></div>
                        <div style="text-align: center; flex: 1;">
                            <div style="font-size: 12px; color: #64748b;">Total Poin</div>
                            <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${(member.poin || 0) + poinBaru}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
                        <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">Total Transaksi Member</div>
                        <div style="font-size: 16px; font-weight: bold; color: #334155;">${formatRupiah(member.totalTransaksi || 0)}</div>
                    </div>
                </div>
            `;
        } else {
            infoMemberElement.innerHTML = `
                <div style="background-color: #f8fafc; border-radius: 12px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 5px;">
                        <div style="background-color: #fee2e2; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                            <i class="fas fa-user-slash" style="font-size: 18px; color: #ef4444;"></i>
                        </div>
                        <div style="text-align: left;">
                            <strong style="font-size: 16px; color: #1e293b;">Transaksi Non-Member</strong>
                        </div>
                    </div>
                    <div style="margin-top: 10px; padding: 8px; background-color: #fffbeb; border-radius: 8px; border-left: 3px solid #f59e0b;">
                        <div style="font-size: 13px; color: #92400e;">
                            <i class="fas fa-info-circle" style="margin-right: 5px;"></i>
                            Transaksi ini tidak akan mendapatkan poin. Member dapat memperoleh poin hingga 3% dari total belanja.
                        </div>
                    </div>
                </div>
            `;
        }

        // Sisipkan elemen info member sebelum tombol metode pembayaran
        const metodePembayaranButton = popupContent.querySelector('.payment-methods');
        if (metodePembayaranButton) {
            popupContent.insertBefore(infoMemberElement, metodePembayaranButton);
        } else {
            popupContent.appendChild(infoMemberElement);
        }
    }

    // Simpan atau hapus informasi member
    if (member) {
        localStorage.setItem('memberTransaksi', JSON.stringify(member));
    } else {
        localStorage.removeItem('memberTransaksi');
    }

    // Setup event listener untuk konfirmasi pembayaran
    setupKonfirmasiPembayaran(totalAkhir, keranjang, member);
}

// Fungsi untuk setup event listener konfirmasi pembayaran
function setupKonfirmasiPembayaran(totalAkhir, keranjang, member) {
    // Catatan: ID tombol konfirmasi di HTML tidak sesuai, gunakan tombol 'process-btn'
    const processButtons = document.querySelectorAll('.process-btn');

    const idTransaksi = 'TRX-' + Date.now();
    const memberId = member ? member.id : null;
    const poin = member ? hitungPoin(totalAkhir) : 0;

    processButtons.forEach(button => {
        button.addEventListener('click', () => {
            const metode = button.closest('.payment-section').id === 'metodeCash' ? 'Cash' : 'QRIS';

            if (metode === 'Cash') {
                const nominalCash = parseInt(document.getElementById('nominalCash').value) || 0;
                const kembalian = nominalCash - totalAkhir;

                if (nominalCash < totalAkhir) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Nominal Kurang',
                        text: 'Nominal yang dimasukkan kurang dari total bayar.',
                        confirmButtonColor: '#ff6b6b',
                    });
                    return;
                }

                // Simpan transaksi
                const success = simpanTransaksi(
                    'Cash',
                    totalAkhir,
                    kembalian,
                    idTransaksi,
                    keranjang.map(item => ({
                        kode: item.kodeBarang,
                        nama: item.namaBarang,
                        jumlah: item.jumlah,
                        harga: item.hargaJual,
                        total: item.total,
                        potongan: item.potongan || 0
                    })),
                    memberId,
                    poin,
                    nominalCash
                );

                if (success) {
                    // Tutup popup
                    document.getElementById('popup').style.display = 'none';
                    // Bersihkan keranjang dan member
                    localStorage.removeItem('keranjang');
                    localStorage.removeItem('memberTransaksi');

                    // Tampilkan notifikasi sukses
                    Swal.fire({
                        icon: 'success',
                        title: 'Transaksi Berhasil',
                        text: `Transaksi ${idTransaksi} telah disimpan.`,
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Menyimpan Transaksi',
                        text: 'Terjadi kesalahan saat menyimpan transaksi.',
                        confirmButtonColor: '#ff6b6b',
                    });
                }
            } else if (metode === 'QRIS') {
                // Validasi checkbox untuk QRIS
                const checkbox = document.getElementById('checkbox');
                if (!checkbox.checked) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Persetujuan Diperlukan',
                        text: 'Harap setujui transaksi sebelum melanjutkan.',
                        confirmButtonColor: '#ff6b6b',
                    });
                    return;
                }

                // Simpan transaksi
                const success = simpanTransaksi(
                    'QRIS',
                    totalAkhir,
                    0, // Tidak ada kembalian untuk QRIS
                    idTransaksi,
                    keranjang.map(item => ({
                        kode: item.kodeBarang,
                        nama: item.namaBarang,
                        jumlah: item.jumlah,
                        harga: item.hargaJual,
                        total: item.total,
                        potongan: item.potongan || 0
                    })),
                    memberId,
                    poin,
                    totalAkhir
                );

                if (success) {
                    // Tutup popup
                    document.getElementById('popup').style.display = 'none';
                    // Bersihkan keranjang dan member
                    localStorage.removeItem('keranjang');
                    localStorage.removeItem('memberTransaksi');

                    // Tampilkan notifikasi sukses
                    Swal.fire({
                        icon: 'success',
                        title: 'Transaksi Berhasil',
                        text: `Transaksi ${idTransaksi} telah disimpan.`,
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Menyimpan Transaksi',
                        text: 'Terjadi kesalahan saat menyimpan transaksi.',
                        confirmButtonColor: '#ff6b6b',
                    });
                }
            }
        });
    });
}
// Fungsi pembantu untuk memilih metode pembayaran
function createNominalButton(nominal, container) {
    const button = document.createElement('button');
    button.className = 'nominal-button';
    button.textContent = formatRupiah(nominal);
    button.onclick = () => {
        document.getElementById('nominalCash').value = nominal;
        updateKembalian();
    };
    container.appendChild(button);
}

// Fungsi untuk menghasilkan nominal default
function generateDefaultNominals(total) {
    const defaultNominals = [];
    const roundedTotal = Math.ceil(total/1000) * 1000; // Pembulatan ke atas ke ribuan terdekat
    
    // Nominal default: total + 1000, + 2000, + 5000
    defaultNominals.push(roundedTotal);
    defaultNominals.push(roundedTotal + 1000);
    defaultNominals.push(roundedTotal + 2000);
    defaultNominals.push(roundedTotal + 5000);
    
    // Pembulatan ke puluhan ribu terdekat ke atas
    const roundedTenThousand = Math.ceil(total/10000) * 10000;
    defaultNominals.push(roundedTenThousand);
    
    // Nominal bulat terdekat (50rb, 100rb, dst)
    if (total < 50000) defaultNominals.push(50000);
    if (total < 100000) defaultNominals.push(100000);
    
    return [...new Set(defaultNominals)].sort((a, b) => a - b);
}

// Fungsi untuk menghasilkan nominal analisa
function generateAnalysisNominals(total) {
    const analysisNominals = [];
    
    // Pembulatan ke ribuan terdekat
    const roundedThousand = Math.ceil(total/1000) * 1000;
    analysisNominals.push(roundedThousand);
    
    // Pembulatan ke lima ribuan terdekat
    const roundedFiveThousand = Math.ceil(total/5000) * 5000;
    analysisNominals.push(roundedFiveThousand);
    
    // Pembulatan ke puluhan ribu terdekat
    const roundedTenThousand = Math.ceil(total/10000) * 10000;
    analysisNominals.push(roundedTenThousand);
    
    // Nominal psikologis (sedikit di atas total)
    const psychologicalAmount = Math.ceil((total + 999)/1000) * 1000;
    if (!analysisNominals.includes(psychologicalAmount)) {
        analysisNominals.push(psychologicalAmount);
    }
    
    return [...new Set(analysisNominals)].sort((a, b) => a - b);
}

// Modifikasi fungsi pilihMetode
function pilihMetode(metode) {
    const metodeCash = document.getElementById('metodeCash');
    const metodeQRIS = document.getElementById('metodeQRIS');
    
    if (metodeCash && metodeQRIS) {
        if (metode === 'cash') {
            metodeCash.style.display = 'block';
            metodeQRIS.style.display = 'none';
            
            // Ambil total dari keranjang
            const keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
            const total = keranjang.reduce((sum, item) => sum + item.total, 0);
            
            // Persiapkan container
            const defaultContainer = document.getElementById('defaultNominals');
            const analysisContainer = document.getElementById('analysisNominals');
            
            // Bersihkan container
            defaultContainer.innerHTML = '';
            analysisContainer.innerHTML = '';
            
            // Generate dan tampilkan nominal default
            const defaultNominals = generateDefaultNominals(total);
            defaultNominals.forEach(nominal => createNominalButton(nominal, defaultContainer));
            
            // Generate dan tampilkan nominal analisa
            const analysisNominals = generateAnalysisNominals(total);
            analysisNominals.forEach(nominal => createNominalButton(nominal, analysisContainer));
            
        } else if (metode === 'qris') {
            metodeCash.style.display = 'none';
            metodeQRIS.style.display = 'block';
        }
    }
}

// Fungsi untuk update kembalian
function updateKembalian() {
    const nominalInput = document.getElementById('nominalCash');
    const totalElement = document.getElementById('totalBayar');
    const kembalianElement = document.getElementById('kembalian');

    // Parse nilai dari format rupiah
    const nominal = parseRupiahToNumber(nominalInput.value);
    const total = parseRupiahToNumber(totalElement.textContent);

    // Hitung dan tampilkan kembalian
    const kembalian = nominal - total;
    kembalianElement.textContent = kembalian >= 0 ? formatRupiah(kembalian, '', false) : '0';
}

// Fungsi untuk menutup popup
function tutupPopup() {
    const popup = document.getElementById('popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Fungsi format Rupiah dengan opsi tambahan
function formatRupiah(angka, prefix = 'Rp ', cetak = true) {
    if (typeof angka !== 'number') {
        angka = parseFloat(angka);
    }
    
    if (isNaN(angka)) {
        return 'Rp 0';
    }
    
    let numberString = angka.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return cetak ? `${prefix}${numberString}` : `${numberString}`;
}

// Fungsi untuk parse rupiah ke number
function parseRupiahToNumber(rupiahString) {
    if (!rupiahString) return 0;
    
    // Hapus simbol Rp, titik, koma, dan spasi
    const cleanedString = rupiahString.replace(/[^\d,]/g, '');
    
    // Ganti koma dengan titik untuk parsing float
    const numberString = cleanedString.replace(',', '.');
    
    // Parse ke float
    return parseFloat(numberString) || 0;
}

function bayar() {
    let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    if (keranjang.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Keranjang Kosong',
            text: 'Tambahkan barang ke keranjang terlebih dahulu.',
            confirmButtonColor: '#ff6b6b', // Warna tombol
        });
        return;
    }

    // Konfirmasi penggunaan member menggunakan SweetAlert2
    Swal.fire({
        title: '<strong>Transaksi Menggunakan Member?</strong>',
        html: 'Apakah transaksi ini <b>menggunakan member</b>? Pilih opsi di bawah.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-check"></i> Ya, Gunakan Member',
        cancelButtonText: '<i class="fas fa-times"></i> Tidak',
        confirmButtonColor: '#4caf50', // Warna tombol konfirmasi
        cancelButtonColor: '#f44336', // Warna tombol batal
        backdrop: `rgba(0, 0, 0, 0.4)`,
    }).then((result) => {
        if (result.isConfirmed) {
            // Pastikan popup member ada
            const popupMember = document.getElementById('popupMember');
            if (popupMember) {
                popupMember.style.display = 'flex';
                muatDaftarMember();
            } else {
                console.error('Popup member tidak ditemukan');
                Swal.fire({
                    icon: 'error',
                    title: 'Kesalahan',
                    text: 'Terjadi kesalahan dalam memuat daftar member.',
                    confirmButtonColor: '#ff6b6b',
                });
            }
        } else if (result.isDismissed) {
            // Lanjutkan proses pembayaran tanpa member
            Swal.fire({
                icon: 'info',
                title: 'Proses Berlanjut',
                text: 'Pembayaran akan dilanjutkan tanpa menggunakan member.',
                confirmButtonColor: '#3085d6',
            }).then(() => {
                lanjutkanPembayaran(null);
            });
        }
    });
}

// Fungsi menghitung poin dari total belanja
function hitungPoin(totalBelanja) {
    // Logika perhitungan poin dengan aturan yang spesifik
    if (totalBelanja >= 1000 && totalBelanja < 10000) {
        // Untuk total belanja 1rb-10rb, ambil 3 digit pertama
        let poin = parseInt(totalBelanja.toString().substring(0, 3));
        return poin > 0 ? poin - 1 : 0;
    } else if (totalBelanja >= 10000 && totalBelanja < 100000) {
        // Untuk total belanja 10rb-100rb, ambil 3 digit pertama
        let poin = parseInt(totalBelanja.toString().substring(0, 3));
        return poin > 0 ? poin - 1 : 0;
    } else if (totalBelanja >= 100000 && totalBelanja < 1000000) {
        // Untuk total belanja 100rb-1jt, ambil 4 digit pertama
        let poin = parseInt(totalBelanja.toString().substring(0, 4));
        return poin > 0 ? poin - 1 : 0;
    } else if (totalBelanja >= 1000000 && totalBelanja < 10000000) {
        // Untuk total belanja 1jt-10jt, ambil 4 digit pertama
        let poin = parseInt(totalBelanja.toString().substring(0, 4));
        return poin > 0 ? poin - 1 : 0;
    } else if (totalBelanja >= 10000000) {
        // Untuk total belanja di atas 10jt, ambil 5 digit pertama
        let poin = parseInt(totalBelanja.toString().substring(0, 5));
        return poin > 0 ? poin - 1 : 0;
    }
    
    return 0;
}

// Tambahkan event listener untuk menghitung kembalian secara real-time
document.addEventListener('DOMContentLoaded', function() {
    const nominalCashInput = document.getElementById('nominalCash');
    const totalBayarSpan = document.getElementById('totalBayar');
    const kembalianSpan = document.getElementById('kembalian');

    nominalCashInput.addEventListener('input', function() {
        // Ambil keranjang dari localStorage
        let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
        
        // Hitung total
        let total = keranjang.reduce((total, item) => total + item.total, 0);
        
        // Tampilkan total di span
        totalBayarSpan.textContent = formatRupiah(total).replace('Rp. ', '');

        // Ambil nominal yang diinput
        const nominal = parseFloat(this.value) || 0;

        // Hitung kembalian
        if (nominal >= total) {
            const kembalian = nominal - total;
            kembalianSpan.textContent = formatRupiah(kembalian).replace('Rp. ', '');
        } else {
            kembalianSpan.textContent = '0';
        }
    });
});







// Modifikasi fungsi prosesPembayaran untuk validasi
function parseRupiahToNumber(rupiahString) {
    // Hapus semua karakter non-digit
    const numericString = rupiahString.replace(/[^\d]/g, '');
    return parseFloat(numericString) || 0;
}

function prosesPembayaran(metode) {
    let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    if (keranjang.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'Keranjang Kosong',
            text: 'Tidak ada barang dalam keranjang untuk diproses.',
            confirmButtonColor: '#ff6b6b',
        });
        return;
    }

    const memberTransaksi = JSON.parse(localStorage.getItem('memberTransaksi'));
    const idTransaksi = generateIdTransaksi();

    // Hitung total akhir
    let total = keranjang.reduce((total, item) => total + item.total, 0);
    
    // Hitung poin yang akan didapatkan
    const poinDiperoleh = memberTransaksi ? hitungPoin(total) : 0;

    if (metode === 'cash') {
        const nominalInput = document.getElementById('nominalCash');
        const nominal = parseRupiahToNumber(nominalInput.value);
        
        if (isNaN(nominal) || nominal <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Input Tidak Valid',
                text: 'Mohon masukkan nominal pembayaran yang valid.',
                confirmButtonColor: '#ff6b6b',
            });
            return;
        }

        if (nominal < total) {
            Swal.fire({
                icon: 'error',
                title: 'Pembayaran Kurang',
                text: `Total yang harus dibayar: ${formatRupiah(total)}`,
                confirmButtonColor: '#ff6b6b',
            });
            return;
        }

        const kembalian = nominal - total;

        // Simpan transaksi dengan informasi poin
        simpanTransaksi(metode, total, kembalian, idTransaksi, keranjang, memberTransaksi?.id, poinDiperoleh, nominal);

        // Proses poin untuk member
        if (memberTransaksi) {
            tambahPoinKeMember(memberTransaksi, total, metode, idTransaksi, poinDiperoleh);
        }

        // Reset form dan tutup popup
        nominalInput.value = '';
        document.getElementById('kembalian').textContent = '0';
        document.getElementById('popup').style.display = 'none';

        // Update stok barang yang sudah dijual
        updateStokTerjual(keranjang);

        // Kosongkan keranjang
        localStorage.removeItem('keranjang');
        loadKeranjang();

        // Tampilkan struk dan notifikasi sukses
        Swal.fire({
            icon: 'success',
            title: 'Pembayaran Berhasil',
            text: `Kembalian: ${formatRupiah(kembalian)}`,
            confirmButtonColor: '#4caf50',
        }).then(() => {
            cetakStruk(idTransaksi);
        });

    } else if (metode === 'qris') {
        // Validasi checkbox persetujuan QRIS
        const qrisCheckbox = document.getElementById('checkbox');
        if (!qrisCheckbox || !qrisCheckbox.checked) {
            Swal.fire({
                icon: 'warning',
                title: 'Persetujuan Diperlukan',
                text: 'Mohon centang persetujuan transaksi QRIS.',
                confirmButtonColor: '#ff6b6b',
            });
            return;
        }

        // Simpan transaksi dengan informasi poin
        simpanTransaksi(metode, total, 0, idTransaksi, keranjang, memberTransaksi?.id, poinDiperoleh, total);

        // Proses poin untuk member
        if (memberTransaksi) {
            tambahPoinKeMember(memberTransaksi, total, metode, idTransaksi, poinDiperoleh);
        }

        // Tutup popup pembayaran
        document.getElementById('popup').style.display = 'none';

        // Update stok barang yang sudah dijual
        updateStokTerjual(keranjang);

        // Kosongkan keranjang
        localStorage.removeItem('keranjang');
        loadKeranjang();

        // Tampilkan struk dan notifikasi sukses
        Swal.fire({
            icon: 'success',
            title: 'Pembayaran QRIS Berhasil',
            text: `Total Pembayaran: ${formatRupiah(total)}`,
            confirmButtonColor: '#4caf50',
        }).then(() => {
            cetakStruk(idTransaksi);
        });
    }
}

function updateStokTerjual(keranjang) {
    let barang = JSON.parse(localStorage.getItem('barang')) || [];
    
    // Update terjual dan stok for each item
    keranjang.forEach(item => {
        const barangIndex = barang.findIndex(b => b.kode === item.kode);
        if (barangIndex !== -1) {
            // Make sure terjual is properly updated
            if (!barang[barangIndex].terjual) {
                barang[barangIndex].terjual = 0;
            }
            barang[barangIndex].terjual += item.jumlah;
            
            // Optional: You can update stock here if needed, but it seems like
            // this is already handled when adding items to cart
        }
    });
    
    // Save updated barang data
    localStorage.setItem('barang', JSON.stringify(barang));
}

function tambahPoinKeMember(memberData, totalBelanja, metode, idTransaksi, poinDiperoleh) {
    // Jika poin tidak diberikan sebagai parameter, hitung ulang
    if (poinDiperoleh === undefined) {
        poinDiperoleh = hitungPoin(totalBelanja);
    }
    
    // Ambil data semua member
    let members = JSON.parse(localStorage.getItem('members')) || [];
    const memberIndex = members.findIndex(m => m.id === memberData.id);
    
    if (memberIndex !== -1) {
        // Dapatkan data member
        const member = members[memberIndex];
        
        // Hitung total poin baru
        const poinLama = member.poin || 0;
        const poinBaru = poinLama + poinDiperoleh;
        
        // Update poin member
        members[memberIndex].poin = poinBaru;
        
        // Tambahkan total transaksi ke akun member jika belum ada
        if (!members[memberIndex].totalTransaksi) {
            members[memberIndex].totalTransaksi = 0;
        }
        members[memberIndex].totalTransaksi += totalBelanja;
        
        // Tambahkan ke riwayat poin member
        if (!members[memberIndex].pointHistory) {
            members[memberIndex].pointHistory = [];
        }
        
        // Format tanggal transaksi
        const tanggalTransaksi = new Date().toISOString();
        
        // Buat catatan transaksi
        const catatanTransaksi = `Pembelian - ID: ${idTransaksi} (${metode.toUpperCase()})`;
        
        // Tambahkan entri baru ke riwayat poin
        members[memberIndex].pointHistory.push({
            date: tanggalTransaksi,
            amount: poinDiperoleh,
            type: 'add',
            note: catatanTransaksi,
            balance: poinBaru
        });
        
        // Update riwayat transaksi member jika belum ada
        if (!members[memberIndex].transaksiHistory) {
            members[memberIndex].transaksiHistory = [];
        }
        
        // Tambahkan transaksi ke riwayat dengan poin
        members[memberIndex].transaksiHistory.push({
            id: idTransaksi,
            tanggal: tanggalTransaksi,
            total: totalBelanja,
            metode: metode,
            poin: poinDiperoleh
        });
        
        // Simpan kembali data member
        localStorage.setItem('members', JSON.stringify(members));
        
        // Tampilkan notifikasi poin jika berhasil ditambahkan
        if (poinDiperoleh > 0) {
            tampilkanNotifikasiPoin(poinDiperoleh, poinBaru);
        }
    }
}

// Pastikan fungsi formatRupiah mendukung kembalian dengan atau tanpa prefix
function formatRupiah(angka, prefix = 'Rp. ', showPrefix = true) {
    const numberString = angka.toString().replace(/[^,\d]/g, '');
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
        const separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
    return showPrefix ? (prefix + rupiah) : rupiah;
}

function prosesPoinMember(memberTransaksi, total, metode, idTransaksi, keranjang, kembalian, nominal) {
    // Hitung poin yang akan didapatkan (3% dari total belanja)
    const poinDidapatkan = memberTransaksi ? hitungPoin(total) : 0;

    // Jika menggunakan member
    if (memberTransaksi) {
        // Update data member
        let members = JSON.parse(localStorage.getItem('members')) || [];
        const memberIndex = members.findIndex(m => m.id === memberTransaksi.id);

        if (memberIndex !== -1) {
            // Tambahkan poin ke akun member
            members[memberIndex].poin = (members[memberIndex].poin || 0) + poinDidapatkan;
            members[memberIndex].totalTransaksi = (members[memberIndex].totalTransaksi || 0) + total;
            
            // Simpan kembali data member yang diupdate
            localStorage.setItem('members', JSON.stringify(members));

            // Tampilkan notifikasi poin
            tampilkanNotifikasiPoin(poinDidapatkan, members[memberIndex].poin);
        }

        // Simpan transaksi dengan detail poin
        simpanTransaksi(
            metode, 
            total, 
            kembalian, 
            idTransaksi, 
            keranjang, 
            memberTransaksi.id,
            poinDidapatkan,
            nominal
        );
    } else {
        // Transaksi non-member
        simpanTransaksi(
            metode, 
            total, 
            kembalian, 
            idTransaksi, 
            keranjang,
            null,
            0,
            nominal
        );
    }
}

    

function tampilkanNotifikasiPoin(poinDidapatkan, totalPoin) {
    const modalPoin = document.createElement('div');
    modalPoin.className = 'modal-poin';
    modalPoin.innerHTML = `
        <div class="modal-content-poin">
            <div class="modal-header-poin">
                <i class="fas fa-coins text-yellow-500 text-4xl mb-3"></i>
                <h2>Selamat!</h2>
            </div>
            <div class="modal-body-poin">
                <p class="poin-earned">+${poinDidapatkan} poin</p>
                <p class="total-poin">Total poin Anda: ${totalPoin}</p>
            </div>
            <button class="close-button-poin" onclick="this.parentElement.parentElement.remove()">
                Tutup
            </button>
        </div>
    `;
    
    document.body.appendChild(modalPoin);

    // Auto close after 3 seconds
    setTimeout(() => {
        modalPoin.remove();
    }, 3000);
}

// Tambahkan CSS untuk styling
const style = document.createElement('style');
style.textContent = `
    .member-card {
        background: #ffffff;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        transition: all 0.3s ease;
        border: 1px solid #edf2f7;
    }

    .member-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-color: #4299e1;
    }

    .member-info {
        flex: 1;
    }

    .member-name {
        font-size: 18px;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .member-status {
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 500;
    }

    .status-vip {
        background: linear-gradient(135deg, #ffd700, #ffa500);
        color: #744210;
    }

    .status-regular {
        background: #edf2f7;
        color: #4a5568;
    }

    .member-details {
        display: flex;
        gap: 20px;
        color: #718096;
        font-size: 14px;
    }

    .detail-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .poin-text {
        color: #d69e2e;
        font-weight: 500;
    }

    .action-buttons {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
    }

    .poin-info {
        font-size: 12px;
        color: #718096;
        font-weight: 500;
    }

    .action-button {
        background: #4299e1;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s;
    }

    .action-button:hover {
        background: #3182ce;
    }

    .modal-poin {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    }

    .modal-content-poin {
        background: white;
        padding: 30px;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        min-width: 300px;
    }

    .modal-header-poin {
        margin-bottom: 20px;
    }

    .modal-header-poin h2 {
        font-size: 24px;
        color: #2d3748;
        margin: 0;
    }

    .modal-body-poin {
        margin-bottom: 20px;
    }

    .poin-earned {
        font-size: 28px;
        color: #d69e2e;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .total-poin {
        color: #718096;
        font-size: 16px;
    }

    .close-button-poin {
        background: #4299e1;
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
    }

    .close-button-poin:hover {
        background: #3182ce;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -40%); }
        to { opacity: 1; transform: translate(-50%, -50%); }
    }
`;

document.head.appendChild(style);


// Fungsi untuk mengkonversi angka ke teks terbilang
function angkaKeTeks(angka) {
    const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    const belasan = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
    const puluhan = ['', 'sepuluh', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];

    if (angka < 0) return 'minus ' + angkaKeTeks(-angka);
    if (angka < 10) return satuan[angka];
    if (angka < 20) return belasan[angka - 10];
    if (angka < 100) return puluhan[Math.floor(angka / 10)] + (angka % 10 !== 0 ? ' ' + satuan[angka % 10] : '');
    if (angka < 200) return 'seratus ' + angkaKeTeks(angka % 100);
    if (angka < 1000) return satuan[Math.floor(angka / 100)] + ' ratus ' + angkaKeTeks(angka % 100);
    if (angka < 2000) return 'seribu ' + angkaKeTeks(angka % 1000);
    if (angka < 1000000) return angkaKeTeks(Math.floor(angka / 1000)) + ' ribu ' + angkaKeTeks(angka % 1000);
    if (angka < 1000000000) return angkaKeTeks(Math.floor(angka / 1000000)) + ' juta ' + angkaKeTeks(angka % 1000000);
    if (angka < 1000000000000) return angkaKeTeks(Math.floor(angka / 1000000000)) + ' milyar ' + angkaKeTeks(angka % 1000000000);
    return 'Angka terlalu besar';
}

// Tambahkan atau perbarui event listener untuk input nominal
document.addEventListener('DOMContentLoaded', function() {
    const nominalCashInput = document.getElementById('nominalCash');
    const totalBayarSpan = document.getElementById('totalBayar');
    const kembalianSpan = document.getElementById('kembalian');

    // Buat elemen untuk menampilkan teks nominal
    const teksNominalDiv = document.createElement('div');
    teksNominalDiv.id = 'teksNominal';
    teksNominalDiv.className = 'teks-nominal';
    nominalCashInput.parentNode.insertBefore(teksNominalDiv, nominalCashInput.nextSibling);

    // Style untuk elemen teks nominal
    const style = document.createElement('style');
    style.textContent = `
        .teks-nominal {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
            font-style: italic;
        }
        
        .nominal-format {
            font-size: 16px;
            color: #333;
            margin-bottom: 5px;
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);

    nominalCashInput.addEventListener('input', function(e) {
        // Format tampilan angka dengan pemisah
        let value = this.value.replace(/\D/g, '');
        let formattedValue = '';
        
        // Tambahkan pemisah titik setiap 3 digit
        for (let i = value.length - 1, j = 0; i >= 0; i--, j++) {
            if (j !== 0 && j % 3 === 0) {
                formattedValue = '.' + formattedValue;
            }
            formattedValue = value[i] + formattedValue;
        }

        // Update nilai input dengan format
        this.value = formattedValue;

        // Tampilkan teks nominal
        const nominal = parseInt(value) || 0;
        const teksNominal = nominal > 0 ? angkaKeTeks(nominal) : '';
        
        // Format tampilan
        teksNominalDiv.innerHTML = nominal > 0 ? `
            <div class="nominal-format">Rp ${formattedValue}</div>
            <div>${teksNominal} rupiah</div>
        ` : '';

        // Hitung kembalian
        const total = parseFloat(totalBayarSpan.textContent.replace(/\D/g, '')) || 0;
        const kembalian = nominal - total;
        
        if (kembalian >= 0) {
            kembalianSpan.textContent = formatRupiah(kembalian).replace('Rp. ', '');
        } else {
            kembalianSpan.textContent = '0';
        }
    });

    // Tambahkan event untuk mencegah input karakter non-angka dan titik
    nominalCashInput.addEventListener('keypress', function(e) {
        if (!/[\d.]/.test(e.key)) {
            e.preventDefault();
        }
    });
});

// Modifikasi createNominalButton untuk menggunakan format baru
function createNominalButton(nominal, container) {
    const button = document.createElement('button');
    button.className = 'nominal-button';
    button.textContent = formatRupiah(nominal);
    button.onclick = () => {
        const nominalInput = document.getElementById('nominalCash');
        // Format nominal dengan pemisah
        let formattedValue = nominal.toString();
        let result = '';
        for (let i = formattedValue.length - 1, j = 0; i >= 0; i--, j++) {
            if (j !== 0 && j % 3 === 0) {
                result = '.' + result;
            }
            result = formattedValue[i] + result;
        }
        nominalInput.value = result;
        // Trigger event input untuk mengupdate teks nominal
        nominalInput.dispatchEvent(new Event('input'));
    };
    container.appendChild(button);
}



function convertNominalToNumber(nominalString) {
    // Hapus semua karakter non-digit (titik sebagai pemisah ribuan)
    return parseInt(nominalString.replace(/\./g, '')) || 0;
}


function simpanTransaksi(metode, total, kembalian, idTransaksi, keranjang, memberId = null, poin = 0, nominal = 0) {
    // Get existing transaction data
    let transaksi = [];
    let transaksiMetode = [];
    
    try {
        // Try to get all transactions
        const storedTransaksi = localStorage.getItem('transaksi');
        if (storedTransaksi) {
            transaksi = JSON.parse(storedTransaksi);
        }
        
        // Try to get method-specific transactions
        const methodKey = `transaksi_${metode}`;
        const storedTransaksiMetode = localStorage.getItem(methodKey);
        if (storedTransaksiMetode) {
            transaksiMetode = JSON.parse(storedTransaksiMetode);
        }
        
        // Ensure both are arrays
        if (!Array.isArray(transaksi)) transaksi = [];
        if (!Array.isArray(transaksiMetode)) transaksiMetode = [];
    } catch (error) {
        console.error("Error retrieving transaction data:", error);
        transaksi = [];
        transaksiMetode = [];
    }

    // Ambil tanggal saja tanpa waktu (YYYY-MM-DD)
    const now = new Date();
    const tanggal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Prepare new transaction entries
    const newTransaksiEntries = [];
    
    // Iterate through cart items and create transaction entries
    keranjang.forEach((item) => {
        const transactionEntry = {
            id: idTransaksi,
            kodeBarang: item.kode,
            namaBarang: item.nama,
            jumlah: item.jumlah,
            harga: item.harga || item.hargaJual,
            total: item.total,
            nominal: nominal, // Amount paid
            kembalian: kembalian,
            metode: metode,
            diskon: item.potongan || 0,
            persenDiskon: item.potongan || 0,
            tanggal: tanggal, // Tanggal hanya sampai YYYY-MM-DD
            memberId: memberId,
            poin: poin // Include the points in each transaction entry
        };
        
        newTransaksiEntries.push(transactionEntry);
    });
    
    // Add to both transaction arrays
    transaksi = [...transaksi, ...newTransaksiEntries];
    transaksiMetode = [...transaksiMetode, ...newTransaksiEntries];
    
    try {
        // Save all transactions
        localStorage.setItem('transaksi', JSON.stringify(transaksi));
        
        // Save method-specific transactions
        const methodKey = `transaksi_${metode}`;
        localStorage.setItem(methodKey, JSON.stringify(transaksiMetode));
        
        console.log(`Transaction ${idTransaksi} saved successfully with ${poin} points on ${tanggal}`);
        return true;
    } catch (error) {
        console.error("Error saving transaction:", error);
        
        // Try saving with fewer items if it fails (localStorage might be full)
        try {
            const recentTransaksi = transaksi.slice(-100);
            const recentTransaksiMetode = transaksiMetode.slice(-50);
            
            localStorage.setItem('transaksi', JSON.stringify(recentTransaksi));
            localStorage.setItem(`transaksi_${metode}`, JSON.stringify(recentTransaksiMetode));
            
            console.log("Saved with reduced transaction history");
            return true;
        } catch (fallbackError) {
            console.error("Failed to save even with reduced history:", fallbackError);
            return false;
        }
    }
}
function formatRupiah(angka) {
    return 'Rp. ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function cetakStruk(idTransaksi) {
    // Konstanta untuk format struk
    const LEBAR_STRUK = 42; // lebar struk dalam karakter
    const NAMA_TOKO = 'FXID STORE';
    const ALAMAT_TOKO = 'Jl. Merdeka No. 88, Kota';

    // Fungsi bantuan untuk format Rupiah
    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    }

    // Ambil transaksi dari localStorage
    let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];
    
    // Log untuk debug
    console.log(`Looking for transaction ID: ${idTransaksi}`);
    console.log(`Total transactions in storage: ${transaksi.length}`);
    
    // Filter transaksi berdasarkan ID
    const transaksiTerpilih = transaksi.filter(item => item.id === idTransaksi);
    
    console.log(`Found ${transaksiTerpilih.length} matching transactions`);

    if (transaksiTerpilih.length > 0) {
        // Fungsi untuk membuat garis pemisah
        function garisPemisah(karakter = '-') {
            return karakter.repeat(LEBAR_STRUK);
        }

        // Fungsi untuk memusatkan teks
        function pusatkanTeks(teks, lebar = LEBAR_STRUK) {
            const sisaSpasi = lebar - teks.length;
            const spasiBagiriKiri = Math.floor(sisaSpasi / 2);
            const spasiBagianKanan = sisaSpasi - spasiBagiriKiri;
            return ' '.repeat(spasiBagiriKiri) + teks + ' '.repeat(spasiBagianKanan);
        }

        // Fungsi untuk membuat baris dengan rata kanan-kiri
        function barisRataKananKiri(kiri, kanan, lebar = LEBAR_STRUK) {
            const sisaSpasi = lebar - (kiri.length + kanan.length);
            return kiri + ' '.repeat(sisaSpasi) + kanan;
        }

        // Fungsi untuk memotong teks agar sesuai lebar
        function potongTeks(teks, panjang) {
            return teks.length > panjang 
                ? teks.substring(0, panjang - 3) + '...' 
                : teks.padEnd(panjang);
        }

        // Fungsi untuk membuat struk cetak
        function buatStruk() {
            let struk = [];

            // Header Toko
            struk.push(pusatkanTeks(NAMA_TOKO));
            struk.push(pusatkanTeks(ALAMAT_TOKO));
            struk.push(garisPemisah('='));

            // Informasi Transaksi
            const waktuTransaksi = new Date().toLocaleString('id-ID', {
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit'
            });

            struk.push(barisRataKananKiri('ID Transaksi:', idTransaksi));
            struk.push(barisRataKananKiri('Tanggal:', waktuTransaksi));
            
            // Tambahkan informasi Member jika ada
            if (transaksiTerpilih[0].memberId) {
                const members = JSON.parse(localStorage.getItem('members')) || [];
                const member = members.find(m => m.id === transaksiTerpilih[0].memberId);
                
                if (member) {
                    struk.push(barisRataKananKiri('Member:', member.nama));
                    struk.push(barisRataKananKiri('ID Member:', member.id));
                }
            }
            
            struk.push(garisPemisah('='));

            // Header Kolom
            struk.push(
                potongTeks('Nama Barang', 20).padEnd(20) + 
                potongTeks('Qty', 6).padEnd(6) + 
                potongTeks('Harga', 16)
            );
            struk.push(garisPemisah());

            // Item Transaksi
            let totalTransaksi = 0;
            const uniqueItems = new Map();
            
            // Kelompokkan item berdasarkan kode barang untuk menghindari duplikasi
            transaksiTerpilih.forEach(item => {
                const key = item.kodeBarang;
                if (uniqueItems.has(key)) {
                    const existingItem = uniqueItems.get(key);
                    existingItem.jumlah += item.jumlah;
                    existingItem.total += item.total;
                } else {
                    uniqueItems.set(key, {
                        namaBarang: item.namaBarang,
                        jumlah: item.jumlah,
                        total: item.total
                    });
                }
                totalTransaksi += item.total;
            });
            
            // Cetak item-item unik
            uniqueItems.forEach(item => {
                const namaBarang = potongTeks(item.namaBarang, 20);
                const qty = potongTeks(item.jumlah.toString(), 6);
                const harga = potongTeks(formatRupiah(item.total), 16);
                
                struk.push(
                    namaBarang.padEnd(20) + 
                    qty.padEnd(6) + 
                    harga
                );
            });

            // Footer Transaksi
            struk.push(garisPemisah());
            struk.push(barisRataKananKiri('Total:', formatRupiah(totalTransaksi)));
            struk.push(barisRataKananKiri('Metode Bayar:', transaksiTerpilih[0].metode.toUpperCase()));
            struk.push(barisRataKananKiri('Nominal:', formatRupiah(transaksiTerpilih[0].nominal || totalTransaksi)));
            struk.push(barisRataKananKiri('Kembalian:', formatRupiah(transaksiTerpilih[0].kembalian || 0)));
            
            // Tambahkan informasi poin jika transaksi menggunakan member
            if (transaksiTerpilih[0].memberId && transaksiTerpilih[0].poin > 0) {
                struk.push(garisPemisah('-'));
                struk.push(barisRataKananKiri('Poin Didapat:', `+${transaksiTerpilih[0].poin} poin`));
                
                // Cari total poin member saat ini
                const members = JSON.parse(localStorage.getItem('members')) || [];
                const member = members.find(m => m.id === transaksiTerpilih[0].memberId);
                if (member) {
                    struk.push(barisRataKananKiri('Total Poin Member:', `${member.poin} poin`));
                }
            }
            
            struk.push(garisPemisah('='));

            // Penutup
            struk.push(pusatkanTeks('Terima Kasih'));
            struk.push(pusatkanTeks('Barang yang sudah dibeli'));
            struk.push(pusatkanTeks('tidak dapat dikembalikan'));

            // Gabungkan array menjadi teks
            return struk.join('\n');
        }

   function buatStrukWhatsApp() {
    let struk = [];
    const LEBAR_STRUK = 42; // Lebar struk untuk konsistensi
    const LEBAR_LABEL = 13; // Lebar untuk label seperti "ID Transaksi", "Total", dll.
    const LEBAR_NILAI = LEBAR_STRUK - LEBAR_LABEL - 1; // Lebar untuk nilai, termasuk spasi

    // Fungsi untuk membuat garis pemisah
    function garisPemisah(karakter = '-') {
        return karakter.repeat(LEBAR_STRUK);
    }

    // Fungsi untuk memusatkan teks
    function pusatkanTeks(teks, lebar = LEBAR_STRUK) {
        const sisaSpasi = lebar - teks.length;
        const spasiKiri = Math.floor(sisaSpasi / 2);
        const spasiKanan = sisaSpasi - spasiKiri;
        return ' '.repeat(spasiKiri) + teks + ' '.repeat(spasiKanan);
    }

    // Fungsi untuk memotong teks agar sesuai lebar (digunakan untuk item transaksi)
    function potongTeks(teks, panjang) {
        return teks.length > panjang 
            ? teks.substring(0, panjang - 3) + '...' 
            : teks.padEnd(panjang);
    }

    // Fungsi untuk membuat baris label-nilai
    function barisLabelNilai(label, nilai) {
        // Potong nilai jika terlalu panjang untuk LEBAR_NILAI
        const nilaiPotong = nilai.length > LEBAR_NILAI 
            ? nilai.substring(0, LEBAR_NILAI - 3) + '...' 
            : nilai;
        return `${label.padEnd(LEBAR_LABEL)}: ${nilaiPotong.padStart(LEBAR_NILAI)}`;
    }

    // Header Toko
    struk.push('```'); // Mulai blok kode untuk font monospace
    struk.push(pusatkanTeks(NAMA_TOKO, LEBAR_STRUK));
    struk.push(pusatkanTeks(ALAMAT_TOKO, LEBAR_STRUK));
    struk.push(garisPemisah('='));

    // Informasi Transaksi
    const waktuTransaksi = new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    struk.push(barisLabelNilai('ID Transaksi', idTransaksi));
    struk.push(barisLabelNilai('Tanggal', waktuTransaksi));
    
    // Tambahkan informasi Member jika ada
    if (transaksiTerpilih[0].memberId) {
        const members = JSON.parse(localStorage.getItem('members')) || [];
        const member = members.find(m => m.id === transaksiTerpilih[0].memberId);
        
        if (member) {
            struk.push(barisLabelNilai('Member', member.nama));
            struk.push(barisLabelNilai('ID Member', member.id));
        }
    }
    
    struk.push(garisPemisah('='));

    // Header Kolom
    struk.push(
        potongTeks('Nama Barang', 20).padEnd(20) + 
        potongTeks('Qty', 6).padStart(6) + 
        potongTeks('Harga', 16).padStart(16)
    );
    struk.push(garisPemisah('-'));

    // Item Transaksi
    let totalTransaksi = 0;
    const uniqueItems = new Map();
    
    // Kelompokkan item berdasarkan kode barang untuk menghindari duplikasi
    transaksiTerpilih.forEach(item => {
        const key = item.kodeBarang;
        if (uniqueItems.has(key)) {
            const existingItem = uniqueItems.get(key);
            existingItem.jumlah += item.jumlah;
            existingItem.total += item.total;
        } else {
            uniqueItems.set(key, {
                namaBarang: item.namaBarang,
                jumlah: item.jumlah,
                total: item.total
            });
        }
        totalTransaksi += item.total;
    });
    
    // Cetak item-item unik
    uniqueItems.forEach(item => {
        const namaBarang = potongTeks(item.namaBarang, 20);
        const qty = item.jumlah.toString().padStart(3).padEnd(6);
        const harga = formatRupiah(item.total).padStart(16);
        
        struk.push(
            namaBarang.padEnd(20) + 
            qty + 
            harga
        );
    });

    // Footer Transaksi
    struk.push(garisPemisah('-'));
    struk.push(barisLabelNilai('Total', formatRupiah(totalTransaksi)));
    struk.push(barisLabelNilai('Metode Bayar', transaksiTerpilih[0].metode.toUpperCase()));
    struk.push(barisLabelNilai('Nominal', formatRupiah(transaksiTerpilih[0].nominal || totalTransaksi)));
    struk.push(barisLabelNilai('Kembalian', formatRupiah(transaksiTerpilih[0].kembalian || 0)));
    
    // Tambahkan informasi poin jika transaksi menggunakan member
    if (transaksiTerpilih[0].memberId && transaksiTerpilih[0].poin > 0) {
        struk.push(garisPemisah('-'));
        struk.push(barisLabelNilai('Poin Didapat', `+${transaksiTerpilih[0].poin} poin`));
        
        // Cari total poin member saat ini
        const members = JSON.parse(localStorage.getItem('members')) || [];
        const member = members.find(m => m.id === transaksiTerpilih[0].memberId);
        if (member) {
            struk.push(barisLabelNilai('Total Poin', `${member.poin} poin`));
        }
    }
    
    struk.push(garisPemisah('='));
    
    // Penutup
    struk.push(pusatkanTeks('Terima Kasih', LEBAR_STRUK));
    struk.push(pusatkanTeks('Barang yang sudah dibeli', LEBAR_STRUK));
    struk.push(pusatkanTeks('tidak dapat dikembalikan', LEBAR_STRUK));
    struk.push('```'); // Akhiri blok kode

    // Gabungkan array menjadi teks
    return struk.join('\n');
}

        // Fungsi untuk mengirim struk ke WhatsApp
        async function kirimStrukKeWhatsApp(nomorWA) {
            const struk = buatStrukWhatsApp();

            // Bersihkan nomor WhatsApp (hapus karakter non-digit)
            const nomorBersih = nomorWA.replace(/\D/g, '');

            // Tambahkan kode negara jika belum ada
            const nomorLengkap = nomorBersih.startsWith('62') 
                ? nomorBersih 
                : `62${nomorBersih.replace(/^0+/, '')}`;

            // Encode struk untuk URL
            const strukEncoded = encodeURIComponent(struk);

            // Buat URL WhatsApp
            const whatsappURL = `https://wa.me/${nomorLengkap}?text=${strukEncoded}`;

            // Buka WhatsApp di tab baru
            window.open(whatsappURL, '_blank');
        }

        // Fungsi untuk memvalidasi nomor telepon
        function isValidPhoneNumber(noTelp) {
            const phoneRegex = /^(0|62|\+62)?[0-9]{9,12}$/;
            return phoneRegex.test(noTelp);
        }

        // Fungsi untuk menampilkan dialog input nomor WhatsApp
        function tanyaNomorWA() {
            Swal.fire({
                title: '<div class="text-2xl font-bold text-gray-800 mb-2">Kirim ke WhatsApp</div>',
                html: `
                    <div class="flex flex-col items-center mb-6">
                        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fab fa-whatsapp text-3xl text-green-500"></i>
                        </div>
                        <p class="text-gray-600">Masukkan nomor WhatsApp untuk menerima struk</p>
                    </div>
                `,
                input: 'tel',
                inputAttributes: {
                    pattern: '[0-9]*',
                    placeholder: '081234567890',
                    class: 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all'
                },
                showCancelButton: true,
                confirmButtonText: 'Kirim',
                cancelButtonText: 'Batal',
                customClass: {
                    container: 'font-sans',
                    popup: 'rounded-2xl shadow-2xl',
                    confirmButton: 'bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-all',
                    cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition-all',
                    input: 'text-lg'
                },
                buttonsStyling: false,
                inputValidator: (value) => {
                    if (!value) {
                        return 'Nomor WhatsApp harus diisi!';
                    }
                    if (!isValidPhoneNumber(value)) {
                        return 'Format nomor WhatsApp tidak valid!';
                    }
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    kirimStrukKeWhatsApp(result.value);
                }
            });
        }

        // Dialog utama dengan desain modern
        Swal.fire({
            title: '<div class="text-2xl font-bold text-gray-800 mb-4">Detail Struk Transaksi</div>',
            html: `
                <div class="max-w-2xl mx-auto bg-white rounded-2xl overflow-hidden">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                        <div class="flex justify-between items-center">
                            <div>
                                <h3 class="text-xl font-bold">ID: ${idTransaksi}</h3>
                                <p class="text-blue-100 mt-1">${new Date().toLocaleDateString('id-ID', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric'
                                })}</p>
                            </div>
                            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <i class="fas fa-receipt text-2xl"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Receipt Preview -->
                    <div class="p-6">
                        <div class="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-gray-700 font-semibold">Preview Struk</h4>
                                <span class="text-sm text-gray-500">
                                    <i class="fas fa-eye mr-1"></i> Preview
                                </span>
                            </div>
                            <pre id="strukPreview" class="font-mono text-sm leading-relaxed overflow-y-auto 
                                max-h-96 whitespace-pre-wrap text-gray-600 bg-white p-4 rounded-lg border 
                                border-gray-200"></pre>
                        </div>

                        <!-- Action Buttons -->
                        <div class="grid grid-cols-1 gap-4">
                            <button id="printDownloadBtn" 
                                class="flex items-center justify-center px-6 py-3 bg-blue-600 text-white 
                                rounded-xl hover:bg-blue-700 transition-all transform hover:scale-[1.02] 
                                active:scale-[0.98] shadow-lg hover:shadow-xl">
                                <i class="fas fa-print mr-3"></i>
                                Cetak & Unduh Struk
                            </button>
                            
                            <button id="whatsappBtn" 
                                class="flex items-center justify-center px-6 py-3 bg-green-500 text-white 
                                rounded-xl hover:bg-green-600 transition-all transform hover:scale-[1.02] 
                                active:scale-[0.98] shadow-lg hover:shadow-xl">
                                <i class="fab fa-whatsapp mr-3"></i>
                                Kirim via WhatsApp
                            </button>
                            
                            <button id="cancelBtn" 
                                class="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 
                                rounded-xl hover:bg-gray-300 transition-all transform hover:scale-[1.02] 
                                active:scale-[0.98]">
                                <i class="fas fa-times mr-3"></i>
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: false,
            width: '40rem',
            padding: '0',
            customClass: {
                popup: 'rounded-2xl shadow-2xl',
                container: 'font-sans'
            },
            didRender: () => {
                const struk = buatStruk();
                document.getElementById('strukPreview').textContent = struk;

                // Print & Download handler dengan animasi loading
                document.getElementById('printDownloadBtn').addEventListener('click', async () => {
                    const btn = document.getElementById('printDownloadBtn');
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-3"></i>Memproses...';
                    btn.disabled = true;

                    try {
                        // Print window dengan styling modern
                        const printWindow = window.open('', '', 'height=600,width=400');
                        printWindow.document.write(`
                            <html>
                                <head>
                                    <style>
                                        @page { 
                                            size: 80mm auto;
                                            margin: 0;
                                        }
                                        body { 
                                            display: flex; 
                                            justify-content: center;
                                            padding: 10mm;
                                            font-family: 'Courier New', monospace;
                                            background: #f9fafb;
                                        }
                                        pre { 
                                            white-space: pre-wrap; 
                                            font-size: 10px;
                                            width: 76mm;
                                            background: white;
                                            padding: 5mm;
                                            border-radius: 5px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                        }
                                        @media print {
                                            body { 
                                                padding: 0;
                                                background: none;
                                            }
                                            pre {
                                                box-shadow: none;
                                            }
                                        }
                                    </style>
                                </head>
                                <body>
                                    <pre>${struk}</pre>
                                </body>
                            </html>
                        `);
                        printWindow.document.close();
                        await printWindow.print();

                        // Download dengan nama file yang lebih informatif
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const blob = new Blob([struk], { type: 'text/plain' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `Struk_${idTransaksi}_${timestamp}.txt`;
                        link.click();

                        Swal.close();
                    } catch (error) {
                        console.error('Error:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Terjadi Kesalahan',
                            text: 'Gagal mencetak atau mengunduh struk.',
                            confirmButtonColor: '#ff6b6b',
                        });
                    } finally {
                        btn.innerHTML = '<i class="fas fa-print mr-3"></i>Cetak & Unduh Struk';
                        btn.disabled = false;
                    }
                });

                // Handler untuk tombol WhatsApp
                document.getElementById('whatsappBtn').addEventListener('click', () => {
                    if (transaksiTerpilih[0].memberId) {
                        const members = JSON.parse(localStorage.getItem('members')) || [];
                        const member = members.find(m => m.id === transaksiTerpilih[0].memberId);

                        if (member && isValidPhoneNumber(member.noTelp)) {
                            Swal.fire({
                                icon: 'info',
                                title: '<div class="text-2xl font-bold text-gray-800 mb-2">Mengirim Struk</div>',
                                html: `
                                    <p class="text-gray-600">Struk akan dikirim ke nomor WhatsApp member:</p>
                                    <p class="text-lg font-semibold text-green-600 mt-2">${member.noTelp}</p>
                                `,
                                showConfirmButton: false,
                                timer: 2000,
                                customClass: {
                                    popup: 'rounded-2xl shadow-2xl',
                                    container: 'font-sans'
                                }
                            });
                            kirimStrukKeWhatsApp(member.noTelp);
                        } else {
                            Swal.fire({
                                icon: 'warning',
                                title: '<div class="text-2xl font-bold text-gray-800 mb-2">Nomor Tidak Valid</div>',
                                html: `
                                    <p class="text-gray-600">Nomor telepon member tidak valid atau tidak ditemukan.</p>
                                    <p class="text-gray-600 mt-2">Masukkan nomor WhatsApp secara manual.</p>
                                `,
                                confirmButtonText: 'Lanjutkan',
                                customClass: {
                                    popup: 'rounded-2xl shadow-2xl',
                                    container: 'font-sans',
                                    confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all'
                                },
                                buttonsStyling: false
                            }).then(() => {
                                tanyaNomorWA();
                            });
                        }
                    } else {
                        tanyaNomorWA();
                    }
                });

                document.getElementById('cancelBtn').addEventListener('click', () => Swal.close());
            }
        });
    } else {
        // Dialog error dengan desain yang sesuai
        Swal.fire({
            icon: 'error',
            title: '<div class="text-2xl font-bold text-gray-800 mb-2">Transaksi Tidak Ditemukan</div>',
            html: `
                <p class="text-gray-600">ID transaksi ${idTransaksi} tidak ditemukan dalam sistem.</p>
                <div class="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle mt-0.5 mr-2"></i>
                        <div>
                            <p class="font-medium">Detail Kesalahan:</p>
                            <ul class="mt-1 ml-4 list-disc">
                                <li>Total transaksi dalam sistem: ${transaksi.length}</li>
                                <li>ID yang dicari: ${idTransaksi}</li>
                                <li>Coba segarkan halaman dan lakukan transaksi ulang</li>
                            </ul>
                        </div>
                    </div>
                </div>`,
            confirmButtonText: 'Tutup',
            customClass: {
                popup: 'rounded-2xl shadow-2xl',
                container: 'font-sans',
                confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all'
            },
            buttonsStyling: false
        });
    }
}


// Fungsi untuk format rupiah
function formatRupiah(value) {
    return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


function cariSaranBarang() {
    // Pastikan elemen saran sudah ada
    let saranDiv = document.getElementById('saranBarang');
    if (!saranDiv) {
        // Buat elemen saran jika belum ada
        saranDiv = document.createElement('div');
        saranDiv.id = 'saranBarang';
        saranDiv.style.position = 'absolute';
        saranDiv.style.border = '1px solid rgba(0, 0, 0, 0.1)';
        saranDiv.style.borderRadius = '10px'; // Sudut melengkung
        saranDiv.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)'; // Bayangan lebih lembut
        saranDiv.style.maxHeight = '250px'; // Tinggi maksimal lebih besar
        saranDiv.style.overflowY = 'auto';
        saranDiv.style.backgroundColor = 'white';
        saranDiv.style.padding = '10px'; // Padding untuk ruang di dalam
        saranDiv.style.transition = 'all 0.3s ease'; // Animasi transisi
        saranDiv.style.zIndex = '1000';

        // Letakkan di dekat input
        const inputContainer = document.getElementById('kodeNamaBarang').parentNode;
        inputContainer.style.position = 'relative';
        inputContainer.appendChild(saranDiv);
    }

    const input = document.getElementById('kodeNamaBarang').value.toLowerCase();
    let barang = JSON.parse(localStorage.getItem('barang')) || [];

    // Hanya tampilkan saran jika input tidak kosong
    if (input) {
        // Filter barang sesuai input (cari kode atau nama)
        const saran = barang.filter(item => 
            item.kode.toLowerCase().startsWith(input) || item.nama.toLowerCase().includes(input)
        );

        // Bersihkan elemen saran sebelumnya
        saranDiv.innerHTML = '';

        if (saran.length === 0) {
            // Jika tidak ada hasil
            const noResult = document.createElement('div');
            noResult.textContent = 'Tidak ada barang ditemukan.';
            noResult.style.color = '#888';
            noResult.style.textAlign = 'center';
            noResult.style.padding = '10px';
            saranDiv.appendChild(noResult);
        } else {
            // Tampilkan saran jika ada data yang cocok
            saran.forEach(item => {
                const saranItem = document.createElement('div');
                saranItem.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <b>${item.kode}</b> - ${item.nama}
                        </div>
                        <div style="color: #007BFF; font-weight: bold;">Rp${item.hargaJual.toLocaleString()}</div>
                    </div>
                `;
                saranItem.style.padding = '12px';
                saranItem.style.cursor = 'pointer';
                saranItem.style.marginBottom = '6px'; // Jarak antar item
                saranItem.style.borderRadius = '8px'; // Sudut melengkung untuk item
                saranItem.style.backgroundColor = '#f9f9f9'; // Warna latar belakang
                saranItem.style.transition = 'transform 0.2s, background-color 0.3s'; // Animasi hover

                // Fungsi klik pada saran untuk memasukkan data ke input
                saranItem.onclick = () => {
                    document.getElementById('kodeNamaBarang').value = item.kode;
                    document.getElementById('jumlahBarang').value = 1;
                    saranDiv.style.display = 'none'; // Sembunyikan saran setelah dipilih
                };
                
                // Tambahkan efek hover
                saranItem.addEventListener('mouseover', () => {
                    saranItem.style.backgroundColor = '#e6f7ff'; // Warna hover
                    saranItem.style.transform = 'scale(1.02)'; // Efek zoom
                });
                saranItem.addEventListener('mouseout', () => {
                    saranItem.style.backgroundColor = '#f9f9f9'; // Kembali ke warna asli
                    saranItem.style.transform = 'scale(1)'; // Kembali ke ukuran asli
                });

                saranDiv.appendChild(saranItem);
            });
        }

        // Tampilkan div saran
        saranDiv.style.display = 'block';
    } else {
        // Sembunyikan jika input kosong
        saranDiv.style.display = 'none';
    }
}

// Event listener untuk input
document.getElementById('kodeNamaBarang').addEventListener('input', cariSaranBarang);

// Tambahkan event listener untuk menutup saran
document.addEventListener('click', function(event) {
    const saranDiv = document.getElementById('saranBarang');
    if (saranDiv) {
        // Periksa apakah klik di luar area saran
        if (!saranDiv.contains(event.target) && 
            event.target.id !== 'kodeNamaBarang') {
            saranDiv.style.display = 'none';
        }
    }
});

function resetKeranjang() {
    localStorage.removeItem('keranjang');
    loadKeranjang();
    document.getElementById('popup').style.display = 'none';
}

function tutupPopup() {
    document.getElementById('popup').style.display = 'none';
}

function lihatLaporan() {
    window.location.href = 'laporan.html';
}

let counter = 0;

function generateIdTransaksi() {
    // Generate 4-digit random number
    let randomNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    // Get current date and time
    let now = new Date();
    let day = String(now.getDate()).padStart(2, '0');
    let month = String(now.getMonth() + 1).padStart(2, '0');
    let year = String(now.getFullYear()).slice(-2); // Last 2 digits of the year
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');

    // Format date and time
    let dateStr = `${day}${month}${year}`;
    let timeStr = `${hours}${minutes}`;

    // Construct the final ID
    let id = `${randomNumber}-${dateStr}/${timeStr}`;
    return id;
}

function voidBarang(index) {
    // Verifikasi Password dengan tampilan yang lebih modern
    Swal.fire({
        title: '<div class="void-title">Verifikasi Password</div>',
        html: `
            <div class="void-container">
                <div class="void-icon-container">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <p class="void-description">Masukkan password akun untuk melanjutkan proses void</p>
            </div>
        `,
        input: 'password',
        inputPlaceholder: 'Masukkan Password',
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off',
            'aria-label': 'Password'
        },
        customClass: {
            input: 'void-pin-input',
            confirmButton: 'void-primary-btn',
            cancelButton: 'void-cancel-btn',
            popup: 'void-popup'
        },
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-check-circle"></i> Verifikasi',
        cancelButtonText: '<i class="fas fa-times-circle"></i> Batal',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#64748b',
        backdrop: `rgba(38, 55, 74, 0.6)`,
        allowOutsideClick: false,
        buttonsStyling: true,
        focusConfirm: false,
        inputValidator: (value) => {
            if (!value) {
                return 'Password tidak boleh kosong';
            }
        }
    }).then((passwordResult) => {
        // Cek jika user mengklik konfirmasi
        if (passwordResult.isConfirmed) {
            const inputPassword = passwordResult.value;

            // Ambil username akun yang sedang login
            const currentUser = localStorage.getItem('username');
            const loggedIn = localStorage.getItem('loggedIn');

            if (loggedIn !== 'true' || !currentUser) {
                Swal.fire({
                    icon: 'error',
                    title: '<div class="void-title">Tidak Ada Sesi Login</div>',
                    html: `
                        <div class="void-error-container">
                            <i class="fas fa-exclamation-circle void-error-icon"></i>
                            <p class="void-error-message">Tidak ada akun yang sedang login.</p>
                            <div class="void-error-hint">Silakan login terlebih dahulu.</div>
                        </div>
                    `,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444',
                    customClass: {
                        popup: 'void-popup',
                        confirmButton: 'void-danger-btn'
                    }
                }).then(() => {
                    // Redirect ke halaman login
                    window.location.href = 'login.html';
                });
                return;
            }

            // Ambil daftar akun dari localStorage
            let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
            const account = accounts.find(acc => acc.username === currentUser);

            if (!account) {
                Swal.fire({
                    icon: 'error',
                    title: '<div class="void-title">Akun Tidak Ditemukan</div>',
                    html: `
                        <div class="void-error-container">
                            <i class="fas fa-exclamation-circle void-error-icon"></i>
                            <p class="void-error-message">Akun tidak ditemukan.</p>
                            <div class="void-error-hint">Silakan login kembali.</div>
                        </div>
                    `,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444',
                    customClass: {
                        popup: 'void-popup',
                        confirmButton: 'void-danger-btn'
                    }
                }).then(() => {
                    // Redirect ke halaman login
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
                Swal.fire({
                    icon: 'error',
                    title: '<div class="void-title">Kesalahan Sistem</div>',
                    html: `
                        <div class="void-error-container">
                            <i class="fas fa-exclamation-circle void-error-icon"></i>
                            <p class="void-error-message">Terjadi kesalahan saat memverifikasi password.</p>
                            <div class="void-error-hint">Silakan coba lagi atau hubungi administrator.</div>
                        </div>
                    `,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444',
                    customClass: {
                        popup: 'void-popup',
                        confirmButton: 'void-danger-btn'
                    }
                });
                return;
            }

            // Verifikasi password
            if (inputPassword !== decryptedPassword) {
                Swal.fire({
                    icon: 'error',
                    title: '<div class="void-title">Password Salah</div>',
                    html: `
                        <div class="void-error-container">
                            <i class="fas fa-exclamation-circle void-error-icon"></i>
                            <p class="void-error-message">Password yang Anda masukkan tidak valid.</p>
                            <div class="void-error-hint">Silakan coba lagi atau hubungi supervisor.</div>
                        </div>
                    `,
                    confirmButtonText: 'Coba Lagi',
                    confirmButtonColor: '#ef4444',
                    customClass: {
                        popup: 'void-popup',
                        confirmButton: 'void-danger-btn'
                    }
                });
                return;
            }

            // Password benar, lanjutkan dengan proses void
            let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
            const item = keranjang[index];

            if (!item) {
                Swal.fire({
                    icon: 'error',
                    title: '<div class="void-title">Item Tidak Ditemukan</div>',
                    html: `
                        <div class="void-error-container">
                            <i class="fas fa-search void-error-icon"></i>
                            <p class="void-error-message">Item tidak ditemukan dalam keranjang.</p>
                            <div class="void-error-hint">Kemungkinan item sudah dihapus atau keranjang telah diperbarui.</div>
                        </div>
                    `,
                    confirmButtonText: 'Tutup',
                    confirmButtonColor: '#ef4444',
                    customClass: {
                        popup: 'void-popup',
                        confirmButton: 'void-danger-btn'
                    }
                });
                return;
            }

            // Periksa apakah item sedang dalam stok opname
            const cekStok = JSON.parse(localStorage.getItem(`cekStok_${item.kode}`));
            const isInOpname = cekStok && cekStok.status === 'pending';

            if (isInOpname) {
                Swal.fire({
                    icon: 'error',
                    title: '<div class="void-title">Void Tidak Dapat Dilakukan</div>',
                    html: `
                        <div class="void-error-container">
                            <i class="fas fa-clipboard-list void-error-icon"></i>
                            <p class="void-error-message">Barang ini sedang dalam proses stok opname.</p>
                            <div class="void-error-hint">Silakan tunggu hingga proses stok opname selesai.</div>
                        </div>
                    `,
                    confirmButtonText: 'Tutup',
                    confirmButtonColor: '#ef4444',
                    customClass: {
                        popup: 'void-popup',
                        confirmButton: 'void-danger-btn'
                    }
                });
                return;
            }

            // Format harga dan total untuk ditampilkan
            const formattedHarga = formatRupiah(item.harga);
            const formattedTotal = formatRupiah(item.harga * item.jumlah);

            // Tampilkan detail item dan tanyakan alasan void dengan UI yang ditingkatkan
            Swal.fire({
                title: '<div class="void-title">Void Barang</div>',
                html: `
                    <div class="void-detail-container">
                        <div class="void-product-overview">
                            <div class="void-product-icon">
                                <i class="fas fa-box-open"></i>
                            </div>
                            <div class="void-product-info">
                                <h3 class="void-product-name">${item.nama}</h3>
                                <div class="void-product-code">${item.kode || 'Tanpa Kode'}</div>
                            </div>
                        </div>
                        
                        <div class="void-detail-grid">
                            <div class="void-detail-item">
                                <div class="void-detail-label">Jumlah</div>
                                <div class="void-detail-value">${item.jumlah}</div>
                            </div>
                            <div class="void-detail-item">
                                <div class="void-detail-label">Harga</div>
                                <div class="void-detail-value">${formattedHarga}</div>
                            </div>
                            <div class="void-detail-item">
                                <div class="void-detail-label">Total</div>
                                <div class="void-detail-value void-total">${formattedTotal}</div>
                            </div>
                        </div>
                        
                        <div class="void-reason-section">
                            <label for="swal-alasan-void" class="void-reason-label">
                                <i class="fas fa-question-circle"></i> Alasan Void:
                            </label>
                            <select id="swal-alasan-void" class="void-reason-select">
                                <option value="Kesalahan input">Kesalahan input</option>
                                <option value="Barang rusak">Barang rusak</option>
                                <option value="Pelanggan membatalkan">Pelanggan membatalkan</option>
                                <option value="Kesalahan harga">Kesalahan harga</option>
                                <option value="Stok tidak tersedia">Stok tidak tersedia</option>
                                <option value="Lainnya">Lainnya...</option>
                            </select>
                            
                            <div id="swal-alasan-lain-container" class="void-other-reason" style="display: none;">
                                <label for="swal-alasan-lain" class="void-reason-label">Alasan Lainnya:</label>
                                <input id="swal-alasan-lain" class="void-reason-input" placeholder="Masukkan alasan void...">
                            </div>
                        </div>
                        
                        <div class="void-note">
                            <i class="fas fa-info-circle"></i>
                            Barang yang di-void akan dikembalikan ke stok.
                        </div>
                    </div>
                    
                    <style>
                        .void-title {
                            font-size: 1.5rem;
                            font-weight: 600;
                            color: #1e293b;
                            margin-bottom: 0.5rem;
                        }
                        
                        .void-container {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            margin-bottom: 1rem;
                        }
                        
                        .void-icon-container {
                            width: 60px;
                            height: 60px;
                            border-radius: 50%;
                            background: linear-gradient(135deg, #3b82f6, #2563eb);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-bottom: 1rem;
                            box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
                        }
                        
                        .void-icon-container i {
                            font-size: 24px;
                            color: white;
                        }
                        
                        .void-description {
                            color: #64748b;
                            text-align: center;
                            margin: 0;
                        }
                        
                        .void-pin-input {
                            font-size: 1.1rem !important;
                            padding: 1rem !important;
                            border-radius: 0.5rem !important;
                            border: 1px solid #e2e8f0 !important;
                            text-align: center !important;
                            letter-spacing: 0.25rem !important;
                        }
                        
                        .void-primary-btn {
                            background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
                            border-radius: 0.5rem !important;
                            font-weight: 600 !important;
                            padding: 0.75rem 1.5rem !important;
                            box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2) !important;
                        }
                        
                        .void-cancel-btn {
                            background: #f1f5f9 !important;
                            color: #64748b !important;
                            border-radius: 0.5rem !important;
                            font-weight: 600 !important;
                            padding: 0.75rem 1.5rem !important;
                        }
                        
                        .void-danger-btn {
                            background: linear-gradient(135deg, #ef4444, #dc2626) !important;
                            border-radius: 0.5rem !important;
                            font-weight: 600 !important;
                            padding: 0.75rem 1.5rem !important;
                            box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2) !important;
                        }
                        
                        .void-popup {
                            border-radius: 1rem !important;
                            padding: 1.5rem !important;
                        }
                        
                        .void-error-container {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            text-align: center;
                        }
                        
                        .void-error-icon {
                            font-size: 2.5rem;
                            color: #ef4444;
                            margin-bottom: 1rem;
                        }
                        
                        .void-error-message {
                            font-size: 1.1rem;
                            color: #1e293b;
                            margin-bottom: 0.5rem;
                        }
                        
                        .void-error-hint {
                            font-size: 0.9rem;
                            color: #64748b;
                        }
                        
                        .void-detail-container {
                            text-align: left;
                        }
                        
                        .void-product-overview {
                            display: flex;
                            align-items: center;
                            margin-bottom: 1.5rem;
                            padding-bottom: 1rem;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        
                        .void-product-icon {
                            width: 50px;
                            height: 50px;
                            border-radius: 12px;
                            background-color: #f8fafc;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-right: 1rem;
                            color: #3b82f6;
                            font-size: 1.5rem;
                        }
                        
                        .void-product-info {
                            flex: 1;
                        }
                        
                        .void-product-name {
                            margin: 0;
                            font-size: 1.2rem;
                            font-weight: 600;
                            color: #1e293b;
                        }
                        
                        .void-product-code {
                            font-size: 0.9rem;
                            color: #64748b;
                            margin-top: 0.25rem;
                        }
                        
                        .void-detail-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 1rem;
                            margin-bottom: 1.5rem;
                            background-color: #f8fafc;
                            border-radius: 0.75rem;
                            padding: 1rem;
                        }
                        
                        .void-detail-item {
                            text-align: center;
                        }
                        
                        .void-detail-label {
                            font-size: 0.8rem;
                            color: #64748b;
                            margin-bottom: 0.25rem;
                        }
                        
                        .void-detail-value {
                            font-size: 1.1rem;
                            font-weight: 600;
                            color: #334155;
                        }
                        
                        .void-total {
                            color: #ef4444;
                        }
                        
                        .void-reason-section {
                            margin-bottom: 1.5rem;
                        }
                        
                        .void-reason-label {
                            display: block;
                            font-weight: 500;
                            color: #334155;
                            margin-bottom: 0.5rem;
                        }
                        
                        .void-reason-select, .void-reason-input {
                            width: 100%;
                            padding: 0.75rem;
                            border: 1px solid #e2e8f0;
                            border-radius: 0.5rem;
                            font-size: 1rem;
                            color: #334155;
                            background-color: #f8fafc;
                            transition: all 0.2s;
                        }
                        
                        .void-reason-select:focus, .void-reason-input:focus {
                            outline: none;
                            border-color: #3b82f6;
                            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                            background-color: white;
                        }
                        
                        .void-other-reason {
                            margin-top: 1rem;
                        }
                        
                        .void-note {
                            background-color: #fffbeb;
                            color: #92400e;
                            padding: 0.75rem;
                            border-radius: 0.5rem;
                            font-size: 0.9rem;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                        }
                    </style>
                `,
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-ban"></i> Void Barang',
                cancelButtonText: '<i class="fas fa-times"></i> Batal',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                customClass: {
                    popup: 'void-popup',
                    confirmButton: 'void-danger-btn',
                    cancelButton: 'void-cancel-btn'
                },
                focusConfirm: false,
                didOpen: () => {
                    // Tambahkan event listener untuk dropdown alasan
                    const alasanSelect = document.getElementById('swal-alasan-void');
                    const alasanLainContainer = document.getElementById('swal-alasan-lain-container');
                    
                    alasanSelect.addEventListener('change', function() {
                        alasanLainContainer.style.display = this.value === 'Lainnya' ? 'block' : 'none';
                    });
                }
            }).then((voidResult) => {
                if (voidResult.isConfirmed) {
                    // Dapatkan alasan yang dipilih
                    const alasanSelect = document.getElementById('swal-alasan-void');
                    const alasanLain = document.getElementById('swal-alasan-lain');
                    
                    // Jika elemen tidak ditemukan, berarti modal ditutup secara tidak terduga
                    if (!alasanSelect) {
                        console.error('Tidak dapat menemukan elemen select alasan');
                        return;
                    }
                    
                    let alasan = alasanSelect.value;
                    
                    // Jika "Lainnya" dipilih, ambil alasan kustom
                    if (alasan === 'Lainnya' && alasanLain) {
                        if (!alasanLain.value.trim()) {
                            Swal.fire({
                                icon: 'error',
                                title: '<div class="void-title">Input Diperlukan</div>',
                                html: `
                                    <div class="void-error-container">
                                        <i class="fas fa-exclamation-triangle void-error-icon"></i>
                                        <p class="void-error-message">Alasan void harus diisi.</p>
                                        <div class="void-error-hint">Silakan masukkan alasan untuk melanjutkan proses void.</div>
                                    </div>
                                `,
                                confirmButtonText: 'OK',
                                confirmButtonColor: '#ef4444',
                                customClass: {
                                    popup: 'void-popup',
                                    confirmButton: 'void-danger-btn'
                                }
                            });
                            return;
                        }
                        alasan = alasanLain.value.trim();
                    }
                    
                    // Tampilkan animasi loading saat memproses void
                    Swal.fire({
                        title: '<div class="void-title">Memproses</div>',
                        html: `
                            <div class="void-loading-container">
                                <div class="void-spinner"></div>
                                <p class="void-loading-text">Memproses void barang...</p>
                            </div>
                            
                            <style>
                                .void-loading-container {
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    padding: 1rem;
                                }
                                
                                .void-spinner {
                                    width: 50px;
                                    height: 50px;
                                    border: 4px solid rgba(59, 130, 246, 0.2);
                                    border-radius: 50%;
                                    border-top-color: #3b82f6;
                                    animation: spin 1s linear infinite;
                                    margin-bottom: 1rem;
                                }
                                
                                .void-loading-text {
                                    color: #64748b;
                                }
                                
                                @keyframes spin {
                                    to { transform: rotate(360deg); }
                                }
                            </style>
                        `,
                        showConfirmButton: false,
                        allowOutsideClick: false,
                        customClass: {
                            popup: 'void-popup'
                        },
                        didOpen: () => {
                            // Proses void setelah sedikit delay untuk efek animasi
                            setTimeout(() => {
                                processVoid(index, alasan);
                            }, 800);
                        }
                    });
                }
            });
        }
    });
}
function processVoid(index, alasan) {
    try {
        // Ambil data keranjang, stok, dan catatan void
        let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
        let barang = JSON.parse(localStorage.getItem('barang')) || [];
        let voids = JSON.parse(localStorage.getItem('voids')) || [];
        
        const item = keranjang[index];
        if (!item) {
            Swal.fire({
                icon: 'error',
                title: '<div class="void-title">Error</div>',
                html: `
                    <div class="void-error-container">
                        <i class="fas fa-exclamation-circle void-error-icon"></i>
                        <p class="void-error-message">Item tidak ditemukan dalam keranjang.</p>
                    </div>
                `,
                confirmButtonText: 'Tutup',
                confirmButtonColor: '#ef4444',
                customClass: {
                    popup: 'void-popup',
                    confirmButton: 'void-danger-btn'
                }
            });
            return;
        }

        // Buat kode void dan format tanggal
        const kodeVoid = generateKodeVoid();
        const now = new Date();
        const tanggal = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        // Dapatkan informasi kasir jika tersedia
        const username = localStorage.getItem('username') || 'admin';
        
        // Buat catatan void dengan informasi lengkap
        voids.push({
            kodeVoid: kodeVoid,
            namaBarang: item.nama,
            jumlah: item.jumlah,
            harga: parseFloat(item.harga || 0),
            total: parseFloat(item.total || item.harga * item.jumlah || 0),
            tanggal: tanggal, // Hanya simpan tanggal dalam format baru
            alasan: alasan,
            kasir: username,
            kodeBarang: item.kode
        });
        
        // Simpan catatan void
        localStorage.setItem('voids', JSON.stringify(voids));

        // Kembalikan stok barang ke inventaris
        const barangItem = barang.find(b => b.kode === item.kode);
        if (barangItem) {
            barangItem.stok += parseInt(item.jumlah);
            barangItem.terjual = (barangItem.terjual || 0) - parseInt(item.jumlah);
            if (barangItem.terjual < 0) barangItem.terjual = 0; // Mencegah nilai negatif
            localStorage.setItem('barang', JSON.stringify(barang));
        }

        // Hapus item dari keranjang
        keranjang.splice(index, 1);
        localStorage.setItem('keranjang', JSON.stringify(keranjang));

        // Muat ulang tampilan keranjang
        loadKeranjang();
        
        // Tampilkan notifikasi sukses dengan animasi
        Swal.fire({
            icon: 'success',
            title: '<div class="void-title">Void Berhasil</div>',
            html: `
                <div class="void-success-container">
                    <div class="void-success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="void-success-info">
                        <p class="void-success-message">Barang berhasil di-void dengan kode:</p>
                        <div class="void-success-code">${kodeVoid}</div>
                    </div>
                    <div class="void-success-details">
                        <div class="void-success-detail">
                            <span class="void-detail-key">Alasan:</span>
                            <span class="void-detail-value">${alasan}</span>
                        </div>
                        <div class="void-success-detail">
                            <span class="void-detail-key">Tanggal:</span>
                            <span class="void-detail-value">${tanggal}</span>
                        </div>
                        <div class="void-success-detail">
                            <span class="void-detail-key">Kasir:</span>
                            <span class="void-detail-value">${username}</span>
                        </div>
                    </div>
                </div>
                
                <style>
                    .void-success-container {
                        text-align: center;
                        padding: 1rem;
                    }
                    
                    .void-success-icon {
                        font-size: 3rem;
                        color: #22c55e;
                        margin-bottom: 1rem;
                        animation: pulse 1.5s infinite;
                    }
                    
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                        100% { transform: scale(1); }
                    }
                    
                    .void-success-message {
                        font-size: 1rem;
                        color: #334155;
                        margin-bottom: 0.5rem;
                    }
                    
                    .void-success-code {
                        font-family: monospace;
                        font-size: 1.2rem;
                        font-weight: 700;
                        color: #1e293b;
                        padding: 0.5rem 1rem;
                        background-color: #f1f5f9;
                        border-radius: 0.5rem;
                        display: inline-block;
                        margin-bottom: 1rem;
                    }
                    
                    .void-success-details {
                        text-align: left;
                        background-color: #f8fafc;
                        border-radius: 0.5rem;
                        padding: 1rem;
                    }
                    
                    .void-success-detail {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 0.5rem;
                        font-size: 0.9rem;
                    }
                    
                    .void-success-detail:last-child {
                        margin-bottom: 0;
                    }
                    
                    .void-detail-key {
                        color: #64748b;
                    }
                    
                    .void-detail-value {
                        color: #334155;
                        font-weight: 500;
                    }
                </style>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Tutup',
            timer: 5000,
            timerProgressBar: true,
            customClass: {
                popup: 'void-popup',
                confirmButton: 'void-primary-btn'
            }
        });
        
    } catch (error) {
        console.error('Error dalam processVoid:', error);
        Swal.fire({
            icon: 'error',
            title: '<div class="void-title">Error</div>',
            html: `
                <div class="void-error-container">
                    <i class="fas fa-bug void-error-icon"></i>
                    <p class="void-error-message">Terjadi kesalahan saat memproses void:</p>
                    <div class="void-error-details">${error.message}</div>
                </div>
                
                <style>
                    .void-error-details {
                        font-family: monospace;
                        background-color: #fee2e2;
                        padding: 0.75rem;
                        border-radius: 0.5rem;
                        font-size: 0.9rem;
                        color: #991b1b;
                        margin-top: 0.5rem;
                        text-align: left;
                        max-height: 100px;
                        overflow-y: auto;
                    }
                </style>
            `,
            confirmButtonText: 'Tutup',
            confirmButtonColor: '#ef4444',
            customClass: {
                popup: 'void-popup',
                confirmButton: 'void-danger-btn'
            }
        });
    }
}




function generateKodeVoid() {
    // Generate a more structured void code: V-[DATE]-[RANDOM]
    const date = new Date();
    const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const timePart = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase();
    
    return `V-${datePart}-${timePart}-${randomPart}`;
}
function downloadExcel() {
    document.body.classList.add('loading');  // Tambahkan kelas loading ke body
    document.getElementById('download-animation').style.display = 'block';

    setTimeout(() => {
        let barang = JSON.parse(localStorage.getItem('barang')) || [];

        let workbook = XLSX.utils.book_new();
        let worksheet_data = [['Kode', 'Nama', 'Harga Beli', 'Harga Jual', 'Stok', 'Terjual', 'Keuntungan']];
        barang.forEach(item => {
            worksheet_data.push([
                item.kode,
                item.nama,
                item.hargaBeli,
                item.hargaJual,
                item.stok,
                item.terjual,
                item.terjual * (item.hargaJual - item.hargaBeli)
            ]);
        });

        let worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);

        // Styling the first row
        let cellStyles = {
            font: { bold: true },
            alignment: { horizontal: 'center' },
            fill: { fgColor: { rgb: 'FFFF00' } }
        };

        worksheet['!cols'] = [
            { wpx: 100 },
            { wpx: 200 },
            { wpx: 100 },
            { wpx: 100 },
            { wpx: 100 },
            { wpx: 100 },
            { wpx: 120 }
        ];

        for (let cell in worksheet) {
            if (worksheet[cell] && typeof worksheet[cell] === 'object') {
                if (worksheet[cell].v === 'Kode' || worksheet[cell].v === 'Nama' || worksheet[cell].v === 'Harga Beli') {
                    worksheet[cell].s = cellStyles;
                }
            }
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Barang');
        XLSX.writeFile(workbook, 'data_barang.xlsx');

        document.body.classList.remove('loading');  // Hapus kelas loading dari body
        document.getElementById('download-animation').style.display = 'none';
    }, 2000);  // Simulasi waktu tunggu download, bisa disesuaikan
}




function uploadExcel() {
    let fileInput = document.getElementById('uploadExcel');
    let file = fileInput.files[0];

    if (!file) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Silakan pilih file Excel terlebih dahulu!'
        });
        return;
    }

    let reader = new FileReader();

    reader.onload = function(e) {
        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, { type: 'array' });
        let firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        // Ambil data dari sheet
        let jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Cek apakah format sesuai (misalnya header: Kode, Nama, Harga Beli, Harga Jual, Stok)
        if (jsonData.length === 0 || !jsonData[0].includes('Kode') || !jsonData[0].includes('Nama')) {
            Swal.fire({
                icon: 'error',
                title: 'Format tidak sesuai',
                text: 'Format file Excel harus memiliki header: Kode, Nama, Harga Beli, Harga Jual, Stok.'
            });
            return;
        }

        let barang = JSON.parse(localStorage.getItem('barang')) || [];

        // Iterasi dari baris kedua karena baris pertama adalah header
        for (let i = 1; i < jsonData.length; i++) {
            let row = jsonData[i];
            let kode = row[0];
            let nama = row[1];
            let hargaBeli = parseFloat(row[2]);
            let hargaJual = parseFloat(row[3]);
            let stok = parseInt(row[4]);

            if (!kode || !nama || isNaN(hargaBeli) || isNaN(hargaJual) || isNaN(stok)) {
                continue;  // Abaikan baris yang tidak valid
            }

            // Cek apakah barang dengan kode ini sudah ada
            let existingItem = barang.find(item => item.kode === kode);

            if (existingItem) {
                if (existingItem.hargaBeli === hargaBeli && existingItem.hargaJual === hargaJual) {
                    console.log(`Item ${nama} sudah ada dengan harga yang sama.`);
                } else {
                    existingItem.hargaBeli = hargaBeli;
                    existingItem.hargaJual = hargaJual;
                    existingItem.stok += stok;  // Tambahkan stok
                    console.log(`Item ${nama} diperbarui dengan harga baru.`);
                }
            } else {
                barang.push({
                    kode: kode,
                    nama: nama,
                    hargaBeli: hargaBeli,
                    hargaJual: hargaJual,
                    stok: stok,
                    terjual: 0
                });
                console.log(`Item ${nama} ditambahkan.`);
            }
        }

        // Simpan data ke localStorage
        localStorage.setItem('barang', JSON.stringify(barang));

        // Muat ulang data barang untuk menampilkan yang terbaru
        loadBarang();

        Swal.fire({
            icon: 'success',
            title: 'Upload Berhasil!',
            text: 'Data barang berhasil di-upload dan disimpan.'
        });
    };

    reader.readAsArrayBuffer(file);
}



function formatRupiah(angka, prefix = 'Rp. ') {
    if (angka === null || angka === undefined) {
        return prefix + '0';
    }

    let numberString = angka.toString().replace(/[^,\d]/g, ''),
        split = numberString.split(','),
        sisa = split[0].length % 3,
        rupiah = split[0].substr(0, sisa),
        ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
        let separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
    return prefix + rupiah;
}

function jalankanBanyakFile() {
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;

    if (files.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Tidak ada file',
            text: 'Pilih setidaknya satu file.',
        });
        return;
    }

    if (files.length > 10) {
        Swal.fire({
            icon: 'error',
            title: 'Terlalu banyak file',
            text: 'Maksimal hanya 10 file yang bisa dipilih.',
        });
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const fileType = file.name.split('.').pop().toLowerCase();
        const storageKey = `file_${fileType}_${i}`;

        reader.onload = function (e) {
            const fileContent = e.target.result;

            // Simpan konten file ke localStorage berdasarkan tipe file
            if (fileType === 'html' || fileType === 'css' || fileType === 'js') {
                // Update jika sudah ada di localStorage
                if (localStorage.getItem(storageKey)) {
                    Swal.fire({
                        icon: 'info',
                        title: 'File diperbarui',
                        text: `${file.name} sudah ada di penyimpanan lokal dan telah diperbarui.`,
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'File berhasil dimuat',
                        text: `${file.name} berhasil dimuat dan disimpan ke penyimpanan lokal`,
                    });
                }

                localStorage.setItem(storageKey, fileContent);

                // Jalankan konten file sesuai tipe
                if (fileType === 'html') {
                    document.open();
                    document.write(fileContent);
                    document.close();
                } else if (fileType === 'css') {
                    const style = document.createElement('style');
                    style.innerHTML = fileContent;
                    document.head.appendChild(style);
                } else if (fileType === 'js') {
                    const script = document.createElement('script');
                    script.innerHTML = fileContent;
                    document.body.appendChild(script);
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'File tidak didukung',
                    text: `${file.name} tidak didukung. Hanya file HTML, CSS, dan JS yang bisa dijalankan.`,
                });
            }
        };

        reader.readAsText(file);
    }
}





document.getElementById('lihatDiskonButton').onclick = lihatDiskon;

function lihatDiskon() {
    let diskon = JSON.parse(localStorage.getItem('diskon')) || [];

    if (diskon.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Tidak Ada Diskon',
            text: 'Belum ada diskon yang ditambahkan ke sistem.',
            confirmButtonColor: '#3b82f6',
            backdrop: `rgba(38, 55, 74, 0.4)`
        });
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let tableHTML = `
        <style>
            .discount-table-container {
                max-height: 60vh;
                overflow-y: auto;
                margin: 20px 0;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            
            .discount-table {
                width: 100%;
                border-collapse: collapse;
                background-color: white;
                font-size: 14px;
            }
            
            .discount-table th {
                background: #f8fafc;
                color: #1e293b;
                font-weight: 600;
                padding: 12px 16px;
                text-align: left;
                position: sticky;
                top: 0;
                z-index: 10;
                border-bottom: 2px solid #e2e8f0;
            }
            
            .discount-table td {
                padding: 12px 16px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
            }
            
            .discount-table tbody tr:hover {
                background-color: #f8fafc;
            }
            
            .discount-badge {
                background: #dbeafe;
                color: #1d4ed8;
                padding: 4px 8px;
                border-radius: 6px;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            .price-info {
                color: #059669;
                font-weight: 500;
            }
            
            .status-badge {
                padding: 4px 8px;
                border-radius: 6px;
                font-weight: 500;
                font-size: 12px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            .status-active {
                background: #dcfce7;
                color: #15803d;
            }
            
            .status-expired {
                background: #fee2e2;
                color: #b91c1c;
            }
            
            .status-upcoming {
                background: #fef9c3;
                color: #854d0e;
            }
            
            .action-btn {
                padding: 6px 12px;
                border-radius: 6px;
                border: none;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s ease;
            }
            
            .delete-btn {
                background: #fee2e2;
                color: #b91c1c;
            }
            
            .delete-btn:hover {
                background: #fecaca;
            }
            
            .export-btn {
                background: #059669;
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s ease;
                margin-top: 20px;
            }
            
            .export-btn:hover {
                background: #047857;
            }
            
            .price-details {
                font-size: 13px;
                color: #64748b;
                margin-top: 4px;
            }
        </style>
        
        <div class="discount-table-container">
            <table class="discount-table">
                <thead>
                    <tr>
                        <th>Nama Barang</th>
                        <th>Diskon & Harga</th>
                        <th>Periode</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
    `;

    diskon.forEach((item, index) => {
        const mulai = new Date(item.tanggalMulai);
        const berakhir = new Date(item.tanggalBerakhir);
        
        let status = getStatusBadge(today, mulai, berakhir);

        tableHTML += `
            <tr>
                <td>
                    ${item.nama}
                    <div class="price-details">Kode: ${item.kode}</div>
                </td>
                <td>
                    <span class="discount-badge">
                        <i class="fas fa-tags"></i>
                        ${item.persenDiskon}%
                    </span>
                    <div class="price-details">
                        Normal: ${formatRupiah(item.hargaNormal)}<br>
                        <span class="price-info">Diskon: ${formatRupiah(item.hargaDiskon)}</span>
                    </div>
                </td>
                <td>
                    ${formatTanggal(item.tanggalMulai)}
                    -<br>
                    ${formatTanggal(item.tanggalBerakhir)}
                </td>
                <td>${status}</td>
                <td>
                    <button 
                        class="action-btn delete-btn" 
                        onclick="hapusDiskon('${item.kode}')"
                    >
                        <i class="fas fa-trash"></i>
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
        
        <div class="table-footer">
            <span class="discount-count">
                Total: ${diskon.length} diskon
            </span>
            <button onclick="exportDiskonToExcel()" class="export-btn">
                <i class="fas fa-file-excel"></i>
                Export Excel
            </button>
        </div>
    `;

    Swal.fire({
        title: 'Daftar Diskon',
        html: tableHTML,
        width: '900px',
        showCloseButton: true,
        showConfirmButton: false,
        background: '#ffffff',
        customClass: {
            title: 'text-xl font-semibold text-gray-800 mb-4'
        }
    });
}

function getStatusBadge(today, mulai, berakhir) {
    if (today < mulai) {
        return '<span class="status-badge status-upcoming"><i class="fas fa-clock"></i> Akan Datang</span>';
    } else if (today > berakhir) {
        return '<span class="status-badge status-expired"><i class="fas fa-times-circle"></i> Berakhir</span>';
    }
    return '<span class="status-badge status-active"><i class="fas fa-check-circle"></i> Aktif</span>';
}

function hapusDiskon(kode) {
    Swal.fire({
        title: 'Hapus Diskon?',
        text: 'Diskon yang dihapus tidak dapat dikembalikan',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            let diskon = JSON.parse(localStorage.getItem('diskon')) || [];
            diskon = diskon.filter(d => d.kode !== kode);
            localStorage.setItem('diskon', JSON.stringify(diskon));
            
            Swal.fire({
                icon: 'success',
                title: 'Diskon Dihapus',
                text: 'Diskon telah berhasil dihapus dari sistem',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                lihatDiskon();
            });
        }
    });
}

function exportDiskonToExcel() {
    let diskon = JSON.parse(localStorage.getItem('diskon')) || [];
    
    if (diskon.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Tidak Ada Data',
            text: 'Tidak ada data diskon untuk diexport',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }

    // Format data for Excel
    const excelData = diskon.map(item => ({
        'Kode Barang': item.kode,
        'Nama Barang': item.nama,
        'Persentase Diskon': `${item.persenDiskon}%`,
        'Harga Normal': item.hargaNormal,
        'Potongan Harga': item.potonganHarga || (item.hargaNormal - item.hargaDiskon),
        'Harga Setelah Diskon': item.hargaDiskon,
        'Tanggal Mulai': formatTanggal(item.tanggalMulai),
        'Tanggal Berakhir': formatTanggal(item.tanggalBerakhir),
        'Status': getDiscountStatus(item),
        'Dibuat Pada': formatTanggal(item.createdAt)
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const colWidths = [
        { wch: 15 }, // Kode Barang
        { wch: 30 }, // Nama Barang
        { wch: 15 }, // Persentase Diskon
        { wch: 15 }, // Harga Normal
        { wch: 15 }, // Potongan Harga
        { wch: 15 }, // Harga Setelah Diskon
        { wch: 15 }, // Tanggal Mulai
        { wch: 15 }, // Tanggal Berakhir
        { wch: 12 }, // Status
        { wch: 20 }  // Dibuat Pada
    ];
    worksheet['!cols'] = colWidths;

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Diskon');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `Daftar_Diskon_${date}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
}

function getDiscountStatus(item) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mulai = new Date(item.tanggalMulai);
    const berakhir = new Date(item.tanggalBerakhir);
    
    if (today < mulai) return 'Akan Datang';
    if (today > berakhir) return 'Berakhir';
    return 'Aktif';
}

function formatTanggal(tanggal) {
    return new Date(tanggal).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}





function masukkanKeranjang(kode, nama, hargaJual, stok) {
    Swal.fire({
        title: `Masukkan Jumlah untuk ${nama}`,
        input: 'number',
        inputAttributes: {
            min: 1,
            max: stok,
            step: 1,
            placeholder: 'Jumlah',
        },
        showCancelButton: true,
        confirmButtonText: 'Masukkan ke Keranjang',
        cancelButtonText: 'Batal',
        inputValidator: (value) => {
            if (!value || value <= 0 || value > stok) {
                return `Jumlah harus antara 1 dan ${stok}`;
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            let jumlah = parseInt(result.value);

            // Simpan barang ke keranjang
            let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
            keranjang.push({
                kode: kode,
                nama: nama,
                hargaJual: hargaJual,
                jumlah: jumlah,
                total: hargaJual * jumlah
            });
            localStorage.setItem('keranjang', JSON.stringify(keranjang));

            // Update stok barang
            let barang = JSON.parse(localStorage.getItem('barang')) || [];
            barang = barang.map(item => {
                if (item.kode === kode) {
                    item.stok -= jumlah; // Kurangi stok dengan jumlah yang dimasukkan
                }
                return item;
            });
            localStorage.setItem('barang', JSON.stringify(barang));

            // Update tampilan stok di tabel
            const row = document.getElementById(`barang-${kode}`);
            if (row) {
                row.cells[2].innerText = barang.find(item => item.kode === kode).stok; // Update stok di tabel
            }

            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: `${jumlah} ${nama} telah ditambahkan ke keranjang.`,
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}



// Check if BarcodeDetector is supported
function isBarcodeDetectorSupported() {
    return 'BarcodeDetector' in window;
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all event listeners
    initializeScannerEvents();
});

// Initialize all scanner-related event listeners
function initializeScannerEvents() {
    const scanButton = document.getElementById('barcodeScanner-btn');
    console.log('Scan Button:', scanButton); // Debugging line
    if (scanButton) {
        scanButton.addEventListener('click', bukaPopupScan);
    }

    const closeButton = document.querySelector('.barcodeScanner-close');
    console.log('Close Button:', closeButton); // Debugging line
    if (closeButton) {
        closeButton.addEventListener('click', tutupPopupScan);
    }

    const rescanButton = document.querySelector('.barcodeScanner-rescan');
    console.log('Rescan Button:', rescanButton); // Debugging line
    if (rescanButton) {
        rescanButton.addEventListener('click', scanUlang);
    }

    const finishButton = document.querySelector('.barcodeScanner-finish');
    console.log('Finish Button:', finishButton); // Debugging line
    if (finishButton) {
        finishButton.addEventListener('click', selesaiScan);
    }
}
// Function to open scan popup
function bukaPopupScan() {
    const popup = document.getElementById('barcodeScanner-popup');
    popup.style.display = 'flex';
    setTimeout(() => {
        popup.classList.add('active');
    }, 10);
    startScan();
}

// Function to close scan popup
function tutupPopupScan() {
    const popup = document.getElementById('barcodeScanner-popup');
    popup.classList.remove('active');
    setTimeout(() => {
        popup.style.display = 'none';
    }, 300);
    stopScan();
}

// Start scanning using camera
async function startScan() {
    const video = document.getElementById('barcodeScanner-video');
    const spinner = document.querySelector('.barcodeScanner-spinner');
    const errorMsg = document.querySelector('.barcodeScanner-error');
    
    if (!video || !spinner || !errorMsg) {
        console.error('Required elements not found');
        return;
    }
    
    // Check if BarcodeDetector is supported
    if (!isBarcodeDetectorSupported()) {
        errorMsg.textContent = 'Maaf, browser Anda tidak mendukung BarcodeDetector API.';
        errorMsg.style.display = 'block';
        tutupPopupScan();
        return;
    }

    try {
        spinner.style.display = 'block';
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });

        video.srcObject = stream;
        video.setAttribute("playsinline", true);

        const scanner = new BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'code_128']
        });

        await video.play();
        spinner.style.display = 'none';

        const scanInterval = setInterval(async () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const barcodes = await scanner.detect(canvas);

                if (barcodes.length > 0) {
                    const code = barcodes[0].rawValue;
                    clearInterval(scanInterval);

                    const successElement = document.querySelector('.barcodeScanner-success');
                    if (successElement) {
                        successElement.style.display = 'flex';
                    }

                    setTimeout(() => {
                        processScannedCode(code);
                    }, 500);
                }
            } catch (error) {
                console.error('Scanning error:', error);
                errorMsg.textContent = 'Error saat memindai: ' + error.message;
                errorMsg.style.display = 'block';
            }
        }, 100);

        video.dataset.scanInterval = scanInterval;

    } catch (error) {
        console.error("Error accessing camera:", error);
        errorMsg.textContent = "Gagal mengakses kamera. Pastikan izin diberikan.";
        errorMsg.style.display = 'block';
        spinner.style.display = 'none';
    }
}

// Process scanned barcode
function processScannedCode(code) {
    const errorMsg = document.querySelector('.barcodeScanner-error');
    if (!errorMsg) return;

    try {
        const barang = JSON.parse(localStorage.getItem('barang')) || [];
        const item = barang.find(item => item.kode === code);

        if (item) {
            const stokTersedia = item.stok;
            const jumlahBarang = parseInt(document.getElementById('jumlahBarang')?.value) || 1;
            
            if (jumlahBarang > stokTersedia) {
                errorMsg.textContent = `Stok tidak cukup! Hanya tersedia ${stokTersedia} barang.`;
                errorMsg.style.display = 'block';
            } else {
                const kodeInput = document.getElementById('kodeNamaBarang');
                const jumlahInput = document.getElementById('jumlahBarang');
                
                if (kodeInput && jumlahInput) {
                    kodeInput.value = code;
                    jumlahInput.value = jumlahBarang;
                    tambahKeKeranjang();
                    errorMsg.style.display = 'none';
                }
            }
        } else {
            errorMsg.textContent = "Barang tidak ditemukan!";
            errorMsg.style.display = 'block';
        }

        showScanOptions();
    } catch (error) {
        console.error("Error processing barcode:", error);
        errorMsg.textContent = "Terjadi kesalahan saat memproses barcode.";
        errorMsg.style.display = 'block';
    }
}

// Stop scanning
function stopScan() {
    const video = document.getElementById('barcodeScanner-video');
    const successElement = document.querySelector('.barcodeScanner-success');
    const errorMsg = document.querySelector('.barcodeScanner-error');
    
    if (video?.srcObject) {
        const intervalId = video.dataset.scanInterval;
        if (intervalId) {
            clearInterval(parseInt(intervalId));
        }

        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }

    if (successElement) successElement.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
}

// Show scan options
function showScanOptions() {
    const optionsContainer = document.getElementById('barcodeScanner-options');
    if (!optionsContainer) return;

    optionsContainer.style.display = 'flex';
    setTimeout(() => {
        optionsContainer.classList.add('active');
    }, 100);
}

// Scan again
function scanUlang() {
    const optionsContainer = document.getElementById('barcodeScanner-options');
    const successElement = document.querySelector('.barcodeScanner-success');
    const errorMsg = document.querySelector('.barcodeScanner-error');
    
    if (optionsContainer) {
        optionsContainer.classList.remove('active');
        optionsContainer.style.display = 'none';
    }
    if (successElement) successElement.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
    
    startScan();
}

// Finish scanning
function selesaiScan() {
    tutupPopupScan();
}

 
// External barcode scanner detection
let isExternalScannerConnected = false;
let lastInputTime = 0;
let accumulatedInput = '';
const SCANNER_THRESHOLD = 50; // Typical barcode scanners input characters within 50ms
const RESET_THRESHOLD = 300; // Reset after 300ms of no input

// Listen for keyboard inputs to detect external scanner
function initExternalScannerDetection() {
    // Create indicator element
    const scannerIndicator = document.createElement('div');
    scannerIndicator.id = 'externalScannerIndicator';
    scannerIndicator.innerHTML = `
        <div class="indicator-content">
            <i class="fas fa-barcode"></i>
            <span class="indicator-text">Scanner: Tidak Terdeteksi</span>
        </div>
    `;
    scannerIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #f1f5f9;
        color: #64748b;
        padding: 8px 16px;
        border-radius: 50px;
        font-size: 14px;
        display: flex;
        align-items: center;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    `;
    document.body.appendChild(scannerIndicator);

    // Listen for keydown events
    document.addEventListener('keydown', handleScannerInput);
    
    // Set up test detection
    setTimeout(() => {
        const testBtn = document.getElementById('testScannerBtn');
        if (testBtn) {
            testBtn.addEventListener('click', testScannerConnection);
        }
    }, 1000); // Delay to ensure the button is in the DOM
    
    // Check for scanner periodically
    checkForScanner();
}

function handleScannerInput(event) {
    const currentTime = new Date().getTime();
    
    // Check if this is likely from a scanner (rapid inputs)
    if (currentTime - lastInputTime < SCANNER_THRESHOLD) {
        // Add character to accumulated input
        accumulatedInput += event.key;
        
        // If Enter key is detected, process the complete input
        if (event.key === 'Enter') {
            // Process the accumulated input as a barcode
            processExternalScannerInput(accumulatedInput.slice(0, -1)); // Remove the Enter key
            accumulatedInput = '';
            
            // Update scanner status
            updateScannerStatus(true);
        }
    } else {
        // Start new accumulation
        accumulatedInput = event.key;
    }
    
    // Update the last input time
    lastInputTime = currentTime;
    
    // Set a timeout to reset the accumulated input if no more keys pressed
    setTimeout(() => {
        if (currentTime - lastInputTime >= RESET_THRESHOLD) {
            accumulatedInput = '';
        }
    }, RESET_THRESHOLD);
}

function processExternalScannerInput(barcode) {
    console.log('Barcode scanned from external scanner:', barcode);
    
    // Fill the barcode into the input field
    const kodeInput = document.getElementById('kodeNamaBarang');
    if (kodeInput) {
        kodeInput.value = barcode;
        
        // Set focus to the quantity field
        const jumlahInput = document.getElementById('jumlahBarang');
        if (jumlahInput) {
            jumlahInput.value = '1';
            jumlahInput.focus();
            jumlahInput.select();
        }
        
        // Check if Swal is defined before using it
        if (typeof Swal !== 'undefined') {
            // Show notification
            Swal.fire({
                icon: 'success',
                title: 'Barcode Terdeteksi',
                text: `Kode: ${barcode}`,
                timer: 1500,
                showConfirmButton: false,
                position: 'top-end',
                toast: true
            });
        } else {
            console.error('SweetAlert2 library is not loaded. Please make sure to include it in your HTML.');
            alert(`Barcode Terdeteksi: ${barcode}`);
        }
    }
}

function checkForScanner() {
    // Look for patterns of rapid input to detect a scanner
    const timeSinceLastInput = new Date().getTime() - lastInputTime;
    
    // If we've seen rapid inputs, it might be a scanner
    if (timeSinceLastInput < SCANNER_THRESHOLD && accumulatedInput.length > 5) {
        updateScannerStatus(true);
    } else if (isExternalScannerConnected && timeSinceLastInput > 15000) {
        // If no scanner activity for 15 seconds, assume it might be disconnected
        updateScannerStatus(false);
    }
    
    // Check again after 5 seconds
    setTimeout(checkForScanner, 5000);
}

function updateScannerStatus(isConnected) {
    isExternalScannerConnected = isConnected;
    
    const indicator = document.getElementById('externalScannerIndicator');
    if (!indicator) return;
    
    if (isConnected) {
        indicator.style.backgroundColor = '#dcfce7';
        indicator.style.color = '#166534';
        indicator.querySelector('.indicator-text').textContent = 'Scanner: Terdeteksi';
    } else {
        indicator.style.backgroundColor = '#f1f5f9';
        indicator.style.color = '#64748b';
        indicator.querySelector('.indicator-text').textContent = 'Scanner: Tidak Terdeteksi';
    }
}

function testScannerConnection() {
    // Cek apakah SweetAlert2 (Swal) tersedia
    if (typeof Swal === 'undefined') {
        console.error('SweetAlert2 library is not loaded. Please make sure to include it in your HTML.');
        alert('Error: SweetAlert2 tidak tersedia. Harap sertakan library SweetAlert2 di halaman Anda.');
        return;
    }
    
    // Initial scanner detection
    let scannerDetected = isExternalScannerConnected;
    
    // Create styles for the popup
    const style = `
        .scanner-test-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1.5rem;
        }
        .scanner-icon-container {
            margin-bottom: 1.5rem;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f5f7fa, #e2e8f0);
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .scanner-icon {
            font-size: 2.5rem;
            color: #8e44ad;
        }
        .scanner-instructions {
            margin-bottom: 1.5rem;
            color: #4a5568;
            text-align: center;
            line-height: 1.6;
            font-size: 1.1rem;
        }
        .scanner-status-area {
            width: 100%;
            min-height: 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #f8fafc;
            border: 2px solid #cbd5e0;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: all 0.3s ease;
        }
        .scanner-detected {
            border-color: #10b981;
            background-color: #ecfdf5;
        }
        .scanner-not-detected {
            border-color: #ef4444;
            background-color: #fef2f2;
        }
        .scanner-status-text {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .scanner-detected-text {
            color: #10b981;
        }
        .scanner-not-detected-text {
            color: #ef4444;
        }
        .scanner-info {
            width: 100%;
            margin-top: 0.75rem;
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 1rem;
        }
        .scanner-info-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .scanner-info-row:last-child {
            border-bottom: none;
        }
        .scanner-info-label {
            color: #64748b;
            font-weight: 500;
        }
        .scanner-info-value {
            color: #1e293b;
            font-weight: 600;
        }
        .scanner-manual-connect {
            margin-top: 1rem;
            width: 100%;
        }
        .scanner-connect-btn {
            width: 100%;
            padding: 0.75rem;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .scanner-connect-btn:hover {
            background-color: #2563eb;
        }
        .scanner-test-btn {
            margin-top: 1rem;
            width: 100%;
            padding: 0.75rem;
            background-color: #8e44ad;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .scanner-test-btn:hover {
            background-color: #9b59b6;
        }
        .pulse-animation {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        .scanner-input-area {
            display: none;
            width: 100%;
            min-height: 80px;
            align-items: center;
            justify-content: center;
            background-color: #f8fafc;
            border: 2px dashed #cbd5e0;
            border-radius: 12px;
            padding: 1rem;
            margin: 1rem 0;
            transition: all 0.3s ease;
        }
        .active-test .scanner-icon {
            animation: pulse 2s infinite;
            color: #3b82f6;
        }
    `;
    
    // Create HTML content based on initial detection status
    let htmlContent = `
        <style>${style}</style>
        <div class="scanner-test-container" id="scannerContainer">
            <div class="scanner-icon-container">
                <i class="fas fa-barcode scanner-icon" id="scannerIcon"></i>
            </div>
            
            <div class="scanner-status-area ${scannerDetected ? 'scanner-detected' : 'scanner-not-detected'}" id="scannerStatusArea">
                <div class="scanner-status-text ${scannerDetected ? 'scanner-detected-text' : 'scanner-not-detected-text'}" id="scannerStatusText">
                    ${scannerDetected 
                        ? '<i class="fas fa-check-circle"></i> Scanner Terhubung' 
                        : '<i class="fas fa-times-circle"></i> Tidak Ada Scanner Terhubung'}
                </div>
                
                ${scannerDetected ? `
                    <div class="scanner-info">
                        <div class="scanner-info-row">
                            <span class="scanner-info-label">Status</span>
                            <span class="scanner-info-value">Aktif</span>
                        </div>
                        <div class="scanner-info-row">
                            <span class="scanner-info-label">Koneksi</span>
                            <span class="scanner-info-value">USB HID Keyboard</span>
                        </div>
                        <div class="scanner-info-row">
                            <span class="scanner-info-label">Waktu Terdeteksi</span>
                            <span class="scanner-info-value">${new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <button class="scanner-test-btn" id="testScanBtn">
                        <i class="fas fa-vial"></i> Uji Scanner
                    </button>
                ` : `
                    <p class="scanner-instructions">
                        Tidak terdeteksi scanner yang terhubung dengan sistem. 
                        Silakan hubungkan scanner atau gunakan opsi sambungkan manual.
                    </p>
                    <div class="scanner-manual-connect">
                        <button class="scanner-connect-btn" id="manualConnectBtn">
                            <i class="fas fa-plug"></i> Sambungkan Manual
                        </button>
                    </div>
                `}
            </div>
            
            <div class="scanner-input-area" id="scannerInputArea">
                <div class="scanner-input-text" id="scannerInputText">
                    Scan barcode untuk menguji koneksi...
                </div>
            </div>
        </div>
    `;
    
    try {
        // Show the popup
        Swal.fire({
            title: 'Status Scanner',
            html: htmlContent,
            showCancelButton: true,
            confirmButtonText: 'Tutup',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#8e44ad',
            cancelButtonColor: '#64748b',
            customClass: {
                popup: 'rounded-xl shadow-2xl',
                title: 'text-xl font-bold text-gray-800',
                confirmButton: 'rounded-lg text-sm px-5 py-2.5',
                cancelButton: 'rounded-lg text-sm px-5 py-2.5'
            },
            didOpen: () => {
                // Get DOM elements
                const testScanBtn = document.getElementById('testScanBtn');
                const manualConnectBtn = document.getElementById('manualConnectBtn');
                const scannerContainer = document.getElementById('scannerContainer');
                const scannerInputArea = document.getElementById('scannerInputArea');
                const scannerStatusArea = document.getElementById('scannerStatusArea');
                const scannerStatusText = document.getElementById('scannerStatusText');
                const scannerIcon = document.getElementById('scannerIcon');
                
                // Set up event for Test Scanner button
                if (testScanBtn) {
                    testScanBtn.addEventListener('click', () => {
                        // Show test area
                        scannerContainer.classList.add('active-test');
                        scannerInputArea.style.display = 'flex';
                        scannerStatusArea.style.display = 'none';
                        
                        // Set up listener for scanner input
                        setupScannerInputListener();
                    });
                }
                
                // Set up event for Manual Connect button
                if (manualConnectBtn) {
                    manualConnectBtn.addEventListener('click', () => {
                        // Show manual connection interface
                        scannerContainer.classList.add('active-test');
                        scannerInputArea.style.display = 'flex';
                        scannerStatusArea.style.display = 'none';
                        scannerInputArea.innerHTML = `
                            <div style="text-align: center; width: 100%;">
                                <p style="margin-bottom: 1rem; color: #4b5563;">
                                    Pastikan scanner terhubung ke komputer, lalu scan barcode untuk menghubungkan.
                                </p>
                                <div style="font-size: 0.9rem; color: #6b7280;">
                                    <i class="fas fa-info-circle"></i> 
                                    Petunjuk: Scanner akan terdeteksi otomatis saat Anda memindai barcode.
                                </div>
                            </div>
                        `;
                        
                        // Set up listener for scanner input
                        setupScannerInputListener();
                    });
                }
                
                // Function to setup scanner input listener
                function setupScannerInputListener() {
                    const scannerInputListener = (event) => {
                        const currentTime = new Date().getTime();
                        
                        // Check for scanner input pattern (rapid input)
                        if (currentTime - lastInputTime < SCANNER_THRESHOLD) {
                            accumulatedInput += event.key;
                            
                            // Complete scan when Enter key is detected
                            if (event.key === 'Enter') {
                                const barcode = accumulatedInput.slice(0, -1); // Remove Enter key
                                
                                // Update UI to show detected scanner
                                scannerInputArea.innerHTML = `
                                    <div style="text-align: center; width: 100%;">
                                        <div style="color: #10b981; font-size: 1.2rem; font-weight: 600; margin-bottom: 0.75rem;">
                                            <i class="fas fa-check-circle"></i> Scanner Berhasil Terdeteksi!
                                        </div>
                                        <div style="background-color: #f1f5f9; padding: 0.75rem; border-radius: 8px; font-family: monospace;">
                                            ${barcode}
                                        </div>
                                        <div style="margin-top: 1rem; color: #4b5563;">
                                            Scanner telah terhubung dan siap digunakan.
                                        </div>
                                    </div>
                                `;
                                
                                // Update scanner status
                                updateScannerStatus(true);
                                scannerDetected = true;
                                accumulatedInput = '';
                                
                                // Clean up listener after detection
                                document.removeEventListener('keydown', scannerInputListener);
                            }
                        } else {
                            // Start new input accumulation
                            accumulatedInput = event.key;
                        }
                        
                        lastInputTime = currentTime;
                    };
                    
                    // Add event listener
                    document.addEventListener('keydown', scannerInputListener);
                    
                    // Store for cleanup
                    window.activeScannerListener = scannerInputListener;
                }
            },
            willClose: () => {
                // Clean up listeners
                if (window.activeScannerListener) {
                    document.removeEventListener('keydown', window.activeScannerListener);
                    delete window.activeScannerListener;
                }
            }
        });
    } catch (error) {
        console.error('Error showing SweetAlert popup:', error);
        alert('Error: Tidak dapat menampilkan pop-up. Pastikan library SweetAlert2 dimuat dengan benar.');
    }
}

// Add a button to test scanner connection
function addScannerTestButton() {
    // Create button directly on the page instead of looking for a container
    const testButton = document.createElement('button');
    testButton.id = 'testScannerBtn';
    testButton.className = 'action-button scanner-test-btn';
    testButton.innerHTML = `
        <i class="fas fa-barcode"></i>
        Cek Scanner External
    `;
    testButton.style.cssText = `
        background-color: #8e44ad;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        transition: all 0.4s ease;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin: 10px 0;
        position: relative;
        overflow: hidden;
        perspective: 1000px;
    `;
    
    // Add hover effects matching the site's style
    testButton.onmouseover = function() {
        this.style.transform = 'translateY(-5px) rotateX(10deg)';
        this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
        this.style.background = 'linear-gradient(135deg, #8e44ad, #9b59b6)';
    };
    
    testButton.onmouseout = function() {
        this.style.transform = 'translateY(0) rotateX(0)';
        this.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.2)';
        this.style.background = '#8e44ad';
    };
    
    // Add click event handler directly to the button
    testButton.addEventListener('click', testScannerConnection);
    
    // Insert after the barcode scanner button
    const referenceButton = document.getElementById('barcodeScanner-btn');
    if (referenceButton && referenceButton.parentNode) {
        referenceButton.parentNode.insertBefore(testButton, referenceButton.nextSibling);
    } else {
        // Fallback - append to body
        document.body.appendChild(testButton);
    }
    
    console.log("Scanner test button added with ID: testScannerBtn");
}

// Initialize the scanner detection on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing scanner detection...");
    
    // Add script for SweetAlert2 if not already present
    if (typeof Swal === 'undefined') {
        console.log("SweetAlert2 not found, adding the script");
        const sweetalertScript = document.createElement('script');
        sweetalertScript.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11';
        sweetalertScript.onload = function() {
            console.log("SweetAlert2 loaded successfully");
            initExternalScannerDetection();
            addScannerTestButton();
        };
        sweetalertScript.onerror = function() {
            console.error("Failed to load SweetAlert2");
            alert("Error: Gagal memuat library SweetAlert2. Fitur scanner mungkin tidak berfungsi penuh.");
            initExternalScannerDetection();
            addScannerTestButton();
        };
        document.head.appendChild(sweetalertScript);
    } else {
        console.log("SweetAlert2 already loaded");
        initExternalScannerDetection();
        addScannerTestButton();
    }
    
    // Add Font Awesome if not already present
    if (!document.querySelector('link[href*="font-awesome"]') && !document.querySelector('link[href*="fontawesome"]')) {
        console.log("Font Awesome not found, adding the stylesheet");
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
    }
}); 




// Fungsi untuk menampilkan popup cetak ulang struk
function cetakUlangStruk() {
    // Verifikasi Password terlebih dahulu
    Swal.fire({
        title: 'Masukkan Password',
        html: `
            <div class="void-container">
                <div class="void-icon-container">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <p class="void-description">Masukkan password akun untuk melanjutkan proses cetak ulang struk</p>
            </div>
        `,
        input: 'password',
        inputPlaceholder: 'Masukkan Password Anda',
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off',
            'aria-label': 'Password'
        },
        customClass: {
            input: 'void-pin-input',
            confirmButton: 'void-primary-btn',
            cancelButton: 'void-cancel-btn',
            popup: 'void-popup'
        },
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-check-circle"></i> Verifikasi',
        cancelButtonText: '<i class="fas fa-times-circle"></i> Batal',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#64748b',
        backdrop: `rgba(38, 55, 74, 0.6)`,
        showLoaderOnConfirm: true,
        allowOutsideClick: false,
        preConfirm: (inputPassword) => {
            if (!inputPassword) {
                Swal.showValidationMessage('Password harus diisi');
                return false;
            }

            // Ambil username akun yang sedang login
            const currentUser = localStorage.getItem('username');
            const loggedIn = localStorage.getItem('loggedIn');

            if (loggedIn !== 'true' || !currentUser) {
                Swal.showValidationMessage('Tidak ada sesi login. Silakan login terlebih dahulu.');
                return false;
            }

            // Ambil daftar akun dari localStorage
            let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
            const account = accounts.find(acc => acc.username === currentUser);

            if (!account) {
                Swal.showValidationMessage('Akun tidak ditemukan. Silakan login kembali.');
                return false;
            }

            // Dekripsi password akun
            let decryptedPassword;
            try {
                decryptedPassword = CryptoJS.AES.decrypt(account.password, 'secret key 123').toString(CryptoJS.enc.Utf8);
            } catch (error) {
                console.error('Error decrypting password:', error);
                Swal.showValidationMessage('Kesalahan sistem saat memverifikasi password.');
                return false;
            }

            // Verifikasi password
            if (inputPassword !== decryptedPassword) {
                Swal.showValidationMessage('Password tidak valid');
                return false;
            }

            return true;
        },
        didOpen: () => {
            // Gunakan gaya CSS yang sama seperti voidBarang untuk konsistensi
            const style = document.createElement('style');
            style.textContent = `
                .void-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .void-icon-container {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1rem;
                    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
                }
                .void-icon-container i {
                    font-size: 24px;
                    color: white;
                }
                .void-description {
                    color: #64748b;
                    text-align: center;
                    margin: 0;
                }
                .void-pin-input {
                    font-size: 1.1rem !important;
                    padding: 1rem !important;
                    border-radius: 0.5rem !important;
                    border: 1px solid #e2e8f0 !important;
                    text-align: center !important;
                    letter-spacing: 0.25rem !important;
                }
                .void-primary-btn {
                    background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
                    border-radius: 0.5rem !important;
                    font-weight: 600 !important;
                    padding: 0.75rem 1.5rem !important;
                    box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2) !important;
                }
                .void-cancel-btn {
                    background: #f1f5f9 !important;
                    color: #64748b !important;
                    border-radius: 0.5rem !important;
                    font-weight: 600 !important;
                    padding: 0.75rem 1.5rem !important;
                }
                .void-popup {
                    border-radius: 1rem !important;
                    padding: 1.5rem !important;
                }
            `;
            document.head.appendChild(style);
        }
    }).then((result) => {
        if (result.isConfirmed) {
            tampilkanPopupCetakUlang();
        }
    });
}

// Fungsi untuk menampilkan popup dialog cetak ulang
function tampilkanPopupCetakUlang() {
    // Dapatkan tanggal hari ini dalam format YYYY-MM-DD
    const today = new Date();
    const formattedToday = formatDate(today);
    
    // Dapatkan tanggal 30 hari yang lalu sebagai default awal periode
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const formattedThirtyDaysAgo = formatDate(thirtyDaysAgo);
    
    // Siapkan HTML untuk popup
    const popupHTML = `
        <div class="reprint-container">
            <div class="date-filter-section">
                <div class="date-range">
                    <div class="date-input-group">
                        <label for="startDate" class="input-label"><i class="fas fa-calendar-alt"></i> Tanggal Mulai</label>
                        <input type="date" id="startDate" value="${formattedThirtyDaysAgo}" class="date-input">
                    </div>
                    <div class="date-input-group">
                        <label for="endDate" class="input-label"><i class="fas fa-calendar-alt"></i> Tanggal Selesai</label>
                        <input type="date" id="endDate" value="${formattedToday}" class="date-input">
                    </div>
                    <button id="filterBtn" class="filter-btn">
                        <i class="fas fa-filter"></i> Filter
                    </button>
                </div>
                <div class="quick-filters">
                    <button class="quick-filter-btn" data-days="7">7 Hari</button>
                    <button class="quick-filter-btn" data-days="14">14 Hari</button>
                    <button class="quick-filter-btn" data-days="30">30 Hari</button>
                    <button class="quick-filter-btn" data-days="90">90 Hari</button>
                </div>
            </div>
            
            <div class="transaction-section">
                <div class="transaction-header">
                    <div class="header-item">
                        <input type="checkbox" id="selectAll" class="select-checkbox">
                        <label for="selectAll" class="checkbox-label">Pilih Semua</label>
                    </div>
                    <div class="search-container">
                        <input type="text" id="searchTransaction" placeholder="Cari ID transaksi..." class="search-input">
                        <i class="fas fa-search search-icon"></i>
                    </div>
                </div>
                
                <div class="transaction-list-container">
                    <div id="transactionList" class="transaction-list">
                        <div class="loading-indicator">
                            <div class="spinner"></div>
                            <p>Memuat daftar transaksi...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button id="printSelectedBtn" class="print-btn" disabled>
                    <i class="fas fa-print"></i> Cetak Struk Terpilih
                </button>
            </div>
        </div>
    `;
    
    // Tampilkan popup dengan SweetAlert2
    Swal.fire({
        title: '<div class="reprint-title">Cetak Ulang Struk</div>',
        html: popupHTML,
        width: '900px',
        showConfirmButton: false,
        showCloseButton: true,
        customClass: {
            container: 'reprint-popup-container',
            popup: 'reprint-popup',
            title: 'reprint-title'
        },
        didOpen: (popup) => {
            // Inisialisasi komponen dalam popup
            initializeReprintPopup(popup);
            // Tambahkan CSS untuk popup
            addReprintStyles();
        }
    });
}

// Fungsi untuk menambahkan gaya CSS
function addReprintStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .reprint-popup-container {
            font-family: 'Inter', sans-serif !important;
        }
        .reprint-popup {
            border-radius: 1rem !important;
            padding: 1.5rem !important;
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1) !important;
            background: #ffffff !important;
        }
        .reprint-title {
            font-size: 1.5rem !important;
            font-weight: 600 !important;
            color: #1e293b !important;
            margin-bottom: 1rem !important;
        }
        .reprint-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        .date-filter-section {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 0.75rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .date-range {
            display: flex;
            align-items: flex-end;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .date-input-group {
            flex: 1;
        }
        .input-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            font-weight: 500;
            color: #334155;
            margin-bottom: 0.5rem;
        }
        .date-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            font-size: 1rem;
            color: #334155;
            background: #ffffff;
            transition: all 0.2s;
        }
        .date-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        .filter-btn {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
        }
        .filter-btn:hover {
            background: linear-gradient(135deg, #2563eb, #1e40af);
            box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }
        .quick-filters {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
        }
        .quick-filter-btn {
            background: #e2e8f0;
            color: #334155;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .quick-filter-btn:hover {
            background: #d1d5db;
            color: #1e293b;
        }
        .quick-filter-btn.active {
            background: #3b82f6;
            color: white;
        }
        .transaction-section {
            background: #ffffff;
            padding: 1rem;
            border-radius: 0.75rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .transaction-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .header-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .select-checkbox {
            width: 1.25rem;
            height: 1.25rem;
            cursor: pointer;
        }
        .checkbox-label {
            font-size: 0.9rem;
            color: #334155;
            cursor: pointer;
        }
        .search-container {
            position: relative;
            width: 300px;
        }
        .search-input {
            width: 100%;
            padding: 0.75rem 2.5rem 0.75rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            font-size: 1rem;
            color: #334155;
            background: #ffffff;
            transition: all 0.2s;
        }
        .search-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        .search-icon {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: #64748b;
        }
        .transaction-list-container {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            padding: 0.5rem;
        }
        .transaction-list {
            min-height: 100px;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #64748b;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(59, 130, 246, 0.2);
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        }
        .action-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
        }
        .print-btn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
        }
        .print-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #059669, #047857);
            box-shadow: 0 4px 6px rgba(5, 150, 105, 0.2);
        }
        .print-btn:disabled {
            background: #d1d5db;
            cursor: not-allowed;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
            .reprint-popup {
                width: 95% !important;
            }
            .date-range {
                flex-direction: column;
                align-items: stretch;
            }
            .search-container {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}
// Fungsi untuk menginisialisasi komponen dalam popup cetak ulang
function initializeReprintPopup(popup) {
    const filterBtn = popup.querySelector('#filterBtn');
    const quickFilterBtns = popup.querySelectorAll('.quick-filter-btn');
    const selectAllCheckbox = popup.querySelector('#selectAll');
    const printSelectedBtn = popup.querySelector('#printSelectedBtn');
    const searchInput = popup.querySelector('#searchTransaction');
    
    // Event listener untuk tombol filter
    filterBtn.addEventListener('click', () => {
        const startDate = popup.querySelector('#startDate').value;
        const endDate = popup.querySelector('#endDate').value;
        loadTransactions(startDate, endDate);
    });
    
    // Event listener untuk tombol filter cepat (7 hari, 14 hari, dst)
    quickFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const days = parseInt(btn.dataset.days);
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);
            
            popup.querySelector('#startDate').value = formatDate(startDate);
            popup.querySelector('#endDate').value = formatDate(endDate);
            
            loadTransactions(formatDate(startDate), formatDate(endDate));
            
            // Update tampilan tombol aktif
            quickFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Event listener untuk checkbox "Pilih Semua"
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = popup.querySelectorAll('.transaction-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        
        // Update status tombol cetak
        updatePrintButtonStatus();
    });
    
    // Event listener untuk tombol "Cetak Struk Terpilih"
    printSelectedBtn.addEventListener('click', () => {
        const selectedTransactions = getSelectedTransactions();
        if (selectedTransactions.length > 0) {
            cetakStrukTerpilih(selectedTransactions);
        }
    });
    
    // Event listener untuk pencarian transaksi
    searchInput.addEventListener('input', () => {
        filterTransactions(searchInput.value);
    });
    
    // Fungsi untuk memperbarui status tombol cetak
    function updatePrintButtonStatus() {
        const checkboxes = popup.querySelectorAll('.transaction-item input[type="checkbox"]:checked');
        printSelectedBtn.disabled = checkboxes.length === 0;
    }
    
    // Helper untuk mendapatkan transaksi yang dipilih
    function getSelectedTransactions() {
        const selectedItems = popup.querySelectorAll('.transaction-item input[type="checkbox"]:checked');
        return Array.from(selectedItems).map(item => item.value);
    }
    
    // Load transaksi berdasarkan filter default (30 hari terakhir)
    const startDate = popup.querySelector('#startDate').value;
    const endDate = popup.querySelector('#endDate').value;
    loadTransactions(startDate, endDate);
    
    // Tandai tombol 30 hari sebagai aktif secara default
    popup.querySelector('.quick-filter-btn[data-days="30"]').classList.add('active');
    
    // Event delegasi untuk transaction list
    const transactionList = popup.querySelector('#transactionList');
    transactionList.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            updatePrintButtonStatus();
            
            // Update "Pilih Semua" jika semua/tidak semua checkbox dipilih
            const allCheckboxes = popup.querySelectorAll('.transaction-item input[type="checkbox"]');
            const checkedCheckboxes = popup.querySelectorAll('.transaction-item input[type="checkbox"]:checked');
            
            selectAllCheckbox.checked = allCheckboxes.length === checkedCheckboxes.length;
        }
    });
}

// Fungsi untuk memuat daftar transaksi berdasarkan rentang tanggal
function loadTransactions(startDate, endDate) {
    const transactionList = document.getElementById('transactionList');
    
    // Tampilkan indikator loading
    transactionList.innerHTML = `
        <div class="loading-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Memuat daftar transaksi...</p>
        </div>
    `;
    
    // Ambil data transaksi dari localStorage
    setTimeout(() => {
        let transaksi = [];
        try {
            transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];
        } catch (error) {
            console.error('Error loading transactions:', error);
            transaksi = [];
        }
        
        // Filter transaksi berdasarkan rentang tanggal
        const filteredTransactions = filterTransactionsByDateRange(transaksi, startDate, endDate);
        
        // Kelompokkan transaksi berdasarkan ID
        const groupedTransactions = groupTransactionsById(filteredTransactions);
        
        // Tampilkan daftar transaksi
        displayTransactions(groupedTransactions);
    }, 500); // Simulasikan loading dengan timeout
}

// Fungsi untuk filter transaksi berdasarkan rentang tanggal
function filterTransactionsByDateRange(transactions, startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.tanggal);
        return transactionDate >= start && transactionDate <= end;
    });
}

// Fungsi untuk mengelompokkan transaksi berdasarkan ID
function groupTransactionsById(transactions) {
    const groupedTransactions = {};
    
    transactions.forEach(transaction => {
        if (!groupedTransactions[transaction.id]) {
            groupedTransactions[transaction.id] = {
                id: transaction.id,
                tanggal: transaction.tanggal,
                metode: transaction.metode,
                total: 0,
                items: [],
                timestamp: transaction.timestamp || Date.parse(transaction.tanggal),
                memberId: transaction.memberId
            };
        }
        
        groupedTransactions[transaction.id].items.push({
            namaBarang: transaction.namaBarang,
            jumlah: transaction.jumlah,
            total: transaction.total
        });
        
        groupedTransactions[transaction.id].total += transaction.total;
    });
    
    // Konversi objek ke array dan urutkan berdasarkan waktu (terbaru dulu)
    return Object.values(groupedTransactions).sort((a, b) => b.timestamp - a.timestamp);
}

// Fungsi untuk menampilkan daftar transaksi
function displayTransactions(transactions) {
    const transactionList = document.getElementById('transactionList');
    
    if (transactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>Tidak ada transaksi dalam rentang tanggal yang dipilih</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    transactions.forEach(transaction => {
        // Format tanggal transaksi
        const transactionDate = new Date(transaction.tanggal);
        const formattedDate = transactionDate.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = transactionDate.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format total harga
        const formattedTotal = formatRupiah(transaction.total);
        
        // Dapatkan informasi member jika ada
        let memberInfo = '';
        if (transaction.memberId) {
            const members = JSON.parse(localStorage.getItem('members')) || [];
            const member = members.find(m => m.id === transaction.memberId);
            if (member) {
                memberInfo = `
                    <div class="transaction-member">
                        <i class="fas fa-user-tag"></i>
                        <span>${member.nama}</span>
                    </div>
                `;
            }
        }
        
        // Metode pembayaran dengan fix untuk undefined
        const metode = transaction.metode || 'tidak diketahui';
        const metodeIcon = metode === 'cash' ? 'fa-money-bill-wave' : 
                          (metode === 'qris' ? 'fa-qrcode' : 'fa-receipt');
        
        // Jumlah item dalam transaksi
        const itemCount = transaction.items.length;
        
        html += `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-checkbox">
                    <input type="checkbox" id="trans_${transaction.id}" class="select-checkbox" value="${transaction.id}">
                    <label for="trans_${transaction.id}"></label>
                </div>
                <div class="transaction-info" onclick="toggleTransactionDetails('${transaction.id}')">
                    <div class="transaction-main">
                        <div class="transaction-id-date">
                            <div class="transaction-id">${transaction.id}</div>
                            <div class="transaction-date">${formattedDate} ${formattedTime}</div>
                        </div>
                        <div class="transaction-meta">
                            <div class="transaction-method ${metode}">
                                <i class="fas ${metodeIcon}"></i>
                                <span>${metode.toUpperCase()}</span>
                            </div>
                            ${memberInfo}
                            <div class="transaction-items-count">
                                <i class="fas fa-shopping-basket"></i>
                                <span>${itemCount} item</span>
                            </div>
                        </div>
                    </div>
                    <div class="transaction-total">
                        <div class="total-label">Total</div>
                        <div class="total-amount">${formattedTotal}</div>
                    </div>
                </div>
                <div class="transaction-details" id="details_${transaction.id}" style="display: none;">
                    <div class="details-header">
                        <h4>Detail Transaksi</h4>
                    </div>
                    <div class="items-list">
                        ${generateItemsList(transaction.items)}
                    </div>
                    <div class="details-actions">
                        <button class="action-btn preview-btn" onclick="previewStruk('${transaction.id}')">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button class="action-btn print-single-btn" onclick="cetakSingleStruk('${transaction.id}')">
                            <i class="fas fa-print"></i> Cetak
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    transactionList.innerHTML = html;
}

// Fungsi untuk menghasilkan daftar item dalam transaksi
function generateItemsList(items) {
    let html = '<ul class="items-list-ul">';
    
    items.forEach(item => {
        html += `
            <li class="item-entry">
                <div class="item-name">${item.namaBarang}</div>
                <div class="item-quantity">x${item.jumlah}</div>
                <div class="item-total">${formatRupiah(item.total)}</div>
            </li>
        `;
    });
    
    html += '</ul>';
    return html;
}

// Fungsi untuk toggle detail transaksi
function toggleTransactionDetails(transactionId) {
    const detailsElement = document.getElementById(`details_${transactionId}`);
    
    // Tutup semua detail transaksi lainnya
    const allDetails = document.querySelectorAll('.transaction-details');
    allDetails.forEach(detail => {
        if (detail.id !== `details_${transactionId}`) {
            detail.style.display = 'none';
        }
    });
    
    // Toggle tampilan detail transaksi yang dipilih
    if (detailsElement) {
        detailsElement.style.display = detailsElement.style.display === 'none' ? 'block' : 'none';
    }
}

// Fungsi untuk filter transaksi berdasarkan pencarian
function filterTransactions(searchTerm) {
    const transactionItems = document.querySelectorAll('.transaction-item');
    const searchLower = searchTerm.toLowerCase();
    
    transactionItems.forEach(item => {
        const transactionId = item.dataset.id.toLowerCase();
        const shouldShow = transactionId.includes(searchLower);
        item.style.display = shouldShow ? 'flex' : 'none';
    });
}

function cetakStrukTerpilih(transactionIds) {
    if (transactionIds.length === 0) return;
    
    // Jika hanya satu transaksi, gunakan fungsi cetak langsung
    if (transactionIds.length === 1) {
        cetakStruk(transactionIds[0], true);
        return;
    }
    
    // Jika banyak transaksi, konfirmasi dulu
    Swal.fire({
        title: 'Cetak Struk',
        text: `Anda akan mencetak ${transactionIds.length} struk. Lanjutkan?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Cetak',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#3085d6',
    }).then((result) => {
        if (result.isConfirmed) {
            // Cetak struk menggunakan fungsi cetakBatchStruk
            cetakBatchStruk(transactionIds);
        }
    });
}
// Fungsi untuk mencetak batch struk
function cetakBatchStruk(transactionIds) {
    let index = 0;
    
    // Tampilkan dialog progres
    Swal.fire({
        title: 'Memproses Pencetakan',
        html: `Mencetak struk <b>1</b> dari <b>${transactionIds.length}</b>`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
            processBatch();
        }
    });
    
    // Fungsi rekursif untuk memproses batch
    function processBatch() {
        if (index >= transactionIds.length) {
            // Selesai, tutup dialog
            Swal.fire({
                title: 'Selesai',
                text: `${transactionIds.length} struk telah dicetak`,
                icon: 'success',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        // Update dialog progres
        Swal.update({
            html: `Mencetak struk <b>${index + 1}</b> dari <b>${transactionIds.length}</b>`
        });
        
        // Cetak struk saat ini menggunakan fungsi cetakStruk
        cetakStruk(transactionIds[index], true);
        
        // Lanjut ke struk berikutnya setelah delay
        index++;
        setTimeout(processBatch, 1500);
    }
}

// Fungsi untuk mencetak struk tunggal dalam mode batch (tanpa dialog tambahan)
function cetakSingleStrukSilent(transactionId) {
    return new Promise((resolve) => {
        // Menggunakan fungsi cetakStruk yang sudah ada
        cetakStruk(transactionId, true);
        
        // Resolve promise setelah memberikan waktu untuk cetakStruk selesai
        setTimeout(resolve, 1000);
    });
}

// Fungsi untuk mencetak struk tunggal
function cetakSingleStruk(transactionId) {
    // Menggunakan fungsi cetakStruk yang sudah ada dengan parameter isReprint=true
    cetakStruk(transactionId, true);
}
// Fungsi untuk preview struk
// Fungsi preview struk yang ditingkatkan
function previewStruk(transactionId, withPrintOption = true) {
    // Dapatkan transaksi dari localStorage
    let transaksi = [];
    try {
        transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];
    } catch (error) {
        console.error('Error parsing transaksi:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Terjadi kesalahan saat memuat data transaksi',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Filter transaksi berdasarkan ID
    const transaksiTerpilih = transaksi.filter(item => item.id === transactionId);
    
    if (transaksiTerpilih.length === 0) {
        Swal.fire({
            icon: 'error',
            title: 'Transaksi Tidak Ditemukan',
            text: `Tidak dapat menemukan transaksi dengan ID: ${transactionId}`,
            confirmButtonText: 'OK'
        });
        return;
    }

    // Kelompokkan item berdasarkan kode barang
    const uniqueItems = new Map();
    let totalTransaksi = 0;
    
    transaksiTerpilih.forEach(item => {
        try {
            const key = item.kodeBarang || `item-${Math.random().toString(36).substring(2, 9)}`;
            if (uniqueItems.has(key)) {
                const existingItem = uniqueItems.get(key);
                existingItem.jumlah += (item.jumlah || 0);
                existingItem.total += (item.total || 0);
            } else {
                uniqueItems.set(key, {
                    namaBarang: item.namaBarang || 'Item tidak bernama',
                    jumlah: item.jumlah || 0,
                    total: item.total || 0
                });
            }
            totalTransaksi += (item.total || 0);
        } catch (error) {
            console.error('Error processing item:', error, item);
        }
    });

    // Konversi uniqueItems Map ke array untuk render
    const items = Array.from(uniqueItems.values());
    
    // Dapatkan informasi metode pembayaran
    const metode = (transaksiTerpilih[0].metode || 'tidak diketahui').toUpperCase();
    
    // Dapatkan informasi member jika ada
    let memberInfo = 'Non-Member';
    let memberPoin = 0;
    
    if (transaksiTerpilih[0].memberId) {
        try {
            const members = JSON.parse(localStorage.getItem('members')) || [];
            const member = members.find(m => m.id === transaksiTerpilih[0].memberId);
            
            if (member) {
                memberInfo = `${member.nama} (ID: ${member.id})`;
                memberPoin = transaksiTerpilih[0].poin || 0;
            }
        } catch (error) {
            console.error('Error processing member info:', error);
        }
    }
    
    // Format tanggal transaksi untuk display
    let tanggalTransaksi = 'Tidak tersedia';
    try {
        if (transaksiTerpilih[0].tanggal) {
            tanggalTransaksi = new Date(transaksiTerpilih[0].tanggal).toLocaleString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } catch (error) {
        console.error('Error formatting date:', error);
    }
    
    // Siapkan HTML untuk preview dengan tampilan yang lebih baik
    const previewHTML = `
    <div class="preview-container">
        <div class="preview-header">
            <div class="preview-logo">
                <i class="fas fa-store"></i>
                <h3>FXID STORE</h3>
            </div>
            <div class="preview-transaction-info">
                <div class="info-item">
                    <span class="info-label">ID Transaksi:</span>
                    <span class="info-value">${transactionId}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Tanggal:</span>
                    <span class="info-value">${tanggalTransaksi}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Metode Pembayaran:</span>
                    <span class="info-value method-badge ${metode.toLowerCase()}">${metode}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Member:</span>
                    <span class="info-value">${memberInfo}</span>
                </div>
                ${memberPoin > 0 ? `
                <div class="info-item">
                    <span class="info-label">Poin Didapat:</span>
                    <span class="info-value points">+${memberPoin} poin</span>
                </div>` : ''}
            </div>
        </div>
        
        <div class="preview-items">
            <h4>Detail Belanja</h4>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 55%">Item</th>
                        <th style="width: 15%">Qty</th>
                        <th style="width: 30%">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                    <tr>
                        <td>${item.namaBarang}</td>
                        <td class="text-center">${item.jumlah}</td>
                        <td class="text-right">${formatRupiah(item.total)}</td>
                    </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" class="text-right"><strong>Total:</strong></td>
                        <td class="text-right total-price">${formatRupiah(totalTransaksi)}</td>
                    </tr>
                    ${transaksiTerpilih[0].kembalian ? `
                    <tr>
                        <td colspan="2" class="text-right">Nominal:</td>
                        <td class="text-right">${formatRupiah(transaksiTerpilih[0].nominal || totalTransaksi)}</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="text-right">Kembalian:</td>
                        <td class="text-right">${formatRupiah(transaksiTerpilih[0].kembalian || 0)}</td>
                    </tr>` : ''}
                </tfoot>
            </table>
        </div>
        
        <div class="preview-footer">
            <p>Terima kasih telah berbelanja di FXID STORE</p>
            <p class="reprint-note">* Ini adalah tampilan preview untuk cetak ulang struk</p>
        </div>
    </div>
    
    <style>
        .preview-container {
            max-width: 100%;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
        }
        
        .preview-header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px dashed #ccc;
        }
        
        .preview-logo {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .preview-logo i {
            font-size: 2rem;
            color: #3b82f6;
            margin-bottom: 8px;
        }
        
        .preview-logo h3 {
            margin: 0;
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .preview-transaction-info {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 12px;
        }
        
        .info-item {
            display: flex;
            margin-bottom: 6px;
            font-size: 0.9rem;
        }
        
        .info-item:last-child {
            margin-bottom: 0;
        }
        
        .info-label {
            width: 45%;
            color: #64748b;
            font-weight: 500;
        }
        
        .info-value {
            width: 55%;
            font-weight: 600;
            color: #334155;
        }
        
        .method-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .method-badge.cash {
            background-color: #dcfce7;
            color: #16a34a;
        }
        
        .method-badge.qris {
            background-color: #dbeafe;
            color: #2563eb;
        }
        
        .method-badge.tidak {
            background-color: #f1f5f9;
            color: #64748b;
        }
        
        .points {
            color: #d97706;
            font-weight: 600;
        }
        
        .preview-items {
            margin-bottom: 20px;
        }
        
        .preview-items h4 {
            margin-top: 0;
            margin-bottom: 10px;
            font-size: 1rem;
            color: #334155;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }
        
        .items-table th {
            text-align: left;
            padding: 8px;
            background-color: #f1f5f9;
            color: #64748b;
            font-weight: 600;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .items-table td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .items-table tfoot tr td {
            padding-top: 12px;
            border-top: 1px solid #cbd5e1;
            border-bottom: none;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        .total-price {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1e40af;
        }
        
        .preview-footer {
            text-align: center;
            margin-top: 20px;
            color: #64748b;
            font-size: 0.9rem;
        }
        
        .preview-footer p {
            margin: 5px 0;
        }
        
        .reprint-note {
            font-style: italic;
            color: #94a3b8;
            font-size: 0.8rem;
            margin-top: 10px;
        }
    </style>
    `;
    
    // Tampilkan dialog preview yang ditingkatkan
    Swal.fire({
        title: 'Preview Struk',
        html: previewHTML,
        width: '600px',
        showCancelButton: false,
        showDenyButton: withPrintOption,
        confirmButtonText: 'Tutup',
        denyButtonText: '<i class="fas fa-print"></i> Cetak Struk',
        customClass: {
            popup: 'struk-preview-popup',
            content: 'struk-preview-swal-content',
            confirmButton: 'btn-close',
            denyButton: 'btn-print'
        }
    }).then((result) => {
        if (result.isDenied && withPrintOption) {
            // Jika user memilih untuk mencetak
            cetakStruk(transactionId, true);
        }
    });
    
    // Tambahkan CSS tambahan untuk tombol
    const style = document.createElement('style');
    style.textContent = `
        .btn-print {
            background-color: #2563eb !important;
            color: white !important;
        }
        
        .btn-close {
            background-color: #e2e8f0 !important;
            color: #475569 !important;
        }
        
        .struk-preview-popup {
            max-width: 600px !important;
        }
    `;
    document.head.appendChild(style);
}

// Fungsi untuk menghasilkan konten struk berdasarkan ID transaksi
function generateStrukContent(transactionId) {
    // Konstanta untuk format struk
    const LEBAR_STRUK = 42; // lebar struk dalam karakter
    const NAMA_TOKO = 'FXID STORE';
    const ALAMAT_TOKO = 'Jl. Merdeka No. 88, Kota';
    
    // Fungsi untuk membuat garis pemisah
    function garisPemisah(karakter = '-') {
        return karakter.repeat(LEBAR_STRUK);
    }
    
    // Fungsi untuk memusatkan teks
    function pusatkanTeks(teks, lebar = LEBAR_STRUK) {
        const sisaSpasi = lebar - teks.length;
        const spasiBagiriKiri = Math.floor(sisaSpasi / 2);
        const spasiBagianKanan = sisaSpasi - spasiBagiriKiri;
        return ' '.repeat(spasiBagiriKiri) + teks + ' '.repeat(spasiBagianKanan);
    }
    
    // Fungsi untuk membuat baris dengan rata kanan-kiri
    function barisRataKananKiri(kiri, kanan, lebar = LEBAR_STRUK) {
        const sisaSpasi = lebar - (kiri.length + kanan.length);
        return kiri + ' '.repeat(sisaSpasi) + kanan;
    }
    
    // Fungsi untuk memotong teks agar sesuai lebar
    function potongTeks(teks, panjang) {
        return teks.length > panjang 
            ? teks.substring(0, panjang - 3) + '...' 
            : teks.padEnd(panjang);
    }
    
    // Ambil data transaksi dari localStorage
    let transaksi = JSON.parse(localStorage.getItem('transaksi')) || [];
    const transaksiTerpilih = transaksi.filter(item => item.id === transactionId);
    
    if (transaksiTerpilih.length === 0) {
        return `Transaksi dengan ID ${transactionId} tidak ditemukan.`;
    }
    
    // Kelompokkan item berdasarkan kode barang untuk menghindari duplikasi
    const uniqueItems = new Map();
    let totalTransaksi = 0;
    
    transaksiTerpilih.forEach(item => {
        const key = item.kodeBarang;
        if (uniqueItems.has(key)) {
            const existingItem = uniqueItems.get(key);
            existingItem.jumlah += item.jumlah;
            existingItem.total += item.total;
        } else {
            uniqueItems.set(key, {
                namaBarang: item.namaBarang,
                jumlah: item.jumlah,
                total: item.total
            });
        }
        totalTransaksi += item.total;
    });
    
    // Mulai membuat konten struk
    let struk = [];
    
    // Header Toko
    struk.push(pusatkanTeks(NAMA_TOKO));
    struk.push(pusatkanTeks(ALAMAT_TOKO));
    struk.push(garisPemisah('='));
    
    // Informasi Transaksi
    const waktuTransaksi = new Date(transaksiTerpilih[0].tanggal).toLocaleString('id-ID', {
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    struk.push(barisRataKananKiri('ID Transaksi:', transactionId));
    struk.push(barisRataKananKiri('Tanggal:', waktuTransaksi));
    
    // Tambahkan informasi Member jika ada
    if (transaksiTerpilih[0].memberId) {
        const members = JSON.parse(localStorage.getItem('members')) || [];
        const member = members.find(m => m.id === transaksiTerpilih[0].memberId);
        
        if (member) {
            struk.push(barisRataKananKiri('Member:', member.nama));
            struk.push(barisRataKananKiri('ID Member:', member.id));
        }
    }
    
    // Tambahkan teks "CETAK ULANG" untuk menandai ini adalah struk cetak ulang
    struk.push(garisPemisah('-'));
    struk.push(pusatkanTeks('*** CETAK ULANG ***'));
    struk.push(garisPemisah('='));
    
    // Header Kolom
    struk.push(
        potongTeks('Nama Barang', 20).padEnd(20) + 
        potongTeks('Qty', 6).padEnd(6) + 
        potongTeks('Harga', 16)
    );
    struk.push(garisPemisah());
    
    // Item Transaksi
    uniqueItems.forEach((item) => {
        const namaBarang = potongTeks(item.namaBarang, 20);
        const qty = potongTeks(item.jumlah.toString(), 6);
        const harga = potongTeks(formatRupiah(item.total), 16);
        
        struk.push(
            namaBarang.padEnd(20) + 
            qty.padEnd(6) + 
            harga
        );
    });
    
    // Footer Transaksi
    struk.push(garisPemisah());
    struk.push(barisRataKananKiri('Total:', formatRupiah(totalTransaksi)));
    struk.push(barisRataKananKiri('Metode Bayar:', transaksiTerpilih[0].metode.toUpperCase()));
    struk.push(barisRataKananKiri('Nominal:', formatRupiah(transaksiTerpilih[0].nominal || totalTransaksi)));
    struk.push(barisRataKananKiri('Kembalian:', formatRupiah(transaksiTerpilih[0].kembalian || 0)));
    
    // Tambahkan informasi poin jika transaksi menggunakan member
    if (transaksiTerpilih[0].memberId && transaksiTerpilih[0].poin > 0) {
        struk.push(garisPemisah('-'));
        struk.push(barisRataKananKiri('Poin Didapat:', `+${transaksiTerpilih[0].poin} poin`));
        
        // Cari total poin member saat ini
        const members = JSON.parse(localStorage.getItem('members')) || [];
        const member = members.find(m => m.id === transaksiTerpilih[0].memberId);
        if (member) {
            struk.push(barisRataKananKiri('Total Poin Member:', `${member.poin} poin`));
        }
    }
    
    struk.push(garisPemisah('='));
    
    // Penutup
    struk.push(pusatkanTeks('Terima Kasih'));
    struk.push(pusatkanTeks('Barang yang sudah dibeli'));
    struk.push(pusatkanTeks('tidak dapat dikembalikan'));
    struk.push('');
    struk.push(pusatkanTeks('*** CETAK ULANG ***'));
    
    // Gabungkan array menjadi teks
    return struk.join('\n');
}

// Fungsi untuk helper format tanggal
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Fungsi untuk menambahkan CSS untuk tampilan popup cetak ulang
function addReprintStyles() {
    // Hapus style yang mungkin sudah ada sebelumnya untuk menghindari duplikasi
    const existingStyle = document.getElementById('reprint-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Buat elemen style baru
    const style = document.createElement('style');
    style.id = 'reprint-styles';
    style.textContent = `
        .reprint-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 100%;
            color: #333;
        }
        
        .date-filter-section {
            margin-bottom: 20px;
            background-color: #f8fafc;
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .date-range {
            display: flex;
            align-items: flex-end;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .date-input-group {
            flex: 1;
        }
        
        .date-input-group label {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            color: #4b5563;
        }
        
        .date-input {
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .date-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        
        .filter-btn {
            padding: 10px 16px;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        
        .filter-btn:hover {
            background-color: #2563eb;
        }
        
        .quick-filters {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .quick-filter-btn {
            padding: 6px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background-color: white;
            color: #4b5563;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .quick-filter-btn:hover {
            border-color: #3b82f6;
            color: #3b82f6;
        }
        
        .quick-filter-btn.active {
            background-color: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }
        
        .transaction-section {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .transaction-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .header-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .select-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        .search-container {
            position: relative;
            width: 300px;
        }
        
        .search-input {
            width: 100%;
            padding: 10px 12px 10px 35px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            font-size: 14px;
            transition: all 0.2s;
        }
        
        .search-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        
        .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
        }
        
        .transaction-list-container {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .transaction-list {
            padding: 10px;
        }
        
        .transaction-item {
            display: flex;
            flex-direction: column;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 10px;
            overflow: hidden;
            transition: all 0.2s;
        }
        
        .transaction-item:hover {
            border-color: #3b82f6;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .transaction-info {
            display: flex;
            padding: 15px;
            cursor: pointer;
            background-color: #f9fafb;
        }
        
        .transaction-checkbox {
            padding: 15px 15px 0 15px;
        }
        
        .transaction-main {
            flex: 1;
        }
        
        .transaction-id-date {
            margin-bottom: 8px;
        }
        
        .transaction-id {
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 4px;
        }
        
        .transaction-date {
            font-size: 13px;
            color: #6b7280;
        }
        
        .transaction-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .transaction-method {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .transaction-method.cash {
            background-color: #dcfce7;
            color: #16a34a;
        }
        
        .transaction-method.qris {
            background-color: #dbeafe;
            color: #2563eb;
        }
        
        .transaction-member, .transaction-items-count {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
            color: #6b7280;
        }
        
        .transaction-total {
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 0 15px;
            min-width: 150px;
            text-align: right;
        }
        
        .total-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
        }
        
        .total-amount {
            font-weight: 600;
            color: #111827;
            font-size: 16px;
        }
        
        .transaction-details {
            padding: 15px;
            border-top: 1px dashed #e5e7eb;
            background-color: white;
        }
        
        .details-header {
            margin-bottom: 10px;
        }
        
        .details-header h4 {
            font-size: 14px;
            color: #4b5563;
            margin: 0;
        }
        
        .items-list-ul {
            list-style: none;
            padding: 0;
            margin: 0 0 15px 0;
        }
        
        .item-entry {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .item-entry:last-child {
            border-bottom: none;
        }
        
        .item-name {
            flex: 1;
            font-size: 14px;
        }
        
        .item-quantity {
            width: 50px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
        }
        
        .item-total {
            width: 100px;
            text-align: right;
            font-size: 14px;
            font-weight: 500;
        }
        
        .details-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .action-btn {
            padding: 8px 12px;
            border-radius: 6px;
            border: none;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        
        .preview-btn {
            background-color: #f3f4f6;
            color: #4b5563;
        }
        
        .preview-btn:hover {
            background-color: #e5e7eb;
        }
        
        .print-single-btn {
            background-color: #3b82f6;
            color: white;
        }
        
        .print-single-btn:hover {
            background-color: #2563eb;
        }
        
        .action-buttons {
            display: flex;
            justify-content: flex-end;
        }
        
        .print-btn {
            padding: 12px 20px;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        
        .print-btn:hover {
            background-color: #1d4ed8;
        }
        
        .print-btn:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
        }
        
        .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px;
            color: #6b7280;
        }
        
        .loading-indicator i {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            color: #9ca3af;
        }
        
        .empty-state i {
            font-size: 40px;
            margin-bottom: 15px;
            opacity: 0.6;
        }
        
        /* Styles untuk preview struk */
        .struk-preview-container {
            max-height: 60vh;
            overflow-y: auto;
            margin: 0 auto;
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
        }
        
        .struk-preview-content {
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            font-size: 12px;
            padding: 15px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        /* Sweetalert customization */
        .struk-preview-popup {
            max-width: 90vw !important;
        }
        
        .struk-preview-swal-content {
            max-width: 100% !important;
        }
        
        /* Scrollbar styling */
        .transaction-list-container::-webkit-scrollbar {
            width: 8px;
        }
        
        .transaction-list-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        
        .transaction-list-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 10px;
        }
        
        .transaction-list-container::-webkit-scrollbar-thumb:hover {
            background: #a1a1a1;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .date-range {
                flex-direction: column;
                gap: 10px;
            }
            
            .transaction-header {
                flex-direction: column;
                gap: 10px;
                align-items: flex-start;
            }
            
            .search-container {
                width: 100%;
            }
            
            .transaction-info {
                flex-direction: column;
            }
            
            .transaction-total {
                text-align: left;
                padding: 10px 15px;
                min-width: auto;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Integrasi dengan UI
document.addEventListener('DOMContentLoaded', function() {
    // Tambahkan tombol cetak ulang struk ke menu atau toolbar
    const toolbar = document.querySelector('.toolbar') || document.querySelector('.actions-container');
    
    if (toolbar) {
        const cetakUlangButton = document.createElement('button');
        cetakUlangButton.className = 'action-button reprint-button';
        cetakUlangButton.innerHTML = '<i class="fas fa-history"></i> Cetak Ulang Struk';
        cetakUlangButton.onclick = cetakUlangStruk;
        
        toolbar.appendChild(cetakUlangButton);
    } else {
        // Alternatif jika tidak menemukan toolbar, tambahkan ke elemen lain yang sesuai
        const container = document.querySelector('.main-content') || document.body;
        
        if (container) {
            const cetakUlangButton = document.createElement('button');
            cetakUlangButton.className = 'floating-action-button';
            cetakUlangButton.innerHTML = '<i class="fas fa-history"></i>';
            cetakUlangButton.title = 'Cetak Ulang Struk';
            cetakUlangButton.onclick = cetakUlangStruk;
            
            // Styling untuk tombol floating
            cetakUlangButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: #3b82f6;
                color: white;
                border: none;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                cursor: pointer;
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            
            // Hover effect
            cetakUlangButton.onmouseover = function() {
                this.style.transform = 'scale(1.1)';
            };
            
            cetakUlangButton.onmouseout = function() {
                this.style.transform = 'scale(1)';
            };
            
            container.appendChild(cetakUlangButton);
        }
    }
});

// Fungsi utilitas untuk memformat Rupiah
function formatRupiah(angka) {
    // Helper untuk memastikan angka valid
    if (isNaN(angka) || angka === null || angka === undefined) {
        angka = 0;
    }
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(angka);
}

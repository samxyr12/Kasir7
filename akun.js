const PIN = '451661750';
const DEFAULT_PIN = '451';
let otpStore = {};
let currentUsername = '';

function generateOTP() {
    return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join(''); // Menghasilkan OTP 6 digit
}

function openUploadPopup() {
    document.getElementById('uploadPopup').style.display = 'block';
}

function closeUploadPopup() {
    document.getElementById('uploadPopup').style.display = 'none';
}

let accountsToUpload = []; // Variabel global untuk menyimpan akun yang diunggah

function uploadAccounts() {
    const fileInput = document.getElementById('uploadFile');
    const file = fileInput.files[0];

    if (!file) {
        document.getElementById('uploadMessage').textContent = 'Silakan pilih file untuk diunggah.';
        return;
    }

    // Tampilkan animasi loading
    document.getElementById('loadingOverlay').style.display = 'flex';

    setTimeout(() => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const accounts = XLSX.utils.sheet_to_json(worksheet);

            accountsToUpload = accounts;

            processUpload(); // Proses upload dan cek duplikasi
        };

        reader.readAsArrayBuffer(file);
    }, 1000); 
}

function processUpload() {
    let storedAccounts = JSON.parse(localStorage.getItem('accounts')) || [];
    let duplicateAccounts = [];

    accountsToUpload.forEach(account => {
        if (account.Username && account.Password) {
            const existingAccount = storedAccounts.find(acc => acc.username === account.Username);
            if (existingAccount) {
                duplicateAccounts.push(account.Username);
            } else {
                const encryptedPassword = CryptoJS.AES.encrypt(account.Password, 'secret key 123').toString();
                const pin = account.PIN || DEFAULT_PIN;
                storedAccounts.push({ username: account.Username, password: encryptedPassword, pin });
            }
        }
    });

    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('uploadPopup').style.display = 'none';

    if (duplicateAccounts.length > 0) {
        let message = `Beberapa username sudah ada: ${duplicateAccounts.join(', ')}. Sistem akan merubah username tersebut. Apakah Anda ingin melanjutkan?`;
        document.getElementById('duplicateMessage').textContent = message;
        document.getElementById('duplicatePopup').style.display = 'block';
    } else {
        localStorage.setItem('accounts', JSON.stringify(storedAccounts));
        document.getElementById('uploadMessage').textContent = 'Akun berhasil diunggah.';
        displayAccounts(); 
    }
}

function closeDuplicatePopup() {
    document.getElementById('duplicatePopup').style.display = 'none';
}

function cancelUpload() {
    accountsToUpload = [];
    document.getElementById('uploadMessage').textContent = 'Upload dibatalkan.';
    closeUploadPopup(); 
}

function handleDuplicate(continueUpload) {
    if (continueUpload) {
        let storedAccounts = JSON.parse(localStorage.getItem('accounts')) || [];

        accountsToUpload.forEach(account => {
            if (account.Username && account.Password) {
                let username = account.Username;
                while (storedAccounts.find(acc => acc.username === username)) {
                    username = username.replace(/(\d*)$/, (match, p1) => (parseInt(p1) + 1 || 1));
                }
                const encryptedPassword = CryptoJS.AES.encrypt(account.Password, 'secret key 123').toString();
                const pin = account.PIN || DEFAULT_PIN;
                storedAccounts.push({ username, password: encryptedPassword, pin });
            }
        });

        localStorage.setItem('accounts', JSON.stringify(storedAccounts));
        document.getElementById('uploadMessage').textContent = 'Akun berhasil diunggah dengan perubahan nama.';
        closeDuplicatePopup();
        displayAccounts(); 
    } else {
        closeDuplicatePopup();
        cancelUpload();
    }
}

function openDownloadPopup() {
    document.getElementById('downloadPopup').style.display = 'block';
}

function closeDownloadPopup() {
    document.getElementById('downloadPopup').style.display = 'none';
}

function verifyDownloadPin() {
    const pin = document.getElementById('downloadPinInput').value;
    if (pin === PIN) {
        document.getElementById('loadingSpinner').style.display = 'block'; 
        setTimeout(() => {
            downloadAccounts();
            document.getElementById('loadingSpinner').style.display = 'none';
            closeDownloadPopup();
        }, 1000); 
    } else {
        showNotification('PIN salah!');
    }
}

function downloadAccounts() {
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    
    // Buat data dengan properti yang diinginkan
    const formattedData = accounts.map(account => ({
        Username: account.username,
        Password: CryptoJS.AES.decrypt(account.password, 'secret key 123').toString(CryptoJS.enc.Utf8),
        PIN: account.pin || ''  // Tambahkan PIN ke dalam data
    }));

    // Buat worksheet dari data
    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Auto ukuran kolom
    const wscols = [
        { wch: 20 }, // Lebar kolom untuk Username
        { wch: 20 }, // Lebar kolom untuk Password
        { wch: 10 }, // Lebar kolom untuk PIN
    ];
    ws['!cols'] = wscols;

    // Tambahkan style untuk header
    const headerStyle = {
        font: { bold: true },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'FFFF00' } }, // Warna latar belakang kuning
        border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
        }
    };

    // Menambahkan auto filter dan membuat tabel
    ws['!ref'] = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: 2, r: formattedData.length }
    });
    ws['!autofilter'] = { ref: ws['!ref'] };

    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = headerStyle;
    }

    // Menambahkan shading pada baris alternatif
    for (let R = 1; R <= formattedData.length; R++) {
        for (let C = 0; C <= 2; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            if (ws[cellRef]) {
                ws[cellRef].s = {
                    fill: { fgColor: { rgb: R % 2 === 0 ? 'F7F7F7' : 'FFFFFF' } }, // Warna abu-abu muda untuk baris genap
                    border: {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } }
                    }
                };
            }
        }
    }

    // Buat workbook baru
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Akun');

    // Konversi workbook ke binary
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

    // Fungsi untuk mengonversi string menjadi array buffer
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) {
            view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
    }

    // Simpan dan unduh file
    const filename = 'daftar_akun.xlsx';
    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function createAccount() {
    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const newPin = document.getElementById('newPin').value || DEFAULT_PIN; // Default PIN adalah 451 jika tidak diisi

    if (!newUsername || !newPassword || !confirmPassword) {
        showNotification('Semua field harus diisi.');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('Password dan konfirmasi password tidak cocok.');
        return;
    }

    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    
    if (accounts.some(account => account.username === newUsername)) {
        showNotification('Username sudah ada. Silakan gunakan username lain.');
        return;
    }

    // Jika menggunakan PIN default, pengguna harus mengganti PIN sebelum mengganti password
    if (newPin === DEFAULT_PIN) {
        showNotification('Harap ganti PIN default sebelum mengubah password.');
        return;
    }

    // Enkripsi password dan simpan akun dengan PIN
    const encryptedPassword = CryptoJS.AES.encrypt(newPassword, 'secret key 123').toString();
    accounts.push({ username: newUsername, password: encryptedPassword, pin: newPin });
    localStorage.setItem('accounts', JSON.stringify(accounts));
    showNotification('Akun berhasil dibuat.');
    displayAccounts();

    // Clear the input fields after account creation
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('newPin').value = '';
}

function displayAccounts() {
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    let accountListDisplay = document.getElementById('accountListDisplay');
    accountListDisplay.innerHTML = '';

    const searchInput = document.getElementById('searchInput').value.trim().toLowerCase();

    // Jika pencarian adalah 'FXID', tampilkan pop-up
    if (searchInput === 'fxid') {
        openPopup();
        return;
    }

    accounts.forEach(account => {
        if (account.username.toLowerCase().includes(searchInput)) {
            let row = document.createElement('tr');
            
            // Menandai akun yang memiliki PIN default "451" sebagai tidak aman
            if (account.pin === '451') {
                row.style.color = 'red'; // Menampilkan teks dalam warna merah
            }

            let usernameCell = document.createElement('td');
            usernameCell.textContent = account.username;
            row.appendChild(usernameCell);

            let passwordCell = document.createElement('td');
            passwordCell.textContent = '*'.repeat(account.password.length); // Menampilkan * sesuai panjang password
            row.appendChild(passwordCell);

            let actionCell = document.createElement('td');
            actionCell.innerHTML = `
                <button class="table-button" onclick="promptPin('${account.username}')">Ganti Password</button>
            `;
            row.appendChild(actionCell);

            accountListDisplay.appendChild(row);
        }
    });
}

let accountsToDelete = [];

function openPopup() {
    document.getElementById('deleteConfirmation').style.display = 'flex';
    displayUsernames(); // Tampilkan daftar username saat pop-up dibuka
}

function closePopup() {
    document.getElementById('deleteConfirmation').style.display = 'none';
}

function displayUsernames() {
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    let usernameList = document.getElementById('usernameList');
    usernameList.innerHTML = '';

    accounts.forEach(account => {
        let div = document.createElement('div');
        div.classList.add('username-item');
        div.innerHTML = `
            <input type="checkbox" id="${account.username}" value="${account.username}" />
            <label for="${account.username}">${account.username}</label>
        `;
        usernameList.appendChild(div);
    });
}

function filterUsernames() {
    let filter = document.getElementById('searchDeleteInput').value.toLowerCase();
    let items = document.querySelectorAll('#usernameList .username-item');

    items.forEach(item => {
        let label = item.querySelector('label').textContent.toLowerCase();
        if (label.includes(filter)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function addToDeleteList() {
    let checkedItems = document.querySelectorAll('#usernameList input[type="checkbox"]:checked');
    let deleteList = document.getElementById('deleteList');

    checkedItems.forEach(item => {
        let username = item.value;
        if (!accountsToDelete.includes(username)) {
            accountsToDelete.push(username);
            let li = document.createElement('li');
            li.textContent = username;
            deleteList.appendChild(li);
        }
    });
}

function confirmDelete() {
    if (accountsToDelete.length === 0) {
        alert('Tidak ada akun yang dipilih untuk dihapus.');
        return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus akun yang dipilih?')) {
        let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        
        accounts = accounts.filter(account => !accountsToDelete.includes(account.username));
        
        localStorage.setItem('accounts', JSON.stringify(accounts));
        displayAccounts(); // Tampilkan kembali daftar akun

        // Kosongkan daftar hapus dan tutup pop-up
        accountsToDelete = [];
        document.getElementById('deleteList').innerHTML = '';
        closePopup();
    }
} 


function searchAccounts() {
    const searchTerm = document.getElementById('searchInput').value;
    displayAccounts(searchTerm); // Tampilkan akun yang sesuai dengan istilah pencarian
}


function promptPin(username) {
    currentUsername = username;
    document.getElementById('pinPopup').style.display = 'block';
}

function closePinPopup() {
    document.getElementById('pinPopup').style.display = 'none';
}


function verifyPin() {
    const pin = document.getElementById('pinInput').value;
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    let account = accounts.find(account => account.username === currentUsername);

    if (account.pin === '451') {
        // Jika PIN default, tampilkan popup untuk mengganti PIN
        showNotification('Anda harus mengganti PIN default terlebih dahulu.');
        promptChangeDefaultPin();
    } else if (pin === account.pin) {
        const otp = generateOTP();
        otpStore[currentUsername] = {
            otp,
            expiry: Date.now() + 5 * 60 * 1000 // OTP berlaku 5 menit
        };

        // Tampilkan OTP di popup dan salin ke clipboard
        try {
            navigator.clipboard.writeText(otp).then(() => {
                document.getElementById('otpMessage').textContent = `OTP untuk ${currentUsername} adalah: ${otp}`;
                document.getElementById('otpPopup').style.display = 'block';
                closePinPopup();
            });
        } catch (err) {
            showNotification(`Gagal menyalin OTP ke clipboard. Silakan salin OTP berikut secara manual: ${otp}`);
        }
    } else {
        showNotification('PIN salah!');
    }
}

function promptChangeDefaultPin() {
    const pin = prompt('Masukkan PIN Default (451):');
    if (pin === '451') {
        const newPin = prompt('Masukkan PIN Baru:');
        if (newPin) {
            updatePin(newPin);
            showNotification('PIN berhasil diubah. Silakan lanjutkan untuk mengganti password.');
            promptPin(currentUsername); // Lanjutkan ke verifikasi PIN baru
        } else {
            showNotification('PIN baru tidak valid.');
        }
    } else {
        showNotification('PIN default salah!');
    }
}

function updatePin(newPin) {
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    let account = accounts.find(account => account.username === currentUsername);

    if (account) {
        account.pin = newPin;
        localStorage.setItem('accounts', JSON.stringify(accounts));
    } else {
        showNotification('Gagal memperbarui PIN. Akun tidak ditemukan.');
    }
}

// Fungsi ini tetap sama seperti sebelumnya untuk meminta input PIN sebelum memproses lebih lanjut
function promptPin(username) {
    currentUsername = username;
    document.getElementById('pinPopup').style.display = 'block';
}


function closePinPopup() {
    document.getElementById('pinPopup').style.display = 'none';
}







function closeOtpPopup() {
    document.getElementById('otpPopup').style.display = 'none';
}

function verifyOtp() {
    const otpInput = document.getElementById('otpInput').value;
    const storedOtp = otpStore[currentUsername];
    
    if (storedOtp && Date.now() < storedOtp.expiry && otpInput === storedOtp.otp) {
        closeOtpPopup();
        showChangePasswordPopup();
    } else {
        showNotification('OTP tidak valid atau sudah kadaluarsa.');
    }
}

function showChangePasswordPopup() {
    const newPassword = prompt('Masukkan Password Baru:');
    if (newPassword) {
        updatePassword(currentUsername, newPassword);
    }
}

function updatePassword(username, newPassword) {
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    let accountIndex = accounts.findIndex(account => account.username === username);

    if (accountIndex !== -1) {
        const encryptedPassword = CryptoJS.AES.encrypt(newPassword, 'secret key 123').toString();
        accounts[accountIndex].password = encryptedPassword;
        localStorage.setItem('accounts', JSON.stringify(accounts));
        showNotification('Password berhasil diganti.');

        // Catat perubahan
        let laporan = JSON.parse(localStorage.getItem('laporan')) || [];
        laporan.push({ waktu: new Date().toLocaleString(), username, action: 'Ganti Password' });
        localStorage.setItem('laporan', JSON.stringify(laporan));
        
        // Reset OTP
        delete otpStore[username];
        displayAccounts();

        // Clear inputs
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('pinInput').value = '';
        document.getElementById('otpInput').value = '';
    } else {
        showNotification('Username tidak ditemukan.');
    }
}

function showNotification(message) {
    document.getElementById('notificationMessage').textContent = message;
    document.getElementById('notificationPopup').style.display = 'block';
}

function closeNotificationPopup() {
    document.getElementById('notificationPopup').style.display = 'none';
}

function displayLaporan() {
    let laporan = JSON.parse(localStorage.getItem('laporan')) || [];
    let laporanListDisplay = document.getElementById('laporanListDisplay');
    laporanListDisplay.innerHTML = '';

    // Membalikkan urutan laporan
    laporan.reverse();

    // Mengambil 20 laporan terbaru
    let recentLaporan = laporan.slice(0, 30);

    recentLaporan.forEach(entry => {
        let listItem = document.createElement('li');
        listItem.textContent = `${entry.waktu} - ${entry.username}: ${entry.action}`;
        laporanListDisplay.appendChild(listItem);
    });
}
window.onload = function() {
    displayAccounts();
    displayLaporan();
}; 


function applyDefaultPins() {
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];

    // Loop melalui semua akun untuk memastikan setiap akun memiliki PIN
    accounts.forEach(account => {
        if (!account.pin) {
            account.pin = '451'; // Set PIN default
        }
    });

    localStorage.setItem('accounts', JSON.stringify(accounts)); // Simpan kembali ke localStorage
}

window.onload = function() {
    applyDefaultPins(); // Panggil fungsi untuk mengatur PIN default
    displayAccounts();
    displayLaporan();
};



function promptPin(username) {
    currentUsername = username;
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    let account = accounts.find(account => account.username === username);
    
    if (account.pin === '451') {
        showNotification('Akun ini memiliki PIN default. Silakan ganti PIN terlebih dahulu.');
        document.getElementById('changePinPopup').style.display = 'block';
    } else {
        document.getElementById('pinPopup').style.display = 'block';
    }
}

function closeChangePinPopup() {
    document.getElementById('changePinPopup').style.display = 'none';
}

function changePin() {
    const oldPin = prompt('Masukkan PIN Lama:');
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    let account = accounts.find(account => account.username === currentUsername);

    if (oldPin === account.pin) {
        const newPin = prompt('Masukkan PIN Baru:');
        if (newPin) {
            account.pin = newPin;
            localStorage.setItem('accounts', JSON.stringify(accounts));
            showNotification('PIN berhasil diubah.');
            promptPin(currentUsername); // Lanjutkan ke verifikasi PIN baru
        } else {
            showNotification('PIN baru tidak valid.');
        }
    } else {
        showNotification('PIN lama salah!');
    }
}



function verifyPin() {
    const pin = document.getElementById('pinInput').value;
    let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    let account = accounts.find(account => account.username === currentUsername);

    if (pin === account.pin) {
        const otp = generateOTP();
        otpStore[currentUsername] = {
            otp,
            expiry: Date.now() + 5 * 60 * 1000 // OTP berlaku 5 menit
        };

        // Tampilkan OTP di popup dan salin ke clipboard
        try {
            navigator.clipboard.writeText(otp).then(() => {
                document.getElementById('otpMessage').textContent = `OTP untuk ${currentUsername} adalah: ${otp}`;
                document.getElementById('otpPopup').style.display = 'block';
                closePinPopup();
            });
        } catch (err) {
            showNotification(`Gagal menyalin OTP ke clipboard. Silakan salin OTP berikut secara manual: ${otp}`);
        }
    } else {
        showNotification('PIN salah!');
    }
}


document.addEventListener("DOMContentLoaded", function() {
    // Pastikan popup disembunyikan saat halaman dimuat
    var popup = document.querySelector('.popup1');
    if (popup) {
        popup.style.display = 'none';
    }
});



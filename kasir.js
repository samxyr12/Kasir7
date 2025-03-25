




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
    let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    
    // Hitung total akhir dari keranjang
    let totalAkhir = keranjang.reduce((total, item) => total + item.total, 0);

    // Validasi elemen-elemen kunci
    const popupElement = document.getElementById('popup');
    const totalBayarElement = document.getElementById('totalBayar');
    const totalBayarQRISElement = document.getElementById('totalBayarQRIS');

    // Cek apakah elemen-elemen ada
    if (!popupElement || !totalBayarElement || !totalBayarQRISElement) {
        console.error('Elemen popup pembayaran tidak ditemukan');
        alert('Terjadi kesalahan dalam memuat popup pembayaran');
        return;
    }

    // Reset metode pembayaran
    const metodeCash = document.getElementById('metodeCash');
    const metodeQRIS = document.getElementById('metodeQRIS');
    if (metodeCash) metodeCash.style.display = 'none';
    if (metodeQRIS) metodeQRIS.style.display = 'none';

    // Tampilkan popup pembayaran
    popupElement.style.display = 'flex';

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
            // Hitung poin yang akan diperoleh dari transaksi ini
            const poinBaru = hitungPoin(totalAkhir);
            
            infoMemberElement.innerHTML = `
                <strong>Member:</strong> ${member.nama}<br>
                <strong>ID:</strong> ${member.id}<br>
                <strong>No. Telp:</strong> ${member.noTelp}<br>
                <strong>Poin Saat Ini:</strong> ${member.poin || 0}<br>
                <strong>Poin yang akan didapat:</strong> +${poinBaru}
            `;
        } else {
            infoMemberElement.textContent = 'Transaksi Non-Member';
        }

        // Sisipkan elemen info member sebelum tombol metode pembayaran
        const metodePembayaranButton = popupContent.querySelector('button');
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

        // Simpan transaksi
        simpanTransaksi(metode, total, kembalian, idTransaksi, keranjang, memberTransaksi?.id, 0, nominal);

        // Proses poin untuk member
        if (memberTransaksi) {
            tambahPoinKeMember(memberTransaksi, total, metode, idTransaksi);
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

        // Simpan transaksi 
        simpanTransaksi(metode, total, 0, idTransaksi, keranjang, memberTransaksi?.id, 0, total);

        // Proses poin untuk member
        if (memberTransaksi) {
            tambahPoinKeMember(memberTransaksi, total, metode, idTransaksi);
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

function tambahPoinKeMember(memberData, totalBelanja, metode, idTransaksi) {
    // Hitung poin yang akan didapatkan
    const poinDiperoleh = hitungPoin(totalBelanja);
    
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
        
        // Simpan perubahan data member
        localStorage.setItem('members', JSON.stringify(members));
        
        // Update riwayat transaksi member jika ada
        if (!members[memberIndex].transaksiHistory) {
            members[memberIndex].transaksiHistory = [];
        }
        
        // Tambahkan transaksi ke riwayat
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
        // Initialize as empty arrays if there was an error
        transaksi = [];
        transaksiMetode = [];
    }

    // Current timestamp formatted
    const now = new Date();
    const tanggal = `${now.getFullYear()}-${
        String(now.getMonth() + 1).padStart(2, '0')
    }-${
        String(now.getDate()).padStart(2, '0')
    }`;
    
    // Prepare new transaction entries
    const newTransaksiEntries = [];
    
    // Iterate through cart items and create transaction entries
    keranjang.forEach((item) => {
        const transactionEntry = {
            id: idTransaksi,
            kodeBarang: item.kode,
            namaBarang: item.nama,
            jumlah: item.jumlah,
            harga: item.harga || item.hargaJual, // Handle different property names
            total: item.total,
            nominal: nominal, // Amount paid
            kembalian: kembalian,
            metode: metode,
            diskon: item.potongan || 0,
            persenDiskon: item.potongan || 0,
            tanggal: tanggal,
            memberId: memberId,
            poin: poin,
            timestamp: now.getTime() // Add timestamp for sorting
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
        
        console.log(`Transaction ${idTransaksi} saved successfully`);
        return true;
    } catch (error) {
        console.error("Error saving transaction:", error);
        
        // Try saving with fewer items if it fails (localStorage might be full)
        try {
            // Keep only the most recent 100 transactions
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
    const NAMA_TOKO = 'TOKO SERBAGUNA';
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
            transaksiTerpilih.forEach(item => {
                const namaBarang = potongTeks(item.namaBarang, 20);
                const qty = potongTeks(item.jumlah.toString(), 6);
                const harga = potongTeks(formatRupiah(item.total), 16);
                
                struk.push(
                    namaBarang.padEnd(20) + 
                    qty.padEnd(6) + 
                    harga
                );
                totalTransaksi += item.total;
            });

            // Footer Transaksi
            struk.push(garisPemisah());
            struk.push(barisRataKananKiri('Total:', formatRupiah(totalTransaksi)));
            struk.push(barisRataKananKiri('Metode Bayar:', transaksiTerpilih[0].metode));
            struk.push(barisRataKananKiri('Nominal:', formatRupiah(transaksiTerpilih[0].nominal || totalTransaksi)));
            struk.push(barisRataKananKiri('Kembalian:', formatRupiah(transaksiTerpilih[0].kembalian || 0)));
            struk.push(garisPemisah('='));

            // Penutup
            struk.push(pusatkanTeks('Terima Kasih'));
            struk.push(pusatkanTeks('Barang yang sudah dibeli'));
            struk.push(pusatkanTeks('tidak dapat dikembalikan'));

            // Gabungkan array menjadi teks
            return struk.join('\n');
        }

        // Fungsi untuk membuat struk WhatsApp
        function buatStrukWhatsApp() {
            let struk = [];

            // Header Toko
            struk.push(`*${NAMA_TOKO}*`);
            struk.push(`_${ALAMAT_TOKO}_`);
            struk.push('```');
            struk.push('================================');

            // Informasi Transaksi
            const waktuTransaksi = new Date().toLocaleString('id-ID', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            struk.push(`ID Transaksi: ${idTransaksi}`);
            struk.push(`Tanggal     : ${waktuTransaksi}`);
            struk.push('================================');

            // Header Kolom
            struk.push('Nama Barang           Qty  Harga');
            struk.push('--------------------------------');

            // Item Transaksi
            let totalTransaksi = 0;
            transaksiTerpilih.forEach(item => {
                const namaBarang = potongTeks(item.namaBarang, 20); // Potong teks jika terlalu panjang
                const qty = item.jumlah.toString().padStart(3); // Format jumlah
                const harga = formatRupiah(item.total).padStart(10); // Format harga

                struk.push(`${namaBarang.padEnd(20)} ${qty} ${harga}`);
                totalTransaksi += item.total;
            });

            // Footer Transaksi
            struk.push('--------------------------------');
            struk.push(`Total       : ${formatRupiah(totalTransaksi).padStart(15)}`);
            struk.push(`Metode Bayar:       ${transaksiTerpilih[0].metode}`);
            struk.push(`Nominal     :   ${formatRupiah(transaksiTerpilih[0].nominal || totalTransaksi).padStart(15)}`);
            struk.push(`Kembalian   :  ${formatRupiah(transaksiTerpilih[0].kembalian || 0).padStart(15)}`);
            struk.push('================================');
            struk.push('```');

            // Penutup
            struk.push('*Terima Kasih*');
            struk.push('_Barang yang sudah dibeli_');
            struk.push('_tidak dapat dikembalikan_');

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
                    const phoneRegex = /^(0|62|\+62)?[0-9]{9,12}$/;
                    if (!phoneRegex.test(value)) {
                        return 'Format nomor WhatsApp tidak valid!';
                    }
                }
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    kirimStrukKeWhatsApp(result.value); // Kirim struk ke nomor yang diinput
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
                            customClass: {
                                popup: 'rounded-2xl'
                            }
                        });
                    } finally {
                        btn.innerHTML = '<i class="fas fa-print mr-3"></i>Cetak & Unduh Struk';
                        btn.disabled = false;
                    }
                });

                document.getElementById('whatsappBtn').addEventListener('click', tanyaNomorWA);
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
    const pin = prompt('Masukkan PIN untuk void:');
    if (pin === '451') {
        let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
        let voids = JSON.parse(localStorage.getItem('voids')) || [];
        const item = keranjang[index];

        // Pastikan harga dalam bentuk angka
        const harga = parseFloat(item.harga);

        const kodeVoid = generateKodeVoid();
        voids.push({
            kodeVoid: kodeVoid,
            namaBarang: item.nama,
            jumlah: item.jumlah,
            harga: harga, // Pastikan harga dalam angka, bukan string
            total: harga * item.jumlah, // Kalkulasi total harga berdasarkan jumlah
            tanggal: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem('voids', JSON.stringify(voids));

        // Hapus item dari keranjang
        keranjang.splice(index, 1);
        localStorage.setItem('keranjang', JSON.stringify(keranjang));

        // Update stok barang
        let barang = JSON.parse(localStorage.getItem('barang')) || [];
        const barangItem = barang.find(b => b.kode === item.kode);
        if (barangItem) {
            barangItem.stok += item.jumlah;
            barangItem.terjual -= item.jumlah;
            localStorage.setItem('barang', JSON.stringify(barang));
        }

        loadKeranjang();
        
        alert(`Barang berhasil di-void dengan kode: ${kodeVoid}`);
    } else {
        alert('PIN salah');
    }
} 

function generateKodeVoid() {
    return Math.random().toString(36).substr(2, 5).toUpperCase();
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
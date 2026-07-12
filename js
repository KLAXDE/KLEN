document.addEventListener("DOMContentLoaded", () => {
    
    // --- Application State Elements ---
    let currentUser = null;
    let transactions = [];

    // --- DOM Elements Extraction ---
    const authContainer = document.getElementById("auth-container");
    const dashboardContainer = document.getElementById("dashboard-container");
    
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    
    const toRegisterLink = document.getElementById("to-register");
    const toLoginLink = document.getElementById("to-login");
    const btnLogout = document.getElementById("btn-logout");

    // Menu Navigation Elements
    const menuItems = document.querySelectorAll(".menu-item");
    const contentSections = document.querySelectorAll(".content-section");

    // Dynamic Display Fields
    const userWelcome = document.getElementById("user-welcome");
    const statApproved = document.getElementById("stat-approved");
    const statAvailable = document.getElementById("stat-available");
    const statUsed = document.getElementById("stat-used");
    const statPayments = document.getElementById("stat-payments");
    const txMaxAvailable = document.getElementById("tx-max-available");

    // Profile Fields
    const profName = document.getElementById("prof-name");
    const profEmail = document.getElementById("prof-email");
    const profPhone = document.getElementById("prof-phone");
    const profAmount = document.getElementById("prof-amount");
    const profTerm = document.getElementById("prof-term");

    // Transaction & Actions Elements
    const transferForm = document.getElementById("transfer-form");
    const transactionsLog = document.getElementById("transactions-log");

    // ================= INTERFACE ROUTING / NAVIGATION =================

    toRegisterLink.addEventListener("click", (e) => {
        e.preventDefault();
        loginForm.classList.add("hidden");
        registerForm.classList.remove("hidden");
    });

    toLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        registerForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
    });

    // Content Switcher Logic
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetSectionId = item.getAttribute("data-target");

            menuItems.forEach(i => i.classList.remove("active"));
            contentSections.forEach(s => s.classList.add("hidden"));

            item.classList.add("active");
            document.getElementById(targetSectionId).classList.remove("hidden");
        });
    });

    // ================= DATA MANAGEMENT CORE (LOCALSTORAGE) =================

    // Helper format currency to US Locale
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    // Initialize application state
    const checkSession = () => {
        const session = localStorage.getItem("cb_session");
        if (session) {
            currentUser = JSON.parse(localStorage.getItem(`cb_user_${session}`));
            if(currentUser) {
                loadUserData();
                showDashboard();
            }
        } else {
            showAuth();
        }
    };

    const showDashboard = () => {
        authContainer.classList.add("hidden");
        dashboardContainer.classList.remove("hidden");
    };

    const showAuth = () => {
        dashboardContainer.classList.add("hidden");
        authContainer.classList.remove("hidden");
    };

    const loadUserData = () => {
        // UI Information Binding
        userWelcome.textContent = `Bienvenido, ${currentUser.fullName}`;
        
        // Compute stats
        transactions = JSON.parse(localStorage.getItem(`cb_tx_${currentUser.email}`)) || [];
        
        const approved = parseFloat(currentUser.amountRequested);
        const used = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        const available = approved - used;
        const payments = 0.00; // Default requirement metric

        // UI Statistics Binding
        statApproved.textContent = formatCurrency(approved);
        statAvailable.textContent = formatCurrency(available);
        statUsed.textContent = formatCurrency(used);
        statPayments.textContent = formatCurrency(payments);
        txMaxAvailable.textContent = formatCurrency(available);

        // UI Profile Binding
        profName.textContent = currentUser.fullName;
        profEmail.textContent = currentUser.email;
        profPhone.textContent = currentUser.phone;
        profAmount.textContent = formatCurrency(approved);
        profTerm.textContent = `${currentUser.term} meses`;

        // Render History Table
        renderTransactions();
    };

    const renderTransactions = () => {
        transactionsLog.innerHTML = "";
        if (transactions.length === 0) {
            transactionsLog.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No hay transferencias registradas de momento.</td></tr>`;
            return;
        }

        // Display rows in inverted chronological order (Newest first)
        [...transactions].reverse().forEach(tx => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${tx.date}</td>
                <td><strong>${tx.bank}</strong></td>
                <td>${tx.holder}</td>
                <td>••••${tx.account.slice(-4)}</td>
                <td style="font-weight:600; color:var(--primary-color);">${formatCurrency(tx.amount)}</td>
                <td><span class="badge-status processing">${tx.status}</span></td>
            `;
            transactionsLog.appendChild(row);
        });
    };

    // ================= ACTIONS & EVENT HANDLERS =================

    // Sign Up Submission
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("reg-email").value.trim().toLowerCase();
        
        // Safety verification if user already exists
        if(localStorage.getItem(`cb_user_${email}`)) {
            alert("Error: Este correo electrónico ya se encuentra registrado.");
            return;
        }

        const newUser = {
            fullName: document.getElementById("reg-name").value.trim(),
            email: email,
            phone: document.getElementById("reg-phone").value.trim(),
            amountRequested: parseFloat(document.getElementById("reg-amount").value),
            term: parseInt(document.getElementById("reg-term").value),
            password: document.getElementById("reg-password").value // En production, un hachage cryptographique est requis
        };

        // Persist User Database Entity
        localStorage.setItem(`cb_user_${email}`, JSON.stringify(newUser));
        
        // Auto-Session Setup
        localStorage.setItem("cb_session", email);
        currentUser = newUser;

        alert("¡Registro completado con éxito! Su cuenta de crédito ha sido configurada.");
        registerForm.reset();
        
        loadUserData();
        showDashboard();
    });

    // Login Submission
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const password = document.getElementById("login-password").value;

        const userRecord = localStorage.getItem(`cb_user_${email}`);

        if (!userRecord) {
            alert("Error: Credenciales incorrectas o usuario inexistente.");
            return;
        }

        const parsedUser = JSON.parse(userRecord);

        if (parsedUser.password === password) {
            localStorage.setItem("cb_session", email);
            currentUser = parsedUser;
            loadUserData();
            showDashboard();
            loginForm.reset();
        } else {
            alert("Error: La contraseña ingresada es incorrecta.");
        }
    });

    // Fund Transfer Transaction Submission
    transferForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const amountToTransfer = parseFloat(document.getElementById("tx-amount").value);
        
        // Mathematical Limit Validation
        const approved = parseFloat(currentUser.amountRequested);
        const used = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        const available = approved - used;

        if (amountToTransfer > available) {
            alert(`Error: Fondos insuficientes. Su saldo disponible actual es de ${formatCurrency(available)}.`);
            return;
        }

        // Entity Schema Construction
        const now = new Date();
        const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const newTransaction = {
            date: formattedDate,
            holder: document.getElementById("tx-holder").value.trim(),
            account: document.getElementById("tx-account").value.trim(),
            routing: document.getElementById("tx-routing").value.trim(),
            bank: document.getElementById("tx-bank").value,
            amount: amountToTransfer,
            status: "Procesando"
        };

        // State & LocalStorage Updates
        transactions.push(newTransaction);
        localStorage.setItem(`cb_tx_${currentUser.email}`, JSON.stringify(transactions));

        alert("¡Transferencia solicitada con éxito! Los fondos están siendo procesados por la cámara de compensación.");
        transferForm.reset();
        
        // Recalculate metrics and update active view
        loadUserData();
    });

    // Session Destruction (Logout)
    btnLogout.addEventListener("click", () => {
        localStorage.removeItem("cb_session");
        currentUser = null;
        transactions = [];
        
        // Reset navigation visibility to default
        menuItems.forEach(i => i.classList.remove("active"));
        contentSections.forEach(s => s.classList.add("hidden"));
        menuItems[0].add("active");
        document.getElementById("sec-resumen").classList.remove("hidden");

        showAuth();
    });

    // Run Security Guard Layer Check on Startup
    checkSession();
});

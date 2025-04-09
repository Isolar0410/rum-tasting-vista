
/**
 * Script principal para la aplicación de Cata de Rones
 * Este script maneja toda la lógica de navegación, autenticación,
 * registro de invitados, votación y visualización de resultados.
 */

// Constantes
const MASTER_PASSWORD = "2001";
const STORAGE_KEY = "rumTastingData";

// Estado global de la aplicación
let appState = {
    configured: false,
    rumCount: 0,
    guests: [],
    results: []
};

// Función para inicializar la aplicación
function initApp() {
    console.log("Inicializando aplicación de Cata de Rones...");
    
    // Cargar datos previos si existen
    loadAppData();
    
    // Configurar los event listeners para los botones principales
    setupEventListeners();
}

/**
 * Funciones de gestión de datos y almacenamiento
 */

// Cargar datos de la aplicación desde localStorage
function loadAppData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            appState = JSON.parse(savedData);
            console.log("Datos cargados exitosamente:", appState);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            // Si hay un error, inicializar con valores por defecto
            resetAppData();
        }
    }
}

// Guardar datos de la aplicación en localStorage
function saveAppData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    console.log("Datos guardados exitosamente:", appState);
}

// Reiniciar todos los datos de la aplicación
function resetAppData() {
    appState = {
        configured: false,
        rumCount: 0,
        guests: [],
        results: []
    };
    saveAppData();
    console.log("Datos de la aplicación reiniciados");
}

/**
 * Funciones de navegación entre secciones
 */

// Mostrar una sección específica y ocultar las demás
function showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll("section").forEach(section => {
        section.classList.remove("active-section");
        section.classList.add("hidden-section");
    });
    
    // Mostrar la sección solicitada
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.classList.remove("hidden-section");
        sectionToShow.classList.add("active-section");
    }
    
    console.log(`Navegación: Mostrando sección "${sectionId}"`);
}

/**
 * Configuración de event listeners
 */
function setupEventListeners() {
    // Botones de la pantalla de bienvenida
    document.getElementById("master-btn").addEventListener("click", () => {
        showSection("master-login-section");
    });
    
    document.getElementById("guest-btn").addEventListener("click", checkTastingStatus);
    
    // Eventos para Maestro Ronero
    document.getElementById("login-btn").addEventListener("click", validateMasterLogin);
    document.getElementById("save-config-btn").addEventListener("click", saveRumConfiguration);
    document.getElementById("refresh-results-btn").addEventListener("click", refreshResults);
    document.getElementById("end-tasting-btn").addEventListener("click", endTasting);
    
    // Eventos para Invitado
    document.getElementById("register-btn").addEventListener("click", registerGuest);
    document.getElementById("submit-score-btn").addEventListener("click", submitScore);
    
    // Botones de volver
    document.getElementById("back-to-welcome-from-login").addEventListener("click", () => {
        showSection("welcome-section");
    });
    
    document.getElementById("back-to-welcome-from-check").addEventListener("click", () => {
        showSection("welcome-section");
    });
    
    document.getElementById("back-to-welcome-from-register").addEventListener("click", () => {
        showSection("welcome-section");
    });
    
    console.log("Event listeners configurados correctamente");
}

/**
 * Funciones para el flujo del Maestro Ronero
 */

// Validar la contraseña del Maestro Ronero
function validateMasterLogin() {
    const passwordInput = document.getElementById("master-password");
    const errorElement = document.getElementById("login-error");
    
    if (passwordInput.value === MASTER_PASSWORD) {
        // Contraseña correcta, navegar a la sección de configuración
        errorElement.classList.add("hidden");
        passwordInput.value = ""; // Limpiar el campo por seguridad
        
        // Si ya está configurada la cata, ir directamente a resultados
        if (appState.configured) {
            showMasterResults();
        } else {
            showSection("master-config-section");
        }
    } else {
        // Contraseña incorrecta, mostrar error
        errorElement.classList.remove("hidden");
        passwordInput.focus();
    }
}

// Guardar la configuración de la cantidad de rones
function saveRumConfiguration() {
    const rumCountInput = document.getElementById("rum-count");
    const rumCount = parseInt(rumCountInput.value);
    
    // Validar que el número esté en el rango adecuado
    if (rumCount >= 1 && rumCount <= 10) {
        appState.configured = true;
        appState.rumCount = rumCount;
        saveAppData();
        
        // Mostrar la sección de resultados
        showMasterResults();
    } else {
        alert("Por favor, ingrese un número válido entre 1 y 10");
        rumCountInput.focus();
    }
}

// Mostrar la sección de resultados del Maestro con los datos actualizados
function showMasterResults() {
    // Actualizar el contador de rones configurados
    document.getElementById("configured-rum-count").textContent = appState.rumCount;
    
    // Actualizar la tabla de resultados
    refreshResults();
    
    // Mostrar sección
    showSection("master-results-section");
}

// Actualizar la tabla de resultados
function refreshResults() {
    const tableBody = document.getElementById("results-body");
    const noResultsMessage = document.getElementById("no-results-message");
    
    // Limpiar la tabla actual
    tableBody.innerHTML = "";
    
    if (appState.results.length === 0) {
        // No hay resultados, mostrar mensaje
        noResultsMessage.classList.remove("hidden");
    } else {
        // Ocultar mensaje de no resultados
        noResultsMessage.classList.add("hidden");
        
        // Mostrar cada resultado en la tabla
        appState.results.forEach((result, index) => {
            const guest = appState.guests.find(g => g.id === result.guestId);
            const guestName = guest ? `${guest.name} ${guest.lastname}` : "Invitado Desconocido";
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${guestName}</td>
                <td>${result.rumNumber}</td>
                <td>${result.scores.purity}</td>
                <td>${result.scores.visual}</td>
                <td>${result.scores.taste}</td>
                <td>${result.scores.smell}</td>
                <td><strong>${result.total}</strong></td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    console.log("Resultados actualizados en la tabla");
}

// Finalizar la cata y reiniciar los datos
function endTasting() {
    if (confirm("¿Está seguro que desea finalizar la cata? Esto eliminará todos los resultados y configuraciones.")) {
        resetAppData();
        showSection("welcome-section");
    }
}

/**
 * Funciones para el flujo de Invitado
 */

// Verificar si la cata está configurada para permitir invitados
function checkTastingStatus() {
    showSection("guest-check-section");
    const checkMessage = document.getElementById("guest-check-message");
    
    if (appState.configured) {
        checkMessage.textContent = "La cata está configurada. Puede registrarse como invitado.";
        checkMessage.className = "info-message success";
        
        // Redirigir automáticamente después de un breve retraso
        setTimeout(() => {
            showSection("guest-register-section");
        }, 1500);
    } else {
        checkMessage.textContent = "La cata aún no ha sido configurada por el Maestro Ronero. Por favor, espere a que se configure la cata.";
        checkMessage.className = "info-message error-message";
    }
}

// Registrar un nuevo invitado
function registerGuest() {
    const nameInput = document.getElementById("guest-name");
    const lastnameInput = document.getElementById("guest-lastname");
    
    const name = nameInput.value.trim();
    const lastname = lastnameInput.value.trim();
    
    if (name && lastname) {
        // Crear nuevo invitado
        const newGuest = {
            id: Date.now().toString(), // Usar timestamp como ID único
            name: name,
            lastname: lastname,
            rumsCompleted: 0
        };
        
        // Agregar al estado de la aplicación
        appState.guests.push(newGuest);
        saveAppData();
        
        // Preparar la sección de votación
        prepareVotingSection(newGuest);
        
        // Limpiar campos del formulario
        nameInput.value = "";
        lastnameInput.value = "";
    } else {
        alert("Por favor, complete todos los campos requeridos");
    }
}

// Preparar la sección de votación para un invitado específico
function prepareVotingSection(guest) {
    // Actualizar información del invitado
    document.getElementById("voting-guest-name").textContent = `${guest.name} ${guest.lastname}`;
    document.getElementById("remaining-rums").textContent = appState.rumCount - guest.rumsCompleted;
    document.getElementById("total-rums").textContent = appState.rumCount;
    document.getElementById("current-rum-number").textContent = guest.rumsCompleted + 1;
    
    // Limpiar formulario de votación
    clearVotingForm();
    
    // Mostrar u ocultar elementos según el estado
    const votingForm = document.getElementById("voting-form");
    const votingCompleted = document.getElementById("voting-completed");
    
    if (guest.rumsCompleted < appState.rumCount) {
        votingForm.classList.remove("hidden");
        votingCompleted.classList.add("hidden");
    } else {
        votingForm.classList.add("hidden");
        votingCompleted.classList.remove("hidden");
    }
    
    // Mostrar sección
    showSection("guest-voting-section");
}

// Limpiar el formulario de votación
function clearVotingForm() {
    document.getElementById("purity-score").value = "";
    document.getElementById("visual-score").value = "";
    document.getElementById("taste-score").value = "";
    document.getElementById("smell-score").value = "";
    document.getElementById("voting-error").classList.add("hidden");
}

// Enviar la puntuación de un ron
function submitScore() {
    // Obtener valores del formulario
    const purityScore = parseInt(document.getElementById("purity-score").value);
    const visualScore = parseInt(document.getElementById("visual-score").value);
    const tasteScore = parseInt(document.getElementById("taste-score").value);
    const smellScore = parseInt(document.getElementById("smell-score").value);
    
    // Validar que todos los campos estén completados y dentro de rangos
    if (
        isNaN(purityScore) || purityScore < 2 || purityScore > 10 ||
        isNaN(visualScore) || visualScore < 2 || visualScore > 10 ||
        isNaN(tasteScore) || tasteScore < 4 || tasteScore > 20 ||
        isNaN(smellScore) || smellScore < 2 || smellScore > 25
    ) {
        document.getElementById("voting-error").classList.remove("hidden");
        return;
    }
    
    // Calcular puntuación total
    const totalScore = purityScore + visualScore + tasteScore + smellScore;
    
    // Encontrar el invitado actual
    const guestNameDisplay = document.getElementById("voting-guest-name").textContent;
    const currentGuest = appState.guests.find(guest => 
        `${guest.name} ${guest.lastname}` === guestNameDisplay
    );
    
    if (currentGuest) {
        // Registrar la puntuación
        appState.results.push({
            guestId: currentGuest.id,
            rumNumber: currentGuest.rumsCompleted + 1,
            timestamp: Date.now(),
            scores: {
                purity: purityScore,
                visual: visualScore,
                taste: tasteScore,
                smell: smellScore
            },
            total: totalScore
        });
        
        // Actualizar contador de rones completados
        currentGuest.rumsCompleted++;
        saveAppData();
        
        // Actualizar la interfaz
        prepareVotingSection(currentGuest);
    }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", initApp);

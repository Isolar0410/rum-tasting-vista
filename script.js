
/**
 * Script principal para la aplicación de Cata de Rones
 * Este script maneja toda la lógica de navegación, autenticación,
 * registro de participantes, votación, visualización de resultados,
 * y evaluación ron por ron con cálculo de promedios.
 */

// Constantes
const MASTER_PASSWORD = "2001";
const STORAGE_KEY = "rumTastingData";
const UPDATE_INTERVAL = 3000; // Intervalo de actualización en milisegundos (3 segundos)

// Estado global de la aplicación
let appState = {
    configured: false,
    rumCount: 0,
    currentRum: 1,
    guests: [],
    results: [],
    rumAverages: []
};

// Variables para intervalos de actualización
let masterUpdateInterval = null;
let guestUpdateInterval = null;

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
        currentRum: 1,
        guests: [],
        results: [],
        rumAverages: []
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
    
    // Iniciar o detener intervalos de actualización dependiendo de la sección
    setupUpdateIntervals(sectionId);
}

// Configurar intervalos de actualización basados en la sección actual
function setupUpdateIntervals(sectionId) {
    // Limpiar cualquier intervalo existente
    clearInterval(masterUpdateInterval);
    clearInterval(guestUpdateInterval);
    
    // Configurar nuevos intervalos según la sección
    if (sectionId === "master-results-section") {
        // Para la sección de resultados del maestro
        masterUpdateInterval = setInterval(() => {
            loadAppData(); // Recargar datos del localStorage
            refreshResults(); // Actualizar la tabla de resultados
            updateRumAverages(); // Actualizar promedios
        }, UPDATE_INTERVAL);
    } else if (sectionId === "guest-voting-section" || sectionId === "guest-check-section") {
        // Para secciones de participante
        guestUpdateInterval = setInterval(() => {
            // Guardar el estado actual para comparar después
            const oldState = JSON.stringify(appState);
            
            // Recargar datos
            loadAppData();
            
            // Si los datos han cambiado, actualizar la interfaz según corresponda
            if (oldState !== JSON.stringify(appState)) {
                if (sectionId === "guest-check-section") {
                    checkTastingStatus(false); // Actualizar estado sin cambiar de sección
                } else if (sectionId === "guest-voting-section") {
                    // Actualizar la interfaz de votación si ha cambiado el ron actual
                    const guestNameDisplay = document.getElementById("voting-guest-name").textContent;
                    const currentGuest = appState.guests.find(guest => 
                        `${guest.name} ${guest.lastname}` === guestNameDisplay
                    );
                    
                    if (currentGuest) {
                        prepareVotingSection(currentGuest);
                    }
                }
            }
        }, UPDATE_INTERVAL);
    }
}

/**
 * Configuración de event listeners
 */
function setupEventListeners() {
    // Botones de la pantalla de bienvenida
    document.getElementById("master-btn").addEventListener("click", () => {
        showSection("master-login-section");
    });
    
    document.getElementById("guest-btn").addEventListener("click", () => checkTastingStatus(true));
    
    // Eventos para Maestro Ronero
    document.getElementById("login-btn").addEventListener("click", validateMasterLogin);
    document.getElementById("save-config-btn").addEventListener("click", saveRumConfiguration);
    document.getElementById("refresh-results-btn").addEventListener("click", () => {
        loadAppData(); // Recargar datos del localStorage
        refreshResults(); // Actualizar tabla de resultados
        updateRumAverages(); // Actualizar promedios
    });
    document.getElementById("next-rum-btn").addEventListener("click", nextRum);
    document.getElementById("end-tasting-btn").addEventListener("click", endTasting);
    document.getElementById("master-participate-btn").addEventListener("click", setupMasterVoting);
    
    // Eventos para Participante
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
        appState.currentRum = 1;
        appState.rumAverages = Array(rumCount).fill().map(() => ({
            participants: [],
            totalScores: {
                purity: 0,
                visual: 0,
                taste: 0,
                smell: 0,
                total: 0
            },
            averageScores: {
                purity: 0,
                visual: 0,
                taste: 0,
                smell: 0,
                total: 0
            },
            participantCount: 0
        }));
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
    // Actualizar el contador de rones configurados y el ron actual
    document.getElementById("configured-rum-count").textContent = appState.rumCount;
    document.getElementById("current-rum-number").textContent = appState.currentRum;
    document.getElementById("total-rum-count").textContent = appState.rumCount;
    
    // Actualizar la tabla de resultados y los promedios
    refreshResults();
    updateRumAverages();
    
    // Mostrar sección
    showSection("master-results-section");
}

// Actualizar la tabla de resultados para el ron actual
function refreshResults() {
    const tableBody = document.getElementById("results-body");
    const noResultsMessage = document.getElementById("no-results-message");
    
    // Limpiar la tabla actual
    tableBody.innerHTML = "";
    
    // Filtrar resultados solo para el ron actual
    const currentResults = appState.results.filter(result => result.rumNumber === appState.currentRum);
    
    if (currentResults.length === 0) {
        // No hay resultados para este ron, mostrar mensaje
        noResultsMessage.classList.remove("hidden");
    } else {
        // Ocultar mensaje de no resultados
        noResultsMessage.classList.add("hidden");
        
        // Mostrar cada resultado en la tabla
        currentResults.forEach(result => {
            const guest = appState.guests.find(g => g.id === result.guestId);
            const guestName = guest ? `${guest.name.toUpperCase()} ${guest.lastname.toUpperCase()}` : "Participante Desconocido";
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${guestName}</td>
                <td><strong>${result.total}</strong></td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    console.log("Resultados actualizados en la tabla para el ron actual");
}

// Calcular y actualizar los promedios de todos los rones
function updateRumAverages() {
    const rumAveragesContainer = document.getElementById("rum-averages");
    rumAveragesContainer.innerHTML = "";
    
    // Asegurarnos de que rumAverages esté inicializado correctamente
    if (!appState.rumAverages || appState.rumAverages.length !== appState.rumCount) {
        appState.rumAverages = Array(appState.rumCount).fill().map(() => ({
            participants: [],
            totalScores: {
                purity: 0,
                visual: 0,
                taste: 0,
                smell: 0,
                total: 0
            },
            averageScores: {
                purity: 0,
                visual: 0,
                taste: 0,
                smell: 0,
                total: 0
            },
            participantCount: 0
        }));
    }
    
    // Recalcular los promedios para cada ron
    for (let rumIndex = 0; rumIndex < appState.rumCount; rumIndex++) {
        const rumNumber = rumIndex + 1;
        
        // Filtrar resultados para este ron
        const rumResults = appState.results.filter(result => result.rumNumber === rumNumber);
        
        // Si no hay resultados para este ron, continuar con el siguiente
        if (rumResults.length === 0) {
            continue;
        }
        
        // Calcular los totales y promedios
        const totalScores = {
            purity: 0,
            visual: 0,
            taste: 0,
            smell: 0,
            total: 0
        };
        
        const participants = [];
        
        rumResults.forEach(result => {
            const guest = appState.guests.find(g => g.id === result.guestId);
            if (guest) {
                totalScores.purity += result.scores.purity;
                totalScores.visual += result.scores.visual;
                totalScores.taste += result.scores.taste;
                totalScores.smell += result.scores.smell;
                totalScores.total += result.total;
                
                participants.push({
                    name: `${guest.name.toUpperCase()} ${guest.lastname.toUpperCase()}`,
                    score: result.total
                });
            }
        });
        
        const participantCount = rumResults.length;
        
        const averageScores = {
            purity: participantCount > 0 ? (totalScores.purity / participantCount).toFixed(2) : 0,
            visual: participantCount > 0 ? (totalScores.visual / participantCount).toFixed(2) : 0,
            taste: participantCount > 0 ? (totalScores.taste / participantCount).toFixed(2) : 0,
            smell: participantCount > 0 ? (totalScores.smell / participantCount).toFixed(2) : 0,
            total: participantCount > 0 ? (totalScores.total / participantCount).toFixed(2) : 0
        };
        
        // Actualizar los promedios en el estado de la aplicación
        appState.rumAverages[rumIndex] = {
            participants,
            totalScores,
            averageScores,
            participantCount
        };
        
        // Crear la tarjeta de promedios para este ron
        const rumCard = document.createElement("div");
        rumCard.className = "rum-card";
        
        // Si este es el ron actual, destacarlo
        if (rumNumber === appState.currentRum) {
            rumCard.style.borderLeftColor = "var(--success-color)";
            rumCard.style.borderLeftWidth = "6px";
        }
        
        let participantsHtml = '';
        participants.forEach(p => {
            participantsHtml += `
                <div class="participant-item">
                    <span class="participant-name">${p.name}</span>
                    <span class="participant-score">${p.score}</span>
                </div>
            `;
        });
        
        rumCard.innerHTML = `
            <h4>Ron #${rumNumber}</h4>
            <div class="rum-stats">
                <div>Puntuación promedio:</div>
                <span class="average-score">${averageScores.total}</span>
            </div>
            <div class="rum-stats">
                <div>Participantes:</div>
                <span>${participantCount}</span>
            </div>
            <div class="rum-stats">
                <div>Promedios por categoría:</div>
            </div>
            <div class="rum-stats">
                <div>- Pureza:</div>
                <span>${averageScores.purity}</span>
            </div>
            <div class="rum-stats">
                <div>- Vista:</div>
                <span>${averageScores.visual}</span>
            </div>
            <div class="rum-stats">
                <div>- Gusto:</div>
                <span>${averageScores.taste}</span>
            </div>
            <div class="rum-stats">
                <div>- Olfato:</div>
                <span>${averageScores.smell}</span>
            </div>
            <div class="participant-list">
                ${participantsHtml}
            </div>
        `;
        
        rumAveragesContainer.appendChild(rumCard);
    }
    
    saveAppData();
    console.log("Promedios de rones actualizados");
}

// Pasar al siguiente ron
function nextRum() {
    if (appState.currentRum < appState.rumCount) {
        appState.currentRum++;
        saveAppData();
        
        // Actualizar la interfaz con el nuevo ron actual
        document.getElementById("current-rum-number").textContent = appState.currentRum;
        
        // Refrescar resultados y promedios
        refreshResults();
        updateRumAverages();
        
        // Notificar a los participantes que pueden votar en el siguiente ron
        notifyParticipantsOfNextRum();
    } else {
        alert("Ya está en el último ron. No hay más rones para evaluar.");
    }
}

// Notificar a los participantes que pueden votar en el siguiente ron
function notifyParticipantsOfNextRum() {
    // Actualizar el estado de los participantes para que puedan votar en el nuevo ron
    appState.guests.forEach(guest => {
        if (!guest.rumsVoted) {
            guest.rumsVoted = {};
        }
        // No es necesario inicializar el nuevo ron, se hará cuando voten
    });
    saveAppData();
}

// Finalizar la cata y reiniciar los datos
function endTasting() {
    if (confirm("¿Está seguro que desea finalizar la cata? Esto eliminará todos los resultados y configuraciones.")) {
        resetAppData();
        showSection("welcome-section");
    }
}

/**
 * Funciones para configurar la votación del Maestro
 */
function setupMasterVoting() {
    // Crear un "participante" para el Maestro Ronero si no existe
    let masterGuest = appState.guests.find(g => g.isMaster === true);
    
    if (!masterGuest) {
        masterGuest = {
            id: "master-" + Date.now().toString(),
            name: "Maestro",
            lastname: "Ronero",
            rumsVoted: {},
            isMaster: true
        };
        
        appState.guests.push(masterGuest);
        saveAppData();
    }
    
    // Verificar si el Maestro ya votó en el ron actual
    if (masterGuest.rumsVoted && masterGuest.rumsVoted[appState.currentRum]) {
        alert("Ya ha votado para el ron actual. Debe pasar al siguiente ron para votar nuevamente.");
        return;
    }
    
    // Preparar la sección de votación para el Maestro
    prepareVotingSection(masterGuest);
}

/**
 * Funciones para el flujo de Participante
 */

// Verificar si la cata está configurada para permitir participantes
function checkTastingStatus(changeSection = true) {
    if (changeSection) {
        showSection("guest-check-section");
    }
    
    const checkMessage = document.getElementById("guest-check-message");
    
    // Forzar recarga de datos del localStorage
    loadAppData();
    
    if (appState.configured) {
        checkMessage.textContent = "La cata está configurada. Puede registrarse como participante.";
        checkMessage.className = "info-message success";
        
        // Redirigir automáticamente después de un breve retraso si se solicitó cambio de sección
        if (changeSection) {
            setTimeout(() => {
                showSection("guest-register-section");
            }, 1500);
        }
    } else {
        checkMessage.textContent = "La cata aún no ha sido configurada por el Maestro Ronero. Por favor, espere a que se configure la cata.";
        checkMessage.className = "info-message error-message";
    }
}

// Registrar un nuevo participante
function registerGuest() {
    const nameInput = document.getElementById("guest-name");
    const lastnameInput = document.getElementById("guest-lastname");
    
    const name = nameInput.value.trim();
    const lastname = lastnameInput.value.trim();
    
    if (name && lastname) {
        // Crear nuevo participante
        const newGuest = {
            id: Date.now().toString(), // Usar timestamp como ID único
            name: name,
            lastname: lastname,
            rumsVoted: {}, // Objeto para seguir en qué rones ha votado
            isMaster: false
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

// Preparar la sección de votación para un participante específico
function prepareVotingSection(guest) {
    // Forzar recarga de datos más recientes
    loadAppData();
    
    // Actualizar información del participante
    document.getElementById("voting-guest-name").textContent = `${guest.name} ${guest.lastname}`;
    document.getElementById("guest-current-rum").textContent = appState.currentRum;
    document.getElementById("guest-total-rums").textContent = appState.rumCount;
    document.getElementById("voting-rum-number").textContent = appState.currentRum;
    
    // Limpiar formulario de votación
    clearVotingForm();
    
    // Verificar si el participante ya votó en el ron actual
    const hasVotedCurrentRum = guest.rumsVoted && guest.rumsVoted[appState.currentRum];
    
    // Verificar si se han completado todos los rones
    const allRumsCompleted = appState.currentRum === appState.rumCount && hasVotedCurrentRum;
    
    // Mostrar u ocultar elementos según el estado
    const votingForm = document.getElementById("voting-form");
    const votingCompleted = document.getElementById("voting-completed");
    const tastingCompleted = document.getElementById("tasting-completed");
    
    if (allRumsCompleted) {
        // Cata completamente finalizada
        votingForm.classList.add("hidden");
        votingCompleted.classList.add("hidden");
        tastingCompleted.classList.remove("hidden");
    } else if (hasVotedCurrentRum) {
        // Ron actual completado, esperando al siguiente
        votingForm.classList.add("hidden");
        votingCompleted.classList.remove("hidden");
        tastingCompleted.classList.add("hidden");
    } else {
        // Puede votar en el ron actual
        votingForm.classList.remove("hidden");
        votingCompleted.classList.add("hidden");
        tastingCompleted.classList.add("hidden");
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
    
    // Encontrar el participante actual
    const guestNameDisplay = document.getElementById("voting-guest-name").textContent;
    const currentGuest = appState.guests.find(guest => 
        `${guest.name} ${guest.lastname}` === guestNameDisplay
    );
    
    if (currentGuest) {
        // Inicializar el objeto rumsVoted si no existe
        if (!currentGuest.rumsVoted) {
            currentGuest.rumsVoted = {};
        }
        
        // Marcar este ron como votado
        currentGuest.rumsVoted[appState.currentRum] = true;
        
        // Registrar la puntuación
        appState.results.push({
            guestId: currentGuest.id,
            rumNumber: appState.currentRum,
            timestamp: Date.now(),
            scores: {
                purity: purityScore,
                visual: visualScore,
                taste: tasteScore,
                smell: smellScore
            },
            total: totalScore
        });
        
        saveAppData();
        
        // Si el Maestro Ronero termina su votación, volver a la pantalla de resultados
        if (currentGuest.isMaster) {
            setTimeout(() => {
                showMasterResults();
            }, 1500);
        } else {
            // Actualizar la interfaz para mostrar mensaje de espera
            prepareVotingSection(currentGuest);
        }
        
        // Actualizar los promedios de los rones (esto afectará al panel del Maestro Ronero)
        updateRumAverages();
    }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", initApp);


let selectedTheme = null;


const themeSelect = document.getElementById('themeSelect');
const startBtn = document.getElementById('startBtn');
const flashcardsBtn = document.getElementById('flashcardsBtn');

// Event listener para el cambio de tema
themeSelect.addEventListener('change', function() {
    selectedTheme = this.value;
    
    // Habilitar botones de acción
    startBtn.disabled = false;
    flashcardsBtn.disabled = false;
    
    console.log('Tema seleccionado:', selectedTheme);
});

// Event listener para botón "Iniciar juego"
startBtn.addEventListener('click', function() {
    if (selectedTheme) {
        const themeName = selectedTheme === 'recycling' ? 'Separación de residuos' : 'Matemáticas';
        alert(`¡Iniciando juego de ${themeName}!`);
        console.log('Iniciando juego con tema:', selectedTheme);
        
        // Aquí iría la lógica del juego o redirección
        // window.location.href = `/game.html?theme=${selectedTheme}`;
    } else {
        alert('Por favor, selecciona un tema primero.');
    }
});

// Event listener para botón "Ver flashcards"
flashcardsBtn.addEventListener('click', function() {
    if (selectedTheme) {
        // Redirigir a la página de flashcards
        window.location.href = 'flashcards.html';
    } else {
        alert('Por favor, selecciona un tema primero.');
    }
});

// Inicializar botones deshabilitados
startBtn.disabled = true;
flashcardsBtn.disabled = true;

// Efecto de entrada suave al cargar la página
window.addEventListener('load', function() {
    document.querySelector('.container').style.opacity = '0';
    document.querySelector('.container').style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        document.querySelector('.container').style.transition = 'all 0.6s ease';
        document.querySelector('.container').style.opacity = '1';
        document.querySelector('.container').style.transform = 'translateY(0)';
    }, 100);
});
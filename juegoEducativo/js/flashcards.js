// Datos de las flashcards
const flashcardsData = [
    {
        id: 'organic',
        title: 'Orgánico',
        definition: 'Son residuos biodegradables que provienen de plantas y animales. Incluyen restos de comida, cáscaras de frutas y verduras, hojas secas y otros materiales naturales que se descomponen fácilmente.',
        curiosity: 'El 40% de los residuos que generamos diariamente son orgánicos y pueden convertirse en compost, un abono natural excelente para las plantas.',
        backContent: {
            title: '¡Muy bien!',
            text: 'Los residuos orgánicos deben ir en bolsas biodegradables o contenedores específicos para compostaje.',
            examples: [
                'Restos de frutas y verduras',
                'Sobras de comida',
                'Cáscaras de plátano, naranja, huevo',
                'Hojas secas y pasto cortado',
                'Pan y alimentos vencidos',
                'Restos de café y té'
            ]
        }
    },
    {
        id: 'recyclable',
        title: 'Inorgánicos Reciclables',
        definition: 'Son materiales que pueden ser procesados y reutilizados para crear nuevos productos. Incluyen plástico, vidrio, papel, cartón y algunos metales que no están contaminados.',
        curiosity: 'Una botella de plástico puede tardar hasta 450 años en descomponerse en un vertedero, pero si se recicla, puede convertirse en una nueva botella en solo 6 semanas.',
        backContent: {
            title: '¡Excelente!',
            text: 'Los materiales reciclables deben estar limpios y secos antes de depositarlos. Sepáralos por tipo para facilitar el proceso de reciclaje.',
            examples: [
                'Botellas y envases de plástico PET',
                'Periódicos, revistas y cuadernos',
                'Cajas de cartón limpias',
                'Botellas y frascos de vidrio',
                'Envases de yogurt y shampoo',
                'Latas de aluminio y acero (limpias)'
            ]
        }
    },
    {
        id: 'nonrecyclable',
        title: 'Inorgánico No Reciclable',
        definition: 'Son residuos que no pueden ser reciclados ni compostados debido a su composición o contaminación. Incluyen pañales, papeles higiénicos, envolturas de comida grasienta y materiales mixtos complejos.',
        curiosity: 'Los pañales desechables pueden tardar más de 500 años en descomponerse y representan una gran cantidad de residuos en los vertederos.',
        backContent: {
            title: '¡Correcto!',
            text: 'Estos residuos deben ir en bolsas resistentes y depositarse en contenedores de basura general. Intenta reducir su uso optando por alternativas reutilizables.',
            examples: [
                'Pañales desechables',
                'Papel higiénico y servilletas usadas',
                'Envolturas de comida grasienta',
                'Colillas de cigarro',
                'Cepillos de dientes',
                'Curitas y vendajes médicos'
            ]
        }
    },
    {
        id: 'metal',
        title: 'Metales',
        definition: 'Incluyen latas de aluminio y acero, tapas metálicas, envases de conservas y otros objetos metálicos. Son altamente reciclables y pueden ser procesados indefinidamente sin perder calidad.',
        curiosity: 'Reciclar una lata de aluminio ahorra suficiente energía para mantener un televisor encendido durante 3 horas. Además, el aluminio puede reciclarse infinitamente.',
        backContent: {
            title: '¡Perfecto!',
            text: 'Los metales deben estar limpios y secos. Las latas de aluminio y acero se pueden reciclar por separado o juntos, dependiendo de las normas locales.',
            examples: [
                'Latas de cerveza y refresco',
                'Latas de conservas (atún, frijoles)',
                'Tapas metálicas de botellas',
                'Envases metálicos de aerosol (vacíos)',
                'Bandejas de aluminio',
                'Objetos metálicos pequeños (limpios)'
            ]
        }
    }
];

// Variables de estado
let currentCardIndex = 0;
let isFlipped = false;

// Elementos del DOM
const flashcard = document.getElementById('flashcard');
const flashcardContainer = document.getElementById('flashcardContainer');
const cardTitle = document.getElementById('cardTitle');
const cardDefinition = document.getElementById('cardDefinition');
const curiosityText = document.getElementById('curiosityText');
const currentCardEl = document.getElementById('currentCard');
const totalCardsEl = document.getElementById('totalCards');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dots = document.querySelectorAll('.dot');
const backBtn = document.querySelector('.back-btn');

// Inicializar flashcard
function initFlashcard() {
    totalCardsEl.textContent = flashcardsData.length;
    updateCard();
    updateNavigation();
    updatePagination();
}

// Actualizar contenido de la tarjeta
function updateCard() {
    const card = flashcardsData[currentCardIndex];
    
    // Actualizar texto
    cardTitle.textContent = card.title;
    cardDefinition.textContent = card.definition;
    curiosityText.textContent = card.curiosity;
    
    // Actualizar contador
    currentCardEl.textContent = currentCardIndex + 1;
    
    // Actualizar clase de color
    flashcard.className = 'flashcard';
    flashcard.classList.add(card.id);
    
    // Actualizar cara posterior con ejemplos
    updateBackContent(card.backContent);
    
    // Resetear volteo
    isFlipped = false;
    flashcard.classList.remove('flipped');
}

// Actualizar contenido del reverso con ejemplos
function updateBackContent(backContent) {
    const backContentDiv = flashcard.querySelector('.back-content');
    
    // Crear nuevo contenido
    const newContent = `
        <p class="back-text">
            ${backContent.text}
        </p>
        <div class="examples-box">
            <h3>Ejemplos:</h3>
            <ul class="examples-list">
                ${backContent.examples.map(example => `<li>${example}</li>`).join('')}
            </ul>
        </div>
    `;
    
    backContentDiv.innerHTML = newContent;
}

// Actualizar botones de navegación
function updateNavigation() {
    prevBtn.disabled = currentCardIndex === 0;
    nextBtn.disabled = currentCardIndex === flashcardsData.length - 1;
}

// Actualizar paginación
function updatePagination() {
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentCardIndex);
    });
}

// Voltear tarjeta
flashcardContainer.addEventListener('click', function(e) {
    // Evitar que el clic en botones internos voltee la tarjeta
    if (e.target.closest('.nav-btn') || e.target.closest('.back-btn')) {
        return;
    }
    
    isFlipped = !isFlipped;
    flashcard.classList.toggle('flipped', isFlipped);
});

// Navegación anterior
prevBtn.addEventListener('click', function() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        updateCard();
        updateNavigation();
        updatePagination();
    }
});

// Navegación siguiente
nextBtn.addEventListener('click', function() {
    if (currentCardIndex < flashcardsData.length - 1) {
        currentCardIndex++;
        updateCard();
        updateNavigation();
        updatePagination();
    }
});

// Navegación por puntos
dots.forEach(dot => {
    dot.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        currentCardIndex = index;
        updateCard();
        updateNavigation();
        updatePagination();
    });
});

// Volver al menú principal
function goBack() {
    // Redirección al menú principal
    window.location.href = 'index.html';
}

// Teclas de flecha para navegación
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft' && !prevBtn.disabled) {
        prevBtn.click();
    } else if (e.key === 'ArrowRight' && !nextBtn.disabled) {
        nextBtn.click();
    } else if (e.key === ' ') {
        // Barra espaciadora para voltear
        flashcardContainer.click();
    }
});

// Efecto de entrada al cargar
window.addEventListener('load', function() {
    setTimeout(() => {
        flashcardContainer.style.opacity = '1';
        flashcardContainer.style.transform = 'translateY(0)';
    }, 200);
    
    initFlashcard();
});

// Agregar efectos hover a los botones
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    btn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});
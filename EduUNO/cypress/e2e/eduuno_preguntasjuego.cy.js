describe('Test del flujo: Botón Pregunta y Modo Libre', () => {

  beforeEach(() => {
    // 1. Interceptamos la red. Obligamos al juego a que SIEMPRE cargue la pregunta ID 9
    cy.intercept('GET', 'http://localhost:3005/question', {
      statusCode: 200,
      body: {
        id: 9,
        question: "¿Cuál de estos alimentos NO va al contenedor orgánico?",
        options: [
          "Cáscara de Mandarina",
          "Zanahoria podrida",
          "Botella de Plástico",
          "Hueso de Fruta"
        ],
        correct: 2,
        explanation: "La botella de plástico es inorgánica. Las cáscaras, frutas y huesos son orgánicos."
      }
    }).as('mockPregunta')

    // 2. Entramos a la ruta directa de tu juego
    cy.visit('http://localhost:5173/GameR')
    
    // Esperamos un segundo para que React renderice las cartas iniciales
    cy.wait(1000) 
  })

  it('Escenario Positivo: Responder bien (Test Determinista)', () => {
    // 1. Buscar el botón de pregunta y darle clic
    cy.get('button').contains('Pregunta (3)').click()

    // 2. Esperar a que nuestra intercepción de red ocurra
    cy.wait('@mockPregunta')

    // 3. Seleccionar la respuesta correcta
    cy.get('button').contains('Botella de Plástico').click()

    // 4. Validamos que salga la notificación amarilla de éxito
    cy.contains('¡Correcto! MODO LIBRE ACTIVADO.').should('be.visible')

    // 5. TIRAR LA CARTA usando su clase
    cy.get('.card-img.playable').first().click()

    // 6. Validamos que el contador general de arriba haya bajado
    cy.contains('Preguntas: 2').should('be.visible') 
  })

  it('Escenario Negativo: Responder mal y perder una vida', () => {
    // 1. Damos clic al botón de pregunta
    cy.get('button').contains('Pregunta (3)').click()

    // 2. Esperamos que cargue nuestra pregunta inyectada
    cy.wait('@mockPregunta')

    // 3. Seleccionamos una respuesta INCORRECTA a propósito
    cy.get('button').contains('Cáscara de Mandarina').click()

    // 4. Validamos que salga el toast de error con el texto exacto
    cy.contains('❌ Incorrecto. Pierdes 1 vida. Te quedan: 2 ❤️').should('be.visible')

    // 5. Validamos que el botón de pregunta NO restó intentos (sigue en 3)
    cy.get('button').contains('Pregunta (3)').should('be.visible')
  })
})
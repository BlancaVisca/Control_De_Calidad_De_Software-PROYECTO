const questionsM = [
  {
    id: 1,
    question: "¿Qué indica la pendiente m en una recta?",
    options: [
      "El color de la gráfica",
      "La inclinación de la recta",
      "El tamaño del plano",
      "El eje Y"
    ],
    correct: 1,
    explanation: "La pendiente indica si la recta sube, baja o es horizontal."
  },
  {
    id: 2,
    question: "Si m > 0, la recta es:",
    options: [
      "Horizontal",
      "Vertical",
      "Creciente",
      "Curva"
    ],
    correct: 2,
    explanation: "Una pendiente positiva significa que la recta sube."
  },
  {
    id: 3,
    question: "Si m < 0, la recta es:",
    options: [
      "Creciente",
      "Decreciente",
      "Horizontal",
      "Circular"
    ],
    correct: 1,
    explanation: "Pendiente negativa → la recta baja."
  },
  {
    id: 4,
    question: "¿Qué tipo de recta es y = 3?",
    options: [
      "Vertical",
      "Horizontal",
      "Curva",
      "Parábola"
    ],
    correct: 1,
    explanation: "No depende de x, por eso es horizontal (m = 0)."
  },
  {
    id: 5,
    question: "¿Qué tipo de recta es x = 2?",
    options: [
      "Horizontal",
      "Vertical",
      "Curva",
      "Parábola"
    ],
    correct: 1,
    explanation: "Las ecuaciones x = constante son rectas verticales."
  },
  {
    id: 6,
    question: "¿Cuál es la forma de una ecuación lineal?",
    options: [
      "y = mx + b",
      "x² + y² = r²",
      "y = x²",
      "y = x³"
    ],
    correct: 0,
    explanation: "Las ecuaciones lineales siempre tienen esa forma."
  },
  {
    id: 7,
    question: "¿Qué gráfica genera y = x²?",
    options: [
      "Recta",
      "Círculo",
      "Parábola",
      "Triángulo"
    ],
    correct: 2,
    explanation: "Las ecuaciones con x² generan parábolas."
  },
  {
    id: 8,
    question: "Si y = -x², la parábola:",
    options: [
      "Abre hacia arriba",
      "Abre hacia abajo",
      "Es recta",
      "Es horizontal"
    ],
    correct: 1,
    explanation: "El signo negativo hace que la parábola se invierta."
  },
  {
    id: 9,
    question: "¿Qué representa x² + y² = 4?",
    options: [
      "Recta",
      "Parábola",
      "Círculo",
      "Curva abierta"
    ],
    correct: 2,
    explanation: "Es la ecuación de un círculo."
  },
  {
    id: 10,
    question: "Si m = 0, la recta es:",
    options: [
      "Vertical",
      "Horizontal",
      "Curva",
      "Diagonal"
    ],
    correct: 1,
    explanation: "Pendiente 0 significa que no sube ni baja."
  },
  {
    id: 11,
    question: "Si una recta tiene pendiente indefinida, es:",
    options: [
      "Horizontal",
      "Vertical",
      "Parábola",
      "Círculo"
    ],
    correct: 1,
    explanation: "Las rectas verticales no tienen pendiente definida."
  },
  {
    id: 12,
    question: "¿Qué tipo de gráfica es y = x³?",
    options: [
      "Recta",
      "Parábola",
      "Curva",
      "Círculo"
    ],
    correct: 2,
    explanation: "Es una curva no lineal."
  },
  {
    id: 13,
    question: "Si la pendiente es mayor a 1, la recta es:",
    options: [
      "Más inclinada",
      "Horizontal",
      "Vertical",
      "Curva"
    ],
    correct: 0,
    explanation: "Entre mayor sea la pendiente, más inclinada es la recta."
  },
  {
    id: 14,
    question: "¿Qué tipo de gráfica es y = 2x²?",
    options: [
      "Recta",
      "Parábola",
      "Círculo",
      "Horizontal"
    ],
    correct: 1,
    explanation: "Sigue siendo una parábola, solo más cerrada."
  },
  {
    id: 15,
    question: "Si una gráfica es creciente, significa que:",
    options: [
      "Sube de izquierda a derecha",
      "Baja de izquierda a derecha",
      "Es horizontal",
      "Es circular"
    ],
    correct: 0,
    explanation: "Una función creciente aumenta conforme avanza."
  },
  {
    id: 16,
    question: "Si una gráfica es decreciente, significa que:",
    options: [
      "Sube",
      "Baja",
      "No cambia",
      "Es curva"
    ],
    correct: 1,
    explanation: "Va descendiendo de izquierda a derecha."
  },
  {
    id: 17,
    question: "¿Cuál de estas es una ecuación cuadrática?",
    options: [
      "y = x + 2",
      "y = x²",
      "y = 3",
      "x = 2"
    ],
    correct: 1,
    explanation: "Las ecuaciones cuadráticas tienen x²."
  },
  {
    id: 18,
    question: "¿Qué tipo de gráfica es una función lineal?",
    options: [
      "Curva",
      "Parábola",
      "Recta",
      "Círculo"
    ],
    correct: 2,
    explanation: "Las funciones lineales siempre son rectas."
  },
  {
    id: 19,
    question: "¿Qué tipo de gráfica es un círculo?",
    options: [
      "Abierta",
      "Cerrada",
      "Recta",
      "Lineal"
    ],
    correct: 1,
    explanation: "El círculo es una figura cerrada."
  },
  {
    id: 20,
    question: "¿Qué valor representa la pendiente en y = 2x + 1?",
    options: [
      "1",
      "2",
      "0",
      "-1"
    ],
    correct: 1,
    explanation: "El número que multiplica a x es la pendiente."
  }
];

module.exports = questionsM;
// EDUUNO/backend/questions.js

const questions = [
  {
    id: 1,
    question: "¿Cuál de estos materiales es reciclaje orgánico?",
    options: ["Cáscara de plátano", "Botella PET", "Lata de aluminio", "Vidrio"],
    correct: 0,
    explanation: "Los residuos orgánicos son biodegradables como cáscaras y restos de comida."
  },
  {
    id: 2,
    question: "¿El cartón y papel van en reciclaje...?",
    options: ["Orgánico", "Inorgánico reciclable", "Inorgánico no reciclable", "Metal"],
    correct: 1,
    explanation: "El papel y cartón son materiales inorgánicos que se pueden reciclar."
  },
  {
    id: 3,
    question: "¿Cuántas vidas tienes al inicio de ReUNOvables?",
    options: ["1", "2", "3", "5"],
    correct: 2,
    explanation: "Cada jugador comienza con 3 vidas representadas por ❤️."
  },
  {
    id: 4,
    question: "¿Qué comodín hace que el siguiente jugador robe 4 cartas?",
    options: ["cambiocolor", "cambioreciclaje", "mascuatro", "saltodereciclaje"],
    correct: 2,
    explanation: "El comodín +4 obliga al siguiente jugador a tomar 4 cartas del mazo."
  },
  {
    id: 5,
    question: "¿Las botellas de vidrio son reciclables infinitamente?",
    options: ["Sí", "No, solo 3 veces", "No, se rompen", "Solo si son verdes"],
    correct: 0,
    explanation: "El vidrio es 100% reciclable infinitas veces sin perder calidad."
  },
  {
    id: 6,
    question: "¿Qué color de contenedor suele usarse para el plástico?",
    options: ["Azul", "Amarillo", "Verde", "Rojo"],
    correct: 1,
    explanation: "En muchos sistemas, el amarillo es para envases de plástico, latas y briks."
  }
];

module.exports = questions;

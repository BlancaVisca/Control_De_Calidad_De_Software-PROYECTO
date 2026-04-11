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
    question: "¿Cuántas vidas tienes al inicio del juego?",
    options: ["1", "2", "3", "5"],
    correct: 2,
    explanation: "Cada jugador comienza con 3 vidas representadas por ❤️."
  },
  {
    id: 4,
    question: "¿Las botellas de vidrio son reciclables infinitamente?",
    options: ["Sí", "No, solo 3 veces", "No, se rompen", "Solo si son verdes"],
    correct: 0,
    explanation: "El vidrio es 100% reciclable infinitas veces sin perder calidad."
  },
  {
    id: 5,
    question: "¿La 'Cáscara de Plátano' y los 'Restos de Manzana' son residuos orgánicos o inorgánicos?",
    options: [
      "Orgánicos, porque son restos de comida que se pueden pudrir",
      "Inorgánicos, porque huelen mal",
      "Metálicos, porque tienen semillas",
      "No reciclables, porque son basura"
    ],
    correct: 0,
    explanation: "¡Correcto! Son orgánicos porque provienen de plantas y se descomponen naturalmente para convertirse en tierra."
  },
  {
    id: 6,
    question: "Si tienes un 'Hueso de Aguacate' o un 'Hueso de Pollo', ¿en qué contenedor debes tirarlos?",
    options: [
      "En el de Metal",
      "En el de Orgánicos",
      "En el de Plástico",
      "En el de Vidrio"
    ],
    correct: 1,
    explanation: "Aunque son duros, son restos de alimentos naturales, por lo que van a la basura orgánica."
  },
  {
    id: 7,
    question: "Las 'Hojas de Árbol' secas que caen en el jardín, ¿a qué categoría pertenecen?",
    options: [
      "Inorgánico No Reciclable",
      "Metal",
      "Orgánico",
      "Vidrio"
    ],
    correct: 2,
    explanation: "Las hojas son parte de la naturaleza y se biodegradan, así que son residuos orgánicos."
  },
  {
    id: 8,
    question: "¿Los 'Restos de Café' y la 'Cáscara de Huevo' sirven para hacer abono?",
    options: [
      "No, son basura tóxica",
      "Sí, porque son residuos orgánicos",
      "Solo la cáscara, el café no",
      "No, deben ir al plástico"
    ],
    correct: 1,
    explanation: "¡Sí! Ambos son excelentes para la composta porque son materiales naturales."
  },
  {
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
  },
  {
    id: 10,
    question: "Una 'Caja de Pizza' llena de grasa y queso, ¿se puede reciclar como cartón limpio?",
    options: [
      "Sí, siempre es cartón",
      "No, la grasa la ensucia y va a No Reciclable",
      "Sí, si la lavas con agua",
      "No, va al contenedor de vidrio"
    ],
    correct: 1,
    explanation: "La grasa mancha el papel e impide que se pueda reciclar. Por eso va a la basura general."
  },
  {
    id: 11,
    question: "¿Dónde debe tirarse un 'Pañal' usado o un 'Cubrebocas' utilizado?",
    options: [
      "En Reciclable, porque tiene plástico",
      "En Orgánico, porque es suave",
      "En Inorgánico No Reciclable, por higiene y seguridad",
      "En Metal"
    ],
    correct: 2,
    explanation: "Porque contienen gérmenes y residuos biológicos, no deben mezclarse con lo que se va a reciclar."
  },
  {
    id: 12,
    question: "El 'Chicle' ya mascado, ¿es reciclable?",
    options: [
      "Sí, es de azúcar",
      "No, es un plástico pegajoso que no se puede procesar",
      "Sí, si lo envuelves en papel",
      "Es orgánico porque era dulce"
    ],
    correct: 1,
    explanation: "El chicle está hecho de gomas sintéticas (plásticos) que no se biodegradan ni se reciclan fácilmente."
  },
  {
    id: 13,
    question: "Un 'Cepillo de Dientes' viejo y una 'Esponja' usada, ¿dónde van?",
    options: [
      "Al contenedor azul de reciclables",
      "A la basura general (No Reciclable)",
      "Al contenedor de orgánicos",
      "Al de metal"
    ],
    correct: 1,
    explanation: "Están hechos de varios materiales mezclados y suelen estar sucios, por lo que no se pueden reciclar."
  },
  {
    id: 14,
    question: "Los 'Tickets de compra' (de papel térmico) y las 'Curitas' usadas van en:",
    options: [
      "Papel Reciclable",
      "Orgánico",
      "No Reciclable",
      "Metal"
    ],
    correct: 2,
    explanation: "Los tickets tienen químicos especiales y las curitas están sucias; ambos van a la basura general."
  },
  {
    id: 15,
    question: "¿Las 'Botellas de PET' (refresco) y los 'Envases de Detergente' vacíos son reciclables?",
    options: [
      "Sí, son plásticos limpios que se pueden transformar",
      "No, todo el plástico es basura",
      "Solo si son de color verde",
      "No, son orgánicos"
    ],
    correct: 0,
    explanation: "¡Sí! Estos envases de plástico limpio se trituran y se convierten en nuevos productos."
  },
  {
    id: 16,
    question: "El 'Periódico', las 'Revistas' y el 'Cartón' limpio van al contenedor de:",
    options: [
      "Orgánicos",
      "No Reciclable",
      "Reciclables (Papel y Cartón)",
      "Metal"
    ],
    correct: 2,
    explanation: "El papel y cartón limpios y secos son muy valiosos para hacer nuevo papel."
  },
  {
    id: 17,
    question: "¿La 'Caja de Tetra Pak' (leche/jugo) se recicla?",
    options: [
      "No, es muy complicada",
      "Sí, aunque parece cartón, tiene capas que se pueden separar y aprovechar",
      "Solo la parte de plástico",
      "No, va con la pizza sucia"
    ],
    correct: 1,
    explanation: "Sí, existen procesos para separar el cartón, el plástico y el aluminio que la forman."
  },
  {
    id: 18,
    question: "¿Qué debemos hacer con una 'Botella de Vidrio' antes de tirarla al reciclaje?",
    options: [
      "Romperla en pedazos",
      "Nada, así está bien",
      "Enjuagarla para quitar residuos",
      "Pintarla de colores"
    ],
    correct: 2,
    explanation: "Es bueno enjuagarla para que no quede sucia y no atraiga insectos, pero no hace falta romperla."
  },
  {
    id: 19,
    question: "Una 'Bolsa de Papel' limpia, ¿puede reciclarse?",
    options: [
      "No, el papel nunca se recicla",
      "Sí, es igual que el periódico o el cartón",
      "Solo si es de color café",
      "No, es orgánica"
    ],
    correct: 1,
    explanation: "Sí, el papel limpio es totalmente reciclable y ayuda a salvar árboles."
  },
  {
    id: 20,
    question: "Las 'Latas de Refresco' y las 'Latas de Conserva' (atún, frijoles) son de:",
    options: [
      "Plástico",
      "Vidrio",
      "Metal Reciclable",
      "Orgánico"
    ],
    correct: 2,
    explanation: "Son de metal (aluminio o acero) y se pueden fundir para hacer latas nuevas infinitamente."
  },
  {
    id: 21,
    question: "¿El 'Papel Aluminio' limpio y los 'Clips' de oficina son reciclables?",
    options: [
      "No, son muy pequeños",
      "Sí, son metal",
      "No, son papel",
      "Solo el papel aluminio"
    ],
    correct: 1,
    explanation: "Sí, son metales. Se recomienda hacer una bolita con el aluminio para que no se pierda."
  },
  {
    id: 22,
    question: "Si encuentras 'Clavos' oxidados o trozos de 'Cobre', ¿dónde van?",
    options: [
      "A la basura normal",
      "Al contenedor de Metal",
      "Al de Orgánicos",
      "Al de Plástico"
    ],
    correct: 1,
    explanation: "El óxido no importa, siguen siendo metal y se pueden reciclar perfectamente."
  },
  {
    id: 23,
    question: "¿Cuál de estos objetos pertenece a la categoría de METAL?",
    options: [
      "Una cáscara de plátano",
      "Una lata de refresco",
      "Una caja de pizza",
      "Una botella de agua"
    ],
    correct: 1,
    explanation: "La lata de refresco es de aluminio, un metal muy valioso para reciclar."
  },
  {
    id: 24,
    question: "Para terminar: ¿Dónde tirarías una 'Botella de Vidrio' y una 'Cáscara de Naranja'?",
    options: [
      "Ambas en el mismo bote",
      "Vidrio en Reciclable y Cáscara en Orgánico",
      "Ambas en No Reciclable",
      "Vidrio en Orgánico y Cáscara en Metal"
    ],
    correct: 1,
    explanation: "¡Exacto! Hay que separar: el vidrio va a reciclaje y la cáscara a orgánicos para hacer compost."
  }
];

module.exports = questions;
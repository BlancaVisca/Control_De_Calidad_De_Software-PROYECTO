export const flashcardsDataMath = [
  {
    id: "what_is_equation",
    title: "Pendientes",
    definition:
      "La pendiente (m) indica la inclinación de una recta. Determina si la recta sube, baja o es constante.",
    curiosity:
      "Ejemplo: y = x + 2 → m = 1 (sube). y = -x + 1 → m = -1 (baja).",
    graph: {
      type: "linear",
      m: -1,
      b: 1
    },
    backContent: {
      title: "Interpretación",
      text:
        "Identifica la pendiente observando la ecuación.",
      examples: [
        "m > 0 → creciente",
        "m < 0 → decreciente",
        "m = 0 → horizontal",
        "indefinida → vertical",
        "y = mx + b",
        "m controla inclinación",
        "b controla posición",
        "Clave: observa el signo"
      ]
    }
  },

  {
    id: "linear_equations",
    title: "Ecuaciones lineales",
    definition:
      "Son ecuaciones de primer grado con forma y = mx + b. Siempre generan rectas.",
    curiosity:
      "Ejemplo: y = 2x + 1 → recta creciente con mayor inclinación.",
    graph: {
      type: "linear",
      m: 2,
      b: 1
    },
    backContent: {
      title: "Características",
      text:
        "Son las más fáciles de identificar.",
      examples: [
        "No tienen x²",
        "Siempre son rectas",
        "y = 5 → horizontal",
        "x = 3 → vertical",
        "m define inclinación",
        "b define intersección",
        "Cambio constante",
        "Relación directa"
      ]
    }
  },

  {
    id: "quadratic_equations",
    title: "Ecuaciones cuadráticas",
    definition:
      "Tienen x² y generan parábolas. Su forma es curva.",
    curiosity:
      "Ejemplo: y = x² abre hacia arriba, y = -x² hacia abajo.",
    graph: {
      type: "parabola",
      a: 1
    },
    backContent: {
      title: "Comportamiento",
      text:
        "El coeficiente 'a' define la dirección.",
      examples: [
        "a > 0 → abre arriba",
        "a < 0 → abre abajo",
        "Tiene vértice",
        "Es curva",
        "Simétrica",
        "No es recta",
        "Cambio no constante",
        "Forma en U"
      ]
    }
  },

  {
    id: "formula_general",
    title: "Círculo",
    definition:
      "Las ecuaciones tipo x² + y² = r² representan círculos.",
    curiosity:
      "Ejemplo: x² + y² = 4 → radio 2.",
    graph: {
      type: "circle",
      r: 2
    },
    backContent: {
      title: "Propiedades",
      text:
        "Todos los puntos están a la misma distancia del centro.",
      examples: [
        "x² + y² = 1",
        "x² + y² = 4",
        "x² + y² = 9",
        "Forma cerrada",
        "Simetría total",
        "No tiene pendiente",
        "Centro (0,0)",
        "Radio constante"
      ]
    }
  }
];
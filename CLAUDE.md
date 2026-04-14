# CLAUDE.md — EduUNO / REUNOVABLE

Proyecto académico de juego educativo de cartas estilo UNO.  
Materia: Control de Calidad de Software — 8vo semestre.

---

## Stack tecnológico

| Capa       | Tecnología                        |
|------------|-----------------------------------|
| Frontend   | React 19, Vite 7, React Router 7  |
| Backend R  | Node.js + Express 5 (puerto 3005) |
| Backend M  | Node.js + Express 5 (puerto 3006) |
| CSS        | CSS plano por módulo (sin Tailwind)|
| Linting    | ESLint 9                          |

Sin base de datos. El estado de partida vive en memoria (`let gameState = {}`) por proceso de servidor.

---

## Estructura del proyecto

```
Control_De_Calidad_De_Software-PROYECTO/
├── EduUNO/
│   ├── backend/
│   │   ├── server.js           # API REST – modo Reciclaje (puerto 3005)
│   │   ├── serverM.js          # API REST – modo Matemáticas (puerto 3006)
│   │   ├── gameEngine.js       # Lógica de mazo/turno Reciclaje
│   │   ├── gameEngineMath.js   # Lógica de mazo/turno Matemáticas
│   │   ├── questions.js        # Preguntas educativas Reciclaje
│   │   └── questionsM.js       # Preguntas educativas Matemáticas
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx          # Router principal
│       │   ├── pages/
│       │   │   ├── Inicio.jsx   # Pantalla de bienvenida
│       │   │   ├── Menu.jsx     # Selector de tema (reciclaje | math)
│       │   │   ├── GameR.jsx    # Vista de partida – Reciclaje
│       │   │   ├── GameM.jsx    # Vista de partida – Matemáticas
│       │   │   ├── Flashcards.jsx # Estudio previo al juego
│       │   │   └── Quiz.jsx     # Evaluación de conocimientos
│       │   ├── components/
│       │   │   ├── Card.jsx / CardM.jsx
│       │   │   ├── PlayerHand.jsx / PlayerHandM.jsx
│       │   │   ├── OpponentHand.jsx / OpponentHandM.jsx
│       │   │   └── GameHUD.jsx
│       │   ├── css/             # Un archivo CSS por página/componente
│       │   └── data/            # flashcardsData.js, flashcardsDataMath.js,
│       │                        # preguntasRec.js, preguntasMath.js
│       └── public/
│           ├── img/cartas_M/   # Imágenes de cartas (gráficas matemáticas)
│           ├── img/comodines/  # Comodines
│           └── sounds/         # Efectos de audio (.mp3)
└── juegoEducativo/             # Prototipo HTML/CSS/JS vanilla (legado)
```

---

## Arquitectura del sistema

### Backend (dos servidores independientes)

Cada modo de juego tiene su propio servidor Express con estado en memoria:

- **`server.js` (puerto 3005)** — modo Reciclaje  
  Endpoints: `POST /start`, `POST /play`, `POST /draw`, `GET /question`, `POST /answer-question`, `POST /check-question-usage`, `GET /status`

- **`serverM.js` (puerto 3006)** — modo Matemáticas  
  Mismos endpoints, pero sin `/check-question-usage`

La lógica de turno, validación de jugadas y IA del oponente vive en los archivos `gameEngine*.js`, importados por cada servidor.

### Frontend (SPA React)

- Routing con `react-router-dom` en `App.jsx`
- Cada página (`GameR`, `GameM`) hace `fetch` directo a `localhost:3005` / `localhost:3006`
- Polling por `setInterval` cada 1 segundo para sincronizar turno del oponente
- Audio con `new Audio(...)` instanciado a nivel de módulo

### Mecánica de juego

- **Reciclaje**: cartas con `color` + `número` + `tipo de reciclaje`. Regla de juego: coincidencia de reciclaje+número o reciclaje+color. Comodines: cambio de color, cambio de reciclaje, +4, salto de reciclaje.
- **Matemáticas**: cartas con `value` (imagen de gráfica, ecuación, pendiente o valor numérico). Las relaciones entre cartas se definen en el mapa `relations` de `gameEngineMath.js`.
- Ambos modos comparten: 3 vidas, 3 preguntas educativas, modo libre al responder correctamente, fin por mazo vacío (gana quien tiene menos cartas).

---

## Convenciones del proyecto

- Componentes duplicados por tema: `Card` / `CardM`, `PlayerHand` / `PlayerHandM`, `OpponentHand` / `OpponentHandM` — sufijo `M` = modo Matemáticas.
- CSS plano por responsabilidad: `game.css` / `gameM.css`, `flashcards.css`, `quiz.css`, `inicio.css`, `styles.css`.
- Assets en `public/` para acceso directo por URL (`/sounds/boton.mp3`, `/img/cartas_M/...`).
- Sin TypeScript; PropTypes disponible en dependencias.
- Backend sin autenticación ni persistencia (estado en RAM, se resetea con cada `POST /start`).

---

## Decisiones de diseño importantes

- Dos servidores separados en lugar de uno unificado — decisión deliberada para independencia de modos.
- Estado global de partida como variable en módulo (`let gameState = {}`) — no hay sesiones ni DB.
- El oponente (IA) se ejecuta en el servidor con `setTimeout`, no en el cliente.
- Sin variables de entorno configuradas actualmente (`PORT` hardcodeado en cada server).
- El prototipo `juegoEducativo/` (HTML vanilla) es legado y no forma parte del flujo activo.

---

## Comandos de desarrollo

```bash
# Backend Reciclaje
cd EduUNO/backend && node server.js       # producción
cd EduUNO/backend && node --watch server.js  # desarrollo

# Backend Matemáticas (en terminal separada)
cd EduUNO/backend && node serverM.js

# Frontend
cd EduUNO/frontend && npm run dev
cd EduUNO/frontend && npm run build
cd EduUNO/frontend && npm run lint
```

---

## Plan: Base de datos de resultados del quiz evaluativo

### Decisiones acordadas

- **Alcance**: solo el quiz evaluativo (`/quiz`). Las preguntas mid-game NO se registran.
- **Sin usuarios**: no hay sistema de login ni identificadores de jugador.
- **Fusión de backends**: `server.js` y `serverM.js` se unirán en un solo servidor (puerto 3005) con prefijos de ruta. `serverM.js` desaparece.
- **BD**: SQLite con `better-sqlite3` — archivo local, sin servidor externo.

### Nuevas rutas tras la fusión

```
/recycling/start, /recycling/play, /recycling/draw ...   (antes: localhost:3005/...)
/math/start, /math/play, /math/draw ...                  (antes: localhost:3006/...)
POST /quiz-result                                         (nuevo)
GET  /results                                             (nuevo)
GET  /stats                                               (nuevo)
```

### Esquema de la BD

**`quiz_results`** — un registro por quiz completado
```
id          INTEGER  PK AUTOINCREMENT
theme       TEXT     'math' | 'recycling'
score       INTEGER  respuestas correctas
total       INTEGER  siempre 5
passed      INTEGER  1 | 0  (aprobado si score >= 4)
created_at  TEXT     timestamp ISO
```

**`quiz_answers`** — detalle por pregunta, relacionado al resultado
```
id              INTEGER  PK AUTOINCREMENT
quiz_result_id  INTEGER  FK → quiz_results.id
question_text   TEXT
selected_index  INTEGER  opción elegida por el usuario
correct_index   INTEGER  opción correcta
is_correct      INTEGER  1 | 0
```

### Orden de implementación

1. Fusionar `server.js` + `serverM.js` con prefijos `/recycling/*` y `/math/*`
2. Actualizar fetch en `GameR.jsx` (`localhost:3005/` → `localhost:3005/recycling/`)
3. Actualizar fetch en `GameM.jsx` (`localhost:3006/` → `localhost:3005/math/`)
4. Instalar `better-sqlite3` en el backend
5. Crear `db.js` — inicializa la BD y crea las tablas si no existen
6. Agregar `POST /quiz-result` — guarda resumen + detalle en ambas tablas
7. Agregar `GET /results` y `GET /stats`
8. Modificar `Quiz.jsx` para enviar el resultado al terminar

---

## Equipo

Blanca Flor Visca Cocotzin · Karla Irais De Florencio Romero · Ana Karen Garcia Flores · Obed Espinosa Baldivia · Tiago Gómez Cordero

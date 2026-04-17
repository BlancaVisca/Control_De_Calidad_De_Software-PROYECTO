// src/hooks/useMando.jsx
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Nos conectamos al puerto de tu backend (3005) fuera del componente 
// para que no se esté reconectando cada vez que cambias de pantalla.
const socket = io('http://localhost:3005');

export function useMando(callbacks) {
  // Guardamos el estado anterior para saber si un botón "acaba" de ser presionado
  const estadoAnterior = useRef({ U: 0, D: 0, L: 0, R: 0, B1: 0, B2: 0 });

  useEffect(() => {
    const manejarDatos = (dataString) => {
      // 1. Convertimos el string "U:0,D:0,L:1..." a un objeto real de Javascript
      const pares = dataString.split(',');
      const estadoActual = {};
      
      pares.forEach(par => {
        const [boton, valor] = par.split(':');
        estadoActual[boton] = parseInt(valor, 10);
      });

      // 2. Comparamos el estado actual con el anterior (Detección de presión)
      // Si ahora es 1, pero antes era 0, significa que se "acaba de presionar"
      if (estadoActual.U === 1 && estadoAnterior.current.U === 0 && callbacks.onUp) callbacks.onUp();
      if (estadoActual.D === 1 && estadoAnterior.current.D === 0 && callbacks.onDown) callbacks.onDown();
      if (estadoActual.L === 1 && estadoAnterior.current.L === 0 && callbacks.onLeft) callbacks.onLeft();
      if (estadoActual.R === 1 && estadoAnterior.current.R === 0 && callbacks.onRight) callbacks.onRight();
      
      // Botones de acción
      if (estadoActual.B1 === 1 && estadoAnterior.current.B1 === 0 && callbacks.onButton1) callbacks.onButton1();
      if (estadoActual.B2 === 1 && estadoAnterior.current.B2 === 0 && callbacks.onButton2) callbacks.onButton2();

      // 3. Actualizamos la memoria para el siguiente ciclo
      estadoAnterior.current = estadoActual;
    };

    // Escuchamos el evento que emite tu backend
    socket.on('mando_estado', manejarDatos);

    return () => {
      // Limpieza cuando el componente se desmonta
      socket.off('mando_estado', manejarDatos);
    };
  }, [callbacks]); // Se vuelve a armar si cambian las funciones que le pasamos
}
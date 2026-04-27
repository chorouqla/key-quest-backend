# key-quest-backend
# Proyecto Final – Key Quest (Backend)

## a) Funcionalidades de backend

En este proyecto voy a mejorar mi videojuego "Key Quest" añadiendo funcionalidades básicas de backend utilizando PHP y MySQL.

### 1. Sistema de login y registro

El jugador podrá:

* Crear una cuenta con nombre de usuario y contraseña
* Iniciar sesión con su cuenta

El sistema:

* No permitirá nombres de usuario duplicados
* Validará la contraseña para acceder
* Guardará los datos en una base de datos

---

### 2. Sistema de puntuación (Leaderboard)

Cuando el jugador termine el nivel:

* Se calculará una puntuación basada en:

  * gemas recogidas
  * tiempo restante
  * vidas

Fórmula aproximada:
Puntuación = (gemas × 100) + (tiempo × 10) + (vidas × 50)

El sistema:

* Guardará las puntuaciones en la base de datos
* Mostrará un ranking de los mejores jugadores

---

### 3. Sistema básico de partidas (2 jugadores)

El juego permitirá que 2 jugadores participen en una misma partida.

* Un jugador podrá iniciar una partida
* Otro jugador podrá unirse
* Ambos compartirán el mismo estado de juego

## b) Recursos utilizados

### Tutoriales

* YouTube: Tutorial de PHP y MySQL (The Net Ninja)
* YouTube: Fetch API en JavaScript

### Documentación

* W3Schools (PHP y MySQL)
* MDN Web Docs (JavaScript)

### Herramientas

* XAMPP (servidor local)
* phpMyAdmin (gestión de base de datos)
* GitHub (control de versiones)



import React, { useState, useEffect } from 'react';
import './SnakeGame.css';

const SnakeGame = () => {
  const [snake, setSnake] = useState([[10, 10]]);
  const [food, setFood] = useState([15, 15]);
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const moveSnake = () => {
    const newSnake = [...snake];
    const head = [...newSnake[newSnake.length - 1]];

    switch (direction) {
      case 'UP':
        head[1] -= 1;
        break;
      case 'DOWN':
        head[1] += 1;
        break;
      case 'LEFT':
        head[0] -= 1;
        break;
      case 'RIGHT':
        head[0] += 1;
        break;
      default:
        break;
    }

    newSnake.push(head);
    if (head[0] === food[0] && head[1] === food[1]) {
      setFood([Math.floor(Math.random() * 20), Math.floor(Math.random() * 20)]);
      setScore((prevScore) => prevScore + 1); // Zwiększ wynik
    } else {
      newSnake.shift();
    }

    if (
      head[0] < 0 ||
      head[1] < 0 ||
      head[0] >= 20 ||
      head[1] >= 20 ||
      newSnake.slice(0, -1).some((segment) => segment[0] === head[0] && segment[1] === head[1])
    ) {
      setGameOver(true);
    } else {
      setSnake(newSnake);
    }
  };

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(moveSnake, 200);
    return () => clearInterval(interval);
  }, [snake, direction, gameOver]);

  const handleKeyDown = (e) => {
    // Zablokuj przewijanie strony dla klawiszy strzałek
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    switch (e.key) {
      case 'ArrowUp':
        if (direction !== 'DOWN') setDirection('UP');
        break;
      case 'ArrowDown':
        if (direction !== 'UP') setDirection('DOWN');
        break;
      case 'ArrowLeft':
        if (direction !== 'RIGHT') setDirection('LEFT');
        break;
      case 'ArrowRight':
        if (direction !== 'LEFT') setDirection('RIGHT');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  return (
    <div className="snake-game">
      <div className="score-board">
        <h2>Score: {score}</h2>
      </div>
      {gameOver ? (
        <div className="game-over">
          <h1>Game Over</h1>
          <p>Your Score: {score}</p>
          <button onClick={() => window.location.reload()}>Restart</button>
        </div>
      ) : (
        <div className="game-board">
          {Array.from({ length: 20 }, (_, y) =>
            Array.from({ length: 20 }, (_, x) => (
              <div
                key={`${x}-${y}`}
                className={`cell ${
                  snake.some((segment) => segment[0] === x && segment[1] === y)
                    ? 'snake'
                    : food[0] === x && food[1] === y
                    ? 'food'
                    : ''
                }`}
              ></div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
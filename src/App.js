import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [fase, setFase] = useState('INTRO');
  const [personagem, setPersonagem] = useState(null);
  const [cameraX, setCameraX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [playerHP, setPlayerHP] = useState(10);
  const [olhandoDireita, setOlhandoDireita] = useState(true);
  
  const [tirosVisiveis, setTirosVisiveis] = useState([]);
  const [tirosInimigosVisiveis, setTirosInimigosVisiveis] = useState([]);
  const [inimigos, setInimigos] = useState([
    { id: 1, x: 1200, hp: 3, vivo: true },
    { id: 2, x: 2200, hp: 3, vivo: true },
    { id: 3, x: 3200, hp: 3, vivo: true },
    { id: 4, x: 4200, hp: 3, vivo: true },
    { id: 5, x: 5200, hp: 3, vivo: true }
  ]);

  const musicRef = useRef(null);
  const teclasRef = useRef({});
  const tirosRef = useRef([]); 
  const tirosEnimigoRef = useRef([]);
  const pulandoRef = useRef(false);
  const posRefY = useRef(0);

  const tocarMusica = (src) => {
    if (musicRef.current) { musicRef.current.pause(); musicRef.current.currentTime = 0; }
    musicRef.current = new Audio(src);
    musicRef.current.loop = true;
    musicRef.current.volume = 0.3;
    musicRef.current.play().catch(() => {});
  };

  const pararMusica = () => {
    if (musicRef.current) { musicRef.current.pause(); musicRef.current = null; }
  };

  useEffect(() => {
    const loop = setInterval(() => {
      if (fase !== 'GAME') return;
      const pX = 500 - cameraX;

      if (teclasRef.current['d'] || teclasRef.current['D']) {
        setCameraX(c => c - 16);
        setOlhandoDireita(true);
      }
      if (teclasRef.current['a'] || teclasRef.current['A']) {
        setCameraX(c => c + 16);
        setOlhandoDireita(false);
      }

      setPosY(posRefY.current);

      // Colisão: Tiro some ao acertar o NPC
      let novosInimigos = [...inimigos];
      tirosRef.current = tirosRef.current
        .map(t => ({ ...t, x: t.x + (t.dir === 'dir' ? 25 : -25) }))
        .filter(t => {
          let acertou = false;
          novosInimigos = novosInimigos.map(inv => {
            if (inv.vivo && t.x > inv.x && t.x < inv.x + 80) {
              acertou = true;
              const nHP = inv.hp - 1;
              return { ...inv, hp: nHP, vivo: nHP > 0 };
            }
            return inv;
          });
          return !acertou && t.x < pX + 1500 && t.x > pX - 1500;
        });

      setInimigos(novosInimigos);
      setTirosVisiveis([...tirosRef.current]);

      tirosEnimigoRef.current = tirosEnimigoRef.current
        .map(t => ({ ...t, x: t.x + (t.dir === 'dir' ? 18 : -18) }))
        .filter(t => {
          const atingiu = t.x > pX - 30 && t.x < pX + 30 && posRefY.current < 80;
          if (atingiu) {
            setPlayerHP(h => {
              if (h <= 1) setFase('GAMEOVER');
              return h - 1;
            });
            return false;
          }
          return t.x > pX - 1500 && t.x < pX + 1500;
        });
      setTirosInimigosVisiveis([...tirosEnimigoRef.current]);

      // IA com alcance de 1050 (50% a mais)
      setInimigos(invs => {
        invs.forEach(inv => {
          const dist = inv.x - pX;
          if (inv.vivo && Math.abs(dist) < 1050 && Math.random() > 0.98) {
            const direcaoTiro = dist > 0 ? 'esq' : 'dir';
            tirosEnimigoRef.current.push({ id: Math.random(), x: inv.x, y: 75, dir: direcaoTiro });
          }
        });
        return invs;
      });
    }, 16);
    return () => clearInterval(loop);
  }, [fase, cameraX, inimigos]);

  const atirar = () => {
    const pX = 500 - cameraX;
    tirosRef.current.push({ id: Date.now(), x: pX, y: posRefY.current + 75, dir: olhandoDireita ? 'dir' : 'esq' });
  };

  const saltar = () => {
    if (pulandoRef.current) return;
    pulandoRef.current = true;
    let h = 0;
    const sobe = setInterval(() => {
      h += 14; posRefY.current = h;
      if (h >= 210) {
        clearInterval(sobe);
        const desce = setInterval(() => {
          h -= 14; posRefY.current = h;
          if (h <= 0) { clearInterval(desce); pulandoRef.current = false; posRefY.current = 0; }
        }, 20);
      }
    }, 20);
  };

  useEffect(() => {
    const down = (e) => {
      if (["Shift", "Control", "Alt"].includes(e.key)) return;
      teclasRef.current[e.key] = true;
      if (fase === 'GAME') {
        if (e.key.toLowerCase() === 'f') atirar();
        if (e.code === 'Space') { e.preventDefault(); saltar(); }
      }
    };
    const up = (e) => { delete teclasRef.current[e.key]; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [fase, cameraX, olhandoDireita]);

  const reiniciar = (menu) => {
    tirosRef.current = []; tirosEnimigoRef.current = [];
    posRefY.current = 0; pulandoRef.current = false;
    teclasRef.current = {};
    setPlayerHP(10); setCameraX(0); setPosY(0); setOlhandoDireita(true);
    setInimigos([
      { id: 1, x: 1200, hp: 3, vivo: true }, { id: 2, x: 2200, hp: 3, vivo: true },
      { id: 3, x: 3200, hp: 3, vivo: true }, { id: 4, x: 4200, hp: 3, vivo: true },
      { id: 5, x: 5200, hp: 3, vivo: true }
    ]);
    if (menu) { setFase('SELECAO'); tocarMusica('/lcs.mp3'); } 
    else { setFase('GAME'); tocarMusica('/game_bgm.mp3'); }
  };

  return (
    <div className="city-wars-root">
      {fase === 'INTRO' && (
        <div className="screen intro-bg center">
          <h1 className="gta-title">CITY WARS</h1>
          <button className="gta-btn" onClick={() => { tocarMusica('/lcs.mp3'); setFase('SELECAO'); }}>JOGAR</button>
        </div>
      )}

      {fase === 'SELECAO' && (
        <div className="screen center selection-bg">
          <h2 className="header">SOBREVIVENTES DE LIBERTY CITY</h2>
          <div className="char-container">
            {chars.map(c => (
              <div key={c.id} className="char-card" onClick={() => {
                pararMusica(); setPersonagem(c); setFase('CUTSCENE');
                const msg = new SpeechSynthesisUtterance(c.fala);
                msg.lang = 'pt-BR';
                msg.onend = () => { tocarMusica('/game_bgm.mp3'); setFase('GAME'); };
                window.speechSynthesis.speak(msg);
              }}>
                <img src={c.img} alt="p" />
                <h3 style={{color: c.cor}}>{c.nome}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {fase === 'CUTSCENE' && (
        <div className="screen cutscene-view center">
          <div className="avatar-frame">
             <img src={personagem?.img} className="avatar-img" alt="p" />
          </div>
          <div className="subtitle-box">
            <h1>{personagem?.nome}</h1>
            <p>"{personagem?.fala}"</p>
          </div>
        </div>
      )}

      {fase === 'GAME' && (
        <div className="screen gameplay-area">
          <div className="sky-gradient"></div>
          
          <div className="map-scroll" style={{ transform: `translateX(${cameraX}px)` }}>
            {/* ESTABELECIMENTOS COM DECORAÇÃO */}
            <div className="building hotel" style={{ left: '500px' }}>
                <div className="facade"><span>HOTEL</span><div className="window"></div><div className="window"></div></div>
            </div>
            <div className="building bank" style={{ left: '1400px' }}>
                <div className="facade"><span>BANCO</span><div className="window"></div></div>
            </div>
            <div className="building club" style={{ left: '2300px' }}>
                <div className="facade"><span>BOATE</span><div className="neon-light"></div></div>
            </div>
            <div className="building shop" style={{ left: '3600px' }}>
                <div className="facade"><span>AMMU-NATION</span><div className="window"></div></div>
            </div>

            <div className="sidewalk far">
              <div className="sidewalk-texture"></div>
              <div className="curb-yellow-line"></div>
            </div>
            
            <div className="road"><div className="road-lines"></div></div>

            <div className="sidewalk near">
                <div className="sidewalk-texture"></div>
                {[...Array(30)].map((_, i) => (
                    <React.Fragment key={i}>
                        <div className="prop light-pole" style={{ left: `${i * 800}px` }}></div>
                        <div className="prop trash" style={{ left: `${i * 1100 + 400}px` }}></div>
                        <div className="prop hydrant" style={{ left: `${i * 1500 + 200}px` }}></div>
                    </React.Fragment>
                ))}
            </div>

            {inimigos.map(inv => inv.vivo && (
              <div key={inv.id} className="enemy-sprite" style={{ 
                left: `${inv.x}px`,
                transform: (inv.x - (500 - cameraX)) > 0 ? 'scaleX(1)' : 'scaleX(-1)' 
              }}>
                <div className="npc-hp"><div style={{width: `${(inv.hp/3)*100}%`}}></div></div>
              </div>
            ))}
            
            {tirosVisiveis.map(t => <div key={t.id} className="bullet pl-b" style={{ left: `${t.x}px`, bottom: `${t.y}px` }}></div>)}
            {tirosInimigosVisiveis.map(t => <div key={t.id} className="bullet en-b" style={{ left: `${t.x}px`, bottom: `${t.y}px` }}></div>)}
          </div>

          <div className={`player-sprite ${olhandoDireita ? '' : 'flip'}`} style={{ bottom: `${80 + posY}px` }}>
            <img src={personagem?.img} alt="hero" />
          </div>

          <div className="hud-top">
            <div className="hp-bar">SAÚDE: {playerHP * 10}%</div>
            <div className="keys-info">A-D: MOVER | ESPAÇO: PULAR | F: ATIRAR</div>
          </div>
        </div>
      )}

      {fase === 'GAMEOVER' && (
        <div className="screen wasted-screen center">
          <h1 className="wasted-text">WASTED</h1>
          <button className="gta-btn" onClick={() => reiniciar(false)}>TENTAR DE NOVO</button>
          <button className="gta-btn red" onClick={() => reiniciar(true)}>MENU</button>
        </div>
      )}
    </div>
  );
}

const chars = [
  { id: 1, nome: "VINCENZO", cor: "#ff4757", fala: "Não é nada pessoal, são apenas negócios.", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vincenzo&accessories=sunglasses" },
  { id: 2, nome: "SOFIA", cor: "#f1c40f", fala: "Você escolheu a cidade errada para brincar.", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia&accessories=sunglasses" }
];

export default App;
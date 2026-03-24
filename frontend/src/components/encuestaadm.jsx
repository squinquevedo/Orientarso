
import React, { useMemo, useState } from "react";
import { QUESTIONS, AREAS } from "./questions";

const TOTAL = QUESTIONS.length;
const SCALE = [
  { value: 1, label: "Totalmente en desacuerdo" },
  { value: 2, label: "En desacuerdo" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "De acuerdo" },
  { value: 5, label: "Totalmente de acuerdo" },
];

function ProgressBar({ current, total }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="progress">
      <div
        className="progress__bar"
        style={{ width: `${pct}%` }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        role="progressbar"
      />
      <div className="progress__label">
        {current + 1} / {total}
      </div>
    </div>
  );
}

function ResultBars({ scores, maxPerArea }) {
  const areasOrdenadas = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ key: k, value: v }));

  return (
    <div className="results">
      <h2 className="results__title">Tus resultados</h2>
      <p className="results__subtitle">
        Estas barras muestran tu afinidad relativa por cada área.
      </p>
      <div className="results__list">
        {areasOrdenadas.map(({ key, value }) => {
          const pct = Math.round((value / maxPerArea) * 100);
          return (
            <div key={key} className="bar">
              <div className="bar__head">
                <span className="bar__label">{AREAS[key].nombre}</span>
                <span className="bar__value">{pct}%</span>
              </div>
              <div className="bar__track">
                <div className="bar__fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="bar__desc">{AREAS[key].descripcion}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [id]: 1..5 }
  const [done, setDone] = useState(false);

  const q = QUESTIONS[idx];

  const areaCount = useMemo(() => {
    const count = {};
    Object.keys(AREAS).forEach((k) => (count[k] = 0));
    QUESTIONS.forEach((qq) => (count[qq.area] += 1));
    return count;
  }, []);

  const maxPerArea = useMemo(() => {
    // máximo posible por área = preguntas del área * 5
    const m = {};
    Object.entries(areaCount).forEach(([k, n]) => (m[k] = n * 5));
    return m;
  }, [areaCount]);

  const scores = useMemo(() => {
    const s = {};
    Object.keys(AREAS).forEach((k) => (s[k] = 0));
    QUESTIONS.forEach(({ id, area }) => {
      const v = answers[id] || 0;
      s[area] += v;
    });
    return s;
  }, [answers]);

  const answeredCount = Object.keys(answers).length;

  function handleSelect(val) {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  }

  function next() {
    if (idx < TOTAL - 1) setIdx((i) => i + 1);
    else setDone(true);
  }

  function prev() {
    if (idx > 0) setIdx((i) => i - 1);
  }

  function restart() {
    setIdx(0);
    setAnswers({});
    setDone(false);
  }

  const canNext = answers[q?.id] !== undefined;

  return (
    <div className="page">
      <div className="bg-decor" aria-hidden="true"></div>

      <header className="header">
        <h1 className="title">Encuesta Vocacional</h1>
        <p className="subtitle">
          Descubre tu afinidad con áreas clave.
        </p>
      </header>

      {!done ? (
        <main className="container">
          <ProgressBar current={idx} total={TOTAL} />

          <section className="card">
            <div className="card__eyebrow">
              Pregunta {idx + 1} de {TOTAL}
            </div>
            <h2 className="card__question">{q.texto}</h2>

            <div className="scale">
              {SCALE.map((o) => (
                <label key={o.value} className={`chip ${answers[q.id] === o.value ? "chip--active" : ""}`}>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={o.value}
                    checked={answers[q.id] === o.value}
                    onChange={() => handleSelect(o.value)}
                    aria-label={`${o.value} - ${o.label}`}
                  />
                  <span className="chip__value">{o.value}</span>
                  <span className="chip__label">{o.label}</span>
                </label>
              ))}
            </div>

            <div className="nav">
              <button
                className="btn btn--ghost"
                onClick={prev}
                disabled={idx === 0}
              >
                ⟵ Anterior
              </button>
              <div className="spacer" />
              <button
                className={`btn ${canNext ? "" : "btn--disabled"}`}
                onClick={next}
                disabled={!canNext}
              >
                {idx === TOTAL - 1 ? "Ver resultados ✨" : "Siguiente ⟶"}
              </button>
            </div>

            <div className="meta">
              <span>
                Respondidas: <strong>{answeredCount}</strong> / {TOTAL}
              </span>
              <span className="pill">{AREAS[q.area].nombre}</span>
            </div>
          </section>
        </main>
      ) : (
        <main className="container">
          <section className="card card--result">
            <div className="card__eyebrow">Resumen</div>
            <h2 className="card__question">¡Listo! Aquí está tu perfil</h2>

            <ResultBars scores={scores} maxPerArea={Math.max(...Object.values(maxPerArea))} />

            <div className="tips">
              <h3>¿Qué podrías explorar ahora?</h3>
              <ul>
                {Object.keys(AREAS).map(key => (
                  <li key={key}>
                    <strong>{AREAS[key].nombre}:</strong> {AREAS[key].descripcion}
                  </li>
                ))}
              </ul>
            </div>

            <div className="nav">
              <button className="btn btn--ghost" onClick={restart}>
                Reiniciar encuesta
              </button>
              <div className="spacer" />
              <button
                className="btn"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Volver arriba ⤴
              </button>
            </div>
          </section>
        </main>
      )}

      <footer className="footer">
        Hecho con <span className="heart">💙</span> — paleta azul & acento amarillo.
      </footer>
    </div>
  );
}

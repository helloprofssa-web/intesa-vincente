import { useEffect, useMemo, useState } from 'react'
import './App.css'
import WORDS_BY_TOPIC from './data/topics'

const TOPICS = Object.keys(WORDS_BY_TOPIC)
const INITIAL_USED = TOPICS.reduce((acc, topic) => {
  acc[topic] = []
  return acc
}, {})

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function App() {
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0])
  const [usedWordsByTopic, setUsedWordsByTopic] = useState(INITIAL_USED)
  const [currentWord, setCurrentWord] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [score, setScore] = useState(0)
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false)

  const topicWords = useMemo(() => WORDS_BY_TOPIC[selectedTopic], [selectedTopic])
  const usedWords = usedWordsByTopic[selectedTopic]

  useEffect(() => {
    if (!isTimerRunning) {
      return undefined
    }

    const intervalId = setInterval(() => {
      setSecondsLeft((prevSeconds) => {
        if (prevSeconds <= 1) {
          setIsTimerRunning(false)
          return 0
        }

        return prevSeconds - 1
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isTimerRunning])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === 'Escape') {
        setIsRulesModalOpen(false)
      }

      if (event.code === 'Space') {
        event.preventDefault()
        setIsTimerRunning(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleTopicChange = (event) => {
    setSelectedTopic(event.target.value)
    setCurrentWord('')
    setSecondsLeft(60)
    setIsTimerRunning(false)
    setScore(0)
  }

  const handleNewWord = () => {
    const availableWords = topicWords.filter((word) => !usedWords.includes(word))
    const shouldResetTimer = secondsLeft === 0 || !currentWord

    if (availableWords.length === 0) {
      // Restart the topic cycle when all words have been used.
      const randomIndex = Math.floor(Math.random() * topicWords.length)
      const randomWord = topicWords[randomIndex]

      setUsedWordsByTopic((prev) => ({
        ...prev,
        [selectedTopic]: [randomWord],
      }))

      setCurrentWord(randomWord)
      if (shouldResetTimer) {
        setSecondsLeft(60)
      }
      setIsTimerRunning(true)
      return
    }

    const randomIndex = Math.floor(Math.random() * availableWords.length)
    const randomWord = availableWords[randomIndex]

    setUsedWordsByTopic((prev) => ({
      ...prev,
      [selectedTopic]: [...prev[selectedTopic], randomWord],
    }))

    setCurrentWord(randomWord)
    if (shouldResetTimer) {
      setSecondsLeft(60)
    }
    setIsTimerRunning(true)
  }

  const statusText =
    secondsLeft === 0
      ? 'Tempo scaduto'
      : isTimerRunning
        ? 'Timer attivo'
        : currentWord
          ? 'Timer fermo con spazio. Premi Nuova parola per ripartire.'
          : 'Premi Nuova parola per iniziare.'

  return (
    <main className="app-shell">
      <section className="card">
        <header className="card-header">
          <h1>L'Intesa Vincente</h1>
          <button
            type="button"
            className="rules-button"
            onClick={() => setIsRulesModalOpen(true)}
          >
            Regolamento
          </button>
        </header>

        <div className="controls">
          <label htmlFor="topic-select">Argomento</label>
          <select id="topic-select" value={selectedTopic} onChange={handleTopicChange}>
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>

          <button type="button" onClick={handleNewWord}>
            Nuova parola
          </button>
        </div>

        <div className="word-box" aria-live="polite">
          {currentWord || 'Premi Nuova parola per iniziare'}
        </div>

        <div className="status-row">
          <div className="timer-panel">
            <p className="timer-label">Timer</p>
            <p className={`timer-value ${secondsLeft <= 10 && isTimerRunning ? 'danger' : ''}`}>
              {formatTime(secondsLeft)}
            </p>
          </div>

          <div className="score-panel">
            <p className="score-label">Punteggio</p>
            <p className="score-value">{score}</p>
            <button
              type="button"
              className="score-button"
              onClick={() => setScore((prev) => prev + 1)}
            >
              +1 punto
            </button>
          </div>
        </div>

        <div className="timer-panel">
          <p className="timer-help">Premi Spazio per fermare il timer.</p>
          <p className="status-text">{statusText}</p>
        </div>
      </section>

      {isRulesModalOpen && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setIsRulesModalOpen(false)}
        >
          <section
            className="rules-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rules-modal-head">
              <h2 id="rules-title">Intesa Vincente - Regolamento</h2>
              <button
                type="button"
                className="rules-close"
                onClick={() => setIsRulesModalOpen(false)}
                aria-label="Chiudi regolamento"
              >
                X
              </button>
            </div>

            <h3>Obiettivo</h3>
            <p>
              Indovinare il maggior numero possibile di parole o concetti relativi agli
              argomenti studiati.
            </p>

            <h3>Squadre</h3>
            <p>Ogni squadra e composta da:</p>
            <ul>
              <li>2 suggeritori</li>
              <li>1 indovino</li>
            </ul>
            <p>I ruoli ruotano a ogni manche.</p>

            <h3>Come si gioca</h3>
            <ol>
              <li>L'insegnante assegna una parola ai suggeritori.</li>
              <li>L'indovino non puo vedere la parola.</li>
              <li>
                I suggeritori formulano una domanda alternandosi e pronunciando una sola
                parola per volta.
              </li>
              <li>L'indovino puo rispondere in qualsiasi momento.</li>
              <li>Ogni risposta corretta vale 1 punto.</li>
              <li>Vince la squadra che ottiene piu punti.</li>
            </ol>

            <h3>Regole</h3>
            <p>E consentito:</p>
            <ul>
              <li>Costruire domande pertinenti.</li>
              <li>Collaborare rispettando il turno di parola.</li>
            </ul>
            <p>Non e consentito:</p>
            <ul>
              <li>Pronunciare la parola da indovinare o parole derivate.</li>
              <li>Utilizzare gesti, mimica o altri suggerimenti non verbali.</li>
              <li>Dire piu di una parola per turno.</li>
            </ul>

            <h3>Finalita</h3>
            <p>
              Ripassare i contenuti disciplinari, potenziare il lessico specifico e favorire
              la collaborazione tra compagni.
            </p>
          </section>
        </div>
      )}
    </main>
  )
}

export default App

import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import WORDS_BY_TOPIC from './data/topics'
import endTimeSound from './sounds/EndTime.mp3'
import wrongAnswerSound from './sounds/WrongAnswer.mp3'

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
  const [spaceSecondsLeft, setSpaceSecondsLeft] = useState(5)
  const [isSpaceTimerRunning, setIsSpaceTimerRunning] = useState(false)
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false)
  const [isSpaceModalPending, setIsSpaceModalPending] = useState(false)
  const [score, setScore] = useState(0)
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false)
  const audioContextRef = useRef(null)
  const endTimeAudioRef = useRef(null)
  const wrongAnswerAudioRef = useRef(null)
  const spaceModalTimeoutRef = useRef(null)

  const topicWords = useMemo(() => WORDS_BY_TOPIC[selectedTopic], [selectedTopic])
  const usedWords = usedWordsByTopic[selectedTopic]

  const playBeep = (frequency, duration, volume = 0.15, when = 0) => {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) {
      return
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor()
    }

    const context = audioContextRef.current

    if (context.state === 'suspended') {
      context.resume()
    }

    const oscillator = context.createOscillator()
    const gainNode = context.createGain()
    const startAt = context.currentTime + when

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, startAt)

    gainNode.gain.setValueAtTime(0.0001, startAt)
    gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.start(startAt)
    oscillator.stop(startAt + duration)
  }

  const playSound = (type) => {
    if (type === 'space-click') {
      playBeep(880, 0.13, 0.11)
      return
    }

    if (type === 'countdown-tick') {
      playBeep(940, 0.09, 0.1)
      return
    }

    if (type === 'minute-end') {
      if (!endTimeAudioRef.current) {
        endTimeAudioRef.current = new Audio(endTimeSound)
      }

      endTimeAudioRef.current.currentTime = 0
      endTimeAudioRef.current.play().catch(() => {})
      return
    }

    if (type === 'time-end') {
      if (!wrongAnswerAudioRef.current) {
        wrongAnswerAudioRef.current = new Audio(wrongAnswerSound)
      }

      wrongAnswerAudioRef.current.currentTime = 0
      wrongAnswerAudioRef.current.play().catch(() => {})
    }
  }

  useEffect(() => {
    if (!isTimerRunning) {
      return undefined
    }

    const intervalId = setInterval(() => {
      setSecondsLeft((prevSeconds) => {
        if (prevSeconds <= 1) {
          setIsTimerRunning(false)
          playSound('minute-end')
          return 0
        }

        return prevSeconds - 1
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isTimerRunning])

  useEffect(() => {
    if (!isSpaceTimerRunning) {
      return undefined
    }

    const intervalId = setInterval(() => {
      setSpaceSecondsLeft((prevSeconds) => {
        if (prevSeconds <= 1) {
          setIsSpaceTimerRunning(false)
          playSound('time-end')
          return 0
        }

        playSound('countdown-tick')

        return prevSeconds - 1
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isSpaceTimerRunning])

  useEffect(() => {
    return () => {
      if (spaceModalTimeoutRef.current) {
        clearTimeout(spaceModalTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === 'Escape') {
        setIsRulesModalOpen(false)
      }

      if (event.code === 'Space') {
        event.preventDefault()

        if (
          !isTimerRunning ||
          isSpaceTimerRunning ||
          isSpaceModalPending ||
          isSpaceModalOpen ||
          isRulesModalOpen ||
          secondsLeft === 0
        ) {
          return
        }

        playSound('space-click')
        setIsTimerRunning(false)
        setIsSpaceModalPending(true)
        setSpaceSecondsLeft(5)

        spaceModalTimeoutRef.current = setTimeout(() => {
          setIsSpaceModalOpen(true)
          setIsSpaceTimerRunning(true)
          setIsSpaceModalPending(false)
          spaceModalTimeoutRef.current = null
        }, 1000)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    isTimerRunning,
    isSpaceTimerRunning,
    isSpaceModalPending,
    isSpaceModalOpen,
    isRulesModalOpen,
    secondsLeft,
  ])

  const handleTopicChange = (event) => {
    if (spaceModalTimeoutRef.current) {
      clearTimeout(spaceModalTimeoutRef.current)
      spaceModalTimeoutRef.current = null
    }

    setSelectedTopic(event.target.value)
    setCurrentWord('')
    setSecondsLeft(60)
    setIsTimerRunning(false)
    setIsSpaceTimerRunning(false)
    setIsSpaceModalPending(false)
    setIsSpaceModalOpen(false)
    setSpaceSecondsLeft(5)
    setScore(0)
  }

  const handleNewWord = () => {
    if (spaceModalTimeoutRef.current) {
      clearTimeout(spaceModalTimeoutRef.current)
      spaceModalTimeoutRef.current = null
    }

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
    setIsSpaceTimerRunning(false)
    setIsSpaceModalPending(false)
    setIsSpaceModalOpen(false)
    setSpaceSecondsLeft(5)
    setIsTimerRunning(true)
  }

  const handleStopTimer = () => {
    if (spaceModalTimeoutRef.current) {
      clearTimeout(spaceModalTimeoutRef.current)
      spaceModalTimeoutRef.current = null
    }

    setIsTimerRunning(false)
    setIsSpaceTimerRunning(false)
    setIsSpaceModalPending(false)
    setIsSpaceModalOpen(false)
    setSpaceSecondsLeft(5)
  }

  const handleCloseSpaceModal = () => {
    if (spaceModalTimeoutRef.current) {
      clearTimeout(spaceModalTimeoutRef.current)
      spaceModalTimeoutRef.current = null
    }

    setIsSpaceModalOpen(false)
    setIsSpaceTimerRunning(false)
    setIsSpaceModalPending(false)
    setSpaceSecondsLeft(5)
  }

  const handleResetScore = () => {
    setScore(0)
  }

  const statusText =
    secondsLeft === 0
      ? 'Tempo scaduto'
      : isSpaceModalPending
        ? 'Apertura pausa tra 1 secondo...'
      : isSpaceTimerRunning
        ? 'Pausa Spazio attiva: attendi il conto alla rovescia nella modale.'
      : isSpaceModalOpen
        ? 'Tempo terminato.'
      : isTimerRunning
        ? 'Timer attivo'
        : currentWord
          ? 'Timer fermo con spazio. Premi Nuova parola per ripartire.'
          : 'Premi Nuova parola per iniziare.'

  const countdownProgress = Math.max(0, Math.min(100, (spaceSecondsLeft / 5) * 100))

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
            <button type="button" className="panel-button" onClick={handleStopTimer}>
              Stop
            </button>
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
            <button
              type="button"
              className="score-button secondary"
              onClick={handleResetScore}
            >
              Reset punteggio
            </button>
          </div>
        </div>

      </section>

      {isSpaceModalOpen && (
        <div className="modal-overlay" role="presentation">
          <section
            className="countdown-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Countdown 5 secondi"
          >
            <button
              type="button"
              className="countdown-close-top"
              onClick={handleCloseSpaceModal}
              aria-label="Chiudi countdown"
            >
              X
            </button>
            <div
              className="countdown-circle"
              style={{ '--progress': `${countdownProgress}%` }}
            >
              <div className="countdown-circle-core">
                <p className="countdown-value">{formatTime(spaceSecondsLeft)}</p>
              </div>
            </div>
            {!isSpaceTimerRunning && (
              <p className="countdown-help">Tempo terminato.</p>
            )}
          </section>
        </div>
      )}

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

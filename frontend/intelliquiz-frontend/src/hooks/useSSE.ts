import { useEffect, useState, useCallback, useRef } from 'react'
import { getOrCreateDeviceId } from '../services/deviceId'

export type SSERole = 'PARTICIPANT' | 'HOST' | 'PROCTOR'

export interface ConnectedTeam {
  id: number
  name: string
  connectedAt: string
}

export interface KickedTeam {
  id: number
  name: string
  reason: string
  kickedAt: string
}

interface SubmitAnswerPayload {
  teamId?: number | string
  questionId: number | string
  answer?: string
  selectedOption?: string
}

interface SendCommandPayload {
  type: string
  payload?: Record<string, unknown>
}

interface ProctorSnapshotResponse {
  connectedTeams?: Array<{ id: number; name: string; connectedAt?: string }>
  kickedTeams?: Array<{ id: number; name: string; reason?: string; kickedAt?: string }>
}

export function useSSE(
  quizId: number | string,
  role: SSERole,
  teamId?: number | string,
  accessCode?: string
) {
  const quizIdStr = String(quizId)

  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [gameState, setGameState] = useState<string>('LOBBY')
  const [participantNavigationEnabled, setParticipantNavigationEnabled] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timerTotalTime, setTimerTotalTime] = useState(0)

  const [connectedTeams, setConnectedTeams] = useState<ConnectedTeam[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [rankings, setRankings] = useState<any[]>([])
  const [violations, setViolations] = useState<any[]>([])
  const [kicked, setKicked] = useState(false)
  const [kickedTeams, setKickedTeams] = useState<KickedTeam[]>([])
  const [kickReason, setKickReason] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttemptsRef = useRef(10)
  const questionNumberRef = useRef(0)
  const totalQuestionsRef = useRef(0)

  useEffect(() => {
    questionNumberRef.current = questionNumber
  }, [questionNumber])

  useEffect(() => {
    totalQuestionsRef.current = totalQuestions
  }, [totalQuestions])

  const normalizeGameState = (state?: string) => {
    if (!state) return 'UNKNOWN'
    if (state === 'ACTIVE') return 'QUESTION'
    if (state === 'ENDED') return 'FINAL_RESULTS'
    return state
  }

  const normalizeRankings = (raw: any[]): any[] => {
    return raw.map((entry, idx) => ({
      teamId: Number(entry.teamId ?? entry.id ?? 0),
      teamName: String(entry.teamName ?? entry.name ?? `Team ${entry.teamId ?? entry.id ?? ''}`),
      score: Number(entry.score ?? entry.totalScore ?? 0),
      rank: Number(entry.rank ?? idx + 1),
    }))
  }

  const refreshProctorSnapshot = useCallback(async () => {
    if (role !== 'PROCTOR' && role !== 'HOST') {
      return null
    }

    const response = await fetch(`/api/quiz/${quizIdStr}/proctor-snapshot`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })

    const data = (await response.json()) as ProctorSnapshotResponse
    if (!response.ok) {
      setError((data as any)?.message || 'Failed to load proctor snapshot')
      return data
    }

    const connected = Array.isArray(data.connectedTeams)
      ? data.connectedTeams.map((team) => ({
          id: Number(team.id),
          name: String(team.name || `Team ${team.id}`),
          connectedAt: team.connectedAt || new Date().toISOString(),
        }))
      : []

    const kickedSnapshot = Array.isArray(data.kickedTeams)
      ? data.kickedTeams.map((team) => ({
          id: Number(team.id),
          name: String(team.name || `Team ${team.id}`),
          reason: String(team.reason || 'Removed from this quiz'),
          kickedAt: team.kickedAt || new Date().toISOString(),
        }))
      : []

    setConnectedTeams(connected)
    setKickedTeams(kickedSnapshot)

    return data
  }, [quizIdStr, role])

  const connect = useCallback(() => {
    if (eventSourceRef.current) return

    setConnecting(true)
    setError(null)

    const params = new URLSearchParams()
    params.append('role', role)
    if (teamId !== undefined && teamId !== null) params.append('teamId', String(teamId))
    if (accessCode) params.append('accessCode', accessCode)
    // Include device ID for sticky sessions
    params.append('deviceId', getOrCreateDeviceId())

    const source = new EventSource(`/api/quiz/${quizIdStr}/stream?${params.toString()}`, {
      withCredentials: true,
    })

    source.onopen = () => {
      setConnected(true)
      setConnecting(false)
      setError(null)
      reconnectAttemptsRef.current = 0

      void refreshProctorSnapshot()
    }

    source.onerror = () => {
      setConnected(false)
      setConnecting(false)

      if (reconnectAttemptsRef.current >= maxReconnectAttemptsRef.current) {
        setError('Connection lost. Max reconnection attempts exceeded.')
        return
      }

      reconnectAttemptsRef.current += 1
      setTimeout(() => {
        if (!eventSourceRef.current) {
          connect()
        }
      }, Math.min(30000, 1000 * reconnectAttemptsRef.current))
    }

    source.addEventListener('GAME_STATE', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)

        if (Array.isArray(data)) {
          // Rank-only payloads are used for both interim and final scoreboards.
          // If we already reached the last question, keep the UI in FINAL_RESULTS mode.
          const reachedLastQuestion =
            totalQuestionsRef.current > 0 && questionNumberRef.current >= totalQuestionsRef.current

          setGameState((prev) => {
            if (prev === 'FINAL_RESULTS' || reachedLastQuestion) {
              return 'FINAL_RESULTS'
            }
            return 'SCOREBOARD'
          })
          setRankings(normalizeRankings(data))
          return
        }

        const mappedState = normalizeGameState(data.state ?? data.gameState)
        setGameState(mappedState)
        
        // Extract participant navigation flag (true if participants can control next/previous)
        if (typeof data.participantNavigationEnabled === 'boolean') {
          setParticipantNavigationEnabled(data.participantNavigationEnabled)
        }

        if (typeof data.currentQuestionIndex === 'number') {
          setQuestionNumber(data.currentQuestionIndex + 1)
        }
        if (typeof data.totalQuestions === 'number') {
          setTotalQuestions(data.totalQuestions)
        }
        if (typeof data.timeRemaining === 'number') {
          setTimeRemaining(data.timeRemaining)
          if (data.timeRemaining > 0) {
            setTimerTotalTime(data.timeRemaining)
          }
        }

        if (data.currentQuestion) {
          const q = data.currentQuestion
          setCurrentQuestion({
            id: q.questionId ?? q.id,
            text: q.text,
            options: q.options || [],
            timeLimit: q.timeLimit || 30,
            points: q.points || 0,
            correctAnswer: q.correctAnswer,
          })
        }

        if (Array.isArray(data.teamResults)) {
          setRankings(normalizeRankings(data.teamResults))
        }
      } catch {
        setError('Failed to parse game state event')
      }
    })

    source.addEventListener('TIMER_TICK', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)
        setTimeRemaining(data.timeRemaining ?? 0)
        if (typeof data.totalTime === 'number') {
          setTimerTotalTime(data.totalTime)
        }
      } catch {
        setError('Failed to parse timer event')
      }
    })

    source.addEventListener('ANSWER_REVEAL', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)
        setGameState('ANSWER_REVEAL')

        if (Array.isArray(data.teamResults)) {
          setRankings(normalizeRankings(data.teamResults))
        }

        if (data.correctAnswer) {
          setCurrentQuestion((prev: any) =>
            prev ? { ...prev, correctAnswer: data.correctAnswer } : prev
          )
        }
      } catch {
        setError('Failed to parse answer reveal event')
      }
    })

    source.addEventListener('TEAM_JOINED', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)
        const team: ConnectedTeam = {
          id: Number(data.teamId ?? data.id),
          name: String(data.teamName ?? data.name ?? 'Team'),
          connectedAt: data.timestamp ?? new Date().toISOString(),
        }
        setConnectedTeams((prev) => {
          if (prev.some((t) => t.id === team.id)) return prev
          return [...prev, team]
        })
        setKickedTeams((prev) => prev.filter((t) => t.id !== team.id))
      } catch {
        setError('Failed to parse team join event')
      }
    })

    source.addEventListener('TEAM_DISCONNECTED', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)
        const disconnectedTeamId = Number(data.teamId ?? data.id)
        setConnectedTeams((prev) => prev.filter((t) => t.id !== disconnectedTeamId))
      } catch {
        setError('Failed to parse team disconnect event')
      }
    })

    source.addEventListener('SUBMISSION_NOTIFY', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)
        const payloadTeamId = Number(data?.payload)
        const directTeamId = Number(data?.teamId ?? data?.id)
        const normalized = {
          ...data,
          teamId: Number.isFinite(payloadTeamId) && payloadTeamId > 0
            ? payloadTeamId
            : (Number.isFinite(directTeamId) ? directTeamId : undefined),
        }
        setSubmissions((prev) => [...prev, normalized])
      } catch {
        setError('Failed to parse submission event')
      }
    })

    source.addEventListener('VIOLATION_NOTIFY', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)

        // Normalize different backend payload shapes into a stable violation object for the UI.
        const normalizedViolation = {
          teamId: Number(data.teamId ?? data.id ?? 0),
          teamName: String(data.teamName ?? data.name ?? (data.teamId ? `Team ${data.teamId}` : 'Unknown Team')),
          totalCount: Number(data.totalCount ?? data.count ?? data.violationCount ?? 0),
          lastType: String(data.lastType ?? data.type ?? 'UNKNOWN'),
          autoKicked: Boolean(data.autoKicked ?? data.wasAutoKicked ?? false),
        }

        setViolations((prev) => [...prev, normalizedViolation])
      } catch {
        setError('Failed to parse violation event')
      }
    })

    source.addEventListener('KICK_NOTIFICATION', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)
        const kickedTeamId = Number(data.teamId ?? data.id)
        const reason = String(data.reason || 'Removed by proctor')

        if (Number.isFinite(kickedTeamId)) {
          setKickedTeams((prev) => {
            const existing = prev.find((t) => t.id === kickedTeamId)
            const inferredName = existing?.name || `Team ${kickedTeamId}`
            const next: KickedTeam = {
              id: kickedTeamId,
              name: inferredName,
              reason,
              kickedAt: new Date().toISOString(),
            }
            if (existing) {
              return prev.map((t) => (t.id === kickedTeamId ? next : t))
            }
            return [...prev, next]
          })
          setConnectedTeams((prev) => prev.filter((t) => t.id !== kickedTeamId))
        }

        if (teamId !== undefined && Number(data.teamId) === Number(teamId)) {
          setKicked(true)
          setKickReason(data.reason || 'You have been removed from the quiz')
        }
      } catch {
        setError('Failed to parse kick event')
      }
    })

    source.addEventListener('ERROR', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)
        setError(data.message || 'Server error')
      } catch {
        setError('Server error')
      }
    })

    eventSourceRef.current = source
  }, [accessCode, quizIdStr, refreshProctorSnapshot, role, teamId])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setConnected(false)
    setConnecting(false)
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    setTimeout(() => connect(), 500)
  }, [connect, disconnect])

  const submitAnswer = useCallback(
    async (submission: SubmitAnswerPayload) => {
      const resolvedTeamId = submission.teamId ?? teamId
      const answer = submission.answer ?? submission.selectedOption

      const response = await fetch(`/api/quiz/${quizIdStr}/answer?teamId=${encodeURIComponent(String(resolvedTeamId))}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          questionId: Number(submission.questionId),
          answer: answer ?? '',
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Failed to submit answer')
      }
      return data
    },
    [quizIdStr, teamId]
  )

  const sendCommand = useCallback(
    async (command: SendCommandPayload) => {
      const response = await fetch(`/api/quiz/${quizIdStr}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(command),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Failed to execute command')
      }
      return data
    },
    [quizIdStr]
  )

  const reportViolation = useCallback(
    async (type: string) => {
      if (teamId === undefined || teamId === null) {
        setError('Cannot report violation without team ID')
        return null
      }

      const response = await fetch(`/api/quiz/${quizIdStr}/violation?teamId=${encodeURIComponent(String(teamId))}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Failed to report violation')
      }
      return data
    },
    [quizIdStr, teamId]
  )

  const kickTeam = useCallback(
    async (teamIdToKick: number | string, reason?: string) => {
      const response = await fetch(`/api/quiz/${quizIdStr}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teamId: String(teamIdToKick), reason: reason || 'Kicked by proctor' }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Failed to kick team')
      }
      return data
    },
    [quizIdStr]
  )

  const setAutoKickThreshold = useCallback(
    async (violationCount: number) => {
      const response = await fetch(`/api/quiz/${quizIdStr}/auto-kick-threshold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ violationCount }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Failed to set threshold')
      }
      return data
    },
    [quizIdStr]
  )

  const approveReentry = useCallback(
    async (teamIdToApprove: number | string) => {
      const response = await fetch(`/api/quiz/${quizIdStr}/approve-reentry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teamId: String(teamIdToApprove) }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.message || 'Failed to approve team re-entry')
        return data
      }

      setKickedTeams((prev) => prev.filter((t) => t.id !== Number(teamIdToApprove)))
      return data
    },
    [quizIdStr]
  )

  const navigateToQuestion = useCallback(async (questionIndex: number) => {
    if (teamId === undefined || teamId === null) {
      setError('Cannot navigate question without team ID')
      return null
    }

    const response = await fetch(
      `/api/quiz/${quizIdStr}/navigate?teamId=${encodeURIComponent(String(teamId))}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ questionIndex }),
      }
    )

    const data = await response.json()
    if (!response.ok) {
      setError(data.message || 'Failed to navigate question')
      return data
    }

    const q = data.question
    if (q) {
      setQuestionNumber(questionIndex + 1)
      setCurrentQuestion({
        id: q.questionId ?? q.id,
        text: q.text,
        options: q.options || [],
        timeLimit: q.timeLimit || 30,
        points: q.points || 0,
        correctAnswer: q.correctAnswer,
      })
    }

    return data
  }, [quizIdStr, teamId])

  useEffect(() => {
    if (!kicked) {
      connect()
    }
    return () => disconnect()
  }, [connect, disconnect, kicked])

  return {
    connected,
    connecting,
    error,
    gameState,
    participantNavigationEnabled,
    currentQuestion,
    questionNumber,
    totalQuestions,
    timeRemaining,
    timerTotalTime,
    connectedTeams,
    submissions,
    rankings,
    violations,
    kickedTeams,
    kicked,
    kickReason,
    submitAnswer,
    sendCommand,
    reportViolation,
    kickTeam,
    approveReentry,
    setAutoKickThreshold,
    navigateToQuestion,
    reconnect,
    disconnect,
    connect,
    refreshProctorSnapshot,
  }
}

export default useSSE

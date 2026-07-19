/**
 * Shared utilities for prediction-market filtering, normalisation, and
 * question generation.  Used by PredictionMarkets, Matches, and MatchDetail.
 */

// ── prediction-market filter ──
// Keep only: "1X2 Full Time", "Over/Under Goals (2.5)" full time,
// "Both Teams to Score".  Drop all Asian Handicap lines and all
// "1st Half" sub-markets — these are sportsbook spread instruments,
// not prediction-market questions.

export function isPredictionMarket(market) {
  const type = market.type || ''
  const period = market.period || ''
  const line = market.line || ''
  if (type.includes('ASIAN')) return false
  if (period.startsWith('half=')) return false
  if (type === '1X2_PARTICIPANT_RESULT' && !period) return true
  if (type === 'OVERUNDER_PARTICIPANT_GOALS' && !period && line === '2.5') return true
  if (type === 'BTTS') return true
  return false
}

// ── convert decimal odds to implied probabilities ──
// For every outcome compute probability = 1 / decimal_odds.
// If the sum exceeds 100% (bookmaker margin), normalise:
//   normalised = raw / sum(all_raw).

export function normalize(sels) {
  const raw = sels.map((s) => (s.odds > 0 ? 1 / s.odds : 0))
  const sum = raw.reduce((a, b) => a + b, 0)
  if (sum === 0) return raw.map(() => 0)
  return raw.map((p) => (p / sum) * 100)
}

// ── split each outcome into a standalone Yes/No card ──
// Do NOT render one card with multiple side-by-side outcomes.
// Each outcome becomes its own card with a single Yes/No question.
//
// fixture is expected to have at minimum:
//   { fixtureId, homeTeam, awayTeam, status, startTime, markets }

export function generateQuestions(fixture) {
  const { fixtureId, homeTeam, awayTeam, status, startTime, markets } = fixture
  const filtered = (markets || []).filter(isPredictionMarket)
  const questions = []
  const isLive = status === 'Live'

  for (const mkt of filtered) {
    const sels = mkt.selections || []
    if (sels.length === 0) continue

    const type = mkt.type || ''

    // ── 1X2 Full Time → three cards (Home / Draw / Away) ──
    if (type === '1X2_PARTICIPANT_RESULT' && sels.length >= 3) {
      const probs = normalize([sels[0], sels[1], sels[2]])
      questions.push(
        {
          fixtureId, homeTeam, awayTeam, status, startTime, isLive,
          question: `Will ${homeTeam} win?`,
          yesProb: probs[0],
          selection: sels[0],
          marketLabel: 'Match Winner',
        },
        {
          fixtureId, homeTeam, awayTeam, status, startTime, isLive,
          question: 'Will the match end in a draw?',
          yesProb: probs[1],
          selection: sels[1],
          marketLabel: 'Match Winner',
        },
        {
          fixtureId, homeTeam, awayTeam, status, startTime, isLive,
          question: `Will ${awayTeam} win?`,
          yesProb: probs[2],
          selection: sels[2],
          marketLabel: 'Match Winner',
        },
      )
    }

    // ── Over/Under 2.5 Goals → single card ──
    if (type === 'OVERUNDER_PARTICIPANT_GOALS' && sels.length >= 2) {
      const probs = normalize([sels[0], sels[1]])
      questions.push({
        fixtureId, homeTeam, awayTeam, status, startTime, isLive,
        question: `Will total goals be over ${mkt.line || '2.5'}?`,
        yesProb: probs[0],
        selection: sels[0],
        marketLabel: `Over/Under ${mkt.line || '2.5'}`,
      })
    }

    // ── Both Teams to Score → single card ──
    if (type === 'BTTS' && sels.length >= 2) {
      const probs = normalize([sels[0], sels[1]])
      questions.push({
        fixtureId, homeTeam, awayTeam, status, startTime, isLive,
        question: 'Will both teams score?',
        yesProb: probs[0],
        selection: sels[0],
        marketLabel: 'Both Teams to Score',
      })
    }
  }

  return questions
}

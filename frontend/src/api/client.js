const API_BASE = '/api'
const TIMEOUT_MS = 25_000

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status} — ${text || url}`)
    }
    return res.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s: ${url}`)
    }
    throw err
  } finally {
    clearTimeout(id)
  }
}

export async function fetchFixtures() {
  return fetchWithTimeout(`${API_BASE}/fixtures`)
}

export async function fetchOdds(fixtureId) {
  return fetchWithTimeout(`${API_BASE}/odds/${fixtureId}`)
}

/**
 * Fetch markets for all fixtures. Returns an array of:
 * { fixtureId, homeTeam, awayTeam, status, markets: [...] }
 */
export async function fetchAllMarkets() {
  const fixturesRes = await fetchFixtures()
  const fixtures = fixturesRes.data || []

  const marketsPromises = fixtures.map(async (f) => {
    try {
      const oddsRes = await fetchOdds(f.id)
      return {
        fixtureId: f.id,
        homeTeam: f.homeTeam || 'TBD',
        awayTeam: f.awayTeam || 'TBD',
        status: f.status || 'NotStarted',
        startTime: f.startTime,
        competitionId: f.competitionId,
        competition: f.competition,
        markets: oddsRes.markets || [],
      }
    } catch (err) {
      console.warn(`[txBOB] Failed to fetch odds for fixture ${f.id}:`, err.message)
      return {
        fixtureId: f.id,
        homeTeam: f.homeTeam || 'TBD',
        awayTeam: f.awayTeam || 'TBD',
        status: f.status || 'NotStarted',
        startTime: f.startTime,
        competitionId: f.competitionId,
        competition: f.competition,
        markets: [],
      }
    }
  })

  return Promise.all(marketsPromises)
}

/**
 * POST a new prediction to the backend.
 */
export async function savePrediction(payload) {
  return fetchWithTimeout(`${API_BASE}/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/**
 * GET all predictions for a wallet address.
 */
export async function fetchPredictions(wallet) {
  return fetchWithTimeout(`${API_BASE}/predictions/${wallet}`)
}

/**
 * GET prediction status by ID.
 */
export async function fetchPredictionStatus(predictionId) {
  return fetchWithTimeout(`${API_BASE}/predictions/${predictionId}/status`)
}

export interface AgendaApiSpeaker {
  Name: string
  JobTitle: string | null
  Organization: string | null
  Image: string | null
}

export interface AgendaApiSession {
  ItemID: number
  SessionName: string
  StartTime: string
  EndTime: string
  Date: string
  Description: string | null
  Room: string | null
  RoomID: number
  SessionType: string | null
  SessionTypeID: number | null
  Track: string | null
  TrackID: number | null
  TrackData: {
    ItemID: number
    Name: string
    EventId: string
    ItemOrder: number | null
    ArabicName: string | null
    Color: string | null
  } | null
  SessionPartners: unknown[]
  Speakers: AgendaApiSpeaker[]
}

export async function fetchAgendaSessions(eventExternalId: string): Promise<AgendaApiSession[]> {
  const base = process.env.AGENDA_API_BASE_URL ?? 'https://speakers.aimcongress.com/api/website/agenda'
  const res = await fetch(`${base}?EventId=${encodeURIComponent(eventExternalId)}`, { cache: 'no-store' })

  if (!res.ok) {
    throw new Error(`Agenda API request failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('Agenda API returned unexpected shape (expected array)')
  }

  return data as AgendaApiSession[]
}

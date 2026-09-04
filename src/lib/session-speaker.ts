import type { AgendaApiSpeaker } from '@/lib/agenda-api'

export type SessionSpeaker = {
  name: string
  jobTitle: string | null
  organization: string | null
  imageUrl: string | null
}

export function mapAgendaSpeakers(speakers: AgendaApiSpeaker[]): SessionSpeaker[] {
  return speakers.map((s) => ({
    name: s.Name,
    jobTitle: s.JobTitle,
    organization: s.Organization,
    imageUrl: s.Image,
  }))
}

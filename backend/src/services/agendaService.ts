import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { JWT } from "google-auth-library";

const calendarId = "woshington.rod@gmail.com";
export class AgendaService {
  private jwtClient;

  constructor() {
    const credentials = JSON.parse(
      fs.readFileSync(
        path.join(
          `${process.env.PATH_GOOGLE_CREDENTIALS}${process.env.GOOGLE_APPLICATION_CREDENTIALS}`
        ),
        "utf-8"
      )
    );
    this.jwtClient = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
  }

  async listAvailableSlots(startDate: string, endDate: string) {
    await this.jwtClient.authorize();

    const calendar = google.calendar({ version: "v3", auth: this.jwtClient });

    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        timeZone: "America/Sao_Paulo",
        items: [{ id: "primary" }], // You can replace with your calendarId
      },
    });

    const busySlots = res.data.calendars?.primary?.busy || [];

    const workingStartHour = 9;
    const workingEndHour = 17;
    const slotDurationMinutes = 50;

    const freeSlots: string[] = [];
    let current = new Date(startDate);

    while (current < new Date(endDate)) {
      const hour = current.getHours();
      if (hour >= workingStartHour && hour < workingEndHour) {
        const isBusy = busySlots.some(
          (busy: any) =>
            current >= new Date(busy.start) && current < new Date(busy.end)
        );
        if (!isBusy) {
          freeSlots.push(current.toISOString());
        }
      }
      current.setMinutes(current.getMinutes() + slotDurationMinutes);
    }

    return freeSlots;
  }

  async criarEvento({
    nomePaciente,
    data,
    horarioInicio,
    horarioFim,
    modalidade,
  }: {
    nomePaciente: string;
    data: string; // '2025-08-03'
    horarioInicio: string; // '14:00'
    horarioFim: string; // '15:00'
    modalidade: "Presencial" | "Online";
  }) {
    await this.jwtClient.authorize();

  const calendar = google.calendar({ version: "v3", auth: this.jwtClient });
  
  // DEBUG: Log what we receive
  console.log('Received times:', {
    horarioInicio,
    horarioFim
  });

  // FIX: Ensure proper time format with colon
  const startTimeFormatted = this._ensureColonFormat(horarioInicio);
  const endTimeFormatted = this._ensureColonFormat(horarioFim);

  // FIX: Proper ISO format with colon between time and timezone
  const startDateTime = `${data}T${startTimeFormatted}:00-03:00`;
  const endDateTime = `${data}T${endTimeFormatted}:00-03:00`;

  console.log('Formatted for Google Calendar:', {
    start: startDateTime,
    end: endDateTime
  });

  const evento = {
    summary: `Consulta com ${nomePaciente} (${modalidade})`,
    start: { dateTime: startDateTime },
    end: { dateTime: endDateTime },
    description: `Modalidade: ${modalidade}`,
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: evento,
  });

  return response.data.htmlLink;
}

  _ensureColonFormat(timeStr: any) {
  console.log('Raw time received:', timeStr);
  
  // Remove any spaces
  let cleaned = timeStr.replace(/\s/g, '');
  
  // Handle the specific case: "1600:00" → "16:00"
  if (cleaned.includes(':') && cleaned.split(':')[0].length === 4) {
    const wrongPart = cleaned.split(':')[0];
    const hours = wrongPart.slice(0, 2);
    const minutes = wrongPart.slice(2);
    console.log(`Fixed format from ${cleaned} to ${hours}:${minutes}`);
    return `${hours}:${minutes}`;
  }
  
  // If it already has proper colon format like "16:00"
  if (cleaned.includes(':') && cleaned.split(':')[0].length <= 2) {
    const [hours, minutes] = cleaned.split(':');
    const result = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    console.log(`Already proper format: ${cleaned} → ${result}`);
    return result;
  }
  
  // If no colon but 4 digits (like 1900), add colon
  if (cleaned.length === 4 && !isNaN(cleaned)) {
    const result = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    console.log(`Converted 4-digit: ${cleaned} → ${result}`);
    return result;
  }
  
  // If no colon but 1-2 digits, assume hours
  if (cleaned.length <= 2 && !isNaN(cleaned)) {
    const result = `${cleaned.padStart(2, '0')}:00`;
    console.log(`Converted hours: ${cleaned} → ${result}`);
    return result;
  }
  
  console.log('Could not parse time, returning as-is:', cleaned);
  return cleaned;
}
}

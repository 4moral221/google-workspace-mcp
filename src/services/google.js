import { google } from 'googleapis';
import { config } from '../config.js';
import { getActiveGoogleToken } from './supabase.js';

async function getOAuth2Client(accountEmail = null) {
  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
  const tokenRow = await getActiveGoogleToken(accountEmail);
  oauth2Client.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: tokenRow.expiry_date,
  });
  return oauth2Client;
}

// ── Gmail ────────────────────────────────────────────────
export async function gmailSearch({ q = '', maxResults = 20 } = {}) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.list({ userId: 'me', q, maxResults });
  return res.data;
}

export async function gmailGetMessage({ id }) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
  return res.data;
}

export async function gmailSend({ to, subject, body, cc, bcc }) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });
  const lines = [`To: ${to}`, `Subject: ${subject}`];
  if (cc) lines.push(`Cc: ${cc}`);
  if (bcc) lines.push(`Bcc: ${bcc}`);
  lines.push('', body);
  const raw = Buffer.from(lines.join('\r\n')).toString('base64url');
  const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  return res.data;
}

export async function gmailCreateDraft({ to, subject, body }) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = Buffer.from(`To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`).toString('base64url');
  const res = await gmail.users.drafts.create({ userId: 'me', requestBody: { message: { raw } } });
  return res.data;
}

// ── Calendar ─────────────────────────────────────────────
export async function calendarListEvents({ calendarId = 'primary', timeMin, timeMax, q, maxResults = 50 } = {}) {
  const auth = await getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId, timeMin, timeMax, q, maxResults,
    singleEvents: true, orderBy: 'startTime',
  });
  return res.data;
}

export async function calendarCreateEvent({ calendarId = 'primary', summary, start, end, description, location, attendees }) {
  const auth = await getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });
  const toDateTime = (s) => s.includes('T') ? { dateTime: s } : { date: s };
  const resource = {
    summary, description, location,
    start: toDateTime(start),
    end: toDateTime(end),
    attendees: attendees?.map(email => ({ email })),
  };
  const res = await calendar.events.insert({ calendarId, requestBody: resource });
  return res.data;
}

export async function calendarUpdateEvent({ eventId, calendarId = 'primary', summary, start, end, description, location }) {
  const auth = await getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });
  const toDateTime = (s) => s?.includes('T') ? { dateTime: s } : s ? { date: s } : undefined;
  const patch = {};
  if (summary !== undefined) patch.summary = summary;
  if (description !== undefined) patch.description = description;
  if (location !== undefined) patch.location = location;
  if (start !== undefined) patch.start = toDateTime(start);
  if (end !== undefined) patch.end = toDateTime(end);
  const res = await calendar.events.patch({ calendarId, eventId, requestBody: patch });
  return res.data;
}

export async function calendarDeleteEvent({ eventId, calendarId = 'primary' }) {
  const auth = await getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth });
  await calendar.events.delete({ calendarId, eventId });
  return { deleted: true, eventId };
}

// ── Drive ─────────────────────────────────────────────────
export async function driveSearchFiles({ q = '', pageSize = 20 } = {}) {
  const auth = await getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.list({
    q: q ? `name contains '${q}'` : undefined,
    pageSize,
    fields: 'files(id,name,mimeType,size,webViewLink,modifiedTime)',
  });
  return res.data;
}

export async function driveGetFileMetadata({ fileId }) {
  const auth = await getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType,size,webViewLink,modifiedTime,parents,owners',
  });
  return res.data;
}

export async function driveReadFileContent({ fileId }) {
  const auth = await getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth });
  const meta = await drive.files.get({ fileId, fields: 'mimeType' });
  const mimeType = meta.data.mimeType;

  let exportMime = null;
  if (mimeType === 'application/vnd.google-apps.document') exportMime = 'text/plain';
  else if (mimeType === 'application/vnd.google-apps.spreadsheet') exportMime = 'text/csv';

  if (exportMime) {
    const res = await drive.files.export({ fileId, mimeType: exportMime }, { responseType: 'text' });
    return { content: res.data };
  }
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  return { content: res.data };
}

export async function driveCreateFile({ name, content, mimeType = 'text/plain', folderId }) {
  const auth = await getOAuth2Client();
  const drive = google.drive({ version: 'v3', auth });
  const { Readable } = await import('stream');
  const media = { mimeType, body: Readable.from([content]) };
  const resource = { name, parents: folderId ? [folderId] : undefined };
  const res = await drive.files.create({ requestBody: resource, media, fields: 'id,name,webViewLink' });
  return res.data;
}

// ── Docs ──────────────────────────────────────────────────
export async function docsGetContent({ documentId }) {
  const auth = await getOAuth2Client();
  const docs = google.docs({ version: 'v1', auth });
  const res = await docs.documents.get({ documentId });
  const body = res.data.body?.content || [];
  const text = body
    .flatMap(el => el.paragraph?.elements || [])
    .map(el => el.textRun?.content || '')
    .join('');
  return { documentId, text, title: res.data.title };
}

export async function docsAppendText({ documentId, text }) {
  const auth = await getOAuth2Client();
  const docs = google.docs({ version: 'v1', auth });
  const doc = await docs.documents.get({ documentId });
  const endIndex = doc.data.body.content.at(-1)?.endIndex - 1 || 1;
  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [{ insertText: { location: { index: endIndex }, text: `\n${text}` } }],
    },
  });
  return { documentId, appended: true };
}

// ── Sheets ────────────────────────────────────────────────
export async function sheetsGetValues({ spreadsheetId, range }) {
  const auth = await getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data;
}

export async function sheetsUpdateValues({ spreadsheetId, range, values, valueInputOption = 'USER_ENTERED' }) {
  const auth = await getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.update({
    spreadsheetId, range, valueInputOption,
    requestBody: { values },
  });
  return res.data;
}

export async function sheetsAppendRow({ spreadsheetId, values, range = 'A1', valueInputOption = 'USER_ENTERED' }) {
  const auth = await getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });
  const rows = Array.isArray(values[0]) ? values : [values];
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId, range, valueInputOption,
    requestBody: { values: rows },
  });
  return res.data;
}

// ── Slides ────────────────────────────────────────────────
export async function slidesCreate({ title }) {
  const auth = await getOAuth2Client();
  const slides = google.slides({ version: 'v1', auth });
  const res = await slides.presentations.create({ requestBody: { title } });
  return {
    presentationId: res.data.presentationId,
    title: res.data.title,
    url: `https://docs.google.com/presentation/d/${res.data.presentationId}`,
  };
}

export async function slidesAddSlide({ presentationId, title, bullets, body, layout = 'TITLE_AND_BODY' }) {
  const auth = await getOAuth2Client();
  const slides = google.slides({ version: 'v1', auth });
  const slideId = `slide_${Date.now()}`;
  const titleId = `title_${Date.now()}`;
  const bodyId = `body_${Date.now()}`;
  const requests = [
    {
      createSlide: {
        objectId: slideId,
        slideLayoutReference: { predefinedLayout: layout },
        placeholderIdMappings: [
          { layoutPlaceholder: { type: 'TITLE' }, objectId: titleId },
          { layoutPlaceholder: { type: 'BODY' }, objectId: bodyId },
        ],
      },
    },
    { insertText: { objectId: titleId, text: title } },
    { insertText: { objectId: bodyId, text: bullets ? bullets.join('\n') : (body || '') } },
  ];
  await slides.presentations.batchUpdate({ presentationId, requestBody: { requests } });
  return { presentationId, slideId, title };
}

// ── Tasks ─────────────────────────────────────────────────
export async function tasksList({ tasklistId = '@default', maxResults = 100, showCompleted = false } = {}) {
  const auth = await getOAuth2Client();
  const tasks = google.tasks({ version: 'v1', auth });
  const res = await tasks.tasks.list({ tasklist: tasklistId, maxResults, showCompleted });
  return res.data;
}

export async function tasksCreate({ title, tasklistId = '@default', notes, due }) {
  const auth = await getOAuth2Client();
  const tasks = google.tasks({ version: 'v1', auth });
  const res = await tasks.tasks.insert({
    tasklist: tasklistId,
    requestBody: { title, notes, due },
  });
  return res.data;
}

export async function tasksComplete({ taskId, tasklistId = '@default' }) {
  const auth = await getOAuth2Client();
  const tasks = google.tasks({ version: 'v1', auth });
  const res = await tasks.tasks.patch({
    tasklist: tasklistId,
    task: taskId,
    requestBody: { status: 'completed' },
  });
  return res.data;
}

/** Shared extraction of structured fields from official record text (search snippets or live HTML). */

const ADDRESS_PATTERN =
  /\d{1,6}\s+[\w\s.'#-]+(?:\b(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Boulevard|Way|Ct|Court|Pl|Place)\b)[,\s]+[\w\s.'-]+,?\s*[A-Z]{2}\b(?:\s+\d{5}(?:-\d{4})?)?/i;

const DECEDENT = /(?:estate of|decedent|in re:?\s*(?:the\s+)?estate of)\s+([A-Za-z][A-Za-z\s.'-]{1,60})/i;
const PR = /(?:personal representative|executor|administrator)[:\s]+([A-Za-z][A-Za-z\s.'-]{1,60})/i;
const CASE = /\b(?:estate|case|file)\s*(?:no\.?|#)?\s*([A-Z0-9-]{4,})/i;
const DEED = /\b(?:deed|instrument|lib|book)\s*(?:no\.?|#)?\s*([A-Z0-9-]{3,})/i;
const PARCEL = /\b(?:parcel|account|pin|tax\s*id|map\s*#?)\s*(?:no\.?|#|:)?\s*([A-Z0-9][\w-]{2,20})/i;
const TAX_ACCOUNT = /\b(?:tax\s*account|account\s*number)\s*(?:no\.?|#|:)?\s*([A-Z0-9][\w-]{2,20})/i;
const TRANSFER_DATE =
  /\b(?:transfer|sale|recorded|deed)\s*(?:date)?[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4})/i;
const OWNER = /(?:owner|grantor|grantee)[:\s]+([A-Za-z][A-Za-z\s.'-]{1,60})/i;
const MAILING = /\b(?:mailing|mail)\s*(?:address)?[:\s]+([^.]{10,80})/i;

export interface ExtractedRecordFields {
  propertyAddress: string | null;
  decedentName: string | null;
  personalRepresentative: string | null;
  estateCaseNumber: string | null;
  deedReference: string | null;
  parcelId: string | null;
  taxAccountId: string | null;
  transferDate: string | null;
  ownerName: string | null;
  mailingAddress: string | null;
  hasEstateSignal: boolean;
  hasPropertySignal: boolean;
  hasDeedSignal: boolean;
}

export function extractRecordFields(text: string, state: string): ExtractedRecordFields {
  const blob = text.replace(/\s+/g, " ");
  const propertyAddress = extractAddress(blob, state);
  const decedentName = blob.match(DECEDENT)?.[1]?.trim() ?? null;
  const personalRepresentative = blob.match(PR)?.[1]?.trim() ?? null;
  const estateCaseNumber = blob.match(CASE)?.[1] ?? null;
  const deedReference = blob.match(DEED)?.[1] ?? null;
  const parcelId = blob.match(PARCEL)?.[1] ?? null;
  const taxAccountId = blob.match(TAX_ACCOUNT)?.[1] ?? null;
  const transferDate = blob.match(TRANSFER_DATE)?.[1] ?? null;
  const ownerName = blob.match(OWNER)?.[1]?.trim() ?? decedentName;
  const mailingAddress = blob.match(MAILING)?.[1]?.trim() ?? null;

  const hasEstateSignal = /probate|estate|decedent|register of wills|executor|heir/i.test(blob) || Boolean(decedentName);
  const hasPropertySignal = Boolean(propertyAddress) || /real property|assessment|parcel|sdat/i.test(blob);
  const hasDeedSignal = Boolean(deedReference) || /deed|land record|instrument|transfer/i.test(blob);

  return {
    propertyAddress,
    decedentName,
    personalRepresentative,
    estateCaseNumber,
    deedReference,
    parcelId,
    taxAccountId,
    transferDate,
    ownerName,
    mailingAddress,
    hasEstateSignal,
    hasPropertySignal,
    hasDeedSignal,
  };
}

export function extractAddress(text: string, state: string): string | null {
  const match = text.match(ADDRESS_PATTERN);
  if (match) return match[0].replace(/\s+/g, " ").trim();
  const street = text.match(
    /\d{1,6}\s+[\w\s.'#-]+(?:St|Street|Ave|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Way|Ct|Court)\b/i
  );
  return street ? `${street[0].trim()}, ${state}` : null;
}

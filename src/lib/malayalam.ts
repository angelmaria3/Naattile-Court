// src/lib/malayalam.ts
// Hand-written Malayalam for standard courtroom messages, plus a last-resort verdict
// used only when the judge-verdict function cannot be reached at all.

export const UI_ML = {
  judgeLabel: 'ബഹു. ജഡ്ജി',
  complaintLabel: 'പരാതി',
  defenseLabel: 'പ്രതിയുടെ മൊഴി',
  photoDoc: 'ഫോട്ടോ / രേഖ',
  noEvidence: 'ഇതുവരെ തെളിവുകളൊന്നും സമർപ്പിച്ചിട്ടില്ല.',
  noCounterEvidence: 'പ്രതിഭാഗം ഇതുവരെ തെളിവുകളൊന്നും സമർപ്പിച്ചിട്ടില്ല.',
  noDefense: 'പ്രതി ഇതുവരെ മൊഴി നൽകിയിട്ടില്ല.',
  partyCannotVote: 'ഈ കേസിലെ കക്ഷിയായതിനാൽ നിങ്ങൾക്ക് വോട്ട് ചെയ്യാൻ കഴിയില്ല.',
  voteRecorded: '✓ നിങ്ങളുടെ വോട്ട് രേഖപ്പെടുത്തി.',
  deliberating: 'കോടതി ആലോചിക്കുന്നു...',
  waitingForVotes: 'ജൂറിയുടെ വോട്ടിനായി കാത്തിരിക്കുന്നു',
  waitingForDefense: 'പ്രതിയുടെ മൊഴിക്കായി കാത്തിരിക്കുന്നു',
  finalVerdict: 'അന്തിമ വിധി 🔨',
  // Gender-neutral on purpose: the app never asks for anyone's gender.
  guiltyBig: 'കുറ്റം തെളിഞ്ഞു!',
  notGuiltyBig: 'കുറ്റവിമുക്തം!',
  guiltyLine: 'കുറ്റം ചെയ്തതായി കോടതി കണ്ടെത്തി!',
  notGuiltyLine: 'കുറ്റം ചെയ്തിട്ടില്ലെന്ന് കോടതി വിധിച്ചു!',
  courtOpening: (code: string) =>
    `കേസ് നമ്പർ #${code}-ന്റെ വിചാരണ ആരംഭിക്കുന്നു. ഇരുകക്ഷികളും തങ്ങളുടെ വാദം കോടതിയെ അറിയിക്കട്ടെ.`,
  evidenceLabel: (byDefendant: boolean) => (byDefendant ? 'തെളിവ് (പ്രതി)' : 'തെളിവ് (വാദി)'),
}

export type FallbackVerdict = {
  verdict: 'GUILTY' | 'NOT GUILTY'
  reasoning: string
  fictional_law: string
  punishment: string
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function buildFallbackVerdict(input: {
  plaintiff: string
  defendant: string
  guiltyPct: number
}): FallbackVerdict {
  const plaintiff = input.plaintiff.trim() || 'വാദി'
  const defendant = input.defendant.trim() || 'പ്രതി'
  const guiltyPct = Math.min(100, Math.max(0, Math.round(input.guiltyPct)))
  const notGuiltyPct = 100 - guiltyPct

  if (guiltyPct >= 50) {
    return {
      verdict: 'GUILTY',
      reasoning: pickOne([
        `ഇരുഭാഗവും കേട്ടു, തെളിവുകളും നോക്കി. ജൂറിയിലെ ${guiltyPct}% പേരും ${defendant} കുറ്റം ചെയ്തെന്ന് വോട്ട് ചെയ്തു. ഇനി ഒഴിഞ്ഞുമാറാൻ നോക്കണ്ട, ഈ കോടതി അത് സമ്മതിക്കില്ല!`,
        `${plaintiff} പറഞ്ഞതിൽ കാര്യമുണ്ടെന്ന് കോടതിക്ക് ബോധ്യപ്പെട്ടു. ${defendant}-ന്റെ ന്യായീകരണം കേട്ടപ്പോൾ ചിരി വന്നെങ്കിലും ജൂറിയുടെ ${guiltyPct}% വോട്ട് അവഗണിക്കാൻ പറ്റില്ല.`,
      ]),
      fictional_law: 'വകുപ്പ് 420-പി — അനുവാദമില്ലാതെ എടുക്കൽ നിരോധന നിയമം',
      punishment: `${defendant} ${plaintiff}-നോട് മാപ്പ് പറയണം, രണ്ട് ചൂടുള്ള പൊറോട്ടയും ഒരു സ്പെഷ്യൽ ചായയും വാങ്ങിക്കൊടുക്കുകയും വേണം.`,
    }
  }

  return {
    verdict: 'NOT GUILTY',
    reasoning: pickOne([
      `ഇരുഭാഗവും വിശദമായി കേട്ടു. ${defendant} കുറ്റം ചെയ്തെന്ന് ഉറപ്പിക്കാൻ മാത്രമുള്ള തെളിവ് കോടതിക്ക് കിട്ടിയില്ല. ജൂറിയിലെ ${notGuiltyPct}% പേരും പ്രതിയുടെ ഭാഗത്താണ്.`,
      `${plaintiff}-ന്റെ വിഷമം കോടതിക്ക് മനസ്സിലായി, പക്ഷേ തെളിവ് പോരാ. ചെറിയ കാര്യം വലുതാക്കി കോടതിയിൽ കൊണ്ടുവരരുതെന്ന് ഓർമ്മിപ്പിക്കുന്നു.`,
    ]),
    fictional_law: 'വകുപ്പ് 101-സി — അനാവശ്യ വീട്ടുനാടക നിവാരണ നിയമം',
    punishment: `${plaintiff} ${defendant}-ന് ഒരു ഗ്ലാസ് തണുത്ത നാരങ്ങാവെള്ളം വാങ്ങിക്കൊടുക്കണം, ഇനി ഇത്തരം ചെറിയ കാര്യങ്ങൾ കോടതിയിൽ കൊണ്ടുവരില്ലെന്ന് വാക്ക് നൽകുകയും വേണം.`,
  }
}

// Cuts text without splitting a Malayalam letter + vowel sign / conjunct in the middle.
// (Plain .slice() can leave a dangling sign, which renders as a broken glyph.)
export function safeTruncate(text: string, maxChars: number): string {
  const segmenter = new Intl.Segmenter('ml', { granularity: 'grapheme' })
  const parts = Array.from(segmenter.segment(text), (s) => s.segment)
  if (parts.length <= maxChars) return text
  return parts.slice(0, maxChars).join('') + '…'
}
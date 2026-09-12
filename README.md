# ⚖️ Naatile Court (നാട്ടിലെ COURT)

Small cases. Big drama.

Naatile Court is a fun, interactive web app where users file silly everyday disputes — Kerala-flavored, Malayalam-English mix — and get a dramatic AI-judged verdict, complete with jury voting, witness testimony, and a punishment straight out of an imaginary law book.

Who ate the last pazhampori without asking? Who hogged the good seat? Who left you on read for three days? File the case. Let the court decide.

---

## ✨ Features

- **File a Case** — Submit a plaintiff name, category (Roommate / Family / Friends / Money / Love), and a complaint describing what happened.
- Shareable Case Code — Every case gets a unique 6-character code others can use to join the courtroom.
- Evidence & Witnesses — The plaintiff can add evidence to the case file and summon preset witness personas (Ammachi, Canteen Chettan, Auto Chettan, College Friend) for a one-line testimony.
- Jury Voting — Anyone who joins the case (other than the plaintiff) can vote GUILTY or NOT GUILTY, with a live animated percentage bar.
- AI Judge — An AI-powered "Hon. Naatile Judge" persona reviews the complaint, evidence, and jury sentiment, then delivers a structured, dramatic verdict:
  - **Verdict** (Guilty / Not Guilty)
  - **Reasoning**
  - **Fictional Law Cited** (e.g. *"Section 420-P: Unauthorized Porotta Consumption"*)
  - **Punishment** (always harmless and funny — a treat, an apology, a chaya)
- **Courtroom UI** — A wood-paneled, parchment-and-brass courtroom theme with a court proceedings feed, evidence gallery, jury panel, and a stamped verdict reveal.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Routing | React Router |
| Backend / Database | Supabase (PostgreSQL) |
| Serverless Functions | Supabase Edge Functions (Deno) |
| AI Judge | Groq API (`openai/gpt-oss-120b`) |
| Auth | Guest/anonymous sessions via local token (no login required) |
| Styling | Custom CSS (wood/parchment courtroom theme) |

---

## 🗂️ Database Schema

| Table | Purpose |
|---|---|
| `cases` | Core case record — plaintiff, defendant, category, complaint, `case_code`, `status`, `creator_token` |
| `evidence` | Evidence entries linked to a case |
| `witness_statements` | Witness name + statement, linked to a case |
| `votes` | Jury votes (`guilty` / `not_guilty`), linked to a case |

Guest identity is handled without a login system: when a case is created, a random `creator_token` is generated client-side, stored in the case row, and saved to the filer's browser via `localStorage`. This lets the app tell the plaintiff apart from jury members without requiring an account.

---

## 🧑‍⚖️ How the AI Judge Works

1. The plaintiff (or any viewer) triggers **Deliver Verdict** once evidence and jury votes are in.
2. The frontend sends the complaint, plaintiff/defendant names, evidence descriptions, and the current jury guilty-percentage to a Supabase Edge Function (`judge-verdict`).
3. The Edge Function calls the Groq API with a dramatic, Kerala-inflected judge persona prompt and requests strict structured JSON output.
4. The response — `verdict`, `reasoning`, `fictional_law`, `punishment` — is parsed defensively (with a fallback verdict if the model output doesn't parse cleanly) and returned to the frontend.
5. The courtroom UI renders the result as a stamped judgment sheet, color-coded red (Guilty) or green (Not Guilty).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Supabase project
- A Groq API key

### Setup

```bash
git clone https://github.com/angelmaria3/Naattile-Court.git
cd Naattile-Court
npm install
```

Create `src/lib/supabase.ts` with your project's Supabase URL and public anon key:

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Set your Groq API key as a Supabase Edge Function secret:

```bash
npx supabase secrets set GROQ_API_KEY=your_groq_key
```

Deploy the Edge Function:

```bash
npx supabase functions deploy judge-verdict
```

Run the app locally:

```bash
npm run dev
```

---

## 🗺️ Roadmap / What's Next

- [ ] Route evidence/witness writes through an Edge Function with `creator_token` verification (tamper-proofing beyond current UI-level checks)
- [ ] Lock down Row Level Security policies on `evidence`, `witness_statements`, and `votes`
- [ ] Real LLM-generated witness statements (currently canned personas as a placeholder)
- [ ] Defendant response / rebuttal feature
- [ ] Reputation system and leaderboard (Best Lawyer, Most Guilty, People's Judge)
- [ ] Case status phase-locking (`evidence_phase` → `jury_voting` → `verdict_given`)
- [ ] Appeals system ("Ammachi Supreme Court")
- [ ] Settlement option (resolve without a verdict)

---

## 👥 Team

Built during an 18-hour hackathon.

---

## 📜 License

For hackathon / demo purposes. Not legal advice. Pazhampori-related disputes are settled at your own risk.
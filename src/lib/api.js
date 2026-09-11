import { supabase } from './supabase';

function generateCaseCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function fileCase({ complainantName, defendantName, caseTitle }) {
  const creatorToken = crypto.randomUUID();
  const caseCode = generateCaseCode();

  const { data, error } = await supabase
    .from('cases')
    .insert({
      case_code: caseCode,
      plaintiff: complainantName,
      defendant: defendantName,
      complaint: caseTitle,
      status: 'pending',
      creator_token: creatorToken,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Remember this browser as the plaintiff for this case
  localStorage.setItem(`case_${data.case_code}_token`, creatorToken);

  return {
    code: data.case_code,
    defendant_name: data.defendant,
    ...data,
  };
}

export async function getCaseByCode(code) {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('case_code', code)
    .single();

  if (error) throw new Error('Case not found.');
  return { code: data.case_code, defendant_name: data.defendant, ...data };
}

export async function joinCase({ code, defendantJoinedName }) {
  const { data, error } = await supabase
    .from('cases')
    .update({ status: 'joined' })
    .eq('case_code', code)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { code: data.case_code, defendant_name: data.defendant, ...data };
}
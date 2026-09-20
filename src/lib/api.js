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
  const upperCode = (code || '').trim().toUpperCase();
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('case_code', upperCode)
    .single();

  if (error || !data) throw new Error('Case not found.');
  return { 
    code: data.case_code, 
    defendant_name: data.defendant, 
    complainant_name: data.plaintiff,
    case_title: data.complaint,
    ...data 
  };
}

export async function joinCase({ code, defendantJoinedName }) {
  const upperCode = (code || '').trim().toUpperCase();
  const trimmedName = (defendantJoinedName || '').trim();

  const { data: existing, error: findErr } = await supabase
    .from('cases')
    .select('*')
    .eq('case_code', upperCode)
    .single();

  if (findErr || !existing) {
    throw new Error(`No case found with code "${upperCode}". Check the code and try again.`);
  }

  const defendantToken = crypto.randomUUID();
  const { data, error } = await supabase
    .from('cases')
    .update({ 
      status: 'waiting', 
      defendant: trimmedName,
      defendant_token: defendantToken
    })
    .eq('case_code', upperCode)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Store defendant token in localStorage
  localStorage.setItem(`case_${upperCode}_defendant_token`, defendantToken);
  localStorage.setItem(`case_${upperCode}_defendant_name`, trimmedName);

  return { 
    code: data.case_code, 
    defendant_name: data.defendant, 
    complainant_name: data.plaintiff,
    case_title: data.complaint,
    ...data 
  };
}
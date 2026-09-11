import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fciltngewiorcbhaofsk.supabase.co'
const supabaseAnonKey = 'sb_publishable_obQzJtwbQ78yJ9aRBP8sLg_s-dMNd9b'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
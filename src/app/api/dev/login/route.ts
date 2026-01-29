import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Questa API è SOLO per development - bypassa l'autenticazione
export async function POST(request: NextRequest) {
  // Blocca in produzione
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Non disponibile in produzione' },
      { status: 403 }
    )
  }

  try {
    const { contattoId, email } = await request.json()

    if (!contattoId || !email) {
      return NextResponse.json(
        { error: 'contattoId e email sono richiesti' },
        { status: 400 }
      )
    }

    // Usa il service role key per creare utenti (necessario per admin operations)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        {
          error: 'SUPABASE_SERVICE_ROLE_KEY non configurata. Aggiungi questa variabile a .env.local per usare il DEV login.',
          hint: 'Puoi trovare la service role key nella dashboard di Supabase: Settings > API > service_role key'
        },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verifica che il contatto esista ed è un cliente
    const { data: contatto, error: contattoError } = await supabaseAdmin
      .from('contatti')
      .select('*')
      .eq('id', contattoId)
      .eq('tipo', 'cliente')
      .single()

    if (contattoError || !contatto) {
      return NextResponse.json(
        { error: 'Cliente non trovato' },
        { status: 404 }
      )
    }

    // Cerca se esiste già un utente auth con questa email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    let authUser = users?.find(u => u.email === email)

    if (!authUser) {
      // Crea l'utente auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-conferma email in dev
        user_metadata: {
          contatto_id: contattoId,
          nome: contatto.nome,
          cognome: contatto.cognome
        }
      })

      if (createError) {
        return NextResponse.json(
          { error: 'Errore creazione utente: ' + createError.message },
          { status: 500 }
        )
      }

      authUser = newUser.user
    }

    if (!authUser) {
      return NextResponse.json(
        { error: 'Utente non creato' },
        { status: 500 }
      )
    }

    // Verifica/crea record in utenti_portale
    const { data: existingPortaleUser } = await supabaseAdmin
      .from('utenti_portale')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single()

    if (!existingPortaleUser) {
      // Crea utente portale
      const { error: insertError } = await supabaseAdmin
        .from('utenti_portale')
        .insert({
          tenant_id: contatto.tenant_id,
          auth_user_id: authUser.id,
          contatto_id: contattoId,
          attivo: true
        })

      if (insertError) {
        return NextResponse.json(
          { error: 'Errore creazione utente portale: ' + insertError.message },
          { status: 500 }
        )
      }
    }

    // Aggiorna ultimo accesso
    await supabaseAdmin
      .from('utenti_portale')
      .update({ ultimo_accesso: new Date().toISOString() })
      .eq('auth_user_id', authUser.id)

    // Per DEV, usiamo un trucco: settiamo una password temporanea e facciamo login
    const tempPassword = `dev_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Aggiorna la password dell'utente
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { password: tempPassword }
    )

    if (updateError) {
      return NextResponse.json(
        { error: 'Errore preparazione login: ' + updateError.message },
        { status: 500 }
      )
    }

    // Ritorna email e password temporanea per il login lato client
    return NextResponse.json({
      success: true,
      email: email,
      password: tempPassword
    })

  } catch (error) {
    console.error('DEV Login error:', error)
    return NextResponse.json(
      { error: 'Errore interno' },
      { status: 500 }
    )
  }
}

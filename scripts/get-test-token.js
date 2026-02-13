import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fkounbidyaxuzzhcbpqu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrb3VuYmlkeWF4dXp6aGNicHF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjI4ODksImV4cCI6MjA4MjU5ODg4OX0.DHPDNyONxv440N9WioIn5oxisUIyrs4UUu-2nv-Oe28';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getTestToken() {
  const testEmail = 'test@tcmknowledge.com';
  const testPassword = 'TestPassword123!';

  console.log('Tentando fazer login ou criar usuário de teste...');

  // Tentar fazer login primeiro
  let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  // Se o usuário não existir, criar
  if (loginError) {
    console.log('Usuário não existe, criando...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signupError) {
      console.error('Erro ao criar usuário:', signupError);
      process.exit(1);
    }

    // Fazer login novamente
    const { data: newLoginData, error: newLoginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (newLoginError) {
      console.error('Erro ao fazer login após criar usuário:', newLoginError);
      process.exit(1);
    }

    loginData = newLoginData;
  }

  if (loginData?.session?.access_token) {
    console.log('\n✅ Token de acesso obtido com sucesso!\n');
    console.log('Adicione esta linha ao seu arquivo .env:\n');
    console.log(`TEST_USER_TOKEN=${loginData.session.access_token}`);
    console.log(`TEST_USER_ID=${loginData.user.id}`);
    console.log('\n');
    console.log('Email de teste:', testEmail);
    console.log('Senha de teste:', testPassword);
    console.log('User ID:', loginData.user.id);
    console.log('\n');
  } else {
    console.error('Erro ao obter token');
    process.exit(1);
  }
}

getTestToken().catch(console.error);

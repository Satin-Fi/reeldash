const { createClient } = require('@supabase/supabase-js');

const url = 'https://knlcmaoazqadlwrqypbo.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGNtYW9henFhZGx3cnF5cGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3OTQ0MTQsImV4cCI6MjEwMjM3MDQxNH0.D23IgSG7NcTtaiRiXQPLMlLlym4Lxvv-wnGbrzKmcx4';

async function check() {
  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.from('reels').select('*');
  console.log('Query Result:', { count: data?.length, error });
}

check().catch(console.error);

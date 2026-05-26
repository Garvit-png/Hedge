const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Warn if credentials are not provided
if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url_here') {
  console.warn('⚠️ Supabase credentials not found in .env. Please configure them. The app will return errors if a DB action is attempted.');
}

const supabase = supabaseUrl && supabaseKey && supabaseUrl !== 'your_supabase_project_url_here' 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Return all tasks
const getTasks = async () => {
  if (!supabase) throw new Error('Supabase not configured in .env');
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// Add a new task
const addTask = async (task) => {
  if (!supabase) throw new Error('Supabase not configured in .env');
  const { data, error } = await supabase.from('tasks').insert([task]).select();
  if (error) throw error;
  return data[0];
};

// Update an existing task
const updateTask = async (id, updates) => {
  if (!supabase) throw new Error('Supabase not configured in .env');
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select();
  if (error) throw error;
  return data[0];
};

// Delete a task
const deleteTask = async (id) => {
  if (!supabase) throw new Error('Supabase not configured in .env');
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
  return true;
};

module.exports = {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  isConfigured: !!supabase
};

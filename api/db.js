const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const dataFile = path.join(__dirname, 'data', 'db.json');

// Warn if credentials are not provided
if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url_here') {
  console.warn('⚠️ Supabase credentials not found in .env. Falling back to local JSON mock data.');
}

const supabase = supabaseUrl && supabaseKey && supabaseUrl !== 'your_supabase_project_url_here'
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Helper: read local JSON fallback
const readLocal = async () => {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Could not read local data file:', e.message);
    return [];
  }
};

const writeLocal = async (arr) => {
  try {
    await fs.writeFile(dataFile, JSON.stringify(arr, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.warn('Could not write local data file:', e.message);
    return false;
  }
};

// Return all tasks
const getTasks = async () => {
  if (supabase) {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
  return await readLocal();
};

// Add a new task
const addTask = async (task) => {
  if (supabase) {
    const { data, error } = await supabase.from('tasks').insert([task]).select();
    if (error) throw error;
    return data[0];
  }
  const arr = await readLocal();
  const newTask = { id: String(Date.now()), ...task };
  arr.push(newTask);
  await writeLocal(arr);
  return newTask;
};

// Update an existing task
const updateTask = async (id, updates) => {
  if (supabase) {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  }
  const arr = await readLocal();
  const idx = arr.findIndex(t => String(t.id) === String(id));
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...updates };
  await writeLocal(arr);
  return arr[idx];
};

// Delete a task
const deleteTask = async (id) => {
  if (supabase) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  const arr = await readLocal();
  const filtered = arr.filter(t => String(t.id) !== String(id));
  await writeLocal(filtered);
  return true;
};

module.exports = {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
  isConfigured: !!supabase
};

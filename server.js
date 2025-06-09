const express = require('express');
const path = require('path');
const db = require('./db'); // mysql2 connection and promise wrapper
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, '../public')));

// Fixed headmaster credentials
const HEADMASTER_USERNAME = 'smt';
const HEADMASTER_PASSWORD = 'smt';

// Headmaster login
app.post('/headmaster-login', (req, res) => {
  const { username, password } = req.body;
  if (username === HEADMASTER_USERNAME && password === HEADMASTER_PASSWORD) {
    // Redirect with query param for welcome message
    res.redirect(`/dashboard-headmaster.html?name=${encodeURIComponent("A Shivaram")}`);
  } else {
    res.send('<h3>Invalid headmaster credentials. <a href="/headmaster-login.html">Try again</a></h3>');
  }
});

// Student login
app.post('/student-login', async (req, res) => {
  const { username, password } = req.body; // username = student name, password = rollno
  try {
    const [rows] = await db.query('SELECT * FROM students WHERE name = ? AND rollno = ?', [username, password]);
    if (rows.length === 1) {
      res.redirect(`/dashboard-student.html?rollno=${rows[0].rollno}`);
    } else {
      res.send('<h3>Invalid student credentials. <a href="/student-login.html">Try again</a></h3>');
    }
  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).send('Server error');
  }
});

// Get student info (used by student dashboard JS)
app.get('/student-info', async (req, res) => {
  const { rollno } = req.query;
  if (!rollno) return res.status(400).json({ error: 'Missing roll number' });

  try {
    const [rows] = await db.query('SELECT * FROM students WHERE rollno = ?', [rollno]);
    if (rows.length === 1) {
      const student = rows[0];
      student.dob = student.dob ? student.dob.toISOString().split('T')[0] : null;
      res.json(student);
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    console.error('Get student info error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add student
app.post('/add-student', async (req, res) => {
  const { name, rollno, dob, father_name, mother_name, attendance } = req.body;
  try {
    await db.query(
      'INSERT INTO students (name, rollno, dob, father_name, mother_name, attendance) VALUES (?, ?, ?, ?, ?, ?)',
      [name, rollno, dob, father_name, mother_name, attendance]
    );
    res.send(`<h3>Student ${name} added successfully! <a href="/dashboard-headmaster.html">Add another</a> | <a href="/">Home</a></h3>`);
  } catch (err) {
    console.error('Add student error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.send(`<h3>Error: Student name or roll number already exists. <a href="/dashboard-headmaster.html">Try again</a></h3>`);
    } else {
      res.status(500).send('Server error');
    }
  }
});

// Edit student
app.post('/edit-student', async (req, res) => {
  const { id, name, rollno, dob, father_name, mother_name, attendance } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE students SET name = ?, rollno = ?, dob = ?, father_name = ?, mother_name = ?, attendance = ? WHERE id = ?',
      [name, rollno, dob, father_name, mother_name, attendance, id]
    );
    if (result.affectedRows === 1) {
      res.send(`<h3>Student ${name} updated successfully! <a href="/dashboard-headmaster.html">Back to Dashboard</a></h3>`);
    } else {
      res.send(`<h3>Student not found. <a href="/dashboard-headmaster.html">Back to Dashboard</a></h3>`);
    }
  } catch (err) {
    console.error('Edit student error:', err);
    res.status(500).send('Server error');
  }
});

// Delete student
app.delete('/student/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM students WHERE id = ?', [id]);
    if (result.affectedRows === 1) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all students
app.get('/students', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM students ORDER BY id DESC');
    const students = rows.map(s => ({
      ...s,
      dob: s.dob ? s.dob.toISOString().split('T')[0] : null
    }));
    res.json(students);
  } catch (err) {
    console.error('Get all students error:', err);
    res.status(500).json({ error: 'Server error fetching students' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

const storage = multer.diskStorage({
    destination:(req,file,cb) =>{
        cb(null,'public/images');
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname)
    }
})

const upload = multer({storage:storage});

// connecting to sql database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'webuildyou2'
});
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});


// Set up view engine
app.set('view engine', 'ejs');
// Enable static files
app.use(express.static('public'));
// Enable form processing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// Defining routes from here onwards

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/createplan', (req, res) => {
    res.render('createplan');
});

app.post('/createplan', upload.single('profileImage'), (req, res) => {
    const { name, height, weight, age } = req.body;
    const profileImage = req.file ? req.file.filename : null;

    const query = `INSERT INTO users (name, height, weight, age, profileImage) VALUES (?, ?, ?, ?, ?)`;
    connection.query(query, [name, height, weight, age, profileImage], (err, result) => {
        if (err) {
            console.error('Error inserting into database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/profile');
    });
});

app.get('/profile', (req, res) => {
    const query = 'SELECT * FROM users ORDER BY id DESC LIMIT 1';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        if (results.length > 0) {
            const user = results[0];
            res.render('profile', { user });
        } else {
            res.status(404).send('User not found');
        }
    });
});

app.post('/editprofile', upload.single('profileImage'), (req, res) => {
    const { name, height, weight, age } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    const userId  = 2; 

    const query = profileImage
        ? `UPDATE users SET name = ?, height = ?, weight = ?, age = ?, profileImage = ? WHERE id = ?`
        : `UPDATE users SET name = ?, height = ?, weight = ?, age = ? WHERE id = ?`;

    const params = profileImage
        ? [name, height, weight, age, profileImage, userId]
        : [name, height, weight, age, userId];

    connection.query(query, params, (err, result) => {
        if (err) {
            console.error('Error updating profile in database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/profile');
    });
});

app.post('/deleteprofile', (req, res) => {
    const { userId } = 2;
    const query = 'DELETE FROM users WHERE userId = ?';
    connection.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting profile from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/createplan');
    });
});



// meals pages(create, delete, update)
app.get('/meals', (req, res) => {
    const query = 'SELECT * FROM meals';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching meals from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('meals', { meals: results });
    });
});

app.get('/createmeal', (req, res) => {
    res.render('createmeals');
});

app.post('/createmeal', upload.single('image'), (req, res) => {
    const { name, description, protein, fat, carbs, calories, ingredients } = req.body;
    const image = req.file ? req.file.filename : null;

    const query = `INSERT INTO meals (name, description, protein, fat, carbs, calories, ingredients, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    connection.query(query, [name, description, protein, fat, carbs, calories, ingredients, image], (err, result) => {
        if (err) {
            console.error('Error inserting meal into database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/meals');
    });
});


app.post('/deletemeal', (req, res) => {
    const { mealId } = req.body;
    const query = 'DELETE FROM meals WHERE mealId = ?';
    connection.query(query, [mealId], (err, result) => {
        if (err) {
            console.error('Error deleting meal from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/meals');
    });
});

app.get('/editmeal/:mealId', (req, res) => {
    const { mealId } = req.params;
    const query = 'SELECT * FROM meals WHERE mealId = ?';
    connection.query(query, [mealId], (err, results) => {
        if (err) {
            console.error('Error fetching meal from database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        if (results.length > 0) {
            const meal = results[0];
            res.render('editmeal', { meal });
        } else {
            res.status(404).send('Meal not found');
        }
    });
});

app.post('/editmeal/:mealId', upload.single('image'), (req, res) => {
    const { mealId } = req.params;
    const { name, description, protein, fat, carbs, calories, ingredients } = req.body;
    const image = req.file ? req.file.filename : null;

    const query = image 
        ? `UPDATE meals SET name = ?, description = ?, protein = ?, fat = ?, carbs = ?, calories = ?, ingredients = ?, image = ? WHERE mealId = ?`
        : `UPDATE meals SET name = ?, description = ?, protein = ?, fat = ?, carbs = ?, calories = ?, ingredients = ? WHERE mealId = ?`;

    const params = image 
        ? [name, description, protein, fat, carbs, calories, ingredients, image, mealId]
        : [name, description, protein, fat, carbs, calories, ingredients, mealId];

    connection.query(query, params, (err, result) => {
        if (err) {
            console.error('Error updating meal in database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/meals');
    });
});


// Workouts 
app.get('/workouts', (req, res) => {
    const muscleGroups = [
        {
            name: 'Chest',
            exercises: [
                { name: 'Incline Bench Press', sets: 3, reps: 12 },
                { name: 'Chest Flys', sets: 3, reps: 15 },
                { name: 'Push-Ups', sets: 3, reps: 20 }
            ]
        },
        {
            name: 'Back',
            exercises: [
                { name: 'Pull-Ups', sets: 3, reps: 10 },
                { name: 'Bent-Over Rows', sets: 3, reps: 12 },
                { name: 'Lat Pulldowns', sets: 3, reps: 15 }
            ]
        },
        {
            name: 'Shoulders',
            exercises: [
                { name: 'Overhead Press', sets: 3, reps: 12 },
                { name: 'Lateral Raises', sets: 3, reps: 15 },
                { name: 'Front Raises', sets: 3, reps: 15 }
            ]
        },
        {
            name: 'Legs',
            exercises: [
                { name: 'Squats', sets: 4, reps: 12 },
                { name: 'Leg Press', sets: 4, reps: 15 },
                { name: 'Lunges', sets: 3, reps: 12 }
            ]
        },
        {
            name: 'Biceps',
            exercises: [
                { name: 'Bicep Curls', sets: 3, reps: 12 },
                { name: 'Hammer Curls', sets: 3, reps: 15 },
                { name: 'Concentration Curls', sets: 3, reps: 12 }
            ]
        },
        {
            name: 'Triceps',
            exercises: [
                { name: 'Tricep Dips', sets: 3, reps: 12 },
                { name: 'Tricep Pushdowns', sets: 3, reps: 15 },
                { name: 'Overhead Tricep Extension', sets: 3, reps: 12 }
            ]
        },
        {
            name: 'Abs',
            exercises: [
                { name: 'Crunches', sets: 3, reps: 20 },
                { name: 'Plank', sets: 3, reps: 60 },
                { name: 'Leg Raises', sets: 3, reps: 15 }
            ]
        }
    ];

    const workoutSplits = [
        {
            name: 'Push-Pull-Legs',
            description: 'Monday: Pushing movements (chest, shoulders, and triceps), Tuesday: Pulling movements (back and biceps), Wednesday: Legs, Thursday: Rest day.'
        },
        {
            name: 'Arnold Split',
            description: 'Monday: Chest and Back, Tuesday: Shoulders and Arms, Wednesday: Legs, Thursday: Repeat or Rest.'
        },
        {
            name: 'Bro Split',
            description: 'Monday: Chest, Tuesday: Back, Wednesday: Shoulders, Thursday: Arms, Friday: Legs, Saturday: Rest.'
        }
    ];

    res.render('workouts', { muscleGroups, workoutSplits });
});

app.post('/chooseworkout', (req, res) => {
    const { workout } = req.body;
    const query = `UPDATE users SET workoutPlan = ? ORDER BY id DESC LIMIT 1`;
    connection.query(query, [workout], (err, result) => {
        if (err) {
            console.error('Error updating database:', err);
            res.status(500).json({ success: false });
            return;
        }
        res.redirect('/profile');
    });
});


// contact us page
app.get('/contact', (req, res) => {
    res.render('contact');
});

app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    const query = `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`;
    connection.query(query, [name, email, message], (err, result) => {
        if (err) {
            console.error('Error inserting into database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/')
    });
});


// about us page
app.get('/about', (req, res) => {
    res.render('about');
});
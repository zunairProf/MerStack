const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./database');
const END_POINT = require('./globalContants');

// JWT Secret Key
const secretKey = 'r0omB0ok!';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.token;

    if (!token) {
        return res.status(401).json({error: 'Unauthorized: Token missing'});
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({error: 'Unauthorized: Token expired or invalid'});
        }

        req.user = decoded;
        next();
    });
};

// LOGIN API
router.post(END_POINT.LOGIN, (req, res) => {
    const {username, password} = req.body;

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({error: 'Username and password are required'});
    }

    // Check if the user exists
    const checkUserQuery = 'SELECT * FROM user WHERE username = ?';
    db.query(checkUserQuery, [username], (err, result) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).json({error: 'Error during login'});
        }

        if (result.length === 0) {
            // User not found
            return res.status(401).json({status: false, data: 'Invalid username or password'});
        }

        const storedHashedPassword = result[0].password;

        // Compare the provided password with the stored hashed password
        bcrypt.compare(password, storedHashedPassword, (err, passwordMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({status: false, data: 'Error during login'});
            }

            if (!passwordMatch) {
                // Passwords do not match
                return res.status(401).json({status: false, data: 'Invalid username or password'});
            }

            // Passwords match, generate JWT token
            const user = {id: result[0].id, username: result[0].username};
            const userId = result[0].id;
            const userRole = result[0].role;
            const token = jwt.sign({user}, secretKey, {expiresIn: '1h'});

            res.status(200).json({status: true, data: {userId, username: username, token, userRole}});
        });
    });
});

// API to create user
router.post(END_POINT.SIGN_UP, (req, res) => {
    const {username, password} = req.body;

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({status: false, error: 'Username and password are required'});
    }

    // Check if the user already exists
    const checkUserQuery = 'SELECT * FROM user WHERE username = ?';
    db.query(checkUserQuery, [username], (err, result) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).json({status: false, error: 'Error creating user'});
        }

        if (result.length > 0) {
            // User already exists
            return res.status(409).json({status: false, error: 'User already exists'});
        }

        // Hash the password using bcrypt
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({status: false, error: 'Error creating user'});
            }

            // Insert user into the database
            const insertQuery = 'INSERT INTO user (username, password, role) VALUES (?, ?, "NORMAL_USER")';
            const values = [username, hashedPassword];

            db.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('Error creating user:', err);
                    return res.status(500).json({status: false, error: 'Error creating user'});
                }

                console.log('User created successfully');
                res.status(200).json({status: true, data: 'User created successfully'});
            });
        });
    });
});

// FORGOT PASSWORD API
router.put(END_POINT.FORGOT_PASSWORD, verifyToken, async (req, res) => {
    const userId = req.params.userId;
    const {newPassword} = req.body;

    try {

        // Hash the password using bcrypt
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({status: false, error: 'Error updating user password'});
            }

            // Assuming you have a 'users' table with columns 'id' and 'password'
            const updateUserPasswordQuery = `UPDATE user SET password=? WHERE id=?`;
            const values = [hashedPassword, userId];

            db.query(updateUserPasswordQuery, values, (err, result) => {
                if (err) {
                    console.error('Error updating password:', err);
                    res.status(500).send('Error updating password');
                } else {
                    if (result.affectedRows > 0) {
                        console.log('Password updated successfully');
                        res.status(200).send({status: true, data: 'Password updated successfully'});
                    } else {
                        console.log('User not found');
                        res.status(404).send({status: true, data: 'User not found'});
                    }
                }
            });
        });
        // const hashedPassword = await bcrypt.hash(newPassword, 10);

    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Error hashing password');
    }
});

// GET ALL USER API
router.get(END_POINT.USERS, (req, res) => {
    // Fetch all users from the database
    const getUsersQuery = 'SELECT id, username, role FROM user';
    db.query(getUsersQuery, (err, data) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({error: 'Error fetching users'});
        }

        res.status(200).json({status: true, data});
    });
});

router.get(END_POINT.GET_BOOKED_ROOMS, (req, res) => {

    const sql = 'select br.id, br.user_id, br.days, br.total_amount, br.room_id, br.payment_status, user.username, br.start_date, br.end_date, room_detail.room_type from booked_rooms br join user on br.user_id = user.id join room_detail on br.room_id = room_detail.room_id';
    db.query(sql, (err, data) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({error: 'Error fetching data'});
        }

        res.status(200).json({status: true, data});
    });

});

router.put(END_POINT.APPROVE_PAYMENT, (req, res) => {
    const {userId, roomId, status} = req.body;
    const sql = 'update booked_rooms set payment_status = ? where user_id = ? and room_id = ?';

    db.query(sql, [status, userId, roomId], (err, data) => {
        if (err) {
            return res.status(500).json({error: 'Error updating record'});
        }

        res.status(200).json({status: true, data: 'Payment approved'});

    });
});

module.exports = router;
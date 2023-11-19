const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const jwt = require('jsonwebtoken');
const db = require('./database');
const END_POINT = require('./globalContants');
const {errors} = require("formidable");

// Configure Cloudinary
cloudinary.config({
    cloud_name: "dyhuht5kj",
    api_key: "637927817868136",
    api_secret: "SHWcKEFwziwWJxupOTKU8BZ7U7k",
});

// Configure Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

// JWT Secret Key
const secretKey = 'r0omB0ok!';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    console.log(token);

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

// ADD ROOM POST API
router.post(END_POINT.ADD_ROOM, verifyToken, upload.single('image'), async (req, res) => {
    console.log(new Date(), "===== Post request received =====");

    try {
        const file = req.file;
        const userId = req.params.userId;

        const {
            description, dimensions, location, contact_no, additional_person_charges,
            charge_per_unit, wifi_facility, water_facility, washing_facility,
            total_rooms, room_type
        } = req.body;

        // console.log(new Date(), " Add room request: " + req.body);

        if (!file) {
            return res.status(400).json({message: 'No file uploaded'});
        }

        // Check if username and password are provided
        if (!description || !dimensions || !location || !contact_no) {
            return res.status(400).json({status: false, error: 'Enter the required data'});
        }


        const {imageUrl, publicId} = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({resource_type: 'auto'}, (error, result) => {
                if (error) {
                    // console.error(new Date(), 'Error uploading file to Cloudinary:', error);
                    reject(error);
                } else {
                    // console.log('File uploaded successfully to Cloudinary:', result);
                    const imageUrl = result.secure_url;
                    const publicId = result.public_id;
                    resolve({imageUrl, publicId});
                }
            }).end(file.buffer);
        });

        console.log("===== Room image successfully upload to cloud ===== ");

        const ADD_ROOM_SQL = 'insert into rooms (room_img_url, room_img_public_id, description, dimensions, location, contact_no, user_id, additional_person_charges, charge_per_unit) values (?, ?, ?, ?, ?, ?, ?, ?, ?)';

        const roomId = await new Promise((resolve, reject) => {
            db.query(ADD_ROOM_SQL, [imageUrl, publicId, description, dimensions, location, contact_no, userId, additional_person_charges, charge_per_unit], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    const roomId = result.insertId;
                    resolve(roomId);
                }
            });
        });

        console.log("Room added with id: ", roomId);

        const ADD_ROOM_DETAIL_SQL = 'insert into room_detail ( wifi_facility, water_facility, washing_facility, total_rooms, room_id, room_type) values (?, ?, ?, ?, ?, ?)';

        db.query(ADD_ROOM_DETAIL_SQL, [wifi_facility, water_facility, washing_facility, total_rooms, roomId, room_type], (err, result) => {

            if (err) {
                return res.status(500).json({error: 'Error inserting data into room detail table'});
            }

            console.log("Room record added successfully");

            // db.end();

            res.status(200).json({success: true, imageUrl, publicId: publicId});

        });

        console.log("===== Room record saved in database ===== ");

    } catch (error) {
        console.log("===== Exception ===== ");
        console.error(error);
        res.status(500).send("Error writing data to mysql");
        console.log("===== Send error response =====");
    }
});

// GET ROOM POST DETAIL API
router.get(END_POINT.GET_ROOMS, (req, res) => {

    const roomDetail = req.query.roomdetail;
    console.log(roomDetail);
    console.log(new Date(), ' Get Room Detail Request =====');

    if (roomDetail != 'basic') {
        // Fetch all rooms from the database
        const qry = 'select * from rooms join room_detail rd on rooms.id = rd.room_id';
        db.query(qry, (err, data) => {
            if (err) {
                console.error('Error fetching room detail:', err);
                return res.status(500).json({error: 'No record found'});
            }

            res.status(200).json({status: true, data});
        });
    } else {
        // Fetch all rooms from the database
        const qry = 'SELECT r.user_id, r.id, rd.room_type, CASE WHEN br.room_id IS NOT NULL THEN \'Booked\' ELSE \'Available\' END AS booking_status FROM rooms r JOIN room_detail rd ON r.id = rd.room_id LEFT JOIN booked_rooms br ON r.id = br.room_id';
        db.query(qry, (err, data) => {
            if (err) {
                console.error('Error fetching room detail:', err);
                return res.status(500).json({error: 'No record found'});
            }

            res.status(200).json({status: true, data});
        });
    }
});

// GET ROOM POST DETAIL BY ID API
router.get(END_POINT.GET_ROOM_BY_ID, (req, res) => {
    // Fetch all rooms from the database
    const roomId = req.params.roomId;
    const qry = 'select * from rooms join room_detail rd on rooms.id = rd.room_id where room_id = ?';
    db.query(qry, roomId, (err, data) => {
        // if (err) {
        //     console.error('Error fetching room detail:', err);
        //     return res.status(500).json({ error: 'Error fetching room detail' });
        // }
        // res.status(200).json({ status: true, data[0] });

        if (err) {
            console.error('Error fetching post from database:', err);
            res.status(500).json({error: 'Internal Server Error'});
        } else if (data.length === 0) {
            res.status(404).json({error: 'No record found'});
        } else {
            const room = data[0];
            res.status(200).json({status: true, data: room});
        }
    });
});


// GET ROOM POST DETIAL BY USER API
router.get(END_POINT.GET_USER_ROOMS, (req, res) => {
    // Fetch all rooms from the database
    const userId = req.params.userId;
    const qry = 'select * from user join rooms on user.id = rooms.user_id where user_id = ?';
    db.query(qry, userId, (err, data) => {
        if (err) {
            console.error('Error fetching room detail:', err);
            return res.status(500).json({error: 'Error fetching room detail'});
        }
        res.status(200).json({status: true, data});
    });
});

// DELETE ROOM POST BY USER API
router.delete(END_POINT.DELETE_USER_ROOM, verifyToken, (req, res) => {
    const roomId = req.params.roomId;
    const userId = req.params.userId;

    // delete data from cloudinary
    cloudinary.uploader.destroy(roomId, (error, result) => {
        if (error) {
            console.error('Error deleting image: ', error);
        } else {
            console.log('Image deleted successfully: ', result);
        }
    });

    // Perform the delete operation in the database
    const sql = 'DELETE FROM rooms WHERE room_img_public_id = ? AND user_id = ?';

    db.query(sql, [roomId, userId], (err, result) => {
        if (err) {
            console.error('Error deleting room:', err);
            return res.status(500).json({error: 'Internal Server Error'});
        }

        if (result.affectedRows === 0) {
            // No rows were affected, meaning the post with the given ID was not found
            return res.status(404).json({error: 'Room not found'});
        }

        res.json({success: true, message: 'Room deleted successfully'});
    });
});

// UPDATE ROOM POST BY USER API
router.put(END_POINT.UPDATE_USER_ROOM, verifyToken, upload.single('image'), async (req, res) => {
    // parameters
    const file = req.file;
    const roomId = req.params.roomId;
    const userId = req.params.userId;
    let imageUrl, publicId;
    const {
        description, dimensions, location, contact_no, additional_person_charges,
        charge_per_unit, wifi_facility, water_facility, washing_facility,
        total_rooms, room_type
    } = req.body;

    // query public id to delete image from cloudinary
    const GET_CURRENT_RECORD_SQL = "select * from rooms where id=? and user_id=?";

    const result = await new Promise((resolve, reject) => {
        db.query(GET_CURRENT_RECORD_SQL, [roomId, userId], (error, result) => {
            if (error) {
                reject(error);
            } else {
                // console.log(result);
                resolve(result[0]);
            }
        });
    });

    if (result) {
        imageUrl = result.room_img_url;
        publicId = result.room_img_public_id;
    } else {
        return res.status(400).json({status: false, data: 'No record found'});
    }

    if (file) {
        // delete image from cloudinary
        cloudinary.uploader.destroy(result.room_img_public_id, (error, result) => {
            if (error) {
                console.error('Error deleting image: ', error);
            } else {
                console.log('Image deleted successfully: ', result);
            }
        });

        // upload new imag on cloudinary
        await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({resource_type: 'auto'}, (error, result) => {
                if (error) {
                    // console.error(new Date(), 'Error uploading file to Cloudinary:', error);
                    reject(error);
                } else {
                    // console.log('File uploaded successfully to Cloudinary:', result);
                    imageUrl = result.secure_url;
                    publicId = result.public_id;
                    resolve('cloud');
                }
            }).end(file.buffer);
        });
    }

    console.log("Room image successfully upload to cloud");

    // update room
    const UPDATE_ROOM_SQL = 'update rooms set room_img_url = ?, room_img_public_id = ?, description = ? , dimensions = ?, location = ?, contact_no = ?, additional_person_charges = ?, charge_per_unit = ? where id = ? and user_id = ?';

    await new Promise((resolve, reject) => {
        db.query(UPDATE_ROOM_SQL, [imageUrl, publicId, description, dimensions, location, contact_no, additional_person_charges, charge_per_unit, roomId, userId], (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve("Record updated");
            }
        });
    });

    // update room details
    const UPDATE_ROOM_DETAIL_SQL = 'update room_detail set wifi_facility = ?, water_facility = ?, washing_facility = ?, total_rooms = ?, room_type = ? where room_id = ?';

    db.query(UPDATE_ROOM_DETAIL_SQL, [wifi_facility, water_facility, washing_facility, total_rooms, roomId, room_type], (err, result) => {

        if (err) {
            return res.status(500).json({error: 'Error inserting data into room detail table'});
        }

        console.log("Room updated against with id: ", roomId);

        res.status(200).json({success: true, data: 'Record Updated Successfully!'});

    });
});


router.post('/upload', upload.array('images', 5), async (req, res) => {

    console.log(new Date(), " Post request receieved");
    const images = req.files;

    const imageUrls = [];

    try {
        for (const image of images) {
            // Upload to Cloudinary
            const {imageUrl, publicId} = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({resource_type: 'auto'}, (error, result) => {
                    if (error) {
                        // console.error(new Date(), 'Error uploading file to Cloudinary:', error);
                        reject(error);
                    } else {
                        // console.log('File uploaded successfully to Cloudinary:', result);
                        const imageUrl = result.secure_url;
                        const publicId = result.public_id;
                        resolve({imageUrl, publicId});
                    }
                }).end(image.buffer);
            });

            console.log("Image uploaded: ", imageUrl);
        }

        res.json({success: true, imageUrls});
    } catch (error) {
        console.error('Error uploading and saving images:', error);
        res.status(500).json({success: false, error: 'Internal Server Error'});
    }
});

router.post(END_POINT.BOOK_ROOM, verifyToken, async (req, res) => {

    console.log(new Date(), "Calculate room rate");
    // Assuming the request body contains 'startDate' and 'endDate' in the format 'YYYY-MM-DD'
    const {startDate, endDate} = req.body;
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    const currentDate = new Date(startDate);
    const toDate = new Date(endDate);
    if (toDate < currentDate) {
        return res.json({status: false, data: 'start date is greater from end date'})
    } else {

        if (!startDate && !endDate) {
            res.status(401).json({status: false, data: 'startDate and endDate is required!'});
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        let sql;
        // Retrieve the room rate from the database
        if (numberOfDays < 7 && numberOfDays > 0) {
            sql = 'select id, days, rent, discount, rent - (rent * (discount / 100)) as discounted_amount from room_price where days > 0 and days <= 7';
        } else if (numberOfDays < 30 && numberOfDays > 7) {
            sql = 'select id, days, rent, discount, rent - (rent * (discount / 100)) as discounted_amount from room_price where days > 7 and days <= 30';
        } else if (numberOfDays < 90 && numberOfDays > 30) {
            sql = 'select id, days, rent, discount, rent - (rent * (discount / 100)) as discounted_amount from room_price where days > 30 and days <= 90';
        } else if (numberOfDays < 190 && numberOfDays > 90) {
            sql = 'select id, days, rent, discount, rent - (rent * (discount / 100)) as discounted_amount from room_price where days > 90 and days <= 180';
        }

        console.log("Query: " + sql);

        db.query(sql, (error, result) => {
            if (error) {
                console.log(error);
            }
            const data = result[0];
            data.numberOfDays = numberOfDays;
            res.status(200).json({status: true, data})
        });
    }
});

router.post(END_POINT.ROOM_PAYMENT, async (req, res) => {

    const {userId, roomId, days, total_amount, startDate, endDate} = req.body;

    if (!userId || !roomId || !days || !total_amount) {
        return res.status(400).json({status: false, error: 'Room is not booked!'});
    }


    const sql = 'insert into booked_rooms ( user_id, days, total_amount, room_id, start_date, end_date) values (?, ?, ?, ?, ?, ?)';
    db.query(sql, [userId, days, total_amount, roomId, startDate, endDate], (err, result) => {
        if (err) {
            return res.status(404).json({status: false, data: 'Error to save record'});
        }

        res.status(200).json({status: true, data: result});
    });

});

router.get(END_POINT.CHECK_IS_ROOM_BOOKED, (req, res) => {
    const roomId = req.params.roomId;


    const sql = 'SELECT CASE WHEN COUNT(*) > 0 THEN \'Booked\' ELSE \'Available\' END AS \'Status\' FROM booked_rooms WHERE room_id = ?';
    db.query(sql, roomId, (err, result) => {
        if (err) {
            return res.status(404).json({status: false, data: 'Error to save record'});
        }

        res.status(200).json({status: true, data: result});
    });
});


router.delete(END_POINT.DELETE_ROOM_FROM_BOOKED_ROOM, verifyToken, async (req, res) => {

    const roomId = req.params.roomId;
    const startDate = req.params.startDate;
    const endDate = req.params.endDate;

    console.log('RoomId: ' + roomId);

    if (!roomId) {
        return res.status(400).json({status: false, data: 'roomId is required!'})
    }

    const sql = 'delete from booked_rooms where room_id = ? and start_date = ? and end_date = ?';

    db.query(sql, [roomId, startDate, endDate], (err, result) => {
        if (err) {
            return res.status(404).json({status: false, data: 'Error to delete record'});
        }

        res.status(200).json({status: true, data: result});
    });
})

router.get(END_POINT.GET_ROOM_RESERVED_DATES, async (req, res) => {
    console.log(new Date(), 'Get room reserved dates');

    const roomId = req.params.roomId;

    console.log("roomId: " + roomId);

    const sql = 'SELECT MIN(start_date) AS oldest_date, MAX(end_date) AS latest_date FROM booked_rooms where room_id = ?';

    db.query(sql, roomId, (err, result) => {
        if (err) {
            return res.status(404).json({status: false, data: 'Error to delete record'});
        }

        const dates = result[0];
        if (dates.oldest_date === '' || dates.oldest_date === null) {
            return res.status(200).json({status: false, data: 'Record not found!'});
        }
        res.status(200).json({status: true, data: dates});
    });

});

router.get(END_POINT.GET_LIST_OF_ROOM_DATE, async (req, res) => {
    console.log(new Date(), 'Get list of reserved room dates');

    const roomId = req.params.roomId;

    console.log("roomId: " + roomId);

    const sql = 'select start_date, end_date from booked_rooms where room_id = ?';

    db.query(sql, roomId, (err, result) => {
        if (err) {
            return res.status(404).json({status: false, data: 'Record not found!'});
        }
        res.status(200).json({status: true, data: result});
    });

})

module.exports = router;
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Define Complaint Schema
const ComplaintSchema = new mongoose.Schema({
    name: String,
    date: String,
    room: String,
    email: String,
    complaint: String,
    details: String,
});

const Complaint = mongoose.model('Complaint', ComplaintSchema);

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Submit Complaint and Send Email
async function submitComplaint() {
    const name = document.getElementById("name").value;
    const date = document.getElementById("date").value;
    const room = document.getElementById("room").value;
    const email = document.getElementById("email").value;
    const complaint = document.getElementById("complaint").value;
    const details = document.getElementById("details").value;
    const messageDiv = document.getElementById("message");

    if (!name || !date || !room || !email || !complaint || !details) {
        messageDiv.innerHTML = `<p style="color: red;">Please fill in all fields.</p>`;
        return;
    }

    const response = await fetch("http://localhost:5005/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, room, email, complaint, details })
    });

    if (response.ok) {
        messageDiv.innerHTML = `<p style="color: green;">Complaint submitted successfully!</p>`;
        document.getElementById("ticketForm").reset();
    } else {
        messageDiv.innerHTML = `<p style="color: red;">Error submitting complaint. Try again.</p>`;
    }
}

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.MANAGER_EMAIL,
            subject: `New Complaint from ${req.body.name}`,
            text: `Date: ${req.body.date}\nRoom: ${req.body.room}\nEmail: ${req.body.email}\nComplaint Type: ${req.body.complaint}\nDetails: ${req.body.details}`,
        };
        
        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: "Complaint submitted and emailed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error submitting complaint", error });
    }
});

// Generate Reports
app.get('/report', async (req, res) => {
    try {
        const complaints = await Complaint.find({});
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ message: "Error generating report", error });
    }
});

// Start Server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});
const cron = require('node-cron');

// Function to send weekly reports
async function sendWeeklyReport() {
    try {
        const complaints = await Complaint.find({});
        if (complaints.length === 0) return;

        let reportContent = complaints.map(c => 
            `Name: ${c.name}, Room: ${c.room}, Complaint: ${c.complaint}, Details: ${c.details}`
        ).join("\n\n");

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.MANAGER_EMAIL,
            subject: "Weekly Hostel Complaint Report",
            text: `Here is the complaint report for this week:\n\n${reportContent}`
        };

        await transporter.sendMail(mailOptions);
        console.log("Weekly report sent to manager.");
    } catch (error) {
        console.error("Error sending weekly report:", error);
    }
}

// Schedule the report every Sunday at 8 AM
cron.schedule('0 8 * * 0', () => {
    console.log("Sending weekly report...");
    sendWeeklyReport();
});

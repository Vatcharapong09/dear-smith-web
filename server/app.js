const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')

const app = express();

// อ่านค่าฟอร์ม
app.use(cors()) // แก้การยิงหลาย env ผ่านเครื่องตัวเอง
app.use(express.json());

// POST form
app.post('/submit', (req, res) => {
  const formData = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    birthDate: req.body.birdDate,
    gender: req.body.gender,
    address: req.body.address,
    postalCode: req.body.postalCode,
    bank: req.body.bank,
    accountNumber: req.body.accountNumber
  };

  console.log('Form Data:', formData);

  res.json({ 
    message: 'Form submitted successfully', 
    data: formData 
  });

});


// mock database (จริง ๆ ควรใช้ DB เช่น MongoDB, MySQL)
let users = []
let referrals = []

// endpoint เมื่อ user เข้ามา
app.post("/share", (req, res) => {
  const { userId, referrer } = req.body

  // บันทึก user (ถ้ายังไม่เคยบันทึก)
  if (!users.includes(userId)) {
    users.push(userId)
  }

  // ถ้ามี referrer และ referrer != user เอง
  if (referrer && referrer !== userId) {
    referrals.push({ newUser: userId, referrer: referrer })
    console.log(`🎉 ${referrer} แนะนำเพื่อน ${userId}`)
  }

  console.log('body:', req.body)

  res.json({ 
    success: true ,
    data: req.body
  })
})



app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
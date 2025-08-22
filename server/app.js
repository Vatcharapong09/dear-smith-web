const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ serve static (สำหรับไฟล์ css, js, html ฯลฯ)
app.use(express.static(path.join(__dirname, '..')));

// ✅ dynamic route สำหรับ .html
app.get('/:page', (req, res, next) => {
  const pageName = req.params.page;
  const filePath = path.join(__dirname, '..', `${pageName}.html`);

  // ถ้ามีไฟล์จริง → ส่งไฟล์กลับไป
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    next(); // ถ้าไม่มีไฟล์ → ไป middleware อื่น (หรือ 404)
  }
});

// ✅ default route → index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});


// POST form
app.post('/register', (req, res) => {
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
    success: true,
    data: req.body
  })
})

// test get Tree
app.get("/api/downline/:userId", (req, res) => {
  console.log('API IN')
  res.send(

    {
      "user_id": 1,
      "name": "Somchai Dee",
      "children": [
        {
          "user_id": 2,
          "name": "Suda Jai",
          "children": [
            {
              "user_id": 4,
              "name": "Mali Rak",
              "children": [
                {
                  "user_id": 7,
                  "name": "Narin Pet",
                  "children": []
                },
                {
                  "user_id": 8,
                  "name": "Kanya Mee",
                  "children": [
                    {
                      "user_id": 12,
                      "name": "Tida Yim",
                      "children": []
                    }
                  ]
                }
              ]
            },
            {
              "user_id": 5,
              "name": "Prasert Chai",
              "children": [
                {
                  "user_id": 9,
                  "name": "Chaiya Lek",
                  "children": []
                }
              ]
            }
          ]
        },
        {
          "user_id": 3,
          "name": "Anan Boon",
          "children": [
            {
              "user_id": 6,
              "name": "Krit Wong",
              "children": [
                {
                  "user_id": 10,
                  "name": "Somsak Jan",
                  "children": [
                    {
                      "user_id": 13,
                      "name": "Malee Orn",
                      "children": []
                    }
                  ]
                }
              ]
            },
            {
              "user_id": 11,
              "name": "Korn Jai",
              "children": []
            }
          ]
        }
      ]
    }


  )

})



app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
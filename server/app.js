const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // สำหรับ gen token
const pool = require("./db");

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


// -------------------- REGISTER API --------------------
app.post("/api/register", async (req, res) => {

  console.log(req.body)
  const {
    lineUserID,
    firstName,
    lastName,
    email,
    phoneNumber,
    birdDate,
    gender,
    address,
    postalCode,
    bank,
    accountNumber,
    referrerLineID, // <<--- เพิ่มมาจาก LIFF query param
    token
  } = req.body;

  const conn = await pool.getConnection();

  try {

    if (!lineUserID) {
      return res.status(400).json({ success: false, error: "Missing lineUserId" });
    }

    // ตรวจสอบ referrer จาก token
    let referrerId = null;
    if (token && referralCache.has(token)) {
      const refData = referralCache.get(token);
      referrerId = refData.referrerId;
      referralCache.delete(token); // ใช้แล้วลบออก (ป้องกัน reuse)
    }

    await conn.beginTransaction();

    // 1. Insert User B
    const [result] = await conn.execute(
      `INSERT INTO users 
        (line_user_id, first_name, last_name, email, phone_number, birth_date, gender, address, postal_code, bank, account_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
         first_name=VALUES(first_name), 
         last_name=VALUES(last_name),
         email=VALUES(email)`,
      [
        lineUserID,
        firstName,
        lastName,
        email,
        phoneNumber,
        birdDate,
        gender,
        address,
        postalCode,
        bank,
        accountNumber
      ]
    );

    // หา user_id ของ B
    const [rowsB] = await conn.execute(
      "SELECT user_id FROM users WHERE line_user_id = ?",
      [lineUserID]
    );
    const refereeId = rowsB[0].user_id;

    // 2. ถ้ามี referrer_line_id → insert referrals
    if (referrerId) {
      // หา user_id ของ A
      const [rowsA] = await conn.execute(
        "SELECT user_id FROM users WHERE line_user_id = ?",
        [referrerId]
      );

      if (rowsA.length > 0) {
        const referrerId = rowsA[0].user_id;

        // ตรวจสอบว่า B ยังไม่ถูกผูก referral มาก่อน
        const [check] = await conn.execute(
          "SELECT * FROM referrals WHERE referee_id = ?",
          [refereeId]
        );

        if (check.length === 0) {
          await conn.execute(
            "INSERT INTO referrals (referrer_id, referee_id) VALUES (?, ?)",
            [referrerId, refereeId]
          );
          console.log(`🎁 บันทึก referrals: ${referrerId} → ${lineUserID}`);
          console.log(`🎁 บันทึก referrals: ${rowsA[0].firstName} → ${rowsB[0].firstName}`);
        }
      }
    }

    await conn.commit();
    console.log({ success: true, userId: refereeId , message: "สมัครสมาชิกสำเร็จ"})
    res.json({ success: true, userId: refereeId , message: "สมัครสมาชิกสำเร็จ"});
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Register failed" });
  } finally {
    conn.release();
  }
});



// OA จริงของคุณ (lin.ee)
const OA_LINK = "https://lin.ee/XIMgns7";

// ตัวเก็บชั่วคราว (ควรใช้ Redis หรือ DB จริงๆ)
const referralCache = new Map();

// STEP 1: User A แชร์ลิงก์ /invite?ref=LINE_USER_ID_A
app.get('/invite', (req, res) => {
  const referrerId = req.query.ref;
  if (!referrerId) {
    console.log('Missing ref parameter (สมัครเองไม่ผ่าน ref)');
  }

  // gen token
  const token = uuidv4();

  // ถ้ามี referrerId → เก็บ mapping token -> referrerId
  if (referrerId) {
    referralCache.set(token, {
      referrerId,
      createdAt: Date.now()
    });
    console.log(`📌 Referral Cache [${token}] => ${referrerId}`);
  }

  // Redirect ไป OA (แนบ state=token ถ้ามี)
  const oaLink = referrerId
    ? `${OA_LINK}?state=${token}`
    : `${OA_LINK}`;

  console.log('OA Link : ', oaLink)
  res.redirect(oaLink);
});


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
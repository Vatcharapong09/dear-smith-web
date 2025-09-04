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
    accountNumber
  } = req.body;

  const conn = await pool.getConnection();

  try {

    if (!lineUserID) {
      return res.status(400).json({ success: false, error: "Missing lineUserId" });
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

    let referrerName = null;
    let refereeName = null;

    // หา user_id ของ B
    const [rowsB] = await conn.execute(
      "SELECT user_id FROM users WHERE line_user_id = ?",
      [lineUserID]
    );
    const refereeId = rowsB[0].user_id;
    refereeName = rowsB[0].firstName

    // 3. เช็ค pending referral ของ B
    const [pendingRows] = await conn.execute(
      "SELECT id, referrer_line_id FROM referral_pending WHERE referee_line_id IS NULL ORDER BY created_at DESC LIMIT 1"
    );

    if (pendingRows.length > 0) {
      const { id: pendingId, referrer_line_id } = pendingRows[0];

      // 3a. หา user_id ของ referrer
      const [refRows] = await conn.execute(
        "SELECT user_id FROM users WHERE line_user_id = ?",
        [referrer_line_id]
      );

      if (refRows.length > 0) {
        const referrerId = refRows[0].user_id;
        referrerName = refRows[0].firstName;

        // 3b. Insert ลง referrals (ถ้ายังไม่เคยมี)
        await conn.execute(
          "INSERT IGNORE INTO referrals (referrer_id, referee_id) VALUES (?, ?)",
          [referrerId, refereeId]
        );

        // 3c. Update pending ให้รู้ว่า B เป็น referee
        await conn.execute(
          "UPDATE referral_pending SET referee_line_id = ? WHERE id = ?",
          [lineUserID, pendingId]
        );

        console.log(`🎁 Referral confirmed: ${referrerId} → ${refereeId}`);
      }
    }

    await conn.commit();
    res.json({ 
      success: true, 
      userId: refereeId,
      referrerName: referrerName,
      refereeName: refereeName,
      message: "สมัครสมาชิกสำเร็จ" 
    });

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

// STEP 1: User A แชร์ลิงก์ /invite?ref=LINE_USER_ID_A
app.get('/invite', async (req, res) => {
  const referrerLineId = req.query.ref; // User A
  if (!referrerLineId) {
    return res.redirect(OA_LINK); // ไม่มี ref → redirect ปกติ
  }

  const conn = await pool.getConnection();
  try {
    // บันทึก pending referral (ยังไม่รู้ referee)
    await conn.execute(
      `INSERT INTO referral_pending (referrer_line_id, referee_line_id)
             VALUES (?, NULL)`,
      [referrerLineId]
    );

    console.log(`📌 Pending referral saved: ${referrerLineId} → (waiting referee)`);

  } catch (err) {
    console.error("Invite error:", err);
  } finally {
    conn.release();
  }

  // redirect ไป OA จริง
  res.redirect(OA_LINK);
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
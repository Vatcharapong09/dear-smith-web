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


// API ดึง downline tree
app.get("/api/downline/:userId", async (req, res) => {

  console.log(req.params.userId + "Get Downline")
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      `
      WITH RECURSIVE referral_tree AS (
          SELECT 
              u.user_id,
              u.first_name,
              u.last_name,
              0 AS parent_id,
              0 AS level
          FROM users u
          WHERE u.user_id = ?

          UNION ALL

          SELECT 
              u.user_id,
              u.first_name,
              u.last_name,
              r.referrer_id AS parent_id,
              rt.level + 1
          FROM referrals r
          JOIN users u ON r.referee_id = u.user_id
          JOIN referral_tree rt ON r.referrer_id = rt.user_id
      )
      SELECT * FROM referral_tree;
      `,
      [userId]
    );

    // แปลง rows → Tree JSON
    const buildTree = (nodes, parentId = 0) =>
      nodes
        .filter(n => n.parent_id === parentId)
        .map(n => ({
          user_id: n.user_id,
          name: `${n.first_name} ${n.last_name}`,
          children: buildTree(nodes, n.user_id)
        }));

    const tree = buildTree(rows, 0);
    console.log(rows[0])
    res.json(tree[0]); // root
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});



// API สร้าง Order ใหม่
app.post("/create", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { user_id, items } = req.body;
    // items = [{ product_id: 1, quantity: 2 }, ...]

    await connection.beginTransaction();

    // 1) รวมราคาสินค้า
    const [products] = await connection.query(
      "SELECT product_id, price FROM products WHERE product_id IN (?)",
      [items.map(i => i.product_id)]
    );

    let totalAmount = 0;
    items.forEach(item => {
      const p = products.find(pr => pr.product_id === item.product_id);
      totalAmount += p.price * item.quantity;
    });

    // 2) Insert orders
    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)",
      [user_id, totalAmount, "PAID"]
    );
    const orderId = orderResult.insertId;

    // 3) Insert order_items
    for (const item of items) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.product_id, item.quantity, products.find(p => p.product_id === item.product_id).price]
      );
    }

    // 4) ตรวจสอบว่า user_id มี referrer มั้ย
    const [refRow] = await connection.query(
      "SELECT referrer_id FROM referrals WHERE referee_id = ?",
      [user_id]
    );

    if (refRow.length > 0) {
      const referrerId = refRow[0].referrer_id;
      const rewardAmount = totalAmount * 0.10; // 10% ค่าคอม

      // 5) Insert ลง referral_rewards
      await connection.query(
        "INSERT INTO referral_rewards (referrer_id, referred_id, order_id, reward_amount) VALUES (?, ?, ?, ?)",
        [referrerId, user_id, orderId, rewardAmount]
      );
    }

    await connection.commit();
    res.json({ message: "Order created successfully", orderId, totalAmount });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  } finally {
    connection.release();
  }
  
  // ตัวอย่าง Order จากหน้าบ้าน
  // {
  //   user_id: 2,   // คนที่สั่งซื้อ (Downline)
  //   items: [
  //     { product_id: 1, quantity: 2 },
  //     { product_id: 3, quantity: 1 }
  //   ]
  // }

});



app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
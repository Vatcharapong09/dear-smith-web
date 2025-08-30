// const BASE_URL = 'http://localhost:3000'
const BASE_URL = 'https://dear-smith-web.onrender.com'
const OA_LINK = "https://lin.ee/XIMgns7";

const YOUR_LIFF_ID_HOMEPAGE = '2007882928-Avj6QNZW'
const YOUR_LIFF_ID_SHARE = '2007882928-a6n8BlA9'
const YOUR_LIFF_ID_REGISTER = '2007882928-VWgW2jYN'
const YOUR_LIFF_ID_DOWNLINE = '2007882928-dgJE2Kl4'

// async function main() {

//     await liff.init({ liffId: YOUR_LIFF_ID_SHARE }) //หน้าหลักก่อน Login Line

//     if (!liff.isLoggedIn()) {
//         liff.login()
//         return
//     }

//     const profile = await liff.getProfile()
//     const myUserId = profile.userId
//     console.log("My UserId:", myUserId)

//     // อ่านค่า referrer (ถ้ามี)
//     const urlParams = new URLSearchParams(window.location.search)
//     const referrerId = urlParams.get("ref") || null
//     console.log("referrerId : ", referrerId)

//     // ส่งข้อมูลเข้า backend ทุกครั้งที่มีคนเปิด
//     try {
//         await axios.post(`${BASE_URL}/share`, {
//             userId: myUserId,
//             referrerId: referrerId
//         })
//     } catch (err) {
//         console.error("Error join:", err)
//     }

//     // ปุ่มแชร์ลิงก์
//     document.getElementById("shareBtn").addEventListener("click", async () => {
//         // const shareUrl = `https://liff.line.me/${YOUR_LIFF_ID_REGISTER}?referrer=${myUserId}`
//         // const shareUrl = `https://lin.ee/XIMgns7?ref=${myUserId}`
//         const shareUrl = `${BASE_URL}/invite?ref=${myUserId}`

//         if (liff.isApiAvailable("shareTargetPicker")) {
//             await liff.shareTargetPicker([
//                 {
//                     type: "text",
//                     text: `มาลองเข้าห้อง Host ด้วยกันนะ 👉 ${shareUrl}`
//                 }
//             ])
//         } else {
//             alert("ไม่รองรับการแชร์บนอุปกรณ์นี้")
//         }
//     })
// }


async function main() {
    await liff.init({ liffId: YOUR_LIFF_ID_SHARE });

    if (!liff.isLoggedIn()) {
        liff.login();
    }

    const profile = await liff.getProfile();
    const myUserId = profile.userId; // 👉 นี่คือ User A

    document.getElementById("shareBtn").addEventListener("click", async () => {
        const inviteUrl = `${BASE_URL}/invite?ref=${myUserId}`

        try {
            await liff.shareTargetPicker([
                {
                    "type": "flex",
                    "altText": "ชวนมาเข้าห้อง Deaw Smith Shop",
                    "contents": {
                        "type": "bubble",
                        "hero": {
                            "type": "image",
                            "url": "https://cdn.pixabay.com/photo/2014/10/14/20/24/football-488714_1280.jpg",
                            "size": "full",
                            "aspectRatio": "20:13",
                            "aspectMode": "cover"
                        },
                        "body": {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "Deaw Smith Shop",
                                    "weight": "bold",
                                    "size": "xl"
                                },
                                {
                                    "type": "text",
                                    "text": "กดเพื่อเข้าห้องและรับสิทธิพิเศษ!",
                                    "size": "sm",
                                    "color": "#666666",
                                    "wrap": true
                                }
                            ]
                        },
                        "footer": {
                            "type": "box",
                            "layout": "vertical",
                            "spacing": "sm",
                            "contents": [
                                {
                                    "type": "button",
                                    "style": "primary",
                                    "action": {
                                        "type": "uri",
                                        "label": "เข้าร่วมห้อง",
                                        "uri": inviteUrl
                                    }
                                }
                            ]
                        }
                    }
                }
            ]);
        } catch (err) {
            console.error("แชร์ไม่สำเร็จ", err);
        }
    });
}

main()
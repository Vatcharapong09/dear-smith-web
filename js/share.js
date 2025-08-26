async function main() {

    const BASE_URL = 'https://dear-smith-web.onrender.com'

    const YOUR_LIFF_ID_HOMEPAGE = '2007882928-Avj6QNZW'
    const YOUR_LIFF_ID_SHARE = '2007882928-a6n8BlA9'
    const YOUR_LIFF_ID_REGISTER = '2007882928-VWgW2jYN'
    const YOUR_LIFF_ID_DOWNLINE = '2007882928-dgJE2Kl4'

    await liff.init({ liffId: YOUR_LIFF_ID })

    if (!liff.isLoggedIn()) {
        liff.login()
        return
    }

    const profile = await liff.getProfile()
    const myUserId = profile.userId
    console.log("My UserId:", myUserId)

    // อ่านค่า referrer (ถ้ามี)
    const urlParams = new URLSearchParams(window.location.search)
    const referrer = urlParams.get("referrer") || null
    console.log("UrlParams : " , urlParams)

    // ส่งข้อมูลเข้า backend ทุกครั้งที่มีคนเปิด
    try {
        await axios.post(`${BASE_URL}/share`, {
            userId: myUserId,
            referrer: referrer
        })
    } catch (err) {
        console.error("Error join:", err)
    }

    // ปุ่มแชร์ลิงก์
    document.getElementById("shareBtn").addEventListener("click", async () => {
        const shareUrl = `https://liff.line.me/${YOUR_LIFF_ID_REGISTER}?referrer=${myUserId}`

        if (liff.isApiAvailable("shareTargetPicker")) {
            await liff.shareTargetPicker([
                {
                    type: "text",
                    text: `มาลองเข้าห้อง Host ด้วยกันนะ 👉 ${shareUrl}`
                }
            ])
        } else {
            alert("ไม่รองรับการแชร์บนอุปกรณ์นี้")
        }
    })
}

main()
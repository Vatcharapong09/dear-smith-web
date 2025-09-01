// const BASE_URL = 'http://localhost:3000'
const BASE_URL = 'https://dear-smith-web.onrender.com'
const YOUR_LIFF_ID_HOMEPAGE = '2007882928-Avj6QNZW'
const YOUR_LIFF_ID_SHARE = '2007882928-a6n8BlA9'
const YOUR_LIFF_ID_REGISTER = '2007882928-VWgW2jYN'
const YOUR_LIFF_ID_DOWNLINE = '2007882928-dgJE2Kl4'

let myUserId = "";
let referrerLineId = "";

async function main() {
    // 1. Init LIFF
    await liff.init({ liffId: YOUR_LIFF_ID_REGISTER });

    // บังคับ Login
    if (!liff.isLoggedIn()) {
        liff.login()
        return
    }

    // 2. Get my LINE user profile (User B)
    const profile = await liff.getProfile();
    myUserId = profile.userId;

    // 3. Get referrer from query param
    const urlParams = new URLSearchParams(window.location.search);
    const token1 = urlParams.get("state") || null; // ถ้าไม่มี state = null

    const context = liff.getContext();
    console.log("LINE Context:", context);

    const token = context.state;  // <<=== ได้ token ตรงนี้
    console.log("Token from state:", token);
    alert("Token from state:" + token + "Token 1 : " + token1);

    console.log("My User ID:", myUserId);
    console.log("Token :", token);

    // 4. Handle form submit
    document.querySelector('.form').addEventListener('submit', async (e) => {
        e.preventDefault();

        let firstNameDOM = document.querySelector('input[name=firstName]')
        let lastNameDOM = document.querySelector('input[name=lastName]')
        let emailDOM = document.querySelector('input[name=email]')
        let phoneNumberDOM = document.querySelector('input[name=phoneNumber]')
        let birdDateDOM = document.querySelector('input[name=birdDate]')
        let genderDOM = document.querySelector('input[name=gender]:checked') || {}
        let addressDOM = document.querySelector('input[name=address]')
        let postalCodeDOM = document.querySelector('input[name=postalCode]')
        let bankDOM = document.querySelector('select[name=bank]')
        let accountNumberDOM = document.querySelector('input[name=accountNumber]')


        let userData = {
            lineUserID: myUserId,
            referrerLineID: referrerLineId,

            firstName: firstNameDOM.value,
            lastName: lastNameDOM.value,
            email: emailDOM.value,
            phoneNumber: phoneNumberDOM.value,
            birdDate: birdDateDOM.value,
            gender: genderDOM.value,
            address: addressDOM.value,
            postalCode: postalCodeDOM.value,
            bank: bankDOM.value,
            accountNumber: accountNumberDOM.value,
            token
        }

        try {
            const res = await axios.post(`${BASE_URL}/api/register`, userData, {
                headers: { "Content-Type": "application/json" }
            });
            const result = res.data;
            if (result.success) {
                alert("สมัครสมาชิกสำเร็จ!");
            } else {
                alert("สมัครไม่สำเร็จ: " + JSON.stringify(result));
            }
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
        }
    });

}


main();


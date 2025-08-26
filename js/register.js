// const BASE_URL = 'http://localhost:3000'
const BASE_URL = 'https://dear-smith-web.onrender.com'

const submitData = async () => {
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
        firstName: firstNameDOM.value,
        lastName: lastNameDOM.value,
        email: emailDOM.value,
        phoneNumber: phoneNumberDOM.value,
        birdDate: birdDateDOM.value,
        gender: genderDOM.value,
        address: addressDOM.value,
        postalCode: postalCodeDOM.value,
        bank: bankDOM.value,
        accountNumber: accountNumberDOM.value

        //Mock
        // firstName: 'วัชรพงศ์',
        // lastName: 'คงกับพันธ์',
        // email: 'deaw_baht@hotmail.com',
        // phoneNumber: '0909010457',
        // birdDate: '02-12-2525',
        // gender: 'ชาย',
        // address: 'บ้านตาลม 10 หมู่ 10',
        // postalCode: '45120',
        // bank: 'Kbank - กสิกรไทย',
        // accountNumber: '5692201215'
    }

    console.log(userData)

    // const BASE_URL = 'https://dear-smith-web.onrender.com'

    const YOUR_LIFF_ID_HOMEPAGE = '2007882928-Avj6QNZW'
    const YOUR_LIFF_ID_SHARE = '2007882928-a6n8BlA9'
    const YOUR_LIFF_ID_REGISTER = '2007882928-VWgW2jYN'
    const YOUR_LIFF_ID_DOWNLINE = '2007882928-dgJE2Kl4'
    //Login Line
    await liff.init({ liffId: YOUR_LIFF_ID_REGISTER })

    if (!liff.isLoggedIn()) {
        liff.login()
        return
    }

    const profile = await liff.getProfile()
    const myUserId = profile.userId
    // console.log("My UserId:", myUserId)

    // อ่านค่า referrer (ถ้ามี)
    const urlParams = new URLSearchParams(window.location.search)
    const referrer = urlParams.get("referrer") || null
    console.log("UrlParams : " , urlParams)

    try {
        // ส่ง POST ด้วย Axios
        const response = await axios.post(`${BASE_URL}/register?referrer=${referrer || null} `, userData, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Server response:', response.data);
        alert(  
            'Form submitted successfully!\n' +
            'คนแนะนำ Referrer  : ' + referrer + '\n' +
            'คนถูกแนะนำ MyUserId : ' + myUserId
        );
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error submitting form');
    }

}

// ใช้ตัวอย่างกับ submit form
const form = document.querySelector('.form');
form.addEventListener('submit', (e) => {
  e.preventDefault(); // ป้องกันรีเฟรชหน้า
  submitData();
});
const BASE_URL = 'http://localhost:3000'

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
    }

    console.log(userData)

    try {
        // ส่ง POST ด้วย Axios
        const response = await axios.post('http://localhost:3000/submit', userData, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('Server response:', response.data);
        alert('Form submitted successfully!');
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
// verification functions for password, username, firstname, lastname, email, phonenumber

export function verifyPassword(password) {
    // from https://stackoverflow.com/questions/26322867/how-to-validate-password-using-following-conditions
    return /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password) &&
        password.length > 7;
}

export function verifyEmail(email) {
    // from https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
    // valid email regex
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function verifyUsername(username) {
    // from https://stackoverflow.com/questions/336210/regular-expression-for-alphanumeric-and-underscores
    if (username.length < 2) {
        return false
    }
    // alphanumeric + underscore ONLY
    var re = /^[a-zA-Z0-9_]+/;
    return re.test(username)
}

export function verifyFirstname(firstname) {
    // from https://stackoverflow.com/questions/336210/regular-expression-for-alphanumeric-and-underscores
    if (firstname.length < 2) {
        return false
    }
    // alpha only (sorry musk's child)
    var re = /^[a-zA-Z]+/;
    return re.test(firstname)
}

export function verifyLastname(lastname) {
    // from https://stackoverflow.com/questions/336210/regular-expression-for-alphanumeric-and-underscores
    if (lastname.length < 2) {
        return false
    }
    // alpha only (sorry musk's child)
    var re = /^[a-zA-Z]+/;
    return re.test(lastname)
}

export function verifyPhonenumber(phoneNumber) {
    // from https://stackoverflow.com/questions/4338267/validate-phone-number-with-javascript
    var phoneNum = phoneNumber.replace(/[^\d]/g, '');
    if (phoneNum.length > 6 && phoneNum.length < 11) { return true; }
}

export function verifyRole(role) {
    // from https://stackoverflow.com/questions/4338267/validate-phone-number-with-javascript
    return (role==="ADMIN" || role==="USER")
}


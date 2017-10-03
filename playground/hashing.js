const {SHA256} = require('crypto-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

var password = '123abc';

bcrypt.genSalt(10 , (err , salt) => {
    bcrypt.hash(password , salt , (err , hash) => {
        console.log(hash);
    });
});

var hashedPass = '$2a$10$A8s2IfDt7fAbyP/EmeNI6esOPp4kJ9kMyMicetYhKABwOAkMlEzQC';

bcrypt.compare(password , hashedPass , (err , res) => {
    console.log(res);
});


//var data = {
//    id: '10'
//};
//
//var token = jwt.sign(data , 'abc123');
//console.log(token);
//
//var decoded = jwt.verify(token , 'abc123');
//console.log('decoded: ' , decoded);


//var message = "I am user number 3"
//var hash = SHA256(message).toString();
//
//console.log(`Message: ${message}`);
//console.log(`Hash: ${hash}`);
//
//var data = {
//    id: 4
//};
//
//var token = {
//    data,
//    hash: SHA256(JSON.stringify(data) + 'somesecret').toString()
//}
//
//var resultHash = SHA256(JSON.stringify(token.data) + 'somesecret').toString();
//
////token.data.id = 5;
////token.hash = SHA256(JSON.stringify(token.data)).toString();
//
//if (resultHash === token.hash) {
//    console.log('data was not changed');
//}
//else {
//    console.log("data was changed")
//}










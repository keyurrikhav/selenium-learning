const loginData = {

    validUser: {
        username: 'tomsmith',
        password: 'SuperSecretPassword!'
    },

    invalidPassword: {
        username: 'tomsmith',
        password: 'wrongpassword'
    },

    invalidUsername: {
        username: 'wronguser',
        password: 'SuperSecretPassword!'
    }

};

module.exports = loginData;
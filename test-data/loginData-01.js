const loginData = [

    {
        testName: "Valid Login",
        username: "tomsmith",
        password: "SuperSecretPassword!",
        expected: "Secure Area"
    },

    {
        testName: "Invalid Password",
        username: "tomsmith",
        password: "wrongpassword",
        expected: "Login Page"
    },

    {
        testName: "Invalid Username",
        username: "wronguser",
        password: "SuperSecretPassword!",
        expected: "Login Page"
    }

];

module.exports = loginData;
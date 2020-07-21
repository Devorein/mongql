module.exports = {
	isAlphaNumericOnly: function (input) {
		const letterNumberRegex = /^([0-9a-z]|_|\.)+$/;
		if (input.match(letterNumberRegex)) return true;
		return false;
	},
	isStrongPassword: function (input) {
		const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
		return regex.test(input);
	}
};

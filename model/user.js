const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
	{
		customer_xid: { type: String, required: true, unique: true },
		balance: {type: Number, required: true},
		status: {type: String, required: true}
	},
	{ collection: 'customer_xid' }
)

const model = mongoose.model('UserSchema', UserSchema)

module.exports = model

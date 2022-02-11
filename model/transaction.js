const mongoose = require('mongoose')

const Transchema = new mongoose.Schema(
	{
		reference_id: { type: String, required: true, unique: true },
		customer_xid: { type: String, required: true},
		amount: {type: Number, required: true},
	},
	{ collection: 'Transactions' }
)

const model = mongoose.model('Transchema', Transchema)

module.exports = model

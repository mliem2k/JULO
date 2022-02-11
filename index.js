const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const path = require('path')
const bodyParser = require('body-parser')
const express = require('express')
const multer  = require('multer')
const mongoose = require('mongoose')
const User = require('./model/user')
const Transaction = require('./model/transaction')
const JWT_SECRET = process.env.TOKEN_SECRET || 'SECRET'
var upload = multer();
// get config vars
dotenv.config();

mongoose.connect('mongodb+srv://API_TEST:ASDFGH123@apitest.em6y2.mongodb.net/APITEST?retryWrites=true&w=majority', {
	useNewUrlParser: true,	
	useUnifiedTopology: true,
})

const app = express()
app.use('/', express.static(path.join(__dirname, 'static')))
app.use(bodyParser.json())
app.use(upload.array()); 
app.use(express.static('public'));
// access config var
require('crypto').randomBytes(64).toString('hex')
var db = mongoose.connection;
  app.post('/api/v1/init', async (req, res) => {

    
    // ...
    const { customer_xid } = req.body
    if (!customer_xid) {
		return res.json({
            "data": {
              "error": {
                "customer_xid": [
                  "Missing data for required field."
                ]
              }
            },
            "status": "fail"
          })
	}
    const token = jwt.sign(
        {
            customer_xid
        },
        JWT_SECRET,{ expiresIn: '1800s' }
    )

let init_bal = 0
	try {
		const response = await User.create({
			customer_xid,
            balance: init_bal,
            status : "disabled"
		})
		console.log('User created successfully: ', response)
	} catch (error) {
		if (error.code === 11000) {
			// duplicate key
			/* return res.json({ status: 'error', error: 'an account using this customer_xid has already been created' }) */
            return res.json({'data':{'token': token}, status: 'success'})
		}
		throw error
	}
    return res.json({'data':{'token': token}, status: 'success'})
  
    // ...
  });
  app.post('/api/v1/wallet', validateToken, async (req, res) => {
    const { customer_xid } = req.user
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    let date_ob = new Date();
    var find_bal = await db.collection('customer_xid').find({ "customer_xid": customer_xid}).toArray();
    var bal_now =  find_bal[0].balance
    await User.updateOne({
      status : "enabled"}
    ).where("customer_xid").eq(customer_xid)
return res.json({
    "status": "success",
    "data": {
      "wallet": {
        "id": token,
        "owned_by": customer_xid,
        "status": "enabled",
        "enabled_at": date_ob,
        "balance": bal_now
      }
    }
  })
});
app.get('/api/v1/wallet', validateToken, async (req, res) => {
    const { customer_xid } = req.user
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    let date_ob = new Date();
    var find_bal = await db.collection('customer_xid').find({ "customer_xid": customer_xid}).toArray();
    var bal_now =  find_bal[0].balance
    if(find_bal[0].status == "disabled"){
        return res.json({    "status": "fail",
        "data": {
            "error": "Disabled"
        }})
    }
return res.json({
    "status": "success",
    "data": {
      "wallet": {
        "id": token,
        "owned_by": customer_xid,
        "status": "enabled",
        "enabled_at": date_ob,
        "balance": bal_now
      }
    }
  })
});
app.post('/api/v1/wallet/deposits', validateToken, async (req, res) => {
    const { amount, reference_id } = req.body
    const { customer_xid } = req.user
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    let date_ob = new Date();
    var find_bal = await db.collection('customer_xid').find({ "customer_xid": customer_xid}).toArray();
    var bal_now =  find_bal[0].balance
    var amount_now = parseFloat(bal_now)+parseFloat(amount)
/*     console.log(parseFloat(amount)) */
    await User.updateOne({
        balance : amount_now}
      ).where("customer_xid").eq(customer_xid)
    try {
		const response =     await Transaction.create({
            reference_id,
            customer_xid,
            amount: amount
        })
		console.log('User created successfully: ', response)
	} catch (error) {
		if (error.code === 11000) {
			// duplicate key
			/* return res.json({ status: 'error', error: 'an account using this customer_xid has already been created' }) */
		}
		throw error
	}
    return res.json({
        "status": "success",
        "data": {
          "deposit": {
            "id": token,
            "deposited_by": customer_xid,
            "status": "success",
            "deposited_at": date_ob,
            "amount": amount,
            "reference_id": reference_id
          }
        }
    })
});
app.post('/api/v1/wallet/withdrawals', validateToken, async (req, res) => {
    const { amount, reference_id } = req.body
    const { customer_xid } = req.user
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    let date_ob = new Date();
    var find_bal = await db.collection('customer_xid').find({ "customer_xid": customer_xid}).toArray();
    var bal_now =  find_bal[0].balance
    var amount_now = parseFloat(bal_now)-parseFloat(amount)
    var withdraw_amount = "-"+amount
 /*    console.log(parseFloat(amount)) */
    await User.updateOne({
        balance : amount_now}
      ).where("customer_xid").eq(customer_xid)
    try {
		const response =     await Transaction.create({
            reference_id,
            customer_xid,
            amount: withdraw_amount
        })
		console.log('User created successfully: ', response)
	} catch (error) {
		if (error.code === 11000) {
			// duplicate key
			/* return res.json({ status: 'error', error: 'an account using this customer_xid has already been created' }) */
		}
		throw error
	}
    return res.json({    "status": "success",
    "data": {
        "withdrawal": {
            "id": token,
            "withdrawn_by": customer_xid,
            "status": "success",
            "withdrawn_at": date_ob,
            "amount": amount,
            "reference_id": reference_id
        }
    }
    })
});
app.patch('/api/v1/wallet', validateToken, async (req, res) => {
    const { is_disabled } = req.body
    const { customer_xid } = req.user
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    let date_ob = new Date();
    var find_bal = await db.collection('customer_xid').find({ "customer_xid": customer_xid}).toArray();
    var bal_now =  find_bal[0].balance
    if(is_disabled=='true'){
    await User.updateOne({
      status : "disabled"}
    ).where("customer_xid").eq(customer_xid)
return res.json({  "status": "success",
"data": {
  "wallet": {
    "id": token,
    "owned_by": customer_xid,
    "status": "disabled",
    "disabled_at": date_ob,
    "balance": bal_now
  }
}
  })}
});
function validateToken(req, res, next) {
  
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
  if (token == null)
        res.sendStatus(400).send("Token not present");
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            res.status(403).send("Token invalid");
        }
        else {
            req.user = user;
            next(); 
        }
    });
} 
  app.listen(3000, () => {
    console.log(`Server up at 3000`)
  });
  
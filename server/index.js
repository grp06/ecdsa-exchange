const secp = require('@noble/secp256k1')
const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {
  "1": 100,
  "2": 50,
  "3": 75,
}


app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {sender, recipient, amount, privateKey} = req.body;

  try {
    let allegedSender = secp.getPublicKey(privateKey);
    allegedSender = Buffer.from(allegedSender).toString('hex');
    allegedSender = "0x" + allegedSender.slice(allegedSender.length - 40); 
  
    if (sender === allegedSender) {
      console.log('private key is good');
      balances[sender] -= amount;
      balances[recipient] = (balances[recipient] || 0) + Number(amount);
      return res.send({ balance: balances[sender], isValidPrivateKey: true });
    }
  
  
  
    return res.send({ balance: balances[sender], isValidPrivateKey: false });
  } catch(error) {
    return res.send({ balance: balances[sender], isValidPrivateKey: false });
  }
  
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
  const balancesArr = [];
  for (let key in balances) {
    // generate private key and convert it to hex
    let newPrivateKey = secp.utils.randomPrivateKey();
    newPrivateKey = Buffer.from(newPrivateKey).toString('hex');

    // use above private key to derive public key
    // then turn it to hex and slice off last 40 characters
    let newPublicKey = secp.getPublicKey(newPrivateKey);
    newPublicKey = Buffer.from(newPublicKey).toString('hex');
    newPublicKey = "0x" + newPublicKey.slice(newPublicKey.length - 40);    
    balances[newPublicKey] = balances[key]
    balancesArr.push([newPublicKey, newPrivateKey, balances[key]])
    delete balances[key]
    
  }
  let finalString = `Available Accounts
==============================
`
  balancesArr.forEach((item, idx) => {
    finalString += `(${idx}) - ${item[0]} (${item[2]})
`    
  })
  finalString += `
Private Keys
==============================
`


balancesArr.forEach((item, idx) => {
  finalString += `(${idx}) - ${item[1]}
`    
})
  console.log(finalString);
});

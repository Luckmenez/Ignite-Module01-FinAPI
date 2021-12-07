const { response, request } = require("express");
const express = require("express");
const { v4: uuidv4 }  = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

function verifyIfAccountExistsCPF(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if(!customer){
    return res.status(400).json({ error: "Customer Not Found" });
  }

  request.customer = customer;

  return next();
};

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit'){
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
};

app.post("/account", (req, res) => {
  const { cpf, name } = req.body;
  
  const customerAlreadyExist = customers.some( customer => customer.cpf === cpf);
  
  if(customerAlreadyExist){
    return res.status(400).json({error: "Customer Already Exists"})
  }
  
  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement:[],
  });
  
  return res.status(201).send({customersList: customers});
});

//app.use(verifyIfAccountExistsCPF);

app.get("/statement", verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = req;

  return res.json(customer.statement);
});

app.post("/deposit", verifyIfAccountExistsCPF, (req, res) => {
  const { description, amount } = req.body;
  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type:"credit",
  }

  customer.statement.push(statementOperation);

  res.json({customer});
})

app.post("/withdraw",verifyIfAccountExistsCPF, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if(balance < amount){
    return res.status(400).json({error: "Insufficient Funds"});
  }

  const statementOperation = {
    description:"Withdraw Operation",
    amount,
    created_at: new Date(),
    type:"debit",
  }

  customer.statement.push(statementOperation);

  return res.status(201).json(customer);

})
app.get("/balance", verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.status(201).json({balance});

})

app.get("/statement/date", verifyIfAccountExistsCPF, (req, res) => {
  const { date } = req.query;
  const { customer } = req;

  const dateFormat = new Date(date + " 00:00");
  console.log(dateFormat);
  console.log(dateFormat.toDateString());

  const statement = customer.statement.filter((statement) => 
    statement.created_at.toDateString() === 
    new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

app.put("/account", verifyIfAccountExistsCPF, (req, res) =>{
  const { name } = req.body;
  const { customer } = req;
  console.log(customer);

  customer.name = name;

  return res.status(201).send();
});

app.get("/account", verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = req;
  return res.json(customer);
})

app.delete("/account", verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = req;
  customers.splice(customer, 1);

  return res.status(200).json(customers);
})



app.listen(3333);
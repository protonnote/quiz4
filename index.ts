import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, query, validationResult } from 'express-validator'
import fs from 'fs'
import { lstat } from 'fs'
import { header } from 'express-validator'
import { param } from 'express-validator'

const app = express()
app.use(bodyParser.json())
app.use(cors())

const PORT = process.env.PORT || 4000
const SECRET = "SIMPLE_SECRET"

interface DbSchema {
  users: User[]
}

interface User {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  balance: number
}

interface JWTPayload {
  username: string;
  password: string;
}

const readDbFile = (): DbSchema => {
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  return db
}


app.post('/login',
   (req, res) => {
    const { username, password } = req.body
    const db = readDbFile()
    const user = db.users.find((data : any) => data.username === username)
    if (!user) {
      res.status(400)
      res.json({ message: 'Invalid username or password' })
      return
    }
    if (!bcrypt.compareSync(password, user.password)) {
      res.status(400)
      res.json({ message: 'Invalid username or password' })
      return
    }
    const token = jwt.sign({username: user.username,password: user.password } as JWTPayload , SECRET)
    return res.status(200).json({ message:"Login successfully", token})
  })

app.post('/register',
   (req, res) => {
    const { username, password, firstname, lastname, balance } = req.body
    
    const db = readDbFile()
    if(db.users.find((data : any) => data.username === username )) {
      res.status(400).json({message:"Username is already in used"}) 
      return
    }
      const hashPassword = bcrypt.hashSync(password, 10)
      db.users.push({
        username,
        password : hashPassword,
        firstname,
        lastname,
        balance,
      })
      fs.writeFileSync('db.json', JSON.stringify(db))
      res.status(200).json({ message: "Register successfully" })
      return 
  })

app.get('/balance',
  (req, res) => {
    const token = req.query.token as string
    // return res.status(200).json({message:"walll"})
    
    try {
      const { username } = jwt.verify(token, SECRET) as JWTPayload
      const db = readDbFile()
      const user = db.users.find((data : any) => data.username === username)
      if(user){
        res.status(200).json({
          name : user.firstname + " " + user.lastname,
          balance: user.balance})
        return
      }
      
    }
    catch (e) {
      //response in case of invalid token
      return res.status(401).json({ message: "Invalid token" })
    }
  })

  app.post('/deposit',
  body('amount').isInt({ min: 1 }),
  header('token'),
  (req, res) => {
    const token = req.headers.authorization
    const {amount} = req.body
    if (!token) {
      res.status(401).json({ message: 'Invalid token'})
      return
    }
    try {
      const username = jwt.verify(token.split(" ")[0], SECRET) as JWTPayload
      const db = readDbFile()
       const user = db.users.find((data:any) => data.username === username  )
       if(user){
         res.status(200).json({balance : user.balance})
          return
       } 
    }
    catch(err){
      res.status(401).json({ message: 'Invalid token'})
      return
    }
    //Is amount <= 0 ?
    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data" })
  
    })

app.post('/withdraw',
  (req, res) => {
    
  })

app.delete('/reset', (req, res) => {

  //code your database reset here
  const db = readDbFile()
  
  db.users = []
  fs.writeFileSync('db.json', JSON.stringify(db))

  return res.status(200).json({
    message: 'Reset database successfully'
  })
})


app.get('/me', (req, res) => {
  return res.status(200).json({
    "firstname": "Naruson",
    "lastname" : "Kanchina",
    "code" : 620612153,
    "gpa" : 4.00})
})


app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))
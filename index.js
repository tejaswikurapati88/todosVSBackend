const express= require('express')
const {open}= require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const cors = require('cors')
const app= express()
const jwt = require('jsonwebtoken')
const port= process.env.port || 3000

const dbPath= path.join(__dirname, 'todo.db')
app.use(express.json())
app.use(cors())
let db=null 

const initializationDb = async ()=>{
    try{
        db = await open( {
            filename: dbPath,
            driver: sqlite3.Database
        })
        app.listen(port, ()=>{
            console.log(`Server is Running at http://localhost:${port}`)
        })
    }catch (e){
        console.log(`Server Error : ${e.message} `)
        process.exit(1)
    }
}

initializationDb()



app.post('/api/signin', async (request, response)=>{
    const userData= request.body
    const {name, username, password, age, gender}= userData 
    const hashedPass = await bcrypt.hash(password, 10)
    const sqluserQuery =  `
    select * from users where username= '${username}';
    `
    const user= await db.get(sqluserQuery)
    if (user === undefined){
        const sqlQuery =`
        INSERT INTO users (name, username, password, age, gender)
        VALUES ('${name}', '${username}', '${hashedPass}', '${age}', '${gender}');
        `
        await db.run(sqlQuery)
        response.send('user added successfully')
    }else{
        response.status(400)
        response.send('username already exist, please login')
    }
    
})

app.post('/api/login', async (req, res)=>{
    const userloginDetails= req.body 
    const {username, password}= userloginDetails 
    const selectuserQ = `select * from users where username= '${username}'`
    const userDet = await db.get(selectuserQ)
    if (userDet=== undefined){
        res.status(400)
        res.send("Invalid User")
    }else{
        const pass = await bcrypt.compare(password, userDet.password)
        if (pass){
            const payload={
                username: username
            }
            const jwtToken = jwt.sign(payload, 'MY_SECRETE_TOKEN');
            res.send({jwtToken})
        }else{
            res.status(400)
            res.send('invalid password' )
        }
    }
})

app.get('/api/users', async (req, res)=>{
    const getUserQuery =`
    select * from users;
    `
    const users = await db.all(getUserQuery)
    res.send(users)
})

app.get('/api/todos', async (request, response)=>{
    const sqlQuery=`
    select * from todos 
    `
    const data= await db.all(sqlQuery)
    response.send(data)
})

app.post('/api/todos', async (request, response)=>{
    //ADD TODO 
    
        const dataDetails = request.body
        const {id, task, status} = dataDetails
        const postQuery = `
        INSERT INTO todos (id, task, status)
        values ('${id}', '${task}', '${status}');`
        await db.run(postQuery)
        response.send('Todo Successfully Added')
      
})

app.put('/api/todos/:id', async (req, res)=>{
    // UPDATE task
    const {id}= req.params 
    const dataDetails= req.body 
    const {task}= dataDetails
    const putQuery= `
      update todos 
      set task= '${task}'
      where id= ${id};
    `
    await db.run(putQuery)
    res.send('Task updated successfully')
})

app.put('/api/todos/status/:id', async (req, res)=>{
    //Update status
    const {id}= req.params 
    const data= req.body 
    const {status}= data 
    const updateStatusQ= `
      update todos 
      set status = '${status}'
      where id=${id}
    `
    await db.run(updateStatusQ)
    res.send('status changed')
})

app.delete('/api/todos/:id', async (req, res)=>{
    // DELETE TODO
    const {id}= req.params
    const sqlDeleteQuery= `
      delete from todos where id= ${id};
    `
    await db.run(sqlDeleteQuery)
    res.send('Task Deleted Successfully')
})

module.exports= app 

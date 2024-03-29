const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User = mongoose.model("User")
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {JWT_SECRET, SENDGRID_KEY} = require('../config/keys')
const requiredLogin = require('../middleware/requireLogin')
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')
const crypto = require('crypto')

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: SENDGRID_KEY
    }
}))

router.post('/signup', (req, res)=>{
    const {name, email, password, pic} = req.body
    
    if (!email || !password || !name) {
        return res.status(422).json({error:"Please add all the fields"})
    }

    User.findOne({email:email})
        .then((savedUser)=>{
            if (savedUser) {
                return res.status(422).json({error:"user already exists with that email"})
            }
            
            bcrypt.hash(password, 12)
                .then(hashedpassword=>{
                    const user = new User({
                        email,
                        password:hashedpassword,
                        name,
                        pic
                    })
        
                    user.save()
                        .then(user => {
                            transporter.sendMail({
                                to: user.email,
                                from: "testprofile3155@gmail.com",
                                subject: "Signup Success",
                                html: "<h1>Welcome to the Udemy Instagram clone!</h1>"
                            })
                            res.json({message:"saved successfully"})
                        })
                        .catch(err=>{
                            console.log(err)
                        })
                })
        })
        .catch(err=>{
            console.log(err)
        })

})

router.post('/login', (req, res)=>{
    const {email, password} = req.body

    if (!email || !password) {
        res.status(422).json({error:"please provide an email and password"})
    }

    User.findOne({email:email})
        .then(savedUser=>{
            // Check for if there's not a user with this email
            if (!savedUser) {
                return res.status(422).json({error:"Invalid email or password"})
            }

            bcrypt.compare(password, savedUser.password)
                .then(match=>{
                    // If the passwords match
                    if (match) {
                        const token = jwt.sign({_id:savedUser._id}, JWT_SECRET)
                        const {_id, name, email, followers, following, pic} = savedUser
                        res.json({token, user:{_id, name, email, followers, following, pic}})
                    }
                    else {
                        return res.status(422).json({error:"Invalid password"})
                    }
                })
                .catch(err=>{
                    console.log(err)
                })
        })
})

router.get('/protected', requiredLogin, (req, res)=>{
    res.send("hello user")
})

router.post('/reset-password', (req, res) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err)
        }

        const token = buffer.toString('hex')
        User.findOne({ email: req.body.email })
        .then(function (user) {
                if (!user) {
                    return res.status(422).json({ error: "That email didn't match any of our records." })
                }

                user.resetToken = token
                user.expireToken = Date.now() + 3600000
                user.save().then((result) => {
                    transporter.sendMail({
                        to: user.email,
                        from: "no-replay@insta.com",
                        subject: "Password Reset",
                        html: `
                        <p>You have requested to reset your password.</p>
                        <h5><a href="http://localhost:3000/reset/${token}">Click to Reset</a></h5>
                        `
                    })

                    res.json({message: "Password reset email has been sent."})
                })
            })
    })
})

router.post('/new-password', (req, res) => {
    const newPassword = req.body.password
    const userToken = req.body.token

    User.findOne({ 
        resetToken: userToken,
        expireToken: { $gt: Date.now() }
    })
    .then((user) => {
        if (!user) {
            return res.status(422).json({ error: "Try again, session expired." })
        }

        bcrypt.hash(newPassword, 12)
            .then(hashedPassword => {
                user.password = hashedPassword
                user.resetToken = undefined
                user.expireToken = undefined
                user.save().then((savedUser) => {
                    res.json({message: "Passwork successfully updated."})
                })
            })
    })
    .catch(err => {
        console.log(err)
    })
})

module.exports = router
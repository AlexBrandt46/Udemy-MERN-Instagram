import React, {useState} from "react"
import {useNavigate} from 'react-router-dom'
import M from 'materialize-css'

const Reset = ()=>{

    const navigate = useNavigate()
    const [email, setEmail] = useState("")

    const PostData = () => {
        
        if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
            M.toast({html: "Invalid Email", classes: "#c62828 red darken-3"})
            return
        }
        else {
            fetch("/reset-password", 
            {
                method: "post",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email
                })
            }).then(res=>res.json())
            .then(data=>{
                if (data.error) {
                    M.toast({html: data.error, classes: "#c62828 red darken-3"})
                } 
                else {                    
                    M.toast({html: data.message, classes: "#43a047 green darken-1"})
                    navigate('/login')
                }
            }).catch(err=>{
                console.log(err)
            })
        }
    }

    return (
        <div className="mycard">
            <div className="card auth-card input-field">
                <h2>Instagram</h2>
                <input 
                    type="text" 
                    placeholder="email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)} />
                <button className="btn waves-effect waves-light #64b5f6 blue darken-1" onClick={PostData}>Reset Password</button>
            </div>
        </div>
    )
}

export default Reset
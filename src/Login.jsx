import {useState} from "react";
import {API_URL, fetchWithTimeout, waitForServer} from "./api";
function Login({onLogin, sessionExpired}){
    const [username, setUsername] = useState("");
    const[password, setPassword] = useState("");
    const[error, setError] = useState("");
    const[info, setInfo] = useState("");
    const[loading, setLoading] = useState(false);

    const handleLogin = async(e) => {
        e.preventDefault();
        if(loading){
            return;
        }
        setError("");
        setInfo("");
        setLoading(true);
        try{
            const serverReady = await waitForServer(() =>
                setInfo("Server is waking up, this can take up to a minute. Please wait...")
            );
            if(!serverReady){
                setInfo("");
                setError("Server is not responding right now. Please try again in a minute.");
                return;
            }
            setInfo("");
            const response = await fetchWithTimeout(`${API_URL}/login`,{
                method: "POST",
                headers: {"Content-Type": "application/json",},
                credentials: "include",
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            }, 30000);
            if(response.ok){
                const data = await response.json();
                onLogin(data.username);
            }else if(response.status === 401){
                setError("Invalid username or password");
            }else{
                setError("Server error. Please try again.");
            }
        }
        catch{
            setError("Unable to connect to server. Please try again.");
        }
        finally{
            setLoading(false);
        }
    };
    return(
        <div className="login-container">
            <div className="circle-top"></div>
            <div className="circle-bottom"></div>
            <div className="login-content">
                <div className="login-brand">
                    <div className="graduation-icon">🎓</div>
                    <h1>Student Data Management System</h1>
                    <p>Manage&nbsp; | &nbsp;Track&nbsp; | &nbsp;Empower Students</p>
                </div>
            <div className="login-card">
                <h1>ADMIN LOGIN</h1>
                {sessionExpired && (
                    <p className="session-expired-message">
                        ⚠️ You have been signed out. Please login again.
                    </p>
                )}
                <form onSubmit={handleLogin}>
                    <div className="login-input-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e)=>setUsername(e.target.value)}
                            placeholder="Enter username" required/>
                    </div>
                    <div className="login-input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}
                            placeholder="Enter password" required/>
                    </div>
                    {info && (<p className="login-info">{info}</p>)}
                    {error && (<p className="login-error">{error}</p>)}
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? "Please wait..." : "Login"}</button>
                </form>
                <div className="secure-access">
                    <span></span>
                    <p>🔒 &nbsp;Secure Access</p>
                    <span></span>
                </div>
            </div>
            </div>
        </div>
    );
}
export default Login;
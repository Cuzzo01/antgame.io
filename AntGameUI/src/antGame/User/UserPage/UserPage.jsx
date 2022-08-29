import { useEffect, useState } from "react"
import { GetUserDetails } from "../UserService";

export const UserPage = ({username}) => {
    const [userDetails, setUserDetails] = useState(false);

    useEffect(() => {
        GetUserDetails(username).then(userDetails => setUserDetails(userDetails))
    }, [username])

    return (
        <div>
            Userpage for {username}
            {JSON.stringify(userDetails)}
        </div>
    )
}